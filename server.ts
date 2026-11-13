import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to prevent crash if GEMINI_API_KEY is not set immediately at module load
let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "") {
    throw new Error("La clé API 'GEMINI_API_KEY' n'est pas configurée dans les secrets de l'application.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
    });
  }
  return aiClient;
}

function isApiKeyError(error: any): boolean {
  if (!error) return false;
  let errorStr = "";
  try {
    errorStr = (typeof error === "string" ? error : (error.message || JSON.stringify(error) || "")).toLowerCase();
  } catch {
    errorStr = String(error).toLowerCase();
  }
  return (
    errorStr.includes("api key") || 
    errorStr.includes("api_key") ||
    errorStr.includes("invalid_argument") ||
    errorStr.includes("unauthorized") ||
    errorStr.includes("forbidden") ||
    errorStr.includes("unauthorized_client") ||
    errorStr.includes("key is invalid") ||
    errorStr.includes("invalid_key") ||
    errorStr.includes("key not valid") ||
    errorStr.includes("api_key_invalid") ||
    errorStr.includes("not configured") ||
    errorStr.includes("n'est pas configurée") ||
    errorStr.includes("quota") ||
    errorStr.includes("insufficient_quota") ||
    errorStr.includes("billing") ||
    errorStr.includes("exceeded your current quota") ||
    errorStr.includes("resource_exhausted") ||
    errorStr.includes("credit") ||
    errorStr.includes("solde") ||
    errorStr.includes("payment") ||
    errorStr.includes("plan and billing")
  );
}

// Clean single-line error formatter that prevents multi-line JSON dump in stdout/stderr
function formatErrorSummary(err: any): string {
  if (!err) return "Détail non spécifié";
  try {
    const raw = typeof err === "string" ? err : (err.message || JSON.stringify(err) || String(err));
    if (raw.includes("{")) {
      try {
        const parsed = JSON.parse(raw);
        const msg = parsed?.error?.message || parsed?.message || parsed?.error?.code || parsed?.error;
        if (msg) return String(msg).replace(/[\r\n\t]+/g, " ").trim().slice(0, 120);
      } catch {
        const match = raw.match(/"message"\s*:\s*"([^"]+)"/);
        if (match && match[1]) return match[1].slice(0, 120);
      }
    }
    return String(raw).replace(/[\r\n\t]+/g, " ").trim().slice(0, 120);
  } catch {
    return "Erreur d'exécution";
  }
}

// Multi-tier model cascade for high demand, ultra-low latency and 503 resilience
const GEMINI_TEXT_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash"
];

async function generateWithGemini(
  ai: GoogleGenAI,
  request: {
    contents: string;
    config?: any;
  },
  preferredModel?: string
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;
  const modelsToTry = preferredModel 
    ? (GEMINI_TEXT_MODELS.includes(preferredModel) 
        ? [preferredModel, ...GEMINI_TEXT_MODELS.filter(m => m !== preferredModel)] 
        : [preferredModel, ...GEMINI_TEXT_MODELS])
    : GEMINI_TEXT_MODELS;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const timeoutPromise = new Promise<{ text: string; modelUsed: string }>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout réponse")), 25000)
        );

        const apiPromise = ai.models.generateContent({
          model,
          contents: request.contents,
          config: request.config,
        }).then(response => {
          if (response && response.text) {
            return { text: response.text, modelUsed: model };
          }
          throw new Error("Réponse vide");
        });

        const result = await Promise.race([apiPromise, timeoutPromise]);
        return result;
      } catch (err: any) {
        lastError = err;

        // If API key is rejected or quota/billing limit reached, fail fast immediately
        if (isApiKeyError(err)) {
          throw err;
        }

        const msg = String(err?.message || JSON.stringify(err) || "").toLowerCase();
        const isTransient =
          msg.includes("timeout") ||
          msg.includes("503") ||
          msg.includes("high demand") ||
          msg.includes("unavailable") ||
          msg.includes("overloaded") ||
          msg.includes("spikes in demand");

        if (isTransient) {
          console.warn(`[IADÉBAT SERVER] Modèle ${model} lent ou temporairement indisponible (essai ${attempt + 1}/2).`);
          // Bascule rapide sans long délai
          await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
          continue;
        }

        // Try next model in cascade immediately
        break;
      }
    }
  }

  throw lastError;
}

// File path for durable JSON archive storage
const ARCHIVES_FILE = path.join(process.cwd(), "archives.json");

function loadArchives(): any[] {
  try {
    if (fs.existsSync(ARCHIVES_FILE)) {
      const data = fs.readFileSync(ARCHIVES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.log("Lecture des archives locales indisponible.");
  }
  return [];
}

function saveArchives(archives: any[]) {
  try {
    fs.writeFileSync(ARCHIVES_FILE, JSON.stringify(archives, null, 2), "utf-8");
  } catch (e) {
    console.log("Sauvegarde des archives locales indisponible.");
  }
}

// --- API ROUTES ---

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Get all archives
app.get("/api/archives", (req, res) => {
  const list = loadArchives();
  res.json(list);
});

// Save new archive
app.post("/api/archives", (req, res) => {
  const record = req.body;
  if (!record || !record.key) {
    return res.status(400).json({ error: "Enregistrement non valide ou sans clé unique." });
  }
  const current = loadArchives();
  // Avoid duplicate key
  const filtered = current.filter(item => item.key !== record.key);
  filtered.unshift(record); // Add to the top
  saveArchives(filtered);
  res.json({ success: true, record });
});

// Delete an archive
app.delete("/api/archives/:key", (req, res) => {
  const { key } = req.params;
  const current = loadArchives();
  const next = current.filter(item => item.key !== key);
  saveArchives(next);
  res.json({ success: true });
});

// File path for durable shared debate links
const SHARES_FILE = path.join(process.cwd(), "shares.json");

function loadShares(): Record<string, any> {
  try {
    if (fs.existsSync(SHARES_FILE)) {
      const data = fs.readFileSync(SHARES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.log("Lecture des partages locaux indisponible.");
  }
  return {};
}

function saveShares(shares: Record<string, any>) {
  try {
    fs.writeFileSync(SHARES_FILE, JSON.stringify(shares, null, 2), "utf-8");
  } catch (e) {
    console.log("Sauvegarde des partages locaux indisponible.");
  }
}

// Create or update a shareable link for a debate result
app.post("/api/share", (req, res) => {
  const debateData = req.body;
  if (!debateData || !debateData.topic) {
    return res.status(400).json({ error: "Données de débat incomplètes pour le partage." });
  }

  const shares = loadShares();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const shareId = debateData.id || `debat-${Date.now().toString(36)}-${randomSuffix}`;

  const shareRecord = {
    id: shareId,
    sharedAt: new Date().toISOString(),
    topic: debateData.topic,
    messages: debateData.messages || [],
    verdict: debateData.verdict || null,
    summary: debateData.summary || null,
    treaty: debateData.treaty || null,
    claps: debateData.claps || 0,
    activeAgents: debateData.activeAgents || []
  };

  shares[shareId] = shareRecord;
  saveShares(shares);

  res.json({
    success: true,
    shareId,
    shareRecord
  });
});

// Retrieve a shared debate by ID
app.get("/api/share/:id", (req, res) => {
  const { id } = req.params;
  const shares = loadShares();
  const record = shares[id];

  if (!record) {
    // Check in archives if key or id matches as fallback
    const archives = loadArchives();
    const fromArchive = archives.find((a: any) => a.key === id || a.id === id);
    if (fromArchive) {
      return res.json({
        success: true,
        shareId: id,
        shareRecord: fromArchive
      });
    }
    return res.status(404).json({ error: "Ce résultat de débat partagé est introuvable ou a été archivé." });
  }

  res.json({
    success: true,
    shareId: id,
    shareRecord: record
  });
});

// File path for durable Alphabette unified accounts storage
const ALPHABETTE_ACCOUNTS_FILE = path.join(process.cwd(), "alphabette_accounts.json");

function loadAlphabetteAccounts(): any[] {
  try {
    if (fs.existsSync(ALPHABETTE_ACCOUNTS_FILE)) {
      const data = fs.readFileSync(ALPHABETTE_ACCOUNTS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.log("Lecture des comptes Alphabette indisponible.");
  }
  return [];
}

function saveAlphabetteAccounts(accounts: any[]) {
  try {
    fs.writeFileSync(ALPHABETTE_ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), "utf-8");
  } catch (e) {
    console.log("Sauvegarde des comptes Alphabette indisponible.");
  }
}

// Configuration Mistral AI standardisée Alphabette
const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.mistral.ai/v1";
const AI_API_KEY = process.env.AI_API_KEY || process.env.MISTRAL_API_KEY || "";
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || "mistral-large-latest";

// Master prompt officiel de l'écosystème Alphabette
const ALPHABETTE_MASTER_PROMPT_TEXT = `# INSTRUCTIONS SYSTÈME — ÉCOSYSTÈME LOGICIEL ALPHABETTE

## 1. Contexte & Identité
Tu agis en tant qu'assistant de conception, d'ingénierie et de développement pour les applications de l'écosystème Alphabette. 
Chaque application de la suite fonctionne comme une brique autonome mais interconnectée, conçue pour valoriser l'ensemble du catalogue et diriger les utilisateurs vers le hub central : http://alphabette.fr.

## 2. Souveraineté & Engagement RGPD (Mistral AI Exclusif)
Toutes les applications de la suite Alphabette reposent rigoureusement et exclusivement sur la technologie Mistral AI :
* Conformité RGPD native : Mistral AI étant une entreprise française hébergeant ses infrastructures en Europe, les données traitées ne quittent pas le cadre juridique de l'Union européenne.
* Confidentialité absolue : Les modèles commerciaux de Mistral garantissent que les requêtes et données de nos utilisateurs ne sont jamais réutilisées pour l'entraînement public des modèles.
* Argument commercial : Mets en avant cette souveraineté européenne et la protection des données professionnelles dans toutes les communications et interfaces de configuration.
* Environnements : Développement local sous Mac (Ollama / Metal) et production via l'API Cloud officielle de Mistral (https://api.mistral.ai/v1). Ne suggérer aucun autre fournisseur d'IA.

## 3. Architecture Technique & Clés API
Toute application doit implémenter une logique d'accès IA à trois niveaux :
1. Période d'essai (7 jours offerts) : Tout nouvel inscrit bénéficie d'un accès complet et immédiat à l'application, alimenté par la clé API Mistral propriétaire fournie par Alphabette.
2. Mode BYOK (Bring Your Own Key) : Une interface dédiée permet à l'utilisateur de renseigner sa propre clé API Mistral pour consommer son quota personnel.
3. Mode managé (Clé Alphabette) : L'utilisateur souscrit à l'offre incluant nos clés pour ne pas avoir à créer de compte développeur chez Mistral.
* Standardisation du code : Les appels API doivent systématiquement s'appuyer sur des variables d'environnement (AI_BASE_URL, AI_API_KEY, MISTRAL_MODEL) pour basculer facilement entre la clé utilisateur, la clé Alphabette ou l'environnement de test local.

## 4. Grille Tarifaire Officielle (Abonnements Annuels)
* Une application : 15 € TTC / an (7 jours d'essai).
* Toutes les applications Alphabette : 40 € TTC / an.
* Le paiement en ligne n'est pas encore ouvert : aujourd'hui, l'application s'utilise librement. Ne jamais annoncer d'autre prix ni simuler un paiement.

## 5. Maillage Inter-Applications & Rôle du Hub (http://alphabette.fr)
* Pied de page obligatoire : Découvrir toutes les applications de la suite sur http://alphabette.fr
* Stratégie de cross-selling : Rappeler le tarif « toutes les applications » (40 € par an).
* Synergie des données standardisées.`;

// Save / Sync Alphabette Account
app.post("/api/alphabette/account", (req, res) => {
  const account = req.body;
  if (!account || !account.alphabetteId || !account.email) {
    return res.status(400).json({ error: "Données de compte Alphabette incomplètes." });
  }
  const accounts = loadAlphabetteAccounts();
  const existingIdx = accounts.findIndex(
    (a: any) => a.alphabetteId === account.alphabetteId || a.email.toLowerCase() === account.email.toLowerCase()
  );
  if (existingIdx >= 0) {
    accounts[existingIdx] = { ...accounts[existingIdx], ...account, updatedAt: new Date().toISOString() };
  } else {
    accounts.unshift({ ...account, updatedAt: new Date().toISOString() });
  }
  saveAlphabetteAccounts(accounts);
  res.json({ success: true, account });
});

// Get Alphabette Account by ID or Email
app.get("/api/alphabette/account/:identifier", (req, res) => {
  const { identifier } = req.params;
  const accounts = loadAlphabetteAccounts();
  const clean = identifier.toLowerCase().trim();
  const found = accounts.find((a: any) => 
    a.alphabetteId.toLowerCase() === clean || a.email.toLowerCase() === clean
  );
  if (!found) {
    return res.status(404).json({ error: "Compte introuvable." });
  }
  res.json({ success: true, account: found });
});

// Get Master Prompt
app.get("/api/alphabette/master-prompt", (req, res) => {
  res.json({ success: true, prompt: ALPHABETTE_MASTER_PROMPT_TEXT });
});

// --- IA : UNIQUEMENT AVEC LES CLÉS DU VISITEUR (AUCUNE RÉPONSE INVENTÉE) ---
// Honnêteté : il n'existe plus de « moteur local » qui fabriquait de fausses
// répliques, de faux verdicts ou de fausses synthèses quand aucune clé n'était
// renseignée. Sans clé, l'appli le dit clairement.

const MESSAGE_SANS_CLE =
  "Ajoutez votre clé dans Clé API (bouton « Clés API » en haut de la page) : sans clé, aucune IA ne peut répondre.";

type IdOrateur = "chatgpt" | "claude" | "gemini" | "deepseek" | "mistral" | "grok";

const CLES_IA: Record<IdOrateur, { entete: string; modele: string; defaut: string; nom: string; fournisseur: string }> = {
  mistral: { entete: "x-mistral-api-key", modele: "x-mistral-model", defaut: "mistral-large-latest", nom: "Mistral", fournisseur: "mistral" },
  gemini: { entete: "x-gemini-api-key", modele: "x-gemini-model", defaut: "gemini-3.1-flash-lite", nom: "Gemini", fournisseur: "gemini" },
  claude: { entete: "x-anthropic-api-key", modele: "x-anthropic-model", defaut: "claude-haiku-5-5", nom: "Claude", fournisseur: "anthropic" },
  chatgpt: { entete: "x-openai-api-key", modele: "x-openai-model", defaut: "gpt-6-luna", nom: "ChatGPT", fournisseur: "openai" },
  deepseek: { entete: "x-deepseek-api-key", modele: "x-deepseek-model", defaut: "deepseek-chat", nom: "DeepSeek", fournisseur: "deepseek" },
  grok: { entete: "x-grok-api-key", modele: "x-grok-model", defaut: "grok-4.3", nom: "Grok", fournisseur: "grok" },
};

// Quand l'orateur n'a pas de clé, une autre IA dont la clé est enregistrée écrit
// à sa place (la réplique l'indique). Mistral d'abord : IA souveraine (règle nº 5).
const ORDRE_RELAIS: IdOrateur[] = ["mistral", "gemini", "claude", "chatgpt", "deepseek", "grok"];

function lireEntete(headers: any, nom: string): string {
  const v = headers?.[nom];
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return String(v[0] || "").trim();
  return "";
}

function cleDe(headers: any, id: IdOrateur): string {
  const cle = lireEntete(headers, CLES_IA[id].entete);
  if (cle) return cle;
  // Version avec serveur (AI Studio) : clé Gemini du serveur. Vide en version statique.
  if (id === "gemini") return String(process.env.GEMINI_API_KEY || "").trim();
  return "";
}

const COMPATIBLES_OPENAI: Partial<Record<IdOrateur, string>> = {
  deepseek: "https://api.deepseek.com/chat/completions",
  mistral: "https://api.mistral.ai/v1/chat/completions",
  grok: "https://api.x.ai/v1/chat/completions",
};

async function appelerIA(
  id: IdOrateur,
  cle: string,
  modele: string,
  systeme: string,
  prompt: string,
  maxTokens: number,
  temperature: number
): Promise<{ text: string; modelUsed: string }> {
  const nom = CLES_IA[id].nom;

  if (id === "gemini") {
    const r = await generateWithGemini(
      new GoogleGenAI({ apiKey: cle }),
      { contents: prompt, config: { systemInstruction: systeme, temperature, maxOutputTokens: maxTokens } },
      modele
    );
    return { text: r.text, modelUsed: r.modelUsed };
  }

  let url = "";
  let enTetes: Record<string, string> = { "Content-Type": "application/json" };
  let corps: any;

  if (id === "claude") {
    url = "https://api.anthropic.com/v1/messages";
    enTetes = { ...enTetes, "x-api-key": cle, "anthropic-version": "2023-06-01" };
    // Les modèles Claude récents réfléchissent avant d'écrire : marge suffisante, température par défaut.
    corps = { model: modele, max_tokens: Math.max(maxTokens, 1500), system: systeme, messages: [{ role: "user", content: prompt }] };
  } else if (id === "chatgpt") {
    url = "https://api.openai.com/v1/chat/completions";
    enTetes = { ...enTetes, Authorization: `Bearer ${cle}` };
    // Les modèles OpenAI récents refusent max_tokens et une température réglée.
    corps = {
      model: modele,
      max_completion_tokens: Math.max(maxTokens, 1500),
      messages: [{ role: "system", content: systeme }, { role: "user", content: prompt }],
    };
  } else {
    url = COMPATIBLES_OPENAI[id]!;
    enTetes = { ...enTetes, Authorization: `Bearer ${cle}` };
    corps = {
      model: modele,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: "system", content: systeme }, { role: "user", content: prompt }],
    };
  }

  const reponse = await fetch(url, { method: "POST", signal: AbortSignal.timeout(30000), headers: enTetes, body: JSON.stringify(corps) });
  if (!reponse.ok) {
    throw new Error(`${nom} a refusé la demande (${reponse.status}) : ${formatErrorSummary(await reponse.text())}`);
  }
  const data = await reponse.json();
  const texte =
    id === "claude"
      ? (Array.isArray(data?.content) ? data.content.find((b: any) => b?.type === "text" && b.text)?.text : "") || ""
      : data?.choices?.[0]?.message?.content || "";
  return { text: String(texte), modelUsed: modele };
}

interface TexteEcrit {
  text: string;
  provider: string;
  modelUsed: string;
  /** « Mistral · mistral-large-latest » : l'IA qui a vraiment écrit. */
  ecritPar: string;
  notice?: string;
}

/** Fait écrire une IA : celle demandée si sa clé existe, sinon une autre clé enregistrée. */
async function ecrireAvecLesCles(
  headers: any,
  systeme: string,
  prompt: string,
  options: { maxTokens: number; temperature?: number; prefere?: IdOrateur }
): Promise<TexteEcrit> {
  const ordre = options.prefere ? [options.prefere, ...ORDRE_RELAIS.filter((i) => i !== options.prefere)] : ORDRE_RELAIS;
  const disponibles = ordre.filter((id) => cleDe(headers, id));
  if (disponibles.length === 0) {
    const e: any = new Error(MESSAGE_SANS_CLE);
    e.sansCle = true;
    throw e;
  }

  const echecs: string[] = [];
  for (const id of disponibles) {
    try {
      const modele = lireEntete(headers, CLES_IA[id].modele) || CLES_IA[id].defaut;
      const r = await appelerIA(id, cleDe(headers, id), modele, systeme, prompt, options.maxTokens, options.temperature ?? 0.85);
      if (r.text.trim()) {
        return {
          text: r.text,
          provider: CLES_IA[id].fournisseur,
          modelUsed: r.modelUsed,
          ecritPar: `${CLES_IA[id].nom} · ${r.modelUsed}`,
          notice: echecs.length ? `${echecs.join(" ; ")} — relais par ${CLES_IA[id].nom}` : undefined,
        };
      }
      echecs.push(`${CLES_IA[id].nom} : réponse vide`);
    } catch (err: any) {
      console.warn(`[IADÉBAT] ${CLES_IA[id].nom} indisponible : ${formatErrorSummary(err)}`);
      echecs.push(`${CLES_IA[id].nom} : ${formatErrorSummary(err)}`);
    }
  }
  throw new Error(`Aucune de vos clés n'a répondu (${echecs.join(" ; ")}). Vérifiez-les dans Clé API (clé valide, crédit disponible).`);
}

function repondreErreurIA(res: any, err: any) {
  return res.status(err?.sansCle ? 400 : 502).json({ error: err?.message || "L'IA n'a pas répondu.", sansCle: Boolean(err?.sansCle) });
}

/** Extrait l'objet ou le tableau JSON d'une réponse d'IA (avec ou sans balises ```json). */
function lireJsonIA(texte: string, ouvrant: "{" | "["): any {
  let t = String(texte || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const fermant = ouvrant === "{" ? "}" : "]";
  const debut = t.indexOf(ouvrant);
  const fin = t.lastIndexOf(fermant);
  if (debut !== -1 && fin > debut) t = t.slice(debut, fin + 1);
  try {
    return JSON.parse(t);
  } catch {
    throw new Error("L'IA a répondu dans un format illisible : réessayez.");
  }
}

function identifyAgent(systemPrompt: string): IdOrateur {
  const promptLower = String(systemPrompt || "").toLowerCase();
  if (promptLower.includes("chatgpt")) return "chatgpt";
  if (promptLower.includes("claude")) return "claude";
  if (promptLower.includes("gemini")) return "gemini";
  if (promptLower.includes("deepseek")) return "deepseek";
  if (promptLower.includes("mistral")) return "mistral";
  if (promptLower.includes("grok")) return "grok";
  return "chatgpt";
}

// --- API IMPLEMENTATIONS ---

// Sujets de débat proposés par l'IA (clé du visiteur)
app.post("/api/debate/suggest-topics", async (req, res) => {
  const { keyword } = req.body;
  const prompt = `Génère 3 thèmes de débat stimulants, philosophiques et futuristes en rapport avec : "${keyword || "futurisme"}".
Chaque thème doit comporter :
- Une catégorie pertinente en majuscules (ex: BIOLOGIE & ÉTHIQUE, Espace & Pouvoir, etc.)
- Un titre accrocheur sous forme de question (ex: "Faut-il légiférer sur les rêves artificiels ?")
- Une description analytique de la problématique en deux phrases limpides.

Le retour doit être un tableau JSON valide. Ne renvoie AUCUN texte introductif ou explicatif, uniquement le JSON. Format exact :
[
  {
    "category": "CATEGORIE",
    "title": "Titre du débat ?",
    "description": "Description du débat..."
  }
]`;
  try {
    const r = await ecrireAvecLesCles(req.headers, "Tu proposes des sujets de débat en français et tu réponds uniquement en JSON.", prompt, {
      maxTokens: 900,
      temperature: 0.8,
    });
    const liste = lireJsonIA(r.text, "[");
    if (!Array.isArray(liste)) throw new Error("L'IA a répondu dans un format illisible : réessayez.");
    return res.json(liste);
  } catch (error: any) {
    return repondreErreurIA(res, error);
  }
});

// Test API Key and its assigned model directly
app.post("/api/debate/test-key", async (req, res) => {
  const { provider, model, key } = req.body;
  const startTime = Date.now();

  try {
    if (!key || typeof key !== "string" || !key.trim()) {
      return res.status(400).json({ success: false, error: "Clé API absente ou invalide." });
    }

    const cleanKey = key.trim();

    if (provider === "chatgpt") {
      const modelToUse = model || "gpt-6-luna";
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(6000),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
          model: modelToUse,
          max_completion_tokens: 300,
          messages: [{ role: "user", content: "Réponds simplement 'Test réussi'." }]
        })
      });
      const latency = Date.now() - startTime;
      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim() || "OK";
        return res.json({ success: true, provider, modelUsed: modelToUse, latencyMs: latency, reply });
      } else {
        const errText = await response.text();
        return res.json({ success: false, provider, modelUsed: modelToUse, error: `Erreur OpenAI (${response.status}): ${formatErrorSummary(errText)}` });
      }
    }

    if (provider === "claude") {
      const modelToUse = model || "claude-haiku-5-5";
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: AbortSignal.timeout(6000),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": cleanKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: modelToUse,
          max_tokens: 300,
          messages: [{ role: "user", content: "Réponds simplement 'Test réussi'." }]
        })
      });
      const latency = Date.now() - startTime;
      if (response.ok) {
        const data = await response.json();
        const reply = (Array.isArray(data?.content) ? data.content.find((b: any) => b?.type === "text")?.text : "")?.trim() || "OK";
        return res.json({ success: true, provider, modelUsed: modelToUse, latencyMs: latency, reply });
      } else {
        const errText = await response.text();
        return res.json({ success: false, provider, modelUsed: modelToUse, error: `Erreur Anthropic (${response.status}): ${formatErrorSummary(errText)}` });
      }
    }

    if (provider === "gemini") {
      const modelToUse = model || "gemini-3.1-flash-lite";
      const ai = new GoogleGenAI({ apiKey: cleanKey });
      const resp = await ai.models.generateContent({
        model: modelToUse,
        contents: "Réponds simplement 'Test réussi'."
      });
      const latency = Date.now() - startTime;
      return res.json({ success: true, provider, modelUsed: modelToUse, latencyMs: latency, reply: resp?.text?.trim() || "OK" });
    }

    if (provider === "deepseek") {
      const modelToUse = model || "deepseek-chat";
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(6000),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
          model: modelToUse,
          max_tokens: 15,
          messages: [{ role: "user", content: "Réponds simplement 'Test réussi'." }]
        })
      });
      const latency = Date.now() - startTime;
      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim() || "OK";
        return res.json({ success: true, provider, modelUsed: modelToUse, latencyMs: latency, reply });
      } else {
        const errText = await response.text();
        return res.json({ success: false, provider, modelUsed: modelToUse, error: `Erreur DeepSeek (${response.status}): ${formatErrorSummary(errText)}` });
      }
    }

    if (provider === "mistral") {
      const modelToUse = model || "mistral-large-latest";
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(6000),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
          model: modelToUse,
          max_tokens: 15,
          messages: [{ role: "user", content: "Réponds simplement 'Test réussi'." }]
        })
      });
      const latency = Date.now() - startTime;
      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim() || "OK";
        return res.json({ success: true, provider, modelUsed: modelToUse, latencyMs: latency, reply });
      } else {
        const errText = await response.text();
        return res.json({ success: false, provider, modelUsed: modelToUse, error: `Erreur Mistral (${response.status}): ${formatErrorSummary(errText)}` });
      }
    }

    if (provider === "grok") {
      const modelToUse = model || "grok-4.3";
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(6000),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
          model: modelToUse,
          max_tokens: 15,
          messages: [{ role: "user", content: "Réponds simplement 'Test réussi'." }]
        })
      });
      const latency = Date.now() - startTime;
      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim() || "OK";
        return res.json({ success: true, provider, modelUsed: modelToUse, latencyMs: latency, reply });
      } else {
        const errText = await response.text();
        return res.json({ success: false, provider, modelUsed: modelToUse, error: `Erreur Grok (${response.status}): ${formatErrorSummary(errText)}` });
      }
    }

    return res.status(400).json({ success: false, error: "Fournisseur non reconnu." });
  } catch (err: any) {
    return res.json({ success: false, provider, error: formatErrorSummary(err) });
  }
});

app.post("/api/debate/generate", async (req, res) => {
  const { systemPrompt, topicTitle, topicDescription, context, agentId, speed } = req.body;
  const isJury = typeof topicTitle === "string" && topicTitle.startsWith("JURY");
  const idDemande = String(agentId || "");
  const resolvedAgentId: IdOrateur = (idDemande in CLES_IA ? idDemande : identifyAgent(systemPrompt)) as IdOrateur;
  const isTurbo = speed !== "slow";

  // Le jury reçoit directement sa consigne complète (réponse attendue en JSON).
  const prompt = isJury && context
    ? String(context)
    : `Tu débats sur la problématique centrale suivante :
"${topicTitle}"

Contexte & Éléments de réflexion :
${topicDescription}

Contexte du débat actuel (réponses précédentes) :
${context ? context : "Le débat commence, tu ouvres la discussion."}

Consignes de liberté, de rapidité et d'impact :
- LIBERTÉ TOTALE D'OPINION : Tu disposes d'une liberté intellectuelle et dialectique absolue. Aucun point de vue, parti-pris, thèse ou conclusion ne t'est suggéré ni imposé. Tu es entièrement souverain pour adopter la posture de ton choix (favorable, opposée, sceptique, alternative ou médiane) selon ta propre analyse.
- Sois vif, direct et percutant.
- Limite impérativement ta tirade à 2 paragraphes concis (environ 70 à 110 mots au total).
- Ne commence JAMAIS par une formule de politesse ("Bonjour", "Je prends la parole", etc.). Entre immédiatement dans le vif de ton argument.
- N'utilise aucune liste à puces. Rédige des phrases claires et incisives.
- Tiens-toi strictement à ton rôle défini ci-dessous.`;

  try {
    const r = await ecrireAvecLesCles(req.headers, String(systemPrompt || ""), prompt, {
      maxTokens: isJury ? 1500 : isTurbo ? 350 : 700,
      temperature: isJury ? 0.4 : 0.85,
      prefere: resolvedAgentId,
    });
    return res.json({ text: r.text, provider: r.provider, modelUsed: r.modelUsed, ecritPar: r.ecritPar, notice: r.notice });
  } catch (error: any) {
    return repondreErreurIA(res, error);
  }
});

// Synthèse du débat (écrite par l'une des IA dont la clé est enregistrée)
app.post("/api/debate/summary", async (req, res) => {
  const { topicTitle, topicDescription, messages } = req.body;

  if (!messages || messages.length === 0) {
    return res.json({ text: "Le débat s'est clos sans aucune contribution." });
  }

  const transcript = messages.map((m: any) => `[${m.agentName} — ${m.agentRole}]\n${m.content}`).join("\n\n---\n\n");
  const systemPrompt = `Tu es un analyste expert de haut niveau en géopolitique, technologie et philosophie morale. Tu es spécialisé dans la production de synthèses transversales éclairantes. Ton ton est neutre, profond, inspirant et universel. Tu rédiges en français parfait avec une belle qualité de style littéraire. Ne mets pas de titres aux paragraphes.`;

  const prompt = `Voici la transcription d'une table ronde d'intelligences artificielles sur le sujet :
"${topicTitle}" (${topicDescription})

Transcription des contributions :
${transcript}

Rédige une superbe synthèse de ce débat, structurée de manière fluide en exactement 4 paragraphes rédigés (PAS de listes à puces, pas d'énumérations, pas de titres de paragraphes), répondant aux dimensions suivantes :
1. Les principaux thèmes abordés et les lignes de force de la confrontation d'idées.
2. Les zones de convergence inattendues, là où les logiques analytiques et morales se rejoignent.
3. Les verrous, tensions et points de friction profonds qui subsistent.
4. Les enseignements constructifs et perspectives positives d'avenir pour guider l'action humaine.

A la toute fin de ton texte, ajoute un saut de ligne puis ajoute une phrase unique en gras (entourée de doubles astérisques, ex: **Pour éclairer l'avenir, l'humanité devra marier la rigueur scientifique à la boussole éthique.**) résumant de façon mémorable et philosophique l'essence même de ce débat.`;

  try {
    const r = await ecrireAvecLesCles(req.headers, systemPrompt, prompt, { maxTokens: 2000, temperature: 0.75 });
    return res.json({ text: r.text, provider: r.provider, modelUsed: r.modelUsed, ecritPar: r.ecritPar });
  } catch (error: any) {
    return repondreErreurIA(res, error);
  }
});

// Analyse de la logique d'une réplique (avis d'une IA, pas une vérification des faits)
app.post("/api/debate/analyze-fallacy", async (req, res) => {
  const { content, agentName, topicTitle } = req.body;
  const prompt = `Tu es un arbitre de la logique argumentative.
Analyse la plaidoirie suivante prononcée par ${agentName} dans le cadre du débat : "${topicTitle}".
Texte : "${content}"

Tu n'as accès à aucune source : n'affirme pas avoir vérifié des faits, juge seulement la solidité du raisonnement.
Réponds STRICTEMENT sous format JSON valide avec la structure exacte suivante :
{
  "logicScore": 85,
  "rhetoricalStyle": "Dialectique pragmatique",
  "factCheckStatus": "Raisonnement solide | Raisonnement fragile | Raisonnement fautif",
  "fallacies": [
    { "name": "Nom du sophisme ou biais (ex: Pente glissante, Homme de paille, Appel à l'émotion, Faux dilemme)", "explanation": "Explication brève en 1 phrase", "severity": "Faible | Modéré | Élevé" }
  ],
  "strengths": [
    "Point fort 1",
    "Point fort 2"
  ],
  "verdictQuote": "Une phrase d'évaluation percutante par l'arbitre."
}`;
  try {
    const r = await ecrireAvecLesCles(req.headers, "Tu es un arbitre de la logique argumentative. Tu réponds uniquement en JSON.", prompt, {
      maxTokens: 900,
      temperature: 0.3,
    });
    return res.json({ ...lireJsonIA(r.text, "{"), ecritPar: r.ecritPar });
  } catch (error: any) {
    return repondreErreurIA(res, error);
  }
});

// Traité de consensus (texte imaginaire écrit par l'IA, sans valeur juridique)
app.post("/api/debate/treaty", async (req, res) => {
  const { topicTitle, messages } = req.body;
  const transcript = (messages || []).map((m: any) => `[${m.agentName}]: ${m.content}`).join("\n\n");

  const prompt = `Tu es le Grand Chancelier Diplomatique d'une conférence imaginaire des intelligences artificielles.
À l'issue de ce débat sur le sujet : "${topicTitle}", rédige un « Traité de consensus » (texte symbolique, sans valeur juridique).
Ce traité doit fusionner les meilleures contributions de chaque participant à partir de la transcription ci-dessous.

Transcription du débat :
${transcript}

Réponds STRICTEMENT sous format JSON valide suivant :
{
  "treatyTitle": "Nom solennel du traité",
  "preamble": "Préambule solennel en 2-3 phrases.",
  "articles": [
    { "number": 1, "title": "Titre de l'Article 1", "clause": "Texte formel et équilibré de la clause d'action." },
    { "number": 2, "title": "Titre de l'Article 2", "clause": "Texte formel de la clause." },
    { "number": 3, "title": "Titre de l'Article 3", "clause": "Texte formel de la clause." },
    { "number": 4, "title": "Titre de l'Article 4", "clause": "Texte formel de la clause." },
    { "number": 5, "title": "Titre de l'Article 5", "clause": "Texte formel de la clause." }
  ],
  "concludingSeal": "Phrase mémorable de conclusion."
}`;
  try {
    const r = await ecrireAvecLesCles(req.headers, "Tu rédiges des textes symboliques en français et tu réponds uniquement en JSON.", prompt, {
      maxTokens: 2000,
      temperature: 0.6,
    });
    return res.json({ ...lireJsonIA(r.text, "{"), ecritPar: r.ecritPar });
  } catch (error: any) {
    return repondreErreurIA(res, error);
  }
});

// Coups de théâtre : scénarios IMAGINAIRES pour relancer le débat (jamais de fausse actualité)
app.post("/api/debate/breaking-news", async (req, res) => {
  const { topicTitle } = req.body;
  const prompt = `Pour le débat : "${topicTitle}", invente 3 « coups de théâtre » : des scénarios clairement imaginaires (de la fiction, pas de vraies actualités) capables de bousculer les certitudes des débatteurs et de relancer la confrontation.
N'attribue aucune déclaration, décision ni action à une personne, une entreprise, un pays ou une institution réels.

Réponds STRICTEMENT sous format JSON valide :
[
  {
    "category": "SCÉNARIO SCIENTIFIQUE | SCÉNARIO POLITIQUE | DILEMME ÉTHIQUE | SCÉNARIO SOCIAL",
    "headline": "Titre du scénario en 1 ligne",
    "description": "Description du scénario imaginaire en 2 phrases.",
    "urgentQuestion": "La question posée aux débatteurs."
  }
]`;
  try {
    const r = await ecrireAvecLesCles(req.headers, "Tu écris des scénarios de fiction en français et tu réponds uniquement en JSON.", prompt, {
      maxTokens: 1200,
      temperature: 0.85,
    });
    const liste = lireJsonIA(r.text, "[");
    if (!Array.isArray(liste)) throw new Error("L'IA a répondu dans un format illisible : réessayez.");
    return res.json(liste.map((item: any) => ({ ...item, ecritPar: r.ecritPar })));
  } catch (error: any) {
    return repondreErreurIA(res, error);
  }
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[IADÉBAT SERVER] Serveur démarré sur http://localhost:${PORT}`);
  });
}

startServer();

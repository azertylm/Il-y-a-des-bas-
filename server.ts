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

// Appel Gemini sur UN modèle (le choix automatique du modèle est fait par appelerIA).
// Deux essais rapides si Google est momentanément saturé.
async function generateWithGemini(
  ai: GoogleGenAI,
  request: { contents: string; config?: any },
  model: string
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout réponse")), 25000));
      const response: any = await Promise.race([
        ai.models.generateContent({ model, contents: request.contents, config: request.config }),
        timeoutPromise,
      ]);
      if (response && response.text) return { text: response.text, modelUsed: model };
      throw new Error("Réponse vide");
    } catch (err: any) {
      lastError = err;
      if (isApiKeyError(err)) throw err;
      const msg = String(err?.message || JSON.stringify(err) || "").toLowerCase();
      const isTransient = /timeout|503|high demand|unavailable|overloaded|spikes in demand/.test(msg);
      if (!isTransient) break;
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
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
  "Ouvrez « Accès aux IA » (en haut de la page) : connectez-vous avec OpenRouter en 1 clic, ou ajoutez votre clé en Mode Expert.";

type IdOrateur = "chatgpt" | "claude" | "gemini" | "deepseek" | "mistral" | "llama";

const CLES_IA: Record<IdOrateur, { entete: string; nom: string; fournisseur: string }> = {
  mistral: { entete: "x-mistral-api-key", nom: "Mistral", fournisseur: "mistral" },
  gemini: { entete: "x-gemini-api-key", nom: "Gemini", fournisseur: "gemini" },
  claude: { entete: "x-anthropic-api-key", nom: "Claude", fournisseur: "anthropic" },
  chatgpt: { entete: "x-openai-api-key", nom: "ChatGPT", fournisseur: "openai" },
  deepseek: { entete: "x-deepseek-api-key", nom: "DeepSeek", fournisseur: "deepseek" },
  llama: { entete: "x-groq-api-key", nom: "Llama", fournisseur: "llama" },
};

// Quand l'orateur n'a pas de clé, une autre IA dont la clé est enregistrée écrit
// à sa place (la réplique l'indique). Mistral d'abord : IA souveraine (règle nº 5).
const ORDRE_RELAIS: IdOrateur[] = ["mistral", "gemini", "claude", "chatgpt", "deepseek", "llama"];

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
  llama: "https://api.groq.com/openai/v1/chat/completions", // Llama de Meta servi par Groq (clé gratuite)
};

// ─── Choix automatique du modèle ────────────────────────────────────────────
// L'utilisateur ne donne que sa clé. Les modèles changent souvent (anciens
// retirés, nouveaux sortis) : on essaie d'abord le dernier modèle qui a marché
// avec cette clé, puis des noms « stables » ; si le fournisseur répond « modèle
// introuvable », on lui demande la liste de ses modèles disponibles pour cette
// clé et on prend le plus récent adapté. Rien n'est à régler à la main.

const MODELES_DEPART: Record<IdOrateur, string[]> = {
  mistral: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest"],
  gemini: ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-2.5-flash"],
  claude: ["claude-haiku-5-5"],
  chatgpt: ["gpt-6-luna"],
  deepseek: ["deepseek-chat"],
  llama: ["llama-3.3-70b-versatile"],
};

const MEMO_MODELES = "iadebat_modeles_auto";
const modelesRetenus = new Map<string, string>();

function cleMemo(id: IdOrateur, cle: string): string {
  return `${id}:${cle.slice(-6)}`;
}

function modeleRetenu(id: IdOrateur, cle: string): string {
  const k = cleMemo(id, cle);
  if (modelesRetenus.has(k)) return modelesRetenus.get(k)!;
  try {
    const ls = (globalThis as any).localStorage;
    const m = ls ? JSON.parse(ls.getItem(MEMO_MODELES) || "{}")[k] : "";
    if (typeof m === "string" && m) modelesRetenus.set(k, m);
    return typeof m === "string" ? m : "";
  } catch {
    return "";
  }
}

function retenirModele(id: IdOrateur, cle: string, modele: string) {
  const k = cleMemo(id, cle);
  if (modelesRetenus.get(k) === modele) return;
  modelesRetenus.set(k, modele);
  try {
    const ls = (globalThis as any).localStorage;
    if (!ls) return;
    const tout = JSON.parse(ls.getItem(MEMO_MODELES) || "{}");
    tout[k] = modele;
    ls.setItem(MEMO_MODELES, JSON.stringify(tout));
  } catch {
    /* stockage indisponible : on garde en mémoire seulement */
  }
}

/** Le fournisseur dit-il que ce modèle n'existe pas / plus (ou n'est pas ouvert à cette clé) ? */
function modeleIntrouvable(statut: number, texte: string): boolean {
  const t = texte.toLowerCase();
  if (statut === 404) return true;
  if ((statut === 400 || statut === 403 || statut === 422) && /model/.test(t) && /(not.?found|not.?exist|does not exist|invalid|unknown|unsupported|not supported|no access|deprecated|retired|n'existe)/.test(t)) return true;
  return false;
}

function versionDe(nom: string): number[] {
  return (nom.match(/\d+(?:\.\d+)?/g) || []).map(Number);
}

function plusRecentDabord(a: { id: string; created?: number }, b: { id: string; created?: number }): number {
  if (a.created && b.created && a.created !== b.created) return b.created - a.created;
  const va = versionDe(a.id), vb = versionDe(b.id);
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const d = (vb[i] ?? -1) - (va[i] ?? -1);
    if (d) return d;
  }
  return a.id.localeCompare(b.id);
}

/** Classe les modèles : d'abord les gammes préférées (dans l'ordre), chacune du plus récent au plus ancien. */
function classer(modeles: { id: string; created?: number }[], gammes: RegExp[]): string[] {
  const tries = [...modeles].sort(plusRecentDabord);
  const rang = (id: string) => {
    const i = gammes.findIndex((g) => g.test(id));
    return i === -1 ? gammes.length : i;
  };
  return tries.sort((a, b) => rang(a.id) - rang(b.id)).map((m) => m.id);
}

/** Demande au fournisseur les modèles disponibles pour cette clé, du plus adapté au moins adapté. */
async function listerModeles(id: IdOrateur, cle: string): Promise<string[]> {
  const lire = async (url: string, enTetes: Record<string, string> = {}) => {
    const r = await fetch(url, { headers: enTetes, signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(`${CLES_IA[id].nom} : liste des modèles refusée (${r.status}) : ${formatErrorSummary(await r.text())}`);
    return r.json();
  };
  const bearer = { Authorization: `Bearer ${cle}` };
  const exclus = /(embed|tts|whisper|audio|realtime|transcri|image|dall-e|vision|moderation|search|instruct|ocr|codestral|devstral|video|imagine|computer|robotics|aqa|live|native-audio)/i;

  if (id === "gemini") {
    const d: any = await lire(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${encodeURIComponent(cle)}`);
    const liste = (d?.models || [])
      .filter((m: any) => (m?.supportedGenerationMethods || []).includes("generateContent"))
      .map((m: any) => ({ id: String(m.name || "").replace(/^models\//, "") }))
      .filter((m: any) => /^gemini/.test(m.id) && !exclus.test(m.id) && !/(exp|preview|thinking)/.test(m.id));
    return classer(liste, [/flash-latest$/, /flash-lite-latest$/, /flash(?!-lite)/, /flash-lite/, /pro/]);
  }
  if (id === "claude") {
    const d: any = await lire("https://api.anthropic.com/v1/models?limit=100", { "x-api-key": cle, "anthropic-version": "2023-06-01" });
    // Anthropic renvoie déjà la liste du plus récent au plus ancien : on garde cet ordre.
    const liste = (d?.data || []).map((m: any, i: number) => ({ id: String(m.id), created: 1e9 - i }));
    return classer(liste, [/haiku/, /sonnet/, /opus/]);
  }
  const adresses: Partial<Record<IdOrateur, string>> = {
    chatgpt: "https://api.openai.com/v1/models",
    mistral: "https://api.mistral.ai/v1/models",
    deepseek: "https://api.deepseek.com/models",
    llama: "https://api.groq.com/openai/v1/models",
  };
  const d: any = await lire(adresses[id]!, bearer);
  let liste: { id: string; created?: number }[] = (d?.data || [])
    .filter((m: any) => m?.id && (id !== "mistral" || m?.capabilities?.completion_chat !== false))
    .map((m: any) => ({ id: String(m.id), created: Number(m.created) || undefined }))
    .filter((m) => !exclus.test(m.id));
  if (id === "chatgpt") {
    liste = liste.filter((m) => /^(gpt|o\d|chatgpt)/.test(m.id) && !/(\d{4}-\d{2}-\d{2}|preview|oss|codex|nano)/.test(m.id));
    return classer(liste, [/mini/, /./]);
  }
  if (id === "mistral") return classer(liste, [/^mistral-large-latest$/, /^mistral-medium-latest$/, /-latest$/, /large/, /medium/, /small/]);
  if (id === "deepseek") return classer(liste, [/^deepseek-chat$/, /chat/, /./]);
  // Llama (Groq)
  liste = liste.filter((m) => /llama/i.test(m.id) && !/guard|prompt-guard/i.test(m.id));
  return classer(liste, [/llama-4-scout/i, /llama-3\.3-70b/i, /70b/i, /./]);
}

const MESSAGE_SOLDE_VIDE =
  "Clé valide, mais solde API à 0 € (des crédits prépayés sont requis sur la plateforme développeur, indépendamment d'un abonnement Plus/Pro).";

/** La clé est bonne mais le compte développeur n'a pas de crédit (OpenAI, Anthropic, DeepSeek, Mistral, Groq). */
function soldeVide(statut: number, texte: string): boolean {
  const t = texte.toLowerCase();
  return (
    (statut === 429 && t.includes("insufficient_quota")) ||
    (statut === 400 && t.includes("credit balance is too low")) ||
    (statut === 402 && /insufficient|balance|credit|payment/.test(t)) ||
    (statut === 403 && /credits?|spending limit|billing/.test(t))
  );
}

/** Surcharge momentanée du fournisseur : on essaie un autre modèle avant d'abandonner. */
function surcharge(statut: number, texte: string): boolean {
  return statut === 503 || statut === 529 || /high demand|overloaded|unavailable|spikes in demand/i.test(texte);
}

/** Erreur d'un fournisseur ; `modeleIntrouvable` indique qu'il faut essayer un autre modèle. */
class ErreurIA extends Error {
  modeleIntrouvable: boolean;
  constructor(message: string, modeleIntrouvable: boolean) {
    super(message);
    this.modeleIntrouvable = modeleIntrouvable;
  }
}

async function appelerAvecModele(
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
    try {
      return await generateWithGemini(
        new GoogleGenAI({ apiKey: cle }),
        { contents: prompt, config: { systemInstruction: systeme, temperature, maxOutputTokens: maxTokens } },
        modele
      );
    } catch (err: any) {
      const msg = String(err?.message || err || "");
      const statut = Number(err?.status || err?.code) || (/\b404\b|not[_ ]found/i.test(msg) ? 404 : /\b503\b/.test(msg) ? 503 : 0);
      if (soldeVide(statut, msg)) throw new ErreurIA(`${nom} : ${MESSAGE_SOLDE_VIDE}`, false);
      throw new ErreurIA(`${nom} : ${formatErrorSummary(err)}`, !isApiKeyError(err) && (modeleIntrouvable(statut, msg) || surcharge(statut, msg)));
    }
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
    const texte = await reponse.text();
    if (soldeVide(reponse.status, texte)) throw new ErreurIA(`${nom} : ${MESSAGE_SOLDE_VIDE}`, false);
    throw new ErreurIA(
      `${nom} a refusé la demande (${reponse.status}) : ${formatErrorSummary(texte)}`,
      modeleIntrouvable(reponse.status, texte) || surcharge(reponse.status, texte)
    );
  }
  const data = await reponse.json();
  const texte =
    id === "claude"
      ? (Array.isArray(data?.content) ? data.content.find((b: any) => b?.type === "text" && b.text)?.text : "") || ""
      : data?.choices?.[0]?.message?.content || "";
  return { text: String(texte), modelUsed: String(data?.model || modele) };
}

/** Fait répondre l'IA `id` avec la clé donnée, en choisissant le modèle tout seul. */
async function appelerIA(
  id: IdOrateur,
  cle: string,
  systeme: string,
  prompt: string,
  maxTokens: number,
  temperature: number
): Promise<{ text: string; modelUsed: string }> {
  const essayes = new Set<string>();
  let derniere: any = null;

  const essayer = async (modele: string) => {
    essayes.add(modele);
    const r = await appelerAvecModele(id, cle, modele, systeme, prompt, maxTokens, temperature);
    retenirModele(id, cle, modele);
    return r;
  };

  for (const modele of [modeleRetenu(id, cle), ...MODELES_DEPART[id]]) {
    if (!modele || essayes.has(modele)) continue;
    try {
      return await essayer(modele);
    } catch (err: any) {
      if (!(err instanceof ErreurIA) || !err.modeleIntrouvable) throw err;
      derniere = err;
    }
  }

  // Aucun nom connu ne marche : on demande au fournisseur ce qui est ouvert à cette clé.
  let disponibles: string[] = [];
  try {
    disponibles = await listerModeles(id, cle);
  } catch (err: any) {
    console.warn(`[IADÉBAT] ${formatErrorSummary(err)}`);
  }
  for (const modele of disponibles.filter((m) => !essayes.has(m)).slice(0, 4)) {
    try {
      return await essayer(modele);
    } catch (err: any) {
      if (!(err instanceof ErreurIA) || !err.modeleIntrouvable) throw err;
      derniere = err;
    }
  }
  throw derniere || new Error(`${CLES_IA[id].nom} : aucun modèle disponible pour cette clé.`);
}

// ─── OpenRouter : Mode Découverte (clé d'Alphabette, via le relais du site) et connexion 1 clic ───
// En-têtes envoyés par la page :
//   x-iadebat-openrouter-key     clé OpenRouter du visiteur (connexion 1 clic, gardée dans son navigateur)
//   x-iadebat-openrouter-gratuit « 1 » : seulement les modèles gratuits (« :free ») d'OpenRouter
//   x-iadebat-decouverte         « 1 » : le Mode Découverte du site est ouvert
//   x-iadebat-sujet              sujet du débat en cours (un « débat gratuit » = un sujet)

const OR_PREFIXES: Record<IdOrateur, string> = {
  chatgpt: "openai/", claude: "anthropic/", gemini: "google/", deepseek: "deepseek/", mistral: "mistralai/", llama: "meta-llama/",
};
const OR_GAMMES: Record<IdOrateur, RegExp[]> = {
  chatgpt: [/-mini/, /^openai\/gpt-[0-9.]+$/, /./],
  claude: [/haiku/, /sonnet/],
  gemini: [/flash(?!-lite)/, /flash-lite/, /./],
  deepseek: [/deepseek-chat/, /v[0-9]/, /./],
  mistral: [/mistral-small/, /mistral-medium/, /./],
  llama: [/llama-4-scout/, /llama-3\.3-70b/, /70b/, /./],
};
const OR_EXCLUS = /(:batch|:extended|:beta|:thinking|:online|omni|image|vision|audio|search|online|guard|embed|tts|realtime|preview|exp-|codex|oss|gemma|codestral|devstral|pixtral|distill|prover|nano|deep-research)/i;
const OR_PRIX_MAX_ENTREE = 0.000003;
const OR_PRIX_MAX_SORTIE = 0.000015;

let catalogueOR: { lu: number; modeles: { id: string; cree: number; entree: number; sortie: number }[] } | null = null;

async function catalogueOpenRouter() {
  if (catalogueOR && catalogueOR.lu > Date.now() - 6 * 3600_000) return catalogueOR.modeles;
  const r = await fetch("https://openrouter.ai/api/v1/models", { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`OpenRouter : liste des modèles indisponible (${r.status})`);
  const d: any = await r.json();
  const modeles = (d?.data || [])
    .filter((m: any) => m?.id && (m?.architecture?.output_modalities ?? ["text"]).includes("text"))
    .map((m: any) => ({ id: String(m.id), cree: Number(m.created) || 0, entree: Number(m?.pricing?.prompt ?? 1), sortie: Number(m?.pricing?.completion ?? 1) }));
  catalogueOR = { lu: Date.now(), modeles };
  return modeles;
}

/** Modèles OpenRouter d'un orateur, du plus adapté au moins adapté (gammes économiques, plus récent d'abord). */
async function modelesOpenRouter(id: IdOrateur, gratuits: boolean): Promise<string[]> {
  const gammes = OR_GAMMES[id];
  const rang = (m: string) => { const i = gammes.findIndex((g) => g.test(m)); return i === -1 ? gammes.length : i; };
  return (await catalogueOpenRouter())
    .filter((m) => m.id.startsWith(OR_PREFIXES[id]))
    .filter((m) => gratuits
      ? m.id.endsWith(":free") && !OR_EXCLUS.test(m.id.slice(0, -5))
      : !m.id.endsWith(":free") && !OR_EXCLUS.test(m.id) && m.entree > 0 && m.entree <= OR_PRIX_MAX_ENTREE && m.sortie <= OR_PRIX_MAX_SORTIE)
    .sort((a, b) => rang(a.id) - rang(b.id) || b.cree - a.cree)
    .map((m) => m.id);
}

function fournisseurDuModele(modele: string): string {
  for (const id of Object.keys(OR_PREFIXES) as IdOrateur[]) if (modele.startsWith(OR_PREFIXES[id])) return CLES_IA[id].fournisseur;
  return modele.split("/")[0];
}

/** Ordre fixe des orateurs : sert à varier le modèle gratuit d'un orateur à l'autre. */
const RANGS_ORATEURS: IdOrateur[] = ["chatgpt", "claude", "gemini", "deepseek", "mistral", "llama"];
const PARENTS_GRATUITS: Partial<Record<IdOrateur, string>> = { gemini: "google/", llama: "meta-llama/", deepseek: "deepseek/", mistral: "mistralai/", chatgpt: "openai/", claude: "anthropic/" };
const EXCLUS_GRATUITS = /(image|audio|tts|embed|guard|omni|reasoning|code|lyria|1\.7b)/i;
const estGratuit = (id: string) => id.endsWith(":free") || id === "openrouter/free";

/** Mode Gratuit : modèles « :free » actifs sur OpenRouter (jamais codés en dur), variés selon l'orateur, routeur gratuit en dernier. */
async function modelesGratuits(id: IdOrateur): Promise<string[]> {
  const ids = (await catalogueOpenRouter())
    .filter((m) => m.id.endsWith(":free") && !EXCLUS_GRATUITS.test(m.id))
    .sort((a, b) => b.cree - a.cree)
    .map((m) => m.id);
  const parent = PARENTS_GRATUITS[id] || "";
  const memes = parent ? ids.filter((m) => m.startsWith(parent)) : [];
  let autres = ids.filter((m) => !memes.includes(m));
  if (autres.length) { const d = Math.max(0, RANGS_ORATEURS.indexOf(id)) % autres.length; autres = [...autres.slice(d), ...autres.slice(0, d)]; }
  return [...new Set([...memes, ...autres].slice(0, 4).concat("openrouter/free"))];
}

/** Connexion 1 clic : le visiteur paie OpenRouter lui-même (ou utilise les modèles gratuits). */
async function appelerOpenRouterVisiteur(
  id: IdOrateur, cle: string, gratuits: boolean, systeme: string, prompt: string, maxTokens: number, temperature: number
): Promise<{ text: string; modelUsed: string; provider: string }> {
  // Mode Gratuit : verrou, aucun identifiant payant ne peut passer.
  let liste = gratuits ? (await modelesGratuits(id)).filter(estGratuit) : (await modelesOpenRouter(id, false)).slice(0, 3);
  if (liste.length === 0) throw new Error(`OpenRouter : aucun modèle ${CLES_IA[id].nom}${gratuits ? " gratuit" : ""} disponible.`);
  let derniere = "";
  for (let i = 0; i < liste.length; i++) {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(60000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cle}`,
        "HTTP-Referer": "https://alphabette.eu/apps/iadebat/",
        "X-Title": "IA Debat - Alphabette",
      },
      body: JSON.stringify({
        model: liste[i],
        models: liste.slice(i, i + 3), // secours automatique d'OpenRouter (surcharge, indisponibilité)
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: "system", content: systeme }, { role: "user", content: prompt }],
      }),
    });
    const texte = await r.text();
    if (r.ok) {
      const d = JSON.parse(texte);
      const contenu = String(d?.choices?.[0]?.message?.content || "");
      const modele = String(d?.model || liste[i]);
      if (contenu.trim()) return { text: contenu, modelUsed: modele, provider: gratuits ? "gratuit" : fournisseurDuModele(modele) };
      derniere = "réponse vide";
      continue;
    }
    derniere = formatErrorSummary(texte);
    if (r.status === 401) throw new Error("OpenRouter : connexion expirée. Reconnectez-vous (Accès aux IA → Se connecter avec OpenRouter).");
    if (r.status === 402) throw new Error("OpenRouter : crédit épuisé sur votre compte. Cochez « Modèles gratuits uniquement » ou ajoutez du crédit sur openrouter.ai.");
    // 429, 5xx, modèle introuvable : modèle suivant
  }
  throw new Error(`OpenRouter : ${CLES_IA[id].nom} indisponible (${derniere}).`);
}

/** Relais du Mode Découverte (sur le site d'Alphabette). */
const RELAIS_DECOUVERTE = (() => {
  try {
    const h = (globalThis as any).location?.hostname || "";
    if (h === "alphabette.fr" || h === "alphabette.eu") return `${(globalThis as any).location.origin}/api/iadebat-proxy.php`;
  } catch { /* hors navigateur */ }
  return "https://alphabette.eu/api/iadebat-proxy.php";
})();
const ticketsDecouverte = new Map<string, string>();

async function postDecouverte(corps: any): Promise<{ status: number; data: any }> {
  const r = await fetch(RELAIS_DECOUVERTE, {
    method: "POST",
    signal: AbortSignal.timeout(90000),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
  return { status: r.status, data: await r.json().catch(() => ({})) };
}

function erreurQuota(message: string): Error {
  const e: any = new Error(message);
  e.quotaDecouverte = true;
  return e;
}

/** Mode Découverte : un ticket par sujet (= 1 des 3 débats gratuits du jour), puis les répliques. */
async function appelerDecouverte(
  id: IdOrateur, mode: "gratuit" | "premium", sujet: string, divers: boolean, systeme: string, prompt: string, maxTokens: number, temperature: number
): Promise<{ text: string; modelUsed: string; provider: string }> {
  const cleTicket = `${mode}|${sujet}`;
  let sature = false;
  for (let essai = 0; essai < 3; essai++) {
    let ticket = "";
    if (!divers) {
      ticket = ticketsDecouverte.get(cleTicket) || "";
      if (!ticket) {
        const d = await postDecouverte({ action: "debut", sujet: sujet.slice(0, 200), mode });
        if (d.status === 429) throw erreurQuota(d.data?.erreur || "Débats gratuits du jour épuisés.");
        if (d.status !== 200 || !d.data?.ticket) throw new Error(d.data?.erreur || `Mode Découverte indisponible (${d.status}).`);
        ticket = d.data.ticket;
        ticketsDecouverte.set(cleTicket, ticket);
      }
    }
    const r = await postDecouverte({ action: "generer", ticket, divers, orateur: id, rang: Math.max(0, RANGS_ORATEURS.indexOf(id)), systeme, prompt, max_tokens: maxTokens, temperature });
    if (r.status === 200 && r.data?.texte) {
      const gratuit = Boolean(r.data.gratuit);
      return { text: String(r.data.texte), modelUsed: String(r.data.modele || ""), provider: gratuit ? "gratuit" : String(r.data.fournisseur || CLES_IA[id].fournisseur) };
    }
    if (r.status === 401 && r.data?.ticket && !divers) { ticketsDecouverte.delete(cleTicket); continue; }
    // Serveur gratuit saturé : petite pause puis nouvelle tentative (une seule).
    if (r.status === 503 && r.data?.sature && !sature) { sature = true; await new Promise((ok) => setTimeout(ok, 2500)); continue; }
    if (r.status === 429) {
      if (r.data?.fin_debat) ticketsDecouverte.delete(cleTicket);
      throw erreurQuota(r.data?.erreur || "Débats gratuits du jour épuisés.");
    }
    throw new Error(r.data?.erreur || `Mode Découverte : ${CLES_IA[id].nom} n'a pas répondu (${r.status}).`);
  }
  throw new Error("Mode Découverte : ticket refusé. Réessayez.");
}

interface TexteEcrit {
  text: string;
  provider: string;
  modelUsed: string;
  /** « Mistral · mistral-large-latest » : l'IA qui a vraiment écrit. */
  ecritPar: string;
  notice?: string;
}

/** « google/gemma-4-31b-it:free » → « Gemma 4 31b It (google) » : nom lisible du modèle gratuit qui a répondu. */
function nomModeleGratuit(id: string): string {
  if (!id || id === "openrouter/free") return "Modèle gratuit";
  const [fournisseur, nom = id] = id.replace(/:free$/, "").split("/");
  const joli = nom.split(/[-_]/).map((m) => (m ? m[0].toUpperCase() + m.slice(1) : m)).join(" ");
  return `${joli} (${fournisseur})`;
}

type SourceIA = { type: "cle" | "openrouter" | "decouverte"; id: IdOrateur };

/**
 * Fait écrire une IA. Pour l'orateur demandé : sa clé personnelle (Mode Expert), sinon la connexion
 * OpenRouter du visiteur, sinon le Mode Découverte. En dernier recours, une autre clé personnelle écrit
 * à sa place (la réplique l'indique).
 */
async function ecrireAvecLesCles(
  headers: any,
  systeme: string,
  prompt: string,
  options: { maxTokens: number; temperature?: number; prefere?: IdOrateur; divers?: boolean }
): Promise<TexteEcrit> {
  const prefere: IdOrateur = options.prefere ?? "gemini";
  const cleOR = lireEntete(headers, "x-iadebat-openrouter-key");
  const gratuitsOR = lireEntete(headers, "x-iadebat-openrouter-gratuit") === "1";
  const decouverte = lireEntete(headers, "x-iadebat-decouverte") === "1";
  const mode: "gratuit" | "premium" = lireEntete(headers, "x-iadebat-mode") === "premium" ? "premium" : "gratuit";
  let sujet = "";
  try { sujet = decodeURIComponent(lireEntete(headers, "x-iadebat-sujet")); } catch { sujet = ""; }
  const divers = Boolean(options.divers) || !sujet;

  const sources: SourceIA[] = [];
  if (mode === "gratuit") {
    // MODE GRATUIT : uniquement des modèles gratuits (OpenRouter du visiteur forcé en « :free », ou relais gratuit).
    // Les clés personnelles (payantes) ne sont jamais utilisées ici.
    if (cleOR) sources.push({ type: "openrouter", id: prefere });
    else if (decouverte) sources.push({ type: "decouverte", id: prefere });
  } else {
    if (cleDe(headers, prefere)) sources.push({ type: "cle", id: prefere });
    if (cleOR) sources.push({ type: "openrouter", id: prefere });
    else if (decouverte) sources.push({ type: "decouverte", id: prefere });
    for (const id of ORDRE_RELAIS) if (id !== prefere && cleDe(headers, id)) sources.push({ type: "cle", id });
  }
  if (sources.length === 0) {
    const e: any = new Error(MESSAGE_SANS_CLE);
    e.sansCle = true;
    throw e;
  }

  const echecs: string[] = [];
  let quota: any = null;
  const temperature = options.temperature ?? 0.85;
  for (const s of sources) {
    const nom = CLES_IA[s.id].nom;
    try {
      let r: { text: string; modelUsed: string; provider: string };
      if (s.type === "cle") {
        const d = await appelerIA(s.id, cleDe(headers, s.id), systeme, prompt, options.maxTokens, temperature);
        r = { ...d, provider: CLES_IA[s.id].fournisseur };
      } else if (s.type === "openrouter") {
        r = await appelerOpenRouterVisiteur(s.id, cleOR, mode === "gratuit" || gratuitsOR, systeme, prompt, options.maxTokens, temperature);
      } else {
        r = await appelerDecouverte(s.id, mode, sujet || "divers", divers, systeme, prompt, options.maxTokens, temperature);
      }
      if (r.text.trim()) {
        const gratuit = r.provider === "gratuit";
        const via = gratuit ? " · gratuit" : s.type === "openrouter" ? " (OpenRouter)" : s.type === "decouverte" ? " (Premium offert)" : "";
        const nomReel = gratuit ? nomModeleGratuit(r.modelUsed) : Object.values(CLES_IA).find((c) => c.fournisseur === r.provider)?.nom || r.provider;
        return {
          text: r.text,
          provider: r.provider,
          modelUsed: r.modelUsed,
          ecritPar: gratuit ? `${nomReel}${via}` : `${nomReel} · ${r.modelUsed}${via}`,
          notice: echecs.length ? `${echecs.join(" ; ")} — relais par ${nomReel}` : undefined,
        };
      }
      echecs.push(`${nom} : réponse vide`);
    } catch (err: any) {
      if (err?.quotaDecouverte) quota = err;
      console.warn(`[IADÉBAT] ${nom} indisponible : ${formatErrorSummary(err)}`);
      echecs.push(`${nom} : ${err?.message ? String(err.message).slice(0, 220) : formatErrorSummary(err)}`);
    }
  }
  if (quota) throw quota;
  if (sources.length === 1) throw new Error(echecs[0] || "L'IA n'a pas répondu.");
  throw new Error(`Aucune IA n'a répondu (${echecs.join(" ; ")}).`);
}

function repondreErreurIA(res: any, err: any) {
  const statut = err?.sansCle ? 400 : err?.quotaDecouverte ? 429 : 502;
  return res.status(statut).json({ error: err?.message || "L'IA n'a pas répondu.", sansCle: Boolean(err?.sansCle), quotaDecouverte: Boolean(err?.quotaDecouverte) });
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
  if (promptLower.includes("llama")) return "llama";
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
      divers: true,
    });
    const liste = lireJsonIA(r.text, "[");
    if (!Array.isArray(liste)) throw new Error("L'IA a répondu dans un format illisible : réessayez.");
    return res.json(liste);
  } catch (error: any) {
    return repondreErreurIA(res, error);
  }
});

// Test d'une clé : même chemin que le débat (modèle choisi automatiquement).
app.post("/api/debate/test-key", async (req, res) => {
  const { provider, key } = req.body || {};
  const startTime = Date.now();
  if (!key || typeof key !== "string" || !key.trim()) {
    return res.status(400).json({ success: false, error: "Clé API absente ou invalide." });
  }
  if (!(provider in CLES_IA)) return res.status(400).json({ success: false, error: "Fournisseur non reconnu." });
  try {
    const r = await appelerIA(provider as IdOrateur, key.trim(), "Tu réponds en français, très brièvement.", "Réponds simplement « Test réussi ».", 300, 0.2);
    return res.json({ success: true, provider, modelUsed: r.modelUsed, latencyMs: Date.now() - startTime, reply: r.text.trim() || "OK" });
  } catch (err: any) {
    return res.json({ success: false, provider, error: String(err?.message || formatErrorSummary(err)).slice(0, 300) });
  }
});

app.post("/api/debate/generate", async (req, res) => {
  const { systemPrompt, topicTitle, topicDescription, context, agentId, speed } = req.body;
  // Débat IA seul : posture choisie par l'utilisateur pour cette voix (remplace la liberté d'opinion).
  const posture = typeof req.body?.posture === "string" ? req.body.posture.replace(/\s+/g, " ").trim().slice(0, 300) : "";
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
${posture
  ? `- POSTURE CHOISIE PAR L'ORGANISATEUR DU DÉBAT : ${posture}. Défends cette position avec conviction et des arguments honnêtes, même si tu penserais autrement ; n'invente ni chiffre ni source.`
  : "- LIBERTÉ TOTALE D'OPINION : Tu disposes d'une liberté intellectuelle et dialectique absolue. Aucun point de vue, parti-pris, thèse ou conclusion ne t'est suggéré ni imposé. Tu es entièrement souverain pour adopter la posture de ton choix (favorable, opposée, sceptique, alternative ou médiane) selon ta propre analyse."}
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
      divers: true,
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

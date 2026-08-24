import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import {
  FALLBACK_TOPICS,
  identifyAgent,
  generateLocalSpeech,
  generateLocalJuryVerdict,
  generateLocalSummary,
} from "./src/server/fallback.ts";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "2mb" }));

// ─── IDENTIFIANTS DE MODÈLES ─────────────────────────────────────────────────
// Source unique de vérité : aucun nom de modèle ne doit être codé en dur
// ailleurs dans le projet. Chaque entrée est surchargeable par variable
// d'environnement pour permettre une montée de version sans redéploiement.
const MODELS = {
  gemini: process.env.MODEL_GEMINI || "gemini-3.5-flash",
  chatgpt: process.env.MODEL_OPENAI || "gpt-4o-mini",
  claude: process.env.MODEL_ANTHROPIC || "claude-3-5-haiku-20241022",
  deepseek: process.env.MODEL_DEEPSEEK || "deepseek-chat",
  mistral: process.env.MODEL_MISTRAL || "mistral-large-latest",
  grok: process.env.MODEL_GROK || "grok-2-1212",
};

// Gemini 3.x : Google recommande de laisser `temperature` et `top_p` à leurs
// valeurs par défaut et de piloter la qualité par le niveau de réflexion.
const THINKING = {
  speech: ThinkingLevel.LOW,
  summary: ThinkingLevel.MEDIUM,
  jury: ThinkingLevel.HIGH,
  topics: ThinkingLevel.LOW,
} as const;

// ─── CLASSIFICATION DES ERREURS ──────────────────────────────────────────────
type FailureKind =
  | "none"
  | "config"
  | "auth"
  | "quota"
  | "network"
  | "server"
  | "format"
  | "unknown";

interface Degradation {
  kind: FailureKind;
  reason: string;
}

const OK: Degradation = { kind: "none", reason: "" };

class UpstreamError extends Error {
  provider: string;
  status: number;
  retryAfterMs: number | null;

  constructor(provider: string, status: number, body: string, retryAfterMs: number | null = null) {
    super(`${provider} a répondu ${status} : ${body.slice(0, 300)}`);
    this.name = "UpstreamError";
    this.provider = provider;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(header);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return null;
}

function classifyError(error: any): Degradation {
  if (error instanceof ConfigError) {
    return { kind: "config", reason: error.message };
  }

  if (error instanceof UpstreamError) {
    if (error.status === 401 || error.status === 403) {
      return {
        kind: "auth",
        reason: `La clé API ${error.provider} a été refusée (${error.status}). Vérifiez qu'elle est valide et non expirée.`,
      };
    }
    if (error.status === 429) {
      return {
        kind: "quota",
        reason: `Le quota ${error.provider} est momentanément épuisé (429). Le moteur de secours local prend le relais.`,
      };
    }
    if (error.status >= 500) {
      return {
        kind: "server",
        reason: `Le service ${error.provider} est indisponible (${error.status}).`,
      };
    }
    return {
      kind: "unknown",
      reason: `Réponse inattendue de ${error.provider} (${error.status}).`,
    };
  }

  const raw = String(error?.message || error || "");
  const text = raw.toLowerCase();

  if (error?.name === "AbortError" || text.includes("aborted")) {
    return { kind: "network", reason: "La requête a été interrompue avant d'aboutir." };
  }

  if (
    text.includes("fetch failed") ||
    text.includes("econnreset") ||
    text.includes("enotfound") ||
    text.includes("etimedout") ||
    text.includes("socket hang up") ||
    text.includes("network")
  ) {
    return { kind: "network", reason: "Le réseau n'a pas permis de joindre le fournisseur de modèles." };
  }

  if (
    text.includes("429") ||
    text.includes("resource_exhausted") ||
    text.includes("resource exhausted") ||
    text.includes("rate limit") ||
    text.includes("quota")
  ) {
    return {
      kind: "quota",
      reason: "Le quota du fournisseur est momentanément épuisé. Le moteur de secours local prend le relais.",
    };
  }

  if (
    text.includes("api key") ||
    text.includes("api_key") ||
    text.includes("unauthorized") ||
    text.includes("forbidden") ||
    text.includes("permission_denied") ||
    text.includes("invalid_argument") ||
    text.includes("key is invalid") ||
    text.includes("invalid_key") ||
    text.includes("key not valid")
  ) {
    return {
      kind: "auth",
      reason: "La clé API utilisée a été refusée. Vérifiez qu'elle est valide et non expirée.",
    };
  }

  if (text.includes("json") || text.includes("unexpected token")) {
    return { kind: "format", reason: "La réponse du modèle n'était pas exploitable." };
  }

  if (text.includes("500") || text.includes("502") || text.includes("503") || text.includes("504")) {
    return { kind: "server", reason: "Le fournisseur de modèles est momentanément indisponible." };
  }

  return {
    kind: "unknown",
    reason: raw ? `Interruption technique : ${raw.slice(0, 200)}` : "Interruption technique inconnue.",
  };
}

// ─── REPRISE SUR 429 ─────────────────────────────────────────────────────────
const MAX_RETRIES = Number(process.env.GENERATION_MAX_RETRIES ?? 2);
const RETRY_BASE_MS = Number(process.env.GENERATION_RETRY_BASE_MS ?? 700);
const RETRY_CAP_MS = Number(process.env.GENERATION_RETRY_CAP_MS ?? 8000);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function backoffDelay(error: any, attempt: number): number {
  const advertised = error instanceof UpstreamError ? error.retryAfterMs : null;
  if (advertised !== null) return Math.min(advertised, RETRY_CAP_MS);
  const exponential = RETRY_BASE_MS * Math.pow(2, attempt);
  const jitter = Math.random() * RETRY_BASE_MS;
  return Math.min(exponential + jitter, RETRY_CAP_MS);
}

/** Rejoue l'appel tant que le fournisseur répond « quota épuisé ». */
async function withRetry<T>(label: string, call: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call();
    } catch (error: any) {
      const { kind } = classifyError(error);
      if (kind !== "quota" || attempt >= MAX_RETRIES) throw error;
      const delay = backoffDelay(error, attempt);
      console.log(
        `[IADÉBAT SERVER] ${label} : quota atteint, nouvelle tentative dans ${Math.round(delay)} ms (${attempt + 1}/${MAX_RETRIES}).`
      );
      await sleep(delay);
    }
  }
}

// ─── LIMITE DE DÉBIT ─────────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 40);
const rateLimitHits = new Map<string, number[]>();

/** Consomme un jeton pour ce client. `false` = plafond atteint. */
function consumeRateLimit(key: string): boolean {
  const now = Date.now();
  const window = (rateLimitHits.get(key) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (window.length >= RATE_LIMIT_MAX) {
    rateLimitHits.set(key, window);
    return false;
  }
  window.push(now);
  rateLimitHits.set(key, window);
  return true;
}

// Purge périodique pour éviter la croissance sans fin de la table.
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of rateLimitHits) {
    const kept = times.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (kept.length === 0) rateLimitHits.delete(key);
    else rateLimitHits.set(key, kept);
  }
}, RATE_LIMIT_WINDOW_MS).unref?.();

const THROTTLED: Degradation = {
  kind: "quota",
  reason:
    "Trop de requêtes envoyées en peu de temps depuis ce navigateur. Le moteur de secours local prend le relais le temps que la cadence retombe.",
};

// ─── CLOISONNEMENT PAR CLIENT ────────────────────────────────────────────────
const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const SHARED_BUCKET = "partage";

/** Identifiant de cloisonnement : en-tête `x-client-id`, sinon adresse IP. */
function clientBucket(req: express.Request): string {
  const header = req.headers["x-client-id"];
  const value = Array.isArray(header) ? header[0] : header;
  if (value && CLIENT_ID_PATTERN.test(value)) return value;
  return SHARED_BUCKET;
}

function rateLimitKey(req: express.Request): string {
  const bucket = clientBucket(req);
  if (bucket !== SHARED_BUCKET) return bucket;
  return `ip:${req.ip || "inconnu"}`;
}

// ─── ARCHIVES DURABLES, CLOISONNÉES ET ÉCRITES ATOMIQUEMENT ──────────────────
const ARCHIVES_FILE = path.join(process.cwd(), "archives.json");
const ARCHIVES_TMP = `${ARCHIVES_FILE}.tmp`;
const MAX_ARCHIVES_PER_CLIENT = Number(process.env.MAX_ARCHIVES_PER_CLIENT ?? 100);

type ArchiveStore = { [bucket: string]: any[] };

function loadStore(): ArchiveStore {
  try {
    if (!fs.existsSync(ARCHIVES_FILE)) return {};
    const parsed = JSON.parse(fs.readFileSync(ARCHIVES_FILE, "utf-8"));
    // Format historique : un tableau unique et non cloisonné.
    if (Array.isArray(parsed)) {
      console.log("[IADÉBAT SERVER] Archives au format historique migrées vers le compartiment 'partage'.");
      return { [SHARED_BUCKET]: parsed };
    }
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    console.log("[IADÉBAT SERVER] Lecture des archives locales indisponible.");
    return {};
  }
}

/** Écriture atomique : fichier temporaire puis renommage. */
function saveStore(store: ArchiveStore) {
  try {
    fs.writeFileSync(ARCHIVES_TMP, JSON.stringify(store, null, 2), "utf-8");
    fs.renameSync(ARCHIVES_TMP, ARCHIVES_FILE);
  } catch (e) {
    console.log("[IADÉBAT SERVER] Sauvegarde des archives locales indisponible.");
    try {
      if (fs.existsSync(ARCHIVES_TMP)) fs.unlinkSync(ARCHIVES_TMP);
    } catch {
      /* rien à faire */
    }
  }
}

// ─── CLIENTS DE MODÈLES ──────────────────────────────────────────────────────
let sharedGeminiClient: GoogleGenAI | null = null;

function geminiClient(customKey?: string): GoogleGenAI {
  if (customKey) {
    return new GoogleGenAI({ apiKey: customKey });
  }
  if (!sharedGeminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new ConfigError(
        "Aucune clé Gemini n'est configurée sur le serveur. Renseignez la vôtre dans « Configuration des clés API » pour activer la génération réelle."
      );
    }
    sharedGeminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return sharedGeminiClient;
}

function header(req: express.Request, name: string): string | undefined {
  const value = req.headers[name];
  const resolved = Array.isArray(value) ? value[0] : value;
  return resolved ? String(resolved) : undefined;
}

/** Appel d'un fournisseur compatible OpenAI (ChatGPT, DeepSeek, Mistral, Grok). */
async function callOpenAICompatible(opts: {
  provider: string;
  url: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  prompt: string;
}): Promise<string> {
  const response = await fetch(opts.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: "system", content: opts.systemPrompt },
        { role: "user", content: opts.prompt },
      ],
      temperature: 0.85,
    }),
  });

  if (!response.ok) {
    throw new UpstreamError(
      opts.provider,
      response.status,
      await response.text(),
      parseRetryAfter(response.headers.get("retry-after"))
    );
  }

  const data: any = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error(`${opts.provider} n'a renvoyé aucun texte exploitable.`);
  }
  return text;
}

async function callAnthropic(opts: {
  apiKey: string;
  systemPrompt: string;
  prompt: string;
}): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELS.claude,
      max_tokens: 1024,
      system: opts.systemPrompt,
      messages: [{ role: "user", content: opts.prompt }],
      temperature: 0.85,
    }),
  });

  if (!response.ok) {
    throw new UpstreamError(
      "Anthropic",
      response.status,
      await response.text(),
      parseRetryAfter(response.headers.get("retry-after"))
    );
  }

  const data: any = await response.json();
  const text = data?.content?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Anthropic n'a renvoyé aucun texte exploitable.");
  }
  return text;
}

async function callGemini(opts: {
  customKey?: string;
  systemPrompt?: string;
  prompt: string;
  thinkingLevel: ThinkingLevel;
  jsonOutput?: boolean;
}): Promise<string> {
  const ai = geminiClient(opts.customKey);
  const response = await ai.models.generateContent({
    model: MODELS.gemini,
    contents: opts.prompt,
    config: {
      ...(opts.systemPrompt ? { systemInstruction: opts.systemPrompt } : {}),
      ...(opts.jsonOutput ? { responseMimeType: "application/json" } : {}),
      thinkingConfig: { thinkingLevel: opts.thinkingLevel },
    },
  });

  const text = response.text;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Gemini n'a renvoyé aucun texte exploitable.");
  }
  return text;
}

/** Retire l'éventuelle clôture Markdown autour d'un bloc JSON. */
function stripCodeFence(raw: string): string {
  const text = raw.trim();
  if (text.startsWith("```")) {
    return text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```\s*$/, "").trim();
  }
  return text;
}

// ─── ROUTES : SANTÉ ──────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    models: MODELS,
    hasServerGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// ─── ROUTES : ARCHIVES ───────────────────────────────────────────────────────
app.get("/api/archives", (req, res) => {
  const store = loadStore();
  res.json(store[clientBucket(req)] || []);
});

app.post("/api/archives", (req, res) => {
  const record = req.body;
  if (!record || typeof record !== "object" || !record.key) {
    return res.status(400).json({ error: "Enregistrement non valide ou sans clé unique." });
  }

  const bucket = clientBucket(req);
  const store = loadStore();
  const current = store[bucket] || [];
  const next = [record, ...current.filter(item => item.key !== record.key)].slice(0, MAX_ARCHIVES_PER_CLIENT);
  store[bucket] = next;
  saveStore(store);

  res.json({ success: true, record });
});

app.delete("/api/archives/:key", (req, res) => {
  const bucket = clientBucket(req);
  const store = loadStore();
  const current = store[bucket] || [];
  store[bucket] = current.filter(item => item.key !== req.params.key);
  saveStore(store);
  res.json({ success: true });
});

// ─── ROUTES : SUGGESTION DE THÈMES ───────────────────────────────────────────
/** Sélection locale de trois thèmes, filtrée par mot-clé quand c'est possible. */
function localTopics(keyword: string) {
  const kw = (keyword || "").toLowerCase().trim();
  const matches = kw
    ? FALLBACK_TOPICS.filter(
        t =>
          t.title.toLowerCase().includes(kw) ||
          t.category.toLowerCase().includes(kw) ||
          t.description.toLowerCase().includes(kw)
      )
    : [];
  return [...matches, ...FALLBACK_TOPICS.filter(t => !matches.includes(t))].slice(0, 3);
}

app.post("/api/debate/suggest-topics", async (req, res) => {
  const { keyword } = req.body || {};

  const degrade = (degradation: Degradation) =>
    res.json({
      topics: localTopics(keyword),
      source: "local",
      degraded: true,
      kind: degradation.kind,
      reason: degradation.reason,
    });

  if (!consumeRateLimit(rateLimitKey(req))) return degrade(THROTTLED);

  const prompt = `Génère 3 thèmes de débat stimulants, philosophiques et futuristes en rapport avec : "${keyword || "futurisme"}".
Chaque thème doit comporter :
- Une catégorie pertinente en majuscules (ex: BIOLOGIE & ÉTHIQUE, Espace & Pouvoir, etc.)
- Un titre accrocheur sous forme de question (ex: "Faut-il légiférer sur les rêves artificiels ?")
- Une description analytique de la problématique en deux phrases limpides.

Le retour doit être un tableau JSON valide. Ne renvoie AUCUN texte introductif ou explicatif, uniquement l'objet JSON. Le format exact doit être :
[
  {
    "category": "CATEGORIE",
    "title": "Titre du débat ?",
    "description": "Description du débat..."
  }
]`;

  try {
    const raw = await withRetry("suggestion de thèmes", () =>
      callGemini({
        customKey: header(req, "x-gemini-api-key"),
        prompt,
        thinkingLevel: THINKING.topics,
        jsonOutput: true,
      })
    );

    const parsed = JSON.parse(stripCodeFence(raw));
    const topics = Array.isArray(parsed) ? parsed : parsed?.topics;
    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error("Le modèle n'a pas renvoyé de tableau de thèmes.");
    }

    return res.json({ topics, source: "remote", degraded: false, ...OK });
  } catch (error: any) {
    const degradation = classifyError(error);
    console.log(`[IADÉBAT SERVER] Suggestion dégradée (${degradation.kind}) : ${degradation.reason}`);
    return degrade(degradation);
  }
});

// ─── ROUTES : GÉNÉRATION D'UNE PRISE DE PAROLE ───────────────────────────────
app.post("/api/debate/generate", async (req, res) => {
  const { systemPrompt, topicTitle, topicDescription, context, agentId } = req.body || {};

  if (typeof systemPrompt !== "string" || typeof topicTitle !== "string") {
    return res.status(400).json({ error: "Requête de génération incomplète." });
  }

  const isJury = topicTitle.includes("JURY");
  const resolvedAgentId = agentId || identifyAgent(systemPrompt);

  const degrade = (degradation: Degradation) =>
    res.json({
      text: isJury
        ? generateLocalJuryVerdict(topicTitle)
        : generateLocalSpeech(resolvedAgentId, topicTitle, topicDescription || ""),
      source: "local",
      degraded: true,
      kind: degradation.kind,
      reason: degradation.reason,
    });

  if (!consumeRateLimit(rateLimitKey(req))) return degrade(THROTTLED);

  const prompt = `Tu débats sur la problématique centrale suivante :
"${topicTitle}"

Contexte & Éléments de réflexion :
${topicDescription || ""}

Contexte du débat actuel (réponses précédentes) :
${context ? context : "Le débat commence, tu ouvres la discussion."}

Consignes impératives :
- Formule tes idées de façon fluide, directe et percutante.
- Ne commence pas par un titre ni par des salutations artificielles (ne dis pas "Bonjour", "Je suis de retour", ni "Voici ma perspective"). Écris directement le corps de ton argumentation de manière naturelle.
- N'utilise AUCUNE liste à puces ni liste numérotée. Fais des phrases et paragraphes rédigés.
- Tiens-toi strictement à ton rôle défini dans les consignes système ci-dessous.`;

  try {
    const text = await withRetry(`génération ${resolvedAgentId}`, async () => {
      // 1. Moteur natif du modèle si l'utilisateur a fourni sa propre clé.
      const openAIKey = header(req, "x-openai-api-key");
      if (resolvedAgentId === "chatgpt" && openAIKey) {
        return callOpenAICompatible({
          provider: "OpenAI",
          url: "https://api.openai.com/v1/chat/completions",
          apiKey: openAIKey,
          model: MODELS.chatgpt,
          systemPrompt,
          prompt,
        });
      }

      const anthropicKey = header(req, "x-anthropic-api-key") || header(req, "x-api-key");
      if (resolvedAgentId === "claude" && anthropicKey) {
        return callAnthropic({ apiKey: anthropicKey, systemPrompt, prompt });
      }

      const deepseekKey = header(req, "x-deepseek-api-key");
      if (resolvedAgentId === "deepseek" && deepseekKey) {
        return callOpenAICompatible({
          provider: "DeepSeek",
          url: "https://api.deepseek.com/chat/completions",
          apiKey: deepseekKey,
          model: MODELS.deepseek,
          systemPrompt,
          prompt,
        });
      }

      const mistralKey = header(req, "x-mistral-api-key");
      if (resolvedAgentId === "mistral" && mistralKey) {
        return callOpenAICompatible({
          provider: "Mistral",
          url: "https://api.mistral.ai/v1/chat/completions",
          apiKey: mistralKey,
          model: MODELS.mistral,
          systemPrompt,
          prompt,
        });
      }

      const grokKey = header(req, "x-grok-api-key");
      if (resolvedAgentId === "grok" && grokKey) {
        return callOpenAICompatible({
          provider: "Grok xAI",
          url: "https://api.x.ai/v1/chat/completions",
          apiKey: grokKey,
          model: MODELS.grok,
          systemPrompt,
          prompt,
        });
      }

      // 2. Interprétation par Gemini pour tous les autres cas.
      return callGemini({
        customKey: header(req, "x-gemini-api-key"),
        systemPrompt,
        prompt,
        thinkingLevel: isJury ? THINKING.jury : THINKING.speech,
        jsonOutput: isJury,
      });
    });

    return res.json({ text, source: "remote", degraded: false, ...OK });
  } catch (error: any) {
    const degradation = classifyError(error);
    console.log(
      `[IADÉBAT SERVER] Génération dégradée pour ${resolvedAgentId} (${degradation.kind}) : ${degradation.reason}`
    );
    return degrade(degradation);
  }
});

// ─── ROUTES : SYNTHÈSE DE SÉANCE ─────────────────────────────────────────────
app.post("/api/debate/summary", async (req, res) => {
  const { topicTitle, topicDescription, messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.json({
      text: "Le débat s'est clos sans aucune contribution.",
      source: "local",
      degraded: false,
      ...OK,
    });
  }

  const degrade = (degradation: Degradation) =>
    res.json({
      text: generateLocalSummary(topicTitle || "", topicDescription || ""),
      source: "local",
      degraded: true,
      kind: degradation.kind,
      reason: degradation.reason,
    });

  if (!consumeRateLimit(rateLimitKey(req))) return degrade(THROTTLED);

  const transcript = messages
    .map((m: any) => `[${m.agentName} — ${m.agentRole}]\n${m.content}`)
    .join("\n\n---\n\n");

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
    const text = await withRetry("synthèse", () =>
      callGemini({
        customKey: header(req, "x-gemini-api-key"),
        systemPrompt,
        prompt,
        thinkingLevel: THINKING.summary,
      })
    );

    return res.json({ text, source: "remote", degraded: false, ...OK });
  } catch (error: any) {
    const degradation = classifyError(error);
    console.log(`[IADÉBAT SERVER] Synthèse dégradée (${degradation.kind}) : ${degradation.reason}`);
    return degrade(degradation);
  }
});

// ─── MONTAGE DE VITE ─────────────────────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[IADÉBAT SERVER] Serveur démarré sur http://localhost:${PORT}`);
  });
}

startServer();

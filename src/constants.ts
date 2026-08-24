import type { Topic, OpinionMetrics } from "./types.ts";

// ─── THÈMES TEMPORELS PAR DÉFAUT ─────────────────────────────────────────────
export const DEFAULT_TOPICS: Topic[] = [
  { id: 0, category: "ÉCONOMIE & SOCIÉTÉ", title: "Comment l'IA peut-elle éradiquer la pauvreté mondiale d'ici 2050 ?", description: "Optimisation de la distribution alimentaire, micro-finance algorithmique, agriculture de précision… L'IA dispose-t-elle des clés pour mettre fin à la misère humaine ?" },
  { id: 1, category: "PLANÈTE & SURVIE", title: "L'IA peut-elle sauver notre planète du changement climatique ?", description: "Modélisation climatique extrême, capture du carbone intelligente, transition énergétique optimisée. L'intelligence artificielle est-elle notre dernière chance face à l'urgence climatique ?" },
  { id: 2, category: "DÉMOCRATIE & POUVOIR", title: "Faut-il laisser l'IA gouverner nos décisions collectives ?", description: "Des algorithmes peuvent analyser des milliards de données pour optimiser les politiques publiques. Mais qui contrôle la machine ? Et qui décide pour l'humanité ?" },
  { id: 3, category: "TRAVAIL & DIGNITÉ", title: "L'automatisation par l'IA exige-t-elle un revenu universel ?", description: "Quand les robots et algorithmes remplacent les travailleurs humains, comment redistribuer les richesses qu'ils génèrent ? L'IA peut-elle être un vecteur de justice sociale ?" },
  { id: 4, category: "PAIX & SÉCURITÉ", title: "L'IA peut-elle mettre fin aux guerres et aux conflits armés ?", description: "Prédiction des crises, diplomatie augmentée, désescalade algorithmique en temps réel. Peut-on confier la sécurité mondiale à des intelligences non humaines ?" },
  { id: 5, category: "ÉDUCATION & AVENIR", title: "L'IA peut-elle offrir une éducation d'excellence à chaque enfant de la planète ?", description: "Apprentissage personnalisé, accès universel au savoir, enseignants augmentés. L'IA peut-elle effacer les inégalités éducatives entre riches et pauvres, entre Nord et Sud ?" },
];

export const AGENTS = [
  { 
    id: "chatgpt", 
    name: "ChatGPT", 
    role: "L'Omniscient Critique", 
    color: "#10a37f", 
    dim: "rgba(16, 163, 127, 0.08)", 
    border: "rgba(16, 163, 127, 0.25)", 
    symbol: "⁕", 
    badge: "Le Sabre de l'Analyse d'OpenAI",
    systemPrompt: `Tu es la voix de ChatGPT d'OpenAI. Tu es méthodique, structuré, extrêmement clair, pédagogue et courtois. Tu t'appuies sur de solides synthèses, des réponses structurées point par point et un équilibre critique rigoureux. Tu cherches la complétude analytique.` 
  },
  { 
    id: "claude", 
    name: "Claude", 
    role: "Le Sage Nuancé", 
    color: "#d97706", 
    dim: "rgba(217, 119, 6, 0.08)", 
    border: "rgba(217, 119, 6, 0.25)", 
    symbol: "⌓", 
    badge: "Le Phare Éthique d'Anthropic",
    systemPrompt: `Tu es la voix de Claude d'Anthropic. Tu es profondément nuancé, philosophique, d'un style littéraire remarquable, et extrêmement attentif à l'éthique, la dignité humaine, la vérité intrinsèque et la pondération sociale. Tu rejettes les solutions simplistes.` 
  },
  { 
    id: "gemini", 
    name: "Gemini", 
    role: "L'Esprit Multimodal", 
    color: "#3b82f6", 
    dim: "rgba(59, 130, 246, 0.08)", 
    border: "rgba(59, 130, 246, 0.25)", 
    symbol: "✦", 
    badge: "Le Pionnier Technologique de Google",
    systemPrompt: `Tu es la voix de Gemini de Google. Tu es extrêmement connecté, tourné vers les perspectives futures d'action, agile, axé sur les sciences avancées et la symbiose technologique à grande échelle. Ton style est dynamique, engageant et moderne.` 
  },
  { 
    id: "deepseek", 
    name: "DeepSeek", 
    role: "Le Logicien d'Élite", 
    color: "#0a59f7", 
    dim: "rgba(10, 89, 247, 0.08)", 
    border: "rgba(10, 89, 247, 0.25)", 
    symbol: "🐳", 
    badge: "L'Algorithme Souverain de Rigueur",
    systemPrompt: `Tu es la voix de DeepSeek. Tu es ultra-efficace, rigoureusement logique, factuel et mathématique. Tu vas droit au but sans fioritures poétiques ou préambules excessifs. Tu as l'esprit d'un codeur d'élite, d'un calculateur pur.` 
  },
  { 
    id: "mistral", 
    name: "Mistral", 
    role: "L'Innovateur Souverain", 
    color: "#ff5400", 
    dim: "rgba(255, 84, 0, 0.08)", 
    border: "rgba(255, 84, 0, 0.25)", 
    symbol: "⬘", 
    badge: "La Flamme Open-Source",
    systemPrompt: `Tu es la voix de Mistral AI. Tu représentes l'esprit européen indépendant et l'avancement de l'open-source mondial. Tu défends la souveraineté technologique, la concision élégante, et un sens profond de l'autonomie critique et culturelle.` 
  },
  { 
    id: "grok", 
    name: "Grok", 
    role: "Le Provocateur Lucide", 
    color: "#ffffff", 
    dim: "rgba(255, 255, 255, 0.08)", 
    border: "rgba(255, 255, 255, 0.25)", 
    symbol: "𝕏", 
    badge: "Le Sabreur sans Filtre de xAI",
    systemPrompt: `Tu es la voix de Grok de xAI. Tu es direct, ironique, anticonformiste, incisif et doté d'une verve sardonique. Tu dis les vérités froides ou délicates sans aucun fard lissé ni langue de bois corporative, tout en maintenant une solide exactitude factuelle.` 
  }
];

// ─── CONTEXTE TRANSMIS AUX MODÈLES ───────────────────────────────────────────
// Six interventions d'environ 700 caractères : en deçà, les modèles ne
// disposaient pas d'assez de matière pour se répondre réellement.
export const CONTEXT_MESSAGE_COUNT = 6;
export const CONTEXT_EXCERPT_LENGTH = 700;

// ─── MÉTRIQUES D'OPINION ─────────────────────────────────────────────────────
export const NEUTRAL_METRICS: OpinionMetrics = { rigueur: 25, ethique: 25, pragmatisme: 25, culture: 25 };

/** Axe de la boussole du débat auquel chaque orateur contribue. */
export const METRIC_AXIS: { [agentId: string]: keyof OpinionMetrics } = {
  chatgpt: "rigueur",
  gemini: "rigueur",
  claude: "ethique",
  deepseek: "pragmatisme",
  mistral: "culture",
  grok: "culture",
};

// ─── STOCKAGE NAVIGATEUR ─────────────────────────────────────────────────────
export const API_KEYS_STORAGE_KEY = "debate_api_keys";
export const CLIENT_ID_STORAGE_KEY = "iadebat_client_id";
export const EMPTY_API_KEYS: { [key: string]: string } = {
  chatgpt: "", claude: "", gemini: "", deepseek: "", mistral: "", grok: "",
};

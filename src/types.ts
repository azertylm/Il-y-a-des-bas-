// ─── TYPES ───────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  agentId: string;
  agentName: string;
  agentRole: string;
  agentColor: string;
  agentDim: string;
  agentBorder: string;
  agentSymbol: string;
  content: string;
  time: string;
  isUser?: boolean;
  claps?: number;
  /** Vrai lorsque le texte provient du moteur de secours local, pas d'une vraie génération. */
  degraded?: boolean;
  degradedReason?: string;
}

export interface Topic {
  id: number | string;
  category: string;
  title: string;
  description: string;
  isCustom?: boolean;
}

export interface FallacyFinding {
  name: string;
  quote: string;
  explanation: string;
  severity: "faible" | "moyenne" | "forte";
}

export interface FallacyAnalysis {
  findings: FallacyFinding[];
  soundness: number;
  verdict: string;
  degraded?: boolean;
  reason?: string;
}

export interface TreatyArticle {
  title: string;
  content: string;
}

export interface Treaty {
  preamble: string;
  articles: TreatyArticle[];
  reservation: string;
}

export interface Archive {
  key: string;
  topic: Topic;
  messages: Message[];
  summary: string;
  verdict?: Verdict;
  closedAt: string;
  roundCount: number;
  summaryDegraded?: boolean;
  summaryReason?: string;
  verdictDegraded?: boolean;
  verdictReason?: string;
  treaty?: Treaty;
  treatyDegraded?: boolean;
  treatyReason?: string;
}

/** Contrat commun à toutes les routes susceptibles de basculer sur le secours local. */
export interface ApiEnvelope {
  source?: "remote" | "local";
  degraded?: boolean;
  kind?: string;
  reason?: string;
}

export interface Verdict {
  winnerId: string;
  winnerReason: string;
  agentScores: { [key: string]: number };
  agentBadges: { [key: string]: string };
  critiqueGénérale: string;
  keyCitation: string;
}

export type OpinionMetrics = { rigueur: number; ethique: number; pragmatisme: number; culture: number };

/** Phases du cycle de vie d'une séance. */
export type DebatePhase = "idle" | "running" | "paused" | "closing" | "closed";

/** Origine du sujet mis en débat. */
export type DebateMode = "temporal" | "custom" | "gemini-theme";


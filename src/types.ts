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
}

export interface Topic {
  id: number | string;
  category: string;
  title: string;
  description: string;
  isCustom?: boolean;
}

export interface Archive {
  key: string;
  topic: Topic;
  messages: Message[];
  summary: string;
  verdict?: Verdict;
  closedAt: string;
  roundCount: number;
}

export interface Verdict {
  winnerId: string;
  winnerReason: string;
  agentScores: { [key: string]: number };
  agentBadges: { [key: string]: string };
  critiqueGénérale: string;
  keyCitation: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  color: string;
  dim: string;
  border: string;
  symbol: string;
  badge: string;
  systemPrompt: string;
}

export type AlphabettePlanType = 
  | "trial_7d"               // Essai 7 jours offerts (Clé Alphabette incluse)
  | "individual_byok"        // Application Seule BYOK (39 € / an - Clé client)
  | "individual_confort"     // Application Seule Confort (59 € / an - Clé Alphabette incluse)
  | "bouquet_byok"           // Le Bouquet Alphabette BYOK (99 € / an - Toutes les apps avec clé client)
  | "bouquet_integral"       // Le Bouquet Alphabette Intégral (199 € / an - Toutes les apps avec clés incluses)
  // Rétrocompatibilité
  | "pass_alphabette"
  | "individual_iadebat";

export interface AlphabetteAccount {
  alphabetteId: string;
  email: string;
  name: string;
  organization?: string;
  plan: AlphabettePlanType;
  planTitle: string;
  priceAnnualEur: number;
  status: "active" | "trial" | "expired";
  createdAt: string;
  expiresAt: string;
  trialStartedAt: string;
  trialEndsAt: string;
  isTrialActive: boolean;
  accessibleApps: string[];
  sovereignSignature: string;
  lastOriginApp: string;
  exportCode: string;
  // Configuration Mistral AI (BYOK & Souveraineté RGPD)
  mistralApiKey?: string;
  mistralBaseUrl?: string; // https://api.mistral.ai/v1 ou http://localhost:11434/v1
  mistralModel?: string;   // mistral-large-latest, mistral-small-latest, etc.
}

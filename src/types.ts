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

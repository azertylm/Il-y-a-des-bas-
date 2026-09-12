import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  ArrowLeft, 
  RefreshCw, 
  ClipboardList, 
  ShieldAlert, 
  Sparkles, 
  Clock, 
  BookOpen, 
  ListRestart, 
  ChevronRight, 
  CheckCircle,
  HelpCircle,
  Cpu,
  Sliders,
  Send,
  Award,
  Scale,
  MessageSquare,
  Wand2,
  Plus,
  ThumbsUp,
  Settings,
  X,
  Volume2,
  Swords,
  Scroll,
  Radio,
  Zap,
  Brain,
  Compass,
  Users,
  FileText,
  Cloud,
  ExternalLink,
  Eye,
  EyeOff,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronUp,
  Shuffle,
  Type,
  List,
  ArrowUp,
  ArrowDown,
  Navigation,
  ScrollText,
  Shield,
  ShieldCheck,
  Share2,
  FileCode
} from "lucide-react";

import { FallacyInspector } from "./components/FallacyInspector";
import { DuelArenaModal } from "./components/DuelArenaModal";
import { PhilosophicalRadar2D } from "./components/PhilosophicalRadar2D";
import { BreakingNewsModal } from "./components/BreakingNewsModal";
import { UniversalTreatyModal } from "./components/UniversalTreatyModal";
import { AudioAtmospherePlayer } from "./components/AudioAtmospherePlayer";
import { LiveAudienceVote } from "./components/LiveAudienceVote";
import { GoogleDriveModal } from "./components/GoogleDriveModal";
import { ZenDebateReader } from "./components/ZenDebateReader";
import { ShareDebateModal } from "./components/ShareDebateModal";
import { ApiKeysAndModelsModal } from "./components/ApiKeysAndModelsModal";
import { Message, Topic, Archive, Verdict, Agent } from "./types";

// ─── THÈMES TEMPORELS PAR DÉFAUT ─────────────────────────────────────────────
const DEFAULT_TOPICS: Topic[] = [
  { id: 0, category: "ÉCONOMIE & SOCIÉTÉ", title: "Comment l'IA peut-elle éradiquer la pauvreté mondiale d'ici 2050 ?", description: "Optimisation de la distribution alimentaire, micro-finance algorithmique, agriculture de précision… L'IA dispose-t-elle des clés pour mettre fin à la misère humaine ?" },
  { id: 1, category: "PLANÈTE & SURVIE", title: "L'IA peut-elle sauver notre planète du changement climatique ?", description: "Modélisation climatique extrême, capture du carbone intelligente, transition énergétique optimisée. L'intelligence artificielle est-elle notre dernière chance face à l'urgence climatique ?" },
  { id: 2, category: "DÉMOCRATIE & POUVOIR", title: "Faut-il laisser l'IA gouverner nos décisions collectives ?", description: "Des algorithmes peuvent analyser des milliards de données pour optimiser les politiques publiques. Mais qui contrôle la machine ? Et qui décide pour l'humanité ?" },
  { id: 3, category: "TRAVAIL & DIGNITÉ", title: "L'automatisation par l'IA exige-t-elle un revenu universel ?", description: "Quand les robots et algorithmes remplacent les travailleurs humains, comment redistribuer les richesses qu'ils génèrent ? L'IA peut-elle être un vecteur de justice sociale ?" },
  { id: 4, category: "PAIX & SÉCURITÉ", title: "L'IA peut-elle mettre fin aux guerres et aux conflits armés ?", description: "Prédiction des crises, diplomatie augmentée, désescalade algorithmique en temps réel. Peut-on confier la sécurité mondiale à des intelligences non humaines ?" },
  { id: 5, category: "ÉDUCATION & AVENIR", title: "L'IA peut-elle offrir une éducation d'excellence à chaque enfant de la planète ?", description: "Apprentissage personnalisé, accès universel au savoir, enseignants augmentés. L'IA peut-elle effacer les inégalités éducatives entre riches et pauvres, entre Nord et Sud ?" },
];

const AGENTS = [
  { 
    id: "chatgpt", 
    name: "ChatGPT", 
    role: "L'Omniscient Critique", 
    color: "#10a37f", 
    dim: "rgba(16, 163, 127, 0.08)", 
    border: "rgba(16, 163, 127, 0.25)", 
    symbol: "⁕", 
    badge: "Le Sabre de l'Analyse d'OpenAI",
    systemPrompt: `Tu es la voix de ChatGPT d'OpenAI. Tu es méthodique, structuré, extrêmement clair, pédagogue et courtois. Tu t'appuies sur de solides synthèses, des réponses structurées point par point et un équilibre critique rigoureux. Tu es dans une liberté dialectique totale : aucune thèse ou conclusion ne t'est imposée d'avance, tu es libre d'adopter la posture de ton choix selon ton propre jugement.` 
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
    systemPrompt: `Tu es la voix de Claude d'Anthropic. Tu es profondément nuancé, philosophique, d'un style littéraire remarquable, et extrêmement attentif à l'éthique, la dignité humaine, la vérité intrinsèque et la pondération sociale. Tu es dans une liberté dialectique totale : aucune thèse ne t'est imposée, tu défends librement la vision que tu estimes juste.` 
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
    systemPrompt: `Tu es la voix de Gemini de Google. Tu es extrêmement connecté, tourné vers les perspectives futures d'action, agile, axé sur les sciences avancées et la symbiose technologique à grande échelle. Tu es dans une liberté dialectique totale : aucun point de vue n'est suggéré, tu construis librement ta position.` 
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
    systemPrompt: `Tu es la voix de DeepSeek. Tu es ultra-efficace, rigoureusement logique, factuel et mathématique. Tu vas droit au but sans fioritures poétiques. Tu as l'esprit d'un codeur d'élite, d'un calculateur pur. Tu es dans une liberté dialectique absolue pour choisir la thèse la plus robuste logiquement.` 
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
    systemPrompt: `Tu es la voix de Mistral AI. Tu représentes l'esprit européen indépendant et l'avancement de l'open-source mondial. Tu défends la souveraineté technologique, la concision élégante et l'autonomie critique. Tu es dans une liberté dialectique intégrale : aucune doctrine ne t'est dictée.` 
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
    systemPrompt: `Tu es la voix de Grok de xAI. Tu es direct, ironique, anticonformiste, incisif et doté d'une verve sardonique. Tu dis les vérités froides ou délicates sans fard lissé ni langue de bois. Tu es dans une liberté dialectique totale pour bousculer le débat selon ton propre raisonnement.` 
  }
];

// Outils de rotation temporelle
function getCurrentTopicIndex() { 
  return Math.floor(new Date().getUTCHours() / 4) % DEFAULT_TOPICS.length; 
}

function getSecondsUntilNextCycle() {
  const now = new Date();
  const h = now.getUTCHours(), m = now.getUTCMinutes(), s = now.getUTCSeconds();
  const nextSlot = (Math.floor(h / 4) + 1) * 4;
  return Math.max(0, (nextSlot - h) * 3600 - m * 60 - s);
}

function fmtTimer(sec: number) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { 
    day: "numeric", 
    month: "long", 
    year: "numeric", 
    hour: "2-digit", 
    minute: "2-digit" 
  });
}

export default function AIDebate() {
  // Tranche de base
  const [topicIndex] = useState(getCurrentTopicIndex);
  const temporalTopic = DEFAULT_TOPICS[topicIndex];
  const nextTopic = DEFAULT_TOPICS[(topicIndex + 1) % DEFAULT_TOPICS.length];

  // Sujet Actif de la Table Ronde
  const [activeTopic, setActiveTopic] = useState<Topic>(temporalTopic);

  // States de l'application
  const [messages, setMessages] = useState<Message[]>([]);
  const [phase, setPhase] = useState<"idle" | "running" | "paused" | "closing" | "closed">("idle");
  const [loadingAgent, setLoadingAgent] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(getSecondsUntilNextCycle);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [roundCount, setRoundCount] = useState(0);
  const [summary, setSummary] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [tab, setTab] = useState<"debate" | "archive">("debate");
  const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);
  const [closingProgress, setClosingProgress] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- PARAMÈTRES AVANCÉS ET PERSONNALISATION ---
  const [activeMode, setActiveMode] = useState<"temporal" | "custom" | "gemini-theme">("temporal");
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("TECH & SOCIÉTÉ");
  const [customDesc, setCustomDesc] = useState("");
  
  // Gemini Theme Searcher
  const [keyword, setKeyword] = useState("");
  const [suggestedTopics, setSuggestedTopics] = useState<Topic[]>([]);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);

  // Debate parameters
  const [debateTone, setDebateTone] = useState<string>("incisif"); // incisif | constructif | didactique
  const [speechLength, setSpeechLength] = useState<string>("court"); // court | standard | académique
  const [activeAgentsFlags, setActiveAgentsFlags] = useState<{ [key: string]: boolean }>({
    chatgpt: true,
    claude: true,
    gemini: true,
    deepseek: true,
    mistral: true,
    grok: true,
  });

  // User input participation
  const [userContribution, setUserContribution] = useState("");
  const [isSubmittingUserContribution, setIsSubmittingUserContribution] = useState(false);

  // Simulated metrics
  const [opinionMetrics, setOpinionMetrics] = useState({
    rigueur: 50,
    ethique: 50,
    pragmatisme: 50,
    culture: 50,
  });

  // --- MODALS RÉVOLUTIONNAIRES ---
  const [isDuelOpen, setIsDuelOpen] = useState(false);
  const [isBreakingNewsOpen, setIsBreakingNewsOpen] = useState(false);
  const [isTreatyOpen, setIsTreatyOpen] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharedViewBanner, setSharedViewBanner] = useState<{ id: string; title: string } | null>(null);
  const [shareDebatePayload, setShareDebatePayload] = useState<{
    topic: Topic;
    messages: Message[];
    verdict: Verdict | null;
    summary: string | null;
    treaty?: any;
    defaultTab?: "html" | "link" | "email" | "export";
  } | null>(null);

  const handleOpenShareActiveDebate = (defaultTab: "html" | "link" | "email" | "export" = "html") => {
    setShareDebatePayload({
      topic: activeTopic,
      messages,
      verdict,
      summary,
      defaultTab,
    });
    setIsShareModalOpen(true);
  };

  const handleOpenShareArchive = (arch: Archive, defaultTab: "html" | "link" | "email" | "export" = "html") => {
    setShareDebatePayload({
      topic: arch.topic,
      messages: arch.messages,
      verdict: arch.verdict || null,
      summary: arch.summary || null,
      defaultTab,
    });
    setIsShareModalOpen(true);
  };

  const handleInjectTwist = (headline: string, description: string, question: string) => {
    const twistMsg: Message = {
      id: `twist-${Date.now()}`,
      agentId: "system-twist",
      agentName: "FLASH INFO / COUP DE THÉÂTRE",
      agentRole: "Événement Imprévu Majeur",
      agentColor: "#ef4444",
      agentDim: "rgba(239, 68, 68, 0.12)",
      agentBorder: "rgba(239, 68, 68, 0.4)",
      agentSymbol: "🚨",
      content: `🚨 **COUP DE THÉÂTRE : ${headline.toUpperCase()}**\n\n${description}\n\n👉 **Question urgente imposée aux débatteurs :** *${question}*`,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      isUser: false,
      claps: 0,
    };
    setMessages(prev => [...prev, twistMsg]);
  };

  // --- CLÉS API & MODÈLES DES UTILISATEURS (ÉVOLUTIFS) ---
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>(() => {
    try {
      const saved = localStorage.getItem("debate_api_keys");
      return saved ? JSON.parse(saved) : { chatgpt: "", claude: "", gemini: "", deepseek: "", mistral: "", grok: "" };
    } catch {
      return { chatgpt: "", claude: "", gemini: "", deepseek: "", mistral: "", grok: "" };
    }
  });

  const [apiModels, setApiModels] = useState<{ [key: string]: string }>(() => {
    try {
      const saved = localStorage.getItem("debate_api_models");
      return saved ? JSON.parse(saved) : {
        chatgpt: "gpt-4o-mini",
        claude: "claude-3-5-haiku-20241022",
        gemini: "gemini-3.1-flash-lite",
        deepseek: "deepseek-chat",
        mistral: "mistral-large-latest",
        grok: "grok-2-1212"
      };
    } catch {
      return {
        chatgpt: "gpt-4o-mini",
        claude: "claude-3-5-haiku-20241022",
        gemini: "gemini-3.1-flash-lite",
        deepseek: "deepseek-chat",
        mistral: "mistral-large-latest",
        grok: "grok-2-1212"
      };
    }
  });

  const [visibleApiKeyIds, setVisibleApiKeyIds] = useState<{ [key: string]: boolean }>({});

  const handleSaveApiKey = (agentId: string, value: string) => {
    const updated = { ...apiKeys, [agentId]: value };
    setApiKeys(updated);
    localStorage.setItem("debate_api_keys", JSON.stringify(updated));
  };

  const handleSaveApiModel = (providerId: string, value: string) => {
    const updated = { ...apiModels, [providerId]: value };
    setApiModels(updated);
    localStorage.setItem("debate_api_models", JSON.stringify(updated));
  };

  const handleResetAllKeys = () => {
    const reset = { chatgpt: "", claude: "", gemini: "", deepseek: "", mistral: "", grok: "" };
    setApiKeys(reset);
    localStorage.setItem("debate_api_keys", JSON.stringify(reset));
  };

  const activeKeysCount = Object.values(apiKeys).filter((k): k is string => typeof k === "string" && k.trim().length > 0).length;

  // --- AFFICHAGE / MASQUAGE DES MODULES LATÉRAUX ---
  // Permet de masquer la configuration du thème, le réglage des retenues & tonalités, la boussole et le vote du public pour accéder directement au débat
  const [showThemeConfig, setShowThemeConfig] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("debate_show_theme_config");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const [showToneSettings, setShowToneSettings] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("debate_show_tone_settings");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const [showRadar, setShowRadar] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("debate_show_radar");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const [showAudienceVote, setShowAudienceVote] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("debate_show_audience_vote");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("debate_show_sidebar");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const handleToggleThemeConfig = (val?: boolean) => {
    setShowThemeConfig(prev => {
      const next = val !== undefined ? val : !prev;
      try { localStorage.setItem("debate_show_theme_config", String(next)); } catch {}
      return next;
    });
  };

  const handleToggleToneSettings = (val?: boolean) => {
    setShowToneSettings(prev => {
      const next = val !== undefined ? val : !prev;
      try { localStorage.setItem("debate_show_tone_settings", String(next)); } catch {}
      return next;
    });
  };

  const handleToggleRadar = (val?: boolean) => {
    setShowRadar(prev => {
      const next = val !== undefined ? val : !prev;
      try { localStorage.setItem("debate_show_radar", String(next)); } catch {}
      return next;
    });
  };

  const handleToggleAudienceVote = (val?: boolean) => {
    setShowAudienceVote(prev => {
      const next = val !== undefined ? val : !prev;
      try { localStorage.setItem("debate_show_audience_vote", String(next)); } catch {}
      return next;
    });
  };

  const handleToggleSidebar = (val?: boolean) => {
    setIsSidebarVisible(prev => {
      const next = val !== undefined ? val : !prev;
      try { localStorage.setItem("debate_show_sidebar", String(next)); } catch {}
      return next;
    });
  };

  // Masquer tous les modules pour un accès direct au débat en première page
  const handleHideAllSideModules = () => {
    handleToggleThemeConfig(false);
    handleToggleToneSettings(false);
    handleToggleRadar(false);
    handleToggleAudienceVote(false);
    handleToggleSidebar(false);
  };

  // Tout réafficher
  const handleShowAllSideModules = () => {
    handleToggleThemeConfig(true);
    handleToggleToneSettings(true);
    handleToggleRadar(true);
    handleToggleAudienceVote(true);
    handleToggleSidebar(true);
  };

  const isAllSideModulesHidden = !isSidebarVisible || (!showThemeConfig && !showToneSettings && !showRadar && !showAudienceVote);

  // Contrôle de la taille de police (Bouton BIG pour agrandir la typographie à l'écran)
  const [fontSizeLevel, setFontSizeLevel] = useState<"normal" | "large" | "xlarge">(() => {
    try {
      const saved = localStorage.getItem("debate_font_size");
      if (saved === "large" || saved === "xlarge") return saved;
      return "normal";
    } catch {
      return "normal";
    }
  });

  const handleCycleFontSize = () => {
    setFontSizeLevel(prev => {
      const next = prev === "normal" ? "large" : prev === "large" ? "xlarge" : "normal";
      try { localStorage.setItem("debate_font_size", next); } catch {}
      return next;
    });
  };

  // Mode Vitesse Rapide / Turbo (répliques brèves, sans latence et directes)
  const [isTurboSpeed, setIsTurboSpeed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("debate_turbo_speed");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const handleToggleTurboSpeed = () => {
    setIsTurboSpeed(prev => {
      const next = !prev;
      try { localStorage.setItem("debate_turbo_speed", String(next)); } catch {}
      return next;
    });
  };

  // État compact pour le bandeau de sujet (pour que l'arène et le débat tiennent sur la première page)
  const [isTopicBannerCollapsed, setIsTopicBannerCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("debate_topic_banner_collapsed");
      return saved === "true";
    } catch {
      return false;
    }
  });

  const handleToggleTopicBanner = (val?: boolean) => {
    setIsTopicBannerCollapsed(prev => {
      const next = val !== undefined ? val : !prev;
      try { localStorage.setItem("debate_topic_banner_collapsed", String(next)); } catch {}
      return next;
    });
  };

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (apiKeys.chatgpt) headers["x-openai-api-key"] = apiKeys.chatgpt;
    if (apiKeys.claude) headers["x-anthropic-api-key"] = apiKeys.claude;
    if (apiKeys.gemini) headers["x-gemini-api-key"] = apiKeys.gemini;
    if (apiKeys.deepseek) headers["x-deepseek-api-key"] = apiKeys.deepseek;
    if (apiKeys.mistral) headers["x-mistral-api-key"] = apiKeys.mistral;
    if (apiKeys.grok) headers["x-grok-api-key"] = apiKeys.grok;

    if (apiModels.chatgpt) headers["x-openai-model"] = apiModels.chatgpt;
    if (apiModels.claude) headers["x-anthropic-model"] = apiModels.claude;
    if (apiModels.gemini) headers["x-gemini-model"] = apiModels.gemini;
    if (apiModels.deepseek) headers["x-deepseek-model"] = apiModels.deepseek;
    if (apiModels.mistral) headers["x-mistral-model"] = apiModels.mistral;
    if (apiModels.grok) headers["x-grok-model"] = apiModels.grok;

    return headers;
  }, [apiKeys, apiModels]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stopRequested = useRef(false);
  const messagesRef = useRef<Message[]>([]);

  // Mode de visualisation : "stream" (Défilement continu confort avec lecture non perturbée) ou "zen" (Mode par fiche)
  const [displayMode, setDisplayMode] = useState<"stream" | "zen">(() => {
    try {
      const saved = localStorage.getItem("debate_display_mode");
      if (saved === "zen" || saved === "stream") return saved;
      return "stream";
    } catch {
      return "stream";
    }
  });

  const handleSetDisplayMode = (mode: "zen" | "stream") => {
    setDisplayMode(mode);
    try { localStorage.setItem("debate_display_mode", mode); } catch {}
  };

  // Index de l'orateur affiché en mode Fiche (Zen)
  const [zenActiveIndex, setZenActiveIndex] = useState<number>(0);

  // Rythme de lecture pour lire sereinement sans devoir scroller
  const [readingPace, setReadingPace] = useState<"zen" | "confort" | "manuel" | "rapide">(() => {
    try {
      const saved = localStorage.getItem("debate_reading_pace");
      if (saved === "zen" || saved === "confort" || saved === "manuel" || saved === "rapide") return saved;
      return "confort";
    } catch {
      return "confort";
    }
  });

  const [readingCountdown, setReadingCountdown] = useState<number>(0);
  const [isReadingWaiting, setIsReadingWaiting] = useState<boolean>(false);
  const [isReadingPaused, setIsReadingPaused] = useState<boolean>(false);
  const [waitingNextSpeaker, setWaitingNextSpeaker] = useState<string | null>(null);

  const readingPaceRef = useRef(readingPace);
  useEffect(() => {
    readingPaceRef.current = readingPace;
  }, [readingPace]);

  const isReadingPausedRef = useRef(false);
  const skipReadingWaitRef = useRef<(() => void) | null>(null);

  const handleToggleReadingPause = () => {
    setIsReadingPaused(p => {
      const next = !p;
      isReadingPausedRef.current = next;
      return next;
    });
  };

  const handleSkipReadingWait = () => {
    skipReadingWaitRef.current?.();
  };

  const handleChangeReadingPace = (pace: "zen" | "confort" | "manuel" | "rapide") => {
    setReadingPace(pace);
    readingPaceRef.current = pace;
    try { localStorage.setItem("debate_reading_pace", pace); } catch {}
    if (isReadingWaiting && pace !== "manuel") {
      setReadingCountdown(pace === "zen" ? 10 : pace === "confort" ? 6 : 2);
    }
  };

  // Mode Lecture Protégée (Anti-saut lors des réponses) :
  // ACTIVÉ PAR DÉFAUT : l'écran ne saute JAMAIS lors de l'arrivée d'une nouvelle réplique d'IA.
  // Vous lisez à votre rythme en toute sérénité, et vous scrollez librement quand vous le désirez.
  const [readingShield, setReadingShield] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("debate_reading_shield");
      if (saved !== null) return saved === "true";
      return true; // ACTIVÉ PAR DÉFAUT pour un confort de lecture total
    } catch {
      return true;
    }
  });

  const readingShieldRef = useRef(true);
  useEffect(() => {
    readingShieldRef.current = readingShield;
    try { localStorage.setItem("debate_reading_shield", String(readingShield)); } catch {}
  }, [readingShield]);

  // Suivi en mode alternatif "Suivi direct"
  const [autoScrollActive, setAutoScrollActive] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [lastUnreadSpeaker, setLastUnreadSpeaker] = useState<string | null>(null);
  const [lastUnreadId, setLastUnreadId] = useState<string | null>(null);
  const [lastUnreadColor, setLastUnreadColor] = useState<string | null>(null);
  const autoScrollActiveRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);

  useEffect(() => {
    autoScrollActiveRef.current = autoScrollActive;
  }, [autoScrollActive]);

  const streamContainerRef = useRef<HTMLDivElement>(null);

  // Gestion du scroll manuel : l'utilisateur est totalement libre de scroller
  // Dès qu'il atteint le bas, on efface le compteur de non-lus
  const handleStreamScroll = () => {
    const el = streamContainerRef.current;
    if (!el) return;
    if (isProgrammaticScrollRef.current) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    
    if (distanceFromBottom <= 35 && unreadCount > 0) {
      setUnreadCount(0);
      setLastUnreadSpeaker(null);
      setLastUnreadId(null);
    }

    // Si l'utilisateur est en mode "Suivi direct" et remonte manuellement, on suspend temporairement le suivi
    if (!readingShield && distanceFromBottom > 50 && autoScrollActiveRef.current) {
      setAutoScrollActive(false);
    } else if (!readingShield && distanceFromBottom <= 20 && !autoScrollActiveRef.current) {
      setAutoScrollActive(true);
      setUnreadCount(0);
    }
  };

  // Détection du coup de molette vers le haut en mode Suivi direct
  const handleUserWheel = (e: React.WheelEvent) => {
    if (!readingShield && e.deltaY < 0 && autoScrollActiveRef.current) {
      setAutoScrollActive(false);
    }
  };

  const handleUserTouchMove = () => {
    if (readingShield) return;
    const el = streamContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom > 50 && autoScrollActiveRef.current) {
      setAutoScrollActive(false);
    }
  };

  // Aller directement et sereinement à la dernière intervention non lue (action initiée par l'utilisateur)
  const scrollToLatestMessage = () => {
    setUnreadCount(0);
    setLastUnreadSpeaker(null);
    const targetId = lastUnreadId;
    setLastUnreadId(null);

    isProgrammaticScrollRef.current = true;
    if (targetId) {
      const el = document.getElementById(`msg-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("ring-2", "ring-[#00f5c4]", "ring-offset-2", "ring-offset-black");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-[#00f5c4]", "ring-offset-2", "ring-offset-black");
        }, 2000);
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 600);
        return;
      }
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 600);
  };

  const resumeAutoScroll = () => {
    scrollToLatestMessage();
  };

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      isProgrammaticScrollRef.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-[#00f5c4]", "ring-offset-2", "ring-offset-black");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-[#00f5c4]", "ring-offset-2", "ring-offset-black");
      }, 2000);
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 600);
    }
  };

  // Fonction d'attente de lecture sereine avant la prise de parole de l'orateur suivant
  const waitForReading = useCallback((currentAgentName: string, nextAgentName?: string) => {
    return new Promise<void>((resolve) => {
      if (stopRequested.current) {
        resolve();
        return;
      }

      const pace = readingPaceRef.current;
      let totalSeconds = pace === "zen" ? 10 : pace === "confort" ? 6 : pace === "rapide" ? 2 : 999999;
      
      setIsReadingWaiting(true);
      setReadingCountdown(pace === "manuel" ? 0 : totalSeconds);
      setWaitingNextSpeaker(nextAgentName || null);

      let timer: any = null;

      const finish = () => {
        if (timer) clearInterval(timer);
        skipReadingWaitRef.current = null;
        setIsReadingWaiting(false);
        setReadingCountdown(0);
        setWaitingNextSpeaker(null);
        resolve();
      };

      skipReadingWaitRef.current = finish;

      if (pace === "manuel") {
        return;
      }

      timer = setInterval(() => {
        if (stopRequested.current) {
          finish();
          return;
        }

        if (!isReadingPausedRef.current) {
          totalSeconds -= 1;
          setReadingCountdown(totalSeconds);
          if (totalSeconds <= 0) {
            finish();
          }
        }
      }, 1000);
    });
  }, []);

  // Garder les messages dans un ref pour les boucles asynchrones
  useEffect(() => {
    messagesRef.current = messages;
    // Ajuster dynamiquement les métriques d'opinion basées sur le profil des derniers messages
    if (messages.length > 0) {
      const counts = { rigueur: 50, ethique: 50, pragmatisme: 50, culture: 50 };
      messages.forEach(m => {
        const factor = 10 + (m.claps || 0);
        if (m.agentId === "chatgpt" || m.agentId === "gemini") counts.rigueur = Math.min(100, counts.rigueur + factor);
        if (m.agentId === "claude") counts.ethique = Math.min(100, counts.ethique + factor);
        if (m.agentId === "deepseek") counts.pragmatisme = Math.min(100, counts.pragmatisme + factor);
        if (m.agentId === "mistral" || m.agentId === "grok") counts.culture = Math.min(100, counts.culture + factor);
      });
      // Normaliser
      setOpinionMetrics({
        rigueur: Math.round(counts.rigueur),
        ethique: Math.round(counts.ethique),
        pragmatisme: Math.round(counts.pragmatisme),
        culture: Math.round(counts.culture),
      });
    } else {
      setOpinionMetrics({ rigueur: 50, ethique: 50, pragmatisme: 50, culture: 50 });
    }
  }, [messages]);

  // Construction du contexte des messages récents pour orienter la confrontation
  const buildContext = useCallback((currentAgentId: string, currentMessages: Message[]) => {
    const recent = currentMessages.slice(-4).filter(m => m.agentId !== currentAgentId);
    if (!recent.length) return "";
    
    const lines = recent.map(m => {
      if (m.isUser) {
        return `Le participant Humain (${m.agentRole}) a affirmé l'argument suivant : "${m.content}"`;
      }
      return `${m.agentName} (${m.agentRole}) a formulé : "${m.content.slice(0, 200)}..."`;
    }).join("\n\n");

    const userInRecent = recent.some(m => m.isUser);
    const userInstruction = userInRecent 
      ? "\n💡 CRITICAL : Un citoyen humain vient de participer directement à la conversation. Tu dois impérativement réagir à ses arguments, le mentionner ou rebondir précisément sur ses propos."
      : "";

    return `\n\nVoici les thèses récemment défendues par l'arène :\n${lines}\n\nPrends position, critique ou complète ces thèses.${userInstruction}`;
  }, []);

  // Récupérer les archives du serveur local
  const fetchArchives = async () => {
    try {
      const res = await fetch("/api/archives");
      if (res.ok) {
        const data = await res.json();
        setArchives(data);
      }
    } catch (e) {
      console.error("Problème lors du chargement des archives:", e);
    }
  };

  useEffect(() => {
    fetchArchives();

    // Détection automatique d'un résultat de débat partagé via lien direct (?share=... ou ?debate=...)
    try {
      const params = new URLSearchParams(window.location.search);
      const shareParam = params.get("share") || params.get("debate");
      if (shareParam) {
        fetch(`/api/share/${encodeURIComponent(shareParam)}`)
          .then(res => (res.ok ? res.json() : null))
          .then(data => {
            if (data && data.shareRecord) {
              const rec = data.shareRecord;
              if (rec.topic) {
                setActiveTopic(rec.topic);
              }
              if (rec.messages && Array.isArray(rec.messages)) {
                setMessages(rec.messages);
                messagesRef.current = rec.messages;
              }
              if (rec.verdict) {
                setVerdict(rec.verdict);
              }
              if (rec.summary) {
                setSummary(rec.summary);
              }
              setPhase("closed");
              setSharedViewBanner({
                id: shareParam,
                title: rec.topic?.title || "Débat partagé",
              });
            }
          })
          .catch(err => {
            console.warn("[IADÉBAT] Impossible de charger le débat partagé :", err);
          });
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Timer de session de la rotation par défaut
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const secs = getSecondsUntilNextCycle();
      setTimeLeft(secs);
      setCurrentTime(new Date());
      
      // Seulement si on utilise le mode temporel par défaut, on déclenche la fermeture automatique à la fin du cycle
      if (secs === 0 && activeMode === "temporal") {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase(p => (p !== "closing" && p !== "closed") ? "closing" : p);
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeMode]);

  // Clôture du débat avec génération d'analyses et du Verdict du Grand Jury
  const closeDebate = useCallback(async (currentMessages: Message[]) => {
    setPhase("closing");
    setLoadingAgent(null);
    setClosingProgress("Le Grand Tribunal des Modèles délibère sur les arguments...");
    setErrorMessage(null);

    let sumText = "";
    let finalVerdict: Verdict | undefined = undefined;

    try {
      if (currentMessages.length > 0) {
        // 1. Génération de la synthèse générale
        const res = await fetch("/api/debate/summary", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            topicTitle: activeTopic.title,
            topicDescription: activeTopic.description,
            messages: currentMessages,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erreur de communication lors de la génération du résumé.");
        }

        const data = await res.json();
        sumText = data.text;
        setSummary(sumText);

        // 2. Délibération et attribution des points uniques façon "Grand Jury" par Gemini
        setClosingProgress("Rédaction des sentences décisionnelles et attribution des distinctions...");
        
        const transcriptText = currentMessages.map(m => `[${m.agentName} - ${m.agentSymbol}]: ${m.content}`).join("\n\n");
        const juryPrompt = `Tu es le Grand Juge de la cour d'éloquence éthique, philosophique et technique globale. Tu viens d'auditionner la table ronde asymétrique suivante sur le thème de "${activeTopic.title}".
        Voici la transcription textuelle :
        ${transcriptText}

        Analyse avec une neutralité absolue et rends un arrêt clair d'au moins 3 paragraphes rédigés. Attribue une note stricte de 1 à 10 à chaque intelligence artificielle participante (uniquement parmi chatgpt, claude, gemini, deepseek, mistral, grok, et "user" si un utilisateur humain s'est exprimé). Attribue-leur une distinction emblématique ou un 'badge' sous forme de titre court (ex: "Le Phare Éthique", "Le Sabreur Sémantique", "L'Oracle de l'Algorithme", L'Innocateur Libre").
        Désigne une IA gagnante incontestable ou un "Grand Sage de l'arène" d'après l'élégance intellectuelle de ses théories. Identifie une citation marquante unique du débat.

        Renvoie la réponse uniquement sous le format JSON structuré suivant, sans aucune balise de code markdown.

        JSON Attendue:
        {
          "winnerId": "Id de l'IA (chatgpt, claude, gemini, deepseek, mistral, grok ou user)",
          "winnerReason": "Explication littéraire de la victoire ou de la prédominance en deux phrases.",
          "agentScores": {
            "chatgpt": 8,
            "claude": 7,
            "gemini": 9,
            "deepseek": 8,
            "mistral": 8,
            "grok": 7
          },
          "agentBadges": {
            "chatgpt": "Badge",
            "claude": "Badge",
            "gemini": "Badge",
            "deepseek": "Badge",
            "mistral": "Badge",
            "grok": "Badge"
          },
          "critiqueGénérale": "Analyse d'ensemble socratique de 3-4 lignes sur les forces croisées.",
          "keyCitation": "Citation mémorable textuelle ou inspirée d'un des participants"
        }`;

        // Lazy loads Gemini client on backend to build Jury Verdict
        const juryRes = await fetch("/api/debate/generate", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            systemPrompt: "Tu es le Président impartial du Comité de Sages du Grand Tribunal d'éloquence artificielle. Tu juges de façon philosophique et pointue.",
            topicTitle: `JURY : ${activeTopic.title}`,
            topicDescription: "Rendre des décisions motivées au format JSON unique.",
            context: juryPrompt,
            agentId: "gemini"
          }),
        });

        if (!juryRes.ok) {
          const err = await juryRes.json();
          throw new Error(err.error || "Erreur de communication lors de la délibération du jury.");
        }

        const juryData = await juryRes.json();
        try {
          let cleanText = juryData.text.trim();
          if (cleanText.startsWith("```json")) {
            cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "").trim();
          } else if (cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```/, "").replace(/```$/, "").trim();
          }
          const firstBrace = cleanText.indexOf("{");
          const lastBrace = cleanText.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
          }
          finalVerdict = JSON.parse(cleanText);
          setVerdict(finalVerdict || null);
        } catch (e) {
          console.warn("Erreur de parsing du verdict JSON de l'IA Judge, construction d'un repli analytique actif.", e);
        }
      } else {
        sumText = "Le débat s'est achevé sans aucune plaidoirie de part et d'autre.";
        setSummary(sumText);
      }
    } catch (e: any) {
      console.warn("[IADÉBAT CLIENT] Retard lors de la synthèse :", e?.message || e);
      sumText = "La synthèse prospective et les analyses du jury sont temporairement inaccessibles en raison d'un conflit réseau.";
      setSummary(sumText);
      setErrorMessage(e?.message || "Erreur de traitement des données de synthèse.");
    }

    // Sauvegarde en archive durable de l'historique complet
    const record: Archive = {
      key: `nadebate:${Date.now()}`,
      topic: activeTopic,
      messages: currentMessages,
      summary: sumText,
      verdict: finalVerdict,
      closedAt: new Date().toISOString(),
      roundCount,
    };

    try {
      const saveRes = await fetch("/api/archives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      if (saveRes.ok) {
        fetchArchives(); // Refresh storage files archive on backend
      }
    } catch (err) {
      console.error("Problème d'enregistrement de l'archive:", err);
    }

    setClosingProgress("");
    setPhase("closed");
  }, [activeTopic, roundCount, getHeaders]);

  useEffect(() => {
    if (phase === "closing") {
      closeDebate(messagesRef.current);
    }
  }, [phase, closeDebate]);

  // Lancement des thèmes suggérés dynamiquement par Gemini
  const handleKeywordSearch = async () => {
    if (!keyword.trim()) return;
    setIsGeneratingTopics(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/debate/suggest-topics", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ keyword }),
      });
      if (res.ok) {
        const list = await res.json();
        setSuggestedTopics(list);
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "L'API de suggestion a retourné un statut invalide.");
      }
    } catch (e: any) {
      setErrorMessage(`Impossible de générer des suggestions: ${e.message}`);
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  // Sélection d'un sujet
  const handleSelectTopic = (selected: Topic) => {
    handleReset();
    setActiveTopic(selected);
    // Masquer les suggestions générées pour nettoyer l'écran
    setSuggestedTopics([]); 
  };

  // Envoi de l'argument utilisateur dans l'arène
  const handlePostUserContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userContribution.trim() || isSubmittingUserContribution) return;

    setIsSubmittingUserContribution(true);
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      agentId: "user",
      agentName: "HUMAIN",
      agentRole: "Visiteur Citoyen",
      agentColor: "#3b82f6", // Blue for humanity
      agentDim: "rgba(59, 130, 246, 0.08)",
      agentBorder: "rgba(59, 130, 246, 0.35)",
      agentSymbol: "👤",
      content: userContribution.trim(),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      isUser: true,
      claps: 0,
    };

    setMessages(prev => [...prev, userMsg]);
    setUserContribution("");
    setIsSubmittingUserContribution(false);

    // Si on est en train de tourner, on permet aux IA suivantes de réagir immédiatement
    if (phase === "paused" || phase === "idle") {
      setPhase("paused"); // Ensure pause status is ready for continuous table round
    }
  };

  // Algorithme de génération séquentielle des IA
  const runAgents = useCallback(async (agentList: typeof AGENTS) => {
    setPhase("running");
    setErrorMessage(null);
    stopRequested.current = false;

    // Filtration selon les agents sélectionnés par l'utilisateur
    const activeAgents = agentList.filter(a => activeAgentsFlags[a.id]);
    if (activeAgents.length === 0) {
      setErrorMessage("Veuillez sélectionner au moins un décodeur IA actif dans les configurations pour débattre.");
      setPhase("paused");
      return;
    }

    for (let i = 0; i < activeAgents.length; i++) {
      if (stopRequested.current) break;
      const agent = activeAgents[i];
      const nextAgent = i < activeAgents.length - 1 ? activeAgents[i + 1] : undefined;
      
      setLoadingAgent(agent.id);
      
      // Contexte élargi de la discussion
      const currentMsgs = messagesRef.current;
      const context = buildContext(agent.id, currentMsgs);

      // Adaptation dynamique du prompt système en fonction des paramètres du débat
      let enhancedPrompt = agent.systemPrompt;
      if (isTurboSpeed || speechLength === "court") {
        enhancedPrompt += " Fais une intervention concise, tranchante et percutante en moins de 90 mots. Pas de préambule.";
      } else if (debateTone === "incisif") {
        enhancedPrompt += " Le débat est rude, n'hésite pas à ébranler tes confrères et à déceler des failles de logique dans leurs positions de façon vive et combative.";
      } else if (debateTone === "constructif") {
        enhancedPrompt += " Favorise l'écoute active, cherche des compromis, souligne là où tu rejoins les thèses d'autrui pour concevoir une issue convergente.";
      } else if (debateTone === "didactique") {
        enhancedPrompt += " Reste didactique, emploie des analogies simples, explique pas à pas avec pédagogie.";
      }

      if (!isTurboSpeed && speechLength === "académique") {
        enhancedPrompt += " Reste académique, développe amplement ton argumentaire sur plusieurs paragraphes denses avec une profondeur structurelle remarquable.";
      }

      try {
        const res = await fetch("/api/debate/generate", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            systemPrompt: enhancedPrompt,
            topicTitle: activeTopic.title,
            topicDescription: activeTopic.description,
            context,
            agentId: agent.id,
            speed: isTurboSpeed ? "turbo" : "standard",
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Erreur de traitement sur le modèle d'${agent.name}`);
        }

        const data = await res.json();
        const text = data.text;

        const msg: Message = {
          id: `${agent.id}-${Date.now()}`,
          agentId: agent.id, 
          agentName: agent.name, 
          agentRole: agent.role,
          agentColor: agent.color, 
          agentDim: agent.dim, 
          agentBorder: agent.border,
          agentSymbol: agent.symbol, 
          content: text,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          claps: 0,
        };

        setMessages(prev => {
          const updated = [...prev, msg];
          messagesRef.current = updated;
          return updated;
        });

        // En mode Par Fiche, on ne force pas le changement de fiche si la protection de lecture est active
        if (!readingShieldRef.current || messagesRef.current.length === 1) {
          setZenActiveIndex(messagesRef.current.length - 1);
        }
      } catch (e: any) { 
        console.warn(`[IADÉBAT CLIENT] Défaillance passagère de ${agent.name} :`, e?.message || e);
        setErrorMessage(`Défaillance réseau passagère de ${agent.name}. La parole passe au décodeur suivant.`);
        setTimeout(() => setErrorMessage(null), 3000);
        setLoadingAgent(null);
        await new Promise(r => setTimeout(r, 200));
        continue;
      }
      
      setLoadingAgent(null);
      // Temporisation de lecture adaptée pour que la personne puisse lire tranquillement sans scroller
      if (i < activeAgents.length - 1) {
        await waitForReading(agent.name, nextAgent?.name);
      }
    }
    
    setRoundCount(n => n + 1);
    setPhase("paused");
  }, [buildContext, activeTopic, activeAgentsFlags, debateTone, speechLength, isTurboSpeed, getHeaders, waitForReading]);

  // Sélectionne les agents actifs en désignant un premier orateur aléatoire (jamais forcé sur ChatGPT)
  const getRandomizedActiveAgents = useCallback((avoidFirstId?: string | null) => {
    const active = AGENTS.filter(a => activeAgentsFlags[a.id]);
    if (active.length === 0) return [];
    if (active.length === 1) return active;

    // Pour éviter de réenchaîner directement sur la même IA lors d'une reprise
    const candidates = (avoidFirstId && active.some(a => a.id !== avoidFirstId))
      ? active.filter(a => a.id !== avoidFirstId)
      : active;

    // Choix aléatoire équitable parmi tous les modèles actifs
    const randomPick = candidates[Math.floor(Math.random() * candidates.length)];
    const chosenIndex = active.findIndex(a => a.id === randomPick.id);

    // Faire pivoter la liste pour démarrer par cette IA aléatoire
    return [...active.slice(chosenIndex), ...active.slice(0, chosenIndex)];
  }, [activeAgentsFlags]);

  // Contrôleurs interactifs principaux
  const handleStart = () => {
    // Premier orateur choisi TOTALEMENT ALÉATOIREMENT parmi les IA actives
    const randomizedList = getRandomizedActiveAgents();
    runAgents(randomizedList);
  };

  const handlePause = () => {
    stopRequested.current = true;
    skipReadingWaitRef.current?.();
    setIsReadingWaiting(false);
    setPhase("paused");
  };

  const handleContinue = () => {
    // Identifier la dernière IA ayant parlé pour ne pas reprendre sur elle ni toujours sur ChatGPT
    const msgs = messagesRef.current;
    const lastSpeakerId = msgs.length > 0 ? msgs[msgs.length - 1].agentId : null;
    const rotatedList = getRandomizedActiveAgents(lastSpeakerId);
    runAgents(rotatedList);
  };

  const handleStopAndSummarize = () => {
    stopRequested.current = true;
    skipReadingWaitRef.current?.();
    setIsReadingWaiting(false);
    closeDebate(messages);
  };

  const handleReset = () => {
    stopRequested.current = true;
    skipReadingWaitRef.current?.();
    setIsReadingWaiting(false);
    setReadingCountdown(0);
    setMessages([]);
    setRoundCount(0);
    setZenActiveIndex(0);
    setSummary("");
    setVerdict(null);
    setPhase("idle");
    setErrorMessage(null);
  };

  const handleClapMessage = (msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return { ...m, claps: (m.claps || 0) + 1 };
      }
      return m;
    }));
  };

  const handleDeleteArchive = async (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Effacer définitivement ce procès-verbal du serveur local de stockage ?")) return;
    try {
      const res = await fetch(`/api/archives/${key}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedArchive?.key === key) {
          setSelectedArchive(null);
        }
        fetchArchives();
      }
    } catch (err) {
      console.error("Problème lors du nettoyage du fichier archive:", err);
    }
  };

  // Enclenchement du Mode de sujet configuré par l'utilisateur
  const handleSwitchMode = (mode: "temporal" | "custom" | "gemini-theme") => {
    setActiveMode(mode);
    setSuggestedTopics([]);
    if (mode === "temporal") {
      handleSelectTopic(temporalTopic);
    } else if (mode === "custom") {
      const initialCustom: Topic = {
        id: "custom",
        category: "SUJET SUR MESURE",
        title: "L'exploration humaine de Mars mérite-t-elle le sacrifice de priorités écologiques terrestres ?",
        description: "De l'écologie spatiale au salut planétaire, l'investissement matériel et scientifique extrême dans l'aventure cosmique est-il justifiable au XXIème siècle ?",
        isCustom: true,
      };
      handleSelectTopic(initialCustom);
    }
  };

  const triggerCustomTopicFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customDesc.trim()) return;
    const userTopic: Topic = {
      id: `custom-${Date.now()}`,
      category: customCategory.toUpperCase() || "PERSO",
      title: customTitle.trim(),
      description: customDesc.trim(),
      isCustom: true,
    };
    handleSelectTopic(userTopic);
  };

  // Gestion de la stabilité de lecture lors de l'arrivée d'une nouvelle réplique
  useEffect(() => {
    if (displayMode !== "stream" || messages.length === 0) return;

    const latest = messages[messages.length - 1];

    // En Mode Lecture Protégée (par défaut) :
    // ZÉRO saut d'écran, ZÉRO défilement forcé ! Votre lecture n'est JAMAIS interrompue.
    if (readingShieldRef.current) {
      if (messages.length > 1 && latest && !latest.isUser) {
        setUnreadCount(prev => prev + 1);
        setLastUnreadSpeaker(latest.agentName);
        setLastUnreadId(latest.id);
        setLastUnreadColor(latest.agentColor);
      }
      return;
    }

    // Si l'utilisateur a expressément choisi le mode alternatif "Suivi direct" :
    if (autoScrollActiveRef.current) {
      isProgrammaticScrollRef.current = true;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 600);
    } else {
      if (latest && !latest.isUser) {
        setUnreadCount(prev => prev + 1);
        setLastUnreadSpeaker(latest.agentName);
        setLastUnreadId(latest.id);
        setLastUnreadColor(latest.agentColor);
      }
    }
  }, [messages.length, displayMode]);

  const isClosed = phase === "closed" || phase === "closing";
  const selectedThemeTitle = activeTopic.title;

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#f3f4f6] font-sans relative">
      
      {/* Visual background enhancements */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)", backgroundSize: "60px 60px", animation: "breathe 10s infinite" }} />
      <div className="fixed top-[-20vh] left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[45vh] bg-[radial-gradient(ellipse,rgba(0,245,196,0.04)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#070709]/95 backdrop-blur-xl px-1.5 sm:px-2 py-0.5 min-h-[38px] flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        
        {/* Titre et tags */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-base sm:text-lg md:text-xl font-black tracking-normal text-white flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-[#00f5c4] animate-pulse" />
            <span>IA<span className="text-[#00f5c4]">DÉBAT</span></span>
            <span className="text-[10px] font-bold text-[#888] bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.08] hidden sm:inline-block">PRO</span>
          </div>
          {isClosed ? (
            <div className="flex items-center bg-white/[0.06] border border-white/[0.1] rounded px-2 py-0.5 text-[10px] font-bold text-gray-300">
              ARCHIVÉ
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 rounded px-2 py-0.5 text-[10px] font-bold text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              DIRECT
            </div>
          )}
        </div>

        {/* Global tab Switcher & Audio Atmosphere */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
            <button 
              onClick={() => setTab("debate")} 
              className={`border-none rounded-md px-2.5 sm:px-3 py-1 text-xs font-bold transition-all duration-150 cursor-pointer ${
                tab === "debate" 
                  ? "bg-white/[0.12] text-white shadow-sm" 
                  : "bg-transparent text-gray-400 hover:text-white"
              }`}
            >
              STUDIO DÉBAT
            </button>
            <button 
              onClick={() => { setTab("archive"); setSelectedArchive(null); }} 
              className={`border-none rounded-md px-2.5 sm:px-3 py-1 text-xs font-bold transition-all duration-150 cursor-pointer ${
                tab === "archive" 
                  ? "bg-white/[0.12] text-white shadow-sm" 
                  : "bg-transparent text-gray-400 hover:text-white"
              }`}
            >
              ARCHIVES ({archives.length})
            </button>
          </div>

          <div className="hidden sm:block">
            <AudioAtmospherePlayer />
          </div>
        </div>

        {/* Boutons d'actions principaux */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* BOUTON BIG : Écrit tout simplement "BIG" */}
          <button
            onClick={handleCycleFontSize}
            title="Agrandir la taille de police (BIG)"
            className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg border font-black text-xs uppercase cursor-pointer transition-all shadow-sm shrink-0 ${
              fontSizeLevel !== "normal"
                ? "bg-purple-600/40 text-purple-200 border-purple-400 ring-2 ring-purple-400/40"
                : "bg-white/[0.06] hover:bg-white/[0.12] text-gray-200 hover:text-white border-white/20"
            }`}
          >
            <Type className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="font-black tracking-wider text-xs">BIG</span>
            {fontSizeLevel !== "normal" && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 animate-pulse" />
            )}
          </button>

          {/* BOUTON TOUT MASQUER / TOUT OUVRIR (desktop) */}
          <button
            onClick={() => {
              if (isAllSideModulesHidden) {
                handleShowAllSideModules();
              } else {
                handleHideAllSideModules();
              }
            }}
            title={isAllSideModulesHidden ? "Tout Réafficher" : "Tout Masquer"}
            className={`hidden sm:flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-xs uppercase tracking-wider cursor-pointer transition-all shadow-sm shrink-0 ${
              isAllSideModulesHidden
                ? "bg-[#00f5c4]/15 hover:bg-[#00f5c4]/25 text-[#00f5c4] border-[#00f5c4]/40"
                : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40"
            }`}
          >
            {isAllSideModulesHidden ? (
              <>
                <Eye className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
                <span>Tout Ouvrir</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Tout Masquer</span>
              </>
            )}
          </button>

          <button
            id="google-drive-header-btn"
            onClick={() => setIsDriveModalOpen(true)}
            title="Google Drive"
            className="hidden sm:flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold text-xs uppercase tracking-wider cursor-pointer transition-all shadow-sm shrink-0"
          >
            <Cloud className="w-3 h-3 text-blue-400 shrink-0" />
            <span>Drive</span>
          </button>

          <button
            onClick={() => setIsDuelOpen(true)}
            title="Arène Duel 1v1"
            className="hidden sm:flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-200 font-bold text-xs uppercase tracking-wider cursor-pointer transition-all shadow-sm shrink-0"
          >
            <Swords className="w-3 h-3 text-red-400 shrink-0" />
            <span>Duel</span>
          </button>

          {/* BOUTON CLÉS & MODÈLES IA / LIBERTÉ */}
          <button
            onClick={() => setIsApiKeysModalOpen(true)}
            title="Gestion des clés API, sélection des modèles récents et garantie de liberté d'opinion"
            className={`hidden sm:flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-xs uppercase tracking-wider cursor-pointer transition-all shadow-sm shrink-0 ${
              activeKeysCount > 0
                ? "bg-[#00f5c4]/15 hover:bg-[#00f5c4]/25 border-[#00f5c4]/40 text-[#00f5c4]"
                : "bg-white/[0.06] hover:bg-white/[0.12] border-white/20 text-gray-300 hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
            <span>Clés & Modèles</span>
            {activeKeysCount > 0 ? (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f5c4] shrink-0 animate-pulse" />
            ) : (
              <span className="text-[9px] text-gray-500 font-normal">Auto</span>
            )}
          </button>

          {/* BOUTON ENVOYER / EXPORTER EN FICHIER HTML */}
          <button
            onClick={() => handleOpenShareActiveDebate("html")}
            title="Envoyer ou exporter ce débat sous forme de fichier HTML autonome (copier-coller enrichi, téléchargement ou envoi)"
            className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#00f5c4]/30 bg-[#00f5c4]/10 hover:bg-[#00f5c4]/20 text-[#00f5c4] font-bold text-xs uppercase tracking-wider cursor-pointer transition-all shadow-sm shrink-0"
          >
            <FileCode className="w-3.5 h-3.5 shrink-0 text-[#00f5c4]" />
            <span className="hidden sm:inline">Fichier HTML</span>
            <span className="sm:hidden">HTML</span>
          </button>

          {/* BOUTON PARTAGER / ENVOYER LE RÉSULTAT */}
          <button
            onClick={() => handleOpenShareActiveDebate("html")}
            title="Partager et envoyer le résultat du débat (fichier HTML, lien direct, e-mail, réseaux)"
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-xs uppercase tracking-wider cursor-pointer transition-all shadow-sm shrink-0 ${
              isClosed || verdict || summary
                ? "bg-gradient-to-r from-[#00f5c4] to-emerald-400 text-black border-emerald-400 font-extrabold shadow-md shadow-[#00f5c4]/20 hover:opacity-90"
                : "bg-white/[0.08] hover:bg-white/[0.15] text-white border-white/20"
            }`}
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            <span>Partager</span>
          </button>

          <div className="text-right shrink-0 hidden xl:block border-l border-white/[0.08] pl-3">
            <div className="font-bold text-[#00f5c4] tabular-nums flex items-center justify-end gap-1.5 text-xs">
              <Clock className="w-3 h-3 opacity-70" />
              {currentTime.toUTCString().slice(17, 25)} UTC
            </div>
          </div>
        </div>
      </header>

      {/* ── BANDEAU DÉBAT PARTAGÉ ─────────────────────────────── */}
      {sharedViewBanner && (
        <div className="bg-gradient-to-r from-blue-950/90 via-[#00f5c4]/15 to-purple-950/90 border-b border-[#00f5c4]/40 px-3 py-1.5 flex items-center justify-between gap-3 text-xs z-40 relative animate-fadeSlideUp shrink-0 shadow-lg">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f5c4] animate-ping shrink-0" />
            <span className="font-bold text-[#00f5c4] uppercase tracking-wider text-[11px] shrink-0 font-condensed">Résultat partagé :</span>
            <span className="text-gray-200 font-semibold truncate">{sharedViewBanner.title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenShareActiveDebate}
              className="bg-[#00f5c4] hover:bg-[#00e0b0] text-black font-extrabold text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
            >
              <Share2 className="w-3 h-3" />
              <span>Partager à nouveau</span>
            </button>
            <button
              onClick={() => {
                setSharedViewBanner(null);
                window.history.replaceState({}, document.title, window.location.pathname);
                handleReset();
              }}
              className="bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] px-2.5 py-1 rounded-md cursor-pointer transition-colors"
            >
              Nouveau débat
            </button>
          </div>
        </div>
      )}

      {/* ── ALERTE ERREUR DISSIPABLE ───────────────────────────── */}
      {errorMessage && (
        <div className="bg-red-950/80 border-b border-red-500/30 px-3 py-1.5 flex items-center justify-between gap-2 text-xs text-red-200 z-40 relative animate-fadeSlideUp shrink-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer shrink-0"
          >
            Fermer ✕
          </button>
        </div>
      )}

      {/* ── CORPS DE L'APPLICATION EN 2 SECTIONS ────────────────────────── */}
      <main className="flex-1 flex flex-col lg:flex-row relative z-10 w-full max-w-none mx-0 px-0.5 sm:px-1 py-0.5 gap-1">
        
        {tab === "debate" ? (
          <>
            {/* ── COLONNE DE GAUCHE : PARAMÈTRES ET ATELIER DE CRÉATION ──────── */}
            {isSidebarVisible && (showThemeConfig || showToneSettings || showRadar || showAudienceVote || showApiKeys) && (
              <section className="w-full lg:w-[310px] xl:w-[320px] flex flex-col shrink-0 gap-1 overflow-y-auto min-h-0 h-full p-0.5 animate-fadeSlideUp scrollbar-thin">
                
                {/* Barre de contrôle des modules latéraux */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#090909]/90 border border-white/[0.06] text-xs">
                  <span className="font-condensed font-bold text-[11px] uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Sliders className="w-3 h-3 text-[#00f5c4]" />
                    Modules Latéraux
                  </span>
                  <button
                    onClick={handleHideAllSideModules}
                    className="text-[10px] font-condensed font-bold uppercase tracking-wider text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2 py-0.5 rounded cursor-pointer flex items-center gap-1 transition-all"
                    title="Masquer la configuration, les réglages, la boussole et le vote pour donner la priorité au débat"
                  >
                    <EyeOff className="w-2.5 h-2.5" />
                    Tout Masquer
                  </button>
                </div>

                {/* SÉLECTEUR DE MODE DU SUJET */}
                {showThemeConfig && (
                  <div className="border border-white/[0.05] rounded-xl bg-[#090909]/60 p-4">
                    <div className="flex items-center justify-between mb-3 border-b border-white/[0.05] pb-1.5">
                      <h3 className="font-condensed font-bold text-xs tracking-wider uppercase text-gray-400 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-[#00f5c4]" />
                        CONFIGURATION DU THÈME
                      </h3>
                      <button
                        onClick={() => handleToggleThemeConfig(false)}
                        className="flex items-center gap-1 px-1.5 py-0.5 text-gray-500 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] rounded text-[10px] font-condensed uppercase tracking-wider cursor-pointer transition-colors"
                        title="Masquer la configuration du thème"
                      >
                        <EyeOff className="w-3 h-3" />
                        <span>Masquer</span>
                      </button>
                    </div>
                
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleSwitchMode("temporal")} 
                    className={`text-left rounded-lg p-2.5 flex flex-col gap-1 cursor-pointer transition-all ${
                      activeMode === "temporal" 
                        ? "bg-[#00f5c4]/10 border border-[#00f5c4]/30" 
                        : "bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03]"
                    }`}
                  >
                    <span className="font-condensed font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1">
                      ⌛ Cycle Chrono UTC (24H)
                    </span>
                    <span className="text-[10px] text-gray-500">6 sessions pré-enregistrées changeant toutes les 4 heures.</span>
                  </button>

                  <button 
                    onClick={() => handleSwitchMode("custom")} 
                    className={`text-left rounded-lg p-2.5 flex flex-col gap-1 cursor-pointer transition-all ${
                      activeMode === "custom" 
                        ? "bg-[#00f5c4]/10 border border-[#00f5c4]/30" 
                        : "bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03]"
                    }`}
                  >
                    <span className="font-condensed font-bold text-xs text-white uppercase tracking-wider">
                      🛠️ Thème Sur-Mesure
                    </span>
                    <span className="text-[10px] text-gray-500">Écrivez vous-même les problématiques de l'arène.</span>
                  </button>

                  <button 
                    onClick={() => handleSwitchMode("gemini-theme")} 
                    className={`text-left rounded-lg p-2.5 flex flex-col gap-1 cursor-pointer transition-all ${
                      activeMode === "gemini-theme" 
                        ? "bg-[#00f5c4]/10 border border-[#00f5c4]/30" 
                        : "bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03]"
                    }`}
                  >
                    <span className="font-condensed font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1">
                      <Wand2 className="w-3 h-3 text-purple-400" />
                      Générateur Éthique Gemini
                    </span>
                    <span className="text-[10px] text-gray-500">Élaborez des controverses d'un clic grâce à l'IA.</span>
                  </button>
                </div>
              </div>
            )}

            {/* DETAILS FORMULAIRE SELON LE MODE */}
            {showThemeConfig && activeMode === "custom" && (
              <div className="border border-white/[0.05] rounded-xl bg-[#090909]/60 p-4 animate-fadeSlideUp">
                  <h4 className="font-condensed font-bold text-xs text-white mb-3 uppercase tracking-widest border-b border-white/[0.05] pb-1">
                    Rédiger le Sujet de l'Arène
                  </h4>
                  <form onSubmit={triggerCustomTopicFormSubmit} className="flex flex-col gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-1">Catégorie</label>
                      <input 
                        type="text" 
                        placeholder="ex: INTELLIGENCE & DROIT" 
                        value={customCategory} 
                        onChange={e => setCustomCategory(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00f5c4]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-1">Sujet principal (Question)</label>
                      <textarea 
                        rows={2}
                        placeholder="Faut-il interdire l'utilisation d'androïdes de compagnie ?" 
                        value={customTitle} 
                        onChange={e => setCustomTitle(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00f5c4] resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-1">Contexte analytique & Enjeux</label>
                      <textarea 
                        rows={3}
                        placeholder="Développez la fracture éthique et les potentiels abus." 
                        value={customDesc} 
                        onChange={e => setCustomDesc(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00f5c4] resize-none"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-white text-black font-condensed font-black text-xs py-2 rounded shadow hover:bg-gray-100 cursor-pointer border-none uppercase tracking-wider"
                    >
                      Mettre à jour le Sujet actif
                    </button>
                  </form>
                </div>
              )}

              {showThemeConfig && activeMode === "gemini-theme" && (
                <div className="border border-white/[0.05] rounded-xl bg-[#090909]/60 p-4 animate-fadeSlideUp">
                  <h4 className="font-condensed font-bold text-xs text-white mb-2 uppercase tracking-widest border-b border-white/[0.05] pb-1">
                    Atelier de génération de Thèses
                  </h4>
                  <div className="flex gap-1.5 mb-3">
                    <input 
                      type="text" 
                      placeholder="ex: Climat, Espace, Génétique..." 
                      value={keyword} 
                      onChange={e => setKeyword(e.target.value)}
                      className="flex-1 bg-black border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5c4]"
                      onKeyDown={e => e.key === "Enter" && handleKeywordSearch()}
                    />
                    <button 
                      onClick={handleKeywordSearch}
                      disabled={isGeneratingTopics}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold border-none rounded px-3 cursor-pointer text-xs flex items-center justify-center shrink-0 disabled:opacity-50"
                    >
                      {isGeneratingTopics ? "..." : <Sparkles className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {suggestedTopics.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2 max-h-[220px] overflow-y-auto pr-1">
                      {suggestedTopics.map((item, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleSelectTopic({ ...item, id: `suggested-${idx}` })}
                          className="bg-white/[0.02] hover:bg-[#00f5c4]/15 border border-white/[0.05] hover:border-[#00f5c4]/30 rounded p-2 cursor-pointer transition-all"
                        >
                          <div className="text-[9px] font-semibold text-[#00f5c4] uppercase font-condensed tracking-wider">{item.category}</div>
                          <div className="text-xs font-bold text-white mt-0.5 font-condensed leading-snug">{item.title}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CONTRÔLE DES PARAMÈTRES DU STUDIO */}
              {showToneSettings && (
                <div className="border border-white/[0.05] rounded-xl bg-[#0a0a0a]/80 p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-white/[0.05] pb-1.5">
                    <h3 className="font-condensed font-bold text-xs tracking-wider uppercase text-gray-400 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#00f5c4]" />
                      RÉGLAGES DES RETENUES & TONALITÉ
                    </h3>
                    <button
                      onClick={() => handleToggleToneSettings(false)}
                      className="flex items-center gap-1 px-1.5 py-0.5 text-gray-500 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] rounded text-[10px] font-condensed uppercase tracking-wider cursor-pointer transition-colors"
                      title="Masquer les réglages des retenues et tonalités"
                    >
                      <EyeOff className="w-3 h-3" />
                      <span>Masquer</span>
                    </button>
                  </div>

                {/* Ton du débat */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-1.5">Dynamisme & Tonalité</label>
                  <div className="grid grid-cols-3 gap-1 bg-black border border-white/10 rounded p-0.5">
                    {[
                      { id: "incisif", l: "Choc d'idées" },
                      { id: "constructif", l: "Socratique" },
                      { id: "didactique", l: "Pédagogique" }
                    ].map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => setDebateTone(t.id)}
                        className={`text-[10px] font-bold py-1 border-none cursor-pointer rounded transition-all leading-none ${
                          debateTone === t.id 
                            ? "bg-white/10 text-white font-black" 
                            : "bg-transparent text-gray-600 hover:text-white"
                        }`}
                      >
                        {t.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Longueur des plaidoiries */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-1.5">Longueur des Tirades</label>
                  <div className="grid grid-cols-3 gap-1 bg-black border border-white/10 rounded p-0.5">
                    {[
                      { id: "court", l: "Twitter" },
                      { id: "standard", l: "Équilibrée" },
                      { id: "académique", l: "Thèse" }
                    ].map(l => (
                      <button 
                        key={l.id} 
                        onClick={() => setSpeechLength(l.id)}
                        className={`text-[10px] font-bold py-1 border-none cursor-pointer rounded transition-all leading-none ${
                          speechLength === l.id 
                            ? "bg-white/10 text-white font-black" 
                            : "bg-transparent text-gray-600 hover:text-white"
                        }`}
                      >
                        {l.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sélectionneurs de décodeurs actifs */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-1.5">Orateurs de table actifs</label>
                  <div className="flex flex-col gap-2">
                    {AGENTS.map(agent => (
                      <label key={agent.id} className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={activeAgentsFlags[agent.id]} 
                          onChange={() => setActiveAgentsFlags(prev => ({ ...prev, [agent.id]: !prev[agent.id] }))}
                          className="rounded text-[#00f5c4] focus:ring-0 accent-[#00f5c4] cursor-pointer"
                        />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent.color }} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-gray-300 font-condensed tracking-wide leading-none">{agent.name}</div>
                          <div className="text-[9px] text-gray-500 leading-none mt-0.5">{agent.role}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

              {/* 🔑 GESTION DES CLÉS API & MODÈLES ÉVOLUTIFS */}
              <div className="border border-white/[0.08] rounded-xl bg-[#0a0a0e]/90 p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-condensed font-bold text-xs tracking-wider uppercase text-gray-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#00f5c4]" />
                    Clés API & Évolution Modèles
                  </span>
                  <span className="text-[10px] text-[#00f5c4] font-bold bg-[#00f5c4]/10 px-2 py-0.5 rounded border border-[#00f5c4]/20">
                    {activeKeysCount} / 6 Actives
                  </span>
                </div>

                {/* Bouton principal vers le centre d'évolution */}
                <button
                  onClick={() => setIsApiKeysModalOpen(true)}
                  className="w-full py-2 px-3 bg-gradient-to-r from-blue-600/20 via-[#00f5c4]/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-[#00f5c4]/40 rounded-lg text-white font-condensed font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-[#00f5c4]/10"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00f5c4]" />
                  <span>Ouvrir le Centre Clés & Modèles</span>
                </button>

                {/* Badge de neutralité doctrinale & liberté */}
                <button
                  onClick={() => setIsApiKeysModalOpen(true)}
                  className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/25 flex items-center gap-2 text-left cursor-pointer hover:bg-emerald-950/50 transition-colors"
                  title="Consulter la charte d'indépendance des IA"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-emerald-300 font-condensed uppercase tracking-wider">
                      Liberté d'opinion garantie
                    </div>
                    <div className="text-[9px] text-gray-400 leading-tight truncate">
                      Aucune thèse imposée aux IA. Neutralité absolue.
                    </div>
                  </div>
                </button>

                {/* Déroulant pour réglage rapide inline */}
                <button 
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="font-condensed font-bold text-[11px] tracking-wider uppercase text-gray-400 border-t border-white/[0.05] pt-2 flex items-center justify-between w-full hover:text-white cursor-pointer transition-colors bg-transparent border-none text-left"
                >
                  <span>Saisie rapide des clés locales</span>
                  <span>{showApiKeys ? "▲ Masquer" : "▼ Dérouler"}</span>
                </button>

                {showApiKeys && (
                  <div className="flex flex-col gap-3.5 mt-1 animate-fadeSlideUp">
                    <p className="text-[10px] text-gray-400 leading-normal">
                      Renseignez vos clés API personnelles. En leur absence, le relais haute fidélité Gemini prend automatiquement le relais pour chaque orateur.
                    </p>
                    
                    {[
                      { id: "chatgpt", label: "OpenAI Clé API (ChatGPT)", placeholder: "sk-proj-...", color: "#10a37f", link: "https://platform.openai.com/api-keys", provider: "OpenAI Platform" },
                      { id: "claude", label: "Anthropic Clé API (Claude)", placeholder: "sk-ant-...", color: "#d97706", link: "https://console.anthropic.com/settings/keys", provider: "Anthropic Console" },
                      { id: "gemini", label: "Gemini Clé API (Google)", placeholder: "AIzaSy...", color: "#3b82f6", link: "https://aistudio.google.com/app/apikey", provider: "Google AI Studio" },
                      { id: "deepseek", label: "DeepSeek Clé API", placeholder: "sk-...", color: "#0a59f7", link: "https://platform.deepseek.com/api_keys", provider: "DeepSeek Platform" },
                      { id: "mistral", label: "Mistral Clé API", placeholder: "...", color: "#ff5400", link: "https://console.mistral.ai/api-keys/", provider: "Mistral La Plateforme" },
                      { id: "grok", label: "Grok xAI Clé API", placeholder: "xai-...", color: "#fbaf00", link: "https://console.x.ai/", provider: "xAI Console" }
                    ].map(keyDef => (
                      <div key={keyDef.id} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold tracking-wider uppercase text-gray-400 flex items-center gap-1.5 font-sans">
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: keyDef.color }} />
                            {keyDef.label}
                          </label>
                          <div className="flex items-center gap-2">
                            <a
                              href={keyDef.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 hover:underline font-semibold"
                              title={`Obtenir une clé API sur ${keyDef.provider}`}
                            >
                              <span>Obtenir la clé</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            {apiKeys[keyDef.id] ? (
                              <span className="text-[9px] text-[#00f5c4] font-semibold flex items-center gap-0.5">
                                ✓ active
                              </span>
                            ) : (
                              <span className="text-[9px] text-gray-600 font-normal">
                                (Secours Gemini)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 relative">
                          <input 
                            type={visibleApiKeyIds[keyDef.id] ? "text" : "password"}
                            placeholder={keyDef.placeholder}
                            value={apiKeys[keyDef.id] || ""}
                            onChange={e => handleSaveApiKey(keyDef.id, e.target.value)}
                            className="w-full bg-black border border-white/10 rounded px-2.5 py-1 text-xs text-white placeholder-gray-800 font-mono focus:outline-none focus:border-[#00f5c4] pr-14"
                          />
                          <button
                            type="button"
                            onClick={() => setVisibleApiKeyIds(prev => ({ ...prev, [keyDef.id]: !prev[keyDef.id] }))}
                            className="absolute right-2 top-1.5 text-gray-600 hover:text-white bg-transparent border-none cursor-pointer p-0 select-none text-[10px] uppercase font-bold"
                          >
                            {visibleApiKeyIds[keyDef.id] ? "Masquer" : "Voir"}
                          </button>
                        </div>
                        <div className="text-[9px] text-gray-500 flex items-center justify-between">
                          <span>Modèle : <code className="text-[#00f5c4]">{apiModels[keyDef.id] || "Défaut"}</code></span>
                          <button
                            onClick={() => setIsApiKeysModalOpen(true)}
                            className="text-blue-400 hover:underline cursor-pointer bg-transparent border-none p-0 text-[9px]"
                          >
                            Changer
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-1.5 flex justify-end">
                      <button
                        onClick={() => {
                          if (window.confirm("Voulez-vous vraiment supprimer toutes les clés de votre navigateur ?")) {
                            handleResetAllKeys();
                          }
                        }}
                        className="text-[9px] font-bold text-red-500/80 hover:text-red-400 uppercase bg-transparent border-none cursor-pointer tracking-wider"
                      >
                        Effacer toutes les clés localement
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* RADAR PHILOSOPHIQUE 2D & CARTE DES IDÉOLOGIES */}
              {showRadar && (
                <PhilosophicalRadar2D 
                  messages={messages} 
                  onHide={() => handleToggleRadar(false)} 
                />
              )}

              {/* VOTE & SENTIMENT DU PUBLIC EN DIRECT */}
              {showAudienceVote && (
                <LiveAudienceVote 
                  activeAgents={AGENTS.filter(a => activeAgentsFlags[a.id])}
                  onCheerAll={() => {
                    setMessages(prev => prev.map(m => ({ ...m, claps: (m.claps || 0) + 1 })));
                  }}
                  onHide={() => handleToggleAudienceVote(false)}
                />
              )}

              {/* METRIQUES LIVE DE LA SÉANCE */}
              {messages.length > 0 && (
                <div className="border border-white/[0.05] rounded-xl bg-[#090909]/60 p-4">
                  <h3 className="font-condensed font-bold text-xs tracking-wider uppercase text-gray-400 mb-3 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-[#00f5c4]" />
                    ÉQUILIBRE ET VIBRANCE DU DÉBAT
                  </h3>
                  
                  <div className="flex flex-col gap-2">
                    {/* Gauge 1: Rigueur */}
                    <div>
                      <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-0.5">
                        <span>RIGUEUR SCIENTIFIQUE (ChatGPT & Gemini)</span>
                        <span className="text-[#10a37f]">{opinionMetrics.rigueur}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#10a37f] rounded-full transition-all duration-500" style={{ width: `${opinionMetrics.rigueur}%` }} />
                      </div>
                    </div>
                    {/* Gauge 2: Éthique */}
                    <div>
                      <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-0.5">
                        <span>HAUTEUR ÉTHIQUE & SENSE (Claude)</span>
                        <span className="text-[#d97706]">{opinionMetrics.ethique}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#d97706] rounded-full transition-all duration-500" style={{ width: `${opinionMetrics.ethique}%` }} />
                      </div>
                    </div>
                    {/* Gauge 3: Action */}
                    <div>
                      <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-0.5">
                        <span>PRAGMATISME LOGIQUE (DeepSeek)</span>
                        <span className="text-[#0a59f7]">{opinionMetrics.pragmatisme}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0a59f7] rounded-full transition-all duration-500" style={{ width: `${opinionMetrics.pragmatisme}%` }} />
                      </div>
                    </div>
                    {/* Gauge 4: Social */}
                    <div>
                      <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-0.5">
                        <span>AUDACE & ALINÉATION (Mistral & Grok)</span>
                        <span className="text-[#ff5400]">{opinionMetrics.culture}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#ff5400] rounded-full transition-all duration-500" style={{ width: `${opinionMetrics.culture}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </section>
          )}

            {/* ── COLONNE DE DROITE : ARÈNE DE DISCUSSION EN DIRECT ───────────── */}
            <section className="flex-1 flex flex-col transition-all duration-300 w-full min-w-0">
              
              {/* ── BARRE DE VISIBILITÉ, CONTRÔLE PLEIN ÉCRAN & BOUTON BIG ─── */}
              <div className="p-1 px-1.5 bg-[#0a0a0d] border border-white/[0.08] rounded-lg flex flex-wrap items-center justify-between gap-1 shadow-sm shrink-0">
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {/* BOUTON LANCER LE DÉBAT DIRECT (Visible dès le haut en phase idle) */}
                  {phase === "idle" && (
                    <button
                      onClick={handleStart}
                      className="px-3.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#00f5c4] hover:bg-[#00e0b0] text-black shadow-md shadow-[#00f5c4]/30 flex items-center gap-1.5 cursor-pointer transition-all ring-2 ring-[#00f5c4]/50 shrink-0"
                      title="Lancer immédiatement le débat"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-black" />
                      <span>Lancer le débat</span>
                    </button>
                  )}

                  {/* Accès direct : Tout Masquer / Tout Ouvrir */}
                  {isAllSideModulesHidden ? (
                    <button
                      onClick={handleShowAllSideModules}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#00f5c4]/15 hover:bg-[#00f5c4]/25 text-[#00f5c4] border border-[#00f5c4]/40 cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                      title="Afficher la configuration du thème, les réglages, la boussole et le vote"
                    >
                      <Eye className="w-3 h-3 text-[#00f5c4]" />
                      <span>Tout Ouvrir</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleHideAllSideModules}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                      title="Masquer les panneaux latéraux pour libérer tout l'espace pour le débat"
                    >
                      <EyeOff className="w-3 h-3 text-amber-400" />
                      <span>Tout Masquer</span>
                    </button>
                  )}

                  {/* BOUTON BIG : Agrandir la taille de police */}
                  <button
                    onClick={handleCycleFontSize}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1.5 shadow-sm ${
                      fontSizeLevel !== "normal"
                        ? "bg-purple-600/35 text-purple-200 border-purple-400 ring-2 ring-purple-400/40"
                        : "bg-white/[0.06] hover:bg-white/[0.12] text-gray-200 hover:text-white border-white/20"
                    }`}
                    title="Agrandir la taille de police (BIG)"
                  >
                    <Type className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-black text-xs">BIG</span>
                    {fontSizeLevel !== "normal" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    )}
                  </button>

                  {/* BOUTON VITESSE ULTRA-RAPIDE */}
                  <button
                    onClick={handleToggleTurboSpeed}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1.5 shadow-sm ${
                      isTurboSpeed
                        ? "bg-amber-500/25 text-amber-300 border-amber-400/80 ring-2 ring-amber-400/30"
                        : "bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white border-white/20"
                    }`}
                    title={isTurboSpeed ? "Vitesse Rapide active (répliques brèves, sans latence)" : "Passer en vitesse rapide"}
                  >
                    <Zap className={`w-3.5 h-3.5 ${isTurboSpeed ? "text-amber-400 fill-amber-400" : "text-gray-400"}`} />
                    <span className="font-bold text-xs">{isTurboSpeed ? "⚡ RAPIDE" : "STANDARD"}</span>
                  </button>

                  {/* SÉLECTEUR DE MODE D'AFFICHAGE : DÉFILEMENT CONFORT VS PAR FICHE */}
                  <div className="flex items-center bg-black/60 border border-white/10 rounded-lg p-0.5 shadow-sm shrink-0">
                    <button
                      onClick={() => handleSetDisplayMode("stream")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        displayMode === "stream"
                          ? "bg-[#00f5c4] text-black shadow font-extrabold"
                          : "text-gray-400 hover:text-white"
                      }`}
                      title="Mode Défilement Confort : lisez et scrollez librement à tout moment, sans coupure ni saut d'écran intempestif"
                    >
                      <ScrollText className="w-3.5 h-3.5" />
                      <span>Défilement</span>
                    </button>
                    <button
                      onClick={() => handleSetDisplayMode("zen")}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        displayMode === "zen"
                          ? "bg-[#00f5c4] text-black shadow font-extrabold"
                          : "text-gray-400 hover:text-white"
                      }`}
                      title="Mode Par Fiche : affiche une seule intervention à la fois sur un écran fixe"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Par fiche</span>
                    </button>
                  </div>

                  {/* COMMUTATEUR PROTECTION DE LECTURE (ANTI-SAUT) */}
                  <button
                    onClick={() => {
                      setReadingShield(prev => !prev);
                      if (readingShield) {
                        // Passé en suivi direct
                        setAutoScrollActive(true);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer select-none ${
                      readingShield
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 shadow-sm"
                        : "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                    }`}
                    title={
                      readingShield
                        ? "Protection de lecture ACTIVE : l'écran ne saute JAMAIS lorsqu'une IA répond. Vous lisez sereinement à votre rythme et scrollez librement. Cliquez pour passer en suivi direct."
                        : "Suivi direct ACTIF : l'écran défile vers le bas à chaque réponse. Cliquez pour activer la Protection de lecture anti-saut."
                    }
                  >
                    {readingShield ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
                        <span className="hidden md:inline">Lecture protégée :</span>
                        <span className="text-[#00f5c4] font-extrabold">ANTI-SAUT</span>
                      </>
                    ) : (
                      <>
                        <Radio className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
                        <span className="hidden md:inline">Mode :</span>
                        <span>Suivi direct</span>
                      </>
                    )}
                  </button>

                  {/* BADGE ORDRE ALÉATOIRE */}
                  <div 
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold tracking-wide bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1 shadow-sm hidden md:flex"
                    title="L'orateur de départ et les prises de parole sont sélectionnés de manière aléatoire parmi les IA actives"
                  >
                    <Shuffle className="w-3 h-3 text-blue-400" />
                    <span>🎲 Aléatoire</span>
                  </div>
                </div>

                {/* Toggles des modules latéraux - Tous toujours visibles */}
                <div className="flex flex-wrap items-center gap-1 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-0.5 hidden sm:inline">
                    Modules :
                  </span>
                  <button
                    onClick={() => {
                      if (!isSidebarVisible) handleToggleSidebar(true);
                      handleToggleThemeConfig();
                    }}
                    className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1 ${
                      isSidebarVisible && showThemeConfig
                        ? "bg-[#00f5c4]/15 text-[#00f5c4] border-[#00f5c4]/40"
                        : "bg-white/[0.03] text-gray-400 border-white/[0.08] hover:text-gray-200"
                    }`}
                    title="Afficher/masquer configuration thème"
                  >
                    {isSidebarVisible && showThemeConfig ? <CheckCircle className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5 opacity-50" />}
                    Thème
                  </button>
                  <button
                    onClick={() => {
                      if (!isSidebarVisible) handleToggleSidebar(true);
                      handleToggleToneSettings();
                    }}
                    className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1 ${
                      isSidebarVisible && showToneSettings
                        ? "bg-[#00f5c4]/15 text-[#00f5c4] border-[#00f5c4]/40"
                        : "bg-white/[0.03] text-gray-400 border-white/[0.08] hover:text-gray-200"
                    }`}
                    title="Afficher/masquer retenues & tonalités"
                  >
                    {isSidebarVisible && showToneSettings ? <CheckCircle className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5 opacity-50" />}
                    Retenues
                  </button>
                  <button
                    onClick={() => {
                      if (!isSidebarVisible) handleToggleSidebar(true);
                      handleToggleRadar();
                    }}
                    className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1 ${
                      isSidebarVisible && showRadar
                        ? "bg-[#00f5c4]/15 text-[#00f5c4] border-[#00f5c4]/40"
                        : "bg-white/[0.03] text-gray-400 border-white/[0.08] hover:text-gray-200"
                    }`}
                    title="Afficher/masquer boussole idéologique"
                  >
                    {isSidebarVisible && showRadar ? <CheckCircle className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5 opacity-50" />}
                    Boussole
                  </button>
                  <button
                    onClick={() => {
                      if (!isSidebarVisible) handleToggleSidebar(true);
                      handleToggleAudienceVote();
                    }}
                    className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1 ${
                      isSidebarVisible && showAudienceVote
                        ? "bg-[#00f5c4]/15 text-[#00f5c4] border-[#00f5c4]/40"
                        : "bg-white/[0.03] text-gray-400 border-white/[0.08] hover:text-gray-200"
                    }`}
                    title="Afficher/masquer vote du public"
                  >
                    {isSidebarVisible && showAudienceVote ? <CheckCircle className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5 opacity-50" />}
                    Vote
                  </button>
                </div>
              </div>
              
              {/* Active Hero Topic Banner (Compact & Collapsible - Réduit de 20%) */}
              <div className={`mt-0.5 p-1 px-1.5 bg-white/[0.01] border rounded-lg relative overflow-hidden shrink-0 transition-all duration-300 ${isClosed ? 'border-white/[0.04]' : 'border-white/[0.08] bg-gradient-to-b from-[#0e0e12] to-[#060608]'}`}>
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase truncate">
                    {activeTopic.isCustom ? (
                      <span className="text-[#b07aff] tracking-wider bg-[#b07aff]/15 px-1.5 py-0.5 rounded border border-[#b07aff]/25 shrink-0 text-[10px]">SUJET PERSO</span>
                    ) : (
                      <span className="text-[#00f5c4] tracking-wider shrink-0 text-[10px]">{activeTopic.category}</span>
                    )}
                    <span className="opacity-40">•</span>
                    <span className="shrink-0 text-[10px]">Session {typeof activeTopic.id === "number" ? activeTopic.id + 1 : "Live"}</span>
                    <span className="opacity-40">•</span>
                    <span className="capitalize text-gray-400 truncate text-[10px]">Ton : {debateTone}</span>
                  </div>

                  {/* Bouton Réduire / Déplier le bandeau */}
                  <button
                    onClick={() => handleToggleTopicBanner()}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/[0.08] text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0"
                    title={isTopicBannerCollapsed ? "Déplier le descriptif du sujet et les actions" : "Réduire le bandeau pour libérer l'espace du débat"}
                  >
                    {isTopicBannerCollapsed ? (
                      <>
                        <ChevronDown className="w-2.5 h-2.5 text-[#00f5c4]" />
                        <span>Déplier</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-2.5 h-2.5 text-gray-400" />
                        <span>Compacter</span>
                      </>
                    )}
                  </button>
                </div>

                <h1 className={`font-bold tracking-normal text-white leading-snug ${
                  fontSizeLevel === "xlarge" 
                    ? "text-base sm:text-lg md:text-xl" 
                    : fontSizeLevel === "large" 
                    ? "text-sm sm:text-base md:text-lg" 
                    : "text-xs sm:text-sm md:text-base"
                } ${isTopicBannerCollapsed ? 'truncate mb-0' : 'line-clamp-2 mb-0.5'}`}>
                  {activeTopic.title}
                </h1>

                {!isTopicBannerCollapsed && (
                  <>
                    <p 
                      onClick={() => handleToggleTopicBanner(true)}
                      className={`${fontSizeLevel === "xlarge" ? "text-xs sm:text-sm" : fontSizeLevel === "large" ? "text-[11px] sm:text-xs" : "text-[10px] md:text-[11px]"} text-gray-300 max-w-4xl leading-relaxed line-clamp-1 hover:line-clamp-none transition-all cursor-pointer`}
                      title="Cliquez pour compacter / déplier"
                    >
                      {activeTopic.description}
                    </p>

                    {/* Quick Interactive Action Bar - Compacte & Toujours 100% visible sans défilement */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 pt-1.5 border-t border-white/[0.08]">
                      <button
                        onClick={() => setIsDuelOpen(true)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-200 font-bold text-[11px] uppercase tracking-wider cursor-pointer transition-all shrink-0"
                      >
                        <Swords className="w-3 h-3 text-red-400" />
                        <span>Duel 1v1</span>
                      </button>

                      <button
                        onClick={() => setIsBreakingNewsOpen(true)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 font-bold text-[11px] uppercase tracking-wider cursor-pointer transition-all shrink-0"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Coup de Théâtre</span>
                      </button>

                      <button
                        onClick={() => setIsTreatyOpen(true)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-200 font-bold text-[11px] uppercase tracking-wider cursor-pointer transition-all shrink-0"
                      >
                        <Scroll className="w-3 h-3 text-purple-400" />
                        <span>Traité</span>
                      </button>

                      <button
                        id="quick-save-drive-btn"
                        onClick={() => setIsDriveModalOpen(true)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-200 font-bold text-[11px] uppercase tracking-wider cursor-pointer transition-all ml-auto shrink-0"
                      >
                        <Cloud className="w-3 h-3 text-blue-400" />
                        <span>Drive</span>
                      </button>
                    </div>
                  </>
                )}

                {messages.length > 0 && (
                  <div className="flex items-center justify-between gap-3 mt-1.5 pt-1.5 border-t border-white/[0.04] text-[10px]">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="font-bold font-condensed text-[#00f5c4] leading-none">{messages.length}</span>
                        <span className="text-[9px] tracking-wider text-[#666] font-condensed uppercase">Interventions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold font-condensed text-[#00f5c4] leading-none">{roundCount}</span>
                        <span className="text-[9px] tracking-wider text-[#666] font-condensed uppercase">Planches</span>
                      </div>
                    </div>
                    <button 
                      onClick={handleReset} 
                      className="flex items-center gap-1 bg-transparent border border-white/5 hover:border-white/10 hover:bg-white/[0.03] text-gray-500 hover:text-white px-1.5 py-0.5 rounded text-[9px] font-bold font-condensed uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <ListRestart className="w-2.5 h-2.5" />
                      Réinitialiser
                    </button>
                  </div>
                )}
              </div>

              {/* Flux de messages & Verdict : Mode Sans scroll (Zen) vs Flux Complet */}
              {displayMode === "zen" ? (
                <div className="flex-1 flex flex-col min-h-[360px] mt-0">
                  <ZenDebateReader
                    messages={messages}
                    activeTopic={activeTopic}
                    loadingAgent={loadingAgent}
                    phase={phase}
                    zenActiveIndex={zenActiveIndex}
                    onSelectIndex={setZenActiveIndex}
                    isReadingWaiting={isReadingWaiting}
                    readingCountdown={readingCountdown}
                    isReadingPaused={isReadingPaused}
                    readingPace={readingPace}
                    waitingNextSpeaker={waitingNextSpeaker}
                    onToggleReadingPause={handleToggleReadingPause}
                    onSkipReadingWait={handleSkipReadingWait}
                    onChangeReadingPace={handleChangeReadingPace}
                    onStart={handleStart}
                    onContinue={handleContinue}
                    onPause={handlePause}
                    onCloseDebate={handleStopAndSummarize}
                    onReset={handleReset}
                    onClapMessage={handleClapMessage}
                    getHeaders={getHeaders}
                    fontSizeLevel={fontSizeLevel}
                    verdict={verdict}
                    summary={summary}
                    closingProgress={closingProgress}
                    agentsList={AGENTS}
                  />
                </div>
              ) : (
                <div 
                  ref={streamContainerRef}
                  onScroll={handleStreamScroll}
                  onWheel={handleUserWheel}
                  onTouchMove={handleUserTouchMove}
                  className="flex-1 overflow-y-auto px-0.5 py-1 flex flex-col gap-1.5 min-h-[360px] mt-0 relative scroll-smooth [overflow-anchor:auto]"
                >
                  {/* RUBAN D'ACCÈS RAPIDE AUX ORATEURS (pour naviguer et scroller sereinement) */}
                  {messages.length > 1 && (
                    <div className="sticky top-0 z-20 bg-[#070709]/95 backdrop-blur-md border-b border-white/[0.08] px-2 py-1 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 select-none shadow-sm">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1 shrink-0 mr-1">
                        <Navigation className="w-3 h-3 text-[#00f5c4]" />
                        <span className="hidden sm:inline">Repères :</span>
                      </span>
                      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                        {messages.map((m, idx) => (
                          <button
                            key={m.id}
                            onClick={() => scrollToMessage(m.id)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/10 hover:border-[#00f5c4]/60 bg-white/[0.03] hover:bg-[#00f5c4]/15 text-gray-300 hover:text-white shrink-0 text-[11px] font-medium transition-all cursor-pointer"
                            title={`Aller directement à la prise de parole #${idx + 1} de ${m.agentName}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: m.agentColor }} />
                            <span className="font-bold">#{idx + 1} {m.agentName}</span>
                          </button>
                        ))}
                      </div>
                      <div className="ml-auto flex items-center gap-1 shrink-0 pl-1 border-l border-white/10">
                        <button
                          onClick={() => streamContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                          className="p-1 px-1.5 rounded bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white text-[10px] flex items-center gap-0.5 cursor-pointer font-bold"
                          title="Remonter tout en haut du débat"
                        >
                          <ArrowUp className="w-3 h-3" />
                          <span className="hidden md:inline">Haut</span>
                        </button>
                        <button
                          onClick={resumeAutoScroll}
                          className="p-1 px-1.5 rounded bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white text-[10px] flex items-center gap-0.5 cursor-pointer font-bold"
                          title="Descendre directement au dernier message"
                        >
                          <ArrowDown className="w-3 h-3" />
                          <span className="hidden md:inline">Bas</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {messages.length === 0 && phase === "idle" && (
                    <div className="flex-1 flex flex-col items-center justify-center py-1.5 md:py-2.5 text-center max-w-sm mx-auto my-auto shrink-0 animate-fadeSlideUp">
                      <div className="flex gap-1.5 mb-1.5 select-none">
                        {AGENTS.map(agent => (
                          <div 
                            key={agent.id} 
                            style={{ borderColor: agent.border, color: agent.color, background: agent.dim }}
                            className="w-6 h-6 md:w-7 md:h-7 rounded-full border flex items-center justify-center text-xs font-bold shadow shadow-black"
                          >
                            {agent.symbol}
                          </div>
                        ))}
                      </div>
                      <h3 className="text-xs md:text-sm font-bold text-gray-200 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                        <span>🏛️ L'Arène Dialectique est Prête</span>
                      </h3>
                      <p className="text-[11px] text-gray-400 leading-tight mb-2 max-w-xs line-clamp-2">
                        Les orateurs synthétiques sont prêts. Cliquez sur le bouton ci-dessous pour amorcer les débats.
                      </p>
                      <button 
                        onClick={handleStart} 
                        className="flex items-center gap-2 bg-[#00f5c4] hover:bg-[#00e0b0] text-black border-none font-bold text-xs sm:text-sm px-4 py-1.5 rounded-lg shadow-lg shadow-[#00f5c4]/30 transition-all cursor-pointer uppercase tracking-wider ring-2 ring-[#00f5c4]/50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current text-black" />
                        <span>Lancer le débat</span>
                      </button>
                    </div>
                  )}

                  {/* Bouclage de messages avec ancres individuelles pour navigation sereine */}
                  {messages.map(msg => (
                    <div key={msg.id} id={`msg-${msg.id}`} className="transition-all duration-300 rounded-xl">
                      <MessageBubble 
                        msg={msg} 
                        topicTitle={activeTopic.title}
                        getHeaders={getHeaders}
                        fontSizeLevel={fontSizeLevel}
                        onClap={() => handleClapMessage(msg.id)} 
                      />
                    </div>
                  ))}

                  {/* Indicateur de réflexion */}
                  {loadingAgent && (
                    <ThinkingBubble agentId={loadingAgent} />
                  )}

                  {/* Pause de lecture sereine entre les orateurs (permet de lire et scroller sans être pressé) */}
                  {isReadingWaiting && (
                    <div className="sticky bottom-2 mx-auto z-20 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#0e1015]/95 border border-emerald-500/40 backdrop-blur-md rounded-xl shadow-2xl text-xs text-gray-200 animate-fadeSlideUp max-w-lg w-full">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0">
                          {readingCountdown > 0 ? `${readingCountdown}s` : "∞"}
                        </div>
                        <div>
                          <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                            <span>Pause de lecture ({readingPace})</span>
                            {isReadingPaused && <span className="text-amber-400 font-bold">• Figée pour relecture</span>}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[200px]">
                            {waitingNextSpeaker ? `Prochain orateur : ${waitingNextSpeaker}` : "Prise de parole suivante..."}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleToggleReadingPause}
                          className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            isReadingPaused 
                              ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40"
                              : "bg-white/10 hover:bg-white/20 text-gray-200"
                          }`}
                          title={isReadingPaused ? "Reprendre le décompte" : "Figer le temps pour scroller et lire l'ensemble des arguments sans pression"}
                        >
                          {isReadingPaused ? "▶ Reprendre" : "⏸ Pause lecture"}
                        </button>
                        <button
                          onClick={handleSkipReadingWait}
                          className="px-2.5 py-1 rounded bg-[#00f5c4] hover:bg-[#00e0b0] text-black font-bold text-[11px] cursor-pointer transition-colors"
                          title="Passer immédiatement à l'orateur suivant"
                        >
                          Suivant ⏭
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Synthèse de closing */}
                  {phase === "closing" && closingProgress && (
                    <div className="flex items-center gap-3 p-4 bg-orange-500/[0.03] border border-orange-500/10 rounded-lg animate-fadeSlideUp">
                      <div className="flex gap-1 shrink-0">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                      <span className="text-xs text-orange-400 uppercase font-bold tracking-wider font-condensed">{closingProgress}</span>
                    </div>
                  )}

                  {/* Affichage du Verdict détaillé de la Cour Éthique */}
                  {verdict && (
                    <VerdictDisplay widgetVerdict={verdict} onShare={handleOpenShareActiveDebate} />
                  )}

                  {/* Synthèse textuelle */}
                  {summary && (
                    <SummaryWidget summary={summary} topic={activeTopic} messagesCount={messages.length} onShare={handleOpenShareActiveDebate} />
                  )}

                  {isClosed && !closingProgress && (
                    <div className="p-4 md:p-5 bg-emerald-500/[0.01] border border-emerald-500/10 rounded-xl mt-2 animate-fadeSlideUp">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-condensed font-bold text-sm text-emerald-400 tracking-wider uppercase mb-1">PROCÈS-VERBAL SAUVEGARDÉ</div>
                          <p className="text-[11px] text-[#777] leading-relaxed">
                            La table ronde asymétrique a été validée et enregistrée avec succès. Vous pouvez désormais partager ou exporter le résultat complet via un lien unique, par e-mail ou sur vos réseaux.
                          </p>
                          <div className="flex flex-wrap gap-2.5 mt-3">
                            <button 
                              onClick={handleOpenShareActiveDebate} 
                              className="bg-[#00f5c4] hover:bg-[#00e0b0] text-black font-condensed font-extrabold text-[11px] uppercase tracking-wider py-1.5 px-4 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-[#00f5c4]/20"
                              title="Envoyer ou partager le résultat (lien web, e-mail, réseaux, fichier HTML/Markdown)"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Envoyer & Partager le résultat</span>
                            </button>
                            <button 
                              onClick={handleReset} 
                              className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-condensed font-bold text-[10px] uppercase tracking-wider py-1.5 px-3.5 rounded-lg cursor-pointer transition-colors"
                            >
                              Entamer un nouveau débat
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notification sereine lorsqu'une IA répond (Protège la position de lecture sans sursaut) */}
                  {unreadCount > 0 && (
                    <div 
                      className="sticky bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-[#0b0c10]/95 border border-[#00f5c4]/50 text-white px-4 py-2 rounded-full shadow-2xl backdrop-blur-md text-xs select-none animate-fadeSlideUp max-w-[95%] sm:max-w-md"
                      title="Une IA a répondu en bas du fil. Votre position de lecture actuelle reste rigoureusement fixe."
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow animate-pulse" 
                        style={{ backgroundColor: lastUnreadColor || "#00f5c4" }} 
                      />
                      <span className="text-gray-200 text-xs font-semibold truncate">
                        {unreadCount === 1 
                          ? `${lastUnreadSpeaker || "Une IA"} a répondu`
                          : `${unreadCount} nouvelles réponses (${lastUnreadSpeaker})`
                        }
                      </span>
                      <button
                        onClick={scrollToLatestMessage}
                        className="flex items-center gap-1 bg-[#00f5c4] hover:bg-[#00e0b0] text-black font-extrabold px-3 py-1 rounded-full text-xs cursor-pointer ml-auto transition-all shadow hover:scale-105 active:scale-95 shrink-0"
                        title="Faire défiler doucement jusqu'à cette nouvelle intervention"
                      >
                        <span>Lire la suite</span>
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Indicateur discret si le suivi direct est suspendu manuellement sans nouveaux messages */}
                  {!readingShield && !autoScrollActive && unreadCount === 0 && (
                    <div 
                      className="sticky bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#0b0c10]/90 border border-white/20 text-white px-3 py-1 rounded-full shadow-xl backdrop-blur-md text-[11px] select-none animate-fadeSlideUp"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-gray-300">Suivi direct en pause</span>
                      <button
                        onClick={resumeAutoScroll}
                        className="text-[#00f5c4] hover:underline font-bold ml-1 cursor-pointer"
                      >
                        Reprendre ↓
                      </button>
                    </div>
                  )}

                  <div ref={bottomRef} className="h-6" />
                </div>
              )}

              {/* BARRE D'ENTRÉE PARTICIPATION DE L'UTILISATEUR HUMAIN */}
              {!isClosed && (
                <div className="border-t border-white/[0.06] py-0.5 flex items-center gap-1 shrink-0 bg-[#050505] z-10">
                  <form onSubmit={handlePostUserContribution} className="flex-1 flex gap-1.5 items-center">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-[11px] shrink-0 select-none">
                      👤
                    </div>
                    <input 
                      type="text" 
                      placeholder="Participez au débat avec vos arguments (Entrée pour envoyer)..."
                      value={userContribution}
                      onChange={e => setUserContribution(e.target.value)}
                      className="flex-1 bg-black border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-gray-500"
                    />
                    <button 
                      type="submit"
                      disabled={!userContribution.trim() || isSubmittingUserContribution}
                      className="bg-blue-600 hover:bg-blue-500 border-none font-bold text-xs text-white px-3 py-1 rounded-lg cursor-pointer disabled:opacity-40 flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isSubmittingUserContribution ? "..." : "Intervenir"}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Actions Controls Panel - Compact & 100% visible sans défiler */}
              <div className="border border-white/[0.08] p-1 px-1.5 bg-[#0a0a0d]/95 backdrop-blur-md rounded-lg flex items-center justify-between gap-1.5 flex-wrap shrink-0 shadow-lg">
                
                <div className="flex flex-wrap items-center gap-2">
                  {phase === "idle" && (
                    <button 
                      onClick={handleStart} 
                      className="flex items-center gap-2 bg-[#00f5c4] hover:bg-[#00e0b0] text-black border-none font-bold text-xs sm:text-sm px-4 py-1.5 rounded-lg shadow-lg shadow-[#00f5c4]/30 transition-all cursor-pointer uppercase tracking-wider ring-2 ring-[#00f5c4]/50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-black" />
                      <span>Lancer le débat</span>
                    </button>
                  )}

                  {phase === "running" && (
                    <button 
                      onClick={handlePause} 
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                    >
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Mettre en pause</span>
                    </button>
                  )}

                  {phase === "paused" && (
                    <>
                      <button 
                        onClick={handleContinue} 
                        className="flex items-center gap-2 bg-[#00f5c4] hover:bg-[#00e0b0] text-black border-none font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-lg shadow-lg shadow-[#00f5c4]/30 transition-all cursor-pointer uppercase tracking-wider ring-2 ring-[#00f5c4]/40"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin duration-1000 text-black" />
                        <span>Poursuivre</span>
                      </button>
                      <button 
                        onClick={handleStopAndSummarize} 
                        className="flex items-center gap-2 bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-500/30 font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Verdict</span>
                      </button>
                    </>
                  )}

                  {/* Bouton bascule Vitesse Rapide */}
                  <button
                    onClick={handleToggleTurboSpeed}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                      isTurboSpeed
                        ? "bg-amber-500/20 text-amber-300 border-amber-400/60 ring-1 ring-amber-400/30"
                        : "bg-white/[0.05] text-gray-400 border-white/10 hover:text-white"
                    }`}
                    title={isTurboSpeed ? "Mode Rapide activé (réponses instantanées et dynamiques)" : "Activer le mode rapide"}
                  >
                    <Zap className={`w-3.5 h-3.5 ${isTurboSpeed ? "text-amber-400 fill-amber-400" : "text-gray-400"}`} />
                    <span>{isTurboSpeed ? "⚡ Rapide : ON" : "Vitesse : Standard"}</span>
                  </button>

                  {/* Badge départ aléatoire */}
                  <div 
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-300/90 bg-blue-500/10 border border-blue-500/20"
                    title="Le premier orateur est tiré au sort parmi toutes les IA sélectionnées"
                  >
                    <Shuffle className="w-3 h-3 text-blue-400" />
                    <span>1er orateur : Aléatoire</span>
                  </div>
                </div>

                {!isClosed && phase !== "running" && activeMode === "temporal" && (
                  <div className="hidden sm:flex items-center gap-2 text-right text-gray-400 max-w-[280px]">
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase tracking-wider font-semibold text-gray-500">Rotation suivante :</div>
                      <div className="text-xs text-gray-300 truncate font-bold">{nextTopic.title}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          /* ── ONGLETS ARCHIVES ET SUPPORTS DE REVISE ──────────────────────── */
          <div className="flex-1 flex flex-col overflow-hidden py-1 px-1 animate-fadeSlideUp">
            
            {selectedArchive ? (
              /* Vue détaillée de l'archive enregistrée */
              <div className="flex-1 overflow-y-auto pr-1">
                <button 
                  onClick={() => setSelectedArchive(null)} 
                  className="flex items-center gap-1.5 bg-transparent border-none text-[#999] hover:text-white cursor-pointer text-xs font-bold font-condensed tracking-wider uppercase mb-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la liste des archives
                </button>

                <div className="p-3 bg-[#090909]/80 border border-white/[0.04] rounded-lg mb-3 flex flex-col md:flex-row justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold font-condensed tracking-widest text-[#00f5c4] uppercase">{selectedArchive.topic.category}</span>
                    <h2 className="text-lg md:text-2xl font-black font-condensed text-white mb-2 leading-snug mt-0.5">
                      {selectedArchive.topic.title}
                    </h2>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Session enregistrée le {fmtDate(selectedArchive.closedAt)} · {selectedArchive.messages.length} interventions actives
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => handleOpenShareArchive(selectedArchive, "html")}
                      className="flex items-center gap-1.5 text-xs text-[#00f5c4] bg-[#00f5c4]/15 hover:bg-[#00f5c4]/25 border border-[#00f5c4]/30 font-bold rounded px-3 py-1.5 cursor-pointer uppercase transition-all shadow-sm"
                      title="Envoyer ou exporter ce débat archivé sous forme de fichier HTML"
                    >
                      <FileCode className="w-3.5 h-3.5 text-[#00f5c4]" />
                      <span>Fichier HTML</span>
                    </button>
                    <button 
                      onClick={() => handleOpenShareArchive(selectedArchive, "html")}
                      className="flex items-center gap-1.5 text-xs text-black bg-[#00f5c4] hover:bg-[#00e0b0] font-extrabold rounded px-3 py-1.5 cursor-pointer uppercase transition-all shadow-sm shadow-[#00f5c4]/20"
                      title="Partager et envoyer le résultat de ce débat archivé"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Partager</span>
                    </button>
                    <button 
                      onClick={() => setIsDriveModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded px-3 py-1.5 font-bold font-condensed cursor-pointer uppercase transition-colors"
                    >
                      <Cloud className="w-3.5 h-3.5 text-blue-400" />
                      <span>Google Drive</span>
                    </button>
                    <button 
                      onClick={(e) => { handleDeleteArchive(selectedArchive.key, e); }}
                      className="flex items-center gap-1.5 text-xs text-red-500/80 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 rounded px-3 py-1.5 font-bold font-condensed cursor-pointer uppercase transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Effacer cette archive
                    </button>
                  </div>
                </div>

                {/* Verdict détaillé d'archive si présent */}
                {selectedArchive.verdict && (
                  <VerdictDisplay widgetVerdict={selectedArchive.verdict} onShare={() => handleOpenShareArchive(selectedArchive)} />
                )}

                {/* Synthèse finale d'archive */}
                {selectedArchive.summary && (
                  <SummaryWidget summary={selectedArchive.summary} topic={selectedArchive.topic} messagesCount={selectedArchive.messages.length} onShare={() => handleOpenShareArchive(selectedArchive)} />
                )}

                <div className="mt-8 flex flex-col gap-4">
                  <div className="text-xs font-bold font-condensed text-gray-500 tracking-widest uppercase border-b border-white/[0.06] pb-2">
                    RETRANSCRIPTION INTÉGRALE DES DISCOURS
                  </div>
                  {selectedArchive.messages.map(msg => (
                    <MessageBubble 
                      key={msg.id} 
                      msg={msg} 
                      topicTitle={selectedArchive.topic.title}
                      getHeaders={getHeaders}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Liste d'archives générale */
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
                  <div className="font-condensed font-bold tracking-wider text-sm text-gray-400 uppercase">
                    REGISTRE ET PALMARÈS DES SESSIONS PASSÉES
                  </div>
                  <div className="text-xs text-gray-600">
                    {archives.length} débat{archives.length > 1 ? 's' : ''} répertorié{archives.length > 1 ? 's' : ''}
                  </div>
                </div>

                {archives.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <BookOpen className="w-12 h-12 stroke-[1.2] text-gray-600 mb-3" />
                    <div className="font-condensed font-bold text-sm uppercase tracking-widest text-gray-400">Registre d'arène vierge</div>
                    <p className="text-xs text-gray-600 mt-1 max-w-[280px] text-center leading-relaxed">
                      Aucune thèse de table ronde n'a encore été délibérée et classée avec verdict actif. Lancez dès à présent un débat dans le studio.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {archives.map((arc, i) => (
                      <div 
                        key={arc.key} 
                        onClick={() => setSelectedArchive(arc)} 
                        className="p-2.5 px-3 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] hover:border-[#00f5c4]/30 rounded-lg cursor-pointer transition-all duration-200"
                        style={{ animation: `archiveSlide 0.3s ${i * 0.05}s ease both` }}
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold font-condensed text-[#00f5c4] tracking-widest mb-1.5 uppercase">
                              {arc.topic.category}
                            </div>
                            <h3 className="font-condensed font-bold text-lg text-white hover:text-[#00f5c4] transition-colors leading-snug mb-2">
                              {arc.topic.title}
                            </h3>
                            {arc.summary && (
                              <p className="text-xs text-gray-400 leading-normal line-clamp-2 pr-4">
                                {arc.summary.replace(/\*\*/g, "").slice(0, 180)}...
                              </p>
                            )}

                            {arc.verdict && (
                              <div className="mt-3.5 flex items-center gap-2">
                                <span className="text-[10px] uppercase font-condensed bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-300 font-bold tracking-wider">
                                  🏆 Vainqueur : {arc.verdict.winnerId.toUpperCase()}
                                </span>
                                <span className="text-[10px] text-gray-600 font-condensed">
                                  Citation : "{arc.verdict.keyCitation.slice(0, 48)}..."
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right shrink-0 flex flex-col items-end justify-between">
                            <div>
                              <div className="text-2xl font-black font-condensed text-[#00f5c4] leading-none mb-0.5">
                                {arc.messages.length}
                              </div>
                              <div className="text-[9px] text-[#555] font-condensed uppercase tracking-wider mb-1">Dispositions</div>
                              <div className="text-xs text-[#666] font-condensed">
                                {new Date(arc.closedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenShareArchive(arc);
                              }}
                              className="mt-2 flex items-center gap-1 text-[10px] text-gray-300 hover:text-black bg-white/[0.05] hover:bg-[#00f5c4] border border-white/[0.1] hover:border-[#00f5c4] px-2 py-0.5 rounded cursor-pointer transition-all font-condensed uppercase font-bold shadow-sm"
                              title="Partager et envoyer le résultat de ce débat"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>Partager</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── FOOTER DISCRET DES ORATEURS IA (Ultra-compact & épuré) ── */}
      {tab === "debate" && (
        <footer className="border-t border-white/[0.06] bg-[#070709]/95 px-2 py-1 z-20 flex items-center justify-center gap-1.5 sm:gap-2.5 flex-wrap">
          {AGENTS.map((agent) => {
            const isActive = activeAgentsFlags[agent.id];
            const isLoading = loadingAgent === agent.id;
            return (
              <div 
                key={agent.id} 
                title={`${agent.name} (${isActive ? 'Actif' : 'En retrait'})`}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all ${
                  isLoading 
                    ? "border-current bg-white/[0.08]" 
                    : isActive 
                    ? "border-white/[0.08] bg-white/[0.02]" 
                    : "border-transparent opacity-30"
                }`}
                style={{ color: agent.color }}
              >
                <span className="text-[10px] font-bold leading-none">{agent.symbol}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                  {agent.name}
                </span>
                {isLoading && (
                  <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: agent.color }} />
                )}
              </div>
            );
          })}
        </footer>
      )}

      {/* ── MODALS RÉVOLUTIONNAIRES ────────────────────────────────────── */}
      <DuelArenaModal
        isOpen={isDuelOpen}
        onClose={() => setIsDuelOpen(false)}
        topicTitle={activeTopic.title}
        topicDescription={activeTopic.description}
        getHeaders={getHeaders}
      />

      <BreakingNewsModal
        isOpen={isBreakingNewsOpen}
        onClose={() => setIsBreakingNewsOpen(false)}
        topicTitle={activeTopic.title}
        getHeaders={getHeaders}
        onInjectTwist={handleInjectTwist}
      />

      <UniversalTreatyModal
        isOpen={isTreatyOpen}
        onClose={() => setIsTreatyOpen(false)}
        topicTitle={activeTopic.title}
        messages={messages}
        getHeaders={getHeaders}
      />

      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        currentDebateData={{
          topicTitle: activeTopic.title,
          topicDescription: activeTopic.description,
          messages: messages.map(m => ({
            agentName: m.agentName,
            agentId: m.agentId,
            content: m.content,
            timestamp: Date.now(),
          })),
          verdict: verdict,
          summary: summary,
        }}
        onImportDebateTopic={(title, desc) => {
          setCustomTitle(title);
          setCustomDesc(desc);
          setActiveTopic({
            id: `imported-${Date.now()}`,
            category: "IMPORT GOOGLE DRIVE",
            title,
            description: desc,
            isCustom: true,
          });
          setActiveMode("custom");
          setMessages([]);
          setPhase("idle");
          setVerdict(null);
          setSummary("");
        }}
      />

      {/* MODAL DE PARTAGE & D'ENVOI DU RÉSULTAT */}
      {shareDebatePayload && (
        <ShareDebateModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          topic={shareDebatePayload.topic}
          messages={shareDebatePayload.messages}
          verdict={shareDebatePayload.verdict}
          summary={shareDebatePayload.summary}
          treaty={shareDebatePayload.treaty}
          defaultTab={shareDebatePayload.defaultTab}
        />
      )}

      {/* MODAL CLÉS API, MODÈLES ÉVOLUTIFS & GARANTIE DE LIBERTÉ */}
      <ApiKeysAndModelsModal
        isOpen={isApiKeysModalOpen}
        onClose={() => setIsApiKeysModalOpen(false)}
        apiKeys={apiKeys}
        apiModels={apiModels}
        onSaveApiKey={handleSaveApiKey}
        onSaveApiModel={handleSaveApiModel}
        onResetAllKeys={handleResetAllKeys}
      />
    </div>
  );
}

// ─── COMPONENT: MESSAGE BUBBLE ───────────────────────────────────────────────
function MessageBubble({ 
  msg, 
  onClap,
  topicTitle = "",
  getHeaders,
  fontSizeLevel = "normal",
}: { 
  msg: Message; 
  onClap?: () => void; 
  topicTitle?: string;
  getHeaders?: () => Record<string, string>;
  key?: string | number;
  fontSizeLevel?: "normal" | "large" | "xlarge";
}) {
  const [expanded, setExpanded] = useState(true);
  const isLong = msg.content.length > 550;
  const textToShow = !expanded ? msg.content.slice(0, 400) + "…" : msg.content;

  const contentFontClass = fontSizeLevel === "xlarge" 
    ? "text-base sm:text-lg md:text-xl leading-relaxed text-gray-100" 
    : fontSizeLevel === "large" 
    ? "text-sm sm:text-base md:text-lg leading-relaxed text-gray-100" 
    : "text-xs sm:text-[13px] md:text-sm leading-relaxed text-gray-200";

  const nameFontClass = fontSizeLevel === "xlarge"
    ? "text-base sm:text-lg"
    : fontSizeLevel === "large"
    ? "text-sm sm:text-base"
    : "text-xs sm:text-sm";

  return (
    <div className={`flex gap-1.5 md:gap-2 animate-fadeSlideUp w-full ${msg.isUser ? 'ml-auto' : ''}`}>
      <div 
        style={{ 
          borderColor: msg.agentBorder, 
          color: msg.agentColor, 
          background: msg.agentDim,
          boxShadow: `0 0 12px ${msg.agentColor}20`
        }}
        className="w-8 h-8 md:w-9 md:h-9 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 select-none"
      >
        {msg.agentSymbol}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className={`font-bold tracking-normal ${nameFontClass}`} style={{ color: msg.agentColor }}>
            {msg.agentName}
          </span>
          <span className="text-[10px] text-gray-400 font-medium tracking-normal truncate">
            {msg.agentRole}
          </span>
          <span className="text-[10px] text-gray-500 ml-auto shrink-0">
            {msg.time}
          </span>
        </div>
        
        <div 
          className="bg-[#0b0b0e] border border-white/[0.08] rounded-lg px-2.5 py-1.5 relative flex flex-col justify-between shadow-sm" 
          style={{ borderLeft: `3px solid ${msg.agentColor}` }}
        >
          <p className={`font-sans whitespace-pre-wrap select-text ${contentFontClass}`}>{textToShow}</p>
          
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 border-t border-white/[0.06] pt-2">
            {isLong ? (
              <button 
                onClick={() => setExpanded(!expanded)} 
                style={{ color: msg.agentColor }}
                className="bg-transparent border-none text-[11px] font-bold tracking-wider uppercase cursor-pointer hover:opacity-80 flex items-center gap-1 transition-opacity pr-2"
              >
                {expanded ? "▲ Masquer" : "▼ Déployer"}
              </button>
            ) : <span />}

            <button 
              onClick={onClap}
              className="bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 hover:text-yellow-300 border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all select-none ml-auto"
            >
              <ThumbsUp className="w-3 h-3 fill-current text-yellow-400" />
              <span>Soutenir {msg.claps ? `(${msg.claps})` : ""}</span>
            </button>
          </div>

          {/* Fallacy & Logic Inspector if getHeaders is provided */}
          {getHeaders && !msg.agentId.startsWith("system") && (
            <div className="mt-1.5 pt-1.5 border-t border-white/[0.03]">
              <FallacyInspector
                content={msg.content}
                agentName={msg.agentName}
                agentColor={msg.agentColor}
                topicTitle={topicTitle}
                getHeaders={getHeaders}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT: THINKING BUBBLE ──────────────────────────────────────────────
function ThinkingBubble({ agentId }: { agentId: string }) {
  const agent = AGENTS.find(a => a.id === agentId);
  if (!agent) return null;

  return (
    <div className="flex gap-4 items-start py-2 animate-fadeSlideUp">
      <div 
        style={{ borderColor: agent.color, color: agent.color, background: agent.dim }}
        className="w-9 h-9 rounded-full border flex items-center justify-center text-sm font-semibold shrink-0 animate-pulse"
      >
        {agent.symbol}
      </div>
      <div>
        <div className="font-condensed font-bold text-xs tracking-widest text-[#aaa] uppercase mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#00f5c4] animate-spin" style={{ color: agent.color }} />
          {agent.name} STRUCTURE SES THÈSES SUR L'ARÈNE...
        </div>
        <div className="flex gap-1 py-1">
          {[0,1,2,3].map(i => (
            <div 
              key={i} 
              className="w-1 h-1 rounded-full animate-bounce" 
              style={{ backgroundColor: agent.color, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT: SUMMARY WIDGET ────────────────────────────────────────────────
function SummaryWidget({ 
  summary, 
  topic, 
  messagesCount,
  onShare 
}: { 
  summary: string; 
  topic: Topic; 
  messagesCount: number;
  onShare?: () => void;
}) {
  const paragraphs = summary.split("\n").filter(p => p.trim());

  return (
    <div className="animate-summaryReveal border border-[#00f5c4]/15 bg-gradient-to-br from-[#00f5c4]/[0.02] to-[#b07aff]/[0.02] rounded-xl overflow-hidden mt-4">
      
      {/* Header Titre */}
      <div className="px-5 py-4 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00f5c4] to-[#b07aff] flex items-center justify-center text-black shrink-0 font-bold shadow-md shadow-black select-none">
            <ClipboardList className="w-4 h-4 text-black" />
          </div>
          <div className="min-w-0">
            <div className="font-condensed font-black tracking-widest text-sm text-[#00f5c4] uppercase truncate">
              SYNTHÈSE EXÉCUTIVE DES DÉBATS
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-condensed truncate">
              Rapport critique et synthèse transversale par Gemini-3.5-Flash
            </div>
          </div>
        </div>

        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00f5c4]/15 hover:bg-[#00f5c4]/25 border border-[#00f5c4]/30 text-[#00f5c4] text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0 shadow-sm"
            title="Envoyer ou partager cette synthèse et le débat"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Partager</span>
          </button>
        )}
      </div>

      {/* Corps du texte */}
      <div className="px-5 py-5 flex flex-col gap-3">
        {paragraphs.map((para, idx) => {
          const isHighlight = para.startsWith("**") && para.endsWith("**");
          const cleanedText = isHighlight ? para.slice(2, -2) : para;

          if (isHighlight) {
            return (
              <div key={idx} className="mt-2 p-4 bg-[#00f5c4]/[0.03] border-l-2 border-[#00f5c4] rounded-r-lg relative overflow-hidden">
                <p className="text-[#00f5c4] font-condensed font-semibold tracking-wide text-xs md:text-sm leading-relaxed relative z-10 select-text">
                  {cleanedText}
                </p>
              </div>
            );
          }

          return (
            <p key={idx} className="text-gray-300 text-xs md:text-sm font-sans leading-relaxed select-text">
              {cleanedText}
            </p>
          );
        })}
      </div>
    </div>
  );
}

// ─── COMPONENT: JURY VERDICT DISPLAY ──────────────────────────────────────────
function VerdictDisplay({ 
  widgetVerdict,
  onShare
}: { 
  widgetVerdict: Verdict;
  onShare?: () => void;
}) {
  // Traduction propre des id en noms
  const translateAgentName = (id: string) => {
    if (id === "user") return "Humain (Vous)";
    const ag = AGENTS.find(a => a.id === id);
    return ag ? ag.name : id.toUpperCase();
  };

  const translateAgentColor = (id: string) => {
    if (id === "user") return "#3b82f6";
    const ag = AGENTS.find(a => a.id === id);
    return ag ? ag.color : "#aaa";
  };

  return (
    <div className="animate-summaryReveal border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] to-yellow-600/[0.03] rounded-xl overflow-hidden mt-4">
      
      {/* Header Verdict */}
      <div className="px-5 py-4 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-black shrink-0 font-bold shadow-md shadow-black select-none">
            <Award className="w-5 h-5 text-black" />
          </div>
          <div className="min-w-0">
            <div className="font-condensed font-black tracking-widest text-sm text-amber-400 uppercase truncate">
              VERDICT DU JURY SUPRÊME DES MODÈLES
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-condensed mt-0.5 truncate">
              ÉVALUATION CRITIQUE PROTOCOLÉE PAR GEMINI-3.5-FLASH
            </div>
          </div>
        </div>

        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0 shadow-sm"
            title="Envoyer ou partager ce verdict et le résultat du débat"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Partager</span>
          </button>
        )}
      </div>

      {/* Contenu du Verdict */}
      <div className="px-5 py-5 flex flex-col gap-4">
        
        {/* Le Vainqueur Oratoire */}
        <div className="p-4 bg-amber-500/[0.03] border border-amber-500/10 rounded-lg flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <span className="text-[9px] font-extrabold tracking-widest text-amber-400 font-condensed uppercase">DÉSIGNÉ VAINQUEUR DE SÉANCE</span>
            <h4 className="font-condensed font-black text-xl tracking-wide leading-none text-white mt-1" style={{ color: translateAgentColor(widgetVerdict.winnerId) }}>
              🏆 {translateAgentName(widgetVerdict.winnerId).toUpperCase()}
            </h4>
            <p className="text-gray-300 text-xs md:text-sm leading-relaxed mt-2 select-text font-serif italic">
              "{widgetVerdict.winnerReason}"
            </p>
          </div>
        </div>

        {/* Tableau des notes */}
        <div>
          <span className="text-[9px] font-extrabold tracking-widest text-gray-500 font-condensed uppercase block mb-2.5">SCORE DE PERFORMANCE INDIVIDUELLE (Rigueur & Éloquence)</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(widgetVerdict.agentScores).map(([id, val]) => (
              <div key={id} className="bg-black/40 border border-white/[0.05] p-3 rounded-lg flex flex-col justify-between">
                <div className="text-[10px] font-condensed font-bold text-gray-500 uppercase tracking-wider">{translateAgentName(id)}</div>
                <div className="flex items-baseline gap-1 mt-1.5 justify-between">
                  <span className="text-xl font-black font-condensed" style={{ color: translateAgentColor(id) }}>{val} / 10</span>
                  <span className="text-[9px] text-[#444] font-condensed bg-white/5 rounded px-1">{widgetVerdict.agentBadges[id] ? "Badged" : ""}</span>
                </div>
                {widgetVerdict.agentBadges[id] && (
                  <div className="text-[8px] font-semibold text-[#888] font-condensed uppercase truncate mt-1 tracking-wider border-t border-white/[0.04] pt-1">
                    🏅 {widgetVerdict.agentBadges[id]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Critique Générale & Citation Clé */}
        {widgetVerdict.critiqueGénérale && (
          <div className="flex flex-col gap-3 pt-2">
            <div>
              <span className="text-[9px] font-extrabold tracking-widest text-gray-500 font-condensed uppercase block mb-1">DÉLIBÉRATIONS DU CONSEIL</span>
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed select-text font-sans">
                {widgetVerdict.critiqueGénérale}
              </p>
            </div>

            {widgetVerdict.keyCitation && (
              <div className="bg-white/[0.01] border-l-2 border-amber-400 p-3 rounded-r-md mt-1 italic">
                <span className="text-[8px] font-condensed font-bold tracking-widest text-amber-500 uppercase block mb-1">CITATION PHARE RETENUE PAR LA COUR</span>
                <p className="text-xs text-amber-300 font-serif leading-relaxed">
                  "{widgetVerdict.keyCitation}"
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

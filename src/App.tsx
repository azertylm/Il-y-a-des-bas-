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
  Volume2
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Message {
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

interface Topic {
  id: number | string;
  category: string;
  title: string;
  description: string;
  isCustom?: boolean;
}

interface Archive {
  key: string;
  topic: Topic;
  messages: Message[];
  summary: string;
  verdict?: Verdict;
  closedAt: string;
  roundCount: number;
}

interface Verdict {
  winnerId: string;
  winnerReason: string;
  agentScores: { [key: string]: number };
  agentBadges: { [key: string]: string };
  critiqueGénérale: string;
  keyCitation: string;
}

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
  const [speechLength, setSpeechLength] = useState<string>("standard"); // court | standard | académique
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

  // --- CLÉS API DES UTILISATEURS ---
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>(() => {
    try {
      const saved = localStorage.getItem("debate_api_keys");
      return saved ? JSON.parse(saved) : { chatgpt: "", claude: "", gemini: "", deepseek: "", mistral: "", grok: "" };
    } catch {
      return { chatgpt: "", claude: "", gemini: "", deepseek: "", mistral: "", grok: "" };
    }
  });
  const [visibleApiKeyIds, setVisibleApiKeyIds] = useState<{ [key: string]: boolean }>({});

  const handleSaveApiKey = (agentId: string, value: string) => {
    const updated = { ...apiKeys, [agentId]: value };
    setApiKeys(updated);
    localStorage.setItem("debate_api_keys", JSON.stringify(updated));
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
    return headers;
  }, [apiKeys]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stopRequested = useRef(false);
  const messagesRef = useRef<Message[]>([]);

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
  }, []);

  // Timer de session de la rotation par défaut
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const secs = getSecondsUntilNextCycle();
      setTimeLeft(secs);
      
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
      console.error(e);
      sumText = "La synthèse prospective et les analyses du jury sont temporairement inaccessibles en raison d'un conflit réseau.";
      setSummary(sumText);
      setErrorMessage(e.message || "Erreur de traitement des données de synthèse.");
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

    for (const agent of activeAgents) {
      if (stopRequested.current) break;
      
      setLoadingAgent(agent.id);
      
      // Contexte élargi de la discussion
      const currentMsgs = messagesRef.current;
      const context = buildContext(agent.id, currentMsgs);

      // Adaptation dynamique du prompt système en fonction des paramètres du débat
      let enhancedPrompt = agent.systemPrompt;
      if (debateTone === "incisif") {
        enhancedPrompt += " Le débat est rude, n'hésite pas à ébranler tes confrères et à déceler des failles de logique dans leurs positions de façon vive et combative.";
      } else if (debateTone === "constructif") {
        enhancedPrompt += " Favorise l'écoute active, cherche des compromis, souligne là où tu rejoins les thèses d'autrui pour concevoir une issue convergente.";
      } else if (debateTone === "didactique") {
        enhancedPrompt += " Reste extrêmement didactique, emploie des analogises simples, explique les théories philosophiques ou économiques pas à pas avec pédagogie.";
      }

      if (speechLength === "court") {
        enhancedPrompt += " Fais une tirade extrêmement condensée, va droit au but en moins de 120 mots au total pour une réplique tranchante.";
      } else if (speechLength === "académique") {
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
          }),
        });

        if (!res.ok) {
          const err = await res.json();
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

        setMessages(prev => [...prev, msg]);
      } catch (e: any) { 
        console.error(agent.name, e);
        setErrorMessage(`Défaillance passagère de ${agent.name}: ${e.message}`);
        stopRequested.current = true;
        setPhase("paused");
        setLoadingAgent(null);
        return;
      }
      
      setLoadingAgent(null);
      // Temporisation de lecture réaliste
      await new Promise(r => setTimeout(r, 650));
    }
    
    setRoundCount(n => n + 1);
    setPhase("paused");
  }, [buildContext, activeTopic, activeAgentsFlags, debateTone, speechLength]);

  // Contrôleurs interactifs principaux
  const handleStart = () => {
    runAgents(AGENTS);
  };

  const handlePause = () => {
    stopRequested.current = true;
    setPhase("paused");
  };

  const handleContinue = () => {
    const offset = roundCount % AGENTS.length;
    runAgents([...AGENTS.slice(offset), ...AGENTS.slice(0, offset)]);
  };

  const handleStopAndSummarize = () => {
    stopRequested.current = true;
    closeDebate(messages);
  };

  const handleReset = () => {
    setMessages([]);
    setRoundCount(0);
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

  // Scroll au fond du fil de messages durant l'écoute active
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingAgent, summary, closingProgress]);

  const isClosed = phase === "closed" || phase === "closing";
  const selectedThemeTitle = activeTopic.title;

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#f3f4f6] font-sans relative overflow-hidden">
      
      {/* Visual background enhancements */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)", backgroundSize: "60px 60px", animation: "breathe 10s infinite" }} />
      <div className="fixed top-[-20vh] left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[45vh] bg-[radial-gradient(ellipse,rgba(0,245,196,0.04)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/92 backdrop-blur-xl px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Titre et tags */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-xl md:text-2xl font-black font-condensed tracking-tight text-white uppercase flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#00f5c4] animate-pulse" />
            IA<span className="text-[#00f5c4]">DÉBAT</span>
            <span className="text-[10px] tracking-widest text-[#555] font-condensed bg-white/[0.04] px-1.5 py-0.5 rounded ml-1 hidden sm:inline-block border border-white/[0.05]">PRO STUDIO</span>
          </div>
          {isClosed ? (
            <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded px-2 py-0.5 text-[10px] font-bold tracking-widest text-[#888] font-condensed">
              ARCHIVÉ
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5 text-[10px] font-bold tracking-widest text-[#ef4444] font-condensed">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-ping" />
              DIRECT
            </div>
          )}
        </div>

        {/* Global tab Switcher */}
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.05] rounded-lg p-1">
          <button 
            onClick={() => setTab("debate")} 
            className={`border-none rounded-md px-3 md:px-4 py-1 text-xs font-bold font-condensed tracking-wider transition-all duration-150 cursor-pointer ${
              tab === "debate" 
                ? "bg-white/[0.08] text-white" 
                : "bg-transparent text-[#777] hover:text-white"
            }`}
          >
            STUDIO DEBATE
          </button>
          <button 
            onClick={() => { setTab("archive"); setSelectedArchive(null); }} 
            className={`border-none rounded-md px-3 md:px-4 py-1 text-xs font-bold font-condensed tracking-wider transition-all duration-150 cursor-pointer ${
              tab === "archive" 
                ? "bg-white/[0.08] text-white" 
                : "bg-transparent text-[#777] hover:text-white"
            }`}
          >
            ARCHIVES ({archives.length})
          </button>
        </div>

        {/* Dynamic global clock cycle */}
        <div className="text-right shrink-0 hidden md:block">
          <div className="text-[10px] tracking-widest text-[#666] font-condensed">
            {activeMode === "temporal" ? "ROTATION HORAIRE UTC" : "MANUEL / STUDIO PRO"}
          </div>
          <div className="font-condensed font-bold text-[#00f5c4] tabular-nums flex items-center justify-end gap-1.5 leading-none mt-1">
            <Clock className="w-3.5 h-3.5 opacity-70" />
            {activeMode === "temporal" ? fmtTimer(timeLeft) : "-- : -- : --"}
          </div>
        </div>
      </header>

      {/* ── ALERTE ERREUR SI CLÉ API MANQUANTE ───────────────────────────── */}
      {errorMessage && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3 flex items-center gap-3 text-sm text-[#f87171] z-40 relative animate-fadeSlideUp">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <strong>Une anomalie s'est produite :</strong> {errorMessage}. Veuillez vérifier vos paramètres ou votre connexion réseau.
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-white hover:opacity-100 opacity-60 text-xs font-bold bg-transparent border-none cursor-pointer">
            Fermer X
          </button>
        </div>
      )}

      {/* ── CORPS DE L'APPLICATION EN 2 SECTIONS ────────────────────────── */}
      <main className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-hidden w-full max-w-7xl mx-auto px-2 md:px-6 py-2 gap-4">
        
        {tab === "debate" ? (
          <>
            {/* ── COLONNE DE GAUCHE : PARAMÈTRES ET ATELIER DE CRÉATION ──────── */}
            <section className="w-full lg:w-[350px] flex flex-col shrink-0 gap-4 overflow-y-auto lg:h-[calc(100vh-100px)] p-1">
              
              {/* SÉLECTEUR DE MODE DU SUJET */}
              <div className="border border-white/[0.05] rounded-xl bg-[#090909]/60 p-4">
                <h3 className="font-condensed font-bold text-xs tracking-wider uppercase text-gray-400 flex items-center gap-1.5 mb-3">
                  <Sliders className="w-3.5 h-3.5 text-[#00f5c4]" />
                  CONFIGURATION DU THÈME
                </h3>
                
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

              {/* DETAILS FORMULAIRE SELON LE MODE */}
              {activeMode === "custom" && (
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

              {activeMode === "gemini-theme" && (
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
              <div className="border border-white/[0.05] rounded-xl bg-[#0a0a0a]/80 p-4 flex flex-col gap-4">
                <h3 className="font-condensed font-bold text-xs tracking-wider uppercase text-gray-400 border-b border-white/[0.05] pb-1.5">
                  RÉGLAGES DES RETENUES & TONALITÉ
                </h3>

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

              {/* 🔑 GESTION DES CLÉS API MODÈLES */}
              <div className="border border-white/[0.05] rounded-xl bg-[#0a0a0a]/80 p-4 flex flex-col gap-3">
                <button 
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="font-condensed font-bold text-xs tracking-wider uppercase text-gray-400 border-b border-white/[0.05] pb-1.5 flex items-center justify-between w-full hover:text-white cursor-pointer transition-colors bg-transparent border-none text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-[#00f5c4]" />
                    Configuration des Clés API
                  </span>
                  <span>{showApiKeys ? "▲ Masquer" : "▼ Configurer"}</span>
                </button>

                {showApiKeys && (
                  <div className="flex flex-col gap-3.5 mt-2 animate-fadeSlideUp">
                    <p className="text-[10px] text-gray-500 leading-normal">
                      Entrez vos propres clés pour stimuler les véritables moteurs de chaque constructeur d'IA. Les clés sont stockées localement et ne transitent que vers le serveur pour relayer vos requêtes.
                    </p>
                    
                    {[
                      { id: "chatgpt", label: "OpenAI Clé API (ChatGPT)", placeholder: "sk-proj-...", color: "#10a37f" },
                      { id: "claude", label: "Anthropic Clé API (Claude)", placeholder: "sk-ant-...", color: "#d97706" },
                      { id: "gemini", label: "Gemini Clé API", placeholder: "AIzaSy...", color: "#3b82f6" },
                      { id: "deepseek", label: "DeepSeek Clé API", placeholder: "sk-...", color: "#0a59f7" },
                      { id: "mistral", label: "Mistral Clé API", placeholder: "...", color: "#ff5400" },
                      { id: "grok", label: "Grok xAI Clé API", placeholder: "xai-...", color: "#fbaf00" }
                    ].map(keyDef => (
                      <div key={keyDef.id} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold tracking-wider uppercase text-gray-400 flex items-center gap-1.5 font-sans">
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: keyDef.color }} />
                            {keyDef.label}
                          </label>
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
                        <div className="flex gap-1.5 relative">
                          <input 
                            type={visibleApiKeyIds[keyDef.id] ? "text" : "password"}
                            placeholder={keyDef.placeholder}
                            value={apiKeys[keyDef.id] || ""}
                            onChange={e => handleSaveApiKey(keyDef.id, e.target.value)}
                            className="w-full bg-black border border-white/10 rounded px-2.5 py-1 text-xs text-white placeholder-gray-800 font-mono focus:outline-none focus:border-[#00f5c4]"
                          />
                          <button
                            type="button"
                            onClick={() => setVisibleApiKeyIds(prev => ({ ...prev, [keyDef.id]: !prev[keyDef.id] }))}
                            className="absolute right-2 top-1.5 text-gray-600 hover:text-white bg-transparent border-none cursor-pointer p-0 select-none text-[10px] uppercase font-bold"
                          >
                            {visibleApiKeyIds[keyDef.id] ? "Masquer" : "Voir"}
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-1.5 flex justify-end">
                      <button
                        onClick={() => {
                          if (window.confirm("Voulez-vous vraiment supprimer toutes les clés de votre navigateur ?")) {
                            const resetKeys = { chatgpt: "", claude: "", gemini: "", deepseek: "", mistral: "", grok: "" };
                            setApiKeys(resetKeys);
                            localStorage.setItem("debate_api_keys", JSON.stringify(resetKeys));
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

            {/* ── COLONNE DE DROITE : ARÈNE DE DISCUSSION EN DIRECT ───────────── */}
            <section className="flex-1 flex flex-col overflow-hidden pb-4">
              
              {/* Active Hero Topic Banner */}
              <div className={`mt-2 p-5 bg-white/[0.01] border rounded-xl relative overflow-hidden shrink-0 transition-all duration-300 ${isClosed ? 'border-white/[0.02]' : 'border-white/[0.06] bg-gradient-to-b from-[#0a0a0a] to-[#040404]'}`}>
                <div className="flex items-center gap-2.5 mb-2 text-xs font-bold font-condensed text-[#666] uppercase">
                  {activeTopic.isCustom ? (
                    <span className="text-[#b07aff] tracking-widest bg-[#b07aff]/10 px-2 py-0.5 rounded border border-[#b07aff]/15">SUJET PERSONNALISÉ</span>
                  ) : (
                    <span className="text-[#00f5c4] tracking-widest">{activeTopic.category}</span>
                  )}
                  <span className="opacity-40">•</span>
                  <span>Session {typeof activeTopic.id === "number" ? activeTopic.id + 1 : "Live"}</span>
                  <span className="opacity-40">•</span>
                  <span className="capitalize text-gray-500">Ton : {debateTone}</span>
                </div>
                <h1 className="text-lg md:text-2xl font-extrabold font-condensed tracking-tight text-white mb-2 leading-snug">
                  {activeTopic.title}
                </h1>
                <p className="text-xs md:text-sm text-gray-400 max-w-4xl leading-relaxed">
                  {activeTopic.description}
                </p>

                {messages.length > 0 && (
                  <div className="flex items-center justify-between gap-4 mt-3 pt-3.5 border-t border-white/[0.05]">
                    <div className="flex gap-5">
                      <div>
                        <div className="text-base font-bold font-condensed text-[#00f5c4] leading-none">{messages.length}</div>
                        <div className="text-[9px] tracking-wider text-[#555] font-condensed uppercase mt-0.5">Interventions</div>
                      </div>
                      <div>
                        <div className="text-base font-bold font-condensed text-[#00f5c4] leading-none">{roundCount}</div>
                        <div className="text-[9px] tracking-wider text-[#555] font-condensed uppercase mt-0.5">Planches</div>
                      </div>
                    </div>
                    <div>
                      <button 
                        onClick={handleReset} 
                        className="flex items-center gap-1 bg-transparent border border-white/5 hover:border-white/10 hover:bg-white/[0.03] text-gray-500 hover:text-white px-2 py-1 rounded text-[10px] font-bold font-condensed uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <ListRestart className="w-3 h-3" />
                        Réinitialiser l'Arène
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Flux de messages & Verdict */}
              <div className="flex-1 overflow-y-auto px-1 py-4 flex flex-col gap-4 min-h-0 h-full mt-1">
                
                {messages.length === 0 && phase === "idle" && (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto">
                    <div className="flex gap-2.5 mb-5 select-none">
                      {AGENTS.map(agent => (
                        <div 
                          key={agent.id} 
                          style={{ borderColor: agent.border, color: agent.color, background: agent.dim }}
                          className="w-10 h-10 rounded-full border flex items-center justify-center text-base font-condensed shadow shadow-black"
                        >
                          {agent.symbol}
                        </div>
                      ))}
                    </div>
                    <h3 className="font-condensed text-base font-bold text-gray-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      🏛️ L'Arène Dialectique est Ouverte
                    </h3>
                    <p className="text-xs text-[#555] leading-relaxed mb-5">
                      Le panel d'orateurs synthétiques est en veille. Personnalisez l'éventuelle participation d'orateurs ou cliquez pour amorcer l'éloquence.
                    </p>
                    <button 
                      onClick={handleStart} 
                      className="flex items-center gap-2 bg-[#00f5c4] hover:bg-[#00e0b0] text-[#050505] border-none font-bold font-condensed tracking-wider text-xs px-5 py-2.5 rounded shadow-lg shadow-[#00f5c4]/10 transition-all cursor-pointer uppercase"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Lancer les délibérations
                    </button>
                  </div>
                )}

                {/* Bouclage de messages */}
                {messages.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} onClap={() => handleClapMessage(msg.id)} />
                ))}

                {/* Indicateur de réflexion */}
                {loadingAgent && (
                  <ThinkingBubble agentId={loadingAgent} />
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
                  <VerdictDisplay widgetVerdict={verdict} />
                )}

                {/* Synthèse textuelle */}
                {summary && (
                  <SummaryWidget summary={summary} topic={activeTopic} messagesCount={messages.length} />
                )}

                {isClosed && !closingProgress && (
                  <div className="p-4 md:p-5 bg-emerald-500/[0.01] border border-emerald-500/10 rounded-xl mt-2 animate-fadeSlideUp">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-condensed font-bold text-sm text-emerald-400 tracking-wider uppercase mb-1">PROGÈS-VERBAL SAUVEGARDÉ</div>
                        <p className="text-[11px] text-[#777] leading-relaxed">
                          La table ronde asymétrique a été validée et enregistrée avec succès. Vous pouvez consulter les archives de la session sous l'onglet "Archives" du studio de débat.
                        </p>
                        <div className="flex gap-2.5 mt-3">
                          <button 
                            onClick={handleReset} 
                            className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-condensed font-bold text-[10px] uppercase tracking-wider py-1.5 px-3.5 rounded cursor-pointer transition-colors"
                          >
                            Entamer un nouveau débat
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} className="h-6" />
              </div>

              {/* BARRE D'ENTRÉE PARTICIPATION DE L'UTILISATEUR HUMAIN */}
              {!isClosed && (
                <div className="border-t border-white/[0.05] pt-3 pb-2 flex flex-col gap-2 shrink-0 bg-[#050505] z-10">
                  <form onSubmit={handlePostUserContribution} className="flex gap-2 items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs shrink-0 select-none">
                      👤
                    </div>
                    <input 
                      type="text" 
                      placeholder="Participez à la table ronde avec vos propres thèses... (exprimez-vous)"
                      value={userContribution}
                      onChange={e => setUserContribution(e.target.value)}
                      className="flex-1 bg-black border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-gray-600"
                    />
                    <button 
                      type="submit"
                      disabled={!userContribution.trim() || isSubmittingUserContribution}
                      className="bg-blue-600 hover:bg-blue-500 border-none font-bold font-condensed text-xs text-white px-3.5 py-1.5 rounded cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      {isSubmittingUserContribution ? "Envoi..." : "Intervenir"}
                    </button>
                  </form>
                  <p className="text-[10px] text-gray-500 pl-10">
                    💡 Votre intervention sera insérée dans le flux du débat. Les prochaines interventions des modèles se calqueront en réagissant à votre argumentation.
                  </p>
                </div>
              )}

              {/* Actions Controls Panel */}
              <div className="border border-white/[0.06] p-3 bg-[#050505]/95 backdrop-blur-md rounded-xl flex items-center justify-between gap-4 flex-wrap shrink-0">
                
                <div className="flex gap-2">
                  {phase === "idle" && (
                    <button 
                      onClick={handleStart} 
                      className="flex items-center gap-1.5 bg-[#00f5c4] hover:bg-[#00e0b0] text-[#050505] border-none font-bold font-condensed tracking-wider text-[11px] px-4 py-2 rounded shadow-lg shadow-[#00f5c4]/10 transition-all cursor-pointer uppercase"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Faire parler les modèles
                    </button>
                  )}

                  {phase === "running" && (
                    <button 
                      onClick={handlePause} 
                      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/5 font-bold font-condensed tracking-wider text-[11px] px-4 py-2 rounded transition-all cursor-pointer uppercase"
                    >
                      <Pause className="w-3 h-3 fill-current" />
                      Mettre en pause
                    </button>
                  )}

                  {phase === "paused" && (
                    <>
                      <button 
                        onClick={handleContinue} 
                        className="flex items-center gap-1.5 bg-[#00f5c4] hover:bg-[#00e0b0] text-[#050505] border-none font-bold font-condensed tracking-wider text-[11px] px-4 py-2 rounded shadow-lg shadow-[#00f5c4]/10 transition-all cursor-pointer uppercase"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin duration-1000" />
                        Poursuivre le tour de table
                      </button>
                      <button 
                        onClick={handleStopAndSummarize} 
                        className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-[#ef4444] border border-red-500/20 font-bold font-condensed tracking-wider text-[11px] px-4 py-2 rounded transition-all cursor-pointer uppercase"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        Arrêter & Délibérer le Verdict
                      </button>
                    </>
                  )}
                </div>

                {!isClosed && phase !== "running" && activeMode === "temporal" && (
                  <div className="hidden sm:flex items-center gap-2 text-right text-gray-500 max-w-[280px]">
                    <div className="min-w-0">
                      <div className="text-[9px] tracking-wider uppercase font-condensed text-gray-600">Rotation suivante :</div>
                      <div className="text-xs text-gray-400 truncate font-condensed font-bold">{nextTopic.title}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          /* ── ONGLETS ARCHIVES ET SUPPORTS DE REVISE ──────────────────────── */
          <div className="flex-1 flex flex-col overflow-hidden py-2 animate-fadeSlideUp">
            
            {selectedArchive ? (
              /* Vue détaillée de l'archive enregistrée */
              <div className="flex-1 overflow-y-auto pr-1">
                <button 
                  onClick={() => setSelectedArchive(null)} 
                  className="flex items-center gap-1.5 bg-transparent border-none text-[#999] hover:text-white cursor-pointer text-xs font-bold font-condensed tracking-wider uppercase mb-5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la liste des archives
                </button>

                <div className="p-5 bg-[#090909]/80 border border-white/[0.04] rounded-xl mb-6 flex flex-col md:flex-row justify-between gap-4">
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
                  <div>
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
                  <VerdictDisplay widgetVerdict={selectedArchive.verdict} />
                )}

                {/* Synthèse finale d'archive */}
                {selectedArchive.summary && (
                  <SummaryWidget summary={selectedArchive.summary} topic={selectedArchive.topic} messagesCount={selectedArchive.messages.length} />
                )}

                <div className="mt-8 flex flex-col gap-4">
                  <div className="text-xs font-bold font-condensed text-gray-500 tracking-widest uppercase border-b border-white/[0.06] pb-2">
                    RETRANSCRIPTION INTÉGRALE DES DISCOURS
                  </div>
                  {selectedArchive.messages.map(msg => (
                    <MessageBubble key={msg.id} msg={msg} />
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
                  <div className="flex flex-col gap-4">
                    {archives.map((arc, i) => (
                      <div 
                        key={arc.key} 
                        onClick={() => setSelectedArchive(arc)} 
                        className="p-5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] hover:border-[#00f5c4]/30 rounded-xl cursor-pointer transition-all duration-200"
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
                          
                          <div className="text-right shrink-0">
                            <div className="text-2xl font-black font-condensed text-[#00f5c4] leading-none mb-0.5">
                              {arc.messages.length}
                            </div>
                            <div className="text-[9px] text-[#555] font-condensed uppercase tracking-wider mb-2">Dispositions</div>
                            <div className="text-xs text-[#666] font-condensed">
                              {new Date(arc.closedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </div>
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

      {/* ── FOOTER DES DÉBATEURS ACTIFS EN PIED (Seulement sous l'onglet débat) ── */}
      {tab === "debate" && (
        <div className="border-t border-white/[0.06] bg-[#050505]/95 z-20 flex flex-wrap sm:flex-nowrap">
          {AGENTS.map((agent, i) => {
            const isActive = activeAgentsFlags[agent.id];
            return (
              <div 
                key={agent.id} 
                className={`flex-1 min-w-[130px] border-b sm:border-b-0 sm:border-r border-white/[0.05] p-3 flex items-center gap-3 transition-colors duration-300 ${
                  loadingAgent === agent.id ? agent.dim : "transparent"
                } ${!isActive ? 'opacity-30' : ''}`}
              >
                <div 
                  style={{ 
                    color: loadingAgent === agent.id ? agent.color : (isActive ? agent.color : "rgb(60,60,60)"),
                    borderColor: loadingAgent === agent.id ? agent.color : "transparent",
                    background: loadingAgent === agent.id ? agent.dim : "transparent"
                  }}
                  className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-semibold transition-all duration-300 select-none"
                >
                  {agent.symbol}
                </div>
                <div className="min-w-0 flex-1">
                  <div 
                    className="font-condensed font-bold text-xs tracking-wider transition-colors duration-300 uppercase truncate"
                    style={{ color: loadingAgent === agent.id ? agent.color : (isActive ? "#9ca3af" : "#444") }}
                  >
                    {agent.name}
                  </div>
                  <div className="text-[9px] text-gray-500 truncate leading-none mt-0.5">{agent.role}</div>
                </div>
                {loadingAgent === agent.id && (
                  <div className="ml-auto flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f5c4] animate-ping" style={{ backgroundColor: agent.color }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── COMPONENT: MESSAGE BUBBLE ───────────────────────────────────────────────
function MessageBubble({ msg, onClap }: { msg: Message; onClap?: () => void; key?: string | number }) {
  const [expanded, setExpanded] = useState(true);
  const isLong = msg.content.length > 550;
  const textToShow = !expanded ? msg.content.slice(0, 400) + "…" : msg.content;

  return (
    <div className={`flex gap-3 md:gap-4 animate-fadeSlideUp max-w-4xl ${msg.isUser ? 'ml-auto' : ''}`}>
      <div 
        style={{ 
          borderColor: msg.agentBorder, 
          color: msg.agentColor, 
          background: msg.agentDim,
          boxShadow: `0 0 12px ${msg.agentColor}12`
        }}
        className="w-9 h-9 md:w-10 md:h-10 rounded-full border flex items-center justify-center text-sm font-semibold shrink-0 select-none"
      >
        {msg.agentSymbol}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-condensed font-bold text-sm tracking-wider uppercase" style={{ color: msg.agentColor }}>
            {msg.agentName}
          </span>
          <span className="text-[9px] text-gray-500 font-condensed tracking-wide uppercase">
            {msg.agentRole}
          </span>
          <span className="text-[10px] text-gray-500 ml-auto">
            {msg.time}
          </span>
        </div>
        
        <div 
          className="bg-[#030303] border border-white/[0.04] rounded-r-lg rounded-bl-sm px-4 py-3 text-xs md:text-sm leading-relaxed relative flex flex-col justify-between" 
          style={{ borderLeft: `3px solid ${msg.agentColor}` }}
        >
          <p className="text-gray-200 font-sans leading-relaxed whitespace-pre-wrap select-text">{textToShow}</p>
          
          <div className="flex items-center justify-between gap-4 mt-2 border-t border-white/[0.03] pt-2">
            {isLong ? (
              <button 
                onClick={() => setExpanded(!expanded)} 
                style={{ color: msg.agentColor }}
                className="bg-transparent border-none text-[10px] font-bold font-condensed tracking-wider uppercase cursor-pointer hover:opacity-80 flex items-center gap-1 transition-opacity pr-2"
              >
                {expanded ? "▲ Masquer la thèse" : "▼ Déployer la thèse complète"}
              </button>
            ) : <span />}

            <button 
              onClick={onClap}
              className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-yellow-400 border border-white/5 rounded-full px-2 py-0.5 text-[9px] md:text-[10px] font-condensed uppercase font-bold tracking-wider cursor-pointer flex items-center gap-1.5 transition-all select-none"
            >
              <ThumbsUp className="w-3 h-3 fill-current" />
              <span>Soutenir {msg.claps ? `(${msg.claps})` : ""}</span>
            </button>
          </div>
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
function SummaryWidget({ summary, topic, messagesCount }: { summary: string; topic: Topic; messagesCount: number }) {
  const paragraphs = summary.split("\n").filter(p => p.trim());

  return (
    <div className="animate-summaryReveal border border-[#00f5c4]/15 bg-gradient-to-br from-[#00f5c4]/[0.02] to-[#b07aff]/[0.02] rounded-xl overflow-hidden mt-4">
      
      {/* Header Titre */}
      <div className="px-5 py-4 border-b border-white/[0.04] bg-white/[0.01] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00f5c4] to-[#b07aff] flex items-center justify-center text-black shrink-0 font-bold shadow-md shadow-black select-none">
          <ClipboardList className="w-4 h-4 text-black" />
        </div>
        <div>
          <div className="font-condensed font-black tracking-widest text-sm text-[#00f5c4] uppercase">
            SYNTHÈSE EXÉCUTIVE DES DÉBATS
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-condensed">
            Rapport critique et synthèse transversale par Gemini-3.5-Flash
          </div>
        </div>
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
function VerdictDisplay({ widgetVerdict }: { widgetVerdict: Verdict }) {
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
      <div className="px-5 py-4 border-b border-white/[0.04] bg-white/[0.01] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-black shrink-0 font-bold shadow-md shadow-black select-none">
          <Award className="w-5 h-5 text-black" />
        </div>
        <div>
          <div className="font-condensed font-black tracking-widest text-sm text-amber-400 uppercase">
            VERDICT DU JURY SUPRÊME DES MODÈLES
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-condensed mt-0.5">
            ÉVALUATION CRITIQUE PROTOCOLÉE PAR GEMINI-3.5-FLASH
          </div>
        </div>
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

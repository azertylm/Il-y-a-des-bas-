import { useCallback, useEffect, useRef, useState } from "react";
import { AGENTS, CONTEXT_EXCERPT_LENGTH, CONTEXT_MESSAGE_COUNT, NEUTRAL_METRICS } from "../constants.ts";
import { computeOpinionMetrics } from "../lib/metrics.ts";
import { excerpt, isAbort } from "../lib/text.ts";
import { getNextCycleBoundary, getSecondsUntilNextCycle } from "../lib/time.ts";
import { resolveClientId } from "../lib/storage.ts";
import { clearSession, loadSession, saveSession } from "../lib/session.ts";
import type {
  ApiEnvelope,
  Archive,
  DebateMode,
  DebatePhase,
  Message,
  OpinionMetrics,
  FallacyAnalysis,
  Topic,
  Treaty,
  Verdict,
} from "../types.ts";

/** Réglages de séance dont dépend le déroulé, fournis par l'interface. */
export interface DebateSettings {
  activeTopic: Topic;
  activeMode: DebateMode;
  debateTone: string;
  speechLength: string;
  activeAgentsFlags: { [key: string]: boolean };
  apiKeys: { [key: string]: string };
  /** Appelé à chaque bascule de cycle horaire, en mode temporel comme en mode manuel. */
  onCycleRollover?: () => void;
}

/**
 * Machinerie complète d'une séance : déroulé du tour de table, clôture,
 * archives, minuterie de cycle et métriques. L'interface n'en consomme que
 * l'état et les actions ; elle n'orchestre plus rien elle-même.
 */
export function useDebateEngine({
  activeTopic,
  activeMode,
  debateTone,
  speechLength,
  activeAgentsFlags,
  apiKeys,
  onCycleRollover,
}: DebateSettings) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [phase, setPhase] = useState<DebatePhase>("idle");
  const [loadingAgent, setLoadingAgent] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(getSecondsUntilNextCycle);
  const [roundCount, setRoundCount] = useState(0);
  const [summary, setSummary] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [closingProgress, setClosingProgress] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Signalement visible d'une réponse produite par le moteur de secours local.
  const [degradedNotice, setDegradedNotice] = useState<string | null>(null);
  const [summaryDegraded, setSummaryDegraded] = useState(false);
  const [summaryReason, setSummaryReason] = useState("");
  const [verdictDegraded, setVerdictDegraded] = useState(false);
  const [verdictReason, setVerdictReason] = useState("");
  const [opinionMetrics, setOpinionMetrics] = useState<OpinionMetrics>(NEUTRAL_METRICS);
  const [isSubmittingUserContribution, setIsSubmittingUserContribution] = useState(false);
  const [treaty, setTreaty] = useState<Treaty | null>(null);
  const [treatyDegraded, setTreatyDegraded] = useState(false);
  const [treatyReason, setTreatyReason] = useState("");
  // Analyses rhétoriques, indexées par identifiant de message.
  const [fallacyAnalyses, setFallacyAnalyses] = useState<{ [msgId: string]: FallacyAnalysis }>({});
  const [analyzingMessageId, setAnalyzingMessageId] = useState<string | null>(null);
  // Séance retrouvée en stockage de session et proposée à la reprise.
  const [restorable] = useState(loadSession);
  const [restored, setRestored] = useState(false);

  const clientId = useRef<string>(resolveClientId()).current;
  // Lu par les rappels stables, qui ne doivent pas se recréer à chaque
  // changement de sujet.
  const activeTopicRef = useRef(activeTopic);
  activeTopicRef.current = activeTopic;
  // Idem pour la bascule de cycle : la minuterie ne doit pas se reconstruire
  // à chaque rendu sous prétexte que le rappel a changé d'identité.
  const rolloverRef = useRef(onCycleRollover);
  rolloverRef.current = onCycleRollover;

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-client-id": clientId,
    };
    if (apiKeys.chatgpt) headers["x-openai-api-key"] = apiKeys.chatgpt;
    if (apiKeys.claude) headers["x-anthropic-api-key"] = apiKeys.claude;
    if (apiKeys.gemini) headers["x-gemini-api-key"] = apiKeys.gemini;
    if (apiKeys.deepseek) headers["x-deepseek-api-key"] = apiKeys.deepseek;
    if (apiKeys.mistral) headers["x-mistral-api-key"] = apiKeys.mistral;
    if (apiKeys.grok) headers["x-grok-api-key"] = apiKeys.grok;
    return headers;
  }, [apiKeys, clientId]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stopRequested = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  // Annule les requêtes encore en vol lors d'une pause ou d'une réinitialisation.
  const abortRef = useRef<AbortController | null>(null);

  // La clôture est déclenchée par un effet ; en mode strict React invoque les
  // effets deux fois, et « Arrêter & Délibérer » l'appelait déjà en direct.
  // Sans cette garde, la séance était synthétisée et archivée en double.
  const closingRef = useRef(false);

  const abortInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  // Ne jamais laisser une requête survivre au démontage du composant.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Garder les messages dans un ref pour les boucles asynchrones
  useEffect(() => {
    messagesRef.current = messages;
    setOpinionMetrics(computeOpinionMetrics(messages));
  }, [messages]);

  // Construction du contexte des messages récents pour orienter la confrontation

  const buildContext = useCallback((currentAgentId: string, currentMessages: Message[]) => {
    const recent = currentMessages.slice(-CONTEXT_MESSAGE_COUNT).filter(m => m.agentId !== currentAgentId);
    if (!recent.length) return "";

    const lines = recent.map(m => {
      if (m.isUser) {
        return `Le participant Humain (${m.agentRole}) a affirmé l'argument suivant : "${m.content}"`;
      }
      return `${m.agentName} (${m.agentRole}) a formulé : "${excerpt(m.content, CONTEXT_EXCERPT_LENGTH)}"`;
    }).join("\n\n");

    const userInRecent = recent.some(m => m.isUser);
    const userInstruction = userInRecent 
      ? "\n💡 CRITICAL : Un citoyen humain vient de participer directement à la conversation. Tu dois impérativement réagir à ses arguments, le mentionner ou rebondir précisément sur ses propos."
      : "";

    return `\n\nVoici les thèses récemment défendues par l'arène :\n${lines}\n\nPrends position, critique ou complète ces thèses.${userInstruction}`;
  }, []);

  // Récupérer les archives du serveur local
  const fetchArchives = useCallback(async () => {
    try {
      const res = await fetch("/api/archives", { headers: { "x-client-id": clientId } });
      if (res.ok) {
        const data = await res.json();
        setArchives(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Problème lors du chargement des archives:", e);
    }
  }, [clientId]);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  // Timer de session de la rotation par défaut.
  // On compare des horodatages absolus : un onglet en arrière-plan voit ses
  // minuteries ralenties par le navigateur, et une égalité stricte à zéro
  // seconde serait tout simplement sautée. Ici, tout retard est rattrapé.
  useEffect(() => {
    let boundary = getNextCycleBoundary();

    const tick = () => {
      const remainingMs = boundary - Date.now();
      setTimeLeft(Math.max(0, Math.ceil(remainingMs / 1000)));

      if (remainingMs > 0) return;

      // Le créneau est écoulé (éventuellement depuis un moment) : on referme
      // la séance en cours puis on vise la borne suivante.
      boundary = getNextCycleBoundary();
      setTimeLeft(Math.max(0, Math.ceil((boundary - Date.now()) / 1000)));
      // Le sujet du cycle a changé : l'interface doit suivre, quel que soit
      // le mode — c'est elle qui décide quand l'appliquer sans risque.
      rolloverRef.current?.();
      if (activeMode === "temporal") {
        setPhase(p => (p !== "closing" && p !== "closed") ? "closing" : p);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    // Resynchronisation immédiate au retour au premier plan.
    const onVisibility = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [activeMode]);

  // Clôture du débat avec génération d'analyses et du Verdict du Grand Jury
  const closeDebate = useCallback(async (currentMessages: Message[]) => {
    if (closingRef.current) return;
    closingRef.current = true;
    setPhase("closing");
    setLoadingAgent(null);
    setClosingProgress("Le Grand Tribunal des Modèles délibère sur les arguments...");
    setErrorMessage(null);

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    let sumText = "";
    let finalVerdict: Verdict | undefined = undefined;
    let sumDegraded = false;
    let sumReason = "";
    let judgeDegraded = false;
    let judgeReason = "";
    let finalTreaty: Treaty | undefined = undefined;
    let treatyIsDegraded = false;
    let treatyWhy = "";

    try {
      if (currentMessages.length > 0) {
        // 1. Génération de la synthèse générale
        const res = await fetch("/api/debate/summary", {
          method: "POST",
          headers: getHeaders(),
          signal: controller.signal,
          body: JSON.stringify({
            topicTitle: activeTopic.title,
            topicDescription: activeTopic.description,
            messages: currentMessages,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Erreur de communication lors de la génération du résumé.");
        }

        const data: ApiEnvelope & { text?: string } = await res.json();
        sumText = data.text || "";
        sumDegraded = Boolean(data.degraded);
        sumReason = data.reason || "";
        setSummary(sumText);
        setSummaryDegraded(sumDegraded);
        setSummaryReason(sumReason);

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
          signal: controller.signal,
          body: JSON.stringify({
            systemPrompt: "Tu es le Président impartial du Comité de Sages du Grand Tribunal d'éloquence artificielle. Tu juges de façon philosophique et pointue.",
            topicTitle: `JURY : ${activeTopic.title}`,
            topicDescription: "Rendre des décisions motivées au format JSON unique.",
            context: juryPrompt,
            agentId: "gemini"
          }),
        });

        if (!juryRes.ok) {
          const err = await juryRes.json().catch(() => ({}));
          throw new Error(err.error || "Erreur de communication lors de la délibération du jury.");
        }

        const juryData: ApiEnvelope & { text?: string } = await juryRes.json();
        judgeDegraded = Boolean(juryData.degraded);
        judgeReason = juryData.reason || "";
        setVerdictDegraded(judgeDegraded);
        setVerdictReason(judgeReason);
        try {
          let cleanText = (juryData.text || "").trim();
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

        // 3. Rédaction du traité de consensus : ce sur quoi l'arène pourrait
        //    réellement s'accorder, par-delà les positions défendues.
        setClosingProgress("Le greffier consigne les articles du traité de consensus...");

        try {
          const treatyRes = await fetch("/api/debate/treaty", {
            method: "POST",
            headers: getHeaders(),
            signal: controller.signal,
            body: JSON.stringify({
              topicTitle: activeTopic.title,
              topicDescription: activeTopic.description,
              messages: currentMessages,
            }),
          });

          if (treatyRes.ok) {
            const treatyData: ApiEnvelope & { treaty?: Treaty } = await treatyRes.json();
            if (treatyData.treaty) {
              finalTreaty = treatyData.treaty;
              treatyIsDegraded = Boolean(treatyData.degraded);
              treatyWhy = treatyData.reason || "";
              setTreaty(finalTreaty);
              setTreatyDegraded(treatyIsDegraded);
              setTreatyReason(treatyWhy);
            }
          }
        } catch (e) {
          // Le traité est un complément : son absence ne doit pas faire échouer
          // la clôture, qui porte déjà la synthèse et le verdict.
          if (isAbort(e)) throw e;
          console.warn("Traité de consensus indisponible pour cette séance.", e);
        }
      } else {
        sumText = "Le débat s'est achevé sans aucune plaidoirie de part et d'autre.";
        setSummary(sumText);
      }
    } catch (e: any) {
      if (isAbort(e)) {
        setClosingProgress("");
        closingRef.current = false;
        return;
      }
      console.error(e);
      sumText = "La synthèse prospective et les analyses du jury sont temporairement inaccessibles en raison d'un conflit réseau.";
      setSummary(sumText);
      setErrorMessage(e.message || "Erreur de traitement des données de synthèse.");
    }

    if (sumDegraded || judgeDegraded || treatyIsDegraded) {
      setDegradedNotice(
        "La clôture de séance a été rédigée par le moteur de secours local : ni la synthèse, ni le verdict, ni le traité ne proviennent d'une génération réelle."
      );
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
      summaryDegraded: sumDegraded,
      summaryReason: sumReason,
      verdictDegraded: judgeDegraded,
      verdictReason: judgeReason,
      treaty: finalTreaty,
      treatyDegraded: treatyIsDegraded,
      treatyReason: treatyWhy,
    };

    try {
      const saveRes = await fetch("/api/archives", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(record),
      });
      if (saveRes.ok) {
        fetchArchives(); // Refresh storage files archive on backend
      }
    } catch (err) {
      console.error("Problème d'enregistrement de l'archive:", err);
    }

    if (abortRef.current === controller) abortRef.current = null;
    setClosingProgress("");
    setPhase("closed");
    closingRef.current = false;
  }, [activeTopic, roundCount, getHeaders]);

  useEffect(() => {
    if (phase === "closing") {
      closeDebate(messagesRef.current);
    }
  }, [phase, closeDebate]);

  // Lancement des thèmes suggérés dynamiquement par Gemini

  const handlePostUserContribution = (rawContribution: string) => {
    const userContribution = rawContribution.trim();
    if (!userContribution || isSubmittingUserContribution) return false;

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
      content: userContribution,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      isUser: true,
      claps: 0,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsSubmittingUserContribution(false);

    // Si on est en train de tourner, on permet aux IA suivantes de réagir immédiatement
    if (phase === "paused" || phase === "idle") {
      setPhase("paused"); // Ensure pause status is ready for continuous table round
    }
    return true;
  };

  // Algorithme de génération séquentielle des IA
  const runAgents = useCallback(async (agentList: typeof AGENTS) => {
    setPhase("running");
    setErrorMessage(null);
    stopRequested.current = false;

    // Un contrôleur par tour de table : « Pause » et « Réinitialiser » coupent
    // net la requête en vol au lieu de la laisser aboutir dans le vide.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Filtration selon les agents sélectionnés par l'utilisateur
    const activeAgents = agentList.filter(a => activeAgentsFlags[a.id]);
    if (activeAgents.length === 0) {
      setErrorMessage("Veuillez sélectionner au moins un décodeur IA actif dans les configurations pour débattre.");
      setPhase("paused");
      return;
    }

    // Un orateur défaillant est écarté du tour, il n'interrompt plus la séance.
    const failures: string[] = [];
    const degradations: string[] = [];

    for (const agent of activeAgents) {
      if (stopRequested.current || controller.signal.aborted) break;
      
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
          signal: controller.signal,
          body: JSON.stringify({
            systemPrompt: enhancedPrompt,
            topicTitle: activeTopic.title,
            topicDescription: activeTopic.description,
            context,
            agentId: agent.id,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Erreur de traitement sur le modèle d'${agent.name}`);
        }

        const data: ApiEnvelope & { text?: string } = await res.json();
        const text = data.text;
        if (!text) throw new Error(`${agent.name} n'a renvoyé aucun texte.`);

        if (data.degraded) degradations.push(agent.name);

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
          degraded: Boolean(data.degraded),
          degradedReason: data.reason || "",
        };

        setMessages(prev => [...prev, msg]);
      } catch (e: any) {
        if (isAbort(e)) break;
        // On note la défaillance et on passe à l'orateur suivant : une panne
        // isolée ne doit plus faire tomber tout le tour de table.
        console.error(agent.name, e);
        failures.push(agent.name);
      } finally {
        setLoadingAgent(null);
      }

      if (stopRequested.current || controller.signal.aborted) break;
      // Temporisation de lecture réaliste
      await new Promise(r => setTimeout(r, 650));
    }

    if (abortRef.current === controller) abortRef.current = null;

    if (controller.signal.aborted) {
      setPhase(p => (p === "closing" || p === "closed") ? p : "paused");
      return;
    }

    if (failures.length) {
      setErrorMessage(
        failures.length === activeAgents.length
          ? "Aucun orateur n'a pu s'exprimer durant ce tour. Vérifiez votre connexion réseau, puis relancez la table ronde."
          : `Orateur(s) écarté(s) de ce tour faute de réponse : ${failures.join(", ")}. Le débat se poursuit avec les autres.`
      );
    }

    if (degradations.length) {
      setDegradedNotice(
        `Réponses produites par le moteur de secours local (aucune génération réelle) pour : ${degradations.join(", ")}.`
      );
    }

    setRoundCount(n => n + 1);
    setPhase(p => (p === "closing" || p === "closed") ? p : "paused");
  }, [buildContext, activeTopic, activeAgentsFlags, debateTone, speechLength, getHeaders]);

  // Contrôleurs interactifs principaux
  const handleStart = () => {
    runAgents(AGENTS);
  };

  const handlePause = () => {
    stopRequested.current = true;
    abortInFlight();
    setLoadingAgent(null);
    setPhase("paused");
  };

  const handleContinue = () => {
    const offset = roundCount % AGENTS.length;
    runAgents([...AGENTS.slice(offset), ...AGENTS.slice(0, offset)]);
  };

  const handleStopAndSummarize = () => {
    stopRequested.current = true;
    setPhase("closing");
  };

  const handleReset = () => {
    stopRequested.current = true;
    abortInFlight();
    setMessages([]);
    setRoundCount(0);
    setSummary("");
    setSummaryDegraded(false);
    setSummaryReason("");
    setVerdict(null);
    setVerdictDegraded(false);
    setVerdictReason("");
    setTreaty(null);
    setTreatyDegraded(false);
    setTreatyReason("");
    setFallacyAnalyses({});
    setAnalyzingMessageId(null);
    clearSession();
    setLoadingAgent(null);
    setClosingProgress("");
    closingRef.current = false;
    setPhase("idle");
    setErrorMessage(null);
    setDegradedNotice(null);
  };

  /**
   * Décortique la rhétorique d'une intervention à la demande. Le résultat est
   * mis en cache par message : une deuxième ouverture du panneau ne relance
   * pas d'appel.
   */
  const handleAnalyzeFallacies = useCallback(async (msg: Message) => {
    if (fallacyAnalyses[msg.id] || analyzingMessageId) return;

    setAnalyzingMessageId(msg.id);
    try {
      const res = await fetch("/api/debate/analyze-fallacy", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          content: msg.content,
          agentName: msg.agentName,
          topicTitle: activeTopicRef.current.title,
        }),
      });
      if (!res.ok) throw new Error("L'analyse rhétorique a échoué.");

      const data: ApiEnvelope & { analysis?: FallacyAnalysis } = await res.json();
      if (!data.analysis) throw new Error("Analyse rhétorique illisible.");

      setFallacyAnalyses(prev => ({
        ...prev,
        [msg.id]: { ...data.analysis!, degraded: Boolean(data.degraded), reason: data.reason || "" },
      }));
    } catch (e: any) {
      if (!isAbort(e)) setErrorMessage(`Analyse rhétorique indisponible : ${e.message}`);
    } finally {
      setAnalyzingMessageId(null);
    }
  }, [fallacyAnalyses, analyzingMessageId, getHeaders]);

  // Référence stable : c'est ce qui permet à `MessageBubble` d'être mémoïsé.
  const handleClapMessage = useCallback((msgId: string) => {
    setMessages(prev => prev.map(m => (
      m.id === msgId ? { ...m, claps: (m.claps || 0) + 1 } : m
    )));
  }, []);

  const handleDeleteArchive = async (key: string) => {
    if (!confirm("Effacer définitivement ce procès-verbal du serveur local de stockage ?")) return;
    try {
      const res = await fetch(`/api/archives/${encodeURIComponent(key)}`, {
        method: "DELETE",
        headers: { "x-client-id": clientId },
      });
      if (res.ok) {
        fetchArchives();
      }
    } catch (err) {
      console.error("Problème lors du nettoyage du fichier archive:", err);
    }
  };

  // Enclenchement du Mode de sujet configuré par l'utilisateur

  /** Reprend la séance retrouvée en stockage de session. */
  const resumeStoredSession = useCallback(() => {
    if (!restorable) return;
    setMessages(restorable.messages);
    setRoundCount(restorable.roundCount);
    setPhase(restorable.phase);
    setSummary(restorable.summary);
    setSummaryDegraded(restorable.summaryDegraded);
    setSummaryReason(restorable.summaryReason);
    setVerdict(restorable.verdict);
    setVerdictDegraded(restorable.verdictDegraded);
    setVerdictReason(restorable.verdictReason);
    setTreaty(restorable.treaty);
    setTreatyDegraded(restorable.treatyDegraded);
    setTreatyReason(restorable.treatyReason);
    setRestored(true);
  }, [restorable]);

  /** Écarte la séance retrouvée sans la reprendre. */
  const discardStoredSession = useCallback(() => {
    clearSession();
    setRestored(true);
  }, []);

  // Sauvegarde continue : un rechargement accidentel ne doit pas coûter le
  // tour de table en cours. On n'écrit qu'une fois la reprise arbitrée, pour
  // ne pas écraser l'instantané avant que l'utilisateur ait choisi.
  useEffect(() => {
    if (restorable && !restored) return;
    saveSession({
      activeTopic, messages, roundCount, phase,
      summary, summaryDegraded, summaryReason,
      verdict, verdictDegraded, verdictReason,
      treaty, treatyDegraded, treatyReason,
    });
  }, [
    restorable, restored, activeTopic, messages, roundCount, phase,
    summary, summaryDegraded, summaryReason,
    verdict, verdictDegraded, verdictReason,
    treaty, treatyDegraded, treatyReason,
  ]);

  return {
    // état
    messages, phase, loadingAgent, timeLeft, roundCount,
    summary, summaryDegraded, summaryReason,
    verdict, verdictDegraded, verdictReason,
    closingProgress, errorMessage, degradedNotice,
    opinionMetrics, archives, clientId,
    isSubmittingUserContribution,
    treaty, treatyDegraded, treatyReason,
    fallacyAnalyses, analyzingMessageId,
    /** Séance retrouvée au chargement, tant qu'elle n'a été ni reprise ni écartée. */
    restorableSession: restorable && !restored ? restorable : null,
    isClosed: phase === "closed" || phase === "closing",

    // actions
    start: handleStart,
    pause: handlePause,
    resume: handleContinue,
    stopAndSummarize: handleStopAndSummarize,
    reset: handleReset,
    clap: handleClapMessage,
    analyzeFallacies: handleAnalyzeFallacies,
    resumeStoredSession,
    discardStoredSession,
    postUserContribution: handlePostUserContribution,
    deleteArchive: handleDeleteArchive,
    refreshArchives: fetchArchives,
    getHeaders,
    setErrorMessage,
    setDegradedNotice,
  };
}

export type DebateEngine = ReturnType<typeof useDebateEngine>;

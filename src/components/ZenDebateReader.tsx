import * as React from "react";
import { useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ThumbsUp, 
  Volume2, 
  VolumeX, 
  Scale, 
  FileText, 
  RotateCcw,
  CheckCircle,
  Copy,
  Check
} from "lucide-react";
import { Message, Topic, Verdict, Agent } from "../types";
import { FallacyInspector } from "./FallacyInspector";

interface ZenDebateReaderProps {
  messages: Message[];
  activeTopic: Topic;
  loadingAgent: string | null;
  phase: "idle" | "running" | "paused" | "closing" | "closed";
  zenActiveIndex: number;
  onSelectIndex: (idx: number) => void;
  isReadingWaiting: boolean;
  readingCountdown: number;
  isReadingPaused: boolean;
  readingPace: "zen" | "confort" | "manuel" | "rapide";
  waitingNextSpeaker: string | null;
  onToggleReadingPause: () => void;
  onSkipReadingWait: () => void;
  onChangeReadingPace: (pace: "zen" | "confort" | "manuel" | "rapide") => void;
  onStart: () => void;
  onContinue: () => void;
  onPause: () => void;
  onCloseDebate: () => void;
  onReset: () => void;
  onClapMessage: (id: string) => void;
  getHeaders?: () => Record<string, string>;
  fontSizeLevel?: "normal" | "large" | "xlarge";
  verdict: Verdict | null;
  summary: string;
  closingProgress: string | null;
  agentsList: Agent[];
}

export function ZenDebateReader({
  messages,
  activeTopic,
  loadingAgent,
  phase,
  zenActiveIndex,
  onSelectIndex,
  isReadingWaiting,
  readingCountdown,
  isReadingPaused,
  readingPace,
  waitingNextSpeaker,
  onToggleReadingPause,
  onSkipReadingWait,
  onChangeReadingPace,
  onStart,
  onContinue,
  onCloseDebate,
  onReset,
  onClapMessage,
  getHeaders,
  fontSizeLevel = "normal",
  verdict,
  summary,
  closingProgress,
  agentsList
}: ZenDebateReaderProps) {
  const [activeTab, setActiveTab] = useState<"speech" | "verdict" | "summary">("speech");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Synchronise automatiquement l'onglet si verdict ou synthèse arrive
  useEffect(() => {
    if (phase === "closed" && verdict && activeTab === "speech" && messages.length > 0) {
      // Garder sur speech ou laisser le choix
    }
  }, [phase, verdict]);

  // Si on est en train de lire une réplique
  const currentMsg: Message | undefined = messages[zenActiveIndex] || messages[messages.length - 1];
  const loadingAgentObj = agentsList.find(a => a.id === loadingAgent);

  // Synthèse vocale navigateur (TTS)
  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    if (!currentMsg) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentMsg.content);
    utterance.lang = "fr-FR";
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Copier le discours
  const handleCopy = () => {
    if (!currentMsg) return;
    navigator.clipboard.writeText(`${currentMsg.agentName} : ${currentMsg.content}`);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  // Raccourcis clavier : Flèche gauche / droite, Espace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ne pas intercepter si l'utilisateur est dans un input ou textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (zenActiveIndex > 0) {
          onSelectIndex(zenActiveIndex - 1);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (isReadingWaiting) {
          onSkipReadingWait();
        } else if (zenActiveIndex < messages.length - 1) {
          onSelectIndex(zenActiveIndex + 1);
        }
      } else if (e.key === " ") {
        e.preventDefault();
        if (isReadingWaiting) {
          if (readingPace === "manuel") {
            onSkipReadingWait();
          } else {
            onToggleReadingPause();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zenActiveIndex, messages.length, isReadingWaiting, readingPace, onSelectIndex, onSkipReadingWait, onToggleReadingPause]);

  // Arrêt de la voix si on change de message
  useEffect(() => {
    if (isSpeaking && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [zenActiveIndex]);

  // Typographie responsive
  const contentFontClass = fontSizeLevel === "xlarge" 
    ? "text-base sm:text-lg md:text-xl leading-relaxed text-gray-100" 
    : fontSizeLevel === "large" 
    ? "text-sm sm:text-base md:text-lg leading-relaxed text-gray-100" 
    : "text-xs sm:text-[14px] md:text-base leading-relaxed text-gray-200";

  // Durée totale en fonction du rythme
  const maxCountdown = readingPace === "zen" ? 10 : readingPace === "confort" ? 6 : 2;
  const progressPercent = maxCountdown > 0 
    ? Math.max(0, Math.min(100, (readingCountdown / maxCountdown) * 100))
    : 0;

  // 1. ÉTAT IDLE : Débat non encore lancé
  if (messages.length === 0 && phase === "idle") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 text-center bg-[#07070a]/90 border border-white/[0.08] rounded-xl my-auto animate-fadeSlideUp shadow-xl">
        <div className="flex gap-2 mb-3 select-none">
          {agentsList.map(agent => (
            <div 
              key={agent.id} 
              style={{ borderColor: agent.border, color: agent.color, background: agent.dim }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center text-sm font-bold shadow-md shadow-black transition-transform hover:scale-110"
              title={`${agent.name} - ${agent.role}`}
            >
              {agent.symbol}
            </div>
          ))}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00f5c4]/10 border border-[#00f5c4]/30 text-[#00f5c4] text-xs font-bold uppercase tracking-wider mb-2">
          <span>📖 Mode Lecture Tranquille (Sans scroll)</span>
        </div>
        <h2 className="text-sm sm:text-base md:text-lg font-black font-condensed text-white uppercase tracking-wider mb-1 max-w-md">
          {activeTopic.title}
        </h2>
        <p className="text-xs text-gray-400 max-w-md leading-relaxed mb-4">
          Chaque intervention apparaîtra ici au centre de votre écran. Vous pourrez lire chaque orateur sereinement, sans jamais avoir besoin de faire défiler la page.
        </p>
        <button 
          onClick={onStart} 
          className="flex items-center gap-2 bg-[#00f5c4] hover:bg-[#00e0b0] text-black border-none font-bold text-xs sm:text-sm px-5 py-2 rounded-xl shadow-lg shadow-[#00f5c4]/30 transition-all cursor-pointer uppercase tracking-wider ring-2 ring-[#00f5c4]/50 hover:scale-[1.02]"
        >
          <Play className="w-4 h-4 fill-current text-black" />
          <span>Lancer le débat en mode lecture</span>
        </button>
      </div>
    );
  }

  // 2. ÉTAT INITIAL : Premier agent qui réfléchit
  if (messages.length === 0 && loadingAgent && loadingAgentObj) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#07070a]/90 border border-white/[0.08] rounded-xl animate-fadeSlideUp shadow-xl">
        <div 
          style={{ borderColor: loadingAgentObj.color, color: loadingAgentObj.color, background: loadingAgentObj.dim }}
          className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl font-bold mb-3 shadow-xl animate-pulse"
        >
          {loadingAgentObj.symbol}
        </div>
        <div className="flex items-center gap-2 text-[#00f5c4] text-xs font-bold uppercase tracking-widest mb-1">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Ouverture de la séance</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-white mb-1" style={{ color: loadingAgentObj.color }}>
          {loadingAgentObj.name} élabore sa thèse inaugurale...
        </h3>
        <p className="text-xs text-gray-400 max-w-sm mb-3">
          {loadingAgentObj.role}
        </p>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className="w-2 h-2 rounded-full animate-bounce" 
              style={{ backgroundColor: loadingAgentObj.color, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#08080b] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl p-1.5 sm:p-2.5 gap-2 relative">
      
      {/* ── BARRE SUPÉRIEURE : NAVIGATION D'ORATEURS & SÉLECTEUR DE RYTHME ── */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/[0.06] pb-1.5 shrink-0">
        
        {/* Navigation précédent / suivant */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onSelectIndex(Math.max(0, zenActiveIndex - 1))}
            disabled={zenActiveIndex <= 0}
            className="p-1 sm:px-2 sm:py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none text-gray-300 hover:text-white border border-white/[0.08] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Intervention précédente (Flèche Gauche ←)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Précédent</span>
          </button>

          <span className="px-2 py-0.5 rounded bg-black/50 border border-white/[0.08] text-xs font-mono font-bold text-[#00f5c4]">
            {messages.length > 0 ? `${zenActiveIndex + 1} / ${messages.length}` : "0"}
          </span>

          <button
            onClick={() => {
              if (isReadingWaiting) {
                onSkipReadingWait();
              } else {
                onSelectIndex(Math.min(messages.length - 1, zenActiveIndex + 1));
              }
            }}
            disabled={zenActiveIndex >= messages.length - 1 && !isReadingWaiting}
            className="p-1 sm:px-2 sm:py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none text-gray-300 hover:text-white border border-white/[0.08] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Intervention suivante (Flèche Droite →)"
          >
            <span className="hidden sm:inline">Suivant</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pilules de tous les orateurs du tour */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full scrollbar-none">
          {messages.map((m, idx) => {
            const isCurrent = idx === zenActiveIndex;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveTab("speech");
                  onSelectIndex(idx);
                }}
                style={{
                  borderColor: isCurrent ? m.agentColor : "rgba(255,255,255,0.08)",
                  background: isCurrent ? `${m.agentColor}22` : "rgba(255,255,255,0.02)",
                  color: isCurrent ? m.agentColor : "#999",
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[11px] font-bold tracking-tight transition-all cursor-pointer shrink-0 ${
                  isCurrent ? "ring-1 ring-offset-1 ring-offset-black scale-105" : "hover:border-white/20 hover:text-gray-200"
                }`}
                title={`Lire l'intervention de ${m.agentName}`}
              >
                <span className="text-xs">{m.agentSymbol}</span>
                <span className="hidden md:inline">{m.agentName}</span>
                <span className="text-[9px] opacity-60">#{idx + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Sélecteur de Rythme de lecture tranquille */}
        <div className="flex items-center gap-1 bg-black/40 border border-white/[0.08] rounded-lg p-0.5 text-xs shrink-0">
          <span className="text-gray-400 text-[10px] uppercase font-bold px-1 hidden lg:inline">
            ⏱️ Rythme :
          </span>
          {(["zen", "confort", "manuel", "rapide"] as const).map(p => (
            <button
              key={p}
              onClick={() => onChangeReadingPace(p)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${
                readingPace === p
                  ? "bg-[#00f5c4]/20 text-[#00f5c4] border-[#00f5c4]/50 ring-1 ring-[#00f5c4]/30"
                  : "bg-transparent text-gray-400 border-transparent hover:text-gray-200"
              }`}
              title={
                p === "zen" ? "10 secondes pour lire chaque intervention sans scroll" :
                p === "confort" ? "6 secondes de lecture tranquille par orateur" :
                p === "manuel" ? "Mode Manuel : vous appuyez sur Suivant quand vous avez fini de lire" :
                "2 secondes (rapide)"
              }
            >
              {p === "zen" ? "Zen (10s)" : p === "confort" ? "Confort (6s)" : p === "manuel" ? "Manuel" : "Rapide"}
            </button>
          ))}
        </div>
      </div>

      {/* Onglets si le verdict ou résumé est présent */}
      {(verdict || summary) && (
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-1 shrink-0">
          <button
            onClick={() => setActiveTab("speech")}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              activeTab === "speech"
                ? "bg-[#00f5c4]/20 text-[#00f5c4] border border-[#00f5c4]/40"
                : "text-gray-400 hover:text-white"
            }`}
          >
            💬 Discours ({messages.length})
          </button>

          {verdict && (
            <button
              onClick={() => setActiveTab("verdict")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "verdict"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Verdict du Grand Jury</span>
            </button>
          )}

          {summary && (
            <button
              onClick={() => setActiveTab("summary")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "summary"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Synthèse</span>
            </button>
          )}
        </div>
      )}

      {/* ── ZONE CENTRALE : L'INTERVENTION ACTIVE (OU VERDICT/SYNTHÈSE) ── */}
      <div className="flex-1 flex flex-col min-h-0 justify-center">
        
        {activeTab === "speech" && currentMsg && (
          <div 
            className="flex-1 flex flex-col justify-between p-2.5 sm:p-4 rounded-xl bg-[#0c0c10] border border-white/[0.08] relative shadow-lg min-h-0"
            style={{ borderLeft: `4px solid ${currentMsg.agentColor}` }}
          >
            {/* Header de l'orateur */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div 
                  style={{ 
                    borderColor: currentMsg.agentBorder, 
                    color: currentMsg.agentColor, 
                    background: currentMsg.agentDim,
                    boxShadow: `0 0 16px ${currentMsg.agentColor}30`
                  }}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center text-base sm:text-lg font-bold shrink-0 select-none shadow-md"
                >
                  {currentMsg.agentSymbol}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight truncate" style={{ color: currentMsg.agentColor }}>
                      {currentMsg.agentName}
                    </h3>
                    <span className="text-[10px] sm:text-xs text-gray-400 font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] truncate">
                      {currentMsg.agentRole}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                    <span>{currentMsg.time}</span>
                    <span>•</span>
                    <span className="text-gray-400">Plaidoyer #{zenActiveIndex + 1}</span>
                  </div>
                </div>
              </div>

              {/* Outils d'intervention */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Lecture vocale */}
                {"speechSynthesis" in window && (
                  <button
                    onClick={toggleSpeech}
                    className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isSpeaking
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                        : "bg-white/[0.04] text-gray-300 hover:text-white border-white/[0.08]"
                    }`}
                    title={isSpeaking ? "Arrêter la lecture vocale" : "Écouter la voix de cet orateur (TTS)"}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                )}

                {/* Copier */}
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/[0.08] text-xs font-bold transition-all cursor-pointer"
                  title="Copier le discours"
                >
                  {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {/* Soutien / Claps */}
                <button 
                  onClick={() => onClapMessage(currentMsg.id)}
                  className="bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 hover:text-yellow-300 border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all select-none"
                >
                  <ThumbsUp className="w-3 h-3 fill-current text-yellow-400" />
                  <span>{currentMsg.claps || 0}</span>
                </button>
              </div>
            </div>

            {/* Corps du texte - Optimisé pour une lecture intégrale sans défilement */}
            <div className="flex-1 overflow-y-auto my-2 py-1 pr-1 scrollbar-thin select-text flex flex-col justify-center">
              <p className={`font-sans whitespace-pre-wrap ${contentFontClass}`}>
                {currentMsg.content}
              </p>
            </div>

            {/* Analyseur de sophismes & failles argumentatives */}
            {getHeaders && !currentMsg.agentId.startsWith("system") && (
              <div className="pt-1.5 border-t border-white/[0.04] shrink-0">
                <FallacyInspector
                  content={currentMsg.content}
                  agentName={currentMsg.agentName}
                  agentColor={currentMsg.agentColor}
                  topicTitle={activeTopic.title}
                  getHeaders={getHeaders}
                />
              </div>
            )}
          </div>
        )}

        {/* Vue Verdict du jury */}
        {activeTab === "verdict" && verdict && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 rounded-xl bg-[#0c0c10] border border-amber-500/20 text-gray-200">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-xs mb-2">
              <Scale className="w-4 h-4" />
              <span>Verdict et Décision du Grand Jury</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">
              Vainqueur de la dialectique : <span className="text-amber-300">{verdict.winnerId.toUpperCase()}</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-4 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
              {verdict.winnerReason}
            </p>
            <div className="mb-3">
              <div className="text-[11px] font-bold text-gray-400 uppercase mb-1">Citation mémorable retenue :</div>
              <blockquote className="italic text-xs sm:text-sm text-cyan-300 border-l-2 border-cyan-400 pl-3">
                "{verdict.keyCitation}"
              </blockquote>
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase mb-1">Synthèse philosophique générale :</div>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                {verdict.critiqueGénérale}
              </p>
            </div>
          </div>
        )}

        {/* Vue Synthèse générale */}
        {activeTab === "summary" && summary && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 rounded-xl bg-[#0c0c10] border border-purple-500/20 text-gray-200">
            <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-wider text-xs mb-2">
              <FileText className="w-4 h-4" />
              <span>Synthèse Analytique du Débat</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          </div>
        )}

      </div>

      {/* ── BANDEAU INFÉRIEUR ZEN : TEMPS DE LECTURE & ORATEUR SUIVANT ── */}
      <div className="bg-[#0b0b0e] border border-white/[0.08] rounded-xl p-2 px-3 shrink-0">
        
        {/* CAS A : Débat en cours de pause de lecture (l'utilisateur lit tranquillement) */}
        {isReadingWaiting && (
          <div className="flex flex-col gap-1.5 animate-fadeSlideUp">
            <div className="flex flex-wrap items-center justify-between gap-2">
              
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-[#00f5c4] animate-ping" />
                <span className="text-xs font-bold text-gray-300">
                  {readingPace === "manuel" ? (
                    <span>📖 Prenez tout votre temps pour lire cette intervention.</span>
                  ) : (
                    <span>
                      📖 Temps de lecture tranquille : <strong className="text-[#00f5c4]">{readingCountdown}s</strong>
                      {isReadingPaused && <span className="text-amber-400 ml-1.5">(Lecture en pause)</span>}
                    </span>
                  )}
                </span>
                {waitingNextSpeaker && (
                  <span className="text-[11px] text-gray-400 truncate hidden sm:inline">
                    • Suivant : <span className="text-white font-bold">{waitingNextSpeaker}</span>
                  </span>
                )}
              </div>

              {/* Boutons d'action pour la lecture */}
              <div className="flex items-center gap-2 shrink-0">
                {readingPace !== "manuel" && (
                  <button
                    onClick={onToggleReadingPause}
                    className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1 ${
                      isReadingPaused 
                        ? "bg-amber-500/20 text-amber-300 border-amber-400"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border-white/[0.08]"
                    }`}
                    title={isReadingPaused ? "Reprendre le décompte" : "Mettre en pause pour prendre le temps de lire"}
                  >
                    {isReadingPaused ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3" />}
                    <span>{isReadingPaused ? "Reprendre" : "Pause"}</span>
                  </button>
                )}

                <button
                  onClick={onSkipReadingWait}
                  className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#00f5c4] hover:bg-[#00e0b0] text-black shadow-md shadow-[#00f5c4]/20 flex items-center gap-1.5 cursor-pointer transition-all ring-1 ring-[#00f5c4]/50"
                  title="Passer immédiatement à la réplique suivante (Touche Espace ou Flèche Droite)"
                >
                  <span>{waitingNextSpeaker ? `Écouter ${waitingNextSpeaker}` : "Réplique suivante"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Jauge visuelle de lecture progressive si mode temporisé */}
            {readingPace !== "manuel" && (
              <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00f5c4] to-cyan-400 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* CAS B : Prochain orateur en train de formuler sa pensée */}
        {loadingAgent && loadingAgentObj && !isReadingWaiting && (
          <div className="flex items-center justify-between gap-2 animate-fadeSlideUp py-0.5">
            <div className="flex items-center gap-2">
              <div 
                style={{ borderColor: loadingAgentObj.color, color: loadingAgentObj.color }}
                className="w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold animate-spin"
              >
                {loadingAgentObj.symbol}
              </div>
              <span className="text-xs font-bold" style={{ color: loadingAgentObj.color }}>
                {loadingAgentObj.name} élabore sa contre-thèse en réponse...
              </span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div 
                  key={i} 
                  className="w-1.5 h-1.5 rounded-full animate-bounce" 
                  style={{ backgroundColor: loadingAgentObj.color, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* CAS C : Tour de table suspendu / achevé */}
        {phase === "paused" && !isReadingWaiting && !loadingAgent && (
          <div className="flex flex-wrap items-center justify-between gap-2 animate-fadeSlideUp py-0.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-300">
              <CheckCircle className="w-4 h-4 text-[#00f5c4]" />
              <span>Tour d'arène terminé ({messages.length} interventions enregistrées).</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onContinue}
                className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#00f5c4] hover:bg-[#00e0b0] text-black shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Poursuivre le débat</span>
              </button>
              <button
                onClick={onCloseDebate}
                className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-pointer transition-all flex items-center gap-1"
              >
                <Scale className="w-3 h-3 text-amber-400" />
                <span>Conclure avec le Jury</span>
              </button>
            </div>
          </div>
        )}

        {/* CAS D : Délibération de clôture */}
        {phase === "closing" && closingProgress && (
          <div className="flex items-center gap-2 py-0.5 text-xs text-orange-400 font-bold uppercase tracking-wider">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
            <span>{closingProgress}</span>
          </div>
        )}

        {/* CAS E : Débat clos */}
        {phase === "closed" && (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Débat archivé et scellé</span>
            </span>
            <button
              onClick={onReset}
              className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/[0.08] cursor-pointer transition-all flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Nouveau Débat</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

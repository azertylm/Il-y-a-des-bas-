import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { Clock, Cpu, ShieldAlert } from "lucide-react";

import { AGENTS, DEFAULT_TOPICS } from "./constants.ts";
import { getCurrentTopicIndex, fmtTimer } from "./lib/time.ts";
import { loadApiKeys, persistApiKeys } from "./lib/storage.ts";
import { downloadTranscript } from "./lib/export.ts";
import { useDebateEngine } from "./hooks/useDebateEngine.ts";
import { ConfigPanel } from "./components/ConfigPanel.tsx";
import { DebateStage } from "./components/DebateStage.tsx";
import { ArchivePanel } from "./components/ArchivePanel.tsx";
import type { ApiEnvelope, Archive, DebateMode, Topic } from "./types.ts";

/**
 * Coquille de l'application : en-tête, bandeaux d'alerte, bascule d'onglet et
 * pied de page. Le déroulé d'une séance est délégué à `useDebateEngine`, et
 * chaque grande zone à son propre composant.
 */
export default function AIDebate() {
  // Tranche de base. L'indice suit réellement la rotation horaire : il était
  // figé au chargement, si bien qu'après une bascule de cycle l'arène
  // continuait d'afficher — et de débattre — le sujet précédent.
  const [topicIndex, setTopicIndex] = useState(getCurrentTopicIndex);
  const temporalTopic = DEFAULT_TOPICS[topicIndex];
  const nextTopic = DEFAULT_TOPICS[(topicIndex + 1) % DEFAULT_TOPICS.length];

  // Le cycle peut basculer pendant une séance. On mémorise le nouvel indice
  // sans l'appliquer tout de suite : changer `activeTopic` en pleine clôture
  // ferait archiver la séance sous le mauvais sujet.
  const [pendingTopicIndex, setPendingTopicIndex] = useState<number | null>(null);
  const handleCycleRollover = useCallback(() => {
    setPendingTopicIndex(getCurrentTopicIndex());
  }, []);

  // Sujet Actif de la Table Ronde
  const [activeTopic, setActiveTopic] = useState<Topic>(temporalTopic);

  // Navigation
  const [tab, setTab] = useState<"debate" | "archive">("debate");
  const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);

  // --- PARAMÈTRES AVANCÉS ET PERSONNALISATION ---
  const [activeMode, setActiveMode] = useState<DebateMode>("temporal");
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

  // --- CLÉS API DES UTILISATEURS ---
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>(loadApiKeys);
  const [visibleApiKeyIds, setVisibleApiKeyIds] = useState<{ [key: string]: boolean }>({});

  const handleSaveApiKey = (agentId: string, value: string) => {
    const updated = { ...apiKeys, [agentId]: value };
    setApiKeys(updated);
    persistApiKeys(updated);
  };

  const engine = useDebateEngine({
    activeTopic,
    activeMode,
    debateTone,
    speechLength,
    activeAgentsFlags,
    apiKeys,
    onCycleRollover: handleCycleRollover,
  });

  const {
    messages, phase, loadingAgent, timeLeft, roundCount,
    summary, summaryDegraded, summaryReason,
    verdict, verdictDegraded, verdictReason,
    closingProgress, errorMessage, degradedNotice,
    opinionMetrics, archives, isClosed, isSubmittingUserContribution,
    treaty, treatyDegraded, treatyReason,
    fallacyAnalyses, analyzingMessageId, restorableSession,
    getHeaders, setErrorMessage, setDegradedNotice,
  } = engine;

  // Le nouveau sujet ne s'applique qu'une fois l'arène revenue au repos :
  // jamais pendant un tour de table, ni pendant la clôture qui écrit l'archive.
  useEffect(() => {
    if (pendingTopicIndex === null || phase !== "idle") return;
    setTopicIndex(pendingTopicIndex);
    setPendingTopicIndex(null);
    if (activeMode === "temporal") setActiveTopic(DEFAULT_TOPICS[pendingTopicIndex]);
  }, [pendingTopicIndex, phase, activeMode]);

  /** Télécharge le procès-verbal de la séance affichée. */
  const handleExportTranscript = () => {
    downloadTranscript({
      topic: activeTopic,
      messages,
      summary,
      summaryDegraded,
      verdict,
      verdictDegraded,
      treaty,
      treatyDegraded,
      roundCount,
    });
  };

  const handleKeywordSearch = async () => {
    if (!keyword.trim()) return;
    setIsGeneratingTopics(true);
    setErrorMessage(null);
    setDegradedNotice(null);
    try {
      const res = await fetch("/api/debate/suggest-topics", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ keyword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "L'API de suggestion a retourné un statut invalide.");
      }

      // Le serveur enveloppe désormais la liste : { topics, source, degraded, … }
      const data: ApiEnvelope & { topics?: Topic[] } = await res.json();
      const list = Array.isArray(data.topics) ? data.topics : [];
      setSuggestedTopics(list);

      if (data.degraded) {
        setDegradedNotice(
          `Thèmes issus du catalogue local, sans génération réelle. ${data.reason || ""}`.trim()
        );
      }
    } catch (e: any) {
      setErrorMessage(`Impossible de générer des suggestions: ${e.message}`);
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  // Sélection d'un sujet
  const handleSelectTopic = (selected: Topic) => {
    engine.reset();
    setActiveTopic(selected);
    // Masquer les suggestions générées pour nettoyer l'écran
    setSuggestedTopics([]); 
  };

  // Envoi de l'argument utilisateur dans l'arène

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

  const handleSubmitUserContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (engine.postUserContribution(userContribution)) setUserContribution("");
  };

  /** Reprend la séance retrouvée, sujet compris. */
  const handleResumeSession = () => {
    if (restorableSession) setActiveTopic(restorableSession.activeTopic);
    engine.resumeStoredSession();
  };

  const handleDeleteArchive = async (key: string) => {
    if (selectedArchive?.key === key) setSelectedArchive(null);
    await engine.deleteArchive(key);
  };

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

      {/* ── SIGNALEMENT DU MODE DÉGRADÉ ──────────────────────────────────── */}
      {degradedNotice && (
        <div className="bg-amber-500/10 border-b border-amber-500/25 px-6 py-3 flex items-center gap-3 text-sm text-amber-200 z-40 relative animate-fadeSlideUp">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
          <div className="flex-1 leading-snug">
            <strong className="font-condensed tracking-wider uppercase">Mode secours local :</strong> {degradedNotice}
            <span className="block text-[11px] text-amber-200/70 mt-0.5">
              Les textes signalés « Secours local » sont des gabarits pré-rédigés, pas des réponses réellement générées par les modèles.
            </span>
          </div>
          <button onClick={() => setDegradedNotice(null)} className="text-white hover:opacity-100 opacity-60 text-xs font-bold bg-transparent border-none cursor-pointer shrink-0">
            Fermer X
          </button>
        </div>
      )}

      {/* ── CORPS DE L'APPLICATION EN 2 SECTIONS ────────────────────────── */}
      <main className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-hidden w-full max-w-7xl mx-auto px-2 md:px-6 py-2 gap-4">

        {tab === "debate" ? (
          <>
            <ConfigPanel
              activeMode={activeMode}
              onSwitchMode={handleSwitchMode}
              customCategory={customCategory}
              setCustomCategory={setCustomCategory}
              customTitle={customTitle}
              setCustomTitle={setCustomTitle}
              customDesc={customDesc}
              setCustomDesc={setCustomDesc}
              onSubmitCustomTopic={triggerCustomTopicFormSubmit}
              keyword={keyword}
              setKeyword={setKeyword}
              onKeywordSearch={handleKeywordSearch}
              isGeneratingTopics={isGeneratingTopics}
              suggestedTopics={suggestedTopics}
              onSelectTopic={handleSelectTopic}
              debateTone={debateTone}
              setDebateTone={setDebateTone}
              speechLength={speechLength}
              setSpeechLength={setSpeechLength}
              activeAgentsFlags={activeAgentsFlags}
              setActiveAgentsFlags={setActiveAgentsFlags}
              showApiKeys={showApiKeys}
              setShowApiKeys={setShowApiKeys}
              apiKeys={apiKeys}
              setApiKeys={setApiKeys}
              onSaveApiKey={handleSaveApiKey}
              visibleApiKeyIds={visibleApiKeyIds}
              setVisibleApiKeyIds={setVisibleApiKeyIds}
              hasMessages={messages.length > 0}
              opinionMetrics={opinionMetrics}
            />

            <DebateStage
              activeTopic={activeTopic}
              nextTopic={nextTopic}
              activeMode={activeMode}
              debateTone={debateTone}
              messages={messages}
              phase={phase}
              isClosed={isClosed}
              loadingAgent={loadingAgent}
              roundCount={roundCount}
              closingProgress={closingProgress}
              summary={summary}
              summaryDegraded={summaryDegraded}
              summaryReason={summaryReason}
              verdict={verdict}
              verdictDegraded={verdictDegraded}
              verdictReason={verdictReason}
              treaty={treaty}
              treatyDegraded={treatyDegraded}
              treatyReason={treatyReason}
              fallacyAnalyses={fallacyAnalyses}
              analyzingMessageId={analyzingMessageId}
              onAnalyzeFallacies={engine.analyzeFallacies}
              restorableCount={restorableSession?.messages.length ?? 0}
              onResumeSession={handleResumeSession}
              onDiscardSession={engine.discardStoredSession}
              onExportTranscript={handleExportTranscript}
              userContribution={userContribution}
              setUserContribution={setUserContribution}
              isSubmittingUserContribution={isSubmittingUserContribution}
              onPostUserContribution={handleSubmitUserContribution}
              onStart={engine.start}
              onPause={engine.pause}
              onContinue={engine.resume}
              onStopAndSummarize={engine.stopAndSummarize}
              onReset={engine.reset}
              onClap={engine.clap}
            />
          </>
        ) : (
          <ArchivePanel
            archives={archives}
            selectedArchive={selectedArchive}
            setSelectedArchive={setSelectedArchive}
            onDeleteArchive={handleDeleteArchive}
          />
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

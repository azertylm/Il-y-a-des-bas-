import * as React from "react";
import { useEffect, useRef } from "react";
import {
  CheckCircle, ChevronRight, ListRestart, Pause, Play, RefreshCw, Send, Square,
} from "lucide-react";
import { AGENTS } from "../constants.ts";
import type { DebatePhase, Message, Topic, Verdict } from "../types.ts";
import { MessageBubble } from "./MessageBubble.tsx";
import { ThinkingBubble } from "./ThinkingBubble.tsx";
import { SummaryWidget } from "./SummaryWidget.tsx";
import { VerdictDisplay } from "./VerdictDisplay.tsx";

export interface DebateStageProps {
  activeTopic: Topic;
  nextTopic: Topic;
  activeMode: string;
  debateTone: string;

  messages: Message[];
  phase: DebatePhase;
  isClosed: boolean;
  loadingAgent: string | null;
  roundCount: number;
  closingProgress: string;

  summary: string;
  summaryDegraded: boolean;
  summaryReason: string;
  verdict: Verdict | null;
  verdictDegraded: boolean;
  verdictReason: string;

  userContribution: string;
  setUserContribution: (v: string) => void;
  isSubmittingUserContribution: boolean;
  onPostUserContribution: (e: React.FormEvent) => void;

  onStart: () => void;
  onPause: () => void;
  onContinue: () => void;
  onStopAndSummarize: () => void;
  onReset: () => void;
  onClap: (msgId: string) => void;
}

/** Colonne de droite : bannière du sujet, fil des interventions, commandes. */
export function DebateStage({
  activeTopic, nextTopic, activeMode, debateTone,
  messages, phase, isClosed, loadingAgent, roundCount, closingProgress,
  summary, summaryDegraded, summaryReason,
  verdict, verdictDegraded, verdictReason,
  userContribution, setUserContribution, isSubmittingUserContribution,
  onPostUserContribution: handlePostUserContribution,
  onStart: handleStart,
  onPause: handlePause,
  onContinue: handleContinue,
  onStopAndSummarize: handleStopAndSummarize,
  onReset: handleReset,
  onClap,
}: DebateStageProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll au fond du fil de messages durant l'écoute active
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingAgent, summary, closingProgress]);

  return (
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
        <MessageBubble key={msg.id} msg={msg} onClap={onClap} />
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
        <VerdictDisplay widgetVerdict={verdict} degraded={verdictDegraded} reason={verdictReason} />
      )}

      {/* Synthèse textuelle */}
      {summary && (
        <SummaryWidget
          summary={summary}
          topic={activeTopic}
          messagesCount={messages.length}
          degraded={summaryDegraded}
          reason={summaryReason}
        />
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
  );
}

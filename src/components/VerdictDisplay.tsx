import { Award } from "lucide-react";
import { AGENTS } from "../constants.ts";
import type { Verdict } from "../types.ts";
import { RichText } from "./RichText.tsx";
import { DegradedBadge } from "./DegradedBadge.tsx";

// ─── COMPONENT: JURY VERDICT DISPLAY ──────────────────────────────────────────
export function VerdictDisplay({
  widgetVerdict,
  degraded,
  reason,
}: {
  widgetVerdict: Verdict;
  degraded?: boolean;
  reason?: string;
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
      <div className="px-5 py-4 border-b border-white/[0.04] bg-white/[0.01] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-black shrink-0 font-bold shadow-md shadow-black select-none">
          <Award className="w-5 h-5 text-black" />
        </div>
        <div>
          <div className="font-condensed font-black tracking-widest text-sm text-amber-400 uppercase">
            VERDICT DU JURY SUPRÊME DES MODÈLES
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-condensed mt-0.5">
            {degraded ? "TIRAGE LOCAL — AUCUNE DÉLIBÉRATION RÉELLE" : "ÉVALUATION CRITIQUE DU COMITÉ DE SAGES"}
          </div>
        </div>
        {degraded && <DegradedBadge reason={reason} className="ml-auto" />}
      </div>

      {degraded && (
        <div className="px-5 py-2.5 bg-amber-500/[0.06] border-b border-amber-500/20 text-[11px] text-amber-200 leading-snug">
          Ce verdict a été tiré par le moteur de secours local : les notes et distinctions ci-dessous ne résultent
          d'aucune évaluation réelle des arguments.{reason ? ` ${reason}` : ""}
        </div>
      )}

      {/* Contenu du Verdict */}
      <div className="px-5 py-5 flex flex-col gap-4">
        
        {/* Le Vainqueur Oratoire */}
        <div className="p-4 bg-amber-500/[0.03] border border-amber-500/10 rounded-lg flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <span className="text-[9px] font-extrabold tracking-widest text-amber-400 font-condensed uppercase">DÉSIGNÉ VAINQUEUR DE SÉANCE</span>
            <h4 className="font-condensed font-black text-xl tracking-wide leading-none text-white mt-1" style={{ color: translateAgentColor(widgetVerdict.winnerId) }}>
              🏆 {translateAgentName(widgetVerdict.winnerId).toUpperCase()}
            </h4>
            <RichText
              text={`"${widgetVerdict.winnerReason}"`}
              className="text-gray-300 text-xs md:text-sm leading-relaxed mt-2 select-text font-serif italic"
            />
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
              <RichText
                text={widgetVerdict.critiqueGénérale}
                className="text-gray-300 text-xs md:text-sm leading-relaxed select-text font-sans"
              />
            </div>

            {widgetVerdict.keyCitation && (
              <div className="bg-white/[0.01] border-l-2 border-amber-400 p-3 rounded-r-md mt-1 italic">
                <span className="text-[8px] font-condensed font-bold tracking-widest text-amber-500 uppercase block mb-1">CITATION PHARE RETENUE PAR LA COUR</span>
                <RichText
                  text={`"${widgetVerdict.keyCitation}"`}
                  className="text-xs text-amber-300 font-serif leading-relaxed"
                />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

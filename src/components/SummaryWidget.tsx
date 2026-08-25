import { ClipboardList } from "lucide-react";
import type { Topic } from "../types.ts";
import { RichText } from "./RichText.tsx";
import { DegradedBadge } from "./DegradedBadge.tsx";

// ─── COMPONENT: SUMMARY WIDGET ────────────────────────────────────────────────
export function SummaryWidget({
  summary,
  topic,
  messagesCount,
  degraded,
  reason,
}: {
  summary: string;
  topic: Topic;
  messagesCount: number;
  degraded?: boolean;
  reason?: string;
}) {
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
            {degraded
              ? "Gabarit local — aucune génération réelle"
              : `Rapport critique et synthèse transversale · ${messagesCount} intervention${messagesCount > 1 ? "s" : ""}`}
          </div>
        </div>
        {degraded && <DegradedBadge reason={reason} className="ml-auto" />}
      </div>

      {degraded && (
        <div className="px-5 py-2.5 bg-amber-500/[0.06] border-b border-amber-500/20 text-[11px] text-amber-200 leading-snug">
          Cette synthèse a été rédigée par le moteur de secours local et ne reflète pas le contenu réel du débat.
          {reason ? ` ${reason}` : ""}
        </div>
      )}

      {/* Corps du texte */}
      <div className="px-5 py-5 flex flex-col gap-3">
        {paragraphs.map((para, idx) => {
          const isHighlight = para.startsWith("**") && para.endsWith("**");
          const cleanedText = isHighlight ? para.slice(2, -2) : para;

          if (isHighlight) {
            return (
              <div key={idx} className="mt-2 p-4 bg-[#00f5c4]/[0.03] border-l-2 border-[#00f5c4] rounded-r-lg relative overflow-hidden">
                <RichText
                  text={cleanedText}
                  className="text-[#00f5c4] font-condensed font-semibold tracking-wide text-xs md:text-sm leading-relaxed relative z-10 select-text"
                />
              </div>
            );
          }

          return (
            <RichText
              key={idx}
              text={cleanedText}
              className="text-gray-300 text-xs md:text-sm font-sans leading-relaxed select-text"
            />
          );
        })}
      </div>
    </div>
  );
}

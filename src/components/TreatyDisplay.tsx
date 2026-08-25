import { Scroll } from "lucide-react";
import type { Treaty } from "../types.ts";
import { RichText } from "./RichText.tsx";
import { DegradedBadge } from "./DegradedBadge.tsx";

/** Traité de consensus : les engagements minimaux issus de la séance. */
export function TreatyDisplay({
  treaty,
  degraded,
  reason,
}: {
  treaty: Treaty;
  degraded?: boolean;
  reason?: string;
}) {
  return (
    <div className="animate-summaryReveal border border-[#b07aff]/20 bg-gradient-to-br from-[#b07aff]/[0.03] to-[#00f5c4]/[0.02] rounded-xl overflow-hidden mt-4">

      <div className="px-5 py-4 border-b border-white/[0.04] bg-white/[0.01] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#b07aff] to-[#7c3aed] flex items-center justify-center text-black shrink-0 shadow-md shadow-black select-none">
          <Scroll className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-condensed font-black tracking-widest text-sm text-[#c9a2ff] uppercase">
            TRAITÉ DE CONSENSUS
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-condensed">
            {degraded
              ? "Gabarit local — aucune rédaction réelle"
              : `${treaty.articles.length} article${treaty.articles.length > 1 ? "s" : ""} issus de la délibération`}
          </div>
        </div>
        {degraded && <DegradedBadge reason={reason} className="ml-auto" />}
      </div>

      {degraded && (
        <div className="px-5 py-2.5 bg-amber-500/[0.06] border-b border-amber-500/20 text-[11px] text-amber-200 leading-snug">
          Ce traité est un gabarit générique produit localement : ses articles ne découlent pas du contenu réel du débat.
          {reason ? ` ${reason}` : ""}
        </div>
      )}

      <div className="px-5 py-5 flex flex-col gap-4">
        {treaty.preamble && (
          <RichText
            text={treaty.preamble}
            className="text-gray-300 text-xs md:text-sm font-serif italic leading-relaxed select-text"
          />
        )}

        <div className="flex flex-col gap-3">
          {treaty.articles.map((article, idx) => (
            <div key={idx} className="border-l-2 border-[#b07aff]/40 pl-3.5">
              <div className="font-condensed font-bold text-xs tracking-wider uppercase text-[#c9a2ff]">
                Article {idx + 1} — {article.title}
              </div>
              <RichText
                text={article.content}
                className="text-gray-300 text-xs md:text-sm leading-relaxed select-text mt-1"
              />
            </div>
          ))}
        </div>

        {treaty.reservation && (
          <div className="bg-white/[0.01] border border-white/[0.05] rounded-lg p-3 mt-1">
            <span className="text-[8px] font-condensed font-bold tracking-widest text-gray-500 uppercase block mb-1">
              Réserve consignée au procès-verbal
            </span>
            <RichText
              text={treaty.reservation}
              className="text-[11px] md:text-xs text-gray-400 leading-relaxed select-text"
            />
          </div>
        )}
      </div>
    </div>
  );
}

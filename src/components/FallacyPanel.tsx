import { Scale } from "lucide-react";
import type { FallacyAnalysis } from "../types.ts";
import { DegradedBadge } from "./DegradedBadge.tsx";

const SEVERITY_STYLE: { [key: string]: { chip: string; label: string } } = {
  faible: { chip: "bg-yellow-500/10 border-yellow-500/25 text-yellow-300", label: "Faible" },
  moyenne: { chip: "bg-orange-500/10 border-orange-500/25 text-orange-300", label: "Moyenne" },
  forte: { chip: "bg-red-500/10 border-red-500/30 text-red-300", label: "Forte" },
};

/** Couleur de la jauge de solidité : verte au-dessus de 70, rouge sous 40. */
function soundnessColor(score: number): string {
  if (score >= 70) return "#00f5c4";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

/** Relevé des figures rhétoriques repérées dans une intervention. */
export function FallacyPanel({ analysis }: { analysis: FallacyAnalysis }) {
  const color = soundnessColor(analysis.soundness);

  return (
    <div className="mt-3 border border-white/[0.06] bg-black/40 rounded-lg overflow-hidden animate-fadeSlideUp">
      <div className="px-3 py-2 border-b border-white/[0.05] flex items-center gap-2 bg-white/[0.01]">
        <Scale className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
        <span className="font-condensed font-bold text-[11px] tracking-widest uppercase text-gray-300">
          Relevé rhétorique
        </span>
        {analysis.degraded && <DegradedBadge reason={analysis.reason} className="ml-auto" />}
      </div>

      <div className="px-3 py-3 flex flex-col gap-3">
        {/* Jauge de solidité logique */}
        <div>
          <div className="flex justify-between items-baseline text-[9px] font-bold text-gray-500 mb-1">
            <span className="tracking-wider uppercase">Solidité logique</span>
            <span style={{ color }} className="text-xs font-condensed font-black tabular-nums">
              {analysis.soundness} / 100
            </span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, analysis.soundness))}%`, backgroundColor: color }}
            />
          </div>
        </div>

        {analysis.findings.length === 0 ? (
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Aucune figure rhétorique classique repérée dans cette intervention.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {analysis.findings.map((f, i) => {
              const style = SEVERITY_STYLE[f.severity] || SEVERITY_STYLE.moyenne;
              return (
                <div key={`${f.name}-${i}`} className="border-l-2 border-white/10 pl-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-condensed font-bold text-[11px] tracking-wide uppercase text-gray-200">
                      {f.name}
                    </span>
                    <span className={`border rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${style.chip}`}>
                      {style.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 italic leading-snug mt-1">« {f.quote} »</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-1">{f.explanation}</p>
                </div>
              );
            })}
          </div>
        )}

        {analysis.verdict && (
          <p className="text-[10px] text-gray-500 leading-relaxed border-t border-white/[0.04] pt-2">
            {analysis.verdict}
          </p>
        )}
      </div>
    </div>
  );
}

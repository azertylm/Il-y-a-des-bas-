import * as React from "react";
import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle, Sparkles, ChevronDown, ChevronUp, Brain } from "lucide-react";

export interface FallacyData {
  logicScore: number;
  rhetoricalStyle: string;
  factCheckStatus: string;
  fallacies: { name: string; explanation: string; severity: "Faible" | "Modéré" | "Élevé" }[];
  strengths: string[];
  verdictQuote: string;
}

interface FallacyInspectorProps {
  content: string;
  agentName: string;
  agentColor: string;
  topicTitle: string;
  getHeaders: () => Record<string, string>;
}

export function FallacyInspector({
  content,
  agentName,
  agentColor,
  topicTitle,
  getHeaders,
}: FallacyInspectorProps) {
  const [data, setData] = useState<FallacyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data) {
      setExpanded(!expanded);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/debate/analyze-fallacy", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          content,
          agentName,
          topicTitle,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setData(result);
        setExpanded(true);
      }
    } catch (err) {
      console.warn("Erreur lors de l'analyse logique:", err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 70) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-red-400 border-red-500/30 bg-red-500/10";
  };

  return (
    <div className="mt-3 pt-2 border-t border-white/[0.05] text-xs">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer border ${
            data
              ? "bg-white/[0.04] hover:bg-white/[0.08] text-white border-white/[0.08]"
              : "bg-[#00f5c4]/10 hover:bg-[#00f5c4]/20 text-[#00f5c4] border-[#00f5c4]/30"
          }`}
        >
          <Brain className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#00f5c4]" : ""}`} />
          <span className="font-condensed font-bold tracking-wider uppercase text-[11px]">
            {loading ? "Audit Logique en cours..." : data ? (expanded ? "Masquer l'Arbitrage" : "Voir l'Arbitrage Logique") : "Scanner Sophismes & Rigueur"}
          </span>
          {data && (expanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />)}
        </button>

        {data && (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${getScoreColor(data.logicScore)}`}>
              Indice Logique : {data.logicScore}/100
            </span>
          </div>
        )}
      </div>

      {expanded && data && (
        <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/[0.08] space-y-2.5 animate-fadeSlideUp">
          {/* Header de l'arbitre */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <div className="flex items-center gap-1.5 text-[#9ca3af]">
              <Sparkles className="w-3.5 h-3.5 text-[#00f5c4]" />
              <span className="font-semibold text-white">Style Rhétorique :</span> {data.rhetoricalStyle}
            </div>
            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {data.factCheckStatus}
            </span>
          </div>

          {/* Sophismes / Biais détectés */}
          {data.fallacies && data.fallacies.length > 0 ? (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Réserves & Sophismes Détectés ({data.fallacies.length})
              </div>
              <div className="space-y-1">
                {data.fallacies.map((f, i) => (
                  <div key={i} className="p-2 rounded bg-amber-500/[0.07] border border-amber-500/20 text-gray-300">
                    <div className="flex items-center justify-between text-amber-300 font-semibold mb-0.5">
                      <span>• {f.name}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200">
                        Impact : {f.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{f.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/[0.07] border border-emerald-500/20 p-2 rounded">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="text-[11px]">Aucun sophisme majeur détecté. Argumentation d'une pureté logique exemplaire.</span>
            </div>
          )}

          {/* Points forts */}
          {data.strengths && data.strengths.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 mb-1">
                <CheckCircle className="w-3 h-3" />
                Forces Argumentatives
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-gray-300 text-[11px]">
                {data.strengths.map((s, idx) => (
                  <li key={idx} className="leading-snug">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Verdict de l'arbitre */}
          {data.verdictQuote && (
            <div className="pt-2 border-t border-white/[0.06] text-gray-400 italic text-[11px]">
              « {data.verdictQuote} »
            </div>
          )}
        </div>
      )}
    </div>
  );
}

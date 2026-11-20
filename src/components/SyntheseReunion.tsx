import React, { useEffect, useState } from "react";
import type { Message, Topic } from "../types";

/**
 * Export « Synthèse de réunion » : une fiche propre (Arguments pour / contre / angles morts / conclusion),
 * écrite par une IA à partir de la transcription, à copier ou à imprimer en PDF (mise en page @media print).
 * La fiche dit quelle IA l'a écrite (règle d'honnêteté d'Alphabette).
 */
interface Fiche { pour: string[]; contre: string[]; angles_morts: string[]; conclusion: string; ecritPar?: string }

export const SyntheseReunion: React.FC<{
  topic: Topic;
  messages: Message[];
  headers: Record<string, string>;
  diable: boolean;
  onClose: () => void;
}> = ({ topic, messages, headers, diable, onClose }) => {
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [erreur, setErreur] = useState("");
  const [copie, setCopie] = useState(false);
  const titre = diable ? "Analyse des failles" : "Synthèse de réunion";
  const participants = [...new Set(messages.filter((m) => !m.isUser).map((m) => m.agentName))].join(", ");
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const r = await fetch("/api/debate/synthese-reunion", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            topicTitle: topic.title, topicDescription: topic.description, diable,
            messages: messages.map((m) => ({ agentName: m.isUser ? "Animateur" : m.agentName, content: m.content })),
          }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "La synthèse n'a pas pu être écrite.");
        if (!annule) setFiche(d);
      } catch (e: any) {
        if (!annule) setErreur(e?.message || "La synthèse n'a pas pu être écrite.");
      }
    })();
    return () => { annule = true; };
  }, []);

  const sections: [string, string[]][] = fiche
    ? [[diable ? "Ce qui tient debout" : "Arguments pour", fiche.pour], [diable ? "Failles et objections" : "Arguments contre", fiche.contre], ["Angles morts", fiche.angles_morts]]
    : [];

  const texte = () => fiche ? [
    `${titre.toUpperCase()} — ${date}`, `Sujet : ${topic.title}`, `Participants : ${participants}`, "",
    ...sections.flatMap(([t, l]) => [t.toUpperCase(), ...(l.length ? l.map((x) => `- ${x}`) : ["- (rien de notable)"]), ""]),
    "CONCLUSION", fiche.conclusion, "", fiche.ecritPar ? `Synthèse écrite par ${fiche.ecritPar} (IA Débat — alphabette.eu).` : "IA Débat — alphabette.eu",
  ].join("\n") : "";

  const copier = async () => {
    try { await navigator.clipboard.writeText(texte()); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch { /* sélection manuelle */ }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 flex items-start justify-center overflow-y-auto p-3 sm:p-6 fiche-reunion-fond" role="dialog" aria-modal="true" aria-labelledby="fiche-titre" onClick={onClose}>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body * { visibility: hidden !important; }
          .fiche-reunion, .fiche-reunion * { visibility: visible !important; }
          .fiche-reunion-fond { position: static !important; background: #fff !important; overflow: visible !important; padding: 0 !important; }
          .fiche-reunion { position: absolute; left: 0; top: 0; width: 100%; max-width: none !important; box-shadow: none !important; border: 0 !important; padding: 0 !important; font-size: 11.5pt; }
          .fiche-reunion .ecran-seul { display: none !important; }
          .fiche-reunion section { break-inside: avoid; }
        }
      `}</style>
      <div className="fiche-reunion w-full max-w-2xl rounded-2xl bg-[#fffdf8] text-[#1c1917] shadow-2xl p-5 sm:p-8 my-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold tracking-[0.16em] uppercase text-[#0f766e]">IA Débat · {date}</p>
            <h2 id="fiche-titre" className="text-2xl sm:text-3xl font-black leading-tight mt-1">{titre}</h2>
          </div>
          <button type="button" onClick={onClose} className="ecran-seul min-w-[44px] min-h-[44px] rounded-xl border border-[#d6d3d1] text-lg font-bold cursor-pointer" aria-label="Fermer">✕</button>
        </div>
        <p className="mt-3 text-base"><strong>Sujet :</strong> {topic.title}</p>
        {participants && <p className="text-sm text-[#57534e]"><strong>Participants :</strong> {participants}</p>}

        {!fiche && !erreur && <p className="mt-6 text-base font-bold text-[#0f766e]" role="status">Rédaction de la fiche…</p>}
        {erreur && <p className="mt-6 text-base font-bold text-[#b91c1c]" role="alert">{erreur}</p>}

        {fiche && (
          <>
            {sections.map(([t, l]) => (
              <section key={t} className="mt-5">
                <h3 className="text-lg font-extrabold border-b-2 border-[#0f766e] pb-1">{t}</h3>
                {l.length ? (
                  <ul className="mt-2 space-y-1.5 list-disc pl-5 text-[15px] leading-relaxed">{l.map((x, i) => <li key={i}>{x}</li>)}</ul>
                ) : <p className="mt-2 text-[#57534e]">Rien de notable.</p>}
              </section>
            ))}
            <section className="mt-5">
              <h3 className="text-lg font-extrabold border-b-2 border-[#0f766e] pb-1">Conclusion</h3>
              <p className="mt-2 text-[15px] leading-relaxed">{fiche.conclusion}</p>
            </section>
            <p className="mt-6 text-xs text-[#57534e]">{fiche.ecritPar ? `Synthèse écrite par ${fiche.ecritPar}, à partir des ${messages.length} répliques du débat.` : `Synthèse écrite par une IA, à partir des ${messages.length} répliques du débat.`} IA Débat — alphabette.eu</p>
            <div className="ecran-seul grid grid-cols-2 gap-2 mt-5">
              <button type="button" onClick={copier} className="min-h-[48px] rounded-xl border-2 border-[#0f766e] text-[#0f766e] font-extrabold cursor-pointer">{copie ? "✅ Copiée" : "Copier le texte"}</button>
              <button type="button" onClick={() => window.print()} className="min-h-[48px] rounded-xl bg-[#0f766e] text-white font-extrabold cursor-pointer">🖨️ Imprimer / PDF</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

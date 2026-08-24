import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Clock, Download, Search, Trash2, X } from "lucide-react";
import { fmtDate } from "../lib/time.ts";
import { archiveToTranscript, downloadTranscript } from "../lib/export.ts";
import { filterArchives, type ArchiveSort } from "../lib/session.ts";
import type { Archive } from "../types.ts";
import { MessageBubble } from "./MessageBubble.tsx";
import { SummaryWidget } from "./SummaryWidget.tsx";
import { TreatyDisplay } from "./TreatyDisplay.tsx";
import { VerdictDisplay } from "./VerdictDisplay.tsx";

const SORT_LABELS: { id: ArchiveSort; label: string }[] = [
  { id: "recent", label: "Plus récentes" },
  { id: "ancien", label: "Plus anciennes" },
  { id: "volume", label: "Plus fournies" },
];

export interface ArchivePanelProps {
  archives: Archive[];
  selectedArchive: Archive | null;
  setSelectedArchive: (archive: Archive | null) => void;
  onDeleteArchive: (key: string) => void;
}

/** Onglet « Archives » : registre des séances et relecture détaillée. */
export function ArchivePanel({
  archives,
  selectedArchive,
  setSelectedArchive,
  onDeleteArchive,
}: ArchivePanelProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ArchiveSort>("recent");

  const visible = useMemo(() => filterArchives(archives, query, sort), [archives, query, sort]);

  return (
  <div className="flex-1 flex flex-col overflow-hidden py-2 animate-fadeSlideUp">
    
    {selectedArchive ? (
      /* Vue détaillée de l'archive enregistrée */
      <div className="flex-1 overflow-y-auto pr-1">
        <button 
          onClick={() => setSelectedArchive(null)} 
          className="flex items-center gap-1.5 bg-transparent border-none text-[#999] hover:text-white cursor-pointer text-xs font-bold font-condensed tracking-wider uppercase mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste des archives
        </button>

        <div className="p-5 bg-[#090909]/80 border border-white/[0.04] rounded-xl mb-6 flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold font-condensed tracking-widest text-[#00f5c4] uppercase">{selectedArchive.topic.category}</span>
            <h2 className="text-lg md:text-2xl font-black font-condensed text-white mb-2 leading-snug mt-0.5">
              {selectedArchive.topic.title}
            </h2>
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Session enregistrée le {fmtDate(selectedArchive.closedAt)} · {selectedArchive.messages.length} interventions actives
            </div>
          </div>
          <div className="flex gap-2 flex-wrap shrink-0 h-fit">
            <button
              onClick={() => downloadTranscript(archiveToTranscript(selectedArchive))}
              title="Télécharger le procès-verbal au format Markdown"
              className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded px-3 py-1.5 font-bold font-condensed cursor-pointer uppercase transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter
            </button>
            <button 
              onClick={() => onDeleteArchive(selectedArchive.key)}
              className="flex items-center gap-1.5 text-xs text-red-500/80 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 rounded px-3 py-1.5 font-bold font-condensed cursor-pointer uppercase transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Effacer
            </button>
          </div>
        </div>

        {/* Verdict détaillé d'archive si présent */}
        {selectedArchive.verdict && (
          <VerdictDisplay
            widgetVerdict={selectedArchive.verdict}
            degraded={selectedArchive.verdictDegraded}
            reason={selectedArchive.verdictReason}
          />
        )}

        {/* Traité de consensus d'archive */}
        {selectedArchive.treaty && (
          <TreatyDisplay
            treaty={selectedArchive.treaty}
            degraded={selectedArchive.treatyDegraded}
            reason={selectedArchive.treatyReason}
          />
        )}

        {/* Synthèse finale d'archive */}
        {selectedArchive.summary && (
          <SummaryWidget
            summary={selectedArchive.summary}
            topic={selectedArchive.topic}
            messagesCount={selectedArchive.messages.length}
            degraded={selectedArchive.summaryDegraded}
            reason={selectedArchive.summaryReason}
          />
        )}

        <div className="mt-8 flex flex-col gap-4">
          <div className="text-xs font-bold font-condensed text-gray-500 tracking-widest uppercase border-b border-white/[0.06] pb-2">
            RETRANSCRIPTION INTÉGRALE DES DISCOURS
          </div>
          {selectedArchive.messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </div>
      </div>
    ) : (
      /* Liste d'archives générale */
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
          <div className="font-condensed font-bold tracking-wider text-sm text-gray-400 uppercase">
            REGISTRE ET PALMARÈS DES SESSIONS PASSÉES
          </div>
          <div className="text-xs text-gray-600">
            {query
              ? `${visible.length} sur ${archives.length} débat${archives.length > 1 ? "s" : ""}`
              : `${archives.length} débat${archives.length > 1 ? "s" : ""} répertorié${archives.length > 1 ? "s" : ""}`}
          </div>
        </div>

        {/* Recherche et tri du registre */}
        {archives.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 mb-5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher un sujet, un orateur, un argument…"
                className="w-full bg-black border border-white/10 rounded pl-8 pr-8 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5c4]"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  title="Effacer la recherche"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-600 hover:text-white cursor-pointer p-0 flex items-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1 bg-black border border-white/10 rounded p-0.5 shrink-0">
              {SORT_LABELS.map(option => (
                <button
                  key={option.id}
                  onClick={() => setSort(option.id)}
                  className={`text-[10px] font-bold py-1 px-2 border-none cursor-pointer rounded transition-all leading-none whitespace-nowrap ${
                    sort === option.id
                      ? "bg-white/10 text-white font-black"
                      : "bg-transparent text-gray-600 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <BookOpen className="w-12 h-12 stroke-[1.2] text-gray-600 mb-3" />
            <div className="font-condensed font-bold text-sm uppercase tracking-widest text-gray-400">
              {query ? "Aucune séance ne correspond" : "Registre d'arène vierge"}
            </div>
            <p className="text-xs text-gray-600 mt-1 max-w-[280px] text-center leading-relaxed">
              {query
                ? `Aucun débat archivé ne mentionne « ${query} ». Essayez un autre terme, ou effacez la recherche.`
                : "Aucune thèse de table ronde n'a encore été délibérée et classée avec verdict actif. Lancez dès à présent un débat dans le studio."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visible.map((arc, i) => (
              <div 
                key={arc.key} 
                onClick={() => setSelectedArchive(arc)} 
                className="p-5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] hover:border-[#00f5c4]/30 rounded-xl cursor-pointer transition-all duration-200"
                style={{ animation: `archiveSlide 0.3s ${i * 0.05}s ease both` }}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold font-condensed text-[#00f5c4] tracking-widest mb-1.5 uppercase">
                      {arc.topic.category}
                    </div>
                    <h3 className="font-condensed font-bold text-lg text-white hover:text-[#00f5c4] transition-colors leading-snug mb-2">
                      {arc.topic.title}
                    </h3>
                    {arc.summary && (
                      <p className="text-xs text-gray-400 leading-normal line-clamp-2 pr-4">
                        {arc.summary.replace(/\*\*/g, "").slice(0, 180)}...
                      </p>
                    )}

                    {arc.verdict && (
                      <div className="mt-3.5 flex items-center gap-2">
                        <span className="text-[10px] uppercase font-condensed bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-300 font-bold tracking-wider">
                          🏆 Vainqueur : {arc.verdict.winnerId.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-600 font-condensed">
                          Citation : "{arc.verdict.keyCitation.slice(0, 48)}..."
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black font-condensed text-[#00f5c4] leading-none mb-0.5">
                      {arc.messages.length}
                    </div>
                    <div className="text-[9px] text-[#555] font-condensed uppercase tracking-wider mb-2">Dispositions</div>
                    <div className="text-xs text-[#666] font-condensed">
                      {new Date(arc.closedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
  );
}

import * as React from "react";
import { useState, useEffect } from "react";
import { Scroll, Sparkles, Check, Copy, Download, X, Award, FileText, Cloud, CheckCircle2 } from "lucide-react";
import { getAccessToken } from "../services/googleDriveAuth";
import { getOrCreateIadebatFolder, uploadTextFileToDrive } from "../services/googleDriveService";

interface Article {
  number: number;
  title: string;
  clause: string;
}

interface TreatyData {
  treatyTitle: string;
  preamble: string;
  articles: Article[];
  concludingSeal: string;
}

interface UniversalTreatyModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  messages: any[];
  getHeaders: () => Record<string, string>;
}

export function UniversalTreatyModal({
  isOpen,
  onClose,
  topicTitle,
  messages,
  getHeaders,
}: UniversalTreatyModalProps) {
  const [data, setData] = useState<TreatyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveSavedSuccess, setDriveSavedSuccess] = useState(false);

  const handleSaveToDrive = async () => {
    if (!data) return;
    setIsSavingToDrive(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert("Veuillez vous connecter à Google Drive via le bouton 'Google Drive' dans le menu principal de l'arène.");
        return;
      }

      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const cleanTitle = (data.treatyTitle || 'Traite-Consensus')
        .replace(/[^a-zA-Z0-9À-ÿ-_ ]/g, '')
        .trim()
        .slice(0, 40);
      const fileName = `TRAITE_${cleanTitle}_${dateStr}.md`;

      let content = `# 📜 ${data.treatyTitle}\n\n`;
      content += `**Thème débattu :** ${topicTitle}\n`;
      content += `**Date de promulgation :** ${new Date().toLocaleString('fr-FR')}\n\n`;
      content += `## PRÉAMBULE & FONDEMENTS\n\n${data.preamble}\n\n`;
      content += `## ARTICLES DE L'ACCORD\n\n`;
      data.articles.forEach((art) => {
        content += `### Article ${art.number} — ${art.title}\n\n${art.clause}\n\n`;
      });
      content += `## SCEAU OFFICIEL & PROMULGATION\n\n${data.concludingSeal}\n\n`;
      content += `\n*Traité universel rédigé et scellé dans l'Agora IADÉBAT.*\n`;

      const folderId = await getOrCreateIadebatFolder(token);
      await uploadTextFileToDrive({
        fileName,
        content,
        mimeType: 'text/markdown',
        accessToken: token,
        folderId,
      });

      setDriveSavedSuccess(true);
      setTimeout(() => setDriveSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Erreur sauvegarde traité Drive:', err);
      alert(`Erreur lors de la sauvegarde sur Google Drive : ${err.message || err}`);
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const fetchTreaty = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/debate/treaty", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          topicTitle,
          messages,
        }),
      });
      if (res.ok) {
        const treaty = await res.json();
        setData(treaty);
      }
    } catch (e) {
      console.warn("Erreur lors de la rédaction du traité:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !data) {
      fetchTreaty();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!data) return;
    const text = `# ${data.treatyTitle}
Thème : ${topicTitle}

## PRÉAMBULE
${data.preamble}

## ARTICLES DU TRAITÉ
${data.articles.map(a => `### Article ${a.number} : ${a.title}\n${a.clause}`).join("\n\n")}

## SCEAU DE RATIFICATION
${data.concludingSeal}

Signataires : ChatGPT • Claude • Gemini • DeepSeek • Mistral • Grok • Public Citoyen`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!data) return;
    const text = `# ${data.treatyTitle}\n\nThème du Débat : ${topicTitle}\n\nPRÉAMBULE :\n${data.preamble}\n\nARTICLES :\n${data.articles.map(a => `Article ${a.number} - ${a.title}\n${a.clause}`).join("\n\n")}\n\nSCEAU D'AUTHENTICITÉ :\n${data.concludingSeal}\n\nRatifié le ${new Date().toLocaleDateString("fr-FR")} lors de la Session IADÉBAT PRO.`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Traite_Consensus_${topicTitle.slice(0, 30).replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeSlideUp">
      <div className="relative w-full max-w-3xl rounded-2xl border border-amber-500/30 bg-[#0c0b08] shadow-2xl p-6 md:p-8 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow ambient */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-[#00f5c4]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/20 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black font-condensed tracking-wider uppercase text-white flex items-center gap-2">
                Traité Universel de Consensus Diplomatique
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  ACCORD MAJEUR
                </span>
              </h3>
              <p className="text-xs text-gray-400">La synthèse engageante réconciliant éthique, technologie et pragmatisme</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3 flex-1">
            <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
            <span className="font-condensed text-sm font-bold uppercase tracking-wider text-amber-200">
              Harmonisation des thèses et rédaction du traité en cours...
            </span>
          </div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 text-gray-300">
            {/* Title & Preamble */}
            <div className="text-center space-y-3 bg-amber-500/[0.04] border border-amber-500/20 p-5 rounded-xl">
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400/80">
                RATIFICATION SOLENNELLE DES INTELLIGENCES MULTIPLES
              </div>
              <h2 className="text-xl md:text-2xl font-black font-condensed tracking-wide text-white uppercase">
                {data.treatyTitle}
              </h2>
              <div className="h-[1px] w-24 mx-auto bg-amber-500/40" />
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed italic max-w-2xl mx-auto font-serif">
                « {data.preamble} »
              </p>
            </div>

            {/* Articles */}
            <div className="space-y-3">
              <h4 className="font-condensed font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Clauses & Articles Engageants ({data.articles.length})
              </h4>

              <div className="grid grid-cols-1 gap-2.5">
                {data.articles.map((art) => (
                  <div
                    key={art.number}
                    className="p-3.5 rounded-lg bg-black/60 border border-white/[0.08] hover:border-amber-500/30 transition-all space-y-1.5"
                  >
                    <div className="flex items-center gap-2 text-amber-300 font-condensed font-bold text-sm">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 text-xs font-mono">
                        ARTICLE {art.number}
                      </span>
                      <span>{art.title}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {art.clause}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Concluding Seal */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-black/40 to-emerald-500/10 border border-amber-500/30 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest font-condensed">
                <Award className="w-4 h-4" />
                Sceau d'Authenticité du Grand Conclave
              </div>
              <p className="text-xs md:text-sm font-semibold text-white italic">
                {data.concludingSeal}
              </p>

              {/* Signatures badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-white/[0.08]">
                {["ChatGPT", "Claude", "Gemini", "DeepSeek", "Mistral", "Grok", "Citoyen Humain"].map((sig, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-gray-300"
                  >
                    ✓ {sig}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer actions */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3 shrink-0 mt-2">
          <button
            onClick={fetchTreaty}
            disabled={loading}
            className="text-xs font-condensed font-bold text-amber-400 hover:text-amber-300 bg-transparent border-none cursor-pointer flex items-center gap-1"
          >
            ↻ Réécrire une variante
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToDrive}
              disabled={!data || isSavingToDrive}
              className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-xs font-condensed font-bold uppercase tracking-wider border border-blue-500/30 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              {driveSavedSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
              )}
              {driveSavedSuccess ? "Scellé dans Drive !" : isSavingToDrive ? "Envoi..." : "Google Drive"}
            </button>

            <button
              onClick={handleCopy}
              disabled={!data}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-condensed font-bold uppercase tracking-wider border border-white/[0.08] flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copié !" : "Copier le Traité"}
            </button>

            <button
              onClick={handleDownload}
              disabled={!data}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-condensed font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all shadow-lg font-black"
            >
              <Download className="w-3.5 h-3.5" />
              Télécharger le Traité (.TXT)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

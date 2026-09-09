import * as React from "react";
import { useState } from "react";
import { Zap, AlertCircle, Sparkles, X, Send, Radio } from "lucide-react";

interface BreakingNewsItem {
  category: string;
  headline: string;
  description: string;
  urgentQuestion: string;
}

interface BreakingNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  getHeaders: () => Record<string, string>;
  onInjectTwist: (headline: string, description: string, question: string) => void;
}

export function BreakingNewsModal({
  isOpen,
  onClose,
  topicTitle,
  getHeaders,
  onInjectTwist,
}: BreakingNewsModalProps) {
  const [items, setItems] = useState<BreakingNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [customHeadline, setCustomHeadline] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");

  const handleFetchTwists = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/debate/breaking-news", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ topicTitle }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.warn("Erreur lors de la génération des coups de théâtre:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && items.length === 0) {
      handleFetchTwists();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInjectCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHeadline.trim() || !customDescription.trim()) return;
    onInjectTwist(
      customHeadline.trim(),
      customDescription.trim(),
      customQuestion.trim() || "Comment réagissez-vous face à cet événement soudain ?"
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeSlideUp">
      <div className="relative w-full max-w-2xl rounded-2xl border border-red-500/30 bg-[#0c0a0a] shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black font-condensed tracking-wider uppercase text-white flex items-center gap-2">
                Injecter un Coup de Théâtre en Direct
                <span className="text-[10px] font-mono uppercase bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">
                  BREAKING EVENT
                </span>
              </h3>
              <p className="text-xs text-gray-400">Bouleversez les certitudes et forcez les IA à s'adapter immédiatement</p>
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
        <div className="space-y-5 overflow-y-auto flex-1 pr-1">
          {/* AI Propositions */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00f5c4]" />
                Événements Imprévus Générés par l'IA
              </span>
              <button
                onClick={handleFetchTwists}
                disabled={loading}
                className="text-[11px] font-condensed font-bold text-[#00f5c4] hover:underline cursor-pointer bg-transparent border-none"
              >
                {loading ? "Génération..." : "↻ Rafraîchir les propositions"}
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                <Radio className="w-6 h-6 text-red-400 animate-spin" />
                Simulation d'incidents critiques en cours...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-red-500/[0.04] border border-white/[0.06] hover:border-red-500/30 transition-all flex flex-col gap-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20">
                        {item.category}
                      </span>
                      <button
                        onClick={() => {
                          onInjectTwist(item.headline, item.description, item.urgentQuestion);
                          onClose();
                        }}
                        className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-condensed font-bold text-xs uppercase tracking-wider border border-red-500/40 flex items-center gap-1 cursor-pointer transition-all shadow-lg"
                      >
                        <Zap className="w-3 h-3 text-red-400" />
                        Déclencher ce Twist
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-red-200">
                      {item.headline}
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="text-[11px] text-amber-300/90 italic bg-black/40 p-2 rounded border border-white/[0.04]">
                      <strong>Impact direct :</strong> {item.urgentQuestion}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Twist Form */}
          <div className="pt-4 border-t border-white/[0.08]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-2.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Ou Créez Votre Propre Coup de Théâtre
            </h4>

            <form onSubmit={handleInjectCustom} className="space-y-2.5">
              <input
                type="text"
                value={customHeadline}
                onChange={e => setCustomHeadline(e.target.value)}
                placeholder="Titre choc (ex: Découverte d'une super-intelligence clandestine...)"
                className="w-full bg-black/60 border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
              />
              <textarea
                value={customDescription}
                onChange={e => setCustomDescription(e.target.value)}
                placeholder="Détails du coup de théâtre qui vient de survenir..."
                rows={2}
                className="w-full bg-black/60 border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 resize-none"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customQuestion}
                  onChange={e => setCustomQuestion(e.target.value)}
                  placeholder="Question urgente posée aux modèles (optionnelle)"
                  className="flex-1 bg-black/60 border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                />
                <button
                  type="submit"
                  disabled={!customHeadline.trim() || !customDescription.trim()}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-condensed font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Injecter
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

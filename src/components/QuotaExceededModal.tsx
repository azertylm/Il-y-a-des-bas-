import React from "react";
import { X, ShieldAlert, Sparkles, Clock, ArrowRight, Key, Zap } from "lucide-react";

interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSubscription: () => void;
  onOpenApiKeys: () => void;
  dailyCount: number;
  maxDaily: number;
  isTrial: boolean;
}

export function QuotaExceededModal({
  isOpen,
  onClose,
  onOpenSubscription,
  onOpenApiKeys,
  dailyCount,
  maxDaily,
  isTrial
}: QuotaExceededModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0d14] border border-[#ff5400]/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-white">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#ff5400]/20 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#ff5400]/20 border border-[#ff5400]/50 flex items-center justify-center text-[#ff7733] shadow-lg animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Quota Quotidien Atteint</h2>
              <p className="text-xs text-white/60">
                {isTrial ? "Période d'essai (20 req / jour)" : "Palier gratuit standard (5 req / jour)"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex justify-between text-xs text-white/70">
              <span>Consommation du jour</span>
              <span className="font-mono text-[#ff7733] font-bold">{dailyCount} / {maxDaily} requêtes</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#ff5400] to-[#00f5c4] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (dailyCount / maxDaily) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-white/50 pt-1">
              Votre compteur se réinitialise chaque jour à minuit UTC.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white/90">Deux options s'offrent à vous :</h3>
            
            <button
              onClick={() => {
                onClose();
                onOpenSubscription();
              }}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-[#ff5400]/20 to-[#00f5c4]/20 border border-[#00f5c4]/40 hover:border-[#00f5c4] transition-all flex items-center justify-between group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#00f5c4]/20 flex items-center justify-center text-[#00f5c4]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-[#00f5c4] transition-colors">
                    S'abonner & Débloquer l'Illimité
                  </div>
                  <div className="text-xs text-white/60">
                    Accès illimité via votre propre clé API (BYOK) ou Pass Bouquet.
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#00f5c4] transform group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenApiKeys();
              }}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-white transition-colors">
                    Renseigner ma Clé API (BYOK)
                  </div>
                  <div className="text-xs text-white/60">
                    Mistral, Google Gemini, OpenAI, Anthropic, DeepSeek, Grok.
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
          >
            <Clock className="w-4 h-4" />
            Revenir demain (remise à zéro à 00:00 UTC)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}

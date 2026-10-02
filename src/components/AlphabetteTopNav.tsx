import React, { useState } from "react";
import { 
  Sparkles, 
  Shield, 
  Eye, 
  MessageSquare, 
  FileText, 
  Compass, 
  Key, 
  CreditCard, 
  User, 
  ExternalLink, 
  ChevronDown,
  Zap,
  Globe
} from "lucide-react";
import { AlphabetteAccount } from "../types";
import { ALPHABETTE_APPS, ALPHABETTE_HUB_URL } from "../utils/alphabetteAuth";

interface AlphabetteTopNavProps {
  account: AlphabetteAccount | null;
  quotaInfo: { dailyCount: number; maxDaily: number; isTrial: boolean; isByokActive: boolean };
  onOpenAccount: () => void;
  onOpenApiKeys: () => void;
  onOpenSubscription: () => void;
}

export function AlphabetteTopNav({
  account,
  quotaInfo,
  onOpenAccount,
  onOpenApiKeys,
  onOpenSubscription
}: AlphabetteTopNavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="w-full bg-[#07090e]/90 backdrop-blur-md border-b border-white/10 px-4 py-2.5 flex items-center justify-between z-40 sticky top-0 text-white select-none">
      
      {/* Left: Brand & App Selector Dropdown */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-all text-xs font-semibold"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#00f5c4] animate-pulse" />
            <span className="font-bold tracking-wider text-[#00f5c4]">ALPHABETTE</span>
            <span className="text-white/40">|</span>
            <span className="text-white">IA Débat</span>
            <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-[#0b0d14] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
              <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03]">
                <div className="text-[11px] font-mono uppercase text-[#00f5c4] tracking-wider">Écosystème Souverain</div>
                <div className="text-xs text-white/60">Applications de la suite</div>
              </div>
              <div className="p-2 space-y-1">
                <a
                  href="https://alphabette.fr"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 transition-colors text-xs text-white group"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-[#00f5c4]" />
                    <div>
                      <div className="font-bold group-hover:text-[#00f5c4]">Hub Central Alphabette</div>
                      <div className="text-[10px] text-white/50">Portail unifié et catalogue</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
                </a>

                {ALPHABETTE_APPS.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/10 transition-colors text-xs text-white"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#00f5c4]/15 border border-[#00f5c4]/30 flex items-center justify-center text-[#00f5c4]">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold">{app.name}</div>
                        <div className="text-[10px] text-white/50">{app.badge}</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#00f5c4]/10 text-[#00f5c4] border border-[#00f5c4]/20">
                      Actif
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-white/10 bg-white/[0.02] text-center">
                <a
                  href={ALPHABETTE_HUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#00f5c4] hover:underline font-medium inline-flex items-center gap-1"
                >
                  Visiter alphabette.fr <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Quota badge, API Keys & Account Buttons */}
      <div className="flex items-center gap-2.5">
        
        {/* Quota Badge */}
        <button
          onClick={onOpenSubscription}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 transition-all text-xs"
        >
          <Zap className="w-3.5 h-3.5 text-[#ff7733]" />
          <span className="text-white/70">Quota :</span>
          <span className="font-mono font-bold text-white">
            {quotaInfo.isByokActive ? "Illimité (BYOK)" : `${quotaInfo.dailyCount} / ${quotaInfo.maxDaily}`}
          </span>
        </button>

        {/* API Keys Trousseau Button */}
        <button
          onClick={onOpenApiKeys}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/15 transition-all text-xs font-semibold text-white group"
          title="Trousseau de clés API (BYOK)"
        >
          <Key className="w-3.5 h-3.5 text-[#00f5c4] group-hover:rotate-45 transition-transform" />
          <span className="hidden md:inline">Clés API</span>
        </button>

        {/* Subscription / Pass Button */}
        <button
          onClick={onOpenSubscription}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ff5400] to-[#ff7733] hover:brightness-110 transition-all text-xs font-bold text-white shadow-md shadow-[#ff5400]/20"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>S'abonner</span>
        </button>

        {/* Account / Profile Button */}
        <button
          onClick={onOpenAccount}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-all text-xs font-semibold text-white"
        >
          <div className="w-5 h-5 rounded-full bg-[#00f5c4]/20 border border-[#00f5c4]/40 flex items-center justify-center text-[#00f5c4] text-[10px] font-bold">
            {account?.name ? account.name[0].toUpperCase() : "A"}
          </div>
          <span className="hidden lg:inline">{account?.name ? account.name.split(" ")[0] : "Mon Compte"}</span>
        </button>

      </div>
    </header>
  );
}

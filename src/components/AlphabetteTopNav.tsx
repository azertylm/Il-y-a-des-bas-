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
  quotaInfo: { dailyCount: number; maxDaily: number; isTrial: boolean; isByokActive: boolean; isMembre?: boolean };
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
    <header className="w-full bg-[#07090e]/90 backdrop-blur-md border-b border-white/10 px-2 sm:px-4 py-2.5 flex flex-wrap items-center justify-end gap-2 z-40 relative text-white select-none">
      
      {/* Right: Quota badge, API Keys & Account Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2 min-w-0">
        
        {/* Quota Badge */}
        <button
          onClick={onOpenSubscription}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 transition-all text-xs"
        >
          <Zap className="w-3.5 h-3.5 text-[#ff7733]" />
          <span className="text-white/70">Quota :</span>
          <span className="font-mono font-bold text-white">
            {quotaInfo.isMembre ? "Illimité (membre)" : quotaInfo.isByokActive ? "Illimité (clé perso)" : `${quotaInfo.dailyCount} / ${quotaInfo.maxDaily}`}
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

        {/* Subscription / Pass Button (masqué pour un membre inscrit : l'accès lui est offert) */}
        {!quotaInfo.isMembre && <button
          onClick={onOpenSubscription}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ff5400] to-[#ff7733] hover:brightness-110 transition-all text-xs font-bold text-white shadow-md shadow-[#ff5400]/20"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>S'abonner</span>
        </button>}

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

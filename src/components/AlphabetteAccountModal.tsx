import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  User,
  Mail,
  Building2,
  MapPin,
  Sparkles,
  Key,
  Copy,
  Check,
  Download,
  Upload,
  ArrowRight,
  LogOut,
  Layers,
  FileCode,
  Shield,
  Eye,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  Lock,
  CreditCard,
  AlertCircle,
  Cpu,
  Clock,
  Gift,
  Server
} from "lucide-react";
import {
  AlphabetteAccount,
  AlphabettePlanType
} from "../types";
import {
  ALPHABETTE_APPS,
  ALPHABETTE_PLANS,
  ALPHABETTE_GLOBAL_MASTER_PROMPT,
  ALPHABETTE_HUB_URL,
  ALPHABETTE_FOOTER_TEXT,
  createAlphabetteAccount,
  saveAlphabetteAccount,
  clearAlphabetteAccount,
  exportAccountToKey,
  importAccountFromKey,
  downloadSovereignPassFile,
  getTrialDaysRemaining
} from "../utils/alphabetteAuth";

interface AlphabetteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccount: AlphabetteAccount | null;
  onAccountChange: (account: AlphabetteAccount | null) => void;
  onOpenSubscriptionModal?: (defaultPlan?: AlphabettePlanType) => void;
}

export function AlphabetteAccountModal({
  isOpen,
  onClose,
  currentAccount,
  onAccountChange,
  onOpenSubscriptionModal
}: AlphabetteAccountModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "create" | "byok" | "sync" | "prompt">("profile");

  // Form states for creation
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<AlphabettePlanType>("individual_confort");
  const [mistralKeyInput, setMistralKeyInput] = useState("");

  // BYOK Settings state
  const [byokKey, setByokKey] = useState("");
  const [byokBaseUrl, setByokBaseUrl] = useState("https://api.mistral.ai/v1");
  const [byokModel, setByokModel] = useState("mistral-large-latest");
  const [byokSaveFeedback, setByokSaveFeedback] = useState<string | null>(null);

  // Import state
  const [importKeyInput, setImportKeyInput] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Copy feedback states
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (!currentAccount) {
        setActiveTab("create");
      } else {
        setActiveTab("profile");
        setByokKey(currentAccount.mistralApiKey || "");
        setByokBaseUrl(currentAccount.mistralBaseUrl || "https://api.mistral.ai/v1");
        setByokModel(currentAccount.mistralModel || "mistral-large-latest");
      }
      setImportError(null);
      setImportSuccess(null);
    }
  }, [isOpen, currentAccount]);

  if (!isOpen) return null;

  const trialDaysRemaining = getTrialDaysRemaining(currentAccount);
  const isTrial = currentAccount?.status === "trial" || (currentAccount?.isTrialActive && trialDaysRemaining > 0);
  const isBouquet = currentAccount?.plan === "bouquet_byok" || currentAccount?.plan === "bouquet_integral" || currentAccount?.plan === "pass_alphabette";

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newAcc = createAlphabetteAccount(
      name.trim(),
      email.trim(),
      selectedPlan,
      "IADébat",
      organization.trim() || undefined,
      mistralKeyInput.trim() || undefined
    );

    saveAlphabetteAccount(newAcc);
    onAccountChange(newAcc);
    setActiveTab("profile");
  };

  const handleSaveByokSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;

    const updated: AlphabetteAccount = {
      ...currentAccount,
      mistralApiKey: byokKey.trim() || undefined,
      mistralBaseUrl: byokBaseUrl.trim() || "https://api.mistral.ai/v1",
      mistralModel: byokModel.trim() || "mistral-large-latest",
    };
    saveAlphabetteAccount(updated);
    onAccountChange(updated);
    setByokSaveFeedback("Paramètres Mistral AI enregistrés avec succès !");
    setTimeout(() => setByokSaveFeedback(null), 3000);
  };

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter de votre compte ALPHABETTE sur ce navigateur ?")) {
      clearAlphabetteAccount();
      onAccountChange(null);
      setActiveTab("create");
    }
  };

  const handleCopyKey = () => {
    if (!currentAccount) return;
    const key = exportAccountToKey(currentAccount);
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyId = () => {
    if (!currentAccount) return;
    navigator.clipboard.writeText(currentAccount.alphabetteId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(ALPHABETTE_GLOBAL_MASTER_PROMPT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    setImportSuccess(null);

    if (!importKeyInput.trim()) {
      setImportError("Veuillez saisir une clé de transfert souveraine ou coller le contenu du passeport.");
      return;
    }

    const imported = importAccountFromKey(importKeyInput.trim());
    if (!imported) {
      setImportError("Format de clé ou de passeport invalide. Vérifiez le texte copié depuis une autre application ALPHABETTE.");
      return;
    }

    saveAlphabetteAccount(imported);
    onAccountChange(imported);
    setImportSuccess(`Compte reconnu avec succès ! Bienvenue ${imported.name}. Formule : ${imported.planTitle}.`);
    setImportKeyInput("");
    setTimeout(() => {
      setActiveTab("profile");
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const imported = importAccountFromKey(content);
        if (imported) {
          saveAlphabetteAccount(imported);
          onAccountChange(imported);
          setImportSuccess(`Fichier de passeport chargé ! Bienvenue ${imported.name}.`);
          setTimeout(() => {
            setActiveTab("profile");
          }, 1500);
        } else {
          setImportError("Le fichier sélectionné n'est pas un passeport ALPHABETTE valide.");
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0d14] border border-white/15 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-white">
        
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00f5c4]/15 border border-[#00f5c4]/40 flex items-center justify-center text-[#00f5c4] shadow-sm shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Compte ALPHABETTE Unique
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#ff5400]/20 text-[#ff7733] border border-[#ff5400]/40 font-bold flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  Mistral AI Exclusif
                </span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-[#00f5c4]" />
                <span>Suite logicielle souveraine · Hub central : <a href={ALPHABETTE_HUB_URL} target="_blank" rel="noopener noreferrer" className="text-[#00f5c4] hover:underline font-semibold">alphabette.fr</a></span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-white/10 bg-black/30 overflow-x-auto text-xs scrollbar-none">
          {currentAccount && (
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-3.5 py-2 font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "profile"
                  ? "border-[#00f5c4] text-[#00f5c4]"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Mon Passeport Souverain</span>
              {isTrial ? (
                <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono">
                  Essai 7j
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab("create")}
            className={`px-3.5 py-2 font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "create"
                ? "border-[#00f5c4] text-[#00f5c4]"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{currentAccount ? "Modifier / Nouveau Compte" : "Créer mon Compte (7j Offerts)"}</span>
          </button>

          {currentAccount && (
            <button
              onClick={() => setActiveTab("byok")}
              className={`px-3.5 py-2 font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "byok"
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Configuration Mistral AI (BYOK)</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("sync")}
            className={`px-3.5 py-2 font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "sync"
                ? "border-purple-400 text-purple-300"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span>Partage & Inter-Applications</span>
          </button>

          <button
            onClick={() => setActiveTab("prompt")}
            className={`px-3.5 py-2 font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "prompt"
                ? "border-blue-400 text-blue-300"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Master Prompt Alphabette</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* TAB 1: MON COMPTE SOUVERAIN (PROFILE) */}
          {activeTab === "profile" && currentAccount && (
            <div className="space-y-6">
              
              {/* Alerte Période d'essai 7 jours */}
              {isTrial && (
                <div className="bg-gradient-to-r from-amber-950/50 via-orange-950/40 to-yellow-950/30 border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-2">
                        <span>Période d'Essai Active · Clé Alphabette Incluse</span>
                        <span className="font-mono text-xs px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                          {trialDaysRemaining} jour(s) restant(s)
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-0.5">
                        Vous profitez de l'accès complet propulsé par la clé Mistral fournie par Alphabette. Choisissez votre formule pérenne dès maintenant pour pérenniser vos accès.
                      </p>
                    </div>
                  </div>
                  {onOpenSubscriptionModal && (
                    <button
                      onClick={() => onOpenSubscriptionModal("individual_confort")}
                      className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Choisir une Formule</span>
                    </button>
                  )}
                </div>
              )}

              {/* Carte de membre numérique ALPHABETTE */}
              <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border border-purple-500/40 bg-gradient-to-br from-[#12162a] via-[#0d1020] to-[#1c122c] shadow-2xl">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#00f5c4] via-[#ff5400] to-purple-500 flex items-center justify-center text-black font-black text-xl shadow-lg">
                      α
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white tracking-wide">{currentAccount.name}</h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold ${
                          isTrial 
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30" 
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        }`}>
                          <Check className="w-2.5 h-2.5" />
                          {isTrial ? "Essai 7j" : "Abonnement Actif"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{currentAccount.email}</p>
                      {currentAccount.organization && (
                        <p className="text-[11px] text-purple-300 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span>{currentAccount.organization}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs font-mono text-gray-400">Identifiant Unique</div>
                    <div 
                      onClick={handleCopyId}
                      className="font-mono text-sm font-bold text-[#00f5c4] flex items-center sm:justify-end gap-1.5 cursor-pointer hover:underline"
                      title="Cliquer pour copier l'identifiant"
                    >
                      <span>{currentAccount.alphabetteId}</span>
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 opacity-60" />}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Échéance : {new Date(currentAccount.expiresAt).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>

                {/* Formule & Moteur IA */}
                <div className="mt-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-black/40 border border-white/10 rounded-xl p-3.5">
                    <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                      Formule Actuelle
                    </div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>{currentAccount.planTitle}</span>
                    </div>
                    <div className="text-xs text-[#00f5c4] font-semibold mt-1">
                      {currentAccount.priceAnnualEur > 0 ? `${currentAccount.priceAnnualEur} € / an` : "7 jours offerts"} · Sans prélèvement mensuel
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-1 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#ff7733]" />
                        <span>Moteur IA & RGPD</span>
                      </div>
                      <div className="text-xs text-gray-200">
                        <strong>Mistral AI Exclusif</strong> · Souveraineté France/UE
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {currentAccount.mistralApiKey ? "Mode BYOK (Clé client activée)" : "Mode Managé (Clé Alphabette)"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* STRATÉGIE CROSS-SELLING SI FORMULE INDIVIDUELLE */}
                {!isBouquet && (
                  <div className="mt-4 bg-gradient-to-r from-purple-950/60 via-indigo-950/50 to-blue-950/50 border border-purple-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-purple-200 space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                        <span>Opportunité : Le Bouquet Alphabette Complet (99 € / 199 € par an)</span>
                      </div>
                      <p className="text-gray-300 text-[11px]">
                        Débloquez l'accès illimité à <strong>toutes les applications de la suite</strong> (IADébat, Infos Perso, L'Œil de l'Atelier et futures créations).
                      </p>
                    </div>
                    {onOpenSubscriptionModal && (
                      <button
                        onClick={() => onOpenSubscriptionModal("bouquet_byok")}
                        className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Évoluer vers le Bouquet</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Bouquet d'applications ALPHABETTE et Statut d'accès */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#00f5c4]" />
                    <span>Applications de la Suite Alphabette</span>
                  </h4>
                  <a 
                    href={ALPHABETTE_HUB_URL} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[11px] text-[#00f5c4] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>alphabette.fr</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALPHABETTE_APPS.map((app) => {
                    const isUnlocked = isBouquet || isTrial || (app.id === "iadebat");

                    return (
                      <div
                        key={app.id}
                        className={`rounded-xl p-3.5 border transition-all ${
                          isUnlocked
                            ? "bg-[#101422] border-emerald-500/40"
                            : "bg-black/30 border-white/10 opacity-70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white flex items-center gap-2">
                            {app.id === "iadebat" && <MessageSquare className="w-3.5 h-3.5 text-[#00f5c4]" />}
                            {app.id === "infosperso" && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                            {app.id === "loeildelatelier" && <Eye className="w-3.5 h-3.5 text-amber-400" />}
                            {app.id === "futures_apps" && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                            <span>{app.name}</span>
                          </span>

                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            isUnlocked
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-white/10 text-gray-400"
                          }`}>
                            {isUnlocked ? "Accès Inclus" : "Bouquet Requis"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed">{app.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions de gestion & Clé de transfert */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopyKey}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    title="Copier la clé de transfert pour la coller dans une autre application"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Key className="w-3.5 h-3.5 text-[#00f5c4]" />}
                    <span>{copiedKey ? "Clé copiée !" : "Copier ma Clé Souveraine"}</span>
                  </button>

                  <button
                    onClick={() => downloadSovereignPassFile(currentAccount)}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    title="Télécharger le fichier passeport pour importer sur un autre appareil"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                    <span>Télécharger mon Passeport</span>
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 py-1 px-2 rounded hover:bg-red-500/10 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Déconnecter ce compte</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: CRÉER UN COMPTE / NOUVEL ADHÉRENT (7 JOURS OFFERTS) */}
          {activeTab === "create" && (
            <form onSubmit={handleCreateAccount} className="space-y-5">
              
              <div className="bg-gradient-to-r from-orange-950/40 via-[#00f5c4]/10 to-purple-950/30 border border-[#ff5400]/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#ff7733] flex items-center gap-1.5">
                    <Gift className="w-4 h-4" />
                    <span>7 Jours d'Essai Offerts à l'Inscription</span>
                  </span>
                  <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-gray-300">
                    Mistral AI Exclusif
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Créez votre compte en quelques secondes. Vous bénéficierez d'un <strong>accès complet immédiat de 7 jours</strong> alimenté par la clé Mistral propriétaire d'Alphabette, puis pourrez basculer en mode BYOK ou managé selon votre formule.
                </p>
              </div>

              {/* Sélection de la Formule */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Sélectionnez votre Formule d'Abonnement Annuel
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALPHABETTE_PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative rounded-xl p-4 border cursor-pointer transition-all flex flex-col justify-between ${
                        selectedPlan === plan.id
                          ? plan.category === "bouquet"
                            ? "bg-[#141224] border-purple-400 shadow-lg shadow-purple-500/10"
                            : "bg-[#101422] border-[#00f5c4] shadow-lg shadow-[#00f5c4]/10"
                          : "bg-black/40 border-white/10 hover:border-white/20"
                      }`}
                    >
                      {plan.recommended && (
                        <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md">
                          Recommandé
                        </div>
                      )}

                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-gray-300 font-bold">
                              {plan.badge}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-1">{plan.title}</h4>
                          </div>
                          <div className="text-right">
                            <span className={`text-xl font-black ${plan.category === "bouquet" ? "text-purple-400" : "text-[#00f5c4]"}`}>
                              {plan.priceAnnualEur} €
                            </span>
                            <span className="text-[10px] text-gray-400 block">/ an</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                          {plan.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Champs Nom / Email / Clé BYOK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-300 mb-1 font-semibold">Votre Nom & Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex. Valentin Richaud"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#10121a] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f5c4]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1 font-semibold">Votre Adresse E-mail *</label>
                  <input
                    type="email"
                    required
                    placeholder="ex. contact@alphabette.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#10121a] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f5c4]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-300 mb-1 font-semibold">
                    Clé API Mistral AI (BYOK - Facultative, modifiable à tout moment)
                  </label>
                  <input
                    type="password"
                    placeholder="ex. mistral-api-key-... (laisser vide pour utiliser la clé Alphabette durant vos 7 jours d'essai)"
                    value={mistralKeyInput}
                    onChange={(e) => setMistralKeyInput(e.target.value)}
                    className="w-full bg-[#10121a] border border-white/15 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#00f5c4]"
                  />
                </div>
              </div>

              {/* Bouton de validation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#00f5c4]" />
                  <span>Souveraineté européenne · Aucun tracker commercial</span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#00f5c4] hover:bg-[#00e0b0] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  <span>Créer mon Compte (7 jours d'essai offerts)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </form>
          )}

          {/* TAB 3: CONFIGURATION BYOK (BRING YOUR OWN KEY) */}
          {activeTab === "byok" && currentAccount && (
            <div className="space-y-5">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Mode BYOK (Bring Your Own Key) — Mistral AI Exclusif</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Conformément aux directives techniques de l'écosystème <strong>Alphabette</strong>, vous pouvez renseigner votre propre clé API Cloud Mistral officielle (<code>https://api.mistral.ai/v1</code>) ou cibler un serveur local sous Mac (Ollama / Metal).
                </p>
              </div>

              <form onSubmit={handleSaveByokSettings} className="bg-black/40 border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Votre Clé API Mistral AI (AI_API_KEY)
                  </label>
                  <input
                    type="password"
                    placeholder="ex. mistral-api-key-..."
                    value={byokKey}
                    onChange={(e) => setByokKey(e.target.value)}
                    className="w-full bg-[#10121a] border border-white/15 rounded-lg px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Laissez vide pour continuer à utiliser la clé managée fournie par Alphabette.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      URL de Base de l'API (AI_BASE_URL)
                    </label>
                    <input
                      type="text"
                      placeholder="https://api.mistral.ai/v1 ou http://localhost:11434/v1"
                      value={byokBaseUrl}
                      onChange={(e) => setByokBaseUrl(e.target.value)}
                      className="w-full bg-[#10121a] border border-white/15 rounded-lg px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Par défaut : <code>https://api.mistral.ai/v1</code>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Modèle Mistral Sélectionné (MISTRAL_MODEL)
                    </label>
                    <select
                      value={byokModel}
                      onChange={(e) => setByokModel(e.target.value)}
                      className="w-full bg-[#10121a] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="mistral-large-latest">mistral-large-latest (Recommandé)</option>
                      <option value="mistral-small-latest">mistral-small-latest (Ultra-rapide)</option>
                      <option value="codestral-latest">codestral-latest (Raisonnement & Code)</option>
                      <option value="pixtral-12b">pixtral-12b (Multimodal)</option>
                    </select>
                  </div>
                </div>

                {byokSaveFeedback && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{byokSaveFeedback}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Enregistrer mes paramètres BYOK</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SYNCHRONISATION & PARTAGE INTER-APPLICATIONS */}
          {activeTab === "sync" && (
            <div className="space-y-6">
              
              <div className="bg-black/40 border border-purple-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                  <span>Mise en commun des comptes dans l'écosystème Alphabette</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Toutes les applications de la suite Alphabette (<em>IADébat</em>, <em>Infos Perso</em>, <em>L'Œil de l'Atelier</em>) 
                  partagent le même protocole d'identité souveraine <code>ALPHABETTE_UNIFIED_ACCOUNT_V1</code>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-gray-300">
                  <div className="p-2 rounded bg-white/5 border border-white/5">
                    <strong>1. Automatique :</strong> Reconnaissance immédiate dans le même navigateur entre tous les onglets d'applications.
                  </div>
                  <div className="p-2 rounded bg-white/5 border border-white/5">
                    <strong>2. Clé Souveraine :</strong> Copiez votre clé et collez-la dans une autre application pour activer vos droits en 1 seconde.
                  </div>
                  <div className="p-2 rounded bg-white/5 border border-white/5">
                    <strong>3. Passeport .alphabette-pass :</strong> Téléchargez votre fichier pour transférer votre licence sur un autre poste ou mobile.
                  </div>
                </div>
              </div>

              {/* Si un compte existe : Section d'exportation */}
              {currentAccount && (
                <div className="bg-[#101422] border border-white/10 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#00f5c4] flex items-center gap-1.5">
                    <Key className="w-4 h-4" />
                    <span>Votre Clé Souveraine de Transfert ALPHABETTE</span>
                  </h4>
                  <p className="text-xs text-gray-300">
                    Copiez cette chaîne cryptée et collez-la dans <em>Infos Perso</em> ou <em>L'Œil de l'Atelier</em> pour y être instantanément reconnu avec votre {currentAccount.planTitle} :
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={exportAccountToKey(currentAccount)}
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 font-mono text-[11px] text-gray-300 focus:outline-none select-all"
                    />
                    <button
                      onClick={handleCopyKey}
                      className="px-4 py-2 rounded-lg bg-[#00f5c4] hover:bg-[#00e0b0] text-black font-bold text-xs shrink-0 cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedKey ? "Copié !" : "Copier"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Section d'importation d'un compte externe */}
              <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>Importer un Compte depuis une autre application ALPHABETTE</span>
                </h4>
                
                <p className="text-xs text-gray-400">
                  Vous avez déjà créé votre compte dans <em>Infos Perso</em> ou <em>L'Œil de l'Atelier</em> ? Collez votre clé ci-dessous ou importez votre fichier passeport pour synchroniser vos droits sur IADébat :
                </p>

                <form onSubmit={handleImportSubmit} className="space-y-3">
                  <div>
                    <textarea
                      rows={2}
                      placeholder="Collez ici votre clé ALP-PASS-... ou le contenu JSON de votre passeport"
                      value={importKeyInput}
                      onChange={(e) => setImportKeyInput(e.target.value)}
                      className="w-full bg-[#10121a] border border-white/15 rounded-lg p-2.5 font-mono text-xs text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  {importError && (
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{importError}</span>
                    </div>
                  )}

                  {importSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{importSuccess}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <label className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-purple-400" />
                      <span>Charger un fichier .alphabette-pass</span>
                      <input
                        type="file"
                        accept=".alphabette-pass,.json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Valider & Synchroniser</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* TAB 5: LE PROMPT GLOBAL OFFICIEL ALPHABETTE */}
          {activeTab === "prompt" && (
            <div className="space-y-4">
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-wider">
                    <FileCode className="w-4 h-4" />
                    <span>Instructions Système — Écosystème Logiciel Alphabette</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    Ce prompt global définit les standards de l'écosystème : exclusivité <strong>Mistral AI</strong>, conformité RGPD, 7 jours offerts, grille 39€/59€/99€/199€ et lien obligatoire vers le hub central <strong>http://alphabette.fr</strong>.
                  </p>
                </div>

                <button
                  onClick={handleCopyPrompt}
                  className="px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shrink-0"
                >
                  {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPrompt ? "Prompt Copié !" : "Copier le Prompt Global"}</span>
                </button>
              </div>

              {/* Visualiseur de Prompt avec coloration */}
              <div className="relative">
                <pre className="bg-[#07090e] border border-white/15 rounded-xl p-4 font-mono text-[11px] sm:text-xs text-gray-200 overflow-x-auto max-h-[50vh] whitespace-pre-wrap leading-relaxed selection:bg-blue-400 selection:text-black">
                  {ALPHABETTE_GLOBAL_MASTER_PROMPT}
                </pre>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <span>Écosystème Alphabette · Hub officiel : <a href={ALPHABETTE_HUB_URL} target="_blank" rel="noopener noreferrer" className="text-[#00f5c4] hover:underline font-bold">alphabette.fr</a></span>
                <button
                  onClick={handleCopyPrompt}
                  className="text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier pour mes autres applications</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer Modal avec lien obligatoire vers alphabette.fr */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <a
            href={ALPHABETTE_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00f5c4] hover:underline font-bold flex items-center gap-1 text-[11px]"
          >
            <span>{ALPHABETTE_FOOTER_TEXT}</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            {onOpenSubscriptionModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSubscriptionModal();
                }}
                className="text-xs text-purple-300 hover:text-purple-200 hover:underline cursor-pointer mr-2"
              >
                Voir la grille tarifaire (39€ / 59€ / 99€ / 199€)
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

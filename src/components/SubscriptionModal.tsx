import React, { useState } from "react";
import { 
  X, 
  ShieldCheck, 
  Check, 
  Lock, 
  Sparkles, 
  Building2, 
  MapPin, 
  CreditCard, 
  Mail, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  Info,
  Scale,
  Key,
  ExternalLink,
  Cpu,
  Clock,
  Zap,
  Gift
} from "lucide-react";
import { AlphabetteAccount, AlphabettePlanType } from "../types";
import { 
  ALPHABETTE_PLANS, 
  ALPHABETTE_HUB_URL, 
  ALPHABETTE_FOOTER_TEXT,
  createAlphabetteAccount, 
  saveAlphabetteAccount 
} from "../utils/alphabetteAuth";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: AlphabettePlanType;
  onAccountCreated?: (account: AlphabetteAccount) => void;
  onOpenAccountModal?: () => void;
}

export function SubscriptionModal({ 
  isOpen, 
  onClose, 
  defaultPlan = "individual_confort",
  onAccountCreated,
  onOpenAccountModal
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<AlphabettePlanType>(defaultPlan);
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [createdAccount, setCreatedAccount] = useState<AlphabetteAccount | null>(null);

  if (!isOpen) return null;

  const currentPlanInfo = ALPHABETTE_PLANS.find(p => p.id === selectedPlan) || ALPHABETTE_PLANS[1];
  const isByok = currentPlanInfo.mode === "byok";
  const isIndividual = currentPlanInfo.category === "individual";

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    const newAccount = createAlphabetteAccount(
      name.trim(), 
      email.trim(), 
      selectedPlan, 
      "IADébat",
      undefined,
      isByok ? apiKeyInput.trim() : undefined
    );

    saveAlphabetteAccount(newAccount);
    setCreatedAccount(newAccount);
    if (onAccountCreated) {
      onAccountCreated(newAccount);
    }
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0d14] border border-white/15 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-white">
        
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00f5c4]/15 border border-[#00f5c4]/40 flex items-center justify-center text-[#00f5c4] shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Écosystème ALPHABETTE
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#ff5400]/20 text-[#ff7733] border border-[#ff5400]/40 font-bold flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  Mistral AI Exclusif
                </span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-[#00f5c4]" />
                <span>Souveraineté européenne · Données hébergées en UE · Hub officiel : <a href={ALPHABETTE_HUB_URL} target="_blank" rel="noopener noreferrer" className="text-[#00f5c4] hover:underline font-semibold">alphabette.fr</a></span>
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

        {/* Corps modal scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* Bandeau d'Accueil : 7 Jours d'Essai Offerts & Souveraineté RGPD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 bg-gradient-to-r from-orange-950/40 via-amber-950/30 to-purple-950/30 border border-[#ff5400]/40 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#ff5400]/20 border border-[#ff5400]/40 flex items-center justify-center text-[#ff7733] shrink-0 mt-0.5">
                <Gift className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-[#ff7733] flex items-center gap-1.5">
                  <span>Période d'Essai : 7 Jours Offerts à l'Inscription</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Tout nouvel inscrit bénéficie d'un <strong>accès complet et immédiat</strong> à l'application pendant 7 jours, 
                  alimenté par la clé API Mistral propriétaire fournie par <strong>Alphabette</strong>.
                </p>
              </div>
            </div>

            <div className="bg-[#101422] border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  RGPD & Mistral AI
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Infrastructures 100% en Europe. Zéro réutilisation de vos requêtes pour l'entraînement.
                </p>
              </div>
            </div>
          </div>

          {/* Grille Tarifaire Officielle */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Grille Tarifaire Officielle (Abonnements Annuels)</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Tarification annuelle transparente sans frais cachés, adaptée à votre usage d'IA.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/10 text-gray-300 border border-white/10 shrink-0">
                0 prélèvement mensuel
              </span>
            </div>

            {/* SECTIONS TARIFAIRES : 2 Catégories distinctes */}
            <div className="space-y-4">
              
              {/* CATEGORIE 1 : APPLICATION INDIVIDUELLE */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#00f5c4]" />
                  <span>1. Application Individuelle (IADébat)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Formule BYOK - 39 € / an */}
                  <div
                    onClick={() => setSelectedPlan("individual_byok")}
                    className={`rounded-xl p-4 border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedPlan === "individual_byok"
                        ? "bg-[#101422] border-[#00f5c4] shadow-lg shadow-[#00f5c4]/10"
                        : "bg-black/40 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-gray-300 font-bold">
                            Formule BYOK
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">Clé Client</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-[#00f5c4]">39 €</span>
                          <span className="text-[10px] text-gray-400 block">/ an</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                        Accès illimité aux fonctionnalités de l'application, l'utilisateur gère sa propre clé API Mistral.
                      </p>
                      <ul className="space-y-1.5 text-xs text-gray-300">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
                          <span>Accès illimité à IADébat pendant 1 an</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
                          <span>Vous utilisez votre propre clé API Mistral</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
                          <span>Exports HTML et archives autonomes</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Application Seule</span>
                      <span className="font-bold text-[#00f5c4]">39 € / an</span>
                    </div>
                  </div>

                  {/* Formule Confort - 59 € / an */}
                  <div
                    onClick={() => setSelectedPlan("individual_confort")}
                    className={`rounded-xl p-4 border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedPlan === "individual_confort"
                        ? "bg-[#101422] border-[#00f5c4] shadow-lg shadow-[#00f5c4]/10"
                        : "bg-black/40 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#00f5c4]/15 text-[#00f5c4] border border-[#00f5c4]/30 font-bold">
                            Formule Confort
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">Clé Alphabette Incluse</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-[#00f5c4]">59 €</span>
                          <span className="text-[10px] text-gray-400 block">/ an</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                        Accès complet clé en main, consommation d'IA managée par nos soins (après les 7 jours d'essai).
                      </p>
                      <ul className="space-y-1.5 text-xs text-gray-300">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
                          <span>Accès complet clé en main sans configuration</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
                          <span>Clé Mistral managée et fournie par Alphabette</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
                          <span>Aucun compte développeur requis chez Mistral</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Clé en Main</span>
                      <span className="font-bold text-[#00f5c4]">59 € / an</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* STRATÉGIE CROSS-SELLING SI L'UTILISATEUR SÉLECTIONNE UNE APP INDIVIDUELLE */}
              {isIndividual && (
                <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-blue-950/40 border border-purple-500/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                        Opportunité Économique : Le Bouquet Alphabette
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Pour seulement quelques euros de plus, débloquez l'accès illimité à <strong>toutes les applications actuelles et futures</strong> de la suite (IADébat, Infos Perso, L'Œil de l'Atelier...) dès <strong>99 € / an</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("bouquet_byok")}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Voir le Bouquet (99 € / an)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* CATEGORIE 2 : LE BOUQUET ALPHABETTE */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>2. Le Bouquet Alphabette (Accès à TOUTES les applications)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Pass Bouquet BYOK - 99 € / an */}
                  <div
                    onClick={() => setSelectedPlan("bouquet_byok")}
                    className={`rounded-xl p-4 border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedPlan === "bouquet_byok"
                        ? "bg-[#141224] border-purple-400 shadow-lg shadow-purple-500/10"
                        : "bg-black/40 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                            Bouquet BYOK
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">Pass Bouquet BYOK</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-purple-400">99 €</span>
                          <span className="text-[10px] text-gray-400 block">/ an</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                        Accès illimité à l'intégralité de la suite logicielle Alphabette avec sa propre clé API Mistral.
                      </p>
                      <ul className="space-y-1.5 text-xs text-gray-300">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>Toutes les applications actuelles (IADébat, Infos Perso...)</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>Toutes les futures applications du Bouquet incluses</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>Une seule clé Mistral pour toute votre organisation</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Pass Suite Complète</span>
                      <span className="font-bold text-purple-400">99 € / an</span>
                    </div>
                  </div>

                  {/* Pass Bouquet Intégral - 199 € / an */}
                  <div
                    onClick={() => setSelectedPlan("bouquet_integral")}
                    className={`relative rounded-xl p-4 border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedPlan === "bouquet_integral"
                        ? "bg-[#18132e] border-indigo-400 shadow-xl shadow-indigo-500/20 ring-1 ring-indigo-400/50"
                        : "bg-black/40 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="absolute -top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md">
                      Le Must Clé en Main
                    </div>

                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                            Bouquet Intégral
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">Pass Bouquet Intégral</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-indigo-300">199 €</span>
                          <span className="text-[10px] text-gray-400 block">/ an</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                        Accès illimité à l'intégralité de la suite logicielle Alphabette avec les clés d'API Mistral gérées et incluses.
                      </p>
                      <ul className="space-y-1.5 text-xs text-gray-300">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                          <span>Toute la suite logicielle présente et future en illimité</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                          <span>Clés d'API Mistral 100% gérées & incluses sans surcoût</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                          <span>Support VIP & mises à jour prioritaires</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Bouquet Clé en Main</span>
                      <span className="font-bold text-indigo-300">199 € / an</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* Formulaire de souscription ou Message de confirmation */}
          {!submitted ? (
            <form onSubmit={handleSubscribe} className="bg-black/50 border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 text-white font-bold text-xs uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#00f5c4]" />
                  <span>Validation de la formule : {currentPlanInfo.title} ({currentPlanInfo.priceAnnualEur} € / an)</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  {currentPlanInfo.mode === "byok" ? "Mode BYOK (Clé client)" : "Mode Managé (Clé Alphabette)"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Votre Nom & Prénom *</label>
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
                  <label className="block text-[11px] text-gray-400 mb-1">Votre Adresse E-mail *</label>
                  <input
                    type="email"
                    required
                    placeholder="ex. contact@alphabette.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#10121a] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f5c4]"
                  />
                </div>
              </div>

              {/* Champ optionnel de clé Mistral AI en mode BYOK */}
              {isByok && (
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 space-y-2">
                  <label className="block text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Votre Clé API Mistral AI (BYOK - Facultative dès maintenant ou à saisir plus tard)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="ex. mistral-api-key-... (laisser vide pour la configurer plus tard)"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full bg-[#10121a] border border-white/15 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-gray-400">
                    En formule BYOK, vous pouvez renseigner votre clé personnelle ou basculer vers votre serveur local Ollama / Mac Metal.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#00f5c4]" />
                  <span>Souveraineté européenne · Aucun tracker publicitaire</span>
                </div>

                <button
                  type="submit"
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
                    currentPlanInfo.category === "bouquet"
                      ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white"
                      : "bg-[#00f5c4] hover:bg-[#00e0b0] text-black"
                  }`}
                >
                  <span>Confirmer mon adhésion ({currentPlanInfo.priceAnnualEur} € / an)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-[#00f5c4]/10 border border-[#00f5c4]/40 rounded-xl p-5 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#00f5c4] mx-auto" />
              <h4 className="text-base font-bold text-white">Compte ALPHABETTE créé & adhésion validée !</h4>
              <p className="text-xs text-gray-300 max-w-lg mx-auto leading-relaxed">
                Félicitations <strong>{name}</strong>. Votre compte unifié pour l'écosystème <strong>Alphabette</strong> 
                est désormais actif pour la formule 
                <strong> {currentPlanInfo.title} ({currentPlanInfo.priceAnnualEur} € / an)</strong>.
              </p>

              {createdAccount && (
                <div className="bg-black/50 border border-[#00f5c4]/30 rounded-lg p-2.5 max-w-sm mx-auto text-xs font-mono text-[#00f5c4] flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ID Souverain : <strong>{createdAccount.alphabetteId}</strong></span>
                </div>
              )}

              <p className="text-[11px] text-gray-400 max-w-md mx-auto">
                Ce compte est immédiatement interopérable avec <em>Infos Perso</em>, <em>L'Œil de l'Atelier</em> et toutes les applications de la suite Alphabette.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                {onOpenAccountModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAccountModal();
                    }}
                    className="px-4 py-2 rounded-lg bg-[#00f5c4] hover:bg-[#00e0b0] text-black font-bold text-xs cursor-pointer transition-colors shadow-sm"
                  >
                    Gérer mon Compte ALPHABETTE
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Revenir à l'application
                </button>
              </div>
            </div>
          )}

          {/* Lien obligatoire vers le Hub & Mentions */}
          <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-gray-400">
            <div>
              <strong>Écosystème Alphabette :</strong> Solutions logicielles souveraines propulsées par la technologie <strong>Mistral AI</strong>.
            </div>
            <a 
              href={ALPHABETTE_HUB_URL} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#00f5c4] hover:underline font-bold flex items-center gap-1 shrink-0"
            >
              <span>{ALPHABETTE_FOOTER_TEXT}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00f5c4]" />
            <span>Mistral AI Exclusif · 100% Souveraineté UE · Sans prélèvement mensuel</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}

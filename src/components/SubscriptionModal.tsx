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
  Scale
} from "lucide-react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: "individual" | "pass";
}

export function SubscriptionModal({ isOpen, onClose, defaultPlan = "individual" }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"individual" | "pass">(defaultPlan);
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0d14] border border-white/15 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-white">
        
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00f5c4]/15 border border-[#00f5c4]/40 flex items-center justify-center text-[#00f5c4] shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-white tracking-wide">
                  ALPHABETTE SASU
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#00f5c4]/15 text-[#00f5c4] border border-[#00f5c4]/30 font-bold">
                  Éditeur Souverain
                </span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-[#00f5c4]" />
                <span>Fondé par <strong>Valentin RICHAUD</strong> à La Grande-Motte</span>
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
          
          {/* Manifeste Éthique & Souveraineté */}
          <div className="bg-gradient-to-r from-blue-950/30 via-[#00f5c4]/10 to-purple-950/20 border border-[#00f5c4]/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00f5c4] flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#00f5c4]" />
                <span>Engagement de Souveraineté Numérique & Traitement Éthique</span>
              </span>
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-gray-300">
                100% Indépendant
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Chez <strong>ALPHABETTE SASU</strong>, nous développons des solutions logicielles souveraines à fort impact humain. 
              Nos engagements sont absolus : <strong>absence totale de revente de données personnelles</strong>, 
              <strong>aucune régie publicitaire tierce</strong>, et <strong>priorité au traitement local</strong> dans le respect strict de votre confidentialité.
            </p>
          </div>

          {/* Grille des Offres Tarifaires */}
          <div>
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white">Nos Modalités d'Accès Claires & Sans Frais Cachés</h3>
              <p className="text-xs text-gray-400 mt-1">
                Aucun prélèvement mensuel n'est proposé sur ce pôle afin d'éliminer les frais bancaires intermédiaires et vous garantir le tarif le plus juste.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Option 1 : Application Individuelle */}
              <div 
                onClick={() => setSelectedPlan("individual")}
                className={`relative rounded-xl p-5 border cursor-pointer transition-all flex flex-col justify-between ${
                  selectedPlan === "individual"
                    ? "bg-[#101422] border-[#00f5c4] shadow-lg shadow-[#00f5c4]/10"
                    : "bg-black/50 border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-gray-300">
                        Application Seule
                      </span>
                      <h4 className="text-base font-bold text-white mt-1">IADébat Individuel</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-[#00f5c4] leading-none">15 € <span className="text-xs font-normal text-gray-400">TTC</span></div>
                      <div className="text-[11px] text-gray-400">par an (sans tacite reconduction cachée)</div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                    Accès complet et illimité à l'arène <strong>IADébat</strong>, à l'export autonome en fichiers HTML et aux arbitrages dialectiques entre les grandes IA.
                  </p>

                  <ul className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
                      <span>Tous les débats en direct et archives complètes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
                      <span>Exports en fichiers HTML interactifs & autonomes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
                      <span>Arène de Duel 1v1 et Verdicts du Jury Suprême</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#00f5c4] shrink-0" />
                      <span>Zéro publicité, confidentialité totale</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Formule annuelle</span>
                  <span className="font-bold text-[#00f5c4]">15 € TTC / an</span>
                </div>
              </div>

              {/* Option 2 : Pass ALPHABETTE Complet */}
              <div 
                onClick={() => setSelectedPlan("pass")}
                className={`relative rounded-xl p-5 border cursor-pointer transition-all flex flex-col justify-between ${
                  selectedPlan === "pass"
                    ? "bg-[#141224] border-purple-500 shadow-lg shadow-purple-500/10"
                    : "bg-black/50 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md">
                  Le Bouquet Complet
                </div>

                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Bouquet Global
                      </span>
                      <h4 className="text-base font-bold text-white mt-1">Pass ALPHABETTE</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-purple-400 leading-none">40 € <span className="text-xs font-normal text-gray-400">TTC</span></div>
                      <div className="text-[11px] text-gray-400">par an (accès tout inclus)</div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                    Accès illimité à l'ensemble du bouquet applicatif actuel et aux <strong>futures applications</strong> développées par ALPHABETTE SASU.
                  </p>

                  <ul className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span><strong>IADébat</strong> : Arène souveraine et délibération IA</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span><strong>Infos Perso</strong> : Protection souveraine des données</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span><strong>L'Œil de l'Atelier</strong> : Monitoring et pilotage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span><strong>Futures applications</strong> incluses automatiquement</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Pass Global</span>
                  <span className="font-bold text-purple-400">40 € TTC / an</span>
                </div>
              </div>

            </div>
          </div>

          {/* Formulaire de souscription ou Message de confirmation */}
          {!submitted ? (
            <form onSubmit={handleSubscribe} className="bg-black/40 border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                <Mail className="w-4 h-4 text-[#00f5c4]" />
                <span>Souscrire à la formule sélectionnée ({selectedPlan === "pass" ? "Pass ALPHABETTE 40 € TTC/an" : "IADébat 15 € TTC/an"})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Votre Nom & Prénom</label>
                  <input
                    type="text"
                    required
                    placeholder="ex. Jean Dupont"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#10121a] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f5c4]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Votre Adresse E-mail</label>
                  <input
                    type="email"
                    required
                    placeholder="ex. contact@exemple.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#10121a] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f5c4]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#00f5c4]" />
                  <span>Traitement confidentiel garanti par ALPHABETTE SASU</span>
                </div>

                <button
                  type="submit"
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
                    selectedPlan === "pass"
                      ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white"
                      : "bg-[#00f5c4] hover:bg-[#00e0b0] text-black"
                  }`}
                >
                  <span>Confirmer mon adhésion ({selectedPlan === "pass" ? "40 € / an" : "15 € / an"})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-[#00f5c4]/10 border border-[#00f5c4]/40 rounded-xl p-5 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#00f5c4] mx-auto" />
              <h4 className="text-base font-bold text-white">Demande d'adhésion enregistrée avec succès !</h4>
              <p className="text-xs text-gray-300 max-w-lg mx-auto leading-relaxed">
                Merci <strong>{name}</strong>. Notre équipe chez <strong>ALPHABETTE SASU</strong> (fondée par Valentin RICHAUD à La Grande-Motte) 
                vous transmettra les accès sécurisés et les instructions pour votre formule 
                <strong> {selectedPlan === "pass" ? "Pass ALPHABETTE (40 € TTC / an)" : "IADébat (15 € TTC / an)"}</strong> à l'adresse <code>{email}</code>.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Revenir à l'application
                </button>
              </div>
            </div>
          )}

          {/* Mentions Légales & Raison d'être */}
          <div className="border-t border-white/10 pt-4 text-[11px] text-gray-400 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 text-gray-300 font-bold">
              <Building2 className="w-3.5 h-3.5 text-[#00f5c4]" />
              <span>À propos d'ALPHABETTE SASU</span>
            </div>
            <p>
              ALPHABETTE SASU est un éditeur de solutions logicielles souveraines fondé par <strong>Valentin RICHAUD</strong>, basé à <strong>La Grande-Motte</strong>. 
              Son catalogue regroupe des outils spécialisés conçus pour redonner le contrôle aux citoyens et aux professionnels : 
              <em>IADébat</em>, <em>Infos Perso</em> et <em>L'Œil de l'Atelier</em>.
            </p>
          </div>

        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00f5c4]" />
            <span>Tarification transparente · 0 régie pub · 0 revente de données</span>
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

import React, { useEffect, useState } from "react";
import { connecterOpenRouter, EtatDecouverte } from "../utils/openrouter";
import { 
  Key, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  Eye, 
  EyeOff, 
  Cpu, 
  Send, 
  BookOpen, 
  Info,
  Check,
  Flame,
  Globe2,
  Trash2,
  Zap,
  LogOut,
  ChevronRight
} from "lucide-react";

export interface ApiProviderConfig {
  id: string;
  name: string;
  creator: string;
  badge: string;
  color: string;
  symbol: string;
  keyLink: string;
  docsLink: string;
  placeholder: string;
}

export const PROVIDERS_CONFIG: ApiProviderConfig[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    creator: "OpenAI",
    badge: "OpenAI Platform",
    color: "#10a37f",
    symbol: "⁕",
    keyLink: "https://platform.openai.com/api-keys",
    docsLink: "https://platform.openai.com/docs/models",
    placeholder: "sk-proj-...",
  },
  {
    id: "claude",
    name: "Claude",
    creator: "Anthropic",
    badge: "Anthropic Console",
    color: "#d97706",
    symbol: "⌓",
    keyLink: "https://console.anthropic.com/settings/keys",
    docsLink: "https://platform.claude.com/docs/en/models/overview",
    placeholder: "sk-ant-...",
  },
  {
    id: "gemini",
    name: "Gemini",
    creator: "Google",
    badge: "Google AI Studio",
    color: "#3b82f6",
    symbol: "✦",
    keyLink: "https://aistudio.google.com/app/apikey",
    docsLink: "https://ai.google.dev/gemini-api/docs/models/gemini",
    placeholder: "AIzaSy...",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    creator: "DeepSeek AI",
    badge: "DeepSeek Open Platform",
    color: "#0a59f7",
    symbol: "🐳",
    keyLink: "https://platform.deepseek.com/api_keys",
    docsLink: "https://api-docs.deepseek.com/quick_start/pricing",
    placeholder: "sk-...",
  },
  {
    id: "mistral",
    name: "Mistral",
    creator: "Mistral AI",
    badge: "La Plateforme Mistral",
    color: "#ff5400",
    symbol: "⬘",
    keyLink: "https://console.mistral.ai/api-keys/",
    docsLink: "https://docs.mistral.ai/getting-started/models/",
    placeholder: "...",
  },
  {
    id: "grok",
    name: "Grok",
    creator: "xAI",
    badge: "xAI Cloud Console",
    color: "#ffffff",
    symbol: "𝕏",
    keyLink: "https://console.x.ai/",
    docsLink: "https://docs.x.ai/docs/models",
    placeholder: "xai-...",
  }
];

interface ApiKeysAndModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: { [key: string]: string };
  onSaveApiKey: (providerId: string, value: string) => void;
  onResetAllKeys: () => void;
  cleOpenRouter: string;
  gratuitsOpenRouter: boolean;
  onChangerGratuits: (v: boolean) => void;
  onDeconnecterOpenRouter: () => void;
  messageOpenRouter: string;
  etatDecouverte: EtatDecouverte | null;
  onRafraichirDecouverte: () => void;
}

export function ApiKeysAndModelsModal({
  isOpen,
  onClose,
  apiKeys,
  onSaveApiKey,
  onResetAllKeys,
  cleOpenRouter,
  gratuitsOpenRouter,
  onChangerGratuits,
  onDeconnecterOpenRouter,
  messageOpenRouter,
  etatDecouverte,
  onRafraichirDecouverte,
}: ApiKeysAndModelsModalProps) {
  const [activeTab, setActiveTab] = useState<"access" | "keys" | "evolution" | "freedom">("access");
  const [connexionEnCours, setConnexionEnCours] = useState(false);
  useEffect(() => {
    if (isOpen) onRafraichirDecouverte();
  }, [isOpen, onRafraichirDecouverte]);
  const [visibleKeys, setVisibleKeys] = useState<{ [key: string]: boolean }>({});
  const [testResults, setTestResults] = useState<{
    [key: string]: {
      loading: boolean;
      success?: boolean;
      latencyMs?: number;
      modelUsed?: string;
      error?: string;
      reply?: string;
    };
  }>({});

  if (!isOpen) return null;

  const handleToggleVisibility = (id: string) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTestKey = async (provider: ApiProviderConfig) => {
    const key = apiKeys[provider.id];
    if (!key || !key.trim()) {
      setTestResults(prev => ({
        ...prev,
        [provider.id]: {
          loading: false,
          success: false,
          error: "Veuillez d'abord renseigner une clé pour ce constructeur."
        }
      }));
      return;
    }

    setTestResults(prev => ({
      ...prev,
      [provider.id]: { loading: true }
    }));

    try {
      const resp = await fetch("/api/debate/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider.id,
          key: key.trim()
        })
      });
      const data = await resp.json();

      if (data.success) {
        setTestResults(prev => ({
          ...prev,
          [provider.id]: {
            loading: false,
            success: true,
            latencyMs: data.latencyMs,
            modelUsed: data.modelUsed,
            reply: data.reply
          }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [provider.id]: {
            loading: false,
            success: false,
            modelUsed: data.modelUsed,
            error: data.error || "Échec de connexion"
          }
        }));
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [provider.id]: {
          loading: false,
          success: false,
          error: "Impossible de joindre le serveur de test."
        }
      }));
    }
  };

  const activeKeysCount = Object.values(apiKeys).filter(k => k && k.trim().length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0e0e12] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-gray-200">
        
        {/* HEADER MODAL */}
        <div className="px-4 sm:px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-2 bg-gradient-to-r from-white/[0.03] to-transparent shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f5c4]/20 to-blue-500/20 border border-[#00f5c4]/40 items-center justify-center text-[#00f5c4] shadow-sm shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-condensed font-bold text-lg text-white uppercase tracking-wider">
                  Accès aux IA
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#00f5c4]/15 text-[#00f5c4] border border-[#00f5c4]/30">
                  {cleOpenRouter ? "OpenRouter connecté" : activeKeysCount > 0 ? `${activeKeysCount} / 6 clés` : etatDecouverte?.actif ? "Mode Découverte" : "À configurer"}
                </span>
              </div>
              <p className="hidden sm:block text-xs text-gray-400">
                Débattez tout de suite, sans rien configurer. Le modèle de chaque IA est choisi automatiquement.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 shrink-0 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* NAVIGATION PAR ONGLETS */}
        <div className="flex border-b border-white/[0.08] bg-black/40 px-2 sm:px-6 shrink-0 gap-1 sm:gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("access")}
            className={`py-3 px-3 sm:px-4 whitespace-nowrap font-condensed font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all border-b-2 shrink-0 ${
              activeTab === "access"
                ? "border-[#00f5c4] text-[#00f5c4] bg-white/[0.02]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Accès aux IA</span>
          </button>

          <button
            onClick={() => setActiveTab("keys")}
            className={`py-3 px-3 sm:px-4 whitespace-nowrap font-condensed font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all border-b-2 ${
              activeTab === "keys"
                ? "border-[#00f5c4] text-[#00f5c4] bg-white/[0.02]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Key className="w-4 h-4" />
            <span className="sm:hidden">Mode Expert</span>
            <span className="hidden sm:inline">Mode Expert (Clés API personnelles)</span>
          </button>

          <button
            onClick={() => setActiveTab("freedom")}
            className={`py-3 px-3 sm:px-4 whitespace-nowrap font-condensed font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all border-b-2 ${
              activeTab === "freedom"
                ? "border-emerald-400 text-emerald-400 bg-white/[0.02]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Liberté d'Opinion & Neutralité</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab("evolution")}
            className={`py-3 px-3 sm:px-4 whitespace-nowrap font-condensed font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all border-b-2 ${
              activeTab === "evolution"
                ? "border-blue-400 text-blue-400 bg-white/[0.02]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Guide d'Évolution des Clés</span>
          </button>
        </div>

        {/* CONTENU DÉFILABLE */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">

          {/* ═══ ONGLET 0 : ACCÈS AUX IA (Découverte + OpenRouter 1 clic) ═══ */}
          {activeTab === "access" && (
            <div className="space-y-4 animate-fadeIn">
              {/* MODE DÉCOUVERTE */}
              <section className="rounded-xl border border-[#00f5c4]/40 bg-gradient-to-br from-[#00f5c4]/[0.08] via-[#121217] to-[#121217] p-4 sm:p-5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-condensed font-extrabold text-base sm:text-lg uppercase tracking-wider text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#00f5c4]" />
                    1. Mode Découverte
                  </h3>
                  {etatDecouverte?.actif ? (
                    <span className="text-xs sm:text-sm font-bold text-[#00f5c4] bg-[#00f5c4]/10 border border-[#00f5c4]/30 px-2.5 py-1 rounded-lg">
                      {etatDecouverte.debats_restants} / {etatDecouverte.quota} débats gratuits aujourd'hui
                    </span>
                  ) : (
                    <span className="text-xs sm:text-sm font-bold text-gray-400 bg-white/[0.04] border border-white/10 px-2.5 py-1 rounded-lg">
                      {etatDecouverte ? "Bientôt ouvert" : "Vérification…"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">
                  <strong>Rien à configurer :</strong> lancez un débat, les 6 IA (ChatGPT, Claude, Gemini, DeepSeek, Mistral, Grok) répondent.
                  {" "}{etatDecouverte?.quota ?? 3} débats gratuits par jour et par connexion.
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Vos messages passent par le serveur d'Alphabette puis par OpenRouter, qui transmet à chaque IA. Votre adresse IP n'est pas conservée (seulement une empreinte qui change chaque jour, pour compter les débats).
                  {etatDecouverte && !etatDecouverte.actif ? " En attendant l'ouverture, utilisez la connexion OpenRouter ci-dessous." : ""}
                </p>
              </section>

              {/* OPENROUTER 1 CLIC */}
              <section className="rounded-xl border border-violet-400/40 bg-gradient-to-br from-violet-500/[0.08] via-[#121217] to-[#121217] p-4 sm:p-5 space-y-3">
                <h3 className="font-condensed font-extrabold text-base sm:text-lg uppercase tracking-wider text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-300" />
                  2. Illimité en 1 clic avec OpenRouter
                </h3>
                <p className="text-sm text-gray-200 leading-relaxed">
                  <strong>Un seul compte pour les 6 IA</strong>, sans limite du site. Gratuit avec les modèles gratuits d'OpenRouter (en nombre limité par jour), sinon OpenRouter vous facture à l'usage.
                </p>
                {cleOpenRouter ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>Connecté à OpenRouter</span>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer select-none min-h-[48px]">
                      <input
                        type="checkbox"
                        checked={gratuitsOpenRouter}
                        onChange={(e) => onChangerGratuits(e.target.checked)}
                        className="mt-1 w-5 h-5 accent-violet-400 cursor-pointer shrink-0"
                      />
                      <span className="text-sm text-gray-200">
                        <strong>Modèles gratuits uniquement</strong> (compte OpenRouter sans crédit). Quand une IA n'a pas de version gratuite, une autre IA gratuite écrit à sa place : la réplique l'indique.
                      </span>
                    </label>
                    <button
                      onClick={onDeconnecterOpenRouter}
                      className="min-h-[48px] px-4 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-bold text-gray-200 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Se déconnecter d'OpenRouter
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => { setConnexionEnCours(true); await connecterOpenRouter(); }}
                    disabled={connexionEnCours}
                    className="w-full sm:w-auto min-h-[52px] px-6 rounded-xl bg-violet-400 hover:bg-violet-300 disabled:opacity-60 text-black font-condensed font-extrabold text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-violet-500/20"
                  >
                    <Zap className="w-5 h-5" />
                    {connexionEnCours ? "Ouverture d'OpenRouter…" : "Se connecter avec OpenRouter (1 clic)"}
                  </button>
                )}
                {messageOpenRouter && <p className="text-sm text-gray-100" role="status">{messageOpenRouter}</p>}
                <p className="text-xs text-gray-400 leading-relaxed">
                  OpenRouter vous demande de vous connecter (compte Google possible) puis d'autoriser IA Débat. La clé créée reste dans ce navigateur et n'est envoyée qu'à openrouter.ai, jamais à Alphabette.
                </p>
              </section>

              {/* VERS LE MODE EXPERT */}
              <button
                onClick={() => setActiveTab("keys")}
                className="w-full min-h-[52px] rounded-xl border border-white/10 bg-[#121217] hover:border-white/25 px-4 py-3 flex items-center justify-between gap-3 text-left cursor-pointer"
              >
                <span className="text-sm text-gray-300">
                  <strong className="text-white">3. Mode Expert :</strong> vous avez déjà vos propres clés (OpenAI, Anthropic, Google, DeepSeek, Mistral, xAI) ?
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </button>
            </div>
          )}

          {/* ═══ ONGLET EXPERT : CLÉS PERSONNELLES ═══ */}
          {activeTab === "keys" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* BANDEAU RASSURANT */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-purple-950/20 to-black/40 border border-blue-500/20 flex items-start gap-3.5">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-gray-300 space-y-1">
                  <div className="font-bold text-white flex items-center gap-2 font-condensed uppercase tracking-wide">
                    <span>Comment fonctionne l'arène ?</span>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-sans">
                      Mode Expert
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    <strong>Facultatif :</strong> sans clé, le Mode Découverte ou la connexion OpenRouter font parler les IA. Avec votre clé, l'IA concernée répond directement depuis votre compte développeur (prioritaire sur les autres modes).
                    <strong> Une clé par constructeur</strong> (OpenAI, Anthropic, Google, xAI, Mistral, DeepSeek) fait parler le vrai modèle de chacun.
                    Vos clés restent dans ce navigateur et ne sont envoyées qu'au fournisseur d'IA concerné (jamais à Alphabette). Le coût vous est facturé par ce fournisseur.
                  </p>
                </div>
              </div>

              {/* LISTE DES CONSTRUCTEURS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROVIDERS_CONFIG.map(provider => {
                  const keyVal = apiKeys[provider.id] || "";
                  const hasKey = keyVal.trim().length > 0;
                  const testState = testResults[provider.id];
                  const isVisible = visibleKeys[provider.id];

                  return (
                    <div
                      key={provider.id}
                      className="border border-white/[0.08] bg-[#121217] rounded-xl p-4 flex flex-col justify-between transition-all hover:border-white/[0.15]"
                    >
                      <div>
                        {/* EN-TÊTE DU CONSTRUCTEUR */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm"
                              style={{ backgroundColor: `${provider.color}20`, color: provider.color, border: `1px solid ${provider.color}40` }}
                            >
                              {provider.symbol}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm leading-tight flex items-center gap-1.5 font-condensed">
                                <span>{provider.name}</span>
                                <span className="text-[10px] text-gray-500 font-sans font-normal">({provider.creator})</span>
                              </div>
                              <div className="text-[10px] text-gray-400">{provider.badge}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {hasKey ? (
                              <span className="text-[10px] text-[#00f5c4] font-bold bg-[#00f5c4]/10 border border-[#00f5c4]/30 px-2 py-0.5 rounded flex items-center gap-1">
                                <Check className="w-3 h-3" /> Clé Active
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.05]">
                                Sans clé
                              </span>
                            )}
                          </div>
                        </div>

                        {/* CHAMP CLÉ API */}
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center justify-between text-[11px]">
                            <label className="text-gray-400 font-medium">Clé API personnelle :</label>
                            <a
                              href={provider.keyLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5 hover:underline font-semibold text-[10px]"
                            >
                              <span>Créer / Gérer</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>

                          <div className="relative">
                            <input
                              type={isVisible ? "text" : "password"}
                              placeholder={provider.placeholder}
                              value={keyVal}
                              onChange={e => onSaveApiKey(provider.id, e.target.value)}
                              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-700 font-mono focus:outline-none focus:border-[#00f5c4] pr-16"
                            />
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(provider.id)}
                              className="absolute right-2 top-2 text-gray-500 hover:text-gray-300 p-0 cursor-pointer bg-transparent border-none flex items-center gap-1 text-[10px]"
                            >
                              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              <span>{isVisible ? "Cacher" : "Voir"}</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-[10px] text-gray-500 mb-3 flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-[#00f5c4] shrink-0" />
                          <span>Modèle choisi automatiquement : toujours un modèle disponible pour votre clé.</span>
                        </p>
                      </div>

                      {/* PIED DE CARTE & TEST */}
                      <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleTestKey(provider)}
                          disabled={testState?.loading}
                          className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${testState?.loading ? "animate-spin text-[#00f5c4]" : ""}`} />
                          <span>{testState?.loading ? "Test en cours..." : "Tester la clé"}</span>
                        </button>

                        <div className="text-right min-w-0 flex-1">
                          {testState?.loading && (
                            <span className="text-[10px] text-gray-400 italic">Interrogation du serveur...</span>
                          )}

                          {testState?.success && (
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center justify-end gap-1 truncate">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Opérationnel{testState.modelUsed ? ` · ${testState.modelUsed}` : ""} ({testState.latencyMs} ms)</span>
                            </span>
                          )}

                          {testState?.error && (
                            <span 
                              className="text-[10px] text-red-400 font-medium flex items-center justify-end gap-1 truncate"
                              title={testState.error}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{testState.error}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ACTIONS INFÉRIEURES */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  onClick={() => {
                    if (window.confirm("Voulez-vous supprimer toutes les clés API enregistrées localement ?")) {
                      onResetAllKeys();
                    }
                  }}
                  className="text-xs text-red-400/80 hover:text-red-400 flex items-center gap-1.5 cursor-pointer bg-transparent border-none uppercase font-condensed tracking-wider"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Effacer toutes les clés du navigateur</span>
                </button>

                <div className="text-xs text-gray-500">
                  Stockage local et confidentiel (aucun mot de passe ou clé n'est conservé de manière persistante sur nos serveurs).
                </div>
              </div>
            </div>
          )}

          {/* ═══ ONGLET 2 : LIBERTÉ D'EXPRESSION & NEUTRALITÉ ═══ */}
          {activeTab === "freedom" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* GRAND ENGAGEMENT */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-[#0e1614] to-black border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                  <h3 className="font-condensed font-extrabold text-base uppercase tracking-wider">
                    Garantie d'Indépendance Dialectique Absolue
                  </h3>
                </div>
                <p className="text-xs text-gray-200 leading-relaxed">
                  <strong>Réponse directe à votre question :</strong> Les intelligences artificielles intervenant dans cette arène sont <strong>totalement libres de penser et d'argumenter</strong>. Aucun point de vue ne leur est suggéré, dicté ou pré-orienté.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-black/50 border border-white/[0.05] p-3 rounded-lg">
                    <div className="font-condensed font-bold text-xs text-emerald-400 uppercase mb-1">1. Aucune Thèse Imposée</div>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      Aucun modèle n'est obligé d'être "pour" ou "contre". Chacun choisit librement sa thèse en fonction de sa propre dynamique intellectuelle.
                    </p>
                  </div>
                  <div className="bg-black/50 border border-white/[0.05] p-3 rounded-lg">
                    <div className="font-condensed font-bold text-xs text-emerald-400 uppercase mb-1">2. Émergence en Temps Réel</div>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      Les arguments se construisent en réaction directe aux interventions des autres modèles, favorisant de véritables étincelles critiques.
                    </p>
                  </div>
                  <div className="bg-black/50 border border-white/[0.05] p-3 rounded-lg">
                    <div className="font-condensed font-bold text-xs text-emerald-400 uppercase mb-1">3. Différences Stylistiques</div>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      Seuls le style d'analyse et le tempérament discursif (nuance, logique pure, concision, provocation) sont définis, jamais la doctrine.
                    </p>
                  </div>
                </div>
              </div>

              {/* PREUVE PAR LA TRANSPARENCE : LE PROMPT SYSTÈME EXACT */}
              <div className="border border-white/[0.08] bg-[#121217] rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#00f5c4]" />
                    <span className="font-condensed font-bold text-xs uppercase tracking-wider text-white">
                      Consigne officielle transmise à chaque IA à chaque prise de parole :
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                    Protocole strict
                  </span>
                </div>
                <div className="bg-black/80 border border-white/[0.08] p-3.5 rounded-lg text-xs font-mono text-gray-300 leading-relaxed space-y-2">
                  <div className="text-emerald-300 font-bold">
                    « - LIBERTÉ TOTALE D'OPINION : Tu disposes d'une liberté intellectuelle et dialectique absolue. Aucun point de vue, parti-pris, thèse ou conclusion ne t'est suggéré ni imposé. Tu es entièrement souverain pour adopter la posture de ton choix (favorable, opposée, sceptique, alternative ou médiane) selon ta propre analyse. »
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    « - Ne commence JAMAIS par une formule de politesse. Entre immédiatement dans le vif de ton argument. Tiens-toi strictement à ton rôle de réflexion critique. »
                  </div>
                </div>
              </div>

              {/* CE QUE FAIT CHACUN DES MODÈLES */}
              <div className="border border-white/[0.08] bg-[#121217] rounded-xl p-4 space-y-3">
                <h4 className="font-condensed font-bold text-xs uppercase tracking-wider text-white">
                  Ce que chaque IA apporte au débat sans contrainte idéologique :
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
                    <span className="w-2 h-2 rounded-full bg-[#10a37f] mt-1 shrink-0" />
                    <div>
                      <strong className="text-white">ChatGPT (OpenAI) :</strong>
                      <span className="text-gray-400"> Décortique méthodiquement la problématique en pesant les implications opérationnelles et sociétales.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
                    <span className="w-2 h-2 rounded-full bg-[#d97706] mt-1 shrink-0" />
                    <div>
                      <strong className="text-white">Claude (Anthropic) :</strong>
                      <span className="text-gray-400"> Questionne les angles morts éthiques, la dignité humaine et refuse les jugements simplistes.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
                    <span className="w-2 h-2 rounded-full bg-[#3b82f6] mt-1 shrink-0" />
                    <div>
                      <strong className="text-white">Gemini (Google) :</strong>
                      <span className="text-gray-400"> Projette les débats dans le futur, articulant sciences avancées et visions d'impact à grande échelle.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
                    <span className="w-2 h-2 rounded-full bg-[#0a59f7] mt-1 shrink-0" />
                    <div>
                      <strong className="text-white">DeepSeek :</strong>
                      <span className="text-gray-400"> Raisonne par logique pure, calcul de contraintes et modélisation factuelle sans fioritures.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
                    <span className="w-2 h-2 rounded-full bg-[#ff5400] mt-1 shrink-0" />
                    <div>
                      <strong className="text-white">Mistral AI :</strong>
                      <span className="text-gray-400"> Porte un regard souverain, européen et autonome, attentif à l'indépendance culturelle et technologique.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
                    <span className="w-2 h-2 rounded-full bg-white mt-1 shrink-0" />
                    <div>
                      <strong className="text-white">Grok (xAI) :</strong>
                      <span className="text-gray-400"> Casse les consensus polis avec un esprit provocateur, mordant et refuse les discours convenus.</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ═══ ONGLET 3 : GUIDE D'ÉVOLUTION DES CLÉS ═══ */}
          {activeTab === "evolution" && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-blue-950/20 to-black border border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-condensed font-bold uppercase text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Comment les clés API évoluent-elles ? Pourquoi et comment les mettre à jour ?</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Vous vous demandez si vos clés API deviennent obsolètes avec l'arrivée de nouvelles IA ? Voici tout ce qu'il faut savoir pour que votre arène de débat reste toujours au sommet des dernières avancées mondiales.
                </p>
              </div>

              {/* 4 CONSEILS ESSENTIELS */}
              <div className="space-y-4 text-xs">
                <div className="bg-[#121217] border border-white/[0.08] p-4 rounded-xl space-y-1.5">
                  <div className="font-condensed font-bold text-white uppercase text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00f5c4]/20 text-[#00f5c4] flex items-center justify-center font-bold text-[10px]">1</span>
                    <span>Votre clé API est pérenne : elle ne périme pas quand une nouvelle IA sort</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed pl-7">
                    Une clé API OpenAI, Google ou Anthropic est rattachée à votre compte développeur, pas à un modèle unique. Quand un fournisseur sort un nouveau modèle, <strong>votre clé actuelle vous ouvre automatiquement l'accès</strong> à ces nouveaux cerveaux sans avoir besoin d'en créer une nouvelle !
                  </p>
                </div>

                <div className="bg-[#121217] border border-white/[0.08] p-4 rounded-xl space-y-1.5">
                  <div className="font-condensed font-bold text-white uppercase text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">2</span>
                    <span>Rien à régler quand un nouveau modèle sort</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed pl-7">
                    Vous ne donnez que votre clé. L'application choisit toute seule un modèle disponible pour cette clé. Si un fournisseur retire un modèle, elle demande au fournisseur la liste de ses modèles actuels et prend le plus récent adapté. Le nom du modèle utilisé s'affiche après « Tester la clé ».
                  </p>
                </div>

                <div className="bg-[#121217] border border-white/[0.08] p-4 rounded-xl space-y-1.5">
                  <div className="font-condensed font-bold text-white uppercase text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">3</span>
                    <span>Vérifier vos tiers et vos crédits chez chaque constructeur</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed pl-7">
                    Certains modèles très avancés (comme les modèles de raisonnement profonds) exigent parfois que votre compte soit approvisionné d'un crédit minimum (ex: 5$ sur OpenAI ou Anthropic). Le bouton <strong>« Tester la clé »</strong> vous indique instantanément si votre clé fonctionne.
                  </p>
                </div>

                <div className="bg-[#121217] border border-white/[0.08] p-4 rounded-xl space-y-1.5">
                  <div className="font-condensed font-bold text-white uppercase text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">4</span>
                    <span>Recommandations de mise à niveau suggérées aux utilisateurs</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed pl-7">
                    Bon à savoir :
                    <br />• <strong>Google AI Studio</strong> : La clé Gemini gratuite offre un quota généreux pour les débats.
                    <br />• <strong>OpenAI</strong> et <strong>Anthropic</strong> : l'usage est facturé sur votre compte ; les prix sont sur le site de chaque fournisseur.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-3 sm:px-6 py-3 border-t border-white/[0.08] bg-black/50 flex items-center justify-end sm:justify-between shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Toutes les IA débattent en totale souveraineté intellectuelle.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#00f5c4] hover:bg-[#00e0b0] text-black font-condensed font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer transition-all shadow-md shadow-[#00f5c4]/20"
          >
            <span className="sm:hidden">Fermer</span>
            <span className="hidden sm:inline">Fermer & Retourner à l'Arène</span>
          </button>
        </div>

      </div>
    </div>
  );
}

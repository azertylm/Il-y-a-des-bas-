import React, { useState } from "react";
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
  Trash2
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
  defaultModel: string;
  recommendedModels: { id: string; label: string; tag: string }[];
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
    defaultModel: "gpt-4o-mini",
    recommendedModels: [
      { id: "gpt-4o-mini", label: "GPT-4o Mini (Rapide, économique & vif)", tag: "Par défaut" },
      { id: "gpt-4o", label: "GPT-4o (Modèle omni de référence)", tag: "Élite" },
      { id: "gpt-4.5-preview", label: "GPT-4.5 Preview (Raisonnement profond)", tag: "Nouvelle génération" },
      { id: "o3-mini", label: "o3-mini (Raisonnement logique & mathématique)", tag: "Nouveau" },
    ]
  },
  {
    id: "claude",
    name: "Claude",
    creator: "Anthropic",
    badge: "Anthropic Console",
    color: "#d97706",
    symbol: "⌓",
    keyLink: "https://console.anthropic.com/settings/keys",
    docsLink: "https://docs.anthropic.com/en/docs/about-claude/models",
    placeholder: "sk-ant-...",
    defaultModel: "claude-3-5-haiku-20241022",
    recommendedModels: [
      { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku (Ultra-rapide & littéraire)", tag: "Par défaut" },
      { id: "claude-3-7-sonnet-latest", label: "Claude 3.7 Sonnet (Raisonnement hybride de pointe)", tag: "Dernier cri" },
      { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet v2 (Nuance philosophique)", tag: "Élite" },
    ]
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
    defaultModel: "gemini-3.1-flash-lite",
    recommendedModels: [
      { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite (Temps réel éclair)", tag: "Par défaut" },
      { id: "gemini-flash-latest", label: "Gemini Flash Latest (Dernière version automatique)", tag: "Évolutif" },
      { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (Vision prospective & puissance)", tag: "Haute capacité" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Compréhension multimodale profonde)", tag: "Raisonnement" },
    ]
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
    defaultModel: "deepseek-chat",
    recommendedModels: [
      { id: "deepseek-chat", label: "DeepSeek-V3 / Chat (Rigueur mathématique & code)", tag: "Par défaut" },
      { id: "deepseek-reasoner", label: "DeepSeek-R1 / Reasoner (Raisonnement pas à pas)", tag: "Nouveau" },
    ]
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
    defaultModel: "mistral-large-latest",
    recommendedModels: [
      { id: "mistral-large-latest", label: "Mistral Large Latest (Dernière version souveraine)", tag: "Évolutif" },
      { id: "mistral-small-latest", label: "Mistral Small Latest (Haute vitesse & concision)", tag: "Rapide" },
      { id: "codestral-latest", label: "Codestral Latest (Précision formelle)", tag: "Spécialisé" },
    ]
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
    defaultModel: "grok-2-1212",
    recommendedModels: [
      { id: "grok-2-1212", label: "Grok 2 (Incisif, direct & sans langue de bois)", tag: "Par défaut" },
      { id: "grok-beta", label: "Grok Beta (Dernières innovations xAI)", tag: "Avant-première" },
    ]
  }
];

interface ApiKeysAndModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: { [key: string]: string };
  apiModels: { [key: string]: string };
  onSaveApiKey: (providerId: string, value: string) => void;
  onSaveApiModel: (providerId: string, value: string) => void;
  onResetAllKeys: () => void;
}

export function ApiKeysAndModelsModal({
  isOpen,
  onClose,
  apiKeys,
  apiModels,
  onSaveApiKey,
  onSaveApiModel,
  onResetAllKeys,
}: ApiKeysAndModelsModalProps) {
  const [activeTab, setActiveTab] = useState<"keys" | "evolution" | "freedom">("keys");
  const [visibleKeys, setVisibleKeys] = useState<{ [key: string]: boolean }>({});
  const [customModelInputs, setCustomModelInputs] = useState<{ [key: string]: string }>({});
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

    const currentModel = apiModels[provider.id] || provider.defaultModel;

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
          model: currentModel,
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
            modelUsed: data.modelUsed || currentModel,
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
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-white/[0.03] to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f5c4]/20 to-blue-500/20 border border-[#00f5c4]/40 flex items-center justify-center text-[#00f5c4] shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-condensed font-bold text-lg text-white uppercase tracking-wider">
                  Clés API, Modèles & Liberté d'Expression
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#00f5c4]/15 text-[#00f5c4] border border-[#00f5c4]/30">
                  {activeKeysCount} / 6 clés actives
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Gérez vos modèles d'IA, faites évoluer vos versions et découvrez les garanties de neutralité doctrinale.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* NAVIGATION PAR ONGLETS */}
        <div className="flex border-b border-white/[0.08] bg-black/40 px-6 shrink-0 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("keys")}
            className={`py-3 px-4 font-condensed font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all border-b-2 ${
              activeTab === "keys"
                ? "border-[#00f5c4] text-[#00f5c4] bg-white/[0.02]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Clés & Modèles Évolutifs</span>
          </button>

          <button
            onClick={() => setActiveTab("freedom")}
            className={`py-3 px-4 font-condensed font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all border-b-2 ${
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
            className={`py-3 px-4 font-condensed font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all border-b-2 ${
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ═══ ONGLET 1 : CLÉS & MODÈLES ═══ */}
          {activeTab === "keys" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* BANDEAU RASSURANT */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-purple-950/20 to-black/40 border border-blue-500/20 flex items-start gap-3.5">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-gray-300 space-y-1">
                  <div className="font-bold text-white flex items-center gap-2 font-condensed uppercase tracking-wide">
                    <span>Comment fonctionne l'arène ?</span>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-sans">
                      Sans clé requise
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    <strong>Vous n'avez pas de clé ?</strong> L'arène fonctionne automatiquement grâce au moteur haute fidélité Gemini de Google et au relais dialectique souverain.
                    <strong> Vous avez vos propres clés ?</strong> Renseignez-les pour faire parler directement le véritable moteur de chaque constructeur (OpenAI, Anthropic, xAI, Mistral, DeepSeek) avec le modèle de votre choix.
                  </p>
                </div>
              </div>

              {/* LISTE DES CONSTRUCTEURS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROVIDERS_CONFIG.map(provider => {
                  const keyVal = apiKeys[provider.id] || "";
                  const hasKey = keyVal.trim().length > 0;
                  const currentModel = apiModels[provider.id] || provider.defaultModel;
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
                                Relais Gemini
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

                        {/* SÉLECTEUR DE MODÈLE ÉVOLUTIF */}
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center justify-between text-[11px]">
                            <label className="text-gray-400 font-medium flex items-center gap-1">
                              <Cpu className="w-3 h-3 text-[#00f5c4]" />
                              <span>Version du Modèle :</span>
                            </label>
                            <a
                              href={provider.docsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-gray-300 flex items-center gap-0.5 hover:underline text-[10px]"
                              title="Voir les nouveaux modèles sortis par ce constructeur"
                            >
                              <span>Doc modèles</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>

                          <select
                            value={
                              provider.recommendedModels.some(m => m.id === currentModel)
                                ? currentModel
                                : "custom"
                            }
                            onChange={e => {
                              const val = e.target.value;
                              if (val === "custom") {
                                // Garde la valeur personnalisée
                                if (!customModelInputs[provider.id]) {
                                  setCustomModelInputs(prev => ({ ...prev, [provider.id]: currentModel }));
                                }
                              } else {
                                onSaveApiModel(provider.id, val);
                              }
                            }}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-[#00f5c4] cursor-pointer"
                          >
                            {provider.recommendedModels.map(m => (
                              <option key={m.id} value={m.id} className="bg-[#121217] text-white">
                                {m.label}
                              </option>
                            ))}
                            <option value="custom" className="bg-[#121217] text-[#00f5c4] font-bold">
                              ✏️ Modèle personnalisé (nouveau modèle sorti...)
                            </option>
                          </select>

                          {/* CHAMP DE SAISIE LIBRE SI MODÈLE PERSONNALISÉ */}
                          {(!provider.recommendedModels.some(m => m.id === currentModel) ||
                            customModelInputs[provider.id] !== undefined) && (
                            <div className="mt-1.5 flex gap-1.5 animate-fadeIn">
                              <input
                                type="text"
                                placeholder={`Ex: ${provider.defaultModel}`}
                                value={currentModel}
                                onChange={e => onSaveApiModel(provider.id, e.target.value)}
                                className="flex-1 bg-black/80 border border-[#00f5c4]/40 rounded px-2.5 py-1 text-xs text-[#00f5c4] font-mono focus:outline-none"
                              />
                              <button
                                onClick={() => onSaveApiModel(provider.id, provider.defaultModel)}
                                className="px-2 py-1 text-[10px] bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white cursor-pointer"
                                title="Réinitialiser au modèle standard"
                              >
                                Défaut
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PIED DE CARTE & TEST */}
                      <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleTestKey(provider)}
                          disabled={testState?.loading}
                          className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${testState?.loading ? "animate-spin text-[#00f5c4]" : ""}`} />
                          <span>{testState?.loading ? "Test en cours..." : "Tester la clé & le modèle"}</span>
                        </button>

                        <div className="text-right min-w-0 flex-1">
                          {testState?.loading && (
                            <span className="text-[10px] text-gray-400 italic">Interrogation du serveur...</span>
                          )}

                          {testState?.success && (
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center justify-end gap-1 truncate">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Opérationnel ({testState.latencyMs} ms)</span>
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
                    Une clé API OpenAI, Google ou Anthropic est rattachée à votre compte développeur, pas à un modèle unique. Lorsque OpenAI lance <em>GPT-4.5</em> ou qu'Anthropic lance <em>Claude 3.7</em>, <strong>votre clé actuelle vous ouvre automatiquement l'accès</strong> à ces nouveaux cerveaux sans avoir besoin d'en créer une nouvelle !
                  </p>
                </div>

                <div className="bg-[#121217] border border-white/[0.08] p-4 rounded-xl space-y-1.5">
                  <div className="font-condensed font-bold text-white uppercase text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">2</span>
                    <span>Comment faire évoluer le modèle utilisé dans l'application ?</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed pl-7">
                    Dans l'onglet <strong>« Clés & Modèles Évolutifs »</strong> de cette fenêtre :
                    <br />• Sélectionnez simplement le modèle le plus récent dans le menu déroulant (par exemple <em>Claude 3.7 Sonnet</em> ou <em>Gemini 3.8 Flash</em>).
                    <br />• Ou choisissez <strong>« Modèle personnalisé »</strong> et écrivez directement le nom du futur modèle qui vient tout juste de sortir ! L'application l'appellera immédiatement.
                  </p>
                </div>

                <div className="bg-[#121217] border border-white/[0.08] p-4 rounded-xl space-y-1.5">
                  <div className="font-condensed font-bold text-white uppercase text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">3</span>
                    <span>Vérifier vos tiers et vos crédits chez chaque constructeur</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed pl-7">
                    Certains modèles très avancés (comme les modèles de raisonnement profonds) exigent parfois que votre compte soit approvisionné d'un crédit minimum (ex: 5$ sur OpenAI ou Anthropic). Le bouton <strong>« Tester la clé & le modèle »</strong> vous indique instantanément si votre clé possède les droits sur le modèle choisi.
                  </p>
                </div>

                <div className="bg-[#121217] border border-white/[0.08] p-4 rounded-xl space-y-1.5">
                  <div className="font-condensed font-bold text-white uppercase text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">4</span>
                    <span>Recommandations de mise à niveau suggérées aux utilisateurs</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed pl-7">
                    Pour suggérer à vos collègues ou amis de mettre à jour leurs modèles :
                    <br />• <strong>Google AI Studio</strong> : La clé Gemini gratuite offre un quota généreux pour les débats.
                    <br />• <strong>OpenAI</strong> : Passer de <em>gpt-4o-mini</em> à <em>gpt-4o</em> apporte une verve dialectique supérieure.
                    <br />• <strong>Anthropic</strong> : <em>Claude 3.7 Sonnet</em> apporte une réflexion philosophique inégalée.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-black/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Toutes les IA débattent en totale souveraineté intellectuelle.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#00f5c4] hover:bg-[#00e0b0] text-black font-condensed font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer transition-all shadow-md shadow-[#00f5c4]/20"
          >
            Fermer & Retourner à l'Arène
          </button>
        </div>

      </div>
    </div>
  );
}

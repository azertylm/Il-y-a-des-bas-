import * as React from "react";
import { Settings, Sliders, Sparkles, Scale, Wand2 } from "lucide-react";
import { AGENTS, EMPTY_API_KEYS } from "../constants.ts";
import { persistApiKeys } from "../lib/storage.ts";
import type { DebateMode, OpinionMetrics, Topic } from "../types.ts";

const API_KEY_FIELDS = [
  { id: "chatgpt", label: "OpenAI Clé API (ChatGPT)", placeholder: "sk-proj-...", color: "#10a37f" },
  { id: "claude", label: "Anthropic Clé API (Claude)", placeholder: "sk-ant-...", color: "#d97706" },
  { id: "gemini", label: "Gemini Clé API", placeholder: "AIzaSy...", color: "#3b82f6" },
  { id: "deepseek", label: "DeepSeek Clé API", placeholder: "sk-...", color: "#0a59f7" },
  { id: "mistral", label: "Mistral Clé API", placeholder: "...", color: "#ff5400" },
  { id: "grok", label: "Grok xAI Clé API", placeholder: "xai-...", color: "#fbaf00" },
];

export interface ConfigPanelProps {
  activeMode: DebateMode;
  onSwitchMode: (mode: DebateMode) => void;

  customCategory: string;
  setCustomCategory: (v: string) => void;
  customTitle: string;
  setCustomTitle: (v: string) => void;
  customDesc: string;
  setCustomDesc: (v: string) => void;
  onSubmitCustomTopic: (e: React.FormEvent) => void;

  keyword: string;
  setKeyword: (v: string) => void;
  onKeywordSearch: () => void;
  isGeneratingTopics: boolean;
  suggestedTopics: Topic[];
  onSelectTopic: (topic: Topic) => void;

  debateTone: string;
  setDebateTone: (v: string) => void;
  speechLength: string;
  setSpeechLength: (v: string) => void;
  activeAgentsFlags: { [key: string]: boolean };
  setActiveAgentsFlags: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;

  showApiKeys: boolean;
  setShowApiKeys: (v: boolean) => void;
  apiKeys: { [key: string]: string };
  setApiKeys: (keys: { [key: string]: string }) => void;
  onSaveApiKey: (agentId: string, value: string) => void;
  visibleApiKeyIds: { [key: string]: boolean };
  setVisibleApiKeyIds: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;

  hasMessages: boolean;
  opinionMetrics: OpinionMetrics;
}

/** Colonne de gauche : choix du sujet, réglages de séance, clés API, jauges. */
export function ConfigPanel({
  activeMode,
  onSwitchMode: handleSwitchMode,
  customCategory, setCustomCategory,
  customTitle, setCustomTitle,
  customDesc, setCustomDesc,
  onSubmitCustomTopic: triggerCustomTopicFormSubmit,
  keyword, setKeyword,
  onKeywordSearch: handleKeywordSearch,
  isGeneratingTopics,
  suggestedTopics,
  onSelectTopic: handleSelectTopic,
  debateTone, setDebateTone,
  speechLength, setSpeechLength,
  activeAgentsFlags, setActiveAgentsFlags,
  showApiKeys, setShowApiKeys,
  apiKeys, setApiKeys,
  onSaveApiKey: handleSaveApiKey,
  visibleApiKeyIds, setVisibleApiKeyIds,
  hasMessages,
  opinionMetrics,
}: ConfigPanelProps) {
  return (
  <section className="w-full lg:w-[350px] flex flex-col shrink-0 gap-4 overflow-y-auto lg:h-[calc(100vh-100px)] p-1">
    
    {/* SÉLECTEUR DE MODE DU SUJET */}
    <div className="border border-white/[0.05] rounded-xl bg-[#090909]/60 p-4">
      <h3 className="font-condensed font-bold text-xs tracking-wider uppercase text-gray-400 flex items-center gap-1.5 mb-3">
        <Sliders className="w-3.5 h-3.5 text-[#00f5c4]" />
        CONFIGURATION DU THÈME
      </h3>
      
      <div className="flex flex-col gap-2">
        <button 
          onClick={() => handleSwitchMode("temporal")} 
          className={`text-left rounded-lg p-2.5 flex flex-col gap-1 cursor-pointer transition-all ${
            activeMode === "temporal" 
              ? "bg-[#00f5c4]/10 border border-[#00f5c4]/30" 
              : "bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03]"
          }`}
        >
          <span className="font-condensed font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1">
            ⌛ Cycle Chrono UTC (24H)
          </span>
          <span className="text-[10px] text-gray-500">6 sessions pré-enregistrées changeant toutes les 4 heures.</span>
        </button>

        <button 
          onClick={() => handleSwitchMode("custom")} 
          className={`text-left rounded-lg p-2.5 flex flex-col gap-1 cursor-pointer transition-all ${
            activeMode === "custom" 
              ? "bg-[#00f5c4]/10 border border-[#00f5c4]/30" 
              : "bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03]"
          }`}
        >
          <span className="font-condensed font-bold text-xs text-white uppercase tracking-wider">
            🛠️ Thème Sur-Mesure
          </span>
          <span className="text-[10px] text-gray-500">Écrivez vous-même les problématiques de l'arène.</span>
        </button>

        <button 
          onClick={() => handleSwitchMode("gemini-theme")} 
          className={`text-left rounded-lg p-2.5 flex flex-col gap-1 cursor-pointer transition-all ${
            activeMode === "gemini-theme" 
              ? "bg-[#00f5c4]/10 border border-[#00f5c4]/30" 
              : "bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03]"
          }`}
        >
          <span className="font-condensed font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1">
            <Wand2 className="w-3 h-3 text-purple-400" />
            Générateur Éthique Gemini
          </span>
          <span className="text-[10px] text-gray-500">Élaborez des controverses d'un clic grâce à l'IA.</span>
        </button>
      </div>
    </div>

    {/* DETAILS FORMULAIRE SELON LE MODE */}
    {activeMode === "custom" && (
      <div className="border border-white/[0.05] rounded-xl bg-[#090909]/60 p-4 animate-fadeSlideUp">
        <h4 className="font-condensed font-bold text-xs text-white mb-3 uppercase tracking-widest border-b border-white/[0.05] pb-1">
          Rédiger le Sujet de l'Arène
        </h4>
        <form onSubmit={triggerCustomTopicFormSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-1">Catégorie</label>
            <input 
              type="text" 
              placeholder="ex: INTELLIGENCE & DROIT" 
              value={customCategory} 
              onChange={e => setCustomCategory(e.target.value)}
              className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00f5c4]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-1">Sujet principal (Question)</label>
            <textarea 
              rows={2}
              placeholder="Faut-il interdire l'utilisation d'androïdes de compagnie ?" 
              value={customTitle} 
              onChange={e => setCustomTitle(e.target.value)}
              className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00f5c4] resize-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-1">Contexte analytique & Enjeux</label>
            <textarea 
              rows={3}
              placeholder="Développez la fracture éthique et les potentiels abus." 
              value={customDesc} 
              onChange={e => setCustomDesc(e.target.value)}
              className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00f5c4] resize-none"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-white text-black font-condensed font-black text-xs py-2 rounded shadow hover:bg-gray-100 cursor-pointer border-none uppercase tracking-wider"
          >
            Mettre à jour le Sujet actif
          </button>
        </form>
      </div>
    )}

    {activeMode === "gemini-theme" && (
      <div className="border border-white/[0.05] rounded-xl bg-[#090909]/60 p-4 animate-fadeSlideUp">
        <h4 className="font-condensed font-bold text-xs text-white mb-2 uppercase tracking-widest border-b border-white/[0.05] pb-1">
          Atelier de génération de Thèses
        </h4>
        <div className="flex gap-1.5 mb-3">
          <input 
            type="text" 
            placeholder="ex: Climat, Espace, Génétique..." 
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="flex-1 bg-black border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5c4]"
            onKeyDown={e => e.key === "Enter" && handleKeywordSearch()}
          />
          <button 
            onClick={handleKeywordSearch}
            disabled={isGeneratingTopics}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold border-none rounded px-3 cursor-pointer text-xs flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            {isGeneratingTopics ? "..." : <Sparkles className="w-3.5 h-3.5" />}
          </button>
        </div>

        {suggestedTopics.length > 0 && (
          <div className="flex flex-col gap-2 mt-2 max-h-[220px] overflow-y-auto pr-1">
            {suggestedTopics.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => handleSelectTopic({ ...item, id: `suggested-${idx}` })}
                className="bg-white/[0.02] hover:bg-[#00f5c4]/15 border border-white/[0.05] hover:border-[#00f5c4]/30 rounded p-2 cursor-pointer transition-all"
              >
                <div className="text-[9px] font-semibold text-[#00f5c4] uppercase font-condensed tracking-wider">{item.category}</div>
                <div className="text-xs font-bold text-white mt-0.5 font-condensed leading-snug">{item.title}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {/* CONTRÔLE DES PARAMÈTRES DU STUDIO */}
    <div className="border border-white/[0.05] rounded-xl bg-[#0a0a0a]/80 p-4 flex flex-col gap-4">
      <h3 className="font-condensed font-bold text-xs tracking-wider uppercase text-gray-400 border-b border-white/[0.05] pb-1.5">
        RÉGLAGES DES RETENUES & TONALITÉ
      </h3>

      {/* Ton du débat */}
      <div>
        <label className="block text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-1.5">Dynamisme & Tonalité</label>
        <div className="grid grid-cols-3 gap-1 bg-black border border-white/10 rounded p-0.5">
          {[
            { id: "incisif", l: "Choc d'idées" },
            { id: "constructif", l: "Socratique" },
            { id: "didactique", l: "Pédagogique" }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setDebateTone(t.id)}
              className={`text-[10px] font-bold py-1 border-none cursor-pointer rounded transition-all leading-none ${
                debateTone === t.id 
                  ? "bg-white/10 text-white font-black" 
                  : "bg-transparent text-gray-600 hover:text-white"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* Longueur des plaidoiries */}
      <div>
        <label className="block text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-1.5">Longueur des Tirades</label>
        <div className="grid grid-cols-3 gap-1 bg-black border border-white/10 rounded p-0.5">
          {[
            { id: "court", l: "Twitter" },
            { id: "standard", l: "Équilibrée" },
            { id: "académique", l: "Thèse" }
          ].map(l => (
            <button 
              key={l.id} 
              onClick={() => setSpeechLength(l.id)}
              className={`text-[10px] font-bold py-1 border-none cursor-pointer rounded transition-all leading-none ${
                speechLength === l.id 
                  ? "bg-white/10 text-white font-black" 
                  : "bg-transparent text-gray-600 hover:text-white"
              }`}
            >
              {l.l}
            </button>
          ))}
        </div>
      </div>

      {/* Sélectionneurs de décodeurs actifs */}
      <div>
        <label className="block text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-1.5">Orateurs de table actifs</label>
        <div className="flex flex-col gap-2">
          {AGENTS.map(agent => (
            <label key={agent.id} className="flex items-center gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={activeAgentsFlags[agent.id]} 
                onChange={() => setActiveAgentsFlags(prev => ({ ...prev, [agent.id]: !prev[agent.id] }))}
                className="rounded text-[#00f5c4] focus:ring-0 accent-[#00f5c4] cursor-pointer"
              />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent.color }} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-gray-300 font-condensed tracking-wide leading-none">{agent.name}</div>
                <div className="text-[9px] text-gray-500 leading-none mt-0.5">{agent.role}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>

    {/* 🔑 GESTION DES CLÉS API MODÈLES */}
    <div className="border border-white/[0.05] rounded-xl bg-[#0a0a0a]/80 p-4 flex flex-col gap-3">
      <button 
        onClick={() => setShowApiKeys(!showApiKeys)}
        className="font-condensed font-bold text-xs tracking-wider uppercase text-gray-400 border-b border-white/[0.05] pb-1.5 flex items-center justify-between w-full hover:text-white cursor-pointer transition-colors bg-transparent border-none text-left"
      >
        <span className="flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-[#00f5c4]" />
          Configuration des Clés API
        </span>
        <span>{showApiKeys ? "▲ Masquer" : "▼ Configurer"}</span>
      </button>

      {showApiKeys && (
        <div className="flex flex-col gap-3.5 mt-2 animate-fadeSlideUp">
          <p className="text-[10px] text-gray-500 leading-normal">
            Entrez vos propres clés pour solliciter les véritables moteurs de chaque constructeur d'IA. Elles sont conservées uniquement pour la durée de l'onglet (<code className="font-mono">sessionStorage</code>), effacées à sa fermeture, et ne transitent que vers ce serveur pour relayer vos requêtes.
          </p>
          
          {API_KEY_FIELDS.map(keyDef => (
            <div key={keyDef.id} className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold tracking-wider uppercase text-gray-400 flex items-center gap-1.5 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: keyDef.color }} />
                  {keyDef.label}
                </label>
                {apiKeys[keyDef.id] ? (
                  <span className="text-[9px] text-[#00f5c4] font-semibold flex items-center gap-0.5">
                    ✓ active
                  </span>
                ) : (
                  <span className="text-[9px] text-gray-600 font-normal">
                    (Secours Gemini)
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 relative">
                <input 
                  type={visibleApiKeyIds[keyDef.id] ? "text" : "password"}
                  placeholder={keyDef.placeholder}
                  value={apiKeys[keyDef.id] || ""}
                  onChange={e => handleSaveApiKey(keyDef.id, e.target.value)}
                  className="w-full bg-black border border-white/10 rounded px-2.5 py-1 text-xs text-white placeholder-gray-800 font-mono focus:outline-none focus:border-[#00f5c4]"
                />
                <button
                  type="button"
                  onClick={() => setVisibleApiKeyIds(prev => ({ ...prev, [keyDef.id]: !prev[keyDef.id] }))}
                  className="absolute right-2 top-1.5 text-gray-600 hover:text-white bg-transparent border-none cursor-pointer p-0 select-none text-[10px] uppercase font-bold"
                >
                  {visibleApiKeyIds[keyDef.id] ? "Masquer" : "Voir"}
                </button>
              </div>
            </div>
          ))}

          <div className="pt-1.5 flex justify-end">
            <button
              onClick={() => {
                if (window.confirm("Voulez-vous vraiment supprimer toutes les clés de votre navigateur ?")) {
                  const resetKeys = { ...EMPTY_API_KEYS };
                  setApiKeys(resetKeys);
                  persistApiKeys(resetKeys);
                }
              }}
              className="text-[9px] font-bold text-red-500/80 hover:text-red-400 uppercase bg-transparent border-none cursor-pointer tracking-wider"
            >
              Effacer toutes les clés de cette session
            </button>
          </div>
        </div>
      )}
    </div>

    {/* METRIQUES LIVE DE LA SÉANCE */}
    {hasMessages && (
      <div className="border border-white/[0.05] rounded-xl bg-[#090909]/60 p-4">
        <h3 className="font-condensed font-bold text-xs tracking-wider uppercase text-gray-400 mb-3 flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-[#00f5c4]" />
          ÉQUILIBRE ET VIBRANCE DU DÉBAT
        </h3>
        <p className="text-[10px] text-gray-600 leading-snug -mt-2 mb-3">
          Répartition relative de la parole entre les quatre axes : les quatre jauges totalisent 100 %.
        </p>
        
        <div className="flex flex-col gap-2">
          {/* Gauge 1: Rigueur */}
          <div>
            <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-0.5">
              <span>RIGUEUR SCIENTIFIQUE (ChatGPT & Gemini)</span>
              <span className="text-[#10a37f]">{opinionMetrics.rigueur}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#10a37f] rounded-full transition-all duration-500" style={{ width: `${opinionMetrics.rigueur}%` }} />
            </div>
          </div>
          {/* Gauge 2: Éthique */}
          <div>
            <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-0.5">
              <span>HAUTEUR ÉTHIQUE & SENSE (Claude)</span>
              <span className="text-[#d97706]">{opinionMetrics.ethique}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#d97706] rounded-full transition-all duration-500" style={{ width: `${opinionMetrics.ethique}%` }} />
            </div>
          </div>
          {/* Gauge 3: Action */}
          <div>
            <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-0.5">
              <span>PRAGMATISME LOGIQUE (DeepSeek)</span>
              <span className="text-[#0a59f7]">{opinionMetrics.pragmatisme}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#0a59f7] rounded-full transition-all duration-500" style={{ width: `${opinionMetrics.pragmatisme}%` }} />
            </div>
          </div>
          {/* Gauge 4: Social */}
          <div>
            <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-0.5">
              <span>AUDACE & ALINÉATION (Mistral & Grok)</span>
              <span className="text-[#ff5400]">{opinionMetrics.culture}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#ff5400] rounded-full transition-all duration-500" style={{ width: `${opinionMetrics.culture}%` }} />
            </div>
          </div>
        </div>
      </div>
    )}

  </section>
  );
}

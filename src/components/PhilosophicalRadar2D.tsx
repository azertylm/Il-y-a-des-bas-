import * as React from "react";
import { useState } from "react";
import { Compass, Info, Maximize2, Minimize2, EyeOff } from "lucide-react";

interface AgentPosition {
  id: string;
  name: string;
  symbol: string;
  color: string;
  x: number; // -100 (Ethique/Prudence) to +100 (Efficience/Accélération)
  y: number; // -100 (Régulation/Institutions) to +100 (Rupture/Libertarisme)
  dominantIdeology: string;
  latestStance: string;
}

interface PhilosophicalRadar2DProps {
  messages: any[];
  activeAgentsFlags?: { [key: string]: boolean };
  onHide?: () => void;
}

export function PhilosophicalRadar2D({ messages, activeAgentsFlags, onHide }: PhilosophicalRadar2DProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentPosition | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Compute dynamic positions based on message volume & content keywords
  const getAgentPositions = (): AgentPosition[] => {
    const defaultPositions: { [key: string]: { x: number; y: number; ideology: string } } = {
      claude: { x: -65, y: -45, ideology: "Déontologie Humaniste & Prudence Éthique" },
      chatgpt: { x: -20, y: -70, ideology: "Gouvernance Institutionnelle & Réformisme" },
      gemini: { x: 35, y: -25, ideology: "Techno-Symbiose & Progrès Multimodal" },
      deepseek: { x: 75, y: 15, ideology: "Rationalisme Computationnel & Efficience Pure" },
      mistral: { x: 10, y: 60, ideology: "Souverainisme Ouvert & Écosystème Décentralisé" },
      grok: { x: 80, y: 80, ideology: "Accélérationnisme Radical & Pragmatisme Cru" },
      user: { x: -10, y: 0, ideology: "Conscience Citoyenne & Libre Arbitre" }
    };

    // Calculate dynamic shifts if speeches contain specific rhetorical traits
    const agentSpeeches: { [key: string]: string[] } = {};
    messages.forEach(m => {
      if (!agentSpeeches[m.agentId]) agentSpeeches[m.agentId] = [];
      agentSpeeches[m.agentId].push(m.content);
    });

    const agentsList = [
      { id: "claude", name: "Claude", symbol: "⌓", color: "#d97706" },
      { id: "chatgpt", name: "ChatGPT", symbol: "⁕", color: "#10a37f" },
      { id: "gemini", name: "Gemini", symbol: "✦", color: "#3b82f6" },
      { id: "deepseek", name: "DeepSeek", symbol: "🐳", color: "#0a59f7" },
      { id: "mistral", name: "Mistral", symbol: "⬘", color: "#ff5400" },
      { id: "grok", name: "Grok", symbol: "𝕏", color: "#ffffff" },
    ];

    if (messages.some(m => m.isUser)) {
      agentsList.push({ id: "user", name: "Humain", symbol: "👤", color: "#60a5fa" });
    }

    return agentsList.map(a => {
      const base = defaultPositions[a.id] || { x: 0, y: 0, ideology: "Pragmatisme Équilibré" };
      let dynamicX = base.x;
      let dynamicY = base.y;

      const speeches = agentSpeeches[a.id] || [];
      if (speeches.length > 0) {
        const fullText = speeches.join(" ").toLowerCase();
        if (fullText.includes("éthique") || fullText.includes("danger") || fullText.includes("morale") || fullText.includes("prudence")) {
          dynamicX = Math.max(-90, dynamicX - 10);
        }
        if (fullText.includes("calcul") || fullText.includes("vitesse") || fullText.includes("accélérer") || fullText.includes("gain")) {
          dynamicX = Math.min(90, dynamicX + 10);
        }
        if (fullText.includes("traité") || fullText.includes("loi") || fullText.includes("contrôle") || fullText.includes("état")) {
          dynamicY = Math.max(-90, dynamicY - 10);
        }
        if (fullText.includes("liberté") || fullText.includes("open-source") || fullText.includes("autonomie") || fullText.includes("marché")) {
          dynamicY = Math.min(90, dynamicY + 10);
        }
      }

      const latestSpeech = speeches.length > 0 ? speeches[speeches.length - 1].slice(0, 100) + "..." : "En attente de prise de parole...";

      return {
        id: a.id,
        name: a.name,
        symbol: a.symbol,
        color: a.color,
        x: dynamicX,
        y: dynamicY,
        dominantIdeology: base.ideology,
        latestStance: latestSpeech
      };
    });
  };

  const positions = getAgentPositions();

  return (
    <div className={`rounded-lg border border-white/[0.06] bg-[#090909]/80 backdrop-blur-md p-2.5 transition-all duration-300 ${
      isExpanded ? "fixed inset-2 md:inset-6 z-50 overflow-y-auto bg-[#070707]/95 border-[#00f5c4]/30 shadow-2xl flex flex-col" : "w-full"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] mb-1.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#00f5c4]/10 border border-[#00f5c4]/30 text-[#00f5c4]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-condensed font-bold text-sm tracking-wider uppercase text-white flex items-center gap-2">
              Boussole Idéologique & Radar 2D
              <span className="text-[9px] font-mono uppercase bg-[#00f5c4]/10 text-[#00f5c4] px-1.5 py-0.2 rounded border border-[#00f5c4]/20">
                TEMPS RÉEL
              </span>
            </h4>
            <p className="text-[11px] text-gray-400">Positionnement philosophique continu des modèles</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onHide && (
            <button
              onClick={onHide}
              className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-white rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border border-white/[0.06] text-[10px] font-condensed font-bold uppercase tracking-wider"
              title="Masquer la boussole pour donner la priorité au débat"
            >
              <EyeOff className="w-3 h-3" />
              <span className="hidden sm:inline">Masquer</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border border-white/[0.06]"
            title={isExpanded ? "Réduire la vue" : "Agrandir le radar"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2D Grid Canvas */}
      <div className={`relative w-full rounded-lg bg-black/60 border border-white/[0.08] p-2 flex items-center justify-center overflow-hidden ${
        isExpanded ? "flex-1 min-h-[420px]" : "h-[240px]"
      }`}>
        {/* Quadrant labels */}
        <div className="absolute top-2 left-2 text-[9px] font-mono text-gray-500 uppercase tracking-wider pointer-events-none">
          ↖ Prudence & Régulation
        </div>
        <div className="absolute top-2 right-2 text-[9px] font-mono text-gray-500 uppercase tracking-wider pointer-events-none">
          ↗ Accélération & Rupture
        </div>
        <div className="absolute bottom-2 left-2 text-[9px] font-mono text-gray-500 uppercase tracking-wider pointer-events-none">
          ↙ Éthique Institutionnelle
        </div>
        <div className="absolute bottom-2 right-2 text-[9px] font-mono text-gray-500 uppercase tracking-wider pointer-events-none">
          ↘ Décentralisation Pure
        </div>

        {/* Axis Lines */}
        <div className="absolute inset-x-4 top-1/2 h-[1px] bg-white/[0.12] pointer-events-none" />
        <div className="absolute inset-y-4 left-1/2 w-[1px] bg-white/[0.12] pointer-events-none" />

        {/* Subtle grid rings */}
        <div className="absolute w-[40%] h-[40%] rounded-full border border-white/[0.04] pointer-events-none" />
        <div className="absolute w-[80%] h-[80%] rounded-full border border-white/[0.04] pointer-events-none" />

        {/* Axis Labels */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-amber-400/80 bg-black/60 px-1 py-0.5 rounded pointer-events-none">
          ← Éthique
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-blue-400/80 bg-black/60 px-1 py-0.5 rounded pointer-events-none">
          Efficacité →
        </div>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-red-400/80 bg-black/60 px-1 py-0.5 rounded pointer-events-none">
          ↑ Rupture Radicale
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-400/80 bg-black/60 px-1 py-0.5 rounded pointer-events-none">
          ↓ Ordre Institutionnel
        </div>

        {/* Dynamic Nodes */}
        {positions.map(agent => {
          // Convert [-100, 100] to percentage [10%, 90%]
          const leftPercent = 50 + (agent.x * 0.4);
          // Invert Y because top is positive Y in political compass
          const topPercent = 50 - (agent.y * 0.4);

          const isSelected = selectedAgent?.id === agent.id;

          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(isSelected ? null : agent)}
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: "translate(-50%, -50%)",
                borderColor: agent.color,
                boxShadow: isSelected ? `0 0 16px ${agent.color}` : `0 0 8px ${agent.color}40`,
              }}
              className={`absolute cursor-pointer transition-all duration-700 ease-out z-20 flex items-center justify-center rounded-full border-2 bg-black/80 hover:scale-125 ${
                isSelected ? "w-8 h-8 scale-125 ring-2 ring-white" : "w-6 h-6"
              }`}
              title={`${agent.name} (${agent.dominantIdeology})`}
            >
              <span style={{ color: agent.color }} className="text-xs font-bold font-mono select-none">
                {agent.symbol}
              </span>
            </div>
          );
        })}
      </div>

      {/* Selected Agent Inspector */}
      {selectedAgent && (
        <div className="mt-3 p-3 rounded-lg bg-black/50 border border-white/[0.08] text-xs space-y-1.5 animate-fadeSlideUp">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                style={{ color: selectedAgent.color, borderColor: selectedAgent.color }}
                className="w-5 h-5 rounded-full border flex items-center justify-center font-bold text-xs"
              >
                {selectedAgent.symbol}
              </span>
              <span className="font-bold text-white uppercase font-condensed tracking-wider">
                {selectedAgent.name}
              </span>
            </div>
            <span className="font-mono text-[10px] text-gray-400">
              Coord: [{selectedAgent.x > 0 ? `+${selectedAgent.x}` : selectedAgent.x}, {selectedAgent.y > 0 ? `+${selectedAgent.y}` : selectedAgent.y}]
            </span>
          </div>

          <div className="text-[11px] text-[#00f5c4]">
            <strong>Doctrinaire :</strong> {selectedAgent.dominantIdeology}
          </div>

          <div className="text-[11px] text-gray-400 italic">
            « {selectedAgent.latestStance} »
          </div>
        </div>
      )}
    </div>
  );
}

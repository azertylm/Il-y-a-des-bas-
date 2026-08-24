import { Sparkles } from "lucide-react";
import { AGENTS } from "../constants.ts";

// ─── COMPONENT: THINKING BUBBLE ──────────────────────────────────────────────
export function ThinkingBubble({ agentId }: { agentId: string }) {
  const agent = AGENTS.find(a => a.id === agentId);
  if (!agent) return null;

  return (
    <div className="flex gap-4 items-start py-2 animate-fadeSlideUp">
      <div 
        style={{ borderColor: agent.color, color: agent.color, background: agent.dim }}
        className="w-9 h-9 rounded-full border flex items-center justify-center text-sm font-semibold shrink-0 animate-pulse"
      >
        {agent.symbol}
      </div>
      <div>
        <div className="font-condensed font-bold text-xs tracking-widest text-[#aaa] uppercase mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#00f5c4] animate-spin" style={{ color: agent.color }} />
          {agent.name} STRUCTURE SES THÈSES SUR L'ARÈNE...
        </div>
        <div className="flex gap-1 py-1">
          {[0,1,2,3].map(i => (
            <div 
              key={i} 
              className="w-1 h-1 rounded-full animate-bounce" 
              style={{ backgroundColor: agent.color, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

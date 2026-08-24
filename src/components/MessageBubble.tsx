import * as React from "react";
import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import type { Message } from "../types.ts";
import { RichText } from "./RichText.tsx";
import { DegradedBadge } from "./DegradedBadge.tsx";

interface MessageBubbleProps {
  msg: Message;
  /** Reçoit l'identifiant du message : la référence reste ainsi stable d'un rendu à l'autre. */
  onClap?: (msgId: string) => void;
}

// ─── COMPONENT: MESSAGE BUBBLE ───────────────────────────────────────────────
function MessageBubbleBase({ msg, onClap }: MessageBubbleProps) {
  const [expanded, setExpanded] = useState(true);
  const isLong = msg.content.length > 550;
  const textToShow = !expanded ? msg.content.slice(0, 400) + "…" : msg.content;

  return (
    <div className={`flex gap-3 md:gap-4 animate-fadeSlideUp max-w-4xl ${msg.isUser ? 'ml-auto' : ''}`}>
      <div 
        style={{ 
          borderColor: msg.agentBorder, 
          color: msg.agentColor, 
          background: msg.agentDim,
          boxShadow: `0 0 12px ${msg.agentColor}12`
        }}
        className="w-9 h-9 md:w-10 md:h-10 rounded-full border flex items-center justify-center text-sm font-semibold shrink-0 select-none"
      >
        {msg.agentSymbol}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-condensed font-bold text-sm tracking-wider uppercase" style={{ color: msg.agentColor }}>
            {msg.agentName}
          </span>
          <span className="text-[9px] text-gray-500 font-condensed tracking-wide uppercase">
            {msg.agentRole}
          </span>
          {msg.degraded && <DegradedBadge reason={msg.degradedReason} className="ml-auto" />}
          <span className={`text-[10px] text-gray-500 ${msg.degraded ? "" : "ml-auto"}`}>
            {msg.time}
          </span>
        </div>
        
        <div 
          className="bg-[#030303] border border-white/[0.04] rounded-r-lg rounded-bl-sm px-4 py-3 text-xs md:text-sm leading-relaxed relative flex flex-col justify-between" 
          style={{ borderLeft: `3px solid ${msg.agentColor}` }}
        >
          <RichText text={textToShow} className="text-gray-200 font-sans leading-relaxed select-text" />

          {msg.degraded && msg.degradedReason && (
            <p className="text-[10px] text-amber-300/70 leading-snug mt-2 italic">
              {msg.degradedReason}
            </p>
          )}
          
          <div className="flex items-center justify-between gap-4 mt-2 border-t border-white/[0.03] pt-2">
            {isLong ? (
              <button 
                onClick={() => setExpanded(!expanded)} 
                style={{ color: msg.agentColor }}
                className="bg-transparent border-none text-[10px] font-bold font-condensed tracking-wider uppercase cursor-pointer hover:opacity-80 flex items-center gap-1 transition-opacity pr-2"
              >
                {expanded ? "▲ Masquer la thèse" : "▼ Déployer la thèse complète"}
              </button>
            ) : <span />}

            <button 
              onClick={() => onClap?.(msg.id)}
              className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-yellow-400 border border-white/5 rounded-full px-2 py-0.5 text-[9px] md:text-[10px] font-condensed uppercase font-bold tracking-wider cursor-pointer flex items-center gap-1.5 transition-all select-none"
            >
              <ThumbsUp className="w-3 h-3 fill-current" />
              <span>Soutenir {msg.claps ? `(${msg.claps})` : ""}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Le fil de discussion se re-rend à chaque intervention, à chaque tic de la
 * minuterie et à chaque soutien. Sans mémoïsation, toutes les bulles déjà
 * affichées étaient reconstruites à chaque fois.
 *
 * La comparaison superficielle par défaut suffit, à deux conditions que le
 * reste du code respecte : les objets `Message` ne sont jamais mutés en place,
 * et `onClap` est une référence stable (d'où la signature par identifiant
 * plutôt qu'une fermeture créée dans la boucle de rendu).
 */
export const MessageBubble = React.memo(MessageBubbleBase);


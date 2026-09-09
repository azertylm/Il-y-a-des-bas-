import * as React from "react";
import { useState } from "react";
import { Users, ThumbsUp, Sparkles, TrendingUp, EyeOff } from "lucide-react";

interface LiveAudienceVoteProps {
  activeAgents: { id: string; name: string; color: string; symbol: string }[];
  onCheerAll: () => void;
  onHide?: () => void;
}

export function LiveAudienceVote({ activeAgents, onCheerAll, onHide }: LiveAudienceVoteProps) {
  const [votes, setVotes] = useState<{ [key: string]: number }>({
    chatgpt: 18,
    claude: 24,
    gemini: 15,
    deepseek: 22,
    mistral: 14,
    grok: 19,
    user: 12,
  });

  const [hasVotedFor, setHasVotedFor] = useState<string | null>(null);
  const [cheerEffect, setCheerEffect] = useState(false);

  const totalVotes = (Object.values(votes) as number[]).reduce((a: number, b: number) => a + b, 0);

  const handleVote = (agentId: string) => {
    setVotes(prev => ({
      ...prev,
      [agentId]: (prev[agentId] || 0) + 1,
    }));
    setHasVotedFor(agentId);
  };

  const handleAudienceClap = () => {
    setCheerEffect(true);
    onCheerAll();
    setTimeout(() => setCheerEffect(false), 1200);
  };

  // Find leader
  let leaderId = "claude";
  let maxV = -1;
  (Object.entries(votes) as [string, number][]).forEach(([id, v]) => {
    if (v > maxV) {
      maxV = v;
      leaderId = id;
    }
  });

  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#090909]/80 p-2.5 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-condensed font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              Vote du Public en Direct
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded">
                LIVE
              </span>
            </h4>
            <div className="text-[10px] text-gray-400 font-mono">{totalVotes} suffrages exprimés</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onHide && (
            <button
              onClick={onHide}
              className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-white rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border border-white/[0.06] text-[10px] font-condensed font-bold uppercase tracking-wider"
              title="Masquer le vote du public pour donner la priorité au débat"
            >
              <EyeOff className="w-3 h-3" />
              <span className="hidden sm:inline">Masquer</span>
            </button>
          )}
          <button
            onClick={handleAudienceClap}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-condensed font-bold uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1 ${
              cheerEffect
                ? "bg-amber-400 text-black border-amber-300 scale-105"
                : "bg-white/[0.04] hover:bg-white/[0.08] text-amber-300 border-amber-500/30"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            👏 Clameur du Public
          </button>
        </div>
      </div>

      {/* Vote Bars */}
      <div className="space-y-1.5">
        {activeAgents.map(agent => {
          const count = votes[agent.id] || 0;
          const pct = Math.round((count / (totalVotes || 1)) * 100);
          const isLeader = agent.id === leaderId;
          const isVoted = hasVotedFor === agent.id;

          return (
            <div key={agent.id} className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: agent.color }} className="font-bold text-xs">
                    {agent.symbol}
                  </span>
                  <span className="font-condensed font-bold text-white uppercase">
                    {agent.name}
                  </span>
                  {isLeader && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                      Favori ★
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-400 text-[10px]">{pct}% ({count})</span>
                  <button
                    onClick={() => handleVote(agent.id)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-condensed font-bold uppercase cursor-pointer transition-all border ${
                      isVoted
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/[0.02] hover:bg-white/[0.06] text-gray-400 border-white/[0.04]"
                    }`}
                  >
                    +1 Vote
                  </button>
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  style={{
                    width: `${pct}%`,
                    backgroundColor: agent.color,
                  }}
                  className="h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

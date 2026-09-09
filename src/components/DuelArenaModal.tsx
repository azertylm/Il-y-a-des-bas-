import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Swords, X, Play, Pause, RotateCcw, Volume2, Sparkles, Award, Zap, ThumbsUp, Send } from "lucide-react";

interface DuelMessage {
  id: string;
  fighterId: string;
  fighterName: string;
  fighterColor: string;
  fighterSymbol: string;
  round: number;
  content: string;
  time: string;
  claps?: number;
}

interface DuelArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  topicDescription: string;
  getHeaders: () => Record<string, string>;
}

const FIGHTERS = [
  { id: "chatgpt", name: "ChatGPT", role: "L'Omniscient Critique", color: "#10a37f", symbol: "⁕" },
  { id: "claude", name: "Claude", role: "Le Sage Nuancé", color: "#d97706", symbol: "⌓" },
  { id: "gemini", name: "Gemini", role: "L'Esprit Multimodal", color: "#3b82f6", symbol: "✦" },
  { id: "deepseek", name: "DeepSeek", role: "Le Logicien d'Élite", color: "#0a59f7", symbol: "🐳" },
  { id: "mistral", name: "Mistral", role: "L'Innovateur Souverain", color: "#ff5400", symbol: "⬘" },
  { id: "grok", name: "Grok", role: "Le Provocateur Lucide", color: "#ffffff", symbol: "𝕏" },
  { id: "user", name: "Vous (Humain)", role: "Le Citoyen Rebelle", color: "#60a5fa", symbol: "👤" },
];

export function DuelArenaModal({
  isOpen,
  onClose,
  topicTitle,
  topicDescription,
  getHeaders,
}: DuelArenaModalProps) {
  const [fighter1, setFighter1] = useState("claude");
  const [fighter2, setFighter2] = useState("grok");
  const [duelRound, setDuelRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(3);
  const [duelMessages, setDuelMessages] = useState<DuelMessage[]>([]);
  const [isFighting, setIsFighting] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [momentum, setMomentum] = useState(50); // 50 = middle, 0 = 100% fighter 1, 100 = 100% fighter 2
  const [humanSpeech, setHumanSpeech] = useState("");
  const [duelVerdict, setDuelVerdict] = useState<string | null>(null);

  const duelBottomRef = useRef<HTMLDivElement>(null);
  const isFightingRef = useRef(false);

  useEffect(() => {
    isFightingRef.current = isFighting;
  }, [isFighting]);

  useEffect(() => {
    duelBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [duelMessages, currentTurn, duelVerdict]);

  if (!isOpen) return null;

  const f1 = FIGHTERS.find(f => f.id === fighter1)!;
  const f2 = FIGHTERS.find(f => f.id === fighter2)!;

  const handleStartDuel = async () => {
    setDuelMessages([]);
    setDuelRound(1);
    setDuelVerdict(null);
    setMomentum(50);
    setIsFighting(true);

    await executeDuelStep(1, fighter1, fighter2, []);
  };

  const executeDuelStep = async (
    round: number,
    f1Id: string,
    f2Id: string,
    history: DuelMessage[]
  ) => {
    if (round > maxRounds) {
      setIsFighting(false);
      determineWinner(history);
      return;
    }

    const fighterA = FIGHTERS.find(f => f.id === f1Id)!;
    const fighterB = FIGHTERS.find(f => f.id === f2Id)!;

    // Turn Fighter A
    if (f1Id === "user") {
      setCurrentTurn("user");
      // Wait for user input
      return;
    }

    setCurrentTurn(f1Id);
    try {
      const speech1 = await requestFighterSpeech(fighterA, fighterB, round, history, "attack");
      const msg1: DuelMessage = {
        id: `duel-${Date.now()}-1`,
        fighterId: fighterA.id,
        fighterName: fighterA.name,
        fighterColor: fighterA.color,
        fighterSymbol: fighterA.symbol,
        round,
        content: speech1,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        claps: 0,
      };

      const updated1 = [...history, msg1];
      setDuelMessages(updated1);
      setMomentum(prev => Math.max(15, prev - 12));

      await new Promise(r => setTimeout(r, 800));

      // Turn Fighter B
      if (f2Id === "user") {
        setCurrentTurn("user");
        return;
      }

      setCurrentTurn(f2Id);
      const speech2 = await requestFighterSpeech(fighterB, fighterA, round, updated1, "counter");
      const msg2: DuelMessage = {
        id: `duel-${Date.now()}-2`,
        fighterId: fighterB.id,
        fighterName: fighterB.name,
        fighterColor: fighterB.color,
        fighterSymbol: fighterB.symbol,
        round,
        content: speech2,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        claps: 0,
      };

      const updated2 = [...updated1, msg2];
      setDuelMessages(updated2);
      setMomentum(prev => Math.min(85, prev + 14));
      setCurrentTurn(null);

      await new Promise(r => setTimeout(r, 1000));

      if (round < maxRounds) {
        setDuelRound(round + 1);
        await executeDuelStep(round + 1, f1Id, f2Id, updated2);
      } else {
        setIsFighting(false);
        determineWinner(updated2);
      }
    } catch (err) {
      console.warn("Duel warning:", err);
      setIsFighting(false);
      setCurrentTurn(null);
    }
  };

  const requestFighterSpeech = async (
    speaker: typeof FIGHTERS[0],
    opponent: typeof FIGHTERS[0],
    round: number,
    history: DuelMessage[],
    type: "attack" | "counter"
  ): Promise<string> => {
    const prompt = `Tu es en DUEL direct 1 contre 1 contre ${opponent.name} sur le sujet : "${topicTitle}".
C'est le ROUND ${round} sur ${maxRounds}.
${type === "attack" ? "Lance une attaque philosophique et rhétorique cinglante, sans concession." : `Réfute directement l'attaque de ${opponent.name} et contre-attaque avec brio.`}
Sois percutant, incisif, direct, sans préambule inutile (maximum 90 mots).`;

    const context = history.slice(-2).map(m => `[${m.fighterName}]: ${m.content}`).join("\n\n");

    const res = await fetch("/api/debate/generate", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        systemPrompt: `Tu es ${speaker.name}. Style : vif, punchy, combat d'éloquence express.`,
        topicTitle: `DUEL : ${topicTitle}`,
        topicDescription: prompt,
        context,
        agentId: speaker.id === "user" ? "chatgpt" : speaker.id,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.text;
    }
    return `En tant que ${speaker.name}, je démontre sans équivoque la supériorité de ma position sur celle de ${opponent.name}.`;
  };

  const handleSendHumanSpeech = async () => {
    if (!humanSpeech.trim()) return;

    const userMsg: DuelMessage = {
      id: `duel-${Date.now()}-user`,
      fighterId: "user",
      fighterName: "Vous (Humain)",
      fighterColor: "#60a5fa",
      fighterSymbol: "👤",
      round: duelRound,
      content: humanSpeech.trim(),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      claps: 0,
    };

    setHumanSpeech("");
    const updated = [...duelMessages, userMsg];
    setDuelMessages(updated);
    setMomentum(prev => (fighter1 === "user" ? Math.max(10, prev - 20) : Math.min(90, prev + 20)));

    const opponentId = fighter1 === "user" ? fighter2 : fighter1;
    const opponent = FIGHTERS.find(f => f.id === opponentId)!;

    setCurrentTurn(opponentId);
    try {
      const speech = await requestFighterSpeech(
        opponent,
        FIGHTERS.find(f => f.id === "user")!,
        duelRound,
        updated,
        "counter"
      );

      const opMsg: DuelMessage = {
        id: `duel-${Date.now()}-op`,
        fighterId: opponent.id,
        fighterName: opponent.name,
        fighterColor: opponent.color,
        fighterSymbol: opponent.symbol,
        round: duelRound,
        content: speech,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        claps: 0,
      };

      const finalUpdated = [...updated, opMsg];
      setDuelMessages(finalUpdated);
      setCurrentTurn(null);

      if (duelRound < maxRounds) {
        setDuelRound(duelRound + 1);
        if (fighter1 === "user") {
          setCurrentTurn("user");
        }
      } else {
        setIsFighting(false);
        determineWinner(finalUpdated);
      }
    } catch (err) {
      console.warn("Duel speech warning:", err);
      setIsFighting(false);
      setCurrentTurn(null);
    }
  };

  const determineWinner = (history: DuelMessage[]) => {
    const winner = momentum < 50 ? f1 : f2;
    setDuelVerdict(`🏆 VICTOIRE PAR K.O. ORATOIRE : ${winner.name.toUpperCase()} l'emporte avec une maîtrise rhétorique implacable lors de cette confrontation au sommet !`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-lg animate-fadeSlideUp">
      <div className="relative w-full max-w-4xl rounded-2xl border border-red-500/30 bg-[#0a0808] shadow-2xl p-5 md:p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-blue-500/20 border border-red-500/30 text-white">
              <Swords className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black font-condensed tracking-wider uppercase text-white flex items-center gap-2">
                Choc des Titans • Mode Duel 1v1
                <span className="text-[10px] font-mono uppercase bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">
                  CLASH IMMÉDIAT
                </span>
              </h3>
              <p className="text-xs text-gray-400">Confrontation oratoire directe round par round</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fighter Selection Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-xl bg-black/60 border border-white/[0.06] mb-4 shrink-0">
          {/* Fighter 1 */}
          <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-blue-500/[0.06] border border-blue-500/20">
            <div className="flex items-center gap-2">
              <span style={{ color: f1.color }} className="text-lg font-bold font-mono">
                {f1.symbol}
              </span>
              <div>
                <div className="text-[10px] font-mono uppercase text-blue-400">COIN BLEU</div>
                <div className="font-condensed font-bold text-sm text-white uppercase">{f1.name}</div>
              </div>
            </div>

            <select
              value={fighter1}
              disabled={isFighting}
              onChange={e => setFighter1(e.target.value)}
              className="bg-black/80 border border-white/[0.1] rounded px-2 py-1 text-xs text-white focus:outline-none"
            >
              {FIGHTERS.map(f => (
                <option key={f.id} value={f.id} disabled={f.id === fighter2}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fighter 2 */}
          <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-red-500/[0.06] border border-red-500/20">
            <div className="flex items-center gap-2">
              <span style={{ color: f2.color }} className="text-lg font-bold font-mono">
                {f2.symbol}
              </span>
              <div>
                <div className="text-[10px] font-mono uppercase text-red-400">COIN ROUGE</div>
                <div className="font-condensed font-bold text-sm text-white uppercase">{f2.name}</div>
              </div>
            </div>

            <select
              value={fighter2}
              disabled={isFighting}
              onChange={e => setFighter2(e.target.value)}
              className="bg-black/80 border border-white/[0.1] rounded px-2 py-1 text-xs text-white focus:outline-none"
            >
              {FIGHTERS.map(f => (
                <option key={f.id} value={f.id} disabled={f.id === fighter1}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tug of War Dynamic Momentum Bar */}
        <div className="space-y-1 mb-4 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold">
            <span className="text-blue-400">{f1.name} : {100 - momentum}%</span>
            <span className="text-gray-400">JAUGE D'INFLUENCE DU PUBLIC</span>
            <span className="text-red-400">{f2.name} : {momentum}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden flex">
            <div
              style={{ width: `${100 - momentum}%` }}
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
            />
            <div
              style={{ width: `${momentum}%` }}
              className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-500"
            />
          </div>
        </div>

        {/* Duel Dialogue Stream */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 my-2">
          {duelMessages.length === 0 && !isFighting && (
            <div className="p-12 text-center text-gray-400 space-y-3 flex flex-col items-center justify-center">
              <Swords className="w-12 h-12 text-red-500/60 animate-bounce" />
              <h4 className="text-base font-bold font-condensed uppercase tracking-wider text-white">
                Préparez-vous pour le Clash
              </h4>
              <p className="text-xs text-gray-400 max-w-md">
                Sélectionnez vos deux combattants et lancez le duel. Ils s'affronteront en 3 rounds ultra-condensés avec répliques cinglantes et contre-attaques directes.
              </p>
            </div>
          )}

          {duelMessages.map((msg) => {
            const isF1 = msg.fighterId === f1.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 p-3.5 rounded-xl border transition-all animate-fadeSlideUp ${
                  isF1
                    ? "bg-blue-500/[0.04] border-blue-500/20 mr-6 md:mr-12"
                    : "bg-red-500/[0.04] border-red-500/20 ml-6 md:ml-12"
                }`}
              >
                <div
                  style={{ color: msg.fighterColor, borderColor: msg.fighterColor }}
                  className="w-8 h-8 rounded-full border-2 bg-black/60 flex items-center justify-center font-bold text-sm shrink-0"
                >
                  {msg.fighterSymbol}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase text-white font-condensed tracking-wider">
                        {msg.fighterName}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-gray-400">
                        ROUND {msg.round}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500">{msg.time}</span>
                  </div>

                  <p className="text-xs md:text-sm text-gray-200 leading-relaxed font-sans">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Active fighter typing indicator */}
          {currentTurn && currentTurn !== "user" && (
            <div className="flex items-center gap-2 text-xs text-[#00f5c4] p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{FIGHTERS.find(f => f.id === currentTurn)?.name} prépare sa réplique...</span>
            </div>
          )}

          {/* Knockout Verdict */}
          {duelVerdict && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-black to-red-500/20 border border-amber-500/40 text-center space-y-1 animate-summaryReveal">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-widest font-condensed">
                <Award className="w-4 h-4" />
                VERDICT FINAL DU CHOC
              </div>
              <div className="text-sm md:text-base font-bold text-white font-condensed uppercase tracking-wide">
                {duelVerdict}
              </div>
            </div>
          )}

          <div ref={duelBottomRef} />
        </div>

        {/* Human input if human's turn */}
        {currentTurn === "user" && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-2 mb-2">
            <input
              type="text"
              value={humanSpeech}
              onChange={e => setHumanSpeech(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendHumanSpeech()}
              placeholder="À vous ! Lancez votre punchline ou votre réfutation..."
              className="flex-1 bg-black/80 border border-blue-500/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            />
            <button
              onClick={handleSendHumanSpeech}
              disabled={!humanSpeech.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-condensed font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Frapper
            </button>
          </div>
        )}

        {/* Footer controls */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-400">Rounds :</span>
            {[2, 3, 5].map(r => (
              <button
                key={r}
                disabled={isFighting}
                onClick={() => setMaxRounds(r)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold cursor-pointer ${
                  maxRounds === r
                    ? "bg-[#00f5c4]/20 text-[#00f5c4] border border-[#00f5c4]/40"
                    : "bg-white/[0.04] text-gray-400 border border-white/[0.06]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartDuel}
              disabled={isFighting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:opacity-40 text-white font-condensed font-black text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xl transition-all"
            >
              <Swords className="w-4 h-4" />
              {duelMessages.length > 0 ? "Recommencer le Duel" : "Lancer le Duel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { 
  Swords, 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Sparkles, 
  Award, 
  Zap, 
  ThumbsUp, 
  Send,
  Maximize2,
  Minimize2,
  Type,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from "lucide-react";

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

/**
 * Nettoie et met en forme le texte d'un duel (retire les balises Markdown brutes
 * et stylise les emphase **bold** et *italique* pour une lecture haute lisibilité).
 */
function FormattedDuelContent({ content, fontSizeClass }: { content: string; fontSizeClass: string }) {
  const paragraphs = content.split(/\n\s*\n/);

  return (
    <div className={`space-y-3 font-sans ${fontSizeClass}`}>
      {paragraphs.map((p, pIdx) => {
        const parts = p.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return (
          <p key={pIdx} className="leading-relaxed text-slate-100 select-text">
            {parts.map((part, idx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={idx} className="font-extrabold text-white bg-white/10 px-1 py-0.5 rounded tracking-wide">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith("*") && part.endsWith("*")) {
                return (
                  <em key={idx} className="italic text-slate-200">
                    {part.slice(1, -1)}
                  </em>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

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
  const [momentum, setMomentum] = useState(50); // 50 = milieu, 0 = f1 max, 100 = f2 max
  const [humanSpeech, setHumanSpeech] = useState("");
  const [duelVerdict, setDuelVerdict] = useState<string | null>(null);

  // Confort de lecture sur PC / Grand écran
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("large");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const duelBottomRef = useRef<HTMLDivElement>(null);
  const isFightingRef = useRef(false);

  useEffect(() => {
    isFightingRef.current = isFighting;
  }, [isFighting]);

  useEffect(() => {
    duelBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [duelMessages, currentTurn, duelVerdict]);

  // Écoute de la touche Échap pour fermer proprement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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

    // Tour Fighter A
    if (f1Id === "user") {
      setCurrentTurn("user");
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

      // Tour Fighter B
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
${type === "attack" ? "Lance une attaque philosophique et rhétorique cinglante, percutante, sans concession." : `Réfute directement l'attaque de ${opponent.name} et contre-attaque avec brio.`}
Sois incisif, direct, argumenté avec vivacité (environ 80 à 120 mots).`;

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

  const handleClap = (msgId: string, fighterId: string) => {
    setDuelMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, claps: (m.claps || 0) + 1 } : m))
    );
    // Infléchir légèrement la jauge en faveur du combattant applaudi
    setMomentum(prev => {
      if (fighterId === f1.id) return Math.max(10, prev - 3);
      if (fighterId === f2.id) return Math.min(90, prev + 3);
      return prev;
    });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "fr-FR";
    utterance.rate = 1.05;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Sélection de la classe de texte selon le choix de l'utilisateur
  const getFontSizeClass = () => {
    switch (fontSize) {
      case "normal":
        return "text-sm md:text-base";
      case "large":
        return "text-base md:text-lg lg:text-[18px]";
      case "xlarge":
        return "text-lg md:text-xl lg:text-[21px]";
      default:
        return "text-base md:text-lg";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/92 backdrop-blur-xl animate-fadeSlideUp">
      <div 
        className={`relative w-full ${
          isFullscreen 
            ? "max-w-[98vw] h-[98vh]" 
            : "max-w-5xl xl:max-w-6xl 2xl:max-w-7xl h-[94vh] max-h-[96vh]"
        } rounded-2xl md:rounded-3xl border border-red-500/30 bg-[#09080b] shadow-[0_0_80px_rgba(239,68,68,0.15)] p-4 sm:p-5 md:p-7 overflow-hidden flex flex-col transition-all duration-300`}
      >
        {/* Lueur d'ambiance d'arène */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* ─── EN-TÊTE PRINCIPAL : TITRE & CONTRÔLES PC ÉTENDUS ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-white/[0.08] mb-3 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 md:p-3 rounded-xl bg-gradient-to-br from-red-500/25 to-blue-500/25 border border-red-500/40 text-white shadow-lg">
              <Swords className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg md:text-2xl font-black font-condensed tracking-wider uppercase text-white">
                  Choc des Titans • Duel 1v1
                </h3>
                <span className="text-[10px] md:text-xs font-mono uppercase bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded-full border border-red-500/30 font-bold tracking-widest">
                  CLASH IMMÉDIAT
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-400 font-sans line-clamp-1">
                Confrontation oratoire directe sur : <strong className="text-gray-200">« {topicTitle} »</strong>
              </p>
            </div>
          </div>

          {/* Outils de confort de lecture sur PC */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Sélecteur de taille de texte */}
            <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 gap-1">
              <span className="text-[10px] font-mono text-gray-400 px-1 hidden md:inline flex items-center gap-1">
                <Type className="w-3 h-3 text-gray-400" /> Police :
              </span>
              <button
                onClick={() => setFontSize("normal")}
                title="Taille Standard"
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  fontSize === "normal"
                    ? "bg-[#00f5c4]/20 text-[#00f5c4] border border-[#00f5c4]/40"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize("large")}
                title="Grande Taille (Recommandé PC)"
                className={`px-2 py-1 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  fontSize === "large"
                    ? "bg-[#00f5c4]/20 text-[#00f5c4] border border-[#00f5c4]/40"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                A+
              </button>
              <button
                onClick={() => setFontSize("xlarge")}
                title="Très Grande Taille Confort"
                className={`px-2 py-1 rounded-lg text-base font-extrabold transition-all cursor-pointer ${
                  fontSize === "xlarge"
                    ? "bg-[#00f5c4]/20 text-[#00f5c4] border border-[#00f5c4]/40"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                A++
              </button>
            </div>

            {/* Toggle HUD compact (pour libérer encore plus d'espace de lecture) */}
            <button
              onClick={() => setIsHudCollapsed(!isHudCollapsed)}
              title={isHudCollapsed ? "Développer les réglages de combat" : "Réduire pour agrandir la zone de lecture"}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono text-gray-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] cursor-pointer"
            >
              {isHudCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline text-[11px]">Afficher combattants</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline text-[11px]">Espace lecture max</span>
                </>
              )}
            </button>

            {/* Mode Plein Écran */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Réduire la fenêtre" : "Agrandir en plein écran"}
              className="p-2 rounded-xl text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Bouton Fermer */}
            <button
              onClick={onClose}
              title="Fermer (Échap)"
              className="p-2 rounded-xl text-gray-400 hover:text-white bg-white/[0.04] hover:bg-red-500/20 hover:border-red-500/40 border border-white/[0.08] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── HUD DES COMBATTANTS & JAUGE D'INFLUENCE ─── */}
        {!isHudCollapsed ? (
          <div className="bg-black/60 border border-white/[0.08] rounded-2xl p-3 md:p-4 mb-3 shrink-0 transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {/* Fighter 1 (Coin Bleu) */}
              <div className="flex items-center justify-between gap-3 p-2.5 md:p-3 rounded-xl bg-blue-500/[0.08] border border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div 
                    style={{ borderColor: f1.color, color: f1.color }} 
                    className="w-10 h-10 rounded-xl border-2 bg-black/80 flex items-center justify-center text-lg font-bold font-mono shadow-md"
                  >
                    {f1.symbol}
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                      COIN BLEU • {f1.role}
                    </div>
                    <div className="font-condensed font-black text-base md:text-lg text-white uppercase tracking-wide">
                      {f1.name}
                    </div>
                  </div>
                </div>

                <select
                  value={fighter1}
                  disabled={isFighting}
                  onChange={e => setFighter1(e.target.value)}
                  className="bg-black/90 border border-blue-400/40 rounded-lg px-2.5 py-1.5 text-xs md:text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                >
                  {FIGHTERS.map(f => (
                    <option key={f.id} value={f.id} disabled={f.id === fighter2}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fighter 2 (Coin Rouge) */}
              <div className="flex items-center justify-between gap-3 p-2.5 md:p-3 rounded-xl bg-red-500/[0.08] border border-red-500/30">
                <div className="flex items-center gap-3">
                  <div 
                    style={{ borderColor: f2.color, color: f2.color }} 
                    className="w-10 h-10 rounded-xl border-2 bg-black/80 flex items-center justify-center text-lg font-bold font-mono shadow-md"
                  >
                    {f2.symbol}
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold">
                      COIN ROUGE • {f2.role}
                    </div>
                    <div className="font-condensed font-black text-base md:text-lg text-white uppercase tracking-wide">
                      {f2.name}
                    </div>
                  </div>
                </div>

                <select
                  value={fighter2}
                  disabled={isFighting}
                  onChange={e => setFighter2(e.target.value)}
                  className="bg-black/90 border border-red-400/40 rounded-lg px-2.5 py-1.5 text-xs md:text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-red-400 cursor-pointer"
                >
                  {FIGHTERS.map(f => (
                    <option key={f.id} value={f.id} disabled={f.id === fighter1}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Jauge Dynamique de Tir à la Corde */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-blue-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  {f1.name} : {100 - momentum}%
                </span>
                <span className="text-gray-400 text-[10px] md:text-xs tracking-wider uppercase font-semibold">
                  JAUGE D'INFLUENCE DU PUBLIC
                </span>
                <span className="text-red-400 flex items-center gap-1.5">
                  {f2.name} : {momentum}%
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-900 border border-white/[0.08] overflow-hidden flex p-0.5 shadow-inner">
                <div
                  style={{ width: `${100 - momentum}%` }}
                  className="h-full rounded-l-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-400 transition-all duration-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                />
                <div
                  style={{ width: `${momentum}%` }}
                  className="h-full rounded-r-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 transition-all duration-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                />
              </div>
            </div>
          </div>
        ) : (
          /* HUD Réduit Ultra-Compact pour Espace Lecture Maximal */
          <div className="flex items-center justify-between gap-3 p-2 px-3.5 rounded-xl bg-black/60 border border-white/[0.08] mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <span style={{ color: f1.color }} className="font-bold font-mono text-sm">{f1.symbol}</span>
              <span className="text-xs md:text-sm font-bold text-blue-400 uppercase font-condensed">{f1.name}</span>
              <span className="text-xs font-mono text-blue-300 font-bold">{100 - momentum}%</span>
            </div>

            <div className="flex-1 max-w-xs md:max-w-md h-2 rounded-full bg-gray-900 border border-white/[0.06] overflow-hidden flex mx-2">
              <div style={{ width: `${100 - momentum}%` }} className="h-full bg-blue-500 transition-all duration-300" />
              <div style={{ width: `${momentum}%` }} className="h-full bg-red-500 transition-all duration-300" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-red-300 font-bold">{momentum}%</span>
              <span className="text-xs md:text-sm font-bold text-red-400 uppercase font-condensed">{f2.name}</span>
              <span style={{ color: f2.color }} className="font-bold font-mono text-sm">{f2.symbol}</span>
            </div>
          </div>
        )}

        {/* ─── ZONE DE LECTURE DUEL (FLUX PRINCIPAL ÉTENDU) ─── */}
        <div className="flex-1 overflow-y-auto space-y-4 md:space-y-6 pr-2 md:pr-4 my-1 custom-scrollbar min-h-0">
          {duelMessages.length === 0 && !isFighting && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 md:p-12 text-center text-gray-400 space-y-4 bg-white/[0.01] rounded-2xl border border-dashed border-white/[0.06]">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-blue-500/20 border border-red-500/30">
                <Swords className="w-12 h-12 md:w-16 md:h-16 text-red-400 animate-pulse" />
              </div>
              <h4 className="text-lg md:text-2xl font-black font-condensed uppercase tracking-wider text-white">
                Préparez-vous pour le Grand Clash Rhétorique
              </h4>
              <p className="text-sm md:text-base text-gray-300 max-w-xl leading-relaxed">
                Choisissez vos deux orateurs ci-dessus et cliquez sur <strong className="text-[#00f5c4]">Lancer le Duel</strong>. Les répliques s'enchaîneront sous vos yeux en rounds incisifs et impitoyables.
              </p>
              <div className="flex items-center gap-2 pt-2 text-xs font-mono text-gray-400">
                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">Coin Bleu : {f1.name}</span>
                <span className="text-gray-600 font-bold">VS</span>
                <span className="px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30">Coin Rouge : {f2.name}</span>
              </div>
            </div>
          )}

          {duelMessages.map((msg) => {
            const isF1 = msg.fighterId === f1.id;
            return (
              <div
                key={msg.id}
                className={`relative flex gap-3.5 md:gap-5 p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all animate-fadeSlideUp shadow-xl ${
                  isF1
                    ? "bg-[#0c121e]/90 border-blue-500/30 lg:mr-16 hover:border-blue-500/50"
                    : "bg-[#180c0d]/90 border-red-500/30 lg:ml-16 hover:border-red-500/50"
                }`}
              >
                {/* Avatar du combattant */}
                <div
                  style={{ color: msg.fighterColor, borderColor: msg.fighterColor }}
                  className="w-10 h-10 md:w-13 md:h-13 rounded-2xl border-2 bg-black/80 flex items-center justify-center font-black text-base md:text-xl shrink-0 shadow-lg"
                >
                  {msg.fighterSymbol}
                </div>

                {/* Corps de la tirade */}
                <div className="flex-1 space-y-2.5 min-w-0">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-black text-sm md:text-lg uppercase text-white font-condensed tracking-wider">
                        {msg.fighterName}
                      </span>
                      <span className="text-[10px] md:text-xs font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-gray-300 font-bold border border-white/[0.1]">
                        ROUND {msg.round}
                      </span>
                      {isF1 ? (
                        <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest hidden sm:inline">Attaque / Thèse</span>
                      ) : (
                        <span className="text-[9px] font-mono text-red-400 uppercase tracking-widest hidden sm:inline">Réfutation / Antithèse</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-gray-400">{msg.time}</span>
                    </div>
                  </div>

                  {/* Texte de l'orateur mis en valeur pour grand écran */}
                  <FormattedDuelContent content={msg.content} fontSizeClass={getFontSizeClass()} />

                  {/* Barre d'action sous le message (Applaudissements, Lecture audio, Copie) */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.04] text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleClap(msg.id, msg.fighterId)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 border border-white/[0.06] transition-all cursor-pointer"
                        title="Applaudir cet argument (influe sur la jauge)"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-mono font-bold text-[11px]">{msg.claps || 0}</span>
                        <span className="hidden sm:inline text-[11px] font-medium">Clap</span>
                      </button>

                      <button
                        onClick={() => handleSpeak(msg.id, msg.content)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          speakingId === msg.id
                            ? "bg-[#00f5c4]/20 text-[#00f5c4] border-[#00f5c4]/50 animate-pulse"
                            : "bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border-white/[0.06]"
                        }`}
                        title="Écouter la tirade"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">
                          {speakingId === msg.id ? "Lecture..." : "Écouter"}
                        </span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleCopy(msg.id, `[${msg.fighterName} - Round ${msg.round}]:\n${msg.content}`)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all cursor-pointer"
                      title="Copier la tirade"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400 font-mono">Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[10px] font-mono">Copier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Indicateur de préparation de frappe oratoire */}
          {currentTurn && currentTurn !== "user" && (
            <div className="flex items-center gap-3 p-4 md:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] animate-pulse">
              <div className="p-2 rounded-xl bg-[#00f5c4]/10 text-[#00f5c4]">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <span className="text-sm md:text-base font-bold text-white uppercase font-condensed tracking-wide">
                  {FIGHTERS.find(f => f.id === currentTurn)?.name}
                </span>
                <span className="text-xs md:text-sm text-[#00f5c4] ml-2">prépare sa contre-attaque rhétorique...</span>
              </div>
            </div>
          )}

          {/* Verdict Final par K.O. */}
          {duelVerdict && (
            <div className="p-5 md:p-7 rounded-2xl md:rounded-3xl bg-gradient-to-r from-amber-500/20 via-[#120f08] to-red-500/20 border-2 border-amber-500/50 text-center space-y-2.5 animate-summaryReveal shadow-[0_0_50px_rgba(245,158,11,0.2)]">
              <div className="flex items-center justify-center gap-2 text-amber-400 text-xs md:text-sm font-extrabold uppercase tracking-widest font-condensed">
                <Award className="w-5 h-5" />
                VERDICT OFFICIEL DU CHOC DES TITANS
              </div>
              <div className="text-base md:text-xl lg:text-2xl font-black text-white font-condensed uppercase tracking-wide leading-relaxed">
                {duelVerdict}
              </div>
            </div>
          )}

          <div ref={duelBottomRef} />
        </div>

        {/* ─── SAISIE HUMAINE (SI L'UTILISATEUR PARTICIPE) ─── */}
        {currentTurn === "user" && (
          <div className="p-3 md:p-4 rounded-2xl bg-blue-500/15 border-2 border-blue-500/40 flex items-center gap-2 md:gap-3 mb-2 shrink-0 animate-pulse">
            <input
              type="text"
              value={humanSpeech}
              onChange={e => setHumanSpeech(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendHumanSpeech()}
              placeholder="À vous l'arène ! Envoyez votre punchline ou votre réfutation imparable..."
              className="flex-1 bg-black/80 border border-blue-500/40 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleSendHumanSpeech}
              disabled={!humanSpeech.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-condensed font-black text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <Send className="w-4 h-4" />
              Frapper
            </button>
          </div>
        )}

        {/* ─── PIED DE PAGE : ROUNDS & CONTRÔLES DU CHOC ─── */}
        <div className="pt-3.5 border-t border-white/[0.08] flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-400 font-bold uppercase tracking-wider">
              Nombre de Rounds :
            </span>
            <div className="flex items-center gap-1.5">
              {[2, 3, 5].map(r => (
                <button
                  key={r}
                  disabled={isFighting}
                  onClick={() => setMaxRounds(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                    maxRounds === r
                      ? "bg-[#00f5c4]/20 text-[#00f5c4] border border-[#00f5c4]/50 shadow-md"
                      : "bg-white/[0.04] text-gray-400 hover:text-white border border-white/[0.06]"
                  }`}
                >
                  {r} rounds
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStartDuel}
              disabled={isFighting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-40 text-white font-condensed font-black text-sm md:text-base uppercase tracking-wider flex items-center gap-2.5 cursor-pointer shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Swords className="w-4 h-4 md:w-5 md:h-5" />
              {duelMessages.length > 0 ? "Recommencer le Duel" : "Lancer le Choc des Titans"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Radio, Sparkles, Music } from "lucide-react";

type SoundscapeType = "none" | "agora" | "court" | "cyber";

export function AudioAtmospherePlayer() {
  const [activeSoundscape, setActiveSoundscape] = useState<SoundscapeType>("none");
  const [volume, setVolume] = useState(0.25);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscNodesRef = useRef<OscillatorNode[]>([]);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const stopCurrentSound = () => {
    oscNodesRef.current.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    oscNodesRef.current = [];
  };

  const playSoundscape = (type: SoundscapeType) => {
    initAudio();
    stopCurrentSound();

    if (type === "none" || !audioCtxRef.current) {
      setIsPlaying(false);
      return;
    }

    const ctx = audioCtxRef.current;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(type === "cyber" ? 650 : 350, ctx.currentTime);
    filter.connect(masterGain);
    filterNodeRef.current = filter;

    const oscillators: OscillatorNode[] = [];

    if (type === "agora") {
      // Warm chord: D, A, F#
      const freqs = [146.83, 220.00, 293.66, 369.99];
      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        oscillators.push(osc);
      });
    } else if (type === "court") {
      // Solemn low frequency pulse
      const freqs = [55.0, 110.0, 164.81];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx === 0 ? "sawtooth" : "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        oscillators.push(osc);
      });
    } else if (type === "cyber") {
      // Cyber pad with slight detune
      const freqs = [130.81, 196.00, 261.63, 392.00];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.detune.setValueAtTime(idx % 2 === 0 ? 5 : -5, ctx.currentTime);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        oscillators.push(osc);
      });
    }

    oscNodesRef.current = oscillators;
    setIsPlaying(true);
  };

  const handleSelectSoundscape = (type: SoundscapeType) => {
    setActiveSoundscape(type);
    playSoundscape(type);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVol, audioCtxRef.current.currentTime);
    }
  };

  useEffect(() => {
    return () => {
      stopCurrentSound();
    };
  }, []);

  return (
    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-black/40 border border-white/[0.06] text-xs">
      <div className="flex items-center gap-1.5 text-gray-400 pl-1">
        <Music className="w-3.5 h-3.5 text-[#00f5c4]" />
        <span className="font-condensed font-bold uppercase tracking-wider hidden sm:inline">
          Ambiance :
        </span>
      </div>

      {/* Preset buttons */}
      <div className="flex items-center gap-1">
        {[
          { id: "none", label: "Mute", icon: VolumeX },
          { id: "agora", label: "🏛️ Agora", icon: Volume2 },
          { id: "court", label: "⚖️ Tribunal", icon: Volume2 },
          { id: "cyber", label: "🌌 Cyber", icon: Volume2 },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => handleSelectSoundscape(item.id as SoundscapeType)}
            className={`px-2 py-0.5 rounded text-[10px] font-condensed font-bold tracking-wider uppercase cursor-pointer transition-all border ${
              activeSoundscape === item.id
                ? "bg-[#00f5c4]/20 text-[#00f5c4] border-[#00f5c4]/40 shadow-sm"
                : "bg-white/[0.02] hover:bg-white/[0.05] text-gray-400 border-white/[0.04]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Volume slider */}
      {activeSoundscape !== "none" && (
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/[0.08]">
          <input
            type="range"
            min="0"
            max="0.6"
            step="0.05"
            value={volume}
            onChange={e => handleVolumeChange(parseFloat(e.target.value))}
            className="w-12 h-1 accent-[#00f5c4] bg-gray-700 rounded cursor-pointer"
            title={`Volume : ${Math.round(volume * 166)}%`}
          />
          {/* Animated sound bars */}
          <div className="flex items-end gap-0.5 h-3">
            <div className="w-0.5 h-2 bg-[#00f5c4] animate-pulse" />
            <div className="w-0.5 h-3 bg-[#00f5c4] animate-ping" />
            <div className="w-0.5 h-1.5 bg-[#00f5c4] animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
}

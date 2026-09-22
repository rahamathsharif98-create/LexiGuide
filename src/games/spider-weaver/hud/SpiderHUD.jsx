import React from 'react';
import { Volume2, Sparkles, Star, Flame, HelpCircle } from 'lucide-react';
import { gameSound } from '../../../services/gameSoundService';

/**
 * SpiderHUD.jsx
 * Child-friendly tactile HUD for "Spinny the Spider: Web Weaver"
 */
export default function SpiderHUD({
  level,
  levelIndex,
  totalLevels,
  score,
  stars,
  streak,
  selectedRime,
  isVictory,
  onReplayPrompt,
}) {
  const isFever = streak >= 3;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-10 select-none">
      {/* 1. Top Status & Score Bar */}
      <div className="flex items-center justify-between gap-3">
        {/* Level & Target Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-950/85 backdrop-blur-md border border-indigo-400/40 shadow-lg text-white">
          <span className="text-xl">🕸️</span>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
              Web Strand {levelIndex + 1} / {totalLevels}
            </div>
            <div className="text-sm font-black text-white">
              {level?.hint || 'Weave the word!'}
            </div>
          </div>
        </div>

        {/* Score, Stars & Streak Pill */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-indigo-950/85 backdrop-blur-md border border-indigo-400/40 shadow-lg text-white pointer-events-auto">
          {/* Stars */}
          <div className="flex items-center gap-1 text-amber-300 font-black text-sm">
            <Star size={18} className="fill-amber-400 text-amber-400" />
            <span>{stars}</span>
          </div>

          <div className="h-4 w-px bg-indigo-700/60" />

          {/* Streak */}
          <div
            className={`flex items-center gap-1 font-black text-sm ${
              isFever ? 'text-rose-400 animate-pulse' : 'text-sky-300'
            }`}
          >
            <Flame size={18} className={isFever ? 'fill-rose-500 text-rose-500' : 'fill-sky-400 text-sky-400'} />
            <span>{streak}x</span>
          </div>

          <div className="h-4 w-px bg-indigo-700/60" />

          {/* Score */}
          <div className="font-mono font-black text-sm text-emerald-300">
            {score} pts
          </div>
        </div>
      </div>

      {/* 2. Center Top: Multisensory Onset-Rime Mission Badge */}
      <div className="flex flex-col items-center justify-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 sm:gap-3 px-6 py-3 rounded-3xl bg-slate-900/90 backdrop-blur-md border-2 border-purple-400/60 shadow-[0_12px_30px_rgba(168,85,247,0.35)]">
          {/* Target Onset */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-purple-600 text-white font-black text-xl sm:text-2xl tracking-wide shadow-inner">
            {level?.onset}
          </div>

          <span className="text-purple-300 font-black text-xl">+</span>

          {/* Rime Slot */}
          <div
            className={`px-4 py-1.5 rounded-2xl font-black text-xl sm:text-2xl border-2 border-dashed transition-all ${
              selectedRime
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md scale-105'
                : 'bg-purple-950/60 text-purple-300 border-purple-400/80 animate-pulse'
            }`}
          >
            {selectedRime || '?'}
          </div>

          <span className="text-purple-300 font-black text-xl">=</span>

          {/* Result Word or Mystery */}
          <div
            className={`px-4 py-1.5 rounded-2xl font-black text-xl sm:text-2xl transition-all ${
              isVictory
                ? 'bg-amber-400 text-slate-950 shadow-lg scale-110'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isVictory ? level?.targetWord?.toUpperCase() : '???'}
          </div>

          {/* Meaning Emoji */}
          <span className="text-2xl ml-1">{level?.emoji}</span>
        </div>

        {/* Listen Again Prompt Button */}
        <button
          type="button"
          onClick={onReplayPrompt}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Volume2 size={14} />
          <span>Tap to Hear Prompt: "{level?.targetWord}"</span>
        </button>
      </div>

      {/* 3. Bottom Child Instructions Pill */}
      <div className="flex justify-center">
        <div className="px-5 py-2 rounded-2xl bg-indigo-950/90 backdrop-blur-md border border-indigo-400/40 text-center text-xs sm:text-sm font-bold text-indigo-200 shadow-lg">
          ✨ Tap a glowing dewdrop on Spinny's web to weave the word!
        </div>
      </div>
    </div>
  );
}

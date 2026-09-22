import React from 'react';
import { Volume2, Sparkles, Key, ArrowLeft, RotateCcw, Flame } from 'lucide-react';
import GameSoundToggle from '../../../components/games/GameSoundToggle';

export default function LabyrinthHUD({
  riddle,
  collectedGlyphs = [],
  score = 0,
  stars = 0,
  streak = 1,
  isUnlocked = false,
  onSpeakPrompt,
  onResetLabyrinth,
  onBack,
}) {
  const letters = riddle?.word?.split('') || [];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20 font-sans select-none">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Left: Back & Voice */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-stone-950/85 hover:bg-stone-900 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-amber-500/40 shadow-lg transition-all active:scale-95"
            aria-label="Back to Games"
          >
            <ArrowLeft className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold hidden sm:inline">Back</span>
          </button>

          <button
            onClick={onSpeakPrompt}
            className="flex items-center gap-2 bg-amber-600/85 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-amber-300/40 shadow-lg transition-all active:scale-95"
            title="Hear Oracle Voice"
          >
            <Volume2 className="w-5 h-5 text-yellow-200 animate-pulse" />
            <span className="text-sm font-medium hidden sm:inline">Hear Oracle</span>
          </button>

          <GameSoundToggle />

          <button
            onClick={onResetLabyrinth}
            className="p-2 bg-stone-950/85 hover:bg-stone-900 text-stone-300 hover:text-white rounded-xl backdrop-blur-md border border-amber-500/40 transition-all active:scale-95"
            title="Reset Riddle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Gate Incantation Tablet */}
        <div className="bg-stone-950/90 border-2 border-amber-500/60 rounded-2xl px-6 py-2.5 backdrop-blur-md shadow-2xl flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="Riddle key">
            {riddle?.emoji || '🗝️'}
          </span>
          <div className="flex items-center gap-2">
            {letters.map((char, index) => {
              const isCollected = index < collectedGlyphs.length;
              const isNext = index === collectedGlyphs.length;
              return (
                <div
                  key={`glyph-${index}`}
                  className={`w-9 h-10 flex items-center justify-center rounded-lg font-black text-lg transition-all duration-300 ${
                    isCollected
                      ? 'bg-amber-500 text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.9)] scale-105 border border-amber-200'
                      : isNext
                      ? 'bg-stone-900 text-amber-300 border-2 border-dashed border-amber-400 animate-pulse'
                      : 'bg-stone-900/60 text-stone-600 border border-stone-800'
                  }`}
                >
                  {isCollected ? char : isNext ? '?' : '_'}
                </div>
              );
            })}
            <span className="text-amber-400 font-extrabold text-sm">=</span>
            <span className="font-black text-lg text-amber-300 tracking-wider">
              {riddle?.chamber}
            </span>
          </div>
        </div>

        {/* Right: Score & Stars */}
        <div className="flex items-center gap-3">
          <div className="bg-stone-950/85 border border-amber-500/40 rounded-xl px-3.5 py-2 flex items-center gap-2 backdrop-blur-md text-amber-300 font-bold text-sm shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{score} PTS</span>
            {streak > 1 && (
              <span className="bg-amber-500 text-stone-950 text-xs px-1.5 py-0.5 rounded-full font-black">
                x{streak}
              </span>
            )}
          </div>
          <div className="bg-stone-950/85 border border-yellow-500/40 rounded-xl px-3.5 py-2 flex items-center gap-1.5 backdrop-blur-md text-yellow-300 font-bold text-sm shadow-lg">
            <span>⭐</span>
            <span>{stars}</span>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Gate Unlocked Celebration Banner */}
      {isUnlocked && (
        <div className="self-center bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-stone-950 px-8 py-4 rounded-3xl shadow-2xl border-2 border-yellow-200 animate-bounce flex items-center gap-3">
          <Key className="w-8 h-8 text-stone-950" />
          <div>
            <h2 className="text-xl font-black tracking-wide">TEMPLE GATE UNLOCKED! 🏆</h2>
            <p className="text-sm font-extrabold text-stone-950">
              The {riddle?.word} incantation opened the secret vault of pharaoh gold!
            </p>
          </div>
        </div>
      )}

      {/* 3. BOTTOM: Guidance */}
      <div className="flex items-end justify-between pointer-events-auto">
        <div className="bg-stone-950/85 border border-stone-800/60 rounded-xl p-3 max-w-sm text-xs text-stone-300 backdrop-blur-md shadow-lg">
          <p className="font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-500" /> Torchlight Labyrinth:
          </p>
          <p>
            Collect glowing rune pedestals in incantation order to unlock the sacred stone gate!
          </p>
        </div>

        <div className="bg-stone-950/90 border border-amber-500/50 rounded-2xl px-5 py-3 backdrop-blur-md text-right shadow-2xl">
          <p className="text-xs text-amber-400 font-bold">RUNES ACTIVATED</p>
          <p className="text-xl font-black text-white">
            {collectedGlyphs.length} / {letters.length}
          </p>
        </div>
      </div>
    </div>
  );
}

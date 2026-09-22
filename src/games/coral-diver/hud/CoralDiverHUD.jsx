import React from 'react';
import { Volume2, Sparkles, Waves, ArrowLeft, RotateCcw, Compass } from 'lucide-react';
import GameSoundToggle from '../../../components/games/GameSoundToggle';

export default function CoralDiverHUD({
  level,
  collectedCount = 0,
  targetCount = 3,
  score = 0,
  stars = 0,
  streak = 1,
  oxygenPercentage = 100,
  isLevelComplete = false,
  onSpeakPrompt,
  onResetLevel,
  onBack,
}) {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20 font-sans select-none">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Left: Back & Voice Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-sky-950/85 hover:bg-sky-900 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-sky-600/50 shadow-lg transition-all active:scale-95"
            aria-label="Back to Games"
          >
            <ArrowLeft className="w-5 h-5 text-cyan-300" />
            <span className="text-sm font-semibold hidden sm:inline">Back</span>
          </button>

          <button
            onClick={onSpeakPrompt}
            className="flex items-center gap-2 bg-cyan-600/80 hover:bg-cyan-500 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-cyan-400/50 shadow-lg transition-all active:scale-95"
            title="Hear Voice Hint"
          >
            <Volume2 className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="text-sm font-medium hidden sm:inline">Hear Rhyme</span>
          </button>

          <GameSoundToggle />

          <button
            onClick={onResetLevel}
            className="p-2 bg-sky-950/85 hover:bg-sky-900 text-sky-200 hover:text-white rounded-xl backdrop-blur-md border border-sky-600/50 transition-all active:scale-95"
            title="Reset Dive"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Target Rhyme Banner */}
        <div className="bg-sky-950/90 border-2 border-cyan-400/60 rounded-2xl px-6 py-2.5 backdrop-blur-md shadow-2xl flex items-center gap-4">
          <span className="text-2xl" role="img" aria-label="Target Icon">
            {level?.emoji || '🐠'}
          </span>
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
              Find words that rhyme with:
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-black text-white tracking-wide">
                {level?.targetWord}
              </span>
              <span className="bg-amber-400 text-sky-950 text-xs px-2 py-0.5 rounded-full font-black">
                {level?.family}
              </span>
            </div>
          </div>
          {/* Progress pearl bubbles */}
          <div className="flex items-center gap-1.5 ml-2">
            {Array.from({ length: targetCount }).map((_, i) => (
              <div
                key={`pearl-${i}`}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                  i < collectedCount
                    ? 'bg-amber-300 text-sky-950 font-black shadow-[0_0_10px_rgba(253,224,71,0.9)] scale-110'
                    : 'bg-sky-900/80 border border-cyan-500/50 text-transparent'
                }`}
              >
                ●
              </div>
            ))}
          </div>
        </div>

        {/* Right: Score & Stars */}
        <div className="flex items-center gap-3">
          <div className="bg-sky-950/85 border border-cyan-500/40 rounded-xl px-3.5 py-2 flex items-center gap-2 backdrop-blur-md text-cyan-300 font-bold text-sm shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{score} PTS</span>
            {streak > 1 && (
              <span className="bg-amber-400 text-sky-950 text-xs px-1.5 py-0.5 rounded-full font-black">
                x{streak}
              </span>
            )}
          </div>
          <div className="bg-sky-950/85 border border-amber-500/40 rounded-xl px-3.5 py-2 flex items-center gap-1.5 backdrop-blur-md text-amber-300 font-bold text-sm shadow-lg">
            <span>⭐</span>
            <span>{stars}</span>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Level Complete Banner */}
      {isLevelComplete && (
        <div className="self-center bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 text-white px-8 py-4 rounded-3xl shadow-2xl border-2 border-cyan-300 animate-bounce flex items-center gap-3">
          <Waves className="w-8 h-8 text-cyan-200" />
          <div>
            <h2 className="text-xl font-black tracking-wide">DIVE EXPEDITION COMPLETE! 🪸</h2>
            <p className="text-sm text-cyan-100 font-medium">
              You matched all rhymes for {level?.targetWord}! Diving deeper!
            </p>
          </div>
        </div>
      )}

      {/* 3. BOTTOM: Submarine Controls Hint & Depth/Oxygen Gauge */}
      <div className="flex items-end justify-between pointer-events-auto">
        {/* Controls Info */}
        <div className="bg-sky-950/85 border border-sky-700/60 rounded-xl p-3 max-w-xs text-xs text-sky-200 backdrop-blur-md shadow-lg hidden sm:block">
          <p className="font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" /> Submarine Controls:
          </p>
          <p>Click a word bubble or steer with <span className="text-amber-300 font-bold">Arrow Keys / WASD</span> to pop rhyme pearls!</p>
        </div>

        {/* Oxygen / Depth Gauge */}
        <div className="bg-sky-950/90 border border-cyan-500/50 rounded-2xl p-4 backdrop-blur-md w-72 sm:w-80 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-sky-200 mb-1.5">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Waves className="w-4 h-4 text-cyan-400" />
              SUB OXYGEN TANK
            </span>
            <span className="text-cyan-300 font-extrabold">{Math.round(oxygenPercentage)}%</span>
          </div>
          <div className="w-full bg-sky-900 rounded-full h-3.5 overflow-hidden border border-sky-700">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(45,212,191,0.8)]"
              style={{ width: `${oxygenPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-sky-300 mt-2 italic text-center">
            {level?.prompt || 'Dive through the coral reef and match the rhymes!'}
          </p>
        </div>
      </div>
    </div>
  );
}

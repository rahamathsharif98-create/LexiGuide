import React from 'react';
import { Volume2, Sparkles, Hammer, ArrowLeft, RotateCcw } from 'lucide-react';
import GameSoundToggle from '../../../components/games/GameSoundToggle';

export default function VoxelHUD({
  recipe,
  placedLetters = [],
  score = 0,
  stars = 0,
  streak = 1,
  isCrafted = false,
  onSpeakPrompt,
  onResetCraft,
  onBack,
}) {
  const letters = recipe?.word?.split('') || [];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20 font-sans select-none">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Left: Back & Voice */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-slate-900/85 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-emerald-500/40 shadow-lg transition-all active:scale-95"
            aria-label="Back to Games"
          >
            <ArrowLeft className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold hidden sm:inline">Back</span>
          </button>

          <button
            onClick={onSpeakPrompt}
            className="flex items-center gap-2 bg-emerald-600/85 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-emerald-300/40 shadow-lg transition-all active:scale-95"
            title="Hear Blueprint Instructions"
          >
            <Volume2 className="w-5 h-5 text-yellow-300 animate-pulse" />
            <span className="text-sm font-medium hidden sm:inline">Hear Clue</span>
          </button>

          <GameSoundToggle />

          <button
            onClick={onResetCraft}
            className="p-2 bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-emerald-500/40 transition-all active:scale-95"
            title="Reset Bench"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Crafting Blueprint Banner */}
        <div className="bg-slate-900/90 border-2 border-emerald-400/60 rounded-2xl px-6 py-2.5 backdrop-blur-md shadow-2xl flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="Recipe icon">
            {recipe?.emoji || '🏰'}
          </span>
          <div className="flex items-center gap-2">
            {letters.map((char, index) => {
              const isPlaced = index < placedLetters.length;
              const isNext = index === placedLetters.length;
              return (
                <div
                  key={`char-${index}`}
                  className={`w-9 h-10 flex items-center justify-center rounded-lg font-black text-lg transition-all duration-300 ${
                    isPlaced
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-105 border border-emerald-200'
                      : isNext
                      ? 'bg-slate-800 text-emerald-300 border-2 border-dashed border-emerald-400 animate-pulse'
                      : 'bg-slate-800/60 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isPlaced ? char : isNext ? '?' : '_'}
                </div>
              );
            })}
            <span className="text-emerald-400 font-extrabold text-sm">=</span>
            <span className="font-black text-lg text-emerald-300 tracking-wider">
              {recipe?.reward}
            </span>
          </div>
        </div>

        {/* Right: Score & Stars */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/85 border border-emerald-500/40 rounded-xl px-3.5 py-2 flex items-center gap-2 backdrop-blur-md text-emerald-300 font-bold text-sm shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{score} PTS</span>
            {streak > 1 && (
              <span className="bg-emerald-500 text-slate-950 text-xs px-1.5 py-0.5 rounded-full font-black">
                x{streak}
              </span>
            )}
          </div>
          <div className="bg-slate-900/85 border border-yellow-500/40 rounded-xl px-3.5 py-2 flex items-center gap-1.5 backdrop-blur-md text-yellow-300 font-bold text-sm shadow-lg">
            <span>⭐</span>
            <span>{stars}</span>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Craft Success Banner */}
      {isCrafted && (
        <div className="self-center bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-white px-8 py-4 rounded-3xl shadow-2xl border-2 border-emerald-300 animate-bounce flex items-center gap-3">
          <Hammer className="w-8 h-8 text-yellow-300" />
          <div>
            <h2 className="text-xl font-black tracking-wide">CRAFTING COMPLETE! 🔨</h2>
            <p className="text-sm text-emerald-100 font-medium">
              You crafted the {recipe?.reward} by spelling {recipe?.word}!
            </p>
          </div>
        </div>
      )}

      {/* 3. BOTTOM: Guidance */}
      <div className="flex items-end justify-between pointer-events-auto">
        <div className="bg-slate-900/85 border border-slate-700/60 rounded-xl p-3 max-w-sm text-xs text-slate-200 backdrop-blur-md shadow-lg">
          <p className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
            <Hammer className="w-3.5 h-3.5 text-emerald-400" /> Voxel Builder:
          </p>
          <p>
            Click the floating letter cubes in sequence to craft the 3D voxel item on your workbench!
          </p>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/50 rounded-2xl px-5 py-3 backdrop-blur-md text-right shadow-2xl">
          <p className="text-xs text-emerald-400 font-bold">BLOCKS CRAFTED</p>
          <p className="text-xl font-black text-white">
            {placedLetters.length} / {letters.length}
          </p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Volume2, Sparkles, Hammer, ArrowLeft, RotateCcw } from 'lucide-react';
import GameSoundToggle from '../../../components/games/GameSoundToggle';

export default function VoxelHUD({
  recipe,
  placedLetters = [],
  score = 0,
  stars = 0,
  streak = 1,
  level = 1,
  totalLevels = 25,
  isCrafted = false,
  onSpeakPrompt,
  onResetCraft,
  onBack,
  onOpenStages,
}) {
  const letters = recipe?.word?.split('') || [];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between px-3.5 sm:px-5 md:px-6 py-2.5 sm:py-3.5 z-20 font-sans select-none">
      {/* 1. TOP HEADER - Responsive wrapping below 1024px to prevent any clipping */}
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 sm:gap-2.5 pointer-events-auto w-full">
        {/* Left: Back, Voice, Sound, Reset */}
        <div className="order-1 flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            data-testid="hud-back-btn"
            onClick={onBack}
            className="flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl backdrop-blur-md border border-emerald-500/40 shadow-lg transition-all active:scale-95 cursor-pointer"
            aria-label="Back to Games"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            <span className="text-xs sm:text-sm font-semibold hidden md:inline">Back</span>
          </button>

          <button
            type="button"
            data-testid="hud-hear-clue-btn"
            onClick={onSpeakPrompt}
            className="flex items-center gap-1.5 bg-emerald-600/85 hover:bg-emerald-500 text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl backdrop-blur-md border border-emerald-300/40 shadow-lg transition-all active:scale-95 cursor-pointer"
            title="Hear Blueprint Instructions"
          >
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 animate-pulse" />
            <span className="text-xs sm:text-sm font-medium hidden md:inline">Hear Clue</span>
          </button>

          <GameSoundToggle className="[&>span]:hidden xl:[&>span]:inline" />

          <button
            type="button"
            data-testid="hud-reset-bench-btn"
            onClick={onResetCraft}
            className="p-1.5 sm:p-2 bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-emerald-500/40 transition-all active:scale-95 cursor-pointer"
            title="Reset Bench"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onOpenStages && (
            <button
              type="button"
              data-testid="hud-stages-btn"
              onClick={onOpenStages}
              className="flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 text-emerald-300 hover:text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl backdrop-blur-md border border-emerald-500/40 shadow-lg transition-all active:scale-95 cursor-pointer text-xs sm:text-sm font-semibold"
              title="Choose Stage Roadmap"
            >
              <span>🗺️</span>
              <span className="hidden md:inline">Stages</span>
            </button>
          )}
        </div>

        {/* Center: Crafting Blueprint Banner (cleanly centered on row 2 below 1024px) */}
        <div
          data-testid="blueprint-banner"
          className="order-3 lg:order-2 w-full lg:w-auto flex justify-center mt-0.5 lg:mt-0 min-w-0"
        >
          <div className="bg-slate-900/90 border-2 border-emerald-400/60 rounded-2xl px-3 py-1 sm:px-4 sm:py-1.5 backdrop-blur-md shadow-2xl flex flex-col items-center gap-0.5 sm:gap-1 max-w-full overflow-x-auto">
            {/* Stage & Level Indicator */}
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-400">
              <span data-testid="hud-level-indicator">Level {recipe?.level || level}/{totalLevels}</span>
              <span className="text-emerald-600">•</span>
              <span data-testid="hud-stage-indicator">{recipe?.stage || 'Beginner Builder'}</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <span className="text-lg sm:text-xl shrink-0" role="img" aria-label="Recipe icon">
                {recipe?.emoji || '🏰'}
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                {letters.map((char, index) => {
                  const isPlaced = index < placedLetters.length;
                  const isNext = index === placedLetters.length;
                  return (
                    <div
                      key={`char-${index}`}
                      data-testid={`slot-${index}`}
                      data-placed={isPlaced ? 'true' : 'false'}
                      data-next={isNext ? 'true' : 'false'}
                      className={`w-6 h-7 sm:w-8 sm:h-9 flex items-center justify-center rounded-lg font-black text-xs sm:text-base transition-all duration-300 ${
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
                <span className="text-emerald-400 font-extrabold text-xs sm:text-sm">=</span>
                <span
                  data-testid="recipe-reward-name"
                  className="font-black text-xs sm:text-sm lg:text-base text-emerald-300 tracking-wider whitespace-nowrap"
                >
                  {recipe?.reward}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Score & Stars */}
        <div className="order-2 lg:order-3 flex items-center gap-1.5 sm:gap-2.5 shrink-0 mr-1 sm:mr-2">
          <div
            data-testid="hud-score"
            className="bg-slate-900/85 border border-emerald-500/40 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1.5 sm:gap-2 backdrop-blur-md text-emerald-300 font-bold text-xs sm:text-sm shadow-lg whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>{score} PTS</span>
            {streak > 1 && (
              <span
                data-testid="hud-streak-multiplier"
                className="bg-emerald-500 text-slate-950 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-black"
              >
                x{streak}
              </span>
            )}
          </div>
          <div
            data-testid="hud-stars"
            className="bg-slate-900/85 border border-yellow-500/40 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1 sm:gap-1.5 backdrop-blur-md text-yellow-300 font-bold text-xs sm:text-sm shadow-lg whitespace-nowrap shrink-0"
          >
            <span>⭐</span>
            <span>{stars}</span>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Craft Success Banner */}
      {isCrafted && (
        <div
          data-testid="craft-success-banner"
          className="self-center bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-white px-5 py-3 sm:px-8 sm:py-4 rounded-3xl shadow-2xl border-2 border-emerald-300 animate-bounce flex items-center gap-3 max-w-[92%]"
        >
          <Hammer className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300 shrink-0" />
          <div>
            <h2 className="text-base sm:text-xl font-black tracking-wide">CRAFTING COMPLETE! 🔨</h2>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium">
              You crafted the {recipe?.reward} by spelling {recipe?.word}!
            </p>
          </div>
        </div>
      )}

      {/* 3. BOTTOM: Guidance */}
      <div className="flex items-end justify-between pointer-events-auto gap-2">
        <div className="bg-slate-900/85 border border-slate-700/60 rounded-xl p-2.5 sm:p-3 max-w-[240px] sm:max-w-sm text-[11px] sm:text-xs text-slate-200 backdrop-blur-md shadow-lg">
          <p className="font-semibold text-emerald-400 mb-0.5 sm:mb-1 flex items-center gap-1.5">
            <Hammer className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Voxel Builder:
          </p>
          <p className="line-clamp-2 sm:line-clamp-none">
            Click the floating letter cubes in sequence to craft the 3D voxel item on your workbench!
          </p>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/50 rounded-2xl px-3.5 py-2 sm:px-5 sm:py-3 backdrop-blur-md text-right shadow-2xl shrink-0">
          <p className="text-[10px] sm:text-xs text-emerald-400 font-bold">BLOCKS CRAFTED</p>
          <p className="text-lg sm:text-xl font-black text-white">
            {placedLetters.length} / {letters.length}
          </p>
        </div>
      </div>
    </div>
  );
}

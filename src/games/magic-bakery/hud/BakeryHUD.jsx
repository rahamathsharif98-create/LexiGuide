import React from 'react';
import { Volume2, Sparkles, Cake, ArrowLeft, RotateCcw } from 'lucide-react';
import GameSoundToggle from '../../../components/games/GameSoundToggle';

export default function BakeryHUD({
  recipe,
  stackedSyllables = [],
  score = 0,
  stars = 0,
  streak = 1,
  isBakeComplete = false,
  onSpeakPrompt,
  onResetRecipe,
  onBack,
}) {
  const syllables = recipe?.syllables || [];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20 font-sans select-none">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Left: Back & Voice */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-amber-950/85 hover:bg-amber-900 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-amber-500/40 shadow-lg transition-all active:scale-95"
            aria-label="Back to Games"
          >
            <ArrowLeft className="w-5 h-5 text-amber-300" />
            <span className="text-sm font-semibold hidden sm:inline">Back</span>
          </button>

          <button
            onClick={onSpeakPrompt}
            className="flex items-center gap-2 bg-rose-500/85 hover:bg-rose-400 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-rose-300/40 shadow-lg transition-all active:scale-95"
            title="Hear Recipe Instructions"
          >
            <Volume2 className="w-5 h-5 text-yellow-200 animate-pulse" />
            <span className="text-sm font-medium hidden sm:inline">Hear Recipe</span>
          </button>

          <GameSoundToggle />

          <button
            onClick={onResetRecipe}
            className="p-2 bg-amber-950/85 hover:bg-amber-900 text-amber-200 hover:text-white rounded-xl backdrop-blur-md border border-amber-500/40 transition-all active:scale-95"
            title="Reset Cake"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Syllable Recipe Formulation */}
        <div className="bg-amber-950/90 border-2 border-amber-400/60 rounded-2xl px-6 py-2.5 backdrop-blur-md shadow-2xl flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="Recipe emoji">
            {recipe?.emoji || '🧁'}
          </span>
          <div className="flex items-center gap-2">
            {syllables.map((syl, index) => {
              const isStacked = index < stackedSyllables.length;
              const isNext = index === stackedSyllables.length;
              return (
                <React.Fragment key={`syl-${index}`}>
                  <div
                    className={`px-3 py-1 rounded-xl font-black text-base transition-all duration-300 ${
                      isStacked
                        ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.8)] scale-105 border border-rose-300'
                        : isNext
                        ? 'bg-amber-800/80 text-amber-200 border-2 border-dashed border-amber-400 animate-pulse'
                        : 'bg-amber-950/60 text-amber-500/60 border border-amber-800'
                    }`}
                  >
                    {isStacked ? syl : isNext ? '?' : syl}
                  </div>
                  {index < syllables.length - 1 && (
                    <span className="text-amber-400 font-extrabold text-sm">+</span>
                  )}
                </React.Fragment>
              );
            })}
            <span className="text-amber-400 font-extrabold text-sm">=</span>
            <span className="font-black text-lg text-amber-200 tracking-wider">
              {recipe?.name}
            </span>
          </div>
        </div>

        {/* Right: Score & Stars */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-950/85 border border-amber-500/40 rounded-xl px-3.5 py-2 flex items-center gap-2 backdrop-blur-md text-amber-300 font-bold text-sm shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{score} PTS</span>
            {streak > 1 && (
              <span className="bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full font-black">
                x{streak}
              </span>
            )}
          </div>
          <div className="bg-amber-950/85 border border-yellow-500/40 rounded-xl px-3.5 py-2 flex items-center gap-1.5 backdrop-blur-md text-yellow-300 font-bold text-sm shadow-lg">
            <span>⭐</span>
            <span>{stars}</span>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Celebration Banner when Cake Finished */}
      {isBakeComplete && (
        <div className="self-center bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-500 text-white px-8 py-4 rounded-3xl shadow-2xl border-2 border-amber-200 animate-bounce flex items-center gap-3">
          <Cake className="w-8 h-8 text-yellow-100" />
          <div>
            <h2 className="text-xl font-black tracking-wide">CAKE BAKED TO PERFECTION! 🎂</h2>
            <p className="text-sm text-yellow-100 font-medium">
              You stacked all syllables for {recipe?.name}! Happy baking!
            </p>
          </div>
        </div>
      )}

      {/* 3. BOTTOM: Guidance & Instructions */}
      <div className="flex items-end justify-between pointer-events-auto">
        <div className="bg-amber-950/85 border border-amber-700/60 rounded-xl p-3 max-w-sm text-xs text-amber-100 backdrop-blur-md shadow-lg">
          <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
            <Cake className="w-3.5 h-3.5 text-rose-400" /> Bakery Challenge:
          </p>
          <p>
            Click the floating cake tiers in syllable order to stack your compound cake onto the pedestal!
          </p>
        </div>

        <div className="bg-amber-950/90 border border-amber-400/50 rounded-2xl px-5 py-3 backdrop-blur-md text-right shadow-2xl">
          <p className="text-xs text-amber-400 font-bold">SYLLABLES STACKED</p>
          <p className="text-xl font-black text-white">
            {stackedSyllables.length} / {syllables.length}
          </p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Volume2, Sparkles, Rocket, ArrowLeft, RotateCcw } from 'lucide-react';
import GameSoundToggle from '../../../components/games/GameSoundToggle';

export default function CosmicMinerHUD({
  mission,
  collectedLetters = [],
  score = 0,
  stars = 0,
  streak = 1,
  fuelPercentage = 0,
  rocketLaunched = false,
  onSpeakPrompt,
  onResetMission,
  onBack,
}) {
  const targetWord = mission?.word || '';
  const letters = targetWord.split('');

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20 font-sans select-none">
      {/* 1. TOP HEADER: Navigation, Score, Stars */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Left: Back & Replay Audio */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-slate-700/60 shadow-lg transition-all active:scale-95"
            aria-label="Back to Games"
          >
            <ArrowLeft className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-semibold hidden sm:inline">Back</span>
          </button>

          <button
            onClick={onSpeakPrompt}
            className="flex items-center gap-2 bg-indigo-600/80 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-indigo-400/40 shadow-lg transition-all active:scale-95"
            title="Hear Voice Guidance"
          >
            <Volume2 className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="text-sm font-medium hidden sm:inline">Voice Hint</span>
          </button>

          <GameSoundToggle />

          <button
            onClick={onResetMission}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-slate-700/60 transition-all active:scale-95"
            title="Reset Word"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Mission Word Spell Tablet */}
        <div className="bg-slate-900/90 border-2 border-cyan-500/50 rounded-2xl px-6 py-2.5 backdrop-blur-md shadow-2xl flex items-center gap-4">
          <span className="text-2xl" role="img" aria-label="Mission Icon">
            {mission?.emoji || '🚀'}
          </span>
          <div className="flex items-center gap-2">
            {letters.map((char, index) => {
              const isCollected = index < collectedLetters.length;
              const isNext = index === collectedLetters.length;
              return (
                <div
                  key={`letter-${index}`}
                  className={`w-10 h-11 flex items-center justify-center rounded-lg font-black text-xl transition-all duration-300 ${
                    isCollected
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.7)] scale-105 border-2 border-amber-200'
                      : isNext
                      ? 'bg-cyan-950/80 text-cyan-300 border-2 border-dashed border-cyan-400 animate-pulse'
                      : 'bg-slate-800/60 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isCollected ? char : isNext ? '?' : '_'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Score & Stars */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 border border-amber-500/40 rounded-xl px-3.5 py-2 flex items-center gap-2 backdrop-blur-md text-amber-300 font-bold text-sm shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{score} PTS</span>
            {streak > 1 && (
              <span className="bg-amber-500 text-slate-950 text-xs px-1.5 py-0.5 rounded-full font-black">
                x{streak}
              </span>
            )}
          </div>
          <div className="bg-slate-900/80 border border-yellow-500/40 rounded-xl px-3.5 py-2 flex items-center gap-1.5 backdrop-blur-md text-yellow-300 font-bold text-sm shadow-lg">
            <span>⭐</span>
            <span>{stars}</span>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Launch Alert Banner if Complete */}
      {rocketLaunched && (
        <div className="self-center bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white px-8 py-4 rounded-3xl shadow-2xl border-2 border-amber-300 animate-bounce flex items-center gap-3">
          <Rocket className="w-8 h-8 text-amber-200" />
          <div>
            <h2 className="text-xl font-black tracking-wide">ROCKET LAUNCH SUCCESS! 🚀</h2>
            <p className="text-sm text-amber-100 font-medium">
              You mined all crystals for {targetWord}! Fuel at 100%!
            </p>
          </div>
        </div>
      )}

      {/* 3. BOTTOM: Rocket Fuel Gauge & Hint */}
      <div className="flex items-end justify-between pointer-events-auto">
        {/* Driving / Clicking Controls Hint */}
        <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 max-w-xs text-xs text-slate-300 backdrop-blur-md shadow-lg hidden sm:block">
          <p className="font-semibold text-cyan-300 mb-1">🎮 How to Play:</p>
          <p>Tap a crystal or drive with <span className="text-amber-300 font-bold">Arrow Keys / WASD</span> to mine letters in order!</p>
        </div>

        {/* Rocket Fuel Tank Bar */}
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-4 backdrop-blur-md w-72 sm:w-80 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Rocket className="w-4 h-4 text-cyan-400" />
              ROCKET FUEL TANK
            </span>
            <span className={fuelPercentage === 100 ? 'text-green-400' : 'text-amber-400'}>
              {Math.round(fuelPercentage)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                fuelPercentage === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_12px_rgba(34,197,94,0.8)]'
                  : 'bg-gradient-to-r from-cyan-500 to-amber-400'
              }`}
              style={{ width: `${fuelPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 italic text-center">
            {mission?.meaning || 'Explore the craters and mine glowing crystals!'}
          </p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Volume2, Sparkles, ArrowLeft, RotateCcw, CloudSun } from 'lucide-react';
import GameSoundToggle from '../../../components/games/GameSoundToggle';

export default function CloudHUD({
  level,
  altitude = 20,
  score = 0,
  stars = 0,
  streak = 1,
  isSummitReached = false,
  onSpeakPrompt,
  onResetBounce,
  onBack,
}) {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20 font-sans select-none">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Left: Back & Voice */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-sky-900/85 hover:bg-sky-800 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-sky-400/40 shadow-lg transition-all active:scale-95"
            aria-label="Back to Games"
          >
            <ArrowLeft className="w-5 h-5 text-sky-200" />
            <span className="text-sm font-semibold hidden sm:inline">Back</span>
          </button>

          <button
            onClick={onSpeakPrompt}
            className="flex items-center gap-2 bg-indigo-500/85 hover:bg-indigo-400 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-indigo-300/40 shadow-lg transition-all active:scale-95"
            title="Hear Voice Hint"
          >
            <Volume2 className="w-5 h-5 text-yellow-300 animate-pulse" />
            <span className="text-sm font-medium hidden sm:inline">Hear Sight Word</span>
          </button>

          <GameSoundToggle />

          <button
            onClick={onResetBounce}
            className="p-2 bg-sky-900/85 hover:bg-sky-800 text-sky-200 hover:text-white rounded-xl backdrop-blur-md border border-sky-400/40 transition-all active:scale-95"
            title="Reset Bounce"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Target Sight Word Banner */}
        <div className="bg-sky-900/90 border-2 border-amber-300/80 rounded-2xl px-6 py-2.5 backdrop-blur-md shadow-2xl flex items-center gap-4">
          <span className="text-2xl" role="img" aria-label="Star icon">
            {level?.emoji || '⭐'}
          </span>
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-200">
              Jump to the cloud:
            </span>
            <span className="text-2xl font-black text-amber-300 tracking-wider">
              {level?.targetWord}
            </span>
          </div>
        </div>

        {/* Right: Score & Stars */}
        <div className="flex items-center gap-3">
          <div className="bg-sky-900/85 border border-amber-400/40 rounded-xl px-3.5 py-2 flex items-center gap-2 backdrop-blur-md text-amber-300 font-bold text-sm shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{score} PTS</span>
            {streak > 1 && (
              <span className="bg-amber-400 text-sky-950 text-xs px-1.5 py-0.5 rounded-full font-black">
                x{streak}
              </span>
            )}
          </div>
          <div className="bg-sky-900/85 border border-yellow-400/40 rounded-xl px-3.5 py-2 flex items-center gap-1.5 backdrop-blur-md text-yellow-300 font-bold text-sm shadow-lg">
            <span>⭐</span>
            <span>{stars}</span>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Summit Celebration Banner */}
      {isSummitReached && (
        <div className="self-center bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 text-white px-8 py-4 rounded-3xl shadow-2xl border-2 border-yellow-200 animate-bounce flex items-center gap-3">
          <span className="text-4xl">🌈</span>
          <div>
            <h2 className="text-xl font-black tracking-wide">RAINBOW SUMMIT REACHED! ⭐</h2>
            <p className="text-sm text-yellow-100 font-medium">
              Bouncy Bunny reached the star cloud with {level?.targetWord}!
            </p>
          </div>
        </div>
      )}

      {/* 3. BOTTOM: Guidance & Altitude Meter */}
      <div className="flex items-end justify-between pointer-events-auto">
        <div className="bg-sky-900/85 border border-sky-700/60 rounded-xl p-3 max-w-sm text-xs text-sky-100 backdrop-blur-md shadow-lg">
          <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
            <CloudSun className="w-3.5 h-3.5 text-amber-400" /> Cloud Jumper Mission:
          </p>
          <p>
            Click the cloud that matches the target sight word to spring bunny upwards to the rainbow summit!
          </p>
        </div>

        <div className="bg-sky-900/90 border border-sky-400/50 rounded-2xl px-5 py-3 backdrop-blur-md text-right shadow-2xl">
          <p className="text-xs text-sky-300 font-bold">ALTITUDE</p>
          <p className="text-xl font-black text-amber-300">
            {altitude} METERS
          </p>
        </div>
      </div>
    </div>
  );
}

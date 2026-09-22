import React from 'react';
import { Volume2, Sparkles, Camera, ArrowLeft, RotateCcw, Crosshair } from 'lucide-react';
import GameSoundToggle from '../../../components/games/GameSoundToggle';

export default function SafariHUD({
  target,
  photosSnapped = 0,
  score = 0,
  stars = 0,
  streak = 1,
  showFlash = false,
  isPhotoComplete = false,
  onSpeakPrompt,
  onResetSafari,
  onSnapCurrent,
  onBack,
}) {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20 font-sans select-none">
      {/* Flash overlay */}
      {showFlash && (
        <div className="absolute inset-0 bg-white/90 z-50 transition-opacity duration-300 pointer-events-none" />
      )}

      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Left: Back & Voice */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-stone-900/85 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-amber-600/40 shadow-lg transition-all active:scale-95"
            aria-label="Back to Games"
          >
            <ArrowLeft className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold hidden sm:inline">Back</span>
          </button>

          <button
            onClick={onSpeakPrompt}
            className="flex items-center gap-2 bg-amber-600/85 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-amber-300/40 shadow-lg transition-all active:scale-95"
            title="Hear Safari Guide Radio"
          >
            <Volume2 className="w-5 h-5 text-amber-200 animate-pulse" />
            <span className="text-sm font-medium hidden sm:inline">Hear Guide</span>
          </button>

          <GameSoundToggle />

          <button
            onClick={onResetSafari}
            className="p-2 bg-stone-900/85 hover:bg-stone-800 text-stone-300 hover:text-white rounded-xl backdrop-blur-md border border-amber-600/40 transition-all active:scale-95"
            title="Reset Animal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Safari Ranger Radio Clue */}
        <div className="bg-stone-900/90 border-2 border-amber-500/60 rounded-2xl px-6 py-2.5 backdrop-blur-md shadow-2xl flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="Animal icon">
            {target?.emoji || '🦁'}
          </span>
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
              Spot animal starting with {target?.sound}
            </span>
            <span className="text-xl font-black text-white tracking-wide">
              {target?.letter} - {target?.animal}
            </span>
          </div>
        </div>

        {/* Right: Score & Stars */}
        <div className="flex items-center gap-3">
          <div className="bg-stone-900/85 border border-amber-500/40 rounded-xl px-3.5 py-2 flex items-center gap-2 backdrop-blur-md text-amber-300 font-bold text-sm shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{score} PTS</span>
            {streak > 1 && (
              <span className="bg-amber-500 text-stone-950 text-xs px-1.5 py-0.5 rounded-full font-black">
                x{streak}
              </span>
            )}
          </div>
          <div className="bg-stone-900/85 border border-yellow-500/40 rounded-xl px-3.5 py-2 flex items-center gap-1.5 backdrop-blur-md text-yellow-300 font-bold text-sm shadow-lg">
            <span>⭐</span>
            <span>{stars}</span>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Camera Reticle Viewfinder Brackets */}
      <div className="self-center flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-64 h-64 sm:w-80 sm:h-80 border-2 border-dashed border-white rounded-3xl flex items-center justify-center">
          <Crosshair className="w-10 h-10 text-white animate-pulse" />
        </div>
      </div>

      {/* Photo Success Toast */}
      {isPhotoComplete && (
        <div className="self-center bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-500 text-stone-950 px-8 py-4 rounded-3xl shadow-2xl border-2 border-white animate-bounce flex items-center gap-3 pointer-events-auto">
          <Camera className="w-8 h-8 text-stone-900" />
          <div>
            <h2 className="text-xl font-black tracking-wide">PERFECT PHOTO CAPTURED! 📸</h2>
            <p className="text-sm font-extrabold text-stone-900">
              {target?.fact}
            </p>
          </div>
        </div>
      )}

      {/* 3. BOTTOM: Shutter Snap Button & Album Counter */}
      <div className="flex items-end justify-between pointer-events-auto">
        <div className="bg-stone-900/85 border border-amber-700/60 rounded-xl p-3 max-w-sm text-xs text-stone-300 backdrop-blur-md shadow-lg hidden sm:block">
          <p className="font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-amber-400" /> Wildlife Photographer:
          </p>
          <p>
            Tap the target animal or press SNAP to capture the animal for your safari photo album!
          </p>
        </div>

        {/* Snap Shutter Button */}
        <button
          onClick={onSnapCurrent}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3.5 rounded-full font-black text-sm shadow-[0_0_20px_rgba(239,68,68,0.7)] border-4 border-white active:scale-90 transition-all cursor-pointer"
        >
          <Camera className="w-5 h-5" />
          <span>SNAP PHOTO</span>
        </button>

        <div className="bg-stone-900/90 border border-amber-500/50 rounded-2xl px-5 py-3 backdrop-blur-md text-right shadow-2xl">
          <p className="text-xs text-amber-400 font-bold">ALBUM PHOTOS</p>
          <p className="text-xl font-black text-white">
            {photosSnapped} / 5
          </p>
        </div>
      </div>
    </div>
  );
}

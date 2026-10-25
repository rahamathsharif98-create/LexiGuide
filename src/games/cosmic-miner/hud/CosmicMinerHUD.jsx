import React, { useState } from 'react';
import {
  Volume2,
  Sparkles,
  Rocket,
  ArrowLeft,
  RotateCcw,
  Map,
  Trophy,
  CheckCircle2,
  Lock,
  ChevronRight,
  Play,
  X,
  Star,
} from 'lucide-react';
import GameSoundToggle from '../../../components/games/GameSoundToggle';

export default function CosmicMinerHUD({
  mission,
  missionIndex = 0,
  totalMissions = 12,
  stages = [],
  highestUnlockedIndex = 0,
  collectedLetters = [],
  score = 0,
  stars = 0,
  streak = 1,
  fuelPercentage = 0,
  rocketLaunched = false,
  stageCelebration = null,
  isGameComplete = false,
  onContinueNextStage,
  onPlayAgain,
  onSelectStage,
  onSpeakPrompt,
  onResetMission,
  onBack,
}) {
  const [showRoadmap, setShowRoadmap] = useState(false);

  const targetWord = mission?.word || '';
  const letters = targetWord.split('');
  const currentStageNumber = mission?.stage || Math.floor(missionIndex / 4) + 1;
  const currentStageName = mission?.stageName || 'Lunar Cadets';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4 z-20 font-sans select-none overflow-hidden">
      {/* 1. TOP HEADER: Navigation, Mission Details, Spell Tablet, Score */}
      <div className="flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 text-white px-3 py-2 rounded-xl backdrop-blur-md border border-slate-700/60 shadow-lg transition-all active:scale-95 cursor-pointer"
            aria-label="Back to Games"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span className="text-xs sm:text-sm font-bold hidden sm:inline">Back</span>
          </button>

          <button
            type="button"
            onClick={onSpeakPrompt}
            className="flex items-center gap-1.5 bg-indigo-600/85 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl backdrop-blur-md border border-indigo-400/40 shadow-lg transition-all active:scale-95 cursor-pointer"
            title="Hear Voice Guidance"
          >
            <Volume2 className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold hidden md:inline">Voice Hint</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRoadmap(true)}
            className="flex items-center gap-1.5 bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 px-3 py-2 rounded-xl backdrop-blur-md border border-cyan-500/40 shadow-lg transition-all active:scale-95 cursor-pointer"
            title="View Mission Roadmap"
          >
            <Map className="w-4 h-4 text-cyan-300" />
            <span className="text-xs sm:text-sm font-bold hidden lg:inline">Roadmap</span>
          </button>

          <GameSoundToggle />

          <button
            type="button"
            onClick={onResetMission}
            className="p-2 bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl backdrop-blur-md border border-slate-700/60 transition-all active:scale-95 cursor-pointer"
            title="Reset Word"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Mission Tablet & Letter Slots */}
        <div className="bg-slate-900/95 border-2 border-cyan-500/50 rounded-2xl px-4 sm:px-6 py-2 backdrop-blur-md shadow-2xl flex flex-col items-center">
          {/* Mission & Stage Badge */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold text-[11px] border border-cyan-400/30">
              Stage {currentStageNumber}: {currentStageName}
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              Mission {missionIndex + 1}/{totalMissions}
            </span>
            <span className="text-xs font-black text-amber-400 hidden sm:inline">
              • {mission?.name}
            </span>
          </div>

          {/* Letter Slots */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl mr-1" role="img" aria-label="Mission Icon">
              {mission?.emoji || '🚀'}
            </span>
            {letters.map((char, index) => {
              const isCollected = index < collectedLetters.length;
              const isNext = index === collectedLetters.length;
              const isCompact = letters.length > 7;
              return (
                <div
                  key={`letter-${index}`}
                  className={`flex items-center justify-center rounded-lg font-black transition-all duration-300 ${
                    isCompact
                      ? 'w-7 sm:w-8 h-8 sm:h-9 text-base'
                      : 'w-8 sm:w-10 h-9 sm:h-11 text-lg sm:text-xl'
                  } ${
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

        {/* Right Stats: Score & Stars */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/85 border border-amber-500/40 rounded-xl px-3 py-2 flex items-center gap-1.5 backdrop-blur-md text-amber-300 font-bold text-xs sm:text-sm shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{score} PTS</span>
            {streak > 1 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] px-1 py-0.5 rounded-full font-black">
                x{streak}
              </span>
            )}
          </div>
          <div className="bg-slate-900/85 border border-yellow-500/40 rounded-xl px-3 py-2 flex items-center gap-1.5 backdrop-blur-md text-yellow-300 font-bold text-xs sm:text-sm shadow-lg">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{stars}</span>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Launch Alert Banner if Complete */}
      {rocketLaunched && !stageCelebration && !isGameComplete && (
        <div className="self-center bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white px-6 sm:px-8 py-3.5 rounded-3xl shadow-2xl border-2 border-amber-300 animate-bounce flex items-center gap-3">
          <Rocket className="w-7 h-7 text-amber-200" />
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-wide">ROCKET LAUNCH SUCCESS! 🚀</h2>
            <p className="text-xs sm:text-sm text-amber-100 font-medium">
              You mined all crystals for {targetWord}! Fuel at 100%!
            </p>
          </div>
        </div>
      )}

      {/* 3. STAGE COMPLETION MODAL (After Mission 4 & 8) */}
      {stageCelebration && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md pointer-events-auto">
          <div className="relative max-w-sm sm:max-w-md w-full max-h-[92%] overflow-y-auto bg-gradient-to-b from-slate-900 to-[#070d1e] border-2 border-cyan-400 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.4)] text-center text-white space-y-2.5 sm:space-y-3.5 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-2xl sm:text-3xl shadow-inner">
              ⭐
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-cyan-400/40">
                Stage {stageCelebration.completedStageNum} Complete
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-cyan-200 mt-1">
                {stageCelebration.completedStageName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 sm:mt-1.5 leading-relaxed">
                Outstanding piloting! You mastered all 4 missions in this sector. Fuel tanks are primed for the next frontier!
              </p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-800/80 border border-cyan-500/30 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Next Sector Unlocked:</span>
              <span className="text-cyan-300 font-black">
                Stage {stageCelebration.nextStageNum}: {stageCelebration.nextStageName}
              </span>
            </div>

            <button
              type="button"
              onClick={onContinueNextStage}
              className="w-full py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-base shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue to Stage {stageCelebration.nextStageNum}</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. FINAL VICTORY MODAL (Only after Mission 12) */}
      {isGameComplete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md pointer-events-auto">
          <div className="relative max-w-sm sm:max-w-md w-full max-h-[94%] overflow-y-auto bg-gradient-to-b from-slate-900 via-indigo-950/80 to-[#040817] border-2 sm:border-3 border-amber-400 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_0_60px_rgba(245,158,11,0.5)] text-center text-white space-y-2.5 sm:space-y-3.5 animate-in fade-in zoom-in-95 duration-400">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl sm:rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl sm:text-4xl shadow-[0_0_30px_rgba(245,158,11,0.6)]">
              🏆
            </div>

            <div>
              <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-amber-400/40">
                Deep Space Exploration Complete
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                Galactic Master Champion!
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                Magnificent! You completed all 12 space missions across all 3 galactic stages! The rocket is fully fueled for deep cosmic voyaging!
              </p>
            </div>

            {/* Final Stats Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 py-0.5">
              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block">Final Score</span>
                <span className="text-base sm:text-lg font-black text-amber-400">{score}</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block">Stars Earned</span>
                <span className="text-base sm:text-lg font-black text-yellow-300">{stars} ⭐</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block">Missions</span>
                <span className="text-base sm:text-lg font-black text-cyan-300">12 / 12</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 pt-1">
              <button
                type="button"
                onClick={onPlayAgain}
                className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-600 shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
                <span>Back to Games</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ROADMAP MODAL: Stage & Mission Selection */}
      {showRoadmap && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md pointer-events-auto">
          <div className="relative max-w-sm sm:max-w-lg w-full bg-slate-900 border-2 border-cyan-500/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl text-white space-y-3 max-h-[92%] overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base sm:text-lg font-black text-cyan-200">Galactic Mission Roadmap</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRoadmap(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {stages.map((stg) => {
                const stageStartIdx = (stg.stage - 1) * 4;
                const isUnlocked = stg.stage === 1 || highestUnlockedIndex >= stageStartIdx;
                const isCompleted = highestUnlockedIndex >= stageStartIdx + 4 || isGameComplete;
                const isCurrent = currentStageNumber === stg.stage;

                return (
                  <div
                    key={`stage-card-${stg.stage}`}
                    onClick={() => {
                      if (isUnlocked && onSelectStage) {
                        onSelectStage(stageStartIdx);
                        setShowRoadmap(false);
                      }
                    }}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                      !isUnlocked
                        ? 'bg-slate-950/60 border-slate-800/80 opacity-60 cursor-not-allowed'
                        : isCurrent
                        ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] cursor-pointer hover:scale-[1.01]'
                        : 'bg-slate-800/60 border-slate-700 hover:border-cyan-500/50 cursor-pointer hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                        {stg.icon || '🪐'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 shrink-0">
                            Stage {stg.stage}
                          </span>
                          <span className="font-extrabold text-xs sm:text-base text-white truncate">
                            {stg.name}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 max-w-sm truncate sm:whitespace-normal">
                          {stg.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isCompleted ? (
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/30">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Complete</span>
                        </div>
                      ) : isUnlocked ? (
                        <div className="flex items-center gap-1 text-cyan-300 text-xs font-bold bg-cyan-500/10 px-2.5 py-1.5 rounded-xl border border-cyan-500/30">
                          <Play className="w-4 h-4 fill-cyan-300" />
                          <span>{isCurrent ? 'Active' : 'Play'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                          <Lock className="w-4 h-4" />
                          <span className="hidden sm:inline">Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. BOTTOM: Rocket Fuel Gauge & Controls Guidance */}
      <div className="flex items-end justify-between pointer-events-auto gap-2">
        {/* Driving / Clicking Controls Hint */}
        <div className="bg-slate-900/85 border border-slate-700/60 rounded-xl p-2.5 sm:p-3 max-w-[45%] text-[10px] sm:text-xs text-slate-300 backdrop-blur-md shadow-lg hidden sm:block">
          <p className="font-semibold text-cyan-300 mb-0.5">🎮 How to Play:</p>
          <p className="truncate sm:whitespace-normal">
            Tap crystal or drive with <span className="text-amber-300 font-bold">Arrow Keys / WASD</span>!
          </p>
        </div>

        {/* Rocket Fuel Tank Bar */}
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-2.5 sm:p-3.5 backdrop-blur-md w-48 sm:w-64 max-w-[50%] shadow-2xl">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-300 mb-1">
            <span className="flex items-center gap-1.5 text-cyan-300 truncate">
              <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
              <span className="truncate">ROCKET FUEL</span>
            </span>
            <span className={fuelPercentage === 100 ? 'text-green-400' : 'text-amber-400'}>
              {Math.round(fuelPercentage)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 sm:h-3.5 overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                fuelPercentage === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_12px_rgba(34,197,94,0.8)]'
                  : 'bg-gradient-to-r from-cyan-500 to-amber-400'
              }`}
              style={{ width: `${fuelPercentage}%` }}
            />
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 sm:mt-1.5 italic text-center truncate">
            {mission?.meaning || 'Explore craters & mine crystals!'}
          </p>
        </div>
      </div>
    </div>
  );
}

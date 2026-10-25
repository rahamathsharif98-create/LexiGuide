import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import SpiderHUD from './hud/SpiderHUD';
import SpiderWorld from './SpiderWorld';
import { SPIDER_LEVELS, getSpiderLevel } from './engine/spiderLevels';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';
import { Sparkles, Star, RotateCcw, ArrowLeft } from 'lucide-react';

/**
 * SpiderApp.jsx
 * Full interactive game engine for "Spinny the Spider: Web Weaver"
 */
export default function SpiderApp({ onBack, onRoundComplete, onGameComplete, onResetSession }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = useMemo(() => getSpiderLevel(levelIndex), [levelIndex]);

  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(1);
  const [selectedRime, setSelectedRime] = useState(null);
  const [wrongRime, setWrongRime] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [spiderState, setSpiderState] = useState('idle');

  // VFX
  const [burstPos, setBurstPos] = useState([0, 2.5, 0]);
  const [burstKey, setBurstKey] = useState(0);
  const [floatingText, setFloatingText] = useState('SILKY WEAVE!');
  const [floatingTextKey, setFloatingTextKey] = useState(0);

  // Synchronous guards against rapid duplicate clicks and duplicate round-completion events
  const roundLockRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Timer refs to prevent timeout races and ensure cleanup on unmount
  const transitionTimerRef = useRef(null);
  const sparkleTimerRef = useRef(null);
  const oopsTimerRef = useRef(null);

  // Clean up all pending timers on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (sparkleTimerRef.current) clearTimeout(sparkleTimerRef.current);
      if (oopsTimerRef.current) clearTimeout(oopsTimerRef.current);
    };
  }, []);

  // Shuffled options per level
  const [shuffledOptions, setShuffledOptions] = useState([]);

  // Initialize level
  const initLevel = useCallback((level) => {
    // Clear any pending timers from previous level
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (sparkleTimerRef.current) clearTimeout(sparkleTimerRef.current);
    if (oopsTimerRef.current) clearTimeout(oopsTimerRef.current);

    roundLockRef.current = false;
    isProcessingRef.current = false;

    const opts = [...level.options].sort(() => Math.random() - 0.5);
    setShuffledOptions(opts);
    setSelectedRime(null);
    setWrongRime(null);
    setIsError(false);
    setIsVictory(false);
    setSpiderState('idle');

    // Companion guidance
    gameSound.speakCompanion(level.audioPrompt);
  }, []);

  useEffect(() => {
    initLevel(currentLevel);
  }, [currentLevel, initLevel]);

  // Replay speech prompt
  const handleReplayPrompt = useCallback(() => {
    gameSound.speakCompanion(currentLevel.audioPrompt);
  }, [currentLevel]);

  // Handle child selecting a dewdrop rime node
  const handleSelectOption = useCallback(
    (option) => {
      if (roundLockRef.current || isProcessingRef.current || isVictory || isGameComplete) return;

      const isCorrect = option === currentLevel.targetRime;

      if (isCorrect) {
        // Synchronously lock immediately before any async state updates to block rapid clicks
        roundLockRef.current = true;
        isProcessingRef.current = true;

        setSelectedRime(option);
        setWrongRime(null);
        setIsError(false);

        // Clear any running oops timer so victory animation is never overridden
        if (oopsTimerRef.current) clearTimeout(oopsTimerRef.current);

        const isFever = streak >= 2;
        gameSound.playSnap();
        gameSound.playLetterNote(streak);
        sparkleTimerRef.current = setTimeout(() => gameSound.playSparkle(), 180);

        setBurstPos([0, 2.8, 0]);
        setBurstKey(Date.now());
        setFloatingText(isFever ? 'SILK COMBO! 2X' : 'SILKY WEAVE! ✨');
        setFloatingTextKey(Date.now());

        setSpiderState('victory');
        setIsVictory(true);

        const earnedStars = 1;
        const earnedXp = 25;
        const roundScore = 250 * (isFever ? 2 : 1);
        const nextScore = score + roundScore;
        const nextStars = stars + earnedStars;

        setScore(nextScore);
        setStars(nextStars);
        setStreak((prev) => Math.min(prev + 1, 5));

        // Trigger telemetry & persistence
        onRoundComplete?.({
          isCorrect: true,
          level: currentLevel,
          stars: earnedStars,
          xp: earnedXp,
          score: roundScore,
          targetWord: currentLevel.targetWord,
        });

        // Advance to next level or show victory completion screen after celebration
        transitionTimerRef.current = setTimeout(() => {
          if (levelIndex < SPIDER_LEVELS.length - 1) {
            setLevelIndex((prev) => prev + 1);
          } else {
            // Completed final level (Level 11) - show victory completion screen
            setIsGameComplete(true);
            setSpiderState('victory');
            gameSound.playFanfare();
            gameSound.speakCompanion('Amazing job! You wove all the spider webs!');
            onGameComplete?.({
              score: nextScore,
              stars: nextStars,
              streak: Math.min(streak + 1, 5),
              completed: true,
              details: { completed: true },
            });
          }
        }, 1800);
      } else {
        // Gentle comforting oops & clear red error indication
        isProcessingRef.current = true;
        setSelectedRime(option);
        setWrongRime(option);
        setIsError(true);

        // Position error visual near the chosen node
        const optionIndex = shuffledOptions.indexOf(option);
        const nodePositions = [
          [-3.2, 2.6, 0.1],
          [0.0, 4.0, 0.1],
          [3.2, 2.6, 0.1],
        ];
        const errorPos = nodePositions[optionIndex] || [0, 2.5, 0];
        setBurstPos(errorPos);
        setBurstKey(Date.now());
        setFloatingText('TRY AGAIN!');
        setFloatingTextKey(Date.now());

        gameSound.playGentleOops();
        gameSound.speakCompanion('Try again!');
        setSpiderState('weaving');
        setStreak(1);

        onRoundComplete?.({
          isCorrect: false,
          level: currentLevel,
          stars: 0,
          xp: 5,
          score: 0,
          targetWord: currentLevel.targetWord,
        });

        if (oopsTimerRef.current) clearTimeout(oopsTimerRef.current);
        oopsTimerRef.current = setTimeout(() => {
          setSelectedRime(null);
          setWrongRime(null);
          setIsError(false);
          setSpiderState('idle');
          isProcessingRef.current = false;
        }, 900);
      }
    },
    [isVictory, isGameComplete, streak, currentLevel, levelIndex, shuffledOptions, score, stars, onRoundComplete, onGameComplete]
  );

  const handlePlayAgain = useCallback(() => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (sparkleTimerRef.current) clearTimeout(sparkleTimerRef.current);
    if (oopsTimerRef.current) clearTimeout(oopsTimerRef.current);

    setIsGameComplete(false);
    setSelectedRime(null);
    setWrongRime(null);
    setIsError(false);
    setIsVictory(false);
    setSpiderState('idle');
    setScore(0);
    setStars(0);
    setStreak(1);
    roundLockRef.current = false;
    isProcessingRef.current = false;
    onResetSession?.();

    if (levelIndex === 0) {
      initLevel(getSpiderLevel(0));
    } else {
      setLevelIndex(0);
    }
  }, [levelIndex, initLevel, onResetSession]);

  const handleExitGame = useCallback(() => {
    onBack?.();
  }, [onBack]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* 1. Interactive 3D World Canvas */}
      <SpiderWorld
        level={currentLevel}
        options={shuffledOptions}
        selectedRime={selectedRime}
        wrongRime={wrongRime}
        isError={isError}
        spiderState={spiderState}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        isVictory={isVictory}
        onSelectOption={handleSelectOption}
      />

      {/* 2. Tactile Child HUD */}
      <SpiderHUD
        level={currentLevel}
        levelIndex={levelIndex}
        totalLevels={SPIDER_LEVELS.length}
        score={score}
        stars={stars}
        streak={streak}
        selectedRime={selectedRime}
        isVictory={isVictory}
        isError={isError}
        onReplayPrompt={handleReplayPrompt}
      />

      {/* 3. Screen Confetti on victory or completion */}
      <VFXScreenConfetti active={isVictory || isGameComplete} count={isGameComplete ? 48 : 36} />

      {/* 4. Fever Mode Visual Overlay on streak >= 3 */}
      <VFXFeverOverlay streak={streak} active={streak >= 3} />

      {/* 5. Final Level Victory & Completion Modal */}
      {isGameComplete && (
        <div
          data-testid="spider-completion-screen"
          className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in pointer-events-auto"
        >
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-purple-500/60 shadow-[0_20px_60px_rgba(168,85,247,0.4)] text-center text-white">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-950/80 border-2 border-purple-400/60 flex items-center justify-center text-4xl mb-4 shadow-inner">
              🏆
            </div>
            <div className="text-xs font-black text-purple-400 uppercase tracking-widest mb-1">
              Web Weaver Champion! 🎉
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-2">
              Master of the Web!
            </h2>
            <p className="text-slate-300 text-sm font-medium mb-6">
              Spinny cheers: You wove all 11 glistening spider webs!
            </p>

            {/* Stats summary */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-purple-400/30">
                <Star size={20} className="fill-amber-400 text-amber-400" />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Stars</div>
                  <div className="text-base font-black text-amber-300" data-testid="final-stars">{stars}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-purple-400/30">
                <Sparkles size={20} className="text-emerald-400" />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Final Score</div>
                  <div className="text-base font-black text-emerald-300 font-mono" data-testid="final-score">{score} pts</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                data-testid="play-again-btn"
                onClick={handlePlayAgain}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw size={18} />
                <span>Play Again</span>
              </button>
              <button
                type="button"
                data-testid="back-to-games-btn"
                onClick={handleExitGame}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-sm transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft size={18} />
                <span>Back to Games</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

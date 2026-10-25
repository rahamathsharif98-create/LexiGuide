import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import CloudHUD from './hud/CloudHUD';
import CloudWorld from './CloudWorld';
import { BOUNCE_LEVELS, getBounceLevel } from './engine/sightWordBounces';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';
import { RotateCcw, ArrowLeft, Sparkles, Star } from 'lucide-react';

export default function CloudApp({ onBack, onRoundComplete, onGameComplete, onResetSession }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = useMemo(() => getBounceLevel(levelIndex), [levelIndex]);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(1);
  const [altitude, setAltitude] = useState(25);
  const [isSummitReached, setIsSummitReached] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [bunnyPos, setBunnyPos] = useState([0, 1.0, 0]);
  const [mascotState, setMascotState] = useState('idle');
  const [floatingText, setFloatingText] = useState('SUPER BOUNCE!');
  const [floatingTextKey, setFloatingTextKey] = useState(0);

  // Platforms
  const [platforms, setPlatforms] = useState([]);

  // VFX State
  const [burstPos, setBurstPos] = useState([0, 2.5, -1]);
  const [burstKey, setBurstKey] = useState(0);

  // Synchronous guard: prevents rapid duplicate clicks from scoring twice in the same round
  const roundLockRef = useRef(false);

  // Timer refs to prevent timeout races and ensure cleanup on unmount
  const transitionTimerRef = useRef(null);
  const mascotTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);
    };
  }, []);

  // Initialize platforms
  const initLevelPlatforms = useCallback((level) => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);

    const shuffledOptions = [...level.options].sort(() => Math.random() - 0.5);

    // Arranged in an ascending trio
    const cloudCoords = [
      [-4.2, 2.2, -1],
      [0, 3.2, -3],
      [4.2, 2.2, -1],
    ];

    const generated = shuffledOptions.map((word, idx) => ({
      id: `cloud-${level.id}-${word}-${idx}`,
      word,
      isTarget: word === level.targetWord,
      pos: cloudCoords[idx],
      isBounced: false,
    }));

    setPlatforms(generated);
    setIsSummitReached(false);
    setBunnyPos([0, 0.5, 2]);
    roundLockRef.current = false;

    // Gentle companion guidance
    gameSound.speakCompanion(level.speechText);
  }, []);

  useEffect(() => {
    initLevelPlatforms(currentLevel);
  }, [currentLevel, initLevelPlatforms]);

  // Handle bouncing on cloud
  const handleBounceCloud = useCallback(
    (cloud) => {
      if (isSummitReached || roundLockRef.current || isGameComplete) return;

      if (cloud.isTarget) {
        // Lock synchronously before any async state updates to prevent rapid duplicate scoring
        roundLockRef.current = true;

        // Correct cloud!
        gameSound.playBounce();
        gameSound.playLetterNote(streak);

        setBurstPos(cloud.pos || [0, 2.5, -1]);
        setBurstKey(Date.now());

        // Mascot cheer & floating comic text
        const isFever = streak >= 2;
        setFloatingText(isFever ? 'CLOUD COMBO! 2X' : 'SUPER BOUNCE!');
        setFloatingTextKey(Date.now());
        setMascotState('celebrate');
        if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);
        mascotTimerRef.current = setTimeout(() => setMascotState('idle'), 1200);

        setBunnyPos(cloud.pos);
        const roundScore = 200 * (isFever ? 2 : 1);
        const nextScore = score + roundScore;
        const nextStars = stars + 1;
        const nextAltitude = altitude + 50;

        setScore(nextScore);
        setStreak((prev) => Math.min(prev + 1, 5));
        setAltitude(nextAltitude);

        setPlatforms((prev) =>
          prev.map((p) => (p.id === cloud.id ? { ...p, isBounced: true } : p))
        );

        setIsSummitReached(true);
        setStars(nextStars);
        setFloatingText('SUMMIT STAR! ⭐');
        setFloatingTextKey(Date.now());
        setMascotState('victory');

        onRoundComplete?.({
          isCorrect: true,
          level: currentLevel,
          stars: 1,
          xp: 25,
          score: roundScore,
        });

        // Victory fanfare and sweet cheer
        gameSound.playFanfare();
        gameSound.speakCompanion(`Boing! Super bounce! You matched ${currentLevel.targetWord}!`);

        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = setTimeout(() => {
          if (levelIndex < BOUNCE_LEVELS.length - 1) {
            setLevelIndex((prev) => prev + 1);
            setMascotState('idle');
          } else {
            // Completed final level (Level 5) - show victory completion screen
            setIsGameComplete(true);
            setMascotState('victory');
            gameSound.playFanfare();
            gameSound.speakCompanion('Rainbow Summit reached! You completed all the cloud jumps!');
            onGameComplete?.({
              score: nextScore,
              stars: nextStars,
              streak: Math.min(streak + 1, 5),
              completed: true,
              details: { completed: true, altitude: nextAltitude },
            });
          }
        }, 3200);
      } else {
        // Incorrect cloud
        onRoundComplete?.({
          isCorrect: false,
          level: currentLevel,
        });

        setStreak(1);
        setMascotState('idle');
        gameSound.playGentleOops();
        gameSound.speakCompanion(`That's ${cloud.word}. Let's jump on ${currentLevel.targetWord}!`);
      }
    },
    [currentLevel, isSummitReached, isGameComplete, streak, score, stars, altitude, levelIndex, onRoundComplete, onGameComplete]
  );

  const handleTryAgain = useCallback(() => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);

    setIsGameComplete(false);
    setIsSummitReached(false);
    setScore(0);
    setStars(0);
    setStreak(1);
    setAltitude(25);
    setMascotState('idle');
    setBunnyPos([0, 1.0, 0]);
    roundLockRef.current = false;
    onResetSession?.();

    if (levelIndex === 0) {
      initLevelPlatforms(getBounceLevel(0));
    } else {
      setLevelIndex(0);
    }
  }, [levelIndex, initLevelPlatforms, onResetSession]);

  const handleExitGame = useCallback(() => {
    onBack?.();
  }, [onBack]);

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-sky-200 select-none">
      {/* 3D Skyland Canvas with Enhanced VFX */}
      <CloudWorld
        platforms={platforms}
        bunnyPos={bunnyPos}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        mascotState={mascotState}
        isSummitReached={isSummitReached}
        onBounceCloud={handleBounceCloud}
      />

      {/* Screen celebration confetti on summit reached or game completed */}
      <VFXScreenConfetti active={isSummitReached || isGameComplete} duration={3500} />

      {/* Radiant Rainbow Border when streak >= 3 */}
      <VFXFeverOverlay combo={streak} active={streak >= 3} />

      {/* Altitude HUD */}
      <CloudHUD
        level={currentLevel}
        altitude={altitude}
        score={score}
        stars={stars}
        streak={streak}
        isSummitReached={isSummitReached}
        isGameComplete={isGameComplete}
        onSpeakPrompt={() => gameSound.speakCompanion(currentLevel.prompt)}
        onResetBounce={() => initLevelPlatforms(currentLevel)}
        onBack={onBack}
      />

      {/* Final Level Rainbow Summit Victory & Completion Modal */}
      {isGameComplete && (
        <div
          data-testid="cloud-completion-screen"
          className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-sky-950/85 backdrop-blur-md animate-fade-in pointer-events-auto"
        >
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-sky-900 border-2 border-amber-300/80 shadow-[0_20px_60px_rgba(56,189,248,0.4)] text-center text-white">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-sky-800/80 border-2 border-amber-300 flex items-center justify-center text-4xl mb-4 shadow-inner">
              🌈
            </div>
            <div className="text-xs font-black text-amber-300 uppercase tracking-widest mb-1">
              Rainbow Summit Champion! 🎉
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-2">
              Summit Conquered!
            </h2>
            <p className="text-sky-200 text-sm font-medium mb-6">
              Bouncy Bunny bounced to the highest rainbow cloud across all 5 sight word summits!
            </p>

            {/* Stats summary */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-800/80 border border-sky-400/40">
                <span className="text-xl">⭐</span>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-sky-300">Stars</div>
                  <div className="text-base font-black text-amber-300" data-testid="final-stars">{stars}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-800/80 border border-sky-400/40">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-sky-300">Final Score</div>
                  <div className="text-base font-black text-amber-300 font-mono" data-testid="final-score">{score} PTS</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                data-testid="try-again-btn"
                onClick={handleTryAgain}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-sky-950 font-black text-sm shadow-lg shadow-amber-400/30 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw size={18} />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                data-testid="back-to-games-btn"
                onClick={handleExitGame}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-800 hover:bg-sky-700 text-sky-100 border border-sky-600 font-extrabold text-sm transition-all cursor-pointer active:scale-95"
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

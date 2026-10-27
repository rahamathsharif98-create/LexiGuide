import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Star, Sparkles, RotateCcw, ArrowLeft } from 'lucide-react';
import DinoHUD from './hud/DinoHUD';
import DinoWorld from './DinoWorld';
import { DINO_TARGETS, getDinoTarget } from './engine/dinoTargets';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

export function getDinoCheckpointKey(childId) {
  return `lexiguide_dino_fossil_checkpoint_${childId || 'guest'}`;
}

export function loadDinoCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  try {
    const raw = window.localStorage.getItem(getDinoCheckpointKey(childId));
    if (!raw) return 0;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
    let idx;
    if (typeof parsed === 'number') {
      idx = parsed;
    } else if (typeof parsed === 'string') {
      idx = Number(parsed);
    } else if (typeof parsed === 'object' && parsed !== null) {
      idx = Number(parsed.levelIndex ?? parsed.savedLevelIndex ?? parsed.index);
    }
    if (Number.isInteger(idx) && idx >= 0 && idx < DINO_TARGETS.length) {
      return idx;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function saveDinoCheckpoint(childId, levelIndex) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const validIndex = Math.max(0, Math.min(levelIndex, DINO_TARGETS.length - 1));
    window.localStorage.setItem(
      getDinoCheckpointKey(childId),
      JSON.stringify({
        levelIndex: validIndex,
        savedLevelIndex: validIndex,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[DinoApp] Failed to save checkpoint:', err);
  }
}

export default function DinoApp({
  childId,
  onBack,
  onRoundComplete,
  onGameComplete,
  onResetSession,
}) {
  const [targetIndex, setTargetIndex] = useState(() => loadDinoCheckpoint(childId));
  const [isGameComplete, setIsGameComplete] = useState(false);

  useEffect(() => {
    setTargetIndex(loadDinoCheckpoint(childId));
  }, [childId]);
  const currentTarget = useMemo(() => getDinoTarget(targetIndex), [targetIndex]);
  const [excavatedChunks, setExcavatedChunks] = useState([]);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(1);
  const [isExcavated, setIsExcavated] = useState(false);
  const [mascotState, setMascotState] = useState('idle');
  const [floatingText, setFloatingText] = useState('DUSTED!');
  const [floatingTextKey, setFloatingTextKey] = useState(0);

  // Available fossil slabs in excavation pit
  const [slabs, setSlabs] = useState([]);

  // VFX State
  const [burstPos, setBurstPos] = useState([0, 1, 0]);
  const [burstKey, setBurstKey] = useState(0);

  // Synchronous guards: prevent rapid duplicate clicks from scoring or completing twice
  const roundLockRef = useRef(false);
  const excavatedIdsRef = useRef(new Set());
  const excavatedChunksRef = useRef([]);

  // Timer refs to prevent timeout races and ensure cleanup on unmount
  const mascotTimerRef = useRef(null);
  const transitionTimerRef = useRef(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // Initialize slabs for current target
  const initTargetSlabs = useCallback((target) => {
    if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);

    roundLockRef.current = false;
    excavatedIdsRef.current.clear();
    excavatedChunksRef.current = [];
    const validItems = [
      { chunk: target.onset, order: 0, isValid: true },
      { chunk: target.rime, order: 1, isValid: true },
    ];

    const distractorItems = target.distractors.map((d) => ({
      chunk: d,
      order: -1,
      isValid: false,
    }));

    const combined = [...validItems, ...distractorItems].sort(() => Math.random() - 0.5);

    // Positions surrounding the dig site skull
    const positions = [
      [-3.2, 0.8, -2],
      [3.2, 0.8, -2],
      [-3.5, 0.8, 1.8],
      [3.5, 0.8, 1.8],
    ];

    const generated = combined.map((item, idx) => ({
      id: `slab-${target.id}-${item.chunk}-${idx}`,
      chunk: item.chunk,
      order: item.order,
      isValid: item.isValid,
      pos: positions[idx % positions.length],
      isExcavated: false,
      isNext: item.chunk === target.onset,
    }));

    setSlabs(generated);
    setExcavatedChunks([]);
    setIsExcavated(false);
    setMascotState('idle');

    // Soft companion announcement
    gameSound.speakCompanion(target.speechText);
  }, []);

  useEffect(() => {
    initTargetSlabs(currentTarget);
  }, [currentTarget, initTargetSlabs]);

  // Handle dusting off a slab
  const handleBrushSlab = useCallback(
    (slab) => {
      if (slab.isExcavated || isExcavated || isGameComplete || roundLockRef.current || excavatedIdsRef.current.has(slab.id)) return;

      const expectedChunk = excavatedChunksRef.current.length === 0 ? currentTarget.onset : currentTarget.rime;

      if (slab.chunk === expectedChunk) {
        // Synchronously record excavated slab and chunk to guard against rapid clicks
        excavatedIdsRef.current.add(slab.id);
        excavatedChunksRef.current.push(slab.chunk);

        // Correct chunk!
        const nextExcavated = [...excavatedChunks, slab.chunk];
        const isComplete = excavatedChunksRef.current.length === 2;

        if (isComplete) {
          roundLockRef.current = true;
        }

        // Playful brush dusting sound + ascending note
        gameSound.playBrush();
        gameSound.playLetterNote(excavatedChunks.length);

        // Dust puff VFX at slab position
        setBurstPos(slab.pos || [0, 1, 0]);
        setBurstKey(Date.now());

        // Mascot cheer & floating comic text
        const isFever = streak >= 2;
        const stepScore = 150 * (isFever ? 2 : 1);
        const finalRoundBonus = 500;
        const nextScore = score + stepScore + (isComplete ? finalRoundBonus : 0);
        const nextStars = stars + (isComplete ? 1 : 0);

        setFloatingText(isFever ? 'FOSSIL COMBO! 2X' : 'DUSTED!');
        setFloatingTextKey(Date.now());

        // Clear any running mascot timer to avoid race conditions
        if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);

        setExcavatedChunks(nextExcavated);
        setScore((prev) => prev + stepScore);
        setStreak((prev) => Math.min(prev + 1, 5));

        // Mark slab excavated
        setSlabs((prev) =>
          prev.map((s) => {
            if (s.id === slab.id) return { ...s, isExcavated: true, isNext: false };
            if (!isComplete && s.chunk === currentTarget.rime) return { ...s, isNext: true };
            return { ...s, isNext: false };
          })
        );

        if (isComplete) {
          setIsExcavated(true);
          setStars(nextStars);
          setScore(nextScore);
          setFloatingText('FOSSIL COMPLETE! 🦖');
          setFloatingTextKey(Date.now());
          setMascotState('victory');

          // Save checkpoint: next level index, without wrapping Level 10 back to Level 1
          const nextCheckpointIndex = Math.min(targetIndex + 1, DINO_TARGETS.length - 1);
          saveDinoCheckpoint(childId, nextCheckpointIndex);

          onRoundComplete?.({
            isCorrect: true,
            target: currentTarget,
            stars: 1,
            xp: 25,
            score: 500,
          });

          // Victory celebration
          gameSound.playFanfare();
          if (currentTarget.name === 'ROAR' || currentTarget.id === 'fossil-roar') {
            gameSound.playRoar?.();
          }
          gameSound.speakCompanion(`Roar! You excavated the ${currentTarget.name} dinosaur fossil!`);

          if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
          transitionTimerRef.current = setTimeout(() => {
            if (targetIndex < DINO_TARGETS.length - 1) {
              setTargetIndex((prev) => prev + 1);
              setMascotState('idle');
            } else {
              // Level 10 completed: end game with victory completion screen
              setIsGameComplete(true);
              setMascotState('victory');
              gameSound.playFanfare();
              gameSound.speakCompanion('Roar! Congratulations, Chief Paleontologist! You excavated all 10 dinosaur fossils!');
              onGameComplete?.({
                score: nextScore,
                stars: nextStars,
                streak: Math.min(streak + 1, 5),
                completed: true,
                details: { completed: true },
              });
            }
          }, 3400);
        } else {
          setMascotState('celebrate');
          mascotTimerRef.current = setTimeout(() => setMascotState('idle'), 1200);
        }
      } else {
        // Gentle oops
        onRoundComplete?.({
          isCorrect: false,
          target: currentTarget,
        });

        setStreak(1);
        if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);
        setMascotState('idle');
        gameSound.playGentleOops();
        gameSound.speakCompanion(`Keep digging! Find ${expectedChunk} first!`);
      }
    },
    [excavatedChunks, currentTarget, isExcavated, isGameComplete, streak, score, stars, onRoundComplete, onGameComplete, targetIndex, childId]
  );

  const handlePlayAgain = useCallback(() => {
    if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);

    setIsGameComplete(false);
    setScore(0);
    setStars(0);
    setStreak(1);
    setExcavatedChunks([]);
    setIsExcavated(false);
    setMascotState('idle');
    roundLockRef.current = false;
    excavatedIdsRef.current.clear();
    excavatedChunksRef.current = [];

    // Reset checkpoint so old progress does not immediately resume
    saveDinoCheckpoint(childId, 0);

    onResetSession?.();

    if (targetIndex === 0) {
      initTargetSlabs(getDinoTarget(0));
    } else {
      setTargetIndex(0);
    }
  }, [childId, targetIndex, initTargetSlabs, onResetSession]);

  const handleExitGame = useCallback(() => {
    onBack?.();
  }, [onBack]);

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-stone-950">
      {/* 3D Dig Site Canvas with Enhanced VFX */}
      <DinoWorld
        target={currentTarget}
        slabs={slabs}
        isExcavated={isExcavated}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        mascotState={mascotState}
        onBrushSlab={handleBrushSlab}
      />

      {/* Screen celebration confetti on completed dinosaur excavation or game completion */}
      <VFXScreenConfetti active={isExcavated || isGameComplete} duration={3200} />

      {/* Radiant Rainbow Border when streak >= 3 */}
      <VFXFeverOverlay combo={streak} active={streak >= 3} />

      {/* Paleontology Field HUD */}
      <DinoHUD
        target={currentTarget}
        excavatedChunks={excavatedChunks}
        score={score}
        stars={stars}
        streak={streak}
        isExcavated={isExcavated}
        onSpeakPrompt={() => gameSound.speakCompanion(currentTarget.speechText)}
        onSpeakWord={() => gameSound.speakCompanion(currentTarget.name)}
        onResetFossil={() => {
          if (!isGameComplete) initTargetSlabs(currentTarget);
        }}
        onBack={onBack}
      />

      {/* Final Level Victory & Completion Modal */}
      {isGameComplete && (
        <div
          data-testid="dino-completion-screen"
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in pointer-events-auto"
        >
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-stone-900 border-2 border-amber-500/60 shadow-[0_20px_60px_rgba(245,158,11,0.4)] text-center text-white">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-950/80 border-2 border-amber-400/60 flex items-center justify-center text-4xl mb-4 shadow-inner">
              🦖
            </div>
            <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">
              Chief Paleontologist! 🏆
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-2">
              All Fossils Excavated!
            </h2>
            <p className="text-stone-300 text-sm font-medium mb-6">
              Roaaar! You successfully dusted, blended, and reassembled all 10 prehistoric dinosaur specimens!
            </p>

            {/* Stats summary */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-800/80 border border-amber-400/30">
                <Star size={20} className="fill-yellow-400 text-yellow-400" />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-stone-400">Stars</div>
                  <div className="text-base font-black text-yellow-300" data-testid="final-stars">{stars}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-800/80 border border-amber-400/30">
                <Sparkles size={20} className="text-amber-400" />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-stone-400">Final Score</div>
                  <div className="text-base font-black text-amber-300 font-mono" data-testid="final-score">{score} pts</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                data-testid="play-again-btn"
                onClick={handlePlayAgain}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm shadow-lg shadow-amber-500/30 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw size={18} />
                <span>Play Again</span>
              </button>
              <button
                type="button"
                data-testid="back-to-games-btn"
                onClick={handleExitGame}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-extrabold text-sm transition-all cursor-pointer active:scale-95"
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

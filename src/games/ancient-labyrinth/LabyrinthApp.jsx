import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Star, RotateCcw, ArrowLeft, Sparkles } from 'lucide-react';
import LabyrinthHUD from './hud/LabyrinthHUD';
import LabyrinthWorld from './LabyrinthWorld';
import { LABYRINTH_RIDDLES, getLabyrinthRiddle } from './engine/labyrinthGlyphs';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

export function getLabyrinthCheckpointKey(childId) {
  return `lexiguide_ancient_labyrinth_checkpoint_${childId || 'guest'}`;
}

export function loadLabyrinthCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  try {
    const raw = window.localStorage.getItem(getLabyrinthCheckpointKey(childId));
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
    if (Number.isInteger(idx) && idx >= 0 && idx < LABYRINTH_RIDDLES.length) {
      return idx;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function saveLabyrinthCheckpoint(childId, levelIndex) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const validIndex = Math.max(0, Math.min(levelIndex, LABYRINTH_RIDDLES.length - 1));
    window.localStorage.setItem(
      getLabyrinthCheckpointKey(childId),
      JSON.stringify({
        levelIndex: validIndex,
        savedLevelIndex: validIndex,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[LabyrinthApp] Failed to save checkpoint:', err);
  }
}

export default function LabyrinthApp({ childId, onBack, onRoundComplete }) {
  const [riddleIndex, setRiddleIndex] = useState(() => loadLabyrinthCheckpoint(childId));

  useEffect(() => {
    setRiddleIndex(loadLabyrinthCheckpoint(childId));
  }, [childId]);

  const currentRiddle = useMemo(() => getLabyrinthRiddle(riddleIndex), [riddleIndex]);
  const [collectedGlyphs, setCollectedGlyphs] = useState([]);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(1);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [mascotState, setMascotState] = useState('idle');
  const [floatingText, setFloatingText] = useState('RUNE UNLOCKED!');
  const [floatingTextKey, setFloatingTextKey] = useState(0);

  // Available keystones
  const [keystones, setKeystones] = useState([]);

  // Victory & Completion State
  const [isVictoryMoment, setIsVictoryMoment] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // VFX State
  const [burstPos, setBurstPos] = useState([0, 1, 0]);
  const [burstKey, setBurstKey] = useState(0);

  // Synchronous guards & timers to prevent rapid-click exploits and timer race conditions
  const roundLockRef = useRef(false);
  const collectedIdsRef = useRef(new Set());
  const collectedGlyphsRef = useRef([]);
  const mascotTimerRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const victoryTimerRef = useRef(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
    };
  }, []);

  // Initialize riddle keystones
  const initRiddleKeystones = useCallback((riddle) => {
    if (mascotTimerRef.current) {
      clearTimeout(mascotTimerRef.current);
      mascotTimerRef.current = null;
    }
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (victoryTimerRef.current) {
      clearTimeout(victoryTimerRef.current);
      victoryTimerRef.current = null;
    }
    roundLockRef.current = false;
    collectedIdsRef.current.clear();
    collectedGlyphsRef.current = [];

    const letters = riddle.word.split('');
    const validGlyphs = letters.map((l, idx) => ({
      glyph: l,
      order: idx,
      isValid: true,
    }));

    const distractorGlyphs = riddle.distractors.map((d) => ({
      glyph: d,
      order: -1,
      isValid: false,
    }));

    const combined = [...validGlyphs, ...distractorGlyphs].sort(() => Math.random() - 0.5);

    // Staggered, spacious gallery: ensures 100% line-of-sight visibility from camera [0, 5.0, 8.0]
    // Monotonically ordered screen projections from back to front guarantee zero occlusion between pedestals
    // The central ceremonial pathway remains open to the vault door archway
    const corridorCoords = [
      [-3.4, 0,  1.4], // Tier 1 Left  (Front outer)
      [ 3.4, 0,  1.4], // Tier 1 Right (Front outer)
      [-3.2, 0, -0.8], // Tier 2 Left  (Mid-Front)
      [ 3.2, 0, -0.8], // Tier 2 Right (Mid-Front)
      [-3.0, 0, -3.0], // Tier 3 Left  (Mid)
      [ 3.0, 0, -3.0], // Tier 3 Right (Mid)
      [-2.4, 0, -5.2], // Tier 4 Left  (Mid-Back)
      [ 2.4, 0, -5.2], // Tier 4 Right (Mid-Back)
      [-1.6, 0, -7.4], // Tier 5 Left  (Back inner)
      [ 1.6, 0, -7.4], // Tier 5 Right (Back inner)
    ];

    const generated = combined.map((item, idx) => ({
      id: `glyph-${riddle.id}-${item.glyph}-${idx}`,
      glyph: item.glyph,
      order: item.order,
      isValid: item.isValid,
      pos: corridorCoords[idx % corridorCoords.length],
      isCollected: false,
      isNext: item.glyph === letters[0],
    }));

    setKeystones(generated);
    setCollectedGlyphs([]);
    setIsUnlocked(false);
    setMascotState('idle');

    // Oracle guidance voice
    gameSound.speakCompanion(riddle.speechText);
  }, []);

  useEffect(() => {
    initRiddleKeystones(currentRiddle);
  }, [currentRiddle, initRiddleKeystones]);

  // Handle keystone selection
  const handleCollectKeystone = useCallback(
    (keystone) => {
      if (
        !keystone ||
        keystone.isCollected ||
        isUnlocked ||
        isGameComplete ||
        roundLockRef.current ||
        collectedIdsRef.current.has(keystone.id)
      ) {
        return;
      }

      const expectedLetter = currentRiddle.word[collectedGlyphsRef.current.length];

      if (keystone.glyph === expectedLetter) {
        // Synchronously record collected keystone and glyph to guard against rapid clicks
        collectedIdsRef.current.add(keystone.id);
        collectedGlyphsRef.current.push(keystone.glyph);

        const nextCollected = [...collectedGlyphsRef.current];
        const newSlot = collectedGlyphsRef.current.length - 1;
        const isComplete = collectedGlyphsRef.current.length === currentRiddle.word.length;

        if (isComplete) {
          roundLockRef.current = true;
        }

        // Playful rune chime note (never screaming letters)
        gameSound.playLetterNote(newSlot);

        // Ancient rune sparkle burst at keystone position
        setBurstPos(keystone.pos || [0, 1, 0]);
        setBurstKey(Date.now());

        // Mascot cheer & floating comic text
        const isFever = streak >= 2;
        setFloatingText(isFever ? 'LABYRINTH COMBO! 2X' : 'RUNE UNLOCKED!');
        setFloatingTextKey(Date.now());

        // Clear any running mascot celebration timer
        if (mascotTimerRef.current) {
          clearTimeout(mascotTimerRef.current);
          mascotTimerRef.current = null;
        }

        if (isComplete) {
          setMascotState('victory');
        } else {
          setMascotState('celebrate');
          mascotTimerRef.current = setTimeout(() => {
            setMascotState('idle');
            mascotTimerRef.current = null;
          }, 1200);
        }

        setCollectedGlyphs(nextCollected);
        setScore((prev) => prev + 150 * (isFever ? 2 : 1));
        setStreak((prev) => Math.min(prev + 1, 5));

        // Mark keystone collected
        setKeystones((prev) =>
          prev.map((k) => {
            if (k.id === keystone.id) return { ...k, isCollected: true, isNext: false };
            if (!isComplete && k.glyph === currentRiddle.word[nextCollected.length]) {
              return { ...k, isNext: true };
            }
            return { ...k, isNext: false };
          })
        );

        if (isComplete) {
          setIsUnlocked(true);
          setStars((prev) => prev + 1);
          setScore((prev) => prev + 500);
          setFloatingText('VAULT OPENED! 🗝️');
          setFloatingTextKey(Date.now());

          // Save checkpoint: next level index, clamped to final level (index 9) without wrapping
          const nextCheckpointIndex = Math.min(riddleIndex + 1, LABYRINTH_RIDDLES.length - 1);
          saveLabyrinthCheckpoint(childId, nextCheckpointIndex);

          onRoundComplete?.({
            isCorrect: true,
            riddle: currentRiddle,
            stars: 1,
            xp: 25,
            score: 500,
          });

          // Fanfare and gate opening cheer
          gameSound.playFanfare();
          gameSound.speakCompanion(`Magnificent! You solved the riddle of ${currentRiddle.word}! The vault opens!`);

          if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
          }

          if (riddleIndex < LABYRINTH_RIDDLES.length - 1) {
            // Levels 1-9: advance to next riddle after short transition
            transitionTimerRef.current = setTimeout(() => {
              setRiddleIndex((prev) => prev + 1);
              setMascotState('idle');
              transitionTimerRef.current = null;
            }, 3400);
          } else {
            // Level 10 (TEMPLE): Final level completed! Stop progression! Never wrap back to Level 1!
            setIsVictoryMoment(true);
            setMascotState('victory');
            setBurstPos([0, 2.0, -14.0]);
            setBurstKey(Date.now());

            if (victoryTimerRef.current) {
              clearTimeout(victoryTimerRef.current);
            }
            victoryTimerRef.current = setTimeout(() => {
              setIsGameComplete(true);
              setMascotState('victory');
              gameSound.playFanfare();
              gameSound.speakCompanion('Temple Conquered! Amazing work! You solved every word!');
              victoryTimerRef.current = null;
            }, 2000);
          }
        }
      } else {
        // Incorrect keystone
        if (mascotTimerRef.current) {
          clearTimeout(mascotTimerRef.current);
          mascotTimerRef.current = null;
        }
        onRoundComplete?.({
          isCorrect: false,
          riddle: currentRiddle,
        });

        setStreak(1);
        setMascotState('idle');
        gameSound.playGentleOops();
        gameSound.speakCompanion(`The next rune glyph needed is ${expectedLetter}!`);
      }
    },
    [childId, currentRiddle, isUnlocked, isGameComplete, riddleIndex, streak, onRoundComplete]
  );

  const handlePlayAgain = useCallback(() => {
    if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);

    setIsGameComplete(false);
    setIsVictoryMoment(false);
    setScore(0);
    setStars(0);
    setStreak(1);
    setCollectedGlyphs([]);
    setIsUnlocked(false);
    setMascotState('idle');
    roundLockRef.current = false;
    collectedIdsRef.current.clear();
    collectedGlyphsRef.current = [];

    // Reset checkpoint so the completed game does not immediately resume at Level 10
    saveLabyrinthCheckpoint(childId, 0);

    if (riddleIndex === 0) {
      initRiddleKeystones(getLabyrinthRiddle(0));
    } else {
      setRiddleIndex(0);
    }
  }, [childId, riddleIndex, initRiddleKeystones]);

  const handleBackToGames = useCallback(() => {
    onBack?.();
  }, [onBack]);

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-stone-950">
      {/* 3D Labyrinth World Canvas with Enhanced VFX */}
      <LabyrinthWorld
        keystones={keystones}
        isUnlocked={isUnlocked}
        isVictory={isVictoryMoment || isGameComplete}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        mascotState={mascotState}
        onCollectKeystone={handleCollectKeystone}
      />

      {/* Screen celebration confetti on vault unlock or victory completion */}
      <VFXScreenConfetti active={isUnlocked || isGameComplete} duration={3200} />

      {/* Radiant Rainbow Border when streak >= 3 */}
      <VFXFeverOverlay combo={streak} active={streak >= 3} />

      {/* Labyrinth Inscription HUD */}
      <LabyrinthHUD
        riddle={currentRiddle}
        collectedGlyphs={collectedGlyphs}
        score={score}
        stars={stars}
        streak={streak}
        isUnlocked={isUnlocked}
        onSpeakPrompt={() => gameSound.speakCompanion(currentRiddle.prompt)}
        onResetLabyrinth={() => {
          if (!isGameComplete) initRiddleKeystones(currentRiddle);
        }}
        onBack={onBack}
      />

      {/* Final Level Victory & Completion Modal */}
      {isGameComplete && (
        <div
          data-testid="labyrinth-victory-panel"
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in pointer-events-auto"
        >
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-stone-900 border-2 border-amber-500/60 shadow-[0_20px_60px_rgba(245,158,11,0.45)] text-center text-white">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-950/80 border-2 border-amber-400/60 flex items-center justify-center text-4xl mb-4 shadow-inner">
              🏛️
            </div>

            {/* Title */}
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-2 tracking-wide">
              Temple Conquered!
            </h2>

            {/* Message */}
            <p className="text-stone-300 text-sm font-medium mb-5">
              Amazing work! You solved every word!
            </p>

            {/* Three gold stars celebratory reward */}
            <div data-testid="victory-stars" className="flex items-center justify-center gap-3 mb-6">
              {[1, 2, 3].map((starNum) => (
                <div
                  key={`star-${starNum}`}
                  className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-400/50 flex items-center justify-center shadow-lg"
                >
                  <Star size={28} className="fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]" />
                </div>
              ))}
            </div>

            {/* Actual final score from the game */}
            <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-stone-800/80 border border-amber-400/30 mb-6 w-fit mx-auto">
              <Sparkles size={20} className="text-amber-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-stone-400">Final Score</div>
                <div className="text-xl font-black text-amber-300 font-mono" data-testid="final-score">
                  {score} pts
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
                onClick={handleBackToGames}
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

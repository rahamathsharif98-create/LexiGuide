import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Star, RotateCcw, ArrowLeft, Sparkles } from 'lucide-react';
import BakeryHUD from './hud/BakeryHUD';
import BakeryWorld from './BakeryWorld';
import { BAKERY_RECIPES, getBakeryRecipe } from './engine/bakeryRecipes';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

export function getBakeryCheckpointKey(childId) {
  return `lexiguide_magic_bakery_checkpoint_${childId || 'guest'}`;
}

export function loadBakeryCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  try {
    const raw = window.localStorage.getItem(getBakeryCheckpointKey(childId));
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
      idx = Number(parsed.recipeIndex ?? parsed.levelIndex ?? parsed.savedLevelIndex ?? parsed.index);
    }
    if (Number.isInteger(idx) && idx >= 0 && idx < BAKERY_RECIPES.length) {
      return idx;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function saveBakeryCheckpoint(childId, recipeIndex) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const validIndex = Math.max(0, Math.min(recipeIndex, BAKERY_RECIPES.length - 1));
    window.localStorage.setItem(
      getBakeryCheckpointKey(childId),
      JSON.stringify({
        recipeIndex: validIndex,
        savedLevelIndex: validIndex,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[BakeryApp] Failed to save checkpoint:', err);
  }
}

/**
 * Compact, balanced countertop spawn layout for selectable cake tiers.
 * - Symmetrically framed around central cake platter (radius 2.05 at origin).
 * - Compact X bounds (|X| <= 4.7) prevent any clipping at screen edges.
 * - Staggered columns and depth rows guarantee zero line-of-sight occlusion.
 * - Clear central corridor keeps platter open for assembling the cake.
 */
export const BAKERY_TIER_SPAWN_POSITIONS = [
  [-3.1, 0.45, 1.1],  // Pos 0: Front-Left (inner foreground)
  [3.1, 0.45, 1.1],   // Pos 1: Front-Right (inner foreground)
  [-4.7, 0.45, -0.7], // Pos 2: Mid-Left (outer flank)
  [4.7, 0.45, -0.7],  // Pos 3: Right-Flank (outer flank)
  [-2.8, 0.45, -2.2], // Pos 4: Back-Left (inner background)
  [2.8, 0.45, -2.2],  // Pos 5: Back-Right (inner background)
  [-4.7, 0.45, 1.1],  // Pos 6: Safety Fallback
];

export default function BakeryApp({ childId, onBack, onRoundComplete }) {
  const [recipeIndex, setRecipeIndex] = useState(() => loadBakeryCheckpoint(childId));

  useEffect(() => {
    setRecipeIndex(loadBakeryCheckpoint(childId));
  }, [childId]);

  const currentRecipe = useMemo(() => getBakeryRecipe(recipeIndex), [recipeIndex]);
  const [stackedSyllables, setStackedSyllables] = useState([]);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(1);
  const [isBakeComplete, setIsBakeComplete] = useState(false);
  const [mascotState, setMascotState] = useState('idle');
  const [floatingText, setFloatingText] = useState('FROSTING SNAP!');
  const [floatingTextKey, setFloatingTextKey] = useState(0);

  // Available tiers in the kitchen
  const [tiers, setTiers] = useState([]);

  // Victory & Completion State
  const [isVictoryMoment, setIsVictoryMoment] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // VFX State
  const [burstPos, setBurstPos] = useState([0, 1.8, 0]);
  const [burstKey, setBurstKey] = useState(0);

  // Synchronous guards & timers to prevent rapid-click exploits and timer race conditions
  const roundLockRef = useRef(false);
  const collectedIdsRef = useRef(new Set());
  const stackedSyllablesRef = useRef([]);
  const isMountedRef = useRef(true);
  const mascotTimerRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const victoryTimerRef = useRef(null);

  // Clean up timers on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
    };
  }, []);

  // Initialize tiers for current recipe
  const initRecipeTiers = useCallback((recipe) => {
    roundLockRef.current = false;
    collectedIdsRef.current = new Set();
    stackedSyllablesRef.current = [];

    if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);

    const totalTiers = recipe.syllables.length;

    const validSyllables = recipe.syllables.map((s, idx) => ({
      syllable: s,
      order: idx,
      totalTiers,
      isValid: true,
      color: recipe.frostingColors[idx % recipe.frostingColors.length] || '#fb7185',
      frostingColor: '#fef08a',
    }));

    const distractorItems = recipe.distractors.map((d) => ({
      syllable: d,
      order: -1,
      totalTiers,
      isValid: false,
      color: '#94a3b8',
      frostingColor: '#cbd5e1',
    }));

    const combined = [...validSyllables, ...distractorItems].sort(() => Math.random() - 0.5);

    // Balanced, non-overlapping staggered arrangement around central platter (radius 2.4)
    // Completely inside visible screen and countertop area with line-of-sight separation
    const positions = BAKERY_TIER_SPAWN_POSITIONS;

    const generated = combined.map((item, idx) => ({
      id: `tier-${recipe.id}-${item.syllable}-${idx}`,
      syllable: item.syllable,
      order: item.order,
      totalTiers: item.totalTiers,
      isValid: item.isValid,
      color: item.color,
      frostingColor: item.frostingColor,
      pos: positions[idx % positions.length],
      isStacked: false,
      stackIndex: 0,
      isTop: false,
    }));

    setTiers(generated);
    setStackedSyllables([]);
    setIsBakeComplete(false);

    // Warm companion guidance
    gameSound.speakCompanion(recipe.speechText);
  }, []);

  useEffect(() => {
    initRecipeTiers(currentRecipe);
  }, [currentRecipe, initRecipeTiers]);

  // Handle tier selection
  const handleSelectTier = useCallback(
    (tier) => {
      if (
        !tier ||
        tier.isStacked ||
        isBakeComplete ||
        isGameComplete ||
        isVictoryMoment ||
        roundLockRef.current ||
        collectedIdsRef.current.has(tier.id)
      ) {
        return;
      }

      const expectedSyllable = currentRecipe.syllables[stackedSyllablesRef.current.length];

      if (tier.syllable === expectedSyllable) {
        // Synchronously record tier and syllable to guard against rapid clicks
        collectedIdsRef.current.add(tier.id);
        stackedSyllablesRef.current.push(tier.syllable);

        const nextStacked = [...stackedSyllablesRef.current];
        const newStackIndex = nextStacked.length - 1;
        const isComplete = nextStacked.length === currentRecipe.syllables.length;

        if (isComplete) {
          roundLockRef.current = true;
        }

        // Playful baking sparkle chime + ascending scale note
        gameSound.playSparkle();
        gameSound.playLetterNote(newStackIndex);

        // Trigger frosting sparkle burst at stacked position
        setBurstPos([0, 0.70 + newStackIndex * 0.58 + 0.29, 0]);
        setBurstKey(Date.now());

        // Mascot cheer & floating comic text
        const isFever = streak >= 2;
        setFloatingText(isFever ? 'SWEET COMBO! 2X' : 'FROSTING SNAP!');
        setFloatingTextKey(Date.now());
        setMascotState('celebrate');
        if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);
        mascotTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          setMascotState('idle');
        }, 1200);

        setStackedSyllables(nextStacked);
        setScore((prev) => prev + 150 * (isFever ? 2 : 1));
        setStreak((prev) => Math.min(prev + 1, 5));

        // Mark tier stacked
        setTiers((prev) =>
          prev.map((t) => {
            if (t.id === tier.id) {
              return {
                ...t,
                isStacked: true,
                stackIndex: newStackIndex,
                isTop: isComplete,
              };
            }
            return t;
          })
        );

        if (isComplete) {
          setIsBakeComplete(true);
          setStars((prev) => prev + 1);
          setScore((prev) => prev + 500);
          setFloatingText('DELICIOUS CAKE! 🎂');
          setFloatingTextKey(Date.now());

          // Save checkpoint for next level (clamped to 10-level range, 0 to 9)
          const nextCheckpoint = Math.min(recipeIndex + 1, BAKERY_RECIPES.length - 1);
          saveBakeryCheckpoint(childId, nextCheckpoint);

          onRoundComplete?.({
            isCorrect: true,
            recipe: currentRecipe,
            stars: 1,
            xp: 25,
            score: 500,
          });

          // Fanfare and chef cheer
          gameSound.playFanfare();
          const cakeName = currentRecipe.name || currentRecipe.compoundWord;
          gameSound.speakCompanion(`Delicious! You baked the magical ${cakeName}!`);

          if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
          }

          if (recipeIndex < BAKERY_RECIPES.length - 1) {
            // Levels 1-9: advance to next recipe after transition
            setMascotState('celebrate');
            transitionTimerRef.current = setTimeout(() => {
              if (!isMountedRef.current) return;
              setRecipeIndex((prev) => prev + 1);
              setMascotState('idle');
              transitionTimerRef.current = null;
            }, 3400);
          } else {
            // Level 10 (GINGERBREAD): Final level completed! Stop progression! Never wrap back to Level 1!
            setIsVictoryMoment(true);
            setMascotState('victory');
            setBurstPos([0, 2.5, 0]);
            setBurstKey(Date.now());

            if (victoryTimerRef.current) {
              clearTimeout(victoryTimerRef.current);
            }
            victoryTimerRef.current = setTimeout(() => {
              if (!isMountedRef.current) return;
              setIsGameComplete(true);
              setMascotState('victory');
              gameSound.playFanfare();
              gameSound.speakCompanion('Master Baker! Amazing work! You baked every magical recipe!');
              victoryTimerRef.current = null;
            }, 2000);
          }
        }
      } else {
        // Incorrect tier
        onRoundComplete?.({
          isCorrect: false,
          recipe: currentRecipe,
        });

        setStreak(1);
        setMascotState('idle');
        gameSound.playGentleOops();
        gameSound.speakCompanion(`Next we need syllable ${expectedSyllable}!`);
      }
    },
    [childId, currentRecipe, isBakeComplete, isGameComplete, isVictoryMoment, recipeIndex, streak, onRoundComplete]
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
    setStackedSyllables([]);
    setIsBakeComplete(false);
    setMascotState('idle');
    roundLockRef.current = false;
    collectedIdsRef.current.clear();
    stackedSyllablesRef.current = [];

    // Reset checkpoint so the completed game does not immediately resume at Level 10
    saveBakeryCheckpoint(childId, 0);

    if (recipeIndex === 0) {
      initRecipeTiers(getBakeryRecipe(0));
    } else {
      setRecipeIndex(0);
    }
  }, [childId, recipeIndex, initRecipeTiers]);

  const handleBackToGames = useCallback(() => {
    onBack?.();
  }, [onBack]);

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-amber-950">
      {/* 3D Kitchen Canvas with Enhanced VFX */}
      <BakeryWorld
        tiers={tiers}
        isBakeComplete={isBakeComplete || isGameComplete || isVictoryMoment}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        mascotState={mascotState}
        onSelectTier={handleSelectTier}
      />

      {/* Screen celebration confetti on completed cake */}
      <VFXScreenConfetti active={isBakeComplete || isGameComplete || isVictoryMoment} duration={3500} />

      {/* Radiant Rainbow Border when streak >= 3 */}
      <VFXFeverOverlay combo={streak} active={streak >= 3} />

      {/* Bakery HUD */}
      <BakeryHUD
        recipe={currentRecipe}
        stackedSyllables={stackedSyllables}
        score={score}
        stars={stars}
        streak={streak}
        isBakeComplete={isBakeComplete}
        onSpeakPrompt={() => gameSound.speakCompanion(currentRecipe.prompt)}
        onResetRecipe={() => {
          if (!isGameComplete) initRecipeTiers(currentRecipe);
        }}
        onBack={onBack}
      />

      {/* Final Level Victory & Master Baker Completion Modal */}
      {isGameComplete && (
        <div
          data-testid="bakery-victory-panel"
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-amber-950/85 backdrop-blur-md animate-fade-in pointer-events-auto"
        >
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-amber-900/95 border-2 border-pink-400/60 shadow-[0_20px_60px_rgba(244,114,182,0.45)] text-center text-white">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-950/80 border-2 border-pink-400/60 flex items-center justify-center text-4xl mb-4 shadow-inner">
              🎂
            </div>

            {/* Title */}
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-2 tracking-wide">
              Master Baker!
            </h2>

            {/* Message */}
            <p className="text-pink-200 text-sm font-medium mb-5">
              Amazing work! You baked every magical recipe!
            </p>

            {/* Three gold stars celebratory reward */}
            <div data-testid="victory-stars" className="flex items-center justify-center gap-3 mb-6">
              {[1, 2, 3].map((starNum) => (
                <div
                  key={`star-${starNum}`}
                  className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-yellow-400/50 flex items-center justify-center shadow-lg"
                >
                  <Star size={28} className="fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]" />
                </div>
              ))}
            </div>

            {/* Actual final score from the game */}
            <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-950/70 border border-pink-400/30 mb-6 w-fit mx-auto">
              <Sparkles size={20} className="text-yellow-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-pink-300">Final Score</div>
                <div className="text-xl font-black text-yellow-300 font-mono" data-testid="final-score">
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
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-pink-500/30 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw size={18} />
                <span>Play Again</span>
              </button>
              <button
                type="button"
                data-testid="back-to-games-btn"
                onClick={handleBackToGames}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-950 hover:bg-amber-800 text-pink-200 border border-pink-400/40 font-extrabold text-sm transition-all cursor-pointer active:scale-95"
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

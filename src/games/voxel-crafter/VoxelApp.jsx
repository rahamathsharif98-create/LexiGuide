import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Star, RotateCcw, ArrowLeft, Sparkles } from 'lucide-react';
import VoxelHUD from './hud/VoxelHUD';
import VoxelWorld from './VoxelWorld';
import { CRAFT_RECIPES, getCraftRecipe } from './engine/craftRecipes';
import {
  loadVoxelCrafterCheckpointData,
  saveVoxelCrafterCheckpoint,
  resetVoxelCrafterCheckpoint,
} from './engine/voxelCrafterCheckpoint';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

/**
 * Computes block next-indicators so that only the first matching unplaced
 * block receives the glowing aura, correctly handling repeated letters (e.g. TREE).
 */
function computeBlockNextState(blocksList, targetWord, placedCount) {
  if (placedCount >= targetWord.length) {
    return blocksList.map((b) => ({ ...b, isNext: false }));
  }

  const nextLetter = targetWord[placedCount];
  let found = false;

  return blocksList.map((b) => {
    if (!b.isPlaced && b.letter === nextLetter && !found) {
      found = true;
      return { ...b, isNext: true };
    }
    return { ...b, isNext: false };
  });
}

export default function VoxelApp({
  childId,
  targetRecipeIndex = null,
  onBack,
  onComplete,
  onResetSession,
  onRoundComplete,
  onRoundChange,
  onOpenStages,
}) {
  const initialCheckpoint = useMemo(
    () => loadVoxelCrafterCheckpointData(childId, CRAFT_RECIPES.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [recipeIndex, setRecipeIndex] = useState(() => {
    if (
      typeof targetRecipeIndex === 'number' &&
      targetRecipeIndex >= 0 &&
      targetRecipeIndex < CRAFT_RECIPES.length
    ) {
      return targetRecipeIndex;
    }
    return initialCheckpoint.recipeIndex;
  });
  const currentRecipe = useMemo(() => getCraftRecipe(recipeIndex), [recipeIndex]);
  const [recipesCrafted, setRecipesCrafted] = useState(initialCheckpoint.recipesCrafted);
  const [placedLetters, setPlacedLetters] = useState([]);
  const [score, setScore] = useState(initialCheckpoint.score);
  const [stars, setStars] = useState(initialCheckpoint.stars);
  const [streak, setStreak] = useState(initialCheckpoint.streak);
  const [isCrafted, setIsCrafted] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // Synchronous ref guards & state refs to eliminate rapid-click desync and duplicate clicks
  const isTransitioningRef = useRef(false);
  const isGameCompleteRef = useRef(false);
  const transitionTimeoutRef = useRef(null);
  const cheerTimeoutRef = useRef(null);
  const placedLettersRef = useRef([]);
  const placedBlockIdsRef = useRef(new Set());
  const scoreRef = useRef(initialCheckpoint.score);
  const starsRef = useRef(initialCheckpoint.stars);
  const streakRef = useRef(initialCheckpoint.streak);
  const recipesCraftedRef = useRef(initialCheckpoint.recipesCrafted);
  const recipeIndexRef = useRef(
    typeof targetRecipeIndex === 'number' &&
      targetRecipeIndex >= 0 &&
      targetRecipeIndex < CRAFT_RECIPES.length
      ? targetRecipeIndex
      : initialCheckpoint.recipeIndex
  );

  // Available blocks
  const [blocks, setBlocks] = useState([]);

  // VFX & Mascot State
  const [burstPos, setBurstPos] = useState([0, 1.6, 0]);
  const [burstKey, setBurstKey] = useState(0);
  const [floatingText, setFloatingText] = useState('PERFECT!');
  const [floatingTextKey, setFloatingTextKey] = useState(0);
  const [mascotState, setMascotState] = useState('idle');

  // Synchronize on childId change (e.g. child profile switched while component is active)
  useEffect(() => {
    const cp = loadVoxelCrafterCheckpointData(childId, CRAFT_RECIPES.length);
    recipeIndexRef.current = cp.recipeIndex;
    recipesCraftedRef.current = cp.recipesCrafted;
    scoreRef.current = cp.score;
    starsRef.current = cp.stars;
    streakRef.current = cp.streak;
    placedLettersRef.current = [];
    placedBlockIdsRef.current.clear();

    setRecipeIndex(cp.recipeIndex);
    setRecipesCrafted(cp.recipesCrafted);
    setScore(cp.score);
    setStars(cp.stars);
    setStreak(cp.streak);
    setIsGameComplete(false);
    setIsCrafted(false);
    isGameCompleteRef.current = false;
    isTransitioningRef.current = false;
  }, [childId]);

  useEffect(() => {
    if (typeof targetRecipeIndex === 'number' && targetRecipeIndex >= 0 && targetRecipeIndex < CRAFT_RECIPES.length) {
      recipeIndexRef.current = targetRecipeIndex;
      setRecipeIndex(targetRecipeIndex);
      setIsCrafted(false);
      setPlacedLetters([]);
      placedLettersRef.current = [];
      placedBlockIdsRef.current.clear();
      isTransitioningRef.current = false;
    }
  }, [targetRecipeIndex]);

  useEffect(() => {
    onRoundChange?.(recipeIndex);
  }, [recipeIndex, onRoundChange]);

  // Cleanup timers, document cursor, and speech on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default';
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      if (cheerTimeoutRef.current) clearTimeout(cheerTimeoutRef.current);
      gameSound.stopSpeech?.();
    };
  }, []);

  // Initialize recipe blocks
  const initRecipeBlocks = useCallback((recipe) => {
    if (isGameCompleteRef.current) return;
    const letters = recipe.word.split('');
    const validBlocks = letters.map((l, idx) => ({
      letter: l,
      order: idx,
      isValid: true,
      blockColor: recipe.blockColor,
    }));

    const distractorBlocks = recipe.distractors.map((d) => ({
      letter: d,
      order: -1,
      isValid: false,
      blockColor: '#64748b',
    }));

    const combined = [...validBlocks, ...distractorBlocks].sort(() => Math.random() - 0.5);

    // Positions on the inventory perimeter for up to 10 blocks
    const inventoryPositions = [
      [-3.5, 1.2, 0.2],
      [3.5, 1.2, 0.2],
      [-2.6, 1.2, 2.2],
      [2.6, 1.2, 2.2],
      [0, 1.2, 2.8],
      [-3.8, 1.2, -1.6],
      [3.8, 1.2, -1.6],
      [-1.4, 1.2, 2.7],
      [1.4, 1.2, 2.7],
      [-4.0, 1.2, 0.8],
    ];

    const rawGenerated = combined.map((item, idx) => ({
      id: `voxel-${recipe.id}-${item.letter}-${idx}`,
      letter: item.letter,
      order: item.order,
      isValid: item.isValid,
      blockColor: item.blockColor,
      pos: inventoryPositions[idx % inventoryPositions.length],
      isPlaced: false,
      slotIndex: 0,
      isNext: false,
    }));

    // Assign glowing next aura strictly to the first matching unplaced block
    const generated = computeBlockNextState(rawGenerated, recipe.word, 0);

    placedLettersRef.current = [];
    placedBlockIdsRef.current.clear();
    setBlocks(generated);
    setPlacedLetters([]);
    setIsCrafted(false);
    setMascotState('idle');
    isTransitioningRef.current = false;

    // Sweet voice prompt on recipe start
    gameSound.stopSpeech?.();
    gameSound.speakCompanion(recipe.speechText);
  }, []);

  useEffect(() => {
    if (!isGameCompleteRef.current) {
      initRecipeBlocks(currentRecipe);
    }
  }, [currentRecipe, initRecipeBlocks]);

  // Handle block click with rapid-click & duplicate-selection protection
  const handleSelectBlock = useCallback(
    (block) => {
      if (
        !block ||
        block.isPlaced ||
        placedBlockIdsRef.current.has(block.id) ||
        isCrafted ||
        isGameCompleteRef.current ||
        isTransitioningRef.current
      ) {
        return;
      }

      const currentPlaced = placedLettersRef.current;
      const expectedLetter = currentRecipe.word[currentPlaced.length];

      if (block.letter === expectedLetter) {
        // Correct block! Lock this specific block ID synchronously
        placedBlockIdsRef.current.add(block.id);

        const nextPlaced = [...currentPlaced, block.letter];
        placedLettersRef.current = nextPlaced;
        const newSlot = currentPlaced.length;
        const isComplete = nextPlaced.length === currentRecipe.word.length;

        // Playful musical chime ascending + snap
        gameSound.playLetterNote(newSlot);
        gameSound.playSnap();

        // Trigger 3D sawdust & spark explosion + camera shake + mascot cheer
        const slotsCount = currentRecipe.word.length;
        const targetX = (newSlot - (slotsCount - 1) / 2) * 0.7;
        setBurstPos([targetX, 1.65, 0]);
        setBurstKey(Date.now());

        // Floating action badge
        const cheerWords = ['NICE SNAP!', 'GREAT JOB!', 'SUPER CRAFT!', 'PERFECT!'];
        setFloatingText(isComplete ? 'EPIC CRAFT!' : cheerWords[newSlot % cheerWords.length]);
        setFloatingTextKey(Date.now());

        // Mascot cheer jump with timer cleanup
        if (cheerTimeoutRef.current) clearTimeout(cheerTimeoutRef.current);
        setMascotState('cheer');
        cheerTimeoutRef.current = setTimeout(() => {
          if (!isTransitioningRef.current && !isGameCompleteRef.current) {
            setMascotState('idle');
          }
        }, 1000);

        const currentStreak = streakRef.current;
        const letterScore = 150 * currentStreak;
        const nextStreak = Math.min(currentStreak + 1, 5);
        streakRef.current = nextStreak;

        setPlacedLetters(nextPlaced);
        setStreak(nextStreak);

        // Update block states and recompute isNext indicators cleanly
        setBlocks((prev) => {
          const updated = prev.map((b) => {
            if (b.id === block.id) {
              return { ...b, isPlaced: true, slotIndex: newSlot, isNext: false };
            }
            return b;
          });
          return computeBlockNextState(updated, currentRecipe.word, nextPlaced.length);
        });

        if (isComplete) {
          isTransitioningRef.current = true;
          setIsCrafted(true);

          const roundBonus = 500;
          const nextScore = scoreRef.current + letterScore + roundBonus;
          const nextStars = starsRef.current + 1;
          const nextCrafted = recipesCraftedRef.current + 1;

          scoreRef.current = nextScore;
          starsRef.current = nextStars;
          recipesCraftedRef.current = nextCrafted;

          setScore(nextScore);
          setStars(nextStars);
          setRecipesCrafted(nextCrafted);
          setMascotState('victory');

          // Emit learning telemetry
          onRoundComplete?.({
            isCorrect: true,
            recipe: currentRecipe,
            stars: 1,
            xp: 25,
            score: roundBonus,
          });

          // Victory celebration fanfare and cheering voice
          gameSound.stopSpeech?.();
          gameSound.playFanfare();
          gameSound.speakCompanion(`Awesome craft! You built the ${currentRecipe.reward}!`);

          const isFinalRound = recipeIndexRef.current >= CRAFT_RECIPES.length - 1;

          if (isFinalRound) {
            // VICTORY: Stop the loop, persist completed state, fire onComplete, and display victory modal
            isGameCompleteRef.current = true;
            saveVoxelCrafterCheckpoint(childId, {
              recipeIndex: 0,
              recipesCrafted: nextCrafted,
              score: nextScore,
              stars: nextStars,
              streak: 1,
              isCompleted: true,
            });

            onComplete?.({
              score: nextScore,
              stars: nextStars,
              recipesCrafted: nextCrafted,
              roundsAttempted: nextCrafted,
              roundsCorrect: nextCrafted,
            });

            transitionTimeoutRef.current = setTimeout(() => {
              setIsGameComplete(true);
              setMascotState('victory');
              gameSound.stopSpeech?.();
              gameSound.playFanfare();
              gameSound.speakCompanion(
                'Master Voxel Crafter! Incredible building! You crafted every voxel creation!'
              );
            }, 1800);
          } else {
            // Advance to next recipe and persist intermediate checkpoint
            const nextRecipeIndex = recipeIndexRef.current + 1;
            recipeIndexRef.current = nextRecipeIndex;

            saveVoxelCrafterCheckpoint(childId, {
              recipeIndex: nextRecipeIndex,
              recipesCrafted: nextCrafted,
              score: nextScore,
              stars: nextStars,
              streak: nextStreak,
              isCompleted: false,
            });

            transitionTimeoutRef.current = setTimeout(() => {
              setRecipeIndex(nextRecipeIndex);
              setMascotState('idle');
              isTransitioningRef.current = false;
            }, 3200);
          }
        } else {
          const nextScore = scoreRef.current + letterScore;
          scoreRef.current = nextScore;
          setScore(nextScore);
        }
      } else {
        // Emit attempt error telemetry
        onRoundComplete?.({
          isCorrect: false,
          recipe: currentRecipe,
        });

        // Gentle oops on wrong block
        streakRef.current = 1;
        setStreak(1);
        gameSound.stopSpeech?.();
        gameSound.playGentleOops();
        gameSound.speakCompanion(`Let's look for block ${expectedLetter}!`);
      }
    },
    [
      childId,
      currentRecipe,
      isCrafted,
      onRoundComplete,
      onComplete,
    ]
  );

  // Reset for a fresh game run
  const handlePlayAgain = useCallback(() => {
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    if (cheerTimeoutRef.current) clearTimeout(cheerTimeoutRef.current);
    isGameCompleteRef.current = false;
    isTransitioningRef.current = false;

    resetVoxelCrafterCheckpoint(childId);

    recipeIndexRef.current = 0;
    recipesCraftedRef.current = 0;
    scoreRef.current = 0;
    starsRef.current = 0;
    streakRef.current = 1;
    placedLettersRef.current = [];
    placedBlockIdsRef.current.clear();
    document.body.style.cursor = 'default';

    setRecipeIndex(0);
    setRecipesCrafted(0);
    setScore(0);
    setStars(0);
    setStreak(1);
    setIsCrafted(false);
    setIsGameComplete(false);
    setMascotState('idle');

    onResetSession?.();

    gameSound.stopSpeech?.();
    gameSound.speakCompanion(CRAFT_RECIPES[0].speechText);
  }, [childId, onResetSession]);

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-sky-900 select-none">
      {/* 3D Voxel World Canvas with Enhanced VFX, Mascot & Camera Juice */}
      <VoxelWorld
        blocks={blocks}
        isCrafted={isCrafted || isGameComplete}
        rewardName={currentRecipe.reward}
        wordLength={currentRecipe.word.length}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        mascotState={mascotState}
        onSelectBlock={handleSelectBlock}
      />

      {/* High-Energy Fever Mode Overlay positioned safely below HUD */}
      <VFXFeverOverlay streak={streak} bannerClassName="top-32 lg:top-24" />

      {/* Screen celebration confetti on completed craft or game victory */}
      <VFXScreenConfetti active={isCrafted || isGameComplete} duration={3600} />

      {/* Voxel Blueprint HUD */}
      <VoxelHUD
        recipe={currentRecipe}
        placedLetters={placedLetters}
        score={score}
        stars={stars}
        streak={streak}
        level={recipeIndex + 1}
        totalLevels={CRAFT_RECIPES.length}
        isCrafted={isCrafted}
        onSpeakPrompt={() => {
          gameSound.stopSpeech?.();
          gameSound.speakCompanion(currentRecipe.prompt);
        }}
        onResetCraft={() => {
          if (!isGameCompleteRef.current && !isTransitioningRef.current) {
            gameSound.stopSpeech?.();
            initRecipeBlocks(currentRecipe);
          }
        }}
        onBack={() => {
          gameSound.stopSpeech?.();
          onBack?.();
        }}
        onOpenStages={onOpenStages}
      />

      {/* Victory Celebration Modal */}
      {isGameComplete && (
        <div
          data-testid="victory-modal"
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/85 backdrop-blur-md animate-fade-in"
        >
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-emerald-900 via-sky-950 to-slate-950 border-2 border-emerald-400/60 shadow-[0_20px_50px_rgba(16,185,129,0.5)] text-center select-none">
            {/* Title Icon */}
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-3xl shadow-lg">
              🧱
            </div>

            {/* Title */}
            <h2 className="font-display font-black text-2xl sm:text-3xl text-emerald-300 mb-2 tracking-wide">
              Master Voxel Crafter!
            </h2>

            {/* Subtitle / Message */}
            <p className="text-emerald-200 text-sm font-semibold mb-5">
              Incredible building! You crafted every 3D voxel creation on your workbench!
            </p>

            {/* Three gold stars celebratory reward presentation */}
            <div data-testid="victory-stars" className="flex items-center justify-center gap-3 mb-6">
              {[1, 2, 3].map((starNum) => (
                <div
                  key={`star-${starNum}`}
                  className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-400/60 flex items-center justify-center shadow-lg"
                >
                  <Star size={28} className="fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]" />
                </div>
              ))}
            </div>

            {/* Final score */}
            <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900/90 border border-emerald-500/40 mb-6 w-fit mx-auto shadow-inner">
              <Sparkles size={20} className="text-yellow-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">Final Score</div>
                <div className="text-xl font-black text-white font-mono" data-testid="final-score">
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
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/30 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw size={18} />
                <span>Play Again</span>
              </button>
              <button
                type="button"
                data-testid="back-to-games-btn"
                onClick={() => {
                  gameSound.stopSpeech?.();
                  onBack?.();
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-emerald-200 border border-emerald-600/40 font-bold text-sm transition-all cursor-pointer active:scale-95"
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

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import VoxelHUD from './hud/VoxelHUD';
import VoxelWorld from './VoxelWorld';
import { CRAFT_RECIPES, getCraftRecipe } from './engine/craftRecipes';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

export default function VoxelApp({ onBack, onRoundComplete }) {
  const [recipeIndex, setRecipeIndex] = useState(0);
  const currentRecipe = useMemo(() => getCraftRecipe(recipeIndex), [recipeIndex]);
  const [placedLetters, setPlacedLetters] = useState([]);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(1);
  const [isCrafted, setIsCrafted] = useState(false);

  // Available blocks
  const [blocks, setBlocks] = useState([]);

  // VFX & Mascot State
  const [burstPos, setBurstPos] = useState([0, 1.6, 0]);
  const [burstKey, setBurstKey] = useState(0);
  const [floatingText, setFloatingText] = useState('PERFECT!');
  const [floatingTextKey, setFloatingTextKey] = useState(0);
  const [mascotState, setMascotState] = useState('idle');

  // Initialize recipe blocks
  const initRecipeBlocks = useCallback((recipe) => {
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

    // Positions on the inventory perimeter
    const inventoryPositions = [
      [-3.5, 1.2, 0],
      [3.5, 1.2, 0],
      [-2.6, 1.2, 2.2],
      [2.6, 1.2, 2.2],
      [0, 1.2, 2.8],
      [-4.0, 1.2, -1.8],
    ];

    const generated = combined.map((item, idx) => ({
      id: `voxel-${recipe.id}-${item.letter}-${idx}`,
      letter: item.letter,
      order: item.order,
      isValid: item.isValid,
      blockColor: item.blockColor,
      pos: inventoryPositions[idx % inventoryPositions.length],
      isPlaced: false,
      slotIndex: 0,
      isNext: item.letter === letters[0],
    }));

    setBlocks(generated);
    setPlacedLetters([]);
    setIsCrafted(false);
    setMascotState('idle');

    // Sweet voice prompt on recipe start
    gameSound.speakCompanion(recipe.speechText);
  }, []);

  useEffect(() => {
    initRecipeBlocks(currentRecipe);
  }, [currentRecipe, initRecipeBlocks]);

  // Handle block click
  const handleSelectBlock = useCallback(
    (block) => {
      if (block.isPlaced || isCrafted) return;

      const expectedLetter = currentRecipe.word[placedLetters.length];

      if (block.letter === expectedLetter) {
        // Correct block!
        const nextPlaced = [...placedLetters, block.letter];
        const newSlot = placedLetters.length;
        const isComplete = nextPlaced.length === currentRecipe.word.length;

        // Playful musical chime ascending + snap
        gameSound.playLetterNote(newSlot);
        gameSound.playSnap();

        // Trigger 3D sawdust & spark explosion + camera shake + mascot cheer
        const targetX = -1.05 + newSlot * 0.7;
        setBurstPos([targetX, 1.65, 0]);
        setBurstKey(Date.now());

        // Floating action badge
        const cheerWords = ['NICE SNAP!', 'GREAT JOB!', 'SUPER CRAFT!', 'PERFECT!'];
        setFloatingText(isComplete ? 'EPIC CRAFT!' : cheerWords[newSlot % cheerWords.length]);
        setFloatingTextKey(Date.now());

        // Mascot cheer jump
        setMascotState('cheer');
        setTimeout(() => setMascotState('idle'), 1000);

        setPlacedLetters(nextPlaced);
        setScore((prev) => prev + 150 * streak);
        setStreak((prev) => Math.min(prev + 1, 5));

        // Mark block placed
        setBlocks((prev) =>
          prev.map((b) => {
            if (b.id === block.id) return { ...b, isPlaced: true, slotIndex: newSlot, isNext: false };
            if (!isComplete && b.letter === currentRecipe.word[nextPlaced.length]) {
              return { ...b, isNext: true };
            }
            return { ...b, isNext: false };
          })
        );

        if (isComplete) {
          setIsCrafted(true);
          setStars((prev) => prev + 1);
          setScore((prev) => prev + 500);
          setMascotState('victory');

          // Emit learning telemetry
          onRoundComplete?.({
            isCorrect: true,
            recipe: currentRecipe,
            stars: 1,
            xp: 25,
            score: 500,
          });

          // Victory celebration fanfare and cheering voice
          gameSound.playFanfare();
          gameSound.speakCompanion(`Awesome craft! You built the ${currentRecipe.reward}!`);

          setTimeout(() => {
            setRecipeIndex((prev) => (prev + 1) % CRAFT_RECIPES.length);
          }, 3800);
        }
      } else {
        // Emit attempt error telemetry
        onRoundComplete?.({
          isCorrect: false,
          recipe: currentRecipe,
        });

        // Gentle oops on wrong block
        setStreak(1);
        gameSound.playGentleOops();
        gameSound.speakCompanion(`Let's look for block ${expectedLetter}!`);
      }
    },
    [placedLetters, currentRecipe, isCrafted, streak, onRoundComplete]
  );

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-sky-900">
      {/* 3D Voxel World Canvas with Enhanced VFX, Mascot & Camera Juice */}
      <VoxelWorld
        blocks={blocks}
        isCrafted={isCrafted}
        rewardName={currentRecipe.reward}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        mascotState={mascotState}
        onSelectBlock={handleSelectBlock}
      />

      {/* High-Energy Fever Mode Overlay when streak >= 3 */}
      <VFXFeverOverlay streak={streak} />

      {/* Screen celebration confetti on completed craft */}
      <VFXScreenConfetti active={isCrafted} duration={3600} />

      {/* Voxel Blueprint HUD */}
      <VoxelHUD
        recipe={currentRecipe}
        placedLetters={placedLetters}
        score={score}
        stars={stars}
        streak={streak}
        isCrafted={isCrafted}
        onSpeakPrompt={() => gameSound.speakCompanion(currentRecipe.prompt)}
        onResetCraft={() => initRecipeBlocks(currentRecipe)}
        onBack={onBack}
      />
    </div>
  );
}

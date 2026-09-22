import React, { useState, useEffect, useCallback, useMemo } from 'react';
import BakeryHUD from './hud/BakeryHUD';
import BakeryWorld from './BakeryWorld';
import { BAKERY_RECIPES, getBakeryRecipe } from './engine/bakeryRecipes';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

export default function BakeryApp({ onBack, onRoundComplete }) {
  const [recipeIndex, setRecipeIndex] = useState(0);
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

  // VFX State
  const [burstPos, setBurstPos] = useState([0, 1.8, 0]);
  const [burstKey, setBurstKey] = useState(0);

  // Initialize tiers for current recipe
  const initRecipeTiers = useCallback((recipe) => {
    const validSyllables = recipe.syllables.map((s, idx) => ({
      syllable: s,
      order: idx,
      isValid: true,
      color: recipe.frostingColors[idx % recipe.frostingColors.length] || '#fb7185',
      frostingColor: '#fef08a',
    }));

    const distractorItems = recipe.distractors.map((d) => ({
      syllable: d,
      order: -1,
      isValid: false,
      color: '#94a3b8',
      frostingColor: '#cbd5e1',
    }));

    const combined = [...validSyllables, ...distractorItems].sort(() => Math.random() - 0.5);

    const positions = [
      [-4.5, 1.2, 0.5],
      [4.5, 1.2, 0.5],
      [-5.5, 1.2, -1.8],
      [5.5, 1.2, -1.8],
      [0, 1.2, 3.2],
    ];

    const generated = combined.map((item, idx) => ({
      id: `tier-${recipe.id}-${item.syllable}-${idx}`,
      syllable: item.syllable,
      order: item.order,
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
      if (tier.isStacked || isBakeComplete) return;

      const expectedSyllable = currentRecipe.syllables[stackedSyllables.length];

      if (tier.syllable === expectedSyllable) {
        // Correct syllable!
        const nextStacked = [...stackedSyllables, tier.syllable];
        const newStackIndex = stackedSyllables.length;
        const isComplete = nextStacked.length === currentRecipe.syllables.length;

        // Playful baking sparkle chime + ascending scale note
        gameSound.playSparkle();
        gameSound.playLetterNote(newStackIndex);

        // Trigger frosting sparkle burst at stacked position
        setBurstPos([0, 1.2 + newStackIndex * 0.9, 0]);
        setBurstKey(Date.now());

        // Mascot cheer & floating comic text
        const isFever = streak >= 2;
        setFloatingText(isFever ? 'SWEET COMBO! 2X' : 'FROSTING SNAP!');
        setFloatingTextKey(Date.now());
        setMascotState('celebrate');
        setTimeout(() => setMascotState('idle'), 1200);

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
          setMascotState('victory');

          onRoundComplete?.({
            isCorrect: true,
            recipe: currentRecipe,
            stars: 1,
            xp: 25,
            score: 500,
          });

          // Fanfare and chef cheer
          gameSound.playFanfare();
          gameSound.speakCompanion(`Delicious! You baked the magical ${currentRecipe.compoundWord}!`);

          setTimeout(() => {
            setRecipeIndex((prev) => (prev + 1) % BAKERY_RECIPES.length);
            setMascotState('idle');
          }, 3400);
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
    [stackedSyllables, currentRecipe, isBakeComplete, streak, onRoundComplete]
  );

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-amber-950">
      {/* 3D Kitchen Canvas with Enhanced VFX */}
      <BakeryWorld
        tiers={tiers}
        isBakeComplete={isBakeComplete}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        mascotState={mascotState}
        onSelectTier={handleSelectTier}
      />

      {/* Screen celebration confetti on completed cake */}
      <VFXScreenConfetti active={isBakeComplete} duration={3200} />

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
        onResetRecipe={() => initRecipeTiers(currentRecipe)}
        onBack={onBack}
      />
    </div>
  );
}

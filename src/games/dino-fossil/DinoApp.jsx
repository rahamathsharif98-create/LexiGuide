import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DinoHUD from './hud/DinoHUD';
import DinoWorld from './DinoWorld';
import { DINO_TARGETS, getDinoTarget } from './engine/dinoTargets';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

export default function DinoApp({ onBack, onRoundComplete }) {
  const [targetIndex, setTargetIndex] = useState(0);
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

  // Initialize slabs for current target
  const initTargetSlabs = useCallback((target) => {
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

    // Soft companion announcement
    gameSound.speakCompanion(target.speechText);
  }, []);

  useEffect(() => {
    initTargetSlabs(currentTarget);
  }, [currentTarget, initTargetSlabs]);

  // Handle dusting off a slab
  const handleBrushSlab = useCallback(
    (slab) => {
      if (slab.isExcavated || isExcavated) return;

      const expectedChunk = excavatedChunks.length === 0 ? currentTarget.onset : currentTarget.rime;

      if (slab.chunk === expectedChunk) {
        // Correct chunk!
        const nextExcavated = [...excavatedChunks, slab.chunk];
        const isComplete = nextExcavated.length === 2;

        // Playful brush dusting sound + ascending note
        gameSound.playBrush();
        gameSound.playLetterNote(excavatedChunks.length);

        // Dust puff VFX at slab position
        setBurstPos(slab.pos || [0, 1, 0]);
        setBurstKey(Date.now());

        // Mascot cheer & floating comic text
        const isFever = streak >= 2;
        setFloatingText(isFever ? 'FOSSIL COMBO! 2X' : 'DUSTED!');
        setFloatingTextKey(Date.now());
        setMascotState('celebrate');
        setTimeout(() => setMascotState('idle'), 1200);

        setExcavatedChunks(nextExcavated);
        setScore((prev) => prev + 150 * (isFever ? 2 : 1));
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
          setStars((prev) => prev + 1);
          setScore((prev) => prev + 500);
          setFloatingText('FOSSIL COMPLETE! 🦖');
          setFloatingTextKey(Date.now());
          setMascotState('victory');

          onRoundComplete?.({
            isCorrect: true,
            target: currentTarget,
            stars: 1,
            xp: 25,
            score: 500,
          });

          // Victory celebration
          gameSound.playFanfare();
          gameSound.speakCompanion(`Roar! You excavated the ${currentTarget.name} dinosaur fossil!`);

          setTimeout(() => {
            setTargetIndex((prev) => (prev + 1) % DINO_TARGETS.length);
            setMascotState('idle');
          }, 3400);
        }
      } else {
        // Gentle oops
        onRoundComplete?.({
          isCorrect: false,
          target: currentTarget,
        });

        setStreak(1);
        setMascotState('idle');
        gameSound.playGentleOops();
        gameSound.speakCompanion(`Keep digging! Find ${expectedChunk} first!`);
      }
    },
    [excavatedChunks, currentTarget, isExcavated, streak, onRoundComplete]
  );

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-stone-950">
      {/* 3D Dig Site Canvas with Enhanced VFX */}
      <DinoWorld
        slabs={slabs}
        isExcavated={isExcavated}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        mascotState={mascotState}
        onBrushSlab={handleBrushSlab}
      />

      {/* Screen celebration confetti on completed dinosaur excavation */}
      <VFXScreenConfetti active={isExcavated} duration={3200} />

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
        onResetFossil={() => initTargetSlabs(currentTarget)}
        onBack={onBack}
      />
    </div>
  );
}

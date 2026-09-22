import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LabyrinthHUD from './hud/LabyrinthHUD';
import LabyrinthWorld from './LabyrinthWorld';
import { LABYRINTH_RIDDLES, getLabyrinthRiddle } from './engine/labyrinthGlyphs';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

export default function LabyrinthApp({ onBack, onRoundComplete }) {
  const [riddleIndex, setRiddleIndex] = useState(0);
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

  // VFX State
  const [burstPos, setBurstPos] = useState([0, 1, 0]);
  const [burstKey, setBurstKey] = useState(0);

  // Initialize riddle keystones
  const initRiddleKeystones = useCallback((riddle) => {
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

    const corridorCoords = [
      [-4.0, 0, -2],
      [4.0, 0, -2],
      [-2.2, 0, -5],
      [2.2, 0, -5],
      [0, 0, -8],
      [0, 0, 1.5],
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

    // Oracle guidance voice
    gameSound.speakCompanion(riddle.speechText);
  }, []);

  useEffect(() => {
    initRiddleKeystones(currentRiddle);
  }, [currentRiddle, initRiddleKeystones]);

  // Handle keystone selection
  const handleCollectKeystone = useCallback(
    (keystone) => {
      if (keystone.isCollected || isUnlocked) return;

      const expectedLetter = currentRiddle.word[collectedGlyphs.length];

      if (keystone.glyph === expectedLetter) {
        // Correct rune keystone!
        const nextCollected = [...collectedGlyphs, keystone.glyph];
        const newSlot = collectedGlyphs.length;
        const isComplete = nextCollected.length === currentRiddle.word.length;

        // Playful rune chime note (never screaming letters)
        gameSound.playLetterNote(newSlot);

        // Ancient rune sparkle burst at keystone position
        setBurstPos(keystone.pos || [0, 1, 0]);
        setBurstKey(Date.now());

        // Mascot cheer & floating comic text
        const isFever = streak >= 2;
        setFloatingText(isFever ? 'LABYRINTH COMBO! 2X' : 'RUNE UNLOCKED!');
        setFloatingTextKey(Date.now());
        setMascotState('celebrate');
        setTimeout(() => setMascotState('idle'), 1200);

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
          setMascotState('victory');

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

          setTimeout(() => {
            setRiddleIndex((prev) => (prev + 1) % LABYRINTH_RIDDLES.length);
            setMascotState('idle');
          }, 3400);
        }
      } else {
        // Incorrect keystone
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
    [collectedGlyphs, currentRiddle, isUnlocked, streak, onRoundComplete]
  );

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-stone-950">
      {/* 3D Labyrinth World Canvas with Enhanced VFX */}
      <LabyrinthWorld
        keystones={keystones}
        isUnlocked={isUnlocked}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        mascotState={mascotState}
        onCollectKeystone={handleCollectKeystone}
      />

      {/* Screen celebration confetti on vault unlock */}
      <VFXScreenConfetti active={isUnlocked} duration={3200} />

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
        onResetLabyrinth={() => initRiddleKeystones(currentRiddle)}
        onBack={onBack}
      />
    </div>
  );
}

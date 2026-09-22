import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CloudHUD from './hud/CloudHUD';
import CloudWorld from './CloudWorld';
import { BOUNCE_LEVELS, getBounceLevel } from './engine/sightWordBounces';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

export default function CloudApp({ onBack, onRoundComplete }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = useMemo(() => getBounceLevel(levelIndex), [levelIndex]);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(1);
  const [altitude, setAltitude] = useState(25);
  const [isSummitReached, setIsSummitReached] = useState(false);
  const [bunnyPos, setBunnyPos] = useState([0, 1.0, 0]);
  const [mascotState, setMascotState] = useState('idle');
  const [floatingText, setFloatingText] = useState('SUPER BOUNCE!');
  const [floatingTextKey, setFloatingTextKey] = useState(0);

  // Platforms
  const [platforms, setPlatforms] = useState([]);

  // VFX State
  const [burstPos, setBurstPos] = useState([0, 2.5, -1]);
  const [burstKey, setBurstKey] = useState(0);

  // Initialize platforms
  const initLevelPlatforms = useCallback((level) => {
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

    // Gentle companion guidance
    gameSound.speakCompanion(level.speechText);
  }, []);

  useEffect(() => {
    initLevelPlatforms(currentLevel);
  }, [currentLevel, initLevelPlatforms]);

  // Handle bouncing on cloud
  const handleBounceCloud = useCallback(
    (cloud) => {
      if (isSummitReached) return;

      if (cloud.isTarget) {
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
        setTimeout(() => setMascotState('idle'), 1200);

        setBunnyPos(cloud.pos);
        setScore((prev) => prev + 200 * (isFever ? 2 : 1));
        setStreak((prev) => Math.min(prev + 1, 5));
        setAltitude((prev) => prev + 50);

        setPlatforms((prev) =>
          prev.map((p) => (p.id === cloud.id ? { ...p, isBounced: true } : p))
        );

        setIsSummitReached(true);
        setStars((prev) => prev + 1);
        setFloatingText('SUMMIT STAR! ⭐');
        setFloatingTextKey(Date.now());
        setMascotState('victory');

        onRoundComplete?.({
          isCorrect: true,
          level: currentLevel,
          stars: 1,
          xp: 25,
          score: 500,
        });

        // Victory fanfare and sweet cheer
        gameSound.playFanfare();
        gameSound.speakCompanion(`Boing! Super bounce! You matched ${currentLevel.targetWord}!`);

        setTimeout(() => {
          setLevelIndex((prev) => (prev + 1) % BOUNCE_LEVELS.length);
          setMascotState('idle');
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
    [currentLevel, isSummitReached, streak, onRoundComplete]
  );

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-sky-200">
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

      {/* Screen celebration confetti on summit reached */}
      <VFXScreenConfetti active={isSummitReached} duration={3000} />

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
        onSpeakPrompt={() => gameSound.speakCompanion(currentLevel.prompt)}
        onResetBounce={() => initLevelPlatforms(currentLevel)}
        onBack={onBack}
      />
    </div>
  );
}

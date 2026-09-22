import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SafariHUD from './hud/SafariHUD';
import SafariWorld from './SafariWorld';
import { SAFARI_TARGETS, getSafariTarget } from './engine/safariAnimals';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

export default function SafariApp({ onBack, onRoundComplete }) {
  const [targetIndex, setTargetIndex] = useState(0);
  const currentTarget = useMemo(() => getSafariTarget(targetIndex), [targetIndex]);
  const [photosSnapped, setPhotosSnapped] = useState(0);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(1);
  const [showFlash, setShowFlash] = useState(false);
  const [isPhotoComplete, setIsPhotoComplete] = useState(false);
  const [mascotState, setMascotState] = useState('idle');
  const [floatingText, setFloatingText] = useState('PERFECT SNAP! 📸');
  const [floatingTextKey, setFloatingTextKey] = useState(0);

  // VFX State
  const [burstPos, setBurstPos] = useState([0, 1.5, 0]);
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    setIsPhotoComplete(false);
    setShowFlash(false);
    gameSound.speakCompanion(currentTarget.speechText);
  }, [currentTarget]);

  // Handle snapping photo
  const triggerSnap = useCallback(
    (animal) => {
      if (isPhotoComplete) return;

      if (animal.id === currentTarget.id) {
        // Flash trigger & Camera Shutter SFX
        gameSound.playShutter();
        gameSound.playLetterNote(streak);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 200);

        setBurstPos([0, 1.5, 0]);
        setBurstKey(Date.now());

        // Mascot cheer & floating comic text
        const isFever = streak >= 2;
        setFloatingText(isFever ? 'SAFARI COMBO! 2X' : 'PERFECT SNAP! 📸');
        setFloatingTextKey(Date.now());
        setMascotState('victory');

        setIsPhotoComplete(true);
        setPhotosSnapped((prev) => prev + 1);
        setScore((prev) => prev + 150 * (isFever ? 2 : 1));
        setStreak((prev) => Math.min(prev + 1, 5));
        setStars((prev) => prev + 1);

        onRoundComplete?.({
          isCorrect: true,
          animal,
          target: currentTarget,
          stars: 1,
          xp: 25,
          score: 150 * (isFever ? 2 : 1),
        });

        // Victory fanfare and wildlife fact
        gameSound.playFanfare();
        gameSound.speakCompanion(`Click! Great shot of the ${animal.animal}! ${animal.fact}`);

        setTimeout(() => {
          setTargetIndex((prev) => (prev + 1) % SAFARI_TARGETS.length);
          setMascotState('idle');
        }, 3600);
      } else {
        // Snapped wrong animal
        onRoundComplete?.({
          isCorrect: false,
          animal,
          target: currentTarget,
        });

        setStreak(1);
        setMascotState('idle');
        gameSound.playGentleOops();
        gameSound.speakCompanion(`That is the ${animal.animal}! We want to photograph the ${currentTarget.animal}!`);
      }
    },
    [currentTarget, isPhotoComplete, streak, onRoundComplete]
  );

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-stone-900">
      {/* 3D Savanna Canvas with Enhanced VFX */}
      <SafariWorld
        currentTarget={currentTarget}
        isPhotoComplete={isPhotoComplete}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        mascotState={mascotState}
        onSnapAnimal={triggerSnap}
      />

      {/* Screen celebration confetti on animal photo snap */}
      <VFXScreenConfetti active={isPhotoComplete} duration={3200} />

      {/* Radiant Rainbow Border when streak >= 3 */}
      <VFXFeverOverlay combo={streak} active={streak >= 3} />

      {/* Camera HUD */}
      <SafariHUD
        target={currentTarget}
        photosSnapped={photosSnapped}
        score={score}
        stars={stars}
        streak={streak}
        showFlash={showFlash}
        isPhotoComplete={isPhotoComplete}
        onSpeakPrompt={() => gameSound.speakCompanion(currentTarget.prompt)}
        onResetSafari={() => {
          setIsPhotoComplete(false);
          gameSound.speakCompanion(currentTarget.speechText);
        }}
        onSnapCurrent={() => triggerSnap(currentTarget)}
        onBack={onBack}
      />
    </div>
  );
}

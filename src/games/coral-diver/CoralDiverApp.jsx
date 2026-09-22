import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CoralDiverHUD from './hud/CoralDiverHUD';
import CoralDiverWorld from './CoralDiverWorld';
import { RHYME_LEVELS, getRhymeLevel } from './engine/rhymeWords';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

export default function CoralDiverApp({ onBack, onRoundComplete }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = useMemo(() => getRhymeLevel(levelIndex), [levelIndex]);
  const [collectedRhymes, setCollectedRhymes] = useState([]);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(1);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [submarineTargetPos, setSubmarineTargetPos] = useState(null);
  const [mascotState, setMascotState] = useState('idle');
  const [floatingText, setFloatingText] = useState('RHYME POP!');
  const [floatingTextKey, setFloatingTextKey] = useState(0);

  // Bubble states
  const [bubbles, setBubbles] = useState([]);

  // VFX State
  const [burstPos, setBurstPos] = useState([0, 3, 0]);
  const [burstKey, setBurstKey] = useState(0);

  // Initialize level bubbles
  const initLevelBubbles = useCallback((level) => {
    const chosenRhymes = level.validRhymes.slice(0, 3);
    const chosenDistractors = level.distractors.slice(0, 2);

    const items = [
      ...chosenRhymes.map((w) => ({ word: w, isRhyme: true })),
      ...chosenDistractors.map((w) => ({ word: w, isRhyme: false })),
    ];

    const shuffled = items.sort(() => Math.random() - 0.5);

    const bubblePositions = [
      [-6, 3.5, -2],
      [-2.5, 4.2, -5],
      [2.5, 4.0, -5],
      [6, 3.2, -2],
      [0, 2.5, 3],
    ];

    const generated = shuffled.map((item, idx) => ({
      id: `bubble-${level.id}-${item.word}-${idx}`,
      word: item.word,
      isRhyme: item.isRhyme,
      position: bubblePositions[idx % bubblePositions.length],
      isCollected: false,
    }));

    setBubbles(generated);
    setCollectedRhymes([]);
    setIsLevelComplete(false);
    setSubmarineTargetPos(null);

    // Announce voice guidance softly
    gameSound.speakCompanion(level.speechText);
  }, []);

  useEffect(() => {
    initLevelBubbles(currentLevel);
  }, [currentLevel, initLevelBubbles]);

  // Handle bubble collection
  const handleCollectBubble = useCallback(
    (bubble) => {
      if (bubble.isCollected || isLevelComplete) return;

      setSubmarineTargetPos(bubble.position);

      // Play juicy bubble pop sound + 3D burst VFX
      gameSound.playPop();
      setBurstPos(bubble.position || [0, 3, 0]);
      setBurstKey(Date.now());

      if (bubble.isRhyme) {
        // Correct rhyme!
        const nextCollected = [...collectedRhymes, bubble.word];
        const newSlot = collectedRhymes.length;

        // Joyful ascending chime note
        gameSound.playLetterNote(newSlot);

        // Mascot cheer & floating comic text
        const isFever = streak >= 2;
        setFloatingText(isFever ? 'OCEAN COMBO! 2X' : 'RHYME POP!');
        setFloatingTextKey(Date.now());
        setMascotState('celebrate');
        setTimeout(() => setMascotState('idle'), 1200);

        setCollectedRhymes(nextCollected);
        setScore((prev) => prev + 150 * (isFever ? 2 : 1));
        setStreak((prev) => Math.min(prev + 1, 5));

        // Mark bubble collected
        setBubbles((prev) =>
          prev.map((b) => (b.id === bubble.id ? { ...b, isCollected: true } : b))
        );

        if (nextCollected.length >= 3) {
          setIsLevelComplete(true);
          setStars((prev) => prev + 1);
          setScore((prev) => prev + 500);
          setFloatingText('TREASURE UNLOCKED! 💎');
          setFloatingTextKey(Date.now());
          setMascotState('victory');

          onRoundComplete?.({
            isCorrect: true,
            level: currentLevel,
            stars: 1,
            xp: 25,
            score: 500,
          });

          // Fanfare and encouraging cheer
          gameSound.playFanfare();
          gameSound.speakCompanion(`Splendid diving! You found all the words that rhyme with ${currentLevel.targetWord}!`);

          setTimeout(() => {
            setLevelIndex((prev) => (prev + 1) % RHYME_LEVELS.length);
            setMascotState('idle');
          }, 3200);
        }
      } else {
        // Incorrect bubble
        onRoundComplete?.({
          isCorrect: false,
          level: currentLevel,
        });

        setStreak(1);
        setMascotState('idle');
        gameSound.playGentleOops();
        gameSound.speakCompanion(`That word is ${bubble.word}. Let's find words that rhyme with ${currentLevel.targetWord}!`);
      }
    },
    [collectedRhymes, currentLevel, isLevelComplete, streak, onRoundComplete]
  );

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-sky-950">
      {/* 3D Underwater Reef World */}
      <CoralDiverWorld
        bubbles={bubbles}
        submarineTargetPos={submarineTargetPos}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        mascotState={mascotState}
        isLevelComplete={isLevelComplete}
        onCollectBubble={handleCollectBubble}
      />

      {/* Screen celebration confetti on level complete */}
      <VFXScreenConfetti active={isLevelComplete} duration={3000} />

      {/* Radiant Rainbow Border when streak >= 3 */}
      <VFXFeverOverlay combo={streak} active={streak >= 3} />

      {/* Submarine Sonar HUD */}
      <CoralDiverHUD
        level={currentLevel}
        collectedCount={collectedRhymes.length}
        targetCount={3}
        score={score}
        stars={stars}
        streak={streak}
        isLevelComplete={isLevelComplete}
        onSpeakPrompt={() => gameSound.speakCompanion(currentLevel.prompt)}
        onResetLevel={() => initLevelBubbles(currentLevel)}
        onBack={onBack}
      />
    </div>
  );
}

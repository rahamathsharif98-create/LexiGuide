import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SpiderHUD from './hud/SpiderHUD';
import SpiderWorld from './SpiderWorld';
import { SPIDER_LEVELS, getSpiderLevel } from './engine/spiderLevels';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

/**
 * SpiderApp.jsx
 * Full interactive game engine for "Spinny the Spider: Web Weaver"
 */
export default function SpiderApp({ onBack, onRoundComplete }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = useMemo(() => getSpiderLevel(levelIndex), [levelIndex]);

  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(1);
  const [selectedRime, setSelectedRime] = useState(null);
  const [isVictory, setIsVictory] = useState(false);
  const [spiderState, setSpiderState] = useState('idle');

  // VFX
  const [burstPos, setBurstPos] = useState([0, 2.5, 0]);
  const [burstKey, setBurstKey] = useState(0);
  const [floatingText, setFloatingText] = useState('SILKY WEAVE!');
  const [floatingTextKey, setFloatingTextKey] = useState(0);

  // Shuffled options per level
  const [shuffledOptions, setShuffledOptions] = useState([]);

  // Initialize level
  const initLevel = useCallback((level) => {
    const opts = [...level.options].sort(() => Math.random() - 0.5);
    setShuffledOptions(opts);
    setSelectedRime(null);
    setIsVictory(false);
    setSpiderState('idle');

    // Companion guidance
    gameSound.speakCompanion(level.audioPrompt);
  }, []);

  useEffect(() => {
    initLevel(currentLevel);
  }, [currentLevel, initLevel]);

  // Replay speech prompt
  const handleReplayPrompt = useCallback(() => {
    gameSound.speakCompanion(currentLevel.audioPrompt);
  }, [currentLevel]);

  // Handle child selecting a dewdrop rime node
  const handleSelectOption = useCallback(
    (option) => {
      if (isVictory) return;

      setSelectedRime(option);
      const isCorrect = option === currentLevel.targetRime;

      if (isCorrect) {
        // Correct selection!
        const isFever = streak >= 2;
        gameSound.playSnap();
        gameSound.playLetterNote(streak);
        setTimeout(() => gameSound.playSparkle(), 180);

        setBurstPos([0, 2.8, 0]);
        setBurstKey(Date.now());
        setFloatingText(isFever ? 'SILK COMBO! 2X' : 'SILKY WEAVE! ✨');
        setFloatingTextKey(Date.now());

        setSpiderState('victory');
        setIsVictory(true);

        const earnedStars = 1;
        const earnedXp = 25;
        const roundScore = 250 * (isFever ? 2 : 1);

        setScore((prev) => prev + roundScore);
        setStars((prev) => prev + earnedStars);
        setStreak((prev) => Math.min(prev + 1, 5));

        // Trigger telemetry & persistence
        onRoundComplete?.({
          isCorrect: true,
          level: currentLevel,
          stars: earnedStars,
          xp: earnedXp,
          score: roundScore,
          targetWord: currentLevel.targetWord,
        });

        // Advance to next level after celebration
        setTimeout(() => {
          if (levelIndex < SPIDER_LEVELS.length - 1) {
            setLevelIndex((prev) => prev + 1);
          } else {
            // Loop with bonus or victory fanfare
            gameSound.playFanfare();
            setLevelIndex(0);
          }
        }, 1800);
      } else {
        // Gentle comforting oops
        gameSound.playGentleOops();
        setSpiderState('weaving');
        setStreak(1);

        onRoundComplete?.({
          isCorrect: false,
          level: currentLevel,
          stars: 0,
          xp: 5,
          score: 0,
          targetWord: currentLevel.targetWord,
        });

        setTimeout(() => {
          setSelectedRime(null);
          setSpiderState('idle');
        }, 900);
      }
    },
    [isVictory, streak, currentLevel, levelIndex, onRoundComplete]
  );

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* 1. Interactive 3D World Canvas */}
      <SpiderWorld
        level={currentLevel}
        options={shuffledOptions}
        selectedRime={selectedRime}
        spiderState={spiderState}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        isVictory={isVictory}
        onSelectOption={handleSelectOption}
      />

      {/* 2. Tactile Child HUD */}
      <SpiderHUD
        level={currentLevel}
        levelIndex={levelIndex}
        totalLevels={SPIDER_LEVELS.length}
        score={score}
        stars={stars}
        streak={streak}
        selectedRime={selectedRime}
        isVictory={isVictory}
        onReplayPrompt={handleReplayPrompt}
      />

      {/* 3. Screen Confetti on victory */}
      <VFXScreenConfetti active={isVictory} count={36} />

      {/* 4. Fever Mode Visual Overlay on streak >= 3 */}
      <VFXFeverOverlay active={streak >= 3} />
    </div>
  );
}

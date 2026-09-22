import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CosmicMinerHUD from './hud/CosmicMinerHUD';
import CosmicMinerWorld from './CosmicMinerWorld';
import { SPACE_MISSIONS, getSpaceMission } from './engine/spaceWords';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

export default function CosmicMinerApp({ onBack, onRoundComplete }) {
  const [missionIndex, setMissionIndex] = useState(0);
  const currentMission = useMemo(() => getSpaceMission(missionIndex), [missionIndex]);
  const [collectedLetters, setCollectedLetters] = useState([]);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(1);
  const [rocketLaunched, setRocketLaunched] = useState(false);
  const [roverTargetPos, setRoverTargetPos] = useState(null);
  const [mascotState, setMascotState] = useState('idle');
  const [floatingText, setFloatingText] = useState('CRYSTAL MINED!');
  const [floatingTextKey, setFloatingTextKey] = useState(0);

  // Layout positions for crystals around the lunar landing zone
  const [crystals, setCrystals] = useState([]);

  // VFX State
  const [burstPos, setBurstPos] = useState([0, 1, 0]);
  const [burstKey, setBurstKey] = useState(0);

  // Initialize crystals for current mission
  const initMissionCrystals = useCallback((mission) => {
    const letters = mission.word.split('');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    // Add 2 distractor letters
    const distractors = [];
    while (distractors.length < 2) {
      const char = alphabet[Math.floor(Math.random() * alphabet.length)];
      if (!letters.includes(char) && !distractors.includes(char)) {
        distractors.push(char);
      }
    }

    const allItems = [...letters.map((l, i) => ({ letter: l, order: i, isWord: true }))];
    distractors.forEach((d) => {
      allItems.push({ letter: d, order: -1, isWord: false });
    });

    // Shuffle
    const shuffled = allItems.sort(() => Math.random() - 0.5);

    // Positions arranged in an arc around the rover (z: -4 to 5, x: -8 to 8)
    const arcPositions = [
      [-6, 1.0, -2],
      [-3, 1.0, -5],
      [0, 1.0, -7],
      [3, 1.0, -5],
      [6, 1.0, -2],
      [-4, 1.0, 3],
      [4, 1.0, 3],
    ];

    const generated = shuffled.map((item, idx) => ({
      id: `crystal-${mission.id}-${item.letter}-${idx}`,
      letter: item.letter,
      position: arcPositions[idx % arcPositions.length],
      isWord: item.isWord,
      order: item.order,
      isCollected: false,
      isNext: item.letter === letters[0],
    }));

    setCrystals(generated);
    setCollectedLetters([]);
    setRocketLaunched(false);
    setRoverTargetPos(null);

    // Gentle companion prompt on mission start
    gameSound.speakCompanion(mission.speechText);
  }, []);

  useEffect(() => {
    initMissionCrystals(currentMission);
  }, [currentMission, initMissionCrystals]);

  // Handle crystal selection
  const handleCollectCrystal = useCallback(
    (crystal) => {
      if (crystal.isCollected || rocketLaunched) return;

      const nextExpectedLetter = currentMission.word[collectedLetters.length];

      // Command rover to drive to crystal
      setRoverTargetPos(crystal.position);

      if (crystal.letter === nextExpectedLetter) {
        // Correct letter!
        const nextCollected = [...collectedLetters, crystal.letter];
        const newSlot = collectedLetters.length;

        // Playful cosmic laser SFX + ascending chime note
        gameSound.playLaserMining();
        gameSound.playLetterNote(newSlot);

        // Trigger crystal shatter particle explosion at crystal position
        setBurstPos(crystal.position || [0, 1, 0]);
        setBurstKey(Date.now());

        // Mascot cheer & floating comic text
        const isFever = streak >= 2;
        setFloatingText(isFever ? 'COSMIC COMBO! 2X' : 'CRYSTAL MINED!');
        setFloatingTextKey(Date.now());
        setMascotState('celebrate');
        setTimeout(() => setMascotState('idle'), 1200);

        setCollectedLetters(nextCollected);
        setScore((prev) => prev + 150 * (isFever ? 2 : 1));
        setStreak((prev) => Math.min(prev + 1, 5));

        // Mark crystal as collected
        setCrystals((prev) =>
          prev.map((c) => {
            if (c.id === crystal.id) return { ...c, isCollected: true, isNext: false };
            if (c.letter === currentMission.word[nextCollected.length]) {
              return { ...c, isNext: true };
            }
            return { ...c, isNext: false };
          })
        );

        // Check if word complete
        if (nextCollected.length === currentMission.word.length) {
          setRocketLaunched(true);
          setStars((prev) => prev + 1);
          setScore((prev) => prev + 500);
          setFloatingText('BLAST OFF! 🚀');
          setFloatingTextKey(Date.now());
          setMascotState('victory');

          onRoundComplete?.({
            isCorrect: true,
            mission: currentMission,
            stars: 1,
            xp: 25,
            score: 500,
          });

          // Fanfare + launching cheer
          gameSound.playFanfare();
          gameSound.speakCompanion(`Awesome! You fueled the rocket with ${currentMission.word}! Blast off!`);

          // Move to next mission after launch celebration
          setTimeout(() => {
            setMissionIndex((prev) => (prev + 1) % SPACE_MISSIONS.length);
            setMascotState('idle');
          }, 3200);
        }
      } else {
        // Incorrect letter
        onRoundComplete?.({
          isCorrect: false,
          mission: currentMission,
        });

        setStreak(1);
        setMascotState('idle');
        gameSound.playGentleOops();
        gameSound.speakCompanion(`Try letter ${nextExpectedLetter}!`);
      }
    },
    [collectedLetters, currentMission, rocketLaunched, streak, onRoundComplete]
  );

  const fuelPct = (collectedLetters.length / currentMission.word.length) * 100;

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-slate-950">
      {/* 3D Lunar World */}
      <CosmicMinerWorld
        crystals={crystals}
        roverTargetPos={roverTargetPos}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        mascotState={mascotState}
        onCollectLetter={handleCollectCrystal}
        rocketLaunched={rocketLaunched}
      />

      {/* Screen celebration confetti on rocket launch */}
      <VFXScreenConfetti active={rocketLaunched} duration={3000} />

      {/* Radiant Rainbow Border when streak >= 3 */}
      <VFXFeverOverlay combo={streak} active={streak >= 3} />

      {/* Cyber Visor Space HUD */}
      <CosmicMinerHUD
        mission={currentMission}
        collectedLetters={collectedLetters}
        score={score}
        stars={stars}
        streak={streak}
        fuelPercentage={fuelPct}
        rocketLaunched={rocketLaunched}
        onSpeakPrompt={() => gameSound.speakCompanion(currentMission.prompt)}
        onResetMission={() => initMissionCrystals(currentMission)}
        onBack={onBack}
      />
    </div>
  );
}

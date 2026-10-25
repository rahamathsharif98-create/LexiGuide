import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import CosmicMinerHUD from './hud/CosmicMinerHUD';
import CosmicMinerWorld from './CosmicMinerWorld';
import { SPACE_MISSIONS, COSMIC_MINER_STAGES, getSpaceMission } from './engine/spaceWords';
import {
  TOTAL_SPACE_MISSIONS,
  MISSIONS_PER_STAGE,
  loadCosmicMinerCheckpointData,
  saveCosmicMinerCheckpoint,
  recordCosmicMinerMissionCompletion,
  resetCosmicMinerCheckpoint,
} from './engine/cosmicMinerCheckpoint';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

// 14 well-separated coordinates across the lunar landscape within X: [-7.5, 7.5], Z: [-6.5, 3.5]
// All reachable by rover bounds X: [-10, 10], Z: [-8, 5], no overlapping coordinates
const CRYSTAL_POSITIONS = [
  // Back row (Z = -3.8 to -6.5, X = -6.5 to +6.5)
  [-6.5, 1.0, -3.8],
  [-3.5, 1.0, -5.5],
  [0.0, 1.0, -6.5],
  [3.5, 1.0, -5.5],
  [6.5, 1.0, -3.8],
  // Mid row (Z = -1.0 to -2.0, X = -7.5 to +7.5)
  [-7.5, 1.0, -1.0],
  [-4.2, 1.0, -2.0],
  [4.2, 1.0, -2.0],
  [7.5, 1.0, -1.0],
  // Front row (Z = 2.5 to 3.2, X = -6.0 to +6.0)
  [-6.0, 1.0, 2.5],
  [-2.5, 1.0, 3.2],
  [2.5, 1.0, 3.2],
  [6.0, 1.0, 2.5],
  // Front-center
  [0.0, 1.0, 0.5],
];

export default function CosmicMinerApp({
  childId,
  onBack,
  onComplete,
  onResetSession,
  onRoundComplete,
}) {
  const initialCheckpoint = useMemo(
    () => loadCosmicMinerCheckpointData(childId, TOTAL_SPACE_MISSIONS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [missionIndex, setMissionIndex] = useState(initialCheckpoint.missionIndex);
  const currentMission = useMemo(() => getSpaceMission(missionIndex), [missionIndex]);
  const [collectedLetters, setCollectedLetters] = useState([]);
  const [score, setScore] = useState(initialCheckpoint.score);
  const [stars, setStars] = useState(initialCheckpoint.stars);
  const [streak, setStreak] = useState(initialCheckpoint.streak);
  const [highestUnlockedIndex, setHighestUnlockedIndex] = useState(initialCheckpoint.highestUnlockedIndex);
  const [completedMissions, setCompletedMissions] = useState(initialCheckpoint.completedMissions);

  const [rocketLaunched, setRocketLaunched] = useState(false);
  const [roverTargetPos, setRoverTargetPos] = useState(null);
  const [mascotState, setMascotState] = useState('idle');
  const [floatingText, setFloatingText] = useState('CRYSTAL MINED!');
  const [floatingTextKey, setFloatingTextKey] = useState(0);

  // Stage transition & Victory states
  const [stageCelebration, setStageCelebration] = useState(null);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // Layout positions for crystals around the lunar landing zone
  const [crystals, setCrystals] = useState([]);

  // Guard against duplicate click handling or double mining
  const minedCrystalIdsRef = useRef(new Set());
  const isTransitioningRef = useRef(false);
  const missionTimerRef = useRef(null);

  // VFX State
  const [burstPos, setBurstPos] = useState([0, 1, 0]);
  const [burstKey, setBurstKey] = useState(0);

  // Child profile switching sync
  useEffect(() => {
    const cp = loadCosmicMinerCheckpointData(childId, TOTAL_SPACE_MISSIONS);
    setMissionIndex(cp.missionIndex);
    setScore(cp.score);
    setStars(cp.stars);
    setStreak(cp.streak);
    setHighestUnlockedIndex(cp.highestUnlockedIndex);
    setCompletedMissions(cp.completedMissions);
    setIsGameComplete(false);
    setStageCelebration(null);
    isTransitioningRef.current = false;
  }, [childId]);

  // Clean up timers & speech on unmount
  useEffect(() => {
    return () => {
      if (missionTimerRef.current) clearTimeout(missionTimerRef.current);
      gameSound.stopSpeech?.();
    };
  }, []);

  // Initialize crystals for current mission
  const initMissionCrystals = useCallback((mission) => {
    const letters = mission.word.split('');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Add 2 distractor letters that do not appear anywhere in the target word
    const distractors = [];
    while (distractors.length < 2) {
      const char = alphabet[Math.floor(Math.random() * alphabet.length)];
      if (!letters.includes(char) && !distractors.includes(char)) {
        distractors.push(char);
      }
    }

    const allItems = [
      ...letters.map((l, i) => ({ letter: l, order: i, isWord: true })),
      ...distractors.map((d) => ({ letter: d, order: -1, isWord: false })),
    ];

    // Shuffle crystals across well-separated positions
    const shuffled = [...allItems].sort(() => Math.random() - 0.5);

    const generated = shuffled.map((item, idx) => ({
      id: `crystal-${mission.id}-${item.letter}-${idx}`,
      letter: item.letter,
      position: CRYSTAL_POSITIONS[idx % CRYSTAL_POSITIONS.length],
      isWord: item.isWord,
      order: item.order,
      isCollected: false,
      isNext: item.letter === letters[0],
    }));

    setCrystals(generated);
    setCollectedLetters([]);
    setRocketLaunched(false);
    setRoverTargetPos(null);
    minedCrystalIdsRef.current.clear();
    isTransitioningRef.current = false;

    // Companion voice prompt on mission start
    gameSound.stopSpeech?.();
    gameSound.speakCompanion(mission.speechText);
  }, []);

  useEffect(() => {
    if (!isGameComplete) {
      initMissionCrystals(currentMission);
    }
  }, [currentMission, initMissionCrystals, isGameComplete]);

  // Handle crystal selection
  const handleCollectCrystal = useCallback(
    (crystal) => {
      if (!crystal || crystal.isCollected || rocketLaunched || isTransitioningRef.current || isGameComplete) {
        return;
      }
      if (minedCrystalIdsRef.current.has(crystal.id)) return;

      const nextExpectedLetter = currentMission.word[collectedLetters.length];

      // Aim rover headlights/antenna towards targeted crystal without moving position
      setRoverTargetPos(crystal.position);

      if (crystal.letter === nextExpectedLetter) {
        // Prevent duplicate mining on rapid clicks
        minedCrystalIdsRef.current.add(crystal.id);

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

        const letterBonus = 150 * (isFever ? 2 : 1);
        setCollectedLetters(nextCollected);
        setScore((prev) => prev + letterBonus);
        setStreak((prev) => Math.min(prev + 1, 5));

        // Update crystal status: mark collected, and highlight uncollected crystals matching next required letter
        const nextLetter = currentMission.word[nextCollected.length];
        setCrystals((prev) =>
          prev.map((c) => {
            if (c.id === crystal.id) return { ...c, isCollected: true, isNext: false };
            if (!c.isCollected && c.letter === nextLetter) {
              return { ...c, isNext: true };
            }
            return { ...c, isNext: false };
          })
        );

        // Check if full target word is completed
        if (nextCollected.length === currentMission.word.length) {
          isTransitioningRef.current = true;
          setRocketLaunched(true);

          const isFinalMission = missionIndex >= TOTAL_SPACE_MISSIONS - 1; // Mission 12 (index 11)
          const isStageEnd = (missionIndex + 1) % MISSIONS_PER_STAGE === 0; // Mission 4 or 8

          const missionBonus = 500;
          const nextTotalScore = score + letterBonus + missionBonus;
          const nextStars = stars + 1;

          setStars(nextStars);
          setScore(nextTotalScore);
          setFloatingText('BLAST OFF! 🚀');
          setFloatingTextKey(Date.now());
          setMascotState('victory');

          // Persist progress to checkpoint
          recordCosmicMinerMissionCompletion(
            childId,
            missionIndex,
            missionBonus,
            1,
            TOTAL_SPACE_MISSIONS
          );

          setHighestUnlockedIndex((prev) => Math.max(prev, isFinalMission ? 11 : missionIndex + 1));
          setCompletedMissions((prev) => Array.from(new Set([...prev, missionIndex])));

          onRoundComplete?.({
            isCorrect: true,
            mission: currentMission,
            stars: 1,
            xp: 25,
            score: missionBonus,
          });

          // Fanfare + launching companion cheer
          gameSound.playFanfare();
          gameSound.speakCompanion(`Awesome! You fueled the rocket with ${currentMission.word}! Blast off!`);

          if (isFinalMission) {
            // FINAL VICTORY (Only after Mission 12)
            onComplete?.({
              score: nextTotalScore,
              stars: nextStars,
              missionsCompleted: TOTAL_SPACE_MISSIONS,
              roundsAttempted: TOTAL_SPACE_MISSIONS,
              roundsCorrect: TOTAL_SPACE_MISSIONS,
            });

            missionTimerRef.current = setTimeout(() => {
              setIsGameComplete(true);
              setMascotState('victory');
              gameSound.playFanfare();
              gameSound.speakCompanion(
                'Galactic Master Champion! Outstanding achievement! You completed all twelve space missions!'
              );
            }, 2400);
          } else if (isStageEnd) {
            // STAGE CELEBRATION (After Mission 4 & 8)
            const completedStageNum = Math.floor(missionIndex / MISSIONS_PER_STAGE) + 1;
            const nextStageNum = completedStageNum + 1;
            const completedStage = COSMIC_MINER_STAGES.find((s) => s.stage === completedStageNum);
            const nextStage = COSMIC_MINER_STAGES.find((s) => s.stage === nextStageNum);

            missionTimerRef.current = setTimeout(() => {
              setStageCelebration({
                completedStageNum,
                completedStageName: completedStage?.name || `Stage ${completedStageNum}`,
                nextStageNum,
                nextStageName: nextStage?.name || `Stage ${nextStageNum}`,
              });
              gameSound.playFanfare();
              gameSound.speakCompanion(
                `Stage ${completedStageNum} complete! You unlocked Stage ${nextStageNum}: ${nextStage?.name}!`
              );
            }, 2400);
          } else {
            // Advance to next mission within the same stage
            missionTimerRef.current = setTimeout(() => {
              setMissionIndex((prev) => prev + 1);
              setMascotState('idle');
            }, 3200);
          }
        }
      } else {
        // Incorrect letter selected: friendly oops feedback, reset streak, no score progression
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
    [
      childId,
      collectedLetters,
      currentMission,
      isGameComplete,
      missionIndex,
      onComplete,
      onRoundComplete,
      rocketLaunched,
      score,
      stars,
      streak,
    ]
  );

  const handleContinueNextStage = useCallback(() => {
    setStageCelebration(null);
    setMissionIndex((prev) => prev + 1);
    setMascotState('idle');
    isTransitioningRef.current = false;
  }, []);

  const handleSelectStage = useCallback(
    (startIdx) => {
      saveCosmicMinerCheckpoint(
        childId,
        {
          missionIndex: startIdx,
          score,
          stars,
          streak,
        },
        TOTAL_SPACE_MISSIONS
      );
      setMissionIndex(startIdx);
      setStageCelebration(null);
      setIsGameComplete(false);
      isTransitioningRef.current = false;
    },
    [childId, score, stars, streak]
  );

  const handlePlayAgain = useCallback(() => {
    resetCosmicMinerCheckpoint(childId);
    setMissionIndex(0);
    setScore(0);
    setStars(0);
    setStreak(1);
    setHighestUnlockedIndex(0);
    setCompletedMissions([]);
    setIsGameComplete(false);
    setStageCelebration(null);
    setMascotState('idle');
    isTransitioningRef.current = false;
    onResetSession?.();
    initMissionCrystals(getSpaceMission(0));
  }, [childId, initMissionCrystals, onResetSession]);

  const fuelPct = (collectedLetters.length / currentMission.word.length) * 100;

  return (
    <div className="relative w-full h-full min-h-0 overflow-hidden bg-slate-950">
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
      <VFXScreenConfetti active={rocketLaunched || isGameComplete} duration={3000} />

      {/* Radiant Rainbow Border when streak >= 3 */}
      <VFXFeverOverlay combo={streak} active={streak >= 3} />

      {/* Cyber Visor Space HUD & Progression Overlays */}
      <CosmicMinerHUD
        mission={currentMission}
        missionIndex={missionIndex}
        totalMissions={TOTAL_SPACE_MISSIONS}
        stages={COSMIC_MINER_STAGES}
        highestUnlockedIndex={highestUnlockedIndex}
        collectedLetters={collectedLetters}
        score={score}
        stars={stars}
        streak={streak}
        fuelPercentage={fuelPct}
        rocketLaunched={rocketLaunched}
        stageCelebration={stageCelebration}
        isGameComplete={isGameComplete}
        onContinueNextStage={handleContinueNextStage}
        onPlayAgain={handlePlayAgain}
        onSelectStage={handleSelectStage}
        onSpeakPrompt={() => gameSound.speakCompanion(currentMission.prompt)}
        onResetMission={() => initMissionCrystals(currentMission)}
        onBack={onBack}
      />
    </div>
  );
}

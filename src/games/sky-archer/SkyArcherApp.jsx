import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import SkyArcherWorld from './SkyArcherWorld';
import SkyArcherHUD from './hud/SkyArcherHUD';
import { getPhonicsRound } from './engine/phonicsTargets';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';

const BALLOON_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function SkyArcherApp({ onComplete, onRoundComplete }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(() => getPhonicsRound(0));
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [combo, setCombo] = useState(1);
  const [poppedLetters, setPoppedLetters] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const feedbackTimeout = useRef(null);

  // VFX State
  const [burstPos, setBurstPos] = useState([0, 0, -5.5]);
  const [burstKey, setBurstKey] = useState(0);
  const [burstColor, setBurstColor] = useState('#ef4444');

  // Announce target sound with gentle companion voice
  const playRoundPrompt = useCallback((round) => {
    if (round?.speechText) {
      gameSound.speakCompanion(round.speechText);
    }
  }, []);

  useEffect(() => {
    const round = getPhonicsRound(roundIndex);
    setCurrentRound(round);
    setPoppedLetters([]);
    playRoundPrompt(round);
  }, [roundIndex, playRoundPrompt]);

  const handleReplayAudio = () => {
    playRoundPrompt(currentRound);
  };

  const handleHitBalloon = (letter, isTarget, pos = [0, 0, -5.5], colorIndex = 0) => {
    if (poppedLetters.includes(letter)) return;

    // Trigger juicy balloon pop sound & 3D particle explosion
    gameSound.playPop();
    setBurstPos(pos);
    setBurstColor(BALLOON_COLORS[colorIndex % BALLOON_COLORS.length] || '#ef4444');
    setBurstKey(Date.now());

    if (isTarget) {
      // Correct hit!
      gameSound.playLetterNote(combo);
      setPoppedLetters((prev) => [...prev, letter]);
      const roundScore = 150 * combo;
      setScore((s) => s + roundScore);
      setStars((st) => st + 1);
      setCombo((c) => Math.min(5, c + 1));
      setShowConfetti(true);

      onRoundComplete?.({
        isCorrect: true,
        letter,
        score: roundScore,
        stars: 1,
        xp: 20,
      });

      setFeedback({
        correct: true,
        message: `Bullseye! "${letter}" is correct!`,
        sub: `+${roundScore} Points!`,
      });

      gameSound.speakCompanion(`Awesome! ${letter}!`);

      clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = setTimeout(() => {
        setFeedback(null);
        setShowConfetti(false);
        setRoundIndex((r) => r + 1);
      }, 1400);
    } else {
      // Non-target hit - supportive feedback
      gameSound.playGentleOops();
      setPoppedLetters((prev) => [...prev, letter]);
      setCombo(1);

      onRoundComplete?.({
        isCorrect: false,
        letter,
      });

      setFeedback({
        correct: false,
        message: `That's "${letter}"!`,
        sub: `Keep going! Find the "${currentRound.correct}" balloon!`,
      });

      gameSound.speakCompanion(`That's ${letter}. Find ${currentRound.correct}!`);

      clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = setTimeout(() => {
        setFeedback(null);
      }, 1600);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none' }}>
      <Canvas
        camera={{ fov: 52, near: 0.1, far: 300, position: [0, 0, 7] }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: 'high-performance', antialias: true }}
      >
        <color attach="background" args={['#7dd3fc']} />
        <SkyArcherWorld
          currentRound={currentRound}
          poppedLetters={poppedLetters}
          burstPos={burstPos}
          burstKey={burstKey}
          burstColor={burstColor}
          onHitBalloon={handleHitBalloon}
        />
      </Canvas>

      {/* Screen celebration confetti on correct hit */}
      <VFXScreenConfetti active={showConfetti} duration={1400} />

      <SkyArcherHUD
        currentRound={currentRound}
        score={score}
        stars={stars}
        combo={combo}
        onReplayAudio={handleReplayAudio}
        feedback={feedback}
      />
    </div>
  );
}
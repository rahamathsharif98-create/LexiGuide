import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Star, RotateCcw, ArrowLeft, Sparkles } from 'lucide-react';
import SkyArcherWorld from './SkyArcherWorld';
import SkyArcherHUD from './hud/SkyArcherHUD';
import {
  getPhonicsCurriculumRound,
  PHONICS_TARGETS_25,
  TOTAL_SKY_ARCHER_ROUNDS,
  getPhonicsRound,
  PHONICS_TARGETS,
} from './engine/phonicsTargets';
import {
  loadSkyArcherCheckpoint,
  saveSkyArcherCheckpoint,
  resetSkyArcherCheckpoint,
  getSkyArcherCheckpointKey,
  loadSkyArcherCheckpointData,
} from './engine/skyArcherCheckpoint';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';

export {
  loadSkyArcherCheckpoint,
  saveSkyArcherCheckpoint,
  resetSkyArcherCheckpoint,
  getSkyArcherCheckpointKey,
  loadSkyArcherCheckpointData,
};

const BALLOON_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function SkyArcherApp({
  childId,
  targetRoundIndex = null,
  onComplete,
  onRoundComplete,
  onBack,
  onRoundChange,
}) {
  const [roundIndex, setRoundIndex] = useState(() => {
    if (typeof targetRoundIndex === 'number' && targetRoundIndex >= 0 && targetRoundIndex < TOTAL_SKY_ARCHER_ROUNDS) {
      return targetRoundIndex;
    }
    return loadSkyArcherCheckpoint(childId);
  });
  const [currentRound, setCurrentRound] = useState(() => {
    const initialIndex = typeof targetRoundIndex === 'number' && targetRoundIndex >= 0 && targetRoundIndex < TOTAL_SKY_ARCHER_ROUNDS
      ? targetRoundIndex
      : loadSkyArcherCheckpoint(childId);
    return getPhonicsCurriculumRound(initialIndex);
  });
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [combo, setCombo] = useState(1);
  const [poppedLetters, setPoppedLetters] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // Guards & synchronous tracking refs
  const feedbackTimeout = useRef(null);
  const isTransitioningRef = useRef(false);
  const isGameCompleteRef = useRef(false);
  const poppedLettersRef = useRef(new Set());
  const arrowImpactTimeout = useRef(null);
  const impactedArrowsRef = useRef(new Set());

  // Projectile state
  const [activeArrow, setActiveArrow] = useState(null);

  // VFX State
  const [burstPos, setBurstPos] = useState([0, 0, -5.5]);
  const [burstKey, setBurstKey] = useState(0);
  const [burstColor, setBurstColor] = useState('#ef4444');
  const [floatingText, setFloatingText] = useState('BULLSEYE!');
  const [floatingTextKey, setFloatingTextKey] = useState(0);

  // Announce target sound with gentle companion voice
  const playRoundPrompt = useCallback((round) => {
    if (round?.speechText) {
      gameSound.speakCompanion(round.speechText);
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeout.current) {
        clearTimeout(feedbackTimeout.current);
      }
      if (arrowImpactTimeout.current) {
        clearTimeout(arrowImpactTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof targetRoundIndex === 'number' && targetRoundIndex >= 0 && targetRoundIndex < TOTAL_SKY_ARCHER_ROUNDS) {
      setRoundIndex(targetRoundIndex);
    } else {
      const saved = loadSkyArcherCheckpoint(childId);
      setRoundIndex(saved);
    }
  }, [childId, targetRoundIndex]);

  useEffect(() => {
    onRoundChange?.(roundIndex);
  }, [roundIndex, onRoundChange]);

  useEffect(() => {
    isTransitioningRef.current = false;
    poppedLettersRef.current.clear();
    setActiveArrow(null);
    if (arrowImpactTimeout.current) {
      clearTimeout(arrowImpactTimeout.current);
      arrowImpactTimeout.current = null;
    }
    impactedArrowsRef.current.clear();

    const round = getPhonicsCurriculumRound(roundIndex);
    setCurrentRound(round);
    setPoppedLetters([]);
    playRoundPrompt(round);
  }, [roundIndex, playRoundPrompt]);

  const handleReplayAudio = () => {
    playRoundPrompt(currentRound);
  };

  const handlePlayAgain = () => {
    resetSkyArcherCheckpoint(childId);
    if (feedbackTimeout.current) {
      clearTimeout(feedbackTimeout.current);
    }
    if (arrowImpactTimeout.current) {
      clearTimeout(arrowImpactTimeout.current);
      arrowImpactTimeout.current = null;
    }
    isTransitioningRef.current = false;
    isGameCompleteRef.current = false;
    poppedLettersRef.current.clear();
    impactedArrowsRef.current.clear();

    setActiveArrow(null);
    setScore(0);
    setStars(0);
    setCombo(1);
    setPoppedLetters([]);
    setFeedback(null);
    setShowConfetti(false);
    setIsGameComplete(false);
    setRoundIndex(0);
    const round0 = getPhonicsCurriculumRound(0);
    setCurrentRound(round0);
    playRoundPrompt(round0);
  };

  const handleBackToGames = () => {
    if (onBack) {
      onBack();
    }
  };

  // Triggered when arrow projectile impacts the balloon
  const handleArrowImpact = useCallback(
    (arrowData) => {
      if (!arrowData) return;
      if (impactedArrowsRef.current.has(arrowData.id)) return;
      impactedArrowsRef.current.add(arrowData.id);

      if (arrowImpactTimeout.current) {
        clearTimeout(arrowImpactTimeout.current);
        arrowImpactTimeout.current = null;
      }
      setActiveArrow(null);

      const { letter, isTarget, pos, colorIndex } = arrowData;

      // Juicy balloon pop sound & colorful 3D particle explosion at the target balloon
      gameSound.playPop();
      setBurstPos(pos);
      setBurstColor(BALLOON_COLORS[colorIndex % BALLOON_COLORS.length] || '#ef4444');
      setBurstKey(Date.now());
      setFloatingText(isTarget ? 'BULLSEYE!' : 'POP!');
      setFloatingTextKey(Date.now());

      // Visually pop the balloon
      setPoppedLetters((prev) => (prev.includes(letter) ? prev : [...prev, letter]));

      if (isTarget) {
        gameSound.playLetterNote(combo);
        gameSound.playSparkle();
        const roundScore = 150 * combo;
        const nextScore = score + roundScore;
        const nextStars = stars + 1;
        setScore(nextScore);
        setStars(nextStars);
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

        if (feedbackTimeout.current) {
          clearTimeout(feedbackTimeout.current);
        }

        const isFinalRound = roundIndex >= TOTAL_SKY_ARCHER_ROUNDS - 1;

        if (isFinalRound) {
          saveSkyArcherCheckpoint(childId, roundIndex);
          onComplete?.({
            score: nextScore,
            stars: nextStars,
            roundsCompleted: TOTAL_SKY_ARCHER_ROUNDS,
          });

          feedbackTimeout.current = setTimeout(() => {
            setFeedback(null);
            setShowConfetti(true);
            setIsGameComplete(true);
            isGameCompleteRef.current = true;
            gameSound.speakCompanion('Master Archer! Amazing work! You popped every balloon!');
          }, 1200);
        } else {
          const nextIndex = roundIndex + 1;
          saveSkyArcherCheckpoint(childId, nextIndex);
          feedbackTimeout.current = setTimeout(() => {
            setFeedback(null);
            setShowConfetti(false);
            setRoundIndex(nextIndex);
          }, 1400);
        }
      } else {
        // Non-target hit - supportive feedback
        gameSound.playGentleOops();
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

        if (feedbackTimeout.current) {
          clearTimeout(feedbackTimeout.current);
        }
        feedbackTimeout.current = setTimeout(() => {
          setFeedback(null);
        }, 1600);
      }
    },
    [combo, score, stars, roundIndex, currentRound, onRoundComplete, onComplete, childId]
  );

  // Triggered when a balloon is clicked/tapped: launches arrow toward balloon
  const handleHitBalloon = (letter, isTarget, pos = [0, 0, -5.5], colorIndex = 0) => {
    // P0-1 & P0-3: Ignore clicks if transitioning between rounds or game is complete
    if (isTransitioningRef.current || isGameCompleteRef.current) return;

    // P0-4: Synchronous per-balloon duplicate click prevention
    if (poppedLettersRef.current.has(letter)) return;
    poppedLettersRef.current.add(letter);

    if (isTarget) {
      // P0-1: Immediately lock further clicks during the transition
      isTransitioningRef.current = true;
    }

    // Bowstring release sound
    gameSound.playSnap();

    // Center of balloon target is offset +1.2 Y from balloon root
    const targetPos = [pos[0], pos[1] + 1.2, pos[2]];
    const arrowData = {
      id: Date.now() + Math.random(),
      letter,
      isTarget,
      pos: targetPos,
      balloonPos: pos,
      colorIndex,
      startPos: [0, -1.5, 4.5],
    };

    setActiveArrow(arrowData);

    // Resilient fallback timer: triggers impact automatically if useFrame is paused/delayed
    if (arrowImpactTimeout.current) {
      clearTimeout(arrowImpactTimeout.current);
    }
    arrowImpactTimeout.current = setTimeout(() => {
      handleArrowImpact(arrowData);
    }, 300);
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
          floatingText={floatingText}
          floatingTextKey={floatingTextKey}
          activeArrow={activeArrow}
          onArrowImpact={handleArrowImpact}
          onHitBalloon={handleHitBalloon}
        />
      </Canvas>

      {/* Screen celebration confetti on correct hit & victory */}
      <VFXScreenConfetti active={showConfetti} duration={1400} />

      <SkyArcherHUD
        currentRound={currentRound}
        score={score}
        stars={stars}
        combo={combo}
        onReplayAudio={handleReplayAudio}
        feedback={feedback}
      />

      {/* Final Level Victory & Master Archer Completion Modal */}
      {isGameComplete && (
        <div
          data-testid="archer-victory-panel"
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/85 backdrop-blur-md animate-fade-in pointer-events-auto"
        >
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-sky-900/95 border-2 border-sky-400/60 shadow-[0_20px_60px_rgba(56,189,248,0.45)] text-center text-white">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-sky-950/80 border-2 border-sky-400/60 flex items-center justify-center text-4xl mb-4 shadow-inner">
              🏹
            </div>

            {/* Title */}
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-2 tracking-wide">
              Master Archer!
            </h2>

            {/* Message */}
            <p className="text-sky-200 text-sm font-medium mb-5">
              Amazing work! You popped every magical phonics balloon!
            </p>

            {/* Three gold stars celebratory reward */}
            <div data-testid="victory-stars" className="flex items-center justify-center gap-3 mb-6">
              {[1, 2, 3].map((starNum) => (
                <div
                  key={`star-${starNum}`}
                  className="w-12 h-12 rounded-2xl bg-sky-950/60 border border-yellow-400/50 flex items-center justify-center shadow-lg"
                >
                  <Star size={28} className="fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]" />
                </div>
              ))}
            </div>

            {/* Actual final score from the game */}
            <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-950/70 border border-sky-400/30 mb-6 w-fit mx-auto">
              <Sparkles size={20} className="text-yellow-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-sky-300">Final Score</div>
                <div className="text-xl font-black text-yellow-300 font-mono" data-testid="final-score">
                  {score} pts
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                data-testid="play-again-btn"
                onClick={handlePlayAgain}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-sky-500/30 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw size={18} />
                <span>Play Again</span>
              </button>
              <button
                type="button"
                data-testid="back-to-games-btn"
                onClick={handleBackToGames}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-950 hover:bg-sky-800 text-sky-200 border border-sky-400/40 font-extrabold text-sm transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft size={18} />
                <span>Back to Games</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

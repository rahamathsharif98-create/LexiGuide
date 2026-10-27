import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Star, RotateCcw, ArrowLeft, Sparkles } from 'lucide-react';
import SafariHUD from './hud/SafariHUD';
import SafariWorld from './SafariWorld';
import { SAFARI_TARGETS, getSafariTarget } from './engine/safariAnimals';
import {
  loadSafariPhotoCheckpointData,
  saveSafariPhotoCheckpoint,
  resetSafariPhotoCheckpoint,
} from './engine/safariPhotoCheckpoint';
import { gameSound } from '../../services/gameSoundService';
import VFXScreenConfetti from '../common/vfx/VFXScreenConfetti';
import VFXFeverOverlay from '../common/vfx/VFXFeverOverlay';

export default function SafariApp({
  childId,
  onBack,
  onComplete,
  onResetSession,
  onRoundComplete,
}) {
  const initialCheckpoint = useMemo(
    () => loadSafariPhotoCheckpointData(childId, SAFARI_TARGETS.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [targetIndex, setTargetIndex] = useState(initialCheckpoint.targetIndex);
  const currentTarget = useMemo(() => getSafariTarget(targetIndex), [targetIndex]);
  const [photosSnapped, setPhotosSnapped] = useState(initialCheckpoint.photosSnapped);
  const [score, setScore] = useState(initialCheckpoint.score);
  const [stars, setStars] = useState(initialCheckpoint.stars);
  const [streak, setStreak] = useState(initialCheckpoint.streak);
  const [showFlash, setShowFlash] = useState(false);
  const [isPhotoComplete, setIsPhotoComplete] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [mascotState, setMascotState] = useState('idle');
  const [floatingText, setFloatingText] = useState('PERFECT SNAP! 📸');
  const [floatingTextKey, setFloatingTextKey] = useState(0);

  // Synchronous ref guards & timer handles
  const isTransitioningRef = useRef(false);
  const isGameCompleteRef = useRef(false);
  const transitionTimeoutRef = useRef(null);
  const flashTimeoutRef = useRef(null);

  // VFX State
  const [burstPos, setBurstPos] = useState([0, 1.5, 0]);
  const [burstKey, setBurstKey] = useState(0);

  // Synchronize on childId change (e.g. child profile switched while component is active)
  useEffect(() => {
    const cp = loadSafariPhotoCheckpointData(childId, SAFARI_TARGETS.length);
    setTargetIndex(cp.targetIndex);
    setPhotosSnapped(cp.photosSnapped);
    setScore(cp.score);
    setStars(cp.stars);
    setStreak(cp.streak);
    setIsGameComplete(false);
    setIsPhotoComplete(false);
    isGameCompleteRef.current = false;
    isTransitioningRef.current = false;
  }, [childId]);

  // Cleanup timers and speech on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      gameSound.stopSpeech?.();
    };
  }, []);

  // Announce speech clue whenever current target changes
  useEffect(() => {
    if (isGameCompleteRef.current) return;
    setIsPhotoComplete(false);
    setShowFlash(false);
    setSelectedAnimal(null);
    isTransitioningRef.current = false;
    gameSound.stopSpeech?.();
    gameSound.speakCompanion(currentTarget.speechText);
  }, [currentTarget]);

  // Handle snapping an animal
  const triggerSnap = useCallback(
    (animal) => {
      if (isTransitioningRef.current || isGameCompleteRef.current || isPhotoComplete) return;

      if (animal.id === currentTarget.id) {
        // Correct target animal selected! Lock clicks during transition
        isTransitioningRef.current = true;

        // Flash trigger & Camera Shutter SFX
        gameSound.playShutter();
        gameSound.playLetterNote(streak);
        setShowFlash(true);
        flashTimeoutRef.current = setTimeout(() => setShowFlash(false), 200);

        const animalPos = animal.position || [0, 1.5, 0];
        setBurstPos([animalPos[0], animalPos[1] + 0.8, animalPos[2]]);
        setBurstKey(Date.now());

        // Mascot cheer & floating comic text
        const isFever = streak >= 2;
        setFloatingText(isFever ? 'SAFARI COMBO! 2X' : 'PERFECT SNAP! 📸');
        setFloatingTextKey(Date.now());
        setMascotState('victory');

        const roundScore = 150 * (isFever ? 2 : 1);
        const nextPhotos = photosSnapped + 1;
        const nextScore = score + roundScore;
        const nextStars = stars + 1;
        const nextStreak = Math.min(streak + 1, 5);

        setIsPhotoComplete(true);
        setPhotosSnapped(nextPhotos);
        setScore(nextScore);
        setStreak(nextStreak);
        setStars(nextStars);

        onRoundComplete?.({
          isCorrect: true,
          animal,
          target: currentTarget,
          stars: 1,
          xp: 25,
          score: roundScore,
        });

        // Victory fanfare and wildlife fact
        gameSound.playFanfare();
        gameSound.speakCompanion(`Click! Great shot of the ${animal.animal}! ${animal.fact}`);

        const isFinalRound = targetIndex >= SAFARI_TARGETS.length - 1;

        if (isFinalRound) {
          // VICTORY: Stop the loop, persist completed state, fire onComplete, and display victory modal
          isGameCompleteRef.current = true;
          saveSafariPhotoCheckpoint(childId, {
            targetIndex: 0,
            photosSnapped: nextPhotos,
            score: nextScore,
            stars: nextStars,
            streak: 1,
            isCompleted: true,
          });

          onComplete?.({
            score: nextScore,
            stars: nextStars,
            photosSnapped: nextPhotos,
            roundsAttempted: nextPhotos,
            roundsCorrect: nextPhotos,
          });

          transitionTimeoutRef.current = setTimeout(() => {
            setIsGameComplete(true);
            setMascotState('victory');
            gameSound.playFanfare();
            gameSound.speakCompanion(
              'Master Wildlife Photographer! Incredible work! You photographed every savanna animal!'
            );
          }, 1600);
        } else {
          // Advance to next animal and persist intermediate checkpoint
          const nextTargetIndex = targetIndex + 1;
          saveSafariPhotoCheckpoint(childId, {
            targetIndex: nextTargetIndex,
            photosSnapped: nextPhotos,
            score: nextScore,
            stars: nextStars,
            streak: nextStreak,
            isCompleted: false,
          });

          transitionTimeoutRef.current = setTimeout(() => {
            setTargetIndex(nextTargetIndex);
            setMascotState('idle');
            isTransitioningRef.current = false;
          }, 3200);
        }
      } else {
        // Snapped wrong animal: friendly guidance, reset streak, no score or progression
        onRoundComplete?.({
          isCorrect: false,
          animal,
          target: currentTarget,
        });

        setStreak(1);
        setMascotState('idle');
        gameSound.stopSpeech?.();
        gameSound.playGentleOops();
        gameSound.speakCompanion(
          `That is the ${animal.animal}! We want to photograph the ${currentTarget.animal}!`
        );
      }
    },
    [childId, currentTarget, isPhotoComplete, photosSnapped, score, stars, streak, targetIndex, onRoundComplete, onComplete]
  );

  // Directly select and snap an animal from 3D tap/click
  const handleSnapAnimal = useCallback(
    (animal) => {
      setSelectedAnimal(animal);
      triggerSnap(animal);
    },
    [triggerSnap]
  );

  // Shutter button in HUD: snaps selected animal, or prompts child to tap an animal first.
  // NEVER automatically selects the correct target!
  const handleSnapShutter = useCallback(() => {
    if (isTransitioningRef.current || isGameCompleteRef.current || isPhotoComplete) return;

    if (selectedAnimal) {
      triggerSnap(selectedAnimal);
    } else {
      gameSound.stopSpeech?.();
      gameSound.playSnap();
      gameSound.speakCompanion(
        `Tap an animal on the savanna first to photograph it! Find the ${currentTarget.animal}!`
      );
    }
  }, [selectedAnimal, isPhotoComplete, currentTarget, triggerSnap]);

  // Reset for a fresh game run
  const handlePlayAgain = useCallback(() => {
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);

    isGameCompleteRef.current = false;
    isTransitioningRef.current = false;

    resetSafariPhotoCheckpoint(childId);

    setTargetIndex(0);
    setPhotosSnapped(0);
    setScore(0);
    setStars(0);
    setStreak(1);
    setShowFlash(false);
    setIsPhotoComplete(false);
    setIsGameComplete(false);
    setSelectedAnimal(null);
    setMascotState('idle');

    onResetSession?.();

    gameSound.stopSpeech?.();
    gameSound.speakCompanion(SAFARI_TARGETS[0].speechText);
  }, [childId, onResetSession]);

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-stone-900 select-none">
      {/* 3D Savanna Canvas with Enhanced VFX */}
      <SafariWorld
        currentTarget={currentTarget}
        isPhotoComplete={isPhotoComplete}
        isVictory={isGameComplete}
        burstPos={burstPos}
        burstKey={burstKey}
        floatingText={floatingText}
        floatingTextKey={floatingTextKey}
        mascotState={mascotState}
        onSnapAnimal={handleSnapAnimal}
      />

      {/* Screen celebration confetti on animal photo snap and victory */}
      <VFXScreenConfetti active={isPhotoComplete || isGameComplete} duration={3200} />

      {/* Radiant Rainbow Border when streak >= 3 */}
      <VFXFeverOverlay combo={streak} active={streak >= 3} />

      {/* Camera HUD */}
      <SafariHUD
        target={currentTarget}
        photosSnapped={photosSnapped}
        totalTargets={SAFARI_TARGETS.length}
        score={score}
        stars={stars}
        streak={streak}
        showFlash={showFlash}
        isPhotoComplete={isPhotoComplete}
        onSpeakPrompt={() => {
          gameSound.stopSpeech?.();
          gameSound.speakCompanion(currentTarget.prompt);
        }}
        onResetSafari={() => {
          setIsPhotoComplete(false);
          gameSound.stopSpeech?.();
          gameSound.speakCompanion(currentTarget.speechText);
        }}
        onSnapShutter={handleSnapShutter}
        onBack={() => {
          gameSound.stopSpeech?.();
          onBack?.();
        }}
      />

      {/* Victory Celebration Modal */}
      {isGameComplete && (
        <div
          data-testid="victory-modal"
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in"
        >
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-amber-900 via-stone-900 to-stone-950 border-2 border-yellow-400/60 shadow-[0_20px_50px_rgba(245,158,11,0.5)] text-center select-none">
            {/* Title Icon */}
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-yellow-400/50 flex items-center justify-center text-3xl shadow-lg">
              📸
            </div>

            {/* Title */}
            <h2 className="font-display font-black text-2xl sm:text-3xl text-yellow-400 mb-2 tracking-wide">
              Master Wildlife Photographer!
            </h2>

            {/* Subtitle / Message */}
            <p className="text-amber-200 text-sm font-semibold mb-5">
              Incredible snaps! You photographed every wild savanna animal for your album!
            </p>

            {/* Three gold stars celebratory reward presentation */}
            <div data-testid="victory-stars" className="flex items-center justify-center gap-3 mb-6">
              {[1, 2, 3].map((starNum) => (
                <div
                  key={`star-${starNum}`}
                  className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-yellow-400/60 flex items-center justify-center shadow-lg"
                >
                  <Star size={28} className="fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]" />
                </div>
              ))}
            </div>

            {/* Final score */}
            <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-stone-900/90 border border-amber-500/40 mb-6 w-fit mx-auto shadow-inner">
              <Sparkles size={20} className="text-yellow-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-black text-amber-400 tracking-wider">Final Score</div>
                <div className="text-xl font-black text-white font-mono" data-testid="final-score">
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
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-sm shadow-lg shadow-yellow-500/30 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw size={18} />
                <span>Play Again</span>
              </button>
              <button
                type="button"
                data-testid="back-to-games-btn"
                onClick={onBack}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-200 border border-amber-600/40 font-bold text-sm transition-all cursor-pointer active:scale-95"
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

import { create } from 'zustand';
import { createSessionTracker, recordChallengeResult, computeAdaptiveDifficulty, buildObservedPatterns, getRecommendation } from '../../learning/learningEngine/learningEngine';
import { generateFillInBlankQuest } from '../../learning/content/letters';
import { storageService } from '../../services/storage/storageService';
import { CHECKPOINT_DISTANCE, MAX_CHECKPOINTS } from './constants';
import { useAppStore } from './appStore';

// This store is intentionally updated only at discrete gameplay events
// (collect coin, hit obstacle, challenge resolved, checkpoint) — never every
// animation frame — to avoid unnecessary React re-renders during the loop.
// Continuous per-frame values (player position, speed, obstacle transforms)
// live in plain refs inside the R3F game loop instead (see GameWorld.jsx).

function questToChallenge(quest) {
  if (!quest) return null;
  return {
    type: 'complete-word',
    prompt: `Complete the word: ${quest.masked}`,
    emoji: quest.emoji,
    correctLetter: quest.missingLetter,
    lanes: quest.lanes,
    wordHint: quest.word,
  };
}

const defaultState = (startingCheckpoint = 0) => {
  const chk = Math.min(MAX_CHECKPOINTS, Math.max(0, Math.floor(Number(startingCheckpoint)) || 0));
  const startingDistance = chk * CHECKPOINT_DISTANCE;
  const activeWordQuest = generateFillInBlankQuest(chk);
  const activeChallenge = questToChallenge(activeWordQuest);
  return {
    isRunning: false,
    isPaused: false,
    isGameOver: false,
    isCompleted: false,
    distance: startingDistance,
    score: chk * 200,
    multiplier: 1,
    difficulty: 1,
    stumbles: 0,
    starsEarned: 0,
    lettersCollected: [], // array of letters (with repeats)
    uniqueLettersCollected: [], // unique letters
    wordsCompleted: [],
    challengesCompleted: 0,
    challengesCorrect: 0,
    checkpointsReached: chk,
    stage: chk + 1,
    startingCheckpoint: chk,
    wordQuestIndex: chk,
    activeWordQuest,
    turnPrompt: null, // null | { direction: 'left' | 'right', z: number }
    activeChallenge,
    feedback: chk > 0
      ? { kind: 'checkpoint', text: `Resumed at Stage ${chk + 1}! 🏛️`, sub: `Waypoint: ${startingDistance}m` }
      : null,
    activePowerUp: null, // { id, label, expiresAt }
    tracker: createSessionTracker(),
  };
};

export const useGameStore = create((set, get) => ({
  ...defaultState(),

  resetRun: (startingCheckpoint = 0) => set(defaultState(startingCheckpoint)),

  startRun: (difficulty = 1, startingCheckpoint = 0) =>
    set({ ...defaultState(startingCheckpoint), isRunning: true, difficulty }),

  setPaused: (isPaused) => set({ isPaused }),

  setDistance: (distance) => set({ distance }),

  bumpDifficultyIfNeeded: () => {
    const { tracker, difficulty } = get();
    const next = computeAdaptiveDifficulty(tracker, difficulty);
    if (next !== difficulty) set({ difficulty: next });
  },

  collectLetter: (letterEntry) => {
    const { lettersCollected, uniqueLettersCollected } = get();
    const unique = uniqueLettersCollected.includes(letterEntry.letter)
      ? uniqueLettersCollected
      : [...uniqueLettersCollected, letterEntry.letter];
    set({
      lettersCollected: [...lettersCollected, letterEntry.letter],
      uniqueLettersCollected: unique,
      feedback: { kind: 'letter', text: letterEntry.letter, sub: `${letterEntry.emoji} ${letterEntry.word}` },
    });
  },

  clearFeedback: () => set({ feedback: null }),

  startChallenge: (challenge) => set({ activeChallenge: challenge }),

  resolveChallenge: (correct) => {
    const { activeChallenge, tracker, challengesCompleted, challengesCorrect } = get();
    if (!activeChallenge) return;
    recordChallengeResult(tracker, { letter: activeChallenge.correctLetter, correct, challengeType: activeChallenge.type });

    if (correct) {
      set({
        challengesCompleted: challengesCompleted + 1,
        challengesCorrect: challengesCorrect + 1,
      });
      get().completeWordQuest();
    } else {
      // Mistake: keep word and challenge stable for retry without awarding progress or advancing
      set({
        challengesCompleted: challengesCompleted + 1,
        feedback: {
          kind: 'incorrect',
          text: 'Almost!',
          sub: `Keep trying for "${activeChallenge.correctLetter}" in ${activeChallenge.wordHint || 'word'}!`,
        },
      });
    }
    get().bumpDifficultyIfNeeded();
  },

  completeWordQuest: () => {
    const { activeWordQuest, wordQuestIndex, wordsCompleted, score, multiplier, starsEarned } = get();
    if (!activeWordQuest) return;

    const points = 150 * multiplier;
    const word = activeWordQuest.word;
    const nextWords = wordsCompleted.includes(word)
      ? wordsCompleted
      : [...wordsCompleted, word];

    const nextIndex = wordQuestIndex + 1;
    const nextQuest = generateFillInBlankQuest(nextIndex);
    const nextMultiplier = Math.min(5, multiplier + 1);

    set({
      score: score + points,
      multiplier: nextMultiplier,
      starsEarned: starsEarned + 1,
      wordsCompleted: nextWords,
      wordQuestIndex: nextIndex,
      activeWordQuest: nextQuest,
      activeChallenge: questToChallenge(nextQuest),
      feedback: {
        kind: 'word-complete',
        text: `${word}! ✨`,
        sub: `+${points} pts • Multiplier x${nextMultiplier}!`,
      },
    });
  },

  incrementScore: (amount) => {
    const { score, multiplier } = get();
    set({ score: score + amount * multiplier });
  },

  setTurnPrompt: (turnPrompt) => set({ turnPrompt }),

  takeTurn: (successful = true, dir = 'right') => {
    const { score, multiplier } = get();
    if (successful) {
      set({
        score: score + 100 * multiplier,
        turnPrompt: null,
        feedback: { kind: 'turn', text: 'Great Turn! 🧭', sub: '+100 pts' },
      });
    } else {
      set({
        turnPrompt: null,
        feedback: { kind: 'turn', text: 'Safe Recovery! 🌿', sub: 'Keep your momentum' },
      });
    }
  },

  registerStumble: () => {
    const { stumbles } = get();
    const nextStumbles = stumbles + 1;
    const affirmations = [
      'Stay cool! 🌿 Breathe and run',
      'Good balance! 🧘 Keep your stride',
      'Nice reflex! ⭐ You got this',
    ];
    const subText = affirmations[nextStumbles % affirmations.length];
    set({
      stumbles: nextStumbles,
      multiplier: 1, // resets combo, but preserves score
      feedback: { kind: 'hit', text: 'Steady now! 🛡️', sub: subText },
      isGameOver: nextStumbles >= 3,
      isRunning: nextStumbles >= 3 ? false : get().isRunning,
    });
  },

  reachCheckpoint: () => {
    const { checkpointsReached, starsEarned, score, multiplier } = get();
    const nextCheckpoints = Math.min(MAX_CHECKPOINTS, checkpointsReached + 1);
    const nextStage = nextCheckpoints + 1;

    // Persist to child-isolated storage and synchronize active app state
    try {
      storageService.saveCheckpointProgress(nextCheckpoints);
      useAppStore.getState().setStartingCheckpoint(nextCheckpoints);
      useAppStore.getState().refreshSave();
    } catch {
      /* storage handled */
    }

    set({
      checkpointsReached: nextCheckpoints,
      stage: nextStage,
      starsEarned: starsEarned + 1,
      score: score + 200 * multiplier,
      feedback: {
        kind: 'checkpoint',
        text: `Temple Waypoint! 🏛️ Stage ${nextStage}`,
        sub: 'Waypoint saved! Awesome focus!',
      },
    });
  },

  setPowerUp: (powerUp) => set({ activePowerUp: powerUp }),
  clearPowerUp: () => set({ activePowerUp: null }),

  endRun: (reason = 'obstacle') => set({ isRunning: false, isGameOver: true }),

  completeExpedition: () => {
    const { isGameOver, isCompleted, score, starsEarned } = get();
    if (isGameOver || isCompleted) return;
    set({
      isRunning: false,
      isGameOver: true,
      isCompleted: true,
      starsEarned: starsEarned + 5,
      score: score + 1000,
      feedback: {
        kind: 'celebrate',
        text: 'EXPEDITION COMPLETE! 🏆',
        sub: 'All 11 stages mastered!',
      },
    });
  },

  getObservedPatterns: () => buildObservedPatterns(get().tracker),
  getRecommendation: () => getRecommendation(get().tracker),
}));

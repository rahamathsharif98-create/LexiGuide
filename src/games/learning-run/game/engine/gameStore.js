import { create } from 'zustand';
import { createSessionTracker, recordChallengeResult, computeAdaptiveDifficulty, buildObservedPatterns, getRecommendation } from '../../learning/learningEngine/learningEngine';
import { generateFillInBlankQuest } from '../../learning/content/letters';

// This store is intentionally updated only at discrete gameplay events
// (collect coin, hit obstacle, challenge resolved, checkpoint) — never every
// animation frame — to avoid unnecessary React re-renders during the loop.
// Continuous per-frame values (player position, speed, obstacle transforms)
// live in plain refs inside the R3F game loop instead (see GameWorld.jsx).

const defaultState = () => ({
  isRunning: false,
  isPaused: false,
  isGameOver: false,
  distance: 0,
  score: 0,
  multiplier: 1,
  difficulty: 1,
  stumbles: 0,
  starsEarned: 0,
  lettersCollected: [], // array of letters (with repeats)
  uniqueLettersCollected: [], // unique letters
  wordsCompleted: [],
  challengesCompleted: 0,
  challengesCorrect: 0,
  checkpointsReached: 0,
  wordQuestIndex: 0,
  activeWordQuest: generateFillInBlankQuest(0), // { word: 'APPLE', masked: 'APP_E', missingLetter: 'L', emoji: '🍎', meaning: ... }
  turnPrompt: null, // null | { direction: 'left' | 'right', z: number }
  activeChallenge: null, // { type, prompt, emoji, correctLetter, lanes, wordHint }
  feedback: null, // { kind: 'letter'|'correct'|'incorrect'|'checkpoint'|'powerup'|'word-complete'|'turn', text, sub }
  activePowerUp: null, // { id, label, expiresAt }
  tracker: createSessionTracker(),
});

export const useGameStore = create((set, get) => ({
  ...defaultState(),

  resetRun: () => set(defaultState()),

  startRun: (difficulty = 1) => set({ ...defaultState(), isRunning: true, difficulty, activeWordQuest: generateFillInBlankQuest(0) }),

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
    const { activeChallenge, tracker, challengesCompleted, challengesCorrect, wordsCompleted } = get();
    if (!activeChallenge) return;
    recordChallengeResult(tracker, { letter: activeChallenge.correctLetter, correct, challengeType: activeChallenge.type });

    const nextWords =
      correct && activeChallenge.type === 'complete-word' && !wordsCompleted.includes(activeChallenge.wordHint)
        ? [...wordsCompleted, activeChallenge.wordHint]
        : wordsCompleted;

    set({
      activeChallenge: null,
      challengesCompleted: challengesCompleted + 1,
      challengesCorrect: challengesCorrect + (correct ? 1 : 0),
      wordsCompleted: nextWords,
      feedback: correct
        ? { kind: 'correct', text: 'Great!', sub: `${activeChallenge.correctLetter} → ${activeChallenge.wordHint}` }
        : { kind: 'incorrect', text: 'Almost!', sub: `The answer is ${activeChallenge.correctLetter}` },
    });
    get().bumpDifficultyIfNeeded();
  },

  completeWordQuest: () => {
    const { activeWordQuest, wordQuestIndex, wordsCompleted, score, multiplier, starsEarned } = get();
    if (!activeWordQuest) return;

    const points = 150 * multiplier;
    const nextWords = wordsCompleted.includes(activeWordQuest.word)
      ? wordsCompleted
      : [...wordsCompleted, activeWordQuest.word];

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
      feedback: {
        kind: 'word-complete',
        text: `${activeWordQuest.word}! ✨`,
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
    set({
      checkpointsReached: checkpointsReached + 1,
      starsEarned: starsEarned + 1,
      score: score + 200 * multiplier,
      feedback: { kind: 'checkpoint', text: 'Temple Checkpoint! 🏛️', sub: "Awesome run, keep your focus!" },
    });
  },

  setPowerUp: (powerUp) => set({ activePowerUp: powerUp }),
  clearPowerUp: () => set({ activePowerUp: null }),

  endRun: (reason = 'obstacle') => set({ isRunning: false, isGameOver: true }),

  getObservedPatterns: () => buildObservedPatterns(get().tracker),
  getRecommendation: () => getRecommendation(get().tracker),
}));

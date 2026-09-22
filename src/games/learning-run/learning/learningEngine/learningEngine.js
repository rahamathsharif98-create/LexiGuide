// learningEngine: a simple, local, modular adaptive-learning helper.
// IMPORTANT: this is NOT a diagnostic or medical tool. It only produces
// neutral "observed learning patterns" from in-game performance, which the
// real LexiGuide Reading Fingerprint system can later interpret.

// Letters that are commonly visually/aurally confused by early readers.
const CONFUSION_PAIRS = [
  ['B', 'D'],
  ['P', 'Q'],
  ['M', 'N'],
  ['F', 'V'],
];

export function createSessionTracker() {
  return {
    correctByLetter: {}, // letter -> count
    incorrectByLetter: {},
    challengesCompleted: 0,
    challengesCorrect: 0,
    startingLetterMisses: {},
  };
}

export function recordChallengeResult(tracker, { letter, correct, challengeType }) {
  tracker.challengesCompleted += 1;
  if (correct) {
    tracker.challengesCorrect += 1;
    tracker.correctByLetter[letter] = (tracker.correctByLetter[letter] || 0) + 1;
  } else {
    tracker.incorrectByLetter[letter] = (tracker.incorrectByLetter[letter] || 0) + 1;
    if (challengeType === 'starting-letter') {
      tracker.startingLetterMisses[letter] = (tracker.startingLetterMisses[letter] || 0) + 1;
    }
  }
  return tracker;
}

// Determine the next difficulty tier (1-3) from recent accuracy.
export function computeAdaptiveDifficulty(tracker, currentDifficulty = 1) {
  const attempts = tracker.challengesCompleted;
  if (attempts < 3) return currentDifficulty;
  const accuracy = tracker.challengesCorrect / attempts;
  if (accuracy >= 0.8) return Math.min(3, currentDifficulty + 1);
  if (accuracy <= 0.4) return Math.max(1, currentDifficulty - 1);
  return currentDifficulty;
}

// Produce neutral observed-pattern data (never a diagnosis).
export function buildObservedPatterns(tracker) {
  const letterConfusion = [];
  CONFUSION_PAIRS.forEach(([a, b]) => {
    const missesA = tracker.incorrectByLetter[a] || 0;
    const missesB = tracker.incorrectByLetter[b] || 0;
    if (missesA > 0 && missesB > 0) {
      letterConfusion.push(`${a.toLowerCase()}/${b.toLowerCase()}`);
    }
  });

  const difficultInitialSounds = Object.keys(tracker.startingLetterMisses).filter(
    (letter) => tracker.startingLetterMisses[letter] >= 2
  );

  const strongAreas = Object.keys(tracker.correctByLetter).filter(
    (letter) => (tracker.correctByLetter[letter] || 0) >= 2 && !(tracker.incorrectByLetter[letter] > 0)
  );

  return {
    observedPatterns: {
      letterConfusion,
      difficultInitialSounds,
      wordBuildingDifficulty: tracker.challengesCompleted > 0 && tracker.challengesCorrect / tracker.challengesCompleted < 0.5,
      strongAreas: strongAreas.length ? ['letterRecognition', ...strongAreas] : [],
    },
  };
}

// A friendly, non-clinical "next step" recommendation for the result screen.
export function getRecommendation(tracker) {
  const patterns = buildObservedPatterns(tracker).observedPatterns;
  if (patterns.letterConfusion.length > 0) {
    const pair = patterns.letterConfusion[0].toUpperCase().split('/');
    return `Let's practice ${pair[0]} and ${pair[1]} again!`;
  }
  if (patterns.difficultInitialSounds.length > 0) {
    return `Let's try more words that start with ${patterns.difficultInitialSounds[0]}!`;
  }
  if (tracker.challengesCompleted > 0 && tracker.challengesCorrect / tracker.challengesCompleted >= 0.8) {
    return 'Ready for a new challenge?';
  }
  return "Great effort — let's keep practicing!";
}

export function getDifficultLettersFromSave(learningProgress) {
  const { lettersCorrect = {}, lettersIncorrect = {} } = learningProgress || {};
  return Object.keys(lettersIncorrect).filter((letter) => (lettersIncorrect[letter] || 0) > (lettersCorrect[letter] || 0));
}

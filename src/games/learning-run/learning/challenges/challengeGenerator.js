import { LETTER_CONTENT, getLettersByDifficulty, getRandomLetter, getRandomWord } from '../content/letters';

// Challenge types, matched to the design doc:
// 'collect-letter'   -> Collect the requested letter coin
// 'starting-letter'  -> Which letter starts this picture's word?
// 'complete-word'    -> Fill in the missing letter of a word
// 'match-picture'    -> Find the letter matching this picture

const LANE_COUNT = 3;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a learning-gate challenge: three lane options (A/B/C style), one correct.
 */
export function generateChallenge(difficulty = 1) {
  const roll = Math.random();
  const pool = getLettersByDifficulty(difficulty);

  if (roll < 0.4) {
    // starting-letter: show a picture, pick the lane with the correct starting letter
    const target = getRandomLetter(difficulty);
    const distractors = shuffle(pool.filter((l) => l.letter !== target.letter)).slice(0, LANE_COUNT - 1);
    const lanes = shuffle([target, ...distractors]).slice(0, LANE_COUNT);
    return {
      type: 'starting-letter',
      prompt: 'Which letter starts this word?',
      emoji: target.emoji,
      correctLetter: target.letter,
      lanes: lanes.map((l) => l.letter),
      wordHint: target.word,
    };
  }

  if (roll < 0.7) {
    // match-picture: same shape as starting-letter but framed as "find the match"
    const target = getRandomLetter(difficulty);
    const distractors = shuffle(pool.filter((l) => l.letter !== target.letter)).slice(0, LANE_COUNT - 1);
    const lanes = shuffle([target, ...distractors]).slice(0, LANE_COUNT);
    return {
      type: 'match-picture',
      prompt: 'Find the matching letter!',
      emoji: target.emoji,
      correctLetter: target.letter,
      lanes: lanes.map((l) => l.letter),
      wordHint: target.word,
    };
  }

  // complete-word: show word with one blank, choose the correct letter
  const wordEntry = getRandomWord(difficulty);
  const word = wordEntry.word;
  const blankIndex = Math.floor(Math.random() * word.length);
  const correctLetter = word[blankIndex];
  const displayWord = word
    .split('')
    .map((ch, i) => (i === blankIndex ? '_' : ch))
    .join(' ');
  const distractorPool = pool.filter((l) => l.letter !== correctLetter);
  const distractors = shuffle(distractorPool).slice(0, LANE_COUNT - 1).map((l) => l.letter);
  const lanes = shuffle([correctLetter, ...distractors]).slice(0, LANE_COUNT);

  return {
    type: 'complete-word',
    prompt: `Complete the word: ${displayWord}`,
    emoji: wordEntry.emoji,
    correctLetter,
    lanes,
    wordHint: word,
  };
}

/** A simpler "collect this letter" prompt used for basic coin sections. */
export function generateCollectPrompt(difficulty = 1) {
  const target = getRandomLetter(difficulty);
  return {
    type: 'collect-letter',
    prompt: `Collect ${target.letter}!`,
    correctLetter: target.letter,
    emoji: target.emoji,
    wordHint: target.word,
  };
}

export { LETTER_CONTENT };

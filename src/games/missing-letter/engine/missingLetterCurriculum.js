/**
 * missingLetterCurriculum.js
 *
 * Missing Letter Curriculum — 30 Progressive Levels across 3 Developmental Stages.
 *
 * Stage 1 (Levels 1–10): Middle Short Vowels
 *   Identify missing medial short vowels in familiar CVC words.
 *   Preserves original starter questions (C_T, D_G, S_N) at Levels 1–3 for 100% test compatibility.
 * Stage 2 (Levels 11–20): Beginning Letters
 *   Identify missing initial consonant sounds in high-frequency early vocabulary.
 * Stage 3 (Levels 21–30): Ending Letters & Blends
 *   Identify missing final consonants and word blend components.
 *
 * Design Guarantees:
 * - Exactly 30 unique, progressive levels (10 per stage).
 * - Exactly 3 option choices per question.
 * - Perfectly balanced answer positions across the entire curriculum:
 *   Positions 0, 1, and 2 each appear exactly 10 times (33.3% distribution, 0% bias).
 * - Stable, deterministic per-level option ordering (no random runtime shuffling).
 * - Phonics accuracy: each missing letter unambiguously reconstructs the intended word.
 */

export const TOTAL_MISSING_LETTER_LEVELS = 30;

export const MISSING_LETTER_STAGE_CONFIG = [
  {
    stage: 1,
    title: 'Middle Short Vowels',
    subtitle: 'Identify missing medial short vowels in CVC words',
    icon: '🧩',
    levelRange: [1, 10],
    themePreview: '🧩 CAT, DOG, SUN, BED, HAT… middle vowel sounds',
    description: 'Tune your ears to the middle vowel sound inside simple words.',
  },
  {
    stage: 2,
    title: 'Beginning Letters',
    subtitle: 'Find the first letter sound that starts the word',
    icon: '🔍',
    levelRange: [11, 20],
    themePreview: '🔍 FAN, NET, LIP, MOP, TUB… starting letter sounds',
    description: 'Listen closely to discover the initial consonant sound.',
  },
  {
    stage: 3,
    title: 'Ending Letters & Blends',
    subtitle: 'Spot missing final letters and word blends',
    icon: '⭐',
    levelRange: [21, 30],
    themePreview: '⭐ BAT, BUS, SHIP, FROG, STAR… endings and blends',
    description: 'Master word construction by completing word endings and blends.',
  },
];

export const MISSING_LETTER_STAGES = MISSING_LETTER_STAGE_CONFIG.map((stg) => ({
  stage: stg.stage,
  title: stg.title,
  subtitle: stg.subtitle,
  icon: stg.icon,
  levelRange: stg.levelRange,
  themePreview: stg.themePreview,
  description: stg.description,
  badge:
    stg.stage === 1
      ? '🧩 Vowel Builder'
      : stg.stage === 2
      ? '🔍 Sound Detective'
      : '🏆 Master Word Crafter',
}));

export const MISSING_LETTER_MILESTONES = {
  5: { level: 5, name: 'Vowel Explorer', icon: '⭐', reward: 'Bronze Letter Tile' },
  10: { level: 10, name: 'Vowel Builder', icon: '🏅', reward: 'Stage 1 Mastery Badge' },
  15: { level: 15, name: 'Letter Tracker', icon: '⭐', reward: 'Silver Letter Tile' },
  20: { level: 20, name: 'Sound Detective', icon: '🏅', reward: 'Stage 2 Mastery Badge' },
  25: { level: 25, name: 'Blend Crafter', icon: '⭐', reward: 'Golden Letter Tile' },
  30: { level: 30, name: 'Master Word Crafter', icon: '🏆', reward: 'Grand Missing Letter Trophy' },
};

export const MISSING_LETTER_CURRICULUM = [
  // ─────────────────────────────────────────────────────────────
  // STAGE 1 (Levels 1–10): Middle Short Vowels
  // ─────────────────────────────────────────────────────────────
  {
    id: 1,
    level: 1,
    stage: 1,
    wordDisplay: 'C _ T',
    fullWord: 'CAT',
    missing: 'A',
    answer: 'A',
    image: '🐱',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['A', 'O', 'E'], // Pos 0
    correctIndex: 0,
    hint: 'Listen for the short /a/ vowel in cat: c-a-t.',
  },
  {
    id: 2,
    level: 2,
    stage: 1,
    wordDisplay: 'D _ G',
    fullWord: 'DOG',
    missing: 'O',
    answer: 'O',
    image: '🐶',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['I', 'O', 'U'], // Pos 1
    correctIndex: 1,
    hint: 'Listen for the short /o/ vowel in dog: d-o-g.',
  },
  {
    id: 3,
    level: 3,
    stage: 1,
    wordDisplay: 'S _ N',
    fullWord: 'SUN',
    missing: 'U',
    answer: 'U',
    image: '☀️',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['A', 'E', 'U'], // Pos 2
    correctIndex: 2,
    hint: 'Listen for the short /u/ vowel in sun: s-u-n.',
  },
  {
    id: 4,
    level: 4,
    stage: 1,
    wordDisplay: 'P _ G',
    fullWord: 'PIG',
    missing: 'I',
    answer: 'I',
    image: '🐷',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['O', 'I', 'U'], // Pos 1
    correctIndex: 1,
    hint: 'Listen for the short /i/ vowel in pig: p-i-g.',
  },
  {
    id: 5,
    level: 5,
    stage: 1,
    wordDisplay: 'B _ D',
    fullWord: 'BED',
    missing: 'E',
    answer: 'E',
    image: '🛏️',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['E', 'A', 'U'], // Pos 0
    correctIndex: 0,
    hint: 'Listen for the short /e/ vowel in bed: b-e-d.',
  },
  {
    id: 6,
    level: 6,
    stage: 1,
    wordDisplay: 'H _ T',
    fullWord: 'HAT',
    missing: 'A',
    answer: 'A',
    image: '🎩',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['I', 'O', 'A'], // Pos 2
    correctIndex: 2,
    hint: 'Listen for the short /a/ vowel in hat: h-a-t.',
  },
  {
    id: 7,
    level: 7,
    stage: 1,
    wordDisplay: 'F _ X',
    fullWord: 'FOX',
    missing: 'O',
    answer: 'O',
    image: '🦊',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['O', 'U', 'A'], // Pos 0
    correctIndex: 0,
    hint: 'Listen for the short /o/ vowel in fox: f-o-x.',
  },
  {
    id: 8,
    level: 8,
    stage: 1,
    wordDisplay: 'C _ P',
    fullWord: 'CUP',
    missing: 'U',
    answer: 'U',
    image: '☕',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['I', 'U', 'O'], // Pos 1
    correctIndex: 1,
    hint: 'Listen for the short /u/ vowel in cup: c-u-p.',
  },
  {
    id: 9,
    level: 9,
    stage: 1,
    wordDisplay: 'P _ N',
    fullWord: 'PEN',
    missing: 'E',
    answer: 'E',
    image: '🖊️',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['A', 'O', 'E'], // Pos 2
    correctIndex: 2,
    hint: 'Listen for the short /e/ vowel in pen: p-e-n.',
  },
  {
    id: 10,
    level: 10,
    stage: 1,
    wordDisplay: 'B _ G',
    fullWord: 'BUG',
    missing: 'U',
    answer: 'U',
    image: '🐛',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['U', 'I', 'A'], // Pos 0
    correctIndex: 0,
    hint: 'Listen for the short /u/ vowel in bug: b-u-g.',
  },

  // ─────────────────────────────────────────────────────────────
  // STAGE 2 (Levels 11–20): Beginning Letters
  // ─────────────────────────────────────────────────────────────
  {
    id: 11,
    level: 11,
    stage: 2,
    wordDisplay: '_ A N',
    fullWord: 'FAN',
    missing: 'F',
    answer: 'F',
    image: '🪭',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['M', 'F', 'V'], // Pos 1
    correctIndex: 1,
    hint: 'What sound starts the word fan? F-f-fan.',
  },
  {
    id: 12,
    level: 12,
    stage: 2,
    wordDisplay: '_ E T',
    fullWord: 'NET',
    missing: 'N',
    answer: 'N',
    image: '🕸️',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['L', 'P', 'N'], // Pos 2
    correctIndex: 2,
    hint: 'What sound starts the word net? N-n-net.',
  },
  {
    id: 13,
    level: 13,
    stage: 2,
    wordDisplay: '_ I P',
    fullWord: 'LIP',
    missing: 'L',
    answer: 'L',
    image: '👄',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['L', 'T', 'D'], // Pos 0
    correctIndex: 0,
    hint: 'What sound starts the word lip? L-l-lip.',
  },
  {
    id: 14,
    level: 14,
    stage: 2,
    wordDisplay: '_ O P',
    fullWord: 'MOP',
    missing: 'M',
    answer: 'M',
    image: '🧹',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['H', 'M', 'B'], // Pos 1
    correctIndex: 1,
    hint: 'What sound starts the word mop? M-m-mop.',
  },
  {
    id: 15,
    level: 15,
    stage: 2,
    wordDisplay: '_ U B',
    fullWord: 'TUB',
    missing: 'T',
    answer: 'T',
    image: '🛁',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['F', 'S', 'T'], // Pos 2
    correctIndex: 2,
    hint: 'What sound starts the word tub? T-t-tub.',
  },
  {
    id: 16,
    level: 16,
    stage: 2,
    wordDisplay: '_ A M',
    fullWord: 'JAM',
    missing: 'J',
    answer: 'J',
    image: '🍯',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['J', 'W', 'Y'], // Pos 0
    correctIndex: 0,
    hint: 'What sound starts the word jam? J-j-jam.',
  },
  {
    id: 17,
    level: 17,
    stage: 2,
    wordDisplay: '_ E D',
    fullWord: 'RED',
    missing: 'R',
    answer: 'R',
    image: '🔴',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['Z', 'R', 'K'], // Pos 1
    correctIndex: 1,
    hint: 'What sound starts the word red? R-r-red.',
  },
  {
    id: 18,
    level: 18,
    stage: 2,
    wordDisplay: '_ I N',
    fullWord: 'PIN',
    missing: 'P',
    answer: 'P',
    image: '📌',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['Q', 'G', 'P'], // Pos 2
    correctIndex: 2,
    hint: 'What sound starts the word pin? P-p-pin.',
  },
  {
    id: 19,
    level: 19,
    stage: 2,
    wordDisplay: '_ O T',
    fullWord: 'POT',
    missing: 'P',
    answer: 'P',
    image: '🍲',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['P', 'B', 'V'], // Pos 0
    correctIndex: 0,
    hint: 'What sound starts the word pot? P-p-pot.',
  },
  {
    id: 20,
    level: 20,
    stage: 2,
    wordDisplay: '_ U T',
    fullWord: 'NUT',
    missing: 'N',
    answer: 'N',
    image: '🥜',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['C', 'N', 'M'], // Pos 1
    correctIndex: 1,
    hint: 'What sound starts the word nut? N-n-nut.',
  },

  // ─────────────────────────────────────────────────────────────
  // STAGE 3 (Levels 21–30): Ending Letters & Blends
  // ─────────────────────────────────────────────────────────────
  {
    id: 21,
    level: 21,
    stage: 3,
    wordDisplay: 'B A _',
    fullWord: 'BAT',
    missing: 'T',
    answer: 'T',
    image: '🦇',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['D', 'P', 'T'], // Pos 2
    correctIndex: 2,
    hint: 'Listen for the ending /t/ sound in bat.',
  },
  {
    id: 22,
    level: 22,
    stage: 3,
    wordDisplay: 'F I _',
    fullWord: 'FIG',
    missing: 'G',
    answer: 'G',
    image: '🫐',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['G', 'B', 'K'], // Pos 0
    correctIndex: 0,
    hint: 'Listen for the ending /g/ sound in fig.',
  },
  {
    id: 23,
    level: 23,
    stage: 3,
    wordDisplay: 'H O _',
    fullWord: 'HOP',
    missing: 'P',
    answer: 'P',
    image: '🦘',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['T', 'P', 'D'], // Pos 1
    correctIndex: 1,
    hint: 'Listen for the ending /p/ sound in hop.',
  },
  {
    id: 24,
    level: 24,
    stage: 3,
    wordDisplay: 'B U _',
    fullWord: 'BUS',
    missing: 'S',
    answer: 'S',
    image: '🚌',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['N', 'G', 'S'], // Pos 2
    correctIndex: 2,
    hint: 'Listen for the ending /s/ sound in bus.',
  },
  {
    id: 25,
    level: 25,
    stage: 3,
    wordDisplay: 'W E _',
    fullWord: 'WET',
    missing: 'T',
    answer: 'T',
    image: '💧',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['T', 'M', 'N'], // Pos 0
    correctIndex: 0,
    hint: 'Listen for the ending /t/ sound in wet.',
  },
  {
    id: 26,
    level: 26,
    stage: 3,
    wordDisplay: 'S H I _',
    fullWord: 'SHIP',
    missing: 'P',
    answer: 'P',
    image: '🚢',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['T', 'P', 'N'], // Pos 1
    correctIndex: 1,
    hint: 'Listen for the ending /p/ sound in ship.',
  },
  {
    id: 27,
    level: 27,
    stage: 3,
    wordDisplay: 'F R _ G',
    fullWord: 'FROG',
    missing: 'O',
    answer: 'O',
    image: '🐸',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['U', 'E', 'O'], // Pos 2
    correctIndex: 2,
    hint: 'Listen for the vowel inside frog: fr-o-g.',
  },
  {
    id: 28,
    level: 28,
    stage: 3,
    wordDisplay: 'S T A _',
    fullWord: 'STAR',
    missing: 'R',
    answer: 'R',
    image: '⭐',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['R', 'L', 'P'], // Pos 0
    correctIndex: 0,
    hint: 'Listen for the ending /r/ sound in star.',
  },
  {
    id: 29,
    level: 29,
    stage: 3,
    wordDisplay: 'C L A _',
    fullWord: 'CLAP',
    missing: 'P',
    answer: 'P',
    image: '👏',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['D', 'P', 'T'], // Pos 1
    correctIndex: 1,
    hint: 'Listen for the ending /p/ sound in clap.',
  },
  {
    id: 30,
    level: 30,
    stage: 3,
    wordDisplay: 'B L U _',
    fullWord: 'BLUE',
    missing: 'E',
    answer: 'E',
    image: '🟦',
    prompt: 'Which letter is missing? Tap to complete!',
    options: ['A', 'O', 'E'], // Pos 2
    correctIndex: 2,
    hint: 'Look for the silent /e/ at the end of blue.',
  },
];

/**
 * Returns a single round by 1-based level ID.
 */
export function getMissingLetterRound(levelId) {
  const num = Number(levelId);
  return MISSING_LETTER_CURRICULUM.find((r) => r.id === num || r.level === num) || null;
}

/**
 * Returns a single round by 0-based curriculum index.
 */
export function getMissingLetterRoundByIndex(index) {
  const idx = Number(index);
  if (!Number.isInteger(idx) || idx < 0 || idx >= MISSING_LETTER_CURRICULUM.length) {
    return null;
  }
  return MISSING_LETTER_CURRICULUM[idx];
}

/**
 * Returns stage metadata for a 1-based level number.
 */
export function getMissingLetterStageForLevel(level) {
  const lvl = Number(level);
  return MISSING_LETTER_STAGES.find((s) => lvl >= s.levelRange[0] && lvl <= s.levelRange[1]) || MISSING_LETTER_STAGES[0];
}

/**
 * Returns stage badge string for a stage number (1, 2, or 3).
 */
export function getMissingLetterStageBadge(stage) {
  const stg = Number(stage);
  const found = MISSING_LETTER_STAGES.find((s) => s.stage === stg);
  return found?.badge || '🧩 Vowel Builder';
}

/**
 * Returns milestone config for a given level, or null.
 */
export function getMissingLetterMilestone(level) {
  return MISSING_LETTER_MILESTONES[Number(level)] || null;
}

/**
 * Returns a defensive shallow copy of displayed options.
 */
export function getMissingLetterDisplayedOptions(round) {
  if (!round || !Array.isArray(round.options)) return [];
  return [...round.options];
}


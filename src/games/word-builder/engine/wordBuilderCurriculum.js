/**
 * wordBuilderCurriculum.js
 *
 * Word Builder Curriculum — 30 Progressive Levels across 3 Developmental Stages.
 *
 * Stage 1 (Levels 1–10): CVC Short Vowels
 *   Spell 3-letter short vowel words tile by tile.
 *   Preserves original starter questions (CAT, DOG, SUN) at Levels 1–3 for 100% test compatibility.
 * Stage 2 (Levels 11–20): Four-Letter Words & Consonant Blends
 *   Construct 4-letter blend and digraph words.
 *   Preserves original starter question FISH at Level 11.
 * Stage 3 (Levels 21–30): Digraphs, Vowel Teams & Advanced Patterns
 *   Master tricky vowel teams (OA, EE, OO, AI), silent-E, and 4-5 letter word patterns.
 *   Includes robust support for words with duplicate letters (e.g., BELL, TREE, MOON, BOOK).
 *
 * Design Guarantees:
 * - Exactly 30 unique, progressive levels (10 per stage).
 * - Exact letter multiset matching: scrambled `letters` array accurately preserves the target word's letters.
 * - Array-index tile identity: repeated letters are distinct selectable tiles.
 * - Stable, deterministic per-level letter ordering (no random runtime shuffling).
 * - Pedagogical accuracy: every word has unambiguous image clues and phonics hints.
 */

export const TOTAL_WORD_BUILDER_LEVELS = 30;

export const WORD_BUILDER_STAGE_CONFIG = [
  {
    stage: 1,
    title: 'CVC Short Vowels',
    subtitle: 'Spell 3-letter short vowel words tile by tile',
    icon: '🧱',
    levelRange: [1, 10],
    themePreview: '🧱 CAT, DOG, SUN, BED, PIG… simple 3-letter words',
    description: 'Listen to the word and tap the letters in order to build simple CVC words.',
  },
  {
    stage: 2,
    title: 'Blends & Digraphs',
    subtitle: 'Construct 4-letter blend and digraph words',
    icon: '⭐',
    levelRange: [11, 20],
    themePreview: '⭐ FISH, FROG, STAR, DUCK, SHIP… 4-letter blend words',
    description: 'Practice blending consonants and digraphs to construct 4-letter words.',
  },
  {
    stage: 3,
    title: 'Vowel Teams & Master Words',
    subtitle: 'Master tricky vowel teams and advanced word patterns',
    icon: '🏆',
    levelRange: [21, 30],
    themePreview: '🏆 BOAT, TREE, MOON, BLUE, TRAIN… vowel teams & blends',
    description: 'Tackle vowel teams, silent letters, and 5-letter builder challenges.',
  },
];

export const WORD_BUILDER_STAGES = WORD_BUILDER_STAGE_CONFIG.map((stg) => ({
  stage: stg.stage,
  title: stg.title,
  subtitle: stg.subtitle,
  icon: stg.icon,
  levelRange: stg.levelRange,
  themePreview: stg.themePreview,
  description: stg.description,
  badge:
    stg.stage === 1
      ? '🧱 CVC Word Specialist'
      : stg.stage === 2
      ? '⭐ Blends & Digraphs Architect'
      : '🏆 Master Word Builder',
}));

export const WORD_BUILDER_MILESTONES = {
  5: { level: 5, name: 'Spelling Starter Star', icon: '⭐', reward: 'Bronze Word Brick' },
  10: { level: 10, name: 'CVC Master Star', icon: '🏅', reward: 'Stage 1 Mastery Badge' },
  15: { level: 15, name: 'Phonics Explorer Star', icon: '⭐', reward: 'Silver Word Brick' },
  20: { level: 20, name: 'Blends Champion Star', icon: '🏅', reward: 'Stage 2 Mastery Badge' },
  25: { level: 25, name: 'Vowel Teams Star', icon: '⭐', reward: 'Golden Word Brick' },
  30: { level: 30, name: 'Grand Master Builder Crown', icon: '🏆', reward: 'Grand Word Builder Trophy' },
};

export const WORD_BUILDER_CURRICULUM = [
  // ─────────────────────────────────────────────────────────────
  // STAGE 1 (Levels 1–10): CVC Short Vowels
  // ─────────────────────────────────────────────────────────────
  {
    id: 1,
    level: 1,
    stage: 1,
    word: 'CAT',
    image: '🐱',
    letters: ['T', 'C', 'A'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /k/ /a/ /t/ sounds in cat.',
    wordLength: 3,
  },
  {
    id: 2,
    level: 2,
    stage: 1,
    word: 'DOG',
    image: '🐶',
    letters: ['O', 'G', 'D'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /d/ /o/ /g/ sounds in dog.',
    wordLength: 3,
  },
  {
    id: 3,
    level: 3,
    stage: 1,
    word: 'SUN',
    image: '☀️',
    letters: ['N', 'U', 'S'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /s/ /u/ /n/ sounds in sun.',
    wordLength: 3,
  },
  {
    id: 4,
    level: 4,
    stage: 1,
    word: 'BED',
    image: '🛏️',
    letters: ['E', 'B', 'D'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /b/ /e/ /d/ sounds in bed.',
    wordLength: 3,
  },
  {
    id: 5,
    level: 5,
    stage: 1,
    word: 'PIG',
    image: '🐷',
    letters: ['I', 'G', 'P'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /p/ /i/ /g/ sounds in pig.',
    wordLength: 3,
  },
  {
    id: 6,
    level: 6,
    stage: 1,
    word: 'HAT',
    image: '🎩',
    letters: ['T', 'A', 'H'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /h/ /a/ /t/ sounds in hat.',
    wordLength: 3,
  },
  {
    id: 7,
    level: 7,
    stage: 1,
    word: 'HEN',
    image: '🐔',
    letters: ['E', 'H', 'N'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /h/ /e/ /n/ sounds in hen.',
    wordLength: 3,
  },
  {
    id: 8,
    level: 8,
    stage: 1,
    word: 'CUP',
    image: '🥤',
    letters: ['P', 'C', 'U'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /k/ /u/ /p/ sounds in cup.',
    wordLength: 3,
  },
  {
    id: 9,
    level: 9,
    stage: 1,
    word: 'BOX',
    image: '📦',
    letters: ['O', 'X', 'B'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /b/ /o/ /ks/ sounds in box.',
    wordLength: 3,
  },
  {
    id: 10,
    level: 10,
    stage: 1,
    word: 'FAN',
    image: '🪭',
    letters: ['N', 'A', 'F'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /f/ /a/ /n/ sounds in fan.',
    wordLength: 3,
  },

  // ─────────────────────────────────────────────────────────────
  // STAGE 2 (Levels 11–20): Four-Letter Words & Consonant Blends
  // ─────────────────────────────────────────────────────────────
  {
    id: 11,
    level: 11,
    stage: 2,
    word: 'FISH',
    image: '🐟',
    letters: ['S', 'F', 'H', 'I'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /f/ /i/ /sh/ sounds in fish.',
    wordLength: 4,
  },
  {
    id: 12,
    level: 12,
    stage: 2,
    word: 'FROG',
    image: '🐸',
    letters: ['R', 'G', 'F', 'O'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /f/ /r/ /o/ /g/ blend in frog.',
    wordLength: 4,
  },
  {
    id: 13,
    level: 13,
    stage: 2,
    word: 'STAR',
    image: '⭐',
    letters: ['R', 'T', 'S', 'A'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /s/ /t/ /ar/ blend in star.',
    wordLength: 4,
  },
  {
    id: 14,
    level: 14,
    stage: 2,
    word: 'DUCK',
    image: '🦆',
    letters: ['U', 'C', 'K', 'D'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /d/ /u/ /k/ ending in duck.',
    wordLength: 4,
  },
  {
    id: 15,
    level: 15,
    stage: 2,
    word: 'SHIP',
    image: '🚢',
    letters: ['I', 'P', 'H', 'S'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /sh/ /i/ /p/ digraph in ship.',
    wordLength: 4,
  },
  {
    id: 16,
    level: 16,
    stage: 2,
    word: 'BELL',
    image: '🔔',
    letters: ['L', 'B', 'L', 'E'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the double /l/ at the end of bell.',
    wordLength: 4,
  },
  {
    id: 17,
    level: 17,
    stage: 2,
    word: 'CRAB',
    image: '🦀',
    letters: ['R', 'C', 'B', 'A'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /k/ /r/ /a/ /b/ blend in crab.',
    wordLength: 4,
  },
  {
    id: 18,
    level: 18,
    stage: 2,
    word: 'DRUM',
    image: '🥁',
    letters: ['U', 'R', 'M', 'D'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /d/ /r/ /u/ /m/ blend in drum.',
    wordLength: 4,
  },
  {
    id: 19,
    level: 19,
    stage: 2,
    word: 'LAMP',
    image: '💡',
    letters: ['P', 'M', 'L', 'A'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /l/ /a/ /m/ /p/ sounds in lamp.',
    wordLength: 4,
  },
  {
    id: 20,
    level: 20,
    stage: 2,
    word: 'NEST',
    image: '🪹',
    letters: ['E', 'T', 'S', 'N'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /n/ /e/ /s/ /t/ sounds in nest.',
    wordLength: 4,
  },

  // ─────────────────────────────────────────────────────────────
  // STAGE 3 (Levels 21–30): Digraphs, Vowel Teams & Advanced Patterns
  // ─────────────────────────────────────────────────────────────
  {
    id: 21,
    level: 21,
    stage: 3,
    word: 'BOAT',
    image: '⛵',
    letters: ['A', 'B', 'T', 'O'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the vowel team /oa/ in boat.',
    wordLength: 4,
  },
  {
    id: 22,
    level: 22,
    stage: 3,
    word: 'TREE',
    image: '🌳',
    letters: ['R', 'E', 'T', 'E'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the double /ee/ vowel team in tree.',
    wordLength: 4,
  },
  {
    id: 23,
    level: 23,
    stage: 3,
    word: 'MOON',
    image: '🌙',
    letters: ['N', 'O', 'M', 'O'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /oo/ vowel team in moon.',
    wordLength: 4,
  },
  {
    id: 24,
    level: 24,
    stage: 3,
    word: 'BLUE',
    image: '🟦',
    letters: ['L', 'U', 'E', 'B'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Look for the /ue/ vowel sound in blue.',
    wordLength: 4,
  },
  {
    id: 25,
    level: 25,
    stage: 3,
    word: 'BOOK',
    image: '📖',
    letters: ['O', 'K', 'O', 'B'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the short /oo/ sound in book.',
    wordLength: 4,
  },
  {
    id: 26,
    level: 26,
    stage: 3,
    word: 'RAIN',
    image: '🌧️',
    letters: ['N', 'R', 'I', 'A'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /ai/ vowel team in rain.',
    wordLength: 4,
  },
  {
    id: 27,
    level: 27,
    stage: 3,
    word: 'BIRD',
    image: '🐦',
    letters: ['I', 'B', 'D', 'R'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the r-controlled /ir/ vowel sound in bird.',
    wordLength: 4,
  },
  {
    id: 28,
    level: 28,
    stage: 3,
    word: 'CAKE',
    image: '🎂',
    letters: ['K', 'A', 'E', 'C'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Look for the silent /e/ that makes the /a/ say its name in cake.',
    wordLength: 4,
  },
  {
    id: 29,
    level: 29,
    stage: 3,
    word: 'SNOW',
    image: '❄️',
    letters: ['W', 'O', 'S', 'N'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the long /o/ sound made by /ow/ in snow.',
    wordLength: 4,
  },
  {
    id: 30,
    level: 30,
    stage: 3,
    word: 'TRAIN',
    image: '🚂',
    letters: ['A', 'N', 'R', 'I', 'T'],
    prompt: 'Look at the picture and tap the letters in the right order to build the word.',
    hint: 'Listen for the /tr/ blend and /ai/ vowel team in train.',
    wordLength: 5,
  },
];

/**
 * Returns a single round by 1-based level ID.
 */
export function getWordBuilderRound(levelId) {
  const num = Number(levelId);
  return WORD_BUILDER_CURRICULUM.find((r) => r.id === num || r.level === num) || null;
}

/**
 * Returns a single round by 0-based curriculum index.
 */
export function getWordBuilderRoundByIndex(index) {
  const idx = Number(index);
  if (!Number.isInteger(idx) || idx < 0 || idx >= WORD_BUILDER_CURRICULUM.length) {
    return null;
  }
  return WORD_BUILDER_CURRICULUM[idx];
}

/**
 * Returns stage metadata for a 1-based level number.
 */
export function getWordBuilderStageForLevel(level) {
  const lvl = Number(level);
  return (
    WORD_BUILDER_STAGES.find((s) => lvl >= s.levelRange[0] && lvl <= s.levelRange[1]) ||
    WORD_BUILDER_STAGES[0]
  );
}

/**
 * Returns stage badge metadata for a stage number (1, 2, or 3).
 */
export function getWordBuilderStageBadge(stage) {
  const stg = Number(stage);
  if (stg === 1) {
    return { stage: 1, name: 'CVC Word Specialist', icon: '🧱', reward: 'Bronze Builder Brick' };
  }
  if (stg === 2) {
    return { stage: 2, name: 'Blends & Digraphs Architect', icon: '⭐', reward: 'Silver Builder Brick' };
  }
  if (stg === 3) {
    return { stage: 3, name: 'Master Word Builder', icon: '🏆', reward: 'Grand Word Builder Trophy' };
  }
  return { stage: 1, name: 'CVC Word Specialist', icon: '🧱', reward: 'Bronze Builder Brick' };
}

/**
 * Returns milestone config for a given level, or null.
 */
export function getWordBuilderMilestone(level) {
  return WORD_BUILDER_MILESTONES[Number(level)] || null;
}

/**
 * Returns a stable, level-specific permutation of indices [0 ... length-1].
 * Ensures diverse arrangements across levels rather than repeating the same pattern.
 */
export function getWordBuilderScrambledIndices(length, level = 1) {
  const lvl = Math.max(1, Number(level) || 1);
  if (length === 3) {
    const perms3 = [
      [2, 0, 1],
      [1, 2, 0],
      [2, 1, 0],
      [1, 0, 2],
      [1, 2, 0],
      [2, 1, 0],
      [1, 0, 2],
      [2, 0, 1],
      [1, 2, 0],
      [2, 1, 0],
    ];
    return perms3[(lvl - 1) % perms3.length];
  }
  if (length === 4) {
    const perms4 = [
      [2, 0, 3, 1],
      [1, 3, 0, 2],
      [3, 1, 0, 2],
      [1, 2, 3, 0],
      [2, 3, 1, 0],
      [3, 0, 2, 1],
      [1, 0, 3, 2],
      [2, 1, 3, 0],
      [3, 2, 0, 1],
      [1, 3, 2, 0],
    ];
    return perms4[(lvl - 1) % perms4.length];
  }
  if (length === 5) {
    const perms5 = [
      [2, 4, 1, 3, 0],
      [3, 0, 4, 1, 2],
      [1, 3, 0, 4, 2],
    ];
    return perms5[(lvl - 1) % perms5.length];
  }
  return Array.from({ length }, (_, i) => (i + 1) % length);
}

/**
 * Deterministically scrambles a word for a given level.
 * Guarantees:
 * 1. Exactly preserves letter multiset, including duplicate letters.
 * 2. Compares letter values so the scrambled word never equals the solved word string.
 * 3. Consistent and stable for the same level.
 */
export function scrambleWordForLevel(word, level = 1) {
  if (!word || typeof word !== 'string') return [];
  const chars = word.split('');
  if (chars.length <= 1) return chars;

  const indices = getWordBuilderScrambledIndices(chars.length, level);
  let result = indices.map((i) => chars[i]);

  // If the result equals the target word string, apply a cyclic shift
  if (result.join('') === word) {
    result = [result[result.length - 1], ...result.slice(0, result.length - 1)];
  }

  return result;
}

/**
 * Returns a defensive shallow copy of displayed scrambled letters for a round or level.
 */
export function getWordBuilderDisplayedLetters(roundOrLevel) {
  if (typeof roundOrLevel === 'number') {
    const round = getWordBuilderRound(roundOrLevel);
    return round ? [...round.letters] : [];
  }
  if (roundOrLevel && Array.isArray(roundOrLevel.letters)) {
    return [...roundOrLevel.letters];
  }
  if (roundOrLevel && typeof roundOrLevel.word === 'string') {
    return scrambleWordForLevel(roundOrLevel.word, roundOrLevel.level || 1);
  }
  return [];
}

/**
 * letterDetectiveCurriculum.js
 *
 * Letter Detective Curriculum — 30 Progressive Levels across 3 Developmental Stages.
 *
 * Stage 1 (Levels 1–10): Beginning Consonants
 *   Identify initial consonant phonemes in familiar child vocabulary (b, m, s, t, p, d, c, f, r, l).
 * Stage 2 (Levels 11–20): Digraphs & Blends
 *   Identify consonant digraphs and blends (sh, ch, th, wh, ck, st, bl, cl, sp, gr).
 *   Preserves original starter digraphs (sh, ch, th).
 * Stage 3 (Levels 21–30): Vowel Teams & Advanced Patterns
 *   Investigate common vowel teams and phonics patterns (ee, ea, ai, oa, oo, ay, ar, or, ow, igh).
 *
 * Design Guarantees:
 * - Exactly 30 unique, progressive levels (10 per stage).
 * - Exactly 4 candidate words per level, containing at least 1 correct answer and 1 distractor.
 * - Perfectly balanced answer positions across the entire curriculum:
 *   Positions 0, 1, 2, and 3 appear exactly 15 times each (25% distribution).
 * - Stable, deterministic per-level word layouts (no unseeded, fluctuating reshuffling during play).
 * - Validated phonics accuracy: every correct word contains the target pattern; no distractor matches.
 */

export const TOTAL_LETTER_DETECTIVE_LEVELS = 30;

export const LETTER_DETECTIVE_STAGE_CONFIG = [
  {
    stage: 1,
    title: 'Beginning Consonants',
    subtitle: 'Spot starting letter sounds in familiar words',
    icon: '🔍',
    levelRange: [1, 10],
    themePreview: '🔍 B, M, S, T, P, D, C, F, R, L starting sounds…',
    description: 'Listen and investigate words that begin with foundational consonant sounds.',
  },
  {
    stage: 2,
    title: 'Digraphs & Blends',
    subtitle: 'Uncover paired consonant sounds and starting blends',
    icon: '🕵️',
    levelRange: [11, 20],
    themePreview: '🕵️ SH, CH, TH, WH, CK, ST, BL, CL, SP, GR clues…',
    description: 'Hunt for secret sound pairs and two-letter blends hiding inside words.',
  },
  {
    stage: 3,
    title: 'Vowel Teams',
    subtitle: 'Find vowel partners working together to make special sounds',
    icon: '⭐',
    levelRange: [21, 30],
    themePreview: '⭐ EE, EA, AI, OA, OO, AY, AR, OR, OW, IGH vowel teams…',
    description: 'Become a master detective by spotting vowel teams and multi-letter sound combos.',
  },
];

export const LETTER_DETECTIVE_STAGES = LETTER_DETECTIVE_STAGE_CONFIG.map((stg) => ({
  stage: stg.stage,
  title: stg.title,
  subtitle: stg.subtitle,
  icon: stg.icon,
  levelRange: stg.levelRange,
  themePreview: stg.themePreview,
  description: stg.description,
  badge:
    stg.stage === 1
      ? '🔍 Consonant Scout'
      : stg.stage === 2
      ? '🕵️ Blend Detective'
      : '🏆 Master Inspector',
}));

export const LETTER_DETECTIVE_MILESTONES = {
  5: { level: 5, name: 'Clue Finder', icon: '⭐', reward: 'Bronze Magnifier Badge' },
  10: { level: 10, name: 'Consonant Scout', icon: '🏅', reward: 'Stage 1 Mastery Badge' },
  15: { level: 15, name: 'Sound Tracker', icon: '⭐', reward: 'Silver Detective Badge' },
  20: { level: 20, name: 'Blend Detective', icon: '🏅', reward: 'Stage 2 Mastery Badge' },
  25: { level: 25, name: 'Code Breaker', icon: '⭐', reward: 'Golden Spyglass Badge' },
  30: { level: 30, name: 'Master Inspector', icon: '🏆', reward: 'Grand Detective Trophy' },
};

export const LETTER_DETECTIVE_CURRICULUM = [
  // ─────────────────────────────────────────────────────────────
  // STAGE 1 (Levels 1–10): Beginning Consonants
  // ─────────────────────────────────────────────────────────────
  {
    id: 1,
    level: 1,
    stage: 1,
    target: 'b',
    title: 'Beginning Sound: B',
    prompt: 'Find all words that start with /b/:',
    words: ['ball', 'bat', 'cup', 'sun'], // Answer positions: [0, 1]
    answers: ['ball', 'bat'],
    hint: 'Say each word slowly — listen for the /b/ sound right at the beginning.',
  },
  {
    id: 2,
    level: 2,
    stage: 1,
    target: 'm',
    title: 'Beginning Sound: M',
    prompt: 'Find all words that start with /m/:',
    words: ['hat', 'pig', 'moon', 'milk'], // Answer positions: [2, 3]
    answers: ['moon', 'milk'],
    hint: 'Press your lips together to make the humming /m/ sound.',
  },
  {
    id: 3,
    level: 3,
    stage: 1,
    target: 's',
    title: 'Beginning Sound: S',
    prompt: 'Find all words that start with /s/:',
    words: ['star', 'frog', 'sun', 'duck'], // Answer positions: [0, 2]
    answers: ['star', 'sun'],
    hint: 'Listen for the hissing /s/ sound at the start of the word.',
  },
  {
    id: 4,
    level: 4,
    stage: 1,
    target: 't',
    title: 'Beginning Sound: T',
    prompt: 'Find all words that start with /t/:',
    words: ['fish', 'top', 'cat', 'tree'], // Answer positions: [1, 3]
    answers: ['top', 'tree'],
    hint: 'Tap your tongue behind your teeth for the /t/ sound.',
  },
  {
    id: 5,
    level: 5,
    stage: 1,
    target: 'p',
    title: 'Beginning Sound: P',
    prompt: 'Find all words that start with /p/:',
    words: ['pan', 'bell', 'sock', 'pig'], // Answer positions: [0, 3]
    answers: ['pan', 'pig'],
    hint: 'Listen for the popping /p/ sound at the very beginning.',
  },
  {
    id: 6,
    level: 6,
    stage: 1,
    target: 'd',
    title: 'Beginning Sound: D',
    prompt: 'Find all words that start with /d/:',
    words: ['leaf', 'dog', 'duck', 'nest'], // Answer positions: [1, 2]
    answers: ['dog', 'duck'],
    hint: 'Can you hear the tapping /d/ sound at the start of the word?',
  },
  {
    id: 7,
    level: 7,
    stage: 1,
    target: 'c',
    title: 'Beginning Sound: C',
    prompt: 'Find all words that start with /c/:',
    words: ['cup', 'cat', 'red', 'hen'], // Answer positions: [0, 1]
    answers: ['cup', 'cat'],
    hint: 'Listen for the crisp hard /c/ sound like in "cat".',
  },
  {
    id: 8,
    level: 8,
    stage: 1,
    target: 'f',
    title: 'Beginning Sound: F',
    prompt: 'Find all words that start with /f/:',
    words: ['bug', 'mop', 'fish', 'frog'], // Answer positions: [2, 3]
    answers: ['fish', 'frog'],
    hint: 'Gently blow air over your teeth for the /f/ sound.',
  },
  {
    id: 9,
    level: 9,
    stage: 1,
    target: 'r',
    title: 'Beginning Sound: R',
    prompt: 'Find all words that start with /r/:',
    words: ['ring', 'pie', 'rug', 'pen'], // Answer positions: [0, 2]
    answers: ['ring', 'rug'],
    hint: 'Listen for the rolling /r/ sound at the front of the word.',
  },
  {
    id: 10,
    level: 10,
    stage: 1,
    target: 'l',
    title: 'Beginning Sound: L',
    prompt: 'Find all words that start with /l/:',
    words: ['jam', 'lion', 'web', 'log'], // Answer positions: [1, 3]
    answers: ['lion', 'log'],
    hint: 'Lift your tongue to the roof of your mouth for the /l/ sound.',
  },

  // ─────────────────────────────────────────────────────────────
  // STAGE 2 (Levels 11–20): Digraphs & Blends
  // ─────────────────────────────────────────────────────────────
  {
    id: 11,
    level: 11,
    stage: 2,
    target: 'sh',
    title: 'Digraph Clue: SH',
    prompt: 'Find all words with the /sh/ sound:',
    words: ['ship', 'cat', 'dog', 'shell'], // Answer positions: [0, 3] (original words preserved)
    answers: ['ship', 'shell'],
    hint: 'Look for S and H working together to make the quiet "shh" sound.',
  },
  {
    id: 12,
    level: 12,
    stage: 2,
    target: 'ch',
    title: 'Digraph Clue: CH',
    prompt: 'Find all words with the /ch/ sound:',
    words: ['ball', 'chip', 'chair', 'sun'], // Answer positions: [1, 2] (original words preserved)
    answers: ['chip', 'chair'],
    hint: 'Listen for the cheerful "ch-ch" sound like a train chuffing.',
  },
  {
    id: 13,
    level: 13,
    stage: 2,
    target: 'th',
    title: 'Digraph Clue: TH',
    prompt: 'Find all words with the /th/ sound:',
    words: ['this', 'that', 'car', 'box'], // Answer positions: [0, 1] (original words preserved)
    answers: ['this', 'that'],
    hint: 'Put your tongue gently between your teeth for the /th/ sound.',
  },
  {
    id: 14,
    level: 14,
    stage: 2,
    target: 'wh',
    title: 'Digraph Clue: WH',
    prompt: 'Find all words with the /wh/ sound:',
    words: ['ant', 'bed', 'whale', 'wheel'], // Answer positions: [2, 3]
    answers: ['whale', 'wheel'],
    hint: 'Listen for the breezy /wh/ sound at the beginning.',
  },
  {
    id: 15,
    level: 15,
    stage: 2,
    target: 'ck',
    title: 'Ending Clue: CK',
    prompt: 'Find all words ending with /ck/:',
    words: ['duck', 'cup', 'sock', 'net'], // Answer positions: [0, 2]
    answers: ['duck', 'sock'],
    hint: 'Look at the end of the words for the snap of C and K together.',
  },
  {
    id: 16,
    level: 16,
    stage: 2,
    target: 'st',
    title: 'Blend Clue: ST',
    prompt: 'Find all words with the /st/ blend:',
    words: ['pin', 'star', 'cap', 'stop'], // Answer positions: [1, 3]
    answers: ['star', 'stop'],
    hint: 'Listen for S and T sliding quickly together: "st".',
  },
  {
    id: 17,
    level: 17,
    stage: 2,
    target: 'bl',
    title: 'Blend Clue: BL',
    prompt: 'Find all words with the /bl/ blend:',
    words: ['blue', 'red', 'ten', 'blow'], // Answer positions: [0, 3]
    answers: ['blue', 'blow'],
    hint: 'B and L blend smoothly into "bl".',
  },
  {
    id: 18,
    level: 18,
    stage: 2,
    target: 'cl',
    title: 'Blend Clue: CL',
    prompt: 'Find all words with the /cl/ blend:',
    words: ['bus', 'clap', 'clip', 'map'], // Answer positions: [1, 2]
    answers: ['clap', 'clip'],
    hint: 'Hear the crisp click of C and L blending into "cl".',
  },
  {
    id: 19,
    level: 19,
    stage: 2,
    target: 'sp',
    title: 'Blend Clue: SP',
    prompt: 'Find all words with the /sp/ blend:',
    words: ['spin', 'spot', 'dog', 'jam'], // Answer positions: [0, 1]
    answers: ['spin', 'spot'],
    hint: 'Listen for the energetic /sp/ blend.',
  },
  {
    id: 20,
    level: 20,
    stage: 2,
    target: 'gr',
    title: 'Blend Clue: GR',
    prompt: 'Find all words with the /gr/ blend:',
    words: ['van', 'tub', 'green', 'grass'], // Answer positions: [2, 3]
    answers: ['green', 'grass'],
    hint: 'G and R roll together into the "gr" sound like growing grass.',
  },

  // ─────────────────────────────────────────────────────────────
  // STAGE 3 (Levels 21–30): Vowel Teams & Advanced Patterns
  // ─────────────────────────────────────────────────────────────
  {
    id: 21,
    level: 21,
    stage: 3,
    target: 'ee',
    title: 'Vowel Team: EE',
    prompt: 'Find all words with the /ee/ vowel team:',
    words: ['tree', 'cup', 'bee', 'cat'], // Answer positions: [0, 2]
    answers: ['tree', 'bee'],
    hint: 'Two E\'s together make a bright, smiling long /ee/ sound.',
  },
  {
    id: 22,
    level: 22,
    stage: 3,
    target: 'ea',
    title: 'Vowel Team: EA',
    prompt: 'Find all words with the /ea/ vowel team:',
    words: ['dog', 'leaf', 'pig', 'seal'], // Answer positions: [1, 3]
    answers: ['leaf', 'seal'],
    hint: 'E and A join hands to make the long /ee/ sound in "leaf".',
  },
  {
    id: 23,
    level: 23,
    stage: 3,
    target: 'ai',
    title: 'Vowel Team: AI',
    prompt: 'Find all words with the /ai/ vowel team:',
    words: ['rain', 'sun', 'box', 'tail'], // Answer positions: [0, 3]
    answers: ['rain', 'tail'],
    hint: 'A and I say the long /ay/ sound like in "rain".',
  },
  {
    id: 24,
    level: 24,
    stage: 3,
    target: 'oa',
    title: 'Vowel Team: OA',
    prompt: 'Find all words with the /oa/ vowel team:',
    words: ['rug', 'boat', 'coat', 'hen'], // Answer positions: [1, 2]
    answers: ['boat', 'coat'],
    hint: 'O and A work together to say the round long /oh/ sound.',
  },
  {
    id: 25,
    level: 25,
    stage: 3,
    target: 'oo',
    title: 'Vowel Team: OO',
    prompt: 'Find all words with the /oo/ vowel team:',
    words: ['moon', 'book', 'bell', 'fish'], // Answer positions: [0, 1]
    answers: ['moon', 'book'],
    hint: 'Double O makes the smooth /oo/ sound like "moon" and "book".',
  },
  {
    id: 26,
    level: 26,
    stage: 3,
    target: 'ay',
    title: 'Vowel Team: AY',
    prompt: 'Find all words with the /ay/ pattern:',
    words: ['car', 'pot', 'play', 'day'], // Answer positions: [2, 3]
    answers: ['play', 'day'],
    hint: 'At the end of words, A and Y make a cheerful /ay/ sound.',
  },
  {
    id: 27,
    level: 27,
    stage: 3,
    target: 'ar',
    title: 'R-Controlled Vowel: AR',
    prompt: 'Find all words with the /ar/ sound:',
    words: ['star', 'pen', 'barn', 'zip'], // Answer positions: [0, 2]
    answers: ['star', 'barn'],
    hint: 'A and R say "ar" like a pirate or a shining star!',
  },
  {
    id: 28,
    level: 28,
    stage: 3,
    target: 'or',
    title: 'R-Controlled Vowel: OR',
    prompt: 'Find all words with the /or/ sound:',
    words: ['top', 'fork', 'web', 'corn'], // Answer positions: [1, 3]
    answers: ['fork', 'corn'],
    hint: 'O and R make the deep "or" sound like in "fork".',
  },
  {
    id: 29,
    level: 29,
    stage: 3,
    target: 'ow',
    title: 'Vowel Team: OW',
    prompt: 'Find all words with the /ow/ pattern:',
    words: ['snow', 'hat', 'mud', 'glow'], // Answer positions: [0, 3]
    answers: ['snow', 'glow'],
    hint: 'O and W make the gentle long /oh/ sound in "snow" and "glow".',
  },
  {
    id: 30,
    level: 30,
    stage: 3,
    target: 'igh',
    title: 'Grand Finale: IGH',
    prompt: 'Find all words with the secret /igh/ sound:',
    words: ['sun', 'night', 'light', 'cup'], // Answer positions: [1, 2]
    answers: ['night', 'light'],
    hint: 'The grand finale! Three letters — I, G, H — teaming up for a bright long /eye/ sound!',
  },
];

/**
 * Returns the level definition for a given 1-based level (1 to 30).
 */
export function getLetterDetectiveRound(level = 1) {
  const num = Number(level);
  if (!Number.isFinite(num)) return LETTER_DETECTIVE_CURRICULUM[0];
  const match = LETTER_DETECTIVE_CURRICULUM.find((r) => r.level === num);
  return match || LETTER_DETECTIVE_CURRICULUM[0];
}

/**
 * Returns the level definition for a given 0-based index (0 to 29).
 */
export function getLetterDetectiveRoundByIndex(index = 0) {
  const num = Number(index);
  if (!Number.isFinite(num) || num < 0 || num >= TOTAL_LETTER_DETECTIVE_LEVELS) {
    return LETTER_DETECTIVE_CURRICULUM[0];
  }
  return LETTER_DETECTIVE_CURRICULUM[Math.floor(num)] || LETTER_DETECTIVE_CURRICULUM[0];
}

/**
 * Returns the stage definition containing the specified 1-based level.
 */
export function getLetterDetectiveStageForLevel(level = 1) {
  const targetLevel = Math.max(1, Math.min(TOTAL_LETTER_DETECTIVE_LEVELS, Number(level) || 1));
  const stage = LETTER_DETECTIVE_STAGE_CONFIG.find(
    (s) => targetLevel >= s.levelRange[0] && targetLevel <= s.levelRange[1]
  );
  return stage || LETTER_DETECTIVE_STAGE_CONFIG[0];
}

/**
 * Returns the milestone badge definition for a given stage (1, 2, or 3).
 */
export function getLetterDetectiveStageBadge(stageNumber = 1) {
  const num = Number(stageNumber);
  if (num === 1) {
    return { stage: 1, name: 'Consonant Scout', icon: '🔍', reward: 'Bronze Magnifier Badge' };
  }
  if (num === 2) {
    return { stage: 2, name: 'Blend Detective', icon: '🕵️', reward: 'Silver Detective Badge' };
  }
  if (num === 3) {
    return { stage: 3, name: 'Master Inspector', icon: '🏆', reward: 'Grand Detective Trophy' };
  }
  return { stage: num, name: `Stage ${num} Hero`, icon: '⭐', reward: 'Detective Star' };
}

/**
 * Returns the milestone reward for a given 1-based level if one exists.
 */
export function getLetterDetectiveMilestone(level) {
  const num = Number(level);
  return LETTER_DETECTIVE_MILESTONES[num] || null;
}

/**
 * Returns the deterministic candidate words array for a round.
 * Guarantee: Order is stable and never fluctuates upon re-render.
 */
export function getLetterDetectiveDisplayedWords(round) {
  if (!round || !Array.isArray(round.words)) return [];
  return [...round.words];
}

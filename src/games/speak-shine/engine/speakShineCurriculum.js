/**
 * speakShineCurriculum.js
 *
 * Speak & Shine Curriculum — 30 Progressive Levels across 3 Developmental Stages.
 *
 * Stage 1 (Levels 1–10): CVC & Familiar Short Words
 *   Simple, high-frequency CVC and short words that are easy to hear, say, and
 *   recognise. Preserves all 10 original SPEAK_WORDS from the legacy word bank
 *   (SUN, FISH, SHIP, BALL, TREE, BOOK, APPLE, MOON, STAR, SCHOOL) in their
 *   original order at Levels 1–10 for full test compatibility.
 *
 * Stage 2 (Levels 11–20): Two-Syllable & Blend Words
 *   Familiar but slightly longer words — animals, household objects, and action
 *   words — requiring more careful articulation. Children move from 1-syllable
 *   to 2-syllable targets at a manageable pace.
 *
 * Stage 3 (Levels 21–30): Multi-Syllable & Compound Words
 *   Compound nouns, multi-syllable words, and concept vocabulary that build
 *   speaking confidence for everyday literacy.
 *
 * Design Guarantees:
 * - Exactly 30 unique, progressive levels (10 per stage).
 * - Every level has a stable integer `id` equal to `level`, a target `word`,
 *   a display `emoji`, a child-friendly `prompt`, and an optional `phonicsHint`.
 * - The original 10 SPEAK_WORDS are preserved 1:1 at Levels 1–10.
 * - IDs are unique positive integers; no two levels share an ID.
 * - All fields required by SpeakPlay are present on every entry.
 * - Fully deterministic — no runtime randomisation.
 */

export const TOTAL_SPEAK_SHINE_LEVELS = 30;

// ─────────────────────────────────────────────────────────────────────────────
// Stage configuration
// ─────────────────────────────────────────────────────────────────────────────
export const SPEAK_SHINE_STAGE_CONFIG = [
  {
    stage: 1,
    title: 'Short & Familiar Words',
    subtitle: 'Say simple, everyday words into the microphone',
    icon: '🎤',
    levelRange: [1, 10],
    themePreview: '🎤 SUN, FISH, SHIP, BALL, TREE… familiar short words',
    description: 'Listen carefully, then say the word aloud — you can do it!',
  },
  {
    stage: 2,
    title: 'Longer Words',
    subtitle: 'Practise two-syllable and blend words',
    icon: '⭐',
    levelRange: [11, 20],
    themePreview: '⭐ RABBIT, TIGER, PENCIL, FLOWER… two-syllable words',
    description: 'Longer words this time. Take a breath and say each syllable clearly.',
  },
  {
    stage: 3,
    title: 'Big & Compound Words',
    subtitle: 'Speak multi-syllable and compound words',
    icon: '🏆',
    levelRange: [21, 30],
    themePreview: '🏆 RAINBOW, BIRTHDAY, BUTTERFLY, ELEPHANT… big words!',
    description: 'Great work reaching Stage 3! Say the big word slowly, one part at a time.',
  },
];

export const SPEAK_SHINE_STAGES = SPEAK_SHINE_STAGE_CONFIG.map((stg) => ({
  stage: stg.stage,
  title: stg.title,
  subtitle: stg.subtitle,
  icon: stg.icon,
  levelRange: stg.levelRange,
  themePreview: stg.themePreview,
  description: stg.description,
  badge:
    stg.stage === 1
      ? '🎤 Speaking Starter'
      : stg.stage === 2
      ? '⭐ Word Speaker'
      : '🏆 Speaking Champion',
}));

// ─────────────────────────────────────────────────────────────────────────────
// Milestones — awarded when a child completes the level shown in the key.
// ─────────────────────────────────────────────────────────────────────────────
export const SPEAK_SHINE_MILESTONES = {
  5:  { level: 5,  name: 'Speaking Starter Star',    icon: '⭐', reward: 'Bronze Microphone' },
  10: { level: 10, name: 'Stage 1 Clear!',            icon: '🏅', reward: 'Stage 1 Speaking Badge' },
  15: { level: 15, name: 'Word Speaker Star',         icon: '⭐', reward: 'Silver Microphone' },
  20: { level: 20, name: 'Stage 2 Champion!',         icon: '🏅', reward: 'Stage 2 Speaking Badge' },
  25: { level: 25, name: 'Big Word Speaker Star',     icon: '⭐', reward: 'Golden Microphone' },
  30: { level: 30, name: 'Grand Speaking Champion',   icon: '🏆', reward: 'Grand Speak & Shine Trophy' },
};

// ─────────────────────────────────────────────────────────────────────────────
// CURRICULUM
//
// Each entry shape:
//   id          — stable integer equal to `level`
//   level       — 1-based level number (1–30)
//   stage       — stage number (1, 2, or 3)
//   word        — uppercase target word the child must say
//   emoji       — visual picture prompt displayed during the round
//   prompt      — child-facing instruction string (may be displayed in UI)
//   phonicsHint — optional child-friendly phonics breakdown shown on hint
//
// Levels 1–10 preserve the original SPEAK_WORDS 1:1 (word + emoji).
// ─────────────────────────────────────────────────────────────────────────────
export const SPEAK_SHINE_CURRICULUM = [

  // ───────────────────────────────────────────────────────────────────────────
  // STAGE 1 (Levels 1–10): CVC & Familiar Short Words
  // Original SPEAK_WORDS preserved exactly.
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 1, level: 1, stage: 1,
    word: 'SUN',
    emoji: '☀️',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'S-U-N. Say "sss… un". The /s/ sound starts it!',
  },
  {
    id: 2, level: 2, stage: 1,
    word: 'FISH',
    emoji: '🐟',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'F-I-SH. Say "fff… ish". Listen for the /sh/ at the end!',
  },
  {
    id: 3, level: 3, stage: 1,
    word: 'SHIP',
    emoji: '🚢',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'SH-I-P. Start with /sh/ — like "shhhh". Then "ip".',
  },
  {
    id: 4, level: 4, stage: 1,
    word: 'BALL',
    emoji: '⚽',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'B-A-LL. Say "b… awl". The /b/ sound pops!',
  },
  {
    id: 5, level: 5, stage: 1,
    word: 'TREE',
    emoji: '🌳',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'TR-EE. Say "t… ree". The /r/ slides right after /t/!',
  },
  {
    id: 6, level: 6, stage: 1,
    word: 'BOOK',
    emoji: '📕',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'B-OO-K. Say "b… ook". The OO sound rhymes with "look".',
  },
  {
    id: 7, level: 7, stage: 1,
    word: 'APPLE',
    emoji: '🍎',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'AP-PLE. Two parts: "AP" then "ul". Say "AP-ul".',
  },
  {
    id: 8, level: 8, stage: 1,
    word: 'MOON',
    emoji: '🌙',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'M-OO-N. Say "m… oon". The OO sound rhymes with "soon".',
  },
  {
    id: 9, level: 9, stage: 1,
    word: 'STAR',
    emoji: '⭐',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'ST-AR. Say "st… ar". The /st/ blend starts it off!',
  },
  {
    id: 10, level: 10, stage: 1,
    word: 'SCHOOL',
    emoji: '🏫',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'SCH-OO-L. Say "skool". The tricky /sch/ sounds like /sk/!',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // STAGE 2 (Levels 11–20): Two-Syllable & Blend Words
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 11, level: 11, stage: 2,
    word: 'RABBIT',
    emoji: '🐰',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'RAB-BIT. Two parts: "RAB" and "bit". Say "RAB-bit".',
  },
  {
    id: 12, level: 12, stage: 2,
    word: 'TIGER',
    emoji: '🐯',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'TI-GER. Two parts: "TIE" and "ger". Say "TY-ger".',
  },
  {
    id: 13, level: 13, stage: 2,
    word: 'PENCIL',
    emoji: '✏️',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'PEN-CIL. Two parts: "PEN" and "sil". Say "PEN-sil".',
  },
  {
    id: 14, level: 14, stage: 2,
    word: 'FLOWER',
    emoji: '🌸',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'FL-OW-ER. Say "flaw-er". The /fl/ blend leads the way!',
  },
  {
    id: 15, level: 15, stage: 2,
    word: 'BUTTON',
    emoji: '🔘',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'BUT-TON. Two parts: "BUT" and "un". Say "BUT-un".',
  },
  {
    id: 16, level: 16, stage: 2,
    word: 'SPIDER',
    emoji: '🕷️',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'SPI-DER. Two parts: "SPY" and "der". Say "SPY-der".',
  },
  {
    id: 17, level: 17, stage: 2,
    word: 'GARDEN',
    emoji: '🌻',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'GAR-DEN. Two parts: "GAR" and "den". Say "GAR-den".',
  },
  {
    id: 18, level: 18, stage: 2,
    word: 'WINDOW',
    emoji: '🪟',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'WIN-DOW. Two parts: "WIN" and "doh". Say "WIN-doh".',
  },
  {
    id: 19, level: 19, stage: 2,
    word: 'BLANKET',
    emoji: '🛏️',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'BLAN-KET. Two parts: "BLAN" and "ket". Say "BLAN-kit".',
  },
  {
    id: 20, level: 20, stage: 2,
    word: 'YELLOW',
    emoji: '💛',
    prompt: 'Speak this word into the microphone!',
    phonicsHint: 'YEL-LOW. Two parts: "YEL" and "oh". Say "YEL-oh".',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // STAGE 3 (Levels 21–30): Multi-Syllable & Compound Words
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 21, level: 21, stage: 3,
    word: 'RAINBOW',
    emoji: '🌈',
    prompt: 'Say this big word clearly into the microphone!',
    phonicsHint: 'RAIN-BOW. Two parts: "RAIN" and "boh". Say "RAIN-boh".',
  },
  {
    id: 22, level: 22, stage: 3,
    word: 'BIRTHDAY',
    emoji: '🎂',
    prompt: 'Say this big word clearly into the microphone!',
    phonicsHint: 'BIRTH-DAY. Two parts: "BERTH" and "day". Say "BERTH-day".',
  },
  {
    id: 23, level: 23, stage: 3,
    word: 'BUTTERFLY',
    emoji: '🦋',
    prompt: 'Say this big word clearly into the microphone!',
    phonicsHint: 'BU-TTER-FLY. Three parts: "BUT", "er", "fly". Say "BUTer-fly".',
  },
  {
    id: 24, level: 24, stage: 3,
    word: 'ELEPHANT',
    emoji: '🐘',
    prompt: 'Say this big word clearly into the microphone!',
    phonicsHint: 'EL-E-PHANT. Three parts: "EL", "e", "fant". Say "EL-e-fant".',
  },
  {
    id: 25, level: 25, stage: 3,
    word: 'WATERFALL',
    emoji: '🌊',
    prompt: 'Say this big word clearly into the microphone!',
    phonicsHint: 'WA-TER-FALL. Three parts: "WAH", "ter", "fall". Say "WAH-ter-fall".',
  },
  {
    id: 26, level: 26, stage: 3,
    word: 'UMBRELLA',
    emoji: '☂️',
    prompt: 'Say this big word clearly into the microphone!',
    phonicsHint: 'UM-BREL-LA. Three parts: "UM", "brel", "ah". Say "um-BREL-ah".',
  },
  {
    id: 27, level: 27, stage: 3,
    word: 'DINOSAUR',
    emoji: '🦕',
    prompt: 'Say this big word clearly into the microphone!',
    phonicsHint: 'DI-NO-SAUR. Three parts: "DY", "no", "sor". Say "DY-no-sor".',
  },
  {
    id: 28, level: 28, stage: 3,
    word: 'CHOCOLATE',
    emoji: '🍫',
    prompt: 'Say this big word clearly into the microphone!',
    phonicsHint: 'CHOC-O-LATE. Three parts: "CHOK", "o", "lit". Say "CHOK-o-lit".',
  },
  {
    id: 29, level: 29, stage: 3,
    word: 'HELICOPTER',
    emoji: '🚁',
    prompt: 'Say this big word clearly into the microphone!',
    phonicsHint: 'HEL-I-COP-TER. Four parts. Say "HEL-ee-kop-ter". Take it slow!',
  },
  {
    id: 30, level: 30, stage: 3,
    word: 'ADVENTURE',
    emoji: '🗺️',
    prompt: 'Say this grand final word clearly into the microphone — you\'ve got this!',
    phonicsHint: 'AD-VEN-TURE. Three parts: "AD", "ven", "cher". Say "ad-VEN-cher".',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Validation (runs once at module load in development; silent in production)
// ─────────────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const ids = new Set();
  SPEAK_SHINE_CURRICULUM.forEach((entry, i) => {
    const n = i + 1;
    if (!entry.id || !entry.level || !entry.stage || !entry.word || !entry.emoji || !entry.prompt) {
      throw new Error(`[speakShineCurriculum] Level ${n} is missing a required field.`);
    }
    if (entry.level !== n) {
      throw new Error(`[speakShineCurriculum] Level ${n} has level=${entry.level} — must equal ${n}.`);
    }
    if (entry.id !== n) {
      throw new Error(`[speakShineCurriculum] Level ${n} has id=${entry.id} — must equal ${n}.`);
    }
    if (ids.has(entry.id)) {
      throw new Error(`[speakShineCurriculum] Duplicate id ${entry.id} at index ${i}.`);
    }
    ids.add(entry.id);
  });
  if (SPEAK_SHINE_CURRICULUM.length !== TOTAL_SPEAK_SHINE_LEVELS) {
    throw new Error(
      `[speakShineCurriculum] Expected ${TOTAL_SPEAK_SHINE_LEVELS} levels, got ${SPEAK_SHINE_CURRICULUM.length}.`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the curriculum entry for a 1-based level number, or null if not found.
 */
export function getSpeakShineLevel(level) {
  if (typeof level !== 'number' || level < 1 || level > TOTAL_SPEAK_SHINE_LEVELS) return null;
  return SPEAK_SHINE_CURRICULUM[level - 1] || null;
}

/**
 * Returns the curriculum entry for a 0-based index, or null if out of range.
 */
export function getSpeakShineLevelByIndex(index) {
  if (typeof index !== 'number' || index < 0 || index >= TOTAL_SPEAK_SHINE_LEVELS) return null;
  return SPEAK_SHINE_CURRICULUM[index] || null;
}

/**
 * Returns the stage configuration object (from SPEAK_SHINE_STAGE_CONFIG) for a
 * 1-based level number, or null if not found.
 */
export function getSpeakShineStageForLevel(level) {
  if (typeof level !== 'number' || level < 1) return null;
  return (
    SPEAK_SHINE_STAGE_CONFIG.find(
      (s) => level >= s.levelRange[0] && level <= s.levelRange[1]
    ) || null
  );
}

/**
 * Returns the stage badge string for a given 1-based level, or an empty string.
 */
export function getSpeakShineStageBadge(level) {
  const cfg = getSpeakShineStageForLevel(level);
  if (!cfg) return '';
  const stageObj = SPEAK_SHINE_STAGES.find((s) => s.stage === cfg.stage);
  return stageObj ? stageObj.badge : '';
}

/**
 * Returns the milestone object for a given 1-based level, or null.
 */
export function getSpeakShineMilestone(level) {
  return SPEAK_SHINE_MILESTONES[level] || null;
}

/**
 * Returns true when the given 1-based level is the first level of its stage.
 */
export function isSpeakShineStageBoundary(level) {
  return SPEAK_SHINE_STAGE_CONFIG.some((s) => s.levelRange[0] === level);
}

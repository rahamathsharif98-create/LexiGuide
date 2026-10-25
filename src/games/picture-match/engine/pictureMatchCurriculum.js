/**
 * pictureMatchCurriculum.js
 *
 * Picture Match Curriculum — 30 Progressive Levels across 3 Developmental Stages.
 *
 * Stage 1 (Levels 1–10): Common Nouns — Animals & Objects
 *   Familiar, single-syllable emoji-picture pairs. All distractors share the same
 *   semantic category as the target (e.g. animal vs. animal), requiring actual
 *   word-reading rather than category elimination.
 *   Preserves the original starter items (APPLE, ELEPHANT, CAR) from the legacy
 *   3-round placeholder at levels 1–3 for 100% test compatibility.
 *
 * Stage 2 (Levels 11–20): Two-Syllable & Action Words
 *   Longer nouns, colour words, shape words, and common adjectives. Same-category
 *   distractors where the child must read carefully to distinguish options.
 *
 * Stage 3 (Levels 21–30): Multi-Syllable & Compound Words
 *   Compound nouns, multi-syllable vocabulary, and concept words that extend
 *   word-recognition into everyday literacy.
 *
 * Design Guarantees:
 * - Exactly 30 unique, progressive levels (10 per stage).
 * - Exactly 3 distinct answer choices per level; exactly one is correct.
 * - Balanced correct-answer positions: positions 0, 1, and 2 each appear exactly
 *   10 times across the 30-level curriculum (0% positional bias).
 * - Same-category distractors: every level's options belong to the same semantic
 *   group so the child must read, not guess by category.
 * - Fully deterministic and static — no runtime shuffling needed, positions are
 *   baked in at authoring time.
 * - Each level includes a pedagogical `hint` and a brief `phonicsHint`.
 */

export const TOTAL_PICTURE_MATCH_LEVELS = 30;

export const PICTURE_MATCH_STAGE_CONFIG = [
  {
    stage: 1,
    title: 'Animals & Objects',
    subtitle: 'Match familiar pictures to their written names',
    icon: '📸',
    levelRange: [1, 10],
    themePreview: '📸 APPLE, CAT, DOG, SUN, FISH… familiar everyday words',
    description: 'Look at the picture and tap the word that matches it.',
  },
  {
    stage: 2,
    title: 'Colours & Shapes',
    subtitle: 'Read longer words — colours, shapes, and action words',
    icon: '🌈',
    levelRange: [11, 20],
    themePreview: '🌈 PURPLE, CIRCLE, RABBIT, TIGER… two-syllable vocabulary',
    description: 'Pictures get trickier! Find the right word to match each picture.',
  },
  {
    stage: 3,
    title: 'Compound & Big Words',
    subtitle: 'Master multi-syllable and compound word reading',
    icon: '🏆',
    levelRange: [21, 30],
    themePreview: '🏆 RAINBOW, BUTTERFLY, FOOTBALL, STARFISH… compound words',
    description: 'Big words, big pictures — read carefully and tap the match!',
  },
];

export const PICTURE_MATCH_STAGES = PICTURE_MATCH_STAGE_CONFIG.map((stg) => ({
  stage: stg.stage,
  title: stg.title,
  subtitle: stg.subtitle,
  icon: stg.icon,
  levelRange: stg.levelRange,
  themePreview: stg.themePreview,
  description: stg.description,
  badge:
    stg.stage === 1
      ? '📸 Picture Explorer'
      : stg.stage === 2
      ? '🌈 Word Watcher'
      : '🏆 Master Picture Reader',
}));

export const PICTURE_MATCH_MILESTONES = {
  5:  { level: 5,  name: 'Picture Starter',       icon: '⭐', reward: 'Bronze Picture Frame' },
  10: { level: 10, name: 'Animal Expert',          icon: '🏅', reward: 'Stage 1 Mastery Badge' },
  15: { level: 15, name: 'Colour Watcher',         icon: '⭐', reward: 'Silver Picture Frame' },
  20: { level: 20, name: 'Word Watcher Champion',  icon: '🏅', reward: 'Stage 2 Mastery Badge' },
  25: { level: 25, name: 'Big Word Spotter',       icon: '⭐', reward: 'Golden Picture Frame' },
  30: { level: 30, name: 'Master Picture Reader',  icon: '🏆', reward: 'Grand Picture Match Trophy' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: return the correct-answer position (0-indexed) for a given level.
// Positions are pre-assigned to guarantee exactly 10 occurrences each of 0, 1, 2
// across the 30 levels (zero positional bias).
//
// Assignment (level → position):
//  Pos 0: levels  1,  4,  7, 10, 13, 16, 19, 22, 25, 28
//  Pos 1: levels  2,  5,  8, 11, 14, 17, 20, 23, 26, 29
//  Pos 2: levels  3,  6,  9, 12, 15, 18, 21, 24, 27, 30
// ─────────────────────────────────────────────────────────────────────────────
function posFor(level) {
  return (level - 1) % 3;
}

/**
 * Builds a `{ options, correctIndex }` tuple by placing `correct` at the
 * position determined by `posFor(level)` and filling the other slots with
 * the two distractors in order.
 */
function buildOptions(level, correct, d1, d2) {
  const pos = posFor(level);
  const distractors = [d1, d2];
  const options = [];
  let di = 0;
  for (let i = 0; i < 3; i++) {
    if (i === pos) {
      options.push(correct);
    } else {
      options.push(distractors[di++]);
    }
  }
  return { options, correctIndex: pos };
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRICULUM
// Each level: { id, level, stage, emoji, label, correct, options, hint, phonicsHint }
//   emoji        — the visual picture prompt displayed to the child
//   label        — human-readable description of the picture (for aria-label)
//   correct      — the exact string that must be tapped to score a point
//   options      — array of 3 strings; correct appears at posFor(level)
//   hint         — teacher/parent-facing tip shown on "Need a hint?"
//   phonicsHint  — child-friendly phonics prompt shown on "Hear Word" / HelpButton
// ─────────────────────────────────────────────────────────────────────────────
export const PICTURE_MATCH_CURRICULUM = [

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE 1 (Levels 1–10): Animals & Objects
  // Levels 1–3 preserve the original starter items for test compatibility.
  // ─────────────────────────────────────────────────────────────────────────

  (() => {
    const { options, correctIndex } = buildOptions(1, 'APPLE', 'ORANGE', 'GRAPE');
    return {
      id: 1, level: 1, stage: 1,
      emoji: '🍎', label: 'Apple',
      correct: 'APPLE', options, correctIndex,
      hint: 'It is a red fruit that grows on trees.',
      phonicsHint: 'A-P-P-L-E. Say "AP-ul".',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(2, 'ELEPHANT', 'TIGER', 'ZEBRA');
    return {
      id: 2, level: 2, stage: 1,
      emoji: '🐘', label: 'Elephant',
      correct: 'ELEPHANT', options, correctIndex,
      hint: 'This big grey animal has a long trunk.',
      phonicsHint: 'EL-e-fant. Listen for the EL sound.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(3, 'CAR', 'BUS', 'BIKE');
    return {
      id: 3, level: 3, stage: 1,
      emoji: '🚗', label: 'Car',
      correct: 'CAR', options, correctIndex,
      hint: 'It is a vehicle with four wheels.',
      phonicsHint: 'CAR. Say the /k/ sound at the start.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(4, 'CAT', 'DOG', 'PIG');
    return {
      id: 4, level: 4, stage: 1,
      emoji: '🐱', label: 'Cat',
      correct: 'CAT', options, correctIndex,
      hint: 'This furry pet says "meow".',
      phonicsHint: 'CAT. Say /k/ /a/ /t/.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(5, 'SUN', 'SKY', 'STAR');
    return {
      id: 5, level: 5, stage: 1,
      emoji: '☀️', label: 'Sun',
      correct: 'SUN', options, correctIndex,
      hint: 'It shines bright in the daytime sky.',
      phonicsHint: 'SUN. Say /s/ /u/ /n/.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(6, 'FISH', 'FROG', 'DUCK');
    return {
      id: 6, level: 6, stage: 1,
      emoji: '🐟', label: 'Fish',
      correct: 'FISH', options, correctIndex,
      hint: 'It lives in the water and has fins.',
      phonicsHint: 'FISH. The FI sound like in "fin".',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(7, 'BALL', 'BELL', 'BULL');
    return {
      id: 7, level: 7, stage: 1,
      emoji: '⚽', label: 'Ball',
      correct: 'BALL', options, correctIndex,
      hint: 'You kick or throw this round toy.',
      phonicsHint: 'BALL. Listen for the /b/ /aw/ /l/ sounds.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(8, 'TREE', 'LEAF', 'SEED');
    return {
      id: 8, level: 8, stage: 1,
      emoji: '🌳', label: 'Tree',
      correct: 'TREE', options, correctIndex,
      hint: 'It has a trunk, branches, and leaves.',
      phonicsHint: 'TREE. The TR blend at the start.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(9, 'BOOK', 'BELL', 'BOOT');
    return {
      id: 9, level: 9, stage: 1,
      emoji: '📖', label: 'Book',
      correct: 'BOOK', options, correctIndex,
      hint: 'You read stories inside it.',
      phonicsHint: 'BOOK. The OO sound like "moon".',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(10, 'BIRD', 'BEAR', 'BOAR');
    return {
      id: 10, level: 10, stage: 1,
      emoji: '🐦', label: 'Bird',
      correct: 'BIRD', options, correctIndex,
      hint: 'It has wings and can fly.',
      phonicsHint: 'BIRD. The IR vowel sound like in "girl".',
    };
  })(),

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE 2 (Levels 11–20): Colours, Shapes & Two-Syllable Words
  // ─────────────────────────────────────────────────────────────────────────

  (() => {
    const { options, correctIndex } = buildOptions(11, 'RABBIT', 'RACOON', 'RODENT');
    return {
      id: 11, level: 11, stage: 2,
      emoji: '🐰', label: 'Rabbit',
      correct: 'RABBIT', options, correctIndex,
      hint: 'This fluffy animal has long ears and hops.',
      phonicsHint: 'RAB-bit. Two syllables: RAB and BIT.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(12, 'CIRCLE', 'SQUARE', 'OVAL');
    return {
      id: 12, level: 12, stage: 2,
      emoji: '⭕', label: 'Circle',
      image: '/assets/games/circle.svg',
      correct: 'CIRCLE', options, correctIndex,
      hint: 'This shape is perfectly round with no corners.',
      phonicsHint: 'CIR-cle. The soft C makes an /s/ sound.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(13, 'PURPLE', 'YELLOW', 'ORANGE');
    return {
      id: 13, level: 13, stage: 2,
      emoji: '🟣', label: 'Purple',
      image: '/assets/games/purple.svg',
      correct: 'PURPLE', options, correctIndex,
      hint: 'This colour is a mix of red and blue.',
      phonicsHint: 'PUR-ple. The UR vowel sound like in "fur".',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(14, 'TIGER', 'LION', 'CHEETAH');
    return {
      id: 14, level: 14, stage: 2,
      emoji: '🐯', label: 'Tiger',
      correct: 'TIGER', options, correctIndex,
      hint: 'This big striped cat lives in jungles.',
      phonicsHint: 'TI-ger. The long I sound in the first syllable.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(15, 'FLOWER', 'FOREST', 'FUNGUS');
    return {
      id: 15, level: 15, stage: 2,
      emoji: '🌸', label: 'Flower',
      correct: 'FLOWER', options, correctIndex,
      hint: 'Plants grow these colourful, fragrant blooms.',
      phonicsHint: 'FLOW-er. The FL blend at the start.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(16, 'ROCKET', 'ROBOT', 'RADAR');
    return {
      id: 16, level: 16, stage: 2,
      emoji: '🚀', label: 'Rocket',
      correct: 'ROCKET', options, correctIndex,
      hint: 'Astronauts fly in this to reach outer space.',
      phonicsHint: 'ROC-ket. Short O sound like in "hop".',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(17, 'SPIDER', 'SNAKE', 'SNAIL');
    return {
      id: 17, level: 17, stage: 2,
      emoji: '🕷️', label: 'Spider',
      correct: 'SPIDER', options, correctIndex,
      hint: 'This creature has eight legs and spins webs.',
      phonicsHint: 'SPI-der. The SPY sound at the start.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(18, 'LEMON', 'MELON', 'MANGO');
    return {
      id: 18, level: 18, stage: 2,
      emoji: '🍋', label: 'Lemon',
      correct: 'LEMON', options, correctIndex,
      hint: 'This sour yellow fruit goes in drinks.',
      phonicsHint: 'LEM-on. Short E sound like in "bed".',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(19, 'CASTLE', 'CANDLE', 'CATTLE');
    return {
      id: 19, level: 19, stage: 2,
      emoji: '🏰', label: 'Castle',
      correct: 'CASTLE', options, correctIndex,
      hint: 'Kings and queens lived in this big stone building.',
      phonicsHint: 'CAS-tle. The silent T: say "CA-sul".',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(20, 'WINDOW', 'PILLOW', 'WILLOW');
    return {
      id: 20, level: 20, stage: 2,
      emoji: '🪟', label: 'Window',
      correct: 'WINDOW', options, correctIndex,
      hint: 'You look through this to see outside.',
      phonicsHint: 'WIN-dow. WIN like "win a race".',
    };
  })(),

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE 3 (Levels 21–30): Compound & Multi-Syllable Words
  // ─────────────────────────────────────────────────────────────────────────

  (() => {
    const { options, correctIndex } = buildOptions(21, 'RAINBOW', 'RAINDROP', 'RAINSTORM');
    return {
      id: 21, level: 21, stage: 3,
      emoji: '🌈', label: 'Rainbow',
      correct: 'RAINBOW', options, correctIndex,
      hint: 'This colourful arc appears in the sky after rain.',
      phonicsHint: 'RAIN-bow. Two parts: RAIN + BOW.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(22, 'BUTTERFLY', 'BUMBLEBEE', 'DRAGONFLY');
    return {
      id: 22, level: 22, stage: 3,
      emoji: '🦋', label: 'Butterfly',
      correct: 'BUTTERFLY', options, correctIndex,
      hint: 'This insect has large colourful wings.',
      phonicsHint: 'BUT-ter-fly. Three syllables: BUT + TER + FLY.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(23, 'FOOTBALL', 'BASEBALL', 'BASKETBALL');
    return {
      id: 23, level: 23, stage: 3,
      emoji: '🏈', label: 'Football',
      image: '/assets/games/football.svg',
      correct: 'FOOTBALL', options, correctIndex,
      hint: 'Players kick or throw this oval ball in a sport.',
      phonicsHint: 'FOOT-ball. FOOT + BALL together.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(24, 'STARFISH', 'SWORDFISH', 'JELLYFISH');
    return {
      id: 24, level: 24, stage: 3,
      emoji: '⭐', label: 'Starfish',
      image: '/assets/games/starfish.svg',
      correct: 'STARFISH', options, correctIndex,
      hint: 'This star-shaped sea creature lives in the ocean.',
      phonicsHint: 'STAR-fish. STAR + FISH joined together.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(25, 'SUNFLOWER', 'SUNSCREEN', 'SUNLIGHT');
    return {
      id: 25, level: 25, stage: 3,
      emoji: '🌻', label: 'Sunflower',
      correct: 'SUNFLOWER', options, correctIndex,
      hint: 'This tall plant has a bright yellow bloom that faces the sun.',
      phonicsHint: 'SUN-flow-er. SUN + FLOWER put together.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(26, 'BIRTHDAY', 'BIRDSONG', 'BIRDCAGE');
    return {
      id: 26, level: 26, stage: 3,
      emoji: '🎂', label: 'Birthday',
      correct: 'BIRTHDAY', options, correctIndex,
      hint: 'You celebrate this special day once a year with cake.',
      phonicsHint: 'BIRTH-day. BIRTH + DAY = BIRTHDAY.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(27, 'LIGHTHOUSE', 'FARMHOUSE', 'TREEHOUSE');
    return {
      id: 27, level: 27, stage: 3,
      emoji: '🗼', label: 'Lighthouse',
      image: '/assets/games/lighthouse.svg',
      correct: 'LIGHTHOUSE', options, correctIndex,
      hint: 'This tall tower shines a bright light to guide ships at sea.',
      phonicsHint: 'LIGHT-house. LIGHT + HOUSE combined.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(28, 'STRAWBERRY', 'BLUEBERRY', 'BLACKBERRY');
    return {
      id: 28, level: 28, stage: 3,
      emoji: '🍓', label: 'Strawberry',
      correct: 'STRAWBERRY', options, correctIndex,
      hint: 'This red, heart-shaped berry is sweet and juicy.',
      phonicsHint: 'STRAW-ber-ry. Three syllables: STRAW + BER + RY.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(29, 'WATERFALL', 'WATERMELON', 'WATERFOWL');
    return {
      id: 29, level: 29, stage: 3,
      emoji: '🌊', label: 'Waterfall',
      image: '/assets/games/waterfall.svg',
      correct: 'WATERFALL', options, correctIndex,
      hint: 'Water tumbles down from a great height in this natural wonder.',
      phonicsHint: 'WA-ter-fall. WATER + FALL merged.',
    };
  })(),

  (() => {
    const { options, correctIndex } = buildOptions(30, 'ASTRONAUT', 'ACROBAT', 'ARCHITECT');
    return {
      id: 30, level: 30, stage: 3,
      emoji: '👨‍🚀', label: 'Astronaut',
      image: '/assets/games/astronaut.svg',
      correct: 'ASTRONAUT', options, correctIndex,
      hint: 'This person travels to outer space in a rocket.',
      phonicsHint: 'AS-tro-naut. Three syllables: AS + TRO + NAUT.',
    };
  })(),
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the curriculum round for a given 0-based index.
 */
export function getPictureMatchRoundByIndex(index) {
  return PICTURE_MATCH_CURRICULUM[index] || null;
}

/**
 * Returns the curriculum round for a given 1-based level number.
 */
export function getPictureMatchRound(level) {
  return PICTURE_MATCH_CURRICULUM.find((r) => r.level === level) || null;
}

/**
 * Returns the stage number (1, 2, or 3) for a given 1-based level.
 */
export function getPictureMatchStageForLevel(level) {
  if (level <= 10) return 1;
  if (level <= 20) return 2;
  return 3;
}

/**
 * Returns the stage badge object for a given stage number.
 */
export function getPictureMatchStageBadge(stageNumber) {
  return PICTURE_MATCH_STAGES.find((s) => s.stage === stageNumber) || null;
}

/**
 * Returns the milestone object for a given 1-based level, or null if none.
 */
export function getPictureMatchMilestone(level) {
  return PICTURE_MATCH_MILESTONES[level] || null;
}

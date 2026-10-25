/**
 * storyPuzzleCurriculum.js
 *
 * Story Puzzle Curriculum — 15 Progressive Levels across 3 Developmental Stages.
 *
 * Learning Objective:
 *   Narrative comprehension and chronological sequencing for early literacy.
 *   The child examines 3 story events and sequences them: first, next, last.
 *
 * Stage 1 (Levels 1–5): Nature & Daily Beginnings
 *   Clear, high-contrast beginnings, actions, and endings (apple growth, butterfly metamorphosis,
 *   planting flowers, morning wake-up routine, chick hatching).
 *   Preserves the original two starter puzzles from legacy gameContent.js.
 *
 * Stage 2 (Levels 6–10): Step-by-Step Activities
 *   Everyday processes with procedural reasoning (baking cookies, splashing in puddles with boots,
 *   painting a picture, washing hands, building a block tower).
 *
 * Stage 3 (Levels 11–15): Adventures & Narrative Journeys
 *   Multi-phase cause-and-effect journeys (making a picnic sandwich, flying a kite in the wind,
 *   bedtime reading, building a snowman, finding hidden island treasure).
 *
 * Design Guarantees:
 * - Exactly 15 unique, progressive levels (5 per stage).
 * - Stable, unique IDs for every level and card.
 * - Clear, unambiguous correct ordering (`correctOrder`).
 * - Authored items are deterministically arranged out of order to ensure thoughtful selection.
 * - Every level contains an engaging story title, prompt, and pedagogical hint.
 */

export const TOTAL_STORY_PUZZLE_LEVELS = 15;

export const STORY_PUZZLE_STAGE_CONFIG = [
  {
    stage: 1,
    title: 'Nature & Mornings',
    subtitle: 'Simple sequences with clear beginnings and endings',
    icon: '🌱',
    levelRange: [1, 5],
    themePreview: '🌱 Apple tree, butterfly, flower seeds, morning routine, baby chick',
    description: 'Look at the pictures and tap what happens first, next, and last.',
  },
  {
    stage: 2,
    title: 'Step-by-Step Activities',
    subtitle: 'Everyday routines, crafting, and fun activities',
    icon: '🎨',
    levelRange: [6, 10],
    themePreview: '🎨 Baking cookies, puddle splash, painting, hand washing, block castle',
    description: 'Think about the steps needed to make or do something fun!',
  },
  {
    stage: 3,
    title: 'Adventures & Journeys',
    subtitle: 'Cause-and-effect adventures and story journeys',
    icon: '🗺️',
    levelRange: [11, 15],
    themePreview: '🗺️ Picnic sandwich, flying kites, bedtime stories, snowman, treasure hunt',
    description: 'Follow the adventure from start to finish!',
  },
];

export const STORY_PUZZLE_STAGES = STORY_PUZZLE_STAGE_CONFIG.map((stg) => ({
  stage: stg.stage,
  title: stg.title,
  subtitle: stg.subtitle,
  icon: stg.icon,
  levelRange: stg.levelRange,
  themePreview: stg.themePreview,
  description: stg.description,
  badge:
    stg.stage === 1
      ? '🌱 Story Scout'
      : stg.stage === 2
      ? '🎨 Sequence Star'
      : '🏆 Master Storyteller',
}));

export const STORY_PUZZLE_MILESTONES = {
  5:  { level: 5,  name: 'Nature Explorer',    icon: '🌱', reward: 'Bronze Story Badge' },
  10: { level: 10, name: 'Sequence Star',      icon: '🎨', reward: 'Silver Story Badge' },
  15: { level: 15, name: 'Master Storyteller',  icon: '🏆', reward: 'Grand Story Puzzle Trophy' },
};

export const STORY_PUZZLE_CURRICULUM = [
  // ── Stage 1: Nature & Daily Beginnings (Levels 1–5) ────────────────────────
  {
    id: 'sp-1-apple',
    level: 1,
    stage: 1,
    title: 'How an Apple Grows',
    prompt: 'What comes first, next, and last?',
    hint: 'First comes the tiny sprout, then the tree grows big, and finally sweet apples grow!',
    items: [
      { id: 'sp-1-tree', emoji: '🌳', label: 'Big Tree', step: 2 },
      { id: 'sp-1-seed', emoji: '🌱', label: 'Seed Sprout', step: 1 },
      { id: 'sp-1-apple', emoji: '🍎', label: 'Ripe Apple', step: 3 },
    ],
    correctOrder: ['sp-1-seed', 'sp-1-tree', 'sp-1-apple'],
  },
  {
    id: 'sp-2-butterfly',
    level: 2,
    stage: 1,
    title: 'A Butterfly Adventure',
    prompt: 'Put the butterfly adventure in order!',
    hint: 'A caterpillar nibbles leaves, rests in a chrysalis, and emerges as a butterfly!',
    items: [
      { id: 'sp-2-butterfly', emoji: '🦋', label: 'Butterfly', step: 3 },
      { id: 'sp-2-caterpillar', emoji: '🐛', label: 'Caterpillar', step: 1 },
      { id: 'sp-2-chrysalis', emoji: '🪴', label: 'Chrysalis', step: 2 },
    ],
    correctOrder: ['sp-2-caterpillar', 'sp-2-chrysalis', 'sp-2-butterfly'],
  },
  {
    id: 'sp-3-sunflower',
    level: 3,
    stage: 1,
    title: 'Planting a Sunflower',
    prompt: 'How does a sunflower grow?',
    hint: 'Plant the seed first, water it with love, and watch the big flower bloom!',
    items: [
      { id: 'sp-3-water', emoji: '💧', label: 'Water It', step: 2 },
      { id: 'sp-3-sunflower', emoji: '🌻', label: 'Big Flower', step: 3 },
      { id: 'sp-3-seed', emoji: '🌱', label: 'Plant Seed', step: 1 },
    ],
    correctOrder: ['sp-3-seed', 'sp-3-water', 'sp-3-sunflower'],
  },
  {
    id: 'sp-4-morning-sun',
    level: 4,
    stage: 1,
    title: 'Waking Up in the Morning',
    prompt: 'What happens when you wake up?',
    hint: 'Wake up from bed first, brush your teeth, then enjoy a warm breakfast!',
    items: [
      { id: 'sp-4-breakfast', emoji: '🥣', label: 'Eat Breakfast', step: 3 },
      { id: 'sp-4-wake', emoji: '🛏️', label: 'Wake Up', step: 1 },
      { id: 'sp-4-brush', emoji: '🪥', label: 'Brush Teeth', step: 2 },
    ],
    correctOrder: ['sp-4-wake', 'sp-4-brush', 'sp-4-breakfast'],
  },
  {
    id: 'sp-5-egg-chick',
    level: 5,
    stage: 1,
    title: 'A Little Bird Hatches',
    prompt: 'How does the baby chick hatch?',
    hint: 'The egg rests in the nest, then cracks open, and a baby chick peeks out!',
    items: [
      { id: 'sp-5-chick', emoji: '🐥', label: 'Fluffy Chick', step: 3 },
      { id: 'sp-5-egg', emoji: '🥚', label: 'Egg in Nest', step: 1 },
      { id: 'sp-5-crack', emoji: '🐣', label: 'Egg Cracks', step: 2 },
    ],
    correctOrder: ['sp-5-egg', 'sp-5-crack', 'sp-5-chick'],
  },

  // ── Stage 2: Step-by-Step Activities (Levels 6–10) ─────────────────────────
  {
    id: 'sp-6-baking-cookies',
    level: 6,
    stage: 2,
    title: 'Baking Yummy Cookies',
    prompt: 'What are the steps to bake cookies?',
    hint: 'First stir the dough, then bake in the oven until cookies are ready to eat!',
    items: [
      { id: 'sp-6-bake', emoji: '🔥', label: 'Bake in Oven', step: 2 },
      { id: 'sp-6-cookie', emoji: '🍪', label: 'Eat Warm Cookie', step: 3 },
      { id: 'sp-6-mix', emoji: '🥣', label: 'Mix Dough', step: 1 },
    ],
    correctOrder: ['sp-6-mix', 'sp-6-bake', 'sp-6-cookie'],
  },
  {
    id: 'sp-7-rain-puddle',
    level: 7,
    stage: 2,
    title: 'The Rainy Day Splash',
    prompt: 'Get ready for puddle splashing!',
    hint: 'When rain starts falling, pull on your boots before jumping in the puddle!',
    items: [
      { id: 'sp-7-puddle', emoji: '💦', label: 'Splash in Puddle', step: 3 },
      { id: 'sp-7-rain', emoji: '🌧️', label: 'Rain Falls', step: 1 },
      { id: 'sp-7-boots', emoji: '👢', label: 'Put on Boots', step: 2 },
    ],
    correctOrder: ['sp-7-rain', 'sp-7-boots', 'sp-7-puddle'],
  },
  {
    id: 'sp-8-painting-art',
    level: 8,
    stage: 2,
    title: 'Painting a Masterpiece',
    prompt: 'How do you create a painting?',
    hint: 'Start with a fresh sheet of paper, paint your picture, then hang it up proudly!',
    items: [
      { id: 'sp-8-paint', emoji: '🎨', label: 'Paint Colors', step: 2 },
      { id: 'sp-8-hang', emoji: '🖼️', label: 'Hang Picture', step: 3 },
      { id: 'sp-8-paper', emoji: '📄', label: 'Blank Paper', step: 1 },
    ],
    correctOrder: ['sp-8-paper', 'sp-8-paint', 'sp-8-hang'],
  },
  {
    id: 'sp-9-washing-hands',
    level: 9,
    stage: 2,
    title: 'Clean & Sparkly Hands',
    prompt: 'How do you wash your hands clean?',
    hint: 'Rub soap all over your hands, rinse away bubbles, and dry with a towel!',
    items: [
      { id: 'sp-9-dry', emoji: '✨', label: 'Dry with Towel', step: 3 },
      { id: 'sp-9-soap', emoji: '🧼', label: 'Rub with Soap', step: 1 },
      { id: 'sp-9-rinse', emoji: '🚰', label: 'Rinse with Water', step: 2 },
    ],
    correctOrder: ['sp-9-soap', 'sp-9-rinse', 'sp-9-dry'],
  },
  {
    id: 'sp-10-building-blocks',
    level: 10,
    stage: 2,
    title: 'Building a Tall Tower',
    prompt: 'How do you build a castle of blocks?',
    hint: 'Gather blocks from the floor, stack them high, and admire your castle!',
    items: [
      { id: 'sp-10-castle', emoji: '🏰', label: 'Tall Castle', step: 3 },
      { id: 'sp-10-blocks', emoji: '🧱', label: 'Blocks on Floor', step: 1 },
      { id: 'sp-10-stack', emoji: '🏗️', label: 'Stacking Blocks', step: 2 },
    ],
    correctOrder: ['sp-10-blocks', 'sp-10-stack', 'sp-10-castle'],
  },

  // ── Stage 3: Adventures & Narrative Journeys (Levels 11–15) ───────────────
  {
    id: 'sp-11-making-sandwich',
    level: 11,
    stage: 3,
    title: 'Making a Picnic Sandwich',
    prompt: 'How do you make a picnic sandwich?',
    hint: 'Lay down your bread, pile on the yummy fillings, then take a big bite!',
    items: [
      { id: 'sp-11-sandwich', emoji: '🥪', label: 'Picnic Snack', step: 3 },
      { id: 'sp-11-bread', emoji: '🍞', label: 'Slice of Bread', step: 1 },
      { id: 'sp-11-fillings', emoji: '🧀', label: 'Add Fillings', step: 2 },
    ],
    correctOrder: ['sp-11-bread', 'sp-11-fillings', 'sp-11-sandwich'],
  },
  {
    id: 'sp-12-flying-kite',
    level: 12,
    stage: 3,
    title: 'Flying a High Kite',
    prompt: 'How does a kite reach the sky?',
    hint: 'Tie the string tight, run fast against the breeze, and watch the kite soar!',
    items: [
      { id: 'sp-12-sky', emoji: '☁️', label: 'Kite High in Sky', step: 3 },
      { id: 'sp-12-string', emoji: '🪁', label: 'Tie Kite String', step: 1 },
      { id: 'sp-12-run', emoji: '🏃', label: 'Run in Breeze', step: 2 },
    ],
    correctOrder: ['sp-12-string', 'sp-12-run', 'sp-12-sky'],
  },
  {
    id: 'sp-13-reading-bedtime',
    level: 13,
    stage: 3,
    title: 'Bedtime Story Time',
    prompt: 'What is the bedtime reading routine?',
    hint: 'Choose your favourite storybook, read until sleepy, and drift off into sweet dreams!',
    items: [
      { id: 'sp-13-read', emoji: '📖', label: 'Read Together', step: 2 },
      { id: 'sp-13-sleep', emoji: '🌙', label: 'Sweet Dreams', step: 3 },
      { id: 'sp-13-pick', emoji: '📚', label: 'Pick a Book', step: 1 },
    ],
    correctOrder: ['sp-13-pick', 'sp-13-read', 'sp-13-sleep'],
  },
  {
    id: 'sp-14-snowman',
    level: 14,
    stage: 3,
    title: 'Building a Snowy Friend',
    prompt: 'How do you build a snowman?',
    hint: 'Roll big balls of snow, stack them up, and finish with a carrot nose!',
    items: [
      { id: 'sp-14-carrot', emoji: '🥕', label: 'Add Carrot Nose', step: 3 },
      { id: 'sp-14-snowballs', emoji: '⚪', label: 'Roll Snowballs', step: 1 },
      { id: 'sp-14-stack', emoji: '⛄', label: 'Stack Snow Body', step: 2 },
    ],
    correctOrder: ['sp-14-snowballs', 'sp-14-stack', 'sp-14-carrot'],
  },
  {
    id: 'sp-15-treasure-hunt',
    level: 15,
    stage: 3,
    title: 'The Grand Island Treasure',
    prompt: 'How do you find the hidden treasure?',
    hint: 'Inspect the treasure map, follow the secret trail, and unlock the gleaming chest!',
    items: [
      { id: 'sp-15-treasure', emoji: '💎', label: 'Open Gold Chest', step: 3 },
      { id: 'sp-15-map', emoji: '🗺️', label: 'Find Secret Map', step: 1 },
      { id: 'sp-15-trail', emoji: '🧭', label: 'Follow Trail', step: 2 },
    ],
    correctOrder: ['sp-15-map', 'sp-15-trail', 'sp-15-treasure'],
  },
];

/**
 * Returns a specific Story Puzzle level by 1-based level number or 0-based index.
 */
export function getStoryPuzzleLevel(levelOrIndex) {
  if (typeof levelOrIndex !== 'number' || !Number.isInteger(levelOrIndex)) {
    return null;
  }
  // If in range [1, 15], treat as 1-based level
  if (levelOrIndex >= 1 && levelOrIndex <= TOTAL_STORY_PUZZLE_LEVELS) {
    return STORY_PUZZLE_CURRICULUM[levelOrIndex - 1] || null;
  }
  // If in range [0, 14], treat as 0-based index
  if (levelOrIndex >= 0 && levelOrIndex < TOTAL_STORY_PUZZLE_LEVELS) {
    return STORY_PUZZLE_CURRICULUM[levelOrIndex] || null;
  }
  return null;
}

/**
 * Returns all levels that belong to a specific stage (1, 2, or 3).
 */
export function getStoryPuzzleLevelsByStage(stageNumber) {
  const stage = Number(stageNumber);
  if (![1, 2, 3].includes(stage)) {
    return [];
  }
  return STORY_PUZZLE_CURRICULUM.filter((lvl) => lvl.stage === stage);
}

/**
 * Validates whether a submitted sequence of card IDs matches the expected correct order.
 * Accepts either a level object or level ID/number.
 */
export function validateStoryOrder(levelOrId, submittedOrder) {
  let level = null;
  if (typeof levelOrId === 'object' && levelOrId !== null) {
    level = levelOrId;
  } else if (typeof levelOrId === 'number') {
    level = getStoryPuzzleLevel(levelOrId);
  } else if (typeof levelOrId === 'string') {
    level = STORY_PUZZLE_CURRICULUM.find((lvl) => lvl.id === levelOrId) || null;
  }

  if (!level || !Array.isArray(level.correctOrder)) {
    return { isCorrect: false, expectedOrder: [], submittedOrder: submittedOrder || [] };
  }

  if (!Array.isArray(submittedOrder) || submittedOrder.length !== level.correctOrder.length) {
    return { isCorrect: false, expectedOrder: level.correctOrder, submittedOrder: submittedOrder || [] };
  }

  const isCorrect = level.correctOrder.every((expectedId, idx) => expectedId === submittedOrder[idx]);
  return {
    isCorrect,
    expectedOrder: level.correctOrder,
    submittedOrder,
  };
}

/**
 * Returns stage metadata configuration for a given stage number.
 */
export function getStoryPuzzleStageInfo(stageNumber) {
  const num = Number(stageNumber);
  return STORY_PUZZLE_STAGE_CONFIG.find((s) => s.stage === num) || null;
}

/**
 * Returns the stage badge info for a given stage number.
 */
export function getStoryPuzzleStageBadge(stageNumber) {
  const num = Number(stageNumber);
  const stage = STORY_PUZZLE_STAGES.find((s) => s.stage === num);
  if (!stage) {
    return { name: 'Story Master', icon: '🏆' };
  }
  return {
    name: stage.badge.replace(/^[^a-zA-Z0-9]+/, '').trim(),
    icon: stage.icon,
  };
}

/**
 * Returns milestone reward metadata for a given level (e.g. 5, 10, 15).
 */
export function getStoryPuzzleMilestone(levelNumber) {
  const lvl = Number(levelNumber);
  return STORY_PUZZLE_MILESTONES[lvl] || null;
}

/**
 * Shuffles cards for a Story Puzzle round while guaranteeing that the
 * resulting card sequence does NOT match round.correctOrder.
 *
 * Guarantees:
 * - Deterministic input preservation (all card objects and IDs preserved).
 * - Avoids accidentally showing the correct order by default.
 * - Non-mutating (returns a new array).
 */
export function shuffleStoryCards(round) {
  if (!round || !Array.isArray(round.items) || round.items.length <= 1) {
    return round?.items ? [...round.items] : [];
  }

  const items = [...round.items];
  const correctOrder = round.correctOrder || [];

  const isMatch = (arr) =>
    arr.length === correctOrder.length &&
    arr.every((it, idx) => it.id === correctOrder[idx]);

  // Try up to 10 random permutations to find one that differs from correctOrder
  for (let attempt = 0; attempt < 10; attempt++) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    if (!isMatch(items)) {
      return items;
    }
  }

  // Fallback: If random permutation matched correctOrder, rotate or swap to guarantee difference
  if (items.length >= 2) {
    const [first, ...rest] = items;
    const rotated = [...rest, first];
    if (!isMatch(rotated)) {
      return rotated;
    }
    const swapped = [...items];
    const n = swapped.length;
    [swapped[n - 1], swapped[n - 2]] = [swapped[n - 2], swapped[n - 1]];
    return swapped;
  }

  return items;
}

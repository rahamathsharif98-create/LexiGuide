/**
 * letterTraceCurriculum.js
 *
 * 25-Level, 5-Stage Early Literacy Curriculum for Letter Trace (Trace & Say).
 *
 * Stage 1: Foundational Uppercase Letters (Levels 1–5: C, S, B, M, T)
 * Stage 2: Additional Uppercase Letters (Levels 6–10: A, D, E, H, O)
 * Stage 3: Lowercase Letters (Levels 11–15: a, c, e, o, t)
 * Stage 4: More Challenging Letter Forms (Levels 16–20: K, R, W, g, s)
 * Stage 5: Mixed Review & Master Tracing (Levels 21–25: L, P, b, d, Z)
 */

export const LETTER_TRACE_STAGES = [
  {
    stage: 1,
    title: 'Foundational Uppercase Letters',
    description: 'Trace primary uppercase shapes with simple curves and straight lines.',
    levelRange: [1, 5],
    badge: '✏️',
    themeColor: '#10b981',
  },
  {
    stage: 2,
    title: 'Additional Uppercase Letters',
    description: 'Trace common uppercase letters with geometric angles and intersections.',
    levelRange: [6, 10],
    badge: '🔤',
    themeColor: '#3b82f6',
  },
  {
    stage: 3,
    title: 'Lowercase Letters',
    description: 'Master everyday lowercase letter forms with smaller curves and stems.',
    levelRange: [11, 15],
    badge: '🌱',
    themeColor: '#8b5cf6',
  },
  {
    stage: 4,
    title: 'Challenging Letter Forms',
    description: 'Practice multi-directional diagonals, zig-zags, and descender tails.',
    levelRange: [16, 20],
    badge: '🪁',
    themeColor: '#f59e0b',
  },
  {
    stage: 5,
    title: 'Mixed Review & Mastery',
    description: 'Demonstrate writing fluency across distinguished uppercase and lowercase shapes.',
    levelRange: [21, 25],
    badge: '🏆',
    themeColor: '#ec4899',
  },
];

export const TOTAL_LETTER_TRACE_LEVELS = 25;

/**
 * Returns the stage definition containing the specified 1-based level.
 */
export function getStageForLevel(level) {
  const safeLevel = Math.max(1, Math.min(TOTAL_LETTER_TRACE_LEVELS, Number(level) || 1));
  return (
    LETTER_TRACE_STAGES.find(
      (st) => safeLevel >= st.levelRange[0] && safeLevel <= st.levelRange[1]
    ) || LETTER_TRACE_STAGES[0]
  );
}

/**
 * Checks whether the given 1-based level is an intermediate stage boundary.
 */
export function isStageBoundary(level) {
  return level > 0 && level % 5 === 0 && level < TOTAL_LETTER_TRACE_LEVELS;
}

/**
 * The 25 English Letter Trace levels with canonical stroke trajectories,
 * child-friendly vocabulary, phonetic anchors, and audio prompts.
 */
export const ENGLISH_LETTER_TRACE_CURRICULUM = [
  // ─── STAGE 1: Foundational Uppercase Letters (Levels 1–5) ───
  {
    id: 'en-c',
    level: 1,
    stage: 'Foundational Uppercase Letters',
    letter: 'C',
    word: 'Cat',
    english: 'Cat',
    roman: 'cat',
    icon: '🐱',
    phoneme: '/k/',
    meaning: 'Playful fluffy cat',
    instructionAudioText: 'This is letter C. C is for Cat. Follow the curve with your finger.',
    canonicalStrokes: [
      [
        { x: 0.75, y: 0.32 },
        { x: 0.58, y: 0.22 },
        { x: 0.4, y: 0.25 },
        { x: 0.28, y: 0.38 },
        { x: 0.25, y: 0.52 },
        { x: 0.28, y: 0.68 },
        { x: 0.4, y: 0.78 },
        { x: 0.58, y: 0.8 },
        { x: 0.75, y: 0.7 },
      ],
    ],
  },
  {
    id: 'en-s',
    level: 2,
    stage: 'Foundational Uppercase Letters',
    letter: 'S',
    word: 'Sun',
    english: 'Sun',
    roman: 'sun',
    icon: '☀️',
    phoneme: '/s/',
    meaning: 'Warm smiling yellow sun',
    instructionAudioText: 'This is letter S. S is for Sun. Trace the winding snake curve.',
    canonicalStrokes: [
      [
        { x: 0.72, y: 0.32 },
        { x: 0.55, y: 0.22 },
        { x: 0.35, y: 0.28 },
        { x: 0.32, y: 0.42 },
        { x: 0.5, y: 0.5 },
        { x: 0.68, y: 0.58 },
        { x: 0.68, y: 0.72 },
        { x: 0.5, y: 0.8 },
        { x: 0.3, y: 0.74 },
      ],
    ],
  },
  {
    id: 'en-b',
    level: 3,
    stage: 'Foundational Uppercase Letters',
    letter: 'B',
    word: 'Book',
    english: 'Book',
    roman: 'book',
    icon: '📖',
    phoneme: '/b/',
    meaning: 'Wonderful picture book to read',
    instructionAudioText: 'This is letter B. B is for Book. Draw the straight stem, then two round bumps.',
    canonicalStrokes: [
      [
        { x: 0.3, y: 0.22 },
        { x: 0.3, y: 0.8 },
      ],
      [
        { x: 0.3, y: 0.22 },
        { x: 0.55, y: 0.22 },
        { x: 0.68, y: 0.34 },
        { x: 0.55, y: 0.5 },
        { x: 0.3, y: 0.5 },
      ],
      [
        { x: 0.3, y: 0.5 },
        { x: 0.58, y: 0.5 },
        { x: 0.72, y: 0.64 },
        { x: 0.58, y: 0.8 },
        { x: 0.3, y: 0.8 },
      ],
    ],
  },
  {
    id: 'en-m',
    level: 4,
    stage: 'Foundational Uppercase Letters',
    letter: 'M',
    word: 'Moon',
    english: 'Moon',
    roman: 'moon',
    icon: '🌙',
    phoneme: '/m/',
    meaning: 'Silver glowing moon in the sky',
    instructionAudioText: 'This is letter M. M is for Moon. Trace the mountain peaks!',
    canonicalStrokes: [
      [
        { x: 0.25, y: 0.8 },
        { x: 0.25, y: 0.25 },
        { x: 0.5, y: 0.6 },
        { x: 0.75, y: 0.25 },
        { x: 0.75, y: 0.8 },
      ],
    ],
  },
  {
    id: 'en-t',
    level: 5,
    stage: 'Foundational Uppercase Letters',
    letter: 'T',
    word: 'Tree',
    english: 'Tree',
    roman: 'tree',
    icon: '🌳',
    phoneme: '/t/',
    meaning: 'Tall green leafy tree',
    instructionAudioText: 'This is letter T. T is for Tree. Draw the top branch, then the trunk.',
    canonicalStrokes: [
      [
        { x: 0.22, y: 0.24 },
        { x: 0.78, y: 0.24 },
      ],
      [
        { x: 0.5, y: 0.24 },
        { x: 0.5, y: 0.8 },
      ],
    ],
  },

  // ─── STAGE 2: Additional Uppercase Letters (Levels 6–10) ───
  {
    id: 'en-a',
    level: 6,
    stage: 'Additional Uppercase Letters',
    letter: 'A',
    word: 'Apple',
    english: 'Apple',
    roman: 'apple',
    icon: '🍎',
    phoneme: '/æ/',
    meaning: 'Crisp red juicy apple',
    instructionAudioText: 'This is letter A. A is for Apple. Draw two tall leaning lines and a bridge.',
    canonicalStrokes: [
      [
        { x: 0.5, y: 0.22 },
        { x: 0.25, y: 0.8 },
      ],
      [
        { x: 0.5, y: 0.22 },
        { x: 0.75, y: 0.8 },
      ],
      [
        { x: 0.35, y: 0.56 },
        { x: 0.65, y: 0.56 },
      ],
    ],
  },
  {
    id: 'en-d',
    level: 7,
    stage: 'Additional Uppercase Letters',
    letter: 'D',
    word: 'Dog',
    english: 'Dog',
    roman: 'dog',
    icon: '🐶',
    phoneme: '/d/',
    meaning: 'Friendly playful puppy',
    instructionAudioText: 'This is letter D. D is for Dog. Draw a straight stem, then a big round tummy.',
    canonicalStrokes: [
      [
        { x: 0.3, y: 0.22 },
        { x: 0.3, y: 0.8 },
      ],
      [
        { x: 0.3, y: 0.22 },
        { x: 0.55, y: 0.22 },
        { x: 0.72, y: 0.36 },
        { x: 0.74, y: 0.51 },
        { x: 0.72, y: 0.66 },
        { x: 0.55, y: 0.8 },
        { x: 0.3, y: 0.8 },
      ],
    ],
  },
  {
    id: 'en-e',
    level: 8,
    stage: 'Additional Uppercase Letters',
    letter: 'E',
    word: 'Elephant',
    english: 'Elephant',
    roman: 'elephant',
    icon: '🐘',
    phoneme: '/e/',
    meaning: 'Gentle giant with a long trunk',
    instructionAudioText: 'This is letter E. E is for Elephant. Draw a tall stem and three reaching arms.',
    canonicalStrokes: [
      [
        { x: 0.3, y: 0.22 },
        { x: 0.3, y: 0.8 },
      ],
      [
        { x: 0.3, y: 0.22 },
        { x: 0.72, y: 0.22 },
      ],
      [
        { x: 0.3, y: 0.51 },
        { x: 0.62, y: 0.51 },
      ],
      [
        { x: 0.3, y: 0.8 },
        { x: 0.72, y: 0.8 },
      ],
    ],
  },
  {
    id: 'en-h',
    level: 9,
    stage: 'Additional Uppercase Letters',
    letter: 'H',
    word: 'House',
    english: 'House',
    roman: 'house',
    icon: '🏠',
    phoneme: '/h/',
    meaning: 'Cozy home with a roof and door',
    instructionAudioText: 'This is letter H. H is for House. Draw two tall pillars joined by a bridge.',
    canonicalStrokes: [
      [
        { x: 0.3, y: 0.22 },
        { x: 0.3, y: 0.8 },
      ],
      [
        { x: 0.7, y: 0.22 },
        { x: 0.7, y: 0.8 },
      ],
      [
        { x: 0.3, y: 0.51 },
        { x: 0.7, y: 0.51 },
      ],
    ],
  },
  {
    id: 'en-o',
    level: 10,
    stage: 'Additional Uppercase Letters',
    letter: 'O',
    word: 'Owl',
    english: 'Owl',
    roman: 'owl',
    icon: '🦉',
    phoneme: '/ɒ/',
    meaning: 'Wise feathered bird of the night',
    instructionAudioText: 'This is letter O. O is for Owl. Trace a round circle all the way around.',
    canonicalStrokes: [
      [
        { x: 0.5, y: 0.22 },
        { x: 0.32, y: 0.28 },
        { x: 0.24, y: 0.44 },
        { x: 0.24, y: 0.58 },
        { x: 0.32, y: 0.74 },
        { x: 0.5, y: 0.8 },
        { x: 0.68, y: 0.74 },
        { x: 0.76, y: 0.58 },
        { x: 0.76, y: 0.44 },
        { x: 0.68, y: 0.28 },
        { x: 0.5, y: 0.22 },
      ],
    ],
  },

  // ─── STAGE 3: Lowercase Letters (Levels 11–15) ───
  {
    id: 'en-lower-a',
    level: 11,
    stage: 'Lowercase Letters',
    letter: 'a',
    word: 'ant',
    english: 'Ant',
    roman: 'ant',
    icon: '🐜',
    phoneme: '/æ/',
    meaning: 'Busy little worker ant',
    instructionAudioText: 'This is lowercase a. a is for ant. Draw a round circle, then a straight down-stem.',
    canonicalStrokes: [
      [
        { x: 0.58, y: 0.48 },
        { x: 0.46, y: 0.42 },
        { x: 0.32, y: 0.5 },
        { x: 0.28, y: 0.62 },
        { x: 0.34, y: 0.74 },
        { x: 0.48, y: 0.78 },
        { x: 0.58, y: 0.74 },
      ],
      [
        { x: 0.66, y: 0.42 },
        { x: 0.66, y: 0.8 },
      ],
    ],
  },
  {
    id: 'en-lower-c',
    level: 12,
    stage: 'Lowercase Letters',
    letter: 'c',
    word: 'cup',
    english: 'Cup',
    roman: 'cup',
    icon: '☕',
    phoneme: '/k/',
    meaning: 'Warm mug for water or milk',
    instructionAudioText: 'This is lowercase c. c is for cup. Draw a gentle small curve.',
    canonicalStrokes: [
      [
        { x: 0.68, y: 0.48 },
        { x: 0.54, y: 0.42 },
        { x: 0.38, y: 0.48 },
        { x: 0.34, y: 0.62 },
        { x: 0.4, y: 0.74 },
        { x: 0.56, y: 0.78 },
        { x: 0.68, y: 0.72 },
      ],
    ],
  },
  {
    id: 'en-lower-e',
    level: 13,
    stage: 'Lowercase Letters',
    letter: 'e',
    word: 'egg',
    english: 'Egg',
    roman: 'egg',
    icon: '🥚',
    phoneme: '/e/',
    meaning: 'Smooth little nest egg',
    instructionAudioText: 'This is lowercase e. e is for egg. Draw a horizontal bar, then curve up and around.',
    canonicalStrokes: [
      [
        { x: 0.34, y: 0.6 },
        { x: 0.66, y: 0.6 },
        { x: 0.64, y: 0.48 },
        { x: 0.52, y: 0.42 },
        { x: 0.38, y: 0.48 },
        { x: 0.34, y: 0.62 },
        { x: 0.4, y: 0.74 },
        { x: 0.54, y: 0.78 },
        { x: 0.66, y: 0.72 },
      ],
    ],
  },
  {
    id: 'en-lower-o',
    level: 14,
    stage: 'Lowercase Letters',
    letter: 'o',
    word: 'orange',
    english: 'Orange',
    roman: 'orange',
    icon: '🍊',
    phoneme: '/ɒ/',
    meaning: 'Sweet juicy citrus fruit',
    instructionAudioText: 'This is lowercase o. o is for orange. Trace a tidy little circle.',
    canonicalStrokes: [
      [
        { x: 0.5, y: 0.44 },
        { x: 0.36, y: 0.48 },
        { x: 0.32, y: 0.62 },
        { x: 0.38, y: 0.74 },
        { x: 0.5, y: 0.78 },
        { x: 0.62, y: 0.74 },
        { x: 0.68, y: 0.62 },
        { x: 0.64, y: 0.48 },
        { x: 0.5, y: 0.44 },
      ],
    ],
  },
  {
    id: 'en-lower-t',
    level: 15,
    stage: 'Lowercase Letters',
    letter: 't',
    word: 'tiger',
    english: 'Tiger',
    roman: 'tiger',
    icon: '🐯',
    phoneme: '/t/',
    meaning: 'Brave striped jungle tiger',
    instructionAudioText: 'This is lowercase t. t is for tiger. Draw a tall stem with a little foot, then cross it.',
    canonicalStrokes: [
      [
        { x: 0.5, y: 0.24 },
        { x: 0.5, y: 0.72 },
        { x: 0.56, y: 0.78 },
        { x: 0.66, y: 0.76 },
      ],
      [
        { x: 0.36, y: 0.44 },
        { x: 0.64, y: 0.44 },
      ],
    ],
  },

  // ─── STAGE 4: Challenging Letter Forms (Levels 16–20) ───
  {
    id: 'en-k',
    level: 16,
    stage: 'Challenging Letter Forms',
    letter: 'K',
    word: 'Kite',
    english: 'Kite',
    roman: 'kite',
    icon: '🪁',
    phoneme: '/k/',
    meaning: 'Colorful diamond flying in the wind',
    instructionAudioText: 'This is letter K. K is for Kite. Draw a tall stem, then two kicking legs.',
    canonicalStrokes: [
      [
        { x: 0.3, y: 0.22 },
        { x: 0.3, y: 0.8 },
      ],
      [
        { x: 0.68, y: 0.26 },
        { x: 0.32, y: 0.52 },
      ],
      [
        { x: 0.36, y: 0.48 },
        { x: 0.7, y: 0.8 },
      ],
    ],
  },
  {
    id: 'en-r',
    level: 17,
    stage: 'Challenging Letter Forms',
    letter: 'R',
    word: 'Rainbow',
    english: 'Rainbow',
    roman: 'rainbow',
    icon: '🌈',
    phoneme: '/r/',
    meaning: 'Bright arc of colors in the sky',
    instructionAudioText: 'This is letter R. R is for Rainbow. Draw a straight stem, a round bump, and a slide.',
    canonicalStrokes: [
      [
        { x: 0.3, y: 0.22 },
        { x: 0.3, y: 0.8 },
      ],
      [
        { x: 0.3, y: 0.22 },
        { x: 0.56, y: 0.22 },
        { x: 0.68, y: 0.34 },
        { x: 0.56, y: 0.48 },
        { x: 0.3, y: 0.48 },
      ],
      [
        { x: 0.48, y: 0.48 },
        { x: 0.7, y: 0.8 },
      ],
    ],
  },
  {
    id: 'en-w',
    level: 18,
    stage: 'Challenging Letter Forms',
    letter: 'W',
    word: 'Watermelon',
    english: 'Watermelon',
    roman: 'watermelon',
    icon: '🍉',
    phoneme: '/w/',
    meaning: 'Cool refreshing summer fruit',
    instructionAudioText: 'This is letter W. W is for Watermelon. Trace four diagonal mountain slopes.',
    canonicalStrokes: [
      [
        { x: 0.22, y: 0.26 },
        { x: 0.36, y: 0.8 },
        { x: 0.5, y: 0.44 },
        { x: 0.64, y: 0.8 },
        { x: 0.78, y: 0.26 },
      ],
    ],
  },
  {
    id: 'en-lower-g',
    level: 19,
    stage: 'Challenging Letter Forms',
    letter: 'g',
    word: 'grapes',
    english: 'Grapes',
    roman: 'grapes',
    icon: '🍇',
    phoneme: '/g/',
    meaning: 'Bunch of sweet purple grapes',
    instructionAudioText: 'This is lowercase g. g is for grapes. Draw a round circle and a deep tail hook.',
    canonicalStrokes: [
      [
        { x: 0.62, y: 0.44 },
        { x: 0.48, y: 0.38 },
        { x: 0.36, y: 0.44 },
        { x: 0.34, y: 0.56 },
        { x: 0.4, y: 0.66 },
        { x: 0.52, y: 0.68 },
        { x: 0.64, y: 0.62 },
      ],
      [
        { x: 0.64, y: 0.4 },
        { x: 0.64, y: 0.8 },
        { x: 0.56, y: 0.88 },
        { x: 0.4, y: 0.86 },
      ],
    ],
  },
  {
    id: 'en-lower-s',
    level: 20,
    stage: 'Challenging Letter Forms',
    letter: 's',
    word: 'star',
    english: 'Star',
    roman: 'star',
    icon: '⭐',
    phoneme: '/s/',
    meaning: 'Twinkling little evening star',
    instructionAudioText: 'This is lowercase s. s is for star. Trace the neat winding curve.',
    canonicalStrokes: [
      [
        { x: 0.64, y: 0.48 },
        { x: 0.52, y: 0.42 },
        { x: 0.38, y: 0.46 },
        { x: 0.36, y: 0.56 },
        { x: 0.5, y: 0.62 },
        { x: 0.64, y: 0.68 },
        { x: 0.62, y: 0.76 },
        { x: 0.5, y: 0.8 },
        { x: 0.36, y: 0.76 },
      ],
    ],
  },

  // ─── STAGE 5: Mixed Review & Mastery (Levels 21–25) ───
  {
    id: 'en-l',
    level: 21,
    stage: 'Mixed Review & Mastery',
    letter: 'L',
    word: 'Lion',
    english: 'Lion',
    roman: 'lion',
    icon: '🦁',
    phoneme: '/l/',
    meaning: 'Proud king of the savanna',
    instructionAudioText: 'This is letter L. L is for Lion. Draw a tall stem down and a flat foot across.',
    canonicalStrokes: [
      [
        { x: 0.32, y: 0.22 },
        { x: 0.32, y: 0.8 },
        { x: 0.72, y: 0.8 },
      ],
    ],
  },
  {
    id: 'en-p',
    level: 22,
    stage: 'Mixed Review & Mastery',
    letter: 'P',
    word: 'Penguin',
    english: 'Penguin',
    roman: 'penguin',
    icon: '🐧',
    phoneme: '/p/',
    meaning: 'Cheerful waddling snowy bird',
    instructionAudioText: 'This is letter P. P is for Penguin. Draw a straight stem, then a round upper bump.',
    canonicalStrokes: [
      [
        { x: 0.3, y: 0.22 },
        { x: 0.3, y: 0.8 },
      ],
      [
        { x: 0.3, y: 0.22 },
        { x: 0.58, y: 0.22 },
        { x: 0.72, y: 0.35 },
        { x: 0.58, y: 0.5 },
        { x: 0.3, y: 0.5 },
      ],
    ],
  },
  {
    id: 'en-lower-b',
    level: 23,
    stage: 'Mixed Review & Mastery',
    letter: 'b',
    word: 'bird',
    english: 'Bird',
    roman: 'bird',
    icon: '🐦',
    phoneme: '/b/',
    meaning: 'Chirping songbird on a tree branch',
    instructionAudioText: 'This is lowercase b. b is for bird. Draw a tall stem down, then a round tummy on the right.',
    canonicalStrokes: [
      [
        { x: 0.34, y: 0.22 },
        { x: 0.34, y: 0.8 },
      ],
      [
        { x: 0.34, y: 0.52 },
        { x: 0.5, y: 0.44 },
        { x: 0.66, y: 0.52 },
        { x: 0.68, y: 0.66 },
        { x: 0.58, y: 0.78 },
        { x: 0.34, y: 0.78 },
      ],
    ],
  },
  {
    id: 'en-lower-d',
    level: 24,
    stage: 'Mixed Review & Mastery',
    letter: 'd',
    word: 'duck',
    english: 'Duck',
    roman: 'duck',
    icon: '🦆',
    phoneme: '/d/',
    meaning: 'Friendly quacking pond swimmer',
    instructionAudioText: 'This is lowercase d. d is for duck. Draw a round tummy on the left, then a tall stem on the right.',
    canonicalStrokes: [
      [
        { x: 0.64, y: 0.52 },
        { x: 0.48, y: 0.44 },
        { x: 0.32, y: 0.52 },
        { x: 0.3, y: 0.66 },
        { x: 0.4, y: 0.78 },
        { x: 0.64, y: 0.78 },
      ],
      [
        { x: 0.64, y: 0.22 },
        { x: 0.64, y: 0.8 },
      ],
    ],
  },
  {
    id: 'en-z',
    level: 25,
    stage: 'Mixed Review & Mastery',
    letter: 'Z',
    word: 'Zebra',
    english: 'Zebra',
    roman: 'zebra',
    icon: '🦓',
    phoneme: '/z/',
    meaning: 'Striped galloping wild horse',
    instructionAudioText: 'This is letter Z. Z is for Zebra. Trace across, slant down, and zip across!',
    canonicalStrokes: [
      [
        { x: 0.26, y: 0.26 },
        { x: 0.74, y: 0.26 },
        { x: 0.28, y: 0.78 },
        { x: 0.76, y: 0.78 },
      ],
    ],
  },
];

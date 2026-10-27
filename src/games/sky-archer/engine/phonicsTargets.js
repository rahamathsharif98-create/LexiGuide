/**
 * Sky Island Word Archer (3D Phonics Adventure) Curriculum
 *
 * 25 progressive phonics levels organized into 5 developmental stations (5 levels each).
 * Designed for early childhood phonics mastery, advancing from foundational consonant digraphs
 * up to advanced diphthongs, silent consonants, and trigraphs.
 */

export const TOTAL_SKY_ARCHER_ROUNDS = 25;
export const TOTAL_SKY_ARCHER_STATIONS = 5;
export const ROUNDS_PER_STATION = 5;

export const SKY_ARCHER_STATIONS = [
  {
    station: 1,
    title: 'Station 1: Simple Early Phonics Sounds',
    shortTitle: 'Early Phonics',
    roundRange: [1, 5],
    badge: '🌱',
    themeColor: '#38bdf8',
    description: 'Master foundational consonant digraphs like SH, CH, and TH!',
  },
  {
    station: 2,
    title: 'Station 2: Common Consonant Blends',
    shortTitle: 'Consonant Blends',
    roundRange: [6, 10],
    badge: '⭐',
    themeColor: '#34d399',
    description: 'Aim for fast consonant blends like ST, BL, and TR!',
  },
  {
    station: 3,
    title: 'Station 3: Digraphs & Vowel Patterns',
    shortTitle: 'Vowel Patterns',
    roundRange: [11, 15],
    badge: '🌈',
    themeColor: '#fbbf24',
    description: 'Pop long vowel teams and r-controlled vowels like EE, OO, and AI!',
  },
  {
    station: 4,
    title: 'Station 4: Complex Sound Combinations',
    shortTitle: 'Complex Sounds',
    roundRange: [16, 20],
    badge: '⚡',
    themeColor: '#f97316',
    description: 'Conquer triple blends, silent consonants, and diphthongs!',
  },
  {
    station: 5,
    title: 'Station 5: Mixed Review & Advanced Phonics',
    shortTitle: 'Mastery Review',
    roundRange: [21, 25],
    badge: '👑',
    themeColor: '#a855f7',
    description: 'The ultimate archer challenge! Master advanced trigraphs and r-controlled vowels!',
  },
];

export const PHONICS_TARGETS_25 = [
  // ───────────────────────────────────────────────────────────────────────────
  // Station 1: Simple Early Phonics Sounds (Levels 1–5)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'digraph-sh',
    level: 1,
    station: 1,
    stationTitle: 'Simple Early Phonics Sounds',
    sound: '/sh/',
    correct: 'SH',
    options: ['SH', 'CH', 'TH', 'WH'],
    prompt: 'Pop the balloon that makes the /sh/ sound!',
    wordHint: 'Like in Ship or Shell!',
    emoji: '🚢',
    speechText: 'Find the sh sound! Like in ship!',
  },
  {
    id: 'digraph-ch',
    level: 2,
    station: 1,
    stationTitle: 'Simple Early Phonics Sounds',
    sound: '/ch/',
    correct: 'CH',
    options: ['CH', 'SH', 'PH', 'TH'],
    prompt: 'Pop the balloon that makes the /ch/ sound!',
    wordHint: 'Like in Cheese or Chair!',
    emoji: '🧀',
    speechText: 'Find the ch sound! Like in cheese!',
  },
  {
    id: 'digraph-th',
    level: 3,
    station: 1,
    stationTitle: 'Simple Early Phonics Sounds',
    sound: '/th/',
    correct: 'TH',
    options: ['TH', 'WH', 'SH', 'CH'],
    prompt: 'Pop the balloon that makes the /th/ sound!',
    wordHint: 'Like in Thumb or Thunder!',
    emoji: '👍',
    speechText: 'Find the th sound! Like in thumb!',
  },
  {
    id: 'digraph-wh',
    level: 4,
    station: 1,
    stationTitle: 'Simple Early Phonics Sounds',
    sound: '/wh/',
    correct: 'WH',
    options: ['WH', 'TH', 'CH', 'PH'],
    prompt: 'Pop the balloon that makes the /wh/ sound!',
    wordHint: 'Like in Whale or Wheel!',
    emoji: '🐳',
    speechText: 'Find the wh sound! Like in whale!',
  },
  {
    id: 'digraph-ck',
    level: 5,
    station: 1,
    stationTitle: 'Simple Early Phonics Sounds',
    sound: '/ck/',
    correct: 'CK',
    options: ['CK', 'CH', 'SK', 'LK'],
    prompt: 'Pop the balloon that makes the /ck/ sound!',
    wordHint: 'Like in Duck or Clock!',
    emoji: '🦆',
    speechText: 'Find the ck sound! Like in duck!',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Station 2: Common Consonant Blends (Levels 6–10)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'blend-st',
    level: 6,
    station: 2,
    stationTitle: 'Common Consonant Blends',
    sound: '/st/',
    correct: 'ST',
    options: ['ST', 'SP', 'SK', 'SL'],
    prompt: 'Pop the balloon with the /st/ sound!',
    wordHint: 'Like in Star or Stone!',
    emoji: '⭐',
    speechText: 'Find the st sound! Like in star!',
  },
  {
    id: 'blend-bl',
    level: 7,
    station: 2,
    stationTitle: 'Common Consonant Blends',
    sound: '/bl/',
    correct: 'BL',
    options: ['BL', 'CL', 'FL', 'GL'],
    prompt: 'Pop the balloon with the /bl/ sound!',
    wordHint: 'Like in Blue or Blast!',
    emoji: '💙',
    speechText: 'Find the bl sound! Like in blue!',
  },
  {
    id: 'blend-tr',
    level: 8,
    station: 2,
    stationTitle: 'Common Consonant Blends',
    sound: '/tr/',
    correct: 'TR',
    options: ['TR', 'DR', 'BR', 'GR'],
    prompt: 'Pop the balloon with the /tr/ sound!',
    wordHint: 'Like in Tree or Train!',
    emoji: '🚂',
    speechText: 'Find the tr sound! Like in train!',
  },
  {
    id: 'blend-fl',
    level: 9,
    station: 2,
    stationTitle: 'Common Consonant Blends',
    sound: '/fl/',
    correct: 'FL',
    options: ['FL', 'PL', 'SL', 'BL'],
    prompt: 'Pop the balloon with the /fl/ sound!',
    wordHint: 'Like in Flower or Fly!',
    emoji: '🌸',
    speechText: 'Find the fl sound! Like in flower!',
  },
  {
    id: 'blend-gr',
    level: 10,
    station: 2,
    stationTitle: 'Common Consonant Blends',
    sound: '/gr/',
    correct: 'GR',
    options: ['GR', 'CR', 'BR', 'TR'],
    prompt: 'Pop the balloon with the /gr/ sound!',
    wordHint: 'Like in Grape or Green!',
    emoji: '🍇',
    speechText: 'Find the gr sound! Like in grape!',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Station 3: Digraphs & Vowel Patterns (Levels 11–15)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'vowel-ee',
    level: 11,
    station: 3,
    stationTitle: 'Digraphs & Vowel Patterns',
    sound: '/ee/',
    correct: 'EE',
    options: ['EE', 'OO', 'AI', 'OA'],
    prompt: 'Pop the balloon with the long /ee/ sound!',
    wordHint: 'Like in Bee or Tree!',
    emoji: '🐝',
    speechText: 'Find the ee sound! Like in bee!',
  },
  {
    id: 'vowel-oo',
    level: 12,
    station: 3,
    stationTitle: 'Digraphs & Vowel Patterns',
    sound: '/oo/',
    correct: 'OO',
    options: ['OO', 'EE', 'AR', 'OR'],
    prompt: 'Pop the balloon with the /oo/ sound!',
    wordHint: 'Like in Moon or Spoon!',
    emoji: '🌙',
    speechText: 'Find the oo sound! Like in moon!',
  },
  {
    id: 'vowel-ai',
    level: 13,
    station: 3,
    stationTitle: 'Digraphs & Vowel Patterns',
    sound: '/ai/',
    correct: 'AI',
    options: ['AI', 'AY', 'EA', 'OA'],
    prompt: 'Pop the balloon with the /ai/ sound!',
    wordHint: 'Like in Rain or Train!',
    emoji: '🌧️',
    speechText: 'Find the ai sound! Like in rain!',
  },
  {
    id: 'vowel-oa',
    level: 14,
    station: 3,
    stationTitle: 'Digraphs & Vowel Patterns',
    sound: '/oa/',
    correct: 'OA',
    options: ['OA', 'OO', 'OE', 'OU'],
    prompt: 'Pop the balloon with the /oa/ sound!',
    wordHint: 'Like in Boat or Soap!',
    emoji: '⛵',
    speechText: 'Find the oa sound! Like in boat!',
  },
  {
    id: 'vowel-ar',
    level: 15,
    station: 3,
    stationTitle: 'Digraphs & Vowel Patterns',
    sound: '/ar/',
    correct: 'AR',
    options: ['AR', 'OR', 'ER', 'UR'],
    prompt: 'Pop the balloon with the /ar/ sound!',
    wordHint: 'Like in Star or Car!',
    emoji: '🚗',
    speechText: 'Find the ar sound! Like in car!',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Station 4: Complex Sound Combinations (Levels 16–20)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'blend-str',
    level: 16,
    station: 4,
    stationTitle: 'Complex Sound Combinations',
    sound: '/str/',
    correct: 'STR',
    options: ['STR', 'SPR', 'SCR', 'SPL'],
    prompt: 'Pop the balloon with the /str/ sound!',
    wordHint: 'Like in Stripe or Street!',
    emoji: '🦓',
    speechText: 'Find the triple blend str sound! Like in stripe!',
  },
  {
    id: 'blend-spl',
    level: 17,
    station: 4,
    stationTitle: 'Complex Sound Combinations',
    sound: '/spl/',
    correct: 'SPL',
    options: ['SPL', 'SPR', 'STR', 'SCL'],
    prompt: 'Pop the balloon with the /spl/ sound!',
    wordHint: 'Like in Splash or Split!',
    emoji: '💦',
    speechText: 'Find the spl sound! Like in splash!',
  },
  {
    id: 'silent-kn',
    level: 18,
    station: 4,
    stationTitle: 'Complex Sound Combinations',
    sound: '/kn/',
    correct: 'KN',
    options: ['KN', 'GN', 'WR', 'PN'],
    prompt: 'Pop the balloon with the silent k sound kn!',
    wordHint: 'Like in Knight or Knee!',
    emoji: '🛡️',
    speechText: 'Find the silent k sound kn! Like in knight!',
  },
  {
    id: 'silent-wr',
    level: 19,
    station: 4,
    stationTitle: 'Complex Sound Combinations',
    sound: '/wr/',
    correct: 'WR',
    options: ['WR', 'RH', 'KN', 'BR'],
    prompt: 'Pop the balloon with the silent w sound wr!',
    wordHint: 'Like in Write or Wrap!',
    emoji: '✍️',
    speechText: 'Find the silent w sound wr! Like in write!',
  },
  {
    id: 'diphthong-oi',
    level: 20,
    station: 4,
    stationTitle: 'Complex Sound Combinations',
    sound: '/oi/',
    correct: 'OI',
    options: ['OI', 'OY', 'OU', 'OW'],
    prompt: 'Pop the balloon with the /oi/ sound!',
    wordHint: 'Like in Coin or Boil!',
    emoji: '🪙',
    speechText: 'Find the oi sound! Like in coin!',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Station 5: Mixed Review & Advanced Phonics (Levels 21–25)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'vowel-or',
    level: 21,
    station: 5,
    stationTitle: 'Mixed Review & Advanced Phonics',
    sound: '/or/',
    correct: 'OR',
    options: ['OR', 'AR', 'UR', 'ER'],
    prompt: 'Pop the balloon with the /or/ sound!',
    wordHint: 'Like in Fork or Corn!',
    emoji: '🌽',
    speechText: 'Find the or sound! Like in corn!',
  },
  {
    id: 'vowel-ir',
    level: 22,
    station: 5,
    stationTitle: 'Mixed Review & Advanced Phonics',
    sound: '/ir/',
    correct: 'IR',
    options: ['IR', 'UR', 'ER', 'OR'],
    prompt: 'Pop the balloon with the /ir/ sound!',
    wordHint: 'Like in Bird or Shirt!',
    emoji: '🐦',
    speechText: 'Find the ir sound! Like in bird!',
  },
  {
    id: 'diphthong-ou',
    level: 23,
    station: 5,
    stationTitle: 'Mixed Review & Advanced Phonics',
    sound: '/ou/',
    correct: 'OU',
    options: ['OU', 'OW', 'AU', 'AW'],
    prompt: 'Pop the balloon with the /ou/ sound!',
    wordHint: 'Like in Cloud or House!',
    emoji: '☁️',
    speechText: 'Find the ou sound! Like in cloud!',
  },
  {
    id: 'digraph-ph',
    level: 24,
    station: 5,
    stationTitle: 'Mixed Review & Advanced Phonics',
    sound: '/ph/',
    correct: 'PH',
    options: ['PH', 'TH', 'WH', 'SH'],
    prompt: 'Pop the balloon with the /ph/ sound!',
    wordHint: 'Like in Phone or Photo!',
    emoji: '📱',
    speechText: 'Find the ph sound! Like in phone!',
  },
  {
    id: 'trigraph-igh',
    level: 25,
    station: 5,
    stationTitle: 'Mixed Review & Advanced Phonics',
    sound: '/igh/',
    correct: 'IGH',
    options: ['IGH', 'EIGH', 'OAT', 'AIGHT'],
    prompt: 'Pop the balloon with the /igh/ sound!',
    wordHint: 'Like in Light or Night!',
    emoji: '💡',
    speechText: 'Find the igh sound! Like in light!',
  },
];

export const SKY_ARCHER_CURRICULUM = PHONICS_TARGETS_25;

/**
 * Active targets for current gameplay during Stage 1.
 * Preserves the 10 existing rounds and checkpoint bounds until Stage 2/3 calibrations.
 */
export const PHONICS_TARGETS = [
  PHONICS_TARGETS_25[0], // 1: SH
  PHONICS_TARGETS_25[1], // 2: CH
  PHONICS_TARGETS_25[2], // 3: TH
  PHONICS_TARGETS_25[3], // 4: WH
  PHONICS_TARGETS_25[5], // 5: ST
  PHONICS_TARGETS_25[6], // 6: BL
  PHONICS_TARGETS_25[7], // 7: TR
  PHONICS_TARGETS_25[8], // 8: FL
  PHONICS_TARGETS_25[10], // 9: EE
  PHONICS_TARGETS_25[11], // 10: OO
];

/**
 * Returns a phonics round with shuffled options for gameplay.
 */
export function getPhonicsRound(index = 0, targets = PHONICS_TARGETS) {
  const target = targets[index % targets.length];
  // Shuffle options so the correct one is in different positions
  const shuffled = [...target.options].sort(() => Math.random() - 0.5);
  return {
    ...target,
    shuffledOptions: shuffled,
  };
}

/**
 * Returns a round from the full 25-level curriculum.
 */
export function getPhonicsCurriculumRound(index = 0) {
  return getPhonicsRound(index, PHONICS_TARGETS_25);
}

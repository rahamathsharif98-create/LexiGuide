// ============================================================
// DEMO / MOCK DATA
// This file simulates what would come from the backend database
// (PostgreSQL/Firebase) described in the architecture doc.
// Replace with real API calls once the backend is connected.
// ============================================================

export const SKILL_KEYS = [
  'phonologicalAwareness',
  'pronunciation',
  'wordRecognition',
  'readingFluency',
  'comprehension',
]

export const SKILL_LABELS = {
  phonologicalAwareness: 'Phonological Awareness',
  pronunciation: 'Pronunciation',
  wordRecognition: 'Word Recognition',
  readingFluency: 'Reading Fluency',
  comprehension: 'Comprehension',
}

export const SKILL_COLORS = {
  phonologicalAwareness: '#a86bff',
  pronunciation: '#12aeef',
  wordRecognition: '#ff8a4c',
  readingFluency: '#ff6b6b',
  comprehension: '#2fd486',
}

// ---- Children (demo) ----
export const CHILDREN = [
  {
    id: 1,
    name: 'Aarav',
    age: 7,
    avatar: '🦊',
    color: 'brand',
    language: 'en',
    level: 4,
    xp: 1280,
    streak: 5,
    stars: 342,
    fingerprint: {
      phonologicalAwareness: 62,
      pronunciation: 71,
      wordRecognition: 55,
      readingFluency: 48,
      comprehension: 82,
    },
    crossLanguage: {
      en: { readingFluency: 48, comprehension: 82 },
      te: { readingFluency: 72, comprehension: 88 },
    },
  },
  {
    id: 2,
    name: 'Meera',
    age: 6,
    avatar: '🐼',
    color: 'berry',
    language: 'en',
    level: 2,
    xp: 540,
    streak: 2,
    stars: 118,
    fingerprint: {
      phonologicalAwareness: 74,
      pronunciation: 80,
      wordRecognition: 69,
      readingFluency: 66,
      comprehension: 75,
    },
    crossLanguage: {
      en: { readingFluency: 66, comprehension: 75 },
      hi: { readingFluency: 58, comprehension: 70 },
    },
  },
  {
    id: 3,
    name: 'Kabir',
    age: 9,
    avatar: '🐯',
    color: 'peach',
    level: 6,
    xp: 2210,
    streak: 12,
    stars: 588,
    fingerprint: {
      phonologicalAwareness: 40,
      pronunciation: 52,
      wordRecognition: 38,
      readingFluency: 33,
      comprehension: 61,
    },
    crossLanguage: {},
  },
]

// // ---- Historical sessions (for trend charts) ----
export function generateHistory(child) {
  const base = child.fingerprint
  const days = 8
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const jitter = (offset) => (((i * 7 + offset) % 9) - 4)
    out.push({
      session: `S${days - i}`,
      date: `Day ${days - i}`,
      phonologicalAwareness: clamp(base.phonologicalAwareness - i * 2.2 + jitter(1)),
      pronunciation: clamp(base.pronunciation - i * 1.6 + jitter(2)),
      wordRecognition: clamp(base.wordRecognition - i * 2.6 + jitter(3)),
      readingFluency: clamp(base.readingFluency - i * 2.1 + jitter(4)),
      comprehension: clamp(base.comprehension - i * 0.9 + jitter(5)),
    })
  }
  return out
}

function clamp(v) { return Math.max(5, Math.min(98, Math.round(v))) }

// ---- Past practice sessions ----
export const SESSION_TYPES = [
  { label: 'Read With Me', icon: '⏱️' },
  { label: 'Speak & Shine', icon: '🎤' },
  { label: 'Sound Safari', icon: '🦁' },
  { label: 'Word Builder', icon: '🧩' },
  { label: 'Story Time', icon: '📖' },
]
export function generateSessions(child, count = 8) {
  const out = []
  for (let i = 0; i < count; i++) {
    const type = SESSION_TYPES[i % SESSION_TYPES.length]
    out.push({
      id: `${child.id}-s${i}`,
      ...type,
      date: `${count - i} day${count - i === 1 ? '' : 's'} ago`,
      accuracy: clamp(65 + ((i * 13) % 30)),
      duration: `${3 + (i % 5)} min`,
    })
  }
  return out
}

const AARAV_PATTERNS = [
  { pattern: 'Phoneme confusion (sh / ch)', sessions: 5, severity: 78, trend: 'persistent' },
  { pattern: 'Long pauses before multisyllable words', sessions: 4, severity: 64, trend: 'persistent' },
  { pattern: 'Word omission at sentence end', sessions: 2, severity: 30, trend: 'improving' },
  { pattern: 'Repetition of first syllable', sessions: 3, severity: 45, trend: 'stable' },
]
const MEERA_PATTERNS = [
  { pattern: 'Vowel-sound substitution (e/i)', sessions: 3, severity: 40, trend: 'improving' },
  { pattern: 'Short hesitations on new words', sessions: 2, severity: 28, trend: 'improving' },
]
const KABIR_PATTERNS = [
  { pattern: 'Letter reversal (b/d)', sessions: 7, severity: 82, trend: 'persistent' },
  { pattern: 'Phoneme confusion (sh / ch)', sessions: 6, severity: 70, trend: 'persistent' },
  { pattern: 'Slow decoding of unfamiliar words', sessions: 6, severity: 75, trend: 'persistent' },
  { pattern: 'Word omission', sessions: 4, severity: 50, trend: 'stable' },
]
const PRIYA_PATTERNS = [
  { pattern: 'Hesitation before multisyllable words', sessions: 4, severity: 60, trend: 'persistent' },
  { pattern: 'Slower reading pace on longer passages', sessions: 3, severity: 48, trend: 'stable' },
]
const ROHAN_PATTERNS = [
  { pattern: 'Difficulty answering "why" comprehension questions', sessions: 5, severity: 68, trend: 'persistent' },
  { pattern: 'Story recall accuracy lower on longer stories', sessions: 3, severity: 42, trend: 'improving' },
]

// ---- Recurring error patterns (persistent pattern detection) ----
export const ERROR_PATTERNS = {
  1: AARAV_PATTERNS,
  2: MEERA_PATTERNS,
  3: KABIR_PATTERNS,
  4: PRIYA_PATTERNS,
  5: ROHAN_PATTERNS,
  // String keys / legacy aliases
  '1': AARAV_PATTERNS,
  '2': MEERA_PATTERNS,
  '3': KABIR_PATTERNS,
  '4': PRIYA_PATTERNS,
  '5': ROHAN_PATTERNS,
  aarav: AARAV_PATTERNS,
  meera: MEERA_PATTERNS,
  kabir: KABIR_PATTERNS,
  priya: PRIYA_PATTERNS,
  rohan: ROHAN_PATTERNS,
}

// ---- Stories ----
export const STORIES = [
  {
    id: 'story-forest',
    title: 'The Curious Fox',
    description: 'A curious fox finds a sparkly treasure in the forest.',
    cover: '🦊',
    image: '/assets/stories/curious-fox.jpg',
    difficulty: 'Easy',
    duration: '3 min',
    color: 'peach',
    characters: ['🦊 Sam the Fox'],
    passage: [
      'Once there was a curious fox named Sam.',
      'Sam loved to explore the green, quiet forest.',
      'One sunny day, Sam found a shiny blue stone.',
      'The stone sparkled like a little star.',
      'Sam carried it home to show all his friends.',
    ],
    questions: [
      { q: 'What was the fox\'s name?', options: [{ text: 'Sam', emoji: '🦊' }, { text: 'Max', emoji: '🐺' }, { text: 'Tom', emoji: '🐱' }], answer: 'Sam' },
      { q: 'What color was the stone?', options: [{ text: 'Red', emoji: '🔴' }, { text: 'Blue', emoji: '🔵' }, { text: 'Green', emoji: '🟢' }], answer: 'Blue' },
      { q: 'Where did Sam love to explore?', options: [{ text: 'The beach', emoji: '🏖️' }, { text: 'The forest', emoji: '🌲' }, { text: 'The city', emoji: '🏙️' }], answer: 'The forest' },
    ],
  },
  {
    id: 'story-space',
    title: 'A Trip to the Moon',
    description: 'Priya builds a rocket and dreams of flying to the moon.',
    cover: '🚀',
    image: '/assets/stories/trip-moon.jpg',
    difficulty: 'Medium',
    duration: '4 min',
    color: 'brand',
    characters: ['👧 Priya'],
    passage: [
      'Priya dreamed of flying to the moon.',
      'She built a rocket from cardboard and paint.',
      'At night, the stars twinkled above her window.',
      'In her dream, the rocket zoomed past the clouds.',
      'She landed softly on the silver, dusty moon.',
    ],
    questions: [
      { q: 'What did Priya build?', options: [{ text: 'A rocket', emoji: '🚀' }, { text: 'A boat', emoji: '⛵' }, { text: 'A kite', emoji: '🪁' }], answer: 'A rocket' },
      { q: 'Where did she land?', options: [{ text: 'The sun', emoji: '☀️' }, { text: 'The moon', emoji: '🌙' }, { text: 'A star', emoji: '⭐' }], answer: 'The moon' },
    ],
  },
  {
    id: 'story-garden',
    title: 'The Tiny Seed',
    description: 'A tiny seed grows into a bright yellow flower.',
    cover: '🌱',
    image: '/assets/stories/tiny-seed.svg',
    difficulty: 'Easy',
    duration: '3 min',
    color: 'mint',
    characters: ['🌱 Little Seed'],
    passage: [
      'A tiny seed lived under the warm brown soil.',
      'Rain fell softly and the seed began to grow.',
      'A small green shoot pushed up toward the sun.',
      'Day by day, the plant grew taller and taller.',
      'Soon a bright yellow flower bloomed in the garden.',
    ],
    questions: [
      { q: 'What helped the seed grow?', options: [{ text: 'Rain', emoji: '🌧️' }, { text: 'Snow', emoji: '❄️' }, { text: 'Wind', emoji: '💨' }], answer: 'Rain' },
      { q: 'What color was the flower?', options: [{ text: 'Yellow', emoji: '🟡' }, { text: 'Purple', emoji: '🟣' }, { text: 'Blue', emoji: '🔵' }], answer: 'Yellow' },
    ],
  },
  {
    id: 'story-ocean',
    title: 'The Lost Starfish',
    description: 'A little starfish loses her way and makes new friends finding home.',
    cover: '⭐',
    image: '/assets/stories/lost-starfish.svg',
    difficulty: 'Easy',
    duration: '3 min',
    color: 'berry',
    characters: ['⭐ Stella the Starfish'],
    passage: [
      'Stella the starfish drifted away from her reef.',
      'She swam past colorful fish and a friendly crab.',
      'A wise old turtle showed her the way home.',
      'Stella thanked her new friends with a big smile.',
      'She was happy to be back on her favorite rock.',
    ],
    questions: [
      { q: 'Who helped Stella find her way?', options: [{ text: 'A turtle', emoji: '🐢' }, { text: 'A shark', emoji: '🦈' }, { text: 'A bird', emoji: '🐦' }], answer: 'A turtle' },
      { q: 'How did Stella feel at the end?', options: [{ text: 'Happy', emoji: '😊' }, { text: 'Sad', emoji: '😢' }, { text: 'Scared', emoji: '😨' }], answer: 'Happy' },
    ],
  },
  {
    id: 'story-farm',
    title: 'Bella the Baking Bear',
    description: 'Bella the bear bakes her very first honey cake for the forest party.',
    cover: '🐻',
    image: '/assets/stories/baking-bear.svg',
    difficulty: 'Medium',
    duration: '4 min',
    color: 'sun',
    characters: ['🐻 Bella the Bear'],
    passage: [
      'Bella the bear wanted to bake a honey cake.',
      'She mixed flour, eggs, and lots of golden honey.',
      'The cake rose high in the warm oven.',
      'All her forest friends came to taste a slice.',
      'Everyone agreed it was the best cake ever!',
    ],
    questions: [
      { q: 'What did Bella bake?', options: [{ text: 'A honey cake', emoji: '🍰' }, { text: 'Bread', emoji: '🍞' }, { text: 'Cookies', emoji: '🍪' }], answer: 'A honey cake' },
      { q: 'Who came to taste it?', options: [{ text: 'Her forest friends', emoji: '🦊' }, { text: 'No one', emoji: '🚫' }, { text: 'A dragon', emoji: '🐉' }], answer: 'Her forest friends' },
    ],
  },
]

// ---- Games catalog ----
export const GAMES = [
  { id: 'match-sound', title: 'Sound Safari', icon: '🦁', color: 'brand', skill: 'phonologicalAwareness', desc: 'Hear a sound, pick the matching picture.', hint: 'Listen for the very first sound in the word!' },
  { id: 'trace-speak', title: 'Trace & Speak', icon: '✍️', color: 'berry', skill: 'phonologicalAwareness', desc: 'Trace multilingual letters and practice speaking words.', hint: 'Follow the guide lines smoothly with your finger!', route: '/child/games/trace-speak' },
  { id: 'build-word', title: 'Word Builder', icon: '🧩', color: 'mint', skill: 'wordRecognition', desc: 'Arrange letters to build the right word.', hint: 'Say the picture\'s name slowly, sound by sound.' },
  { id: 'find-sound', title: 'Letter Detective', icon: '🔍', color: 'berry', skill: 'phonologicalAwareness', desc: 'Investigate words and find the target sound.', hint: 'Say each word out loud — can you hear the sound hiding inside?' },
  { id: 'picture-word', title: 'Picture Match', icon: '🖼️', color: 'peach', skill: 'wordRecognition', desc: 'Match the picture to the correct word.', hint: 'Look for the first letter of the word you know.' },
  { id: 'sound-detective', title: 'Sound Detective', icon: '🕵️', color: 'sun', skill: 'pronunciation', desc: 'Listen closely and identify the sound.', hint: 'Watch your mouth shape in a mirror as you say each option!' },
]

// ---- Reading passages for "Read With Me" (selectable) ----
export const READ_PASSAGES = [
  { id: 'rp1', title: 'My Pet Cat', cover: '🐱', difficulty: 'Easy', duration: '2 min', words: ['My', 'cat', 'is', 'small', 'and', 'soft.', 'She', 'likes', 'to', 'play', 'with', 'a', 'red', 'ball.'] },
  { id: 'rp2', title: 'The Rainy Day', cover: '🌧️', difficulty: 'Easy', duration: '2 min', words: ['It', 'was', 'a', 'rainy', 'day.', 'We', 'stayed', 'inside', 'and', 'read', 'fun', 'books', 'together.'] },
  { id: 'rp3', title: 'The Big Race', cover: '🐢', difficulty: 'Medium', duration: '3 min', words: ['The', 'rabbit', 'was', 'very', 'fast.', 'The', 'turtle', 'was', 'slow', 'but', 'never', 'gave', 'up.'] },
]

// ---- Speak & Shine word bank (target-word pronunciation practice) ----
// At least 10 age-appropriate words, per Phase 2 spec.
export const SPEAK_WORDS = [
  { word: 'SUN', emoji: '☀️' },
  { word: 'FISH', emoji: '🐟' },
  { word: 'SHIP', emoji: '🚢' },
  { word: 'BALL', emoji: '⚽' },
  { word: 'TREE', emoji: '🌳' },
  { word: 'BOOK', emoji: '📕' },
  { word: 'APPLE', emoji: '🍎' },
  { word: 'MOON', emoji: '🌙' },
  { word: 'STAR', emoji: '⭐' },
  { word: 'SCHOOL', emoji: '🏫' },
]

// ---- Friendly skill categories for the child-facing UI (My Journey) ----
// The 5 technical fingerprint skills are grouped into 4 plain-language
// categories a young child can understand, with wordRecognition folded
// into "Reading" alongside readingFluency.
export const FRIENDLY_SKILLS = [
  { key: 'sounds', label: 'Sounds', emoji: '🔤', color: '#a86bff', from: (fp) => fp.phonologicalAwareness },
  { key: 'reading', label: 'Reading', emoji: '📖', color: '#12aeef', from: (fp) => Math.round((fp.readingFluency + fp.wordRecognition) / 2) },
  { key: 'speaking', label: 'Speaking', emoji: '🗣️', color: '#ff8a4c', from: (fp) => fp.pronunciation },
  { key: 'understanding', label: 'Understanding', emoji: '🧠', color: '#2fd486', from: (fp) => fp.comprehension },
]

export function getFriendlySkills(fingerprint) {
  return FRIENDLY_SKILLS.map((s) => ({ ...s, value: s.from(fingerprint) }))
}

// ---- Achievements ----
export const ACHIEVEMENTS = [
  { id: 'a1', icon: '🏆', title: 'First Reading Adventure', desc: 'Completed your first session', earned: true },
  { id: 'a2', icon: '🎤', title: 'Speaking Star', desc: 'Recorded 10 read-alouds', earned: true },
  { id: 'a3', icon: '📚', title: 'Story Explorer', desc: 'Finished 5 stories', earned: true },
  { id: 'a4', icon: '🔥', title: '5-Day Learning Streak', desc: 'Practiced 5 days in a row', earned: true },
  { id: 'a5', icon: '⭐', title: 'Sound Master', desc: 'Mastered 3 tricky sounds', earned: false },
  { id: 'a6', icon: '🧩', title: 'Puzzle Pro', desc: 'Completed 20 word puzzles', earned: false },
]

// ---- Teacher: students / class ----
// ---- Teacher-only extra demo students (roster variety) ----
// These exist only for the Teacher portal's class roster — they are NOT
// part of CHILDREN, so they never appear in Child profile-select or the
// Parent "My Children" list. Kept separate deliberately so Phase 4 doesn't
// ripple into Phases 1-3.
export const TEACHER_EXTRA_STUDENTS = [
  {
    id: 4, name: 'Priya', age: 8, avatar: '🐰', color: 'mint', level: 5, xp: 1640, streak: 7, stars: 402,
    fingerprint: { phonologicalAwareness: 70, pronunciation: 85, wordRecognition: 68, readingFluency: 45, comprehension: 72 },
    crossLanguage: {},
  },
  {
    id: 5, name: 'Rohan', age: 6, avatar: '🐨', color: 'sun', level: 3, xp: 760, streak: 3, stars: 190,
    fingerprint: { phonologicalAwareness: 68, pronunciation: 66, wordRecognition: 72, readingFluency: 70, comprehension: 45 },
    crossLanguage: {},
  },
]

export const CLASS_STUDENTS = [...CHILDREN, ...TEACHER_EXTRA_STUDENTS].map((c, i) => ({
  ...c,
  trend: ['stable', 'improving', 'needs-attention', 'needs-attention', 'improving'][i] || 'stable',
  lastActivity: ['2 hours ago', 'Yesterday', '3 days ago', 'Today', '4 hours ago'][i] || 'Recently',
}))

const AARAV_SUPPORT = [
  'Practice phoneme blending for /sh/ and /ch/ sounds',
  'Short guided reading sessions with a caregiver, 10 min/day',
  'Repeated-word exercises for multisyllable words',
]
const MEERA_SUPPORT = [
  'Vowel-sound discrimination games',
  'Continue current pace — strong overall progress',
]
const KABIR_SUPPORT = [
  'Letter orientation practice (b/d reversal)',
  'Slow, guided decoding practice with audio support',
  'Consider a specialist consultation for further support',
]
const PRIYA_SUPPORT = [
  'Repeated reading of short passages to build fluency',
  'Timed reading practice with encouraging pacing, not pressure',
]
const ROHAN_SUPPORT = [
  'Guided story discussion after reading — ask "what happened next?"',
  'Picture-based comprehension activities before moving to text-only',
]

export const RECOMMENDED_SUPPORT = {
  1: AARAV_SUPPORT,
  2: MEERA_SUPPORT,
  3: KABIR_SUPPORT,
  4: PRIYA_SUPPORT,
  5: ROHAN_SUPPORT,
  // String keys / legacy aliases
  '1': AARAV_SUPPORT,
  '2': MEERA_SUPPORT,
  '3': KABIR_SUPPORT,
  '4': PRIYA_SUPPORT,
  '5': ROHAN_SUPPORT,
  aarav: AARAV_SUPPORT,
  meera: MEERA_SUPPORT,
  kabir: KABIR_SUPPORT,
  priya: PRIYA_SUPPORT,
  rohan: ROHAN_SUPPORT,
}

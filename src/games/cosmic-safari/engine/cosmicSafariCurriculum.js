/**
 * Cosmic Safari (Sound Safari / Match Sound) Curriculum
 *
 * 25 progressive, age-appropriate phonological awareness levels
 * organized across 5 developmental cosmic-themed stages (5 levels each).
 *
 * - Stage 1 (Levels 1–5): Cosmic Meadow (Foundational Beginning Animal Phonemes)
 * - Stage 2 (Levels 6–10): Starlight Savanna (Savanna & Wildlife Animal Phonemes)
 * - Stage 3 (Levels 11–15): Nebula Lagoon (Aquatic & Aviary Phonemes)
 * - Stage 4 (Levels 16–20): Asteroid Outback (Forest & Outback Phonemes)
 * - Stage 5 (Levels 21–25): Galaxy Sanctuary (Master Cosmic Phonics Challenges)
 *
 * Preserves the original 4 foundational animals (Cat 🐱, Sheep 🐑, Bear 🐻, Frog 🐸)
 * as Levels 1–4 to maintain 100% backward compatibility with all voice, audio,
 * and adaptive engine suites.
 */

export const TOTAL_COSMIC_SAFARI_LEVELS = 25;
export const TOTAL_COSMIC_SAFARI_STAGES = 5;
export const LEVELS_PER_STAGE = 5;

export const COSMIC_SAFARI_STAGES = [
  {
    stage: 1,
    title: 'Stage 1: Cosmic Meadow',
    shortTitle: 'Cosmic Meadow',
    levelRange: [1, 5],
    badge: '🛸',
    themeColor: '#13CFE3',
    description: 'Spot friendly cosmic meadow animal companions and match beginning sounds!',
  },
  {
    stage: 2,
    title: 'Stage 2: Starlight Savanna',
    shortTitle: 'Starlight Savanna',
    levelRange: [6, 10],
    badge: '⭐',
    themeColor: '#34D399',
    description: 'Trek across the starlit cosmic savanna and identify magnificent wildlife sounds!',
  },
  {
    stage: 3,
    title: 'Stage 3: Nebula Lagoon',
    shortTitle: 'Nebula Lagoon',
    levelRange: [11, 15],
    badge: '🪐',
    themeColor: '#FBBF24',
    description: 'Explore the glowing nebula lagoon and discover playful aquatic and flying creatures!',
  },
  {
    stage: 4,
    title: 'Stage 4: Asteroid Outback',
    shortTitle: 'Asteroid Outback',
    levelRange: [16, 20],
    badge: '☄️',
    themeColor: '#A78BFA',
    description: 'Navigate asteroid valleys to rescue elusive outback and woodland animal buddies!',
  },
  {
    stage: 5,
    title: 'Stage 5: Galaxy Sanctuary',
    shortTitle: 'Galaxy Sanctuary',
    levelRange: [21, 25],
    badge: '👑',
    themeColor: '#FB7185',
    description: 'Enter the grand galactic sanctuary and conquer master animal phonics missions!',
  },
];

export const COSMIC_SAFARI_CURRICULUM = [
  // ==========================================
  // STAGE 1: Cosmic Meadow (Levels 1–5)
  // Preserving original 4 rounds for 100% test compatibility
  // ==========================================
  {
    id: 'cosmic-safari-1',
    level: 1,
    stage: 1,
    stageName: 'Cosmic Meadow',
    station: 1,
    missionSector: 'Sector 1: Star Launchpad',
    sound: '/k/',
    soundSpoken: 'kuh',
    prompt: 'Which animal friend starts with the sound /k/?',
    correct: '🐱',
    correctName: 'Cat',
    label: 'cat',
    emoji: '🐱',
    options: [
      { emoji: '🐱', name: 'Cat' },
      { emoji: '🐶', name: 'Dog' },
      { emoji: '🐟', name: 'Fish' },
    ],
    hint: 'Listen for /k/... like a soft purring cat 🐱!',
  },
  {
    id: 'cosmic-safari-2',
    level: 2,
    stage: 1,
    stageName: 'Cosmic Meadow',
    station: 2,
    missionSector: 'Sector 2: Fluffy Clouds',
    sound: '/sh/',
    soundSpoken: 'shhh',
    prompt: 'Which animal friend starts with the sound /sh/?',
    correct: '🐑',
    correctName: 'Sheep',
    label: 'sheep',
    emoji: '🐑',
    options: [
      { emoji: '🐑', name: 'Sheep' },
      { emoji: '🐮', name: 'Cow' },
      { emoji: '🐷', name: 'Pig' },
    ],
    hint: 'Listen for /sh/... like a woolly sheep 🐑!',
  },
  {
    id: 'cosmic-safari-3',
    level: 3,
    stage: 1,
    stageName: 'Cosmic Meadow',
    station: 3,
    missionSector: 'Sector 3: Honey Glade',
    sound: '/b/',
    soundSpoken: 'buh',
    prompt: 'Which animal friend starts with the sound /b/?',
    correct: '🐻',
    correctName: 'Bear',
    label: 'bear',
    emoji: '🐻',
    options: [
      { emoji: '🐻', name: 'Bear' },
      { emoji: '🦆', name: 'Duck' },
      { emoji: '🐰', name: 'Rabbit' },
    ],
    hint: 'Listen for /b/... like a friendly bear 🐻!',
  },
  {
    id: 'cosmic-safari-4',
    level: 4,
    stage: 1,
    stageName: 'Cosmic Meadow',
    station: 4,
    missionSector: 'Sector 4: Lilypad Pond',
    sound: '/f/',
    soundSpoken: 'fff',
    prompt: 'Which animal friend starts with the sound /f/?',
    correct: '🐸',
    correctName: 'Frog',
    label: 'frog',
    emoji: '🐸',
    options: [
      { emoji: '🐸', name: 'Frog' },
      { emoji: '🐦', name: 'Bird' },
      { emoji: '🐍', name: 'Snake' },
    ],
    hint: 'Listen for /f/... like a jumping frog 🐸!',
  },
  {
    id: 'cosmic-safari-5',
    level: 5,
    stage: 1,
    stageName: 'Cosmic Meadow',
    station: 5,
    missionSector: 'Sector 5: Clover Hollow',
    sound: '/d/',
    soundSpoken: 'duh',
    prompt: 'Which animal friend starts with the sound /d/?',
    correct: '🐶',
    correctName: 'Dog',
    label: 'dog',
    emoji: '🐶',
    options: [
      { emoji: '🐶', name: 'Dog' },
      { emoji: '🐱', name: 'Cat' },
      { emoji: '🐰', name: 'Rabbit' },
    ],
    hint: 'Listen for /d/... like a playful dog 🐶!',
  },

  // ==========================================
  // STAGE 2: Starlight Savanna (Levels 6–10)
  // ==========================================
  {
    id: 'cosmic-safari-6',
    level: 6,
    stage: 2,
    stageName: 'Starlight Savanna',
    station: 6,
    missionSector: 'Sector 6: Golden Ridge',
    sound: '/l/',
    soundSpoken: 'lll',
    prompt: 'Which animal friend starts with the sound /l/?',
    correct: '🦁',
    correctName: 'Lion',
    label: 'lion',
    emoji: '🦁',
    options: [
      { emoji: '🦁', name: 'Lion' },
      { emoji: '🐯', name: 'Tiger' },
      { emoji: '🐻', name: 'Bear' },
    ],
    hint: 'Listen for /l/... like a brave lion 🦁!',
  },
  {
    id: 'cosmic-safari-7',
    level: 7,
    stage: 2,
    stageName: 'Starlight Savanna',
    station: 7,
    missionSector: 'Sector 7: Acacia Canopy',
    sound: '/m/',
    soundSpoken: 'mmm',
    prompt: 'Which animal friend starts with the sound /m/?',
    correct: '🐵',
    correctName: 'Monkey',
    label: 'monkey',
    emoji: '🐵',
    options: [
      { emoji: '🐵', name: 'Monkey' },
      { emoji: '🐘', name: 'Elephant' },
      { emoji: '🦒', name: 'Giraffe' },
    ],
    hint: 'Listen for /m/... like a playful monkey 🐵!',
  },
  {
    id: 'cosmic-safari-8',
    level: 8,
    stage: 2,
    stageName: 'Starlight Savanna',
    station: 8,
    missionSector: 'Sector 8: Striped Plains',
    sound: '/z/',
    soundSpoken: 'zzz',
    prompt: 'Which animal friend starts with the sound /z/?',
    correct: '🦓',
    correctName: 'Zebra',
    label: 'zebra',
    emoji: '🦓',
    options: [
      { emoji: '🦓', name: 'Zebra' },
      { emoji: '🐴', name: 'Horse' },
      { emoji: '🦌', name: 'Deer' },
    ],
    hint: 'Listen for /z/... like a striped zebra 🦓!',
  },
  {
    id: 'cosmic-safari-9',
    level: 9,
    stage: 2,
    stageName: 'Starlight Savanna',
    station: 9,
    missionSector: 'Sector 9: Baobab Basin',
    sound: '/e/',
    soundSpoken: 'ehh',
    prompt: 'Which animal friend starts with the sound /e/?',
    correct: '🐘',
    correctName: 'Elephant',
    label: 'elephant',
    emoji: '🐘',
    options: [
      { emoji: '🐘', name: 'Elephant' },
      { emoji: '🦏', name: 'Rhino' },
      { emoji: '🦛', name: 'Hippo' },
    ],
    hint: 'Listen for /e/... like an enormous elephant 🐘!',
  },
  {
    id: 'cosmic-safari-10',
    level: 10,
    stage: 2,
    stageName: 'Starlight Savanna',
    station: 10,
    missionSector: 'Sector 10: Riverbend Oasis',
    sound: '/h/',
    soundSpoken: 'huh',
    prompt: 'Which animal friend starts with the sound /h/?',
    correct: '🦛',
    correctName: 'Hippo',
    label: 'hippo',
    emoji: '🦛',
    options: [
      { emoji: '🦛', name: 'Hippo' },
      { emoji: '🐊', name: 'Crocodile' },
      { emoji: '🐢', name: 'Turtle' },
    ],
    hint: 'Listen for /h/... like a splashing hippo 🦛!',
  },

  // ==========================================
  // STAGE 3: Nebula Lagoon (Levels 11–15)
  // ==========================================
  {
    id: 'cosmic-safari-11',
    level: 11,
    stage: 3,
    stageName: 'Nebula Lagoon',
    station: 11,
    missionSector: 'Sector 11: Tidal Shallows',
    sound: '/w/',
    soundSpoken: 'wuh',
    prompt: 'Which animal friend starts with the sound /w/?',
    correct: '🐋',
    correctName: 'Whale',
    label: 'whale',
    emoji: '🐋',
    options: [
      { emoji: '🐋', name: 'Whale' },
      { emoji: '🦈', name: 'Shark' },
      { emoji: '🐙', name: 'Octopus' },
    ],
    hint: 'Listen for /w/... like a giant whale 🐋!',
  },
  {
    id: 'cosmic-safari-12',
    level: 12,
    stage: 3,
    stageName: 'Nebula Lagoon',
    station: 12,
    missionSector: 'Sector 12: Crystal Cove',
    sound: '/d/',
    soundSpoken: 'duh',
    prompt: 'Which animal friend starts with the sound /d/?',
    correct: '🐬',
    correctName: 'Dolphin',
    label: 'dolphin',
    emoji: '🐬',
    options: [
      { emoji: '🐬', name: 'Dolphin' },
      { emoji: '🐠', name: 'Fish' },
      { emoji: '🦀', name: 'Crab' },
    ],
    hint: 'Listen for /d/... like a leaping dolphin 🐬!',
  },
  {
    id: 'cosmic-safari-13',
    level: 13,
    stage: 3,
    stageName: 'Nebula Lagoon',
    station: 13,
    missionSector: 'Sector 13: Glacial Iceberg',
    sound: '/p/',
    soundSpoken: 'puh',
    prompt: 'Which animal friend starts with the sound /p/?',
    correct: '🐧',
    correctName: 'Penguin',
    label: 'penguin',
    emoji: '🐧',
    options: [
      { emoji: '🐧', name: 'Penguin' },
      { emoji: '🦭', name: 'Seal' },
      { emoji: '🦈', name: 'Shark' },
    ],
    hint: 'Listen for /p/... like a waddling penguin 🐧!',
  },
  {
    id: 'cosmic-safari-14',
    level: 14,
    stage: 3,
    stageName: 'Nebula Lagoon',
    station: 14,
    missionSector: 'Sector 14: Coral Atoll',
    sound: '/t/',
    soundSpoken: 'tuh',
    prompt: 'Which animal friend starts with the sound /t/?',
    correct: '🐢',
    correctName: 'Turtle',
    label: 'turtle',
    emoji: '🐢',
    options: [
      { emoji: '🐢', name: 'Turtle' },
      { emoji: '🐡', name: 'Pufferfish' },
      { emoji: '🦞', name: 'Lobster' },
    ],
    hint: 'Listen for /t/... like a gentle sea turtle 🐢!',
  },
  {
    id: 'cosmic-safari-15',
    level: 15,
    stage: 3,
    stageName: 'Nebula Lagoon',
    station: 15,
    missionSector: 'Sector 15: Glowing Reef',
    sound: '/f/',
    soundSpoken: 'fff',
    prompt: 'Which animal friend starts with the sound /f/?',
    correct: '🐠',
    correctName: 'Fish',
    label: 'fish',
    emoji: '🐠',
    options: [
      { emoji: '🐠', name: 'Fish' },
      { emoji: '🐙', name: 'Octopus' },
      { emoji: '🦑', name: 'Squid' },
    ],
    hint: 'Listen for /f/... like a swimming fish 🐠!',
  },

  // ==========================================
  // STAGE 4: Asteroid Outback (Levels 16–20)
  // ==========================================
  {
    id: 'cosmic-safari-16',
    level: 16,
    stage: 4,
    stageName: 'Asteroid Outback',
    station: 16,
    missionSector: 'Sector 16: Red Canyon',
    sound: '/k/',
    soundSpoken: 'kuh',
    prompt: 'Which animal friend starts with the sound /k/?',
    correct: '🦘',
    correctName: 'Kangaroo',
    label: 'kangaroo',
    emoji: '🦘',
    options: [
      { emoji: '🦘', name: 'Kangaroo' },
      { emoji: '🦔', name: 'Hedgehog' },
      { emoji: '🐿️', name: 'Squirrel' },
    ],
    hint: 'Listen for /k/... like a hopping kangaroo 🦘!',
  },
  {
    id: 'cosmic-safari-17',
    level: 17,
    stage: 4,
    stageName: 'Asteroid Outback',
    station: 17,
    missionSector: 'Sector 17: Eucalyptus Grove',
    sound: '/k/',
    soundSpoken: 'kuh',
    prompt: 'Which animal friend starts with the sound /k/?',
    correct: '🐨',
    correctName: 'Koala',
    label: 'koala',
    emoji: '🐨',
    options: [
      { emoji: '🐨', name: 'Koala' },
      { emoji: '🦥', name: 'Sloth' },
      { emoji: '🦡', name: 'Badger' },
    ],
    hint: 'Listen for /k/... like a cuddly koala 🐨!',
  },
  {
    id: 'cosmic-safari-18',
    level: 18,
    stage: 4,
    stageName: 'Asteroid Outback',
    station: 18,
    missionSector: 'Sector 18: Bamboo Mist',
    sound: '/p/',
    soundSpoken: 'puh',
    prompt: 'Which animal friend starts with the sound /p/?',
    correct: '🐼',
    correctName: 'Panda',
    label: 'panda',
    emoji: '🐼',
    options: [
      { emoji: '🐼', name: 'Panda' },
      { emoji: '🦝', name: 'Raccoon' },
      { emoji: '🦦', name: 'Otter' },
    ],
    hint: 'Listen for /p/... like a gentle giant panda 🐼!',
  },
  {
    id: 'cosmic-safari-19',
    level: 19,
    stage: 4,
    stageName: 'Asteroid Outback',
    station: 19,
    missionSector: 'Sector 19: Whispering Woods',
    sound: '/f/',
    soundSpoken: 'fff',
    prompt: 'Which animal friend starts with the sound /f/?',
    correct: '🦊',
    correctName: 'Fox',
    label: 'fox',
    emoji: '🦊',
    options: [
      { emoji: '🦊', name: 'Fox' },
      { emoji: '🐺', name: 'Wolf' },
      { emoji: '🦌', name: 'Deer' },
    ],
    hint: 'Listen for /f/... like a clever orange fox 🦊!',
  },
  {
    id: 'cosmic-safari-20',
    level: 20,
    stage: 4,
    stageName: 'Asteroid Outback',
    station: 20,
    missionSector: 'Sector 20: Starlit Pass',
    sound: '/t/',
    soundSpoken: 'tuh',
    prompt: 'Which animal friend starts with the sound /t/?',
    correct: '🐯',
    correctName: 'Tiger',
    label: 'tiger',
    emoji: '🐯',
    options: [
      { emoji: '🐯', name: 'Tiger' },
      { emoji: '🐆', name: 'Leopard' },
      { emoji: '🐈', name: 'Cat' },
    ],
    hint: 'Listen for /t/... like a roaring tiger 🐯!',
  },

  // ==========================================
  // STAGE 5: Galaxy Sanctuary (Levels 21–25)
  // ==========================================
  {
    id: 'cosmic-safari-21',
    level: 21,
    stage: 5,
    stageName: 'Galaxy Sanctuary',
    station: 21,
    missionSector: 'Sector 21: Tall Spire',
    sound: '/j/',
    soundSpoken: 'juh',
    prompt: 'Which animal friend starts with the soft sound /j/?',
    correct: '🦒',
    correctName: 'Giraffe',
    label: 'giraffe',
    emoji: '🦒',
    options: [
      { emoji: '🦒', name: 'Giraffe' },
      { emoji: '🦓', name: 'Zebra' },
      { emoji: '🦘', name: 'Kangaroo' },
    ],
    hint: 'Listen for soft /j/... like a tall giraffe 🦒!',
  },
  {
    id: 'cosmic-safari-22',
    level: 22,
    stage: 5,
    stageName: 'Galaxy Sanctuary',
    station: 22,
    missionSector: 'Sector 22: Obsidian Plateau',
    sound: '/r/',
    soundSpoken: 'rrr',
    prompt: 'Which animal friend starts with the sound /r/?',
    correct: '🦏',
    correctName: 'Rhino',
    label: 'rhino',
    emoji: '🦏',
    options: [
      { emoji: '🦏', name: 'Rhino' },
      { emoji: '🐘', name: 'Elephant' },
      { emoji: '🦛', name: 'Hippo' },
    ],
    hint: 'Listen for /r/... like a strong rhino 🦏!',
  },
  {
    id: 'cosmic-safari-23',
    level: 23,
    stage: 5,
    stageName: 'Galaxy Sanctuary',
    station: 23,
    missionSector: 'Sector 23: Lunar Summit',
    sound: '/w/',
    soundSpoken: 'wuh',
    prompt: 'Which animal friend starts with the sound /w/?',
    correct: '🐺',
    correctName: 'Wolf',
    label: 'wolf',
    emoji: '🐺',
    options: [
      { emoji: '🐺', name: 'Wolf' },
      { emoji: '🦊', name: 'Fox' },
      { emoji: '🐶', name: 'Dog' },
    ],
    hint: 'Listen for /w/... like a howling wolf 🐺!',
  },
  {
    id: 'cosmic-safari-24',
    level: 24,
    stage: 5,
    stageName: 'Galaxy Sanctuary',
    station: 24,
    missionSector: 'Sector 24: Celestial Cliff',
    sound: '/ee/',
    soundSpoken: 'eee',
    prompt: 'Which bird friend starts with the long sound /ee/?',
    correct: '🦅',
    correctName: 'Eagle',
    label: 'eagle',
    emoji: '🦅',
    options: [
      { emoji: '🦅', name: 'Eagle' },
      { emoji: '🦉', name: 'Owl' },
      { emoji: '🦜', name: 'Parrot' },
    ],
    hint: 'Listen for /ee/... like a soaring eagle 🦅!',
  },
  {
    id: 'cosmic-safari-25',
    level: 25,
    stage: 5,
    stageName: 'Galaxy Sanctuary',
    station: 25,
    missionSector: 'Sector 25: Galaxy Crown',
    sound: '/ow/',
    soundSpoken: 'ow',
    prompt: 'Which wise bird friend starts with the sound /ow/?',
    correct: '🦉',
    correctName: 'Owl',
    label: 'owl',
    emoji: '🦉',
    options: [
      { emoji: '🦉', name: 'Owl' },
      { emoji: '🦆', name: 'Duck' },
      { emoji: '🦚', name: 'Peacock' },
    ],
    hint: 'Listen for /ow/... like a wise old owl 🦉!',
  },
];

/**
 * Shuffles an array of options using the Fisher-Yates algorithm.
 * Accepts an optional custom random function (defaults to Math.random).
 * Never mutates the original array.
 */
export function shuffleOptions(options, randomFn = Math.random) {
  if (!Array.isArray(options) || options.length <= 1) {
    return options ? [...options] : [];
  }
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Returns a new round object with its options shuffled.
 * Preserves all metadata, question text, phoneme audio, and correct answers.
 */
export function getShuffledRound(round, randomFn = Math.random) {
  if (!round || !Array.isArray(round.options)) return round;
  return {
    ...round,
    shuffledOptions: shuffleOptions(round.options, randomFn),
  };
}

/**
 * Returns a new 25-level curriculum array with options shuffled for every round.
 */
export function getShuffledCurriculum(randomFn = Math.random) {
  return COSMIC_SAFARI_CURRICULUM.map((round) => getShuffledRound(round, randomFn));
}

// Modular letter/word learning content.
// Designed so this can later be swapped for LexiGuide's backend content API.
// Each entry: letter, phonetic sound hint, target word, emoji (stand-in for image asset), difficulty tier.

export const LETTER_CONTENT = [
  { letter: 'A', sound: '/a/', word: 'APPLE', emoji: '🍎', difficulty: 1 },
  { letter: 'B', sound: '/b/', word: 'BALL', emoji: '⚽', difficulty: 1 },
  { letter: 'C', sound: '/c/', word: 'CAT', emoji: '🐱', difficulty: 1 },
  { letter: 'D', sound: '/d/', word: 'DOG', emoji: '🐶', difficulty: 1 },
  { letter: 'E', sound: '/e/', word: 'EGG', emoji: '🥚', difficulty: 1 },
  { letter: 'F', sound: '/f/', word: 'FISH', emoji: '🐟', difficulty: 1 },
  { letter: 'G', sound: '/g/', word: 'GOAT', emoji: '🐐', difficulty: 2 },
  { letter: 'H', sound: '/h/', word: 'HAT', emoji: '🎩', difficulty: 1 },
  { letter: 'I', sound: '/i/', word: 'ICE', emoji: '🧊', difficulty: 2 },
  { letter: 'J', sound: '/j/', word: 'JAM', emoji: '🍯', difficulty: 2 },
  { letter: 'K', sound: '/k/', word: 'KITE', emoji: '🪁', difficulty: 2 },
  { letter: 'L', sound: '/l/', word: 'LEMON', emoji: '🍋', difficulty: 2 },
  { letter: 'M', sound: '/m/', word: 'MOON', emoji: '🌙', difficulty: 1 },
  { letter: 'N', sound: '/n/', word: 'NEST', emoji: '🪺', difficulty: 2 },
  { letter: 'O', sound: '/o/', word: 'ORANGE', emoji: '🍊', difficulty: 2 },
  { letter: 'P', sound: '/p/', word: 'PIG', emoji: '🐷', difficulty: 1 },
  { letter: 'Q', sound: '/qu/', word: 'QUEEN', emoji: '👑', difficulty: 3 },
  { letter: 'R', sound: '/r/', word: 'RAIN', emoji: '🌧️', difficulty: 2 },
  { letter: 'S', sound: '/s/', word: 'SUN', emoji: '☀️', difficulty: 1 },
  { letter: 'T', sound: '/t/', word: 'TREE', emoji: '🌳', difficulty: 1 },
  { letter: 'U', sound: '/u/', word: 'UMBRELLA', emoji: '☂️', difficulty: 3 },
  { letter: 'V', sound: '/v/', word: 'VAN', emoji: '🚐', difficulty: 2 },
  { letter: 'W', sound: '/w/', word: 'WATER', emoji: '💧', difficulty: 2 },
  { letter: 'X', sound: '/ks/', word: 'BOX', emoji: '📦', difficulty: 3 },
  { letter: 'Y', sound: '/y/', word: 'YARN', emoji: '🧶', difficulty: 3 },
  { letter: 'Z', sound: '/z/', word: 'ZEBRA', emoji: '🦓', difficulty: 2 },
];

export const LETTER_MAP = Object.fromEntries(LETTER_CONTENT.map((l) => [l.letter, l]));

// Simple 3-letter and 4-letter words used for word-building challenges.
export const WORD_BANK = [
  { word: 'CAT', emoji: '🐱', difficulty: 1 },
  { word: 'DOG', emoji: '🐶', difficulty: 1 },
  { word: 'SUN', emoji: '☀️', difficulty: 1 },
  { word: 'HAT', emoji: '🎩', difficulty: 1 },
  { word: 'PIG', emoji: '🐷', difficulty: 1 },
  { word: 'BAT', emoji: '🦇', difficulty: 2 },
  { word: 'MAP', emoji: '🗺️', difficulty: 2 },
  { word: 'BOOK', emoji: '📖', difficulty: 3 },
  { word: 'STAR', emoji: '⭐', difficulty: 3 },
  { word: 'SHIP', emoji: '🚢', difficulty: 3 },
  { word: 'SCHOOL', emoji: '🏫', difficulty: 4 },
];

export function getLettersByDifficulty(maxDifficulty = 1) {
  return LETTER_CONTENT.filter((l) => l.difficulty <= maxDifficulty);
}

export function getRandomLetter(maxDifficulty = 1, exclude = []) {
  const pool = getLettersByDifficulty(maxDifficulty).filter((l) => !exclude.includes(l.letter));
  const source = pool.length ? pool : getLettersByDifficulty(maxDifficulty);
  return source[Math.floor(Math.random() * source.length)];
}

export function getRandomWord(maxDifficulty = 1) {
  const pool = WORD_BANK.filter((w) => w.difficulty <= maxDifficulty);
  const source = pool.length ? pool : WORD_BANK;
  return source[Math.floor(Math.random() * source.length)];
}

export const SAFARI_WORD_QUESTS = [
  { word: 'APPLE', emoji: '🍎', blankIndex: 3, meaning: 'Crisp and sweet red fruit' }, // APP_E -> L
  { word: 'LION', emoji: '🦁', blankIndex: 1, meaning: 'King of the safari savanna' }, // L_ON -> I
  { word: 'ZEBRA', emoji: '🦓', blankIndex: 1, meaning: 'Striped safari runner' }, // Z_BRA -> E
  { word: 'SUN', emoji: '☀️', blankIndex: 1, meaning: 'Bright morning star' }, // S_N -> U
  { word: 'TIGER', emoji: '🐯', blankIndex: 1, meaning: 'Majestic jungle cat' }, // T_GER -> I
  { word: 'MONKEY', emoji: '🐒', blankIndex: 1, meaning: 'Playful tree climber' }, // M_NKEY -> O
  { word: 'TREE', emoji: '🌳', blankIndex: 1, meaning: 'Tall jungle canopy' }, // T_EE -> R
  { word: 'FROG', emoji: '🐸', blankIndex: 1, meaning: 'Green lilypad jumper' }, // F_OG -> R
  { word: 'WATER', emoji: '💧', blankIndex: 2, meaning: 'Cool jungle river' }, // WA_ER -> T
  { word: 'BIRD', emoji: '🦜', blankIndex: 2, meaning: 'Colorful sky flyer' }, // BI_D -> R
  { word: 'CAT', emoji: '🐱', blankIndex: 1, meaning: 'Curious friendly pet' }, // C_T -> A
  { word: 'BOOK', emoji: '📖', blankIndex: 2, meaning: 'Magical story pages' }, // BO_K -> O
];

export function generateFillInBlankQuest(index = 0) {
  const quest = SAFARI_WORD_QUESTS[index % SAFARI_WORD_QUESTS.length];
  const word = quest.word;
  const blankIndex = quest.blankIndex ?? Math.floor(Math.random() * word.length);
  const missingLetter = word[blankIndex];
  const masked = word.split('').map((char, i) => (i === blankIndex ? '_' : char)).join('');
  return {
    word,
    masked,
    missingLetter,
    missingIndex: blankIndex,
    emoji: quest.emoji,
    meaning: quest.meaning,
  };
}


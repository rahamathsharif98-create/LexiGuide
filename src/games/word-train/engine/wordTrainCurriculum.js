/**
 * Word Train Phonics Curriculum
 * 
 * 50 progressive spelling levels organized into 5 developmental stations (10 levels each).
 * Designed for early childhood phonics mastery, advancing from 3-letter CVC short vowels
 * up to 6–7-letter vocabulary challenge words.
 *
 * Each level defines:
 * - id: unique string identifier
 * - level: 1-based level index (1 to 50)
 * - station: station number (1 to 5)
 * - stationName: friendly title of the station
 * - word: target uppercase spelling word
 * - image: child-friendly visual emoji
 * - letters: matching uppercase character array
 * - scrambled: valid non-identical permutation of the letters
 * - hint: contextual pedagogical prompt
 * - prompt: audio/text instructions
 */

export const TOTAL_WORD_TRAIN_LEVELS = 50;
export const TOTAL_WORD_TRAIN_STATIONS = 5;
export const LEVELS_PER_STATION = 10;

export const WORD_TRAIN_STATIONS = [
  {
    station: 1,
    title: 'Station 1: 3-Letter Short Vowels',
    shortTitle: 'Short Vowels',
    levelRange: [1, 10],
    badge: '🌱',
    themeColor: '#13CFE3',
    description: 'Spell 3-letter short-vowel words to get the engine running!',
  },
  {
    station: 2,
    title: 'Station 2: 4-Letter Blends & Digraphs',
    shortTitle: 'Blends & Digraphs',
    levelRange: [11, 20],
    badge: '🌿',
    themeColor: '#34D399',
    description: 'Load carriages with consonant blends like FR, CR, ST, and SH!',
  },
  {
    station: 3,
    title: 'Station 3: 4-Letter Long Vowels & Teams',
    shortTitle: 'Long Vowels',
    levelRange: [21, 30],
    badge: '⭐',
    themeColor: '#FBBF24',
    description: 'Master silent-E and vowel teams like EE, OO, AI, and EA!',
  },
  {
    station: 4,
    title: 'Station 4: 5-Letter High-Frequency Words',
    shortTitle: '5-Letter Words',
    levelRange: [31, 40],
    badge: '🚂',
    themeColor: '#FB7185',
    description: 'Spell exciting 5-letter words with double consonants and blends!',
  },
  {
    station: 5,
    title: 'Station 5: 6–7-Letter Conductor Challenge',
    shortTitle: 'Conductor Challenge',
    levelRange: [41, 50],
    badge: '👑',
    themeColor: '#A855F7',
    description: 'The ultimate train journey! Spell 6 to 7-letter challenge words!',
  },
];

export const WORD_TRAIN_CURRICULUM = [
  // ───────────────────────────────────────────────────────────────────────────
  // Station 1: 3-Letter Short Vowels (Levels 1–10)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'train-level-1-cat',
    level: 1,
    station: 1,
    stationName: 'Station 1: 3-Letter Short Vowels',
    word: 'CAT',
    image: '🐱',
    letters: ['C', 'A', 'T'],
    scrambled: ['T', 'C', 'A'],
    hint: 'A friendly furry pet that purrs',
    prompt: 'Spell CAT by loading the letter carriages!',
  },
  {
    id: 'train-level-2-dog',
    level: 2,
    station: 1,
    stationName: 'Station 1: 3-Letter Short Vowels',
    word: 'DOG',
    image: '🐶',
    letters: ['D', 'O', 'G'],
    scrambled: ['G', 'D', 'O'],
    hint: 'A playful pet that barks and wags its tail',
    prompt: 'Spell DOG by loading the letter carriages!',
  },
  {
    id: 'train-level-3-bus',
    level: 3,
    station: 1,
    stationName: 'Station 1: 3-Letter Short Vowels',
    word: 'BUS',
    image: '🚌',
    letters: ['B', 'U', 'S'],
    scrambled: ['S', 'B', 'U'],
    hint: 'A big yellow vehicle that takes children to school',
    prompt: 'Spell BUS by loading the letter carriages!',
  },
  {
    id: 'train-level-4-sun',
    level: 4,
    station: 1,
    stationName: 'Station 1: 3-Letter Short Vowels',
    word: 'SUN',
    image: '☀️',
    letters: ['S', 'U', 'N'],
    scrambled: ['U', 'S', 'N'],
    hint: 'The bright warm star shining in the daytime sky',
    prompt: 'Spell SUN by loading the letter carriages!',
  },
  {
    id: 'train-level-5-pig',
    level: 5,
    station: 1,
    stationName: 'Station 1: 3-Letter Short Vowels',
    word: 'PIG',
    image: '🐷',
    letters: ['P', 'I', 'G'],
    scrambled: ['G', 'P', 'I'],
    hint: 'A cheerful pink farm animal with a curly tail',
    prompt: 'Spell PIG by loading the letter carriages!',
  },
  {
    id: 'train-level-6-fox',
    level: 6,
    station: 1,
    stationName: 'Station 1: 3-Letter Short Vowels',
    word: 'FOX',
    image: '🦊',
    letters: ['F', 'O', 'X'],
    scrambled: ['X', 'F', 'O'],
    hint: 'A clever woodland creature with an orange coat',
    prompt: 'Spell FOX by loading the letter carriages!',
  },
  {
    id: 'train-level-7-hat',
    level: 7,
    station: 1,
    stationName: 'Station 1: 3-Letter Short Vowels',
    word: 'HAT',
    image: '🎩',
    letters: ['H', 'A', 'T'],
    scrambled: ['T', 'H', 'A'],
    hint: 'Something stylish you wear on your head',
    prompt: 'Spell HAT by loading the letter carriages!',
  },
  {
    id: 'train-level-8-bed',
    level: 8,
    station: 1,
    stationName: 'Station 1: 3-Letter Short Vowels',
    word: 'BED',
    image: '🛏️',
    letters: ['B', 'E', 'D'],
    scrambled: ['D', 'B', 'E'],
    hint: 'A cozy comfy place where you sleep and dream',
    prompt: 'Spell BED by loading the letter carriages!',
  },
  {
    id: 'train-level-9-cup',
    level: 9,
    station: 1,
    stationName: 'Station 1: 3-Letter Short Vowels',
    word: 'CUP',
    image: '☕',
    letters: ['C', 'U', 'P'],
    scrambled: ['P', 'C', 'U'],
    hint: 'A small mug for drinking warm milk or cocoa',
    prompt: 'Spell CUP by loading the letter carriages!',
  },
  {
    id: 'train-level-10-van',
    level: 10,
    station: 1,
    stationName: 'Station 1: 3-Letter Short Vowels',
    word: 'VAN',
    image: '🚐',
    letters: ['V', 'A', 'N'],
    scrambled: ['N', 'V', 'A'],
    hint: 'A family vehicle for traveling on road trips',
    prompt: 'Spell VAN by loading the letter carriages!',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Station 2: 4-Letter Blends & Digraphs (Levels 11–20)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'train-level-11-frog',
    level: 11,
    station: 2,
    stationName: 'Station 2: 4-Letter Blends & Digraphs',
    word: 'FROG',
    image: '🐸',
    letters: ['F', 'R', 'O', 'G'],
    scrambled: ['G', 'F', 'R', 'O'],
    hint: 'A green amphibious hopper that says ribbit',
    prompt: 'Spell FROG by loading the letter carriages!',
  },
  {
    id: 'train-level-12-crab',
    level: 12,
    station: 2,
    stationName: 'Station 2: 4-Letter Blends & Digraphs',
    word: 'CRAB',
    image: '🦀',
    letters: ['C', 'R', 'A', 'B'],
    scrambled: ['B', 'C', 'R', 'A'],
    hint: 'A seaside creature with pinchers and a shell',
    prompt: 'Spell CRAB by loading the letter carriages!',
  },
  {
    id: 'train-level-13-drum',
    level: 13,
    station: 2,
    stationName: 'Station 2: 4-Letter Blends & Digraphs',
    word: 'DRUM',
    image: '🥁',
    letters: ['D', 'R', 'U', 'M'],
    scrambled: ['M', 'D', 'R', 'U'],
    hint: 'A musical instrument you tap with drumsticks',
    prompt: 'Spell DRUM by loading the letter carriages!',
  },
  {
    id: 'train-level-14-star',
    level: 14,
    station: 2,
    stationName: 'Station 2: 4-Letter Blends & Digraphs',
    word: 'STAR',
    image: '⭐',
    letters: ['S', 'T', 'A', 'R'],
    scrambled: ['R', 'S', 'T', 'A'],
    hint: 'A twinkling celestial light high in the night sky',
    prompt: 'Spell STAR by loading the letter carriages!',
  },
  {
    id: 'train-level-15-nest',
    level: 15,
    station: 2,
    stationName: 'Station 2: 4-Letter Blends & Digraphs',
    word: 'NEST',
    image: '🪹',
    letters: ['N', 'E', 'S', 'T'],
    scrambled: ['T', 'N', 'E', 'S'],
    hint: 'A snug home woven from twigs where bird eggs hatch',
    prompt: 'Spell NEST by loading the letter carriages!',
  },
  {
    id: 'train-level-16-duck',
    level: 16,
    station: 2,
    stationName: 'Station 2: 4-Letter Blends & Digraphs',
    word: 'DUCK',
    image: '🦆',
    letters: ['D', 'U', 'C', 'K'],
    scrambled: ['K', 'D', 'U', 'C'],
    hint: 'A feathered pond swimmer that quacks',
    prompt: 'Spell DUCK by loading the letter carriages!',
  },
  {
    id: 'train-level-17-flag',
    level: 17,
    station: 2,
    stationName: 'Station 2: 4-Letter Blends & Digraphs',
    word: 'FLAG',
    image: '🚩',
    letters: ['F', 'L', 'A', 'G'],
    scrambled: ['G', 'F', 'L', 'A'],
    hint: 'A colorful banner waving proudly in the breeze',
    prompt: 'Spell FLAG by loading the letter carriages!',
  },
  {
    id: 'train-level-18-fish',
    level: 18,
    station: 2,
    stationName: 'Station 2: 4-Letter Blends & Digraphs',
    word: 'FISH',
    image: '🐟',
    letters: ['F', 'I', 'S', 'H'],
    scrambled: ['H', 'F', 'I', 'S'],
    hint: 'An ocean swimmer with shimmering scales and fins',
    prompt: 'Spell FISH by loading the letter carriages!',
  },
  {
    id: 'train-level-19-bell',
    level: 19,
    station: 2,
    stationName: 'Station 2: 4-Letter Blends & Digraphs',
    word: 'BELL',
    image: '🔔',
    letters: ['B', 'E', 'L', 'L'],
    scrambled: ['L', 'B', 'L', 'E'],
    hint: 'A shiny brass instrument that rings ding-dong',
    prompt: 'Spell BELL by loading the letter carriages!',
  },
  {
    id: 'train-level-20-ship',
    level: 20,
    station: 2,
    stationName: 'Station 2: 4-Letter Blends & Digraphs',
    word: 'SHIP',
    image: '🚢',
    letters: ['S', 'H', 'I', 'P'],
    scrambled: ['P', 'S', 'H', 'I'],
    hint: 'A grand ocean vessel sailing across deep waters',
    prompt: 'Spell SHIP by loading the letter carriages!',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Station 3: 4-Letter Long Vowels & Teams (Levels 21–30)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'train-level-21-cake',
    level: 21,
    station: 3,
    stationName: 'Station 3: 4-Letter Long Vowels & Teams',
    word: 'CAKE',
    image: '🎂',
    letters: ['C', 'A', 'K', 'E'],
    scrambled: ['E', 'C', 'A', 'K'],
    hint: 'A frosted sweet pastry decorated with candles',
    prompt: 'Spell CAKE by loading the letter carriages!',
  },
  {
    id: 'train-level-22-bird',
    level: 22,
    station: 3,
    stationName: 'Station 3: 4-Letter Long Vowels & Teams',
    word: 'BIRD',
    image: '🐦',
    letters: ['B', 'I', 'R', 'D'],
    scrambled: ['D', 'B', 'I', 'R'],
    hint: 'A winged feathered singer that flies among trees',
    prompt: 'Spell BIRD by loading the letter carriages!',
  },
  {
    id: 'train-level-23-moon',
    level: 23,
    station: 3,
    stationName: 'Station 3: 4-Letter Long Vowels & Teams',
    word: 'MOON',
    image: '🌙',
    letters: ['M', 'O', 'O', 'N'],
    scrambled: ['N', 'O', 'M', 'O'],
    hint: 'A glowing silver orb orbiting Earth in nighttime skies',
    prompt: 'Spell MOON by loading the letter carriages!',
  },
  {
    id: 'train-level-24-rose',
    level: 24,
    station: 3,
    stationName: 'Station 3: 4-Letter Long Vowels & Teams',
    word: 'ROSE',
    image: '🌹',
    letters: ['R', 'O', 'S', 'E'],
    scrambled: ['E', 'R', 'O', 'S'],
    hint: 'A lovely garden blossom with fragrant crimson petals',
    prompt: 'Spell ROSE by loading the letter carriages!',
  },
  {
    id: 'train-level-25-kite',
    level: 25,
    station: 3,
    stationName: 'Station 3: 4-Letter Long Vowels & Teams',
    word: 'KITE',
    image: '🪁',
    letters: ['K', 'I', 'T', 'E'],
    scrambled: ['E', 'K', 'I', 'T'],
    hint: 'A light diamond flyer dancing high on a string',
    prompt: 'Spell KITE by loading the letter carriages!',
  },
  {
    id: 'train-level-26-boat',
    level: 26,
    station: 3,
    stationName: 'Station 3: 4-Letter Long Vowels & Teams',
    word: 'BOAT',
    image: '⛵',
    letters: ['B', 'O', 'A', 'T'],
    scrambled: ['T', 'B', 'O', 'A'],
    hint: 'A small floating watercraft with sails or oars',
    prompt: 'Spell BOAT by loading the letter carriages!',
  },
  {
    id: 'train-level-27-tree',
    level: 27,
    station: 3,
    stationName: 'Station 3: 4-Letter Long Vowels & Teams',
    word: 'TREE',
    image: '🌳',
    letters: ['T', 'R', 'E', 'E'],
    scrambled: ['E', 'T', 'E', 'R'],
    hint: 'A tall woody plant with spreading leafy branches',
    prompt: 'Spell TREE by loading the letter carriages!',
  },
  {
    id: 'train-level-28-leaf',
    level: 28,
    station: 3,
    stationName: 'Station 3: 4-Letter Long Vowels & Teams',
    word: 'LEAF',
    image: '🍃',
    letters: ['L', 'E', 'A', 'F'],
    scrambled: ['F', 'L', 'E', 'A'],
    hint: 'A green blade growing on trees that flutters in wind',
    prompt: 'Spell LEAF by loading the letter carriages!',
  },
  {
    id: 'train-level-29-rain',
    level: 29,
    station: 3,
    stationName: 'Station 3: 4-Letter Long Vowels & Teams',
    word: 'RAIN',
    image: '🌧️',
    letters: ['R', 'A', 'I', 'N'],
    scrambled: ['N', 'R', 'A', 'I'],
    hint: 'Cool refreshing water drops falling from gray clouds',
    prompt: 'Spell RAIN by loading the letter carriages!',
  },
  {
    id: 'train-level-30-snow',
    level: 30,
    station: 3,
    stationName: 'Station 3: 4-Letter Long Vowels & Teams',
    word: 'SNOW',
    image: '❄️',
    letters: ['S', 'N', 'O', 'W'],
    scrambled: ['W', 'S', 'N', 'O'],
    hint: 'Fluffy white winter crystals falling softly from above',
    prompt: 'Spell SNOW by loading the letter carriages!',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Station 4: 5-Letter High-Frequency Words (Levels 31–40)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'train-level-31-train',
    level: 31,
    station: 4,
    stationName: 'Station 4: 5-Letter High-Frequency Words',
    word: 'TRAIN',
    image: '🚂',
    letters: ['T', 'R', 'A', 'I', 'N'],
    scrambled: ['N', 'T', 'R', 'A', 'I'],
    hint: 'An engine pulling letter carriages down the railway track',
    prompt: 'Spell TRAIN by loading the letter carriages!',
  },
  {
    id: 'train-level-32-plant',
    level: 32,
    station: 4,
    stationName: 'Station 4: 5-Letter High-Frequency Words',
    word: 'PLANT',
    image: '🪴',
    letters: ['P', 'L', 'A', 'N', 'T'],
    scrambled: ['T', 'P', 'L', 'A', 'N'],
    hint: 'A green living sprout growing in a garden flowerpot',
    prompt: 'Spell PLANT by loading the letter carriages!',
  },
  {
    id: 'train-level-33-clock',
    level: 33,
    station: 4,
    stationName: 'Station 4: 5-Letter High-Frequency Words',
    word: 'CLOCK',
    image: '⏰',
    letters: ['C', 'L', 'O', 'C', 'K'],
    scrambled: ['K', 'C', 'L', 'O', 'C'],
    hint: 'A timepiece on the wall with ticking hands and numbers',
    prompt: 'Spell CLOCK by loading the letter carriages!',
  },
  {
    id: 'train-level-34-smile',
    level: 34,
    station: 4,
    stationName: 'Station 4: 5-Letter High-Frequency Words',
    word: 'SMILE',
    image: '😊',
    letters: ['S', 'M', 'I', 'L', 'E'],
    scrambled: ['E', 'S', 'M', 'I', 'L'],
    hint: 'A joyful happy grin lighting up your face',
    prompt: 'Spell SMILE by loading the letter carriages!',
  },
  {
    id: 'train-level-35-sheep',
    level: 35,
    station: 4,
    stationName: 'Station 4: 5-Letter High-Frequency Words',
    word: 'SHEEP',
    image: '🐑',
    letters: ['S', 'H', 'E', 'E', 'P'],
    scrambled: ['P', 'E', 'S', 'H', 'E'],
    hint: 'A woolly gentle farm animal that says baa',
    prompt: 'Spell SHEEP by loading the letter carriages!',
  },
  {
    id: 'train-level-36-apple',
    level: 36,
    station: 4,
    stationName: 'Station 4: 5-Letter High-Frequency Words',
    word: 'APPLE',
    image: '🍎',
    letters: ['A', 'P', 'P', 'L', 'E'],
    scrambled: ['E', 'P', 'A', 'L', 'P'],
    hint: 'A crisp sweet red orchard fruit that keeps the doctor away',
    prompt: 'Spell APPLE by loading the letter carriages!',
  },
  {
    id: 'train-level-37-house',
    level: 37,
    station: 4,
    stationName: 'Station 4: 5-Letter High-Frequency Words',
    word: 'HOUSE',
    image: '🏠',
    letters: ['H', 'O', 'U', 'S', 'E'],
    scrambled: ['E', 'H', 'O', 'U', 'S'],
    hint: 'A warm cozy home with a roof and rooms for families',
    prompt: 'Spell HOUSE by loading the letter carriages!',
  },
  {
    id: 'train-level-38-bread',
    level: 38,
    station: 4,
    stationName: 'Station 4: 5-Letter High-Frequency Words',
    word: 'BREAD',
    image: '🍞',
    letters: ['B', 'R', 'E', 'A', 'D'],
    scrambled: ['D', 'B', 'R', 'E', 'A'],
    hint: 'A delicious bakery loaf baked from wheat and dough',
    prompt: 'Spell BREAD by loading the letter carriages!',
  },
  {
    id: 'train-level-39-heart',
    level: 39,
    station: 4,
    stationName: 'Station 4: 5-Letter High-Frequency Words',
    word: 'HEART',
    image: '❤️',
    letters: ['H', 'E', 'A', 'R', 'T'],
    scrambled: ['T', 'H', 'E', 'A', 'R'],
    hint: 'A glowing symbol of kindness, friendship, and love',
    prompt: 'Spell HEART by loading the letter carriages!',
  },
  {
    id: 'train-level-40-tiger',
    level: 40,
    station: 4,
    stationName: 'Station 4: 5-Letter High-Frequency Words',
    word: 'TIGER',
    image: '🐯',
    letters: ['T', 'I', 'G', 'E', 'R'],
    scrambled: ['R', 'T', 'I', 'G', 'E'],
    hint: 'A magnificent striped wildcat roaming through the jungle',
    prompt: 'Spell TIGER by loading the letter carriages!',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Station 5: 6–7-Letter Conductor Challenge (Levels 41–50)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'train-level-41-rocket',
    level: 41,
    station: 5,
    stationName: 'Station 5: 6–7-Letter Conductor Challenge',
    word: 'ROCKET',
    image: '🚀',
    letters: ['R', 'O', 'C', 'K', 'E', 'T'],
    scrambled: ['T', 'R', 'O', 'C', 'K', 'E'],
    hint: 'A sleek spacecraft blasting off into the starry cosmos',
    prompt: 'Spell ROCKET by loading the letter carriages!',
  },
  {
    id: 'train-level-42-monkey',
    level: 42,
    station: 5,
    stationName: 'Station 5: 6–7-Letter Conductor Challenge',
    word: 'MONKEY',
    image: '🐵',
    letters: ['M', 'O', 'N', 'K', 'E', 'Y'],
    scrambled: ['Y', 'M', 'O', 'N', 'K', 'E'],
    hint: 'A playful smiling animal swinging through treetop branches',
    prompt: 'Spell MONKEY by loading the letter carriages!',
  },
  {
    id: 'train-level-43-pencil',
    level: 43,
    station: 5,
    stationName: 'Station 5: 6–7-Letter Conductor Challenge',
    word: 'PENCIL',
    image: '✏️',
    letters: ['P', 'E', 'N', 'C', 'I', 'L'],
    scrambled: ['L', 'P', 'E', 'N', 'C', 'I'],
    hint: 'A handy writing tool you use to draw and write letters',
    prompt: 'Spell PENCIL by loading the letter carriages!',
  },
  {
    id: 'train-level-44-flower',
    level: 44,
    station: 5,
    stationName: 'Station 5: 6–7-Letter Conductor Challenge',
    word: 'FLOWER',
    image: '🌸',
    letters: ['F', 'L', 'O', 'W', 'E', 'R'],
    scrambled: ['R', 'F', 'L', 'O', 'W', 'E'],
    hint: 'A vibrant garden bloom with sweet-scented petals',
    prompt: 'Spell FLOWER by loading the letter carriages!',
  },
  {
    id: 'train-level-45-turtle',
    level: 45,
    station: 5,
    stationName: 'Station 5: 6–7-Letter Conductor Challenge',
    word: 'TURTLE',
    image: '🐢',
    letters: ['T', 'U', 'R', 'T', 'L', 'E'],
    scrambled: ['E', 'T', 'R', 'U', 'T', 'L'],
    hint: 'A patient gentle reptile carrying a protective shell',
    prompt: 'Spell TURTLE by loading the letter carriages!',
  },
  {
    id: 'train-level-46-dragon',
    level: 46,
    station: 5,
    stationName: 'Station 5: 6–7-Letter Conductor Challenge',
    word: 'DRAGON',
    image: '🐉',
    letters: ['D', 'R', 'A', 'G', 'O', 'N'],
    scrambled: ['N', 'D', 'R', 'A', 'G', 'O'],
    hint: 'A legendary winged beast soaring above castles',
    prompt: 'Spell DRAGON by loading the letter carriages!',
  },
  {
    id: 'train-level-47-planet',
    level: 47,
    station: 5,
    stationName: 'Station 5: 6–7-Letter Conductor Challenge',
    word: 'PLANET',
    image: '🪐',
    letters: ['P', 'L', 'A', 'N', 'E', 'T'],
    scrambled: ['T', 'P', 'L', 'A', 'N', 'E'],
    hint: 'A massive celestial body with rings orbiting the sun',
    prompt: 'Spell PLANET by loading the letter carriages!',
  },
  {
    id: 'train-level-48-castle',
    level: 48,
    station: 5,
    stationName: 'Station 5: 6–7-Letter Conductor Challenge',
    word: 'CASTLE',
    image: '🏰',
    letters: ['C', 'A', 'S', 'T', 'L', 'E'],
    scrambled: ['E', 'C', 'A', 'S', 'T', 'L'],
    hint: 'A grand royal stone fortress with high battlements and towers',
    prompt: 'Spell CASTLE by loading the letter carriages!',
  },
  {
    id: 'train-level-49-guitar',
    level: 49,
    station: 5,
    stationName: 'Station 5: 6–7-Letter Conductor Challenge',
    word: 'GUITAR',
    image: '🎸',
    letters: ['G', 'U', 'I', 'T', 'A', 'R'],
    scrambled: ['R', 'G', 'U', 'I', 'T', 'A'],
    hint: 'A wooden instrument with six strings you pluck and strum',
    prompt: 'Spell GUITAR by loading the letter carriages!',
  },
  {
    id: 'train-level-50-rainbow',
    level: 50,
    station: 5,
    stationName: 'Station 5: 6–7-Letter Conductor Challenge',
    word: 'RAINBOW',
    image: '🌈',
    letters: ['R', 'A', 'I', 'N', 'B', 'O', 'W'],
    scrambled: ['W', 'R', 'A', 'I', 'N', 'B', 'O'],
    hint: 'A magical arc of seven vibrant colors spanning across the sky',
    prompt: 'Spell RAINBOW by loading the letter carriages!',
  },
];

/**
 * Returns a level from the curriculum by 0-based index or 1-based level number.
 * Clamps safely within valid range [0, 49].
 */
export function getWordTrainLevel(indexOrLevel = 0) {
  let idx = indexOrLevel;
  if (idx >= 1 && idx <= TOTAL_WORD_TRAIN_LEVELS) {
    // Treated as 1-based level
    idx = idx - 1;
  }
  const safeIdx = Math.max(0, Math.min(idx, TOTAL_WORD_TRAIN_LEVELS - 1));
  return WORD_TRAIN_CURRICULUM[safeIdx];
}

/**
 * Returns station metadata for a given level (1-50) or station index (1-5).
 */
export function getWordTrainStation(stationNumber = 1) {
  const safeStation = Math.max(1, Math.min(stationNumber, TOTAL_WORD_TRAIN_STATIONS));
  return WORD_TRAIN_STATIONS[safeStation - 1];
}

/**
 * Returns all 10 levels belonging to a specified station (1 to 5).
 */
export function getLevelsForStation(stationNumber = 1) {
  const safeStation = Math.max(1, Math.min(stationNumber, TOTAL_WORD_TRAIN_STATIONS));
  return WORD_TRAIN_CURRICULUM.filter((lvl) => lvl.station === safeStation);
}

/**
 * Validates a level data object to guarantee curriculum integrity:
 * - Matching uppercase string word
 * - Valid emoji image
 * - Exact matching letters array
 * - Multi-set identical scrambled letters array
 * - Scrambled is NOT already equal to target word
 */
export function validateCurriculumLevel(item) {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.word !== 'string' || item.word.length < 2) return false;
  if (typeof item.image !== 'string' || item.image.trim().length === 0) return false;
  if (!Array.isArray(item.letters) || item.letters.length !== item.word.length) return false;
  if (!Array.isArray(item.scrambled) || item.scrambled.length !== item.word.length) return false;

  // Letters match word characters exactly
  if (item.letters.join('') !== item.word) return false;

  // Scrambled letters must NOT be in the solved order
  if (item.scrambled.join('') === item.word) return false;

  // Multiset equality (same characters and duplicate counts)
  const sortedLetters = [...item.letters].sort().join('');
  const sortedScrambled = [...item.scrambled].sort().join('');
  if (sortedLetters !== sortedScrambled) return false;

  return true;
}

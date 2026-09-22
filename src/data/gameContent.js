// Per-game content banks. Each item is one "round".
export const GAME_CONTENT = {
  // 1. SOUND SAFARI (Original)
  'match-sound': [
    { sound: '/k/', emoji: '🔊', correct: '🐱', options: ['🐱', '🐶', '🐟'], label: 'cat' },
    { sound: '/sh/', emoji: '🔊', correct: '🐑', options: ['🐑', '🐮', '🐷'], label: 'sheep' },
    { sound: '/b/', emoji: '🔊', correct: '🐻', options: ['🐝', '🐻', '🦋'], label: 'bear' },
    { sound: '/f/', emoji: '🔊', correct: '🐸', options: ['🐸', '🐦', '🐍'], label: 'frog' },
  ],

  // 2. SOUND HUNT (Section 11)
  'sound-hunt': [
    { letter: 'B', sound: '/b/', soundSpoken: 'buh', prompt: 'Which picture starts with B?', correct: '⚽', correctName: 'Ball', options: [{ emoji: '🐱', name: 'Cat' }, { emoji: '⚽', name: 'Ball' }, { emoji: '🍎', name: 'Apple' }] },
    { letter: 'S', sound: '/s/', soundSpoken: 'sss', prompt: 'Which picture starts with S?', correct: '☀️', correctName: 'Sun', options: [{ emoji: '☀️', name: 'Sun' }, { emoji: '🚗', name: 'Car' }, { emoji: '🐸', name: 'Frog' }] },
    { letter: 'M', sound: '/m/', soundSpoken: 'mmm', prompt: 'Which picture starts with M?', correct: '🌙', correctName: 'Moon', options: [{ emoji: '🐟', name: 'Fish' }, { emoji: '🌙', name: 'Moon' }, { emoji: '🐶', name: 'Dog' }] },
  ],

  // 3. SOUND MATCH (Section 16)
  'sound-match': [
    { word: 'SUN', spoken: 'Sun', correct: '☀️', options: ['☀️', '🐟', '🚗'] },
    { word: 'CAT', spoken: 'Cat', correct: '🐱', options: ['🐱', '🐶', '🐻'] },
    { word: 'FISH', spoken: 'Fish', correct: '🐟', options: ['🍎', '🐟', '⚽'] },
  ],

  // 4. SOUND & RHYTHM (Section 19)
  'sound-rhythm': [
    { prompt: 'Listen to the rhythm: BA — BA — BA', pattern: 'BA BA BA', correct: 'BA — BA — BA', options: ['BA — BA — BA', 'BA — DI — DA', 'LA — LA — LA'] },
    { prompt: 'Listen to the rhythm: TI — TI — TA', pattern: 'TI TI TA', correct: 'TI — TI — TA', options: ['TI — TI — TA', 'TA — TA — TA', 'DI — DI — DUM'] },
  ],

  // 5. WORD BUILDER (Original)
  'build-word': [
    { image: '🐱', word: 'CAT', letters: ['T', 'C', 'A'] },
    { image: '🐶', word: 'DOG', letters: ['G', 'D', 'O'] },
    { image: '☀️', word: 'SUN', letters: ['N', 'S', 'U'] },
    { image: '🐟', word: 'FISH', letters: ['S', 'F', 'H', 'I'] },
  ],

  // 6. WORD TRAIN (Section 15)
  'word-train': [
    { word: 'CAT', image: '🐱', letters: ['C', 'A', 'T'], scrambled: ['T', 'C', 'A'] },
    { word: 'BUS', image: '🚌', letters: ['B', 'U', 'S'], scrambled: ['S', 'B', 'U'] },
    { word: 'SUN', image: '☀️', letters: ['S', 'U', 'N'], scrambled: ['U', 'S', 'N'] },
  ],

  // 7. MISSING LETTER (Section 17)
  'missing-letter': [
    { wordDisplay: 'C _ T', fullWord: 'CAT', missing: 'A', image: '🐱', options: ['A', 'O', 'E'] },
    { wordDisplay: 'D _ G', fullWord: 'DOG', missing: 'O', image: '🐶', options: ['O', 'U', 'I'] },
    { wordDisplay: 'S _ N', fullWord: 'SUN', missing: 'U', image: '☀️', options: ['U', 'A', 'E'] },
  ],

  // 8. LETTER DETECTIVE (Original)
  'find-sound': [
    { target: 'sh', words: ['ship', 'cat', 'shell', 'dog'], answers: ['ship', 'shell'] },
    { target: 'ch', words: ['chip', 'ball', 'chair', 'sun'], answers: ['chip', 'chair'] },
    { target: 'th', words: ['this', 'car', 'that', 'box'], answers: ['this', 'that'] },
  ],

  // 9. PICTURE MATCH (Original)
  'picture-word': [
    { emoji: '🍎', correct: 'APPLE', options: ['APPLE', 'ORANGE', 'GRAPE'] },
    { emoji: '🐘', correct: 'ELEPHANT', options: ['ELEPHANT', 'TIGER', 'ZEBRA'] },
    { emoji: '🚗', correct: 'CAR', options: ['BUS', 'CAR', 'BIKE'] },
  ],

  // 10. STORY PUZZLE (Section 18)
  'story-puzzle': [
    {
      title: 'How an Apple Grows',
      prompt: 'What comes first, next, and last?',
      items: [
        { id: '1', emoji: '🌱', label: 'Seed Sprout', step: 1 },
        { id: '2', emoji: '🌳', label: 'Big Tree', step: 2 },
        { id: '3', emoji: '🍎', label: 'Ripe Apple', step: 3 },
      ],
      correctOrder: ['1', '2', '3'],
    },
    {
      title: 'A Butterfly Adventure',
      prompt: 'Put the butterfly adventure in order!',
      items: [
        { id: '1', emoji: '🐛', label: 'Caterpillar', step: 1 },
        { id: '2', emoji: '🌿', label: 'Chrysalis', step: 2 },
        { id: '3', emoji: '🦋', label: 'Butterfly', step: 3 },
      ],
      correctOrder: ['1', '2', '3'],
    },
  ],

  // 11. SOUND DETECTIVE (Original)
  'sound-detective': [
    { emoji: '🔊', correctSound: 'M', options: ['M', 'N', 'S'] },
    { emoji: '🔊', correctSound: 'SH', options: ['CH', 'SH', 'TH'] },
    { emoji: '🔊', correctSound: 'R', options: ['R', 'L', 'W'] },
  ],
}

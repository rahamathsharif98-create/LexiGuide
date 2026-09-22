export const RHYME_LEVELS = [
  {
    id: 'rhyme-at',
    family: '-at',
    targetWord: 'CAT',
    emoji: '🐱',
    prompt: 'Dive to find words that rhyme with CAT!',
    speechText: 'Find words that rhyme with CAT! Like HAT, BAT, or RAT!',
    validRhymes: ['HAT', 'BAT', 'RAT', 'MAT'],
    distractors: ['DOG', 'PIG', 'SUN', 'CUP'],
  },
  {
    id: 'rhyme-ig',
    family: '-ig',
    targetWord: 'PIG',
    emoji: '🐷',
    prompt: 'Dive to find words that rhyme with PIG!',
    speechText: 'Find words that rhyme with PIG! Like BIG, DIG, or WIG!',
    validRhymes: ['BIG', 'DIG', 'WIG', 'FIG'],
    distractors: ['CAT', 'FOX', 'PEN', 'BUG'],
  },
  {
    id: 'rhyme-og',
    family: '-og',
    targetWord: 'FROG',
    emoji: '🐸',
    prompt: 'Dive to find words that rhyme with FROG!',
    speechText: 'Find words that rhyme with FROG! Like DOG, LOG, or JOG!',
    validRhymes: ['DOG', 'LOG', 'JOG', 'FOG'],
    distractors: ['FISH', 'CRAB', 'SUN', 'NET'],
  },
  {
    id: 'rhyme-an',
    family: '-an',
    targetWord: 'FAN',
    emoji: '🪭',
    prompt: 'Dive to find words that rhyme with FAN!',
    speechText: 'Find words that rhyme with FAN! Like PAN, CAN, or VAN!',
    validRhymes: ['PAN', 'CAN', 'VAN', 'MAN'],
    distractors: ['TOP', 'BED', 'RED', 'BUS'],
  },
  {
    id: 'rhyme-en',
    family: '-en',
    targetWord: 'HEN',
    emoji: '🐔',
    prompt: 'Dive to find words that rhyme with HEN!',
    speechText: 'Find words that rhyme with HEN! Like PEN, TEN, or DEN!',
    validRhymes: ['PEN', 'TEN', 'DEN', 'MEN'],
    distractors: ['COW', 'BAT', 'PIG', 'FOX'],
  },
];

export function getRhymeLevel(index = 0) {
  return RHYME_LEVELS[index % RHYME_LEVELS.length];
}

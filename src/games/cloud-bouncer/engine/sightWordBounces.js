export const BOUNCE_LEVELS = [
  {
    id: 'bounce-play',
    targetWord: 'PLAY',
    emoji: '⭐',
    prompt: 'Bounce to the cloud with: PLAY!',
    speechText: 'Bounce up to the stars! Jump to the cloud that says PLAY!',
    options: ['PLAY', 'AWAY', 'HELP'],
  },
  {
    id: 'bounce-see',
    targetWord: 'SEE',
    emoji: '👀',
    prompt: 'Bounce to the cloud with: SEE!',
    speechText: 'Jump higher! Find the cloud with SEE!',
    options: ['SEE', 'THE', 'YOU'],
  },
  {
    id: 'bounce-look',
    targetWord: 'LOOK',
    emoji: '🔍',
    prompt: 'Bounce to the cloud with: LOOK!',
    speechText: 'Look up high! Find the cloud that says LOOK!',
    options: ['LOOK', 'BOOK', 'COME'],
  },
  {
    id: 'bounce-come',
    targetWord: 'COME',
    emoji: '🌈',
    prompt: 'Bounce to the cloud with: COME!',
    speechText: 'Almost to the rainbow! Find the word COME!',
    options: ['COME', 'SOME', 'MAKE'],
  },
  {
    id: 'bounce-jump',
    targetWord: 'JUMP',
    emoji: '🦘',
    prompt: 'Bounce to the cloud with: JUMP!',
    speechText: 'Super bounce! Find the word JUMP!',
    options: ['JUMP', 'PUMP', 'LIKE'],
  },
];

export function getBounceLevel(index = 0) {
  return BOUNCE_LEVELS[index % BOUNCE_LEVELS.length];
}

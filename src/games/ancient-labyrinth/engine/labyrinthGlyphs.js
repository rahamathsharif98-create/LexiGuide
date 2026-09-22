export const LABYRINTH_RIDDLES = [
  {
    id: 'riddle-open',
    word: 'OPEN',
    emoji: '🗝️',
    chamber: 'Chamber of Whispering Doors',
    prompt: 'Collect the ancient glowing glyphs to OPEN the gate!',
    speechText: 'Brave explorer, decipher the gate incantation OPEN! Find O, then P, then E, then N!',
    distractors: ['M', 'T'],
  },
  {
    id: 'riddle-light',
    word: 'LIGHT',
    emoji: '🔥',
    chamber: 'Hall of Eternal Torches',
    prompt: 'Collect the glyphs to ignite the temple LIGHT!',
    speechText: 'Ignite the sacred torch LIGHT! Find L, then I, then G, then H, then T!',
    distractors: ['B', 'S'],
  },
  {
    id: 'riddle-door',
    word: 'DOOR',
    emoji: '🚪',
    chamber: 'Stone Gateway of the Sphinx',
    prompt: 'Collect the glyphs to unlock the ancient DOOR!',
    speechText: 'Unlock the ancient stone DOOR! Find D, then O, then O, then R!',
    distractors: ['C', 'P'],
  },
  {
    id: 'riddle-gold',
    word: 'GOLD',
    emoji: '🪙',
    chamber: 'Vault of the Pharaoh',
    prompt: 'Collect the glyphs to reveal the hidden GOLD!',
    speechText: 'Uncover the pharaohs GOLD! Find G, then O, then L, then D!',
    distractors: ['F', 'W'],
  },
  {
    id: 'riddle-ruby',
    word: 'RUBY',
    emoji: '💎',
    chamber: 'Crypt of Glowing Jewels',
    prompt: 'Collect the glyphs to manifest the sacred RUBY!',
    speechText: 'Manifest the sacred shining RUBY! Find R, then U, then B, then Y!',
    distractors: ['H', 'K'],
  },
];

export function getLabyrinthRiddle(index = 0) {
  return LABYRINTH_RIDDLES[index % LABYRINTH_RIDDLES.length];
}

export const PHONICS_TARGETS = [
  // Digraphs
  {
    id: 'digraph-sh',
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
    sound: '/wh/',
    correct: 'WH',
    options: ['WH', 'TH', 'CH', 'PH'],
    prompt: 'Pop the balloon that makes the /wh/ sound!',
    wordHint: 'Like in Whale or Wheel!',
    emoji: '🐳',
    speechText: 'Find the wh sound! Like in whale!',
  },
  // Blends
  {
    id: 'blend-st',
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
    sound: '/fl/',
    correct: 'FL',
    options: ['FL', 'PL', 'SL', 'BL'],
    prompt: 'Pop the balloon with the /fl/ sound!',
    wordHint: 'Like in Flower or Fly!',
    emoji: '🌸',
    speechText: 'Find the fl sound! Like in flower!',
  },
  // Vowel Teams
  {
    id: 'vowel-ee',
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
    sound: '/oo/',
    correct: 'OO',
    options: ['OO', 'EE', 'AR', 'OR'],
    prompt: 'Pop the balloon with the /oo/ sound!',
    wordHint: 'Like in Moon or Spoon!',
    emoji: '🌙',
    speechText: 'Find the oo sound! Like in moon!',
  },
];

export function getPhonicsRound(index = 0) {
  const target = PHONICS_TARGETS[index % PHONICS_TARGETS.length];
  // Shuffle options so the correct one is in different positions
  const shuffled = [...target.options].sort(() => Math.random() - 0.5);
  return {
    ...target,
    shuffledOptions: shuffled,
  };
}
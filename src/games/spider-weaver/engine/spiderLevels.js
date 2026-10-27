/**
 * spiderLevels.js
 * Progressive levels for "Spinny the Spider: Web Weaver"
 * 
 * Focus: Multisensory Onset-Rime Blending and Word Weaving
 * Designed specifically for children with reading difficulties and dyslexia.
 * 
 * Progression:
 * 1. Early levels: High-contrast short-vowel CVC/CCVC with distinct distractors
 * 2. Middle levels: Common digraphs and consonant blends with varied endings
 * 3. Advanced levels: Challenging r-controlled vowels, nasal minimal pairs, and plosives
 * 4. Grand finale: Multi-syllable mascot climax
 */

export const SPIDER_LEVELS = [
  {
    id: 1,
    title: 'Whirling Spin',
    targetWord: 'spin',
    onset: 'sp',
    targetRime: 'in',
    options: ['in', 'at', 'ug'],
    hint: 'Spin round and round!',
    emoji: '🌀',
    audioPrompt: 'Help Spinny weave the word SPIN! Pick the glowing rime /in/!',
  },
  {
    id: 2,
    title: 'Silky Home',
    targetWord: 'web',
    onset: 'w',
    targetRime: 'eb',
    options: ['eb', 'op', 'it'],
    hint: 'A glistening silk home!',
    emoji: '🕸️',
    audioPrompt: 'Spinny needs a silky WEB! Tap /eb/ to weave it!',
  },
  {
    id: 3,
    title: 'Polka Dot',
    targetWord: 'spot',
    onset: 'sp',
    targetRime: 'ot',
    options: ['ot', 'an', 'ed'],
    hint: 'A little round dot!',
    emoji: '🎯',
    audioPrompt: 'Look closely at the web! Can you find /ot/ to make SPOT?',
  },
  {
    id: 4,
    title: 'Twinkle Star',
    targetWord: 'star',
    onset: 'st',
    targetRime: 'ar',
    options: ['ar', 'ip', 'ot'],
    hint: 'Shining bright in the sky!',
    emoji: '⭐',
    audioPrompt: 'Twinkle in the night! Connect ST and /ar/ to weave STAR!',
  },
  {
    id: 5,
    title: 'Garden Friend',
    targetWord: 'frog',
    onset: 'fr',
    targetRime: 'og',
    options: ['og', 'un', 'ap'],
    hint: 'Ribbit! A hopping friend in the garden!',
    emoji: '🐸',
    audioPrompt: 'Spinny saw a pond friend! Weave FR and /og/ to make FROG!',
  },
  {
    id: 6,
    title: 'Ocean Voyage',
    targetWord: 'ship',
    onset: 'sh',
    targetRime: 'ip',
    options: ['ip', 'en', 'am'],
    hint: 'Sailing across the calm sea!',
    emoji: '⛵',
    audioPrompt: 'Time to set sail! Tap /ip/ to weave SHIP!',
  },
  {
    id: 7,
    title: 'Friendly Chat',
    targetWord: 'chat',
    onset: 'ch',
    targetRime: 'at',
    options: ['at', 'ox', 'ug'],
    hint: 'Talking with kind friends!',
    emoji: '💬',
    audioPrompt: 'Spinny loves to CHAT! Choose /at/ to complete the word!',
  },
  {
    id: 8,
    title: 'Shimmering Spark',
    targetWord: 'spark',
    onset: 'sp',
    targetRime: 'ark',
    options: ['ark', 'art', 'arm'],
    hint: 'A bright glowing shimmer on the silk!',
    emoji: '✨',
    audioPrompt: 'Spinny sees a bright glow! Connect SP and /ark/ to weave SPARK!',
  },
  {
    id: 9,
    title: 'Silk Swing',
    targetWord: 'swing',
    onset: 'sw',
    targetRime: 'ing',
    options: ['ing', 'ang', 'ong'],
    hint: 'Swing from strand to strand!',
    emoji: '🎪',
    audioPrompt: 'Weave silk to swing high! Tap /ing/ to make SWING!',
  },
  {
    id: 10,
    title: 'Garden Track',
    targetWord: 'track',
    onset: 'tr',
    targetRime: 'ack',
    options: ['ack', 'ick', 'ock'],
    hint: 'A silk trail across the garden!',
    emoji: '🛤️',
    audioPrompt: 'Follow the silk path! Connect TR and /ack/ to weave TRACK!',
  },
  {
    id: 11,
    title: 'The Grand Spider',
    targetWord: 'spider',
    onset: 'sp',
    targetRime: 'ider',
    options: ['ider', 'oon', 'ace'],
    hint: 'Our cheerful 8-legged weaver friend!',
    emoji: '🕷️',
    audioPrompt: 'Grand Finale! Weave Spinny\'s favorite word: SPIDER!',
  },
];

export function getSpiderLevel(index) {
  const safeIndex = Math.max(0, Math.min(index, SPIDER_LEVELS.length - 1));
  return SPIDER_LEVELS[safeIndex];
}

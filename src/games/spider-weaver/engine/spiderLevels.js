/**
 * spiderLevels.js
 * Progressive levels for "Spinny the Spider: Web Weaver"
 * 
 * Focus: Multisensory Onset-Rime Blending and Word Weaving
 * Designed specifically for children with reading difficulties and dyslexia.
 */

export const SPIDER_LEVELS = [
  {
    id: 1,
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

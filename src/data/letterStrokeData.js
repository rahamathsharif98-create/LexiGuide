/**
 * Canonical stroke coordinates and vocabulary metadata for "Trace & Say"
 * Covers Telugu (తెలుగు), Hindi (हिन्दी), and English.
 * 
 * Coordinates are normalized in [0, 1] space relative to the square canvas box.
 * Strokes are ordered sequentially to support the animated "Ghost" guide.
 */

import { ENGLISH_LETTER_TRACE_CURRICULUM } from '../games/letter-trace/engine/letterTraceCurriculum.js';

export const PRESERVED_LETTER_STROKE_DATA = {
  te: [
    {
      id: 'te-ka',
      letter: 'క',
      word: 'కమలం',
      english: 'Lotus',
      roman: 'kamalam',
      icon: '🪷',
      phoneme: '/kʌ/',
      meaning: 'Lotus flower growing in water',
      instructionAudioText: 'ఈ అక్షరం "క". కమలం. మీ వేలితో గీతలను అనుసరించండి.',
      canonicalStrokes: [
        // Stroke 1: S-curve body (continuous handwriting from top-right down through crest, waist, and bottom bowl)
        [
          { x: 0.64, y: 0.38 },
          { x: 0.58, y: 0.30 },
          { x: 0.49, y: 0.28 },
          { x: 0.40, y: 0.33 },
          { x: 0.35, y: 0.40 },
          { x: 0.36, y: 0.48 },
          { x: 0.45, y: 0.53 },
          { x: 0.55, y: 0.54 },
          { x: 0.62, y: 0.60 },
          { x: 0.60, y: 0.68 },
          { x: 0.50, y: 0.72 },
          { x: 0.38, y: 0.68 },
          { x: 0.34, y: 0.58 },
        ],
        // Stroke 2: Talakattu tick (✓) perfectly resting at top crest
        [
          { x: 0.40, y: 0.18 },
          { x: 0.49, y: 0.28 },
          { x: 0.64, y: 0.16 },
        ],
      ],
    },
    {
      id: 'te-ga',
      letter: 'గ',
      word: 'గంట',
      english: 'Bell',
      roman: 'ganta',
      icon: '🔔',
      phoneme: '/gʌ/',
      meaning: 'Temple bell with ringing sound',
      instructionAudioText: 'ఈ అక్షరం "గ". గంట. మీ వేలితో గీతలను అనుసరించండి.',
      canonicalStrokes: [
        // Stroke 1: Horseshoe arch from baseline up over crest and down to right baseline
        [
          { x: 0.31, y: 0.83 },
          { x: 0.32, y: 0.63 },
          { x: 0.37, y: 0.49 },
          { x: 0.46, y: 0.43 },
          { x: 0.56, y: 0.43 },
          { x: 0.64, y: 0.49 },
          { x: 0.69, y: 0.63 },
          { x: 0.70, y: 0.83 },
        ],
        // Stroke 2: Talakattu tick at crest
        [
          { x: 0.43, y: 0.35 },
          { x: 0.51, y: 0.42 },
          { x: 0.67, y: 0.29 },
        ],
      ],
    },
    {
      id: 'te-cha',
      letter: 'చ',
      word: 'చందమామ',
      english: 'Moon',
      roman: 'chandamama',
      icon: '🌙',
      phoneme: '/tʃʌ/',
      meaning: 'Gentle glowing moon in the sky',
      instructionAudioText: 'ఈ అక్షరం "చ". చందమామ. మీ వేలితో గీతలను అనుసరించండి.',
      canonicalStrokes: [
        // Stroke 1: Left open flag curving into double bottom cradle and rising to right wing crest
        [
          { x: 0.36, y: 0.43 },
          { x: 0.43, y: 0.42 },
          { x: 0.38, y: 0.55 },
          { x: 0.41, y: 0.69 },
          { x: 0.50, y: 0.71 },
          { x: 0.55, y: 0.59 },
          { x: 0.60, y: 0.71 },
          { x: 0.70, y: 0.70 },
          { x: 0.74, y: 0.57 },
          { x: 0.71, y: 0.43 },
          { x: 0.64, y: 0.35 },
        ],
        // Stroke 2: Talakattu tick on the right wing crest
        [
          { x: 0.56, y: 0.28 },
          { x: 0.64, y: 0.35 },
          { x: 0.79, y: 0.21 },
        ],
      ],
    },
    {
      id: 'te-na',
      letter: 'న',
      word: 'నక్క',
      english: 'Fox',
      roman: 'nakka',
      icon: '🦊',
      phoneme: '/nʌ/',
      meaning: 'Clever little forest fox',
      instructionAudioText: 'ఈ అక్షరం "న". నక్క. మీ వేలితో గీతలను అనుసరించండి.',
      canonicalStrokes: [
        // Stroke 1: Open downward hook, arching up and over, dipping into cradle, rising to right wing crest
        [
          { x: 0.36, y: 0.68 },
          { x: 0.32, y: 0.58 },
          { x: 0.33, y: 0.46 },
          { x: 0.41, y: 0.42 },
          { x: 0.48, y: 0.46 },
          { x: 0.52, y: 0.58 },
          { x: 0.60, y: 0.70 },
          { x: 0.68, y: 0.69 },
          { x: 0.74, y: 0.58 },
          { x: 0.70, y: 0.42 },
          { x: 0.58, y: 0.30 },
        ],
        // Stroke 2: Talakattu tick (✓) on right wing crest
        [
          { x: 0.50, y: 0.20 },
          { x: 0.58, y: 0.30 },
          { x: 0.72, y: 0.16 },
        ],
      ],
    },
    {
      id: 'te-ta',
      letter: 'త',
      word: 'తార',
      english: 'Star',
      roman: 'taara',
      icon: '⭐',
      phoneme: '/t̪ʌ/',
      meaning: 'Twinkling star in the night',
      instructionAudioText: 'ఈ అక్షరం "త". తార. మీ వేలితో గీతలను అనుసరించండి.',
      excluded: true,
      active: false,
      exclusionReason: 'Temporarily excluded from active curriculum pending accurate tracing guide redesign',
      canonicalStrokes: [
        // Stroke 1: Left eye, central cleft, right shoulder, and bottom cradle
        [
          { x: 0.36, y: 0.55 },
          { x: 0.28, y: 0.57 },
          { x: 0.22, y: 0.53 },
          { x: 0.24, y: 0.46 },
          { x: 0.35, y: 0.46 },
          { x: 0.50, y: 0.48 },
          { x: 0.65, y: 0.46 },
          { x: 0.76, y: 0.52 },
          { x: 0.78, y: 0.62 },
          { x: 0.68, y: 0.74 },
          { x: 0.50, y: 0.77 },
          { x: 0.30, y: 0.74 },
          { x: 0.22, y: 0.65 },
          { x: 0.22, y: 0.53 },
        ],
        // Stroke 2: Talakattu tick (✓) at central cleft
        [
          { x: 0.38, y: 0.33 },
          { x: 0.50, y: 0.44 },
          { x: 0.72, y: 0.25 },
        ],
      ],
    },
  ],

  hi: [
    {
      id: 'hi-ka',
      letter: 'क',
      word: 'कमल',
      english: 'Lotus',
      roman: 'kamal',
      icon: '🪷',
      phoneme: '/kə/',
      meaning: 'Beautiful lotus flower',
      instructionAudioText: 'यह अक्षर है "क"। कमल। उंगली से रेखा खींचिए।',
      canonicalStrokes: [
        // 1. Central vertical stem
        [
          { x: 0.50, y: 0.25 },
          { x: 0.50, y: 0.80 },
        ],
        // 2. Continuous left loop and right hook (starts on stem, loops left, crosses stem, hooks right)
        [
          { x: 0.50, y: 0.42 },
          { x: 0.39, y: 0.40 },
          { x: 0.30, y: 0.48 },
          { x: 0.30, y: 0.58 },
          { x: 0.41, y: 0.65 },
          { x: 0.50, y: 0.57 },
          { x: 0.61, y: 0.43 },
          { x: 0.71, y: 0.48 },
          { x: 0.72, y: 0.62 },
          { x: 0.67, y: 0.74 },
        ],
        // 3. Shirorekha (top headline)
        [
          { x: 0.25, y: 0.25 },
          { x: 0.75, y: 0.25 },
        ],
      ],
    },
    {
      id: 'hi-ga',
      letter: 'ग',
      word: 'गमला',
      english: 'Flowerpot',
      roman: 'gamla',
      icon: '🪴',
      phoneme: '/gə/',
      meaning: 'Clay flowerpot with green plant',
      instructionAudioText: 'यह अक्षर है "ग"। गमला। उंगली से रेखा खींचिए।',
      canonicalStrokes: [
        // 1. Left stem descending with smooth teardrop loop
        [
          { x: 0.40, y: 0.25 },
          { x: 0.40, y: 0.58 },
          { x: 0.35, y: 0.65 },
          { x: 0.31, y: 0.71 },
          { x: 0.38, y: 0.74 },
          { x: 0.45, y: 0.70 },
          { x: 0.45, y: 0.64 },
        ],
        // 2. Right vertical stem
        [
          { x: 0.62, y: 0.25 },
          { x: 0.62, y: 0.80 },
        ],
        // 3. Shirorekha
        [
          { x: 0.25, y: 0.25 },
          { x: 0.75, y: 0.25 },
        ],
      ],
    },
    {
      id: 'hi-cha',
      letter: 'च',
      word: 'चाँद',
      english: 'Moon',
      roman: 'chaand',
      icon: '🌙',
      phoneme: '/tʃə/',
      meaning: 'Shining moon in the night sky',
      instructionAudioText: 'यह अक्षर है "च"। चाँद। उंगली से रेखा खींचिए।',
      canonicalStrokes: [
        // 1. Horizontal bar into smooth rounded scoop cradle meeting the stem
        [
          { x: 0.32, y: 0.48 },
          { x: 0.48, y: 0.48 },
          { x: 0.38, y: 0.58 },
          { x: 0.40, y: 0.71 },
          { x: 0.51, y: 0.74 },
          { x: 0.60, y: 0.66 },
          { x: 0.60, y: 0.54 },
        ],
        // 2. Right vertical stem
        [
          { x: 0.60, y: 0.25 },
          { x: 0.60, y: 0.80 },
        ],
        // 3. Shirorekha
        [
          { x: 0.25, y: 0.25 },
          { x: 0.75, y: 0.25 },
        ],
      ],
    },
    {
      id: 'hi-sa',
      letter: 'स',
      word: 'सेब',
      english: 'Apple',
      roman: 'seb',
      icon: '🍎',
      phoneme: '/sə/',
      meaning: 'Sweet juicy red apple',
      instructionAudioText: 'यह अक्षर है "स"। सेब। उंगली से रेखा खींचिए।',
      canonicalStrokes: [
        // 1. Left Ra (र) head curve and diagonal leg
        [
          { x: 0.42, y: 0.25 },
          { x: 0.42, y: 0.32 },
          { x: 0.52, y: 0.38 },
          { x: 0.33, y: 0.48 },
          { x: 0.54, y: 0.70 },
        ],
        // 2. Connecting horizontal waist bar
        [
          { x: 0.50, y: 0.48 },
          { x: 0.73, y: 0.48 },
        ],
        // 3. Right vertical stem (Khadi Pai)
        [
          { x: 0.73, y: 0.25 },
          { x: 0.73, y: 0.72 },
        ],
        // 4. Shirorekha (Top headline)
        [
          { x: 0.25, y: 0.25 },
          { x: 0.78, y: 0.25 },
        ],
      ],
    },
    {
      id: 'hi-ta',
      letter: 'त',
      word: 'तारा',
      english: 'Star',
      roman: 'taara',
      icon: '⭐',
      phoneme: '/t̪ə/',
      meaning: 'Golden twinkling star',
      instructionAudioText: 'यह अक्षर है "त"। तारा। उंगली से रेखा खींचिए।',
      canonicalStrokes: [
        // 1. Right vertical stem
        [
          { x: 0.62, y: 0.25 },
          { x: 0.62, y: 0.80 },
        ],
        // 2. Horizontal arm smoothly arching downward like an umbrella hook
        [
          { x: 0.62, y: 0.48 },
          { x: 0.45, y: 0.48 },
          { x: 0.37, y: 0.54 },
          { x: 0.36, y: 0.65 },
          { x: 0.36, y: 0.78 },
        ],
        // 3. Shirorekha
        [
          { x: 0.25, y: 0.25 },
          { x: 0.75, y: 0.25 },
        ],
      ],
    },
  ],

  en: ENGLISH_LETTER_TRACE_CURRICULUM,
};

/**
 * Active Playable Letter Sets
 * Excluded letters (such as Telugu 'త') are filtered out from the active curriculum
 * while preserving complete canonical stroke data in PRESERVED_LETTER_STROKE_DATA.
 */
export const LETTER_STROKE_DATA = {
  te: PRESERVED_LETTER_STROKE_DATA.te.filter((item) => !item.excluded && item.active !== false),
  hi: PRESERVED_LETTER_STROKE_DATA.hi.filter((item) => !item.excluded && item.active !== false),
  en: PRESERVED_LETTER_STROKE_DATA.en.filter((item) => !item.excluded && item.active !== false),
};

/**
 * Registry of temporarily excluded characters for future restoration
 */
export const EXCLUDED_LETTERS = PRESERVED_LETTER_STROKE_DATA.te.filter((item) => item.excluded);

/**
 * Query whether a character or ID is active in the playable curriculum
 */
export function isLetterActive(idOrLetter) {
  const all = [
    ...PRESERVED_LETTER_STROKE_DATA.te,
    ...PRESERVED_LETTER_STROKE_DATA.hi,
    ...PRESERVED_LETTER_STROKE_DATA.en,
  ];
  const found = all.find((item) => item.id === idOrLetter || item.letter === idOrLetter);
  return found ? !found.excluded && found.active !== false : false;
}


/**
 * Canonical stroke coordinates and vocabulary metadata for "Trace & Say"
 * Covers Telugu (తెలుగు), Hindi (हिन्दी), and English.
 * 
 * Coordinates are normalized in [0, 1] space relative to the square canvas box.
 * Strokes are ordered sequentially to support the animated "Ghost" guide.
 */

export const LETTER_STROKE_DATA = {
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
        // Main loop and body curve of Telugu 'ka'
        [
          { x: 0.35, y: 0.32 },
          { x: 0.28, y: 0.40 },
          { x: 0.25, y: 0.52 },
          { x: 0.28, y: 0.65 },
          { x: 0.38, y: 0.75 },
          { x: 0.50, y: 0.78 },
          { x: 0.62, y: 0.75 },
          { x: 0.72, y: 0.65 },
          { x: 0.75, y: 0.52 },
          { x: 0.70, y: 0.40 },
          { x: 0.60, y: 0.35 },
          { x: 0.50, y: 0.35 },
          { x: 0.40, y: 0.45 },
          { x: 0.42, y: 0.60 },
          { x: 0.55, y: 0.65 },
        ],
        // Top tick/talakattu mark
        [
          { x: 0.42, y: 0.20 },
          { x: 0.50, y: 0.25 },
          { x: 0.62, y: 0.18 },
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
        // Main open hook body
        [
          { x: 0.30, y: 0.65 },
          { x: 0.30, y: 0.45 },
          { x: 0.35, y: 0.35 },
          { x: 0.45, y: 0.30 },
          { x: 0.55, y: 0.30 },
          { x: 0.65, y: 0.35 },
          { x: 0.70, y: 0.45 },
          { x: 0.70, y: 0.70 },
        ],
        // Head tick
        [
          { x: 0.45, y: 0.22 },
          { x: 0.52, y: 0.26 },
          { x: 0.62, y: 0.20 },
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
        [
          { x: 0.30, y: 0.55 },
          { x: 0.25, y: 0.65 },
          { x: 0.35, y: 0.75 },
          { x: 0.50, y: 0.75 },
          { x: 0.65, y: 0.70 },
          { x: 0.72, y: 0.55 },
          { x: 0.70, y: 0.40 },
          { x: 0.55, y: 0.35 },
          { x: 0.40, y: 0.40 },
          { x: 0.45, y: 0.55 },
          { x: 0.60, y: 0.55 },
        ],
        [
          { x: 0.45, y: 0.24 },
          { x: 0.52, y: 0.28 },
          { x: 0.62, y: 0.22 },
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
        [
          { x: 0.30, y: 0.45 },
          { x: 0.25, y: 0.55 },
          { x: 0.32, y: 0.68 },
          { x: 0.45, y: 0.72 },
          { x: 0.58, y: 0.65 },
          { x: 0.62, y: 0.50 },
          { x: 0.68, y: 0.60 },
          { x: 0.75, y: 0.72 },
        ],
        [
          { x: 0.42, y: 0.26 },
          { x: 0.50, y: 0.30 },
          { x: 0.60, y: 0.25 },
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
      canonicalStrokes: [
        [
          { x: 0.30, y: 0.65 },
          { x: 0.25, y: 0.50 },
          { x: 0.35, y: 0.35 },
          { x: 0.50, y: 0.35 },
          { x: 0.65, y: 0.45 },
          { x: 0.70, y: 0.60 },
          { x: 0.65, y: 0.75 },
          { x: 0.52, y: 0.75 },
          { x: 0.45, y: 0.65 },
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
        // 1. Shirorekha (top horizontal line)
        [
          { x: 0.25, y: 0.25 },
          { x: 0.75, y: 0.25 },
        ],
        // 2. Central vertical stem
        [
          { x: 0.50, y: 0.25 },
          { x: 0.50, y: 0.80 },
        ],
        // 3. Left loop and right hook
        [
          { x: 0.50, y: 0.45 },
          { x: 0.35, y: 0.45 },
          { x: 0.30, y: 0.55 },
          { x: 0.35, y: 0.65 },
          { x: 0.50, y: 0.65 },
          { x: 0.65, y: 0.55 },
          { x: 0.70, y: 0.70 },
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
        // Shirorekha
        [
          { x: 0.25, y: 0.25 },
          { x: 0.75, y: 0.25 },
        ],
        // Left loop
        [
          { x: 0.40, y: 0.25 },
          { x: 0.40, y: 0.62 },
          { x: 0.35, y: 0.68 },
          { x: 0.45, y: 0.68 },
        ],
        // Right vertical stem
        [
          { x: 0.62, y: 0.25 },
          { x: 0.62, y: 0.80 },
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
        // Shirorekha
        [
          { x: 0.25, y: 0.25 },
          { x: 0.75, y: 0.25 },
        ],
        // Horizontal bar into loop
        [
          { x: 0.32, y: 0.50 },
          { x: 0.48, y: 0.50 },
          { x: 0.38, y: 0.65 },
          { x: 0.50, y: 0.70 },
          { x: 0.60, y: 0.55 },
        ],
        // Right vertical stem
        [
          { x: 0.60, y: 0.25 },
          { x: 0.60, y: 0.80 },
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
        // Shirorekha
        [
          { x: 0.25, y: 0.25 },
          { x: 0.75, y: 0.25 },
        ],
        // Left loop
        [
          { x: 0.35, y: 0.35 },
          { x: 0.45, y: 0.40 },
          { x: 0.35, y: 0.55 },
          { x: 0.30, y: 0.75 },
        ],
        // Connecting bar
        [
          { x: 0.38, y: 0.55 },
          { x: 0.60, y: 0.55 },
        ],
        // Right stem
        [
          { x: 0.60, y: 0.25 },
          { x: 0.60, y: 0.80 },
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
        // Shirorekha
        [
          { x: 0.25, y: 0.25 },
          { x: 0.75, y: 0.25 },
        ],
        // Vertical stem
        [
          { x: 0.60, y: 0.25 },
          { x: 0.60, y: 0.80 },
        ],
        // Left arm and curve
        [
          { x: 0.60, y: 0.50 },
          { x: 0.38, y: 0.50 },
          { x: 0.38, y: 0.75 },
        ],
      ],
    },
  ],

  en: [
    {
      id: 'en-c',
      letter: 'C',
      word: 'Cat',
      english: 'Cat',
      roman: 'cat',
      icon: '🐱',
      phoneme: '/k/',
      meaning: 'Playful fluffy cat',
      instructionAudioText: 'This is letter C. C is for Cat. Follow the curve with your finger.',
      canonicalStrokes: [
        // Smooth semi-circular curve from top-right to bottom-right
        [
          { x: 0.75, y: 0.32 },
          { x: 0.58, y: 0.22 },
          { x: 0.40, y: 0.25 },
          { x: 0.28, y: 0.38 },
          { x: 0.25, y: 0.52 },
          { x: 0.28, y: 0.68 },
          { x: 0.40, y: 0.78 },
          { x: 0.58, y: 0.80 },
          { x: 0.75, y: 0.70 },
        ],
      ],
    },
    {
      id: 'en-s',
      letter: 'S',
      word: 'Sun',
      english: 'Sun',
      roman: 'sun',
      icon: '☀️',
      phoneme: '/s/',
      meaning: 'Warm smiling yellow sun',
      instructionAudioText: 'This is letter S. S is for Sun. Trace the winding snake curve.',
      canonicalStrokes: [
        [
          { x: 0.72, y: 0.32 },
          { x: 0.55, y: 0.22 },
          { x: 0.35, y: 0.28 },
          { x: 0.32, y: 0.42 },
          { x: 0.50, y: 0.50 },
          { x: 0.68, y: 0.58 },
          { x: 0.68, y: 0.72 },
          { x: 0.50, y: 0.80 },
          { x: 0.30, y: 0.74 },
        ],
      ],
    },
    {
      id: 'en-b',
      letter: 'B',
      word: 'Book',
      english: 'Book',
      roman: 'book',
      icon: '📖',
      phoneme: '/b/',
      meaning: 'Wonderful picture book to read',
      instructionAudioText: 'This is letter B. B is for Book. Draw the straight stem, then two round bumps.',
      canonicalStrokes: [
        // Stem
        [
          { x: 0.30, y: 0.22 },
          { x: 0.30, y: 0.80 },
        ],
        // Top bump
        [
          { x: 0.30, y: 0.22 },
          { x: 0.55, y: 0.22 },
          { x: 0.68, y: 0.34 },
          { x: 0.55, y: 0.50 },
          { x: 0.30, y: 0.50 },
        ],
        // Bottom bump
        [
          { x: 0.30, y: 0.50 },
          { x: 0.58, y: 0.50 },
          { x: 0.72, y: 0.64 },
          { x: 0.58, y: 0.80 },
          { x: 0.30, y: 0.80 },
        ],
      ],
    },
    {
      id: 'en-m',
      letter: 'M',
      word: 'Moon',
      english: 'Moon',
      roman: 'moon',
      icon: '🌙',
      phoneme: '/m/',
      meaning: 'Silver glowing moon in the sky',
      instructionAudioText: 'This is letter M. M is for Moon. Trace the mountain peaks!',
      canonicalStrokes: [
        [
          { x: 0.25, y: 0.80 },
          { x: 0.25, y: 0.25 },
          { x: 0.50, y: 0.60 },
          { x: 0.75, y: 0.25 },
          { x: 0.75, y: 0.80 },
        ],
      ],
    },
    {
      id: 'en-t',
      letter: 'T',
      word: 'Tree',
      english: 'Tree',
      roman: 'tree',
      icon: '🌳',
      phoneme: '/t/',
      meaning: 'Tall green leafy tree',
      instructionAudioText: 'This is letter T. T is for Tree. Draw the top branch, then the trunk.',
      canonicalStrokes: [
        // Top bar
        [
          { x: 0.22, y: 0.24 },
          { x: 0.78, y: 0.24 },
        ],
        // Downward stem
        [
          { x: 0.50, y: 0.24 },
          { x: 0.50, y: 0.80 },
        ],
      ],
    },
  ],
}

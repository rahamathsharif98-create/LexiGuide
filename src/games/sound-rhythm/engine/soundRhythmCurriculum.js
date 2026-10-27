/**
 * soundRhythmCurriculum.js
 *
 * Sound & Rhythm Curriculum — 30 Progressive Levels across 3 Developmental Stages.
 *
 * Stage 1 (Levels 1–10): Simple Syllables
 *   Identify repeated syllables and foundational sound patterns (e.g. BA-BA-BA, TI-TI-TA).
 * Stage 2 (Levels 11–20): Tempo Beats
 *   Recognize changes in beat count, spacing, and tempo patterns (fast/slow, pauses).
 * Stage 3 (Levels 21–30): Rhythm Adventures
 *   Varied syllables, percussion instruments, and playful rhythm combos.
 *
 * Requirements guaranteed:
 * - Preserves original BA–BA–BA (Level 1) and TI–TI–TA (Level 2) rounds.
 * - Exactly 30 unique, sequential rounds (10 per stage).
 * - Exactly 3 distinct options per round with 1 valid correct answer.
 * - Perfectly balanced deterministic option distribution (10 at pos 0, 10 at pos 1, 10 at pos 2).
 * - Rich beat data (syllables, timestamps, durations, instrument cues) for future audio synthesis.
 */

export const TOTAL_SOUND_RHYTHM_LEVELS = 30;

export const SOUND_RHYTHM_STAGE_CONFIG = [
  {
    stage: 1,
    title: 'Simple Syllables',
    subtitle: 'Identify repeated syllables and foundational sound patterns',
    icon: '🥁',
    levelRange: [1, 10],
    themePreview: '🥁 BA BA BA, TI TI TA, LA LA LA, MA MA PA…',
    description: 'Listen to gentle repeated syllables and learn foundational 3-beat rhythm echoes.',
  },
  {
    stage: 2,
    title: 'Tempo Beats',
    subtitle: 'Recognize changes in beat count, spacing, and tempo patterns',
    icon: '⏱️',
    levelRange: [11, 20],
    themePreview: '⏱️ Quick & Slow Beats, Double Taps, Pause Echoes…',
    description: 'Discover tempo shifts, rhythm pauses, and synchronized beat counting.',
  },
  {
    stage: 3,
    title: 'Rhythm Adventures',
    subtitle: 'Varied syllables, percussion instruments, and playful rhythm combos',
    icon: '🎶',
    levelRange: [21, 30],
    themePreview: '🎶 Drum, Claps & Bell Rhythms, Syncopated Word Beats…',
    description: 'Explore percussion instrument grooves, claps, snaps, and joyful musical finales.',
  },
];

export const SOUND_RHYTHM_STAGES = SOUND_RHYTHM_STAGE_CONFIG.map((stg) => ({
  stage: stg.stage,
  title: stg.title,
  subtitle: stg.subtitle,
  icon: stg.icon,
  levelRange: stg.levelRange,
  themePreview: stg.themePreview,
  description: stg.description,
  badge: stg.stage === 1 ? '🥁 Syllable Master' : stg.stage === 2 ? '⏱️ Beat Champion' : '🏆 Rhythm Maestro',
}));

export const SOUND_RHYTHM_MILESTONES = {
  5: { level: 5, name: 'Rhythm Cadet', icon: '⭐', reward: 'Bronze Beat Star' },
  10: { level: 10, name: 'Syllable Master', icon: '🏅', reward: 'Stage 1 Mastery Badge' },
  15: { level: 15, name: 'Tempo Explorer', icon: '⭐', reward: 'Silver Drumstick Star' },
  20: { level: 20, name: 'Beat Champion', icon: '🏅', reward: 'Stage 2 Mastery Badge' },
  25: { level: 25, name: 'Groove Wizard', icon: '⭐', reward: 'Golden Cymbal Star' },
  30: { level: 30, name: 'Rhythm Maestro', icon: '🏆', reward: 'Grand Rhythm Trophy' },
};

export const SOUND_RHYTHM_CURRICULUM = [
  // ─────────────────────────────────────────────────────────────
  // STAGE 1 (Levels 1–10): Simple Syllables
  // ─────────────────────────────────────────────────────────────
  {
    id: 1,
    level: 1,
    stage: 1,
    title: 'Repeat the Beat: BA',
    prompt: 'Listen to the rhythm: BA — BA — BA',
    pattern: 'BA BA BA',
    correct: 'BA — BA — BA',
    options: ['BA — BA — BA', 'BA — DI — DA', 'LA — LA — LA'], // Pos 0
    syllables: ['BA', 'BA', 'BA'],
    beats: [
      { sound: 'BA', timeMs: 0, durationMs: 250, pitch: 'low' },
      { sound: 'BA', timeMs: 400, durationMs: 250, pitch: 'low' },
      { sound: 'BA', timeMs: 800, durationMs: 250, pitch: 'low' },
    ],
    tempo: 'normal',
    instrument: 'drum',
    hint: 'Listen for three matching BA sounds.',
  },
  {
    id: 2,
    level: 2,
    stage: 1,
    title: 'Two Short, One Long',
    prompt: 'Listen to the rhythm: TI — TI — TA',
    pattern: 'TI TI TA',
    correct: 'TI — TI — TA',
    options: ['TA — TA — TA', 'TI — TI — TA', 'DI — DI — DUM'], // Pos 1
    syllables: ['TI', 'TI', 'TA'],
    beats: [
      { sound: 'TI', timeMs: 0, durationMs: 180, pitch: 'high' },
      { sound: 'TI', timeMs: 300, durationMs: 180, pitch: 'high' },
      { sound: 'TA', timeMs: 650, durationMs: 350, pitch: 'low' },
    ],
    tempo: 'normal',
    instrument: 'drum',
    hint: 'Listen for two quick light sounds followed by a solid beat.',
  },
  {
    id: 3,
    level: 3,
    stage: 1,
    title: 'Singing Beats: LA',
    prompt: 'Listen to the rhythm: LA — LA — LA',
    pattern: 'LA LA LA',
    correct: 'LA — LA — LA',
    options: ['LA — DI — LA', 'BA — BA — BA', 'LA — LA — LA'], // Pos 2
    syllables: ['LA', 'LA', 'LA'],
    beats: [
      { sound: 'LA', timeMs: 0, durationMs: 250, pitch: 'mid' },
      { sound: 'LA', timeMs: 400, durationMs: 250, pitch: 'mid' },
      { sound: 'LA', timeMs: 800, durationMs: 250, pitch: 'mid' },
    ],
    tempo: 'normal',
    instrument: 'woodblock',
    hint: 'Three singing LA tones in a gentle row.',
  },
  {
    id: 4,
    level: 4,
    stage: 1,
    title: 'Step Pattern: MA MA PA',
    prompt: 'Listen to the rhythm: MA — MA — PA',
    pattern: 'MA MA PA',
    correct: 'MA — MA — PA',
    options: ['MA — MA — PA', 'PA — PA — MA', 'DA — DA — DA'], // Pos 0
    syllables: ['MA', 'MA', 'PA'],
    beats: [
      { sound: 'MA', timeMs: 0, durationMs: 220, pitch: 'low' },
      { sound: 'MA', timeMs: 360, durationMs: 220, pitch: 'low' },
      { sound: 'PA', timeMs: 720, durationMs: 280, pitch: 'high' },
    ],
    tempo: 'normal',
    instrument: 'drum',
    hint: 'Two warm MA beats followed by a crisp PA.',
  },
  {
    id: 5,
    level: 5,
    stage: 1,
    title: 'Bouncing Drop: DA DA DUM',
    prompt: 'Listen to the rhythm: DA — DA — DUM',
    pattern: 'DA DA DUM',
    correct: 'DA — DA — DUM',
    options: ['DUM — DUM — DUM', 'DA — DA — DUM', 'BA — DA — BOOM'], // Pos 1
    syllables: ['DA', 'DA', 'DUM'],
    beats: [
      { sound: 'DA', timeMs: 0, durationMs: 200, pitch: 'mid' },
      { sound: 'DA', timeMs: 350, durationMs: 200, pitch: 'mid' },
      { sound: 'DUM', timeMs: 700, durationMs: 350, pitch: 'deep' },
    ],
    tempo: 'normal',
    instrument: 'drum',
    hint: 'Starts with two light DA sounds and ends with a deep DUM.',
  },
  {
    id: 6,
    level: 6,
    stage: 1,
    title: 'Sandwich Beat: KA TA KA',
    prompt: 'Listen to the rhythm: KA — TA — KA',
    pattern: 'KA TA KA',
    correct: 'KA — TA — KA',
    options: ['KA — KA — KA', 'TA — TA — KA', 'KA — TA — KA'], // Pos 2
    syllables: ['KA', 'TA', 'KA'],
    beats: [
      { sound: 'KA', timeMs: 0, durationMs: 200, pitch: 'high' },
      { sound: 'TA', timeMs: 380, durationMs: 240, pitch: 'mid' },
      { sound: 'KA', timeMs: 760, durationMs: 200, pitch: 'high' },
    ],
    tempo: 'normal',
    instrument: 'woodblock',
    hint: 'Notice the sound in the middle (TA) is different from the ends (KA).',
  },
  {
    id: 7,
    level: 7,
    stage: 1,
    title: 'Bass and Snap: BOOM BOOM CLAP',
    prompt: 'Listen to the rhythm: BOOM — BOOM — CLAP',
    pattern: 'BOOM BOOM CLAP',
    correct: 'BOOM — BOOM — CLAP',
    options: ['BOOM — BOOM — CLAP', 'CLAP — CLAP — BOOM', 'BOOM — CLAP — BOOM'], // Pos 0
    syllables: ['BOOM', 'BOOM', 'CLAP'],
    beats: [
      { sound: 'BOOM', timeMs: 0, durationMs: 280, pitch: 'deep' },
      { sound: 'BOOM', timeMs: 420, durationMs: 280, pitch: 'deep' },
      { sound: 'CLAP', timeMs: 840, durationMs: 220, pitch: 'snap' },
    ],
    tempo: 'normal',
    instrument: 'drum',
    hint: 'Two deep bass hits followed by one hand clap.',
  },
  {
    id: 8,
    level: 8,
    stage: 1,
    title: 'Rhyme Echo: NA NA NOO',
    prompt: 'Listen to the rhythm: NA — NA — NOO',
    pattern: 'NA NA NOO',
    correct: 'NA — NA — NOO',
    options: ['NOO — NOO — NOO', 'NA — NA — NOO', 'NA — NOO — NA'], // Pos 1
    syllables: ['NA', 'NA', 'NOO'],
    beats: [
      { sound: 'NA', timeMs: 0, durationMs: 220, pitch: 'mid' },
      { sound: 'NA', timeMs: 380, durationMs: 220, pitch: 'mid' },
      { sound: 'NOO', timeMs: 760, durationMs: 320, pitch: 'low' },
    ],
    tempo: 'normal',
    instrument: 'woodblock',
    hint: 'Listen for two NA sounds and one longer NOO finish.',
  },
  {
    id: 9,
    level: 9,
    stage: 1,
    title: 'Triple Tap: TAP TAP TAP',
    prompt: 'Listen to the rhythm: TAP — TAP — TAP',
    pattern: 'TAP TAP TAP',
    correct: 'TAP — TAP — TAP',
    options: ['TAP — CLAP — TAP', 'CLAP — CLAP — CLAP', 'TAP — TAP — TAP'], // Pos 2
    syllables: ['TAP', 'TAP', 'TAP'],
    beats: [
      { sound: 'TAP', timeMs: 0, durationMs: 180, pitch: 'high' },
      { sound: 'TAP', timeMs: 360, durationMs: 180, pitch: 'high' },
      { sound: 'TAP', timeMs: 720, durationMs: 180, pitch: 'high' },
    ],
    tempo: 'normal',
    instrument: 'woodblock',
    hint: 'Three identical crisp tapping sounds.',
  },
  {
    id: 10,
    level: 10,
    stage: 1,
    title: 'Vowel Step: PI PA PO',
    prompt: 'Listen to the rhythm: PI — PA — PO',
    pattern: 'PI PA PO',
    correct: 'PI — PA — PO',
    options: ['PI — PA — PO', 'PO — PO — PO', 'PA — PI — PA'], // Pos 0
    syllables: ['PI', 'PA', 'PO'],
    beats: [
      { sound: 'PI', timeMs: 0, durationMs: 200, pitch: 'high' },
      { sound: 'PA', timeMs: 380, durationMs: 200, pitch: 'mid' },
      { sound: 'PO', timeMs: 760, durationMs: 260, pitch: 'low' },
    ],
    tempo: 'normal',
    instrument: 'drum',
    hint: 'A melodic pattern stepping down from PI to PA to PO.',
  },

  // ─────────────────────────────────────────────────────────────
  // STAGE 2 (Levels 11–20): Tempo Beats
  // ─────────────────────────────────────────────────────────────
  {
    id: 11,
    level: 11,
    stage: 2,
    title: 'Speed Switch: QUICK QUICK SLOW',
    prompt: 'Listen to the rhythm: QUICK — QUICK — SLOW',
    pattern: 'QUICK QUICK SLOW',
    correct: 'QUICK — QUICK — SLOW',
    options: ['SLOW — SLOW — SLOW', 'QUICK — QUICK — SLOW', 'SLOW — QUICK — QUICK'], // Pos 1
    syllables: ['QUICK', 'QUICK', 'SLOW'],
    beats: [
      { sound: 'QUICK', timeMs: 0, durationMs: 150, pitch: 'high' },
      { sound: 'QUICK', timeMs: 220, durationMs: 150, pitch: 'high' },
      { sound: 'SLOW', timeMs: 550, durationMs: 400, pitch: 'low' },
    ],
    tempo: 'variable',
    instrument: 'drum',
    hint: 'Two rapid taps followed by a long held note.',
  },
  {
    id: 12,
    level: 12,
    stage: 2,
    title: 'Rest the Beat: BEAT (pause) BEAT',
    prompt: 'Listen to the rhythm: BEAT — (pause) — BEAT',
    pattern: 'BEAT (pause) BEAT',
    correct: 'BEAT — (pause) — BEAT',
    options: ['BEAT — BEAT — BEAT', 'BEAT — BEAT — (pause)', 'BEAT — (pause) — BEAT'], // Pos 2
    syllables: ['BEAT', '(pause)', 'BEAT'],
    beats: [
      { sound: 'BEAT', timeMs: 0, durationMs: 220, pitch: 'mid' },
      { sound: '(pause)', timeMs: 400, durationMs: 300, pitch: 'rest' },
      { sound: 'BEAT', timeMs: 850, durationMs: 220, pitch: 'mid' },
    ],
    tempo: 'normal',
    instrument: 'drum',
    hint: 'Listen for the quiet pause in the very middle.',
  },
  {
    id: 13,
    level: 13,
    stage: 2,
    title: 'Clock Ticks: TIK TOK TIK TOK',
    prompt: 'Listen to the rhythm: TIK — TOK — TIK — TOK',
    pattern: 'TIK TOK TIK TOK',
    correct: 'TIK — TOK — TIK — TOK',
    options: ['TIK — TOK — TIK — TOK', 'TOK — TOK — TOK — TOK', 'TIK — TIK — TIK — TIK'], // Pos 0
    syllables: ['TIK', 'TOK', 'TIK', 'TOK'],
    beats: [
      { sound: 'TIK', timeMs: 0, durationMs: 150, pitch: 'high' },
      { sound: 'TOK', timeMs: 320, durationMs: 180, pitch: 'low' },
      { sound: 'TIK', timeMs: 640, durationMs: 150, pitch: 'high' },
      { sound: 'TOK', timeMs: 960, durationMs: 180, pitch: 'low' },
    ],
    tempo: 'normal',
    instrument: 'woodblock',
    hint: 'Four alternating clock ticks back and forth.',
  },
  {
    id: 14,
    level: 14,
    stage: 2,
    title: 'Count the Steps: ONE TWO THREE',
    prompt: 'Listen to the rhythm: ONE — TWO — THREE',
    pattern: 'ONE TWO THREE',
    correct: 'ONE — TWO — THREE',
    options: ['ONE — ONE — ONE', 'ONE — TWO — THREE', 'THREE — TWO — ONE'], // Pos 1
    syllables: ['ONE', 'TWO', 'THREE'],
    beats: [
      { sound: 'ONE', timeMs: 0, durationMs: 220, pitch: 'low' },
      { sound: 'TWO', timeMs: 380, durationMs: 220, pitch: 'mid' },
      { sound: 'THREE', timeMs: 760, durationMs: 280, pitch: 'high' },
    ],
    tempo: 'normal',
    instrument: 'drum',
    hint: 'Three ascending number steps counting up.',
  },
  {
    id: 15,
    level: 15,
    stage: 2,
    title: 'Hold the Note: SHORT SHORT LONG',
    prompt: 'Listen to the rhythm: SHORT — SHORT — LONG',
    pattern: 'SHORT SHORT LONG',
    correct: 'SHORT — SHORT — LONG',
    options: ['LONG — SHORT — SHORT', 'SHORT — LONG — SHORT', 'SHORT — SHORT — LONG'], // Pos 2
    syllables: ['SHORT', 'SHORT', 'LONG'],
    beats: [
      { sound: 'SHORT', timeMs: 0, durationMs: 160, pitch: 'mid' },
      { sound: 'SHORT', timeMs: 260, durationMs: 160, pitch: 'mid' },
      { sound: 'LONG', timeMs: 580, durationMs: 450, pitch: 'low' },
    ],
    tempo: 'variable',
    instrument: 'bell',
    hint: 'Two quick staccato notes followed by one long ringing bell.',
  },
  {
    id: 16,
    level: 16,
    stage: 2,
    title: 'Freeze Beat: FAST FAST FAST STOP',
    prompt: 'Listen to the rhythm: FAST — FAST — FAST — STOP',
    pattern: 'FAST FAST FAST STOP',
    correct: 'FAST — FAST — FAST — STOP',
    options: ['FAST — FAST — FAST — STOP', 'STOP — FAST — FAST — FAST', 'FAST — STOP — FAST — STOP'], // Pos 0
    syllables: ['FAST', 'FAST', 'FAST', 'STOP'],
    beats: [
      { sound: 'FAST', timeMs: 0, durationMs: 130, pitch: 'high' },
      { sound: 'FAST', timeMs: 180, durationMs: 130, pitch: 'high' },
      { sound: 'FAST', timeMs: 360, durationMs: 130, pitch: 'high' },
      { sound: 'STOP', timeMs: 600, durationMs: 350, pitch: 'deep' },
    ],
    tempo: 'fast',
    instrument: 'drum',
    hint: 'Three speedy hits that come to a sudden halt.',
  },
  {
    id: 17,
    level: 17,
    stage: 2,
    title: 'Reverse Pace: SLOW QUICK QUICK',
    prompt: 'Listen to the rhythm: SLOW — QUICK — QUICK',
    pattern: 'SLOW QUICK QUICK',
    correct: 'SLOW — QUICK — QUICK',
    options: ['SLOW — SLOW — SLOW', 'SLOW — QUICK — QUICK', 'QUICK — QUICK — SLOW'], // Pos 1
    syllables: ['SLOW', 'QUICK', 'QUICK'],
    beats: [
      { sound: 'SLOW', timeMs: 0, durationMs: 380, pitch: 'low' },
      { sound: 'QUICK', timeMs: 500, durationMs: 150, pitch: 'high' },
      { sound: 'QUICK', timeMs: 720, durationMs: 150, pitch: 'high' },
    ],
    tempo: 'variable',
    instrument: 'woodblock',
    hint: 'A long steady beat leading into two snappy quick hits.',
  },
  {
    id: 18,
    level: 18,
    stage: 2,
    title: 'Bunny Hop: HOP (pause) HOP (pause)',
    prompt: 'Listen to the rhythm: HOP — (pause) — HOP — (pause)',
    pattern: 'HOP (pause) HOP (pause)',
    correct: 'HOP — (pause) — HOP — (pause)',
    options: ['HOP — HOP — HOP — HOP', 'HOP — HOP — (pause) — (pause)', 'HOP — (pause) — HOP — (pause)'], // Pos 2
    syllables: ['HOP', '(pause)', 'HOP', '(pause)'],
    beats: [
      { sound: 'HOP', timeMs: 0, durationMs: 180, pitch: 'mid' },
      { sound: '(pause)', timeMs: 300, durationMs: 250, pitch: 'rest' },
      { sound: 'HOP', timeMs: 680, durationMs: 180, pitch: 'mid' },
      { sound: '(pause)', timeMs: 980, durationMs: 250, pitch: 'rest' },
    ],
    tempo: 'normal',
    instrument: 'drum',
    hint: 'A bouncing hop, then a pause, then another hop and pause.',
  },
  {
    id: 19,
    level: 19,
    stage: 2,
    title: 'Gallop Combo: TAP TAP DOUBLE TAP',
    prompt: 'Listen to the rhythm: TAP — TAP — DOUBLE — TAP',
    pattern: 'TAP TAP DOUBLE TAP',
    correct: 'TAP — TAP — DOUBLE — TAP',
    options: ['TAP — TAP — DOUBLE — TAP', 'DOUBLE — TAP — TAP — TAP', 'TAP — DOUBLE — TAP — TAP'], // Pos 0
    syllables: ['TAP', 'TAP', 'DOUBLE', 'TAP'],
    beats: [
      { sound: 'TAP', timeMs: 0, durationMs: 180, pitch: 'mid' },
      { sound: 'TAP', timeMs: 320, durationMs: 180, pitch: 'mid' },
      { sound: 'DOUBLE', timeMs: 600, durationMs: 120, pitch: 'high' },
      { sound: 'TAP', timeMs: 760, durationMs: 220, pitch: 'low' },
    ],
    tempo: 'normal',
    instrument: 'woodblock',
    hint: 'Two regular taps followed by a quick double gallop.',
  },
  {
    id: 20,
    level: 20,
    stage: 2,
    title: 'Dance Groove: STEP STEP SLIDE',
    prompt: 'Listen to the rhythm: STEP — STEP — SLIDE',
    pattern: 'STEP STEP SLIDE',
    correct: 'STEP — STEP — SLIDE',
    options: ['SLIDE — SLIDE — SLIDE', 'STEP — STEP — SLIDE', 'SLIDE — STEP — STEP'], // Pos 1
    syllables: ['STEP', 'STEP', 'SLIDE'],
    beats: [
      { sound: 'STEP', timeMs: 0, durationMs: 200, pitch: 'mid' },
      { sound: 'STEP', timeMs: 350, durationMs: 200, pitch: 'mid' },
      { sound: 'SLIDE', timeMs: 700, durationMs: 450, pitch: 'low' },
    ],
    tempo: 'normal',
    instrument: 'drum',
    hint: 'Two firm marching steps followed by a long smooth slide.',
  },

  // ─────────────────────────────────────────────────────────────
  // STAGE 3 (Levels 21–30): Rhythm Adventures
  // ─────────────────────────────────────────────────────────────
  {
    id: 21,
    level: 21,
    stage: 3,
    title: 'Drum & Shimmer: DRUM DRUM CYMBAL',
    prompt: 'Listen to the rhythm: DRUM — DRUM — CYMBAL',
    pattern: 'DRUM DRUM CYMBAL',
    correct: 'DRUM — DRUM — CYMBAL',
    options: ['CYMBAL — CYMBAL — DRUM', 'DRUM — CYMBAL — DRUM', 'DRUM — DRUM — CYMBAL'], // Pos 2
    syllables: ['DRUM', 'DRUM', 'CYMBAL'],
    beats: [
      { sound: 'DRUM', timeMs: 0, durationMs: 250, pitch: 'deep' },
      { sound: 'DRUM', timeMs: 380, durationMs: 250, pitch: 'deep' },
      { sound: 'CYMBAL', timeMs: 760, durationMs: 380, pitch: 'shimmer' },
    ],
    tempo: 'normal',
    instrument: 'cymbal',
    hint: 'Two thumping drums with a sparkling cymbal clash at the end.',
  },
  {
    id: 22,
    level: 22,
    stage: 3,
    title: 'Hands & Fingers: CLAP SNAP CLAP',
    prompt: 'Listen to the rhythm: CLAP — SNAP — CLAP',
    pattern: 'CLAP SNAP CLAP',
    correct: 'CLAP — SNAP — CLAP',
    options: ['CLAP — SNAP — CLAP', 'SNAP — SNAP — CLAP', 'CLAP — CLAP — SNAP'], // Pos 0
    syllables: ['CLAP', 'SNAP', 'CLAP'],
    beats: [
      { sound: 'CLAP', timeMs: 0, durationMs: 200, pitch: 'clap' },
      { sound: 'SNAP', timeMs: 360, durationMs: 160, pitch: 'snap' },
      { sound: 'CLAP', timeMs: 720, durationMs: 200, pitch: 'clap' },
    ],
    tempo: 'normal',
    instrument: 'clap',
    hint: 'Hear the middle sound snap with your fingers.',
  },
  {
    id: 23,
    level: 23,
    stage: 3,
    title: 'Chime Tower: DING DONG BELL',
    prompt: 'Listen to the rhythm: DING — DONG — BELL',
    pattern: 'DING DONG BELL',
    correct: 'DING — DONG — BELL',
    options: ['BELL — BELL — BELL', 'DING — DONG — BELL', 'DONG — DING — DONG'], // Pos 1
    syllables: ['DING', 'DONG', 'BELL'],
    beats: [
      { sound: 'DING', timeMs: 0, durationMs: 250, pitch: 'high' },
      { sound: 'DONG', timeMs: 400, durationMs: 280, pitch: 'low' },
      { sound: 'BELL', timeMs: 820, durationMs: 420, pitch: 'resonant' },
    ],
    tempo: 'normal',
    instrument: 'bell',
    hint: 'High DING, deep DONG, and a resonant ringing BELL.',
  },
  {
    id: 24,
    level: 24,
    stage: 3,
    title: 'Shaker Beats: THUMP THUMP SHAKE',
    prompt: 'Listen to the rhythm: THUMP — THUMP — SHAKE',
    pattern: 'THUMP THUMP SHAKE',
    correct: 'THUMP — THUMP — SHAKE',
    options: ['SHAKE — SHAKE — THUMP', 'THUMP — SHAKE — THUMP', 'THUMP — THUMP — SHAKE'], // Pos 2
    syllables: ['THUMP', 'THUMP', 'SHAKE'],
    beats: [
      { sound: 'THUMP', timeMs: 0, durationMs: 240, pitch: 'deep' },
      { sound: 'THUMP', timeMs: 380, durationMs: 240, pitch: 'deep' },
      { sound: 'SHAKE', timeMs: 740, durationMs: 320, pitch: 'shaker' },
    ],
    tempo: 'normal',
    instrument: 'drum',
    hint: 'Two ground thumps ending with a gentle maraca shake.',
  },
  {
    id: 25,
    level: 25,
    stage: 3,
    title: 'Latin Groove: CHA CHA CHA',
    prompt: 'Listen to the rhythm: CHA — CHA — CHA',
    pattern: 'CHA CHA CHA',
    correct: 'CHA — CHA — CHA',
    options: ['CHA — CHA — CHA', 'CHA — BOOM — CHA', 'BOOM — CHA — BOOM'], // Pos 0
    syllables: ['CHA', 'CHA', 'CHA'],
    beats: [
      { sound: 'CHA', timeMs: 0, durationMs: 180, pitch: 'mid' },
      { sound: 'CHA', timeMs: 280, durationMs: 180, pitch: 'mid' },
      { sound: 'CHA', timeMs: 560, durationMs: 240, pitch: 'mid' },
    ],
    tempo: 'fast',
    instrument: 'woodblock',
    hint: 'A quick playful triple step: CHA CHA CHA!',
  },
  {
    id: 26,
    level: 26,
    stage: 3,
    title: 'Funky Bounce: BOP BEAT BOUNCE',
    prompt: 'Listen to the rhythm: BOP — BEAT — BOUNCE',
    pattern: 'BOP BEAT BOUNCE',
    correct: 'BOP — BEAT — BOUNCE',
    options: ['BOUNCE — BOUNCE — BOP', 'BOP — BEAT — BOUNCE', 'BEAT — BEAT — BEAT'], // Pos 1
    syllables: ['BOP', 'BEAT', 'BOUNCE'],
    beats: [
      { sound: 'BOP', timeMs: 0, durationMs: 160, pitch: 'high' },
      { sound: 'BEAT', timeMs: 320, durationMs: 200, pitch: 'mid' },
      { sound: 'BOUNCE', timeMs: 680, durationMs: 360, pitch: 'low' },
    ],
    tempo: 'normal',
    instrument: 'drum',
    hint: 'Starts with a pop, hits a beat, and ends on a springy bounce.',
  },
  {
    id: 27,
    level: 27,
    stage: 3,
    title: 'Walking Song: RHYTHM IN MY FEET',
    prompt: 'Listen to the rhythm: RHYTHM — IN — MY — FEET',
    pattern: 'RHYTHM IN MY FEET',
    correct: 'RHYTHM — IN — MY — FEET',
    options: ['FEET — FEET — IN — RHYTHM', 'RHYTHM — RHYTHM — FEET — FEET', 'RHYTHM — IN — MY — FEET'], // Pos 2
    syllables: ['RHYTHM', 'IN', 'MY', 'FEET'],
    beats: [
      { sound: 'RHYTHM', timeMs: 0, durationMs: 220, pitch: 'mid' },
      { sound: 'IN', timeMs: 340, durationMs: 160, pitch: 'high' },
      { sound: 'MY', timeMs: 560, durationMs: 180, pitch: 'mid' },
      { sound: 'FEET', timeMs: 820, durationMs: 300, pitch: 'low' },
    ],
    tempo: 'normal',
    instrument: 'clap',
    hint: 'Four musical syllables marching in time with happy feet.',
  },
  {
    id: 28,
    level: 28,
    stage: 3,
    title: 'Pitch Wave: HIGH LOW HIGH LOW',
    prompt: 'Listen to the rhythm: HIGH — LOW — HIGH — LOW',
    pattern: 'HIGH LOW HIGH LOW',
    correct: 'HIGH — LOW — HIGH — LOW',
    options: ['HIGH — LOW — HIGH — LOW', 'LOW — LOW — HIGH — HIGH', 'HIGH — HIGH — LOW — LOW'], // Pos 0
    syllables: ['HIGH', 'LOW', 'HIGH', 'LOW'],
    beats: [
      { sound: 'HIGH', timeMs: 0, durationMs: 200, pitch: 'high' },
      { sound: 'LOW', timeMs: 320, durationMs: 220, pitch: 'low' },
      { sound: 'HIGH', timeMs: 640, durationMs: 200, pitch: 'high' },
      { sound: 'LOW', timeMs: 960, durationMs: 240, pitch: 'low' },
    ],
    tempo: 'normal',
    instrument: 'bell',
    hint: 'An oscillating high-and-low melodic bell pattern.',
  },
  {
    id: 29,
    level: 29,
    stage: 3,
    title: 'Drum Roll Combo: ROLL TAP SPLASH',
    prompt: 'Listen to the rhythm: ROLL — TAP — SPLASH',
    pattern: 'ROLL TAP SPLASH',
    correct: 'ROLL — TAP — SPLASH',
    options: ['SPLASH — SPLASH — ROLL', 'ROLL — TAP — SPLASH', 'TAP — TAP — TAP'], // Pos 1
    syllables: ['ROLL', 'TAP', 'SPLASH'],
    beats: [
      { sound: 'ROLL', timeMs: 0, durationMs: 300, pitch: 'roll' },
      { sound: 'TAP', timeMs: 420, durationMs: 180, pitch: 'high' },
      { sound: 'SPLASH', timeMs: 750, durationMs: 400, pitch: 'shimmer' },
    ],
    tempo: 'normal',
    instrument: 'cymbal',
    hint: 'A quick drum roll, a snappy tap, and a big cymbal splash.',
  },
  {
    id: 30,
    level: 30,
    stage: 3,
    title: 'Grand Finale: STAR BEAT FINALE',
    prompt: 'Listen to the rhythm: STAR — BEAT — FINALE',
    pattern: 'STAR BEAT FINALE',
    correct: 'STAR — BEAT — FINALE',
    options: ['FINALE — FINALE — STAR', 'BEAT — BEAT — FINALE', 'STAR — BEAT — FINALE'], // Pos 2
    syllables: ['STAR', 'BEAT', 'FINALE'],
    beats: [
      { sound: 'STAR', timeMs: 0, durationMs: 240, pitch: 'high' },
      { sound: 'BEAT', timeMs: 360, durationMs: 240, pitch: 'deep' },
      { sound: 'FINALE', timeMs: 740, durationMs: 500, pitch: 'fanfare' },
    ],
    tempo: 'normal',
    instrument: 'drum',
    hint: 'The grand musical finale! A shining star beat celebrating 30 levels.',
  },
];

/**
 * Returns the round definition for a given 1-based level (1 to 30).
 */
export function getSoundRhythmRound(level = 1) {
  const num = Number(level);
  if (!Number.isFinite(num)) return SOUND_RHYTHM_CURRICULUM[0];

  const match = SOUND_RHYTHM_CURRICULUM.find((r) => r.level === num);
  if (match) return match;

  return SOUND_RHYTHM_CURRICULUM[0];
}

/**
 * Returns the round definition for a given 0-based index (0 to 29).
 */
export function getSoundRhythmRoundByIndex(index = 0) {
  const num = Number(index);
  if (!Number.isFinite(num) || num < 0 || num >= TOTAL_SOUND_RHYTHM_LEVELS) {
    return SOUND_RHYTHM_CURRICULUM[0];
  }
  return SOUND_RHYTHM_CURRICULUM[Math.floor(num)] || SOUND_RHYTHM_CURRICULUM[0];
}

/**
 * Returns the stage definition containing the specified 1-based level.
 */
export function getSoundRhythmStageForLevel(level = 1) {
  const targetLevel = Math.max(1, Math.min(TOTAL_SOUND_RHYTHM_LEVELS, Number(level) || 1));
  const stage = SOUND_RHYTHM_STAGE_CONFIG.find(
    (s) => targetLevel >= s.levelRange[0] && targetLevel <= s.levelRange[1]
  );
  return stage || SOUND_RHYTHM_STAGE_CONFIG[0];
}

/**
 * Returns the milestone badge definition for a given stage (1, 2, or 3).
 */
export function getSoundRhythmStageBadge(stageNumber = 1) {
  const num = Number(stageNumber);
  if (num === 1) {
    return { stage: 1, name: 'Syllable Master', icon: '🥁', reward: 'Bronze Drum Badge' };
  }
  if (num === 2) {
    return { stage: 2, name: 'Beat Champion', icon: '⏱️', reward: 'Silver Tempo Badge' };
  }
  if (num === 3) {
    return { stage: 3, name: 'Rhythm Maestro', icon: '🏆', reward: 'Grand Rhythm Trophy' };
  }
  return { stage: num, name: `Stage ${num} Hero`, icon: '⭐', reward: 'Rhythm Star' };
}

/**
 * Returns the milestone reward for a given 1-based level if one exists.
 */
export function getSoundRhythmMilestone(level) {
  const num = Number(level);
  return SOUND_RHYTHM_MILESTONES[num] || null;
}

/**
 * Returns the deterministic options list for a round.
 * Guarantee: The options array is stable and never alters its order upon re-render.
 */
export function getSoundRhythmDisplayedOptions(round) {
  if (!round || !Array.isArray(round.options)) return [];
  return [...round.options];
}

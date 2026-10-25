import { WORD_TRAIN_CURRICULUM } from '../games/word-train/engine/wordTrainCurriculum'
import { SOUND_HUNT_CURRICULUM } from '../games/sound-hunt/engine/soundHuntCurriculum'
import { COSMIC_SAFARI_CURRICULUM } from '../games/cosmic-safari/engine/cosmicSafariCurriculum'
import { SOUND_SAFARI_CURRICULUM } from '../games/sound-safari/engine/soundSafariCurriculum'
import { SOUND_MATCH_CURRICULUM } from '../games/sound-match/engine/soundMatchCurriculum'
import { SOUND_RHYTHM_CURRICULUM } from '../games/sound-rhythm/engine/soundRhythmCurriculum'
import { LETTER_DETECTIVE_CURRICULUM } from '../games/letter-detective/engine/letterDetectiveCurriculum'
import { MISSING_LETTER_CURRICULUM } from '../games/missing-letter/engine/missingLetterCurriculum'
import { WORD_BUILDER_CURRICULUM } from '../games/word-builder/engine/wordBuilderCurriculum'
import { PICTURE_MATCH_CURRICULUM } from '../games/picture-match/engine/pictureMatchCurriculum'
import { STORY_PUZZLE_CURRICULUM } from '../games/story-puzzle/engine/storyPuzzleCurriculum'

// Per-game content banks. Each item is one "round".
export const GAME_CONTENT = {
  // 1. SOUND SAFARI (Original 4 Rounds with Educational Prompts)
  'match-sound': SOUND_SAFARI_CURRICULUM,

  // 1b. COSMIC SAFARI (25 Progressive Phonics Levels across 5 Stages)
  'cosmic-safari': COSMIC_SAFARI_CURRICULUM,

  // 2. SOUND HUNT / SPACE SOUND MISSION (Section 11 - 10 Progressive Phonics Levels)
  'sound-hunt': SOUND_HUNT_CURRICULUM,

  // 3. SOUND MATCH (10 Progressive Spoken Word & Picture Matching Levels)
  'sound-match': SOUND_MATCH_CURRICULUM,

  // 4. SOUND & RHYTHM (3 Stages — 30 Progressive Levels)
  'sound-rhythm': SOUND_RHYTHM_CURRICULUM,

  // 5. WORD BUILDER (3 Stages — 30 Progressive Levels)
  'build-word': WORD_BUILDER_CURRICULUM,

  // 6. WORD TRAIN (Section 15 - 50 Progressive Phonics Levels)
  'word-train': WORD_TRAIN_CURRICULUM,

  // 7. MISSING LETTER (3 Stages — 30 Progressive Levels)
  'missing-letter': MISSING_LETTER_CURRICULUM,

  // 8. LETTER DETECTIVE (3 Stages — 30 Progressive Phonics Levels)
  'find-sound': LETTER_DETECTIVE_CURRICULUM,

  // 9. PICTURE MATCH (3 Stages — 30 Progressive Levels)
  'picture-word': PICTURE_MATCH_CURRICULUM,

  // 10. STORY PUZZLE (3 Stages — 15 Progressive Levels)
  'story-puzzle': STORY_PUZZLE_CURRICULUM,

  // 11. SOUND DETECTIVE (Original)
  'sound-detective': [
    { emoji: '🔊', correctSound: 'M', options: ['M', 'N', 'S'] },
    { emoji: '🔊', correctSound: 'SH', options: ['CH', 'SH', 'TH'] },
    { emoji: '🔊', correctSound: 'R', options: ['R', 'L', 'W'] },
  ],
}

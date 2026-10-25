import { describe, it, expect } from 'vitest';
import {
  WORD_TRAIN_CURRICULUM,
  WORD_TRAIN_STATIONS,
  TOTAL_WORD_TRAIN_LEVELS,
  TOTAL_WORD_TRAIN_STATIONS,
  LEVELS_PER_STATION,
  getWordTrainLevel,
  getWordTrainStation,
  getLevelsForStation,
  validateCurriculumLevel,
} from '../games/word-train/engine/wordTrainCurriculum';
import { GAME_CONTENT } from '../data/gameContent';

describe('Word Train Phonics Curriculum — Step 1: 50 Progressive Levels', () => {
  it('1. contains exactly 50 progressive spelling levels', () => {
    expect(WORD_TRAIN_CURRICULUM).toBeDefined();
    expect(Array.isArray(WORD_TRAIN_CURRICULUM)).toBe(true);
    expect(WORD_TRAIN_CURRICULUM.length).toBe(50);
    expect(TOTAL_WORD_TRAIN_LEVELS).toBe(50);
  });

  it('2. organizes levels into exactly 5 stations of 10 levels each', () => {
    expect(WORD_TRAIN_STATIONS.length).toBe(5);
    expect(TOTAL_WORD_TRAIN_STATIONS).toBe(5);
    expect(LEVELS_PER_STATION).toBe(10);

    for (let stationNum = 1; stationNum <= 5; stationNum++) {
      const station = getWordTrainStation(stationNum);
      expect(station).toBeDefined();
      expect(station.station).toBe(stationNum);
      expect(station.title).toContain(`Station ${stationNum}`);
      expect(station.badge).toBeTruthy();
      expect(station.themeColor).toMatch(/^#[0-9A-Fa-f]{6}$/);

      const levelsInStation = getLevelsForStation(stationNum);
      expect(levelsInStation.length).toBe(10);

      // Verify level indices match station levelRange
      const [startLvl, endLvl] = station.levelRange;
      expect(levelsInStation[0].level).toBe(startLvl);
      expect(levelsInStation[9].level).toBe(endLvl);
    }
  });

  it('3. validates that every single level satisfies curriculum integrity rules', () => {
    const seenIds = new Set();
    const seenWords = new Set();

    WORD_TRAIN_CURRICULUM.forEach((lvl, idx) => {
      // 1-based level index matches array offset
      expect(lvl.level).toBe(idx + 1);

      // Unique ID and word
      expect(seenIds.has(lvl.id)).toBe(false);
      expect(seenWords.has(lvl.word)).toBe(false);
      seenIds.add(lvl.id);
      seenWords.add(lvl.word);

      // Valid level data using validator
      const isValid = validateCurriculumLevel(lvl);
      expect(isValid).toBe(true);

      // Letters array must match word characters
      expect(lvl.letters).toEqual(lvl.word.split(''));

      // Scrambled array must not equal the solved word
      expect(lvl.scrambled.join('')).not.toBe(lvl.word);

      // Scrambled must have the exact same multiset of characters as letters
      const sortedLetters = [...lvl.letters].sort().join('');
      const sortedScrambled = [...lvl.scrambled].sort().join('');
      expect(sortedScrambled).toBe(sortedLetters);

      // Child-friendly non-empty emoji and hint
      expect(lvl.image.trim().length).toBeGreaterThan(0);
      expect(lvl.hint.trim().length).toBeGreaterThan(0);
      expect(lvl.prompt).toContain(lvl.word);
    });
  });

  it('4. guarantees proper progressive difficulty across the 5 stations', () => {
    // Station 1: 3-letter CVC short vowels
    const station1 = getLevelsForStation(1);
    station1.forEach((lvl) => {
      expect(lvl.word.length).toBe(3);
      expect(lvl.letters.length).toBe(3);
      expect(lvl.scrambled.length).toBe(3);
    });

    // Station 2: 4-letter blends & digraphs
    const station2 = getLevelsForStation(2);
    station2.forEach((lvl) => {
      expect(lvl.word.length).toBe(4);
      expect(lvl.letters.length).toBe(4);
      expect(lvl.scrambled.length).toBe(4);
    });

    // Station 3: 4-letter long vowels and teams
    const station3 = getLevelsForStation(3);
    station3.forEach((lvl) => {
      expect(lvl.word.length).toBe(4);
      expect(lvl.letters.length).toBe(4);
    });

    // Station 4: 5-letter high-frequency words
    const station4 = getLevelsForStation(4);
    station4.forEach((lvl) => {
      expect(lvl.word.length).toBe(5);
      expect(lvl.letters.length).toBe(5);
    });

    // Station 5: 6–7-letter challenge words
    const station5 = getLevelsForStation(5);
    station5.forEach((lvl) => {
      expect(lvl.word.length).toBeGreaterThanOrEqual(6);
      expect(lvl.word.length).toBeLessThanOrEqual(7);
      expect(lvl.letters.length).toBe(lvl.word.length);
    });

    // Final Level 50 is the grand finale RAINBOW
    const finalLevel = WORD_TRAIN_CURRICULUM[49];
    expect(finalLevel.level).toBe(50);
    expect(finalLevel.word).toBe('RAINBOW');
    expect(finalLevel.letters.length).toBe(7);
  });

  it('5. correctly handles words with duplicate letters without data corruption', () => {
    const duplicateLetterLevels = WORD_TRAIN_CURRICULUM.filter((lvl) => {
      const set = new Set(lvl.letters);
      return set.size < lvl.letters.length;
    });

    expect(duplicateLetterLevels.length).toBeGreaterThan(0);

    const testWords = ['BELL', 'MOON', 'TREE', 'CLOCK', 'SHEEP', 'APPLE', 'TURTLE'];
    testWords.forEach((targetWord) => {
      const lvl = WORD_TRAIN_CURRICULUM.find((l) => l.word === targetWord);
      expect(lvl).toBeDefined();
      expect(validateCurriculumLevel(lvl)).toBe(true);

      // Verify frequency of each character matches exactly between letters and scrambled
      const letterCounts = {};
      const scrambledCounts = {};
      lvl.letters.forEach((c) => (letterCounts[c] = (letterCounts[c] || 0) + 1));
      lvl.scrambled.forEach((c) => (scrambledCounts[c] = (scrambledCounts[c] || 0) + 1));
      expect(scrambledCounts).toEqual(letterCounts);
    });
  });

  it('6. safely retrieves levels and stations with bounds clamping', () => {
    // 0-based and 1-based index support
    expect(getWordTrainLevel(0).word).toBe('CAT');
    expect(getWordTrainLevel(1).word).toBe('CAT');
    expect(getWordTrainLevel(50).word).toBe('RAINBOW');

    // Negative numbers clamp to Level 1
    expect(getWordTrainLevel(-5).word).toBe('CAT');

    // Out of bounds clamps to Level 50
    expect(getWordTrainLevel(999).word).toBe('RAINBOW');

    // Station clamping
    expect(getWordTrainStation(1).station).toBe(1);
    expect(getWordTrainStation(5).station).toBe(5);
    expect(getWordTrainStation(0).station).toBe(1);
    expect(getWordTrainStation(99).station).toBe(5);
  });

  it('7. connects the full 50-level curriculum and preserves legacy words', () => {
    // Game in gameContent.js connects all 50 progressive phonics levels
    const curriculumRounds = GAME_CONTENT['word-train'];
    expect(curriculumRounds).toBeDefined();
    expect(curriculumRounds.length).toBe(50);

    // Verify Station 1 in curriculum contains all 3 original legacy words
    const station1Words = getLevelsForStation(1).map((l) => l.word);
    expect(station1Words).toContain('CAT');
    expect(station1Words).toContain('BUS');
    expect(station1Words).toContain('SUN');

    // CAT matches Level 1 configuration
    const catLevel = WORD_TRAIN_CURRICULUM[0];
    expect(catLevel.word).toBe(curriculumRounds[0].word);
    expect(catLevel.image).toBe(curriculumRounds[0].image);
    expect(catLevel.letters).toEqual(curriculumRounds[0].letters);
    expect(catLevel.scrambled).toEqual(curriculumRounds[0].scrambled);
  });
});

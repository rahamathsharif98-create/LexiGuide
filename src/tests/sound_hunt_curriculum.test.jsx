/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import {
  SOUND_HUNT_CURRICULUM,
  TOTAL_SOUND_HUNT_LEVELS,
  TOTAL_SOUND_HUNT_STAGES,
  LEVELS_PER_STAGE,
  SOUND_HUNT_STAGES,
} from '../games/sound-hunt/engine/soundHuntCurriculum';

describe('Space Sound Mission — 25-Level Curriculum Integrity Tests', () => {
  it('contains exactly TOTAL_SOUND_HUNT_LEVELS (25 levels) across 5 stages of 5 levels each', () => {
    expect(SOUND_HUNT_CURRICULUM).toHaveLength(25);
    expect(TOTAL_SOUND_HUNT_LEVELS).toBe(25);
    expect(TOTAL_SOUND_HUNT_STAGES).toBe(5);
    expect(LEVELS_PER_STAGE).toBe(5);
    expect(SOUND_HUNT_STAGES).toHaveLength(5);
  });

  it('preserves the established first 10 levels in exact order and targets', () => {
    const expectedFirst10 = [
      { letter: 'B', sound: '/b/', correct: '⚽', correctName: 'Ball' },
      { letter: 'S', sound: '/s/', correct: '☀️', correctName: 'Sun' },
      { letter: 'M', sound: '/m/', correct: '🌙', correctName: 'Moon' },
      { letter: 'R', sound: '/r/', correct: '🚀', correctName: 'Rocket' },
      { letter: 'P', sound: '/p/', correct: '🪐', correctName: 'Planet' },
      { letter: 'A', sound: '/æ/', correct: '👨‍🚀', correctName: 'Astronaut' },
      { letter: 'T', sound: '/t/', correct: '🔭', correctName: 'Telescope' },
      { letter: 'C', sound: '/k/', correct: '☄️', correctName: 'Comet' },
      { letter: 'H', sound: '/h/', correct: '⛑️', correctName: 'Helmet' },
      { letter: 'Z', sound: '/z/', correct: '⚡', correctName: 'Zap' },
    ];

    expectedFirst10.forEach((expected, i) => {
      const cur = SOUND_HUNT_CURRICULUM[i];
      expect(cur.id).toBe(`sound-hunt-${i + 1}`);
      expect(cur.level).toBe(i + 1);
      expect(cur.letter).toBe(expected.letter);
      expect(cur.sound).toBe(expected.sound);
      expect(cur.correct).toBe(expected.correct);
      expect(cur.correctName).toBe(expected.correctName);
      expect(cur.options.some((o) => o.name === expected.correctName && o.emoji === expected.correct)).toBe(true);
    });
  });

  it('correctly maps all 25 levels into 5 sequential stages with stage metadata', () => {
    SOUND_HUNT_STAGES.forEach((stageDef) => {
      expect(stageDef.stage).toBeGreaterThanOrEqual(1);
      expect(stageDef.stage).toBeLessThanOrEqual(5);
      expect(stageDef.title).toBeTruthy();
      expect(stageDef.badge).toBeTruthy();
      expect(stageDef.themeColor).toBeTruthy();

      const [startLevel, endLevel] = stageDef.levelRange;
      expect(endLevel - startLevel + 1).toBe(LEVELS_PER_STAGE);

      const levelsInStage = SOUND_HUNT_CURRICULUM.filter(
        (lvl) => lvl.level >= startLevel && lvl.level <= endLevel
      );
      expect(levelsInStage).toHaveLength(LEVELS_PER_STAGE);
      levelsInStage.forEach((lvl) => {
        expect(lvl.stage).toBe(stageDef.stage);
        expect(lvl.stageName).toBe(stageDef.shortTitle);
      });
    });
  });

  it('validates that every level from 1 to 25 has valid structure, unique ID, and exactly 1 matching choice', () => {
    const seenIds = new Set();

    SOUND_HUNT_CURRICULUM.forEach((round, idx) => {
      expect(seenIds.has(round.id)).toBe(false);
      seenIds.add(round.id);

      expect(round.id).toBe(`sound-hunt-${idx + 1}`);
      expect(round.level).toBe(idx + 1);
      expect(typeof round.letter).toBe('string');
      expect(round.letter.length).toBe(1);
      expect(typeof round.sound).toBe('string');
      expect(typeof round.soundSpoken).toBe('string');
      expect(typeof round.prompt).toBe('string');
      expect(typeof round.correct).toBe('string');
      expect(typeof round.correctName).toBe('string');
      expect(Array.isArray(round.options)).toBe(true);
      expect(round.options).toHaveLength(3);

      const matching = round.options.filter((o) => o.emoji === round.correct);
      expect(matching).toHaveLength(1);
      expect(matching[0].name).toBe(round.correctName);

      // Verify all 3 options have distinct names and emojis
      const names = new Set(round.options.map((o) => o.name));
      const emojis = new Set(round.options.map((o) => o.emoji));
      expect(names.size).toBe(3);
      expect(emojis.size).toBe(3);

      // Verify option word starts with the target letter
      expect(round.correctName.toUpperCase().startsWith(round.letter)).toBe(true);

      // Verify distractors do NOT start with the target letter
      const distractors = round.options.filter((o) => o.emoji !== round.correct);
      distractors.forEach((d) => {
        expect(d.name.toUpperCase().startsWith(round.letter)).toBe(false);
      });
    });
  });

  it('ensures each station has pedagogical hints and mission notes', () => {
    SOUND_HUNT_CURRICULUM.forEach((round) => {
      expect(round.missionStation).toMatch(/Station \d+:/);
      expect(typeof round.hint).toBe('string');
      expect(round.hint.length).toBeGreaterThan(5);
    });
  });
});

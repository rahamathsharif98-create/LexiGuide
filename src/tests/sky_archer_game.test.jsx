import { describe, it, expect } from 'vitest';
import { PHONICS_TARGETS, getPhonicsRound } from '../games/sky-archer/engine/phonicsTargets';
import { getGameById } from '../data/gamingZoneRegistry';

describe('Sky Island Word Archer (3D Phonics Adventure)', () => {
  it('loads valid phonics target database with essential early reading digraphs and blends', () => {
    expect(PHONICS_TARGETS.length).toBeGreaterThanOrEqual(10);
    PHONICS_TARGETS.forEach((target) => {
      expect(target.id).toBeDefined();
      expect(target.sound).toBeDefined();
      expect(target.correct).toBeDefined();
      expect(target.options).toContain(target.correct);
      expect(target.options.length).toBe(4);
      expect(target.prompt).toBeDefined();
    });
  });

  it('generates a round with shuffled options containing the target answer', () => {
    const round0 = getPhonicsRound(0);
    expect(round0.correct).toBe('SH');
    expect(round0.shuffledOptions).toHaveLength(4);
    expect(round0.shuffledOptions).toContain('SH');
  });

  it('progresses through diverse rounds without index out of bounds', () => {
    for (let i = 0; i < 20; i++) {
      const round = getPhonicsRound(i);
      expect(round).toBeDefined();
      expect(round.correct).toBeDefined();
      expect(round.sound).toBeDefined();
    }
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('sky-archer');
    expect(game).toBeDefined();
    expect(game.title).toBe('Sky Word Archer');
    expect(game.route).toBe('/child/games/sky-archer');
    expect(game.dimension).toBe('3D Adventure');
  });
});
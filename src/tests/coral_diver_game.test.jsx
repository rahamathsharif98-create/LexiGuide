import { describe, it, expect } from 'vitest';
import { RHYME_LEVELS, getRhymeLevel } from '../games/coral-diver/engine/rhymeWords';
import { getGameById } from '../data/gamingZoneRegistry';

describe('Coral Reef Submarine Diver (3D Ocean Adventure)', () => {
  it('loads valid rhyme levels with phonics word families and distractors', () => {
    expect(RHYME_LEVELS.length).toBeGreaterThanOrEqual(5);
    RHYME_LEVELS.forEach((level) => {
      expect(level.id).toBeDefined();
      expect(level.family).toBeDefined();
      expect(level.targetWord).toBeDefined();
      expect(level.validRhymes.length).toBeGreaterThanOrEqual(3);
      expect(level.distractors.length).toBeGreaterThanOrEqual(2);
      expect(level.prompt).toBeDefined();
      expect(level.speechText).toBeDefined();
    });
  });

  it('cycles levels predictably without crashing on overflow indices', () => {
    const level0 = getRhymeLevel(0);
    expect(level0.targetWord).toBe('CAT');
    const level1 = getRhymeLevel(1);
    expect(level1.targetWord).toBe('PIG');
    const levelOverflow = getRhymeLevel(20);
    expect(levelOverflow).toBeDefined();
    expect(levelOverflow.validRhymes).toBeDefined();
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('coral-diver');
    expect(game).toBeDefined();
    expect(game.title).toBe('Coral Reef Submarine Diver');
    expect(game.route).toBe('/child/games/coral-diver');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('words');
  });
});

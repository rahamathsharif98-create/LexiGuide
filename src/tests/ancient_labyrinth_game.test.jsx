import { describe, it, expect } from 'vitest';
import { LABYRINTH_RIDDLES, getLabyrinthRiddle } from '../games/ancient-labyrinth/engine/labyrinthGlyphs';
import { getGameById } from '../data/gamingZoneRegistry';

describe('Ancient Labyrinth of Glyphs (3D Torchlight Maze)', () => {
  it('loads valid labyrinth riddles with chambers and distractors', () => {
    expect(LABYRINTH_RIDDLES.length).toBeGreaterThanOrEqual(5);
    LABYRINTH_RIDDLES.forEach((riddle) => {
      expect(riddle.id).toBeDefined();
      expect(riddle.word).toBeDefined();
      expect(riddle.chamber).toBeDefined();
      expect(riddle.distractors.length).toBeGreaterThanOrEqual(2);
      expect(riddle.prompt).toBeDefined();
      expect(riddle.speechText).toBeDefined();
    });
  });

  it('cycles riddles predictably without out-of-bounds error', () => {
    const r0 = getLabyrinthRiddle(0);
    expect(r0.word).toBe('OPEN');
    const r1 = getLabyrinthRiddle(1);
    expect(r1.word).toBe('LIGHT');
    const rOverflow = getLabyrinthRiddle(21);
    expect(rOverflow).toBeDefined();
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('ancient-labyrinth');
    expect(game).toBeDefined();
    expect(game.title).toBe('Ancient Labyrinth of Glyphs');
    expect(game.route).toBe('/child/games/ancient-labyrinth');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('letters');
  });
});

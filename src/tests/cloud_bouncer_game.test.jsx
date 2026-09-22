import { describe, it, expect } from 'vitest';
import { BOUNCE_LEVELS, getBounceLevel } from '../games/cloud-bouncer/engine/sightWordBounces';
import { getGameById } from '../data/gamingZoneRegistry';

describe('Whimsical Cloud Bouncer (3D Sight Word High-Jumper)', () => {
  it('loads valid sight word levels with multiple options containing the target', () => {
    expect(BOUNCE_LEVELS.length).toBeGreaterThanOrEqual(5);
    BOUNCE_LEVELS.forEach((level) => {
      expect(level.id).toBeDefined();
      expect(level.targetWord).toBeDefined();
      expect(level.options).toContain(level.targetWord);
      expect(level.options.length).toBeGreaterThanOrEqual(3);
      expect(level.prompt).toBeDefined();
      expect(level.speechText).toBeDefined();
    });
  });

  it('cycles bounce levels predictably without out-of-bounds error', () => {
    const l0 = getBounceLevel(0);
    expect(l0.targetWord).toBe('PLAY');
    const l1 = getBounceLevel(1);
    expect(l1.targetWord).toBe('SEE');
    const lOverflow = getBounceLevel(19);
    expect(lOverflow).toBeDefined();
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('cloud-bouncer');
    expect(game).toBeDefined();
    expect(game.title).toBe('Whimsical Cloud Bouncer');
    expect(game.route).toBe('/child/games/cloud-bouncer');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('words');
  });
});

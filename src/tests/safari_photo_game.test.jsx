import { describe, it, expect } from 'vitest';
import { SAFARI_TARGETS, getSafariTarget } from '../games/safari-photo/engine/safariAnimals';
import { getGameById } from '../data/gamingZoneRegistry';

describe('Safari Wildlife Photographer (3D Sight & Snap)', () => {
  it('loads valid savanna animal targets with phonics letters and sounds', () => {
    expect(SAFARI_TARGETS.length).toBeGreaterThanOrEqual(5);
    SAFARI_TARGETS.forEach((target) => {
      expect(target.id).toBeDefined();
      expect(target.animal).toBeDefined();
      expect(target.letter).toBeDefined();
      expect(target.sound).toBeDefined();
      expect(target.position.length).toBe(3);
      expect(target.fact).toBeDefined();
      expect(target.prompt).toBeDefined();
      expect(target.speechText).toBeDefined();
    });
  });

  it('cycles animal targets predictably without crash', () => {
    const a0 = getSafariTarget(0);
    expect(a0.animal).toBe('LION');
    const a1 = getSafariTarget(1);
    expect(a1.animal).toBe('ZEBRA');
    const aOverflow = getSafariTarget(22);
    expect(aOverflow).toBeDefined();
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('safari-photo');
    expect(game).toBeDefined();
    expect(game.title).toBe('Safari Wildlife Photographer');
    expect(game.route).toBe('/child/games/safari-photo');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('sounds');
  });
});

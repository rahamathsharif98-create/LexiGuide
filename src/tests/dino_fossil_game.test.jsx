import { describe, it, expect } from 'vitest';
import { DINO_TARGETS, getDinoTarget } from '../games/dino-fossil/engine/dinoTargets';
import { getGameById } from '../data/gamingZoneRegistry';

describe('Dino Fossil Excavator 3D (Phonics Dig Site)', () => {
  it('loads valid onset-rime fossil targets with distractors and clues', () => {
    expect(DINO_TARGETS.length).toBeGreaterThanOrEqual(5);
    DINO_TARGETS.forEach((target) => {
      expect(target.id).toBeDefined();
      expect(target.name).toBeDefined();
      expect(target.onset).toBeDefined();
      expect(target.rime).toBeDefined();
      expect(target.distractors.length).toBeGreaterThanOrEqual(2);
      expect(target.prompt).toBeDefined();
      expect(target.speechText).toBeDefined();
    });
  });

  it('cycles targets predictably without crashing on index overflow', () => {
    const t0 = getDinoTarget(0);
    expect(t0.name).toBe('T-REX');
    const t1 = getDinoTarget(1);
    expect(t1.name).toBe('BONE');
    const tOverflow = getDinoTarget(18);
    expect(tOverflow).toBeDefined();
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('dino-fossil');
    expect(game).toBeDefined();
    expect(game.title).toBe('Dino Fossil Excavator 3D');
    expect(game.route).toBe('/child/games/dino-fossil');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('words');
  });
});

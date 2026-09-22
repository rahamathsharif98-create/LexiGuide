import { describe, it, expect } from 'vitest';
import { SPIDER_LEVELS, getSpiderLevel } from '../games/spider-weaver/engine/spiderLevels';
import { getGameById } from '../data/gamingZoneRegistry';
import { normalizeSkillToPillar } from '../services/mockAiService';

describe('Spinny the Spider: Web Weaver (3D Phonics Onset-Rime Adventure)', () => {
  it('loads valid progressive levels with onset, rime options, and audio prompts', () => {
    expect(SPIDER_LEVELS.length).toBeGreaterThanOrEqual(6);
    SPIDER_LEVELS.forEach((level) => {
      expect(level.id).toBeDefined();
      expect(level.targetWord).toBeDefined();
      expect(level.onset).toBeDefined();
      expect(level.targetRime).toBeDefined();
      expect(level.options).toContain(level.targetRime);
      expect(level.options.length).toBeGreaterThanOrEqual(3);
      expect(level.audioPrompt).toBeDefined();
      expect(level.hint).toBeDefined();
      // Verify onset + targetRime equals targetWord
      expect(`${level.onset}${level.targetRime}`).toBe(level.targetWord);
    });
  });

  it('safely handles level index boundaries in getSpiderLevel', () => {
    const l0 = getSpiderLevel(0);
    expect(l0.targetWord).toBe('spin');
    expect(l0.onset).toBe('sp');
    expect(l0.targetRime).toBe('in');

    const l1 = getSpiderLevel(1);
    expect(l1.targetWord).toBe('web');

    // Clamps to last level on overflow
    const lOverflow = getSpiderLevel(99);
    expect(lOverflow.id).toBe(SPIDER_LEVELS[SPIDER_LEVELS.length - 1].id);

    // Clamps to 0 on negative index
    const lNegative = getSpiderLevel(-5);
    expect(lNegative.id).toBe(1);
  });

  it('is correctly registered in the Gaming Zone registry as a 3D Adventure', () => {
    const game = getGameById('spider-weaver');
    expect(game).toBeDefined();
    expect(game.title).toBe('Spinny the Spider: Web Weaver');
    expect(game.route).toBe('/child/games/spider-weaver');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('words');
    expect(game.skill).toBe('rimeBlending');
  });

  it('normalizes rimeBlending to the core Word Recognition literacy pillar', () => {
    const pillar = normalizeSkillToPillar('rimeBlending');
    expect(pillar).toBe('wordRecognition');

    const spiderPillar = normalizeSkillToPillar('spiderWebWeaving');
    expect(spiderPillar).toBe('wordRecognition');
  });
});

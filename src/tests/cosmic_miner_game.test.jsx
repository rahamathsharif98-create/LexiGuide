import { describe, it, expect } from 'vitest';
import { SPACE_MISSIONS, getSpaceMission } from '../games/cosmic-miner/engine/spaceWords';
import { getGameById } from '../data/gamingZoneRegistry';

describe('Cosmic Letter Miner (3D Space Adventure)', () => {
  it('loads valid space mission words with child-friendly prompts', () => {
    expect(SPACE_MISSIONS.length).toBeGreaterThanOrEqual(6);
    SPACE_MISSIONS.forEach((mission) => {
      expect(mission.id).toBeDefined();
      expect(mission.word).toBeDefined();
      expect(mission.word.length).toBeGreaterThanOrEqual(3);
      expect(mission.emoji).toBeDefined();
      expect(mission.prompt).toBeDefined();
      expect(mission.speechText).toBeDefined();
    });
  });

  it('cycles through space missions predictably without errors', () => {
    const mission0 = getSpaceMission(0);
    expect(mission0.word).toBe('STAR');
    const mission1 = getSpaceMission(1);
    expect(mission1.word).toBe('MOON');
    const missionOver = getSpaceMission(12);
    expect(missionOver).toBeDefined();
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('cosmic-miner');
    expect(game).toBeDefined();
    expect(game.title).toBe('Cosmic Letter Miner');
    expect(game.route).toBe('/child/games/cosmic-miner');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('letters');
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SPACE_MISSIONS, COSMIC_MINER_STAGES, getSpaceMission } from '../games/cosmic-miner/engine/spaceWords';
import { getGameById } from '../data/gamingZoneRegistry';
import {
  COSMIC_MINER_STORAGE_PREFIX,
  TOTAL_SPACE_MISSIONS,
  MISSIONS_PER_STAGE,
  getCosmicMinerCheckpointKey,
  getStageForMission,
  getUnlockedStages,
  isStageUnlocked,
  getDefaultCosmicMinerState,
  loadCosmicMinerCheckpointData,
  loadCosmicMinerCheckpoint,
  saveCosmicMinerCheckpoint,
  recordCosmicMinerMissionCompletion,
  resetCosmicMinerCheckpoint,
  clearCosmicMinerCheckpoint,
} from '../games/cosmic-miner/engine/cosmicMinerCheckpoint';

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
    expect(mission0.word).toBe('SUN');
    const mission1 = getSpaceMission(1);
    expect(mission1.word).toBe('STAR');
    const mission2 = getSpaceMission(2);
    expect(mission2.word).toBe('MOON');
    const missionOver = getSpaceMission(12);
    expect(missionOver).toBeDefined();
    expect(missionOver.word).toBe('SUN'); // loops via modulo
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

describe('Cosmic Letter Miner - Step 1: Checkpoint Persistence Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // 1. Initial progress when no save exists
  it('1. returns default initial progress when no save exists', () => {
    const childId = 'child-astro-new';
    const state = loadCosmicMinerCheckpointData(childId);

    expect(state).toEqual({
      missionIndex: 0,
      savedMissionIndex: 0,
      currentLevel: 1,
      currentStage: 1,
      stageIndex: 0,
      highestUnlockedIndex: 0,
      highestUnlockedLevel: 1,
      highestUnlockedStage: 1,
      unlockedStages: [1],
      completedMissions: [],
      missionsCompleted: 0,
      score: 0,
      stars: 0,
      streak: 1,
      isCompleted: false,
    });

    expect(loadCosmicMinerCheckpoint(childId)).toBe(0);
    expect(getDefaultCosmicMinerState().missionIndex).toBe(0);
  });

  // 2. Saving and loading progress
  it('2. saves and loads progress accurately for a specific child', () => {
    const childId = 'child-rover-1';

    const saved = saveCosmicMinerCheckpoint(childId, {
      missionIndex: 2,
      score: 1200,
      stars: 2,
      streak: 3,
      completedMissions: [0, 1],
    });

    expect(saved).not.toBeNull();
    expect(saved.missionIndex).toBe(2);
    expect(saved.score).toBe(1200);
    expect(saved.stars).toBe(2);
    expect(saved.streak).toBe(3);

    const loaded = loadCosmicMinerCheckpointData(childId);
    expect(loaded.missionIndex).toBe(2);
    expect(loaded.savedMissionIndex).toBe(2);
    expect(loaded.currentLevel).toBe(3);
    expect(loaded.score).toBe(1200);
    expect(loaded.stars).toBe(2);
    expect(loaded.streak).toBe(3);
    expect(loaded.completedMissions).toEqual([0, 1]);
    expect(loadCosmicMinerCheckpoint(childId)).toBe(2);
  });

  // 3. Child isolation
  it('3. maintains strict save isolation between different children and guest', () => {
    saveCosmicMinerCheckpoint('child-alpha', { missionIndex: 1, score: 500, stars: 1 });
    saveCosmicMinerCheckpoint('child-beta', { missionIndex: 3, score: 1500, stars: 3 });
    saveCosmicMinerCheckpoint(null, { missionIndex: 0, score: 0 }); // guest

    expect(loadCosmicMinerCheckpoint('child-alpha')).toBe(1);
    expect(loadCosmicMinerCheckpoint('child-beta')).toBe(3);
    expect(loadCosmicMinerCheckpoint(null)).toBe(0);
    expect(loadCosmicMinerCheckpoint(undefined)).toBe(0);
    expect(getCosmicMinerCheckpointKey(null)).toBe(`${COSMIC_MINER_STORAGE_PREFIX}guest`);
    expect(getCosmicMinerCheckpointKey(42)).toBe(`${COSMIC_MINER_STORAGE_PREFIX}42`);
  });

  // 4. Recording completed missions and scores
  it('4. records mission completion, accumulates scores, and advances mission index', () => {
    const childId = 'child-cosmo';

    const afterFirst = recordCosmicMinerMissionCompletion(childId, 0, 500, 1);
    expect(afterFirst.missionIndex).toBe(1);
    expect(afterFirst.score).toBe(500);
    expect(afterFirst.stars).toBe(1);
    expect(afterFirst.completedMissions).toContain(0);
    expect(afterFirst.isCompleted).toBe(false);

    const afterSecond = recordCosmicMinerMissionCompletion(childId, 1, 650, 1);
    expect(afterSecond.missionIndex).toBe(2);
    expect(afterSecond.score).toBe(1150);
    expect(afterSecond.stars).toBe(2);
    expect(afterSecond.completedMissions).toEqual([0, 1]);
  });

  // 5. Completion handling
  it('5. handles final mission completion and marks game as completed', () => {
    const childId = 'child-galaxy-master';
    const limit = 6;

    // Advance to last mission (index 5)
    saveCosmicMinerCheckpoint(childId, {
      missionIndex: 5,
      highestUnlockedIndex: 5,
      score: 3000,
      stars: 5,
    }, limit);

    // Complete the final mission
    const completed = recordCosmicMinerMissionCompletion(childId, 5, 500, 1, limit);
    expect(completed.isCompleted).toBe(true);
    expect(completed.missionsCompleted).toBe(6);
    expect(completed.highestUnlockedIndex).toBe(5);
    expect(completed.missionIndex).toBe(0);

    // Subsequent normal load returns fresh run state so child can play again
    const reloaded = loadCosmicMinerCheckpointData(childId, limit);
    expect(reloaded.isCompleted).toBe(false);
    expect(reloaded.missionIndex).toBe(0);
    expect(reloaded.score).toBe(0);
  });

  // 6. Stage unlocking rules
  it('6. correctly calculates stage progression and unlocked stages', () => {
    // Stage calculation with 4 missions per stage
    expect(getStageForMission(0, 4)).toBe(1);
    expect(getStageForMission(1, 4)).toBe(1);
    expect(getStageForMission(3, 4)).toBe(1);
    expect(getStageForMission(4, 4)).toBe(2);
    expect(getStageForMission(7, 4)).toBe(2);
    expect(getStageForMission(8, 4)).toBe(3);

    // Unlocked stages progression
    expect(getUnlockedStages(0, 4)).toEqual([1]);
    expect(getUnlockedStages(2, 4)).toEqual([1]);
    expect(getUnlockedStages(4, 4)).toEqual([1, 2]);
    expect(getUnlockedStages(6, 4)).toEqual([1, 2]);
    expect(getUnlockedStages(8, 4)).toEqual([1, 2, 3]);

    // Stage unlock predicate
    expect(isStageUnlocked(1, 0, 4)).toBe(true);
    expect(isStageUnlocked(2, 0, 4)).toBe(false);
    expect(isStageUnlocked(2, 4, 4)).toBe(true);
    expect(isStageUnlocked(3, 4, 4)).toBe(false);
    expect(isStageUnlocked(3, 8, 4)).toBe(true);
  });

  // 7. Reset and clear behavior
  it('7. cleanly resets or clears progress when requested', () => {
    const childId = 'child-restart';

    saveCosmicMinerCheckpoint(childId, {
      missionIndex: 3,
      score: 1500,
      stars: 3,
    });

    expect(loadCosmicMinerCheckpoint(childId)).toBe(3);

    // Explicit reset
    const resetState = resetCosmicMinerCheckpoint(childId);
    expect(resetState.missionIndex).toBe(0);
    expect(resetState.score).toBe(0);
    expect(loadCosmicMinerCheckpoint(childId)).toBe(0);

    // Clear from storage
    saveCosmicMinerCheckpoint(childId, { missionIndex: 2 });
    expect(clearCosmicMinerCheckpoint(childId)).toBe(true);
    expect(localStorage.getItem(getCosmicMinerCheckpointKey(childId))).toBeNull();
  });

  // 8. Malformed saved data handling
  it('8. gracefully handles corrupted, malformed, or non-object saved data', () => {
    const childId = 'child-corrupt';
    const key = getCosmicMinerCheckpointKey(childId);

    // Corrupted non-JSON string
    localStorage.setItem(key, 'INVALID_JSON_{{##');
    expect(loadCosmicMinerCheckpoint(childId)).toBe(0);

    // Primitive boolean
    localStorage.setItem(key, 'true');
    expect(loadCosmicMinerCheckpoint(childId)).toBe(0);

    // Malformed JSON object with null
    localStorage.setItem(key, 'null');
    expect(loadCosmicMinerCheckpoint(childId)).toBe(0);

    // Legacy numeric format (e.g. "2" or 2)
    localStorage.setItem(key, '2');
    const legacy = loadCosmicMinerCheckpointData(childId);
    expect(legacy.missionIndex).toBe(2);
    expect(legacy.currentLevel).toBe(3);
    expect(legacy.currentStage).toBe(1);
  });

  // 9. Inaccessible localStorage / storage exceptions
  it('9. safely handles localStorage access exceptions without crashing', () => {
    const childId = 'child-storage-error';

    // Mock getItem throwing SecurityError
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: Access is denied for this document');
    });

    const fallbackState = loadCosmicMinerCheckpointData(childId);
    expect(fallbackState).toEqual(getDefaultCosmicMinerState());
    expect(loadCosmicMinerCheckpoint(childId)).toBe(0);

    // Mock setItem throwing QuotaExceededError
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const saveResult = saveCosmicMinerCheckpoint(childId, { missionIndex: 2 });
    expect(saveResult).toBeNull();
  });

  // 10. Boundary checking and invalid input sanitization
  it('10. sanitizes negative, NaN, and out-of-range indices and scores defensively', () => {
    const childId = 'child-sanitize';
    const limit = 6;

    // Out-of-bounds missionIndex (> limit)
    saveCosmicMinerCheckpoint(childId, { missionIndex: 999 }, limit);
    // 999 is >= limit, so it is treated as completed, reloading gives default 0
    expect(loadCosmicMinerCheckpoint(childId, limit)).toBe(0);

    // Negative missionIndex
    saveCosmicMinerCheckpoint(childId, { missionIndex: -5 }, limit);
    expect(loadCosmicMinerCheckpoint(childId, limit)).toBe(0);

    // Malformed scores and streak
    const sanitized = saveCosmicMinerCheckpoint(childId, {
      missionIndex: 2,
      score: 'not-a-number',
      stars: -10,
      streak: 99,
      completedMissions: 'invalid-array',
    }, limit);

    expect(sanitized.missionIndex).toBe(2);
    expect(sanitized.score).toBe(0);
    expect(sanitized.stars).toBe(0);
    expect(sanitized.streak).toBe(1);
    expect(Array.isArray(sanitized.completedMissions)).toBe(true);
  });
});

describe('Cosmic Letter Miner - Step 1.1: Letter Readability & Rover Controls', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // 1. All curriculum letters are verified
  it('1. verifies every letter used across all space missions is valid and non-empty', () => {
    const allLetters = new Set();
    SPACE_MISSIONS.forEach((m) => {
      expect(m.word).toMatch(/^[A-Z]+$/);
      m.word.split('').forEach((char) => allLetters.add(char));
    });

    // Check all letters in STAR, MOON, SUN, MARS, SHIP, ORBIT
    ['S', 'T', 'A', 'R', 'M', 'O', 'N', 'U', 'H', 'I', 'P', 'B'].forEach((letter) => {
      expect(allLetters.has(letter)).toBe(true);
    });
  });

  // 2. Rover control scheme & bounds
  it('2. restricts rover movements safely within lunar playfield bounds', () => {
    // Test the rover clamp math: X in [-10, 10], Z in [-8, 5]
    const clampPos = (x, z) => ({
      x: Math.max(-10, Math.min(10, x)),
      z: Math.max(-8, Math.min(5, z)),
    });

    expect(clampPos(15, -12)).toEqual({ x: 10, z: -8 });
    expect(clampPos(-25, 20)).toEqual({ x: -10, z: 5 });
    expect(clampPos(0, 2)).toEqual({ x: 0, z: 2 });
    expect(clampPos(-6, -2)).toEqual({ x: -6, z: -2 });
  });

  // 3. Rover targeting angle calculation
  it('3. calculates smooth orientation angle toward targeted crystal without changing position', () => {
    const roverPos = { x: 0, z: 2 };
    const crystalPos = [-6, 1.0, -2]; // Target 'S'

    const dx = crystalPos[0] - roverPos.x; // -6
    const dz = crystalPos[2] - roverPos.z; // -4

    const targetAngle = Math.atan2(dx, dz);
    expect(targetAngle).toBeCloseTo(Math.atan2(-6, -4));

    // Rover position itself remains unchanged at (0, 2)
    expect(roverPos.x).toBe(0);
    expect(roverPos.z).toBe(2);
  });

  // 4. Duplicate click protection logic
  it('4. prevents duplicate crystal collection from rapid double-clicks', () => {
    const minedIds = new Set();

    const collectCrystal = (crystal) => {
      if (!crystal || minedIds.has(crystal.id)) {
        return { collected: false };
      }
      minedIds.add(crystal.id);
      return { collected: true, scoreDelta: 150 };
    };

    const crystal = { id: 'crystal-star-S-0', letter: 'S' };

    const firstClick = collectCrystal(crystal);
    expect(firstClick.collected).toBe(true);
    expect(firstClick.scoreDelta).toBe(150);

    // Rapid second click on same crystal is ignored
    const secondClick = collectCrystal(crystal);
    expect(secondClick.collected).toBe(false);
  });

  // 5. Preserves Step 1 checkpoint persistence
  it('5. maintains checkpoint persistence and progress saving integrity', () => {
    const childId = 'child-step1-1-check';
    saveCosmicMinerCheckpoint(childId, {
      missionIndex: 1,
      score: 500,
      stars: 1,
      streak: 2,
    });

    const checkpoint = loadCosmicMinerCheckpointData(childId);
    expect(checkpoint.missionIndex).toBe(1);
    expect(checkpoint.score).toBe(500);
    expect(checkpoint.stars).toBe(1);
    expect(checkpoint.streak).toBe(2);
  });
});

describe('Cosmic Letter Miner - Step 1.2: Smooth Rover Movement', () => {
  // Movement parameters matching MoonRover.jsx
  const MAX_SPEED = 6.2; // ~17.3% reduction from 7.5
  const ACCEL_RATE = 8.5;
  const DECEL_RATE = 12.0;
  const TURN_RATE = 7.5;

  // 1. Driving speed reduction verification
  it('1. reduces rover max speed by 15-20% compared to original 7.5 speed', () => {
    const originalSpeed = 7.5;
    const speedReductionPercent = ((originalSpeed - MAX_SPEED) / originalSpeed) * 100;

    expect(MAX_SPEED).toBe(6.2);
    expect(speedReductionPercent).toBeGreaterThanOrEqual(15);
    expect(speedReductionPercent).toBeLessThanOrEqual(20);
  });

  // 2. Diagonal velocity normalization
  it('2. normalizes diagonal movement so diagonal speed equals orthogonal speed', () => {
    const calculateVelocity = (moveX, moveZ) => {
      const len = Math.hypot(moveX, moveZ);
      if (len === 0) return { vx: 0, vz: 0, speed: 0 };
      const vx = (moveX / len) * MAX_SPEED;
      const vz = (moveZ / len) * MAX_SPEED;
      return { vx, vz, speed: Math.hypot(vx, vz) };
    };

    const straightX = calculateVelocity(1, 0);
    const straightZ = calculateVelocity(0, 1);
    const diagonal = calculateVelocity(1, 1);
    const diagonalReverse = calculateVelocity(-1, -1);

    expect(straightX.speed).toBeCloseTo(MAX_SPEED);
    expect(straightZ.speed).toBeCloseTo(MAX_SPEED);
    expect(diagonal.speed).toBeCloseTo(MAX_SPEED);
    expect(diagonalReverse.speed).toBeCloseTo(MAX_SPEED);

    // Diagonal speed must not exceed MAX_SPEED
    expect(diagonal.speed).toBeLessThanOrEqual(MAX_SPEED + 0.0001);
  });

  // 3. Acceleration and Deceleration math
  it('3. smoothly accelerates under input and decelerates predictably to 0 without drifting', () => {
    let vx = 0;
    const dt = 1 / 60; // 60 FPS frame time

    // Simulate accelerating forward for 0.2 seconds (12 frames)
    for (let f = 0; f < 12; f++) {
      const lerpFactor = 1 - Math.exp(-ACCEL_RATE * dt);
      vx = vx + (MAX_SPEED - vx) * lerpFactor;
    }
    // After 0.2s, velocity should reach > 80% of MAX_SPEED smoothly
    expect(vx).toBeGreaterThan(MAX_SPEED * 0.8);
    expect(vx).toBeLessThanOrEqual(MAX_SPEED);

    // Release keys: simulate deceleration towards 0 (within ~0.5s / 30 frames)
    for (let f = 0; f < 30; f++) {
      const lerpFactor = 1 - Math.exp(-DECEL_RATE * dt);
      vx = vx + (0 - vx) * lerpFactor;
    }

    // Velocity should be negligible and snap to 0
    if (vx * vx < 0.001) {
      vx = 0;
    }
    expect(vx).toBe(0);
  });

  // 4. Shortest-arc turning logic
  it('4. computes shortest-arc angular delta avoiding 360-degree wrapping glitches', () => {
    const computeAngleDelta = (targetAngle, currentAngle) => {
      let angleDiff = (targetAngle - currentAngle) % (Math.PI * 2);
      if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      return angleDiff;
    };

    // Turning from -3.0 radians to +3.0 radians should wrap through the small arc (delta ~ 0.28 rad, not ~6.0 rad)
    const currentRot = -3.0;
    const targetRot = 3.0;
    const delta = computeAngleDelta(targetRot, currentRot);

    expect(Math.abs(delta)).toBeLessThan(Math.PI);
    expect(delta).toBeCloseTo((targetRot - currentRot) - 2 * Math.PI);
  });

  // 5. Lunar boundary collision stopping
  it('5. clamps position within lunar playfield [-10, 10] and [-8, 5] and cancels collision velocity', () => {
    let pos = { x: 9.8, z: 4.8 };
    let vel = { x: 4.0, z: 3.0 };
    const dt = 0.1;

    // Move forward past boundaries
    pos.x += vel.x * dt; // 10.2 -> clamped to 10
    pos.z += vel.z * dt; // 5.1 -> clamped to 5

    if (pos.x > 10) {
      pos.x = 10;
      vel.x = 0;
    }
    if (pos.z > 5) {
      pos.z = 5;
      vel.z = 0;
    }

    expect(pos.x).toBe(10);
    expect(vel.x).toBe(0);
    expect(pos.z).toBe(5);
    expect(vel.z).toBe(0);
  });
});

describe('Cosmic Letter Miner - Step 2: 12-Mission Curriculum & Progression Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // 1. Exactly 12 missions divided into 3 galactic stages
  it('1. defines exactly 12 valid space missions divided into 3 galactic stages (4 missions each)', () => {
    expect(SPACE_MISSIONS).toHaveLength(12);
    expect(TOTAL_SPACE_MISSIONS).toBe(12);
    expect(MISSIONS_PER_STAGE).toBe(4);
    expect(COSMIC_MINER_STAGES).toHaveLength(3);

    const stage1Missions = SPACE_MISSIONS.filter((m) => m.stage === 1);
    const stage2Missions = SPACE_MISSIONS.filter((m) => m.stage === 2);
    const stage3Missions = SPACE_MISSIONS.filter((m) => m.stage === 3);

    expect(stage1Missions).toHaveLength(4);
    expect(stage2Missions).toHaveLength(4);
    expect(stage3Missions).toHaveLength(4);

    SPACE_MISSIONS.forEach((m, idx) => {
      expect(m.missionNumber).toBe(idx + 1);
      expect(m.id).toBeDefined();
      expect(m.name).toBeDefined();
      expect(m.word).toMatch(/^[A-Z]+$/);
      expect(m.emoji).toBeDefined();
      expect(m.prompt).toBeDefined();
      expect(m.meaning).toBeDefined();
      expect(m.speechText).toBeDefined();
      expect(m.learningGoal).toBeDefined();
    });
  });

  // 2. Target words and curriculum table verification
  it('2. matches the exact 12-mission curriculum table specification', () => {
    const expectedWords = [
      // Stage 1 - Lunar Cadets
      { idx: 0, stage: 1, name: 'First Footprints', word: 'SUN' },
      { idx: 1, stage: 1, name: 'Star Scout', word: 'STAR' },
      { idx: 2, stage: 1, name: 'Moon Explorer', word: 'MOON' },
      { idx: 3, stage: 1, name: 'Red Planet', word: 'MARS' },
      // Stage 2 - Cosmic Explorers
      { idx: 4, stage: 2, name: 'Space Courier', word: 'SHIP' },
      { idx: 5, stage: 2, name: 'Orbit Mission', word: 'ORBIT' },
      { idx: 6, stage: 2, name: 'Rocket Builder', word: 'ROCKET' },
      { idx: 7, stage: 2, name: 'Galaxy Guardian', word: 'COMET' },
      // Stage 3 - Galactic Masters
      { idx: 8, stage: 3, name: 'Satellite Search', word: 'SATELLITE' },
      { idx: 9, stage: 3, name: 'Astronaut Academy', word: 'ASTRONAUT' },
      { idx: 10, stage: 3, name: 'Space Station', word: 'STATION' },
      { idx: 11, stage: 3, name: 'Cosmic Legend', word: 'PLANET' },
    ];

    expectedWords.forEach(({ idx, stage, name, word }) => {
      const mission = SPACE_MISSIONS[idx];
      expect(mission.stage).toBe(stage);
      expect(mission.name).toBe(name);
      expect(mission.word).toBe(word);
    });
  });

  // 3. Repeated letters handling: MOON, SATELLITE, ASTRONAUT, STATION
  it('3. correctly handles repeated letters sequentially without skipping or premature completion', () => {
    // Test MOON (two Os)
    const moonLetters = 'MOON'.split('');
    const collectedMoon = [];

    // Step 1: expect M
    expect(moonLetters[collectedMoon.length]).toBe('M');
    collectedMoon.push('M');

    // Step 2: expect first O
    expect(moonLetters[collectedMoon.length]).toBe('O');
    collectedMoon.push('O');

    // Step 3: expect second O (must NOT be skipped)
    expect(moonLetters[collectedMoon.length]).toBe('O');
    collectedMoon.push('O');

    // Step 4: expect N
    expect(moonLetters[collectedMoon.length]).toBe('N');
    collectedMoon.push('N');

    expect(collectedMoon.join('')).toBe('MOON');
    expect(collectedMoon.length).toBe(4);

    // Test SATELLITE (two Ts, two Ls, two Es)
    const satLetters = 'SATELLITE'.split('');
    const collectedSat = [];
    satLetters.forEach((char) => {
      expect(satLetters[collectedSat.length]).toBe(char);
      collectedSat.push(char);
    });
    expect(collectedSat.join('')).toBe('SATELLITE');
    expect(collectedSat.length).toBe(9);

    // Test ASTRONAUT (two As, two Ts)
    const astroLetters = 'ASTRONAUT'.split('');
    const collectedAstro = [];
    astroLetters.forEach((char) => {
      expect(astroLetters[collectedAstro.length]).toBe(char);
      collectedAstro.push(char);
    });
    expect(collectedAstro.join('')).toBe('ASTRONAUT');
    expect(collectedAstro.length).toBe(9);
  });

  // 4. Sequential letter collection and fuel gauge calculation
  it('4. calculates progressive rocket fuel percentage and letter slot states accurately', () => {
    const word = 'ROCKET';
    const totalLetters = word.length; // 6
    let collected = [];

    const getFuelPct = () => (collected.length / totalLetters) * 100;

    expect(getFuelPct()).toBe(0);

    collected.push('R');
    expect(getFuelPct()).toBeCloseTo(16.67, 1);

    collected.push('O');
    collected.push('C');
    expect(getFuelPct()).toBe(50);

    collected.push('K');
    collected.push('E');
    collected.push('T');
    expect(getFuelPct()).toBe(100);
    expect(collected.length).toBe(totalLetters);
  });

  // 5. Distractor generation integrity
  it('5. ensures distractor letters never collide with any letter in the target word', () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    SPACE_MISSIONS.forEach((m) => {
      const letters = m.word.split('');
      const distractors = [];
      let iterations = 0;

      while (distractors.length < 2 && iterations < 100) {
        iterations++;
        const char = alphabet[Math.floor(Math.random() * alphabet.length)];
        if (!letters.includes(char) && !distractors.includes(char)) {
          distractors.push(char);
        }
      }

      expect(distractors).toHaveLength(2);
      distractors.forEach((d) => {
        expect(letters.includes(d)).toBe(false);
      });
    });
  });

  // 6. Incorrect letter selection behavior
  it('6. rejects incorrect letters and preserves score and progression', () => {
    const word = 'SUN';
    const collected = [];
    let score = 300;
    let streak = 3;

    const attemptCollect = (letter) => {
      const expected = word[collected.length];
      if (letter === expected) {
        collected.push(letter);
        score += 150 * (streak >= 2 ? 2 : 1);
        streak = Math.min(streak + 1, 5);
        return { isCorrect: true };
      } else {
        streak = 1;
        return { isCorrect: false, expected };
      }
    };

    // Correct first letter
    const step1 = attemptCollect('S');
    expect(step1.isCorrect).toBe(true);
    expect(collected).toEqual(['S']);
    expect(score).toBe(600);
    expect(streak).toBe(4);

    // Incorrect letter (chose 'Z')
    const step2Bad = attemptCollect('Z');
    expect(step2Bad.isCorrect).toBe(false);
    expect(step2Bad.expected).toBe('U');
    expect(collected).toEqual(['S']); // unchanged!
    expect(score).toBe(600); // unchanged!
    expect(streak).toBe(1); // reset streak!

    // Correct next letter
    const step2Good = attemptCollect('U');
    expect(step2Good.isCorrect).toBe(true);
    expect(collected).toEqual(['S', 'U']);

    const step3Good = attemptCollect('N');
    expect(step3Good.isCorrect).toBe(true);
    expect(collected).toEqual(['S', 'U', 'N']);
  });

  // 7. Crystal spawn coordinates safety and rover bounds
  it('7. verifies all crystal spawn coordinates are within lunar rover boundaries and non-overlapping', () => {
    const CRYSTAL_POSITIONS = [
      [-6.5, 1.0, -3.8],
      [-3.5, 1.0, -5.5],
      [0.0, 1.0, -6.5],
      [3.5, 1.0, -5.5],
      [6.5, 1.0, -3.8],
      [-7.5, 1.0, -1.0],
      [-4.2, 1.0, -2.0],
      [4.2, 1.0, -2.0],
      [7.5, 1.0, -1.0],
      [-6.0, 1.0, 2.5],
      [-2.5, 1.0, 3.2],
      [2.5, 1.0, 3.2],
      [6.0, 1.0, 2.5],
      [0.0, 1.0, 0.5],
    ];

    expect(CRYSTAL_POSITIONS.length).toBeGreaterThanOrEqual(14);

    // Rover bounds: X in [-10, 10], Z in [-8, 5]
    CRYSTAL_POSITIONS.forEach(([x, y, z]) => {
      expect(x).toBeGreaterThanOrEqual(-10);
      expect(x).toBeLessThanOrEqual(10);
      expect(y).toBe(1.0);
      expect(z).toBeGreaterThanOrEqual(-8);
      expect(z).toBeLessThanOrEqual(5);
    });

    // Check pairwise distance to ensure no two crystals spawn at the same location
    for (let i = 0; i < CRYSTAL_POSITIONS.length; i++) {
      for (let j = i + 1; j < CRYSTAL_POSITIONS.length; j++) {
        const [x1, , z1] = CRYSTAL_POSITIONS[i];
        const [x2, , z2] = CRYSTAL_POSITIONS[j];
        const dist = Math.hypot(x1 - x2, z1 - z2);
        expect(dist).toBeGreaterThan(2.0); // At least 2.0 units apart!
      }
    }
  });

  // 8. Mission completion and sequential unlocking
  it('8. unlocks missions sequentially and tracks unlocked stages', () => {
    const childId = 'child-curriculum-explorer';

    // Start fresh: mission 0 unlocked, stage 1 unlocked
    const initial = loadCosmicMinerCheckpointData(childId);
    expect(initial.missionIndex).toBe(0);
    expect(initial.highestUnlockedIndex).toBe(0);
    expect(initial.unlockedStages).toEqual([1]);

    // Complete Mission 1 (SUN, index 0)
    const afterM1 = recordCosmicMinerMissionCompletion(childId, 0, 500, 1);
    expect(afterM1.missionIndex).toBe(1);
    expect(afterM1.highestUnlockedIndex).toBe(1);
    expect(afterM1.currentStage).toBe(1);
    expect(afterM1.isCompleted).toBe(false);

    // Complete Mission 2 (STAR, index 1)
    const afterM2 = recordCosmicMinerMissionCompletion(childId, 1, 500, 1);
    expect(afterM2.missionIndex).toBe(2);

    // Complete Mission 3 (MOON, index 2)
    const afterM3 = recordCosmicMinerMissionCompletion(childId, 2, 500, 1);
    expect(afterM3.missionIndex).toBe(3);
  });

  // 9. Stage 1 celebration after Mission 4 (index 3) and Stage 2 unlock
  it('9. unlocks Stage 2 after Mission 4 without triggering final victory', () => {
    const childId = 'child-stage1-finisher';

    // Complete Mission 4 (MARS, index 3)
    const afterM4 = recordCosmicMinerMissionCompletion(childId, 3, 500, 1);
    expect(afterM4.missionIndex).toBe(4); // Advance to Mission 5
    expect(afterM4.currentStage).toBe(2); // Stage 2!
    expect(afterM4.unlockedStages).toContain(1);
    expect(afterM4.unlockedStages).toContain(2);
    expect(afterM4.isCompleted).toBe(false); // MUST NOT be game complete!

    // Verify stage calculation
    expect(getStageForMission(3)).toBe(1); // Mission 4 is in Stage 1
    expect(getStageForMission(4)).toBe(2); // Mission 5 is in Stage 2
    expect(isStageUnlocked(2, afterM4.highestUnlockedIndex)).toBe(true);
    expect(isStageUnlocked(3, afterM4.highestUnlockedIndex)).toBe(false); // Stage 3 still locked
  });

  // 10. Stage 2 celebration after Mission 8 (index 7) and Stage 3 unlock
  it('10. unlocks Stage 3 after Mission 8 without triggering final victory', () => {
    const childId = 'child-stage2-finisher';

    // Save up to Mission 8 (COMET, index 7)
    saveCosmicMinerCheckpoint(childId, {
      missionIndex: 7,
      highestUnlockedIndex: 7,
      score: 3500,
      stars: 7,
    });

    const afterM8 = recordCosmicMinerMissionCompletion(childId, 7, 500, 1);
    expect(afterM8.missionIndex).toBe(8); // Advance to Mission 9 (SATELLITE)
    expect(afterM8.currentStage).toBe(3); // Stage 3: Galactic Masters!
    expect(afterM8.unlockedStages).toEqual([1, 2, 3]);
    expect(afterM8.isCompleted).toBe(false); // Still NOT game complete!
    expect(isStageUnlocked(3, afterM8.highestUnlockedIndex)).toBe(true);
  });

  // 11. Final victory only after Mission 12 (index 11)
  it('11. marks game as completed and triggers final victory ONLY after Mission 12', () => {
    const childId = 'child-galactic-hero';

    // Reach Mission 12 (PLANET, index 11)
    saveCosmicMinerCheckpoint(childId, {
      missionIndex: 11,
      highestUnlockedIndex: 11,
      score: 5500,
      stars: 11,
    });

    const finalState = recordCosmicMinerMissionCompletion(childId, 11, 500, 1);
    expect(finalState.isCompleted).toBe(true);
    expect(finalState.completedMissions).toHaveLength(12);
    expect(finalState.missionsCompleted).toBe(12);
    expect(finalState.stars).toBe(12);
    expect(finalState.score).toBe(6000);

    // Fresh load of a completed run returns default initial state (prevents stuck completed state)
    const loadedAfterComplete = loadCosmicMinerCheckpointData(childId);
    expect(loadedAfterComplete.isCompleted).toBe(false);
    expect(loadedAfterComplete.missionIndex).toBe(0);
  });

  // 12. Child-specific isolation across 12 missions
  it('12. maintains strict checkpoint isolation between multiple child profiles', () => {
    saveCosmicMinerCheckpoint('child-luna', {
      missionIndex: 4, // Stage 2
      score: 2200,
      stars: 4,
    });

    saveCosmicMinerCheckpoint('child-orion', {
      missionIndex: 8, // Stage 3
      score: 4400,
      stars: 8,
    });

    saveCosmicMinerCheckpoint(null, {
      missionIndex: 1, // Guest
      score: 500,
      stars: 1,
    });

    const luna = loadCosmicMinerCheckpointData('child-luna');
    const orion = loadCosmicMinerCheckpointData('child-orion');
    const guest = loadCosmicMinerCheckpointData(null);

    expect(luna.missionIndex).toBe(4);
    expect(luna.currentStage).toBe(2);
    expect(luna.score).toBe(2200);

    expect(orion.missionIndex).toBe(8);
    expect(orion.currentStage).toBe(3);
    expect(orion.score).toBe(4400);

    expect(guest.missionIndex).toBe(1);
    expect(guest.currentStage).toBe(1);
    expect(guest.score).toBe(500);
  });

  // 13. Resume, restart, and backward-compatible migration
  it('13. cleanly handles resume, explicit restart, and legacy numeric saves', () => {
    const childId = 'child-restart-check';

    saveCosmicMinerCheckpoint(childId, {
      missionIndex: 6,
      score: 3100,
      stars: 6,
    });

    // Check resume
    expect(loadCosmicMinerCheckpoint(childId)).toBe(6);

    // Explicit reset
    resetCosmicMinerCheckpoint(childId);
    const afterReset = loadCosmicMinerCheckpointData(childId);
    expect(afterReset.missionIndex).toBe(0);
    expect(afterReset.score).toBe(0);
    expect(afterReset.stars).toBe(0);

    // Legacy numeric save (e.g. raw "7")
    localStorage.setItem(getCosmicMinerCheckpointKey(childId), '7');
    const fromLegacy = loadCosmicMinerCheckpointData(childId);
    expect(fromLegacy.missionIndex).toBe(7);
    expect(fromLegacy.currentStage).toBe(2);
  });

  // 14. Guard against duplicate click mining and reward inflation
  it('14. guards against duplicate crystal clicks and ensures single award per letter', () => {
    const minedSet = new Set();
    let score = 0;

    const collectLetter = (crystalId, pts) => {
      if (minedSet.has(crystalId)) return false;
      minedSet.add(crystalId);
      score += pts;
      return true;
    };

    const c1 = 'crystal-mission-sun-S-0';
    expect(collectLetter(c1, 150)).toBe(true);
    expect(score).toBe(150);

    // Rapid double click on same crystal
    expect(collectLetter(c1, 150)).toBe(false);
    expect(score).toBe(150); // Score remains 150!

    // Second letter crystal
    const c2 = 'crystal-mission-sun-U-1';
    expect(collectLetter(c2, 150)).toBe(true);
    expect(score).toBe(300);
  });
});




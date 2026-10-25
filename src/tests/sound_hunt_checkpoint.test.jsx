/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSoundHuntCheckpointData,
  loadSoundHuntCheckpoint,
  saveSoundHuntCheckpoint,
  resetSoundHuntCheckpoint,
  getSoundHuntCheckpointKey,
  SOUND_HUNT_STORAGE_PREFIX,
} from '../games/sound-hunt/engine/soundHuntCheckpoint';
import { TOTAL_SOUND_HUNT_LEVELS } from '../games/sound-hunt/engine/soundHuntCurriculum';

describe('Space Sound Mission — Checkpoint Engine & 25-Level Migration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Storage Keys and Child Isolation', () => {
    it('generates predictable child-specific keys with safe guest fallback', () => {
      expect(getSoundHuntCheckpointKey('leo-space-1')).toBe(
        `${SOUND_HUNT_STORAGE_PREFIX}leo-space-1`
      );
      expect(getSoundHuntCheckpointKey(99)).toBe(
        `${SOUND_HUNT_STORAGE_PREFIX}99`
      );
      expect(getSoundHuntCheckpointKey(null)).toBe(
        `${SOUND_HUNT_STORAGE_PREFIX}guest`
      );
      expect(getSoundHuntCheckpointKey(undefined)).toBe(
        `${SOUND_HUNT_STORAGE_PREFIX}guest`
      );
      expect(getSoundHuntCheckpointKey('')).toBe(
        `${SOUND_HUNT_STORAGE_PREFIX}guest`
      );
    });

    it('keeps independent state across multiple children without cross-contamination', () => {
      const child1 = 'child_leo';
      const child2 = 'child_maya';
      const guest = null;

      saveSoundHuntCheckpoint(child1, { roundIndex: 3, score: 3 });
      saveSoundHuntCheckpoint(child2, { roundIndex: 14, score: 12 });
      saveSoundHuntCheckpoint(guest, { roundIndex: 1, score: 1 });

      const data1 = loadSoundHuntCheckpointData(child1);
      const data2 = loadSoundHuntCheckpointData(child2);
      const dataGuest = loadSoundHuntCheckpointData(guest);

      expect(data1.roundIndex).toBe(3);
      expect(data1.score).toBe(3);
      expect(data1.currentLevel).toBe(4);

      expect(data2.roundIndex).toBe(14);
      expect(data2.score).toBe(12);
      expect(data2.currentLevel).toBe(15);

      expect(dataGuest.roundIndex).toBe(1);
      expect(dataGuest.score).toBe(1);
      expect(dataGuest.currentLevel).toBe(2);
    });
  });

  describe('Migration from 10-Level Saves to 25-Level Curriculum', () => {
    it('seamlessly migrates and resumes existing progress saved under the 10-level version', () => {
      // Simulate existing user who was on Level 5 (index 4) under 10-level game
      localStorage.setItem(
        `${SOUND_HUNT_STORAGE_PREFIX}child_mid_10`,
        JSON.stringify({ roundIndex: 4, score: 4, isCompleted: false })
      );

      const midData = loadSoundHuntCheckpointData('child_mid_10');
      expect(midData.roundIndex).toBe(4);
      expect(midData.currentLevel).toBe(5);
      expect(midData.score).toBe(4);

      // Simulate existing user who was on Level 10 (index 9) under 10-level game
      localStorage.setItem(
        `${SOUND_HUNT_STORAGE_PREFIX}child_late_10`,
        JSON.stringify({ roundIndex: 9, score: 9, isCompleted: false })
      );

      const lateData = loadSoundHuntCheckpointData('child_late_10');
      expect(lateData.roundIndex).toBe(9);
      expect(lateData.currentLevel).toBe(10);
      expect(lateData.score).toBe(9);
    });

    it('correctly clamps newly saved levels up to level 25 without overflow', () => {
      saveSoundHuntCheckpoint('child_level_25', { roundIndex: 24, score: 24 });
      const data = loadSoundHuntCheckpointData('child_level_25');
      expect(data.roundIndex).toBe(24);
      expect(data.currentLevel).toBe(25);
      expect(data.score).toBe(24);

      // Saving beyond 25 is clamped
      saveSoundHuntCheckpoint('child_over', { roundIndex: 40, score: 25 });
      const overData = loadSoundHuntCheckpointData('child_over');
      expect(overData.roundIndex).toBe(24);
      expect(overData.currentLevel).toBe(25);
    });
  });

  describe('Defensive Sanitization and Error Handling', () => {
    it('returns default clean state when no checkpoint exists', () => {
      const data = loadSoundHuntCheckpointData('non_existent');
      expect(data).toEqual({
        roundIndex: 0,
        savedRoundIndex: 0,
        currentLevel: 1,
        highestUnlockedLevel: 1,
        highestUnlockedIndex: 0,
        score: 0,
        isCompleted: false,
      });
      expect(loadSoundHuntCheckpoint('non_existent')).toBe(0);
    });

    it('handles legacy numeric and string representations gracefully', () => {
      localStorage.setItem(`${SOUND_HUNT_STORAGE_PREFIX}child_legacy_num`, '15');
      const dataNum = loadSoundHuntCheckpointData('child_legacy_num');
      expect(dataNum.roundIndex).toBe(15);
      expect(dataNum.currentLevel).toBe(16);

      localStorage.setItem(`${SOUND_HUNT_STORAGE_PREFIX}child_legacy_str`, ' "22" ');
      const dataStr = loadSoundHuntCheckpointData('child_legacy_str');
      expect(dataStr.roundIndex).toBe(22);
      expect(dataStr.currentLevel).toBe(23);
    });

    it('rejects corrupted JSON or out-of-range indices safely', () => {
      localStorage.setItem(`${SOUND_HUNT_STORAGE_PREFIX}child_corrupt`, '{bad_json:true');
      const dataCorrupt = loadSoundHuntCheckpointData('child_corrupt');
      expect(dataCorrupt.roundIndex).toBe(0);

      localStorage.setItem(
        `${SOUND_HUNT_STORAGE_PREFIX}child_out_of_bounds`,
        JSON.stringify({ roundIndex: 999, score: 50 })
      );
      const dataOOB = loadSoundHuntCheckpointData('child_out_of_bounds');
      expect(dataOOB.roundIndex).toBe(0);

      localStorage.setItem(
        `${SOUND_HUNT_STORAGE_PREFIX}child_negative`,
        JSON.stringify({ roundIndex: -3, score: 0 })
      );
      const dataNeg = loadSoundHuntCheckpointData('child_negative');
      expect(dataNeg.roundIndex).toBe(0);
    });

    it('completed run returns fresh state so child starts anew next session', () => {
      saveSoundHuntCheckpoint('child_winner', {
        roundIndex: TOTAL_SOUND_HUNT_LEVELS - 1,
        score: 25,
        isCompleted: true,
      });

      const data = loadSoundHuntCheckpointData('child_winner');
      expect(data.roundIndex).toBe(0);
      expect(data.currentLevel).toBe(1);
      expect(data.isCompleted).toBe(false);
    });

    it('resets checkpoint cleanly on explicit reset', () => {
      saveSoundHuntCheckpoint('child_reset', { roundIndex: 18, score: 17 });
      expect(loadSoundHuntCheckpoint('child_reset')).toBe(18);

      resetSoundHuntCheckpoint('child_reset');
      expect(loadSoundHuntCheckpoint('child_reset')).toBe(0);
      const resetData = loadSoundHuntCheckpointData('child_reset');
      expect(resetData.highestUnlockedLevel).toBe(1);
    });

    it('tracks highestUnlockedLevel and preserves it when replaying an earlier stage', () => {
      saveSoundHuntCheckpoint('child_stages', { roundIndex: 14, score: 14 });
      let data = loadSoundHuntCheckpointData('child_stages');
      expect(data.currentLevel).toBe(15);
      expect(data.highestUnlockedLevel).toBe(15);

      // Replaying Stage 1 (roundIndex 0) does not lower highestUnlockedLevel
      saveSoundHuntCheckpoint('child_stages', { roundIndex: 0, score: 14 });
      data = loadSoundHuntCheckpointData('child_stages');
      expect(data.currentLevel).toBe(1);
      expect(data.highestUnlockedLevel).toBe(15);
    });
  });
});

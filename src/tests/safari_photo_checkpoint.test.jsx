/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSafariPhotoCheckpointData,
  saveSafariPhotoCheckpoint,
  resetSafariPhotoCheckpoint,
  clearSafariPhotoCheckpoint,
  getSafariPhotoCheckpointKey,
  SAFARI_PHOTO_STORAGE_PREFIX,
  TOTAL_SAFARI_TARGETS,
} from '../games/safari-photo/engine/safariPhotoCheckpoint';

describe('Safari Wildlife Photographer — Focused Checkpoint Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Storage Keys and Child Isolation', () => {
    it('generates predictable child-specific keys and guest fallback', () => {
      expect(getSafariPhotoCheckpointKey('aarav-123')).toBe(
        `${SAFARI_PHOTO_STORAGE_PREFIX}aarav-123`
      );
      expect(getSafariPhotoCheckpointKey(42)).toBe(
        `${SAFARI_PHOTO_STORAGE_PREFIX}42`
      );
      expect(getSafariPhotoCheckpointKey(null)).toBe(
        `${SAFARI_PHOTO_STORAGE_PREFIX}guest`
      );
      expect(getSafariPhotoCheckpointKey(undefined)).toBe(
        `${SAFARI_PHOTO_STORAGE_PREFIX}guest`
      );
      expect(getSafariPhotoCheckpointKey('')).toBe(
        `${SAFARI_PHOTO_STORAGE_PREFIX}guest`
      );
    });

    it('keeps independent state across multiple children without cross-contamination', () => {
      const child1 = 'child_alice';
      const child2 = 'child_bob';
      const guest = null;

      // Alice is at Giraffe (2)
      saveSafariPhotoCheckpoint(child1, {
        targetIndex: 2,
        photosSnapped: 2,
        score: 300,
        stars: 2,
        streak: 2,
      });

      // Bob is at Monkey (3)
      saveSafariPhotoCheckpoint(child2, {
        targetIndex: 3,
        photosSnapped: 3,
        score: 600,
        stars: 3,
        streak: 4,
      });

      // Guest is at Zebra (1)
      saveSafariPhotoCheckpoint(guest, {
        targetIndex: 1,
        photosSnapped: 1,
        score: 150,
        stars: 1,
        streak: 1,
      });

      const aliceData = loadSafariPhotoCheckpointData(child1);
      const bobData = loadSafariPhotoCheckpointData(child2);
      const guestData = loadSafariPhotoCheckpointData(guest);

      expect(aliceData.targetIndex).toBe(2);
      expect(aliceData.score).toBe(300);

      expect(bobData.targetIndex).toBe(3);
      expect(bobData.score).toBe(600);

      expect(guestData.targetIndex).toBe(1);
      expect(guestData.score).toBe(150);

      // Resetting Alice leaves Bob and Guest completely untouched
      resetSafariPhotoCheckpoint(child1);
      expect(loadSafariPhotoCheckpointData(child1).targetIndex).toBe(0);
      expect(loadSafariPhotoCheckpointData(child2).targetIndex).toBe(3);
      expect(loadSafariPhotoCheckpointData(guest).targetIndex).toBe(1);
    });
  });

  describe('Defensive Loading & Out-of-Range Handling', () => {
    it('returns default state for non-existent child checkpoints', () => {
      const state = loadSafariPhotoCheckpointData('non-existent-child');
      expect(state).toEqual({
        targetIndex: 0,
        photosSnapped: 0,
        score: 0,
        stars: 0,
        streak: 1,
        isCompleted: false,
      });
    });

    it('sanitizes corrupt JSON payloads back to default state safely', () => {
      const childId = 'corrupt-child';
      localStorage.setItem(getSafariPhotoCheckpointKey(childId), '{"broken": json');
      const state = loadSafariPhotoCheckpointData(childId);
      expect(state.targetIndex).toBe(0);
      expect(state.photosSnapped).toBe(0);
      expect(state.score).toBe(0);
    });

    it('rejects negative or out-of-bounds target indices', () => {
      const childId = 'out-of-bounds';
      const key = getSafariPhotoCheckpointKey(childId);

      localStorage.setItem(key, JSON.stringify({ targetIndex: -1 }));
      expect(loadSafariPhotoCheckpointData(childId).targetIndex).toBe(0);

      localStorage.setItem(key, JSON.stringify({ targetIndex: TOTAL_SAFARI_TARGETS }));
      expect(loadSafariPhotoCheckpointData(childId).targetIndex).toBe(0);

      localStorage.setItem(key, JSON.stringify({ targetIndex: 999 }));
      expect(loadSafariPhotoCheckpointData(childId).targetIndex).toBe(0);
    });

    it('clamps score, stars, and streak to realistic positive ranges', () => {
      const childId = 'clamp-test';
      const key = getSafariPhotoCheckpointKey(childId);

      localStorage.setItem(
        key,
        JSON.stringify({
          targetIndex: 1,
          photosSnapped: 1,
          score: -50,
          stars: -2,
          streak: 99,
        })
      );

      const state = loadSafariPhotoCheckpointData(childId);
      expect(state.targetIndex).toBe(1);
      expect(state.photosSnapped).toBe(1);
      expect(state.score).toBe(0);
      expect(state.stars).toBe(0);
      expect(state.streak).toBe(5); // Clamped to max streak 5
    });

    it('handles legacy numeric string formats', () => {
      const childId = 'legacy-child';
      const key = getSafariPhotoCheckpointKey(childId);

      localStorage.setItem(key, '3');
      const state = loadSafariPhotoCheckpointData(childId);
      expect(state.targetIndex).toBe(3);
      expect(state.photosSnapped).toBe(3);
      expect(state.score).toBe(450);
    });
  });

  describe('Completed Run & Reset Guarantees', () => {
    it('guarantees completed run starts fresh and cannot resume as unfinished', () => {
      const childId = 'finished-child';

      saveSafariPhotoCheckpoint(childId, {
        targetIndex: 0,
        photosSnapped: 5,
        score: 1200,
        stars: 5,
        streak: 1,
        isCompleted: true,
      });

      const loaded = loadSafariPhotoCheckpointData(childId);
      expect(loaded.targetIndex).toBe(0);
      expect(loaded.photosSnapped).toBe(0);
      expect(loaded.score).toBe(0);
      expect(loaded.isCompleted).toBe(false);
    });

    it('resets checkpoint back to Round 1 via resetSafariPhotoCheckpoint', () => {
      const childId = 'reset-child';

      saveSafariPhotoCheckpoint(childId, {
        targetIndex: 4,
        photosSnapped: 4,
        score: 750,
        stars: 4,
        streak: 3,
        isCompleted: false,
      });

      expect(loadSafariPhotoCheckpointData(childId).targetIndex).toBe(4);

      resetSafariPhotoCheckpoint(childId);
      const resetState = loadSafariPhotoCheckpointData(childId);
      expect(resetState.targetIndex).toBe(0);
      expect(resetState.photosSnapped).toBe(0);
      expect(resetState.score).toBe(0);
    });

    it('clears checkpoint entry completely via clearSafariPhotoCheckpoint', () => {
      const childId = 'clear-child';
      const key = getSafariPhotoCheckpointKey(childId);

      saveSafariPhotoCheckpoint(childId, { targetIndex: 2 });
      expect(localStorage.getItem(key)).not.toBeNull();

      clearSafariPhotoCheckpoint(childId);
      expect(localStorage.getItem(key)).toBeNull();
    });
  });
});

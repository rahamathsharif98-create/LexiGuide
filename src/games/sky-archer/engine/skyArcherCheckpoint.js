/**
 * Sky Archer Checkpoint Engine
 *
 * Child-specific progress persistence and resume system for Sky Word Archer.
 * Follows the proven LexiGuide pattern (as used in Magic Bakery, Word Train, and Dino Fossil).
 * Scaled to support 25 developmental phonics levels across 5 stations.
 */

import { TOTAL_SKY_ARCHER_ROUNDS } from './phonicsTargets';

export const SKY_ARCHER_STORAGE_PREFIX = 'lexiguide_sky_archer_checkpoint_';
export const DEFAULT_MAX_ROUNDS = TOTAL_SKY_ARCHER_ROUNDS; // 25

/**
 * Returns the child-specific storage key for Sky Archer checkpoints.
 * Fallbacks safely to 'guest' when childId is missing or empty.
 */
export function getSkyArcherCheckpointKey(childId) {
  const safeId = childId !== undefined && childId !== null && childId !== '' ? childId : 'guest';
  return `${SKY_ARCHER_STORAGE_PREFIX}${safeId}`;
}

/**
 * Parses and validates checkpoint payload from localStorage.
 * Returns an object with roundIndex (0-based), currentRound (1-based),
 * and highestUnlockedRound (1-based).
 */
export function loadSkyArcherCheckpointData(childId, maxRounds = TOTAL_SKY_ARCHER_ROUNDS) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      roundIndex: 0,
      savedRoundIndex: 0,
      currentRound: 1,
      highestUnlockedRound: 1,
      highestUnlockedIndex: 0,
    };
  }

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_SKY_ARCHER_ROUNDS;

  try {
    const raw = window.localStorage.getItem(getSkyArcherCheckpointKey(childId));
    if (!raw) {
      return {
        roundIndex: 0,
        savedRoundIndex: 0,
        currentRound: 1,
        highestUnlockedRound: 1,
        highestUnlockedIndex: 0,
      };
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }

    let idx;
    let highestIdx = 0;

    if (typeof parsed === 'number') {
      idx = parsed;
      highestIdx = parsed;
    } else if (typeof parsed === 'string') {
      idx = Number(parsed);
      highestIdx = Number(parsed);
    } else if (typeof parsed === 'object' && parsed !== null) {
      idx = Number(
        parsed.roundIndex ??
        parsed.savedRoundIndex ??
        parsed.levelIndex ??
        parsed.savedLevelIndex ??
        parsed.index ??
        (parsed.currentRound != null ? parsed.currentRound - 1 : NaN)
      );
      highestIdx = Number(
        parsed.highestUnlockedIndex ??
        (parsed.highestUnlockedRound != null ? parsed.highestUnlockedRound - 1 : idx)
      );
    }

    if (Number.isInteger(idx) && idx >= 0 && idx < limit) {
      const validHighest = Number.isInteger(highestIdx)
        ? Math.max(idx, Math.min(highestIdx, limit - 1))
        : idx;

      return {
        roundIndex: idx,
        savedRoundIndex: idx,
        currentRound: idx + 1,
        highestUnlockedRound: validHighest + 1,
        highestUnlockedIndex: validHighest,
      };
    }

    // Default to Round 1 (index 0) if corrupted or out of range
    return {
      roundIndex: 0,
      savedRoundIndex: 0,
      currentRound: 1,
      highestUnlockedRound: 1,
      highestUnlockedIndex: 0,
    };
  } catch {
    return {
      roundIndex: 0,
      savedRoundIndex: 0,
      currentRound: 1,
      highestUnlockedRound: 1,
      highestUnlockedIndex: 0,
    };
  }
}

/**
 * Loads the saved 0-based round index for the given child.
 * Returns 0 (Round 1) if missing, invalid, or out of range.
 */
export function loadSkyArcherCheckpoint(childId, maxRounds = TOTAL_SKY_ARCHER_ROUNDS) {
  return loadSkyArcherCheckpointData(childId, maxRounds).roundIndex;
}

/**
 * Saves Sky Archer checkpoint for the given child.
 * Validates and clamps the round index to [0, maxRounds - 1].
 */
export function saveSkyArcherCheckpoint(childId, roundIndex, maxRounds = TOTAL_SKY_ARCHER_ROUNDS) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  if (
    roundIndex === null ||
    roundIndex === undefined ||
    typeof roundIndex === 'boolean' ||
    typeof roundIndex === 'object' ||
    (typeof roundIndex === 'string' && roundIndex.trim() === '')
  ) {
    return;
  }

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_SKY_ARCHER_ROUNDS;
  const num = Number(roundIndex);

  if (!Number.isInteger(num) || num < 0) {
    return;
  }

  try {
    const validIndex = Math.max(0, Math.min(num, limit - 1));
    const prev = loadSkyArcherCheckpointData(childId, limit);
    const highestIdx = Math.max(prev.highestUnlockedIndex, validIndex);

    window.localStorage.setItem(
      getSkyArcherCheckpointKey(childId),
      JSON.stringify({
        roundIndex: validIndex,
        savedRoundIndex: validIndex,
        currentRound: validIndex + 1,
        highestUnlockedRound: highestIdx + 1,
        highestUnlockedIndex: highestIdx,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[SkyArcher] Failed to save checkpoint:', err);
  }
}

/**
 * Resets Sky Archer checkpoint back to Round 1 (index 0) for the given child.
 */
export function resetSkyArcherCheckpoint(childId, maxRounds = TOTAL_SKY_ARCHER_ROUNDS) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_SKY_ARCHER_ROUNDS;

  try {
    window.localStorage.setItem(
      getSkyArcherCheckpointKey(childId),
      JSON.stringify({
        roundIndex: 0,
        savedRoundIndex: 0,
        currentRound: 1,
        highestUnlockedRound: 1,
        highestUnlockedIndex: 0,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[SkyArcher] Failed to reset checkpoint:', err);
  }
}

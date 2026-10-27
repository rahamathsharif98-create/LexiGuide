/**
 * Word Train Checkpoint Engine
 *
 * Child-specific progress persistence and resume system for Word Train.
 * Follows the proven LexiGuide pattern (as used in Magic Bakery, Dino Fossil, and Ancient Labyrinth).
 */

export const WORD_TRAIN_STORAGE_PREFIX = 'lexiguide_word_train_checkpoint_';

/**
 * Returns the child-specific storage key for Word Train checkpoints.
 * Fallbacks safely to 'guest' when childId is missing or empty.
 */
export function getWordTrainCheckpointKey(childId) {
  const safeId = childId !== undefined && childId !== null && childId !== '' ? childId : 'guest';
  return `${WORD_TRAIN_STORAGE_PREFIX}${safeId}`;
}

/**
 * Parses and validates checkpoint payload from localStorage.
 * Returns an object with levelIndex (0-based), currentLevel (1-based),
 * and highestUnlockedLevel (1-based).
 */
export function loadWordTrainCheckpointData(childId, maxLevels = 50) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      levelIndex: 0,
      savedLevelIndex: 0,
      currentLevel: 1,
      highestUnlockedLevel: 1,
      highestUnlockedIndex: 0,
    };
  }

  const limit = typeof maxLevels === 'number' && maxLevels > 0 ? maxLevels : 50;

  try {
    const raw = window.localStorage.getItem(getWordTrainCheckpointKey(childId));
    if (!raw) {
      return {
        levelIndex: 0,
        savedLevelIndex: 0,
        currentLevel: 1,
        highestUnlockedLevel: 1,
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
        parsed.levelIndex ??
        parsed.savedLevelIndex ??
        parsed.index ??
        (parsed.currentLevel != null ? parsed.currentLevel - 1 : NaN)
      );
      highestIdx = Number(
        parsed.highestUnlockedIndex ??
        (parsed.highestUnlockedLevel != null ? parsed.highestUnlockedLevel - 1 : idx)
      );
    }

    if (Number.isInteger(idx) && idx >= 0 && idx < limit) {
      const validHighest = Number.isInteger(highestIdx)
        ? Math.max(idx, Math.min(highestIdx, limit - 1))
        : idx;

      return {
        levelIndex: idx,
        savedLevelIndex: idx,
        currentLevel: idx + 1,
        highestUnlockedLevel: validHighest + 1,
        highestUnlockedIndex: validHighest,
      };
    }

    // Default to Level 1 if corrupted or out of range
    return {
      levelIndex: 0,
      savedLevelIndex: 0,
      currentLevel: 1,
      highestUnlockedLevel: 1,
      highestUnlockedIndex: 0,
    };
  } catch {
    return {
      levelIndex: 0,
      savedLevelIndex: 0,
      currentLevel: 1,
      highestUnlockedLevel: 1,
      highestUnlockedIndex: 0,
    };
  }
}

/**
 * Loads the saved 0-based level index for the given child.
 * Returns 0 (Level 1) if missing, invalid, or out of range.
 */
export function loadWordTrainCheckpoint(childId, maxLevels = 50) {
  return loadWordTrainCheckpointData(childId, maxLevels).levelIndex;
}

/**
 * Saves Word Train checkpoint for the given child.
 * Validates and clamps the level index to [0, maxLevels - 1].
 */
export function saveWordTrainCheckpoint(childId, levelIndex, maxLevels = 50) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const limit = typeof maxLevels === 'number' && maxLevels > 0 ? maxLevels : 50;
  const num = Number(levelIndex);

  if (!Number.isInteger(num) || num < 0) {
    return;
  }

  try {
    const validIndex = Math.max(0, Math.min(num, limit - 1));
    const prev = loadWordTrainCheckpointData(childId, limit);
    const highestIdx = Math.max(prev.highestUnlockedIndex, validIndex);

    window.localStorage.setItem(
      getWordTrainCheckpointKey(childId),
      JSON.stringify({
        levelIndex: validIndex,
        savedLevelIndex: validIndex,
        currentLevel: validIndex + 1,
        highestUnlockedLevel: highestIdx + 1,
        highestUnlockedIndex: highestIdx,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[WordTrain] Failed to save checkpoint:', err);
  }
}

/**
 * Resets Word Train checkpoint back to Level 1 (index 0) for the given child.
 */
export function resetWordTrainCheckpoint(childId, maxLevels = 50) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const limit = typeof maxLevels === 'number' && maxLevels > 0 ? maxLevels : 50;

  try {
    window.localStorage.setItem(
      getWordTrainCheckpointKey(childId),
      JSON.stringify({
        levelIndex: 0,
        savedLevelIndex: 0,
        currentLevel: 1,
        highestUnlockedLevel: 1,
        highestUnlockedIndex: 0,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[WordTrain] Failed to reset checkpoint:', err);
  }
}

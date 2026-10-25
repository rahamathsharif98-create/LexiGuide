// storageService: child-isolated persistence abstraction.
// Standalone mode uses localStorage keyed by childId.
// When LexiGuide integrates this game, each child's data is isolated.

import { CHECKPOINT_DISTANCE, MAX_CHECKPOINTS } from '../../game/engine/constants';

export const LEARNING_RUN_STORAGE_PREFIX = 'lexiguide_learning_run_';
export const LEGACY_STORAGE_KEY = 'lexiguide-learning-run:save-v1';

let activeChildId = 'guest';

export function getStorageKey(childId = activeChildId) {
  const safeId = childId !== undefined && childId !== null && childId !== '' ? childId : 'guest';
  return `${LEARNING_RUN_STORAGE_PREFIX}${safeId}`;
}

export function setStorageChildId(childId) {
  activeChildId = childId !== undefined && childId !== null && childId !== '' ? childId : 'guest';
}

export function getStorageChildId() {
  return activeChildId;
}

export const DEFAULT_SAVE = {
  stars: 0,
  bestDistance: 0,
  achievements: [],
  unlockedWorlds: ['letter-valley'],
  learningProgress: {
    lettersLearned: {}, // letter -> times collected
    lettersCorrect: {}, // letter -> times answered correctly in challenges
    lettersIncorrect: {}, // letter -> times answered incorrectly
    wordsCompleted: [],
  },
  totals: {
    runsCompleted: 0,
    lettersCollected: 0,
    wordsCompleted: 0,
    bestCheckpointsInRun: 0,
  },
  settings: {
    music: true,
    sfx: true,
    voice: true,
    reducedMotion: false,
    graphicsQuality: 'auto', // 'low' | 'medium' | 'high' | 'auto'
  },
  selectedCharacter: 'explorer',
  runHistory: [], // recent gameSessionResult objects (capped)
  checkpointProgress: {
    highestCheckpoint: 0,
    highestStage: 1,
    savedDistance: 0,
    unlockedStages: [1],
  },
};

const memoryFallbackMap = {}; // key -> save data

function isLocalStorageAvailable() {
  try {
    const testKey = '__lexiguide_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export const HAS_LOCAL_STORAGE = typeof window !== 'undefined' && isLocalStorageAvailable();

function readRaw(childId = activeChildId) {
  const key = getStorageKey(childId);
  if (HAS_LOCAL_STORAGE) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw);
      }
      // Migrate legacy save if available
      const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const legacyData = JSON.parse(legacyRaw);
        window.localStorage.setItem(key, JSON.stringify(legacyData));
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        return legacyData;
      }
      return null;
    } catch {
      return null;
    }
  }
  return memoryFallbackMap[key] || memoryFallbackMap[LEGACY_STORAGE_KEY] || null;
}

function writeRaw(data, childId = activeChildId) {
  const key = getStorageKey(childId);
  if (HAS_LOCAL_STORAGE) {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }
  memoryFallbackMap[key] = data;
  return true;
}

export function sanitizeCheckpointProgress(rawProgress) {
  if (!rawProgress || typeof rawProgress !== 'object') {
    return structuredCloneSafe(DEFAULT_SAVE.checkpointProgress);
  }
  const rawCheckpoint = Number(rawProgress.highestCheckpoint);
  const highestCheckpoint = Number.isFinite(rawCheckpoint)
    ? Math.min(MAX_CHECKPOINTS, Math.max(0, Math.floor(rawCheckpoint)))
    : 0;
  const highestStage = highestCheckpoint + 1;
  const savedDistance = highestCheckpoint * CHECKPOINT_DISTANCE;
  const unlockedStages = Array.from({ length: highestStage }, (_, i) => i + 1);

  return {
    highestCheckpoint,
    highestStage,
    savedDistance,
    unlockedStages,
  };
}

export function loadSave(childId = activeChildId) {
  const raw = readRaw(childId);
  if (!raw) return structuredCloneSafe(DEFAULT_SAVE);
  // Merge with defaults so new fields introduced later don't break old saves.
  return {
    ...structuredCloneSafe(DEFAULT_SAVE),
    ...raw,
    learningProgress: { ...DEFAULT_SAVE.learningProgress, ...(raw.learningProgress || {}) },
    settings: { ...DEFAULT_SAVE.settings, ...(raw.settings || {}) },
    totals: { ...DEFAULT_SAVE.totals, ...(raw.totals || {}) },
    checkpointProgress: sanitizeCheckpointProgress(raw.checkpointProgress),
  };
}

export function saveCheckpointProgress(checkpointIndex, childId = activeChildId) {
  return updateSave((save) => {
    const prev = sanitizeCheckpointProgress(save.checkpointProgress);
    const validCandidate = Number.isFinite(Number(checkpointIndex))
      ? Math.min(MAX_CHECKPOINTS, Math.max(0, Math.floor(Number(checkpointIndex))))
      : 0;
    const highestCheckpoint = Math.min(MAX_CHECKPOINTS, Math.max(prev.highestCheckpoint, validCandidate));
    const highestStage = highestCheckpoint + 1;
    const savedDistance = highestCheckpoint * CHECKPOINT_DISTANCE;
    const unlockedStages = Array.from({ length: highestStage }, (_, i) => i + 1);

    return {
      ...save,
      checkpointProgress: {
        highestCheckpoint,
        highestStage,
        savedDistance,
        unlockedStages,
      },
    };
  }, childId);
}

export function resetCheckpointProgress(childId = activeChildId) {
  return updateSave((save) => ({
    ...save,
    checkpointProgress: structuredCloneSafe(DEFAULT_SAVE.checkpointProgress),
  }), childId);
}

export function saveSave(data, childId = activeChildId) {
  return writeRaw(data, childId);
}

export function updateSave(updater, childId = activeChildId) {
  const current = loadSave(childId);
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  writeRaw(next, childId);
  return next;
}

export function resetSave(childId = activeChildId) {
  const fresh = structuredCloneSafe(DEFAULT_SAVE);
  writeRaw(fresh, childId);
  return fresh;
}

function structuredCloneSafe(obj) {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}

export const storageService = {
  loadSave,
  saveSave,
  updateSave,
  resetSave,
  saveCheckpointProgress,
  resetCheckpointProgress,
  sanitizeCheckpointProgress,
  CHECKPOINT_DISTANCE,
  MAX_CHECKPOINTS,
  getStorageKey,
  setStorageChildId,
  getStorageChildId,
  isAvailable: HAS_LOCAL_STORAGE,
  STORAGE_PREFIX: LEARNING_RUN_STORAGE_PREFIX,
  LEGACY_STORAGE_KEY,
  DEFAULT_SAVE,
};

export default storageService;

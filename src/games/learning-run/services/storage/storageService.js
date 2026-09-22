// storageService: thin persistence abstraction.
// Standalone mode uses localStorage. When LexiGuide integrates this game,
// replace the implementations below with calls to the LexiGuide backend API
// while keeping the same function signatures (see INTEGRATION_GUIDE.md).

const STORAGE_KEY = 'lexiguide-learning-run:save-v1';

const DEFAULT_SAVE = {
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
};

let memoryFallback = null; // used if localStorage is unavailable

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

const HAS_LOCAL_STORAGE = typeof window !== 'undefined' && isLocalStorageAvailable();

function readRaw() {
  if (HAS_LOCAL_STORAGE) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  return memoryFallback;
}

function writeRaw(data) {
  if (HAS_LOCAL_STORAGE) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }
  memoryFallback = data;
  return true;
}

export function loadSave() {
  const raw = readRaw();
  if (!raw) return structuredCloneSafe(DEFAULT_SAVE);
  // Merge with defaults so new fields introduced later don't break old saves.
  return {
    ...structuredCloneSafe(DEFAULT_SAVE),
    ...raw,
    learningProgress: { ...DEFAULT_SAVE.learningProgress, ...(raw.learningProgress || {}) },
    settings: { ...DEFAULT_SAVE.settings, ...(raw.settings || {}) },
    totals: { ...DEFAULT_SAVE.totals, ...(raw.totals || {}) },
  };
}

export function saveSave(data) {
  return writeRaw(data);
}

export function updateSave(updater) {
  const current = loadSave();
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  writeRaw(next);
  return next;
}

export function resetSave() {
  writeRaw(structuredCloneSafe(DEFAULT_SAVE));
  return structuredCloneSafe(DEFAULT_SAVE);
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
  isAvailable: HAS_LOCAL_STORAGE,
};

export default storageService;

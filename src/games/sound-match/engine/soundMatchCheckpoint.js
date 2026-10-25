/**
 * soundMatchCheckpoint.js
 *
 * Child-specific progress persistence, checkpoint resume, and migration engine for
 * Sound Match (100 levels).
 *
 * Follows the established LexiGuide checkpoint convention:
 * - Isolates saves strictly per childId (with safe guest fallback).
 * - Stores minimal essential resumable state (roundIndex, score, isCompleted).
 * - Validates stored data defensively to prevent corruption or out-of-range state.
 * - Migrates existing 10-level checkpoint data safely into the 100-level progression.
 * - Guarantees that fully completed 100-level runs restart fresh on Play Again.
 * - Resets cleanly on Play Again or explicit fresh start.
 */

import { TOTAL_SOUND_MATCH_LEVELS, SOUND_MATCH_MILESTONES } from './soundMatchCurriculum';

export const SOUND_MATCH_STORAGE_PREFIX = 'lexiguide_sound_match_checkpoint_';

/**
 * Generates an isolated storage key per child.
 */
export function getSoundMatchCheckpointKey(childId) {
  const safeId = childId !== undefined && childId !== null && childId !== '' ? String(childId) : 'guest';
  return `${SOUND_MATCH_STORAGE_PREFIX}${safeId}`;
}

/**
 * Loads, validates, and sanitizes checkpoint data for a specific child.
 * Missing, malformed, out-of-range, or completed checkpoints return fresh run state.
 * Safely migrates legacy 10-level checkpoints so child progress is not lost.
 */
export function loadSoundMatchCheckpointData(childId, maxRounds = TOTAL_SOUND_MATCH_LEVELS) {
  const defaultState = {
    roundIndex: 0,
    savedRoundIndex: 0,
    currentLevel: 1,
    highestUnlockedLevel: 1,
    highestUnlockedIndex: 0,
    score: 0,
    isCompleted: false,
    earnedRewards: [],
    completedLevels: [],
    unlockedStages: [1],
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultState;
  }

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_SOUND_MATCH_LEVELS;

  try {
    const raw = window.localStorage.getItem(getSoundMatchCheckpointKey(childId));
    if (!raw) {
      return defaultState;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }

    // Legacy integer/string fallback (e.g. raw "2" or numeric payload)
    if (typeof parsed === 'number' || (typeof parsed === 'string' && /^\d+$/.test(parsed.trim()))) {
      const num = Number(parsed);
      if (Number.isInteger(num) && num >= 0 && num < limit) {
        const completedLevels = Array.from({ length: num }, (_, i) => i + 1);
        const earnedRewards = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].filter(m => num >= m);
        const unlockedStages = [1];
        for (let s = 2; s <= 10; s++) {
          if (num + 1 >= (s - 1) * 10 + 1) unlockedStages.push(s);
        }
        return {
          roundIndex: num,
          savedRoundIndex: num,
          currentLevel: num + 1,
          highestUnlockedLevel: num + 1,
          highestUnlockedIndex: num,
          score: num,
          isCompleted: false,
          earnedRewards,
          completedLevels,
          unlockedStages,
        };
      }
      return defaultState;
    }

    if (!parsed || typeof parsed !== 'object') {
      return defaultState;
    }

    // Fully completed 100-level run: preserve completed status and rewards, reset roundIndex to 0
    if (parsed.isCompleted === true) {
      const prevHighest = Number(parsed.highestUnlockedLevel ?? parsed.score ?? 0);
      if (prevHighest < limit && limit === 100) {
        // Child mastered previous 10-level run: migrate to Stage 2 (Level 11)
        const migratedLevel = Math.min(limit, Math.max(11, prevHighest + 1));
        const migratedIndex = migratedLevel - 1;
        const completedLevels = Array.from({ length: 10 }, (_, i) => i + 1);
        const earnedRewards = [5, 10];
        const unlockedStages = [1, 2];
        const migratedState = {
          roundIndex: migratedIndex,
          savedRoundIndex: migratedIndex,
          currentLevel: migratedLevel,
          highestUnlockedLevel: migratedLevel,
          highestUnlockedIndex: migratedIndex,
          score: Math.max(10, Math.floor(Number(parsed.score) || prevHighest)),
          isCompleted: false,
          earnedRewards,
          completedLevels,
          unlockedStages,
        };

        try {
          window.localStorage.setItem(
            getSoundMatchCheckpointKey(childId),
            JSON.stringify({ ...migratedState, updatedAt: Date.now() })
          );
        } catch {
          /* handled */
        }

        return migratedState;
      }

      // Fully completed 100-level run
      const allMilestones = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
      return {
        roundIndex: 0,
        savedRoundIndex: 0,
        currentLevel: 1,
        highestUnlockedLevel: limit,
        highestUnlockedIndex: limit - 1,
        score: Math.max(limit, Number(parsed.score) || limit),
        isCompleted: true,
        completedLevels: Array.isArray(parsed.completedLevels) && parsed.completedLevels.length > 0
          ? parsed.completedLevels
          : Array.from({ length: limit }, (_, i) => i + 1),
        earnedRewards: Array.isArray(parsed.earnedRewards) && parsed.earnedRewards.length > 0
          ? parsed.earnedRewards
          : allMilestones,
        unlockedStages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      };
    }

    const rawRoundIndex = Number(
      parsed.roundIndex ??
      parsed.savedRoundIndex ??
      parsed.levelIndex ??
      parsed.savedLevelIndex ??
      parsed.index ??
      (parsed.currentLevel != null ? parsed.currentLevel - 1 : NaN)
    );

    // If out-of-range, start fresh
    if (!Number.isInteger(rawRoundIndex) || rawRoundIndex < 0 || rawRoundIndex >= limit) {
      return defaultState;
    }

    const rawHighestIdx = Number(
      parsed.highestUnlockedIndex ??
      (parsed.highestUnlockedLevel != null ? parsed.highestUnlockedLevel - 1 : rawRoundIndex)
    );
    const validHighestIdx = Number.isInteger(rawHighestIdx)
      ? Math.max(rawRoundIndex, Math.min(rawHighestIdx, limit - 1))
      : rawRoundIndex;

    const rawScore = Number(parsed.score ?? 0);
    const validScore = Number.isFinite(rawScore) ? Math.max(0, Math.floor(rawScore)) : 0;

    // Deduce or sanitize earned milestone rewards
    const allMilestones = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
    let earnedRewards = [];
    if (Array.isArray(parsed.earnedRewards)) {
      earnedRewards = Array.from(new Set(parsed.earnedRewards.filter(n => Number.isInteger(n) && n >= 1 && n <= limit))).sort((a, b) => a - b);
    } else {
      const currentHighest = validHighestIdx + 1;
      earnedRewards = allMilestones.filter(m => currentHighest > m);
    }

    // Deduce or sanitize completed levels
    let completedLevels = [];
    if (Array.isArray(parsed.completedLevels)) {
      completedLevels = Array.from(new Set(parsed.completedLevels.filter(n => Number.isInteger(n) && n >= 1 && n <= limit))).sort((a, b) => a - b);
    } else {
      const highestNum = validHighestIdx + 1;
      completedLevels = Array.from({ length: Math.max(0, highestNum - 1) }, (_, i) => i + 1);
    }

    // Deduce unlocked stages
    const unlockedStages = [1];
    for (let s = 2; s <= 10; s++) {
      const requiredLevel = (s - 1) * 10 + 1;
      if (validHighestIdx + 1 >= requiredLevel) {
        unlockedStages.push(s);
      }
    }

    return {
      roundIndex: rawRoundIndex,
      savedRoundIndex: rawRoundIndex,
      currentLevel: rawRoundIndex + 1,
      highestUnlockedLevel: validHighestIdx + 1,
      highestUnlockedIndex: validHighestIdx,
      score: validScore,
      isCompleted: false,
      earnedRewards,
      completedLevels,
      unlockedStages,
    };
  } catch {
    return defaultState;
  }
}

/**
 * Loads the saved 0-based round index for the given child.
 * Returns 0 if missing, completed, or out of range.
 */
export function loadSoundMatchCheckpoint(childId, maxRounds = TOTAL_SOUND_MATCH_LEVELS) {
  return loadSoundMatchCheckpointData(childId, maxRounds).roundIndex;
}

/**
 * Persists child checkpoint progress to browser storage safely.
 * Preserves earned rewards, completed levels, and unlocked stages across replays.
 */
export function saveSoundMatchCheckpoint(childId, data, maxRounds = TOTAL_SOUND_MATCH_LEVELS) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!data || typeof data !== 'object') return;

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_SOUND_MATCH_LEVELS;

  try {
    const isCompleted = Boolean(data.isCompleted);
    const prev = loadSoundMatchCheckpointData(childId, limit);

    const completedSet = new Set([
      ...(Array.isArray(prev.completedLevels) ? prev.completedLevels : []),
      ...(Array.isArray(data.completedLevels) ? data.completedLevels : []),
    ]);
    const rewardsSet = new Set([
      ...(Array.isArray(prev.earnedRewards) ? prev.earnedRewards : []),
      ...(Array.isArray(data.earnedRewards) ? data.earnedRewards : []),
    ]);

    // Check if a completed level was reported
    if (data.completedLevel != null) {
      const lvl = Number(data.completedLevel);
      if (Number.isInteger(lvl) && lvl >= 1 && lvl <= limit) {
        completedSet.add(lvl);
        if (SOUND_MATCH_MILESTONES[lvl] && !rewardsSet.has(lvl)) {
          rewardsSet.add(lvl);
        }
      }
    }

    const rawIdx = Number(
      data.roundIndex ??
      data.savedRoundIndex ??
      data.levelIndex ??
      (data.currentLevel != null ? data.currentLevel - 1 : prev.roundIndex)
    );
    const validIndex = Number.isInteger(rawIdx) && rawIdx >= 0 && rawIdx < limit ? rawIdx : prev.roundIndex;

    const rawHighestIdx = Number(
      data.highestUnlockedIndex ??
      (data.highestUnlockedLevel != null ? data.highestUnlockedLevel - 1 : Math.max(validIndex, prev.highestUnlockedIndex))
    );
    const validHighestIdx = Number.isInteger(rawHighestIdx)
      ? Math.max(validIndex, Math.max(rawHighestIdx, prev.highestUnlockedIndex))
      : Math.max(validIndex, prev.highestUnlockedIndex);

    // Auto-populate rewards for completed milestones
    const currentHighestLevel = validHighestIdx + 1;
    const allMilestones = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
    allMilestones.forEach((m) => {
      if (currentHighestLevel > m || completedSet.has(m)) {
        rewardsSet.add(m);
      }
    });

    // Score is count of unique completed levels or prev.score (prevents replay inflation)
    const validScore = Math.max(prev.score, completedSet.size, Number(data.score) || 0);

    const unlockedStages = [1];
    for (let s = 2; s <= 10; s++) {
      const requiredLevel = (s - 1) * 10 + 1;
      if (validHighestIdx + 1 >= requiredLevel) {
        unlockedStages.push(s);
      }
    }

    if (isCompleted) {
      completedSet.add(limit);
      if (SOUND_MATCH_MILESTONES[limit]) rewardsSet.add(limit);

      window.localStorage.setItem(
        getSoundMatchCheckpointKey(childId),
        JSON.stringify({
          roundIndex: 0,
          savedRoundIndex: 0,
          currentLevel: 1,
          highestUnlockedLevel: limit,
          highestUnlockedIndex: limit - 1,
          score: Math.max(validScore, limit),
          isCompleted: true,
          completedLevels: Array.from(completedSet).sort((a, b) => a - b),
          earnedRewards: Array.from(rewardsSet).sort((a, b) => a - b),
          unlockedStages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          updatedAt: Date.now(),
        })
      );
      return;
    }

    window.localStorage.setItem(
      getSoundMatchCheckpointKey(childId),
      JSON.stringify({
        roundIndex: validIndex,
        savedRoundIndex: validIndex,
        currentLevel: validIndex + 1,
        highestUnlockedLevel: validHighestIdx + 1,
        highestUnlockedIndex: validHighestIdx,
        score: validScore,
        isCompleted: false,
        completedLevels: Array.from(completedSet).sort((a, b) => a - b),
        earnedRewards: Array.from(rewardsSet).sort((a, b) => a - b),
        unlockedStages,
        updatedAt: Date.now(),
      })
    );
  } catch {
    /* storage write error handled */
  }
}

/**
 * Helper to check whether a specific level has been completed by the child.
 */
export function isSoundMatchLevelCompleted(childId, level) {
  const data = loadSoundMatchCheckpointData(childId);
  return data.completedLevels.includes(Number(level));
}

/**
 * Returns all earned reward IDs/levels for a child.
 */
export function getSoundMatchEarnedRewards(childId) {
  const data = loadSoundMatchCheckpointData(childId);
  return data.earnedRewards;
}

/**
 * Resets a child's Sound Match checkpoint to level 1 fresh state.
 */
export function resetSoundMatchCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(getSoundMatchCheckpointKey(childId));
  } catch {
    /* storage remove error handled */
  }
}


/**
 * cosmicMinerCheckpoint.js
 *
 * Child-specific progress persistence and checkpoint resume engine for
 * Cosmic Letter Miner (3D Space Adventure).
 *
 * Follows the proven LexiGuide pattern (as used in Safari Wildlife Photographer,
 * Sound Safari, Voxel Crafter, and Cosmic Safari):
 * - Isolates saves strictly per childId (with safe guest fallback).
 * - Stores minimal essential resumable state (missionIndex, currentStage, score, stars, streak).
 * - Tracks stage unlocking and completed mission records.
 * - Validates stored data defensively to prevent corruption, invalid indices, or out-of-range state.
 * - Guarantees that completed runs cannot accidentally resume as unfinished.
 * - Safely handles missing, malformed, or inaccessible localStorage data.
 * - Resets cleanly on explicit fresh start.
 */

import { SPACE_MISSIONS } from './spaceWords';

export const COSMIC_MINER_STORAGE_PREFIX = 'lexiguide_cosmic_miner_checkpoint_';
export const TOTAL_SPACE_MISSIONS = SPACE_MISSIONS.length;
export const MISSIONS_PER_STAGE = 4;

/**
 * Generates an isolated storage key per child.
 */
export function getCosmicMinerCheckpointKey(childId) {
  const safeId = childId !== undefined && childId !== null && childId !== '' ? String(childId) : 'guest';
  return `${COSMIC_MINER_STORAGE_PREFIX}${safeId}`;
}

/**
 * Calculates 1-based stage number for a given 0-based mission index.
 */
export function getStageForMission(missionIndex, missionsPerStage = MISSIONS_PER_STAGE) {
  const safeIdx = typeof missionIndex === 'number' && Number.isInteger(missionIndex) && missionIndex >= 0 ? missionIndex : 0;
  const safePerStage = typeof missionsPerStage === 'number' && missionsPerStage > 0 ? missionsPerStage : MISSIONS_PER_STAGE;
  return Math.floor(safeIdx / safePerStage) + 1;
}

/**
 * Calculates array of unlocked 1-based stages based on highest unlocked mission index.
 */
export function getUnlockedStages(highestUnlockedIndex, missionsPerStage = MISSIONS_PER_STAGE) {
  const maxStage = getStageForMission(highestUnlockedIndex, missionsPerStage);
  const stages = [];
  for (let s = 1; s <= maxStage; s++) {
    stages.push(s);
  }
  return stages;
}

/**
 * Checks if a specific 1-based stage is unlocked.
 */
export function isStageUnlocked(stageNumber, highestUnlockedIndex, missionsPerStage = MISSIONS_PER_STAGE) {
  if (stageNumber === 1) return true;
  const unlocked = getUnlockedStages(highestUnlockedIndex, missionsPerStage);
  return unlocked.includes(stageNumber);
}

/**
 * Returns default fresh initial state for a new run.
 */
export function getDefaultCosmicMinerState() {
  return {
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
  };
}

/**
 * Loads, validates, and sanitizes checkpoint data for a specific child.
 * Missing, malformed, out-of-range, or completed checkpoints return fresh run state.
 */
export function loadCosmicMinerCheckpointData(childId, maxMissions = TOTAL_SPACE_MISSIONS) {
  const defaultState = getDefaultCosmicMinerState();

  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultState;
  }

  const limit = typeof maxMissions === 'number' && maxMissions > 0 ? maxMissions : TOTAL_SPACE_MISSIONS;

  try {
    const raw = window.localStorage.getItem(getCosmicMinerCheckpointKey(childId));
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
        const stage = getStageForMission(num);
        return {
          missionIndex: num,
          savedMissionIndex: num,
          currentLevel: num + 1,
          currentStage: stage,
          stageIndex: stage - 1,
          highestUnlockedIndex: num,
          highestUnlockedLevel: num + 1,
          highestUnlockedStage: stage,
          unlockedStages: getUnlockedStages(num),
          completedMissions: Array.from({ length: num }, (_, i) => i),
          missionsCompleted: num,
          score: num * 500,
          stars: num,
          streak: 1,
          isCompleted: false,
        };
      }
      return defaultState;
    }

    if (!parsed || typeof parsed !== 'object') {
      return defaultState;
    }

    // A completed run must never resume as an unfinished run; start fresh
    if (parsed.isCompleted === true) {
      return defaultState;
    }

    const rawMissionIndex = Number(
      parsed.missionIndex ??
      parsed.savedMissionIndex ??
      parsed.roundIndex ??
      parsed.savedRoundIndex ??
      parsed.index ??
      (parsed.currentLevel != null ? parsed.currentLevel - 1 : NaN)
    );

    // If out-of-range, start fresh
    if (!Number.isInteger(rawMissionIndex) || rawMissionIndex < 0 || rawMissionIndex >= limit) {
      return defaultState;
    }

    const rawHighestIndex = Number(
      parsed.highestUnlockedIndex ??
      (parsed.highestUnlockedLevel != null ? parsed.highestUnlockedLevel - 1 : rawMissionIndex)
    );

    const validHighestIndex = Number.isInteger(rawHighestIndex) && rawHighestIndex >= rawMissionIndex && rawHighestIndex < limit
      ? rawHighestIndex
      : rawMissionIndex;

    const rawScore = Number(parsed.score);
    const validScore = Number.isFinite(rawScore) && rawScore >= 0 ? rawScore : 0;

    const rawStars = Number(parsed.stars);
    const validStars = Number.isInteger(rawStars) && rawStars >= 0 ? rawStars : 0;

    const rawStreak = Number(parsed.streak);
    const validStreak = Number.isInteger(rawStreak) && rawStreak >= 1 && rawStreak <= 5 ? rawStreak : 1;

    let validCompleted = [];
    if (Array.isArray(parsed.completedMissions)) {
      validCompleted = parsed.completedMissions.filter(
        (m) => (typeof m === 'number' && m >= 0 && m < limit) || (typeof m === 'string' && m.length > 0)
      );
    } else {
      validCompleted = Array.from({ length: validHighestIndex }, (_, i) => i);
    }

    const rawMissionsCompleted = Number(parsed.missionsCompleted ?? validCompleted.length);
    const validMissionsCompleted = Number.isInteger(rawMissionsCompleted) && rawMissionsCompleted >= 0
      ? rawMissionsCompleted
      : validCompleted.length;

    const currentStage = getStageForMission(rawMissionIndex);
    const highestStage = getStageForMission(validHighestIndex);

    return {
      missionIndex: rawMissionIndex,
      savedMissionIndex: rawMissionIndex,
      currentLevel: rawMissionIndex + 1,
      currentStage,
      stageIndex: currentStage - 1,
      highestUnlockedIndex: validHighestIndex,
      highestUnlockedLevel: validHighestIndex + 1,
      highestUnlockedStage: highestStage,
      unlockedStages: getUnlockedStages(validHighestIndex),
      completedMissions: validCompleted,
      missionsCompleted: validMissionsCompleted,
      score: validScore,
      stars: validStars,
      streak: validStreak,
      isCompleted: false,
    };
  } catch {
    return defaultState;
  }
}

/**
 * Compatibility helper returning the resume missionIndex directly.
 */
export function loadCosmicMinerCheckpoint(childId, maxMissions = TOTAL_SPACE_MISSIONS) {
  return loadCosmicMinerCheckpointData(childId, maxMissions).missionIndex;
}

/**
 * Saves checkpoint progress with boundary checking, sanitization, and child isolation.
 */
export function saveCosmicMinerCheckpoint(childId, checkpoint, maxMissions = TOTAL_SPACE_MISSIONS) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  const limit = typeof maxMissions === 'number' && maxMissions > 0 ? maxMissions : TOTAL_SPACE_MISSIONS;

  try {
    const existing = loadCosmicMinerCheckpointData(childId, limit);

    const targetMissionIndex = checkpoint?.missionIndex !== undefined
      ? Number(checkpoint.missionIndex)
      : checkpoint?.currentLevel !== undefined
        ? Number(checkpoint.currentLevel) - 1
        : existing.missionIndex;

    const isCompleted = checkpoint?.isCompleted === true || targetMissionIndex >= limit;

    if (isCompleted) {
      const highestIndex = limit - 1;
      const highestStage = getStageForMission(highestIndex);
      const payload = {
        missionIndex: 0,
        savedMissionIndex: 0,
        currentLevel: 1,
        currentStage: 1,
        stageIndex: 0,
        highestUnlockedIndex: highestIndex,
        highestUnlockedLevel: limit,
        highestUnlockedStage: highestStage,
        unlockedStages: getUnlockedStages(highestIndex),
        completedMissions: Array.from({ length: limit }, (_, i) => i),
        missionsCompleted: limit,
        score: checkpoint?.score !== undefined && Number.isFinite(Number(checkpoint.score)) && Number(checkpoint.score) >= 0
          ? Number(checkpoint.score)
          : existing.score,
        stars: checkpoint?.stars !== undefined && Number.isInteger(Number(checkpoint.stars)) && Number(checkpoint.stars) >= 0
          ? Number(checkpoint.stars)
          : existing.stars,
        streak: 1,
        isCompleted: true,
        completedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(getCosmicMinerCheckpointKey(childId), JSON.stringify(payload));
      return payload;
    }

    const safeMissionIndex = Number.isInteger(targetMissionIndex) && targetMissionIndex >= 0 && targetMissionIndex < limit
      ? targetMissionIndex
      : 0;

    const targetHighest = checkpoint?.highestUnlockedIndex !== undefined
      ? Number(checkpoint.highestUnlockedIndex)
      : checkpoint?.highestUnlockedLevel !== undefined
        ? Number(checkpoint.highestUnlockedLevel) - 1
        : Math.max(existing.highestUnlockedIndex, safeMissionIndex);

    const safeHighestIndex = Math.min(Math.max(targetHighest, safeMissionIndex), limit - 1);

    const rawScore = checkpoint?.score !== undefined ? Number(checkpoint.score) : existing.score;
    const safeScore = Number.isFinite(rawScore) && rawScore >= 0 ? rawScore : existing.score;

    const rawStars = checkpoint?.stars !== undefined ? Number(checkpoint.stars) : existing.stars;
    const safeStars = Number.isInteger(rawStars) && rawStars >= 0 ? rawStars : existing.stars;

    const rawStreak = checkpoint?.streak !== undefined ? Number(checkpoint.streak) : existing.streak;
    const safeStreak = Number.isInteger(rawStreak) && rawStreak >= 1 && rawStreak <= 5 ? rawStreak : 1;

    let safeCompleted = existing.completedMissions;
    if (Array.isArray(checkpoint?.completedMissions)) {
      safeCompleted = Array.from(
        new Set([
          ...existing.completedMissions,
          ...checkpoint.completedMissions.filter(
            (m) => (typeof m === 'number' && m >= 0 && m < limit) || (typeof m === 'string' && m.length > 0)
          ),
        ])
      );
    }

    const rawCompletedCount = checkpoint?.missionsCompleted !== undefined
      ? Number(checkpoint.missionsCompleted)
      : Math.max(existing.missionsCompleted, safeCompleted.length);
    const safeCompletedCount = Number.isInteger(rawCompletedCount) && rawCompletedCount >= 0
      ? rawCompletedCount
      : safeCompleted.length;

    const currentStage = getStageForMission(safeMissionIndex);
    const highestStage = getStageForMission(safeHighestIndex);

    const payload = {
      missionIndex: safeMissionIndex,
      savedMissionIndex: safeMissionIndex,
      currentLevel: safeMissionIndex + 1,
      currentStage,
      stageIndex: currentStage - 1,
      highestUnlockedIndex: safeHighestIndex,
      highestUnlockedLevel: safeHighestIndex + 1,
      highestUnlockedStage: highestStage,
      unlockedStages: getUnlockedStages(safeHighestIndex),
      completedMissions: safeCompleted,
      missionsCompleted: safeCompletedCount,
      score: safeScore,
      stars: safeStars,
      streak: safeStreak,
      isCompleted: false,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(getCosmicMinerCheckpointKey(childId), JSON.stringify(payload));
    return payload;
  } catch {
    return null;
  }
}

/**
 * Records completion of a mission, advancing the checkpoint, updating scores, and unlocking subsequent stages.
 */
export function recordCosmicMinerMissionCompletion(
  childId,
  missionIndex,
  scoreDelta = 500,
  starsDelta = 1,
  maxMissions = TOTAL_SPACE_MISSIONS
) {
  const limit = typeof maxMissions === 'number' && maxMissions > 0 ? maxMissions : TOTAL_SPACE_MISSIONS;
  const existing = loadCosmicMinerCheckpointData(childId, limit);

  const currentIdx = typeof missionIndex === 'number' && Number.isInteger(missionIndex)
    ? missionIndex
    : existing.missionIndex;

  const validScoreDelta = Number.isFinite(Number(scoreDelta)) && Number(scoreDelta) >= 0 ? Number(scoreDelta) : 500;
  const validStarsDelta = Number.isInteger(Number(starsDelta)) && Number(starsDelta) >= 0 ? Number(starsDelta) : 1;

  const nextMissionIndex = currentIdx + 1;
  const isNowCompleted = nextMissionIndex >= limit;

  const updatedCompleted = Array.from(new Set([...existing.completedMissions, currentIdx]));

  return saveCosmicMinerCheckpoint(
    childId,
    {
      missionIndex: isNowCompleted ? 0 : nextMissionIndex,
      highestUnlockedIndex: isNowCompleted ? limit - 1 : Math.max(existing.highestUnlockedIndex, nextMissionIndex),
      score: existing.score + validScoreDelta,
      stars: existing.stars + validStarsDelta,
      streak: Math.min(existing.streak + 1, 5),
      completedMissions: updatedCompleted,
      missionsCompleted: updatedCompleted.length,
      isCompleted: isNowCompleted,
    },
    limit
  );
}

/**
 * Resets a child's checkpoint back to the beginning of the mission sequence.
 */
export function resetCosmicMinerCheckpoint(childId) {
  const fresh = getDefaultCosmicMinerState();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(getCosmicMinerCheckpointKey(childId), JSON.stringify(fresh));
    } catch {
      // safe fallback on storage error
    }
  }
  return fresh;
}

/**
 * Clears stored checkpoint data entirely from localStorage.
 */
export function clearCosmicMinerCheckpoint(childId) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(getCosmicMinerCheckpointKey(childId));
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

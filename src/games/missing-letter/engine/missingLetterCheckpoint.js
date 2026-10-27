/**
 * missingLetterCheckpoint.js
 *
 * Child-specific progress persistence, checkpoint resume, and state management
 * for Missing Letter (30 levels across 3 developmental stages).
 *
 * Adheres to established LexiGuide checkpoint conventions:
 * - Strict per-child storage isolation via key prefix `lexiguide_missing_letter_checkpoint_<childId>`.
 * - Safe 'guest' fallback for unauthenticated play.
 * - Resumes seamlessly from the child's last incomplete level upon refresh.
 * - Prevents replaying completed levels from inflating score or regressing unlocked progress.
 * - Defensive validation and corruption recovery (malformed data safely falls back to defaults).
 * - Versioned state schema (`version: 1`) with legacy format migrations.
 */

import { TOTAL_MISSING_LETTER_LEVELS, MISSING_LETTER_MILESTONES } from './missingLetterCurriculum';

export const MISSING_LETTER_STORAGE_PREFIX = 'lexiguide_missing_letter_checkpoint_';

/**
 * Returns an isolated storage key scoped to a single child profile.
 */
export function getMissingLetterCheckpointKey(childId) {
  const safeId = childId !== undefined && childId !== null && childId !== '' ? String(childId) : 'guest';
  return `${MISSING_LETTER_STORAGE_PREFIX}${safeId}`;
}

/**
 * Loads, validates, and normalizes checkpoint data for a specific child.
 * Missing, malformed, or out-of-range payloads return a clean default state.
 */
export function loadMissingLetterCheckpointData(childId, maxRounds = TOTAL_MISSING_LETTER_LEVELS) {
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
    version: 1,
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultState;
  }

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_MISSING_LETTER_LEVELS;

  try {
    const raw = window.localStorage.getItem(getMissingLetterCheckpointKey(childId));
    if (!raw) {
      return defaultState;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }

    // Legacy numeric fallback (e.g. raw integer "3")
    if (typeof parsed === 'number' || (typeof parsed === 'string' && /^\d+$/.test(parsed.trim()))) {
      const num = Number(parsed);
      if (Number.isInteger(num) && num >= 0 && num < limit) {
        const completedLevels = Array.from({ length: num }, (_, i) => i + 1);
        const earnedRewards = Object.keys(MISSING_LETTER_MILESTONES)
          .map(Number)
          .filter((m) => num >= m);
        const unlockedStages = [1];
        if (num + 1 >= 11) unlockedStages.push(2);
        if (num + 1 >= 21) unlockedStages.push(3);

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
          version: 1,
        };
      }
      return defaultState;
    }

    if (!parsed || typeof parsed !== 'object') {
      return defaultState;
    }

    // Preserved completed state
    if (parsed.isCompleted === true) {
      const allLevels = Array.from({ length: limit }, (_, i) => i + 1);
      const allRewards = Object.keys(MISSING_LETTER_MILESTONES).map(Number);
      return {
        roundIndex: 0,
        savedRoundIndex: 0,
        currentLevel: 1,
        highestUnlockedLevel: limit,
        highestUnlockedIndex: limit - 1,
        score: Math.max(limit, Number(parsed.score) || limit),
        isCompleted: true,
        earnedRewards: Array.isArray(parsed.earnedRewards) && parsed.earnedRewards.length > 0 ? parsed.earnedRewards : allRewards,
        completedLevels: Array.isArray(parsed.completedLevels) && parsed.completedLevels.length > 0 ? parsed.completedLevels : allLevels,
        unlockedStages: [1, 2, 3],
        version: parsed.version || 1,
      };
    }

    const rawRoundIndex = Number(
      parsed.roundIndex ??
      parsed.savedRoundIndex ??
      parsed.levelIndex ??
      (parsed.currentLevel != null ? parsed.currentLevel - 1 : NaN)
    );

    // If index is invalid or outside curriculum bounds, start fresh
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

    // Sanitize completed levels
    let completedLevels = [];
    if (Array.isArray(parsed.completedLevels)) {
      completedLevels = Array.from(
        new Set(parsed.completedLevels.filter((n) => Number.isInteger(n) && n >= 1 && n <= limit))
      ).sort((a, b) => a - b);
    } else {
      completedLevels = Array.from({ length: Math.max(0, validHighestIdx) }, (_, i) => i + 1);
    }

    // Sanitize earned milestone rewards
    const allMilestones = Object.keys(MISSING_LETTER_MILESTONES).map(Number);
    let earnedRewards = [];
    if (Array.isArray(parsed.earnedRewards)) {
      earnedRewards = Array.from(
        new Set(parsed.earnedRewards.filter((n) => Number.isInteger(n) && n >= 1 && n <= limit))
      ).sort((a, b) => a - b);
    } else {
      const currentHighest = validHighestIdx + 1;
      earnedRewards = allMilestones.filter((m) => currentHighest > m || completedLevels.includes(m));
    }

    // Unlocked stages calculation
    const unlockedStages = [1];
    if (validHighestIdx + 1 >= 11) unlockedStages.push(2);
    if (validHighestIdx + 1 >= 21) unlockedStages.push(3);

    return {
      roundIndex: rawRoundIndex,
      savedRoundIndex: rawRoundIndex,
      currentLevel: rawRoundIndex + 1,
      highestUnlockedLevel: validHighestIdx + 1,
      highestUnlockedIndex: validHighestIdx,
      score: Math.max(validScore, completedLevels.length),
      isCompleted: false,
      earnedRewards,
      completedLevels,
      unlockedStages,
      version: parsed.version || 1,
    };
  } catch {
    return defaultState;
  }
}

/**
 * Loads the active 0-based round index for the specified child.
 */
export function loadMissingLetterCheckpoint(childId, maxRounds = TOTAL_MISSING_LETTER_LEVELS) {
  return loadMissingLetterCheckpointData(childId, maxRounds).roundIndex;
}

/**
 * Persists child checkpoint progress to local storage safely.
 * Preserves completed levels and milestones while preventing replay score inflation.
 */
export function saveMissingLetterCheckpoint(childId, data, maxRounds = TOTAL_MISSING_LETTER_LEVELS) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!data || typeof data !== 'object') return;

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_MISSING_LETTER_LEVELS;

  try {
    const isCompleted = Boolean(data.isCompleted);
    const prev = loadMissingLetterCheckpointData(childId, limit);

    const completedSet = new Set([
      ...(Array.isArray(prev.completedLevels) ? prev.completedLevels : []),
      ...(Array.isArray(data.completedLevels) ? data.completedLevels : []),
    ]);

    const rewardsSet = new Set([
      ...(Array.isArray(prev.earnedRewards) ? prev.earnedRewards : []),
      ...(Array.isArray(data.earnedRewards) ? data.earnedRewards : []),
    ]);

    // Handle single level completion event
    if (data.completedLevel != null) {
      const lvl = Number(data.completedLevel);
      if (Number.isInteger(lvl) && lvl >= 1 && lvl <= limit) {
        completedSet.add(lvl);
        if (MISSING_LETTER_MILESTONES[lvl] && !rewardsSet.has(lvl)) {
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

    // Auto-award milestone rewards
    const currentHighestLevel = validHighestIdx + 1;
    const allMilestones = Object.keys(MISSING_LETTER_MILESTONES).map(Number);
    allMilestones.forEach((m) => {
      if (currentHighestLevel > m || completedSet.has(m)) {
        rewardsSet.add(m);
      }
    });

    const completedLevels = Array.from(completedSet).sort((a, b) => a - b);
    const earnedRewards = Array.from(rewardsSet).sort((a, b) => a - b);

    // Calculate unlocked stages
    const unlockedStages = [1];
    if (validHighestIdx + 1 >= 11 || completedLevels.some((l) => l >= 10)) unlockedStages.push(2);
    if (validHighestIdx + 1 >= 21 || completedLevels.some((l) => l >= 20)) unlockedStages.push(3);

    // Replay protection: score cannot decrease
    const rawScore = Number(data.score ?? prev.score);
    const safeScore = Number.isFinite(rawScore)
      ? Math.max(prev.score, Math.max(completedLevels.length, Math.floor(rawScore)))
      : Math.max(prev.score, completedLevels.length);

    const payload = {
      roundIndex: isCompleted ? 0 : validIndex,
      savedRoundIndex: isCompleted ? 0 : validIndex,
      currentLevel: isCompleted ? 1 : validIndex + 1,
      highestUnlockedLevel: isCompleted ? limit : validHighestIdx + 1,
      highestUnlockedIndex: isCompleted ? limit - 1 : validHighestIdx,
      score: safeScore,
      isCompleted: isCompleted || prev.isCompleted || completedLevels.length >= limit,
      earnedRewards,
      completedLevels,
      unlockedStages,
      version: 1,
      lastPlayed: Date.now(),
    };

    window.localStorage.setItem(getMissingLetterCheckpointKey(childId), JSON.stringify(payload));
  } catch {
    /* ignore persistence errors */
  }
}

/**
 * Resets the child's checkpoint to level 1 clean state.
 */
export function resetMissingLetterCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(getMissingLetterCheckpointKey(childId));
  } catch {
    /* ignore reset errors */
  }
}

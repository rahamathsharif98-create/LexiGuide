/**
 * wordBuilderCheckpoint.js
 *
 * Child-specific progress persistence, checkpoint resume, and state management
 * for Word Builder (30 levels across 3 developmental stages).
 *
 * Adheres to established LexiGuide checkpoint conventions:
 * - Strict per-child storage isolation via key prefix `lexiguide_word_builder_checkpoint_<childId>`.
 * - Safe 'guest' fallback for unauthenticated play.
 * - Resumes seamlessly from the child's last incomplete level upon refresh.
 * - Prevents replaying completed levels from inflating score or regressing unlocked progress.
 * - Defensive validation and corruption recovery (malformed data safely falls back to defaults).
 * - Versioned state schema (`version: 1`) with legacy format migrations.
 */

import { TOTAL_WORD_BUILDER_LEVELS, WORD_BUILDER_MILESTONES } from './wordBuilderCurriculum';

export const WORD_BUILDER_STORAGE_PREFIX = 'lexiguide_word_builder_checkpoint_';

/**
 * Returns an isolated storage key scoped to a single child profile.
 */
export function getWordBuilderCheckpointKey(childId) {
  const safeId = childId !== undefined && childId !== null && childId !== '' ? String(childId) : 'guest';
  return `${WORD_BUILDER_STORAGE_PREFIX}${safeId}`;
}

/**
 * Loads, validates, and normalizes checkpoint data for a specific child.
 * Missing, malformed, or out-of-range payloads return a clean default state.
 */
export function loadWordBuilderCheckpointData(childId, maxRounds = TOTAL_WORD_BUILDER_LEVELS) {
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

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_WORD_BUILDER_LEVELS;

  try {
    const raw = window.localStorage.getItem(getWordBuilderCheckpointKey(childId));
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
        const unlockedStages = [1];
        if (num + 1 >= 11) unlockedStages.push(2);
        if (num + 1 >= 21) unlockedStages.push(3);
        return {
          ...defaultState,
          roundIndex: num,
          savedRoundIndex: num,
          currentLevel: num + 1,
          highestUnlockedLevel: num + 1,
          highestUnlockedIndex: num,
          score: num,
          completedLevels,
          unlockedStages,
        };
      }
      return defaultState;
    }

    if (!parsed || typeof parsed !== 'object') {
      return defaultState;
    }

    // Validate completed state
    const isCompleted = Boolean(parsed.isCompleted);
    if (isCompleted) {
      const allLevels = Array.from({ length: limit }, (_, i) => i + 1);
      const allMilestones = Object.keys(WORD_BUILDER_MILESTONES).map(Number);
      return {
        roundIndex: 0,
        savedRoundIndex: 0,
        currentLevel: 1,
        highestUnlockedLevel: limit,
        highestUnlockedIndex: limit - 1,
        score: Math.max(limit, Number(parsed.score) || limit),
        isCompleted: true,
        earnedRewards: allMilestones,
        completedLevels: Array.isArray(parsed.completedLevels) && parsed.completedLevels.length >= limit
          ? parsed.completedLevels
          : allLevels,
        unlockedStages: [1, 2, 3],
        version: parsed.version || 1,
      };
    }

    // Parse and sanitize round index
    const parsedIdx = Number(
      parsed.roundIndex ??
      parsed.savedRoundIndex ??
      parsed.levelIndex ??
      (parsed.currentLevel != null ? parsed.currentLevel - 1 : 0)
    );
    const rawRoundIndex = Number.isInteger(parsedIdx) && parsedIdx >= 0 && parsedIdx < limit ? parsedIdx : 0;

    // Parse and sanitize highest unlocked index
    const highestIdxCandidate = Number(
      parsed.highestUnlockedIndex ??
      (parsed.highestUnlockedLevel != null ? parsed.highestUnlockedLevel - 1 : rawRoundIndex)
    );
    const validHighestIdx = Number.isInteger(highestIdxCandidate)
      ? Math.max(rawRoundIndex, Math.min(Math.max(0, highestIdxCandidate), limit - 1))
      : rawRoundIndex;

    // Sanitize completed levels array
    let completedLevels = [];
    if (Array.isArray(parsed.completedLevels)) {
      completedLevels = Array.from(
        new Set(parsed.completedLevels.filter((n) => Number.isInteger(n) && n >= 1 && n <= limit))
      ).sort((a, b) => a - b);
    } else {
      completedLevels = Array.from({ length: rawRoundIndex }, (_, i) => i + 1);
    }

    // Sanitize score
    const parsedScore = Number(parsed.score);
    const validScore = Number.isFinite(parsedScore) && parsedScore >= 0
      ? Math.max(Math.floor(parsedScore), completedLevels.length)
      : completedLevels.length;

    // Sanitize earned milestone rewards
    const allMilestones = Object.keys(WORD_BUILDER_MILESTONES).map(Number);
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
    if (validHighestIdx + 1 >= 11 || completedLevels.some((l) => l >= 10)) unlockedStages.push(2);
    if (validHighestIdx + 1 >= 21 || completedLevels.some((l) => l >= 20)) unlockedStages.push(3);

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
export function loadWordBuilderCheckpoint(childId, maxRounds = TOTAL_WORD_BUILDER_LEVELS) {
  return loadWordBuilderCheckpointData(childId, maxRounds).roundIndex;
}

/**
 * Persists child checkpoint progress to local storage safely.
 * Preserves completed levels and milestones while preventing replay score inflation.
 */
export function saveWordBuilderCheckpoint(childId, data, maxRounds = TOTAL_WORD_BUILDER_LEVELS) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!data || typeof data !== 'object') return;

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_WORD_BUILDER_LEVELS;

  try {
    const isCompleted = Boolean(data.isCompleted);
    const prev = loadWordBuilderCheckpointData(childId, limit);

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
        if (WORD_BUILDER_MILESTONES[lvl] && !rewardsSet.has(lvl)) {
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
    const allMilestones = Object.keys(WORD_BUILDER_MILESTONES).map(Number);
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

    window.localStorage.setItem(getWordBuilderCheckpointKey(childId), JSON.stringify(payload));
  } catch {
    /* ignore persistence errors */
  }
}

/**
 * Resets the child's checkpoint to level 1 clean state.
 */
export function resetWordBuilderCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(getWordBuilderCheckpointKey(childId));
  } catch {
    /* ignore reset errors */
  }
}

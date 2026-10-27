/**
 * speakShineCheckpoint.js
 *
 * Child-specific progress persistence, checkpoint resume, and state management
 * for Speak & Shine (30 levels across 3 developmental stages).
 *
 * Adheres to established LexiGuide checkpoint conventions:
 * - Strict per-child storage isolation via key prefix
 *   `lexiguide_speak_shine_checkpoint_<childId>`.
 * - Safe 'guest' fallback for unauthenticated play.
 * - Resumes seamlessly from the child's last incomplete level upon refresh.
 * - Prevents replaying completed levels from inflating score or regressing
 *   unlocked progress (score is monotonically non-decreasing).
 * - Defensive validation and corruption recovery — malformed data safely
 *   falls back to a clean default state.
 * - Versioned state schema (`version: 1`) with legacy format migrations.
 * - Children's progress is fully isolated from each other.
 */

import { TOTAL_SPEAK_SHINE_LEVELS, SPEAK_SHINE_MILESTONES } from './speakShineCurriculum';

export const SPEAK_SHINE_STORAGE_PREFIX = 'lexiguide_speak_shine_checkpoint_';

// ─────────────────────────────────────────────────────────────────────────────
// Key helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns an isolated localStorage key scoped to a single child profile.
 * Falls back to 'guest' when childId is absent or empty.
 */
export function getSpeakShineCheckpointKey(childId) {
  const safeId =
    childId !== undefined && childId !== null && childId !== ''
      ? String(childId)
      : 'guest';
  return `${SPEAK_SHINE_STORAGE_PREFIX}${safeId}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default state factory
// ─────────────────────────────────────────────────────────────────────────────

function defaultCheckpointState() {
  return {
    /** 0-based index of the current word in SPEAK_SHINE_CURRICULUM */
    wordIndex: 0,
    savedWordIndex: 0,
    /** 1-based current level (= wordIndex + 1) */
    currentLevel: 1,
    /** 1-based highest level ever reached */
    highestUnlockedLevel: 1,
    /** Accumulated score (= number of words completed; never decreases) */
    score: 0,
    /** Whether the child has completed all 30 levels */
    isCompleted: false,
    /** Sorted list of 1-based level numbers the child has completed */
    completedLevels: [],
    /** Milestone levels whose rewards have been awarded (subset of SPEAK_SHINE_MILESTONES keys) */
    earnedRewards: [],
    /** Stage numbers that are currently unlocked (Stage 1 is always unlocked) */
    unlockedStages: [1],
    /** Schema version for future migrations */
    version: 1,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Unlock stage helper
// ─────────────────────────────────────────────────────────────────────────────

function computeUnlockedStages(highestIdx, completedLevels) {
  const stages = [1];
  if (highestIdx + 1 >= 11 || completedLevels.some((l) => l >= 10)) stages.push(2);
  if (highestIdx + 1 >= 21 || completedLevels.some((l) => l >= 20)) stages.push(3);
  return stages;
}

// ─────────────────────────────────────────────────────────────────────────────
// Load
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads, validates, and normalises checkpoint data for a specific child.
 * Missing, malformed, or out-of-range payloads return a clean default state.
 *
 * @param {string|number|null|undefined} childId
 * @param {number} [maxLevels] — defaults to TOTAL_SPEAK_SHINE_LEVELS
 * @returns {object} Validated checkpoint state
 */
export function loadSpeakShineCheckpointData(childId, maxLevels = TOTAL_SPEAK_SHINE_LEVELS) {
  const defaults = defaultCheckpointState();

  if (typeof window === 'undefined' || !window.localStorage) {
    return defaults;
  }

  const limit =
    typeof maxLevels === 'number' && maxLevels > 0
      ? maxLevels
      : TOTAL_SPEAK_SHINE_LEVELS;

  try {
    const raw = window.localStorage.getItem(getSpeakShineCheckpointKey(childId));
    if (!raw) return defaults;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }

    // ── Legacy numeric fallback (e.g. raw integer "3" from an older schema) ──
    if (
      typeof parsed === 'number' ||
      (typeof parsed === 'string' && /^\d+$/.test(parsed.trim()))
    ) {
      const num = Number(parsed);
      if (Number.isInteger(num) && num >= 0 && num < limit) {
        const completedLevels = Array.from({ length: num }, (_, i) => i + 1);
        return {
          ...defaults,
          wordIndex: num,
          savedWordIndex: num,
          currentLevel: num + 1,
          highestUnlockedLevel: num + 1,
          score: num,
          completedLevels,
          unlockedStages: computeUnlockedStages(num, completedLevels),
        };
      }
      return defaults;
    }

    if (!parsed || typeof parsed !== 'object') return defaults;

    // ── Completed state shortcut ──────────────────────────────────────────────
    if (Boolean(parsed.isCompleted)) {
      const allLevels = Array.from({ length: limit }, (_, i) => i + 1);
      const allMilestoneKeys = Object.keys(SPEAK_SHINE_MILESTONES).map(Number);
      return {
        wordIndex: 0,
        savedWordIndex: 0,
        currentLevel: 1,
        highestUnlockedLevel: limit,
        score: Math.max(limit, Number(parsed.score) || limit),
        isCompleted: true,
        completedLevels:
          Array.isArray(parsed.completedLevels) &&
          parsed.completedLevels.length >= limit
            ? parsed.completedLevels
            : allLevels,
        earnedRewards:
          Array.isArray(parsed.earnedRewards) &&
          parsed.earnedRewards.length >= allMilestoneKeys.length
            ? parsed.earnedRewards
            : allMilestoneKeys,
        unlockedStages: [1, 2, 3],
        version: parsed.version || 1,
      };
    }

    // ── Parse wordIndex ───────────────────────────────────────────────────────
    const rawIdx = Number(
      parsed.wordIndex ??
      parsed.savedWordIndex ??
      parsed.roundIndex ??
      (parsed.currentLevel != null ? parsed.currentLevel - 1 : 0)
    );
    const validIdx =
      Number.isInteger(rawIdx) && rawIdx >= 0 && rawIdx < limit ? rawIdx : 0;

    // ── Parse highestUnlockedLevel ────────────────────────────────────────────
    const rawHighest = Number(
      parsed.highestUnlockedLevel ??
      (parsed.highestUnlockedIndex != null
        ? parsed.highestUnlockedIndex + 1
        : validIdx + 1)
    );
    const validHighest = Number.isInteger(rawHighest)
      ? Math.max(validIdx + 1, Math.min(Math.max(1, rawHighest), limit))
      : validIdx + 1;

    // ── Sanitise completedLevels ──────────────────────────────────────────────
    let completedLevels = [];
    if (Array.isArray(parsed.completedLevels)) {
      completedLevels = Array.from(
        new Set(
          parsed.completedLevels.filter(
            (n) => Number.isInteger(n) && n >= 1 && n <= limit
          )
        )
      ).sort((a, b) => a - b);
    } else {
      completedLevels = Array.from({ length: validIdx }, (_, i) => i + 1);
    }

    // ── Sanitise score (monotonically non-decreasing) ─────────────────────────
    const parsedScore = Number(parsed.score);
    const validScore = Number.isFinite(parsedScore) && parsedScore >= 0
      ? Math.max(Math.floor(parsedScore), completedLevels.length)
      : completedLevels.length;

    // ── Sanitise earnedRewards ────────────────────────────────────────────────
    const allMilestoneKeys = Object.keys(SPEAK_SHINE_MILESTONES).map(Number);
    let earnedRewards = [];
    if (Array.isArray(parsed.earnedRewards)) {
      earnedRewards = Array.from(
        new Set(
          parsed.earnedRewards.filter(
            (n) => Number.isInteger(n) && n >= 1 && n <= limit
          )
        )
      ).sort((a, b) => a - b);
    } else {
      earnedRewards = allMilestoneKeys.filter(
        (m) => validHighest > m || completedLevels.includes(m)
      );
    }

    const highestIdx = validHighest - 1;

    return {
      wordIndex: validIdx,
      savedWordIndex: validIdx,
      currentLevel: validIdx + 1,
      highestUnlockedLevel: validHighest,
      score: Math.max(validScore, completedLevels.length),
      isCompleted: false,
      completedLevels,
      earnedRewards,
      unlockedStages: computeUnlockedStages(highestIdx, completedLevels),
      version: parsed.version || 1,
    };
  } catch {
    return defaults;
  }
}

/**
 * Convenience wrapper: returns only the validated 0-based word index.
 */
export function loadSpeakShineCheckpoint(childId, maxLevels = TOTAL_SPEAK_SHINE_LEVELS) {
  return loadSpeakShineCheckpointData(childId, maxLevels).wordIndex;
}

// ─────────────────────────────────────────────────────────────────────────────
// Save
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persists child checkpoint progress to localStorage safely.
 *
 * Rules:
 * - Score is monotonically non-decreasing (never reset by replay).
 * - completedLevels and earnedRewards are cumulative unions of old and new.
 * - highestUnlockedLevel never decreases.
 * - Milestones are auto-awarded when highestUnlockedLevel passes them.
 *
 * @param {string|number|null|undefined} childId
 * @param {object} data — partial or full checkpoint state to merge
 * @param {number} [maxLevels]
 */
export function saveSpeakShineCheckpoint(childId, data, maxLevels = TOTAL_SPEAK_SHINE_LEVELS) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!data || typeof data !== 'object') return;

  const limit =
    typeof maxLevels === 'number' && maxLevels > 0
      ? maxLevels
      : TOTAL_SPEAK_SHINE_LEVELS;

  try {
    const isCompleted = Boolean(data.isCompleted);
    const prev = loadSpeakShineCheckpointData(childId, limit);

    // ── Merge completed levels ────────────────────────────────────────────────
    const completedSet = new Set([
      ...(Array.isArray(prev.completedLevels) ? prev.completedLevels : []),
      ...(Array.isArray(data.completedLevels) ? data.completedLevels : []),
    ]);

    // Single-level completion event shortcut
    if (data.completedLevel != null) {
      const lvl = Number(data.completedLevel);
      if (Number.isInteger(lvl) && lvl >= 1 && lvl <= limit) {
        completedSet.add(lvl);
      }
    }

    // ── Merge earned rewards ──────────────────────────────────────────────────
    const rewardsSet = new Set([
      ...(Array.isArray(prev.earnedRewards) ? prev.earnedRewards : []),
      ...(Array.isArray(data.earnedRewards) ? data.earnedRewards : []),
    ]);

    // ── Resolve wordIndex ─────────────────────────────────────────────────────
    const rawIdx = Number(
      data.wordIndex ??
      data.savedWordIndex ??
      data.roundIndex ??
      (data.currentLevel != null ? data.currentLevel - 1 : prev.wordIndex)
    );
    const validIdx =
      Number.isInteger(rawIdx) && rawIdx >= 0 && rawIdx < limit
        ? rawIdx
        : prev.wordIndex;

    // ── Resolve highestUnlockedLevel (never decreases) ────────────────────────
    const rawHighest = Number(
      data.highestUnlockedLevel ??
      (data.highestUnlockedIndex != null
        ? data.highestUnlockedIndex + 1
        : Math.max(validIdx + 1, prev.highestUnlockedLevel))
    );
    const validHighest = Number.isInteger(rawHighest)
      ? Math.max(
          validIdx + 1,
          Math.max(rawHighest, prev.highestUnlockedLevel)
        )
      : Math.max(validIdx + 1, prev.highestUnlockedLevel);

    // ── Auto-award milestone rewards ──────────────────────────────────────────
    const allMilestoneKeys = Object.keys(SPEAK_SHINE_MILESTONES).map(Number);
    const completedLevels = Array.from(completedSet).sort((a, b) => a - b);
    allMilestoneKeys.forEach((m) => {
      if (validHighest > m || completedSet.has(m)) {
        rewardsSet.add(m);
      }
    });
    const earnedRewards = Array.from(rewardsSet).sort((a, b) => a - b);

    // ── Replay-safe score (monotonically non-decreasing) ─────────────────────
    const rawScore = Number(data.score ?? prev.score);
    const safeScore = Number.isFinite(rawScore)
      ? Math.max(prev.score, Math.max(completedLevels.length, Math.floor(rawScore)))
      : Math.max(prev.score, completedLevels.length);

    const highestIdx = (isCompleted ? limit : validHighest) - 1;

    const payload = {
      wordIndex: isCompleted ? 0 : validIdx,
      savedWordIndex: isCompleted ? 0 : validIdx,
      currentLevel: isCompleted ? 1 : validIdx + 1,
      highestUnlockedLevel: isCompleted ? limit : validHighest,
      score: safeScore,
      isCompleted: isCompleted || prev.isCompleted || completedLevels.length >= limit,
      completedLevels,
      earnedRewards,
      unlockedStages: computeUnlockedStages(highestIdx, completedLevels),
      version: 1,
      lastPlayed: Date.now(),
    };

    window.localStorage.setItem(
      getSpeakShineCheckpointKey(childId),
      JSON.stringify(payload)
    );
  } catch {
    /* ignore persistence errors */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resets the child's checkpoint to a clean Level 1 state.
 * Only call this through the game's intentional reset flow.
 */
export function resetSpeakShineCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(getSpeakShineCheckpointKey(childId));
  } catch {
    /* ignore reset errors */
  }
}

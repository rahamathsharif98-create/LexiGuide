/**
 * soundSafariCheckpoint.js
 *
 * Child-specific progress persistence and checkpoint resume engine for
 * Sound Safari (Animal Sound Matching).
 *
 * Follows the proven LexiGuide pattern (as used in Cosmic Safari, Space Sound Mission, Word Train):
 * - Isolates saves strictly per childId (with safe guest fallback).
 * - Stores minimal essential resumable state (roundIndex, score, highestUnlockedLevel, isCompleted).
 * - Validates stored data defensively to prevent corruption or out-of-range state.
 * - Guarantees that completed runs cannot accidentally resume as unfinished.
 * - Resets cleanly on Play Again or explicit fresh start.
 */

import { TOTAL_SOUND_SAFARI_LEVELS } from './soundSafariCurriculum'

export const SOUND_SAFARI_STORAGE_PREFIX = 'lexiguide_sound_safari_checkpoint_'

/**
 * Generates an isolated storage key per child.
 */
export function getSoundSafariCheckpointKey(childId) {
  const safeId = childId !== undefined && childId !== null && childId !== '' ? String(childId) : 'guest'
  return `${SOUND_SAFARI_STORAGE_PREFIX}${safeId}`
}

/**
 * Loads, validates, and sanitizes checkpoint data for a specific child.
 * Missing, malformed, out-of-range, or completed checkpoints return fresh run state.
 */
export function loadSoundSafariCheckpointData(childId, maxRounds = TOTAL_SOUND_SAFARI_LEVELS) {
  const defaultState = {
    roundIndex: 0,
    savedRoundIndex: 0,
    currentLevel: 1,
    highestUnlockedLevel: 1,
    highestUnlockedIndex: 0,
    score: 0,
    isCompleted: false,
  }

  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultState
  }

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_SOUND_SAFARI_LEVELS

  try {
    const raw = window.localStorage.getItem(getSoundSafariCheckpointKey(childId))
    if (!raw) {
      return defaultState
    }

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = raw
    }

    // Legacy integer/string fallback
    if (typeof parsed === 'number' || (typeof parsed === 'string' && /^\d+$/.test(parsed.trim()))) {
      const num = Number(parsed)
      if (Number.isInteger(num) && num >= 0 && num < limit) {
        return {
          roundIndex: num,
          savedRoundIndex: num,
          currentLevel: num + 1,
          highestUnlockedLevel: num + 1,
          highestUnlockedIndex: num,
          score: num,
          isCompleted: false,
        }
      }
      return defaultState
    }

    if (!parsed || typeof parsed !== 'object') {
      return defaultState
    }

    // A completed run must never resume as an unfinished run; start fresh
    if (parsed.isCompleted === true) {
      return defaultState
    }

    const rawRoundIndex = Number(
      parsed.roundIndex ??
      parsed.savedRoundIndex ??
      parsed.levelIndex ??
      parsed.savedLevelIndex ??
      parsed.index ??
      (parsed.currentLevel != null ? parsed.currentLevel - 1 : NaN)
    )

    // If out-of-range, start fresh
    if (!Number.isInteger(rawRoundIndex) || rawRoundIndex < 0 || rawRoundIndex >= limit) {
      return defaultState
    }

    const rawHighestIndex = Number(
      parsed.highestUnlockedIndex ??
      (parsed.highestUnlockedLevel != null ? parsed.highestUnlockedLevel - 1 : rawRoundIndex)
    )

    const validHighestIndex = Number.isInteger(rawHighestIndex) && rawHighestIndex >= rawRoundIndex && rawHighestIndex < limit
      ? rawHighestIndex
      : rawRoundIndex

    const rawScore = Number(parsed.score)
    const validScore = Number.isFinite(rawScore) && rawScore >= 0 ? rawScore : 0

    return {
      roundIndex: rawRoundIndex,
      savedRoundIndex: rawRoundIndex,
      currentLevel: rawRoundIndex + 1,
      highestUnlockedLevel: validHighestIndex + 1,
      highestUnlockedIndex: validHighestIndex,
      score: validScore,
      isCompleted: false,
    }
  } catch {
    return defaultState
  }
}

/**
 * Compatibility helper returning the resume roundIndex directly.
 */
export function loadSoundSafariCheckpoint(childId, maxRounds = TOTAL_SOUND_SAFARI_LEVELS) {
  return loadSoundSafariCheckpointData(childId, maxRounds).roundIndex
}

/**
 * Saves checkpoint progress with boundary checking and isolation.
 */
export function saveSoundSafariCheckpoint(childId, checkpoint, maxRounds = TOTAL_SOUND_SAFARI_LEVELS) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_SOUND_SAFARI_LEVELS

  try {
    const existing = loadSoundSafariCheckpointData(childId, limit)

    const targetRoundIndex = checkpoint?.roundIndex !== undefined
      ? Number(checkpoint.roundIndex)
      : checkpoint?.currentLevel !== undefined
        ? Number(checkpoint.currentLevel) - 1
        : existing.roundIndex

    const isCompleted = checkpoint?.isCompleted === true || targetRoundIndex >= limit

    if (isCompleted) {
      const payload = {
        roundIndex: 0,
        savedRoundIndex: 0,
        currentLevel: 1,
        highestUnlockedLevel: limit,
        highestUnlockedIndex: limit - 1,
        score: checkpoint?.score !== undefined ? Number(checkpoint.score) : existing.score,
        isCompleted: true,
        completedAt: new Date().toISOString(),
      }
      window.localStorage.setItem(getSoundSafariCheckpointKey(childId), JSON.stringify(payload))
      return payload
    }

    const safeRoundIndex = Number.isInteger(targetRoundIndex) && targetRoundIndex >= 0 && targetRoundIndex < limit
      ? targetRoundIndex
      : 0

    const targetHighest = checkpoint?.highestUnlockedIndex !== undefined
      ? Number(checkpoint.highestUnlockedIndex)
      : checkpoint?.highestUnlockedLevel !== undefined
        ? Number(checkpoint.highestUnlockedLevel) - 1
        : Math.max(existing.highestUnlockedIndex, safeRoundIndex)

    const safeHighestIndex = Math.min(Math.max(targetHighest, safeRoundIndex), limit - 1)

    const payload = {
      roundIndex: safeRoundIndex,
      savedRoundIndex: safeRoundIndex,
      currentLevel: safeRoundIndex + 1,
      highestUnlockedLevel: safeHighestIndex + 1,
      highestUnlockedIndex: safeHighestIndex,
      score: checkpoint?.score !== undefined ? Math.max(0, Number(checkpoint.score)) : existing.score,
      isCompleted: false,
      updatedAt: new Date().toISOString(),
    }

    window.localStorage.setItem(getSoundSafariCheckpointKey(childId), JSON.stringify(payload))
    return payload
  } catch {
    return null
  }
}

/**
 * Resets checkpoint storage on Play Again or explicit fresh start.
 */
export function resetSoundSafariCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false
  }

  try {
    window.localStorage.removeItem(getSoundSafariCheckpointKey(childId))
    return true
  } catch {
    return false
  }
}

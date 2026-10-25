/**
 * safariPhotoCheckpoint.js
 *
 * Child-specific progress persistence and checkpoint resume engine for
 * Safari Wildlife Photographer.
 *
 * Follows the proven LexiGuide pattern (as used in Sky Archer and Word Train):
 * - Isolates saves strictly per childId (with safe guest fallback).
 * - Stores minimal essential resumable state (targetIndex, photosSnapped, score, stars, streak).
 * - Validates stored data defensively to prevent corruption or out-of-range state.
 * - Guarantees that completed runs cannot accidentally resume as unfinished.
 * - Resets cleanly on Play Again or explicit fresh start.
 */

import { SAFARI_TARGETS } from './safariAnimals';

export const SAFARI_PHOTO_STORAGE_PREFIX = 'lexiguide_safari_photo_checkpoint_';
export const TOTAL_SAFARI_TARGETS = SAFARI_TARGETS.length; // 5

/**
 * Generates an isolated storage key per child.
 */
export function getSafariPhotoCheckpointKey(childId) {
  const safeId = childId !== undefined && childId !== null && childId !== '' ? String(childId) : 'guest';
  return `${SAFARI_PHOTO_STORAGE_PREFIX}${safeId}`;
}

/**
 * Loads, validates, and sanitizes checkpoint data for a specific child.
 * Missing, malformed, out-of-range, or completed checkpoints return fresh run state.
 */
export function loadSafariPhotoCheckpointData(childId, maxTargets = TOTAL_SAFARI_TARGETS) {
  const defaultState = {
    targetIndex: 0,
    photosSnapped: 0,
    score: 0,
    stars: 0,
    streak: 1,
    isCompleted: false,
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultState;
  }

  const limit = typeof maxTargets === 'number' && maxTargets > 0 ? maxTargets : TOTAL_SAFARI_TARGETS;

  try {
    const raw = window.localStorage.getItem(getSafariPhotoCheckpointKey(childId));
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
        return {
          targetIndex: num,
          photosSnapped: num,
          score: num * 150,
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

    const rawTargetIndex = Number(
      parsed.targetIndex ??
      parsed.savedTargetIndex ??
      parsed.roundIndex ??
      parsed.savedRoundIndex ??
      parsed.index
    );

    // If out-of-range or completed, start fresh
    if (!Number.isInteger(rawTargetIndex) || rawTargetIndex < 0 || rawTargetIndex >= limit) {
      return defaultState;
    }

    const rawPhotosSnapped = Number(parsed.photosSnapped ?? rawTargetIndex);
    const validPhotos = Number.isInteger(rawPhotosSnapped)
      ? Math.max(0, Math.min(rawPhotosSnapped, limit - 1))
      : rawTargetIndex;

    const rawScore = Number(parsed.score ?? 0);
    const validScore = Number.isFinite(rawScore) ? Math.max(0, Math.floor(rawScore)) : 0;

    const rawStars = Number(parsed.stars ?? validPhotos);
    const validStars = Number.isFinite(rawStars) ? Math.max(0, Math.floor(rawStars)) : validPhotos;

    const rawStreak = Number(parsed.streak ?? 1);
    const validStreak = Number.isFinite(rawStreak) && rawStreak >= 1 ? Math.min(5, Math.floor(rawStreak)) : 1;

    return {
      targetIndex: rawTargetIndex,
      photosSnapped: validPhotos,
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
 * Persists child checkpoint progress to browser storage safely.
 */
export function saveSafariPhotoCheckpoint(childId, data, maxTargets = TOTAL_SAFARI_TARGETS) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!data || typeof data !== 'object') return;

  const limit = typeof maxTargets === 'number' && maxTargets > 0 ? maxTargets : TOTAL_SAFARI_TARGETS;

  try {
    const isCompleted = Boolean(data.isCompleted);

    if (isCompleted) {
      // Completed run payload: marked completed so next launch starts fresh
      window.localStorage.setItem(
        getSafariPhotoCheckpointKey(childId),
        JSON.stringify({
          targetIndex: 0,
          photosSnapped: limit,
          score: Math.max(0, Math.floor(Number(data.score) || 0)),
          stars: Math.max(0, Math.floor(Number(data.stars) || 0)),
          streak: 1,
          isCompleted: true,
          updatedAt: Date.now(),
        })
      );
      return;
    }

    const rawTarget = Number(data.targetIndex ?? 0);
    const validTarget = Number.isInteger(rawTarget)
      ? Math.max(0, Math.min(rawTarget, limit - 1))
      : 0;

    const rawPhotos = Number(data.photosSnapped ?? validTarget);
    const validPhotos = Number.isInteger(rawPhotos)
      ? Math.max(0, Math.min(rawPhotos, limit - 1))
      : validTarget;

    const rawScore = Number(data.score ?? 0);
    const validScore = Number.isFinite(rawScore) && rawScore >= 0 ? Math.floor(rawScore) : 0;

    const rawStars = Number(data.stars ?? validPhotos);
    const validStars = Number.isFinite(rawStars) && rawStars >= 0 ? Math.floor(rawStars) : validPhotos;

    const rawStreak = Number(data.streak ?? 1);
    const validStreak = Number.isFinite(rawStreak) && rawStreak >= 1 ? Math.min(5, Math.floor(rawStreak)) : 1;

    window.localStorage.setItem(
      getSafariPhotoCheckpointKey(childId),
      JSON.stringify({
        targetIndex: validTarget,
        photosSnapped: validPhotos,
        score: validScore,
        stars: validStars,
        streak: validStreak,
        isCompleted: false,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[SafariPhotoCheckpoint] Failed to save checkpoint:', err);
  }
}

/**
 * Resets checkpoint for the given child back to Round 1 (Lion).
 */
export function resetSafariPhotoCheckpoint(childId, maxTargets = TOTAL_SAFARI_TARGETS) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    window.localStorage.setItem(
      getSafariPhotoCheckpointKey(childId),
      JSON.stringify({
        targetIndex: 0,
        photosSnapped: 0,
        score: 0,
        stars: 0,
        streak: 1,
        isCompleted: false,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[SafariPhotoCheckpoint] Failed to reset checkpoint:', err);
  }
}

/**
 * Clears checkpoint key from storage entirely for the child.
 */
export function clearSafariPhotoCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    window.localStorage.removeItem(getSafariPhotoCheckpointKey(childId));
  } catch (err) {
    console.warn('[SafariPhotoCheckpoint] Failed to clear checkpoint:', err);
  }
}

/**
 * voxelCrafterCheckpoint.js
 *
 * Child-specific progress persistence and checkpoint resume engine for
 * Voxel Word Crafter (3D Block Builder).
 *
 * Follows the proven LexiGuide pattern (as used in Sky Archer and Safari Photo):
 * - Isolates saves strictly per childId (with safe guest fallback).
 * - Stores minimal essential resumable state (recipeIndex, recipesCrafted, score, stars, streak).
 * - Validates stored data defensively to prevent corruption or out-of-range state.
 * - Guarantees that completed runs cannot accidentally resume as unfinished.
 * - Resets cleanly on Play Again or explicit fresh start.
 */

import { CRAFT_RECIPES } from './craftRecipes';

export const VOXEL_CRAFTER_STORAGE_PREFIX = 'lexiguide_voxel_crafter_checkpoint_';
export const TOTAL_VOXEL_RECIPES = CRAFT_RECIPES.length; // 5

/**
 * Generates an isolated storage key per child.
 */
export function getVoxelCrafterCheckpointKey(childId) {
  const safeId = childId !== undefined && childId !== null && childId !== '' ? String(childId) : 'guest';
  return `${VOXEL_CRAFTER_STORAGE_PREFIX}${safeId}`;
}

/**
 * Loads, validates, and sanitizes checkpoint data for a specific child.
 * Missing, malformed, out-of-range, or completed checkpoints return fresh run state.
 */
export function loadVoxelCrafterCheckpointData(childId, maxRecipes = TOTAL_VOXEL_RECIPES) {
  const defaultState = {
    recipeIndex: 0,
    savedRecipeIndex: 0,
    currentLevel: 1,
    highestUnlockedLevel: 1,
    highestUnlockedIndex: 0,
    recipesCrafted: 0,
    score: 0,
    stars: 0,
    streak: 1,
    isCompleted: false,
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultState;
  }

  const limit = typeof maxRecipes === 'number' && maxRecipes > 0 ? maxRecipes : TOTAL_VOXEL_RECIPES;

  try {
    const raw = window.localStorage.getItem(getVoxelCrafterCheckpointKey(childId));
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
          recipeIndex: num,
          savedRecipeIndex: num,
          currentLevel: num + 1,
          highestUnlockedLevel: num + 1,
          highestUnlockedIndex: num,
          recipesCrafted: num,
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

    const rawRecipeIndex = Number(
      parsed.recipeIndex ??
      parsed.savedRecipeIndex ??
      parsed.roundIndex ??
      parsed.savedRoundIndex ??
      parsed.levelIndex ??
      (parsed.currentLevel != null ? parsed.currentLevel - 1 : NaN) ??
      parsed.index
    );

    // If out-of-range or completed, start fresh
    if (!Number.isInteger(rawRecipeIndex) || rawRecipeIndex < 0 || rawRecipeIndex >= limit) {
      return defaultState;
    }

    const rawHighestIdx = Number(
      parsed.highestUnlockedIndex ??
      (parsed.highestUnlockedLevel != null ? parsed.highestUnlockedLevel - 1 : rawRecipeIndex)
    );
    const validHighestIdx = Number.isInteger(rawHighestIdx)
      ? Math.max(rawRecipeIndex, Math.min(rawHighestIdx, limit - 1))
      : rawRecipeIndex;

    const rawCrafted = Number(parsed.recipesCrafted ?? rawRecipeIndex);
    const validCrafted = Number.isInteger(rawCrafted)
      ? Math.max(0, Math.min(rawCrafted, limit - 1))
      : rawRecipeIndex;

    const rawScore = Number(parsed.score ?? 0);
    const validScore = Number.isFinite(rawScore) ? Math.max(0, Math.floor(rawScore)) : 0;

    const rawStars = Number(parsed.stars ?? validCrafted);
    const validStars = Number.isFinite(rawStars) ? Math.max(0, Math.floor(rawStars)) : validCrafted;

    const rawStreak = Number(parsed.streak ?? 1);
    const validStreak = Number.isFinite(rawStreak) && rawStreak >= 1 ? Math.min(5, Math.floor(rawStreak)) : 1;

    return {
      recipeIndex: rawRecipeIndex,
      savedRecipeIndex: rawRecipeIndex,
      currentLevel: rawRecipeIndex + 1,
      highestUnlockedLevel: validHighestIdx + 1,
      highestUnlockedIndex: validHighestIdx,
      recipesCrafted: validCrafted,
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
 * Loads the saved 0-based recipe index for the given child.
 */
export function loadVoxelCrafterCheckpoint(childId, maxRecipes = TOTAL_VOXEL_RECIPES) {
  return loadVoxelCrafterCheckpointData(childId, maxRecipes).recipeIndex;
}

/**
 * Persists child checkpoint progress to browser storage safely.
 */
export function saveVoxelCrafterCheckpoint(childId, data, maxRecipes = TOTAL_VOXEL_RECIPES) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!data || typeof data !== 'object') return;

  const limit = typeof maxRecipes === 'number' && maxRecipes > 0 ? maxRecipes : TOTAL_VOXEL_RECIPES;

  try {
    const isCompleted = Boolean(data.isCompleted);
    const prev = loadVoxelCrafterCheckpointData(childId, limit);

    if (isCompleted) {
      // Completed run payload: marked completed so next launch starts fresh
      window.localStorage.setItem(
        getVoxelCrafterCheckpointKey(childId),
        JSON.stringify({
          recipeIndex: 0,
          savedRecipeIndex: 0,
          currentLevel: 1,
          highestUnlockedLevel: limit,
          highestUnlockedIndex: limit - 1,
          recipesCrafted: limit,
          score: Math.max(0, Math.floor(Number(data.score) || 0)),
          stars: Math.max(0, Math.floor(Number(data.stars) || 0)),
          streak: 1,
          isCompleted: true,
          updatedAt: Date.now(),
        })
      );
      return;
    }

    const rawRecipe = Number(data.recipeIndex ?? data.levelIndex ?? 0);
    const validRecipe = Number.isInteger(rawRecipe)
      ? Math.max(0, Math.min(rawRecipe, limit - 1))
      : 0;

    const highestIdx = Math.max(prev.highestUnlockedIndex, validRecipe);

    const rawCrafted = Number(data.recipesCrafted ?? validRecipe);
    const validCrafted = Number.isInteger(rawCrafted)
      ? Math.max(0, Math.min(rawCrafted, limit - 1))
      : validRecipe;

    const rawScore = Number(data.score ?? 0);
    const validScore = Number.isFinite(rawScore) && rawScore >= 0 ? Math.floor(rawScore) : 0;

    const rawStars = Number(data.stars ?? validCrafted);
    const validStars = Number.isFinite(rawStars) && rawStars >= 0 ? Math.floor(rawStars) : validCrafted;

    const rawStreak = Number(data.streak ?? 1);
    const validStreak = Number.isFinite(rawStreak) && rawStreak >= 1 ? Math.min(5, Math.floor(rawStreak)) : 1;

    window.localStorage.setItem(
      getVoxelCrafterCheckpointKey(childId),
      JSON.stringify({
        recipeIndex: validRecipe,
        savedRecipeIndex: validRecipe,
        currentLevel: validRecipe + 1,
        highestUnlockedLevel: highestIdx + 1,
        highestUnlockedIndex: highestIdx,
        recipesCrafted: validCrafted,
        score: validScore,
        stars: validStars,
        streak: validStreak,
        isCompleted: false,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[VoxelCrafterCheckpoint] Failed to save checkpoint:', err);
  }
}

/**
 * Resets checkpoint for the given child back to Recipe 1 (FORT).
 */
export function resetVoxelCrafterCheckpoint(childId, maxRecipes = TOTAL_VOXEL_RECIPES) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    window.localStorage.setItem(
      getVoxelCrafterCheckpointKey(childId),
      JSON.stringify({
        recipeIndex: 0,
        savedRecipeIndex: 0,
        currentLevel: 1,
        highestUnlockedLevel: 1,
        highestUnlockedIndex: 0,
        recipesCrafted: 0,
        score: 0,
        stars: 0,
        streak: 1,
        isCompleted: false,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[VoxelCrafterCheckpoint] Failed to reset checkpoint:', err);
  }
}

/**
 * Clears checkpoint key from storage entirely for the child.
 */
export function clearVoxelCrafterCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    window.localStorage.removeItem(getVoxelCrafterCheckpointKey(childId));
  } catch (err) {
    console.warn('[VoxelCrafterCheckpoint] Failed to clear checkpoint:', err);
  }
}

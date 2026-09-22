import { ACHIEVEMENT_DEFS } from '../../game/engine/constants';

// Computes which achievements are unlocked from the cumulative save data.
// Pure function — no side effects — so it's easy to call from any screen.
export function computeUnlockedAchievements(save) {
  const totals = save.totals || {};
  const unlocked = new Set(save.achievements || []);

  if ((totals.runsCompleted || 0) >= 1) unlocked.add('first-run');
  if ((totals.lettersCollected || 0) >= 20) unlocked.add('letter-explorer');
  if ((totals.wordsCompleted || 0) >= 5) unlocked.add('word-builder');
  if ((totals.bestCheckpointsInRun || 0) >= 3) unlocked.add('flame-runner');
  if ((save.stars || 0) >= 15) unlocked.add('star-collector');

  return ACHIEVEMENT_DEFS.map((def) => ({ ...def, unlocked: unlocked.has(def.id) }));
}

export function mergeNewlyUnlocked(save) {
  const evaluated = computeUnlockedAchievements(save);
  const unlockedIds = evaluated.filter((a) => a.unlocked).map((a) => a.id);
  const newlyUnlocked = unlockedIds.filter((id) => !(save.achievements || []).includes(id));
  return { unlockedIds, newlyUnlocked };
}

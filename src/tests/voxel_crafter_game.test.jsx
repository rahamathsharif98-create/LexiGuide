import { describe, it, expect } from 'vitest';
import { CRAFT_RECIPES, getCraftRecipe } from '../games/voxel-crafter/engine/craftRecipes';
import { getGameById } from '../data/gamingZoneRegistry';

describe('Voxel Word Crafter (3D Block Builder)', () => {
  it('loads valid crafting recipes with rewards and distractors', () => {
    expect(CRAFT_RECIPES.length).toBeGreaterThanOrEqual(5);
    CRAFT_RECIPES.forEach((recipe) => {
      expect(recipe.id).toBeDefined();
      expect(recipe.word).toBeDefined();
      expect(recipe.reward).toBeDefined();
      expect(recipe.blockColor).toBeDefined();
      expect(recipe.distractors.length).toBeGreaterThanOrEqual(2);
      expect(recipe.prompt).toBeDefined();
      expect(recipe.speechText).toBeDefined();
    });
  });

  it('cycles recipes predictably without out-of-bounds crash', () => {
    const r0 = getCraftRecipe(0);
    expect(r0.word).toBe('FORT');
    const r1 = getCraftRecipe(1);
    expect(r1.word).toBe('GOLD');
    const rOverflow = getCraftRecipe(16);
    expect(rOverflow).toBeDefined();
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('voxel-crafter');
    expect(game).toBeDefined();
    expect(game.title).toBe('Voxel Word Crafter');
    expect(game.route).toBe('/child/games/voxel-crafter');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('letters');
  });
});

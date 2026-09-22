import { describe, it, expect } from 'vitest';
import { BAKERY_RECIPES, getBakeryRecipe } from '../games/magic-bakery/engine/bakeryRecipes';
import { getGameById } from '../data/gamingZoneRegistry';

describe('Magic Bakery 3D (Syllable Stacker)', () => {
  it('loads valid compound word recipes with accurate syllables and distractors', () => {
    expect(BAKERY_RECIPES.length).toBeGreaterThanOrEqual(5);
    BAKERY_RECIPES.forEach((recipe) => {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.syllables.length).toBeGreaterThanOrEqual(2);
      expect(recipe.frostingColors.length).toBeGreaterThanOrEqual(2);
      expect(recipe.distractors.length).toBeGreaterThanOrEqual(2);
      expect(recipe.prompt).toBeDefined();
      expect(recipe.speechText).toBeDefined();
    });
  });

  it('cycles recipes predictably without index errors', () => {
    const r0 = getBakeryRecipe(0);
    expect(r0.name).toBe('CUPCAKE');
    const r1 = getBakeryRecipe(1);
    expect(r1.name).toBe('RAINBOW');
    const rOverflow = getBakeryRecipe(15);
    expect(rOverflow).toBeDefined();
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('magic-bakery');
    expect(game).toBeDefined();
    expect(game.title).toBe('Magic Bakery 3D');
    expect(game.route).toBe('/child/games/magic-bakery');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('words');
  });
});

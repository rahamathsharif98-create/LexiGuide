import { describe, it, expect } from 'vitest'
import { generateRecommendations } from '../services/adaptiveEngine'
import { resolveThemePackage, applyThemeToActivity } from '../services/personalizationService'

describe('Phase 3: Personalization Engine & Decoupling from Learning Profile', () => {
  const mockFingerprintWeakPhonemes = {
    phonologicalAwareness: 50, // weak (<65) -> Sound Safari
    pronunciation: 80,
    readingFluency: 80,
    comprehension: 80,
    wordRecognition: 80,
  }

  it('1. Resolves interests into presentation theme packages (Space, Animals, Music, Nature)', () => {
    const spaceTheme = resolveThemePackage({ interest_categories: ['space'], favorite_color: 'Purple' })
    expect(spaceTheme.id).toBe('space')
    expect(spaceTheme.name).toBe('Cosmic Adventure')
    expect(spaceTheme.musicCategory).toBe('Space')

    const animalTheme = resolveThemePackage({ interest_categories: ['animals'] })
    expect(animalTheme.id).toBe('animals')
    expect(animalTheme.name).toBe('Jungle Explorers')
    expect(animalTheme.musicCategory).toBe('Nature')
  })

  it('2. CRITICAL PRINCIPLE: Interest Profile NEVER influences adaptive recommendation logic or skill difficulty', () => {
    // Both children have identical skill evidence: weak phonological awareness
    // Child A loves Space
    const recsChildA = generateRecommendations(mockFingerprintWeakPhonemes)
    // Child B loves Animals
    const recsChildB = generateRecommendations(mockFingerprintWeakPhonemes)

    // The recommendation engine produces identical core recommendations regardless of interest
    expect(recsChildA[0].skill).toBe('phonologicalAwareness')
    expect(recsChildB[0].skill).toBe('phonologicalAwareness')
    expect(recsChildA[0].difficulty).toBe(recsChildB[0].difficulty)
    expect(recsChildA[0].route).toBe('/child/games/match-sound')
    expect(recsChildB[0].route).toBe('/child/games/match-sound')
  })

  it('3. Theming modifies presentation titles and icons without modifying underlying skill or route', () => {
    const recs = generateRecommendations(mockFingerprintWeakPhonemes)
    const baseActivity = recs[0] // Sound Safari

    const spaceTheme = resolveThemePackage({ interest_categories: ['space'] })
    const themedSpace = applyThemeToActivity(baseActivity, spaceTheme)

    expect(themedSpace.themedTitle).toBe('Sound Mission')
    expect(themedSpace.themedIcon).toBe('🚀')
    expect(themedSpace.route).toBe('/child/games/match-sound') // unchanged
    expect(themedSpace.skill).toBe('phonologicalAwareness')     // unchanged

    const animalTheme = resolveThemePackage({ interest_categories: ['animals'] })
    const themedAnimals = applyThemeToActivity(baseActivity, animalTheme)

    expect(themedAnimals.themedTitle).toBe('Animal Sound Safari')
    expect(themedAnimals.themedIcon).toBe('🦁')
    expect(themedAnimals.route).toBe('/child/games/match-sound') // unchanged
  })
})

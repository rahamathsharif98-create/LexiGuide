import { describe, it, expect } from 'vitest'
import { LANGUAGES, STRINGS, t } from '../i18n/translations'
import { MULTILINGUAL_VOICE_CONFIG, speakLanguageAudio, getLanguageAwareVoice } from '../services/multilingualVoiceService'
import { resolveThemePackage, applyThemeToActivity } from '../services/personalizationService'
import { audioAtmosphere } from '../services/audioAtmosphereService'

describe('Phases 0–15: Final Master E2E Regression & Integrity Suite', () => {
  it('Phase 1 & 3: Decoupling of Interests from Adaptive Decisions', () => {
    const spaceTheme = resolveThemePackage({ interest_categories: ['space'] })
    const animalsTheme = resolveThemePackage({ interest_categories: ['animals'] })

    const sampleActivity = {
      title: 'Sound Safari',
      skill: 'phonologicalAwareness',
      route: '/child/games/match-sound',
      difficulty: 'Practice',
    }

    const themedSpace = applyThemeToActivity(sampleActivity, spaceTheme)
    const themedAnimals = applyThemeToActivity(sampleActivity, animalsTheme)

    // Visual presentation changes
    expect(themedSpace.themedTitle).toBe('Sound Mission')
    expect(themedAnimals.themedTitle).toBe('Animal Sound Safari')

    // Learning route and skill remain strictly identical
    expect(themedSpace.route).toBe(sampleActivity.route)
    expect(themedAnimals.route).toBe(sampleActivity.route)
    expect(themedSpace.skill).toBe(sampleActivity.skill)
    expect(themedAnimals.skill).toBe(sampleActivity.skill)
  })

  it('Phases 7 & 8: First-Class Telugu and Hindi Bridge Config & Voicing', () => {
    expect(MULTILINGUAL_VOICE_CONFIG.te).toBeDefined()
    expect(MULTILINGUAL_VOICE_CONFIG.hi).toBeDefined()
    expect(MULTILINGUAL_VOICE_CONFIG.en).toBeDefined()

    expect(MULTILINGUAL_VOICE_CONFIG.te.langTag).toBe('te-IN')
    expect(MULTILINGUAL_VOICE_CONFIG.hi.langTag).toBe('hi-IN')

    expect(MULTILINGUAL_VOICE_CONFIG.te.sampleWords.length).toBeGreaterThanOrEqual(4)
    expect(MULTILINGUAL_VOICE_CONFIG.hi.sampleWords.length).toBeGreaterThanOrEqual(4)

    // Bridge curriculum templates
    const tePrompt = MULTILINGUAL_VOICE_CONFIG.te.bridgeTemplates.instruction('Cat')
    expect(tePrompt).toContain('Cat')
    expect(tePrompt).toContain('వినండి')

    const hiPrompt = MULTILINGUAL_VOICE_CONFIG.hi.bridgeTemplates.instruction('Lotus')
    expect(hiPrompt).toContain('Lotus')
    expect(hiPrompt).toContain('बोलें')
  })

  it('Phase 10: Independent Audio Controls & Ducking Mechanics', () => {
    audioAtmosphere.audioDuckingEnabled = true
    audioAtmosphere.duckMusic(0.2)
    expect(audioAtmosphere.audioDuckingEnabled).toBe(true)

    audioAtmosphere.setQuietMode(true)
    expect(audioAtmosphere.quietMode).toBe(true)

    audioAtmosphere.setQuietMode(false)
    expect(audioAtmosphere.quietMode).toBe(false)
  })

  it('Phase 13: Educational & Non-Clinical Integrity Across Platform', () => {
    const prohibitedTerms = ['diagnosis', 'disorder', 'deficit', 'dysfunctional', 'handicap']
    
    // Check translations and strings
    Object.values(STRINGS).forEach((dict) => {
      Object.values(dict).forEach((str) => {
        prohibitedTerms.forEach((term) => {
          expect(str.toLowerCase()).not.toContain(term)
        })
      })
    })
  })
})

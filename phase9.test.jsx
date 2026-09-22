import { describe, it, expect } from 'vitest'
import { generateRecommendations, detectSkillPattern, childFriendlyPatternText } from './src/services/adaptiveEngine'

// All fixture series below are hand-written, fixed values — never random —
// so pattern detection is fully deterministic, mirroring the backend's
// AdaptiveLearningEngine tests (backend/tests/test_adaptive_learning_phase9.py).

function series(values, skill = 'wordRecognition') {
  return values.map((v, i) => ({ session: `S${i + 1}`, [skill]: v }))
}

describe('Phase 9: detectSkillPattern', () => {
  it('recognizes an improving trend', () => {
    const pattern = detectSkillPattern(series([55, 60, 64, 72]), 'wordRecognition')
    expect(pattern).toBe('improving')
  })

  it('recognizes inconsistency rather than labeling a skill simply weak', () => {
    const pattern = detectSkillPattern(series([82, 48, 85, 50], 'comprehension'), 'comprehension')
    expect(pattern).toBe('inconsistent')
    expect(pattern).not.toBe('needs_practice')
  })

  it('recognizes a consistently strong skill', () => {
    const pattern = detectSkillPattern(series([85, 88, 90, 92], 'pronunciation'), 'pronunciation')
    expect(pattern).toBe('consistently_strong')
  })

  it('does not call a single low result "repeatedly struggling"', () => {
    const pattern = detectSkillPattern(series([72, 30], 'phonologicalAwareness'), 'phonologicalAwareness')
    expect(pattern).not.toBe('repeatedly_struggling')
  })

  it('recognizes repeated low performance as repeatedly struggling', () => {
    const pattern = detectSkillPattern(series([40, 45, 42, 38], 'phonologicalAwareness'), 'phonologicalAwareness')
    expect(pattern).toBe('repeatedly_struggling')
  })

  it('returns not_enough_data with fewer than two data points', () => {
    expect(detectSkillPattern(series([70]), 'wordRecognition')).toBe('not_enough_data')
    expect(detectSkillPattern([], 'wordRecognition')).toBe('not_enough_data')
  })
})

describe('Phase 9: childFriendlyPatternText', () => {
  it('never surfaces a raw technical pattern name or a diagnostic label', () => {
    const forbidden = /dyslexia|diagnos|percent|%/i
    ;['consistently_strong', 'improving', 'inconsistent', 'needs_practice', 'repeatedly_struggling', 'not_practiced_recently'].forEach((p) => {
      const text = childFriendlyPatternText(p)
      expect(text).not.toMatch(forbidden)
      expect(text.length).toBeGreaterThan(0)
    })
  })

  it('falls back to encouraging default copy for an unknown pattern', () => {
    expect(childFriendlyPatternText('something_unexpected')).toBe('Try this next!')
  })
})

describe('Phase 9: generateRecommendations avoids over-practice', () => {
  const weakFingerprint = {
    phonologicalAwareness: 40,
    pronunciation: 40,
    wordRecognition: 40,
    readingFluency: 90,
    comprehension: 90,
  }

  it('does not keep the same just-repeated activity at the top when an alternative exists', () => {
    // Word Builder (wordRecognition) was just played twice in a row.
    const recentTitles = ['Word Builder', 'Word Builder']
    const recs = generateRecommendations(weakFingerprint, [], { recentTitles })
    expect(recs[0].title).not.toBe('Word Builder')
  })

  it('still recommends normally when there is no repetition yet', () => {
    const recs = generateRecommendations(weakFingerprint, [], { recentTitles: [] })
    expect(recs.length).toBeGreaterThan(0)
  })

  it('falls back to Story Time when every tracked skill is strong', () => {
    const strongFingerprint = {
      phonologicalAwareness: 90,
      pronunciation: 90,
      wordRecognition: 90,
      readingFluency: 90,
      comprehension: 90,
    }
    const recs = generateRecommendations(strongFingerprint, [])
    expect(recs[0].title).toBe('Story Time')
  })
})

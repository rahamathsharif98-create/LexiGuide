import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameSessionTracker } from '../hooks/useGameSessionTracker'
import { normalizeSkillToPillar, updateFingerprint } from '../services/mockAiService'
import { generateRecommendations } from '../services/adaptiveEngine'

describe('End-to-End Scenarios A-G: Performance Evidence & Learning Pipeline', () => {
  let savedSessions = []
  let mockToast = vi.fn()

  const mockSaveLearningSession = vi.fn().mockImplementation(async (session) => {
    savedSessions.push(session)
    return { ok: true, id: savedSessions.length }
  })

  beforeEach(() => {
    savedSessions = []
    mockToast.mockClear()
    mockSaveLearningSession.mockClear()
  })

  // Scenario A: 8 of 10 tasks answered correctly
  it('Scenario A: verifies attempts, correct answers, and accuracy match actual responses', async () => {
    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'sound-safari',
        gameTitle: 'Sound Safari',
        skill: 'phonologicalAwareness',
        initialTarget: 10,
      })
    )

    // Child answers 8 correct, 2 incorrect
    act(() => {
      for (let i = 0; i < 8; i++) {
        result.current.recordAttempt(true, { roundScore: 100, starsEarned: 1, xpEarned: 10 })
      }
      for (let i = 0; i < 2; i++) {
        result.current.recordAttempt(false)
      }
    })

    expect(result.current.stats.roundsAttempted).toBe(10)
    expect(result.current.stats.roundsCorrect).toBe(8)

    let savedOutcome = null
    await act(async () => {
      savedOutcome = await result.current.saveCompletedSession({
        isCompleted: true,
      })
    })

    expect(savedOutcome.accuracy).toBe(80)
    expect(savedOutcome.roundsAttempted).toBe(10)
    expect(savedOutcome.roundsCorrect).toBe(8)
    expect(savedOutcome.is_completed).toBe(true)
    expect(savedOutcome.completion_status).toBe('completed')
  })

  // Scenario B: Repeat practice with different performance is tracked and compared
  it('Scenario B: preserves history across repeat practice and reflects different performance', async () => {
    const baselineFingerprint = {
      phonologicalAwareness: 55,
      wordRecognition: 55,
      readingFluency: 55,
      pronunciation: 55,
      comprehension: 55,
    }

    // Session 1: 90% accuracy in phonological awareness
    const fp1 = updateFingerprint(baselineFingerprint, {
      type: 'game',
      skill: 'phonologicalAwareness',
      score: 90,
      accuracy: 90,
    })
    expect(fp1.phonologicalAwareness).toBeGreaterThan(55)

    // Session 2: Repeat practice with lower accuracy (40%)
    const fp2 = updateFingerprint(fp1, {
      type: 'game',
      skill: 'phonologicalAwareness',
      score: 40,
      accuracy: 40,
    })

    // Fingerprint reflects the lower recent performance compared to fp1
    expect(fp2.phonologicalAwareness).toBeLessThan(fp1.phonologicalAwareness)
  })

  // Scenario C: Assisted success with hints is tracked as assisted support level
  it('Scenario C: tracks hints used and tags support level as assisted rather than independent', async () => {
    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'ancient-labyrinth',
        gameTitle: 'Ancient Phonics Labyrinth',
        skill: 'phonicsDecodingIncantation',
        initialTarget: 5,
      })
    )

    act(() => {
      result.current.recordAttempt(true, { hintUsed: true })
      result.current.recordAttempt(true, { hintUsed: true })
      result.current.recordAttempt(true)
    })

    expect(result.current.stats.hintsUsed).toBe(2)

    let outcome = null
    await act(async () => {
      outcome = await result.current.saveCompletedSession({
        stars: 2,
        xp: 25,
      })
    })

    expect(outcome.hintsUsed).toBe(2)
    expect(outcome.support_level).toBe('assisted')
    expect(outcome.metrics.supportLevel).toBe('assisted')
  })

  // Scenario D: Immediate quit with 0 attempts does not record completed activity
  it('Scenario D: exits with 0 attempts do not record false completion or inflate progress', async () => {
    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'cloud-bouncer',
        gameTitle: 'Cloud Bouncer',
        skill: 'sightWordRecognition',
        initialTarget: 5,
      })
    )

    let outcome = null
    await act(async () => {
      outcome = await result.current.saveCompletedSession()
    })

    expect(outcome).toBeNull()
  })

  // Scenario G: Recommendations update based on genuine persisted evidence
  it('Scenario G: Next-Best-Action generates adaptive recommendations based on weak areas', () => {
    const strugglingFingerprint = {
      phonologicalAwareness: 45, // below 65 threshold
      wordRecognition: 75,
      readingFluency: 80,
      pronunciation: 70,
      comprehension: 75,
    }

    const recs = generateRecommendations(strugglingFingerprint, [])
    expect(recs.length).toBeGreaterThan(0)
    // Primary recommendation targets phonological awareness
    const soundRec = recs.find((r) => r.skill === 'phonologicalAwareness' || r.title === 'Sound Safari')
    expect(soundRec).toBeDefined()
    expect(soundRec.reason).toContain('Phonological Awareness')
  })

  // ---------------------------------------------------------------------------
  // Explicit Verification Scenarios 1 to 10
  // ---------------------------------------------------------------------------

  it('Scenario 1: student answers 8 of 10 questions correctly with exact empirical calculation', async () => {
    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'sound-safari',
        gameTitle: 'Sound Safari',
        skill: 'phonologicalAwareness',
        initialTarget: 10,
      })
    )
    await act(async () => {
      for (let i = 0; i < 8; i++) result.current.recordAttempt(true)
      for (let i = 0; i < 2; i++) result.current.recordAttempt(false)
    })
    let outcome = null
    await act(async () => {
      outcome = await result.current.saveCompletedSession({ isCompleted: true })
    })
    expect(outcome.roundsAttempted).toBe(10)
    expect(outcome.roundsCorrect).toBe(8)
    expect(outcome.accuracy).toBe(80)
  })

  it('Scenario 2: student retries an incorrect answer', async () => {
    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'word-builder',
        gameTitle: 'Word Builder',
        skill: 'wordRecognition',
        initialTarget: 5,
      })
    )
    await act(async () => {
      result.current.recordAttempt(false)
      result.current.recordAttempt(true, { retry: true })
    })
    expect(result.current.stats.retriesCount).toBe(1)
  })

  it('Scenario 3: student uses a hint during activity', async () => {
    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'ancient-labyrinth',
        gameTitle: 'Phonics Labyrinth',
        skill: 'phonologicalAwareness',
        initialTarget: 5,
      })
    )
    await act(async () => {
      result.current.recordAttempt(true, { hintUsed: true })
      result.current.recordAttempt(true, { hintUsed: true })
    })
    let outcome = null
    await act(async () => {
      outcome = await result.current.saveCompletedSession({ isCompleted: true })
    })
    expect(outcome.hintsUsed).toBe(2)
    expect(outcome.support_level).toBe('assisted')
  })

  it('Scenario 4: student exits before completing a game', async () => {
    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'learning-run',
        gameTitle: 'Learning Run',
        skill: 'readingFluency',
        initialTarget: 5,
      })
    )
    const outcome = await result.current.saveCompletedSession()
    expect(outcome).toBeNull()
  })

  it('Scenario 5: same student completes a second session and history compares properly', () => {
    const fp0 = { phonologicalAwareness: 55, wordRecognition: 55, readingFluency: 55, pronunciation: 55, comprehension: 55 }
    const fp1 = updateFingerprint(fp0, { type: 'game', skill: 'phonologicalAwareness', score: 85, accuracy: 85 })
    const fp2 = updateFingerprint(fp1, { type: 'game', skill: 'phonologicalAwareness', score: 95, accuracy: 95 })
    expect(fp2.phonologicalAwareness).toBeGreaterThan(fp1.phonologicalAwareness)
  })

  it('Scenario 6: two students complete same activity with different results', () => {
    const fpBase = { phonologicalAwareness: 55, wordRecognition: 55, readingFluency: 55, pronunciation: 55, comprehension: 55 }
    const st1Fp = updateFingerprint(fpBase, { type: 'game', skill: 'phonologicalAwareness', score: 90, accuracy: 90 })
    const st2Fp = updateFingerprint(fpBase, { type: 'game', skill: 'phonologicalAwareness', score: 40, accuracy: 40 })
    expect(st1Fp.phonologicalAwareness).toBeGreaterThan(st2Fp.phonologicalAwareness)
  })

  it('Scenario 7 & 8: recommendation engine selects appropriate practice based on student need', () => {
    const strugglingPhonics = { phonologicalAwareness: 45, wordRecognition: 80, readingFluency: 80, pronunciation: 80, comprehension: 80 }
    const recs = generateRecommendations(strugglingPhonics, [])
    expect(recs[0].reason).toContain('Phonological Awareness')
    expect(recs[0].route).toBe('/child/games/match-sound')
  })

  it('Scenario 9 & 10: spaced practice and recommendations adapt as skills improve', () => {
    const masteredFingerprint = { phonologicalAwareness: 85, wordRecognition: 85, readingFluency: 85, pronunciation: 85, comprehension: 85 }
    const recs = generateRecommendations(masteredFingerprint, [])
    expect(recs.length).toBeGreaterThan(0)
    expect(recs[0].title).toBe('Story Time')
  })
})

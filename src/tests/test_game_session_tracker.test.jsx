import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameSessionTracker } from '../hooks/useGameSessionTracker'
import { updateFingerprint, normalizeSkillToPillar, GRANULAR_SKILL_TO_PILLAR } from '../services/mockAiService'

// Mock AppContext
const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 101, ok: true })
const mockShowToast = vi.fn()

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    activeChild: { id: 1, name: 'Leo Explorer' },
    isRealBackend: true,
    saveLearningSession: mockSaveLearningSession,
    applySessionOutcome: vi.fn(),
    showToast: mockShowToast,
  }),
}))

describe('Game Session Evidence Tracking and Normalization Audit', () => {
  it('normalizes all 10 3D game skills to their literacy pillars', () => {
    const expected = {
      learningRun: ['phonicsWordCompletion', 'wordRecognition'],
      ancientLabyrinth: ['phonicsDecodingIncantation', 'wordRecognition'],
      safariPhoto: ['auditoryPhonicsDiscrimination', 'phonologicalAwareness'],
      voxelCrafter: ['wordSpellingConstruction', 'wordRecognition'],
      cloudBouncer: ['sightWordRecognition', 'wordRecognition'],
      dinoFossil: ['onsetRimeBlending', 'phonologicalAwareness'],
      magicBakery: ['syllableStacking', 'wordRecognition'],
      coralDiver: ['rhymeDiscrimination', 'phonologicalAwareness'],
      cosmicMiner: ['letterSequencing', 'wordRecognition'],
      skyArcher: ['phonicsDiscrimination', 'phonologicalAwareness'],
    }

    Object.entries(expected).forEach(([game, [skill, pillar]]) => {
      expect(normalizeSkillToPillar(skill)).toBe(pillar)
    })
  })

  it('correctly updates Reading Fingerprint in mockAiService for granular skills', () => {
    const baseline = {
      phonologicalAwareness: 55,
      wordRecognition: 55,
      readingFluency: 55,
      pronunciation: 55,
      comprehension: 55,
    }

    // 1. Voxel Word Crafter (wordSpellingConstruction -> wordRecognition)
    const afterVoxel = updateFingerprint(baseline, {
      type: 'game',
      skill: 'wordSpellingConstruction',
      score: 96,
    })
    expect(afterVoxel.wordRecognition).toBeGreaterThan(55)
    expect(afterVoxel.phonologicalAwareness).toBe(55)

    // 2. Coral Reef Submarine Diver (rhymeDiscrimination -> phonologicalAwareness)
    const afterCoral = updateFingerprint(afterVoxel, {
      type: 'game',
      skill: 'rhymeDiscrimination',
      score: 90,
    })
    expect(afterCoral.phonologicalAwareness).toBeGreaterThan(55)
  })

  it('useGameSessionTracker tracks attempts, calculates accuracy, and invokes saveLearningSession', async () => {
    mockSaveLearningSession.mockClear()
    mockShowToast.mockClear()

    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'voxel-crafter',
        gameTitle: 'Voxel Word Crafter',
        skill: 'wordSpellingConstruction',
      })
    )

    // Simulate 3 correct attempts and 1 retry
    act(() => {
      result.current.recordAttempt(true, { roundScore: 150, starsEarned: 1, xpEarned: 20 })
      result.current.recordAttempt(false)
      result.current.recordAttempt(true, { roundScore: 150, starsEarned: 1, xpEarned: 20 })
    })

    expect(result.current.stats.roundsAttempted).toBe(3)
    expect(result.current.stats.roundsCorrect).toBe(2)

    await act(async () => {
      await result.current.saveCompletedSession({
        stars: 2,
        xp: 40,
        score: 300,
      })
    })

    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1)
    const payload = mockSaveLearningSession.mock.calls[0][0]
    expect(payload.activity_id).toBe('voxel-crafter')
    expect(payload.skill).toBe('wordSpellingConstruction')
    expect(payload.stars).toBe(2)
    expect(payload.xp).toBe(40)
    expect(payload.outcome.accuracy).toBe(67) // 2/3 = 67%
    expect(mockShowToast).toHaveBeenCalledTimes(1)
  })
})

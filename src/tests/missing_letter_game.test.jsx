import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import GamePlay from '../pages/child/GamePlay'
import MissingLetterRound from '../games/missing-letter/components/MissingLetterRound'
import missingLetterAudio, {
  getMissingLetterSoundInfo,
  MISSING_LETTER_PHONICS_MAP,
} from '../games/missing-letter/engine/missingLetterAudio'
import {
  TOTAL_MISSING_LETTER_LEVELS,
  MISSING_LETTER_STAGE_CONFIG,
  MISSING_LETTER_STAGES,
  MISSING_LETTER_MILESTONES,
  MISSING_LETTER_CURRICULUM,
  getMissingLetterRound,
  getMissingLetterRoundByIndex,
  getMissingLetterStageForLevel,
  getMissingLetterStageBadge,
  getMissingLetterMilestone,
  getMissingLetterDisplayedOptions,
} from '../games/missing-letter/engine/missingLetterCurriculum'
import {
  getMissingLetterCheckpointKey,
  loadMissingLetterCheckpointData,
  loadMissingLetterCheckpoint,
  saveMissingLetterCheckpoint,
  resetMissingLetterCheckpoint,
} from '../games/missing-letter/engine/missingLetterCheckpoint'
import {
  getGameById,
  getGamesByCategory,
  GAMING_ZONE_GAMES,
} from '../data/gamingZoneRegistry'

// Mock SpeechSynthesis for testing
class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text
    this.rate = 1
    this.pitch = 1
    this.lang = 'en-US'
    this.voice = null
    this.onstart = null
    this.onend = null
    this.onerror = null
  }
}

let mockSpeak = vi.fn((utterance) => {
  utterance?.onstart?.()
  utterance?.onend?.()
})
let mockCancel = vi.fn()
let mockResume = vi.fn()

// Mock AppContext to inspect session saving and control active child state
const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 101, ok: true })
const mockApplySessionOutcome = vi.fn()
let isRealBackendMock = true

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    activeChild: {
      id: 1,
      name: 'Leo Explorer',
      interests: ['space'],
      fingerprint: { wordRecognition: 60 },
      comfort_preferences: { quiet_mode: false },
    },
    isRealBackend: isRealBackendMock,
    errorPatterns: [],
    saveLearningSession: mockSaveLearningSession,
    applySessionOutcome: mockApplySessionOutcome,
    language: 'en',
    nextRecommendedActivity: null,
  }),
  AppProvider: ({ children }) => children,
}))

function renderMissingLetter() {
  return render(
    <MemoryRouter initialEntries={['/child/games/missing-letter']}>
      <Routes>
        <Route path="/child/games/:gameId" element={<GamePlay />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Missing Letter Game Suite (/child/games/missing-letter)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    isRealBackendMock = true

    mockSpeak = vi.fn((utterance) => {
      utterance?.onstart?.()
      utterance?.onend?.()
    })
    mockCancel = vi.fn()
    mockResume = vi.fn()

    window.speechSynthesis = {
      speak: mockSpeak,
      cancel: mockCancel,
      resume: mockResume,
      paused: false,
      getVoices: () => [{ lang: 'en-US', name: 'Samantha' }],
    }
    window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.useRealTimers()
    delete window.speechSynthesis
    delete window.SpeechSynthesisUtterance
  })

  // ─────────────────────────────────────────────────────────────
  // 1. Initial Render & Intro Screen
  // ─────────────────────────────────────────────────────────────
  it('1. loads and displays the intro screen with title, instructions, and Start Game button', () => {
    renderMissingLetter()

    expect(screen.getByTestId('gameplay-container')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Missing Letter/i })).toBeInTheDocument()
    expect(
      screen.getByText(/Look at the picture and choose the missing letter to complete the word\./i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to games/i })).toBeInTheDocument()
    expect(screen.getByTestId('voice-mode-indicator')).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 2. Starting Round 1 & Display
  // ─────────────────────────────────────────────────────────────
  it('2. starts Round 1 displaying C _ T, question prompt, and letter option buttons', () => {
    renderMissingLetter()

    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Stage updates to playing
    expect(screen.queryByRole('heading', { level: 1, name: /Missing Letter/i })).not.toBeInTheDocument()
    expect(screen.getByText(/Level 1 of 30/i)).toBeInTheDocument()
    expect(screen.getByText('C _ T')).toBeInTheDocument()
    expect(screen.getByText(/Which letter is missing\? Tap to complete!/i)).toBeInTheDocument()

    // Options for Round 1: A, O, E
    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'O' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'E' })).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 3. Feedback Overlay
  // ─────────────────────────────────────────────────────────────
  it('3. selecting the correct letter shows success feedback and increments score', () => {
    renderMissingLetter()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Click 'A' (correct for C _ T)
    fireEvent.click(screen.getByRole('button', { name: 'A' }))

    const feedback = screen.getByTestId('feedback-overlay')
    expect(feedback).toBeInTheDocument()
    expect(feedback).toHaveTextContent(/Great job!/i)
  })

  it('4. selecting an incorrect letter shows retry feedback without incrementing score', () => {
    renderMissingLetter()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Click 'O' (incorrect for C _ T)
    fireEvent.click(screen.getByRole('button', { name: 'O' }))

    const feedback = screen.getByTestId('feedback-overlay')
    expect(feedback).toBeInTheDocument()
    expect(feedback).toHaveTextContent(/Let's try again!/i)
  })

  // ─────────────────────────────────────────────────────────────
  // 4. Progression Through 30 Rounds & Results Screen
  // ─────────────────────────────────────────────────────────────
  it('5. progresses through all 30 rounds and displays the results screen with score summary', async () => {
    vi.useFakeTimers()
    renderMissingLetter()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    for (let i = 0; i < 30; i++) {
      expect(screen.getByText(new RegExp(`Level ${i + 1} of 30`, 'i'))).toBeInTheDocument()
      const round = MISSING_LETTER_CURRICULUM[i]
      // Pick correct answer for first 29 rounds, wrong answer for level 30
      const choice = (i === 29)
        ? round.options.find((opt) => opt !== round.answer)
        : round.answer
      fireEvent.click(screen.getByRole('button', { name: choice }))
      await act(async () => {
        vi.advanceTimersByTime(950)
      })
    }

    // Finished summary screen
    expect(screen.getByRole('heading', { level: 2, name: /Nice work!/i })).toBeInTheDocument()
    expect(screen.getByText(/You got 29 out of 30 correct\./i)).toBeInTheDocument()
    expect(screen.getByText(/⭐ \+29 Stars earned/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Play Again/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /See Results/i })).toBeInTheDocument()

    // Test Play Again button resets back to intro screen
    fireEvent.click(screen.getByRole('button', { name: /Play Again/i }))
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Missing Letter/i })).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 5. Backend Session Saving
  // ─────────────────────────────────────────────────────────────
  it('6. invokes saveLearningSession exactly once with expected payload when isRealBackend is true', async () => {
    vi.useFakeTimers()
    renderMissingLetter()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Complete all 30 rounds correctly (score: 30/30 = 100%)
    for (let i = 0; i < 30; i++) {
      const round = MISSING_LETTER_CURRICULUM[i]
      fireEvent.click(screen.getByRole('button', { name: round.answer }))
      await act(async () => { vi.advanceTimersByTime(950) })
    }
    await act(async () => { await Promise.resolve() })

    // Verify exactly one backend save call
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1)
    const payload = mockSaveLearningSession.mock.calls[0][0]
    expect(payload.skill).toBe('wordRecognition')
    expect(payload.stars).toBe(30)
    expect(payload.xp).toBe(15 + 30 * 3) // 105
    expect(payload.outcome).toMatchObject({
      type: 'game',
      skill: 'wordRecognition',
      title: 'Missing Letter',
      score: 100, // 30/30 = 100%
      accuracy: 100,
      starsGain: 30,
      xpGain: 105,
      _savedToBackend: true,
    })
    expect(mockApplySessionOutcome).not.toHaveBeenCalled()
  })

  // ─────────────────────────────────────────────────────────────
  // 6. Offline Mode Handling
  // ─────────────────────────────────────────────────────────────
  it('7. invokes applySessionOutcome when isRealBackend is false (offline mode)', async () => {
    isRealBackendMock = false
    vi.useFakeTimers()
    renderMissingLetter()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Complete rounds with 10 correct and 20 incorrect (accuracy: 10/30 = 33%)
    for (let i = 0; i < 30; i++) {
      const round = MISSING_LETTER_CURRICULUM[i]
      const choice = (i < 10) ? round.answer : round.options.find((opt) => opt !== round.answer)
      fireEvent.click(screen.getByRole('button', { name: choice }))
      await act(async () => { vi.advanceTimersByTime(950) })
    }
    await act(async () => { await Promise.resolve() })

    expect(mockSaveLearningSession).not.toHaveBeenCalled()
    expect(mockApplySessionOutcome).toHaveBeenCalledTimes(1)
    const outcome = mockApplySessionOutcome.mock.calls[0][0]
    expect(outcome.skill).toBe('wordRecognition')
    expect(outcome.score).toBe(33) // 10/30 = 33%
    expect(outcome.accuracy).toBe(33) // 10/30 = 33%
    expect(outcome.starsGain).toBe(10)
    expect(outcome.xpGain).toBe(45) // 15 + 10*3
    expect(outcome._savedToBackend).toBe(false)
  })

  // ─────────────────────────────────────────────────────────────
  // 7. Error & Retry Handling
  // ─────────────────────────────────────────────────────────────
  it('8. handles save errors gracefully and allows retry without duplicate saves', async () => {
    vi.useFakeTimers()
    mockSaveLearningSession.mockRejectedValueOnce(new Error('Network unavailable'))

    renderMissingLetter()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    for (let i = 0; i < 30; i++) {
      const round = MISSING_LETTER_CURRICULUM[i]
      fireEvent.click(screen.getByRole('button', { name: round.answer }))
      await act(async () => { vi.advanceTimersByTime(950) })
    }
    await act(async () => { await Promise.resolve() })

    // Verify error card is displayed on rejection
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/Could not save game results ⚠️/i)).toBeInTheDocument()
    expect(screen.getByText(/Network unavailable/i)).toBeInTheDocument()

    // Retry save
    const retryBtn = screen.getByRole('button', { name: /Tap to Retry 🔄/i })
    mockSaveLearningSession.mockResolvedValueOnce({ id: 102, ok: true })

    await act(async () => {
      fireEvent.click(retryBtn)
    })
    await act(async () => { await Promise.resolve() })

    // Save should now be called a second time
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(2)
    // Error card removed
    expect(screen.queryByText(/Could not save game results ⚠️/i)).not.toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 8. Curriculum Integrity: 30 Levels across 3 Stages
  // ─────────────────────────────────────────────────────────────
  it('9. contains exactly 30 rounds divided equally across 3 stages (10 per stage)', () => {
    expect(MISSING_LETTER_CURRICULUM).toHaveLength(30)
    expect(TOTAL_MISSING_LETTER_LEVELS).toBe(30)
    expect(MISSING_LETTER_STAGE_CONFIG).toHaveLength(3)
    expect(MISSING_LETTER_STAGES).toHaveLength(3)

    const stage1 = MISSING_LETTER_CURRICULUM.filter((r) => r.stage === 1)
    const stage2 = MISSING_LETTER_CURRICULUM.filter((r) => r.stage === 2)
    const stage3 = MISSING_LETTER_CURRICULUM.filter((r) => r.stage === 3)

    expect(stage1).toHaveLength(10)
    expect(stage2).toHaveLength(10)
    expect(stage3).toHaveLength(10)
  })

  it('10. ensures all round IDs are unique and levels are strictly sequential from 1 to 30', () => {
    const ids = MISSING_LETTER_CURRICULUM.map((r) => r.id)
    const levels = MISSING_LETTER_CURRICULUM.map((r) => r.level)
    expect(new Set(ids).size).toBe(30)
    expect(new Set(levels).size).toBe(30)

    levels.forEach((lvl, idx) => {
      expect(lvl).toBe(idx + 1)
    })
  })

  it('11. ensures every round has exactly 3 options, no duplicates, and exactly 1 correct answer', () => {
    MISSING_LETTER_CURRICULUM.forEach((round) => {
      expect(round.options).toHaveLength(3)
      expect(new Set(round.options).size).toBe(3) // No duplicates
      expect(round.options).toContain(round.answer)
      expect(round.correctIndex).toBe(round.options.indexOf(round.answer))
      expect(round.missing).toBe(round.answer)
      expect(round.wordDisplay).toBeTruthy()
      expect(round.fullWord).toBeTruthy()
      expect(round.prompt).toBeTruthy()
      expect(round.hint).toBeTruthy()
    })
  })

  it('12. ensures phonics accuracy: every missing letter accurately reconstructs fullWord', () => {
    MISSING_LETTER_CURRICULUM.forEach((round) => {
      const reconstructed = round.wordDisplay.replace('_', round.missing).replace(/\s+/g, '')
      expect(reconstructed).toBe(round.fullWord)
    })
  })

  it('13. preserves original starter questions C _ T, D _ G, S _ N and educational prompts', () => {
    const round1 = MISSING_LETTER_CURRICULUM[0]
    const round2 = MISSING_LETTER_CURRICULUM[1]
    const round3 = MISSING_LETTER_CURRICULUM[2]

    // Round 1: C _ T -> CAT
    expect(round1.wordDisplay).toBe('C _ T')
    expect(round1.fullWord).toBe('CAT')
    expect(round1.missing).toBe('A')
    expect(round1.answer).toBe('A')
    expect(round1.image).toBe('🐱')
    expect(round1.options).toEqual(['A', 'O', 'E'])

    // Round 2: D _ G -> DOG
    expect(round2.wordDisplay).toBe('D _ G')
    expect(round2.fullWord).toBe('DOG')
    expect(round2.missing).toBe('O')
    expect(round2.answer).toBe('O')
    expect(round2.image).toBe('🐶')
    expect(round2.options).toEqual(['I', 'O', 'U'])

    // Round 3: S _ N -> SUN
    expect(round3.wordDisplay).toBe('S _ N')
    expect(round3.fullWord).toBe('SUN')
    expect(round3.missing).toBe('U')
    expect(round3.answer).toBe('U')
    expect(round3.image).toBe('☀️')
    expect(round3.options).toEqual(['A', 'E', 'U'])
  })

  it('14. balances answer positions evenly across all 3 positions (33.3% each, zero position bias)', () => {
    const posCounts = [0, 0, 0]
    MISSING_LETTER_CURRICULUM.forEach((round) => {
      const pos = round.options.indexOf(round.answer)
      expect(pos).toBeGreaterThanOrEqual(0)
      expect(pos).toBeLessThanOrEqual(2)
      posCounts[pos]++
    })

    // Exactly 10 occurrences per position (33.3% each out of 30 total levels)
    expect(posCounts[0]).toBe(10)
    expect(posCounts[1]).toBe(10)
    expect(posCounts[2]).toBe(10)
  })

  it('15. helper functions resolve rounds, stages, badges, and milestones accurately', () => {
    expect(getMissingLetterRound(1).id).toBe(1)
    expect(getMissingLetterRound(30).id).toBe(30)
    expect(getMissingLetterRound(999)).toBeNull()
    expect(getMissingLetterRoundByIndex(0).id).toBe(1)
    expect(getMissingLetterRoundByIndex(29).id).toBe(30)
    expect(getMissingLetterRoundByIndex(-1)).toBeNull()
    expect(getMissingLetterRoundByIndex(99)).toBeNull()

    expect(getMissingLetterStageForLevel(5).stage).toBe(1)
    expect(getMissingLetterStageForLevel(15).stage).toBe(2)
    expect(getMissingLetterStageForLevel(25).stage).toBe(3)

    expect(getMissingLetterStageBadge(1)).toBe('🧩 Vowel Builder')
    expect(getMissingLetterStageBadge(2)).toBe('🔍 Sound Detective')
    expect(getMissingLetterStageBadge(3)).toBe('🏆 Master Word Crafter')

    expect(getMissingLetterMilestone(5).name).toBe('Vowel Explorer')
    expect(getMissingLetterMilestone(10).name).toBe('Vowel Builder')
    expect(getMissingLetterMilestone(20).name).toBe('Sound Detective')
    expect(getMissingLetterMilestone(30).name).toBe('Master Word Crafter')
    expect(getMissingLetterMilestone(99)).toBeNull()

    const round = MISSING_LETTER_CURRICULUM[0]
    const optionsCopy = getMissingLetterDisplayedOptions(round)
    expect(optionsCopy).toEqual(round.options)
    expect(optionsCopy).not.toBe(round.options) // Defensive copy
  })

  // ─────────────────────────────────────────────────────────────
  // 9. Checkpoint Persistence & Isolation Suite
  // ─────────────────────────────────────────────────────────────
  it('16. saves and restores checkpoint progress correctly for the same child', () => {
    const childId = 42
    saveMissingLetterCheckpoint(childId, {
      roundIndex: 4,
      score: 4,
      completedLevel: 4,
      highestUnlockedLevel: 5,
      highestUnlockedIndex: 4,
    })

    const data = loadMissingLetterCheckpointData(childId)
    expect(data.roundIndex).toBe(4)
    expect(data.currentLevel).toBe(5)
    expect(data.score).toBe(4)
    expect(data.highestUnlockedLevel).toBe(5)
    expect(data.completedLevels).toContain(4)
    expect(loadMissingLetterCheckpoint(childId)).toBe(4)
  })

  it('17. isolates saved checkpoints strictly across different child profiles and guest', () => {
    saveMissingLetterCheckpoint(101, { roundIndex: 12, completedLevel: 12, score: 12 })
    saveMissingLetterCheckpoint(202, { roundIndex: 2, completedLevel: 2, score: 2 })
    saveMissingLetterCheckpoint(null, { roundIndex: 0, score: 0 }) // Guest

    const child101 = loadMissingLetterCheckpointData(101)
    const child202 = loadMissingLetterCheckpointData(202)
    const guest = loadMissingLetterCheckpointData(null)

    expect(child101.roundIndex).toBe(12)
    expect(child101.score).toBe(12)

    expect(child202.roundIndex).toBe(2)
    expect(child202.score).toBe(2)

    expect(guest.roundIndex).toBe(0)
    expect(guest.score).toBe(0)
  })

  it('18. handles missing, corrupted, or malformed checkpoint data safely without throwing', () => {
    const key = getMissingLetterCheckpointKey('corrupt_child')
    localStorage.setItem(key, 'INVALID_NOT_JSON{{{')

    const data = loadMissingLetterCheckpointData('corrupt_child')
    expect(data.roundIndex).toBe(0)
    expect(data.currentLevel).toBe(1)
    expect(data.score).toBe(0)
    expect(data.isCompleted).toBe(false)
  })

  it('19. prevents replaying completed levels from inflating score or reducing unlocked progress', () => {
    const childId = 88
    saveMissingLetterCheckpoint(childId, {
      roundIndex: 0,
      completedLevels: [1, 2, 3],
      score: 3,
      highestUnlockedLevel: 4,
      highestUnlockedIndex: 3,
    })

    // Replay level 1
    saveMissingLetterCheckpoint(childId, {
      roundIndex: 0,
      completedLevel: 1, // Already completed
      score: 3,
    })

    const data = loadMissingLetterCheckpointData(childId)
    expect(data.score).toBe(3) // Score is not inflated
    expect(data.completedLevels).toEqual([1, 2, 3])
    expect(data.highestUnlockedLevel).toBe(4) // Highest progress preserved
  })

  it('20. unlocks stages progressively as highest unlocked level advances', () => {
    const childId = 77
    // Level 1: Stage 1
    saveMissingLetterCheckpoint(childId, { roundIndex: 0, highestUnlockedLevel: 1 })
    expect(loadMissingLetterCheckpointData(childId).unlockedStages).toEqual([1])

    // Level 11: Stage 2 unlocked
    saveMissingLetterCheckpoint(childId, { roundIndex: 10, highestUnlockedLevel: 11, highestUnlockedIndex: 10 })
    expect(loadMissingLetterCheckpointData(childId).unlockedStages).toEqual([1, 2])

    // Level 21: Stage 3 unlocked
    saveMissingLetterCheckpoint(childId, { roundIndex: 20, highestUnlockedLevel: 21, highestUnlockedIndex: 20 })
    expect(loadMissingLetterCheckpointData(childId).unlockedStages).toEqual([1, 2, 3])
  })

  it('21. resets child checkpoint cleanly via resetMissingLetterCheckpoint', () => {
    const childId = 55
    saveMissingLetterCheckpoint(childId, {
      roundIndex: 15,
      score: 15,
      highestUnlockedLevel: 16,
    })

    expect(loadMissingLetterCheckpointData(childId).roundIndex).toBe(15)

    resetMissingLetterCheckpoint(childId)

    const resetData = loadMissingLetterCheckpointData(childId)
    expect(resetData.roundIndex).toBe(0)
    expect(resetData.currentLevel).toBe(1)
    expect(resetData.score).toBe(0)
  })

  it('22. GameProgressionHub displays stage roadmap and stages correctly', () => {
    renderMissingLetter()

    // Click Choose Stage button in intro
    const chooseStageBtn = screen.getByTestId('choose-stage-button')
    fireEvent.click(chooseStageBtn)

    expect(screen.getByText('Middle Short Vowels')).toBeInTheDocument()
    expect(screen.getByText('Beginning Letters')).toBeInTheDocument()
    expect(screen.getByText('Ending Letters & Blends')).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 10. Step 3: Interactive Round & Phonics Audio Playback Suite
  // ─────────────────────────────────────────────────────────────
  it('23. renders extracted MissingLetterRound with prompt, word display, clue, and stable testids', () => {
    const round1 = getMissingLetterRound(1)
    render(
      <MissingLetterRound
        round={round1}
        roundIdx={0}
        onAnswer={vi.fn()}
      />
    )

    expect(screen.getByTestId('missing-letter-image')).toBeInTheDocument()
    expect(screen.getByTestId('missing-letter-image')).toHaveTextContent('🐱')
    expect(screen.getByTestId('missing-letter-word-display')).toBeInTheDocument()
    expect(screen.getByTestId('missing-letter-word-display')).toHaveTextContent('C _ T')
    expect(screen.getByTestId('missing-letter-prompt')).toBeInTheDocument()
    expect(screen.getByTestId('missing-letter-prompt')).toHaveTextContent(/Which letter is missing\? Tap to complete!/i)
  })

  it('24. renders all three answer buttons and per-letter audio controls with accessible labels', () => {
    const round1 = getMissingLetterRound(1) // options: ['A', 'O', 'E']
    render(
      <MissingLetterRound
        round={round1}
        roundIdx={0}
        onAnswer={vi.fn()}
      />
    )

    // Answer buttons
    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'O' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'E' })).toBeInTheDocument()

    // Stable testids for letter options
    expect(screen.getByTestId('letter-option-A')).toBeInTheDocument()
    expect(screen.getByTestId('letter-option-O')).toBeInTheDocument()
    expect(screen.getByTestId('letter-option-E')).toBeInTheDocument()

    // Per-letter audio controls
    expect(screen.getByTestId('letter-audio-button-A')).toBeInTheDocument()
    expect(screen.getByLabelText('Listen to letter sound A')).toBeInTheDocument()
    expect(screen.getByTestId('letter-audio-button-O')).toBeInTheDocument()
    expect(screen.getByLabelText('Listen to letter sound O')).toBeInTheDocument()
    expect(screen.getByTestId('letter-audio-button-E')).toBeInTheDocument()
    expect(screen.getByLabelText('Listen to letter sound E')).toBeInTheDocument()
  })

  it('25. renders user-controlled Hear Word and Hear Phonics Hint controls with accessible names', () => {
    const round1 = getMissingLetterRound(1)
    render(
      <MissingLetterRound
        round={round1}
        roundIdx={0}
        onAnswer={vi.fn()}
      />
    )

    expect(screen.getByTestId('listen-word-button')).toBeInTheDocument()
    expect(screen.getByLabelText('Hear the word')).toBeInTheDocument()
    expect(screen.getByTestId('listen-hint-button')).toBeInTheDocument()
    expect(screen.getByLabelText('Hear the phonics hint')).toBeInTheDocument()
  })

  it('26. does NOT autoplay audio on mount and speaks on explicit user trigger', () => {
    const round1 = getMissingLetterRound(1)
    render(
      <MissingLetterRound
        round={round1}
        roundIdx={0}
        onAnswer={vi.fn()}
      />
    )

    // Verification: zero speech on mount!
    expect(mockSpeak).not.toHaveBeenCalled()

    // Click Hear Word
    fireEvent.click(screen.getByTestId('listen-word-button'))
    expect(mockSpeak).toHaveBeenCalledTimes(1)
    expect(mockSpeak.mock.calls[0][0].text).toBe('CAT')
    expect(mockSpeak.mock.calls[0][0].rate).toBeCloseTo(0.85, 2)

    // Click Hear Phonics Hint
    fireEvent.click(screen.getByTestId('listen-hint-button'))
    expect(mockSpeak).toHaveBeenCalledTimes(2)
    expect(mockSpeak.mock.calls[1][0].text).toContain('short /a/ vowel in cat')

    // Click Letter Sound
    fireEvent.click(screen.getByTestId('letter-audio-button-A'))
    expect(mockSpeak).toHaveBeenCalledTimes(3)
    expect(mockSpeak.mock.calls[2][0].text).toContain('The letter is A')
  })

  it('27. handles SpeechSynthesis absence or speech errors without throwing or crashing gameplay', () => {
    delete window.speechSynthesis
    const round1 = getMissingLetterRound(1)
    const onAnswer = vi.fn()

    render(
      <MissingLetterRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    )

    // Audio clicks do not throw
    expect(() => fireEvent.click(screen.getByTestId('listen-word-button'))).not.toThrow()
    expect(screen.getByText(/Word audio unavailable. You can still play!/i)).toBeInTheDocument()

    // Letter selection still works completely
    fireEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('28. blocks rapid duplicate submissions via synchronous isSubmittedRef guard', () => {
    const round1 = getMissingLetterRound(1)
    const onAnswer = vi.fn()

    render(
      <MissingLetterRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    )

    const btnA = screen.getByRole('button', { name: 'A' })

    // Simulate 3 rapid clicks
    fireEvent.click(btnA)
    fireEvent.click(btnA)
    fireEvent.click(btnA)

    expect(onAnswer).toHaveBeenCalledTimes(1)
  })

  it('29. disables answer buttons immediately upon selection and during transitions', () => {
    const round1 = getMissingLetterRound(1)
    const onAnswer = vi.fn()

    const { rerender } = render(
      <MissingLetterRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
        isTransitioning={false}
      />
    )

    const btnA = screen.getByRole('button', { name: 'A' })
    const btnO = screen.getByRole('button', { name: 'O' })
    const btnE = screen.getByRole('button', { name: 'E' })

    // Initially not disabled
    expect(btnA).not.toBeDisabled()
    expect(btnO).not.toBeDisabled()
    expect(btnE).not.toBeDisabled()

    // Click answer
    fireEvent.click(btnA)

    // Immediately disabled
    expect(btnA).toBeDisabled()
    expect(btnO).toBeDisabled()
    expect(btnE).toBeDisabled()

    // Now test with isTransitioning=true
    rerender(
      <MissingLetterRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
        isTransitioning={true}
      />
    )

    expect(btnA).toBeDisabled()
    expect(btnA).toHaveAttribute('aria-disabled', 'true')
  })

  it('30. cancels active speech synthesis cleanly on unmount', () => {
    const round1 = getMissingLetterRound(1)
    const { unmount } = render(
      <MissingLetterRound
        round={round1}
        roundIdx={0}
        onAnswer={vi.fn()}
      />
    )

    fireEvent.click(screen.getByTestId('listen-word-button'))
    unmount()

    expect(mockCancel).toHaveBeenCalled()
  })

  it('31. announces answer selection accessibly through live region', () => {
    const round1 = getMissingLetterRound(1)
    const onAnswer = vi.fn()

    render(
      <MissingLetterRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    )

    const liveRegion = screen.getByTestId('live-announcement')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    expect(liveRegion).toHaveTextContent('')

    // Pick correct answer 'A'
    fireEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(liveRegion).toHaveTextContent(/Great job! A completes CAT\./i)
  })

  it('32. missingLetterAudio service functions correctly and safely', () => {
    expect(missingLetterAudio.isSupported()).toBe(true)

    // Phonics sound info lookup
    const infoA = getMissingLetterSoundInfo('A')
    expect(infoA.soundLabel).toBe('/a/')
    expect(infoA.anchorWord).toBe('cat')

    const infoZ = getMissingLetterSoundInfo('Z', 'zebra')
    expect(infoZ.anchorWord).toBe('zebra')

    // speakWord
    const wordSpoken = missingLetterAudio.speakWord('CAT')
    expect(wordSpoken).toBe(true)
    expect(mockSpeak).toHaveBeenCalled()

    // speakPhonicsHint
    const hintSpoken = missingLetterAudio.speakPhonicsHint({ hint: 'Listen for short a.' })
    expect(hintSpoken).toBe(true)

    // speakLetterSound
    const letterSpoken = missingLetterAudio.speakLetterSound('B')
    expect(letterSpoken).toBe(true)

    // stopSpeech
    missingLetterAudio.stopSpeech()
    expect(mockCancel).toHaveBeenCalled()
  })

  // ─────────────────────────────────────────────────────────────
  // 11. Step 4: Metadata Correction & Level 30 Finale Celebration
  // ─────────────────────────────────────────────────────────────
  it('33. verifies Missing Letter registry entry has correct 2D dimension and category metadata', () => {
    const game = getGameById('missing-letter')
    expect(game).toBeDefined()
    expect(game.id).toBe('missing-letter')
    expect(game.title).toBe('Missing Letter')
    expect(game.category).toBe('letters')
    expect(game.route).toBe('/child/games/missing-letter')
    expect(game.skill).toBe('wordRecognition')
    expect(game.dimension).toBe('2D Letter Learning')
    expect(game.dimension).toMatch(/2D/i)
    expect(game.dimension).not.toBe('3D Adventure')
  })

  it('34. verifies Gaming Zone category filtering includes Missing Letter under letters category', () => {
    const letterGames = getGamesByCategory('letters')
    const found = letterGames.find((g) => g.id === 'missing-letter')
    expect(found).toBeDefined()
    expect(found.title).toBe('Missing Letter')
    expect(found.category).toBe('letters')
    expect(found.icon).toBe('🧩')
    expect(found.desc).toBeTruthy()
  })

  it('35. displays Level 30 finale celebration banner and completion message upon full curriculum completion', async () => {
    vi.useFakeTimers()
    // Pre-seed checkpoint at Level 30 (roundIndex 29)
    saveMissingLetterCheckpoint(1, {
      roundIndex: 29,
      score: 29,
      completedLevels: Array.from({ length: 29 }, (_, i) => i + 1),
      highestUnlockedLevel: 30,
      highestUnlockedIndex: 29,
    })

    renderMissingLetter()
    fireEvent.click(screen.getByTestId('start-game-button'))

    // Level 30 (BLUE, missing E, options: A, O, E)
    expect(screen.getByText('Level 30 of 30')).toBeInTheDocument()
    expect(screen.getByText('B L U _')).toBeInTheDocument()

    // Answer correctly: E
    fireEvent.click(screen.getByRole('button', { name: 'E' }))
    await act(async () => {
      vi.advanceTimersByTime(950)
    })
    await act(async () => {
      await Promise.resolve()
    })

    // Finished screen celebration
    expect(screen.getByTestId('missing-letter-finale-banner')).toBeInTheDocument()
    expect(screen.getByText(/Grand 30-Level Missing Letter Champion!/i)).toBeInTheDocument()
    expect(screen.getByTestId('missing-letter-completion-message')).toBeInTheDocument()
    expect(screen.getByText(/You have completed all 30 levels of Missing Letter across all 3 stages!/i)).toBeInTheDocument()

    // Stage mastery badges gallery
    expect(screen.getByTestId('missing-letter-stage-badges-gallery')).toBeInTheDocument()
    expect(screen.getByTestId('missing-letter-mastery-badge-stage-1')).toBeInTheDocument()
    expect(screen.getByTestId('missing-letter-mastery-badge-stage-2')).toBeInTheDocument()
    expect(screen.getByTestId('missing-letter-mastery-badge-stage-3')).toBeInTheDocument()

    // Final score summary
    expect(screen.getByText(/You got 30 out of 30 correct\./i)).toBeInTheDocument()
    expect(screen.getByText(/⭐ \+30 Stars earned/i)).toBeInTheDocument()
  })

  it('36. does NOT display completion celebration on early exit or incomplete playthrough', () => {
    renderMissingLetter()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Active gameplay at Level 1
    expect(screen.getByText('Level 1 of 30')).toBeInTheDocument()
    expect(screen.queryByTestId('missing-letter-finale-banner')).not.toBeInTheDocument()
    expect(screen.queryByTestId('missing-letter-completion-message')).not.toBeInTheDocument()
    expect(screen.queryByTestId('missing-letter-stage-badges-gallery')).not.toBeInTheDocument()

    // Early exit
    fireEvent.click(screen.getByRole('button', { name: /Back to games/i }))
    expect(screen.queryByTestId('missing-letter-finale-banner')).not.toBeInTheDocument()
  })

  it('37. displays stage cleared badge reward when crossing stage boundaries (e.g. Level 10)', async () => {
    vi.useFakeTimers()
    // Pre-seed checkpoint at Level 10 (roundIndex 9)
    saveMissingLetterCheckpoint(1, {
      roundIndex: 9,
      score: 9,
      completedLevels: Array.from({ length: 9 }, (_, i) => i + 1),
      highestUnlockedLevel: 10,
      highestUnlockedIndex: 9,
    })

    renderMissingLetter()
    fireEvent.click(screen.getByTestId('start-game-button'))

    // Level 10 is RED (R _ D, answer E)
    expect(screen.getByText('Level 10 of 30')).toBeInTheDocument()
    const round10 = getMissingLetterRound(10)
    fireEvent.click(screen.getByRole('button', { name: round10.answer }))

    // Feedback overlay displays stage clear celebration
    const feedback = screen.getByTestId('feedback-overlay')
    expect(feedback).toBeInTheDocument()
    expect(screen.getByText(/Stage 1 Cleared!/i)).toBeInTheDocument()
    expect(screen.getByTestId('stage-badge-earned')).toBeInTheDocument()
    expect(screen.getByTestId('stage-badge-earned')).toHaveTextContent(/Vowel Builder/i)
  })

  it('38. prevents duplicate celebrations and score inflation when replaying after completion', () => {
    const childId = 1
    // Child has completed all 30 levels
    saveMissingLetterCheckpoint(childId, {
      roundIndex: 0,
      isCompleted: true,
      score: 30,
      completedLevels: Array.from({ length: 30 }, (_, i) => i + 1),
      highestUnlockedLevel: 30,
      highestUnlockedIndex: 29,
    })

    // Replay Level 1
    saveMissingLetterCheckpoint(childId, {
      roundIndex: 0,
      completedLevel: 1, // already in completedLevels
      score: 30,
    })

    const cp = loadMissingLetterCheckpointData(childId)
    expect(cp.score).toBe(30) // Score not inflated to 31
    expect(cp.highestUnlockedLevel).toBe(30) // Highest level preserved
    expect(cp.completedLevels).toHaveLength(30)
    expect(cp.isCompleted).toBe(true)
  })
})

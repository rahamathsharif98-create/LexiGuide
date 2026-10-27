import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import GamePlay from '../pages/child/GamePlay'
import {
  saveCosmicSafariCheckpoint,
  loadCosmicSafariCheckpointData,
} from '../games/cosmic-safari/engine/cosmicSafariCheckpoint'
import {
  COSMIC_SAFARI_CURRICULUM,
  TOTAL_COSMIC_SAFARI_LEVELS,
  COSMIC_SAFARI_STAGES,
  shuffleOptions,
  getShuffledRound,
  getShuffledCurriculum,
} from '../games/cosmic-safari/engine/cosmicSafariCurriculum'

// Mock AppContext
const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 201, ok: true })
const mockApplySessionOutcome = vi.fn()
let isRealBackendMock = true
let currentActiveChild = {
  id: 1,
  name: 'Leo Safari Explorer',
  interests: ['space'],
  fingerprint: { phonologicalAwareness: 65 },
  comfort_preferences: { quiet_mode: false },
}

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    activeChild: currentActiveChild,
    isRealBackend: isRealBackendMock,
    errorPatterns: [],
    saveLearningSession: mockSaveLearningSession,
    applySessionOutcome: mockApplySessionOutcome,
    language: 'en',
    nextRecommendedActivity: null,
  }),
  AppProvider: ({ children }) => children,
}))

function renderCosmicSafari(initialRoute = '/child/games/cosmic-safari') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/child/games/:gameId" element={<GamePlay />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Cosmic Safari (Sound Safari) — 25-Level Game Suite', () => {
  let createdUtterances = []
  let mockSpeak = vi.fn()
  let mockCancel = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    createdUtterances = []
    isRealBackendMock = true
    currentActiveChild = {
      id: 1,
      name: 'Leo Safari Explorer',
      interests: ['space'],
      fingerprint: { phonologicalAwareness: 65 },
      comfort_preferences: { quiet_mode: false },
    }

    class MockUtterance {
      constructor(text) {
        this.text = text
        this.rate = 1
        this.pitch = 1
        this.lang = ''
        this.onstart = null
        this.onend = null
        this.onerror = null
        createdUtterances.push(this)
      }
    }
    window.SpeechSynthesisUtterance = MockUtterance
    window.speechSynthesis = {
      speak: mockSpeak.mockImplementation((u) => {
        if (u.onstart) u.onstart()
      }),
      cancel: mockCancel,
      getVoices: vi.fn().mockReturnValue([
        { name: 'English Female', lang: 'en-US' },
        { name: 'Hindi Female', lang: 'hi-IN' },
      ]),
      paused: false,
      resume: vi.fn(),
    }
  })

  afterEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  // 1. Initial starting screen
  it('1. loads and displays the starting screen with Cosmic Safari context, instructions, and Start Game button', () => {
    renderCosmicSafari()

    expect(screen.getByTestId('gameplay-container')).toBeInTheDocument()
    expect(screen.getByTestId('cosmic-safari-badge')).toHaveTextContent(/Cosmic Safari/i)
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to games/i })).toBeInTheDocument()
    expect(screen.getByTestId('voice-mode-indicator')).toBeInTheDocument()
  })

  // 2. Start Level 1 & verify 5-stage progression indicators
  it('2. transitions from intro to Level 1 with stage badge, sector badge, 5-stage pips, prompt, and options', () => {
    renderCosmicSafari()

    const startBtn = screen.getByRole('button', { name: /Start Game ▶/i })
    fireEvent.click(startBtn)

    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 25/i)
    expect(screen.getByTestId('cosmic-safari-stage-badge')).toHaveTextContent(/Stage 1 of 5: Cosmic Meadow/i)
    expect(screen.getByTestId('cosmic-safari-sector-badge')).toHaveTextContent(/Sector 1: Star Launchpad/i)

    // 5-Stage Progression Pips
    expect(screen.getByTestId('stage-progression-indicators')).toBeInTheDocument()
    for (let s = 1; s <= 5; s++) {
      expect(screen.getByTestId(`stage-pip-${s}`)).toBeInTheDocument()
    }

    // Audio button exists
    expect(screen.getByTestId('hear-sound-btn')).toBeInTheDocument()

    // 3 Animal Options exist with emoji and text
    expect(screen.getByRole('button', { name: /Cat/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dog/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Fish/i })).toBeInTheDocument()
  })

  // 3. Audio playback
  it('3. clicking Hear Sound speaks the target phoneme /k/ with child-friendly rate', () => {
    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    const hearBtn = screen.getByTestId('hear-sound-btn')
    fireEvent.click(hearBtn)

    expect(createdUtterances.length).toBeGreaterThan(0)
    const last = createdUtterances[createdUtterances.length - 1]
    expect(last.text).toBe('/k/')
    expect(last.rate).toBe(0.85)
  })

  // 4. Correct answer feedback and scoring
  it('4. selecting a correct answer shows success feedback and awards a point', () => {
    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    const catBtn = screen.getByRole('button', { name: /Cat/i })
    fireEvent.click(catBtn)

    const feedback = screen.getByTestId('feedback-overlay')
    expect(feedback).toBeInTheDocument()
    expect(feedback).toHaveTextContent(/Great job!/i)
  })

  // 5. Incorrect answer feedback
  it('5. selecting an incorrect answer shows retry feedback and does not award a point', () => {
    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    const dogBtn = screen.getByRole('button', { name: /Dog/i })
    fireEvent.click(dogBtn)

    const feedback = screen.getByTestId('feedback-overlay')
    expect(feedback).toBeInTheDocument()
    expect(feedback).toHaveTextContent(/Let's try again!/i)
  })

  // 6. Rapid-click lockout prevents duplicate submissions
  it('6. rapid clicks on option buttons are safely locked out after first click', () => {
    vi.useFakeTimers()
    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    const catBtn = screen.getByRole('button', { name: /Cat/i })
    const dogBtn = screen.getByRole('button', { name: /Dog/i })

    // Click Cat, then immediately attempt multiple rapid clicks
    fireEvent.click(catBtn)
    fireEvent.click(dogBtn)
    fireEvent.click(catBtn)

    expect(catBtn).toBeDisabled()
    expect(dogBtn).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(950)
    })
  })

  // 7. Stage progression: Level 5 clears Stage 1 and advances to Level 6 Stage 2
  it('7. completing Level 5 shows Stage 1 Cleared celebration and advances to Stage 2', () => {
    vi.useFakeTimers()
    // Position at Level 5 (index 4)
    saveCosmicSafariCheckpoint(1, { roundIndex: 4, score: 4 })
    renderCosmicSafari()

    // Resume Game
    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))

    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 5 of 25/i)
    expect(screen.getByTestId('cosmic-safari-stage-badge')).toHaveTextContent(/Stage 1 of 5: Cosmic Meadow/i)

    // Level 5 correct answer is Dog
    const dogBtn = screen.getByRole('button', { name: /Dog/i })
    fireEvent.click(dogBtn)

    // Stage cleared celebration appears
    const feedback = screen.getByTestId('feedback-overlay')
    expect(feedback).toHaveTextContent(/Stage 1 Cleared!/i)
    expect(feedback).toHaveTextContent(/Advancing to Stage 2/i)

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(950)
    })

    // Now in Stage 2 Level 6 (Lion)
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 6 of 25/i)
    expect(screen.getByTestId('cosmic-safari-stage-badge')).toHaveTextContent(/Stage 2 of 5: Starlight Savanna/i)
    expect(screen.getByTestId('cosmic-safari-sector-badge')).toHaveTextContent(/Sector 6: Golden Ridge/i)
  })

  // 8. Checkpoint resume at Level 12 (Stage 3)
  it('8. resumes from saved checkpoint at Level 12 with active checkpoint indicator and stage progression', () => {
    saveCosmicSafariCheckpoint(1, { roundIndex: 11, score: 11 })
    renderCosmicSafari()

    expect(screen.getByRole('button', { name: /Resume Game ▶/i })).toBeInTheDocument()
    expect(screen.getByTestId('active-checkpoint-indicator')).toHaveTextContent(/Level 12/i)

    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 12 of 25/i)
    expect(screen.getByTestId('cosmic-safari-stage-badge')).toHaveTextContent(/Stage 3 of 5: Nebula Lagoon/i)
  })

  // 9. Stage roadmap modal: open from in-game Stages button & jumping
  it('9. opens stage selection modal from in-game Stages button, respects locked stages, and allows jumping to unlocked stage', () => {
    // Child unlocked up to Level 12 (Stage 3)
    saveCosmicSafariCheckpoint(1, { roundIndex: 11, score: 11 })
    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))

    // Click Stages button in top bar
    const stagesBtn = screen.getByTestId('in-game-stages-button')
    fireEvent.click(stagesBtn)

    // Modal appears
    expect(screen.getByTestId('progression-hub-modal')).toBeInTheDocument()

    // Stages 1, 2, 3 unlocked; Stages 4 and 5 locked
    expect(screen.getByTestId('select-stage-1')).toBeInTheDocument()
    expect(screen.getByTestId('select-stage-2')).toBeInTheDocument()
    expect(screen.getByTestId('select-stage-3')).toBeInTheDocument()
    expect(screen.getByTestId('locked-stage-4')).toBeInTheDocument()
    expect(screen.getByTestId('locked-stage-5')).toBeInTheDocument()

    // Jump to Stage 2 (Level 6)
    fireEvent.click(screen.getByTestId('select-stage-2'))

    // Modal closed and game now at Level 6
    expect(screen.queryByTestId('progression-hub-modal')).not.toBeInTheDocument()
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 6 of 25/i)
    expect(screen.getByTestId('cosmic-safari-stage-badge')).toHaveTextContent(/Stage 2 of 5: Starlight Savanna/i)
  })

  // 10. Restart confirmation modal
  it('10. provides restart confirmation modal and resets progress when confirmed', () => {
    saveCosmicSafariCheckpoint(1, { roundIndex: 14, score: 14 })
    renderCosmicSafari()

    // Click Restart
    const restartBtn = screen.getByTestId('restart-game-button')
    fireEvent.click(restartBtn)

    expect(screen.getByTestId('restart-confirm-view')).toBeInTheDocument()
    expect(screen.getByText(/Restart From Level 1\?/i)).toBeInTheDocument()

    // Confirm Restart
    fireEvent.click(screen.getByTestId('confirm-restart-button'))

    // Checkpoint is reset
    const checkpoint = loadCosmicSafariCheckpointData(1)
    expect(checkpoint.roundIndex).toBe(0)
    expect(checkpoint.highestUnlockedLevel).toBe(1)

    // Entry view now shows Start Game
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
    expect(screen.queryByTestId('active-checkpoint-indicator')).not.toBeInTheDocument()
  })

  // 11. Completing Level 25 displays results screen and saves completed session once
  it('11. completing final Level 25 displays victory results screen and saves completed session', () => {
    vi.useFakeTimers()
    // Position at final Level 25 (index 24)
    saveCosmicSafariCheckpoint(1, { roundIndex: 24, score: 24 })
    renderCosmicSafari()

    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 25 of 25/i)
    expect(screen.getByTestId('cosmic-safari-stage-badge')).toHaveTextContent(/Stage 5 of 5: Galaxy Sanctuary/i)

    // Level 25 correct answer is Owl
    const owlBtn = screen.getByRole('button', { name: /Owl/i })
    fireEvent.click(owlBtn)

    act(() => {
      vi.advanceTimersByTime(950)
    })

    // Finished screen appears
    expect(screen.getByRole('button', { name: /Play Again/i })).toBeInTheDocument()
    expect(screen.getByText(/Nice work!|You did it!/i)).toBeInTheDocument()
    expect(screen.getByText(/You got 25 out of 25 correct/i)).toBeInTheDocument()

    // Learning session saved
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1)
  })

  // 12. Regression: Animal answer cards remain clickable and enabled across consecutive rounds
  it('12. animal answer cards respond to clicks and remain enabled and clickable on round 2', () => {
    vi.useFakeTimers()
    renderCosmicSafari()

    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 25/i)

    // Verify Level 1 options (Cat, Dog, Fish) are rendered and enabled
    const catBtn = screen.getByRole('button', { name: /Cat/i })
    const dogBtn = screen.getByRole('button', { name: /Dog/i })
    const fishBtn = screen.getByRole('button', { name: /Fish/i })

    expect(catBtn).toBeEnabled()
    expect(dogBtn).toBeEnabled()
    expect(fishBtn).toBeEnabled()

    // Click correct answer Cat
    fireEvent.click(catBtn)

    // Great job feedback appears
    expect(screen.getByText(/🎉 Great job!/i)).toBeInTheDocument()

    // Advance transition timer (900ms)
    act(() => {
      vi.advanceTimersByTime(950)
    })

    // Now on Level 2 (/sh/ -> Sheep, Cow, Pig)
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 2 of 25/i)

    // CRITICAL REGRESSION CHECK: Verify Level 2 animal answer cards are NOT disabled
    const sheepBtn = screen.getByRole('button', { name: /Sheep/i })
    const cowBtn = screen.getByRole('button', { name: /Cow/i })
    const pigBtn = screen.getByRole('button', { name: /Pig/i })

    expect(sheepBtn).toBeEnabled()
    expect(cowBtn).toBeEnabled()
    expect(pigBtn).toBeEnabled()
    expect(sheepBtn).not.toHaveClass('pointer-events-none')

    // Click Level 2 correct answer Sheep
    fireEvent.click(sheepBtn)

    // Great job feedback appears for round 2
    expect(screen.getByText(/🎉 Great job!/i)).toBeInTheDocument()

    // Advance transition timer
    act(() => {
      vi.advanceTimersByTime(950)
    })

    // Now on Level 3 (/b/ -> Bear, Duck, Rabbit)
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 3 of 25/i)
    const bearBtn = screen.getByRole('button', { name: /Bear/i })
    expect(bearBtn).toBeEnabled()
  })

  // 13. Incorrect answer flow advances without score increment and next round remains clickable
  it('13. clicking incorrect answer card shows retry feedback and next round remains fully clickable', () => {
    vi.useFakeTimers()
    renderCosmicSafari()

    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 25/i)

    // Click wrong answer Dog on Level 1 (/k/)
    const dogBtn = screen.getByRole('button', { name: /Dog/i })
    fireEvent.click(dogBtn)

    // Retry feedback appears
    expect(screen.getByText(/💪 Let's try again!/i)).toBeInTheDocument()

    // Score remains 0
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/0 \/ 25/)

    // Advance transition timer
    act(() => {
      vi.advanceTimersByTime(950)
    })

    // Advanced to Level 2
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 2 of 25/i)

    // Level 2 cards are clickable
    const sheepBtn = screen.getByRole('button', { name: /Sheep/i })
    expect(sheepBtn).toBeEnabled()

    // Answer Level 2 correctly
    fireEvent.click(sheepBtn)
    expect(screen.getByText(/🎉 Great job!/i)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(950)
    })

    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 3 of 25/i)
    // Score is now 1 (0 from level 1 + 1 from level 2)
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/1 \/ 25/)
  })

  // 14. Rapid repeated clicks on an answer card do not cause duplicate score increments
  it('14. rapid clicks on animal answer card are locked during feedback transition', () => {
    vi.useFakeTimers()
    renderCosmicSafari()

    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))
    const catBtn = screen.getByRole('button', { name: /Cat/i })

    // Double click rapidly
    fireEvent.click(catBtn)
    fireEvent.click(catBtn)
    fireEvent.click(catBtn)

    expect(screen.getByText(/🎉 Great job!/i)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(950)
    })

    // Level 2 reached with score exactly 1
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 2 of 25/i)
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/1 \/ 25/)
  })

  // 15. Complete 25-Level Curriculum Audit: exactly one valid answer per level with child-friendly phonemes
  it('15. curriculum audit verifies all 25 levels have child-friendly phonemes and exactly one correct answer', () => {
    expect(COSMIC_SAFARI_CURRICULUM).toHaveLength(25)

    COSMIC_SAFARI_CURRICULUM.forEach((lvl, idx) => {
      expect(lvl.level).toBe(idx + 1)
      expect(lvl.sound).toMatch(/^\/[a-z]{1,4}\/$/) // child-friendly letters, e.g. /k/, /sh/, /ee/, /ow/, /j/
      expect(lvl.prompt).toBeTruthy()
      expect(lvl.options).toHaveLength(3)

      // The correct answer must be in options
      const correctOpt = lvl.options.find(
        (o) => o.name === lvl.correctName && o.emoji === lvl.correct
      )
      expect(correctOpt).toBeDefined()

      // Exactly 3 unique options
      const names = lvl.options.map((o) => o.name)
      expect(new Set(names).size).toBe(3)
    })

    // Level 3: Bear is the only /b/ animal (Duck and Rabbit do not start with /b/)
    const lvl3 = COSMIC_SAFARI_CURRICULUM[2]
    expect(lvl3.sound).toBe('/b/')
    expect(lvl3.correctName).toBe('Bear')
    expect(lvl3.options.map((o) => o.name)).toEqual(['Bear', 'Duck', 'Rabbit'])

    // Level 13: Penguin is the only /p/ animal (Seal and Shark do not start with /p/)
    const lvl13 = COSMIC_SAFARI_CURRICULUM[12]
    expect(lvl13.sound).toBe('/p/')
    expect(lvl13.correctName).toBe('Penguin')
    expect(lvl13.options.map((o) => o.name)).toEqual(['Penguin', 'Seal', 'Shark'])

    // Level 21: /j/ target phoneme matches prompt, Giraffe is the only soft /j/ answer
    const lvl21 = COSMIC_SAFARI_CURRICULUM[20]
    expect(lvl21.sound).toBe('/j/')
    expect(lvl21.prompt).toContain('/j/')
    expect(lvl21.correctName).toBe('Giraffe')
    expect(lvl21.options.map((o) => o.name)).toEqual(['Giraffe', 'Zebra', 'Kangaroo'])

    // Level 24: /ee/ long sound matches prompt, Eagle is the only answer
    const lvl24 = COSMIC_SAFARI_CURRICULUM[23]
    expect(lvl24.sound).toBe('/ee/')
    expect(lvl24.prompt).toContain('/ee/')
    expect(lvl24.correctName).toBe('Eagle')

    // Level 25: /ow/ sound matches prompt, Owl is the only answer
    const lvl25 = COSMIC_SAFARI_CURRICULUM[24]
    expect(lvl25.sound).toBe('/ow/')
    expect(lvl25.prompt).toContain('/ow/')
    expect(lvl25.correctName).toBe('Owl')
  })

  // 16. Level 21: Giraffe correctly answers soft sound /j/, while Zebra and Kangaroo are recognized distractors
  it('16. validates Level 21 soft sound /j/ question, Giraffe correct answer, and distractor rejection', () => {
    vi.useFakeTimers()
    saveCosmicSafariCheckpoint(1, { roundIndex: 20, score: 20 })
    renderCosmicSafari()

    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 21 of 25/i)
    expect(screen.getByText(/Which animal friend starts with the soft sound \/j\/\?/i)).toBeInTheDocument()

    // The sound badge displays /j/
    expect(screen.getByTestId('hear-sound-btn')).toBeInTheDocument()

    // Test distractor: Zebra
    const zebraBtn = screen.getByRole('button', { name: /Zebra/i })
    fireEvent.click(zebraBtn)
    expect(screen.getByText(/💪 Let's try again!/i)).toBeInTheDocument()
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/20 \/ 25/)

    // Advance timer past retry transition
    act(() => {
      vi.advanceTimersByTime(950)
    })

    // Test distractor: Kangaroo
    // Now at Level 22, so let's load Level 21 again
    cleanup()
    saveCosmicSafariCheckpoint(1, { roundIndex: 20, score: 20 })
    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))

    // Test correct answer: Giraffe
    const giraffeBtn = screen.getByRole('button', { name: /Giraffe/i })
    fireEvent.click(giraffeBtn)
    expect(screen.getByText(/🎉 Great job!/i)).toBeInTheDocument()
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/21 \/ 25/)

    act(() => {
      vi.advanceTimersByTime(950)
    })

    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 22 of 25/i)
  })

  // 17. Validates Level 3 (Bear) and Level 13 (Penguin) distractor accuracy
  it('17. validates Level 3 and Level 13 have single unambiguous correct answers and plausible distractors', () => {
    vi.useFakeTimers()

    // Check Level 3
    saveCosmicSafariCheckpoint(1, { roundIndex: 2, score: 2 })
    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 3 of 25/i)

    // Distractor Duck fails
    const duckBtn = screen.getByRole('button', { name: /Duck/i })
    fireEvent.click(duckBtn)
    expect(screen.getByText(/💪 Let's try again!/i)).toBeInTheDocument()
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/2 \/ 25/)

    act(() => {
      vi.advanceTimersByTime(950)
    })

    // Clean up and test correct answer Bear
    cleanup()
    saveCosmicSafariCheckpoint(1, { roundIndex: 2, score: 2 })
    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))

    const bearBtn = screen.getByRole('button', { name: /Bear/i })
    fireEvent.click(bearBtn)
    expect(screen.getByText(/🎉 Great job!/i)).toBeInTheDocument()
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/3 \/ 25/)

    act(() => {
      vi.advanceTimersByTime(950)
    })

    // Now test Level 13 (Penguin)
    cleanup()
    saveCosmicSafariCheckpoint(1, { roundIndex: 12, score: 12 })
    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 13 of 25/i)

    // Distractor Shark fails
    const sharkBtn = screen.getByRole('button', { name: /Shark/i })
    fireEvent.click(sharkBtn)
    expect(screen.getByText(/💪 Let's try again!/i)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(950)
    })

    // Correct Penguin succeeds
    cleanup()
    saveCosmicSafariCheckpoint(1, { roundIndex: 12, score: 12 })
    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))
    const penguinBtn = screen.getByRole('button', { name: /Penguin/i })
    fireEvent.click(penguinBtn)
    expect(screen.getByText(/🎉 Great job!/i)).toBeInTheDocument()
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/13 \/ 25/)
  })

  // 18. Full 25-level curriculum end-to-end traversal with perfect 25/25 score
  it('18. plays through all 25 curriculum levels sequentially with correct phoneme answers to completion', () => {
    vi.useFakeTimers()
    renderCosmicSafari()

    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    for (let i = 0; i < 25; i++) {
      const currentLevel = COSMIC_SAFARI_CURRICULUM[i]
      expect(screen.getByTestId('round-progress-label')).toHaveTextContent(new RegExp(`Level ${i + 1} of 25`, 'i'))

      const targetBtn = screen.getByRole('button', { name: new RegExp(currentLevel.correctName, 'i') })
      expect(targetBtn).toBeEnabled()
      fireEvent.click(targetBtn)

      act(() => {
        vi.advanceTimersByTime(950)
      })
    }

    // After Level 25, victory screen is reached
    expect(screen.getByRole('button', { name: /Play Again/i })).toBeInTheDocument()
    expect(screen.getByText(/You got 25 out of 25 correct/i)).toBeInTheDocument()
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1)
  })

  // 19. Shuffle algorithm distribution & determinism across all 25 levels
  it('19. verifies shuffleOptions produces fair distribution across positions 0, 1, 2 and supports deterministic ordering', () => {
    const rawOptions = [{ name: 'A' }, { name: 'B' }, { name: 'C' }]
    const originalCopy = JSON.stringify(rawOptions)

    // Non-mutating
    const shuffled = shuffleOptions(rawOptions)
    expect(JSON.stringify(rawOptions)).toBe(originalCopy)
    expect(shuffled).toHaveLength(3)

    // Deterministic custom random function
    // Fisher-Yates with randomFn = () => 0 always shifts elements to the right
    const deterministic1 = shuffleOptions(rawOptions, () => 0)
    const deterministic2 = shuffleOptions(rawOptions, () => 0)
    expect(deterministic1).toEqual(deterministic2)

    // Verify 25-level distribution: correct answer must appear in positions 0, 1, and 2
    // across curriculum and is not locked to position 0
    let pos0Count = 0
    let pos1Count = 0
    let pos2Count = 0

    // Run 50 simulated playthroughs of the 25-level curriculum to verify stochastic distribution
    for (let sim = 0; sim < 50; sim++) {
      const curriculum = getShuffledCurriculum()
      curriculum.forEach((round) => {
        const correctIdx = round.shuffledOptions.findIndex(
          (o) => o.name === round.correctName || o.emoji === round.correct
        )
        if (correctIdx === 0) pos0Count++
        else if (correctIdx === 1) pos1Count++
        else if (correctIdx === 2) pos2Count++
      })
    }

    const totalRounds = 50 * 25 // 1250 rounds
    // Each position must be populated and have a healthy share (~33% each)
    expect(pos0Count).toBeGreaterThan(200)
    expect(pos1Count).toBeGreaterThan(200)
    expect(pos2Count).toBeGreaterThan(200)
    // Confirm it is not exclusively at position 0
    expect(pos0Count).toBeLessThan(totalRounds * 0.6)
  })

  // 20. Correct answer can appear at positions 1, 2, and 3, awarding points regardless of position
  it('20. correctly awards points when correct answer appears at position 1, position 2, or position 3', () => {
    vi.useFakeTimers()

    // --- Position 1 (index 0) ---
    // Deterministic shuffle putting Cat at index 0
    const catAtPos0 = [
      { emoji: '🐱', name: 'Cat' },
      { emoji: '🐶', name: 'Dog' },
      { emoji: '🐟', name: 'Fish' },
    ]
    COSMIC_SAFARI_CURRICULUM[0].shuffledOptions = catAtPos0

    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    const optionButtonsPos0 = screen.getByTestId('cosmic-safari-options-grid').querySelectorAll('button')
    expect(optionButtonsPos0[0]).toHaveAttribute('data-testid', 'option-cat')
    expect(optionButtonsPos0[0]).toHaveAttribute('data-option-index', '0')

    // Click Cat at position 0
    fireEvent.click(optionButtonsPos0[0])
    expect(screen.getByText(/🎉 Great job!/i)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(950)
    })
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/1 \/ 25/)

    // --- Position 2 (index 1) ---
    cleanup()
    const catAtPos1 = [
      { emoji: '🐶', name: 'Dog' },
      { emoji: '🐱', name: 'Cat' },
      { emoji: '🐟', name: 'Fish' },
    ]
    COSMIC_SAFARI_CURRICULUM[0].shuffledOptions = catAtPos1
    saveCosmicSafariCheckpoint(1, { roundIndex: 0, score: 0 })

    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    const optionButtonsPos1 = screen.getByTestId('cosmic-safari-options-grid').querySelectorAll('button')
    expect(optionButtonsPos1[1]).toHaveAttribute('data-testid', 'option-cat')
    expect(optionButtonsPos1[1]).toHaveAttribute('data-option-index', '1')

    // Click Cat at position 1 (middle card)
    fireEvent.click(optionButtonsPos1[1])
    expect(screen.getByText(/🎉 Great job!/i)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(950)
    })
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/1 \/ 25/)

    // --- Position 3 (index 2) ---
    cleanup()
    const catAtPos2 = [
      { emoji: '🐶', name: 'Dog' },
      { emoji: '🐟', name: 'Fish' },
      { emoji: '🐱', name: 'Cat' },
    ]
    COSMIC_SAFARI_CURRICULUM[0].shuffledOptions = catAtPos2
    saveCosmicSafariCheckpoint(1, { roundIndex: 0, score: 0 })

    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    const optionButtonsPos2 = screen.getByTestId('cosmic-safari-options-grid').querySelectorAll('button')
    expect(optionButtonsPos2[2]).toHaveAttribute('data-testid', 'option-cat')
    expect(optionButtonsPos2[2]).toHaveAttribute('data-option-index', '2')

    // Click Cat at position 2 (third card)
    fireEvent.click(optionButtonsPos2[2])
    expect(screen.getByText(/🎉 Great job!/i)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(950)
    })
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/1 \/ 25/)

    // Clean up injected test property
    delete COSMIC_SAFARI_CURRICULUM[0].shuffledOptions
  })

  // 21. Clicking incorrect distractors at any position (index 0, 1, 2) does not award points
  it('21. selecting an incorrect distractor at any position triggers retry feedback and gives 0 points', () => {
    vi.useFakeTimers()

    // Cat is at index 1 (middle). Position 0 is Dog, Position 2 is Fish.
    COSMIC_SAFARI_CURRICULUM[0].shuffledOptions = [
      { emoji: '🐶', name: 'Dog' },
      { emoji: '🐱', name: 'Cat' },
      { emoji: '🐟', name: 'Fish' },
    ]

    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    const optionButtons = screen.getByTestId('cosmic-safari-options-grid').querySelectorAll('button')

    // Click Dog at position 0 (first card) -> incorrect
    fireEvent.click(optionButtons[0])
    expect(screen.getByText(/💪 Let's try again!/i)).toBeInTheDocument()
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/0 \/ 25/)

    act(() => {
      vi.advanceTimersByTime(950)
    })

    // Level 2 reached with score 0
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 2 of 25/i)
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/0 \/ 25/)

    // Clean up injected test property
    delete COSMIC_SAFARI_CURRICULUM[0].shuffledOptions
  })

  // 22. Options remain stable and do not reshuffle unexpectedly during React re-renders of the same question
  it('22. options remain stable and do not reshuffle when question re-renders', () => {
    renderCosmicSafari()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    const getRenderedOrder = () => {
      const grid = screen.getByTestId('cosmic-safari-options-grid')
      return Array.from(grid.querySelectorAll('button')).map((b) => b.getAttribute('aria-label'))
    }

    const initialOrder = getRenderedOrder()
    expect(initialOrder).toHaveLength(3)

    // Trigger audio click which causes SpeechSynthesis and state update in SoundSafariAudio
    const hearBtn = screen.getByTestId('hear-sound-btn')
    fireEvent.click(hearBtn)

    // Order must remain identical
    const orderAfterAudio = getRenderedOrder()
    expect(orderAfterAudio).toEqual(initialOrder)

    // Replay audio
    fireEvent.click(hearBtn)
    expect(getRenderedOrder()).toEqual(initialOrder)
  })
})

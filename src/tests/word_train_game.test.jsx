import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import GamePlay from '../pages/child/GamePlay'
import { GAME_CONTENT } from '../data/gameContent'
import {
  getWordTrainCheckpointKey,
  loadWordTrainCheckpoint,
  loadWordTrainCheckpointData,
  saveWordTrainCheckpoint,
  resetWordTrainCheckpoint,
} from '../games/word-train/engine/wordTrainCheckpoint'

// Mock AppContext to inspect session saving and control active child state
const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 101, ok: true })
const mockApplySessionOutcome = vi.fn()
let isRealBackendMock = true
let currentActiveChild = {
  id: 1,
  name: 'Leo Explorer',
  interests: ['space'],
  fingerprint: { wordRecognition: 60 },
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

function renderWordTrain() {
  return render(
    <MemoryRouter initialEntries={['/child/games/word-train']}>
      <Routes>
        <Route path="/child/games/:gameId" element={<GamePlay />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Word Train Game Suite (/child/games/word-train)', () => {
  const originalWordTrainRounds = [...GAME_CONTENT['word-train']]

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    isRealBackendMock = true
    currentActiveChild = {
      id: 1,
      name: 'Leo Explorer',
      interests: ['space'],
      fingerprint: { wordRecognition: 60 },
      comfort_preferences: { quiet_mode: false },
    }
    GAME_CONTENT['word-train'] = [...originalWordTrainRounds]
  })

  afterEach(() => {
    localStorage.clear()
    vi.useRealTimers()
    currentActiveChild = {
      id: 1,
      name: 'Leo Explorer',
      interests: ['space'],
      fingerprint: { wordRecognition: 60 },
      comfort_preferences: { quiet_mode: false },
    }
    GAME_CONTENT['word-train'] = [...originalWordTrainRounds]
  })

  // 1. Intro screen, title, instructions, and Start Game button
  it('1. loads and displays the intro screen with title, instructions, and Start Game button', () => {
    renderWordTrain()

    expect(screen.getByTestId('gameplay-container')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Word Train/i })).toBeInTheDocument()
    expect(
      screen.getByText(/Load the train carriages in order to spell the word\./i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to games/i })).toBeInTheDocument()
    expect(screen.getByTestId('voice-mode-indicator')).toBeInTheDocument()
  })

  // 2. Starting Level 1 and displaying initial train, slots, and carriage buttons
  it('2. starts Level 1 displaying level indicator, empty slots, prompt, and carriage buttons', () => {
    renderWordTrain()

    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Stage moves to playing
    expect(screen.queryByRole('heading', { level: 1, name: /Word Train/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 50/i)
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/⭐.*0\s*\/\s*50/)
    expect(screen.getByText(/Load the train carriages to spell the word!/i)).toBeInTheDocument()

    // 3 empty slots for CAT
    const emptySlots = screen.getAllByText('—')
    expect(emptySlots).toHaveLength(3)

    // Carriage buttons for scrambled letters of Level 1: T, C, A
    expect(screen.getByRole('button', { name: 'Carriage T' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Carriage C' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Carriage A' })).toBeInTheDocument()
  })

  // 3. Sequential letter assembly and slot updating
  it('3. updates slots as carriages are clicked and triggers success feedback on correct spelling', () => {
    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Initially 3 empty slots
    expect(screen.getAllByText('—')).toHaveLength(3)

    // Tap 'C' -> first slot filled
    fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))
    expect(screen.getAllByText('—')).toHaveLength(2)

    // Tap 'A' -> second slot filled
    fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))
    expect(screen.getAllByText('—')).toHaveLength(1)

    // Tap 'T' -> third slot filled -> triggers onAnswer(true)
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))
    expect(screen.queryAllByText('—')).toHaveLength(0)

    // Feedback overlay displays success
    const feedback = screen.getByTestId('feedback-overlay')
    expect(feedback).toBeInTheDocument()
    expect(feedback).toHaveTextContent(/Great job!/i)
  })

  // 4. Incorrect letter sequence feedback without incrementing score, keeping level for retry
  it('4. selecting an incorrect sequence shows retry feedback, retains current level, and resets tiles', async () => {
    vi.useFakeTimers()
    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Click T, then C, then A (spells TCA instead of CAT)
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))

    // All slots filled
    expect(screen.queryAllByText('—')).toHaveLength(0)

    // Feedback overlay shows retry encouragement
    const feedback = screen.getByTestId('feedback-overlay')
    expect(feedback).toBeInTheDocument()
    expect(feedback).toHaveTextContent(/Let's try again!/i)

    // Buttons should now be disabled during feedback transition
    expect(screen.getByRole('button', { name: 'Carriage T' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Carriage C' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Carriage A' })).toBeDisabled()

    // Advance 950ms: feedback clears, level remains Level 1 of 50, and buttons are re-enabled
    await act(async () => {
      vi.advanceTimersByTime(950)
    })

    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 50/i)
    expect(screen.getAllByText('—')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Carriage T' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Carriage C' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Carriage A' })).toBeEnabled()
  })

  // 5. Progression through rounds, results screen, and Play Again reset
  it('5. progresses through levels and displays results screen with score summary', async () => {
    vi.useFakeTimers()
    GAME_CONTENT['word-train'] = [
      { word: 'CAT', image: '🐱', letters: ['C', 'A', 'T'], scrambled: ['T', 'C', 'A'] },
      { word: 'BUS', image: '🚌', letters: ['B', 'U', 'S'], scrambled: ['S', 'B', 'U'] },
    ]

    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // --- Round 1: CAT (correct) ---
    expect(screen.getByText(/Round 1 of 2/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))
    await act(async () => {
      vi.advanceTimersByTime(950)
    })

    // --- Round 2: BUS (correct) ---
    expect(screen.getByText(/Round 2 of 2/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Carriage B' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Carriage U' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Carriage S' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Carriage B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage U' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage S' }))
    await act(async () => {
      vi.advanceTimersByTime(950)
    })

    // Finished summary screen (2 out of 2 correct)
    expect(screen.getByRole('heading', { level: 2, name: /Nice work!/i })).toBeInTheDocument()
    expect(screen.getByText(/You got 2 out of 2 correct\./i)).toBeInTheDocument()
    expect(screen.getByText(/⭐ \+2 Stars earned/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Play Again/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /See Results/i })).toBeInTheDocument()

    // Test Play Again button resets back to intro screen
    fireEvent.click(screen.getByRole('button', { name: /Play Again/i }))
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Word Train/i })).toBeInTheDocument()
  })

  // 6. Real-backend session saving with correct payload and no duplicate saves
  it('6. invokes saveLearningSession exactly once with expected payload when isRealBackend is true', async () => {
    vi.useFakeTimers()
    GAME_CONTENT['word-train'] = [
      { word: 'CAT', image: '🐱', letters: ['C', 'A', 'T'], scrambled: ['T', 'C', 'A'] },
      { word: 'BUS', image: '🚌', letters: ['B', 'U', 'S'], scrambled: ['S', 'B', 'U'] },
    ]

    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Complete all rounds correctly (score: 2/2 = 100%)
    // Round 1: CAT
    fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))
    await act(async () => { vi.advanceTimersByTime(950) })

    // Round 2: BUS
    fireEvent.click(screen.getByRole('button', { name: 'Carriage B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage U' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage S' }))
    await act(async () => { vi.advanceTimersByTime(950) })
    await act(async () => { await Promise.resolve() })

    // Verify exactly one backend save call
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1)
    const payload = mockSaveLearningSession.mock.calls[0][0]
    expect(payload.skill).toBe('wordRecognition')
    expect(payload.stars).toBe(2)
    expect(payload.xp).toBe(15 + 2 * 3) // 21
    expect(payload.outcome).toMatchObject({
      type: 'game',
      skill: 'wordRecognition',
      title: 'Word Train',
      score: 100, // 2/2 = 100%
      accuracy: 100,
      starsGain: 2,
      xpGain: 21,
      _savedToBackend: true,
    })
    expect(mockApplySessionOutcome).not.toHaveBeenCalled()
  })

  // 7. Offline-mode session handling
  it('7. invokes applySessionOutcome when isRealBackend is false (offline mode)', async () => {
    isRealBackendMock = false
    vi.useFakeTimers()
    GAME_CONTENT['word-train'] = [
      { word: 'CAT', image: '🐱', letters: ['C', 'A', 'T'], scrambled: ['T', 'C', 'A'] },
    ]

    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Round 1: CAT (correct)
    fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))
    await act(async () => { vi.advanceTimersByTime(950) })
    await act(async () => { await Promise.resolve() })

    expect(mockSaveLearningSession).not.toHaveBeenCalled()
    expect(mockApplySessionOutcome).toHaveBeenCalledTimes(1)
    const outcome = mockApplySessionOutcome.mock.calls[0][0]
    expect(outcome.skill).toBe('wordRecognition')
    expect(outcome.score).toBe(100)
    expect(outcome.accuracy).toBe(100)
    expect(outcome.starsGain).toBe(1)
    expect(outcome.xpGain).toBe(18) // 15 + 1*3
    expect(outcome._savedToBackend).toBe(false)
  })

  // 8. Save failure and retry behavior
  it('8. handles save errors gracefully and allows retry without duplicate saves', async () => {
    vi.useFakeTimers()
    mockSaveLearningSession.mockRejectedValueOnce(new Error('Network unavailable'))
    GAME_CONTENT['word-train'] = [
      { word: 'CAT', image: '🐱', letters: ['C', 'A', 'T'], scrambled: ['T', 'C', 'A'] },
    ]

    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Complete round
    fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))
    await act(async () => { vi.advanceTimersByTime(950) })
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

  // -------------------------------------------------------------
  // Step 2 Requirements: Tile Tracking, Duplicates, Undo & Guards
  // -------------------------------------------------------------

  // 9. Individual letter tile tracking (only clicked tile disabled)
  it('9. disables only the selected letter tile, leaving remaining tiles enabled', () => {
    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Scrambled for Round 1: T, C, A
    const btnT = screen.getByRole('button', { name: 'Carriage T' })
    const btnC = screen.getByRole('button', { name: 'Carriage C' })
    const btnA = screen.getByRole('button', { name: 'Carriage A' })

    expect(btnT).toBeEnabled()
    expect(btnC).toBeEnabled()
    expect(btnA).toBeEnabled()

    // Click carriage C
    fireEvent.click(btnC)

    // Only C should be disabled; T and A must stay enabled
    expect(btnC).toBeDisabled()
    expect(btnT).toBeEnabled()
    expect(btnA).toBeEnabled()

    // First slot should be populated with C
    expect(screen.getByRole('button', { name: 'Slot 1: C' })).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(2)
  })

  // 10. Undo functionality via Undo Letter button
  it('10. undoes the most recently placed letter via the Undo Letter button and re-enables its tile', () => {
    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    const undoBtn = screen.getByTestId('undo-letter-button')
    // Initially disabled when no letters are placed
    expect(undoBtn).toBeDisabled()

    const btnC = screen.getByRole('button', { name: 'Carriage C' })
    fireEvent.click(btnC)

    expect(btnC).toBeDisabled()
    expect(undoBtn).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Slot 1: C' })).toBeInTheDocument()

    // Click undo button
    fireEvent.click(undoBtn)

    // Slot should be cleared and C re-enabled
    expect(btnC).toBeEnabled()
    expect(screen.getAllByText('—')).toHaveLength(3)
    expect(undoBtn).toBeDisabled()
  })

  // 11. Undo functionality via clicking a filled carriage slot on the train
  it('11. undoes a specific placed letter by clicking its train carriage slot directly', () => {
    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    const btnC = screen.getByRole('button', { name: 'Carriage C' })
    const btnA = screen.getByRole('button', { name: 'Carriage A' })

    // Place C, then A
    fireEvent.click(btnC)
    fireEvent.click(btnA)

    expect(btnC).toBeDisabled()
    expect(btnA).toBeDisabled()

    // Slot 1 is C, Slot 2 is A
    const slot1 = screen.getByRole('button', { name: 'Slot 1: C' })
    const slot2 = screen.getByRole('button', { name: 'Slot 2: A' })
    expect(slot1).toBeInTheDocument()
    expect(slot2).toBeInTheDocument()

    // Click slot 1 (C) directly to remove it
    fireEvent.click(slot1)

    // C is returned and re-enabled; A remains in the carriages
    expect(btnC).toBeEnabled()
    expect(btnA).toBeDisabled()
    expect(screen.getAllByText('—')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Slot 1: A' })).toBeInTheDocument()
  })

  // 12. Support for duplicate letters (e.g. BELL)
  it('12. supports words with duplicate letters (e.g. BELL) allowing both identical tiles to be used', () => {
    // Override word-train content with duplicate-letter word BELL
    GAME_CONTENT['word-train'] = [
      {
        word: 'BELL',
        image: '🔔',
        letters: ['B', 'E', 'L', 'L'],
        scrambled: ['L', 'B', 'L', 'E'],
      },
    ]

    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Should have 4 empty slots for BELL
    expect(screen.getAllByText('—')).toHaveLength(4)

    // Find the two 'L' carriage buttons
    const lButtons = screen.getAllByRole('button', { name: 'Carriage L' })
    expect(lButtons).toHaveLength(2)
    expect(lButtons[0]).toBeEnabled()
    expect(lButtons[1]).toBeEnabled()

    // Click first 'L' carriage tile
    fireEvent.click(lButtons[0])
    expect(lButtons[0]).toBeDisabled()
    // Second 'L' carriage tile must remain enabled
    expect(lButtons[1]).toBeEnabled()

    // Click Undo to remove that first 'L'
    fireEvent.click(screen.getByTestId('undo-letter-button'))
    expect(lButtons[0]).toBeEnabled()
    expect(lButtons[1]).toBeEnabled()

    // Now correctly spell BELL: B, E, L, L
    fireEvent.click(screen.getByRole('button', { name: 'Carriage B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage E' }))
    fireEvent.click(lButtons[0]) // First 'L'
    expect(lButtons[0]).toBeDisabled()
    expect(lButtons[1]).toBeEnabled()

    fireEvent.click(lButtons[1]) // Second 'L'
    expect(lButtons[1]).toBeDisabled()

    // Successful completion of BELL triggers feedback
    const feedback = screen.getByTestId('feedback-overlay')
    expect(feedback).toBeInTheDocument()
    expect(feedback).toHaveTextContent(/Great job!/i)
  })

  // 13. Synchronous click guards against rapid double-clicks and repeated submissions
  it('13. prevents duplicate clicks from adding duplicate letters or triggering double submissions', () => {
    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    const btnC = screen.getByRole('button', { name: 'Carriage C' })

    // Rapid double click on Carriage C
    fireEvent.click(btnC)
    fireEvent.click(btnC)

    // Only 1 slot filled with C, 2 remain empty
    expect(screen.getByRole('button', { name: 'Slot 1: C' })).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(2)

    // Complete the word: A, T
    fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))

    // All slots filled, feedback overlay shows
    expect(screen.getByTestId('feedback-overlay')).toBeInTheDocument()

    // Immediate rapid clicks after submission are guarded by isAnswerSubmittedRef
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))
    fireEvent.click(screen.getByTestId('undo-letter-button'))

    // State remains locked during feedback transition
    expect(screen.getByTestId('feedback-overlay')).toBeInTheDocument()
  })

  // -------------------------------------------------------------
  // Step 3 Requirements: Score Display, Progress & Responsiveness
  // -------------------------------------------------------------

  // 14. Preserves individual star row for <= 5 rounds (3-round game)
  it('14. preserves individual star row display and round label when total <= 5', () => {
    GAME_CONTENT['word-train'] = [
      { word: 'CAT', image: '🐱', letters: ['C', 'A', 'T'], scrambled: ['T', 'C', 'A'] },
      { word: 'BUS', image: '🚌', letters: ['B', 'U', 'S'], scrambled: ['S', 'B', 'U'] },
      { word: 'SUN', image: '☀️', letters: ['S', 'U', 'N'], scrambled: ['U', 'S', 'N'] },
    ]
    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    expect(screen.getByTestId('score-star-row')).toBeInTheDocument()
    expect(screen.queryByTestId('compact-score-display')).not.toBeInTheDocument()
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Round 1 of 3/i)

    const progressContainer = screen.getByTestId('gameplay-progress-bar-container')
    expect(progressContainer).toHaveAttribute('aria-valuenow', '0')
  })

  // 15. Renders compact score display when levels > 5
  it('15. renders compact score indicator (⭐ score / total) and Level label when total > 5', () => {
    // Mock 10 levels
    GAME_CONTENT['word-train'] = Array.from({ length: 10 }, (_, i) => ({
      word: 'CAT',
      image: '🐱',
      letters: ['C', 'A', 'T'],
      scrambled: ['T', 'C', 'A'],
    }))

    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    expect(screen.queryByTestId('score-star-row')).not.toBeInTheDocument()
    const compactScore = screen.getByTestId('compact-score-display')
    expect(compactScore).toBeInTheDocument()
    expect(compactScore).toHaveTextContent(/⭐.*0\s*\/\s*10/)
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 10/i)
  })

  // 16. Accurate progress values at beginning, middle, and end for expanded levels
  it('16. tracks accurate progress values at the beginning, middle, and end without exceeding 100%', async () => {
    vi.useFakeTimers()
    const totalLevels = 10
    GAME_CONTENT['word-train'] = Array.from({ length: totalLevels }, (_, i) => ({
      word: 'CAT',
      image: '🐱',
      letters: ['C', 'A', 'T'],
      scrambled: ['T', 'C', 'A'],
    }))

    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Beginning: Level 1 of 10 (0% completed)
    const progressBar = screen.getByTestId('gameplay-progress-bar-container')
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 10/i)
    expect(progressBar).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/⭐.*0\s*\/\s*10/)

    // Advance 5 levels (Middle: Level 6 of 10)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))
      fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))
      fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))
      await act(async () => {
        vi.advanceTimersByTime(950)
      })
    }

    // Middle: Level 6 of 10 (5/10 completed = 50%)
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 6 of 10/i)
    expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/⭐.*5\s*\/\s*10/)

    // Advance remaining levels up to Level 10 of 10 (End: Level 10 of 10)
    for (let i = 5; i < 9; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))
      fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))
      fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))
      await act(async () => {
        vi.advanceTimersByTime(950)
      })
    }

    // End: Level 10 of 10 (9/10 completed = 90%)
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 10 of 10/i)
    expect(progressBar).toHaveAttribute('aria-valuenow', '90')
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/⭐.*9\s*\/\s*10/)

    // Complete the final level
    fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))
    await act(async () => {
      vi.advanceTimersByTime(950)
    })

    // Game finishes successfully; progress never exceeded 100%
    expect(screen.getByRole('heading', { level: 2, name: /Nice work!/i })).toBeInTheDocument()
    expect(screen.getByText(/You got 10 out of 10 correct\./i)).toBeInTheDocument()
  })

  // 17. Responsive gameplay layout for words up to 7 letters
  it('17. renders and supports gameplay for 7-letter words without label overlap or broken controls', () => {
    GAME_CONTENT['word-train'] = [
      {
        word: 'RAINBOW',
        image: '🌈',
        letters: ['R', 'A', 'I', 'N', 'B', 'O', 'W'],
        scrambled: ['W', 'O', 'B', 'N', 'I', 'A', 'R'],
      },
    ]

    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Track has engine + 7 carriage slots
    const track = screen.getByTestId('train-carriages-track')
    expect(track).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(7)

    // Dock has 7 letter buttons
    const dock = screen.getByTestId('scrambled-tiles-dock')
    expect(dock).toBeInTheDocument()
    'RAINBOW'.split('').forEach((letter) => {
      expect(screen.getByRole('button', { name: `Carriage ${letter}` })).toBeEnabled()
    })

    // Click first 3 letters: R, A, I
    fireEvent.click(screen.getByRole('button', { name: 'Carriage R' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage I' }))

    expect(screen.getByRole('button', { name: 'Carriage R' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Carriage A' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Carriage I' })).toBeDisabled()
    expect(screen.getAllByText('—')).toHaveLength(4)

    // Undo button returns 'I'
    fireEvent.click(screen.getByTestId('undo-letter-button'))
    expect(screen.getByRole('button', { name: 'Carriage I' })).toBeEnabled()
    expect(screen.getAllByText('—')).toHaveLength(5)
  })

  // 18. Avoid counting a level as completed more than once
  it('18. avoids counting a level as completed more than once when multiple completion triggers fire', async () => {
    vi.useFakeTimers()
    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Complete CAT
    fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))

    expect(screen.getByTestId('feedback-overlay')).toBeInTheDocument()

    // Multiple rapid triggers during feedback transition
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))

    await act(async () => {
      vi.advanceTimersByTime(950)
    })

    // Advance into Level 2 of 50: exactly 1 level was completed, score is 1, not 2
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 2 of 50/i)
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/⭐.*1\s*\/\s*50/)
  })

  // -------------------------------------------------------------
  // Step 4 Requirements: Child Checkpoint, Resume & Storage Safety
  // -------------------------------------------------------------

  // 19. Generates correct child-specific storage keys
  it('19. generates child-specific storage keys with fallback to guest', () => {
    expect(getWordTrainCheckpointKey('child-1')).toBe('lexiguide_word_train_checkpoint_child-1')
    expect(getWordTrainCheckpointKey(42)).toBe('lexiguide_word_train_checkpoint_42')
    expect(getWordTrainCheckpointKey(null)).toBe('lexiguide_word_train_checkpoint_guest')
    expect(getWordTrainCheckpointKey(undefined)).toBe('lexiguide_word_train_checkpoint_guest')
    expect(getWordTrainCheckpointKey('')).toBe('lexiguide_word_train_checkpoint_guest')
  })

  // 20. New child starts at Level 1 (index 0)
  it('20. new child with no checkpoint starts at Level 1', () => {
    currentActiveChild = { id: 'new-player-7' }
    expect(loadWordTrainCheckpoint('new-player-7')).toBe(0)

    renderWordTrain()
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 50/i)
    // Scrambled for Level 1 (CAT): T, C, A
    expect(screen.getByRole('button', { name: 'Carriage T' })).toBeInTheDocument()
  })

  // 21. Resumes from a valid saved checkpoint
  it('21. resumes from a valid saved checkpoint for the active child', () => {
    currentActiveChild = { id: 'returning-player' }
    // Save checkpoint at Level 2 (index 1: DOG)
    saveWordTrainCheckpoint('returning-player', 1, 50)
    expect(loadWordTrainCheckpoint('returning-player', 50)).toBe(1)

    renderWordTrain()
    // Start button reflects resume state
    expect(screen.getByRole('button', { name: /Resume Game ▶/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))
    // Direct resume at Level 2 (DOG: scrambled G, D, O)
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 2 of 50/i)
    expect(screen.getByRole('button', { name: 'Carriage G' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Carriage D' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Carriage O' })).toBeInTheDocument()
  })

  // 22. Independent progress between two children
  it('22. maintains independent progress between different children', () => {
    // Child Alpha at Level 2 (index 1)
    saveWordTrainCheckpoint('child-alpha', 1, 50)
    // Child Beta at Level 3 (index 2)
    saveWordTrainCheckpoint('child-beta', 2, 50)
    // Guest has no checkpoint
    expect(loadWordTrainCheckpoint('guest')).toBe(0)

    expect(loadWordTrainCheckpoint('child-alpha', 50)).toBe(1)
    expect(loadWordTrainCheckpoint('child-beta', 50)).toBe(2)

    // Render for Child Alpha
    currentActiveChild = { id: 'child-alpha' }
    const { unmount } = renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 2 of 50/i)
    unmount()

    // Render for Child Beta
    currentActiveChild = { id: 'child-beta' }
    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 3 of 50/i)
  })

  // 23. Handles invalid or out-of-range checkpoint values safely
  it('23. safely handles corrupted, negative, non-numeric, or out-of-range checkpoint data by defaulting to 0', () => {
    const childId = 'corrupt-tester'

    // Missing key
    expect(loadWordTrainCheckpoint(childId)).toBe(0)

    // Corrupted non-JSON string
    localStorage.setItem(getWordTrainCheckpointKey(childId), '{corrupt-json:::')
    expect(loadWordTrainCheckpoint(childId)).toBe(0)

    // Negative index
    saveWordTrainCheckpoint(childId, -3, 50)
    expect(loadWordTrainCheckpoint(childId)).toBe(0)

    // Out-of-bounds excessive index (>= maxLevels)
    localStorage.setItem(
      getWordTrainCheckpointKey(childId),
      JSON.stringify({ levelIndex: 999 })
    )
    expect(loadWordTrainCheckpoint(childId, 50)).toBe(0)

    // Non-numeric value
    localStorage.setItem(
      getWordTrainCheckpointKey(childId),
      JSON.stringify({ levelIndex: 'not-a-number' })
    )
    expect(loadWordTrainCheckpoint(childId)).toBe(0)

    // Render game with corrupted storage: starts safely at Level 1
    currentActiveChild = { id: childId }
    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 50/i)
  })

  // 24. Updates checkpoint upon successful level completion and does not advance on wrong answer
  it('24. saves progress when a level is answered correctly and retains checkpoint on incorrect answer', async () => {
    vi.useFakeTimers()
    const childId = 'progress-saver'
    currentActiveChild = { id: childId }

    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    expect(loadWordTrainCheckpoint(childId, 50)).toBe(0)

    // Correctly spell Level 1 (CAT)
    fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))

    // Checkpoint updated to Level 2 (index 1)
    expect(loadWordTrainCheckpoint(childId, 50)).toBe(1)

    await act(async () => {
      vi.advanceTimersByTime(950)
    })

    // Now on Level 2 (DOG: scrambled G, D, O). Submit incorrect answer (G, D, O)
    fireEvent.click(screen.getByRole('button', { name: 'Carriage G' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage D' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage O' }))

    // Incorrect answer does NOT advance the checkpoint further
    expect(loadWordTrainCheckpoint(childId, 50)).toBe(1)

    // After retry timeout, remains on Level 2 of 50
    await act(async () => {
      vi.advanceTimersByTime(950)
    })
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 2 of 50/i)
  })

  // 25. Duplicate completion events do not advance checkpoint twice
  it('25. prevents rapid duplicate clicks from advancing checkpoint twice', async () => {
    vi.useFakeTimers()
    const childId = 'double-clicker'
    currentActiveChild = { id: childId }

    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Finish CAT
    fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))

    // Rapid second click during transition
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))

    // Checkpoint is index 1, not index 2
    expect(loadWordTrainCheckpoint(childId, 50)).toBe(1)

    await act(async () => {
      vi.advanceTimersByTime(950)
    })

    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 2 of 50/i)
    expect(loadWordTrainCheckpoint(childId, 50)).toBe(1)
  })

  // 26. Play Again resets checkpoint to Level 1 (index 0)
  it('26. resets checkpoint to Level 1 when Play Again is clicked after completing all rounds', async () => {
    vi.useFakeTimers()
    const childId = 'game-finisher'
    currentActiveChild = { id: childId }

    GAME_CONTENT['word-train'] = [
      { word: 'CAT', image: '🐱', letters: ['C', 'A', 'T'], scrambled: ['T', 'C', 'A'] },
      { word: 'BUS', image: '🚌', letters: ['B', 'U', 'S'], scrambled: ['S', 'B', 'U'] },
    ]

    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Complete CAT
    fireEvent.click(screen.getByRole('button', { name: 'Carriage C' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage A' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage T' }))
    await act(async () => { vi.advanceTimersByTime(950) })

    // Complete BUS
    fireEvent.click(screen.getByRole('button', { name: 'Carriage B' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage U' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carriage S' }))
    await act(async () => { vi.advanceTimersByTime(950) })
    await act(async () => { await Promise.resolve() })

    // Results screen reached; checkpoint clamped to last level (index 1)
    expect(screen.getByRole('heading', { level: 2, name: /Nice work!/i })).toBeInTheDocument()
    expect(loadWordTrainCheckpoint(childId, 2)).toBe(1)

    // Click Play Again
    fireEvent.click(screen.getByRole('button', { name: /Play Again/i }))

    // Checkpoint reset to 0
    expect(loadWordTrainCheckpoint(childId, 2)).toBe(0)
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
  })

  // -------------------------------------------------------------
  // Step 5 Requirements: 50-Level Curriculum Connection & Mastery
  // -------------------------------------------------------------

  // 27. Connects all 50 progressive phonics levels from wordTrainCurriculum
  it('27. connects the full 50-level curriculum spanning all 5 stations', () => {
    expect(GAME_CONTENT['word-train']).toBeDefined()
    expect(GAME_CONTENT['word-train']).toHaveLength(50)
    expect(GAME_CONTENT['word-train'][0].word).toBe('CAT')
    expect(GAME_CONTENT['word-train'][49].word).toBe('RAINBOW')
  })

  // 28. Displays station metadata badge, visual emoji, and curriculum hint
  it('28. renders station metadata badge, visual image, and curriculum hint', () => {
    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Station 1 badge is visible
    expect(screen.getByTestId('station-name-badge')).toHaveTextContent(/Station 1: 3-Letter Short Vowels/i)
    // Word image for CAT is visible
    expect(screen.getByText('🐱')).toBeInTheDocument()

    // Tap Need a hint? -> shows pedagogical hint from curriculum
    fireEvent.click(screen.getByRole('button', { name: /Need a hint\?/i }))
    expect(screen.getByText(/A friendly furry pet that purrs/i)).toBeInTheDocument()
  })

  // 29. Full progression up to Level 50 (RAINBOW) and final victory screen
  it('29. resumes at Level 50, completes final word, shows victory screen, and clamps progression', async () => {
    vi.useFakeTimers()
    const childId = 'curriculum-master'
    currentActiveChild = { id: childId }

    // Checkpoint at Level 50 (index 49: RAINBOW)
    saveWordTrainCheckpoint(childId, 49, 50)
    expect(loadWordTrainCheckpoint(childId, 50)).toBe(49)

    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))

    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 50 of 50/i)
    expect(screen.getByTestId('station-name-badge')).toHaveTextContent(/Station 5: 6–7-Letter Conductor Challenge/i)
    expect(screen.getByText('🌈')).toBeInTheDocument()

    // Solve Level 50: RAINBOW
    'RAINBOW'.split('').forEach((letter) => {
      fireEvent.click(screen.getByRole('button', { name: `Carriage ${letter}` }))
    })

    // Great job overlay appears
    expect(screen.getByTestId('feedback-overlay')).toHaveTextContent(/Great job!/i)

    await act(async () => {
      vi.advanceTimersByTime(950)
    })
    await act(async () => {
      await Promise.resolve()
    })

    // Victory/completion screen displays final score
    expect(screen.getByRole('heading', { level: 2, name: /Nice work!/i })).toBeInTheDocument()
    expect(screen.getByText(/You got 1 out of 50 correct\./i)).toBeInTheDocument()

    // Checkpoint in storage remains clamped at Level 50 (index 49) without overflow
    expect(loadWordTrainCheckpoint(childId, 50)).toBe(49)

    // Clicking Play Again resets checkpoint to Level 1
    fireEvent.click(screen.getByRole('button', { name: /Play Again/i }))
    expect(loadWordTrainCheckpoint(childId, 50)).toBe(0)
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
  })

  // 30. Independent multi-child resume across different stations
  it('30. supports independent multi-child resume across different stations', () => {
    // Child 1 at Level 15 (Station 2: NEST, image: 🪹)
    saveWordTrainCheckpoint('child-station-2', 14, 50)
    // Child 2 at Level 35 (Station 4: SHEEP, image: 🐑)
    saveWordTrainCheckpoint('child-station-4', 34, 50)

    // Load Child 1
    currentActiveChild = { id: 'child-station-2' }
    const { unmount: unmountChild1 } = renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 15 of 50/i)
    expect(screen.getByTestId('station-name-badge')).toHaveTextContent(/Station 2: 4-Letter Blends & Digraphs/i)
    expect(screen.getByText('🪹')).toBeInTheDocument()
    unmountChild1()

    // Load Child 2
    currentActiveChild = { id: 'child-station-4' }
    renderWordTrain()
    fireEvent.click(screen.getByRole('button', { name: /Resume Game ▶/i }))
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 35 of 50/i)
    expect(screen.getByTestId('station-name-badge')).toHaveTextContent(/Station 4: 5-Letter High-Frequency Words/i)
    expect(screen.getByText('🐑')).toBeInTheDocument()
  })
})

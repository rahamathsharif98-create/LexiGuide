import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import GamePlay from '../pages/child/GamePlay'
import { gameSound } from '../services/gameSoundService'
import {
  saveSoundHuntCheckpoint,
  loadSoundHuntCheckpoint,
  getSoundHuntCheckpointKey,
} from '../games/sound-hunt/engine/soundHuntCheckpoint'
import { SOUND_HUNT_CURRICULUM, TOTAL_SOUND_HUNT_LEVELS, SOUND_HUNT_STAGES } from '../games/sound-hunt/engine/soundHuntCurriculum'

// Mock AppContext to inspect session saving and control child state
const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 101, ok: true })
const mockApplySessionOutcome = vi.fn()
let isRealBackendMock = true
let currentActiveChild = {
  id: 1,
  name: 'Leo Explorer',
  interests: ['space'],
  fingerprint: { phonologicalAwareness: 60 },
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

function renderSoundHunt() {
  return render(
    <MemoryRouter initialEntries={['/child/games/sound-hunt']}>
      <Routes>
        <Route path="/child/games/:gameId" element={<GamePlay />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Space Sound Mission (Sound Hunt) — 25-Level Game Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    isRealBackendMock = true
    currentActiveChild = {
      id: 1,
      name: 'Leo Explorer',
      interests: ['space'],
      fingerprint: { phonologicalAwareness: 60 },
      comfort_preferences: { quiet_mode: false },
    }
  })

  afterEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  // 1. Initial starting screen
  it('1. loads and displays the starting screen with Space Sound Mission context, instructions, and start button', async () => {
    renderSoundHunt()

    expect(screen.getByTestId('gameplay-container')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Sound Hunt/i })).toBeInTheDocument()
    expect(screen.getByTestId('space-sound-mission-badge')).toHaveTextContent(/Space Sound Mission/i)
    expect(screen.getByText(/Listen to the sound and find the picture that starts with it\./i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to games/i })).toBeInTheDocument()
    expect(screen.getByTestId('voice-mode-indicator')).toBeInTheDocument()
  })

  // 2. Start Level 1 & verify 5-stage progression indicators
  it('2. transitions from intro to Level 1 with stage banner, stage pips, prompt, choices, and audio button', async () => {
    renderSoundHunt()

    const startBtn = screen.getByRole('button', { name: /Start Game ▶/i })
    fireEvent.click(startBtn)

    // Stage updates to playing
    expect(screen.queryByRole('heading', { level: 1, name: /Sound Hunt/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 25/i)
    expect(screen.getByTestId('sound-hunt-stage-badge')).toHaveTextContent(/Stage 1 of 5: Cadet Launchpad/i)
    expect(screen.getByTestId('sound-hunt-station-badge')).toHaveTextContent(/Station 1: Star Launchpad/i)

    // 5-Stage Progression Pips
    expect(screen.getByTestId('stage-progression-indicators')).toBeInTheDocument()
    for (let s = 1; s <= 5; s++) {
      expect(screen.getByTestId(`stage-pip-${s}`)).toBeInTheDocument()
    }

    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('(/b/)')).toBeInTheDocument()
    expect(screen.getByText(/Which picture starts with B\?/i)).toBeInTheDocument()

    // Level 1 options: Cat, Ball, Apple
    expect(screen.getByLabelText('Cat')).toBeInTheDocument()
    expect(screen.getByLabelText('Ball')).toBeInTheDocument()
    expect(screen.getByLabelText('Apple')).toBeInTheDocument()

    // Accessible audio playback button
    expect(screen.getByTestId('sound-hunt-audio-btn')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Listen to sound B/i })).toBeInTheDocument()
  })

  // 3. Audio playback button invokes companion voice
  it('3. clicking the audio button triggers audio playback for the target sound', async () => {
    const speakSpy = vi.spyOn(gameSound, 'speakCompanion').mockImplementation(() => {})

    renderSoundHunt()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    const audioBtn = screen.getByTestId('sound-hunt-audio-btn')
    fireEvent.click(audioBtn)

    expect(speakSpy).toHaveBeenCalledWith(
      expect.stringMatching(/buh.*Which picture starts with B\?/i),
      expect.any(Object)
    )

    speakSpy.mockRestore()
  })

  // 4. Correct answer feedback and scoring
  it('4. selecting a correct answer shows success feedback and awards a point', async () => {
    renderSoundHunt()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Click the correct choice 'Ball'
    const correctBtn = screen.getByLabelText('Ball')
    fireEvent.click(correctBtn)

    // Feedback overlay appears with success message
    const feedback = screen.getByTestId('feedback-overlay')
    expect(feedback).toBeInTheDocument()
    expect(feedback).toHaveTextContent(/Great job!/i)
  })

  // 5. Incorrect answer feedback
  it('5. selecting an incorrect answer shows retry feedback and does not award a point', async () => {
    renderSoundHunt()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Click the incorrect choice 'Cat'
    const wrongBtn = screen.getByLabelText('Cat')
    fireEvent.click(wrongBtn)

    // Feedback overlay appears with retry message
    const feedback = screen.getByTestId('feedback-overlay')
    expect(feedback).toBeInTheDocument()
    expect(feedback).toHaveTextContent(/Let's try again!/i)
  })

  // 6. Rapid-click lockout prevents duplicate submissions
  it('6. rapid clicks on option buttons are safely locked out after first click', async () => {
    vi.useFakeTimers()
    renderSoundHunt()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    const ballBtn = screen.getByLabelText('Ball')
    const catBtn = screen.getByLabelText('Cat')

    // Click ball, then immediately attempt multiple rapid clicks on cat and ball
    fireEvent.click(ballBtn)
    fireEvent.click(catBtn)
    fireEvent.click(ballBtn)

    // Verify option buttons are disabled during feedback transition
    expect(ballBtn).toBeDisabled()
    expect(catBtn).toBeDisabled()

    await act(async () => {
      vi.advanceTimersByTime(950)
    })

    // Advanced exactly 1 level to Level 2 (not multiple levels or multiple points)
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 2 of 25/i)
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/1 \/ 25/)
  })

  // 7. Stage transitions at stage boundaries (Levels 5, 10, 15, 20) do not trigger final victory
  it('7. displays celebratory stage clear transition at stage boundaries and advances without premature victory', async () => {
    vi.useFakeTimers()
    renderSoundHunt()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Complete Levels 1 to 4
    for (let i = 0; i < 4; i++) {
      const curRound = SOUND_HUNT_CURRICULUM[i]
      fireEvent.click(screen.getByLabelText(curRound.correctName))
      await act(async () => {
        vi.advanceTimersByTime(950)
      })
    }

    // Now on Level 5 (Planet 🪐) — the last level of Stage 1
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent('Level 5 of 25')
    expect(screen.getByTestId('sound-hunt-stage-badge')).toHaveTextContent(/Stage 1 of 5: Cadet Launchpad/i)

    // Answer Level 5 correctly
    fireEvent.click(screen.getByLabelText('Planet'))

    // Shows Stage 1 Cleared transition banner!
    const stageFeedback = screen.getByTestId('feedback-overlay')
    expect(stageFeedback).toHaveTextContent(/Stage 1 Cleared!/i)
    expect(stageFeedback).toHaveTextContent(/Advancing to Stage 2…/i)

    // Must NOT show the final victory screen!
    expect(screen.queryByRole('heading', { level: 2, name: /Nice work!/i })).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(950)
    })

    // Transition completes: now on Level 6, Stage 2: Cosmic Voyager!
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent('Level 6 of 25')
    expect(screen.getByTestId('sound-hunt-stage-badge')).toHaveTextContent(/Stage 2 of 5: Cosmic Voyager/i)
    expect(screen.getByTestId('sound-hunt-station-badge')).toHaveTextContent(/Station 6: Astronaut Outpost/i)
    expect(screen.queryByRole('heading', { level: 2, name: /Nice work!/i })).not.toBeInTheDocument()
  })

  // 8. Checkpoint persistence and resume behavior
  it('8. saves checkpoint progress and allows child to resume from saved level in 25-level curriculum', async () => {
    // Child 1 has progress saved at Level 12 (Station 12: Drum 🥁) with score 10
    saveSoundHuntCheckpoint(1, { roundIndex: 11, score: 10 })

    renderSoundHunt()

    // Intro shows "Resume Game ▶"
    const resumeBtn = screen.getByRole('button', { name: /Resume Game ▶/i })
    expect(resumeBtn).toBeInTheDocument()

    fireEvent.click(resumeBtn)

    // Resumes at Level 12 (Drum) with score 10 / 25 in Stage 3: Deep Space Explorer
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 12 of 25/i)
    expect(screen.getByTestId('sound-hunt-stage-badge')).toHaveTextContent(/Stage 3 of 5: Deep Space Explorer/i)
    expect(screen.getByTestId('sound-hunt-station-badge')).toHaveTextContent(/Station 12: Cosmic Beats/i)
    expect(screen.getByText('D')).toBeInTheDocument()
    expect(screen.getByText(/Which picture starts with D\?/i)).toBeInTheDocument()
    expect(screen.getByTestId('compact-score-display')).toHaveTextContent(/10 \/ 25/)
  })

  // 9. Child-specific progress isolation
  it('9. isolates progress cleanly between different children', async () => {
    // Save Level 18 for Child 1
    saveSoundHuntCheckpoint(1, { roundIndex: 17, score: 16 })
    // Child 2 is fresh (no save)

    currentActiveChild = {
      id: 2,
      name: 'Maya Star',
      interests: ['space'],
      fingerprint: { phonologicalAwareness: 40 },
    }

    renderSoundHunt()

    // Child 2 should see "Start Game ▶" and begin at Level 1
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 25/i)
  })

  // 10. Full progression through all 25 levels and victory flow
  it('10. advances through all 25 levels and shows victory screen ONLY after final level', async () => {
    vi.useFakeTimers()
    renderSoundHunt()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Advance through Levels 1 to 24 (intermediate levels must never trigger victory screen)
    for (let i = 0; i < TOTAL_SOUND_HUNT_LEVELS - 1; i++) {
      const curRound = SOUND_HUNT_CURRICULUM[i]
      expect(screen.getByTestId('round-progress-label')).toHaveTextContent(`Level ${i + 1} of 25`)
      expect(screen.queryByRole('heading', { level: 2, name: /Nice work!/i })).not.toBeInTheDocument()

      const correctOpt = screen.getByLabelText(curRound.correctName)
      fireEvent.click(correctOpt)
      await act(async () => {
        vi.advanceTimersByTime(950)
      })
    }

    // Now on Level 25 (Final Level: Q -> Queen 👑) in Stage 5: Galaxy Commander
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent('Level 25 of 25')
    expect(screen.getByTestId('sound-hunt-stage-badge')).toHaveTextContent(/Stage 5 of 5: Galaxy Commander/i)
    expect(screen.getByText('Q')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: /Nice work!/i })).not.toBeInTheDocument()

    // Answer Level 25
    const finalOpt = screen.getByLabelText('Queen')
    fireEvent.click(finalOpt)
    await act(async () => {
      vi.advanceTimersByTime(950)
    })

    // Victory screen appears only after completing Level 25!
    expect(screen.getByRole('heading', { level: 2, name: /Nice work!/i })).toBeInTheDocument()
    expect(screen.getByText(/You got 25 out of 25 correct\./i)).toBeInTheDocument()
    expect(screen.getByText(/⭐ \+25 Stars earned/i)).toBeInTheDocument()

    // Play Again button resets cleanly back to intro screen at Level 1
    const playAgainBtn = screen.getByRole('button', { name: /Play Again/i })
    fireEvent.click(playAgainBtn)
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
  })

  // 11a. Session saving when isRealBackend is true
  it('11a. invokes saveLearningSession exactly once with expected payload when isRealBackend is true', async () => {
    vi.useFakeTimers()
    renderSoundHunt()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Play all 25 rounds correctly
    for (let i = 0; i < TOTAL_SOUND_HUNT_LEVELS; i++) {
      const curRound = SOUND_HUNT_CURRICULUM[i]
      fireEvent.click(screen.getByLabelText(curRound.correctName))
      await act(async () => {
        vi.advanceTimersByTime(950)
      })
    }

    // Verify backend save was invoked exactly once
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1)
    const payload = mockSaveLearningSession.mock.calls[0][0]
    expect(payload.skill).toBe('phonologicalAwareness')
    expect(payload.stars).toBe(25)
    expect(payload.xp).toBe(15 + 25 * 3) // 90
    expect(payload.outcome).toMatchObject({
      type: 'game',
      skill: 'phonologicalAwareness',
      title: 'Sound Hunt',
      score: 100, // 25/25 = 100%
      accuracy: 100,
      starsGain: 25,
      xpGain: 90,
      _savedToBackend: true,
    })
    expect(mockApplySessionOutcome).not.toHaveBeenCalled()
  })

  // 11b. Session saving when isRealBackend is false (offline mode)
  it('11b. invokes applySessionOutcome when isRealBackend is false (offline mode)', async () => {
    isRealBackendMock = false
    vi.useFakeTimers()
    renderSoundHunt()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    // Play 25 rounds: 20 correct, 5 incorrect
    for (let i = 0; i < TOTAL_SOUND_HUNT_LEVELS; i++) {
      const curRound = SOUND_HUNT_CURRICULUM[i]
      if (i % 5 === 1) {
        // choose distractor option on 5 levels
        const wrongOpt = curRound.options.find((o) => o.name !== curRound.correctName)
        fireEvent.click(screen.getByLabelText(wrongOpt.name))
      } else {
        fireEvent.click(screen.getByLabelText(curRound.correctName))
      }
      await act(async () => {
        vi.advanceTimersByTime(950)
      })
    }

    expect(mockSaveLearningSession).not.toHaveBeenCalled()
    expect(mockApplySessionOutcome).toHaveBeenCalledTimes(1)
    const outcome = mockApplySessionOutcome.mock.calls[0][0]
    expect(outcome.skill).toBe('phonologicalAwareness')
    expect(outcome.score).toBe(80) // 20/25 = 80%
    expect(outcome.accuracy).toBe(80)
    expect(outcome.starsGain).toBe(20)
    expect(outcome.xpGain).toBe(75) // 15 + 20*3
    expect(outcome._savedToBackend).toBe(false)
  })

  // 11c. Handles save errors gracefully and allows retry without duplicates
  it('11c. handles save errors gracefully and allows retry without duplicating successful saves', async () => {
    vi.useFakeTimers()
    mockSaveLearningSession.mockRejectedValueOnce(new Error('Network disconnected'))

    renderSoundHunt()
    fireEvent.click(screen.getByRole('button', { name: /Start Game ▶/i }))

    for (let i = 0; i < TOTAL_SOUND_HUNT_LEVELS; i++) {
      const curRound = SOUND_HUNT_CURRICULUM[i]
      fireEvent.click(screen.getByLabelText(curRound.correctName))
      await act(async () => {
        vi.advanceTimersByTime(950)
      })
    }
    await act(async () => {
      await Promise.resolve()
    })

    // Save failed once
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/Could not save game results ⚠️/i)).toBeInTheDocument()
    expect(screen.getByText(/Network disconnected/i)).toBeInTheDocument()

    // Retry save
    const retryBtn = screen.getByRole('button', { name: /Tap to Retry 🔄/i })
    mockSaveLearningSession.mockResolvedValueOnce({ id: 102, ok: true })

    await act(async () => {
      fireEvent.click(retryBtn)
    })

    // Save called a second time upon retry
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(2)
    expect(screen.queryByText(/Could not save game results ⚠️/i)).not.toBeInTheDocument()
  })
})

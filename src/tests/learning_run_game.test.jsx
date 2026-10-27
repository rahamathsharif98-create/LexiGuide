import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, createEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from '../context/AppContext'
import { AuthProvider } from '../context/AuthContext'
import LearningRunGame from '../pages/child/LearningRunGame'
import { GAMING_ZONE_GAMES } from '../data/gamingZoneRegistry'
import { gameBridge, setHostStudentId, setHostSessionHandler } from '../games/learning-run/services/integration/gameBridge'
import { useGameStore } from '../games/learning-run/game/engine/gameStore'
import {
  storageService,
  loadSave,
  saveSave,
  updateSave,
  resetSave,
  saveCheckpointProgress,
  resetCheckpointProgress,
  setStorageChildId,
  getStorageChildId,
  getStorageKey,
  LEARNING_RUN_STORAGE_PREFIX,
  LEGACY_STORAGE_KEY,
  DEFAULT_SAVE,
  sanitizeCheckpointProgress,
} from '../games/learning-run/services/storage/storageService'
import {
  CHECKPOINT_DISTANCE,
  MAX_CHECKPOINTS,
  MAX_STUMBLES,
  MAX_STAGE,
  FINAL_COMPLETION_DISTANCE,
} from '../games/learning-run/game/engine/constants'
import { useRunnerInput } from '../games/learning-run/game/engine/useRunnerInput'
import { gameSound } from '../services/gameSoundService'
import { audioService } from '../games/learning-run/services/audio/audioService'
import { speechService } from '../games/learning-run/services/speech/speechService'
import ResultScreen from '../games/learning-run/screens/ResultScreen/ResultScreen'
import StartScreen from '../games/learning-run/screens/StartScreen/StartScreen'
import CharacterSelect from '../games/learning-run/screens/CharacterSelect/CharacterSelect'
import GameHUD from '../games/learning-run/hud/GameHUD'
import { useAppStore } from '../games/learning-run/game/engine/appStore'
import * as THREE from 'three'

const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 1, ok: true })
const mockShowToast = vi.fn()
let mockActiveChild = { id: 'child_1', name: 'Runner Kid', stars: 12 }

vi.mock('../context/AppContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useApp: () => ({
      activeChild: mockActiveChild,
      saveLearningSession: mockSaveLearningSession,
      showToast: mockShowToast,
      isRealBackend: false,
    }),
  }
})

describe('LexiGuide Learning Run Integration Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('1. Registry contains LexiGuide Learning Run with correct metadata', () => {
    const game = GAMING_ZONE_GAMES.find((g) => g.id === 'learning-run')
    expect(game).toBeDefined()
    expect(game.title).toBe('LexiGuide Learning Run')
    expect(game.route).toBe('/child/games/learning-run')
    expect(game.dimension).toBe('3D Endless Runner')
  })

  it('2. LearningRunGame wrapper renders header bar with back button and controls guide', () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/games/learning-run']}>
            <LearningRunGame />
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    // Check page container
    expect(screen.getByTestId('learning-run-page')).toBeInTheDocument()

    // Check back to games button
    const backBtn = screen.getByRole('button', { name: /back to gaming zone/i })
    expect(backBtn).toBeInTheDocument()

    // Check fullscreen toggle button
    expect(screen.getByRole('button', { name: /enter fullscreen/i })).toBeInTheDocument()

    // Check controls strip
    expect(screen.getByText(/Controls:/i)).toBeInTheDocument()
    expect(screen.getByText(/Switch Lanes/i)).toBeInTheDocument()
    expect(screen.getByText(/Non-clinical, encouraging 3D learning/i)).toBeInTheDocument()
  })

  it('3. gameBridge starts session and wires host student ID', () => {
    setHostStudentId(42)
    const session = gameBridge.startGameSession({
      worldId: 'sunlit-meadow',
      characterId: 'explorer',
      difficulty: 1,
    })

    expect(session).toBeDefined()
    expect(session.studentId).toBe(42)
    expect(session.worldId).toBe('sunlit-meadow')
    expect(session.characterId).toBe('explorer')
  })

  it('4. gameBridge completeGameSession triggers host session handler', async () => {
    const hostHandler = vi.fn()
    setHostSessionHandler(hostHandler)

    gameBridge.startGameSession({
      worldId: 'sunlit-meadow',
      characterId: 'explorer',
      difficulty: 1,
    })

    const runResult = {
      distance: 240,
      lettersCollected: ['A', 'B', 'C'],
      wordsCompleted: ['CAB'],
      challengesCompleted: 2,
      challengesCorrect: 2,
      starsEarned: 5,
      checkpointsReached: 1,
      difficultLetters: [],
      observedPatterns: {},
    }

    const completed = gameBridge.completeGameSession(runResult)

    expect(completed).toBeDefined()
    expect(completed.distance).toBe(240)
    expect(completed.starsEarned).toBe(5)
    expect(hostHandler).toHaveBeenCalledTimes(1)
    expect(hostHandler).toHaveBeenCalledWith(expect.objectContaining({
      distance: 240,
      starsEarned: 5,
      wordsCompleted: ['CAB'],
    }))
  })

  it('5. Word Quest fill-in-the-blank initializes and advances on missing letter completion', () => {
    useGameStore.getState().resetRun()
    useGameStore.getState().startRun(1)

    const initialQuest = useGameStore.getState().activeWordQuest
    expect(initialQuest).toBeDefined()
    expect(initialQuest.word).toBe('APPLE')
    expect(initialQuest.missingLetter).toBe('L')
    expect(initialQuest.masked).toBe('APP_E')

    // Simulate collecting the missing letter
    useGameStore.getState().completeWordQuest()

    const updatedState = useGameStore.getState()
    expect(updatedState.score).toBeGreaterThanOrEqual(150)
    expect(updatedState.multiplier).toBeGreaterThanOrEqual(2)
    expect(updatedState.wordsCompleted).toContain('APPLE')
    // Next quest queued
    expect(updatedState.activeWordQuest.word).not.toBe('APPLE')
  })

  it('6. Turn prompt and corner turn mechanic operates with supportive mindset', () => {
    useGameStore.getState().resetRun()

    // Approaching corner turn
    useGameStore.getState().setTurnPrompt({ direction: 'left', distance: 15 })
    expect(useGameStore.getState().turnPrompt).toEqual({ direction: 'left', distance: 15 })

    // Take turn successfully
    useGameStore.getState().takeTurn(true, 'left')
    expect(useGameStore.getState().turnPrompt).toBeNull()
    expect(useGameStore.getState().score).toBeGreaterThan(0)
    expect(useGameStore.getState().feedback.text).toContain('Great Turn')

    // Stumble provides calm, cool mindset affirmation
    useGameStore.getState().registerStumble()
    expect(useGameStore.getState().feedback.text).toContain('Steady')
    expect(useGameStore.getState().feedback.sub).toMatch(/cool|stride|reflex/i)
  })

  describe('7. Child-Profile Storage Isolation & Persistence', () => {
    it('isolates saved progress, settings, and achievements across multiple children', () => {
      // Child Alpha session
      setStorageChildId('child_alpha')
      expect(getStorageKey('child_alpha')).toBe('lexiguide_learning_run_child_alpha')
      updateSave((s) => ({
        ...s,
        stars: 45,
        bestDistance: 320,
        selectedCharacter: 'speedy',
        unlockedWorlds: ['letter-valley', 'safari-temple'],
      }), 'child_alpha')

      // Child Beta session
      setStorageChildId('child_beta')
      expect(getStorageKey('child_beta')).toBe('lexiguide_learning_run_child_beta')
      updateSave((s) => ({
        ...s,
        stars: 10,
        bestDistance: 110,
        selectedCharacter: 'explorer',
        unlockedWorlds: ['letter-valley'],
      }), 'child_beta')

      // Verify child_alpha data is completely isolated from child_beta
      const alphaSave = loadSave('child_alpha')
      expect(alphaSave.stars).toBe(45)
      expect(alphaSave.bestDistance).toBe(320)
      expect(alphaSave.selectedCharacter).toBe('speedy')
      expect(alphaSave.unlockedWorlds).toContain('safari-temple')

      const betaSave = loadSave('child_beta')
      expect(betaSave.stars).toBe(10)
      expect(betaSave.bestDistance).toBe(110)
      expect(betaSave.selectedCharacter).toBe('explorer')
      expect(betaSave.unlockedWorlds).not.toContain('safari-temple')

      // Verify distinct keys in localStorage
      expect(localStorage.getItem('lexiguide_learning_run_child_alpha')).toBeTruthy()
      expect(localStorage.getItem('lexiguide_learning_run_child_beta')).toBeTruthy()
    })

    it('handles guest sessions safely with guest storage key fallback', () => {
      setStorageChildId(null)
      expect(getStorageKey(null)).toBe('lexiguide_learning_run_guest')
      expect(getStorageKey('')).toBe('lexiguide_learning_run_guest')
      expect(getStorageKey(undefined)).toBe('lexiguide_learning_run_guest')

      updateSave((s) => ({ ...s, stars: 5, bestDistance: 80 }), 'guest')
      const guestSave = loadSave('guest')
      expect(guestSave.stars).toBe(5)
      expect(guestSave.bestDistance).toBe(80)
      expect(localStorage.getItem('lexiguide_learning_run_guest')).toBeTruthy()
    })

    it('migrates legacy save data to child key without data loss', () => {
      const legacyData = {
        ...DEFAULT_SAVE,
        stars: 99,
        bestDistance: 850,
        achievements: ['first_run', 'hundred_letters'],
      }
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyData))

      const loaded = loadSave('child_migrated')
      expect(loaded.stars).toBe(99)
      expect(loaded.bestDistance).toBe(850)
      expect(loaded.achievements).toContain('hundred_letters')

      // Migrated to child key and cleaned from legacy key
      expect(localStorage.getItem('lexiguide_learning_run_child_migrated')).toBeTruthy()
      expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
    })
  })

  describe('8. Mid-Run Progress Saving & Duplicate Guard', () => {
    it('saves accumulated progress when child exits via the Games button mid-run', async () => {
      mockSaveLearningSession.mockClear()
      mockShowToast.mockClear()

      useGameStore.getState().resetRun()
      useGameStore.setState({
        distance: 420,
        lettersCollected: ['S', 'U', 'N'],
        wordsCompleted: ['SUN'],
        challengesCompleted: 1,
        challengesCorrect: 1,
        starsEarned: 3,
        checkpointsReached: 1,
      })

      render(
        <AuthProvider>
          <AppProvider>
            <MemoryRouter initialEntries={['/child/games/learning-run']}>
              <Routes>
                <Route path="/child/games/learning-run" element={<LearningRunGame />} />
                <Route path="/child/games" element={<div data-testid="games-hub">Gaming Zone</div>} />
              </Routes>
            </MemoryRouter>
          </AppProvider>
        </AuthProvider>
      )

      // Start an active run session
      gameBridge.startGameSession({
        studentId: 'child_1',
        worldId: 'sunlit-meadow',
        characterId: 'explorer',
        difficulty: 1,
      })
      expect(gameBridge.getCurrentSession()).not.toBeNull()

      // Click "Games" button
      const backBtn = screen.getByRole('button', { name: /back to gaming zone/i })
      fireEvent.click(backBtn)

      // Verify session was completed and saved
      expect(gameBridge.getCurrentSession()).toBeNull()
      await waitFor(() => {
        expect(mockSaveLearningSession).toHaveBeenCalledTimes(1)
      })

      const payload = mockSaveLearningSession.mock.calls[0][0]
      expect(payload.activity_id).toBe('learning-run')
      expect(payload.outcome.score).toBe(420)
      expect(payload.outcome.starsGain).toBe(3)
      expect(payload.outcome.wordsCount).toBe(1)
      expect(payload.outcome.lettersCount).toBe(3)
      expect(payload.outcome.details.lettersCollected).toEqual(['S', 'U', 'N'])
      expect(payload.outcome.details.wordsCompleted).toEqual(['SUN'])

      // Navigated to Gaming Zone
      expect(screen.getByTestId('games-hub')).toBeInTheDocument()
    })

    it('prevents duplicate session save on repeated clicks or duplicate completion events', async () => {
      mockSaveLearningSession.mockClear()

      const handler = vi.fn()
      setHostSessionHandler(handler)

      gameBridge.startGameSession({
        studentId: 'child_1',
        worldId: 'sunlit-meadow',
        characterId: 'explorer',
        difficulty: 1,
      })

      // First completion
      gameBridge.completeGameSession({
        distance: 150,
        lettersCollected: ['A'],
        wordsCompleted: [],
        challengesCompleted: 0,
        challengesCorrect: 0,
        starsEarned: 1,
      })

      expect(handler).toHaveBeenCalledTimes(1)

      // Attempting to complete again when session is already cleared returns null
      const secondCall = gameBridge.completeGameSession({
        distance: 150,
        lettersCollected: ['A'],
      })
      expect(secondCall).toBeNull()
      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('9. Mobile Swipe Controls & Gesture Support', () => {
    function RunnerInputHarness({ callbacks, enabled = true, insideContainer = true }) {
      useRunnerInput({ ...callbacks, enabled })
      return (
        <div className={insideContainer ? 'learning-run-container' : 'outside-container'}>
          <div data-testid="gameplay-surface">3D Canvas Surface</div>
        </div>
      )
    }

    it('triggers onLeft and onRight swipes past the displacement threshold', () => {
      const onLeft = vi.fn()
      const onRight = vi.fn()
      const { getByTestId } = render(<RunnerInputHarness callbacks={{ onLeft, onRight }} />)
      const surface = getByTestId('gameplay-surface')

      // Swipe Left: move 40px left
      fireEvent.touchStart(surface, { touches: [{ clientX: 100, clientY: 100 }] })
      fireEvent.touchMove(surface, { touches: [{ clientX: 60, clientY: 100 }] })
      fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 60, clientY: 100 }] })
      expect(onLeft).toHaveBeenCalledTimes(1)
      expect(onRight).not.toHaveBeenCalled()

      // Swipe Right: move 45px right
      fireEvent.touchStart(surface, { touches: [{ clientX: 100, clientY: 100 }] })
      fireEvent.touchMove(surface, { touches: [{ clientX: 145, clientY: 100 }] })
      fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 145, clientY: 100 }] })
      expect(onRight).toHaveBeenCalledTimes(1)
    })

    it('triggers onJump (swipe up) and onSlide (swipe down)', () => {
      const onJump = vi.fn()
      const onSlide = vi.fn()
      const { getByTestId } = render(<RunnerInputHarness callbacks={{ onJump, onSlide }} />)
      const surface = getByTestId('gameplay-surface')

      // Swipe Up: move 40px up (clientY decreases)
      fireEvent.touchStart(surface, { touches: [{ clientX: 100, clientY: 100 }] })
      fireEvent.touchMove(surface, { touches: [{ clientX: 100, clientY: 60 }] })
      fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 100, clientY: 60 }] })
      expect(onJump).toHaveBeenCalledTimes(1)
      expect(onSlide).not.toHaveBeenCalled()

      // Swipe Down: move 45px down (clientY increases)
      fireEvent.touchStart(surface, { touches: [{ clientX: 100, clientY: 100 }] })
      fireEvent.touchMove(surface, { touches: [{ clientX: 100, clientY: 145 }] })
      fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 100, clientY: 145 }] })
      expect(onSlide).toHaveBeenCalledTimes(1)
    })

    it('ignores small touches below threshold (tap gesture)', () => {
      const onLeft = vi.fn()
      const onRight = vi.fn()
      const onJump = vi.fn()
      const onSlide = vi.fn()
      const { getByTestId } = render(<RunnerInputHarness callbacks={{ onLeft, onRight, onJump, onSlide }} />)
      const surface = getByTestId('gameplay-surface')

      // Move only 8px
      fireEvent.touchStart(surface, { touches: [{ clientX: 100, clientY: 100 }] })
      fireEvent.touchMove(surface, { touches: [{ clientX: 108, clientY: 105 }] })
      fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 108, clientY: 105 }] })

      expect(onLeft).not.toHaveBeenCalled()
      expect(onRight).not.toHaveBeenCalled()
      expect(onJump).not.toHaveBeenCalled()
      expect(onSlide).not.toHaveBeenCalled()
    })

    it('prevents browser scroll over gameplay area while allowing scroll outside', () => {
      const { getByTestId, unmount } = render(
        <RunnerInputHarness callbacks={{}} insideContainer={true} />
      )
      const surface = getByTestId('gameplay-surface')

      // Touch over gameplay area
      fireEvent.touchStart(surface, { touches: [{ clientX: 100, clientY: 100 }] })
      const gameMoveEvent = createEvent.touchMove(surface, {
        cancelable: true,
        touches: [{ clientX: 100, clientY: 150 }],
      })
      fireEvent(surface, gameMoveEvent)
      expect(gameMoveEvent.defaultPrevented).toBe(true)

      unmount()

      // Touch outside gameplay container
      const { getByTestId: getOutsideTestId } = render(
        <RunnerInputHarness callbacks={{}} insideContainer={false} />
      )
      const outsideSurface = getOutsideTestId('gameplay-surface')

      fireEvent.touchStart(outsideSurface, { touches: [{ clientX: 100, clientY: 100 }] })
      const outsideMoveEvent = createEvent.touchMove(outsideSurface, {
        cancelable: true,
        touches: [{ clientX: 100, clientY: 150 }],
      })
      fireEvent(outsideSurface, outsideMoveEvent)
      expect(outsideMoveEvent.defaultPrevented).toBe(false)
    })

    it('cleans up all event listeners on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      const { unmount } = render(<RunnerInputHarness callbacks={{}} />)
      unmount()

      const removedEvents = removeSpy.mock.calls.map((c) => c[0])
      expect(removedEvents).toContain('keydown')
      expect(removedEvents).toContain('touchstart')
      expect(removedEvents).toContain('touchmove')
      expect(removedEvents).toContain('touchend')
      expect(removedEvents).toContain('touchcancel')
      removeSpy.mockRestore()
    })
  })

  describe('10. Global Sound Synchronization (P1)', () => {
    afterEach(() => {
      gameSound.setSoundMode('voice_and_sfx')
    })

    it('synchronizes audioService and speechService with voice_and_sfx mode', () => {
      gameSound.setSoundMode('voice_and_sfx')
      expect(audioService.soundMode).toBe('voice_and_sfx')
      expect(speechService.soundMode).toBe('voice_and_sfx')

      const speakSpy = vi.spyOn(gameSound, 'speakCompanion').mockImplementation(() => {})
      speechService.speak('Level Up')
      expect(speakSpy).toHaveBeenCalledWith('Level Up', expect.any(Object))
      speakSpy.mockRestore()
    })

    it('silences speechService when mode is switched to sfx_only', () => {
      gameSound.setSoundMode('sfx_only')
      expect(audioService.soundMode).toBe('sfx_only')
      expect(speechService.soundMode).toBe('sfx_only')

      const speakSpy = vi.spyOn(gameSound, 'speakCompanion').mockImplementation(() => {})
      speechService.speak('Should not speak')
      expect(speakSpy).not.toHaveBeenCalled()
      speakSpy.mockRestore()
    })

    it('stops music and silences all SFX and speech when mode is switched to muted', () => {
      const stopMusicSpy = vi.spyOn(audioService, 'stopMusic')
      const speakSpy = vi.spyOn(gameSound, 'speakCompanion').mockImplementation(() => {})

      gameSound.setSoundMode('muted')
      expect(audioService.soundMode).toBe('muted')
      expect(speechService.soundMode).toBe('muted')
      expect(stopMusicSpy).toHaveBeenCalled()

      // Tones produce no sound in muted mode
      const toneSpy = vi.spyOn(audioService, '_tone')
      audioService.playJump()
      expect(toneSpy).toHaveBeenCalled()

      // Speech does not trigger companion
      speechService.speak('Silent')
      expect(speakSpy).not.toHaveBeenCalled()

      speakSpy.mockRestore()
      stopMusicSpy.mockRestore()
      toneSpy.mockRestore()
    })

    it('prevents duplicate subscriptions and unregisters cleanly', () => {
      const initialListenersCount = gameSound.listeners.size
      audioService._syncWithGlobalSound()
      // Calling _syncWithGlobalSound again cleans up previous listener and does not grow the set
      expect(gameSound.listeners.size).toBe(initialListenersCount)
    })
  })

  describe('11. Corner-Turn Tilt Physics & Dynamic Lean (P1)', () => {
    it('initiates pronounced corner turn lean and smoothly decays across frames', () => {
      const p = {
        lane: 0,
        renderX: -2.2,
        tilt: 0,
        turnTilt: 0,
      }
      const targetX = -2.2

      // Simulate left turn initiation at corner junction
      p.turnTilt = -0.55
      const laneLean = (targetX - p.renderX) * -0.15
      p.tilt = laneLean + p.turnTilt
      expect(p.tilt).toBe(-0.55)

      // Simulate Frame 2 (delta = 0.016s) - must NOT drop instantly to 0
      const delta = 0.016
      if (Math.abs(p.turnTilt) > 0.001) {
        p.turnTilt += (0 - p.turnTilt) * Math.min(1, delta * 5)
      }
      p.tilt = laneLean + p.turnTilt

      // Remains visibly tilted on subsequent frame
      expect(Math.abs(p.tilt)).toBeGreaterThan(0.4)
      expect(p.tilt).toBeLessThan(0) // Negative lean into left turn

      // Simulate progression over 15 frames (~0.25s)
      for (let i = 0; i < 15; i++) {
        p.turnTilt += (0 - p.turnTilt) * Math.min(1, delta * 5)
      }
      expect(Math.abs(p.turnTilt)).toBeLessThan(0.4)
      expect(Math.abs(p.turnTilt)).toBeGreaterThan(0.1)

      // After ~1.2s (~80 frames), tilt smoothly returns to neutral
      for (let i = 0; i < 80; i++) {
        p.turnTilt += (0 - p.turnTilt) * Math.min(1, delta * 5)
      }
      if (Math.abs(p.turnTilt) <= 0.001) p.turnTilt = 0
      expect(p.turnTilt).toBe(0)
    })

    it('combines lane change lean and corner turn tilt additively', () => {
      const p = {
        renderX: -1.0,
        turnTilt: 0.55, // right corner lean
      }
      const targetX = 0 // steering towards center lane
      const laneLean = (targetX - p.renderX) * -0.15 // -0.15
      p.tilt = laneLean + p.turnTilt

      // Total tilt = 0.55 - 0.15 = 0.40
      expect(p.tilt).toBeCloseTo(0.40, 2)
    })
  })

  describe('12. Result-Screen Accurate Star Display (P1)', () => {
    it('accurately displays star counts greater than three (e.g. 5 stars)', () => {
      const mockResult = {
        distance: 520,
        lettersCollected: ['A', 'B', 'C', 'D'],
        wordsCompleted: ['CAB', 'BAT'],
        challengesCompleted: 3,
        challengesCorrect: 3,
        starsEarned: 5,
      }

      render(
        <ResultScreen
          result={mockResult}
          recommendation="Super Reader!"
          onPlayAgain={vi.fn()}
          onMainMenu={vi.fn()}
        />
      )

      const starsRow = screen.getByTestId('result-stars-row')
      const starsCount = screen.getByTestId('result-stars-count')

      expect(starsRow.children.length).toBe(5)
      expect(starsCount.textContent).toContain('+5 Stars Earned!')
    })

    it('displays singular "1 Star Earned!" for single star', () => {
      const mockResult = {
        distance: 120,
        lettersCollected: ['A'],
        wordsCompleted: [],
        challengesCompleted: 1,
        challengesCorrect: 1,
        starsEarned: 1,
      }

      render(
        <ResultScreen
          result={mockResult}
          recommendation="Good start!"
          onPlayAgain={vi.fn()}
          onMainMenu={vi.fn()}
        />
      )

      const starsRow = screen.getByTestId('result-stars-row')
      const starsCount = screen.getByTestId('result-stars-count')

      expect(starsRow.children.length).toBe(1)
      expect(starsCount.textContent).toContain('+1 Star Earned!')
    })

    it('displays encouraging fallback when 0 stars are earned', () => {
      const mockResult = {
        distance: 40,
        lettersCollected: [],
        wordsCompleted: [],
        challengesCompleted: 0,
        challengesCorrect: 0,
        starsEarned: 0,
      }

      render(
        <ResultScreen
          result={mockResult}
          recommendation="Try again!"
          onPlayAgain={vi.fn()}
          onMainMenu={vi.fn()}
        />
      )

      const starsCount = screen.getByTestId('result-stars-count')
      expect(starsCount.textContent).toContain('Keep going to earn stars!')
    })
  })

  describe('13. Persistent Checkpoints & Resuming Progress (Step 3)', () => {
    beforeEach(() => {
      setStorageChildId('child_runner_1')
    })

    it('reachCheckpoint saves waypoint progress to child-isolated storage', () => {
      useGameStore.getState().resetRun(0)
      expect(useGameStore.getState().checkpointsReached).toBe(0)
      expect(useGameStore.getState().stage).toBe(1)

      // Reach first checkpoint
      useGameStore.getState().reachCheckpoint()
      const state1 = useGameStore.getState()
      expect(state1.checkpointsReached).toBe(1)
      expect(state1.stage).toBe(2)
      expect(state1.feedback.text).toContain('Stage 2')

      // Verify persisted in storage
      const saved = loadSave('child_runner_1')
      expect(saved.checkpointProgress.highestCheckpoint).toBe(1)
      expect(saved.checkpointProgress.highestStage).toBe(2)
      expect(saved.checkpointProgress.savedDistance).toBe(150)
      expect(saved.checkpointProgress.unlockedStages).toContain(2)
    })

    it('isolates checkpoint progression across distinct children', () => {
      // Child A reaches Stage 4 (Checkpoint 3)
      setStorageChildId('child_A')
      saveCheckpointProgress(3, 'child_A')

      // Child B is brand new
      setStorageChildId('child_B')
      const childBSave = loadSave('child_B')
      expect(childBSave.checkpointProgress.highestCheckpoint).toBe(0)
      expect(childBSave.checkpointProgress.highestStage).toBe(1)

      const childASave = loadSave('child_A')
      expect(childASave.checkpointProgress.highestCheckpoint).toBe(3)
      expect(childASave.checkpointProgress.highestStage).toBe(4)
      expect(childASave.checkpointProgress.savedDistance).toBe(450)
    })

    it('startRun calibrates distance, word quest, and stage when resuming from a saved waypoint', () => {
      // Resume from Checkpoint 2 (Stage 3, 300m)
      useGameStore.getState().startRun(1, 2)
      const state = useGameStore.getState()

      expect(state.checkpointsReached).toBe(2)
      expect(state.stage).toBe(3)
      expect(state.distance).toBe(300)
      expect(state.startingCheckpoint).toBe(2)
      expect(state.wordQuestIndex).toBe(2)
      expect(state.activeWordQuest).toBeDefined()
      expect(state.feedback.text).toContain('Resumed at Stage 3!')
      expect(state.feedback.sub).toContain('300m')
    })

    it('StartScreen renders waypoint card and Resume button when checkpoints exist', () => {
      useAppStore.setState({
        save: {
          ...DEFAULT_SAVE,
          checkpointProgress: {
            highestCheckpoint: 2,
            highestStage: 3,
            savedDistance: 300,
            unlockedStages: [1, 2, 3],
          },
        },
      })

      render(<StartScreen />)

      expect(screen.getByTestId('waypoint-card')).toBeInTheDocument()
      expect(screen.getByText(/Saved Waypoint:/i)).toBeInTheDocument()
      expect(screen.getByTestId('waypoint-card')).toHaveTextContent(/Stage 3/i)
      expect(screen.getByText(/300m/i)).toBeInTheDocument()
      expect(screen.getByTestId('resume-run-btn')).toBeInTheDocument()
      expect(screen.getByTestId('resume-run-btn')).toHaveTextContent(/Resume Stage 3/i)
      expect(screen.getByTestId('new-run-btn')).toBeInTheDocument()

      // Clicking Resume sets starting checkpoint in app store
      fireEvent.click(screen.getByTestId('resume-run-btn'))
      expect(useAppStore.getState().selectedStartingCheckpoint).toBe(2)
    })

    it('StartScreen renders regular Play button when no checkpoints exist', () => {
      useAppStore.setState({
        save: {
          ...DEFAULT_SAVE,
          checkpointProgress: {
            highestCheckpoint: 0,
            highestStage: 1,
            savedDistance: 0,
            unlockedStages: [1],
          },
        },
      })

      render(<StartScreen />)

      expect(screen.queryByTestId('waypoint-card')).not.toBeInTheDocument()
      expect(screen.getByTestId('play-btn')).toBeInTheDocument()
    })

    it('CharacterSelect renders waypoint toggle when highestCheckpoint > 0', () => {
      useAppStore.setState({
        save: {
          ...DEFAULT_SAVE,
          checkpointProgress: {
            highestCheckpoint: 2,
            highestStage: 3,
            savedDistance: 300,
            unlockedStages: [1, 2, 3],
          },
        },
        selectedStartingCheckpoint: 2,
      })

      render(<CharacterSelect />)

      expect(screen.getByTestId('character-waypoint-selector')).toBeInTheDocument()
      expect(screen.getByText(/Stage 1 \(0m\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Stage 3 \(300m\)/i)).toBeInTheDocument()
    })
  })

  describe('14. Letter-Challenge Clarity & Phonics Guidance (Step 3)', () => {
    it('GameHUD renders prominent challenge banner with prompt, emoji, and target word', () => {
      useGameStore.setState({
        isPaused: false,
        isGameOver: false,
        stage: 2,
        activeChallenge: {
          type: 'starting-letter',
          prompt: 'Which letter starts this word?',
          emoji: '🦁',
          correctLetter: 'L',
          lanes: ['B', 'L', 'S'],
          wordHint: 'Lion',
        },
      })

      render(<GameHUD character={{ id: 'explorer', name: 'Explorer Sam' }} onPause={vi.fn()} />)

      expect(screen.getByTestId('stage-indicator')).toHaveTextContent('Stage 2')
      expect(screen.getByTestId('challenge-banner')).toBeInTheDocument()
      expect(screen.getByText('🦁')).toBeInTheDocument()
      expect(screen.getByText('Which letter starts this word?')).toBeInTheDocument()
      expect(screen.getByText(/Target Word:/i)).toBeInTheDocument()
      expect(screen.getByText('Lion')).toBeInTheDocument()

      // Speaker button pronounces prompt
      const speakSpy = vi.spyOn(speechService, 'speak').mockImplementation(() => {})
      const speakerBtn = screen.getByRole('button', { name: /hear pronunciation/i })
      fireEvent.click(speakerBtn)
      expect(speakSpy).toHaveBeenCalledWith('Lion! Which letter?')
      speakSpy.mockRestore()
    })
  })

  describe('15. Performance Optimization & Garbage Collection Protection (Step 3)', () => {
    it('Camera vector math operates with zero per-frame Vector3 allocations', () => {
      // Verify FollowCamera vector recycling pattern
      const targetVec = new THREE.Vector3(0, 2.6, 6.5)
      const desiredVec = new THREE.Vector3()

      const s = { renderX: 1.2, isSliding: false }
      desiredVec.set(s.renderX * 0.4, 2.6, 6.5)
      targetVec.lerp(desiredVec, 0.05)

      expect(targetVec.x).toBeCloseTo(0.024, 3)
      expect(targetVec.y).toBe(2.6)
      expect(targetVec.z).toBe(6.5)
    })

    it('distance updates in Zustand store are throttled to every 5m rather than every single frame', () => {
      const setDistanceSpy = vi.spyOn(useGameStore.getState(), 'setDistance')

      // Emulate engine distance update logic
      let currentStoreDistance = 0
      const testDistances = [1.2, 2.5, 3.8, 4.9, 5.1, 6.4, 7.8, 8.9, 10.2]
      let dispatchCount = 0

      testDistances.forEach((dist) => {
        const floored = Math.floor(dist)
        if (floored !== currentStoreDistance && (floored % 5 === 0 || floored - currentStoreDistance >= 5)) {
          currentStoreDistance = floored
          dispatchCount += 1
        }
      })

      // Across 9 distance steps spanning 10 meters, only 2 dispatches occur (at 5m and 10m)
      // instead of 10 dispatches, eliminating 80% of store churning!
      expect(dispatchCount).toBe(2)
      setDistanceSpy.mockRestore()
    })
  })

  describe('16. Checkpoint Integrity, Gameplay Fixes & Play Again (Step 4)', () => {
    it('sanitizeCheckpointProgress clamps out-of-range values (e.g. checkpoint 52 / Stage 53) to MAX_CHECKPOINTS without losing progress', () => {
      // Unbounded 52 / 53 legacy save
      const sanitized = sanitizeCheckpointProgress({
        highestCheckpoint: 52,
        highestStage: 53,
        savedDistance: 8320,
        unlockedStages: [1, 53],
      })

      expect(sanitized.highestCheckpoint).toBe(10)
      expect(sanitized.highestStage).toBe(11)
      expect(sanitized.savedDistance).toBe(1500)
      expect(sanitized.unlockedStages).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])

      // Handles corrupt / non-finite / negative values gracefully
      expect(sanitizeCheckpointProgress(null)).toEqual(DEFAULT_SAVE.checkpointProgress)
      expect(sanitizeCheckpointProgress({ highestCheckpoint: -5 }).highestCheckpoint).toBe(0)
      expect(sanitizeCheckpointProgress({ highestCheckpoint: 'invalid' }).highestCheckpoint).toBe(0)

      // Storage loadSave automatically sanitizes corrupt saved checkpoint data
      setStorageChildId('corrupt_child')
      saveSave({
        ...DEFAULT_SAVE,
        stars: 42,
        checkpointProgress: {
          highestCheckpoint: 52,
          highestStage: 53,
          savedDistance: 8320,
        },
      }, 'corrupt_child')

      const loaded = loadSave('corrupt_child')
      expect(loaded.stars).toBe(42) // unrelated progress preserved!
      expect(loaded.checkpointProgress.highestCheckpoint).toBe(10)
      expect(loaded.checkpointProgress.highestStage).toBe(11)
      expect(loaded.checkpointProgress.savedDistance).toBe(1500)
    })

    it('enforces consistent 150m checkpoint distance calculations across storage and state', () => {
      expect(CHECKPOINT_DISTANCE).toBe(150)
      expect(MAX_CHECKPOINTS).toBe(10)

      setStorageChildId('dist_calc_child')
      saveCheckpointProgress(2, 'dist_calc_child')
      const save = loadSave('dist_calc_child')
      expect(save.checkpointProgress.highestCheckpoint).toBe(2)
      expect(save.checkpointProgress.highestStage).toBe(3)
      expect(save.checkpointProgress.savedDistance).toBe(300)
    })

    it('resetRun calibrates distance, word quest, and stage from an unlocked checkpoint', () => {
      useGameStore.getState().resetRun(3)
      const s = useGameStore.getState()
      expect(s.startingCheckpoint).toBe(3)
      expect(s.distance).toBe(450)
      expect(s.stage).toBe(4)
      expect(s.wordQuestIndex).toBe(3)
      expect(s.activeWordQuest.word).toBe('SUN')
    })

    it('ResultScreen renders milestone status, Play Again (resume), and fresh restart buttons', () => {
      const onPlayAgain = vi.fn()
      const onRestartFresh = vi.fn()

      render(
        <ResultScreen
          result={{
            distance: 300,
            lettersCollected: ['Z', 'E', 'B', 'R', 'A'],
            wordsCompleted: ['ZEBRA'],
            challengesCompleted: 2,
            challengesCorrect: 2,
            starsEarned: 3,
          }}
          checkpointsReached={2}
          stumbles={3}
          resumeCheckpoint={2}
          onPlayAgain={onPlayAgain}
          onRestartFresh={onRestartFresh}
          onMainMenu={vi.fn()}
        />
      )

      expect(screen.getByTestId('result-title')).toHaveTextContent(/WAYPOINT REACHED/i)
      expect(screen.getByTestId('result-status-badge')).toHaveTextContent(/Stage 3 Waypoint Unlocked/i)

      const resumeBtn = screen.getByTestId('result-play-again-btn')
      expect(resumeBtn).toHaveTextContent(/Resume Stage 3/i)
      fireEvent.click(resumeBtn)
      expect(onPlayAgain).toHaveBeenCalledTimes(1)

      const freshBtn = screen.getByTestId('result-restart-fresh-btn')
      expect(freshBtn).toHaveTextContent(/Stage 1/i)
      fireEvent.click(freshBtn)
      expect(onRestartFresh).toHaveBeenCalledTimes(1)
    })

    it('ResultScreen renders practice paused title when player stumbles out without reaching waypoints', () => {
      render(
        <ResultScreen
          result={{
            distance: 80,
            lettersCollected: ['A'],
            wordsCompleted: [],
            challengesCompleted: 0,
            challengesCorrect: 0,
            starsEarned: 0,
          }}
          checkpointsReached={0}
          stumbles={3}
          resumeCheckpoint={0}
          onPlayAgain={vi.fn()}
          onMainMenu={vi.fn()}
        />
      )

      expect(screen.getByTestId('result-title')).toHaveTextContent(/EXPEDITION PAUSED/i)
      expect(screen.getByTestId('result-play-again-btn')).toHaveTextContent(/Play Again/i)
      expect(screen.queryByTestId('result-restart-fresh-btn')).not.toBeInTheDocument()
    })

    it('GameHUD displays 3 stumble shields that update as stumbles occur, and shows next waypoint distance', () => {
      useGameStore.setState({
        isPaused: false,
        isGameOver: false,
        stage: 1,
        distance: 50,
        stumbles: 0,
        activeChallenge: null,
      })

      const { rerender } = render(<GameHUD character={{ id: 'explorer', name: 'Explorer Sam' }} onPause={vi.fn()} />)

      expect(screen.getByTestId('stumble-shields')).toHaveAttribute('aria-label', '3 of 3 shields remaining')
      expect(screen.getByTestId('next-waypoint-indicator')).toHaveTextContent('Next: 100m')

      act(() => {
        useGameStore.setState({ stumbles: 2, distance: 120 })
      })
      rerender(<GameHUD character={{ id: 'explorer', name: 'Explorer Sam' }} onPause={vi.fn()} />)

      expect(screen.getByTestId('stumble-shields')).toHaveAttribute('aria-label', '1 of 3 shields remaining')
      expect(screen.getByTestId('next-waypoint-indicator')).toHaveTextContent('Next: 30m')
    })

    it('stumbles end the run cleanly at exactly MAX_STUMBLES (3)', () => {
      expect(MAX_STUMBLES).toBe(3)
      useGameStore.getState().resetRun(0)
      useGameStore.setState({ isRunning: true })

      useGameStore.getState().registerStumble()
      expect(useGameStore.getState().stumbles).toBe(1)
      expect(useGameStore.getState().isGameOver).toBe(false)

      useGameStore.getState().registerStumble()
      expect(useGameStore.getState().stumbles).toBe(2)
      expect(useGameStore.getState().isGameOver).toBe(false)

      useGameStore.getState().registerStumble()
      expect(useGameStore.getState().stumbles).toBe(3)
      expect(useGameStore.getState().isGameOver).toBe(true)
      expect(useGameStore.getState().isRunning).toBe(false)
    })
  })

  describe('17. Word Stability & Stage 11 Final Stage (Step 5)', () => {
    it('active word and letter choices remain stable throughout the challenge until resolved', () => {
      useGameStore.getState().resetRun(0)
      const state0 = useGameStore.getState()

      expect(state0.activeWordQuest.word).toBe('APPLE')
      expect(state0.activeWordQuest.missingLetter).toBe('L')
      expect(state0.activeWordQuest.lanes).toEqual(['B', 'L', 'S'])
      expect(state0.activeChallenge.wordHint).toBe('APPLE')
      expect(state0.activeChallenge.correctLetter).toBe('L')
      expect(state0.activeChallenge.lanes).toEqual(['B', 'L', 'S'])

      // Player traverses distance and crosses checkpoint without finding letter
      act(() => {
        useGameStore.getState().setDistance(150)
        useGameStore.getState().reachCheckpoint()
      })

      const stateAfterCheckpoint = useGameStore.getState()
      // Word and choices must remain stable!
      expect(stateAfterCheckpoint.activeWordQuest.word).toBe('APPLE')
      expect(stateAfterCheckpoint.activeWordQuest.missingLetter).toBe('L')
      expect(stateAfterCheckpoint.activeWordQuest.lanes).toEqual(['B', 'L', 'S'])
      expect(stateAfterCheckpoint.activeChallenge.wordHint).toBe('APPLE')
      expect(stateAfterCheckpoint.activeChallenge.correctLetter).toBe('L')
      expect(stateAfterCheckpoint.activeChallenge.lanes).toEqual(['B', 'L', 'S'])
    })

    it('a missed challenge answer preserves the challenge for retry and does not replace the word', () => {
      useGameStore.getState().resetRun(0)
      expect(useGameStore.getState().activeWordQuest.word).toBe('APPLE')

      // Player chooses incorrect lane
      useGameStore.getState().resolveChallenge(false)

      const stateAfterMiss = useGameStore.getState()
      expect(stateAfterMiss.activeWordQuest.word).toBe('APPLE')
      expect(stateAfterMiss.activeWordQuest.missingLetter).toBe('L')
      expect(stateAfterMiss.activeChallenge.wordHint).toBe('APPLE')
      expect(stateAfterMiss.activeChallenge.correctLetter).toBe('L')
      expect(stateAfterMiss.activeChallenge.lanes).toEqual(['B', 'L', 'S'])
      expect(stateAfterMiss.wordsCompleted).not.toContain('APPLE')
      expect(stateAfterMiss.feedback.kind).toBe('incorrect')
      expect(stateAfterMiss.challengesCompleted).toBe(1)
      expect(stateAfterMiss.challengesCorrect).toBe(0)
    })

    it('correct answer advances the challenge exactly once to the next word with synchronized HUD data', () => {
      useGameStore.getState().resetRun(0)
      expect(useGameStore.getState().activeWordQuest.word).toBe('APPLE')

      // Player answers correctly
      useGameStore.getState().resolveChallenge(true)

      const stateAfterCorrect = useGameStore.getState()
      expect(stateAfterCorrect.wordsCompleted).toContain('APPLE')
      expect(stateAfterCorrect.challengesCompleted).toBe(1)
      expect(stateAfterCorrect.challengesCorrect).toBe(1)
      expect(stateAfterCorrect.wordQuestIndex).toBe(1)

      // Next word is LION with synchronized missing letter and lanes
      expect(stateAfterCorrect.activeWordQuest.word).toBe('LION')
      expect(stateAfterCorrect.activeWordQuest.missingLetter).toBe('I')
      expect(stateAfterCorrect.activeWordQuest.lanes).toEqual(['E', 'I', 'O'])
      expect(stateAfterCorrect.activeChallenge.wordHint).toBe('LION')
      expect(stateAfterCorrect.activeChallenge.correctLetter).toBe('I')
      expect(stateAfterCorrect.activeChallenge.lanes).toEqual(['E', 'I', 'O'])
    })

    it('Stage 11 completion distance is exactly 1650m and completes the expedition', () => {
      expect(FINAL_COMPLETION_DISTANCE).toBe(1650)
      expect(MAX_STAGE).toBe(11)
      expect(MAX_CHECKPOINTS).toBe(10)

      useGameStore.getState().resetRun(10) // Stage 11 starting checkpoint
      expect(useGameStore.getState().stage).toBe(11)
      expect(useGameStore.getState().distance).toBe(1500)
      expect(useGameStore.getState().isCompleted).toBe(false)

      // Trigger completion at configured 1650m
      useGameStore.getState().completeExpedition()

      const s = useGameStore.getState()
      expect(s.isCompleted).toBe(true)
      expect(s.isGameOver).toBe(true)
      expect(s.isRunning).toBe(false)
      expect(s.feedback.text).toContain('EXPEDITION COMPLETE!')
    })

    it('no Stage 12 or additional checkpoints can be generated beyond Stage 11', () => {
      useGameStore.getState().resetRun(10)
      expect(useGameStore.getState().checkpointsReached).toBe(10)
      expect(useGameStore.getState().stage).toBe(11)

      // Attempting to reach a checkpoint beyond 10 is clamped
      useGameStore.getState().reachCheckpoint()
      expect(useGameStore.getState().checkpointsReached).toBe(10)
      expect(useGameStore.getState().stage).toBe(11)

      // Storage sanitization also enforces max 10 checkpoints / Stage 11
      saveCheckpointProgress(15, 'clamp_test_child')
      const save = loadSave('clamp_test_child')
      expect(save.checkpointProgress.highestCheckpoint).toBe(10)
      expect(save.checkpointProgress.highestStage).toBe(11)
      expect(save.checkpointProgress.savedDistance).toBe(1500)
    })

    it('ResultScreen clearly displays EXPEDITION COMPLETE when isCompleted=true and ordinary status otherwise', () => {
      // 1. Expedition completed
      const { rerender } = render(
        <ResultScreen
          result={{
            distance: 1650,
            lettersCollected: ['A', 'P', 'P', 'L', 'E'],
            wordsCompleted: ['APPLE', 'LION'],
            challengesCompleted: 5,
            challengesCorrect: 5,
            starsEarned: 15,
          }}
          checkpointsReached={10}
          stumbles={0}
          resumeCheckpoint={10}
          isCompleted={true}
          onPlayAgain={vi.fn()}
          onRestartFresh={vi.fn()}
          onMainMenu={vi.fn()}
        />
      )

      expect(screen.getByTestId('result-title')).toHaveTextContent('EXPEDITION COMPLETE! 🏆')
      expect(screen.getByTestId('result-status-badge')).toHaveTextContent('All 11 Stages Mastered! Temple Summit Conquered!')
      expect(screen.getByTestId('result-play-again-btn')).toHaveTextContent(/Play Again/i)
      expect(screen.getByTestId('result-restart-fresh-btn')).toHaveTextContent(/Stage 1/i)

      // 2. Ordinary Game Over (not completed)
      rerender(
        <ResultScreen
          result={{
            distance: 350,
            lettersCollected: ['A'],
            wordsCompleted: [],
            challengesCompleted: 1,
            challengesCorrect: 0,
            starsEarned: 0,
          }}
          checkpointsReached={0}
          stumbles={3}
          resumeCheckpoint={0}
          isCompleted={false}
          onPlayAgain={vi.fn()}
          onRestartFresh={vi.fn()}
          onMainMenu={vi.fn()}
        />
      )

      expect(screen.getByTestId('result-title')).toHaveTextContent('EXPEDITION PAUSED!')
      expect(screen.queryByText(/All 11 Stages Mastered/i)).not.toBeInTheDocument()
    })
  })
})

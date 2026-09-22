import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from '../context/AppContext'
import { AuthProvider } from '../context/AuthContext'
import LearningRunGame from '../pages/child/LearningRunGame'
import { GAMING_ZONE_GAMES } from '../data/gamingZoneRegistry'
import { gameBridge, setHostStudentId, setHostSessionHandler } from '../games/learning-run/services/integration/gameBridge'
import { useGameStore } from '../games/learning-run/game/engine/gameStore'

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
})

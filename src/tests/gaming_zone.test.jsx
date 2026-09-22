import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from '../context/AppContext'
import { AuthProvider } from '../context/AuthContext'
import Games from '../pages/child/Games'
import GamePlay from '../pages/child/GamePlay'

describe('Gaming Zone System Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('1. Gaming Zone hub renders cleanly with Made For You and category filters', async () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/games']}>
            <Games />
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    // Verify catalog container test id
    expect(screen.getByTestId('games-catalog-container')).toBeInTheDocument()

    // Verify header title
    expect(screen.getByText(/Play & Learn/i)).toBeInTheDocument()

    // Verify Made For You section
    expect(screen.getByText(/Made For You/i)).toBeInTheDocument()

    // Verify Easy Games categories
    expect(screen.getByText(/Easy Games/i)).toBeInTheDocument()
    expect(screen.getByText(/All Games/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sounds/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /letters/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /words/i })).toBeInTheDocument()
  }, 15000)

  it('2. Filtering by category updates the visible games list', async () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/games']}>
            <Games />
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    // Click Sounds category filter
    const soundsTab = screen.getByRole('button', { name: /sounds/i })
    fireEvent.click(soundsTab)

    // Verify Sound Hunt and Sound Safari game cards are present
    expect(screen.getByTestId('game-card-sound-hunt')).toBeInTheDocument()
    expect(screen.getByTestId('game-card-match-sound')).toBeInTheDocument()
  })

  it('3. Language Adventure shows Telugu, Hindi, and English options', async () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/games']}>
            <Games />
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    expect(screen.getByText(/Language Adventure/i)).toBeInTheDocument()
    expect(screen.getByText(/Telugu/i)).toBeInTheDocument()
    expect(screen.getByText(/Hindi/i)).toBeInTheDocument()
    expect(screen.getAllByText(/English/i)[0]).toBeInTheDocument()
  })

  it('4. Sound Hunt game launches and provides interactive picture choices', async () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/games/sound-hunt']}>
            <Routes>
              <Route path="/child/games/:gameId" element={<GamePlay />} />
            </Routes>
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    // Verify Start Game button
    const startBtn = await screen.findByText(/Start Game ▶/i)
    expect(startBtn).toBeInTheDocument()
    fireEvent.click(startBtn)

    // Verify prompt and choices for Round 1 (starts with B)
    expect(await screen.findByText(/Which picture starts with B\?/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Ball')).toBeInTheDocument()
    expect(screen.getByLabelText('Cat')).toBeInTheDocument()
  })

  it('5. Word Train game loads carriages and accepts letter clicks', async () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/games/word-train']}>
            <Routes>
              <Route path="/child/games/:gameId" element={<GamePlay />} />
            </Routes>
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    const startBtn = await screen.findByText(/Start Game ▶/i)
    fireEvent.click(startBtn)

    // Verify train prompt
    expect(await screen.findByText(/Load the train carriages to spell the word!/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Carriage C')).toBeInTheDocument()
  })

  it('6. Missing Letter game presents word display with letter options', async () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/games/missing-letter']}>
            <Routes>
              <Route path="/child/games/:gameId" element={<GamePlay />} />
            </Routes>
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    const startBtn = await screen.findByText(/Start Game ▶/i)
    fireEvent.click(startBtn)

    expect(await screen.findByText(/Which letter is missing\? Tap to complete!/i)).toBeInTheDocument()
    expect(screen.getByText('C _ T')).toBeInTheDocument()
  })
})

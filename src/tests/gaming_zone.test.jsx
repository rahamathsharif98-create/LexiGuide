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

    // Verify Sound Hunt and Cosmic Safari (with legacy match-sound alias) game cards are present
    expect(screen.getByTestId('game-card-sound-hunt')).toBeInTheDocument()
    expect(screen.getByTestId('game-card-cosmic-safari')).toBeInTheDocument()
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

  it('7. Cosmic Safari appears exactly once in the Games catalog with correct metadata', async () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/games']}>
            <Games />
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    // Cosmic Safari card appears exactly once in the catalog grid
    const cosmicSafariCards = screen.getAllByTestId('game-card-cosmic-safari')
    expect(cosmicSafariCards).toHaveLength(1)

    const card = cosmicSafariCards[0]
    expect(card).toHaveTextContent(/Cosmic Safari/i)
    expect(card).toHaveTextContent(/Hear animal phonemes and spot cosmic animal buddies across 25 progressive phonics levels!/i)
    expect(card).toHaveTextContent(/Ready 🌱/i)

    // Verify UFO 3D image
    const ufoImg = screen.getByAltText(/Cosmic Safari/i)
    expect(ufoImg).toBeInTheDocument()
    expect(ufoImg).toHaveAttribute('src', '/assets/games/cosmic-ufo.jpg')
  })

  it('8. Clicking Play on Cosmic Safari navigates to /child/games/cosmic-safari', async () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/games']}>
            <Routes>
              <Route path="/child/games" element={<Games />} />
              <Route path="/child/games/cosmic-safari" element={<div data-testid="cosmic-safari-game-screen">Cosmic Safari Game Screen</div>} />
            </Routes>
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    const cosmicCard = screen.getByTestId('game-card-cosmic-safari')
    const playBtn = cosmicCard.querySelector('button[aria-label="Play Cosmic Safari"]')
    expect(playBtn).toBeInTheDocument()
    fireEvent.click(playBtn)

    expect(await screen.findByTestId('cosmic-safari-game-screen')).toBeInTheDocument()
  })

  it('9. Sounds category filter displays Cosmic Safari exactly once alongside sound siblings', async () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/games']}>
            <Games />
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    const soundsTab = screen.getByRole('button', { name: /sounds/i })
    fireEvent.click(soundsTab)

    const cosmicCards = screen.getAllByTestId('game-card-cosmic-safari')
    expect(cosmicCards).toHaveLength(1)
    expect(screen.getByTestId('game-card-sound-hunt')).toBeInTheDocument()
    expect(screen.getByTestId('game-card-sound-match')).toBeInTheDocument()
    expect(screen.getByTestId('game-card-sound-rhythm')).toBeInTheDocument()
  })

  it('10. Favorite toggle for Cosmic Safari updates state and localStorage properly', async () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/games']}>
            <Games />
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    const cosmicCard = screen.getByTestId('game-card-cosmic-safari')
    const favBtn = cosmicCard.querySelector('button[aria-label*="favorites"]')
    expect(favBtn).toBeInTheDocument()

    // Default favorites includes match-sound and word-train, so initial click favorites cosmic-safari
    fireEvent.click(favBtn)
    expect(localStorage.getItem('lexi_favorite_games')).toContain('cosmic-safari')

    // Second click unfavorites
    fireEvent.click(favBtn)
    expect(localStorage.getItem('lexi_favorite_games')).not.toContain('cosmic-safari')
  })
})

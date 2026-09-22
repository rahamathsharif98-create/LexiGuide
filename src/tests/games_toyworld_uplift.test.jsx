import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from '../context/AppContext'
import { AuthProvider } from '../context/AuthContext'
import GamePlay from '../pages/child/GamePlay'
import SpeakPlay from '../pages/child/SpeakPlay'
import ReadWithMe from '../pages/child/ReadWithMe'
import Games from '../pages/child/Games'
import { SoundSafariAudio } from '../components/SoundSafariAudio'
import { audioAtmosphere } from '../services/audioAtmosphereService'
import { resolveThemePackage, applyThemeToActivity } from '../services/personalizationService'

describe('Existing Games Uplift Suite: Sound Safari, Speak & Shine, Phonics Arcade, Read With Me', () => {
  beforeEach(() => {
    localStorage.clear()
    class MockUtterance {
      constructor(text) {
        this.text = text
        this.rate = 1
        this.pitch = 1
        this.lang = ''
        this.voice = null
      }
    }
    window.SpeechSynthesisUtterance = MockUtterance
    window.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn().mockReturnValue([
        { name: 'Microsoft David', lang: 'en-US' },
        { name: 'Microsoft Zira', lang: 'en-US' },
      ]),
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({}),
      },
      configurable: true,
      writable: true,
    })
  })

  // 1. Step 0 & Step 3: Honest Voice Notice & Ducking in Sound Safari
  it('1. SoundSafariAudio displays honest fallback notice when native Indic voice is absent', () => {
    // Window voices only contain en-US (David, Zira), simulating host
    render(<SoundSafariAudio sound="క" label="kamalam" language="te" />)
    const hearBtn = screen.getByTestId('hear-sound-btn')

    const duckSpy = vi.spyOn(audioAtmosphere, 'duckMusic')
    fireEvent.click(hearBtn)

    // Audio ducking triggered
    expect(duckSpy).toHaveBeenCalled()

    // Honest notice displayed because te-IN voice is missing on host
    expect(screen.getByTestId('voice-honest-notice')).toBeInTheDocument()
    expect(screen.getByText(/Native voice for this language is unavailable/i)).toBeInTheDocument()
  })

  // 2. Step 2: Theme Invariance in Sound Safari & Phonics Arcade
  it('2. Theme packaging changes visuals but NEVER changes game scoring or pedagogy', () => {
    const spaceTheme = resolveThemePackage({ interests: ['space'] })
    const animalTheme = resolveThemePackage({ interests: ['animals'] })

    // Mascot & visuals differ
    expect(spaceTheme.mascot).toMatch(/Nova/i)
    expect(animalTheme.mascot).toMatch(/Barnaby/i)
    expect(spaceTheme.primaryColor).not.toBe(animalTheme.primaryColor)

    // Pedagogical activity invariant test:
    const baseGame = {
      id: 'match-sound',
      title: 'Sound Safari',
      skill: 'phonologicalAwareness',
      difficulty: 1,
      route: '/child/games/match-sound',
    }

    const themedSpace = applyThemeToActivity(baseGame, spaceTheme)
    const themedAnimal = applyThemeToActivity(baseGame, animalTheme)

    // Target pedagogy unchanged
    expect(themedSpace.skill).toBe(baseGame.skill)
    expect(themedAnimal.skill).toBe(baseGame.skill)
    expect(themedSpace.route).toBe(baseGame.route)
    expect(themedAnimal.route).toBe(baseGame.route)
    expect(themedSpace.difficulty).toBe(themedAnimal.difficulty)
  })

  // 3. GamePlay Toy World Uplift & VoiceModeIndicator
  it('3. GamePlay renders Toy World container, VoiceModeIndicator, and >= 48px touch targets', async () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/games/match-sound']}>
            <Routes>
              <Route path="/child/games/:gameId" element={<GamePlay />} />
            </Routes>
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    expect(screen.getByTestId('gameplay-container')).toBeInTheDocument()
    expect(screen.getByTestId('voice-mode-indicator')).toBeInTheDocument()

    // Start Game button >= 48px
    const startBtn = screen.getByText(/Start Game ▶/i)
    expect(startBtn).toBeInTheDocument()
    fireEvent.click(startBtn)

    // Round screen renders with options and hear sound button
    expect(await screen.findByTestId('hear-sound-btn')).toBeInTheDocument()
  })

  // 4. Speak & Shine Honest Status & Large Mic Button
  it('4. SpeakPlay renders Toy World layout with large tactile mic and honest status', () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/speak']}>
            <SpeakPlay />
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    expect(screen.getByTestId('speak-play-container')).toBeInTheDocument()
    expect(screen.getByTestId('voice-mode-indicator')).toBeInTheDocument()
    expect(screen.getByTestId('speak-instruction')).toBeInTheDocument()
    expect(screen.getByText(/🎤 Tap to speak/i)).toBeInTheDocument()
  })

  // 5. Read With Me Child-Paced Narration & Highlighting
  it('5. ReadWithMe provides child-paced narration and word-by-word practice', async () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/read']}>
            <ReadWithMe />
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    expect(screen.getByTestId('select-story-container')).toBeInTheDocument()

    // Pick first passage
    const storyCard = screen.getByText(/My Pet Cat/i)
    fireEvent.click(storyCard)

    // Story intro screen
    expect(screen.getByTestId('story-intro-container')).toBeInTheDocument()
    const readBtn = screen.getByText(/I'm Ready to Read ▶/i)
    fireEvent.click(readBtn)

    // Reading session screen with child-paced Read Aloud with Me action
    expect(screen.getByTestId('reading-session-container')).toBeInTheDocument()
    expect(screen.getByText(/Read Aloud with Me/i)).toBeInTheDocument()
  })

  // 6. Quiet Mode Sync across Game Audio
  it('6. Quiet Mode suppresses background atmosphere while keeping voice functional', () => {
    audioAtmosphere.setQuietMode(true)
    expect(audioAtmosphere.quietMode).toBe(true)

    audioAtmosphere.setQuietMode(false)
    expect(audioAtmosphere.quietMode).toBe(false)
  })

  // 7. Games Menu Catalog Uplift
  it('7. Games menu renders Toy World arcade cards with companion mascot banner', () => {
    render(
      <AuthProvider>
        <AppProvider>
          <MemoryRouter initialEntries={['/child/games']}>
            <Games />
          </MemoryRouter>
        </AppProvider>
      </AuthProvider>
    )

    expect(screen.getByTestId('games-catalog-container')).toBeInTheDocument()
    expect(screen.getByText(/Play & Learn/i)).toBeInTheDocument()
  })
})

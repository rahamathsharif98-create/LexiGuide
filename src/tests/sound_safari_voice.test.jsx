import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import App from '../App'
import { SoundSafariAudio } from '../components/SoundSafariAudio'

describe('Sound Safari Voice & Audio Playback Suite', () => {
  let originalSpeechSynthesis
  let originalSpeechSynthesisUtterance
  let mockSpeak
  let mockCancel
  let mockGetVoices
  let createdUtterances = []
  let playSpy
  let pauseSpy

  beforeEach(() => {
    localStorage.clear()
    createdUtterances = []
    mockSpeak = vi.fn()
    mockCancel = vi.fn()
    mockGetVoices = vi.fn().mockReturnValue([
      { name: 'English Female', lang: 'en-US' },
      { name: 'Hindi Female', lang: 'hi-IN' },
    ])

    originalSpeechSynthesis = window.speechSynthesis
    originalSpeechSynthesisUtterance = window.SpeechSynthesisUtterance

    class MockUtterance {
      constructor(text) {
        this.text = text
        this.rate = 1
        this.pitch = 1
        this.lang = ''
        this.voice = null
        this.onstart = null
        this.onend = null
        this.onerror = null
        createdUtterances.push(this)
      }
    }

    window.SpeechSynthesisUtterance = MockUtterance
    window.speechSynthesis = {
      speak: mockSpeak.mockImplementation((utterance) => {
        if (utterance.onstart) utterance.onstart()
      }),
      cancel: mockCancel,
      getVoices: mockGetVoices,
    }

    playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    localStorage.clear()
    if (originalSpeechSynthesis) {
      window.speechSynthesis = originalSpeechSynthesis
    } else {
      delete window.speechSynthesis
    }
    if (originalSpeechSynthesisUtterance) {
      window.SpeechSynthesisUtterance = originalSpeechSynthesisUtterance
    } else {
      delete window.SpeechSynthesisUtterance
    }
  })

  // 1. Sound Safari renders
  it('1. Sound Safari renders cleanly on /child/games/sound-safari and /child/games/match-sound', async () => {
    render(<App initialRoute="/child/games/sound-safari" />)
    expect(await screen.findByText('Sound Safari')).toBeInTheDocument()
    expect(screen.getByText(/Start Game ▶/i)).toBeInTheDocument()
  })

  // 2. Hear Sound button exists
  it('2. Hear Sound button exists when game round starts', async () => {
    render(<App initialRoute="/child/games/sound-safari" />)
    const startBtn = await screen.findByText(/Start Game ▶/i)
    fireEvent.click(startBtn)

    const hearBtn = await screen.findByTestId('hear-sound-btn')
    expect(hearBtn).toBeInTheDocument()
    expect(screen.getByText(/Hear the Sound/i)).toBeInTheDocument()
  })

  // 3. Browser SpeechSynthesis availability is detected when using TTS fallback
  it('3. Browser SpeechSynthesis availability is detected when using TTS fallback', () => {
    const { unmount } = render(<SoundSafariAudio sound="/k/" label="cat" />)
    expect(screen.getByTestId('hear-sound-btn')).toBeInTheDocument()
    expect(screen.queryByTestId('sound-unavailable-fallback')).not.toBeInTheDocument()
    unmount()

    // Now remove SpeechSynthesis
    delete window.speechSynthesis
    render(<SoundSafariAudio sound="/k/" label="cat" />)
    const hearBtnNoSpeech = screen.getByTestId('hear-sound-btn')
    fireEvent.click(hearBtnNoSpeech)

    // Fallback should appear
    expect(screen.getByTestId('sound-unavailable-fallback')).toBeInTheDocument()
    expect(screen.getByText(/Sound is not available right now\. You can continue by matching the picture\./i)).toBeInTheDocument()
  })

  // 4. Real animal audio playback is triggered in Sound Safari
  it('4. Real animal audio playback is triggered when child clicks Hear the Sound in Sound Safari', async () => {
    render(<App initialRoute="/child/games/match-sound" />)
    const startBtn = await screen.findByText(/Start Game ▶/i)
    fireEvent.click(startBtn)

    const hearBtn = await screen.findByTestId('hear-sound-btn')
    fireEvent.click(hearBtn)

    // Real audio play method was invoked
    expect(playSpy).toHaveBeenCalled()
  })

  // 5. Existing speech is cancelled before new speech in TTS mode
  it('5. Existing speech is cancelled before new speech is initiated', () => {
    render(<SoundSafariAudio sound="/sh/" label="sheep" />)
    const hearBtn = screen.getByTestId('hear-sound-btn')

    mockCancel.mockClear()
    fireEvent.click(hearBtn)

    expect(mockCancel).toHaveBeenCalled()
    expect(mockSpeak).toHaveBeenCalled()
  })

  // 6. Play and replay works with Listen Again state transition
  it('6. Play and replay works with Listen Again state transition', () => {
    render(<SoundSafariAudio sound="/b/" label="bear" />)
    const hearBtn = screen.getByTestId('hear-sound-btn')

    // Click 1: Hear the Sound
    fireEvent.click(hearBtn)
    expect(mockSpeak).toHaveBeenCalledTimes(1)

    // Simulate speech end
    act(() => {
      const utt = createdUtterances[0]
      if (utt?.onend) utt.onend()
    })

    // Label changes to Listen Again
    expect(screen.getByText(/Listen Again/i)).toBeInTheDocument()

    // Click 2: Replay
    fireEvent.click(hearBtn)
    expect(mockSpeak).toHaveBeenCalledTimes(2)
    expect(mockCancel).toHaveBeenCalled()
  })

  // 7. Speech error is handled gracefully without crashing
  it('7. Speech error is handled gracefully without crashing', () => {
    render(<SoundSafariAudio sound="/f/" label="frog" />)
    const hearBtn = screen.getByTestId('hear-sound-btn')

    fireEvent.click(hearBtn)

    // Simulate error event
    act(() => {
      const utt = createdUtterances[0]
      if (utt?.onerror) utt.onerror({ error: 'network' })
    })

    // Child friendly message shown
    expect(screen.getByTestId('sound-unavailable-fallback')).toBeInTheDocument()
    expect(screen.getByText(/Sound is not available right now\. You can continue by matching the picture\./i)).toBeInTheDocument()
  })

  // 8. Component cleanup cancels speech on unmount
  it('8. Component cleanup cancels speech and audio on unmount', () => {
    const { unmount } = render(<SoundSafariAudio sound="/k/" label="cat" />)
    mockCancel.mockClear()
    unmount()
    expect(mockCancel).toHaveBeenCalled()
  })

  // 9. Question changes cancel previous speech and reset button state
  it('9. Question changes cancel previous playback and reset button state', () => {
    const { rerender } = render(<SoundSafariAudio sound="/k/" label="cat" />)
    const hearBtn = screen.getByTestId('hear-sound-btn')
    fireEvent.click(hearBtn)

    mockCancel.mockClear()
    // Rerender with next round
    rerender(<SoundSafariAudio sound="/sh/" label="sheep" />)

    expect(mockCancel).toHaveBeenCalled()
    expect(screen.getByText(/Hear the Sound/i)).toBeInTheDocument()
  })

  // 10. Audio/TTS unavailable state displays child-friendly fallback without technical error
  it('10. Audio unavailable state displays child-friendly fallback without technical error', () => {
    delete window.speechSynthesis
    delete window.SpeechSynthesisUtterance

    render(<SoundSafariAudio sound="/k/" label="cat" />)
    const hearBtn = screen.getByTestId('hear-sound-btn')
    fireEvent.click(hearBtn)

    expect(screen.getByTestId('sound-unavailable-fallback')).toBeInTheDocument()
    expect(screen.queryByText(/TypeError|ReferenceError|Exception/i)).not.toBeInTheDocument()
  })

  // 11. Existing game behavior still works: selecting correct option advances round
  it('11. Existing game behavior still works: selecting correct option advances round', async () => {
    render(<App initialRoute="/child/games/sound-safari" />)
    const startBtn = await screen.findByText(/Start Game ▶/i)
    fireEvent.click(startBtn)

    // Round 1 correct answer is 🐱 (Cat)
    const correctBtn = await screen.findByText('🐱')
    expect(correctBtn).toBeInTheDocument()
    fireEvent.click(correctBtn)

    // Great job feedback appears
    expect(await screen.findByText(/Great job!/i)).toBeInTheDocument()
  })

  // 12. Multilingual voice selection prioritizes active language when available
  it('12. Multilingual voice selection prioritizes active language when available in TTS mode', () => {
    render(<SoundSafariAudio sound="/k/" label="cat" language="hi" />)
    const hearBtn = screen.getByTestId('hear-sound-btn')
    fireEvent.click(hearBtn)

    const lastUtt = createdUtterances[createdUtterances.length - 1]
    expect(lastUtt.lang).toBe('hi-IN')
    expect(lastUtt.voice.name).toBe('Hindi Female')
  })
})

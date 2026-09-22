import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TraceAndSpeak from '../pages/child/TraceAndSpeak'
import Settings from '../pages/child/Settings'
import { AppProvider } from '../context/AppContext'
import { AuthProvider } from '../context/AuthContext'
import VoiceModeIndicator from '../components/VoiceModeIndicator'
import { audioAtmosphere } from '../services/audioAtmosphereService'

describe('Phases 6–12: Voice Baseline, Telugu/Hindi Bridge, Trace & Speak, Music & Comfort', () => {
  beforeEach(() => {
    localStorage.clear()
    class MockUtterance {
      constructor(text) {
        this.text = text
        this.rate = 1
        this.pitch = 1
      }
    }
    window.SpeechSynthesisUtterance = MockUtterance
    window.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn().mockReturnValue([
        { name: 'Telugu Voice', lang: 'te-IN' },
        { name: 'Hindi Voice', lang: 'hi-IN' },
        { name: 'English Voice', lang: 'en-US' },
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

  it('1. VoiceModeIndicator honestly labels local browser voice and microphone readiness', () => {
    render(<VoiceModeIndicator />)
    expect(screen.getByTestId('voice-mode-indicator')).toBeInTheDocument()
    expect(screen.getByText(/Local Voice/i)).toBeInTheDocument()
    expect(screen.getByText(/Mic Ready/i)).toBeInTheDocument()
  })

  it('2. Trace & Speak canvas renders and handles multilingual Telugu & Hindi letter practice', () => {
    render(<TraceAndSpeak initialLanguage="te" />)

    expect(screen.getByTestId('trace-and-speak-game')).toBeInTheDocument()
    expect(screen.getByTestId('tracing-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('speech-practice-btn')).toBeInTheDocument()

    // Listen audio
    const listenBtn = screen.getByLabelText(/Hear pronunciation/i)
    fireEvent.click(listenBtn)
    expect(window.speechSynthesis.speak).toHaveBeenCalled()

    // Switch to Hindi
    fireEvent.click(screen.getByText('हिन्दी'))
    expect(screen.getAllByText(/कमल/i).length).toBeGreaterThan(0)
  })

  it('3. Audio Atmosphere ducking and quiet mode controls', () => {
    audioAtmosphere.duckMusic()
    expect(audioAtmosphere.audioDuckingEnabled).toBe(true)

    audioAtmosphere.setQuietMode(true)
    expect(audioAtmosphere.quietMode).toBe(true)

    audioAtmosphere.setQuietMode(false)
    expect(audioAtmosphere.quietMode).toBe(false)
  })

  it('4. My Comfort & Focus controls in Settings', () => {
    render(
      <AuthProvider>
        <AppProvider>
          <Settings />
        </AppProvider>
      </AuthProvider>
    )

    expect(screen.getByTestId('my-comfort-settings')).toBeInTheDocument()
    expect(screen.getByText(/Focus Mode/i)).toBeInTheDocument()
    expect(screen.getByText(/Quiet Mode/i)).toBeInTheDocument()
    expect(screen.getByText(/Voice Pace/i)).toBeInTheDocument()

    // Test voice comfort sound sample
    const voiceSampleBtn = screen.getByLabelText(/Test voice comfort/i)
    fireEvent.click(voiceSampleBtn)
    expect(window.speechSynthesis.speak).toHaveBeenCalled()
  })
})

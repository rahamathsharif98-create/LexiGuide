import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

describe('Phase 5: Personalized Child Home Screen', () => {
  beforeEach(() => {
    localStorage.clear()
    class MockUtterance {
      constructor(text) {
        this.text = text
      }
    }
    window.SpeechSynthesisUtterance = MockUtterance
    window.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
    }
  })

  it('1. Displays personalized theme welcome banner with theme greeting and audio button', async () => {
    render(<App initialRoute="/child/home" />)

    // The personalized theme banner is present
    const banner = await screen.findByTestId('personalized-theme-banner')
    expect(banner).toBeInTheDocument()

    // Listen audio welcome button
    const listenBtn = screen.getByLabelText(/Listen to theme welcome/i)
    expect(listenBtn).toBeInTheDocument()
    fireEvent.click(listenBtn)
    expect(window.speechSynthesis.speak).toHaveBeenCalled()
  })

  it('2. Shows themed hero activity recommendation without altering underlying practice path', async () => {
    render(<App initialRoute="/child/home" />)

    const heroBtn = await screen.findByTestId('hero-activity-btn')
    expect(heroBtn).toBeInTheDocument()

    expect(screen.getByText(/Continue Learning/i)).toBeInTheDocument()
    expect(heroBtn).toHaveTextContent(/PLAY/i)
  })
})

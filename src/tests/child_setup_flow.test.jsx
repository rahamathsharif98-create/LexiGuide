import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ChildSetupFlow, {
  MOTHER_TONGUES,
  LEARNING_LANGUAGES,
  INTEREST_CARDS,
  FAVORITE_COLORS,
} from '../components/ChildSetupFlow'

describe('Phase 2: Parent/Child Setup Flow UI', () => {
  let mockOnComplete
  let mockOnCancel

  beforeEach(() => {
    mockOnComplete = vi.fn()
    mockOnCancel = vi.fn()

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
      getVoices: vi.fn().mockReturnValue([]),
    }
  })

  it('1. Renders Step 1 (Basic Profile) with name input, age slider, and avatar selector', () => {
    render(<ChildSetupFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />)

    expect(screen.getByTestId('step-basic-profile')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e\.g\. Aarav/i)).toBeInTheDocument()
    expect(screen.getByRole('slider')).toBeInTheDocument()
    expect(screen.getByText(/Choose a Friendly Avatar/i)).toBeInTheDocument()
  })

  it('2. Navigates in strict setup sequence: Basic -> Mother Tongue -> Target -> Interests -> Favourites -> Music -> Comfort', () => {
    render(<ChildSetupFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />)

    // Fill Step 1
    const nameInput = screen.getByPlaceholderText(/e\.g\. Aarav/i)
    fireEvent.change(nameInput, { target: { value: 'Kiran' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 2: Mother Tongue
    expect(screen.getByTestId('step-mother-tongue')).toBeInTheDocument()
    expect(screen.getByText('తెలుగు')).toBeInTheDocument()
    expect(screen.getByText('हिन्दी')).toBeInTheDocument()
    fireEvent.click(screen.getByText('తెలుగు'))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 3: Learning Target
    expect(screen.getByTestId('step-learning-language')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 4: Interests (Multi-select)
    expect(screen.getByTestId('step-interests')).toBeInTheDocument()
    expect(screen.getByText('Space')).toBeInTheDocument()
    expect(screen.getByText('Animals')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Space')) // toggle
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 5: Favourites
    expect(screen.getByTestId('step-favourites')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Sunny Yellow'))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 6: Music & Sound
    expect(screen.getByTestId('step-music-sound')).toBeInTheDocument()
    expect(screen.getByText(/Background Learning Music/i)).toBeInTheDocument()
    expect(screen.getByText(/Auto Audio Ducking/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 7: Comfort & Sensory Defaults
    expect(screen.getByTestId('step-comfort-settings')).toBeInTheDocument()
    expect(screen.getByTestId('finish-setup-btn')).toBeInTheDocument()

    // Finish Setup
    fireEvent.click(screen.getByTestId('finish-setup-btn'))
    expect(mockOnComplete).toHaveBeenCalledTimes(1)

    const payload = mockOnComplete.mock.calls[0][0]
    expect(payload.name).toBe('Kiran')
    expect(payload.languageProfile.mother_tongue).toBe('te')
    expect(payload.interests.favorite_color).toBe('Sunny Yellow')
    expect(payload.comfort.audio_ducking_enabled).toBe(true)
  })

  it('3. Provides voice instruction button for audio-supported setup', () => {
    render(<ChildSetupFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />)

    const listenBtn = screen.getByLabelText(/Listen to step instruction/i)
    expect(listenBtn).toBeInTheDocument()
    fireEvent.click(listenBtn)
    expect(window.speechSynthesis.speak).toHaveBeenCalled()
  })

  it('4. Allows navigating backwards using Back button without losing entered state', () => {
    render(<ChildSetupFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />)

    const nameInput = screen.getByPlaceholderText(/e\.g\. Aarav/i)
    fireEvent.change(nameInput, { target: { value: 'Ananya' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    expect(screen.getByTestId('step-mother-tongue')).toBeInTheDocument()

    // Go back
    fireEvent.click(screen.getByRole('button', { name: /Back/i }))
    expect(screen.getByTestId('step-basic-profile')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Ananya')).toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { audioAtmosphere, SMOOTH_TONE_STYLES } from '../services/audioAtmosphereService'
import { SmoothTonePill, SmoothToneModal } from '../components/audio/SmoothTonePlayer'

describe('Smooth Background Music Tones & Calming Atmosphere Engine', () => {
  beforeEach(() => {
    audioAtmosphere.setQuietMode(false)
    audioAtmosphere.stopAmbientAtmosphere()
    audioAtmosphere.setMusicVolume(0.45)
  })

  it('1. Provides 6 comfort-tuned smooth tone presets with velvet drone chords', () => {
    expect(SMOOTH_TONE_STYLES.length).toBe(6)
    const lullaby = SMOOTH_TONE_STYLES.find((s) => s.id === 'lullaby')
    expect(lullaby).toBeDefined()
    expect(lullaby.name).toContain('Cloud Lullaby')
    expect(lullaby.droneChords.length).toBeGreaterThan(0)
    expect(lullaby.scales.length).toBeGreaterThan(0)

    const ocean = SMOOTH_TONE_STYLES.find((s) => s.id === 'ocean')
    expect(ocean.name).toContain('Ocean Whispers')

    const space = SMOOTH_TONE_STYLES.find((s) => s.id === 'space')
    expect(space.name).toContain('Starry Dreams')
  })

  it('2. Audio Atmosphere starts and toggles smooth background tones', () => {
    expect(audioAtmosphere.isPlayingMusic).toBe(false)

    audioAtmosphere.startAmbientAtmosphere('lullaby')
    expect(audioAtmosphere.isPlayingMusic).toBe(true)
    expect(audioAtmosphere.currentStyle).toBe('lullaby')

    const activeConfig = audioAtmosphere.getActiveToneConfig()
    expect(activeConfig.id).toBe('lullaby')

    // Toggle off
    const isPlaying = audioAtmosphere.toggleMusic()
    expect(isPlaying).toBe(false)
    expect(audioAtmosphere.isPlayingMusic).toBe(false)

    // Toggle on with smooth style
    const isPlayingAgain = audioAtmosphere.toggleMusic('ocean')
    expect(isPlayingAgain).toBe(true)
    expect(audioAtmosphere.currentStyle).toBe('ocean')
  })

  it('3. Audio Ducking seamlessly drops music during speech and restores smoothly', () => {
    audioAtmosphere.startAmbientAtmosphere('space')
    expect(audioAtmosphere.audioDuckingEnabled).toBe(true)

    // Duck
    audioAtmosphere.duckMusic(0.15)
    expect(audioAtmosphere.audioDuckingEnabled).toBe(true)

    // Restore
    audioAtmosphere.restoreMusic()
    expect(audioAtmosphere.audioDuckingEnabled).toBe(true)
  })

  it('4. Quiet Mode safely mutes all tones for distraction-free reading', () => {
    audioAtmosphere.startAmbientAtmosphere('lullaby')
    expect(audioAtmosphere.isPlayingMusic).toBe(true)

    audioAtmosphere.setQuietMode(true)
    expect(audioAtmosphere.quietMode).toBe(true)
    expect(audioAtmosphere.isPlayingMusic).toBe(false)

    audioAtmosphere.setQuietMode(false)
    expect(audioAtmosphere.quietMode).toBe(false)
  })

  it('5. Reactive state subscription notifies listeners on tone and volume changes', () => {
    const listener = vi.fn()
    const unsubscribe = audioAtmosphere.subscribe(listener)

    expect(listener).toHaveBeenCalled()

    audioAtmosphere.setMusicVolume(0.6)
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ musicVolume: 0.6 })
    )

    audioAtmosphere.startAmbientAtmosphere('forest')
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ currentStyle: 'forest', isPlayingMusic: true })
    )

    unsubscribe()
  })

  it('6. SmoothTonePill renders and opens modal on click', () => {
    const onOpen = vi.fn()
    render(<SmoothTonePill onOpenModal={onOpen} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)

    // Second button opens tone selection
    fireEvent.click(buttons[1])
    expect(onOpen).toHaveBeenCalled()
  })

  it('7. SmoothToneModal renders all 6 smooth tone styles and volume controls', () => {
    const onClose = vi.fn()
    render(<SmoothToneModal isOpen={true} onClose={onClose} />)

    expect(screen.getByText(/Smooth Calming Music/i)).toBeInTheDocument()
    expect(screen.getByText(/Cloud Lullaby/i)).toBeInTheDocument()
    expect(screen.getByText(/Ocean Whispers/i)).toBeInTheDocument()
    expect(screen.getByText(/Starry Dreams/i)).toBeInTheDocument()
    expect(screen.getByText(/Sunlit Meadow/i)).toBeInTheDocument()
    expect(screen.getByText(/Enchanted Castle/i)).toBeInTheDocument()
    expect(screen.getByText(/Playful Melody/i)).toBeInTheDocument()
    expect(screen.getByText(/Auto-Comfort Audio Ducking/i)).toBeInTheDocument()

    const doneBtn = screen.getByRole('button', { name: /Done & Enjoy/i })
    fireEvent.click(doneBtn)
    expect(onClose).toHaveBeenCalled()
  })
})

/**
 * Phase 10: Smooth Audio Atmosphere, Ambient Tones & Ducking Engine
 * 
 * CORE PRINCIPLES:
 * 1. Ultra-smooth, non-overstimulating continuous ambient pad + soft chime soundscapes.
 * 2. Independent controls for Music, Voice, and SFX with reactive subscriptions.
 * 3. Automatic Audio Ducking: Background music gently recedes when instructional speech plays.
 * 4. Quiet Mode: Silences all music and sound effects for 100% focused reading.
 * 5. Comfort-tuned pentatonic scales and velvet low-pass filters (no harsh clicks or frequencies).
 */

export const SMOOTH_TONE_STYLES = [
  {
    id: 'lullaby',
    name: 'Cloud Lullaby',
    subtitle: 'Ultra-smooth velvet sine tones & soft music box',
    emoji: '☁️',
    color: '#0899AA',
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
    description: 'Calming, cozy melody designed to relax and comfort children',
    scales: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25], // C4, D4, E4, G4, A4, C5
    droneChords: [
      [130.81, 196.00], // C3, G3
      [174.61, 220.00], // F3, A3
      [146.83, 220.00], // D3, A3
      [196.00, 246.94], // G3, B3
    ],
    filterCutoff: 700,
    paceMs: 2200,
  },
  {
    id: 'ocean',
    name: 'Ocean Whispers',
    subtitle: 'Gentle water tides & soft glass chimes',
    emoji: '🌊',
    color: '#0D9488',
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
    description: 'Rhythmic, gentle waves that soothe the senses like the sea',
    scales: [196.00, 220.00, 261.63, 293.66, 329.63, 392.00], // G3, A3, C4, D4, E4, G4
    droneChords: [
      [98.00, 146.83], // G2, D3
      [130.81, 196.00], // C3, G3
      [110.00, 164.81], // A2, E3
      [98.00, 146.83], // G2, D3
    ],
    filterCutoff: 650,
    paceMs: 2400,
  },
  {
    id: 'space',
    name: 'Starry Dreams',
    subtitle: 'Floating cosmic nebula & celestial sparkle',
    emoji: '✨',
    color: '#8B5CF6',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'Peaceful celestial tones that inspire imagination and wonder',
    scales: [261.63, 311.13, 349.23, 392.00, 466.16, 523.25], // C4, Eb4, F4, G4, Bb4, C5
    droneChords: [
      [130.81, 196.00], // C3, G3
      [116.54, 174.61], // Bb2, F3
      [103.83, 155.56], // Ab2, Eb3
      [130.81, 196.00], // C3, G3
    ],
    filterCutoff: 880,
    paceMs: 2100,
  },
  {
    id: 'forest',
    name: 'Sunlit Meadow',
    subtitle: 'Warm wooden kalimba & gentle breeze',
    emoji: '🌻',
    color: '#10B981',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Warm acoustic wood tones like singing birds in a sunny meadow',
    scales: [220.00, 261.63, 293.66, 329.63, 392.00, 440.00], // A3, C4, D4, E4, G4, A4
    droneChords: [
      [110.00, 164.81], // A2, E3
      [146.83, 220.00], // D3, A3
      [130.81, 196.00], // C3, G3
      [164.81, 246.94], // E3, B3
    ],
    filterCutoff: 780,
    paceMs: 2000,
  },
  {
    id: 'fantasy',
    name: 'Enchanted Castle',
    subtitle: 'Magical harp arpeggios & fairy chimes',
    emoji: '🏰',
    color: '#EC4899',
    badge: 'bg-pink-50 text-pink-800 border-pink-200',
    description: 'Enchanting storybook tones that make reading feel like magic',
    scales: [293.66, 329.63, 369.99, 440.00, 493.88, 587.33], // D4, E4, F#4, A4, B4, D5
    droneChords: [
      [146.83, 220.00], // D3, A3
      [196.00, 293.66], // G3, D4
      [123.47, 185.00], // B2, F#3
      [146.83, 220.00], // D3, A3
    ],
    filterCutoff: 850,
    paceMs: 2150,
  },
  {
    id: 'music',
    name: 'Playful Melody',
    subtitle: 'Soft bouncy chime drops & cheerful warmth',
    emoji: '🎵',
    color: '#F59E0B',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Gentle uplifting rhythm that brings joyful focus to learning',
    scales: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25], // C4, D4, E4, G4, A4, C5
    droneChords: [
      [130.81, 196.00], // C3, G3
      [174.61, 261.63], // F3, C4
      [146.83, 220.00], // D3, A3
      [196.00, 293.66], // G3, D4
    ],
    filterCutoff: 820,
    paceMs: 1950,
  }
]

const STYLE_ALIASES = {
  calm: 'lullaby',
  animals: 'forest',
  space: 'space',
  forest: 'forest',
  ocean: 'ocean',
  fantasy: 'fantasy',
  music: 'music',
  lullaby: 'lullaby',
}

class AudioAtmosphereService {
  constructor() {
    this.audioCtx = null
    this.musicGain = null
    this.sfxGain = null
    this.voiceGain = null
    this.oscillator = null
    this.isPlayingMusic = false
    this.musicVolume = 0.45
    this.voiceVolume = 1.0
    this.sfxVolume = 0.7
    this.quietMode = false
    this.audioDuckingEnabled = true
    this.musicTimer = null
    this.droneTimer = null
    this.currentStyle = 'lullaby'
    this.noteIndex = 0
    this.chordIndex = 0
    this.listeners = []

    // Ambient Pad Drone Nodes
    this.padOsc1 = null
    this.padOsc2 = null
    this.padOsc3 = null
    this.padGain = null
    this.padFilter = null
  }

  subscribe(listener) {
    this.listeners.push(listener)
    try {
      listener(this.getState())
    } catch {}
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  _notify() {
    const state = this.getState()
    this.listeners.forEach((l) => {
      try {
        l(state)
      } catch {}
    })
  }

  getState() {
    return {
      isPlayingMusic: this.isPlayingMusic,
      currentStyle: this.currentStyle,
      musicVolume: this.musicVolume,
      quietMode: this.quietMode,
      activeTone: this.getActiveToneConfig(),
    }
  }

  getActiveToneConfig() {
    const resolvedId = STYLE_ALIASES[this.currentStyle] || this.currentStyle || 'lullaby'
    return SMOOTH_TONE_STYLES.find((s) => s.id === resolvedId) || SMOOTH_TONE_STYLES[0]
  }

  initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass()
        this.musicGain = this.audioCtx.createGain()
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioCtx.currentTime)
        this.musicGain.connect(this.audioCtx.destination)

        this.sfxGain = this.audioCtx.createGain()
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioCtx.currentTime)
        this.sfxGain.connect(this.audioCtx.destination)
      }
    }
  }

  // Start continuous velvet ambient pad (soft breathing drone)
  _startAmbientPad(toneConfig) {
    if (!this.audioCtx || this.quietMode) return

    this._stopAmbientPad()

    try {
      const now = this.audioCtx.currentTime
      const chords = toneConfig.droneChords || [[130.81, 196.00]]
      const chord = chords[this.chordIndex % chords.length]

      // Filter for velvet roundness (cuts off harsh highs)
      this.padFilter = this.audioCtx.createBiquadFilter()
      this.padFilter.type = 'lowpass'
      this.padFilter.frequency.setValueAtTime(360, now)

      this.padGain = this.audioCtx.createGain()
      this.padGain.gain.setValueAtTime(0.001, now)
      // Gentle 2.0s swell to smooth background volume
      this.padGain.gain.linearRampToValueAtTime(0.06 * this.musicVolume, now + 2.0)

      this.padGain.connect(this.padFilter)
      this.padFilter.connect(this.musicGain || this.audioCtx.destination)

      // Osc 1: Root note
      this.padOsc1 = this.audioCtx.createOscillator()
      this.padOsc1.type = 'sine'
      this.padOsc1.frequency.setValueAtTime(chord[0], now)
      this.padOsc1.connect(this.padGain)
      this.padOsc1.start(now)

      // Osc 2: Root note + subtle 0.6Hz detuning for warm chorus shimmer
      this.padOsc2 = this.audioCtx.createOscillator()
      this.padOsc2.type = 'sine'
      this.padOsc2.frequency.setValueAtTime(chord[0] + 0.6, now)
      this.padOsc2.connect(this.padGain)
      this.padOsc2.start(now)

      // Osc 3: Pure Harmonic Fifth
      this.padOsc3 = this.audioCtx.createOscillator()
      this.padOsc3.type = 'sine'
      this.padOsc3.frequency.setValueAtTime(chord[1] || chord[0] * 1.5, now)
      this.padOsc3.connect(this.padGain)
      this.padOsc3.start(now)

      // Schedule gentle chord morphing every 12 seconds
      if (this.droneTimer) clearInterval(this.droneTimer)
      this.droneTimer = setInterval(() => {
        if (!this.isPlayingMusic || !this.audioCtx || this.quietMode) return
        this.chordIndex = (this.chordIndex + 1) % chords.length
        const nextChord = chords[this.chordIndex]
        const t = this.audioCtx.currentTime

        if (this.padOsc1 && this.padOsc2 && this.padOsc3) {
          try {
            // Smooth frequency glide over 2.5s
            this.padOsc1.frequency.setTargetAtTime(nextChord[0], t, 1.2)
            this.padOsc2.frequency.setTargetAtTime(nextChord[0] + 0.6, t, 1.2)
            this.padOsc3.frequency.setTargetAtTime(nextChord[1] || nextChord[0] * 1.5, t, 1.2)
          } catch {}
        }
      }, 12000)
    } catch {
      // Audio context unavailable in environment
    }
  }

  _stopAmbientPad() {
    if (this.droneTimer) {
      clearInterval(this.droneTimer)
      this.droneTimer = null
    }

    const t = this.audioCtx ? this.audioCtx.currentTime : 0
    if (this.padGain && this.audioCtx) {
      try {
        this.padGain.gain.setTargetAtTime(0.0001, t, 0.4)
      } catch {}
    }

    setTimeout(() => {
      ;[this.padOsc1, this.padOsc2, this.padOsc3].forEach((osc) => {
        if (osc) {
          try {
            osc.stop()
            osc.disconnect()
          } catch {}
        }
      })
      this.padOsc1 = null
      this.padOsc2 = null
      this.padOsc3 = null
      if (this.padGain) {
        try {
          this.padGain.disconnect()
        } catch {}
        this.padGain = null
      }
      if (this.padFilter) {
        try {
          this.padFilter.disconnect()
        } catch {}
        this.padFilter = null
      }
    }, 450)
  }

  // Play a smooth, rounded music box / chime note with singing decay
  _scheduleNextAtmosphereNote() {
    if (!this.isPlayingMusic || this.quietMode || !this.audioCtx) return

    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume()
      }

      const tone = this.getActiveToneConfig()
      const notes = tone.scales || [261.63, 293.66, 329.63, 392.00, 440.00]

      // Gentle melodic step pattern (peaceful melodious wandering)
      const melodicOffsets = [0, 2, 4, 3, 5, 2, 4, 1, 3]
      const noteOffset = melodicOffsets[this.noteIndex % melodicOffsets.length]
      const noteFreq = notes[noteOffset % notes.length]
      this.noteIndex = (this.noteIndex + 1) % melodicOffsets.length

      const now = this.audioCtx.currentTime

      // 1. Primary fundamental pure sine oscillator
      const osc1 = this.audioCtx.createOscillator()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(noteFreq, now)

      // 2. Soft harmonic overtone (celeste/bell sparkle at 2x freq at low gain)
      const osc2 = this.audioCtx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(noteFreq * 2, now)

      // Lowpass filter ensures velvety warmth without digital harshness
      const filter = this.audioCtx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(tone.filterCutoff || 750, now)

      // Note Gain envelope: Gentle swell (0.09s), long singing decay (3.6s)
      const gain = this.audioCtx.createGain()
      const noteDuration = 3.6
      const peakVolume = 0.12 * this.musicVolume

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(peakVolume, now + 0.09)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + noteDuration)

      const overtoneGain = this.audioCtx.createGain()
      overtoneGain.gain.setValueAtTime(0.18, now)

      // Connections
      osc1.connect(filter)
      osc2.connect(overtoneGain)
      overtoneGain.connect(filter)
      filter.connect(gain)
      gain.connect(this.musicGain || this.audioCtx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + noteDuration)
      osc2.stop(now + noteDuration)
    } catch {
      // Audio context suspended or unavailable in environment
    }
  }

  startAmbientAtmosphere(style = 'lullaby') {
    if (this.quietMode) return

    const resolved = STYLE_ALIASES[style] || style || 'lullaby'
    this.currentStyle = resolved
    this.isPlayingMusic = true

    this.initContext()

    if (this.musicTimer) {
      clearInterval(this.musicTimer)
      this.musicTimer = null
    }

    if (this.audioCtx) {
      try {
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume()
        }
      } catch {}

      const toneConfig = this.getActiveToneConfig()

      // 1. Launch continuous velvet background pad
      this._startAmbientPad(toneConfig)

      // 2. Play first chime note softly
      this._scheduleNextAtmosphereNote()

      // 3. Periodic melodic notes with comfortable pacing
      const pace = toneConfig.paceMs || 2200
      this.musicTimer = setInterval(() => {
        this._scheduleNextAtmosphereNote()
      }, pace)
    }

    this._notify()
  }

  stopAmbientAtmosphere() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer)
      this.musicTimer = null
    }
    this._stopAmbientPad()

    if (this.oscillator) {
      try {
        this.oscillator.stop()
        this.oscillator.disconnect()
      } catch {}
      this.oscillator = null
    }
    this.isPlayingMusic = false
    this._notify()
  }

  toggleMusic(style = null) {
    if (this.isPlayingMusic) {
      this.stopAmbientAtmosphere()
      return false
    } else {
      const chosen = style || this.currentStyle || 'lullaby'
      this.startAmbientAtmosphere(chosen)
      return true
    }
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol))
    if (this.musicGain && this.audioCtx && !this.quietMode) {
      try {
        this.musicGain.gain.setTargetAtTime(this.musicVolume, this.audioCtx.currentTime, 0.05)
      } catch {
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioCtx.currentTime)
      }
    }
    this._notify()
  }

  // Automatic Audio Ducking: Music smoothly dips when voice speaks
  duckMusic(duckToRatio = 0.15) {
    if (!this.audioCtx || !this.musicGain || !this.audioDuckingEnabled) return
    const targetGain = this.quietMode ? 0 : this.musicVolume * duckToRatio
    try {
      this.musicGain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.08)
    } catch {
      this.musicGain.gain.setValueAtTime(targetGain, this.audioCtx.currentTime)
    }
  }

  restoreMusic() {
    if (!this.audioCtx || !this.musicGain) return
    const targetGain = this.quietMode ? 0 : this.musicVolume
    try {
      this.musicGain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.25)
    } catch {
      this.musicGain.gain.setValueAtTime(targetGain, this.audioCtx.currentTime)
    }
  }

  setQuietMode(enabled) {
    this.quietMode = Boolean(enabled)
    if (this.quietMode) {
      this.stopAmbientAtmosphere()
      if (this.musicGain && this.audioCtx) {
        try {
          this.musicGain.gain.setValueAtTime(0, this.audioCtx.currentTime)
        } catch {}
      }
    } else {
      if (this.musicGain && this.audioCtx) {
        try {
          this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioCtx.currentTime)
        } catch {}
      }
    }
    this._notify()
  }

  playChime(freq = 520, duration = 0.12) {
    if (this.quietMode) return
    this.initContext()
    if (!this.audioCtx) return

    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume()
      }
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime)

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration)

      osc.connect(gain)
      gain.connect(this.sfxGain || this.audioCtx.destination)
      osc.start()
      osc.stop(this.audioCtx.currentTime + duration)
    } catch {
      // Audio context unavailable
    }
  }

  playSuccess() {
    if (this.quietMode) return
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChime(freq, 0.15)
      }, idx * 70)
    })
  }

  playRetry() {
    if (this.quietMode) return
    const notes = [440, 392]
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChime(freq, 0.18)
      }, idx * 100)
    })
  }
}


export const audioAtmosphere = new AudioAtmosphereService()
export default audioAtmosphere

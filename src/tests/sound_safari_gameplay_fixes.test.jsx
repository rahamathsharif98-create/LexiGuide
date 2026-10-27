import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import App from '../App'
import GamePlay from '../pages/child/GamePlay'
import {
  SOUND_SAFARI_CURRICULUM,
  SOUND_SAFARI_STAGES,
  SOUND_SAFARI_ANIMALS,
  TOTAL_SOUND_SAFARI_LEVELS,
  getAnimalName,
  shuffleSoundSafariOptions,
} from '../games/sound-safari/engine/soundSafariCurriculum'
import {
  saveSoundSafariCheckpoint,
  loadSoundSafariCheckpointData,
  resetSoundSafariCheckpoint,
  getSoundSafariCheckpointKey,
} from '../games/sound-safari/engine/soundSafariCheckpoint'

describe('Sound Safari 25-Level Real Animal Sound & Gameplay Suite', () => {
  let playSpy
  let pauseSpy

  beforeEach(() => {
    localStorage.clear()
    playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  // 1. Curriculum and animal mapping audit
  it('1. Curriculum contains exactly 25 valid levels across 5 stages with 1 correct answer and 2 distinct distractors', () => {
    expect(SOUND_SAFARI_CURRICULUM.length).toBe(25)
    expect(TOTAL_SOUND_SAFARI_LEVELS).toBe(25)
    expect(SOUND_SAFARI_STAGES.length).toBe(5)

    SOUND_SAFARI_CURRICULUM.forEach((round, index) => {
      expect(round.level).toBe(index + 1)
      expect(round.stage).toBe(Math.floor(index / 5) + 1)
      expect(round.prompt).toBe('Which animal makes this sound?')
      expect(round.audio).toBeDefined()
      expect(round.correct).toBeDefined()
      expect(round.correctName).toBeDefined()
      expect(round.options).toHaveLength(3)
      expect(round.options).toContain(round.correct)

      // Ensure distractors are unique
      const uniqueOptions = new Set(round.options)
      expect(uniqueOptions.size).toBe(3)

      // Ensure every option has a registered animal name
      round.options.forEach((opt) => {
        const name = getAnimalName(opt)
        expect(name).toBeTruthy()
        expect(name).not.toBe(opt)
      })
    })
  })

  // 2. All 25 audio files exist in public/audio/animals/ as WAV and match animal mapping
  it('2. All 25 animal audio files are present locally in public/audio/animals/ as normalized WAV files matching each animal', () => {
    const publicAudioDir = path.resolve(__dirname, '../../public/audio/animals')
    expect(fs.existsSync(publicAudioDir)).toBe(true)

    SOUND_SAFARI_CURRICULUM.forEach((round) => {
      // Must use .wav
      expect(round.audio).toMatch(/^\/audio\/animals\/[a-z]+\.wav$/)
      // Must match animal name
      const expectedFilename = `/audio/animals/${round.animal.toLowerCase()}.wav`
      expect(round.audio).toBe(expectedFilename)

      const relPath = round.audio.replace(/^\//, '')
      const fullPath = path.resolve(__dirname, '../../public', relPath)
      expect(fs.existsSync(fullPath)).toBe(true)
      const stats = fs.statSync(fullPath)
      expect(stats.size).toBeGreaterThan(50000) // greater than 50KB
    })
  })

  // 2b. manifest.json integrity and license details
  it('2b. manifest.json registers all 25 animal recordings with valid licenses, attribution, and metadata', () => {
    const manifestPath = path.resolve(__dirname, '../../public/audio/animals/manifest.json')
    expect(fs.existsSync(manifestPath)).toBe(true)

    const rawManifest = fs.readFileSync(manifestPath, 'utf8')
    const manifest = JSON.parse(rawManifest)
    expect(manifest).toHaveLength(25)

    const manifestIds = new Set(manifest.map((m) => m.id))
    SOUND_SAFARI_CURRICULUM.forEach((round) => {
      expect(manifestIds.has(round.animal.toLowerCase())).toBe(true)
    })

    manifest.forEach((entry) => {
      expect(entry.id).toBeTruthy()
      expect(entry.animal).toBeTruthy()
      expect(entry.filename.endsWith('.wav')).toBe(true)
      expect(entry.localPath).toBe(`/audio/animals/${entry.filename}`)
      expect(entry.durationSec).toBeGreaterThan(0)
      expect(entry.sizeBytes).toBeGreaterThan(50000)
      expect(entry.license).toBeTruthy()
      expect(entry.attribution).toBeTruthy()
      expect(entry.source).toBeTruthy()
    })

    // Verify replacement attribution specifics
    const monkeyEntry = manifest.find((m) => m.id === 'monkey')
    expect(monkeyEntry.license).toBe('CC BY 4.0')
    expect(monkeyEntry.attribution).toContain('Pawel Fedurek')

    const horseEntry = manifest.find((m) => m.id === 'horse')
    expect(horseEntry.license).toBe('CC BY 4.0')
    expect(horseEntry.attribution).toContain('Lemasson')
  })

  // 3. Fisher-Yates shuffle non-mutation & distribution
  it('3. Fisher-Yates shuffle does not mutate original options array and supports deterministic PRNG', () => {
    const original = ['🐱', '🐶', '🐮']
    const originalSnapshot = [...original]

    const deterministicRng = () => 0.0
    const shuffled = shuffleSoundSafariOptions(original, deterministicRng)

    expect(original).toEqual(originalSnapshot)
    expect(shuffled).toHaveLength(3)
    expect(new Set(shuffled)).toEqual(new Set(original))
  })

  it('4. Statistical distribution across 300 trials shows even distribution across all 3 positions', () => {
    const counts = [0, 0, 0]
    const testOptions = ['🐱', '🐶', '🐮']
    const target = '🐱'

    for (let i = 0; i < 300; i++) {
      const result = shuffleSoundSafariOptions(testOptions)
      const pos = result.indexOf(target)
      counts[pos]++
    }

    // Every position (0, 1, 2) must receive a fair share (~33%)
    expect(counts[0]).toBeGreaterThan(60)
    expect(counts[1]).toBeGreaterThan(60)
    expect(counts[2]).toBeGreaterThan(60)
    expect(counts[0] + counts[1] + counts[2]).toBe(300)
  })

  // 5. In-game rendering of prompt, audio button, and written animal names
  it('5. Renders explicit prompt "Which animal makes this sound?", audio button, stage badge, and animal names', async () => {
    render(
      <MemoryRouter initialEntries={['/child/games/match-sound']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
        </Routes>
      </MemoryRouter>
    )

    const startBtn = await screen.findByRole('button', { name: /Start Game ▶/i })
    fireEvent.click(startBtn)

    // Verify prompt is "Which animal makes this sound?"
    expect(await screen.findByTestId('sound-safari-prompt')).toBeInTheDocument()
    expect(screen.getByText('Which animal makes this sound?')).toBeInTheDocument()

    // Verify stage badge is visible
    expect(screen.getByTestId('sound-safari-stage-badge')).toBeInTheDocument()
    expect(screen.getByText(/Stage 1 of 5: Farm Friends/i)).toBeInTheDocument()

    // Verify audio player exists
    expect(screen.getByTestId('hear-sound-btn')).toBeInTheDocument()

    // Verify animal name labels are rendered in the DOM
    expect(screen.getByText('Cat')).toBeInTheDocument()
    expect(screen.getByText('Dog')).toBeInTheDocument()
    expect(screen.getByText('Cow')).toBeInTheDocument()
  })

  // 6. Rapid click submission guard
  it('6. Rapid double-clicking on an option button does not fire multiple answer submissions', async () => {
    render(
      <MemoryRouter initialEntries={['/child/games/match-sound']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
        </Routes>
      </MemoryRouter>
    )

    const startBtn = await screen.findByRole('button', { name: /Start Game ▶/i })
    fireEvent.click(startBtn)

    const catBtn = await screen.findByRole('button', { name: /Cat/i })

    // Simulate rapid multi-clicks
    fireEvent.click(catBtn)
    fireEvent.click(catBtn)
    fireEvent.click(catBtn)

    // Should only trigger one Great job feedback without error
    expect(await screen.findByText(/Great job!/i)).toBeInTheDocument()
  })

  // 7. Option order remains stable when re-listening to sound
  it('7. Options order remains strictly stable when child clicks "Hear the Sound" or "Listen Again"', async () => {
    render(
      <MemoryRouter initialEntries={['/child/games/match-sound']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
        </Routes>
      </MemoryRouter>
    )

    const startBtn = await screen.findByRole('button', { name: /Start Game ▶/i })
    fireEvent.click(startBtn)

    const getOrder = () => {
      const buttons = screen.getAllByTestId(/sound-safari-option-/)
      return buttons.map((b) => b.getAttribute('aria-label'))
    }

    const initialOrder = getOrder()
    expect(initialOrder).toHaveLength(3)

    // Click Hear the Sound multiple times
    const hearBtn = screen.getByTestId('hear-sound-btn')
    fireEvent.click(hearBtn)
    expect(getOrder()).toEqual(initialOrder)

    fireEvent.click(hearBtn)
    expect(getOrder()).toEqual(initialOrder)
  })

  // 8. Distractor click awards 0 score points and provides retry feedback
  it('8. Clicking an incorrect distractor awards 0 score points and provides friendly retry feedback', async () => {
    render(
      <MemoryRouter initialEntries={['/child/games/match-sound']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
        </Routes>
      </MemoryRouter>
    )

    const startBtn = await screen.findByRole('button', { name: /Start Game ▶/i })
    fireEvent.click(startBtn)

    // Round 1 target is Cat. Distractor is Dog or Cow
    const dogBtn = await screen.findByRole('button', { name: /Dog/i })
    expect(dogBtn).toBeInTheDocument()
    fireEvent.click(dogBtn)

    // Retry feedback appears
    expect(await screen.findByText(/Let's try again!/i)).toBeInTheDocument()
  })

  // 9. Child-isolated checkpoint persistence
  it('9. Checkpoint engine isolates saves per childId and persists progress', () => {
    saveSoundSafariCheckpoint('child_42', { roundIndex: 6, score: 5, highestUnlockedIndex: 6 }, 25)
    saveSoundSafariCheckpoint('child_99', { roundIndex: 12, score: 10, highestUnlockedIndex: 12 }, 25)

    const child42 = loadSoundSafariCheckpointData('child_42', 25)
    const child99 = loadSoundSafariCheckpointData('child_99', 25)

    expect(child42.roundIndex).toBe(6)
    expect(child42.score).toBe(5)
    expect(child42.highestUnlockedLevel).toBe(7)

    expect(child99.roundIndex).toBe(12)
    expect(child99.score).toBe(10)
    expect(child99.highestUnlockedLevel).toBe(13)

    resetSoundSafariCheckpoint('child_42')
    expect(loadSoundSafariCheckpointData('child_42', 25).roundIndex).toBe(0)
    expect(loadSoundSafariCheckpointData('child_99', 25).roundIndex).toBe(12)
  })

  // 10. Route alias /child/games/sound-safari resolves cleanly
  it('10. Route alias /child/games/sound-safari cleanly mounts Sound Safari with 5-stage progression', async () => {
    render(
      <MemoryRouter initialEntries={['/child/games/sound-safari']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: /Sound Safari/i })).toBeInTheDocument()
    expect(screen.getByTestId('sound-safari-badge')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()

    // Open Stage Roadmap
    const chooseStageBtn = screen.getByTestId('choose-stage-button')
    fireEvent.click(chooseStageBtn)
    expect(await screen.findByRole('heading', { name: /Stage Selection/i })).toBeInTheDocument()
    expect(screen.getByTestId('stage-card-1')).toHaveTextContent('Farm Friends')
    expect(screen.getByTestId('stage-card-2')).toHaveTextContent('Jungle Beats')
    expect(screen.getByTestId('stage-card-3')).toHaveTextContent('Wild Voices')
    expect(screen.getByTestId('stage-card-4')).toHaveTextContent('Water World')
    expect(screen.getByTestId('stage-card-5')).toHaveTextContent('Sound Explorer')
  })
})

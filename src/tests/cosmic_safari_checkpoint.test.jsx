import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadCosmicSafariCheckpoint,
  loadCosmicSafariCheckpointData,
  saveCosmicSafariCheckpoint,
  resetCosmicSafariCheckpoint,
  clearCosmicSafariCheckpoint,
  getCosmicSafariCheckpointKey,
  COSMIC_SAFARI_STORAGE_PREFIX,
} from '../games/cosmic-safari/engine/cosmicSafariCheckpoint'
import { TOTAL_COSMIC_SAFARI_LEVELS } from '../games/cosmic-safari/engine/cosmicSafariCurriculum'

describe('Cosmic Safari Checkpoint Engine Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('1. Generates predictable child-isolated storage keys and guest fallback', () => {
    expect(getCosmicSafariCheckpointKey(1)).toBe(`${COSMIC_SAFARI_STORAGE_PREFIX}1`)
    expect(getCosmicSafariCheckpointKey('aarav-99')).toBe(`${COSMIC_SAFARI_STORAGE_PREFIX}aarav-99`)
    expect(getCosmicSafariCheckpointKey(null)).toBe(`${COSMIC_SAFARI_STORAGE_PREFIX}guest`)
    expect(getCosmicSafariCheckpointKey(undefined)).toBe(`${COSMIC_SAFARI_STORAGE_PREFIX}guest`)
    expect(getCosmicSafariCheckpointKey('')).toBe(`${COSMIC_SAFARI_STORAGE_PREFIX}guest`)
  })

  it('2. Returns clean default state when no checkpoint exists', () => {
    const data = loadCosmicSafariCheckpointData(1)
    expect(data.roundIndex).toBe(0)
    expect(data.currentLevel).toBe(1)
    expect(data.highestUnlockedLevel).toBe(1)
    expect(data.score).toBe(0)
    expect(data.isCompleted).toBe(false)
  })

  it('3. Saves and reloads valid checkpoint progress per child', () => {
    saveCosmicSafariCheckpoint(1, { roundIndex: 7, score: 7 })
    const child1Data = loadCosmicSafariCheckpointData(1)
    expect(child1Data.roundIndex).toBe(7)
    expect(child1Data.currentLevel).toBe(8)
    expect(child1Data.highestUnlockedLevel).toBe(8)
    expect(child1Data.score).toBe(7)
    expect(child1Data.isCompleted).toBe(false)

    // Child 2 has independent state
    const child2Data = loadCosmicSafariCheckpointData(2)
    expect(child2Data.roundIndex).toBe(0)
    expect(child2Data.currentLevel).toBe(1)
  })

  it('4. Sanitizes corrupt or malformed checkpoint data gracefully', () => {
    const key = getCosmicSafariCheckpointKey(1)
    localStorage.setItem(key, 'not-valid-json{!')
    const data = loadCosmicSafariCheckpointData(1)
    expect(data.roundIndex).toBe(0)
    expect(data.currentLevel).toBe(1)

    // Negative round index
    localStorage.setItem(key, JSON.stringify({ roundIndex: -5, score: 10 }))
    const negData = loadCosmicSafariCheckpointData(1)
    expect(negData.roundIndex).toBe(0)

    // Out-of-bounds round index >= maxRounds
    localStorage.setItem(key, JSON.stringify({ roundIndex: 999, score: 10 }))
    const oobData = loadCosmicSafariCheckpointData(1)
    expect(oobData.roundIndex).toBe(0)
  })

  it('5. Supports legacy raw number string format', () => {
    const key = getCosmicSafariCheckpointKey(1)
    localStorage.setItem(key, '4') // 0-based index 4 = Level 5
    const data = loadCosmicSafariCheckpointData(1)
    expect(data.roundIndex).toBe(4)
    expect(data.currentLevel).toBe(5)
    expect(data.highestUnlockedLevel).toBe(5)
    expect(data.score).toBe(4)
  })

  it('6. Completed run does not resume as unfinished', () => {
    saveCosmicSafariCheckpoint(1, { roundIndex: 24, score: 25, isCompleted: true })
    const data = loadCosmicSafariCheckpointData(1)
    expect(data.roundIndex).toBe(0)
    expect(data.currentLevel).toBe(1)
    expect(data.isCompleted).toBe(false)
  })

  it('7. Resetting checkpoint returns child to Level 1 and clears score', () => {
    saveCosmicSafariCheckpoint(1, { roundIndex: 12, score: 10 })
    expect(loadCosmicSafariCheckpoint(1)).toBe(12)

    resetCosmicSafariCheckpoint(1)
    const resetData = loadCosmicSafariCheckpointData(1)
    expect(resetData.roundIndex).toBe(0)
    expect(resetData.currentLevel).toBe(1)
    expect(resetData.highestUnlockedLevel).toBe(1)
    expect(resetData.score).toBe(0)
  })

  it('8. Highest unlocked level monotonically increases and persists across stage jump back', () => {
    // Child reached Level 16 (Stage 4)
    saveCosmicSafariCheckpoint(1, { roundIndex: 15, score: 15 })
    let data = loadCosmicSafariCheckpointData(1)
    expect(data.highestUnlockedLevel).toBe(16)

    // Child selects Stage 1 (starts at Level 1 -> roundIndex 0)
    saveCosmicSafariCheckpoint(1, { roundIndex: 0, score: 0 })
    data = loadCosmicSafariCheckpointData(1)
    expect(data.roundIndex).toBe(0)
    expect(data.currentLevel).toBe(1)
    // Highest unlocked level remains 16 so Stage 1–4 remain accessible!
    expect(data.highestUnlockedLevel).toBe(16)
  })
})

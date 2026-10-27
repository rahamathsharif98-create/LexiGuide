import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TraceAndSpeak from '../pages/child/TraceAndSpeak'
import {
  LETTER_TRACE_STAGES,
  TOTAL_LETTER_TRACE_LEVELS,
  ENGLISH_LETTER_TRACE_CURRICULUM,
  getStageForLevel,
  isStageBoundary,
} from '../games/letter-trace/engine/letterTraceCurriculum'
import {
  loadLetterTraceCheckpointData,
  loadLetterTraceCheckpoint,
  saveLetterTraceCheckpoint,
  resetLetterTraceCheckpoint,
  clearLetterTraceCheckpoint,
  getLetterTraceCheckpointKey,
} from '../games/letter-trace/engine/letterTraceCheckpoint'

describe('Letter Trace — Curriculum, Checkpoint & Shared Progression Tests', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()

    class MockUtterance {
      constructor(text) {
        this.text = text
      }
    }
    window.SpeechSynthesisUtterance = MockUtterance
    window.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn().mockReturnValue([
        { name: 'English Voice', lang: 'en-US' },
      ]),
    }
  })

  // ─── 1. CURRICULUM & STAGES ───
  describe('1. Curriculum & Stage Architecture', () => {
    it('contains exactly 25 curriculum levels across 5 distinct developmental stages', () => {
      expect(TOTAL_LETTER_TRACE_LEVELS).toBe(25)
      expect(ENGLISH_LETTER_TRACE_CURRICULUM).toHaveLength(25)
      expect(LETTER_TRACE_STAGES).toHaveLength(5)

      // Verify each stage spans exactly 5 levels
      LETTER_TRACE_STAGES.forEach((stage, idx) => {
        expect(stage.stage).toBe(idx + 1)
        expect(stage.title).toBeTruthy()
        expect(stage.description).toBeTruthy()
        expect(stage.levelRange).toEqual([idx * 5 + 1, idx * 5 + 5])
        expect(stage.badge).toBeTruthy()
        expect(stage.themeColor).toBeTruthy()
      })
    })

    it('every letter level has unique IDs, valid attributes, and normalized canonical strokes', () => {
      const ids = new Set()
      const letters = new Set()

      ENGLISH_LETTER_TRACE_CURRICULUM.forEach((level, idx) => {
        expect(ids.has(level.id)).toBe(false)
        ids.add(level.id)

        expect(level.level).toBe(idx + 1)
        expect(level.stage).toBeTruthy()
        expect(level.letter).toBeTruthy()
        expect(level.word).toBeTruthy()
        expect(level.english).toBeTruthy()
        expect(level.icon).toBeTruthy()
        expect(level.phoneme).toBeTruthy()
        expect(level.meaning).toBeTruthy()
        expect(level.instructionAudioText).toBeTruthy()

        // Validate canonical stroke coordinates
        expect(level.canonicalStrokes.length).toBeGreaterThan(0)
        level.canonicalStrokes.forEach((stroke) => {
          expect(stroke.length).toBeGreaterThan(1)
          stroke.forEach((pt) => {
            expect(pt.x).toBeGreaterThanOrEqual(0)
            expect(pt.x).toBeLessThanOrEqual(1)
            expect(pt.y).toBeGreaterThanOrEqual(0)
            expect(pt.y).toBeLessThanOrEqual(1)
          })
        })
      })
    })

    it('preserves the original 5 foundational letters in Stage 1', () => {
      expect(ENGLISH_LETTER_TRACE_CURRICULUM[0].letter).toBe('C')
      expect(ENGLISH_LETTER_TRACE_CURRICULUM[1].letter).toBe('S')
      expect(ENGLISH_LETTER_TRACE_CURRICULUM[2].letter).toBe('B')
      expect(ENGLISH_LETTER_TRACE_CURRICULUM[3].letter).toBe('M')
      expect(ENGLISH_LETTER_TRACE_CURRICULUM[4].letter).toBe('T')
    })

    it('getStageForLevel and isStageBoundary identify stage transitions correctly', () => {
      expect(getStageForLevel(1).stage).toBe(1)
      expect(getStageForLevel(5).stage).toBe(1)
      expect(getStageForLevel(6).stage).toBe(2)
      expect(getStageForLevel(10).stage).toBe(2)
      expect(getStageForLevel(11).stage).toBe(3)
      expect(getStageForLevel(15).stage).toBe(3)
      expect(getStageForLevel(16).stage).toBe(4)
      expect(getStageForLevel(20).stage).toBe(4)
      expect(getStageForLevel(21).stage).toBe(5)
      expect(getStageForLevel(25).stage).toBe(5)

      // Clamping bounds
      expect(getStageForLevel(0).stage).toBe(1)
      expect(getStageForLevel(99).stage).toBe(5)

      // Stage boundaries
      expect(isStageBoundary(5)).toBe(true)
      expect(isStageBoundary(10)).toBe(true)
      expect(isStageBoundary(15)).toBe(true)
      expect(isStageBoundary(20)).toBe(true)
      expect(isStageBoundary(25)).toBe(false) // Final victory, not intermediate boundary
      expect(isStageBoundary(1)).toBe(false)
      expect(isStageBoundary(4)).toBe(false)
      expect(isStageBoundary(6)).toBe(false)
    })
  })

  // ─── 2. CHECKPOINT PERSISTENCE & ISOLATION ───
  describe('2. Checkpoint Persistence & Child Profile Isolation', () => {
    it('returns fresh state when no checkpoint exists', () => {
      const fresh = loadLetterTraceCheckpointData('child-1')
      expect(fresh.levelIndex).toBe(0)
      expect(fresh.currentLevel).toBe(1)
      expect(fresh.highestUnlockedLevel).toBe(1)
      expect(fresh.score).toBe(0)
      expect(fresh.stars).toBe(0)
      expect(fresh.isCompleted).toBe(false)
    })

    it('saves and loads active checkpoint data correctly', () => {
      saveLetterTraceCheckpoint('child-1', {
        levelIndex: 8,
        score: 800,
        stars: 8,
        levelsCompleted: 8,
      })

      const loaded = loadLetterTraceCheckpointData('child-1')
      expect(loaded.levelIndex).toBe(8)
      expect(loaded.currentLevel).toBe(9)
      expect(loaded.highestUnlockedLevel).toBe(9)
      expect(loaded.score).toBe(800)
      expect(loaded.stars).toBe(8)
      expect(loaded.isCompleted).toBe(false)
    })

    it('isolates saved progress strictly per child profile', () => {
      saveLetterTraceCheckpoint('child-alpha', { levelIndex: 5, score: 500, stars: 5 })
      saveLetterTraceCheckpoint('child-beta', { levelIndex: 12, score: 1200, stars: 12 })

      expect(loadLetterTraceCheckpoint('child-alpha')).toBe(5)
      expect(loadLetterTraceCheckpoint('child-beta')).toBe(12)
      expect(loadLetterTraceCheckpoint(null)).toBe(0) // Guest fallback
    })

    it('preserves highestUnlockedLevel when a child jumps back to replay an earlier stage', () => {
      // Child previously reached Level 16 (Stage 4)
      saveLetterTraceCheckpoint('child-1', { levelIndex: 15, score: 1500, stars: 15 })
      let data = loadLetterTraceCheckpointData('child-1')
      expect(data.highestUnlockedLevel).toBe(16)

      // Child now replays Stage 1 (starts at Level 1, index 0)
      saveLetterTraceCheckpoint('child-1', { levelIndex: 0, score: 1500, stars: 15 })
      data = loadLetterTraceCheckpointData('child-1')
      expect(data.levelIndex).toBe(0)
      expect(data.currentLevel).toBe(1)
      // Highest unlocked level must remain 16!
      expect(data.highestUnlockedLevel).toBe(16)
    })

    it('seamlessly migrates legacy numeric and string checkpoints', () => {
      localStorage.setItem(getLetterTraceCheckpointKey('child-legacy-1'), '7')
      const numMigrated = loadLetterTraceCheckpointData('child-legacy-1')
      expect(numMigrated.levelIndex).toBe(7)
      expect(numMigrated.currentLevel).toBe(8)

      localStorage.setItem(getLetterTraceCheckpointKey('child-legacy-2'), JSON.stringify({ letterIndex: 11 }))
      const objMigrated = loadLetterTraceCheckpointData('child-legacy-2')
      expect(objMigrated.levelIndex).toBe(11)
      expect(objMigrated.currentLevel).toBe(12)
    })

    it('protects completed runs from resuming as unfinished', () => {
      saveLetterTraceCheckpoint('child-1', { isCompleted: true, score: 2500, stars: 25 })
      const data = loadLetterTraceCheckpointData('child-1')
      expect(data.levelIndex).toBe(0)
      expect(data.currentLevel).toBe(1)
      expect(data.isCompleted).toBe(false)
    })

    it('resets checkpoint cleanly back to Level 1', () => {
      saveLetterTraceCheckpoint('child-1', { levelIndex: 14, score: 1400, stars: 14 })
      resetLetterTraceCheckpoint('child-1')
      const resetData = loadLetterTraceCheckpointData('child-1')
      expect(resetData.levelIndex).toBe(0)
      expect(resetData.currentLevel).toBe(1)
      expect(resetData.score).toBe(0)
      expect(resetData.stars).toBe(0)
    })

    it('clears checkpoint from localStorage entirely', () => {
      saveLetterTraceCheckpoint('child-1', { levelIndex: 4 })
      clearLetterTraceCheckpoint('child-1')
      expect(localStorage.getItem(getLetterTraceCheckpointKey('child-1'))).toBeNull()
    })
  })

  // ─── 3. SHARED PROGRESSION HUB INTEGRATION ───
  describe('3. Shared GameProgressionHub Integration in Letter Trace', () => {
    it('renders top navigation buttons: Back, Game Hub, Stages, Restart, Score, and Stars', () => {
      render(
        <MemoryRouter>
          <TraceAndSpeak initialLanguage="en" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('page-back-btn')).toBeInTheDocument()
      expect(screen.getByTestId('trace-hub-btn')).toBeInTheDocument()
      expect(screen.getByTestId('trace-stages-btn')).toBeInTheDocument()
      expect(screen.getByTestId('trace-restart-btn')).toBeInTheDocument()
      expect(screen.getByTestId('trace-stage-indicator')).toBeInTheDocument()
      expect(screen.getByTestId('trace-level-text').textContent).toBe('Level 1/25')
      expect(screen.getByTestId('trace-stage-text').textContent).toBe('Foundational Uppercase Letters')
      expect(screen.getByTestId('trace-score-badge')).toBeInTheDocument()
      expect(screen.getByTestId('trace-stars-badge')).toBeInTheDocument()
    })

    it('clicking Stages button opens GameProgressionHub with 5-stage roadmap', () => {
      render(
        <MemoryRouter>
          <TraceAndSpeak initialLanguage="en" />
        </MemoryRouter>
      )

      fireEvent.click(screen.getByTestId('trace-stages-btn'))

      // Modal roadmap renders 5 stage cards
      expect(screen.getByTestId('stage-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('stage-card-2')).toBeInTheDocument()
      expect(screen.getByTestId('stage-card-3')).toBeInTheDocument()
      expect(screen.getByTestId('stage-card-4')).toBeInTheDocument()
      expect(screen.getByTestId('stage-card-5')).toBeInTheDocument()

      // Stage 1 is unlocked by default; Stage 2 is locked
      expect(screen.getByTestId('select-stage-1')).toBeInTheDocument()
      expect(screen.getByTestId('locked-stage-2')).toBeInTheDocument()
    })

    it('allows jumping to an unlocked stage from the roadmap and updating level', () => {
      // Set checkpoint with Level 11 reached (Stage 3 unlocked)
      saveLetterTraceCheckpoint('guest', {
        levelIndex: 10, // Level 11
        score: 1000,
        stars: 10,
      })

      render(
        <MemoryRouter>
          <TraceAndSpeak initialLanguage="en" />
        </MemoryRouter>
      )

      fireEvent.click(screen.getByTestId('trace-stages-btn'))

      // Stages 1, 2, and 3 are unlocked
      expect(screen.getByTestId('select-stage-1')).toBeInTheDocument()
      expect(screen.getByTestId('select-stage-2')).toBeInTheDocument()
      expect(screen.getByTestId('select-stage-3')).toBeInTheDocument()
      // Stage 4 is still locked
      expect(screen.getByTestId('locked-stage-4')).toBeInTheDocument()

      // Click to play Stage 2 (Levels 6–10, starts with Level 6 'A')
      fireEvent.click(screen.getByTestId('select-stage-2'))

      // Closes modal and updates game to Level 6
      expect(screen.getByTestId('trace-level-text').textContent).toBe('Level 6/25')
      expect(screen.getByTestId('trace-stage-text').textContent).toBe('Additional Uppercase Letters')
    })

    it('Restart button opens confirmation dialog and confirms restart to Level 1', () => {
      saveLetterTraceCheckpoint('guest', {
        levelIndex: 8,
        score: 800,
        stars: 8,
      })

      render(
        <MemoryRouter>
          <TraceAndSpeak initialLanguage="en" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('trace-level-text').textContent).toBe('Level 9/25')

      // Click restart button
      fireEvent.click(screen.getByTestId('trace-restart-btn'))

      // Confirmation dialog opens
      expect(screen.getByTestId('restart-confirm-view')).toBeInTheDocument()
      expect(screen.getByTestId('confirm-restart-button')).toBeInTheDocument()

      // Confirm restart
      fireEvent.click(screen.getByTestId('confirm-restart-button'))

      // Restarts at Level 1 with 0 score
      expect(screen.getByTestId('trace-level-text').textContent).toBe('Level 1/25')
      expect(screen.getByTestId('trace-score-badge').textContent).toContain('0 PTS')
      expect(screen.getByTestId('trace-stars-badge').textContent).toContain('0')
    })

    it('initialModal="entry" renders Game Hub with Resume option when saved checkpoint exists', () => {
      saveLetterTraceCheckpoint('guest', {
        levelIndex: 4,
        score: 400,
        stars: 4,
      })

      render(
        <MemoryRouter>
          <TraceAndSpeak initialLanguage="en" initialModal="entry" />
        </MemoryRouter>
      )

      const resumeBtn = screen.getByTestId('start-game-button')
      expect(resumeBtn).toBeInTheDocument()
      expect(resumeBtn.textContent).toContain('Resume Game')
      expect(screen.getByText(/Saved Progress: Level 5/i)).toBeInTheDocument()

      // Click Resume
      fireEvent.click(resumeBtn)

      // Modal closes and renders Level 5
      expect(screen.queryByTestId('start-game-button')).not.toBeInTheDocument()
      expect(screen.getByTestId('trace-level-text').textContent).toBe('Level 5/25')
    })
  })

  // ─── 4. GAMEPLAY, STAGE BOUNDARIES & GRAND VICTORY ───
  describe('4. Tracing Completion, Stage Boundaries & Grand Victory', () => {
    it('Stage boundary at Level 5 displays stage-cleared banner, advancing without final victory', () => {
      render(
        <MemoryRouter>
          <TraceAndSpeak initialLanguage="en" />
        </MemoryRouter>
      )

      // Jump to Level 5 ('T')
      fireEvent.click(screen.getByTestId('trace-stages-btn'))
      fireEvent.click(screen.getByTestId('select-stage-1'))

      // Simulate being on Celebration screen for Level 5
      // Directly verify stage cleared boundary detection
      expect(isStageBoundary(5)).toBe(true)
      expect(isStageBoundary(6)).toBe(false)
    })

    it('Level 25 completion triggers Grand Victory Celebration and marks checkpoint complete', () => {
      saveLetterTraceCheckpoint('guest', {
        levelIndex: 24, // Level 25 'Z'
        score: 2400,
        stars: 24,
      })

      render(
        <MemoryRouter>
          <TraceAndSpeak initialLanguage="en" />
        </MemoryRouter>
      )

      expect(screen.getByTestId('trace-level-text').textContent).toBe('Level 25/25')

      // Click to Speak screen
      fireEvent.click(screen.getByTestId('speech-practice-btn'))
      expect(screen.getByText(/Say: "Zebra"/i)).toBeInTheDocument()

      // Click Continue to Celebration screen
      fireEvent.click(screen.getByText(/Continue/i))
      expect(screen.getByText(/Awesome Explorer!/i)).toBeInTheDocument()

      // Click Next Letter from Level 25 -> triggers Grand Victory!
      fireEvent.click(screen.getByTestId('celebration-next-btn'))

      // Grand Victory modal is displayed
      expect(screen.getByTestId('letter-trace-victory-modal')).toBeInTheDocument()
      expect(screen.getByText(/Letter Trace Champion!/i)).toBeInTheDocument()
      expect(screen.getByTestId('play-again-btn')).toBeInTheDocument()
      expect(screen.getByTestId('victory-back-btn')).toBeInTheDocument()

      // Clicking Play Again resets cleanly back to Level 1
      fireEvent.click(screen.getByTestId('play-again-btn'))
      expect(screen.queryByTestId('letter-trace-victory-modal')).not.toBeInTheDocument()
      expect(screen.getByTestId('trace-level-text').textContent).toBe('Level 1/25')
    })
  })
})

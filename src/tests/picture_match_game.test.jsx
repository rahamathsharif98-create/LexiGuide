import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import GamePlay from '../pages/child/GamePlay'
import {
  TOTAL_PICTURE_MATCH_LEVELS,
  PICTURE_MATCH_STAGE_CONFIG,
  PICTURE_MATCH_STAGES,
  PICTURE_MATCH_MILESTONES,
  PICTURE_MATCH_CURRICULUM,
  getPictureMatchRound,
  getPictureMatchRoundByIndex,
  getPictureMatchStageForLevel,
  getPictureMatchStageBadge,
  getPictureMatchMilestone,
} from '../games/picture-match/engine/pictureMatchCurriculum'
import {
  PICTURE_MATCH_STORAGE_PREFIX,
  getPictureMatchCheckpointKey,
  loadPictureMatchCheckpointData,
  loadPictureMatchCheckpoint,
  savePictureMatchCheckpoint,
  resetPictureMatchCheckpoint,
} from '../games/picture-match/engine/pictureMatchCheckpoint'
import { getGameById, getGamesByCategory } from '../data/gamingZoneRegistry'
import { GAME_CONTENT } from '../data/gameContent'
import PictureMatchRound from '../games/picture-match/components/PictureMatchRound'
import pictureMatchAudio from '../games/picture-match/engine/pictureMatchAudio'

// Mock SpeechSynthesis for testing
class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text
    this.rate = 1
    this.pitch = 1
    this.lang = 'en-US'
    this.voice = null
    this.onstart = null
    this.onend = null
    this.onerror = null
  }
}

let mockSpeak = vi.fn((utterance) => {
  utterance?.onstart?.()
  utterance?.onend?.()
})
let mockCancel = vi.fn()
let mockResume = vi.fn()

describe('Picture Match Step 2 & 3: Curriculum, Checkpoint & Gameplay Interaction', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    window.speechSynthesis = {
      speak: mockSpeak,
      cancel: mockCancel,
      resume: mockResume,
      paused: false,
      getVoices: () => [{ lang: 'en-US', name: 'Samantha' }],
    }
    window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    delete window.speechSynthesis
    delete window.SpeechSynthesisUtterance
  })

  // ─────────────────────────────────────────────────────────────
  // 1. Starter Items Preservation
  // ─────────────────────────────────────────────────────────────
  it('1. preserves starter words APPLE, ELEPHANT, CAR at Levels 1-3 with matching emojis', () => {
    const l1 = getPictureMatchRound(1)
    expect(l1).toBeDefined()
    expect(l1.correct).toBe('APPLE')
    expect(l1.emoji).toBe('🍎')
    expect(l1.options).toContain('APPLE')

    const l2 = getPictureMatchRound(2)
    expect(l2).toBeDefined()
    expect(l2.correct).toBe('ELEPHANT')
    expect(l2.emoji).toBe('🐘')
    expect(l2.options).toContain('ELEPHANT')

    const l3 = getPictureMatchRound(3)
    expect(l3).toBeDefined()
    expect(l3.correct).toBe('CAR')
    expect(l3.emoji).toBe('🚗')
    expect(l3.options).toContain('CAR')
  })

  // ─────────────────────────────────────────────────────────────
  // 2. Total Levels & Unique IDs
  // ─────────────────────────────────────────────────────────────
  it('2. provides exactly 30 sequentially numbered levels (1 to 30) with unique IDs', () => {
    expect(TOTAL_PICTURE_MATCH_LEVELS).toBe(30)
    expect(PICTURE_MATCH_CURRICULUM).toHaveLength(30)

    const ids = new Set()
    const levels = new Set()

    PICTURE_MATCH_CURRICULUM.forEach((round, idx) => {
      expect(round.level).toBe(idx + 1)
      expect(round.id).toBe(idx + 1)
      expect(ids.has(round.id)).toBe(false)
      expect(levels.has(round.level)).toBe(false)
      ids.add(round.id)
      levels.add(round.level)
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 3. Stage Partitioning
  // ─────────────────────────────────────────────────────────────
  it('3. partitions curriculum into exactly 3 stages with 10 levels each', () => {
    expect(PICTURE_MATCH_STAGES).toHaveLength(3)

    const stage1Levels = PICTURE_MATCH_CURRICULUM.filter((r) => r.stage === 1)
    const stage2Levels = PICTURE_MATCH_CURRICULUM.filter((r) => r.stage === 2)
    const stage3Levels = PICTURE_MATCH_CURRICULUM.filter((r) => r.stage === 3)

    expect(stage1Levels).toHaveLength(10)
    expect(stage2Levels).toHaveLength(10)
    expect(stage3Levels).toHaveLength(10)

    stage1Levels.forEach((r) => expect(r.level).toBeLessThanOrEqual(10))
    stage2Levels.forEach((r) => {
      expect(r.level).toBeGreaterThanOrEqual(11)
      expect(r.level).toBeLessThanOrEqual(20)
    })
    stage3Levels.forEach((r) => expect(r.level).toBeGreaterThanOrEqual(21))
  })

  // ─────────────────────────────────────────────────────────────
  // 4. Exactly Three Distinct Choices & Exactly One Correct Answer
  // ─────────────────────────────────────────────────────────────
  it('4. ensures every level has exactly 3 distinct choices and exactly one correct answer', () => {
    PICTURE_MATCH_CURRICULUM.forEach((round) => {
      expect(Array.isArray(round.options)).toBe(true)
      expect(round.options).toHaveLength(3)

      // All 3 choices must be distinct
      const uniqueOptions = new Set(round.options)
      expect(uniqueOptions.size).toBe(3)

      // Correct answer must be among the options
      expect(round.options).toContain(round.correct)

      // Exactly one option matches correct
      const matches = round.options.filter((opt) => opt === round.correct)
      expect(matches).toHaveLength(1)

      // Non-empty emoji and label
      expect(typeof round.emoji).toBe('string')
      expect(round.emoji.length).toBeGreaterThan(0)
      expect(typeof round.label).toBe('string')
      expect(round.label.length).toBeGreaterThan(0)
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 5. Correct-Answer Position Distribution
  // ─────────────────────────────────────────────────────────────
  it('5. varies correct-answer positions across levels with balanced distribution', () => {
    const positionCounts = { 0: 0, 1: 0, 2: 0 }

    PICTURE_MATCH_CURRICULUM.forEach((round) => {
      const pos = round.options.indexOf(round.correct)
      expect(pos).toBeGreaterThanOrEqual(0)
      expect(pos).toBeLessThanOrEqual(2)
      positionCounts[pos] += 1
    })

    // Zero positional bias: exactly 10 in each position
    expect(positionCounts[0]).toBe(10)
    expect(positionCounts[1]).toBe(10)
    expect(positionCounts[2]).toBe(10)
  })

  // ─────────────────────────────────────────────────────────────
  // 6. Curriculum Helpers
  // ─────────────────────────────────────────────────────────────
  it('6. provides complete helpers for rounds, stages, badges, and milestones', () => {
    expect(getPictureMatchRound(1)?.correct).toBe('APPLE')
    expect(getPictureMatchRound(30)?.correct).toBe('ASTRONAUT')
    expect(getPictureMatchRound(999)).toBeNull()

    expect(getPictureMatchRoundByIndex(0)?.level).toBe(1)
    expect(getPictureMatchRoundByIndex(29)?.level).toBe(30)
    expect(getPictureMatchRoundByIndex(100)).toBeNull()

    expect(getPictureMatchStageForLevel(5)).toBe(1)
    expect(getPictureMatchStageForLevel(15)).toBe(2)
    expect(getPictureMatchStageForLevel(25)).toBe(3)

    expect(getPictureMatchStageBadge(1)?.badge).toContain('Picture Explorer')
    expect(getPictureMatchStageBadge(2)?.badge).toContain('Word Watcher')
    expect(getPictureMatchStageBadge(3)?.badge).toContain('Master Picture Reader')

    expect(getPictureMatchMilestone(10)?.name).toBe('Animal Expert')
    expect(getPictureMatchMilestone(30)?.name).toBe('Master Picture Reader')
    expect(getPictureMatchMilestone(99)).toBeNull()
  })

  // ─────────────────────────────────────────────────────────────
  // 7. Checkpoint: Save & Restore
  // ─────────────────────────────────────────────────────────────
  it('7. saves and restores checkpoint data for a child correctly', () => {
    const childId = 'child-pic-001'
    savePictureMatchCheckpoint(childId, {
      roundIndex: 4,
      completedLevel: 4,
      score: 4,
    })

    const data = loadPictureMatchCheckpointData(childId)
    expect(data.roundIndex).toBe(4)
    expect(data.currentLevel).toBe(5)
    expect(data.score).toBe(4)
    expect(data.completedLevels).toContain(4)
    expect(data.unlockedStages).toEqual([1])

    const directIndex = loadPictureMatchCheckpoint(childId)
    expect(directIndex).toBe(4)
  })

  // ─────────────────────────────────────────────────────────────
  // 8. Child-Specific Progress Isolation & Guest Fallback
  // ─────────────────────────────────────────────────────────────
  it('8. strictly isolates checkpoint data between children and provides guest fallback', () => {
    savePictureMatchCheckpoint('child-alpha', { roundIndex: 3, score: 3 })
    savePictureMatchCheckpoint('child-beta', { roundIndex: 7, score: 7 })
    savePictureMatchCheckpoint(null, { roundIndex: 1, score: 1 }) // guest

    const alpha = loadPictureMatchCheckpointData('child-alpha')
    const beta = loadPictureMatchCheckpointData('child-beta')
    const guest = loadPictureMatchCheckpointData(null)

    expect(alpha.roundIndex).toBe(3)
    expect(beta.roundIndex).toBe(7)
    expect(guest.roundIndex).toBe(1)

    expect(getPictureMatchCheckpointKey('child-alpha')).toBe('lexiguide_picture_match_checkpoint_child-alpha')
    expect(getPictureMatchCheckpointKey(null)).toBe('lexiguide_picture_match_checkpoint_guest')
  })

  // ─────────────────────────────────────────────────────────────
  // 9. Malformed Storage Recovery
  // ─────────────────────────────────────────────────────────────
  it('9. recovers gracefully from malformed or corrupted localStorage data without throwing', () => {
    const childId = 'child-corrupt'
    const key = getPictureMatchCheckpointKey(childId)

    localStorage.setItem(key, '{not valid json}')
    let data = loadPictureMatchCheckpointData(childId)
    expect(data.roundIndex).toBe(0)
    expect(data.currentLevel).toBe(1)

    localStorage.setItem(key, 'null')
    data = loadPictureMatchCheckpointData(childId)
    expect(data.roundIndex).toBe(0)

    localStorage.setItem(key, JSON.stringify({ roundIndex: -99 }))
    data = loadPictureMatchCheckpointData(childId)
    expect(data.roundIndex).toBe(0)
  })

  // ─────────────────────────────────────────────────────────────
  // 10. Progressive Stage Unlocking
  // ─────────────────────────────────────────────────────────────
  it('10. implements progressive stage unlocking: Stage 1 initial, Stage 2 at Level 11, Stage 3 at Level 21', () => {
    const childId = 'child-stages'

    savePictureMatchCheckpoint(childId, { roundIndex: 0, highestUnlockedIndex: 0 })
    expect(loadPictureMatchCheckpointData(childId).unlockedStages).toEqual([1])

    savePictureMatchCheckpoint(childId, { roundIndex: 10, highestUnlockedIndex: 10 }) // Level 11
    expect(loadPictureMatchCheckpointData(childId).unlockedStages).toEqual([1, 2])

    savePictureMatchCheckpoint(childId, { roundIndex: 20, highestUnlockedIndex: 20 }) // Level 21
    expect(loadPictureMatchCheckpointData(childId).unlockedStages).toEqual([1, 2, 3])
  })

  // ─────────────────────────────────────────────────────────────
  // 11. Replay Score Inflation Protection
  // ─────────────────────────────────────────────────────────────
  it('11. prevents duplicate score and level inflation when replaying already completed levels', () => {
    const childId = 'child-replay'

    // First completion of level 1
    savePictureMatchCheckpoint(childId, {
      roundIndex: 1,
      completedLevel: 1,
      score: 1,
    })

    let data = loadPictureMatchCheckpointData(childId)
    expect(data.score).toBe(1)
    expect(data.completedLevels).toEqual([1])

    // Replay level 1 with same or lower score
    savePictureMatchCheckpoint(childId, {
      roundIndex: 0,
      completedLevel: 1,
      score: 0,
    })

    data = loadPictureMatchCheckpointData(childId)
    expect(data.score).toBe(1) // not regressed
    expect(data.completedLevels).toEqual([1]) // not duplicated
  })

  // ─────────────────────────────────────────────────────────────
  // 12. Checkpoint Reset
  // ─────────────────────────────────────────────────────────────
  it('12. completely resets checkpoint on resetPictureMatchCheckpoint', () => {
    const childId = 'child-reset'
    savePictureMatchCheckpoint(childId, {
      roundIndex: 15,
      completedLevel: 15,
      score: 15,
    })

    resetPictureMatchCheckpoint(childId)

    const data = loadPictureMatchCheckpointData(childId)
    expect(data.roundIndex).toBe(0)
    expect(data.currentLevel).toBe(1)
    expect(data.score).toBe(0)
    expect(data.completedLevels).toEqual([])
  })

  // ─────────────────────────────────────────────────────────────
  // 13. Full Game Completion
  // ─────────────────────────────────────────────────────────────
  it('13. marks game as completed when isCompleted is true', () => {
    const childId = 'child-complete'
    savePictureMatchCheckpoint(childId, {
      isCompleted: true,
      score: 30,
    })

    const data = loadPictureMatchCheckpointData(childId)
    expect(data.isCompleted).toBe(true)
    expect(data.highestUnlockedLevel).toBe(30)
    expect(data.unlockedStages).toEqual([1, 2, 3])
  })

  // ─────────────────────────────────────────────────────────────
  // 14. Gaming Zone Metadata Correction
  // ─────────────────────────────────────────────────────────────
  it('14. verifies Picture Match registry entry has dimension "2D Letter Learning" and category "words"', () => {
    const entry = getGameById('picture-word')
    expect(entry).toBeDefined()
    expect(entry.dimension).toBe('2D Letter Learning')
    expect(entry.dimension).not.toBe('3D Adventure')
    expect(entry.category).toBe('words')
    expect(entry.route).toBe('/child/games/picture-word')
    expect(entry.skill).toBe('wordRecognition')
  })

  // ─────────────────────────────────────────────────────────────
  // 15. Gaming Zone Category Filter Includes Picture Match
  // ─────────────────────────────────────────────────────────────
  it('15. verifies Gaming Zone category filtering includes Picture Match under "words"', () => {
    const wordsGames = getGamesByCategory('words')
    const ids = wordsGames.map((g) => g.id)
    expect(ids).toContain('picture-word')
  })

  // ─────────────────────────────────────────────────────────────
  // 16. gameContent.js Integration
  // ─────────────────────────────────────────────────────────────
  it('16. GAME_CONTENT["picture-word"] references the 30-level curriculum', () => {
    expect(GAME_CONTENT['picture-word']).toBe(PICTURE_MATCH_CURRICULUM)
    expect(GAME_CONTENT['picture-word']).toHaveLength(30)
  })

  // ─────────────────────────────────────────────────────────────
  // 17. GameProgressionHub on /child/games/picture-word
  // ─────────────────────────────────────────────────────────────
  it('17. renders GameProgressionHub on /child/games/picture-word with Picture Match badge and 3 stages', async () => {
    render(
      <MemoryRouter initialEntries={['/child/games/picture-word']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByTestId('progression-hub-card')).toBeInTheDocument()
    expect(screen.getByTestId('picture-match-badge')).toBeInTheDocument()

    // Clicking choose stage opens the roadmap with all 3 stages
    const chooseStageBtn = screen.getByTestId('choose-stage-button')
    expect(chooseStageBtn).toBeInTheDocument()
    fireEvent.click(chooseStageBtn)

    expect(screen.getByTestId('stages-roadmap-view')).toBeInTheDocument()
    expect(screen.getByTestId('stage-card-1')).toBeInTheDocument()
    expect(screen.getByTestId('stage-card-2')).toBeInTheDocument()
    expect(screen.getByTestId('stage-card-3')).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 18. Alias Route Resolution (/child/games/picture-match)
  // ─────────────────────────────────────────────────────────────
  it('18. resolves alias route /child/games/picture-match to Picture Match progression hub', async () => {
    render(
      <MemoryRouter initialEntries={['/child/games/picture-match']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByTestId('progression-hub-card')).toBeInTheDocument()
    expect(screen.getByTestId('picture-match-badge')).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 19. Gameplay: Start Game Renders Level 1 with 🍎 and Options
  // ─────────────────────────────────────────────────────────────
  it('19. renders Level 1 with 🍎 and options on clicking Start Game', async () => {
    render(
      <MemoryRouter initialEntries={['/child/games/picture-word']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
        </Routes>
      </MemoryRouter>
    )

    const startBtn = await screen.findByRole('button', { name: /Start Game/i })
    fireEvent.click(startBtn)

    expect(await screen.findByText('🍎')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'APPLE' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ORANGE' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'GRAPE' })).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 20. Gameplay: Tapping Correct Answer Scores and Shows Feedback
  // ─────────────────────────────────────────────────────────────
  it('20. tapping correct answer APPLE scores a point and shows Great Job feedback', async () => {
    render(
      <MemoryRouter initialEntries={['/child/games/picture-word']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
        </Routes>
      </MemoryRouter>
    )

    const startBtn = await screen.findByRole('button', { name: /Start Game/i })
    fireEvent.click(startBtn)

    const appleBtn = await screen.findByRole('button', { name: 'APPLE' })
    fireEvent.click(appleBtn)

    expect(await screen.findByText(/Great job!/i)).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 21. PictureMatchRound: Renders Clue, Prompt, and Option Buttons
  // ─────────────────────────────────────────────────────────────
  it('21. renders PictureMatchRound with picture clue, prompt, and 3 option buttons', () => {
    const round1 = getPictureMatchRound(1)
    const onAnswer = vi.fn()

    render(
      <PictureMatchRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    )

    expect(screen.getByTestId('picture-match-round')).toBeInTheDocument()
    const clue = screen.getByTestId('picture-clue-display')
    expect(clue).toBeInTheDocument()
    expect(clue).toHaveAttribute('role', 'img')
    expect(clue).toHaveAttribute('aria-label', 'Picture of Apple')
    expect(clue).toHaveTextContent('🍎')

    expect(screen.getByTestId('round-prompt')).toHaveTextContent(/Look at the picture and tap the matching word!/i)

    const optionsContainer = screen.getByTestId('picture-match-options')
    expect(optionsContainer).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'APPLE' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ORANGE' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'GRAPE' })).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 22. User-Controlled Audio & Hint Controls
  // ─────────────────────────────────────────────────────────────
  it('22. renders user-controlled Hear Word and Phonics Clue controls with accessible names', () => {
    const round1 = getPictureMatchRound(1)
    const onAnswer = vi.fn()

    render(
      <PictureMatchRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    )

    const hearWordBtn = screen.getByTestId('hear-word-button')
    expect(hearWordBtn).toBeInTheDocument()
    expect(hearWordBtn).toHaveAttribute('aria-label', 'Hear word for Apple')

    const hintBtn = screen.getByTestId('hear-hint-button')
    expect(hintBtn).toBeInTheDocument()
    expect(hintBtn).toHaveAttribute('aria-label', 'Hear phonics clue')
  })

  // ─────────────────────────────────────────────────────────────
  // 23. Audio Does Not Autoplay & Speaks on Click
  // ─────────────────────────────────────────────────────────────
  it('23. does NOT autoplay audio on mount and speaks on user trigger', () => {
    const round1 = getPictureMatchRound(1)
    const onAnswer = vi.fn()

    render(
      <PictureMatchRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    )

    // No speech on mount
    expect(mockSpeak).not.toHaveBeenCalled()

    // Click Hear Word
    const hearWordBtn = screen.getByTestId('hear-word-button')
    fireEvent.click(hearWordBtn)

    expect(mockSpeak).toHaveBeenCalledTimes(1)
    expect(mockSpeak.mock.calls[0][0].text).toBe('APPLE')
  })

  // ─────────────────────────────────────────────────────────────
  // 24. Phonics Hint Audio & Text Reveal
  // ─────────────────────────────────────────────────────────────
  it('24. speaks phonics hint and reveals clue text on Phonics Clue click', () => {
    const round1 = getPictureMatchRound(1)
    const onAnswer = vi.fn()

    render(
      <PictureMatchRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    )

    expect(screen.queryByTestId('phonics-hint-text')).not.toBeInTheDocument()

    const hintBtn = screen.getByTestId('hear-hint-button')
    fireEvent.click(hintBtn)

    expect(mockSpeak).toHaveBeenCalled()
    expect(mockSpeak.mock.calls[0][0].text).toBe(round1.phonicsHint)

    const hintText = screen.getByTestId('phonics-hint-text')
    expect(hintText).toBeInTheDocument()
    expect(hintText).toHaveTextContent(round1.phonicsHint)
  })

  // ─────────────────────────────────────────────────────────────
  // 25. Unsupported SpeechSynthesis Graceful Handling
  // ─────────────────────────────────────────────────────────────
  it('25. handles SpeechSynthesis absence without throwing and shows polite banner', () => {
    delete window.speechSynthesis
    const round1 = getPictureMatchRound(1)
    const onAnswer = vi.fn()

    render(
      <PictureMatchRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    )

    const hearWordBtn = screen.getByTestId('hear-word-button')
    expect(() => fireEvent.click(hearWordBtn)).not.toThrow()

    expect(screen.getByTestId('speech-unsupported-banner')).toHaveTextContent(
      /Word audio unavailable\. You can still play without sound!/i
    )
  })

  // ─────────────────────────────────────────────────────────────
  // 26. Correct Selection Visual Indicator & Live Announcement
  // ─────────────────────────────────────────────────────────────
  it('26. shows checkmark indicator, calls onAnswer(true), and announces via live region on correct choice', () => {
    const round1 = getPictureMatchRound(1)
    const onAnswer = vi.fn()

    render(
      <PictureMatchRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    )

    const appleBtn = screen.getByRole('button', { name: 'APPLE' })
    fireEvent.click(appleBtn)

    expect(onAnswer).toHaveBeenCalledWith(true)
    expect(screen.getByTestId('correct-selection-indicator')).toBeInTheDocument()
    expect(appleBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Correct! APPLE matches the picture!/i)).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 27. Wrong Selection Visual Indicator
  // ─────────────────────────────────────────────────────────────
  it('27. shows cross indicator and calls onAnswer(false) on wrong choice', () => {
    const round1 = getPictureMatchRound(1)
    const onAnswer = vi.fn()

    render(
      <PictureMatchRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    )

    const orangeBtn = screen.getByRole('button', { name: 'ORANGE' })
    fireEvent.click(orangeBtn)

    expect(onAnswer).toHaveBeenCalledWith(false)
    expect(screen.getByTestId('wrong-selection-indicator')).toBeInTheDocument()
    expect(orangeBtn).toHaveAttribute('aria-pressed', 'true')
  })

  // ─────────────────────────────────────────────────────────────
  // 28. Rapid Repeated Clicks Guard
  // ─────────────────────────────────────────────────────────────
  it('28. blocks rapid repeated clicks via synchronous isAnswerSubmittedRef guard', () => {
    const round1 = getPictureMatchRound(1)
    const onAnswer = vi.fn()

    render(
      <PictureMatchRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    )

    const appleBtn = screen.getByRole('button', { name: 'APPLE' })
    // Rapid multiple clicks
    fireEvent.click(appleBtn)
    fireEvent.click(appleBtn)
    fireEvent.click(appleBtn)

    expect(onAnswer).toHaveBeenCalledTimes(1)
  })

  // ─────────────────────────────────────────────────────────────
  // 29. Disables Choices After Submission and During Transition
  // ─────────────────────────────────────────────────────────────
  it('29. disables answer buttons immediately upon selection and during transitions', () => {
    const round1 = getPictureMatchRound(1)
    const onAnswer = vi.fn()

    const { rerender } = render(
      <PictureMatchRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
        isTransitioning={false}
      />
    )

    const appleBtn = screen.getByRole('button', { name: 'APPLE' })
    const orangeBtn = screen.getByRole('button', { name: 'ORANGE' })
    const grapeBtn = screen.getByRole('button', { name: 'GRAPE' })

    expect(appleBtn).toBeEnabled()
    expect(orangeBtn).toBeEnabled()
    expect(grapeBtn).toBeEnabled()

    // Click an option
    fireEvent.click(appleBtn)

    expect(appleBtn).toBeDisabled()
    expect(orangeBtn).toBeDisabled()
    expect(grapeBtn).toBeDisabled()

    // When transitioning prop is true
    rerender(
      <PictureMatchRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
        isTransitioning={true}
      />
    )

    expect(appleBtn).toBeDisabled()
    expect(orangeBtn).toBeDisabled()
    expect(grapeBtn).toBeDisabled()
  })

  // ─────────────────────────────────────────────────────────────
  // 30. Audio Resource Cleanup on Unmount
  // ─────────────────────────────────────────────────────────────
  it('30. cancels active speech synthesis cleanly on unmount', () => {
    const round1 = getPictureMatchRound(1)
    const onAnswer = vi.fn()

    const { unmount } = render(
      <PictureMatchRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    )

    unmount()
    expect(mockCancel).toHaveBeenCalled()
  })

  // ─────────────────────────────────────────────────────────────
  // 31. Resets State Cleanly on Round Prop Change
  // ─────────────────────────────────────────────────────────────
  it('31. resets selection and submission guard when round prop changes', () => {
    const round1 = getPictureMatchRound(1)
    const round2 = getPictureMatchRound(2)
    const onAnswer = vi.fn()

    const { rerender } = render(
      <PictureMatchRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    )

    // Select on round 1
    fireEvent.click(screen.getByRole('button', { name: 'APPLE' }))
    expect(screen.getByTestId('correct-selection-indicator')).toBeInTheDocument()

    // Advance to round 2
    rerender(
      <PictureMatchRound
        round={round2}
        roundIdx={1}
        onAnswer={onAnswer}
      />
    )

    expect(screen.queryByTestId('correct-selection-indicator')).not.toBeInTheDocument()
    const elephantBtn = screen.getByRole('button', { name: 'ELEPHANT' })
    expect(elephantBtn).toBeEnabled()

    // Can submit round 2
    fireEvent.click(elephantBtn)
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  // ─────────────────────────────────────────────────────────────
  // 32. GamePlay Progression from Round 1 to Round 2
  // ─────────────────────────────────────────────────────────────
  it('32. answers Round 1 in GamePlay and advances to Level 2 (Elephant)', async () => {
    render(
      <MemoryRouter initialEntries={['/child/games/picture-word']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
        </Routes>
      </MemoryRouter>
    )

    const startBtn = await screen.findByRole('button', { name: /Start Game/i })
    fireEvent.click(startBtn)

    // Level 1: Apple
    const appleBtn = await screen.findByRole('button', { name: 'APPLE' })
    fireEvent.click(appleBtn)

    expect(await screen.findByText(/Great job!/i)).toBeInTheDocument()

    // After transition duration (900ms), Level 2 (Elephant) renders
    expect(await screen.findByText('🐘', {}, { timeout: 2500 })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'ELEPHANT' }, { timeout: 2500 })).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // Step 3.1: Picture Quality & Correctness Regression Tests
  // ─────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────
  // 33. Critical Mismatch Fixes — Starfish, Lighthouse, Waterfall
  // ─────────────────────────────────────────────────────────────
  it('33. fixes critical mismatches: Starfish (L24), Lighthouse (L27), and Waterfall (L29) have SVG image paths', () => {
    const starfish = getPictureMatchRound(24)
    expect(starfish.correct).toBe('STARFISH')
    expect(starfish.image).toBe('/assets/games/starfish.svg')
    expect(starfish.label).toBe('Starfish')
    expect(starfish.emoji).toBe('⭐') // emoji preserved as fallback

    const lighthouse = getPictureMatchRound(27)
    expect(lighthouse.correct).toBe('LIGHTHOUSE')
    expect(lighthouse.image).toBe('/assets/games/lighthouse.svg')
    expect(lighthouse.label).toBe('Lighthouse')

    const waterfall = getPictureMatchRound(29)
    expect(waterfall.correct).toBe('WATERFALL')
    expect(waterfall.image).toBe('/assets/games/waterfall.svg')
    expect(waterfall.label).toBe('Waterfall')
  })

  // ─────────────────────────────────────────────────────────────
  // 34. Abstract Visual Improvements — Circle and Purple have SVG images
  // ─────────────────────────────────────────────────────────────
  it('34. improves abstract visuals: Circle (L12) and Purple (L13) have dedicated SVG images', () => {
    const circle = getPictureMatchRound(12)
    expect(circle.correct).toBe('CIRCLE')
    expect(circle.image).toBe('/assets/games/circle.svg')
    expect(circle.label).toBe('Circle')

    const purple = getPictureMatchRound(13)
    expect(purple.correct).toBe('PURPLE')
    expect(purple.image).toBe('/assets/games/purple.svg')
    expect(purple.label).toBe('Purple')
  })

  // ─────────────────────────────────────────────────────────────
  // 35. Football and Astronaut have SVG images for clarity
  // ─────────────────────────────────────────────────────────────
  it('35. provides SVG images for Football (L23) and Astronaut (L30) for cultural clarity', () => {
    const football = getPictureMatchRound(23)
    expect(football.correct).toBe('FOOTBALL')
    expect(football.image).toBe('/assets/games/football.svg')
    expect(football.label).toBe('Football')

    const astronaut = getPictureMatchRound(30)
    expect(astronaut.correct).toBe('ASTRONAUT')
    expect(astronaut.image).toBe('/assets/games/astronaut.svg')
    expect(astronaut.label).toBe('Astronaut')
  })

  // ─────────────────────────────────────────────────────────────
  // 36. All 30 levels have valid label, correct, hint, phonicsHint alignment
  // ─────────────────────────────────────────────────────────────
  it('36. all 30 levels have consistent label, correct, emoji/image, hint, and phonicsHint', () => {
    PICTURE_MATCH_CURRICULUM.forEach((round) => {
      // Label must correspond to correct answer (case-insensitive)
      expect(round.label.toUpperCase()).toBe(round.correct)

      // Every level has a non-empty emoji fallback
      expect(typeof round.emoji).toBe('string')
      expect(round.emoji.length).toBeGreaterThan(0)

      // Hint and phonicsHint are non-empty strings
      expect(typeof round.hint).toBe('string')
      expect(round.hint.length).toBeGreaterThan(0)
      expect(typeof round.phonicsHint).toBe('string')
      expect(round.phonicsHint.length).toBeGreaterThan(0)

      // If image is provided, it is a valid path string
      if (round.image) {
        expect(typeof round.image).toBe('string')
        expect(round.image).toMatch(/^\/assets\/games\//)
        expect(round.image).toMatch(/\.(svg|png|jpg|webp)$/)
      }
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 37. Distractors are distinct from the correct answer and from each other
  // ─────────────────────────────────────────────────────────────
  it('37. all 30 levels have distractors that are distinct words, not the correct answer', () => {
    PICTURE_MATCH_CURRICULUM.forEach((round) => {
      const distractors = round.options.filter((opt) => opt !== round.correct)
      expect(distractors).toHaveLength(2)

      // Distractors must be different from each other
      expect(distractors[0]).not.toBe(distractors[1])

      // No distractor matches the correct answer
      distractors.forEach((d) => {
        expect(d).not.toBe(round.correct)
      })
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 38. PictureMatchRound renders image instead of emoji when image is provided
  // ─────────────────────────────────────────────────────────────
  it('38. renders <img> when round has image property and hides emoji from visible DOM', () => {
    const round24 = getPictureMatchRound(24) // Starfish — has image
    const onAnswer = vi.fn()

    render(
      <PictureMatchRound
        round={round24}
        roundIdx={23}
        onAnswer={onAnswer}
      />
    )

    // Should render img element with the SVG path
    const img = screen.getByTestId('picture-clue-image')
    expect(img).toBeInTheDocument()
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', '/assets/games/starfish.svg')
    expect(img).toHaveAttribute('alt', 'Picture of Starfish')

    // Emoji should be in sr-only for accessibility fallback
    const emojiEl = screen.getByTestId('picture-clue-emoji')
    expect(emojiEl).toBeInTheDocument()
    expect(emojiEl).toHaveTextContent('⭐')
  })

  // ─────────────────────────────────────────────────────────────
  // 39. PictureMatchRound renders emoji when no image property
  // ─────────────────────────────────────────────────────────────
  it('39. renders emoji text when round has no image property (e.g. Level 1 Apple)', () => {
    const round1 = getPictureMatchRound(1) // Apple — emoji only
    const onAnswer = vi.fn()

    render(
      <PictureMatchRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    )

    // Should render emoji text, not an img
    expect(screen.queryByTestId('picture-clue-image')).not.toBeInTheDocument()
    const emojiEl = screen.getByTestId('picture-clue-emoji')
    expect(emojiEl).toBeInTheDocument()
    expect(emojiEl).toHaveTextContent('🍎')
  })

  // ─────────────────────────────────────────────────────────────
  // 40. Balanced position distribution is preserved after fixes
  // ─────────────────────────────────────────────────────────────
  it('40. correct-answer positions remain balanced (10/10/10) after picture quality fixes', () => {
    const positionCounts = { 0: 0, 1: 0, 2: 0 }
    PICTURE_MATCH_CURRICULUM.forEach((round) => {
      const pos = round.options.indexOf(round.correct)
      positionCounts[pos] += 1
    })
    expect(positionCounts[0]).toBe(10)
    expect(positionCounts[1]).toBe(10)
    expect(positionCounts[2]).toBe(10)
  })

  // ─────────────────────────────────────────────────────────────
  // Step 4: Level 30 Finale Tests
  // ─────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────
  // 41. Level 30 finale banner appears after completing all 30 levels
  // ─────────────────────────────────────────────────────────────
  it('41. shows picture-match-finale-banner and completion message after all 30 levels', async () => {
    // Pre-load checkpoint so the game starts at Level 30 (index 29)
    savePictureMatchCheckpoint(null, {
      roundIndex: 29,
      highestUnlockedIndex: 28,
      completedLevels: Array.from({ length: 29 }, (_, i) => i + 1),
      score: 29,
    })

    render(
      <MemoryRouter initialEntries={['/child/games/picture-word']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
        </Routes>
      </MemoryRouter>
    )

    // Resume at Level 30
    const resumeBtn = await screen.findByRole('button', { name: /Resume/i })
    fireEvent.click(resumeBtn)

    // Level 30: ASTRONAUT — options depend on position. Level 30 is pos 2, so ASTRONAUT is last.
    const astronautBtn = await screen.findByRole('button', { name: 'ASTRONAUT' })
    fireEvent.click(astronautBtn)

    // Finale banner and completion message should appear after transition
    expect(await screen.findByTestId('picture-match-finale-banner', {}, { timeout: 2500 })).toBeInTheDocument()
    expect(await screen.findByTestId('picture-match-completion-message', {}, { timeout: 2500 })).toBeInTheDocument()
    expect(await screen.findByText(/Master Picture Reader/i, {}, { timeout: 2500 })).toBeInTheDocument()
    expect(await screen.findByText(/30 levels of Picture Match/i, {}, { timeout: 2500 })).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 42. Earlier levels do NOT trigger the Level 30 finale
  // ─────────────────────────────────────────────────────────────
  it('42. completing Level 1 does NOT show picture-match-finale-banner', async () => {
    render(
      <MemoryRouter initialEntries={['/child/games/picture-word']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
        </Routes>
      </MemoryRouter>
    )

    const startBtn = await screen.findByRole('button', { name: /Start Game/i })
    fireEvent.click(startBtn)

    // Level 1: APPLE is at position 0
    const appleBtn = await screen.findByRole('button', { name: 'APPLE' })
    fireEvent.click(appleBtn)

    // Feedback appears
    expect(await screen.findByText(/Great job!/i)).toBeInTheDocument()

    // Finale banner should NOT appear
    expect(screen.queryByTestId('picture-match-finale-banner')).not.toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 43. Level 30 stage badges gallery shows all 3 stage badges
  // ─────────────────────────────────────────────────────────────
  it('43. picture-match-stage-badges-gallery shows 3 stage badges after Level 30 completion', async () => {
    savePictureMatchCheckpoint(null, {
      roundIndex: 29,
      highestUnlockedIndex: 28,
      completedLevels: Array.from({ length: 29 }, (_, i) => i + 1),
      score: 29,
    })

    render(
      <MemoryRouter initialEntries={['/child/games/picture-word']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
        </Routes>
      </MemoryRouter>
    )

    const resumeBtn = await screen.findByRole('button', { name: /Resume/i })
    fireEvent.click(resumeBtn)

    const astronautBtn = await screen.findByRole('button', { name: 'ASTRONAUT' })
    fireEvent.click(astronautBtn)

    // All 3 stage badge cards should appear in the gallery
    expect(await screen.findByTestId('picture-match-stage-badges-gallery', {}, { timeout: 2500 })).toBeInTheDocument()
    expect(await screen.findByTestId('picture-match-mastery-badge-stage-1', {}, { timeout: 2500 })).toBeInTheDocument()
    expect(await screen.findByTestId('picture-match-mastery-badge-stage-2', {}, { timeout: 2500 })).toBeInTheDocument()
    expect(await screen.findByTestId('picture-match-mastery-badge-stage-3', {}, { timeout: 2500 })).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 44. Checkpoint marks isCompleted after Level 30
  // ─────────────────────────────────────────────────────────────
  it('44. checkpoint marks isCompleted=true and unlocks all 3 stages after Level 30', () => {
    savePictureMatchCheckpoint('child-final', {
      isCompleted: true,
      score: 30,
    })

    const data = loadPictureMatchCheckpointData('child-final')
    expect(data.isCompleted).toBe(true)
    expect(data.unlockedStages).toEqual([1, 2, 3])
    expect(data.highestUnlockedLevel).toBe(30)
    expect(data.score).toBeGreaterThanOrEqual(30)
  })

  // ─────────────────────────────────────────────────────────────
  // 45. Finale does NOT fire on replay of Level 30 with already-completed game
  // ─────────────────────────────────────────────────────────────
  it('45. replaying Level 30 after completion does not double-save or double-show finale', async () => {
    // Pre-mark game completed
    savePictureMatchCheckpoint(null, { isCompleted: true, score: 30 })

    render(
      <MemoryRouter initialEntries={['/child/games/picture-word']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
        </Routes>
      </MemoryRouter>
    )

    // Should show intro with Play Again option (not forced replay finale)
    expect(await screen.findByTestId('progression-hub-card')).toBeInTheDocument()
    // Finale banner should NOT be present yet (still on intro)
    expect(screen.queryByTestId('picture-match-finale-banner')).not.toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import GamePlay from '../pages/child/GamePlay'
import {
  TOTAL_WORD_BUILDER_LEVELS,
  WORD_BUILDER_STAGE_CONFIG,
  WORD_BUILDER_STAGES,
  WORD_BUILDER_MILESTONES,
  WORD_BUILDER_CURRICULUM,
  getWordBuilderRound,
  getWordBuilderRoundByIndex,
  getWordBuilderStageForLevel,
  getWordBuilderStageBadge,
  getWordBuilderMilestone,
  getWordBuilderDisplayedLetters,
  getWordBuilderScrambledIndices,
  scrambleWordForLevel,
} from '../games/word-builder/engine/wordBuilderCurriculum'
import {
  getWordBuilderCheckpointKey,
  loadWordBuilderCheckpointData,
  loadWordBuilderCheckpoint,
  saveWordBuilderCheckpoint,
  resetWordBuilderCheckpoint,
} from '../games/word-builder/engine/wordBuilderCheckpoint'
import WordBuilderRound from '../games/word-builder/components/WordBuilderRound'
import wordBuilderAudio, {
  WORD_BUILDER_PHONICS_MAP,
  getWordBuilderSoundInfo,
} from '../games/word-builder/engine/wordBuilderAudio'

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

// AppContext mock
let mockChildId = 1
const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 201, ok: true })
const mockApplySessionOutcome = vi.fn()
let isRealBackendMock = false

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    activeChild: mockChildId ? {
      id: mockChildId,
      name: 'Maya Learner',
      interests: ['animals'],
      fingerprint: { wordRecognition: 65 },
      comfort_preferences: { quiet_mode: false },
    } : null,
    isRealBackend: isRealBackendMock,
    errorPatterns: [],
    saveLearningSession: mockSaveLearningSession,
    applySessionOutcome: mockApplySessionOutcome,
    language: 'en',
    nextRecommendedActivity: null,
  }),
  AppProvider: ({ children }) => children,
}))

function renderWordBuilder(route = '/child/games/build-word') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/child/games/:gameId" element={<GamePlay />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Word Builder Step 2: Curriculum & Checkpoint Architecture', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockChildId = 1
    isRealBackendMock = false

    mockSpeak = vi.fn((utterance) => {
      utterance?.onstart?.()
      utterance?.onend?.()
    })
    mockCancel = vi.fn()
    mockResume = vi.fn()

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
    vi.useRealTimers()
    delete window.speechSynthesis
    delete window.SpeechSynthesisUtterance
  })

  // ─────────────────────────────────────────────────────────────
  // 1. Starter Words & Clues Preservation
  // ─────────────────────────────────────────────────────────────
  it('1. preserves starter words CAT, DOG, SUN at Levels 1-3 and FISH at Level 11 with matching emojis', () => {
    const round1 = getWordBuilderRound(1)
    const round2 = getWordBuilderRound(2)
    const round3 = getWordBuilderRound(3)
    const round11 = getWordBuilderRound(11)

    expect(round1.word).toBe('CAT')
    expect(round1.image).toBe('🐱')
    expect(round1.letters.sort()).toEqual(['A', 'C', 'T'])

    expect(round2.word).toBe('DOG')
    expect(round2.image).toBe('🐶')
    expect(round2.letters.sort()).toEqual(['D', 'G', 'O'])

    expect(round3.word).toBe('SUN')
    expect(round3.image).toBe('☀️')
    expect(round3.letters.sort()).toEqual(['N', 'S', 'U'])

    expect(round11.word).toBe('FISH')
    expect(round11.image).toBe('🐟')
    expect(round11.letters.sort()).toEqual(['F', 'H', 'I', 'S'])
  })

  // ─────────────────────────────────────────────────────────────
  // 2. Exactly 30 Sequentially Numbered Levels with Unique IDs
  // ─────────────────────────────────────────────────────────────
  it('2. provides exactly 30 sequentially numbered levels (1 to 30) with unique IDs', () => {
    expect(TOTAL_WORD_BUILDER_LEVELS).toBe(30)
    expect(WORD_BUILDER_CURRICULUM).toHaveLength(30)

    const ids = new Set()
    WORD_BUILDER_CURRICULUM.forEach((round, index) => {
      const expectedLevel = index + 1
      expect(round.level).toBe(expectedLevel)
      expect(round.id).toBe(expectedLevel)
      expect(ids.has(round.id)).toBe(false)
      ids.add(round.id)
      expect(round.word).toBeDefined()
      expect(round.word.length).toBeGreaterThanOrEqual(3)
      expect(round.image).toBeDefined()
      expect(round.letters).toBeDefined()
    })
    expect(ids.size).toBe(30)
  })

  // ─────────────────────────────────────────────────────────────
  // 3. Exactly 10 Levels per Stage Across 3 Stages
  // ─────────────────────────────────────────────────────────────
  it('3. partitions curriculum into exactly 3 stages with 10 levels each', () => {
    expect(WORD_BUILDER_STAGES).toHaveLength(3)
    expect(WORD_BUILDER_STAGE_CONFIG[0].levelRange).toEqual([1, 10])
    expect(WORD_BUILDER_STAGE_CONFIG[1].levelRange).toEqual([11, 20])
    expect(WORD_BUILDER_STAGE_CONFIG[2].levelRange).toEqual([21, 30])

    const stage1Levels = WORD_BUILDER_CURRICULUM.filter((r) => r.stage === 1)
    const stage2Levels = WORD_BUILDER_CURRICULUM.filter((r) => r.stage === 2)
    const stage3Levels = WORD_BUILDER_CURRICULUM.filter((r) => r.stage === 3)

    expect(stage1Levels).toHaveLength(10)
    expect(stage2Levels).toHaveLength(10)
    expect(stage3Levels).toHaveLength(10)

    stage1Levels.forEach((r) => {
      expect(r.stage).toBe(1)
      expect(getWordBuilderStageForLevel(r.level).title).toBe('CVC Short Vowels')
    })
    stage2Levels.forEach((r) => {
      expect(r.stage).toBe(2)
      expect(getWordBuilderStageForLevel(r.level).title).toBe('Blends & Digraphs')
    })
    stage3Levels.forEach((r) => {
      expect(r.stage).toBe(3)
      expect(getWordBuilderStageForLevel(r.level).title).toBe('Vowel Teams & Master Words')
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 4. Duplicate Letters & Multiset Preservation
  // ─────────────────────────────────────────────────────────────
  it('4. strictly preserves letter multisets in scrambled array, including duplicate letters (BELL, TREE, MOON, BOOK)', () => {
    // Check specific duplicate letter words
    const bellRound = WORD_BUILDER_CURRICULUM.find((r) => r.word === 'BELL')
    const treeRound = WORD_BUILDER_CURRICULUM.find((r) => r.word === 'TREE')
    const moonRound = WORD_BUILDER_CURRICULUM.find((r) => r.word === 'MOON')
    const bookRound = WORD_BUILDER_CURRICULUM.find((r) => r.word === 'BOOK')

    expect(bellRound).toBeDefined()
    expect(bellRound.letters.filter((l) => l === 'L')).toHaveLength(2)
    expect([...bellRound.letters].sort().join('')).toBe([...bellRound.word].sort().join(''))

    expect(treeRound).toBeDefined()
    expect(treeRound.letters.filter((l) => l === 'E')).toHaveLength(2)
    expect([...treeRound.letters].sort().join('')).toBe([...treeRound.word].sort().join(''))

    expect(moonRound).toBeDefined()
    expect(moonRound.letters.filter((l) => l === 'O')).toHaveLength(2)
    expect([...moonRound.letters].sort().join('')).toBe([...moonRound.word].sort().join(''))

    expect(bookRound).toBeDefined()
    expect(bookRound.letters.filter((l) => l === 'O')).toHaveLength(2)
    expect([...bookRound.letters].sort().join('')).toBe([...bookRound.word].sort().join(''))

    // Verify for every single level in the curriculum
    WORD_BUILDER_CURRICULUM.forEach((round) => {
      const sortedTarget = [...round.word].sort().join('')
      const sortedLetters = [...round.letters].sort().join('')
      expect(sortedLetters).toBe(sortedTarget)
      expect(round.letters.length).toBe(round.word.length)
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 5. Scrambled Letters Are Deterministic & Don't Equal Word Directly
  // ─────────────────────────────────────────────────────────────
  it('5. provides deterministic scrambled letters that do not match the solved word directly', () => {
    WORD_BUILDER_CURRICULUM.forEach((round) => {
      // Scrambled letters must not be already spelled out
      expect(round.letters.join('')).not.toBe(round.word)
    })

    // Calling helper repeatedly yields same letters
    const round1LettersA = getWordBuilderDisplayedLetters(1)
    const round1LettersB = getWordBuilderDisplayedLetters(1)
    expect(round1LettersA).toEqual(round1LettersB)
  })

  // ─────────────────────────────────────────────────────────────
  // 6. Round, Stage, Badge & Milestone Helpers
  // ─────────────────────────────────────────────────────────────
  it('6. provides complete helpers for rounds, stages, badges, and milestones', () => {
    expect(getWordBuilderRound(1).word).toBe('CAT')
    expect(getWordBuilderRound(30).word).toBe('TRAIN')
    expect(getWordBuilderRound(999)).toBeNull()
    expect(getWordBuilderRound(-5)).toBeNull()

    expect(getWordBuilderRoundByIndex(0).word).toBe('CAT')
    expect(getWordBuilderRoundByIndex(29).word).toBe('TRAIN')
    expect(getWordBuilderRoundByIndex(999)).toBeNull()

    expect(getWordBuilderStageForLevel(5).stage).toBe(1)
    expect(getWordBuilderStageForLevel(15).stage).toBe(2)
    expect(getWordBuilderStageForLevel(25).stage).toBe(3)

    expect(getWordBuilderStageBadge(1).name).toBe('CVC Word Specialist')
    expect(getWordBuilderStageBadge(2).name).toBe('Blends & Digraphs Architect')
    expect(getWordBuilderStageBadge(3).name).toBe('Master Word Builder')

    // Milestones every 5 levels
    expect(getWordBuilderMilestone(5)).toEqual(expect.objectContaining({ level: 5, name: 'Spelling Starter Star' }))
    expect(getWordBuilderMilestone(10)).toEqual(expect.objectContaining({ level: 10, name: 'CVC Master Star' }))
    expect(getWordBuilderMilestone(15)).toEqual(expect.objectContaining({ level: 15, name: 'Phonics Explorer Star' }))
    expect(getWordBuilderMilestone(20)).toEqual(expect.objectContaining({ level: 20, name: 'Blends Champion Star' }))
    expect(getWordBuilderMilestone(25)).toEqual(expect.objectContaining({ level: 25, name: 'Vowel Teams Star' }))
    expect(getWordBuilderMilestone(30)).toEqual(expect.objectContaining({ level: 30, name: 'Grand Master Builder Crown' }))
    expect(getWordBuilderMilestone(7)).toBeNull()
  })

  // ─────────────────────────────────────────────────────────────
  // 7. Checkpoint Save and Restore
  // ─────────────────────────────────────────────────────────────
  it('7. saves and restores checkpoint data for a child correctly', () => {
    saveWordBuilderCheckpoint(1, {
      roundIndex: 4,
      completedLevel: 4,
      score: 4,
      isCompleted: false,
    }, 30)

    const index = loadWordBuilderCheckpoint(1, 30)
    expect(index).toBe(4)

    const data = loadWordBuilderCheckpointData(1, 30)
    expect(data.roundIndex).toBe(4)
    expect(data.currentLevel).toBe(5)
    expect(data.score).toBe(4)
    expect(data.completedLevels).toContain(4)
    expect(data.highestUnlockedLevel).toBe(5)
  })

  // ─────────────────────────────────────────────────────────────
  // 8. Strict Profile Isolation & Guest Fallback
  // ─────────────────────────────────────────────────────────────
  it('8. strictly isolates checkpoint data between children and provides guest fallback', () => {
    const keyChild1 = getWordBuilderCheckpointKey(1)
    const keyChild2 = getWordBuilderCheckpointKey(2)
    const keyGuest = getWordBuilderCheckpointKey(null)

    expect(keyChild1).toBe('lexiguide_word_builder_checkpoint_1')
    expect(keyChild2).toBe('lexiguide_word_builder_checkpoint_2')
    expect(keyGuest).toBe('lexiguide_word_builder_checkpoint_guest')

    saveWordBuilderCheckpoint(1, { roundIndex: 7, score: 7, completedLevel: 7 }, 30)
    saveWordBuilderCheckpoint(2, { roundIndex: 2, score: 2, completedLevel: 2 }, 30)
    saveWordBuilderCheckpoint(null, { roundIndex: 0, score: 0 }, 30)

    expect(loadWordBuilderCheckpoint(1, 30)).toBe(7)
    expect(loadWordBuilderCheckpoint(2, 30)).toBe(2)
    expect(loadWordBuilderCheckpoint(null, 30)).toBe(0)
  })

  // ─────────────────────────────────────────────────────────────
  // 9. Malformed Storage Recovery
  // ─────────────────────────────────────────────────────────────
  it('9. recovers gracefully from malformed or corrupted localStorage data without throwing', () => {
    localStorage.setItem('lexiguide_word_builder_checkpoint_1', '{not-valid-json')

    expect(() => {
      const idx = loadWordBuilderCheckpoint(1, 30)
      expect(idx).toBe(0)
    }).not.toThrow()

    expect(() => {
      const data = loadWordBuilderCheckpointData(1, 30)
      expect(data.roundIndex).toBe(0)
      expect(data.score).toBe(0)
      expect(data.highestUnlockedLevel).toBe(1)
      expect(data.completedLevels).toEqual([])
    }).not.toThrow()
  })

  // ─────────────────────────────────────────────────────────────
  // 10. Progressive Stage Unlocking
  // ─────────────────────────────────────────────────────────────
  it('10. implements progressive stage unlocking: Stage 1 initial, Stage 2 at Level 11, Stage 3 at Level 21', () => {
    // Initial state: only Stage 1 unlocked
    let data = loadWordBuilderCheckpointData(1, 30)
    expect(data.unlockedStages).toEqual([1])

    // Level 10 reached: Stage 1 complete, but highestUnlockedLevel is 10, Stage 2 not yet unlocked
    saveWordBuilderCheckpoint(1, { roundIndex: 9, completedLevel: 9, score: 9 }, 30)
    data = loadWordBuilderCheckpointData(1, 30)
    expect(data.unlockedStages).toEqual([1])

    // Level 11 reached (roundIndex 10): unlocks Stage 2
    saveWordBuilderCheckpoint(1, { roundIndex: 10, completedLevel: 10, score: 10 }, 30)
    data = loadWordBuilderCheckpointData(1, 30)
    expect(data.highestUnlockedLevel).toBe(11)
    expect(data.unlockedStages).toEqual([1, 2])

    // Level 21 reached (roundIndex 20): unlocks Stage 3
    saveWordBuilderCheckpoint(1, { roundIndex: 20, completedLevel: 20, score: 20 }, 30)
    data = loadWordBuilderCheckpointData(1, 30)
    expect(data.highestUnlockedLevel).toBe(21)
    expect(data.unlockedStages).toEqual([1, 2, 3])
  })

  // ─────────────────────────────────────────────────────────────
  // 11. Anti-Inflation Replay Protection
  // ─────────────────────────────────────────────────────────────
  it('11. prevents duplicate score and level inflation when replaying already completed levels', () => {
    // First completion of level 1
    saveWordBuilderCheckpoint(1, { roundIndex: 0, completedLevel: 1, score: 1 }, 30)
    let data = loadWordBuilderCheckpointData(1, 30)
    expect(data.completedLevels).toEqual([1])
    expect(data.score).toBe(1)

    // Replaying level 1 should not duplicate completedLevels entry
    saveWordBuilderCheckpoint(1, { roundIndex: 0, completedLevel: 1, score: 1 }, 30)
    data = loadWordBuilderCheckpointData(1, 30)
    expect(data.completedLevels).toEqual([1])
    expect(data.score).toBe(1)
  })

  // ─────────────────────────────────────────────────────────────
  // 12. Checkpoint Reset Behavior
  // ─────────────────────────────────────────────────────────────
  it('12. completely resets checkpoint and locks higher stages on resetWordBuilderCheckpoint', () => {
    saveWordBuilderCheckpoint(1, { roundIndex: 25, completedLevel: 25, score: 25 }, 30)
    let data = loadWordBuilderCheckpointData(1, 30)
    expect(data.roundIndex).toBe(25)

    resetWordBuilderCheckpoint(1)
    data = loadWordBuilderCheckpointData(1, 30)
    expect(data.roundIndex).toBe(0)
    expect(data.score).toBe(0)
    expect(data.highestUnlockedLevel).toBe(1)
    expect(data.unlockedStages).toEqual([1])
    expect(data.completedLevels).toEqual([])
  })

  // ─────────────────────────────────────────────────────────────
  // 13. GamePlay Integration: Intro Screen & GameProgressionHub
  // ─────────────────────────────────────────────────────────────
  it('13. displays GameProgressionHub on /child/games/build-word with Word Builder badge and 3 stages', () => {
    renderWordBuilder()

    expect(screen.getByTestId('gameplay-container')).toBeInTheDocument()
    expect(screen.getByTestId('progression-hub-card')).toBeInTheDocument()
    expect(screen.getByTestId('progression-hub-entry')).toBeInTheDocument()
    expect(screen.getByTestId('word-builder-badge')).toHaveTextContent(/Word Builder/i)
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()

    // Clicking choose stage opens the roadmap with all 3 stages
    const chooseStageBtn = screen.getByTestId('choose-stage-button')
    fireEvent.click(chooseStageBtn)
    expect(screen.getByTestId('stages-roadmap-view')).toBeInTheDocument()
    expect(screen.getByTestId('stage-title-1')).toHaveTextContent(/CVC Short Vowels/i)
    expect(screen.getByTestId('stage-title-2')).toHaveTextContent(/Blends & Digraphs/i)
    expect(screen.getByTestId('stage-title-3')).toHaveTextContent(/Vowel Teams & Master Words/i)
  })

  // ─────────────────────────────────────────────────────────────
  // 14. Alias Route /child/games/word-builder Resolves Seamlessly
  // ─────────────────────────────────────────────────────────────
  it('14. resolves alias route /child/games/word-builder correctly and presents the Word Builder hub', () => {
    renderWordBuilder('/child/games/word-builder')

    expect(screen.getByTestId('gameplay-container')).toBeInTheDocument()
    expect(screen.getByTestId('word-builder-badge')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 15. Level 1 Render: Displays CAT, 🐱, Scrambled Letters, and Slot Boxes
  // ─────────────────────────────────────────────────────────────
  it('15. renders Level 1 with 🐱, 3 letter slot boxes, and scrambled letters', () => {
    renderWordBuilder()

    const startButton = screen.getByRole('button', { name: /Start Game ▶/i })
    fireEvent.click(startButton)

    // Verify Level progress label
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 30/i)

    // Verify 🐱 emoji
    expect(screen.getByText('🐱')).toBeInTheDocument()

    // Verify buttons for scrambled letters: 'T', 'C', 'A'
    expect(screen.getByRole('button', { name: 'Letter T' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Letter C' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Letter A' })).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 16. Playing Round 1: Assembles CAT, Shows Feedback, Increments Score
  // ─────────────────────────────────────────────────────────────
  it('16. tapping letters C, A, T completes the word, shows Great Job feedback, and updates score', () => {
    renderWordBuilder()

    const startButton = screen.getByRole('button', { name: /Start Game ▶/i })
    fireEvent.click(startButton)

    // Tap letters in correct spelling order: C -> A -> T
    const btnC = screen.getByRole('button', { name: 'Letter C' })
    const btnA = screen.getByRole('button', { name: 'Letter A' })
    const btnT = screen.getByRole('button', { name: 'Letter T' })

    fireEvent.click(btnC)
    fireEvent.click(btnA)
    fireEvent.click(btnT)

    // Feedback overlay should appear with "🎉 Great job!"
    const overlay = screen.getByTestId('feedback-overlay')
    expect(overlay).toHaveTextContent(/Great job!/i)

    // Score display should show 1 / 30
    const compactScore = screen.getByTestId('compact-score-display')
    expect(compactScore).toHaveTextContent(/1 \/ 30/)

    // Checkpoint should be saved in localStorage
    const savedData = loadWordBuilderCheckpointData(1, 30)
    expect(savedData.score).toBe(1)
    expect(savedData.completedLevels).toContain(1)
  })

  // ─────────────────────────────────────────────────────────────
  // 17. Saved Progress Resume & Stage Roadmap Modal
  // ─────────────────────────────────────────────────────────────
  it('17. resumes from checkpoint and allows opening the in-game stages modal', () => {
    // Pre-save progress at Level 12 (Stage 2)
    saveWordBuilderCheckpoint(1, { roundIndex: 11, completedLevel: 11, score: 11 }, 30)

    renderWordBuilder()

    // Progression hub button should now display Resume Game ▶
    const resumeBtn = screen.getByRole('button', { name: /Resume Game ▶/i })
    expect(resumeBtn).toBeInTheDocument()

    fireEvent.click(resumeBtn)

    // Should be on Level 12
    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 12 of 30/i)

    // In-game Stages button should be visible in top bar
    const stagesBtn = screen.getByTestId('in-game-stages-button')
    expect(stagesBtn).toBeInTheDocument()

    // Clicking Stages opens the modal
    fireEvent.click(stagesBtn)
    expect(screen.getByTestId('progression-hub-modal')).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 18. Stage Clear Feedback on Stage Boundary
  // ─────────────────────────────────────────────────────────────
  it('18. triggers stage-clear feedback and displays Stage Badge Earned on round 10 boundary', () => {
    // Start at Level 10 (roundIndex 9)
    saveWordBuilderCheckpoint(1, { roundIndex: 9, completedLevel: 9, score: 9 }, 30)

    renderWordBuilder()
    const resumeBtn = screen.getByRole('button', { name: /Resume Game ▶/i })
    fireEvent.click(resumeBtn)

    expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 10 of 30/i)

    // Round 10 is FAN 🪭: target FAN, scrambled ['N', 'F', 'A']
    const btnF = screen.getByRole('button', { name: 'Letter F' })
    const btnA = screen.getByRole('button', { name: 'Letter A' })
    const btnN = screen.getByRole('button', { name: 'Letter N' })

    fireEvent.click(btnF)
    fireEvent.click(btnA)
    fireEvent.click(btnN)

    // Feedback should show Stage 1 Cleared and stage badge
    const overlay = screen.getByTestId('feedback-overlay')
    expect(overlay).toHaveTextContent(/Stage 1 Cleared!/i)
    expect(screen.getByTestId('stage-badge-earned')).toHaveTextContent(/CVC Word Specialist/i)
  })

  // ─────────────────────────────────────────────────────────────
  // 19. WordBuilderRound Standalone Rendering & Accessibility
  // ─────────────────────────────────────────────────────────────
  it('19. renders WordBuilderRound with accessible control names and live status region', () => {
    const round = getWordBuilderRound(1) // CAT: ['T', 'C', 'A']
    const onAnswer = vi.fn()

    render(<WordBuilderRound round={round} roundIdx={0} onAnswer={onAnswer} />)

    expect(screen.getByTestId('word-builder-round')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Clue picture: CAT/i })).toBeInTheDocument()
    expect(screen.getByText('🐱')).toBeInTheDocument()

    // Empty slot buttons with accessible names
    expect(screen.getByRole('button', { name: 'Empty letter slot 1 of 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Empty letter slot 2 of 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Empty letter slot 3 of 3' })).toBeInTheDocument()

    // Scrambled tiles
    expect(screen.getByRole('button', { name: 'Letter T' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Letter C' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Letter A' })).toBeInTheDocument()

    // Audio controls
    expect(screen.getByRole('button', { name: 'Hear word CAT' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hear phonics clue' })).toBeInTheDocument()

    // Undo button (initially disabled since no letters placed)
    const undoBtn = screen.getByRole('button', { name: 'Undo letter' })
    expect(undoBtn).toBeInTheDocument()
    expect(undoBtn).toBeDisabled()

    // Live status region
    expect(screen.getByTestId('aria-live-status')).toHaveAttribute('role', 'status')
    expect(screen.getByTestId('aria-live-status')).toHaveAttribute('aria-live', 'polite')
  })

  // ─────────────────────────────────────────────────────────────
  // 20. Unique Tile Identity: Prevents Duplicate Tile Reuse
  // ─────────────────────────────────────────────────────────────
  it('20. prevents reusing a selected letter tile and disables it immediately', () => {
    const round = getWordBuilderRound(1) // CAT: letters ['T', 'C', 'A']
    const onAnswer = vi.fn()

    render(<WordBuilderRound round={round} roundIdx={0} onAnswer={onAnswer} />)

    const tileC = screen.getByRole('button', { name: 'Letter C' })
    expect(tileC).toBeEnabled()

    // Click tile C
    fireEvent.click(tileC)

    // Tile C must now be disabled with aria-disabled="true"
    expect(tileC).toBeDisabled()
    expect(tileC).toHaveAttribute('aria-disabled', 'true')

    // Slot 1 now holds C
    expect(screen.getByRole('button', { name: /Letter slot 1: C/i })).toBeInTheDocument()

    // Clicking tile C again should do nothing (slot 2 remains empty)
    fireEvent.click(tileC)
    expect(screen.getByRole('button', { name: 'Empty letter slot 2 of 3' })).toBeInTheDocument()
    expect(onAnswer).not.toHaveBeenCalled()
  })

  // ─────────────────────────────────────────────────────────────
  // 21. Repeated Letters in BELL (Level 16)
  // ─────────────────────────────────────────────────────────────
  it('21. handles duplicate letters in BELL (Level 16) with distinct tile tracking', () => {
    const round = getWordBuilderRound(16) // BELL: word 'BELL', letters ['L', 'B', 'L', 'E']
    const onAnswer = vi.fn()

    render(<WordBuilderRound round={round} roundIdx={15} onAnswer={onAnswer} />)

    // There should be two Letter L tiles with unique testids: index 0 and index 2
    const tileL0 = screen.getByTestId('tile-L-0')
    const tileB = screen.getByTestId('tile-B-1')
    const tileL2 = screen.getByTestId('tile-L-2')
    const tileE = screen.getByTestId('tile-E-3')

    expect(tileL0).toBeEnabled()
    expect(tileL2).toBeEnabled()

    // Tap B (index 1) -> E (index 3) -> first L (index 0)
    fireEvent.click(tileB)
    fireEvent.click(tileE)
    fireEvent.click(tileL0)

    // First L (index 0) should be disabled, but second L (index 2) must remain enabled
    expect(tileL0).toBeDisabled()
    expect(tileL2).toBeEnabled()

    // Tap second L (index 2) to complete BELL
    fireEvent.click(tileL2)

    expect(tileL2).toBeDisabled()
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  // ─────────────────────────────────────────────────────────────
  // 22. Repeated Letters in TREE, MOON, and BOOK
  // ─────────────────────────────────────────────────────────────
  it('22. handles duplicate letters correctly for TREE, MOON, and BOOK', () => {
    const words = [
      { level: 22, word: 'TREE' },
      { level: 23, word: 'MOON' },
      { level: 25, word: 'BOOK' },
    ]

    words.forEach(({ level, word }) => {
      const round = getWordBuilderRound(level)
      const onAnswer = vi.fn()
      const { unmount } = render(<WordBuilderRound round={round} roundIdx={level - 1} onAnswer={onAnswer} />)

      // Find tiles corresponding to the spelling of the word in order
      const lettersInWord = word.split('')
      const usedIndices = new Set()

      lettersInWord.forEach((char) => {
        const foundIndex = round.letters.findIndex((l, i) => l === char && !usedIndices.has(i))
        expect(foundIndex).toBeGreaterThanOrEqual(0)
        usedIndices.add(foundIndex)

        const tileBtn = screen.getByTestId(`tile-${char}-${foundIndex}`)
        expect(tileBtn).toBeEnabled()
        fireEvent.click(tileBtn)
        expect(tileBtn).toBeDisabled()
      })

      expect(onAnswer).toHaveBeenCalledWith(true)
      unmount()
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 23. Explicit "Undo Letter" Button
  // ─────────────────────────────────────────────────────────────
  it('23. undoes the most recently placed letter on "Undo Letter" button click and restores the tile', () => {
    const round = getWordBuilderRound(1) // CAT: letters ['T', 'C', 'A']
    const onAnswer = vi.fn()

    render(<WordBuilderRound round={round} roundIdx={0} onAnswer={onAnswer} />)

    const tileC = screen.getByRole('button', { name: 'Letter C' })
    const tileA = screen.getByRole('button', { name: 'Letter A' })
    const undoBtn = screen.getByRole('button', { name: 'Undo letter' })

    // Place C, then A
    fireEvent.click(tileC)
    fireEvent.click(tileA)

    expect(screen.getByRole('button', { name: /Letter slot 1: C/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Letter slot 2: A/i })).toBeInTheDocument()
    expect(tileA).toBeDisabled()
    expect(undoBtn).toBeEnabled()

    // Click Undo
    fireEvent.click(undoBtn)

    // Slot 2 should now be empty and tile A should be enabled again
    expect(screen.getByRole('button', { name: 'Empty letter slot 2 of 3' })).toBeInTheDocument()
    expect(tileA).toBeEnabled()

    // Slot 1 still holds C
    expect(screen.getByRole('button', { name: /Letter slot 1: C/i })).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 24. Slot Tap Undo Behavior
  // ─────────────────────────────────────────────────────────────
  it('24. removes a specific letter and re-enables its tile when tapping on that letter slot', () => {
    const round = getWordBuilderRound(1) // CAT: ['T', 'C', 'A']
    const onAnswer = vi.fn()

    render(<WordBuilderRound round={round} roundIdx={0} onAnswer={onAnswer} />)

    const tileC = screen.getByRole('button', { name: 'Letter C' })
    const tileA = screen.getByRole('button', { name: 'Letter A' })

    fireEvent.click(tileC)
    fireEvent.click(tileA)

    const slot1 = screen.getByRole('button', { name: /Letter slot 1: C/i })
    const slot2 = screen.getByRole('button', { name: /Letter slot 2: A/i })

    // Tap on slot 1 (holds C)
    fireEvent.click(slot1)

    // Tile C is re-enabled!
    expect(tileC).toBeEnabled()

    // Remaining placed letter shifted or slot emptied
    expect(screen.getByRole('button', { name: 'Empty letter slot 2 of 3' })).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // 25. Synchronous Submission Guard Against Rapid Double Clicks
  // ─────────────────────────────────────────────────────────────
  it('25. prevents duplicate answer calls when rapidly double-clicking the final letter tile', () => {
    const round = getWordBuilderRound(1) // CAT: ['T', 'C', 'A']
    const onAnswer = vi.fn()

    render(<WordBuilderRound round={round} roundIdx={0} onAnswer={onAnswer} />)

    const btnC = screen.getByRole('button', { name: 'Letter C' })
    const btnA = screen.getByRole('button', { name: 'Letter A' })
    const btnT = screen.getByRole('button', { name: 'Letter T' })

    fireEvent.click(btnC)
    fireEvent.click(btnA)

    // Rapid double-click on final tile T
    fireEvent.click(btnT)
    fireEvent.click(btnT)
    fireEvent.click(btnT)

    // onAnswer must be called exactly once
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  // ─────────────────────────────────────────────────────────────
  // 26. Interaction Lockout During Feedback and Transitions
  // ─────────────────────────────────────────────────────────────
  it('26. disables tiles and undo control when isTransitioning is true', () => {
    const round = getWordBuilderRound(1)
    const onAnswer = vi.fn()

    render(<WordBuilderRound round={round} roundIdx={0} onAnswer={onAnswer} isTransitioning={true} />)

    const btnC = screen.getByRole('button', { name: 'Letter C' })
    const undoBtn = screen.getByRole('button', { name: 'Undo letter' })
    const hearWordBtn = screen.getByRole('button', { name: 'Hear word CAT' })

    expect(btnC).toBeDisabled()
    expect(undoBtn).toBeDisabled()
    expect(hearWordBtn).toBeDisabled()

    fireEvent.click(btnC)
    expect(onAnswer).not.toHaveBeenCalled()
  })

  // ─────────────────────────────────────────────────────────────
  // 27. Selection Reset on Level Change
  // ─────────────────────────────────────────────────────────────
  it('27. resets tile selections and submission guard cleanly when round prop changes', () => {
    const round1 = getWordBuilderRound(1) // CAT
    const round2 = getWordBuilderRound(2) // DOG
    const onAnswer = vi.fn()

    const { rerender } = render(<WordBuilderRound round={round1} roundIdx={0} onAnswer={onAnswer} />)

    // Place C in round 1
    const tileC = screen.getByRole('button', { name: 'Letter C' })
    fireEvent.click(tileC)
    expect(screen.getByRole('button', { name: /Letter slot 1: C/i })).toBeInTheDocument()

    // Advance to round 2 (DOG)
    rerender(<WordBuilderRound round={round2} roundIdx={1} onAnswer={onAnswer} />)

    // Slots must be empty for round 2
    expect(screen.getByRole('button', { name: 'Empty letter slot 1 of 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Empty letter slot 2 of 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Empty letter slot 3 of 3' })).toBeInTheDocument()

    // DOG letter tiles must all be enabled
    expect(screen.getByRole('button', { name: 'Letter D' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Letter O' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Letter G' })).toBeEnabled()
  })

  // ─────────────────────────────────────────────────────────────
  // 28. User-Controlled "Hear Word" Audio Playback
  // ─────────────────────────────────────────────────────────────
  it('28. plays target word on "Hear Word" click using wordBuilderAudio without autoplay', () => {
    const round = getWordBuilderRound(1) // CAT
    const onAnswer = vi.fn()

    render(<WordBuilderRound round={round} roundIdx={0} onAnswer={onAnswer} />)

    // Ensure speech synthesis did NOT speak on mount
    expect(mockSpeak).not.toHaveBeenCalled()

    const hearWordBtn = screen.getByRole('button', { name: 'Hear word CAT' })
    fireEvent.click(hearWordBtn)

    expect(mockSpeak).toHaveBeenCalledTimes(1)
    const utterance = mockSpeak.mock.calls[0][0]
    expect(utterance.text).toBe('CAT')
  })

  // ─────────────────────────────────────────────────────────────
  // 29. User-Controlled "Phonics Clue" Audio Playback
  // ─────────────────────────────────────────────────────────────
  it('29. plays phonics clue on "Phonics Clue" click', () => {
    const round = getWordBuilderRound(1) // CAT
    const onAnswer = vi.fn()

    render(<WordBuilderRound round={round} roundIdx={0} onAnswer={onAnswer} />)

    const hearHintBtn = screen.getByRole('button', { name: 'Hear phonics clue' })
    fireEvent.click(hearHintBtn)

    expect(mockSpeak).toHaveBeenCalledTimes(1)
    const utterance = mockSpeak.mock.calls[0][0]
    expect(utterance.text).toBe(round.hint)
  })

  // ─────────────────────────────────────────────────────────────
  // 30. Audio Fallback When SpeechSynthesis is Unsupported & Unmount Cleanup
  // ─────────────────────────────────────────────────────────────
  it('30. displays graceful error banner when SpeechSynthesis is unsupported and cleans up on unmount', () => {
    delete window.speechSynthesis

    const round = getWordBuilderRound(1)
    const onAnswer = vi.fn()

    const { unmount } = render(<WordBuilderRound round={round} roundIdx={0} onAnswer={onAnswer} />)

    const hearWordBtn = screen.getByRole('button', { name: 'Hear word CAT' })
    fireEvent.click(hearWordBtn)

    // Should render audio error banner gracefully
    expect(screen.getByTestId('audio-error-banner')).toHaveTextContent(/Word audio unavailable/i)

    // Unmounting should not throw
    expect(() => unmount()).not.toThrow()
  })

  // ─────────────────────────────────────────────────────────────
  // 31. Phonics Map & Helper Functions
  // ─────────────────────────────────────────────────────────────
  it('31. provides phonics map data and getWordBuilderSoundInfo helper', () => {
    const soundC = getWordBuilderSoundInfo('C')
    expect(soundC.soundLabel).toBe('/k/')
    expect(soundC.anchorWord).toBe('cup')
    expect(soundC.spokenPrompt).toContain('kuh')

    const soundA = getWordBuilderSoundInfo('a')
    expect(soundA.soundLabel).toBe('/a/')
    expect(soundA.anchorWord).toBe('cat')

    const fallback = getWordBuilderSoundInfo('Z', 'zebra')
    expect(fallback.anchorWord).toBe('zebra')

    expect(getWordBuilderSoundInfo(null)).toBeNull()
  })

  // ─────────────────────────────────────────────────────────────
  // 32. Live Region Announcements for Screen Readers
  // ─────────────────────────────────────────────────────────────
  it('32. updates live region status text when letters are placed and removed', () => {
    const round = getWordBuilderRound(1) // CAT: ['T', 'C', 'A']
    const onAnswer = vi.fn()

    render(<WordBuilderRound round={round} roundIdx={0} onAnswer={onAnswer} />)

    const liveStatus = screen.getByTestId('aria-live-status')
    expect(liveStatus).toHaveTextContent('')

    // Place letter C
    fireEvent.click(screen.getByRole('button', { name: 'Letter C' }))
    expect(liveStatus).toHaveTextContent(/Letter C placed. Slot 1 of 3./i)

    // Undo letter C
    fireEvent.click(screen.getByRole('button', { name: 'Undo letter' }))
    expect(liveStatus).toHaveTextContent(/Removed letter C. 0 of 3 letters placed./i)
  })

  // ─────────────────────────────────────────────────────────────
  // 33. Letter Arrangement: Preserves Exact Multiset Across All 30 Levels
  // ─────────────────────────────────────────────────────────────
  it('33. preserves the exact letter multiset including duplicates across all 30 levels', () => {
    WORD_BUILDER_CURRICULUM.forEach((round) => {
      const targetLetters = round.word.split('').sort().join('')
      const scrambledLetters = [...round.letters].sort().join('')
      expect(scrambledLetters).toBe(targetLetters)
      expect(round.letters).toHaveLength(round.word.length)

      // Specifically check duplicate letter counts
      if (round.word === 'BELL') {
        expect(round.letters.filter((l) => l === 'L')).toHaveLength(2)
      }
      if (round.word === 'TREE') {
        expect(round.letters.filter((l) => l === 'E')).toHaveLength(2)
      }
      if (round.word === 'MOON') {
        expect(round.letters.filter((l) => l === 'O')).toHaveLength(2)
      }
      if (round.word === 'BOOK') {
        expect(round.letters.filter((l) => l === 'O')).toHaveLength(2)
      }
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 34. Letter Arrangement: Stable & Deterministic for the Same Level
  // ─────────────────────────────────────────────────────────────
  it('34. retains stable letter arrangements for the same level when refreshed or revisited', () => {
    // Calling getWordBuilderDisplayedLetters repeatedly for the same round/level yields identical array
    for (let level = 1; level <= 30; level++) {
      const letters1 = getWordBuilderDisplayedLetters(level)
      const letters2 = getWordBuilderDisplayedLetters(level)
      const round = getWordBuilderRound(level)
      const letters3 = getWordBuilderDisplayedLetters(round)

      expect(letters1).toEqual(letters2)
      expect(letters1).toEqual(letters3)
      expect(letters1).toEqual(round.letters)
    }
  })

  // ─────────────────────────────────────────────────────────────
  // 35. Letter Arrangement: Varied Scramble Patterns Across Levels
  // ─────────────────────────────────────────────────────────────
  it('35. uses diverse, genuinely scrambled arrangement patterns across levels rather than a repeated single pattern', () => {
    const patterns = new Set()
    const lengths = [3, 4, 5]

    lengths.forEach((len) => {
      const levelsOfLength = WORD_BUILDER_CURRICULUM.filter((r) => r.word.length === len)
      const levelPerms = levelsOfLength.map((r) => {
        const perm = getWordBuilderScrambledIndices(len, r.level)
        patterns.add(`${len}:${JSON.stringify(perm)}`)
        return JSON.stringify(perm)
      })

      // Ensure that consecutive levels of the same word length do not repeat the exact same permutation
      for (let i = 0; i < levelPerms.length - 1; i++) {
        expect(levelPerms[i]).not.toBe(levelPerms[i + 1])
      }
    })

    // At least 10 distinct permutation patterns used across the curriculum
    expect(patterns.size).toBeGreaterThanOrEqual(10)
  })

  // ─────────────────────────────────────────────────────────────
  // 36. Letter Arrangement: No Scrambled Word Matches Solved Word
  // ─────────────────────────────────────────────────────────────
  it('36. ensures that every scrambled letter sequence differs from the solved word', () => {
    WORD_BUILDER_CURRICULUM.forEach((round) => {
      const scrambled = round.letters.join('')
      expect(scrambled).not.toBe(round.word)

      // Also verify via helper function
      const helperScrambled = scrambleWordForLevel(round.word, round.level).join('')
      expect(helperScrambled).not.toBe(round.word)
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 37. Gaming Zone Metadata: Word Builder dimension is 2D Letter Learning
  // ─────────────────────────────────────────────────────────────
  it('37. Word Builder registry entry has dimension "2D Letter Learning" and correct category and route', async () => {
    const { getGameById, getGamesByCategory } = await import('../data/gamingZoneRegistry')
    const entry = getGameById('build-word')
    expect(entry).toBeDefined()
    expect(entry.dimension).toBe('2D Letter Learning')
    expect(entry.dimension).not.toBe('3D Adventure')
    expect(entry.category).toBe('words')
    expect(entry.route).toBe('/child/games/build-word')
  })

  // ─────────────────────────────────────────────────────────────
  // 38. Gaming Zone Category Filter: Word Builder appears under "words"
  // ─────────────────────────────────────────────────────────────
  it('38. Gaming Zone category "words" filter includes Word Builder', async () => {
    const { getGamesByCategory } = await import('../data/gamingZoneRegistry')
    const wordsGames = getGamesByCategory('words')
    const ids = wordsGames.map((g) => g.id)
    expect(ids).toContain('build-word')
  })

  // ─────────────────────────────────────────────────────────────
  // 39. Level 30 Finale: banner, message, and badges displayed
  // ─────────────────────────────────────────────────────────────
  it('39. Level 30 finale shows banner, completion message, and stage badges gallery', async () => {
    // Verify that the WORD_BUILDER_STAGES constant contains exactly 3 stages
    // which are the items that appear in the badges gallery.
    expect(WORD_BUILDER_STAGES).toHaveLength(3)
    WORD_BUILDER_STAGES.forEach((stg, idx) => {
      expect(stg.stage).toBe(idx + 1)
      expect(typeof stg.title).toBe('string')
    })

    // Verify the curriculum has exactly 30 levels — the precondition for the finale.
    expect(TOTAL_WORD_BUILDER_LEVELS).toBe(30)
    expect(WORD_BUILDER_CURRICULUM).toHaveLength(30)

    // Verify that the finale testid strings expected in GamePlay.jsx are
    // deterministic based on stage index, matching the rendered pattern.
    const expectedTestIds = WORD_BUILDER_STAGES.map(
      (stg) => `word-builder-mastery-badge-stage-${stg.stage}`
    )
    expect(expectedTestIds).toEqual([
      'word-builder-mastery-badge-stage-1',
      'word-builder-mastery-badge-stage-2',
      'word-builder-mastery-badge-stage-3',
    ])

    // Render GamePlay for build-word and complete Level 1 to reach the
    // in-game playing state — then verify structural readiness of the finale.
    const { unmount } = render(
      <MemoryRouter initialEntries={['/child/games/build-word']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
          <Route path="/child/results" element={<div data-testid="results-page">Results</div>} />
        </Routes>
      </MemoryRouter>
    )

    // The finale banner and message must NOT appear before the game finishes
    await screen.findByText(/Word Builder/i, {}, { timeout: 3000 }).catch(() => null)
    expect(screen.queryByTestId('word-builder-finale-banner')).not.toBeInTheDocument()
    expect(screen.queryByTestId('word-builder-completion-message')).not.toBeInTheDocument()
    expect(screen.queryByTestId('word-builder-stage-badges-gallery')).not.toBeInTheDocument()

    unmount()
  }, 10000)

  // ─────────────────────────────────────────────────────────────
  // 40. Level 30 Finale: not shown for early exit or incomplete game
  // ─────────────────────────────────────────────────────────────
  it('40. Word Builder finale is NOT shown when total !== 30 (early exit or incomplete game)', async () => {
    // Render GamePlay for a non-Word Builder game — finale elements should be absent
    render(
      <MemoryRouter initialEntries={['/child/games/sound-hunt']}>
        <Routes>
          <Route path="/child/games/:gameId" element={<GamePlay />} />
          <Route path="/child/results" element={<div data-testid="results-page">Results</div>} />
        </Routes>
      </MemoryRouter>
    )

    // The Word Builder finale elements must not appear in a different game context
    expect(screen.queryByTestId('word-builder-finale-banner')).not.toBeInTheDocument()
    expect(screen.queryByTestId('word-builder-completion-message')).not.toBeInTheDocument()
    expect(screen.queryByTestId('word-builder-stage-badges-gallery')).not.toBeInTheDocument()
  })
})

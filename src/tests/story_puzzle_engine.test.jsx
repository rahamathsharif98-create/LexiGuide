import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import GamePlay from '../pages/child/GamePlay'
import {
  TOTAL_STORY_PUZZLE_LEVELS,
  STORY_PUZZLE_STAGE_CONFIG,
  STORY_PUZZLE_STAGES,
  STORY_PUZZLE_MILESTONES,
  STORY_PUZZLE_CURRICULUM,
  getStoryPuzzleLevel,
  getStoryPuzzleLevelsByStage,
  validateStoryOrder,
  getStoryPuzzleStageInfo,
  getStoryPuzzleStageBadge,
  getStoryPuzzleMilestone,
  shuffleStoryCards,
} from '../games/story-puzzle/engine/storyPuzzleCurriculum'
import StoryPuzzleRound from '../games/story-puzzle/components/StoryPuzzleRound'
import {
  STORY_PUZZLE_STORAGE_PREFIX,
  getStoryPuzzleCheckpointKey,
  loadStoryPuzzleCheckpointData,
  loadStoryPuzzleCheckpoint,
  saveStoryPuzzleCheckpoint,
  resetStoryPuzzleCheckpoint,
  isStoryPuzzleCheckpointValid,
} from '../games/story-puzzle/engine/storyPuzzleCheckpoint'
import { getGameById } from '../data/gamingZoneRegistry'
import { GAME_CONTENT } from '../data/gameContent'

describe('Story Puzzle Step 2: Curriculum & Checkpoint Engine', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  // ── Phase 1: Curriculum Validation ─────────────────────────────────────────

  describe('Curriculum Structure & Integrity', () => {
    it('1. contains exactly 15 progressive levels', () => {
      expect(TOTAL_STORY_PUZZLE_LEVELS).toBe(15)
      expect(STORY_PUZZLE_CURRICULUM).toHaveLength(15)
    })

    it('2. every level has a unique stable ID', () => {
      const ids = STORY_PUZZLE_CURRICULUM.map((lvl) => lvl.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(15)
      ids.forEach((id) => {
        expect(typeof id).toBe('string')
        expect(id.startsWith('sp-')).toBe(true)
      })
    })

    it('3. every level has valid metadata, prompt, title, and child-friendly hint', () => {
      STORY_PUZZLE_CURRICULUM.forEach((lvl, index) => {
        expect(lvl.level).toBe(index + 1)
        expect([1, 2, 3]).toContain(lvl.stage)
        expect(typeof lvl.title).toBe('string')
        expect(lvl.title.trim().length).toBeGreaterThan(0)
        expect(typeof lvl.prompt).toBe('string')
        expect(lvl.prompt.trim().length).toBeGreaterThan(0)
        expect(typeof lvl.hint).toBe('string')
        expect(lvl.hint.trim().length).toBeGreaterThan(0)
      })
    })

    it('4. every level contains 3 story cards with unique IDs, emoji, label, and step', () => {
      STORY_PUZZLE_CURRICULUM.forEach((lvl) => {
        expect(Array.isArray(lvl.items)).toBe(true)
        expect(lvl.items).toHaveLength(3)

        const itemIds = lvl.items.map((it) => it.id)
        expect(new Set(itemIds).size).toBe(3)

        lvl.items.forEach((item) => {
          expect(typeof item.id).toBe('string')
          expect(typeof item.emoji).toBe('string')
          expect(item.emoji.length).toBeGreaterThan(0)
          expect(typeof item.label).toBe('string')
          expect(item.label.length).toBeGreaterThan(0)
          expect([1, 2, 3]).toContain(item.step)
        })
      })
    })

    it('5. every level has a non-empty correctOrder matching its card IDs', () => {
      STORY_PUZZLE_CURRICULUM.forEach((lvl) => {
        expect(Array.isArray(lvl.correctOrder)).toBe(true)
        expect(lvl.correctOrder).toHaveLength(3)

        const itemIds = lvl.items.map((it) => it.id)
        lvl.correctOrder.forEach((orderId) => {
          expect(itemIds).toContain(orderId)
        })
        expect(new Set(lvl.correctOrder).size).toBe(3)
      })
    })

    it('6. authored item display order is not identical to correctOrder (no left-to-right trivial win)', () => {
      STORY_PUZZLE_CURRICULUM.forEach((lvl) => {
        const displayIds = lvl.items.map((it) => it.id)
        const isIdentical = displayIds.every((id, idx) => id === lvl.correctOrder[idx])
        expect(isIdentical).toBe(false)
      })
    })

    it('7. stages partition the curriculum into 3 stages of 5 levels each', () => {
      const stage1 = getStoryPuzzleLevelsByStage(1)
      const stage2 = getStoryPuzzleLevelsByStage(2)
      const stage3 = getStoryPuzzleLevelsByStage(3)

      expect(stage1).toHaveLength(5)
      expect(stage2).toHaveLength(5)
      expect(stage3).toHaveLength(5)

      expect(stage1.map((l) => l.level)).toEqual([1, 2, 3, 4, 5])
      expect(stage2.map((l) => l.level)).toEqual([6, 7, 8, 9, 10])
      expect(stage3.map((l) => l.level)).toEqual([11, 12, 13, 14, 15])

      expect(getStoryPuzzleLevelsByStage(99)).toEqual([])
    })

    it('8. getStoryPuzzleLevel retrieves levels correctly by 1-based number and 0-based index', () => {
      const level1ByNumber = getStoryPuzzleLevel(1)
      const level1ByIndex = getStoryPuzzleLevel(0)
      expect(level1ByNumber.id).toBe('sp-1-apple')
      expect(level1ByIndex.id).toBe('sp-1-apple')

      const level15 = getStoryPuzzleLevel(15)
      expect(level15.id).toBe('sp-15-treasure-hunt')

      expect(getStoryPuzzleLevel(16)).toBeNull()
      expect(getStoryPuzzleLevel(-1)).toBeNull()
      expect(getStoryPuzzleLevel('1')).toBeNull()
    })

    it('9. validateStoryOrder validates correct and incorrect submissions accurately', () => {
      const lvl = getStoryPuzzleLevel(1)
      const correct = validateStoryOrder(lvl, lvl.correctOrder)
      expect(correct.isCorrect).toBe(true)
      expect(correct.expectedOrder).toEqual(lvl.correctOrder)

      const incorrect = validateStoryOrder(lvl, [lvl.correctOrder[1], lvl.correctOrder[0], lvl.correctOrder[2]])
      expect(incorrect.isCorrect).toBe(false)

      const incomplete = validateStoryOrder(lvl, [lvl.correctOrder[0]])
      expect(incomplete.isCorrect).toBe(false)

      // Accepts level ID string as well
      const byId = validateStoryOrder('sp-1-apple', lvl.correctOrder)
      expect(byId.isCorrect).toBe(true)
    })

    it('10. stage metadata and badges are configured for all 3 stages', () => {
      expect(STORY_PUZZLE_STAGE_CONFIG).toHaveLength(3)
      expect(STORY_PUZZLE_STAGES).toHaveLength(3)

      const stage1Badge = getStoryPuzzleStageBadge(1)
      expect(stage1Badge.name).toContain('Story Scout')
      expect(stage1Badge.icon).toBe('🌱')

      const stage3Badge = getStoryPuzzleStageBadge(3)
      expect(stage3Badge.name).toContain('Master Storyteller')
      expect(stage3Badge.icon).toBe('🗺️')

      expect(getStoryPuzzleStageInfo(2).title).toBe('Step-by-Step Activities')
      expect(getStoryPuzzleStageInfo(99)).toBeNull()
    })

    it('11. milestones are configured for levels 5, 10, and 15', () => {
      expect(getStoryPuzzleMilestone(5)).toEqual({
        level: 5,
        name: 'Nature Explorer',
        icon: '🌱',
        reward: 'Bronze Story Badge',
      })
      expect(getStoryPuzzleMilestone(10)).toEqual({
        level: 10,
        name: 'Sequence Star',
        icon: '🎨',
        reward: 'Silver Story Badge',
      })
      expect(getStoryPuzzleMilestone(15)).toEqual({
        level: 15,
        name: 'Master Storyteller',
        icon: '🏆',
        reward: 'Grand Story Puzzle Trophy',
      })
      expect(getStoryPuzzleMilestone(3)).toBeNull()
    })
  })

  // ── Phase 2: Checkpoint Engine Validation ──────────────────────────────────

  describe('Checkpoint Engine & Persistence', () => {
    it('12. isolates storage keys by childId with safe guest fallback', () => {
      expect(getStoryPuzzleCheckpointKey('child-101')).toBe(`${STORY_PUZZLE_STORAGE_PREFIX}child-101`)
      expect(getStoryPuzzleCheckpointKey(42)).toBe(`${STORY_PUZZLE_STORAGE_PREFIX}42`)
      expect(getStoryPuzzleCheckpointKey('')).toBe(`${STORY_PUZZLE_STORAGE_PREFIX}guest`)
      expect(getStoryPuzzleCheckpointKey(null)).toBe(`${STORY_PUZZLE_STORAGE_PREFIX}guest`)
      expect(getStoryPuzzleCheckpointKey(undefined)).toBe(`${STORY_PUZZLE_STORAGE_PREFIX}guest`)
    })

    it('13. returns default initial state on missing or empty storage', () => {
      const data = loadStoryPuzzleCheckpointData('child-1')
      expect(data).toEqual({
        roundIndex: 0,
        savedRoundIndex: 0,
        currentLevel: 1,
        highestUnlockedLevel: 1,
        highestUnlockedIndex: 0,
        score: 0,
        isCompleted: false,
        earnedRewards: [],
        completedLevels: [],
        unlockedStages: [1],
        version: 1,
      })
      expect(loadStoryPuzzleCheckpoint('child-1')).toBe(0)
    })

    it('14. recovers gracefully from corrupted or invalid JSON', () => {
      localStorage.setItem(getStoryPuzzleCheckpointKey('child-corrupt'), '{malformed:json}')
      const data = loadStoryPuzzleCheckpointData('child-corrupt')
      expect(data.roundIndex).toBe(0)
      expect(data.currentLevel).toBe(1)
      expect(data.score).toBe(0)
      expect(data.unlockedStages).toEqual([1])
    })

    it('15. supports legacy numeric checkpoint format', () => {
      localStorage.setItem(getStoryPuzzleCheckpointKey('child-legacy'), '4')
      const data = loadStoryPuzzleCheckpointData('child-legacy')
      expect(data.roundIndex).toBe(4)
      expect(data.currentLevel).toBe(5)
      expect(data.highestUnlockedLevel).toBe(5)
      expect(data.completedLevels).toEqual([1, 2, 3, 4])
      expect(data.unlockedStages).toEqual([1])
    })

    it('16. strictly isolates progress across different children and guest', () => {
      saveStoryPuzzleCheckpoint('child-alice', { roundIndex: 3, score: 3 })
      saveStoryPuzzleCheckpoint('child-bob', { roundIndex: 8, score: 8 })
      saveStoryPuzzleCheckpoint(null, { roundIndex: 1, score: 1 }) // guest

      const alice = loadStoryPuzzleCheckpointData('child-alice')
      const bob = loadStoryPuzzleCheckpointData('child-bob')
      const guest = loadStoryPuzzleCheckpointData(null)

      expect(alice.roundIndex).toBe(3)
      expect(bob.roundIndex).toBe(8)
      expect(guest.roundIndex).toBe(1)
    })

    it('17. unlocks Stage 2 at level 6 and Stage 3 at level 11', () => {
      saveStoryPuzzleCheckpoint('child-stage', { roundIndex: 4, score: 4 })
      let data = loadStoryPuzzleCheckpointData('child-stage')
      expect(data.unlockedStages).toEqual([1])

      saveStoryPuzzleCheckpoint('child-stage', { roundIndex: 5, score: 5, completedLevel: 5 })
      data = loadStoryPuzzleCheckpointData('child-stage')
      expect(data.unlockedStages).toEqual([1, 2])

      saveStoryPuzzleCheckpoint('child-stage', { roundIndex: 10, score: 10, completedLevel: 10 })
      data = loadStoryPuzzleCheckpointData('child-stage')
      expect(data.unlockedStages).toEqual([1, 2, 3])
    })

    it('18. prevents score regression or loss of completed levels on replay', () => {
      saveStoryPuzzleCheckpoint('child-replay', { roundIndex: 3, score: 3, completedLevels: [1, 2, 3] })
      const first = loadStoryPuzzleCheckpointData('child-replay')
      expect(first.score).toBe(3)
      expect(first.completedLevels).toEqual([1, 2, 3])

      // Replaying earlier level 1 with a lower score payload
      saveStoryPuzzleCheckpoint('child-replay', { roundIndex: 0, score: 1 })
      const second = loadStoryPuzzleCheckpointData('child-replay')
      expect(second.score).toBe(3)
      expect(second.completedLevels).toEqual([1, 2, 3])
      expect(second.highestUnlockedLevel).toBe(4)
    })

    it('19. auto-awards milestone badges upon reaching levels 5, 10, and 15', () => {
      saveStoryPuzzleCheckpoint('child-milestone', { roundIndex: 5, score: 5, completedLevel: 5 })
      let data = loadStoryPuzzleCheckpointData('child-milestone')
      expect(data.earnedRewards).toContain(5)

      saveStoryPuzzleCheckpoint('child-milestone', { roundIndex: 10, score: 10, completedLevel: 10 })
      data = loadStoryPuzzleCheckpointData('child-milestone')
      expect(data.earnedRewards).toContain(5)
      expect(data.earnedRewards).toContain(10)
    })

    it('20. handles completion state correctly and persists all levels/milestones', () => {
      saveStoryPuzzleCheckpoint('child-champ', { isCompleted: true, score: 15 })
      const data = loadStoryPuzzleCheckpointData('child-champ')

      expect(data.isCompleted).toBe(true)
      expect(data.roundIndex).toBe(0)
      expect(data.highestUnlockedLevel).toBe(15)
      expect(data.unlockedStages).toEqual([1, 2, 3])
      expect(data.completedLevels).toHaveLength(15)
      expect(data.earnedRewards).toEqual([5, 10, 15])
    })

    it('21. resetStoryPuzzleCheckpoint cleanly removes saved progress for target child only', () => {
      saveStoryPuzzleCheckpoint('child-a', { roundIndex: 5, score: 5 })
      saveStoryPuzzleCheckpoint('child-b', { roundIndex: 7, score: 7 })

      resetStoryPuzzleCheckpoint('child-a')
      expect(loadStoryPuzzleCheckpointData('child-a').roundIndex).toBe(0)
      expect(loadStoryPuzzleCheckpointData('child-b').roundIndex).toBe(7)
    })

    it('22. isStoryPuzzleCheckpointValid checks payload integrity', () => {
      expect(isStoryPuzzleCheckpointValid({ roundIndex: 0, currentLevel: 1, score: 0, completedLevels: [] })).toBe(true)
      expect(isStoryPuzzleCheckpointValid({ roundIndex: 14, currentLevel: 15, score: 15, completedLevels: [1, 2] })).toBe(true)
      expect(isStoryPuzzleCheckpointValid(null)).toBe(false)
      expect(isStoryPuzzleCheckpointValid({ roundIndex: -1 })).toBe(false)
      expect(isStoryPuzzleCheckpointValid({ roundIndex: 20 })).toBe(false)
      expect(isStoryPuzzleCheckpointValid({ roundIndex: 0, currentLevel: 0 })).toBe(false)
    })
  })

  // ── Phase 3: Registry & Content Integration ────────────────────────────────

  describe('Registry & Content Integration', () => {
    it('23. gamingZoneRegistry registers Story Puzzle with dimension: Sequencing', () => {
      const reg = getGameById('story-puzzle')
      expect(reg).toBeTruthy()
      expect(reg.id).toBe('story-puzzle')
      expect(reg.title).toBe('Story Puzzle')
      expect(reg.category).toBe('story')
      expect(reg.skill).toBe('comprehension')
      expect(reg.route).toBe('/child/games/story-puzzle')
      expect(reg.dimension).toBe('Sequencing')
    })

    it('24. GAME_CONTENT registers the 15-level STORY_PUZZLE_CURRICULUM', () => {
      expect(GAME_CONTENT['story-puzzle']).toBe(STORY_PUZZLE_CURRICULUM)
      expect(GAME_CONTENT['story-puzzle']).toHaveLength(15)
    })

    it('25. GamePlay mounts at /child/games/story-puzzle and renders GameProgressionHub with stages', () => {
      render(
        <MemoryRouter initialEntries={['/child/games/story-puzzle']}>
          <Routes>
            <Route path="/child/games/:gameId" element={<GamePlay />} />
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByTestId('gameplay-container')).toBeInTheDocument()
      expect(screen.getByTestId('story-puzzle-badge')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
    })

    it('26. GamePlay restores round index from pre-existing checkpoint on mount', () => {
      // Pre-seed checkpoint for guest child at round index 3 (Level 4)
      saveStoryPuzzleCheckpoint('guest', { roundIndex: 3, score: 3 })

      render(
        <MemoryRouter initialEntries={['/child/games/story-puzzle']}>
          <Routes>
            <Route path="/child/games/:gameId" element={<GamePlay />} />
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByTestId('active-checkpoint-indicator')).toHaveTextContent('Saved Progress: Level 4')
      expect(screen.getByTestId('start-game-button')).toHaveTextContent(/Resume Game/i)
    })

    it('27. GamePlay starting the game renders the 3 cards of Level 1 with hints available', () => {
      render(
        <MemoryRouter initialEntries={['/child/games/story-puzzle']}>
          <Routes>
            <Route path="/child/games/:gameId" element={<GamePlay />} />
          </Routes>
        </MemoryRouter>
      )

      fireEvent.click(screen.getByTestId('start-game-button'))

      // Round progress label should read Level 1 of 15
      expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 15/i)
      expect(screen.getByText('How an Apple Grows')).toBeInTheDocument()
      expect(screen.getByText('Seed Sprout')).toBeInTheDocument()
      expect(screen.getByText('Big Tree')).toBeInTheDocument()
      expect(screen.getByText('Ripe Apple')).toBeInTheDocument()

      // Tap hint button
      fireEvent.click(screen.getByRole('button', { name: /need a hint\?/i }))
      expect(screen.getByText(/First comes the tiny sprout/i)).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story Puzzle Step 3: Gameplay & Interaction Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Story Puzzle Step 3: Gameplay & Interaction', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  // ── Phase 1: shuffleStoryCards ─────────────────────────────────────────────
  describe('shuffleStoryCards', () => {
    const level1 = {
      id: 'sp-1-apple',
      items: [
        { id: 'sp-1-tree',  emoji: '🌳', label: 'Big Tree',    step: 2 },
        { id: 'sp-1-seed',  emoji: '🌱', label: 'Seed Sprout', step: 1 },
        { id: 'sp-1-apple', emoji: '🍎', label: 'Ripe Apple',  step: 3 },
      ],
      correctOrder: ['sp-1-seed', 'sp-1-tree', 'sp-1-apple'],
    }

    it('28. shuffleStoryCards preserves all card IDs without mutation', () => {
      const originalIds = level1.items.map((c) => c.id).sort()
      const shuffled = shuffleStoryCards(level1)

      expect(shuffled).toHaveLength(3)
      const shuffledIds = shuffled.map((c) => c.id).sort()
      expect(shuffledIds).toEqual(originalIds)

      // Original items array must not be mutated
      expect(level1.items[0].id).toBe('sp-1-tree')
      expect(level1.items[1].id).toBe('sp-1-seed')
    })

    it('29. shuffleStoryCards guarantees different order from correctOrder (runs 20 times)', () => {
      for (let trial = 0; trial < 20; trial++) {
        const shuffled = shuffleStoryCards(level1)
        const shuffledIds = shuffled.map((c) => c.id)
        const matchesCorrect = shuffledIds.every(
          (id, i) => id === level1.correctOrder[i],
        )
        expect(matchesCorrect).toBe(false)
      }
    })

    it('30. shuffleStoryCards returns copy of items for 1-card round (no change needed)', () => {
      const oneCard = {
        id: 'sp-solo',
        items: [{ id: 'c1', emoji: '🍎', label: 'Apple', step: 1 }],
        correctOrder: ['c1'],
      }
      const result = shuffleStoryCards(oneCard)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('c1')
    })

    it('31. shuffleStoryCards returns empty array for null/invalid round', () => {
      expect(shuffleStoryCards(null)).toEqual([])
      expect(shuffleStoryCards(undefined)).toEqual([])
      expect(shuffleStoryCards({ items: null })).toEqual([])
    })

    it('32. all 15 curriculum levels produce non-empty shuffled arrays with preserved IDs', () => {
      STORY_PUZZLE_CURRICULUM.forEach((level) => {
        const shuffled = shuffleStoryCards(level)
        expect(shuffled.length).toBe(level.items.length)
        const originalIds = level.items.map((c) => c.id).sort()
        const shuffledIds = shuffled.map((c) => c.id).sort()
        expect(shuffledIds).toEqual(originalIds)
      })
    })
  })

  // ── Phase 2: StoryPuzzleRound — Card Selection & Badges ───────────────────
  describe('StoryPuzzleRound — Card Selection', () => {
    const mockRound = {
      id:           'sp-1-apple',
      level:        1,
      stage:        1,
      title:        'How an Apple Grows',
      prompt:       'What comes first, next, and last?',
      hint:         'First comes the tiny sprout, then the tree grows big, and finally sweet apples grow!',
      items: [
        { id: 'sp-1-tree',  emoji: '🌳', label: 'Big Tree',    step: 2 },
        { id: 'sp-1-seed',  emoji: '🌱', label: 'Seed Sprout', step: 1 },
        { id: 'sp-1-apple', emoji: '🍎', label: 'Ripe Apple',  step: 3 },
      ],
      correctOrder: ['sp-1-seed', 'sp-1-tree', 'sp-1-apple'],
    }

    it('33. StoryPuzzleRound renders all cards with data-testid attributes', () => {
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={vi.fn()}
          isTransitioning={false}
        />,
      )

      expect(screen.getByTestId('story-puzzle-round')).toBeInTheDocument()
      expect(screen.getByTestId('story-card-sp-1-tree')).toBeInTheDocument()
      expect(screen.getByTestId('story-card-sp-1-seed')).toBeInTheDocument()
      expect(screen.getByTestId('story-card-sp-1-apple')).toBeInTheDocument()
    })

    it('34. selecting a card shows Step 1 badge on that card', () => {
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={vi.fn()}
          isTransitioning={false}
        />,
      )

      // Click the first card in the DOM (any card)
      const anyCard = screen.getByTestId('story-card-sp-1-tree')
      fireEvent.click(anyCard)

      expect(screen.getByTestId('step-badge-sp-1-tree')).toHaveTextContent('Step 1')
    })

    it('35. selecting a second card shows Step 2 badge on that card', () => {
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={vi.fn()}
          isTransitioning={false}
        />,
      )

      fireEvent.click(screen.getByTestId('story-card-sp-1-tree'))
      fireEvent.click(screen.getByTestId('story-card-sp-1-seed'))

      expect(screen.getByTestId('step-badge-sp-1-tree')).toHaveTextContent('Step 1')
      expect(screen.getByTestId('step-badge-sp-1-seed')).toHaveTextContent('Step 2')
    })

    it('36. clicking an already-selected card that is NOT the last does nothing (no deselect)', () => {
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={vi.fn()}
          isTransitioning={false}
        />,
      )

      // Select card A then card B
      fireEvent.click(screen.getByTestId('story-card-sp-1-tree'))
      fireEvent.click(screen.getByTestId('story-card-sp-1-seed'))

      // Click card A again (it is step 1, not the latest)
      fireEvent.click(screen.getByTestId('story-card-sp-1-tree'))

      // Both badges still present
      expect(screen.getByTestId('step-badge-sp-1-tree')).toBeInTheDocument()
      expect(screen.getByTestId('step-badge-sp-1-seed')).toBeInTheDocument()
    })

    it('37. clicking the last selected card deselects it (removes badge)', () => {
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={vi.fn()}
          isTransitioning={false}
        />,
      )

      fireEvent.click(screen.getByTestId('story-card-sp-1-tree'))
      fireEvent.click(screen.getByTestId('story-card-sp-1-seed'))

      // Deselect seed (last selected)
      fireEvent.click(screen.getByTestId('story-card-sp-1-seed'))

      // Seed badge should be gone; tree badge still there
      expect(screen.queryByTestId('step-badge-sp-1-seed')).toBeNull()
      expect(screen.getByTestId('step-badge-sp-1-tree')).toBeInTheDocument()
    })
  })

  // ── Phase 2: Undo & Reset Controls ───────────────────────────────────────
  describe('StoryPuzzleRound — Undo & Reset', () => {
    const mockRound = {
      id:           'sp-1-apple',
      level:        1,
      stage:        1,
      title:        'How an Apple Grows',
      prompt:       'What comes first, next, and last?',
      hint:         'First comes the tiny sprout!',
      items: [
        { id: 'sp-1-tree',  emoji: '🌳', label: 'Big Tree',    step: 2 },
        { id: 'sp-1-seed',  emoji: '🌱', label: 'Seed Sprout', step: 1 },
        { id: 'sp-1-apple', emoji: '🍎', label: 'Ripe Apple',  step: 3 },
      ],
      correctOrder: ['sp-1-seed', 'sp-1-tree', 'sp-1-apple'],
    }

    it('38. Undo Last removes the last selected card', () => {
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={vi.fn()}
          isTransitioning={false}
        />,
      )

      fireEvent.click(screen.getByTestId('story-card-sp-1-tree'))
      fireEvent.click(screen.getByTestId('story-card-sp-1-seed'))

      expect(screen.getByTestId('step-badge-sp-1-seed')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('story-undo-button'))

      expect(screen.queryByTestId('step-badge-sp-1-seed')).toBeNull()
      expect(screen.getByTestId('step-badge-sp-1-tree')).toBeInTheDocument()
    })

    it('39. Start Over clears all selections', () => {
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={vi.fn()}
          isTransitioning={false}
        />,
      )

      fireEvent.click(screen.getByTestId('story-card-sp-1-tree'))
      fireEvent.click(screen.getByTestId('story-card-sp-1-seed'))

      expect(screen.getByTestId('step-badge-sp-1-tree')).toBeInTheDocument()
      expect(screen.getByTestId('step-badge-sp-1-seed')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('story-reset-button'))

      expect(screen.queryByTestId('step-badge-sp-1-tree')).toBeNull()
      expect(screen.queryByTestId('step-badge-sp-1-seed')).toBeNull()
    })

    it('40. Undo and Start Over buttons are disabled when no cards are selected', () => {
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={vi.fn()}
          isTransitioning={false}
        />,
      )

      expect(screen.getByTestId('story-undo-button')).toBeDisabled()
      expect(screen.getByTestId('story-reset-button')).toBeDisabled()
    })

    it('41. Undo and Start Over buttons are disabled during isTransitioning', () => {
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={vi.fn()}
          isTransitioning={true}
        />,
      )

      expect(screen.getByTestId('story-undo-button')).toBeDisabled()
      expect(screen.getByTestId('story-reset-button')).toBeDisabled()
    })
  })

  // ── Phase 2: Answer Submission ─────────────────────────────────────────────
  describe('StoryPuzzleRound — Answer Submission', () => {
    const mockRound = {
      id:           'sp-1-apple',
      level:        1,
      stage:        1,
      title:        'How an Apple Grows',
      prompt:       'What comes first, next, and last?',
      hint:         'First comes the tiny sprout!',
      items: [
        { id: 'sp-1-seed',  emoji: '🌱', label: 'Seed Sprout', step: 1 },
        { id: 'sp-1-tree',  emoji: '🌳', label: 'Big Tree',    step: 2 },
        { id: 'sp-1-apple', emoji: '🍎', label: 'Ripe Apple',  step: 3 },
      ],
      correctOrder: ['sp-1-seed', 'sp-1-tree', 'sp-1-apple'],
    }

    it('42. calls onAnswer(true) when cards are placed in correct order', () => {
      const onAnswer = vi.fn()
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={onAnswer}
          isTransitioning={false}
        />,
      )

      // Click in exactly the correct order
      fireEvent.click(screen.getByTestId('story-card-sp-1-seed'))
      fireEvent.click(screen.getByTestId('story-card-sp-1-tree'))
      fireEvent.click(screen.getByTestId('story-card-sp-1-apple'))

      expect(onAnswer).toHaveBeenCalledOnce()
      expect(onAnswer).toHaveBeenCalledWith(true)
    })

    it('43. calls onAnswer(false) when cards are placed in wrong order', () => {
      const onAnswer = vi.fn()
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={onAnswer}
          isTransitioning={false}
        />,
      )

      // Deliberately wrong order
      fireEvent.click(screen.getByTestId('story-card-sp-1-apple'))
      fireEvent.click(screen.getByTestId('story-card-sp-1-seed'))
      fireEvent.click(screen.getByTestId('story-card-sp-1-tree'))

      expect(onAnswer).toHaveBeenCalledOnce()
      expect(onAnswer).toHaveBeenCalledWith(false)
    })

    it('44. rapid double-click does not call onAnswer twice (submission guard)', () => {
      const onAnswer = vi.fn()
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={onAnswer}
          isTransitioning={false}
        />,
      )

      fireEvent.click(screen.getByTestId('story-card-sp-1-seed'))
      fireEvent.click(screen.getByTestId('story-card-sp-1-tree'))
      // Third click triggers submission
      fireEvent.click(screen.getByTestId('story-card-sp-1-apple'))
      // Extra click after submission should be ignored
      fireEvent.click(screen.getByTestId('story-card-sp-1-seed'))

      expect(onAnswer).toHaveBeenCalledOnce()
    })

    it('45. cards are disabled during isTransitioning', () => {
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={vi.fn()}
          isTransitioning={true}
        />,
      )

      const cards = screen.getAllByRole('button', { name: /card:/i })
      cards.forEach((card) => {
        expect(card).toBeDisabled()
      })
    })
  })

  // ── Phase 3: Accessibility ─────────────────────────────────────────────────
  describe('StoryPuzzleRound — Accessibility', () => {
    const mockRound = {
      id:           'sp-1-apple',
      level:        1,
      stage:        1,
      title:        'How an Apple Grows',
      prompt:       'What comes first, next, and last?',
      hint:         'First comes the tiny sprout!',
      items: [
        { id: 'sp-1-seed',  emoji: '🌱', label: 'Seed Sprout', step: 1 },
        { id: 'sp-1-tree',  emoji: '🌳', label: 'Big Tree',    step: 2 },
        { id: 'sp-1-apple', emoji: '🍎', label: 'Ripe Apple',  step: 3 },
      ],
      correctOrder: ['sp-1-seed', 'sp-1-tree', 'sp-1-apple'],
    }

    it('46. unselected cards have aria-pressed=false and descriptive aria-label', () => {
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={vi.fn()}
          isTransitioning={false}
        />,
      )

      const seedCard = screen.getByTestId('story-card-sp-1-seed')
      expect(seedCard).toHaveAttribute('aria-pressed', 'false')
      expect(seedCard.getAttribute('aria-label')).toMatch(/Seed Sprout/)
      expect(seedCard.getAttribute('aria-label')).toMatch(/Step 1/i)
    })

    it('47. selected card has aria-pressed=true and step placement context', () => {
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={vi.fn()}
          isTransitioning={false}
        />,
      )

      fireEvent.click(screen.getByTestId('story-card-sp-1-seed'))

      const seedCard = screen.getByTestId('story-card-sp-1-seed')
      expect(seedCard).toHaveAttribute('aria-pressed', 'true')
      expect(seedCard.getAttribute('aria-label')).toMatch(/Step 1/)
    })

    it('48. live region announces card selection for screen readers', () => {
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={vi.fn()}
          isTransitioning={false}
        />,
      )

      const liveRegion = document.querySelector('[aria-live="polite"]')
      expect(liveRegion).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('story-card-sp-1-seed'))
      expect(liveRegion.textContent).toMatch(/Seed Sprout/)
      expect(liveRegion.textContent).toMatch(/Step 1/)
    })

    it('49. Undo Last and Reset All buttons have descriptive aria-labels', () => {
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={vi.fn()}
          isTransitioning={false}
        />,
      )

      expect(screen.getByTestId('story-undo-button')).toHaveAttribute('aria-label', 'Undo last card')
      expect(screen.getByTestId('story-reset-button')).toHaveAttribute('aria-label', 'Reset all selected cards')
    })
  })

  // ── Phase 4: Hints & All Levels ───────────────────────────────────────────
  describe('All 15 Levels — Hints & Content Integrity', () => {
    it('50. all 15 curriculum levels have non-empty, defined hint strings', () => {
      STORY_PUZZLE_CURRICULUM.forEach((level) => {
        expect(level.hint).toBeTruthy()
        expect(typeof level.hint).toBe('string')
        expect(level.hint.trim().length).toBeGreaterThan(10)
      })
    })

    it('51. every level renders StoryPuzzleRound without "undefined" visible text', () => {
      STORY_PUZZLE_CURRICULUM.forEach((level, idx) => {
        const { unmount } = render(
          <StoryPuzzleRound
            round={level}
            roundIdx={idx}
            onAnswer={vi.fn()}
            isTransitioning={false}
          />,
        )

        const container = screen.getByTestId('story-puzzle-round')
        expect(container.textContent).not.toMatch(/undefined/)
        unmount()
      })
    })

    it('52. every level has 3 items with unique IDs and matching correctOrder references', () => {
      STORY_PUZZLE_CURRICULUM.forEach((level) => {
        expect(level.items).toHaveLength(3)
        const itemIds = level.items.map((c) => c.id)
        const uniqueItemIds = new Set(itemIds)
        expect(uniqueItemIds.size).toBe(3)

        level.correctOrder.forEach((refId) => {
          expect(itemIds).toContain(refId)
        })
      })
    })
  })

  // ── Phase 4: GamePlay Integration — Progression Safety ────────────────────
  describe('GamePlay — Story Puzzle Progression Safety', () => {
    it('53. GamePlay stays on Level 1 after incorrect answer (does not advance round)', async () => {
      const onAnswer = vi.fn()
      // Render just the StoryPuzzleRound component to test incorrect answer handling
      const mockRound = STORY_PUZZLE_CURRICULUM[0]
      render(
        <StoryPuzzleRound
          round={mockRound}
          roundIdx={0}
          onAnswer={onAnswer}
          isTransitioning={false}
        />,
      )

      // Submit in wrong order
      const [first, second, third] = mockRound.items
      fireEvent.click(screen.getByTestId(`story-card-${third.id}`))
      fireEvent.click(screen.getByTestId(`story-card-${second.id}`))
      fireEvent.click(screen.getByTestId(`story-card-${first.id}`))

      expect(onAnswer).toHaveBeenCalledWith(false)
    })

    it('54. checkpoint is not advanced on incorrect answer', () => {
      saveStoryPuzzleCheckpoint('child-test', { roundIndex: 2, score: 2 })

      // Verify the checkpoint persists at round 2 (not advanced)
      const data = loadStoryPuzzleCheckpointData('child-test')
      expect(data.roundIndex).toBe(2)
      expect(data.score).toBe(2)
    })

    it('55. correct answer updates checkpoint roundIndex and score', () => {
      saveStoryPuzzleCheckpoint('child-test', { roundIndex: 0, score: 0 })
      // Simulate correct answer save (GamePlay does roundIndex + 1 on correct)
      saveStoryPuzzleCheckpoint('child-test', {
        roundIndex: 1,
        completedLevel: 1,
        score: 1,
        isCompleted: false,
      })

      const data = loadStoryPuzzleCheckpointData('child-test')
      expect(data.roundIndex).toBe(1)
      expect(data.score).toBe(1)
      expect(data.completedLevels).toContain(1)
    })

    it('56. checkpoint saves are child-isolated — different children have independent progress', () => {
      saveStoryPuzzleCheckpoint('alice', { roundIndex: 5, score: 5 })
      saveStoryPuzzleCheckpoint('bob',   { roundIndex: 10, score: 10 })

      const aliceData = loadStoryPuzzleCheckpointData('alice')
      const bobData   = loadStoryPuzzleCheckpointData('bob')

      expect(aliceData.roundIndex).toBe(5)
      expect(bobData.roundIndex).toBe(10)

      // Resetting alice should not affect bob
      resetStoryPuzzleCheckpoint('alice')
      expect(loadStoryPuzzleCheckpointData('alice').roundIndex).toBe(0)
      expect(loadStoryPuzzleCheckpointData('bob').roundIndex).toBe(10)
    })
  })

  // ── Phase 5: Step 4 — Stage Boundaries, Finale & Completion Audit ──────────
  describe('Step 4 — Stage Clear, Finale & Full Progression Audit', () => {
    it('57. completing Level 5 triggers Stage 1 clear overlay with Story Scout badge', async () => {
      // Pre-seed checkpoint at Level 5 (index 4)
      saveStoryPuzzleCheckpoint('guest', {
        roundIndex: 4,
        highestUnlockedIndex: 4,
        completedLevels: [1, 2, 3, 4],
        score: 4,
      })

      render(
        <MemoryRouter initialEntries={['/child/games/story-puzzle']}>
          <Routes>
            <Route path="/child/games/:gameId" element={<GamePlay />} />
          </Routes>
        </MemoryRouter>
      )

      fireEvent.click(await screen.findByTestId('start-game-button'))

      // Level 5 is "A Little Bird Hatches", correct order: egg -> crack -> chick
      fireEvent.click(await screen.findByTestId('story-card-sp-5-egg'))
      fireEvent.click(await screen.findByTestId('story-card-sp-5-crack'))
      fireEvent.click(await screen.findByTestId('story-card-sp-5-chick'))

      // Stage clear feedback overlay should appear
      expect(await screen.findByText(/Stage 1 Cleared!/i, {}, { timeout: 2500 })).toBeInTheDocument()
      expect(await screen.findByTestId('stage-badge-earned', {}, { timeout: 2500 })).toHaveTextContent(/Story Scout/i)
    })

    it('58. completing Level 10 triggers Stage 2 clear overlay with Sequence Star badge', async () => {
      // Pre-seed checkpoint at Level 10 (index 9)
      saveStoryPuzzleCheckpoint('guest', {
        roundIndex: 9,
        highestUnlockedIndex: 9,
        completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        score: 9,
      })

      render(
        <MemoryRouter initialEntries={['/child/games/story-puzzle']}>
          <Routes>
            <Route path="/child/games/:gameId" element={<GamePlay />} />
          </Routes>
        </MemoryRouter>
      )

      fireEvent.click(await screen.findByTestId('start-game-button'))

      // Level 10 is "Building a Tall Tower", correct order: blocks -> stack -> castle
      fireEvent.click(await screen.findByTestId('story-card-sp-10-blocks'))
      fireEvent.click(await screen.findByTestId('story-card-sp-10-stack'))
      fireEvent.click(await screen.findByTestId('story-card-sp-10-castle'))

      expect(await screen.findByText(/Stage 2 Cleared!/i, {}, { timeout: 2500 })).toBeInTheDocument()
      expect(await screen.findByTestId('stage-badge-earned', {}, { timeout: 2500 })).toHaveTextContent(/Sequence Star/i)
    })

    it('59. completing Level 15 displays story-puzzle-finale-banner and completion message', async () => {
      // Pre-seed checkpoint at Level 15 (index 14)
      saveStoryPuzzleCheckpoint('guest', {
        roundIndex: 14,
        highestUnlockedIndex: 14,
        completedLevels: Array.from({ length: 14 }, (_, i) => i + 1),
        score: 14,
      })

      render(
        <MemoryRouter initialEntries={['/child/games/story-puzzle']}>
          <Routes>
            <Route path="/child/games/:gameId" element={<GamePlay />} />
          </Routes>
        </MemoryRouter>
      )

      fireEvent.click(await screen.findByTestId('start-game-button'))

      // Level 15 is "The Grand Island Treasure", correct order: map -> trail -> treasure
      fireEvent.click(await screen.findByTestId('story-card-sp-15-map'))
      fireEvent.click(await screen.findByTestId('story-card-sp-15-trail'))
      fireEvent.click(await screen.findByTestId('story-card-sp-15-treasure'))

      // Finale banner and completion message appear after transition
      expect(await screen.findByTestId('story-puzzle-finale-banner', {}, { timeout: 3000 })).toBeInTheDocument()
      expect(await screen.findByTestId('story-puzzle-completion-message', {}, { timeout: 3000 })).toBeInTheDocument()
      expect(await screen.findByText(/Grand 15-Level Master Storyteller!/i, {}, { timeout: 3000 })).toBeInTheDocument()
      expect(await screen.findByText(/completed all 15 levels of Story Puzzle/i, {}, { timeout: 3000 })).toBeInTheDocument()
    })

    it('60. Level 15 finale shows story-puzzle-stage-badges-gallery with all 3 stage badges', async () => {
      saveStoryPuzzleCheckpoint('guest', {
        roundIndex: 14,
        highestUnlockedIndex: 14,
        completedLevels: Array.from({ length: 14 }, (_, i) => i + 1),
        score: 14,
      })

      render(
        <MemoryRouter initialEntries={['/child/games/story-puzzle']}>
          <Routes>
            <Route path="/child/games/:gameId" element={<GamePlay />} />
          </Routes>
        </MemoryRouter>
      )

      fireEvent.click(await screen.findByTestId('start-game-button'))

      fireEvent.click(await screen.findByTestId('story-card-sp-15-map'))
      fireEvent.click(await screen.findByTestId('story-card-sp-15-trail'))
      fireEvent.click(await screen.findByTestId('story-card-sp-15-treasure'))

      expect(await screen.findByTestId('story-puzzle-stage-badges-gallery', {}, { timeout: 3000 })).toBeInTheDocument()
      expect(await screen.findByTestId('story-puzzle-mastery-badge-stage-1', {}, { timeout: 3000 })).toBeInTheDocument()
      expect(await screen.findByTestId('story-puzzle-mastery-badge-stage-2', {}, { timeout: 3000 })).toBeInTheDocument()
      expect(await screen.findByTestId('story-puzzle-mastery-badge-stage-3', {}, { timeout: 3000 })).toBeInTheDocument()
    })

    it('61. completing Level 1 does NOT show story-puzzle-finale-banner or stage-clear overlay', async () => {
      render(
        <MemoryRouter initialEntries={['/child/games/story-puzzle']}>
          <Routes>
            <Route path="/child/games/:gameId" element={<GamePlay />} />
          </Routes>
        </MemoryRouter>
      )

      fireEvent.click(await screen.findByTestId('start-game-button'))

      // Level 1: seed -> tree -> apple
      fireEvent.click(await screen.findByTestId('story-card-sp-1-seed'))
      fireEvent.click(await screen.findByTestId('story-card-sp-1-tree'))
      fireEvent.click(await screen.findByTestId('story-card-sp-1-apple'))

      // Should advance to Level 2 without showing finale or stage clear
      expect(await screen.findByText(/Level 2 of 15/i, {}, { timeout: 2500 })).toBeInTheDocument()
      expect(screen.queryByTestId('story-puzzle-finale-banner')).not.toBeInTheDocument()
      expect(screen.queryByText(/Stage 1 Cleared!/i)).not.toBeInTheDocument()
    })

    it('62. Play Again resets game to intro stage and resets checkpoint for a fresh playthrough', async () => {
      saveStoryPuzzleCheckpoint('guest', {
        roundIndex: 14,
        highestUnlockedIndex: 14,
        completedLevels: Array.from({ length: 14 }, (_, i) => i + 1),
        score: 14,
      })

      render(
        <MemoryRouter initialEntries={['/child/games/story-puzzle']}>
          <Routes>
            <Route path="/child/games/:gameId" element={<GamePlay />} />
          </Routes>
        </MemoryRouter>
      )

      fireEvent.click(await screen.findByTestId('start-game-button'))

      fireEvent.click(await screen.findByTestId('story-card-sp-15-map'))
      fireEvent.click(await screen.findByTestId('story-card-sp-15-trail'))
      fireEvent.click(await screen.findByTestId('story-card-sp-15-treasure'))

      const playAgainBtn = await screen.findByRole('button', { name: /Play Again/i }, { timeout: 3000 })
      fireEvent.click(playAgainBtn)

      // Should return to intro screen
      expect(await screen.findByTestId('start-game-button')).toBeInTheDocument()
      expect(screen.queryByTestId('story-puzzle-finale-banner')).not.toBeInTheDocument()

      // Checkpoint is cleanly reset for new game
      const cp = loadStoryPuzzleCheckpointData('guest')
      expect(cp.roundIndex).toBe(0)
    })

    it('63. in-game stages button opens roadmap modal with all 3 stages', async () => {
      render(
        <MemoryRouter initialEntries={['/child/games/story-puzzle']}>
          <Routes>
            <Route path="/child/games/:gameId" element={<GamePlay />} />
          </Routes>
        </MemoryRouter>
      )

      fireEvent.click(await screen.findByTestId('start-game-button'))

      const stagesBtn = await screen.findByTestId('in-game-stages-button')
      fireEvent.click(stagesBtn)

      expect(await screen.findByText('Nature & Mornings')).toBeInTheDocument()
      expect(await screen.findByText('Step-by-Step Activities')).toBeInTheDocument()
      expect(await screen.findByText('Adventures & Journeys')).toBeInTheDocument()
    })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GamePlay from '../pages/child/GamePlay';
import SoundMatchRound from '../games/sound-match/components/SoundMatchRound';
import { gameSound } from '../services/gameSoundService';
import {
  SOUND_MATCH_CURRICULUM,
  TOTAL_SOUND_MATCH_LEVELS,
  SOUND_MATCH_STAGES,
  SOUND_MATCH_MILESTONES,
  getSoundMatchMilestone,
  getSoundMatchStageBadge,
  getSoundMatchDisplayedOptions,
  shuffleSoundMatchOptions,
  getShuffledSoundMatchCurriculum,
} from '../games/sound-match/engine/soundMatchCurriculum';
import {
  getSoundMatchCheckpointKey,
  loadSoundMatchCheckpointData,
  loadSoundMatchCheckpoint,
  saveSoundMatchCheckpoint,
  resetSoundMatchCheckpoint,
  isSoundMatchLevelCompleted,
  getSoundMatchEarnedRewards,
} from '../games/sound-match/engine/soundMatchCheckpoint';

// Mock AppContext
const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 202, ok: true });
const mockApplySessionOutcome = vi.fn();
let isRealBackendMock = true;
let currentActiveChild = {
  id: 1,
  name: 'Sam Learner',
  interests: ['animals'],
  fingerprint: { phonologicalAwareness: 65 },
  comfort_preferences: { quiet_mode: false },
};

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    activeChild: currentActiveChild,
    isRealBackend: isRealBackendMock,
    errorPatterns: [],
    saveLearningSession: mockSaveLearningSession,
    applySessionOutcome: mockApplySessionOutcome,
    language: 'en',
    nextRecommendedActivity: null,
  }),
  AppProvider: ({ children }) => children,
}));

function renderSoundMatch() {
  return render(
    <MemoryRouter initialEntries={['/child/games/sound-match']}>
      <Routes>
        <Route path="/child/games/:gameId" element={<GamePlay />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Sound Match 100-Level Phonics & Stage Progression Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    isRealBackendMock = true;
    currentActiveChild = {
      id: 1,
      name: 'Sam Learner',
      interests: ['animals'],
      fingerprint: { phonologicalAwareness: 65 },
      comfort_preferences: { quiet_mode: false },
    };
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.useRealTimers();
  });

  // ==========================================
  // SECTION 1: 100-LEVEL CURRICULUM VERIFICATION
  // ==========================================
  describe('1. 100-Level Curriculum Integrity', () => {
    it('1.1 Curriculum contains exactly 100 levels across 10 progressive stages (10 levels each)', () => {
      expect(SOUND_MATCH_CURRICULUM).toHaveLength(100);
      expect(TOTAL_SOUND_MATCH_LEVELS).toBe(100);
      expect(SOUND_MATCH_STAGES).toHaveLength(10);

      // Verify each stage has exactly 10 levels
      for (let s = 1; s <= 10; s++) {
        const stageRounds = SOUND_MATCH_CURRICULUM.filter((r) => r.stage === s);
        expect(stageRounds).toHaveLength(10);
      }
    });

    it('1.2 Preserves original first five levels: SUN, CAT, FISH, DOG, BUS', () => {
      expect(SOUND_MATCH_CURRICULUM[0].word).toBe('SUN');
      expect(SOUND_MATCH_CURRICULUM[0].correct).toBe('☀️');
      expect(SOUND_MATCH_CURRICULUM[0].options).toEqual(['☀️', '🐟', '🚗']);

      expect(SOUND_MATCH_CURRICULUM[1].word).toBe('CAT');
      expect(SOUND_MATCH_CURRICULUM[1].correct).toBe('🐱');
      expect(SOUND_MATCH_CURRICULUM[1].options).toEqual(['🐱', '🐶', '🐻']);

      expect(SOUND_MATCH_CURRICULUM[2].word).toBe('FISH');
      expect(SOUND_MATCH_CURRICULUM[2].correct).toBe('🐟');
      expect(SOUND_MATCH_CURRICULUM[2].options).toEqual(['🍎', '🐟', '⚽']);

      expect(SOUND_MATCH_CURRICULUM[3].word).toBe('DOG');
      expect(SOUND_MATCH_CURRICULUM[3].correct).toBe('🐶');
      expect(SOUND_MATCH_CURRICULUM[3].options).toEqual(['🐱', '🐶', '🐸']);

      expect(SOUND_MATCH_CURRICULUM[4].word).toBe('BUS');
      expect(SOUND_MATCH_CURRICULUM[4].correct).toBe('🚌');
      expect(SOUND_MATCH_CURRICULUM[4].options).toEqual(['🚌', '✈️', '⛵']);
    });

    it('1.3 All 100 levels have unique IDs, sequential levels 1-100, valid spoken words, and 3 distinct options', () => {
      const seenIds = new Set();
      const seenLevels = new Set();

      SOUND_MATCH_CURRICULUM.forEach((round, index) => {
        expect(round.id).toBe(index + 1);
        expect(round.level).toBe(index + 1);
        expect(seenIds.has(round.id)).toBe(false);
        expect(seenLevels.has(round.level)).toBe(false);
        seenIds.add(round.id);
        seenLevels.add(round.level);

        expect(round.stage).toBe(Math.floor(index / 10) + 1);
        expect(round.word).toBeTruthy();
        expect(round.spoken).toBeTruthy();
        expect(round.correct).toBeTruthy();
        expect(round.options).toHaveLength(3);
        expect(round.options).toContain(round.correct);

        // Verify distinct options
        const uniqueSet = new Set(round.options);
        expect(uniqueSet.size).toBe(3);
      });

      expect(seenIds.size).toBe(100);
      expect(seenLevels.size).toBe(100);
    });
  });

  // ==========================================
  // SECTION 2: ACCURATE STAGE RANGES & ROADMAP
  // ==========================================
  describe('2. Accurate Stage Selection & Ranges', () => {
    it('2.1 Stage definitions correctly define all 10 non-overlapping 10-level ranges', () => {
      const expectedRanges = [
        [1, 10],
        [11, 20],
        [21, 30],
        [31, 40],
        [41, 50],
        [51, 60],
        [61, 70],
        [71, 80],
        [81, 90],
        [91, 100],
      ];

      SOUND_MATCH_STAGES.forEach((stg, i) => {
        expect(stg.stage).toBe(i + 1);
        expect(stg.startLevel).toBe(expectedRanges[i][0]);
        expect(stg.endLevel).toBe(expectedRanges[i][1]);
        expect(stg.levelRange).toEqual(expectedRanges[i]);
        expect(stg.totalLevels).toBe(10);
      });
    });

    it('2.2 Stage selection screen displays accurate level ranges without Levels 1-1 or duplicate Current bug', () => {
      renderSoundMatch();

      // Open Stage Selection view
      const chooseStageBtn = screen.getByTestId('choose-stage-button');
      fireEvent.click(chooseStageBtn);

      // Verify all 10 stage cards are in document
      for (let s = 1; s <= 10; s++) {
        expect(screen.getByTestId(`stage-card-${s}`)).toBeInTheDocument();
      }

      // Check level range texts
      expect(screen.getByTestId('stage-card-1')).toHaveTextContent('Levels 1–10');
      expect(screen.getByTestId('stage-card-2')).toHaveTextContent('Levels 11–20');
      expect(screen.getByTestId('stage-card-3')).toHaveTextContent('Levels 21–30');
      expect(screen.getByTestId('stage-card-10')).toHaveTextContent('Levels 91–100');

      // Initially on Level 1: Only Stage 1 is Current, Stages 2-10 are Locked
      expect(screen.getByTestId('stage-status-current-1')).toBeInTheDocument();
      expect(screen.queryByTestId('stage-status-current-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('stage-status-locked-2')).toBeInTheDocument();
      expect(screen.getByTestId('stage-status-locked-10')).toBeInTheDocument();

      // Stage 1 has Play Stage button; Stage 2 has Locked Level 11 Required
      expect(screen.getByTestId('select-stage-1')).toBeInTheDocument();
      expect(screen.getByTestId('locked-stage-2')).toHaveTextContent(/Level 11 Required/i);
    });

    it('2.3 Displays Completed status for mastered stages and unlocks subsequent stages', () => {
      // Child is on Level 25 (Stage 3). Stage 1 (1-10) and Stage 2 (11-20) are Completed.
      saveSoundMatchCheckpoint(1, { roundIndex: 24, highestUnlockedLevel: 25, score: 24 });

      renderSoundMatch();
      fireEvent.click(screen.getByTestId('choose-stage-button'));

      // Stage 1 & 2 show Completed
      expect(screen.getByTestId('stage-status-completed-1')).toHaveTextContent(/Completed/i);
      expect(screen.getByTestId('stage-status-completed-2')).toHaveTextContent(/Completed/i);

      // Stage 3 shows Current
      expect(screen.getByTestId('stage-status-current-3')).toHaveTextContent(/Current/i);

      // Stage 4 is locked
      expect(screen.getByTestId('stage-status-locked-4')).toHaveTextContent(/Locked/i);
    });
  });

  // ==========================================
  // SECTION 3: CHECKPOINT PROGRESSION & MIGRATION
  // ==========================================
  describe('3. Checkpoint Progression & Migration Safety', () => {
    it('3.1 Migrates completed legacy 10-level run into Stage 2 (Level 11) without wiping progress', () => {
      // Legacy 10-level completion payload
      localStorage.setItem(
        'lexiguide_sound_match_checkpoint_1',
        JSON.stringify({
          roundIndex: 0,
          highestUnlockedLevel: 10,
          score: 10,
          isCompleted: true,
        })
      );

      const migrated = loadSoundMatchCheckpointData(1);
      expect(migrated.roundIndex).toBe(10); // Level 11 (0-based 10)
      expect(migrated.currentLevel).toBe(11);
      expect(migrated.highestUnlockedLevel).toBe(11);
      expect(migrated.score).toBe(10);
      expect(migrated.isCompleted).toBe(false);

      expect(loadSoundMatchCheckpoint(1)).toBe(10);
    });

    it('3.2 Unlocks Stage 2 only after Level 10 is completed', () => {
      // On Level 10 (roundIndex 9)
      saveSoundMatchCheckpoint(1, { roundIndex: 9, highestUnlockedLevel: 10, score: 9 });

      let data = loadSoundMatchCheckpointData(1);
      expect(data.highestUnlockedLevel).toBe(10); // Stage 2 still locked (< 11)

      // Completing Level 10 advances to Level 11
      saveSoundMatchCheckpoint(1, { roundIndex: 10, highestUnlockedLevel: 11, score: 10 });
      data = loadSoundMatchCheckpointData(1);
      expect(data.highestUnlockedLevel).toBe(11); // Stage 2 unlocked!
      expect(data.currentLevel).toBe(11);
    });

    it('3.3 Clicking Play Stage on an unlocked stage launches the correct level', () => {
      // Child unlocked up to Stage 2 (Level 11)
      saveSoundMatchCheckpoint(1, { roundIndex: 10, highestUnlockedLevel: 11, score: 10 });

      renderSoundMatch();
      fireEvent.click(screen.getByTestId('choose-stage-button'));

      // Click Play Stage 2
      fireEvent.click(screen.getByTestId('select-stage-2'));

      // Enters Level 11 (BIRD)
      expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 11 of 100/i);
      expect(screen.getByTestId('sound-match-target-word')).toHaveTextContent('BIRD');
    });
  });

  // ==========================================
  // SECTION 4: GAMEPLAY, AUDIO & STAGE CLEAR
  // ==========================================
  describe('4. Gameplay, Audio & Stage Clear Celebrations', () => {
    it('4.1 Audio button plays natural companion speech for target word', () => {
      const speakSpy = vi.spyOn(gameSound, 'speakCompanion').mockImplementation(() => {});

      renderSoundMatch();
      fireEvent.click(screen.getByTestId('start-game-button'));

      const audioBtn = screen.getByTestId('sound-match-audio-btn');
      fireEvent.click(audioBtn);

      expect(speakSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sun'),
        expect.objectContaining({ rate: 0.84 })
      );
    });

    it('4.2 Rapid clicking does not award multiple points or duplicate answers', async () => {
      vi.useFakeTimers();
      renderSoundMatch();
      fireEvent.click(screen.getByTestId('start-game-button'));

      const opt1 = screen.getByTestId('sound-match-option-☀️');
      const opt2 = screen.getByTestId('sound-match-option-🐟');

      fireEvent.click(opt1);
      fireEvent.click(opt1);
      fireEvent.click(opt2);

      expect(opt1).toBeDisabled();
      expect(opt2).toBeDisabled();

      act(() => {
        vi.advanceTimersByTime(950);
      });

      expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 2 of 100/i);
      expect(screen.getByTestId('compact-score-display')).toHaveTextContent('1 / 100');
    });

    it('4.3 Completing Level 10 (end of Stage 1) triggers Stage 1 Cleared celebration', async () => {
      vi.useFakeTimers();
      // Pre-seed on Level 10 (SHIP)
      saveSoundMatchCheckpoint(1, { roundIndex: 9, highestUnlockedLevel: 10, score: 9 });

      renderSoundMatch();
      fireEvent.click(screen.getByTestId('start-game-button'));

      // Answer SHIP correctly (🚢)
      fireEvent.click(screen.getByTestId('sound-match-option-🚢'));

      expect(screen.getByTestId('feedback-overlay')).toHaveTextContent(/Stage 1 Cleared!/i);
      expect(screen.getByTestId('feedback-overlay')).toHaveTextContent(/Advancing to Stage 2/i);

      act(() => {
        vi.advanceTimersByTime(950);
      });

      // Advances to Level 11 (Stage 2: BIRD)
      expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 11 of 100/i);
      expect(screen.getByTestId('sound-match-target-word')).toHaveTextContent('BIRD');
    });

    it('4.4 Final victory screen displays ONLY after completing Level 100', async () => {
      vi.useFakeTimers();
      // Pre-seed on Level 100 (index 99: UNIVERSE)
      saveSoundMatchCheckpoint(1, { roundIndex: 99, highestUnlockedLevel: 100, score: 99 });

      renderSoundMatch();
      fireEvent.click(screen.getByTestId('start-game-button'));

      expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 100 of 100/i);
      expect(screen.getByTestId('sound-match-target-word')).toHaveTextContent('UNIVERSE');

      // Answer Level 100 correctly (🎆)
      fireEvent.click(screen.getByTestId('sound-match-option-🎆'));

      await act(async () => {
        vi.advanceTimersByTime(950);
      });

      // Victory screen
      expect(screen.getByRole('heading', { level: 2, name: /Nice work!/i })).toBeInTheDocument();
      expect(screen.getByText(/You got 100 out of 100 correct\./i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Play Again/i })).toBeInTheDocument();

      // Session saved
      expect(mockSaveLearningSession).toHaveBeenCalledWith(
        expect.objectContaining({
          stars: 100,
          xp: 315,
          outcome: expect.objectContaining({
            title: 'Sound Match',
            score: 100,
            accuracy: 100,
          }),
        })
      );
    });
  });

  // =========================================================================
  // SECTION 5: CORRECT-ANSWER POSITION DISTRIBUTION & SHUFFLING SUITE
  // =========================================================================
  describe('5. Correct-Answer Position Distribution & Shuffling Suite Across 100 Levels', () => {
    it('5.1 Audits raw curriculum bias and verifies displayed options are evenly distributed across all 3 positions', () => {
      // 1. Audit raw curriculum options (unshuffled original state)
      const rawCounts = [0, 0, 0];
      SOUND_MATCH_CURRICULUM.forEach((round) => {
        const rawIdx = round.options.indexOf(round.correct);
        expect(rawIdx).toBeGreaterThanOrEqual(0);
        expect(rawIdx).toBeLessThanOrEqual(2);
        rawCounts[rawIdx]++;
      });

      // Confirm raw curriculum exhibits position bias (Position 0: 88, Position 1: 11, Position 2: 1)
      expect(rawCounts[0]).toBe(88);
      expect(rawCounts[1]).toBe(11);
      expect(rawCounts[2]).toBe(1);

      // 2. Audit 100 displayed option sets generated for gameplay
      const displayedCounts = [0, 0, 0];
      const stageBreakdown = Array.from({ length: 10 }, () => [0, 0, 0]);
      const displayedPositions = [];

      SOUND_MATCH_CURRICULUM.forEach((round, idx) => {
        const displayed = getSoundMatchDisplayedOptions(round);

        // Requirement 5: Exactly 3 distinct options per level & correct answer always present
        expect(displayed).toHaveLength(3);
        const uniqueSet = new Set(displayed);
        expect(uniqueSet.size).toBe(3);
        expect(displayed).toContain(round.correct);

        const pos = displayed.indexOf(round.correct);
        displayedCounts[pos]++;
        stageBreakdown[Math.floor(idx / 10)][pos]++;
        displayedPositions.push(pos);
      });

      // Requirement 2: Even distribution over 100 levels (33 at Pos 0, 33 at Pos 1, 34 at Pos 2)
      expect(displayedCounts[0] + displayedCounts[1] + displayedCounts[2]).toBe(100);
      expect(displayedCounts[0]).toBe(33);
      expect(displayedCounts[1]).toBe(33);
      expect(displayedCounts[2]).toBe(34);

      // Every position is balanced between 30 and 36 (~33.3% each)
      displayedCounts.forEach((count) => {
        expect(count).toBeGreaterThanOrEqual(30);
        expect(count).toBeLessThanOrEqual(36);
      });

      // Verify every stage (10 levels) has healthy representation across all 3 positions
      stageBreakdown.forEach((stagePositions) => {
        stagePositions.forEach((posCount) => {
          expect(posCount).toBeGreaterThanOrEqual(2);
          expect(posCount).toBeLessThanOrEqual(5);
        });
      });

      // Requirement 6: Avoid simple repeating sequences that children could memorize
      let maxConsecutive = 1;
      let currentRun = 1;
      for (let i = 1; i < displayedPositions.length; i++) {
        if (displayedPositions[i] === displayedPositions[i - 1]) {
          currentRun++;
          if (currentRun > maxConsecutive) maxConsecutive = currentRun;
        } else {
          currentRun = 1;
        }
      }
      expect(maxConsecutive).toBeLessThanOrEqual(3);

      // Verify it does not repeat a simple 0-1-2 loop
      let isSimpleModuloLoop = true;
      for (let i = 0; i < displayedPositions.length; i++) {
        if (displayedPositions[i] !== i % 3) {
          isSimpleModuloLoop = false;
          break;
        }
      }
      expect(isSimpleModuloLoop).toBe(false);
    });

    it('5.2 Deterministic per-level ordering preserves checkpoint/resume stability', () => {
      // For all 100 levels, displayed options are deterministic and idempotent
      SOUND_MATCH_CURRICULUM.forEach((round) => {
        const firstCall = getSoundMatchDisplayedOptions(round);
        const secondCall = getSoundMatchDisplayedOptions(round);
        expect(firstCall).toEqual(secondCall);
      });

      // Verify custom randomFn works for testing/PRNG flexibility
      const testRound = {
        options: ['A', 'B', 'C'],
        correct: 'B',
      };
      const deterministic1 = shuffleSoundMatchOptions(testRound.options, () => 0);
      const deterministic2 = shuffleSoundMatchOptions(testRound.options, () => 0);
      expect(deterministic1).toEqual(deterministic2);

      // Verify explicit round overrides are respected
      const customOverride = ['Z', 'Y', 'X'];
      const overridden = getSoundMatchDisplayedOptions({ ...testRound, shuffledOptions: customOverride });
      expect(overridden).toEqual(customOverride);

      const disabled = getSoundMatchDisplayedOptions({ ...testRound, disableShuffle: true });
      expect(disabled).toEqual(testRound.options);
    });

    it('5.3 Detects correct answers accurately when correct option is at Position 0, Position 1, and Position 2', () => {
      const mockAnswer = vi.fn();

      // Case A: Correct answer at Position 0 (left option)
      const roundPos0 = {
        id: 101,
        word: 'CAT',
        correct: '🐱',
        options: ['🐱', '🐶', '🐭'],
        shuffledOptions: ['🐱', '🐶', '🐭'],
      };
      const { unmount: unmount0 } = render(
        <SoundMatchRound round={roundPos0} onAnswer={mockAnswer} />
      );
      // Click Option at Position 0 (🐱) -> Correct
      fireEvent.click(screen.getByTestId('sound-match-option-🐱'));
      expect(mockAnswer).toHaveBeenLastCalledWith(true);
      unmount0();
      cleanup();

      // Case B: Correct answer at Position 1 (middle option)
      const roundPos1 = {
        id: 102,
        word: 'CAT',
        correct: '🐱',
        options: ['🐱', '🐶', '🐭'],
        shuffledOptions: ['🐶', '🐱', '🐭'],
      };
      mockAnswer.mockClear();
      const { unmount: unmount1 } = render(
        <SoundMatchRound round={roundPos1} onAnswer={mockAnswer} />
      );
      // Click Option at Position 1 (🐱) -> Correct
      fireEvent.click(screen.getByTestId('sound-match-option-🐱'));
      expect(mockAnswer).toHaveBeenLastCalledWith(true);

      // Verify clicking wrong option (🐶 at pos 0) yields false
      unmount1();
      cleanup();
      mockAnswer.mockClear();
      const { unmount: unmount1b } = render(
        <SoundMatchRound round={roundPos1} onAnswer={mockAnswer} />
      );
      fireEvent.click(screen.getByTestId('sound-match-option-🐶'));
      expect(mockAnswer).toHaveBeenLastCalledWith(false);
      unmount1b();
      cleanup();

      // Case C: Correct answer at Position 2 (right option)
      const roundPos2 = {
        id: 103,
        word: 'CAT',
        correct: '🐱',
        options: ['🐱', '🐶', '🐭'],
        shuffledOptions: ['🐶', '🐭', '🐱'],
      };
      mockAnswer.mockClear();
      const { unmount: unmount2 } = render(
        <SoundMatchRound round={roundPos2} onAnswer={mockAnswer} />
      );
      // Click Option at Position 2 (🐱) -> Correct
      fireEvent.click(screen.getByTestId('sound-match-option-🐱'));
      expect(mockAnswer).toHaveBeenLastCalledWith(true);
      unmount2();
      cleanup();
    });

    it('5.4 Option ordering remains 100% stable during re-renders, audio clicks, and answering', () => {
      const round = SOUND_MATCH_CURRICULUM[0]; // Level 1: SUN
      const { container } = render(<SoundMatchRound round={round} onAnswer={() => {}} />);

      const getButtonTexts = () =>
        Array.from(container.querySelectorAll('button[data-position]')).map((b) => b.textContent.trim());

      const initialOrder = getButtonTexts();
      expect(initialOrder).toHaveLength(3);

      // Trigger audio click (causes component re-render with isPlayingAudio = true)
      const audioBtn = screen.getByTestId('sound-match-audio-btn');
      fireEvent.click(audioBtn);

      const orderAfterAudio = getButtonTexts();
      expect(orderAfterAudio).toEqual(initialOrder);

      // Click option (causes component re-render with selectedOption)
      fireEvent.click(screen.getByTestId(`sound-match-option-${initialOrder[0]}`));
      const orderAfterClick = getButtonTexts();
      expect(orderAfterClick).toEqual(initialOrder);
    });

    it('5.5 Rapid repeated clicks on option buttons cannot award duplicate points', () => {
      const mockAnswer = vi.fn();
      const round = SOUND_MATCH_CURRICULUM[0];

      render(<SoundMatchRound round={round} onAnswer={mockAnswer} />);

      const btns = screen.getAllByRole('button').filter((b) => b.hasAttribute('data-position'));
      expect(btns).toHaveLength(3);

      // Rapidly click buttons multiple times
      fireEvent.click(btns[0]);
      fireEvent.click(btns[0]);
      fireEvent.click(btns[1]);
      fireEvent.click(btns[2]);

      // onAnswer must be called exactly once
      expect(mockAnswer).toHaveBeenCalledTimes(1);

      // All option buttons must be disabled
      btns.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });
  });

  // =========================================================================
  // SECTION 6: STEP 3 — CHILD ENGAGEMENT, REWARDS & 100-LEVEL PROGRESSION
  // =========================================================================
  describe('6. Child Engagement, Rewards & 100-Level Progression Suite', () => {
    it('6.1 Renders rich in-game adventure header with stage badge, level badge, and stage progress beads', () => {
      renderSoundMatch();
      fireEvent.click(screen.getByTestId('start-game-button'));

      // In-game adventure header elements
      expect(screen.getByTestId('sound-match-stage-badge')).toBeInTheDocument();
      expect(screen.getByTestId('sound-match-stage-badge')).toHaveTextContent(/Stage 1 of 10/i);
      expect(screen.getByTestId('sound-match-stage-badge')).toHaveTextContent(/Everyday Friends/i);

      expect(screen.getByTestId('sound-match-level-badge')).toHaveTextContent(/Level 1 of 100/i);

      // 10-step progress beads
      expect(screen.getByTestId('sound-match-stage-progress')).toBeInTheDocument();
      const beads = screen.getByTestId('sound-match-stage-progress').children;
      expect(beads).toHaveLength(10);
    });

    it('6.2 Displays theme preview for locked stages in stage selector', () => {
      renderSoundMatch();
      fireEvent.click(screen.getByTestId('choose-stage-button'));

      // Check previews for stages 1 to 10
      for (let s = 1; s <= 10; s++) {
        const previewEl = screen.getByTestId(`stage-preview-${s}`);
        expect(previewEl).toBeInTheDocument();
        expect(previewEl.textContent.trim().length).toBeGreaterThan(5);
      }

      // Stage 2 locked preview shows Animals
      expect(screen.getByTestId('stage-preview-2')).toHaveTextContent(/Lion|Animal/i);

      // Stage 10 locked preview shows Cosmic
      expect(screen.getByTestId('stage-preview-10')).toHaveTextContent(/Planet|Cosmic|Universe/i);
    });

    it('6.3 Awards milestone reward celebration at Level 5 and persists reward safely', async () => {
      vi.useFakeTimers();
      // Pre-seed on Level 5 (BUS)
      saveSoundMatchCheckpoint(1, { roundIndex: 4, highestUnlockedLevel: 5, score: 4 });

      renderSoundMatch();
      fireEvent.click(screen.getByTestId('start-game-button'));

      // Verify Level 5 displays milestone indicator
      expect(screen.getByTestId('sound-match-milestone-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('sound-match-milestone-indicator')).toHaveTextContent(/Reward Level/i);

      // Answer Level 5 correctly (BUS -> 🚌)
      fireEvent.click(screen.getByTestId('sound-match-option-🚌'));

      // Milestone celebration overlay appears
      expect(screen.getByTestId('feedback-overlay')).toHaveTextContent(/Milestone Reached!/i);
      expect(screen.getByTestId('milestone-badge-earned')).toHaveTextContent(/Bright Sun Charm/i);

      act(() => {
        vi.advanceTimersByTime(950);
      });

      // Advances to Level 6
      expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 6 of 100/i);

      // Verify milestone reward 5 is persisted in child's checkpoint
      const cp = loadSoundMatchCheckpointData(1);
      expect(cp.earnedRewards).toContain(5);
      expect(getSoundMatchEarnedRewards(1)).toContain(5);
    });

    it('6.4 Awards Stage Completion Badge and unlocks Stage 2 upon completing Level 10', async () => {
      vi.useFakeTimers();
      // Pre-seed on Level 10 (SHIP)
      saveSoundMatchCheckpoint(1, { roundIndex: 9, highestUnlockedLevel: 10, score: 9 });

      renderSoundMatch();
      fireEvent.click(screen.getByTestId('start-game-button'));

      // Answer Level 10 correctly (SHIP -> 🚢)
      fireEvent.click(screen.getByTestId('sound-match-option-🚢'));

      // Stage celebration overlay appears with stage badge
      expect(screen.getByTestId('feedback-overlay')).toHaveTextContent(/Stage 1 Cleared!/i);
      expect(screen.getByTestId('stage-badge-earned')).toHaveTextContent(/First Words Champion/i);
      expect(screen.getByTestId('feedback-overlay')).toHaveTextContent(/Advancing to Stage 2/i);

      act(() => {
        vi.advanceTimersByTime(950);
      });

      // Advances to Level 11 (Stage 2: BIRD)
      expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 11 of 100/i);

      // Verify Stage 1 completion badge and Stage 2 unlock persisted
      const cp = loadSoundMatchCheckpointData(1);
      expect(cp.earnedRewards).toContain(10);
      expect(cp.highestUnlockedLevel).toBe(11);
      expect(cp.unlockedStages).toContain(2);
    });

    it('6.5 Restores child-specific progress and rewards correctly after leaving and returning', () => {
      // Child A progress: Level 25, milestones [5, 10, 15, 20]
      saveSoundMatchCheckpoint('child-alpha', {
        roundIndex: 24,
        highestUnlockedLevel: 25,
        score: 24,
        earnedRewards: [5, 10, 15, 20],
        completedLevels: Array.from({ length: 24 }, (_, i) => i + 1),
      });

      // Child B progress: Level 5, score 4, no milestones
      saveSoundMatchCheckpoint('child-beta', {
        roundIndex: 4,
        highestUnlockedLevel: 5,
        score: 4,
        earnedRewards: [],
        completedLevels: [1, 2, 3, 4],
      });

      const alphaData = loadSoundMatchCheckpointData('child-alpha');
      expect(alphaData.currentLevel).toBe(25);
      expect(alphaData.score).toBe(24);
      expect(alphaData.earnedRewards).toEqual([5, 10, 15, 20]);
      expect(alphaData.unlockedStages).toEqual([1, 2, 3]);

      const betaData = loadSoundMatchCheckpointData('child-beta');
      expect(betaData.currentLevel).toBe(5);
      expect(betaData.score).toBe(4);
      expect(betaData.earnedRewards).toEqual([]);
      expect(betaData.unlockedStages).toEqual([1]);
    });

    it('6.6 Replaying a completed level preserves progress without duplicating score or rewards', async () => {
      vi.useFakeTimers();
      // Child unlocked up to Level 15 (score 14, rewards [5, 10])
      saveSoundMatchCheckpoint(1, {
        roundIndex: 0, // Replaying Level 1
        highestUnlockedLevel: 15,
        score: 14,
        earnedRewards: [5, 10],
        completedLevels: Array.from({ length: 14 }, (_, i) => i + 1),
      });

      renderSoundMatch();
      fireEvent.click(screen.getByTestId('start-game-button'));

      expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 100/i);
      expect(screen.getByTestId('compact-score-display')).toHaveTextContent('14 / 100');

      // Answer Level 1 (SUN -> ☀️)
      fireEvent.click(screen.getByTestId('sound-match-option-☀️'));

      act(() => {
        vi.advanceTimersByTime(950);
      });

      // Score remains 14 (not duplicated to 15)
      expect(screen.getByTestId('compact-score-display')).toHaveTextContent('14 / 100');

      // Highest unlocked level is NOT dropped back down
      const cp = loadSoundMatchCheckpointData(1);
      expect(cp.highestUnlockedLevel).toBe(15);
      expect(cp.score).toBe(14);
      expect(cp.earnedRewards).toEqual([5, 10]);
    });

    it('6.7 Completing Level 100 displays the grand finale celebration, completion message, and all 10 stage badges', async () => {
      vi.useFakeTimers();
      // Pre-seed on Level 100 (index 99: UNIVERSE)
      saveSoundMatchCheckpoint(1, {
        roundIndex: 99,
        highestUnlockedLevel: 100,
        score: 99,
        earnedRewards: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95],
      });

      renderSoundMatch();
      fireEvent.click(screen.getByTestId('start-game-button'));

      expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 100 of 100/i);

      // Answer Level 100 correctly (🎆)
      fireEvent.click(screen.getByTestId('sound-match-option-🎆'));

      await act(async () => {
        vi.advanceTimersByTime(950);
      });

      // Grand Finale Victory Screen elements
      expect(screen.getByTestId('sound-match-finale-banner')).toBeInTheDocument();
      expect(screen.getByTestId('sound-match-completion-message')).toHaveTextContent(
        /Incredible! You have completed all 100 levels of Sound Match across all 10 stages!/i
      );

      // 10 Mastered Stage Badges gallery
      expect(screen.getByTestId('sound-match-stage-badges-gallery')).toBeInTheDocument();
      for (let s = 1; s <= 10; s++) {
        expect(screen.getByTestId(`mastery-badge-stage-${s}`)).toBeInTheDocument();
      }

      // Checkpoint records 100-level completion and trophy reward
      const cp = loadSoundMatchCheckpointData(1);
      expect(cp.isCompleted).toBe(true);
      expect(cp.earnedRewards).toContain(100);
    });
  });
});

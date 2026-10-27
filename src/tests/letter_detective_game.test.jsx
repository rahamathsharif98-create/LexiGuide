import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GamePlay from '../pages/child/GamePlay';
import { GAME_CONTENT } from '../data/gameContent';
import {
  LETTER_DETECTIVE_CURRICULUM,
  TOTAL_LETTER_DETECTIVE_LEVELS,
  LETTER_DETECTIVE_STAGE_CONFIG,
  LETTER_DETECTIVE_STAGES,
  LETTER_DETECTIVE_MILESTONES,
  getLetterDetectiveRound,
  getLetterDetectiveRoundByIndex,
  getLetterDetectiveStageForLevel,
  getLetterDetectiveStageBadge,
  getLetterDetectiveMilestone,
  getLetterDetectiveDisplayedWords,
} from '../games/letter-detective/engine/letterDetectiveCurriculum';
import {
  LETTER_DETECTIVE_STORAGE_PREFIX,
  getLetterDetectiveCheckpointKey,
  loadLetterDetectiveCheckpointData,
  loadLetterDetectiveCheckpoint,
  saveLetterDetectiveCheckpoint,
  resetLetterDetectiveCheckpoint,
} from '../games/letter-detective/engine/letterDetectiveCheckpoint';
import LetterDetectiveRound from '../games/letter-detective/components/LetterDetectiveRound';
import letterDetectiveAudio, {
  LETTER_DETECTIVE_PHONEME_MAP,
  getPhonemeSoundInfo,
} from '../games/letter-detective/engine/letterDetectiveAudio';

// Mock AppContext
const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 202, ok: true });
const mockApplySessionOutcome = vi.fn();
let isRealBackendMock = false;
let currentActiveChild = {
  id: 1,
  name: 'Aarav',
  interests: ['detective'],
  fingerprint: { phonologicalAwareness: 60 },
  comfort_preferences: { quiet_mode: false },
};

let mockSpeak;
let mockCancel;
let mockResume;

class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.rate = 1;
    this.pitch = 1;
    this.lang = 'en-US';
    this.voice = null;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
}

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

function renderLetterDetective(route = '/child/games/find-sound') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/child/games/:gameId" element={<GamePlay />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Letter Detective: Step 2 — Curriculum & Checkpoint Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    currentActiveChild = {
      id: 1,
      name: 'Aarav',
      interests: ['detective'],
      fingerprint: { phonologicalAwareness: 60 },
      comfort_preferences: { quiet_mode: false },
    };

    mockSpeak = vi.fn((utterance) => {
      utterance?.onstart?.();
      utterance?.onend?.();
    });
    mockCancel = vi.fn();
    mockResume = vi.fn();

    window.speechSynthesis = {
      speak: mockSpeak,
      cancel: mockCancel,
      resume: mockResume,
      paused: false,
      getVoices: () => [{ lang: 'en-US', name: 'Samantha' }],
    };
    window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Curriculum Integrity
  // ─────────────────────────────────────────────────────────────
  it('1. contains exactly 30 rounds divided equally across 3 stages (10 per stage)', () => {
    expect(LETTER_DETECTIVE_CURRICULUM).toHaveLength(30);
    expect(TOTAL_LETTER_DETECTIVE_LEVELS).toBe(30);
    expect(LETTER_DETECTIVE_STAGE_CONFIG).toHaveLength(3);
    expect(LETTER_DETECTIVE_STAGES).toHaveLength(3);

    const stage1 = LETTER_DETECTIVE_CURRICULUM.filter((r) => r.stage === 1);
    const stage2 = LETTER_DETECTIVE_CURRICULUM.filter((r) => r.stage === 2);
    const stage3 = LETTER_DETECTIVE_CURRICULUM.filter((r) => r.stage === 3);

    expect(stage1).toHaveLength(10);
    expect(stage2).toHaveLength(10);
    expect(stage3).toHaveLength(10);
  });

  it('2. ensures all round IDs are unique and levels are strictly sequential from 1 to 30', () => {
    const ids = LETTER_DETECTIVE_CURRICULUM.map((r) => r.id);
    const levels = LETTER_DETECTIVE_CURRICULUM.map((r) => r.level);
    expect(new Set(ids).size).toBe(30);
    expect(new Set(levels).size).toBe(30);

    levels.forEach((lvl, idx) => {
      expect(lvl).toBe(idx + 1);
    });
  });

  it('3. ensures every round has 4 candidate words with at least 1 correct answer and 1 distractor', () => {
    LETTER_DETECTIVE_CURRICULUM.forEach((round) => {
      expect(round.words).toHaveLength(4);
      expect(new Set(round.words).size).toBe(4); // No duplicates
      expect(round.answers.length).toBeGreaterThanOrEqual(1);
      expect(round.answers.length).toBeLessThan(4); // Has distractors
      expect(round.target).toBeTruthy();
      expect(round.title).toBeTruthy();
      expect(round.prompt).toBeTruthy();
      expect(round.hint).toBeTruthy();
    });
  });

  it('4. validates all answers match the target phoneme and distractors do not satisfy the rule', () => {
    LETTER_DETECTIVE_CURRICULUM.forEach((round) => {
      // Check answers
      round.answers.forEach((ans) => {
        expect(round.words).toContain(ans);
        if (round.stage === 1) {
          expect(ans.startsWith(round.target)).toBe(true);
        } else {
          expect(ans.includes(round.target)).toBe(true);
        }
      });

      // Check distractors
      const distractors = round.words.filter((w) => !round.answers.includes(w));
      distractors.forEach((dist) => {
        if (round.stage === 1) {
          expect(dist.startsWith(round.target)).toBe(false);
        } else {
          expect(dist.includes(round.target)).toBe(false);
        }
      });
    });
  });

  it('5. preserves original words for starter digraphs sh, ch, th', () => {
    const shRound = LETTER_DETECTIVE_CURRICULUM.find((r) => r.target === 'sh');
    const chRound = LETTER_DETECTIVE_CURRICULUM.find((r) => r.target === 'ch');
    const thRound = LETTER_DETECTIVE_CURRICULUM.find((r) => r.target === 'th');

    expect(shRound).toBeDefined();
    expect([...shRound.words].sort()).toEqual(['cat', 'dog', 'shell', 'ship'].sort());
    expect([...shRound.answers].sort()).toEqual(['shell', 'ship'].sort());

    expect(chRound).toBeDefined();
    expect([...chRound.words].sort()).toEqual(['ball', 'chair', 'chip', 'sun'].sort());
    expect([...chRound.answers].sort()).toEqual(['chair', 'chip'].sort());

    expect(thRound).toBeDefined();
    expect([...thRound.words].sort()).toEqual(['box', 'car', 'that', 'this'].sort());
    expect([...thRound.answers].sort()).toEqual(['that', 'this'].sort());
  });

  it('6. balances answer positions evenly across all 4 positions (no fixed position shortcut)', () => {
    const posCounts = [0, 0, 0, 0];
    LETTER_DETECTIVE_CURRICULUM.forEach((round) => {
      round.answers.forEach((ans) => {
        const pos = round.words.indexOf(ans);
        expect(pos).toBeGreaterThanOrEqual(0);
        expect(pos).toBeLessThanOrEqual(3);
        posCounts[pos]++;
      });
    });

    // Exactly 15 occurrences per position (25% each out of 60 total answers)
    expect(posCounts[0]).toBe(15);
    expect(posCounts[1]).toBe(15);
    expect(posCounts[2]).toBe(15);
    expect(posCounts[3]).toBe(15);
  });

  it('7. option ordering is deterministic and never mutates curriculum data', () => {
    const round = LETTER_DETECTIVE_CURRICULUM[0];
    const initialWords = [...round.words];
    const words1 = getLetterDetectiveDisplayedWords(round);
    const words2 = getLetterDetectiveDisplayedWords(round);
    expect(words1).toEqual(initialWords);
    expect(words2).toEqual(initialWords);
    expect(words1).not.toBe(round.words); // Immutability
  });

  it('8. helper functions resolve rounds, stages, and badges correctly', () => {
    expect(getLetterDetectiveRound(1).id).toBe(1);
    expect(getLetterDetectiveRound(30).id).toBe(30);
    expect(getLetterDetectiveRound(999).id).toBe(1); // Boundary fallback
    expect(getLetterDetectiveRoundByIndex(0).id).toBe(1);
    expect(getLetterDetectiveRoundByIndex(29).id).toBe(30);

    expect(getLetterDetectiveStageForLevel(5).stage).toBe(1);
    expect(getLetterDetectiveStageForLevel(15).stage).toBe(2);
    expect(getLetterDetectiveStageForLevel(25).stage).toBe(3);

    expect(getLetterDetectiveStageBadge(1).name).toBe('Consonant Scout');
    expect(getLetterDetectiveStageBadge(2).name).toBe('Blend Detective');
    expect(getLetterDetectiveStageBadge(3).name).toBe('Master Inspector');

    expect(getLetterDetectiveMilestone(5).name).toBe('Clue Finder');
    expect(getLetterDetectiveMilestone(30).name).toBe('Master Inspector');
    expect(getLetterDetectiveMilestone(99)).toBeNull();
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Checkpoint Engine
  // ─────────────────────────────────────────────────────────────
  it('9. saves and restores checkpoint progress correctly for the same child', () => {
    const childId = 42;
    saveLetterDetectiveCheckpoint(childId, {
      roundIndex: 4,
      score: 4,
      completedLevel: 4,
      highestUnlockedLevel: 5,
      highestUnlockedIndex: 4,
    });

    const data = loadLetterDetectiveCheckpointData(childId);
    expect(data.roundIndex).toBe(4);
    expect(data.currentLevel).toBe(5);
    expect(data.score).toBe(4);
    expect(data.highestUnlockedLevel).toBe(5);
    expect(data.completedLevels).toContain(4);

    expect(loadLetterDetectiveCheckpoint(childId)).toBe(4);
  });

  it('10. isolates saved checkpoints strictly across different child profiles and guest', () => {
    saveLetterDetectiveCheckpoint(101, { roundIndex: 12, completedLevel: 12, score: 12 });
    saveLetterDetectiveCheckpoint(202, { roundIndex: 2, completedLevel: 2, score: 2 });
    saveLetterDetectiveCheckpoint(null, { roundIndex: 0, score: 0 }); // Guest

    const child101 = loadLetterDetectiveCheckpointData(101);
    const child202 = loadLetterDetectiveCheckpointData(202);
    const guest = loadLetterDetectiveCheckpointData(null);

    expect(child101.roundIndex).toBe(12);
    expect(child101.score).toBe(12);

    expect(child202.roundIndex).toBe(2);
    expect(child202.score).toBe(2);

    expect(guest.roundIndex).toBe(0);
    expect(guest.score).toBe(0);
  });

  it('11. handles missing, corrupted, or malformed checkpoint data safely without throwing', () => {
    const key = getLetterDetectiveCheckpointKey('bad_data_child');
    localStorage.setItem(key, 'INVALID_NOT_JSON{{{');

    const data = loadLetterDetectiveCheckpointData('bad_data_child');
    expect(data.roundIndex).toBe(0);
    expect(data.currentLevel).toBe(1);
    expect(data.score).toBe(0);
    expect(data.isCompleted).toBe(false);
  });

  it('12. prevents replaying completed levels from inflating score or reducing unlocked progress', () => {
    const childId = 88;
    saveLetterDetectiveCheckpoint(childId, {
      roundIndex: 0,
      completedLevels: [1, 2, 3],
      score: 3,
      highestUnlockedLevel: 4,
      highestUnlockedIndex: 3,
    });

    // Replay level 1
    saveLetterDetectiveCheckpoint(childId, {
      roundIndex: 0,
      completedLevel: 1, // Already completed
      score: 3,
    });

    const data = loadLetterDetectiveCheckpointData(childId);
    expect(data.score).toBe(3); // Score is not inflated to 4
    expect(data.completedLevels).toEqual([1, 2, 3]);
    expect(data.highestUnlockedLevel).toBe(4); // Highest progress preserved
  });

  it('13. unlocks stages progressively as highest unlocked level increases', () => {
    const childId = 77;
    // Level 1: Stage 1
    saveLetterDetectiveCheckpoint(childId, { roundIndex: 0, highestUnlockedLevel: 1 });
    expect(loadLetterDetectiveCheckpointData(childId).unlockedStages).toEqual([1]);

    // Level 11: Stage 2 unlocked
    saveLetterDetectiveCheckpoint(childId, { roundIndex: 10, highestUnlockedLevel: 11, highestUnlockedIndex: 10 });
    expect(loadLetterDetectiveCheckpointData(childId).unlockedStages).toEqual([1, 2]);

    // Level 21: Stage 3 unlocked
    saveLetterDetectiveCheckpoint(childId, { roundIndex: 20, highestUnlockedLevel: 21, highestUnlockedIndex: 20 });
    expect(loadLetterDetectiveCheckpointData(childId).unlockedStages).toEqual([1, 2, 3]);
  });

  it('14. preserves completed run state and allows reset via resetLetterDetectiveCheckpoint', () => {
    const childId = 55;
    saveLetterDetectiveCheckpoint(childId, {
      isCompleted: true,
      score: 30,
    });

    const data = loadLetterDetectiveCheckpointData(childId);
    expect(data.isCompleted).toBe(true);
    expect(data.highestUnlockedLevel).toBe(30);
    expect(data.unlockedStages).toEqual([1, 2, 3]);
    expect(data.roundIndex).toBe(0); // Ready for fresh replay

    resetLetterDetectiveCheckpoint(childId);
    const freshData = loadLetterDetectiveCheckpointData(childId);
    expect(freshData.roundIndex).toBe(0);
    expect(freshData.highestUnlockedLevel).toBe(1);
    expect(freshData.score).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Game Content & Progression Hub Integration
  // ─────────────────────────────────────────────────────────────
  it('15. verifies GAME_CONTENT has 30 rounds for find-sound', () => {
    expect(GAME_CONTENT['find-sound']).toBeDefined();
    expect(GAME_CONTENT['find-sound']).toHaveLength(30);
  });

  it('16. renders intro screen with GameProgressionHub showing Letter Detective stages', () => {
    renderLetterDetective();

    expect(screen.getByText('Letter Detective')).toBeInTheDocument();
    expect(screen.getByTestId('letter-detective-badge')).toBeInTheDocument();
    expect(screen.getByTestId('start-game-button')).toBeInTheDocument();

    // Click Choose Stage to open stage roadmap
    const chooseStageBtn = screen.getByTestId('choose-stage-button');
    fireEvent.click(chooseStageBtn);

    expect(screen.getByText('Beginning Consonants')).toBeInTheDocument();
    expect(screen.getByText('Digraphs & Blends')).toBeInTheDocument();
    expect(screen.getByText('Vowel Teams')).toBeInTheDocument();
  });

  it('17. starts game and plays Level 1 (Round 1 of 30) with multi-select answering', async () => {
    renderLetterDetective();

    // Click Start Game
    fireEvent.click(screen.getByTestId('start-game-button'));

    // Verify Level 1 mounted
    expect(screen.getByText('Level 1 of 30')).toBeInTheDocument();
    expect(screen.getByText(/Find words with/i)).toBeInTheDocument();
    expect(screen.getByText('/b/')).toBeInTheDocument();

    // Options for Round 1: ball, bat, cup, sun (answers: ball, bat)
    const ballBtn = screen.getByRole('button', { name: 'ball' });
    const batBtn = screen.getByRole('button', { name: 'bat' });
    const checkBtn = screen.getByRole('button', { name: /Check Answer/i });

    // Initially Check Answer is disabled when no words selected
    expect(checkBtn).toBeDisabled();

    // Toggle ball and bat
    fireEvent.click(ballBtn);
    expect(checkBtn).not.toBeDisabled();

    fireEvent.click(batBtn);

    // Submit answer
    await act(async () => {
      fireEvent.click(checkBtn);
    });

    // Checkpoint saved Level 1 completed
    const cp = loadLetterDetectiveCheckpointData(1);
    expect(cp.completedLevels).toContain(1);
    expect(cp.score).toBe(1);
  });

  it('18. resolves both /child/games/find-sound and alias /child/games/letter-detective', () => {
    const { unmount } = renderLetterDetective('/child/games/letter-detective');
    expect(screen.getByText('Letter Detective')).toBeInTheDocument();
    expect(screen.getByTestId('letter-detective-badge')).toBeInTheDocument();
    unmount();

    renderLetterDetective('/child/games/find-sound');
    expect(screen.getByText('Letter Detective')).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Step 3: Interactive Round & Audio Playback Suite
  // ─────────────────────────────────────────────────────────────
  it('19. renders target sound and per-word audio controls with stable testids', () => {
    const round1 = getLetterDetectiveRound(1); // target: 'b', words: ['ball', 'bat', 'cup', 'sun']
    render(
      <LetterDetectiveRound
        round={round1}
        roundIdx={0}
        selectedWords={[]}
        setSelectedWords={vi.fn()}
        onAnswer={vi.fn()}
      />
    );

    // Target sound audio control
    expect(screen.getByTestId('target-sound-audio-button')).toBeInTheDocument();
    expect(screen.getByLabelText('Listen to target sound /b/')).toBeInTheDocument();

    // Word options and per-word audio controls
    for (const w of round1.words) {
      expect(screen.getByTestId(`word-option-${w}`)).toBeInTheDocument();
      expect(screen.getByTestId(`word-audio-button-${w}`)).toBeInTheDocument();
      expect(screen.getByLabelText(`Listen to word ${w}`)).toBeInTheDocument();
    }

    // Check Answer button
    expect(screen.getByTestId('check-answer-button')).toBeInTheDocument();
  });

  it('20. does NOT autoplay audio on mount and speaks anchor phonics when target sound clicked', () => {
    const round1 = getLetterDetectiveRound(1);
    render(
      <LetterDetectiveRound
        round={round1}
        roundIdx={0}
        selectedWords={[]}
        setSelectedWords={vi.fn()}
        onAnswer={vi.fn()}
      />
    );

    // Verification: zero automatic speech on mount!
    expect(mockSpeak).not.toHaveBeenCalled();

    // Click target sound audio button
    const targetAudioBtn = screen.getByTestId('target-sound-audio-button');
    fireEvent.click(targetAudioBtn);

    // Verified: SpeechSynthesis is invoked with child-friendly anchor text
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    const spokenUtterance = mockSpeak.mock.calls[0][0];
    expect(spokenUtterance.text).toBe('The sound is buh, as in ball');
    expect(spokenUtterance.rate).toBeCloseTo(0.88, 2);
  });

  it('21. plays individual candidate words via SpeechSynthesis on word-audio button click', () => {
    const round1 = getLetterDetectiveRound(1);
    render(
      <LetterDetectiveRound
        round={round1}
        roundIdx={0}
        selectedWords={[]}
        setSelectedWords={vi.fn()}
        onAnswer={vi.fn()}
      />
    );

    expect(mockSpeak).not.toHaveBeenCalled();

    // Click per-word audio for 'ball'
    const wordAudioBtn = screen.getByTestId('word-audio-button-ball');
    fireEvent.click(wordAudioBtn);

    expect(mockSpeak).toHaveBeenCalledTimes(1);
    const spokenUtterance = mockSpeak.mock.calls[0][0];
    expect(spokenUtterance.text).toBe('ball');
    expect(spokenUtterance.rate).toBeCloseTo(0.85, 2);
  });

  it('22. handles SpeechSynthesis absence or speech errors gracefully without crashing or locking game', () => {
    // Simulate browser without SpeechSynthesis
    delete window.speechSynthesis;

    const round1 = getLetterDetectiveRound(1);
    const onAnswer = vi.fn();
    render(
      <LetterDetectiveRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    );

    // Clicking target audio does NOT throw and shows non-blocking message
    const targetAudioBtn = screen.getByTestId('target-sound-audio-button');
    expect(() => fireEvent.click(targetAudioBtn)).not.toThrow();

    expect(screen.getByText(/Sound audio unavailable. You can still play!/i)).toBeInTheDocument();

    // Candidate word selection still works completely!
    const ballBtn = screen.getByTestId('word-option-ball');
    const batBtn = screen.getByTestId('word-option-bat');
    const checkBtn = screen.getByTestId('check-answer-button');

    fireEvent.click(ballBtn);
    fireEvent.click(batBtn);
    fireEvent.click(checkBtn);

    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('23. validates exact-set answering: rejects missing answers and extra distractors', () => {
    const round1 = getLetterDetectiveRound(1); // answers: ['ball', 'bat'], words: ['ball', 'bat', 'cup', 'sun']
    const onAnswer = vi.fn();

    const { unmount } = render(
      <LetterDetectiveRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    );

    // Case A: Missing answer (only selects 'ball', misses 'bat')
    fireEvent.click(screen.getByTestId('word-option-ball'));
    fireEvent.click(screen.getByTestId('check-answer-button'));
    expect(onAnswer).toHaveBeenLastCalledWith(false);

    unmount();

    // Case B: Extra distractor (selects 'ball', 'bat', AND 'cup')
    const onAnswerB = vi.fn();
    const { unmount: unmountB } = render(
      <LetterDetectiveRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswerB}
      />
    );
    fireEvent.click(screen.getByTestId('word-option-ball'));
    fireEvent.click(screen.getByTestId('word-option-bat'));
    fireEvent.click(screen.getByTestId('word-option-cup'));
    fireEvent.click(screen.getByTestId('check-answer-button'));
    expect(onAnswerB).toHaveBeenLastCalledWith(false);

    unmountB();

    // Case C: Exact match (selects exactly 'ball' and 'bat')
    const onAnswerC = vi.fn();
    render(
      <LetterDetectiveRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswerC}
      />
    );
    fireEvent.click(screen.getByTestId('word-option-ball'));
    fireEvent.click(screen.getByTestId('word-option-bat'));
    fireEvent.click(screen.getByTestId('check-answer-button'));
    expect(onAnswerC).toHaveBeenLastCalledWith(true);
  });

  it('24. blocks word selection and submission during active transitions (isTransitioning=true)', () => {
    const round1 = getLetterDetectiveRound(1);
    const onAnswer = vi.fn();
    const setSelectedWords = vi.fn();

    render(
      <LetterDetectiveRound
        round={round1}
        roundIdx={0}
        selectedWords={['ball']}
        setSelectedWords={setSelectedWords}
        onAnswer={onAnswer}
        isTransitioning={true}
      />
    );

    // Click word option while transitioning -> blocked
    const batOption = screen.getByTestId('word-option-bat');
    fireEvent.click(batOption);
    expect(setSelectedWords).not.toHaveBeenCalled();

    // Click submit while transitioning -> blocked
    const checkBtn = screen.getByTestId('check-answer-button');
    fireEvent.click(checkBtn);
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('25. prevents rapid duplicate submissions via synchronous isSubmittedRef guard', () => {
    const round1 = getLetterDetectiveRound(1);
    const onAnswer = vi.fn();

    render(
      <LetterDetectiveRound
        round={round1}
        roundIdx={0}
        onAnswer={onAnswer}
      />
    );

    // Select correct answers
    fireEvent.click(screen.getByTestId('word-option-ball'));
    fireEvent.click(screen.getByTestId('word-option-bat'));

    const checkBtn = screen.getByTestId('check-answer-button');

    // Simulate 3 rapid clicks in immediate succession
    fireEvent.click(checkBtn);
    fireEvent.click(checkBtn);
    fireEvent.click(checkBtn);

    // Guaranteed: onAnswer was called exactly ONCE
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it('26. updates ARIA selection attributes accurately on toggle', () => {
    const round1 = getLetterDetectiveRound(1);
    render(
      <LetterDetectiveRound
        round={round1}
        roundIdx={0}
      />
    );

    const ballOption = screen.getByTestId('word-option-ball');

    // Initially unselected
    expect(ballOption).toHaveAttribute('aria-pressed', 'false');
    expect(ballOption).toHaveAttribute('aria-checked', 'false');
    expect(ballOption).toHaveAttribute('aria-label', 'ball');

    // Toggle on
    fireEvent.click(ballOption);
    expect(ballOption).toHaveAttribute('aria-pressed', 'true');
    expect(ballOption).toHaveAttribute('aria-checked', 'true');
    expect(ballOption).toHaveAttribute('aria-label', 'ball, selected');

    // Toggle off
    fireEvent.click(ballOption);
    expect(ballOption).toHaveAttribute('aria-pressed', 'false');
    expect(ballOption).toHaveAttribute('aria-checked', 'false');
    expect(ballOption).toHaveAttribute('aria-label', 'ball');
  });

  it('27. cancels active speech synthesis cleanly on unmount and round transitions', () => {
    const round1 = getLetterDetectiveRound(1);
    const { unmount } = render(
      <LetterDetectiveRound
        round={round1}
        roundIdx={0}
      />
    );

    // Trigger target sound
    fireEvent.click(screen.getByTestId('target-sound-audio-button'));

    // Unmount component
    unmount();

    // Verified: SpeechSynthesis.cancel() was invoked
    expect(mockCancel).toHaveBeenCalled();
  });
});

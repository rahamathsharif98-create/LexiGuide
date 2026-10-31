import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SPIDER_LEVELS, getSpiderLevel } from '../games/spider-weaver/engine/spiderLevels';
import { getGameById } from '../data/gamingZoneRegistry';
import { normalizeSkillToPillar } from '../services/mockAiService';
import SpiderApp from '../games/spider-weaver/SpiderApp';
import SpiderWeaverGame from '../pages/child/SpiderWeaverGame';
import { useGameSessionTracker } from '../hooks/useGameSessionTracker';

// ────────────────────────────────────────────────
// Mocks for 3D canvas and audio in JSDOM environment
// ────────────────────────────────────────────────
vi.mock('../games/spider-weaver/SpiderWorld', () => ({
  default: ({ level, options, onSelectOption, spiderState, selectedRime, wrongRime, isError, isVictory }) => (
    <div
      data-testid="mock-spider-world"
      data-spider-state={spiderState}
      data-is-victory={String(isVictory)}
      data-is-error={String(Boolean(isError))}
      data-selected-rime={selectedRime || ''}
      data-wrong-rime={wrongRime || ''}
      data-target-word={level?.targetWord}
    >
      {options.map((opt) => (
        <button
          key={opt}
          data-testid={`rime-node-${opt}`}
          data-is-selected={String(selectedRime === opt && !isError)}
          data-is-error={String(wrongRime === opt || (selectedRime === opt && Boolean(isError)))}
          onClick={() => onSelectOption(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  ),
}));

const mockPlaySnap = vi.fn();
const mockPlayLetterNote = vi.fn();
const mockPlaySparkle = vi.fn();
const mockPlayFanfare = vi.fn();
const mockPlayGentleOops = vi.fn();
const mockSpeakCompanion = vi.fn();

vi.mock('../services/gameSoundService', () => ({
  gameSound: {
    playSnap: (...args) => mockPlaySnap(...args),
    playLetterNote: (...args) => mockPlayLetterNote(...args),
    playSparkle: (...args) => mockPlaySparkle(...args),
    playFanfare: (...args) => mockPlayFanfare(...args),
    playGentleOops: (...args) => mockPlayGentleOops(...args),
    speakCompanion: (...args) => mockSpeakCompanion(...args),
    getSoundMode: () => 'voice_and_sfx',
    subscribe: () => () => {},
    cycleSoundMode: vi.fn(),
  },
}));

// Mock AppContext for session tracker
const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 1, ok: true });
const mockShowToast = vi.fn();

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    activeChild: { id: 1, name: 'Spinny Weaver' },
    isRealBackend: true,
    saveLearningSession: mockSaveLearningSession,
    applySessionOutcome: vi.fn(),
    showToast: mockShowToast,
  }),
}));

// ────────────────────────────────────────────────
// 1. Static Level, Boundary & Registry Tests
// ────────────────────────────────────────────────
describe('Spinny the Spider: Web Weaver (3D Phonics Onset-Rime Adventure)', () => {
  it('loads all 11 progressive levels with onset, rime options, hints, and clear titles', () => {
    expect(SPIDER_LEVELS.length).toBe(11);
    const seenWords = new Set();
    const seenIds = new Set();

    SPIDER_LEVELS.forEach((level) => {
      expect(level.id).toBeDefined();
      expect(level.title).toBeDefined();
      expect(level.title.length).toBeGreaterThan(0);
      expect(level.targetWord).toBeDefined();
      expect(level.onset).toBeDefined();
      expect(level.targetRime).toBeDefined();
      expect(level.options).toContain(level.targetRime);
      expect(level.options.length).toBe(3);
      expect(level.audioPrompt).toBeDefined();
      expect(level.hint).toBeDefined();
      expect(level.emoji).toBeDefined();

      // Verify onset + targetRime strictly equals targetWord
      expect(`${level.onset}${level.targetRime}`).toBe(level.targetWord);

      // Verify unique IDs and target words
      expect(seenIds.has(level.id)).toBe(false);
      expect(seenWords.has(level.targetWord)).toBe(false);
      seenIds.add(level.id);
      seenWords.add(level.targetWord);
    });
  });

  it('progressively introduces challenging rhyme choices and minimal pairs in advanced levels', () => {
    // Level 8: spark (r-controlled blend vs close distractor minimal pairs)
    const l8 = SPIDER_LEVELS[7];
    expect(l8.targetWord).toBe('spark');
    expect(l8.onset).toBe('sp');
    expect(l8.targetRime).toBe('ark');
    expect(l8.options).toEqual(['ark', 'art', 'arm']);

    // Level 9: swing (nasal minimal pairs -ing, -ang, -ong)
    const l9 = SPIDER_LEVELS[8];
    expect(l9.targetWord).toBe('swing');
    expect(l9.onset).toBe('sw');
    expect(l9.targetRime).toBe('ing');
    expect(l9.options).toEqual(['ing', 'ang', 'ong']);

    // Level 10: track (short-vowel plosive word family -ack, -ick, -ock)
    const l10 = SPIDER_LEVELS[9];
    expect(l10.targetWord).toBe('track');
    expect(l10.onset).toBe('tr');
    expect(l10.targetRime).toBe('ack');
    expect(l10.options).toEqual(['ack', 'ick', 'ock']);

    // Level 11: spider (mascot grand finale)
    const l11 = SPIDER_LEVELS[10];
    expect(l11.targetWord).toBe('spider');
    expect(l11.onset).toBe('sp');
    expect(l11.targetRime).toBe('ider');
    expect(l11.options).toEqual(['ider', 'oon', 'ace']);
  });

  it('safely handles level index boundaries in getSpiderLevel across all 11 levels', () => {
    const l0 = getSpiderLevel(0);
    expect(l0.targetWord).toBe('spin');
    expect(l0.onset).toBe('sp');
    expect(l0.targetRime).toBe('in');

    const l1 = getSpiderLevel(1);
    expect(l1.targetWord).toBe('web');

    const l7 = getSpiderLevel(7);
    expect(l7.targetWord).toBe('spark');

    const l8 = getSpiderLevel(8);
    expect(l8.targetWord).toBe('swing');

    const l9 = getSpiderLevel(9);
    expect(l9.targetWord).toBe('track');

    const l10 = getSpiderLevel(10);
    expect(l10.targetWord).toBe('spider');

    // Clamps to last level (Level 11: spider) on overflow
    const lOverflow = getSpiderLevel(99);
    expect(lOverflow.id).toBe(11);
    expect(lOverflow.targetWord).toBe('spider');

    // Clamps to first level (Level 1: spin) on negative index
    const lNegative = getSpiderLevel(-5);
    expect(lNegative.id).toBe(1);
    expect(lNegative.targetWord).toBe('spin');
  });

  it('is correctly registered in the Gaming Zone registry as a 3D Adventure', () => {
    const game = getGameById('spider-weaver');
    expect(game).toBeDefined();
    expect(game.title).toBe('Spinny the Spider: Web Weaver');
    expect(game.route).toBe('/child/games/spider-weaver');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('words');
    expect(game.skill).toBe('rimeBlending');
  });

  it('normalizes rimeBlending to the core Word Recognition literacy pillar', () => {
    const pillar = normalizeSkillToPillar('rimeBlending');
    expect(pillar).toBe('wordRecognition');

    const spiderPillar = normalizeSkillToPillar('spiderWebWeaving');
    expect(spiderPillar).toBe('wordRecognition');
  });
});

// ────────────────────────────────────────────────
// 2. Session Tracking & No Duplicate Saves
// ────────────────────────────────────────────────
describe('Session tracking & no duplicate session saves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recordAttempt accumulates attempts without triggering backend saves', () => {
    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'spider-weaver',
        gameTitle: 'Spinny the Spider: Web Weaver',
        skill: 'rimeBlending',
      })
    );

    act(() => {
      result.current.recordAttempt(true, { roundScore: 250, starsEarned: 1, xpEarned: 25 });
      result.current.recordAttempt(false);
      result.current.recordAttempt(true, { roundScore: 500, starsEarned: 1, xpEarned: 25 });
    });

    expect(result.current.stats.roundsAttempted).toBe(3);
    expect(result.current.stats.roundsCorrect).toBe(2);
    expect(result.current.stats.score).toBe(750);
    expect(mockSaveLearningSession).not.toHaveBeenCalled();
  });

  it('SpiderWeaverGame wrapper does not save session upon correct round completion', () => {
    render(
      <MemoryRouter>
        <SpiderWeaverGame />
      </MemoryRouter>
    );

    // Initial render should not save
    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Click correct rime node for Level 1 ('spin' -> onset 'sp', rime 'in')
    const correctNode = screen.getByTestId('rime-node-in');
    fireEvent.click(correctNode);

    // Victory word should appear, but NO session save should fire during active gameplay
    expect(screen.getByText('SPIN')).toBeInTheDocument();
    expect(mockSaveLearningSession).not.toHaveBeenCalled();
  });

  it('SpiderWeaverGame wrapper saves completed session only on exit via Back button', async () => {
    render(
      <MemoryRouter>
        <SpiderWeaverGame />
      </MemoryRouter>
    );

    // Click correct node
    const correctNode = screen.getByTestId('rime-node-in');
    fireEvent.click(correctNode);

    // Now exit via Back button
    const backBtn = screen.getByRole('button', { name: /Back to Games/i });
    await act(async () => {
      fireEvent.click(backBtn);
    });

    // Session is saved exactly once on exit
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
    const payload = mockSaveLearningSession.mock.calls[0][0];
    expect(payload.activity_id).toBe('spider-weaver');
    expect(payload.skill).toBe('rimeBlending');
  });

  it('repeated exit clicks do not save the session more than once', async () => {
    render(
      <MemoryRouter>
        <SpiderWeaverGame />
      </MemoryRouter>
    );

    // Complete a round so the session has active attempts
    const correctNode = screen.getByTestId('rime-node-in');
    fireEvent.click(correctNode);

    const backBtn = screen.getByRole('button', { name: /Back to Games/i });

    // Simulate rapid repeated taps on the Back button
    await act(async () => {
      fireEvent.click(backBtn);
      fireEvent.click(backBtn);
      fireEvent.click(backBtn);
    });

    // isSavedRef ensures saveCompletedSession is invoked only once
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────
// 3. Rapid-Click Synchronous Guard & Scoring
// ────────────────────────────────────────────────
describe('Rapid-click synchronous guard & scoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('synchronously blocks rapid double-clicks on the correct rime node', () => {
    const onRoundComplete = vi.fn();
    render(<SpiderApp onBack={vi.fn()} onRoundComplete={onRoundComplete} />);

    const correctNode = screen.getByTestId('rime-node-in');

    // First click on correct rime
    fireEvent.click(correctNode);
    expect(mockPlaySnap).toHaveBeenCalledTimes(1);
    expect(screen.getByText('SPIN')).toBeInTheDocument();
    expect(screen.getByText('250 pts')).toBeInTheDocument();
    expect(onRoundComplete).toHaveBeenCalledTimes(1);
    expect(onRoundComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        isCorrect: true,
        score: 250,
        stars: 1,
        targetWord: 'spin',
      })
    );

    // Rapid second and third clicks on the same node before re-render or during celebration
    fireEvent.click(correctNode);
    fireEvent.click(correctNode);

    // Synchronous guard must reject: audio and onRoundComplete must NOT fire again
    expect(mockPlaySnap).toHaveBeenCalledTimes(1);
    expect(onRoundComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText('250 pts')).toBeInTheDocument();
  });

  it('roundLockRef blocks clicks on distractors after round victory', () => {
    const onRoundComplete = vi.fn();
    render(<SpiderApp onBack={vi.fn()} onRoundComplete={onRoundComplete} />);

    // Step 1: Click correct rime
    fireEvent.click(screen.getByTestId('rime-node-in'));
    expect(onRoundComplete).toHaveBeenCalledTimes(1);

    // Step 2: Click a distractor node ('at') while victory celebration is playing
    const distractorNode = screen.getByTestId('rime-node-at');
    fireEvent.click(distractorNode);

    // Blocked by roundLockRef: gentle oops is not played, onRoundComplete is not called again
    expect(mockPlayGentleOops).not.toHaveBeenCalled();
    expect(onRoundComplete).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────
// 4. Wrong-Answer Error Feedback vs Correct-Answer Success Feedback
// ────────────────────────────────────────────────
describe('Wrong-answer error feedback vs correct-answer success feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays clear red error styling and "Try again!" message on wrong answer instead of green', () => {
    const onRoundComplete = vi.fn();
    render(<SpiderApp onBack={vi.fn()} onRoundComplete={onRoundComplete} />);

    const distractorNode = screen.getByTestId('rime-node-at');

    // Click incorrect rime
    fireEvent.click(distractorNode);

    // 1. Audio feedback: gentle oops sound and companion speech 'Try again!'
    expect(mockPlayGentleOops).toHaveBeenCalledTimes(1);
    expect(mockSpeakCompanion).toHaveBeenCalledWith('Try again!');

    // 2. HUD rime slot displays the wrong letter with red/rose styling, NOT green emerald
    const rimeSlot = screen.getByTestId('hud-rime-slot');
    expect(rimeSlot).toHaveTextContent('at');
    expect(rimeSlot.className).toContain('bg-rose-500');
    expect(rimeSlot.className).not.toContain('bg-emerald-500');

    // 3. HUD bottom instruction pill shows clear child-friendly "Try again!" error message in red/rose
    const instructionsPill = screen.getByTestId('hud-instructions-pill');
    expect(instructionsPill).toHaveTextContent(/Try again!/i);
    expect(instructionsPill.className).toContain('bg-rose-950');
    expect(instructionsPill.className).not.toContain('bg-emerald-950');

    // 4. 3D World indicates error state on the clicked node
    const world = screen.getByTestId('mock-spider-world');
    expect(world.getAttribute('data-is-error')).toBe('true');
    expect(distractorNode.getAttribute('data-is-error')).toBe('true');
    expect(distractorNode.getAttribute('data-is-selected')).toBe('false');

    // 5. Attempt is recorded as incorrect
    expect(onRoundComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        isCorrect: false,
        score: 0,
        targetWord: 'spin',
      })
    );
  });

  it('displays green success styling when correct answer is selected', () => {
    render(<SpiderApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    const correctNode = screen.getByTestId('rime-node-in');

    // Click correct rime
    fireEvent.click(correctNode);

    // 1. HUD rime slot displays green emerald styling, NOT rose red
    const rimeSlot = screen.getByTestId('hud-rime-slot');
    expect(rimeSlot).toHaveTextContent('in');
    expect(rimeSlot.className).toContain('bg-emerald-500');
    expect(rimeSlot.className).not.toContain('bg-rose-500');

    // 2. Word result displays SPIN
    expect(screen.getByText('SPIN')).toBeInTheDocument();

    // 3. 3D World reflects victory without error
    const world = screen.getByTestId('mock-spider-world');
    expect(world.getAttribute('data-is-victory')).toBe('true');
    expect(world.getAttribute('data-is-error')).toBe('false');
    expect(correctNode.getAttribute('data-is-selected')).toBe('true');
    expect(correctNode.getAttribute('data-is-error')).toBe('false');
  });

  it('clears red error feedback after 900ms allowing retry with success', () => {
    vi.useFakeTimers();
    try {
      render(<SpiderApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

      const distractorNode = screen.getByTestId('rime-node-at');
      const correctNode = screen.getByTestId('rime-node-in');
      const rimeSlot = screen.getByTestId('hud-rime-slot');

      // Click wrong answer -> enters error state with red styling
      fireEvent.click(distractorNode);
      expect(rimeSlot.className).toContain('bg-rose-500');

      // Rapid clicks during 900ms oops animation are blocked
      fireEvent.click(distractorNode);
      expect(mockPlayGentleOops).toHaveBeenCalledTimes(1);

      // Advance timers by 900ms -> resets error state
      act(() => {
        vi.advanceTimersByTime(950);
      });

      // Error indication is cleared, slot returns to placeholder
      expect(rimeSlot.className).not.toContain('bg-rose-500');
      expect(rimeSlot).toHaveTextContent('?');

      // Player retries with the correct node -> success green styling
      fireEvent.click(correctNode);
      expect(rimeSlot.className).toContain('bg-emerald-500');
      expect(screen.getByText('SPIN')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

// ────────────────────────────────────────────────
// 5. Timers, Mascot Animation & Level Progression
// ────────────────────────────────────────────────
describe('Timers, mascot animation & level progression', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cleans up pending timeouts cleanly when component unmounts', () => {
    const { unmount } = render(<SpiderApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Trigger correct choice to start celebration and sparkle timeouts
    fireEvent.click(screen.getByTestId('rime-node-in'));

    // Unmount while timers are running
    unmount();

    // Advancing timers should not throw or cause state updates on unmounted component
    expect(() => {
      vi.advanceTimersByTime(2000);
    }).not.toThrow();
  });

  it('clears oops timer on correct answer so victory animation is not overridden', () => {
    render(<SpiderApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);
    const world = screen.getByTestId('mock-spider-world');

    // Step 1: Click distractor node -> spider enters 'weaving'
    fireEvent.click(screen.getByTestId('rime-node-at'));
    expect(world.getAttribute('data-spider-state')).toBe('weaving');

    // Advance 950ms past the oops timer so spider resets to idle
    act(() => {
      vi.advanceTimersByTime(950);
    });
    expect(world.getAttribute('data-spider-state')).toBe('idle');

    // Step 2: Click correct rime node -> enters 'victory'
    fireEvent.click(screen.getByTestId('rime-node-in'));
    expect(world.getAttribute('data-spider-state')).toBe('victory');

    // Advance timers by 1000ms: spider must still be in 'victory'
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(world.getAttribute('data-spider-state')).toBe('victory');

    // Advance to 1800ms: transition occurs and advances to next level (web)
    act(() => {
      vi.advanceTimersByTime(850);
    });
    expect(world.getAttribute('data-spider-state')).toBe('idle');
    expect(world.getAttribute('data-target-word')).toBe('web');
  });

  it('advances to next level after 1800ms and unlocks nodes for the new round', () => {
    const onRoundComplete = vi.fn();
    render(<SpiderApp onBack={vi.fn()} onRoundComplete={onRoundComplete} />);
    const world = screen.getByTestId('mock-spider-world');

    // Round 1: 'spin'
    expect(world.getAttribute('data-target-word')).toBe('spin');
    fireEvent.click(screen.getByTestId('rime-node-in'));
    expect(onRoundComplete).toHaveBeenCalledTimes(1);

    // Advance 1800ms to Level 2: 'web' (onset 'w', rime 'eb')
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(world.getAttribute('data-target-word')).toBe('web');
    expect(screen.getByText(/Web Strand 2 \/ 11 • Silky Home/i)).toBeInTheDocument();

    // Round lock is reset in initLevel: player can now click the correct rime node 'eb' for Round 2
    const nodeEb = screen.getByTestId('rime-node-eb');
    fireEvent.click(nodeEb);

    expect(onRoundComplete).toHaveBeenCalledTimes(2);
    expect(onRoundComplete).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isCorrect: true,
        targetWord: 'web',
      })
    );
  });

  it('progresses smoothly through levels displaying correct titles and web strand counts', () => {
    const onRoundComplete = vi.fn();
    render(<SpiderApp onBack={vi.fn()} onRoundComplete={onRoundComplete} />);
    const world = screen.getByTestId('mock-spider-world');

    // Level 1: 'spin'
    expect(screen.getByText(/Web Strand 1 \/ 11 • Whirling Spin/i)).toBeInTheDocument();
    expect(world.getAttribute('data-target-word')).toBe('spin');
    fireEvent.click(screen.getByTestId('rime-node-in'));
    expect(onRoundComplete).toHaveBeenCalledTimes(1);

    // Advance to Level 2: 'web'
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(screen.getByText(/Web Strand 2 \/ 11 • Silky Home/i)).toBeInTheDocument();
    expect(world.getAttribute('data-target-word')).toBe('web');
  });
});

// ────────────────────────────────────────────────
// 6. Final Level Completion, Victory Screen & Looping Fix
// ────────────────────────────────────────────────
describe('Final level (Level 11) completion, victory screen & looping prevention', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('completes Level 11 and displays victory completion screen with final score and stars instead of looping to Level 0', () => {
    const onRoundComplete = vi.fn();
    const onGameComplete = vi.fn();
    render(
      <SpiderApp
        onBack={vi.fn()}
        onRoundComplete={onRoundComplete}
        onGameComplete={onGameComplete}
      />
    );

    // Play through all 11 levels
    for (let i = 0; i < SPIDER_LEVELS.length; i++) {
      const level = SPIDER_LEVELS[i];
      const targetNode = screen.getByTestId(`rime-node-${level.targetRime}`);
      fireEvent.click(targetNode);
      act(() => {
        vi.advanceTimersByTime(1800);
      });
    }

    // 1. Completion screen must be visible
    expect(screen.getByTestId('spider-completion-screen')).toBeInTheDocument();
    expect(screen.getByText(/Master of the Web!/i)).toBeInTheDocument();
    expect(screen.getByText(/You wove all 11 glistening spider webs!/i)).toBeInTheDocument();

    // 2. Must NOT loop back to Level 0 (Web Strand 1)
    expect(screen.queryByText(/Web Strand 1 \/ 11 • Whirling Spin/i)).not.toBeInTheDocument();

    // 3. Final score and stars are displayed
    const finalScore = screen.getByTestId('final-score');
    const finalStars = screen.getByTestId('final-stars');
    expect(finalScore).toBeInTheDocument();
    expect(finalStars).toBeInTheDocument();
    expect(Number(finalStars.textContent)).toBe(11);

    // 4. Play Again and Back to Games buttons are present
    expect(screen.getByTestId('play-again-btn')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-games-btn')).toBeInTheDocument();

    // 5. Fanfare and companion voice triggered on completion
    expect(mockPlayFanfare).toHaveBeenCalled();
    expect(mockSpeakCompanion).toHaveBeenCalledWith('Amazing job! You wove all the spider webs!');
    expect(onGameComplete).toHaveBeenCalledTimes(1);
    expect(onGameComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        completed: true,
        stars: 11,
      })
    );
  });

  it('locks out extra taps and prevents additional scoring after completion', () => {
    const onRoundComplete = vi.fn();
    render(<SpiderApp onBack={vi.fn()} onRoundComplete={onRoundComplete} />);

    // Play through all 11 levels
    for (let i = 0; i < SPIDER_LEVELS.length; i++) {
      const level = SPIDER_LEVELS[i];
      fireEvent.click(screen.getByTestId(`rime-node-${level.targetRime}`));
      act(() => {
        vi.advanceTimersByTime(1800);
      });
    }

    expect(screen.getByTestId('spider-completion-screen')).toBeInTheDocument();
    const callsBeforeExtraClicks = onRoundComplete.mock.calls.length;
    expect(callsBeforeExtraClicks).toBe(11);

    const finalScoreText = screen.getByTestId('final-score').textContent;

    // Attempt extra clicks on any rime nodes in background
    const anyNode = screen.queryByTestId('rime-node-ider');
    if (anyNode) {
      fireEvent.click(anyNode);
    }

    // No extra round completes or score changes
    expect(onRoundComplete).toHaveBeenCalledTimes(11);
    expect(screen.getByTestId('final-score').textContent).toBe(finalScoreText);
  });

  it('resets game to Level 1 and score 0 when Play Again is clicked', () => {
    const onResetSession = vi.fn();
    render(
      <SpiderApp
        onBack={vi.fn()}
        onRoundComplete={vi.fn()}
        onResetSession={onResetSession}
      />
    );

    // Complete all 11 levels
    for (let i = 0; i < SPIDER_LEVELS.length; i++) {
      const level = SPIDER_LEVELS[i];
      fireEvent.click(screen.getByTestId(`rime-node-${level.targetRime}`));
      act(() => {
        vi.advanceTimersByTime(1800);
      });
    }

    expect(screen.getByTestId('spider-completion-screen')).toBeInTheDocument();

    // Click Play Again
    fireEvent.click(screen.getByTestId('play-again-btn'));

    // Completion modal closes
    expect(screen.queryByTestId('spider-completion-screen')).not.toBeInTheDocument();

    // Game is back to Level 1 ('spin')
    expect(screen.getByText(/Web Strand 1 \/ 11 • Whirling Spin/i)).toBeInTheDocument();
    expect(screen.getByText('0 pts')).toBeInTheDocument();

    // onResetSession callback was called
    expect(onResetSession).toHaveBeenCalledTimes(1);

    // Player can play Level 1 again
    const nodeIn = screen.getByTestId('rime-node-in');
    fireEvent.click(nodeIn);
    expect(screen.getByText('SPIN')).toBeInTheDocument();
  });

  it('calls onBack when Back to Games is clicked on the completion screen', () => {
    const onBack = vi.fn();
    render(<SpiderApp onBack={onBack} onRoundComplete={vi.fn()} />);

    // Complete all 11 levels
    for (let i = 0; i < SPIDER_LEVELS.length; i++) {
      const level = SPIDER_LEVELS[i];
      fireEvent.click(screen.getByTestId(`rime-node-${level.targetRime}`));
      act(() => {
        vi.advanceTimersByTime(1800);
      });
    }

    expect(screen.getByTestId('spider-completion-screen')).toBeInTheDocument();

    // Click Back to Games
    fireEvent.click(screen.getByTestId('back-to-games-btn'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('SpiderWeaverGame saves completed session once upon Level 11 completion without duplicate save on Back to Games', async () => {
    render(
      <MemoryRouter>
        <SpiderWeaverGame />
      </MemoryRouter>
    );

    // Complete all 11 levels
    for (let i = 0; i < SPIDER_LEVELS.length; i++) {
      const level = SPIDER_LEVELS[i];
      fireEvent.click(screen.getByTestId(`rime-node-${level.targetRime}`));
      await act(async () => {
        vi.advanceTimersByTime(1800);
      });
    }

    // Completion screen shows up
    expect(screen.getByTestId('spider-completion-screen')).toBeInTheDocument();

    // Session was saved exactly once upon Level 11 completion
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
    const saveCall = mockSaveLearningSession.mock.calls[0][0];
    expect(saveCall.activity_id).toBe('spider-weaver');
    expect(saveCall.skill).toBe('rimeBlending');
    expect(saveCall.stars).toBe(11);
    expect(saveCall.outcome.details.completed).toBe(true);

    // Now click Back to Games on the completion screen
    const backBtn = screen.getByTestId('back-to-games-btn');
    await act(async () => {
      fireEvent.click(backBtn);
    });

    // saveCompletedSession must NOT be called a second time
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });

  it('SpiderWeaverGame allows saving again if player chooses Play Again and exits later', async () => {
    render(
      <MemoryRouter>
        <SpiderWeaverGame />
      </MemoryRouter>
    );

    // Complete all 11 levels
    for (let i = 0; i < SPIDER_LEVELS.length; i++) {
      const level = SPIDER_LEVELS[i];
      fireEvent.click(screen.getByTestId(`rime-node-${level.targetRime}`));
      await act(async () => {
        vi.advanceTimersByTime(1800);
      });
    }

    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);

    // Click Play Again
    await act(async () => {
      fireEvent.click(screen.getByTestId('play-again-btn'));
    });

    // Play round 1 in the new session
    await act(async () => {
      fireEvent.click(screen.getByTestId('rime-node-in'));
    });

    // Now click top Back to Games button
    const topBackBtn = screen.getByRole('button', { name: /Back to Games/i });
    await act(async () => {
      fireEvent.click(topBackBtn);
    });

    // The second session is saved as well!
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(2);
  });
});


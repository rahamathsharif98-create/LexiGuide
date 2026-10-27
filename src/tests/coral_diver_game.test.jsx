import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { RHYME_LEVELS, getRhymeLevel } from '../games/coral-diver/engine/rhymeWords';
import { getGameById } from '../data/gamingZoneRegistry';
import CoralDiverGame from '../pages/child/CoralDiverGame';
import { useGameSessionTracker } from '../hooks/useGameSessionTracker';

// ────────────────────────────────────────────────────────────────
// Mocks: 3D canvas, audio, and router navigation
// ────────────────────────────────────────────────────────────────

// Mock CoralDiverApp — replaces 3D WebGL canvas with a controllable test double.
// Exposes onRoundComplete and onBack via data-testid buttons so tests can simulate events.
vi.mock('../games/coral-diver/CoralDiverApp', () => ({
  default: ({ onRoundComplete, onBack }) => (
    <div data-testid="mock-coral-diver-app">
      {/* Simulate a CORRECT round completion (rhyme bubble collected) */}
      <button
        data-testid="sim-correct-round"
        onClick={() =>
          onRoundComplete?.({
            isCorrect: true,
            level: { targetWord: 'CAT' },
            stars: 1,
            xp: 25,
            score: 500,
          })
        }
      >
        Correct Round
      </button>

      {/* Simulate an INCORRECT round (wrong bubble tapped) */}
      <button
        data-testid="sim-incorrect-round"
        onClick={() =>
          onRoundComplete?.({
            isCorrect: false,
            level: { targetWord: 'CAT' },
          })
        }
      >
        Incorrect Round
      </button>

      {/* Simulate Back from within the game canvas */}
      <button data-testid="sim-back" onClick={() => onBack?.()}>
        Back (in-game)
      </button>
    </div>
  ),
}));

vi.mock('../services/gameSoundService', () => ({
  gameSound: {
    playPop: vi.fn(),
    playLetterNote: vi.fn(),
    playFanfare: vi.fn(),
    playGentleOops: vi.fn(),
    speakCompanion: vi.fn(),
    getSoundMode: () => 'voice_and_sfx',
    subscribe: () => () => {},
    cycleSoundMode: vi.fn(),
  },
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AppContext — used by useGameSessionTracker
const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 1, ok: true });
const mockShowToast = vi.fn();

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    activeChild: { id: 7, name: 'Coral Tester' },
    isRealBackend: true,
    saveLearningSession: mockSaveLearningSession,
    applySessionOutcome: vi.fn(),
    showToast: mockShowToast,
  }),
}));

// ────────────────────────────────────────────────────────────────
// Helper to render CoralDiverGame inside MemoryRouter
// ────────────────────────────────────────────────────────────────
function renderCoralDiverGame() {
  return render(
    <MemoryRouter>
      <CoralDiverGame />
    </MemoryRouter>
  );
}

// ────────────────────────────────────────────────────────────────
// 1. Static Curriculum & Registry Tests (pre-existing, preserved)
// ────────────────────────────────────────────────────────────────
describe('Coral Reef Submarine Diver (3D Ocean Adventure)', () => {
  it('loads valid rhyme levels with phonics word families and distractors', () => {
    expect(RHYME_LEVELS.length).toBeGreaterThanOrEqual(5);
    RHYME_LEVELS.forEach((level) => {
      expect(level.id).toBeDefined();
      expect(level.family).toBeDefined();
      expect(level.targetWord).toBeDefined();
      expect(level.validRhymes.length).toBeGreaterThanOrEqual(3);
      expect(level.distractors.length).toBeGreaterThanOrEqual(2);
      expect(level.prompt).toBeDefined();
      expect(level.speechText).toBeDefined();
    });
  });

  it('cycles levels predictably without crashing on overflow indices', () => {
    const level0 = getRhymeLevel(0);
    expect(level0.targetWord).toBe('CAT');
    const level1 = getRhymeLevel(1);
    expect(level1.targetWord).toBe('PIG');
    const levelOverflow = getRhymeLevel(20);
    expect(levelOverflow).toBeDefined();
    expect(levelOverflow.validRhymes).toBeDefined();
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('coral-diver');
    expect(game).toBeDefined();
    expect(game.title).toBe('Coral Reef Submarine Diver');
    expect(game.route).toBe('/child/games/coral-diver');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('words');
  });
});

// ────────────────────────────────────────────────────────────────
// 2. Session Tracking Hook — unit tests (no component mount)
// ────────────────────────────────────────────────────────────────
describe('useGameSessionTracker — Coral Diver session accumulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recordAttempt accumulates correct attempts without calling saveLearningSession', async () => {
    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'coral-diver',
        gameTitle: 'Coral Reef Submarine Diver',
        skill: 'rhymeDiscrimination',
      })
    );

    await act(async () => {
      result.current.recordAttempt(true, { roundScore: 500, starsEarned: 1, xpEarned: 25 });
      result.current.recordAttempt(true, { roundScore: 500, starsEarned: 1, xpEarned: 25 });
      result.current.recordAttempt(false, {});
    });

    expect(result.current.stats.roundsAttempted).toBe(3);
    expect(result.current.stats.roundsCorrect).toBe(2);
    // recordAttempt must never call the backend directly
    expect(mockSaveLearningSession).not.toHaveBeenCalled();
  });

  it('saveCompletedSession calls saveLearningSession exactly once when invoked once', async () => {
    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'coral-diver',
        gameTitle: 'Coral Reef Submarine Diver',
        skill: 'rhymeDiscrimination',
      })
    );

    await act(async () => {
      await result.current.saveCompletedSession({ stars: 2, xp: 50 });
    });

    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
    const call = mockSaveLearningSession.mock.calls[0][0];
    expect(call.activity_id).toBe('coral-diver');
    expect(call.skill).toBe('rhymeDiscrimination');
  });

  it('saveCompletedSession is idempotent — rapid duplicate calls result in only one backend save', async () => {
    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'coral-diver',
        gameTitle: 'Coral Reef Submarine Diver',
        skill: 'rhymeDiscrimination',
      })
    );

    await act(async () => {
      // Simulate rapid double-save (the hook has its own isSavingRef guard)
      result.current.saveCompletedSession();
      result.current.saveCompletedSession();
      result.current.saveCompletedSession();
    });

    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────────────────────
// 3. Component Lifecycle — Session Save Integrity
// ────────────────────────────────────────────────────────────────
describe('CoralDiverGame — Session save integrity (P1 fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders the Back to Games button and the mock game canvas', () => {
    renderCoralDiverGame();
    expect(screen.getByText('Back to Games')).toBeInTheDocument();
    expect(screen.getByTestId('mock-coral-diver-app')).toBeInTheDocument();
  });

  // ── P1 fix: correct round does NOT trigger backend save ──────
  it('correct round completion records an attempt but does NOT call saveLearningSession', async () => {
    renderCoralDiverGame();

    await act(async () => {
      fireEvent.click(screen.getByTestId('sim-correct-round'));
    });

    // recordAttempt is internal — we verify that the backend was NOT contacted
    expect(mockSaveLearningSession).not.toHaveBeenCalled();
  });

  it('multiple correct rounds do NOT trigger any backend saves', async () => {
    renderCoralDiverGame();

    await act(async () => {
      fireEvent.click(screen.getByTestId('sim-correct-round'));
      fireEvent.click(screen.getByTestId('sim-correct-round'));
      fireEvent.click(screen.getByTestId('sim-correct-round'));
    });

    expect(mockSaveLearningSession).not.toHaveBeenCalled();
  });

  it('incorrect round does NOT trigger a backend save', async () => {
    renderCoralDiverGame();

    await act(async () => {
      fireEvent.click(screen.getByTestId('sim-incorrect-round'));
    });

    expect(mockSaveLearningSession).not.toHaveBeenCalled();
  });

  // ── Back to Games saves session exactly once ─────────────────
  it('clicking Back to Games saves the session exactly once and navigates', async () => {
    renderCoralDiverGame();

    // Play a couple of rounds first
    await act(async () => {
      fireEvent.click(screen.getByTestId('sim-correct-round'));
      fireEvent.click(screen.getByTestId('sim-incorrect-round'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Back to Games'));
    });

    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/child/games');
  });

  // ── Idempotency guard: rapid Back taps cannot double-save ────
  it('rapid repeated Back taps save the session only once (isSavedRef guard)', async () => {
    renderCoralDiverGame();

    await act(async () => {
      // Simulate rapid double-tap on Back to Games button
      fireEvent.click(screen.getByText('Back to Games'));
      fireEvent.click(screen.getByText('Back to Games'));
      fireEvent.click(screen.getByText('Back to Games'));
    });

    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });

  // ── In-game Back callback also uses the guard ────────────────
  it('in-game Back callback (from CoralDiverApp) saves exactly once and navigates', async () => {
    renderCoralDiverGame();

    await act(async () => {
      fireEvent.click(screen.getByTestId('sim-back'));
    });

    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/child/games');
  });

  // ── No double save: Back after rounds ────────────────────────
  it('several rounds followed by Back saves the session exactly once', async () => {
    renderCoralDiverGame();

    await act(async () => {
      fireEvent.click(screen.getByTestId('sim-correct-round'));
      fireEvent.click(screen.getByTestId('sim-correct-round'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Back to Games'));
    });

    // The two correct rounds must NOT have each triggered a save;
    // only the Back button should have triggered exactly one save.
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/child/games');
  });

  // ── Save payload integrity ────────────────────────────────────
  it('the session save payload contains the correct gameId and skill', async () => {
    renderCoralDiverGame();

    await act(async () => {
      fireEvent.click(screen.getByTestId('sim-correct-round'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Back to Games'));
    });

    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
    const payload = mockSaveLearningSession.mock.calls[0][0];
    expect(payload.activity_id).toBe('coral-diver');
    expect(payload.skill).toBe('rhymeDiscrimination');
    expect(payload.outcome).toBeDefined();
    expect(payload.outcome.gameId).toBe('coral-diver');
  });
});

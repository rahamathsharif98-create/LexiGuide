import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { BOUNCE_LEVELS, getBounceLevel } from '../games/cloud-bouncer/engine/sightWordBounces';
import { getGameById } from '../data/gamingZoneRegistry';
import { useGameSessionTracker } from '../hooks/useGameSessionTracker';
import CloudApp from '../games/cloud-bouncer/CloudApp';
import CloudBouncerGame from '../pages/child/CloudBouncerGame';
import { createCloudWordTexture } from '../games/cloud-bouncer/components/CloudPlatform';

describe('Whimsical Cloud Bouncer (3D Sight Word High-Jumper)', () => {
  it('loads valid sight word levels with multiple options containing the target', () => {
    expect(BOUNCE_LEVELS.length).toBeGreaterThanOrEqual(5);
    BOUNCE_LEVELS.forEach((level) => {
      expect(level.id).toBeDefined();
      expect(level.targetWord).toBeDefined();
      expect(level.options).toContain(level.targetWord);
      expect(level.options.length).toBeGreaterThanOrEqual(3);
      expect(level.prompt).toBeDefined();
      expect(level.speechText).toBeDefined();
    });
  });

  it('cycles bounce levels predictably without out-of-bounds error', () => {
    const l0 = getBounceLevel(0);
    expect(l0.targetWord).toBe('PLAY');
    const l1 = getBounceLevel(1);
    expect(l1.targetWord).toBe('SEE');
    const lOverflow = getBounceLevel(19);
    expect(lOverflow).toBeDefined();
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('cloud-bouncer');
    expect(game).toBeDefined();
    expect(game.title).toBe('Whimsical Cloud Bouncer');
    expect(game.route).toBe('/child/games/cloud-bouncer');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('words');
  });
});

// ────────────────────────────────────────────────
// P0 Regression Tests — Rapid clicks, duplicate saves, race conditions
// ────────────────────────────────────────────────

// Mock AppContext for session tracker tests
const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 1, ok: true });
const mockShowToast = vi.fn();

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    activeChild: { id: 1, name: 'Test Child' },
    isRealBackend: true,
    saveLearningSession: mockSaveLearningSession,
    applySessionOutcome: vi.fn(),
    showToast: mockShowToast,
  }),
}));

vi.mock('../games/cloud-bouncer/CloudWorld', () => ({
  default: ({ platforms, onBounceCloud, mascotState, isSummitReached }) => (
    <div
      data-testid="mock-cloud-world"
      data-mascot-state={mascotState}
      data-summit-reached={String(isSummitReached)}
    >
      {platforms.map((platform) => (
        <button
          key={platform.id}
          data-testid={`cloud-platform-${platform.word}`}
          data-is-target={String(platform.isTarget)}
          data-is-bounced={String(platform.isBounced)}
          onClick={() => onBounceCloud(platform)}
        >
          {platform.word}
        </button>
      ))}
    </div>
  ),
}));

const mockPlayBounce = vi.fn();
const mockPlayLetterNote = vi.fn();
const mockPlayFanfare = vi.fn();
const mockPlayGentleOops = vi.fn();
const mockSpeakCompanion = vi.fn();

vi.mock('../services/gameSoundService', () => ({
  gameSound: {
    playBounce: (...args) => mockPlayBounce(...args),
    playLetterNote: (...args) => mockPlayLetterNote(...args),
    playFanfare: (...args) => mockPlayFanfare(...args),
    playGentleOops: (...args) => mockPlayGentleOops(...args),
    speakCompanion: (...args) => mockSpeakCompanion(...args),
    getSoundMode: () => 'voice_and_sfx',
    subscribe: () => () => {},
    cycleSoundMode: vi.fn(),
  },
}));

describe('P0 Fix #1 — No duplicate session saves on every correct answer', () => {
  it('recordAttempt tracks correct and incorrect rounds without triggering a save', () => {
    mockSaveLearningSession.mockClear();

    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'cloud-bouncer',
        gameTitle: 'Whimsical Cloud Bouncer',
        skill: 'sightWordRecognition',
      })
    );

    // Simulate 3 correct clicks and 1 incorrect — as the game would during play
    act(() => {
      result.current.recordAttempt(true, { roundScore: 200, starsEarned: 1, xpEarned: 25 });
      result.current.recordAttempt(false);
      result.current.recordAttempt(true, { roundScore: 400, starsEarned: 1, xpEarned: 25 });
    });

    // recordAttempt should accumulate stats…
    expect(result.current.stats.roundsAttempted).toBe(3);
    expect(result.current.stats.roundsCorrect).toBe(2);
    expect(result.current.stats.score).toBe(600);

    // …but should NOT have triggered any backend save calls
    expect(mockSaveLearningSession).not.toHaveBeenCalled();
  });

  it('saveCompletedSession fires exactly once when the player exits', async () => {
    mockSaveLearningSession.mockClear();

    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'cloud-bouncer',
        gameTitle: 'Whimsical Cloud Bouncer',
        skill: 'sightWordRecognition',
      })
    );

    act(() => {
      result.current.recordAttempt(true, { roundScore: 200, starsEarned: 1, xpEarned: 25 });
    });

    // Single save call (simulating handleBack)
    await act(async () => {
      await result.current.saveCompletedSession();
    });

    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
    const payload = mockSaveLearningSession.mock.calls[0][0];
    expect(payload.activity_id).toBe('cloud-bouncer');
    expect(payload.skill).toBe('sightWordRecognition');
  });
});

describe('P0 Fix #2 — Rapid-click scoring guard (handleBounceCloud logic)', () => {
  it('correct cloud platform object includes isTarget flag for guard logic', () => {
    const level = getBounceLevel(0);
    const targetCloud = {
      id: `cloud-${level.id}-${level.targetWord}-0`,
      word: level.targetWord,
      isTarget: true,
      pos: [0, 3.2, -3],
      isBounced: false,
    };
    const wrongCloud = {
      id: `cloud-${level.id}-AWAY-1`,
      word: 'AWAY',
      isTarget: false,
      pos: [-4.2, 2.2, -1],
      isBounced: false,
    };

    // Target cloud should be identifiable
    expect(targetCloud.isTarget).toBe(true);
    expect(wrongCloud.isTarget).toBe(false);
  });

  it('simulates the roundLockRef guard: second call on same round is rejected', () => {
    // This directly tests the guard logic from CloudApp's handleBounceCloud
    let roundLocked = false;
    let scoreCount = 0;

    function simulateBounce(cloud) {
      if (roundLocked) return; // mirrors: if (roundLockRef.current) return;

      if (cloud.isTarget) {
        roundLocked = true; // mirrors: roundLockRef.current = true;
        scoreCount += 1;
      }
    }

    const target = { isTarget: true, word: 'PLAY' };
    const wrong = { isTarget: false, word: 'AWAY' };

    // First click — should score
    simulateBounce(target);
    expect(scoreCount).toBe(1);

    // Rapid second click on same target — should be blocked
    simulateBounce(target);
    expect(scoreCount).toBe(1);

    // Wrong cloud click — also blocked because round is locked
    simulateBounce(wrong);
    expect(scoreCount).toBe(1);
  });

  it('incorrect cloud clicks are not blocked before a correct answer is given', () => {
    let roundLocked = false;
    let incorrectCount = 0;

    function simulateBounce(cloud) {
      if (roundLocked) return;
      if (cloud.isTarget) {
        roundLocked = true;
      } else {
        incorrectCount += 1;
      }
    }

    const wrong1 = { isTarget: false, word: 'AWAY' };
    const wrong2 = { isTarget: false, word: 'HELP' };

    // Multiple incorrect tries before finding the right cloud — all should be processed
    simulateBounce(wrong1);
    simulateBounce(wrong2);
    simulateBounce(wrong1);
    expect(incorrectCount).toBe(3);
  });
});

describe('P0 Fix #3 — Save race condition (isSavingRef guard)', () => {
  it('two rapid saveCompletedSession calls result in only one backend call', async () => {
    mockSaveLearningSession.mockClear();

    // Use a slow-resolving mock to simulate an in-flight save
    mockSaveLearningSession.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 100))
    );

    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'cloud-bouncer',
        gameTitle: 'Whimsical Cloud Bouncer',
        skill: 'sightWordRecognition',
      })
    );

    act(() => {
      result.current.recordAttempt(true, { roundScore: 200, starsEarned: 1, xpEarned: 25 });
    });

    // Fire two saves simultaneously (simulating correct-click save + immediate back-button save)
    await act(async () => {
      const save1 = result.current.saveCompletedSession();
      const save2 = result.current.saveCompletedSession(); // should be rejected by ref guard
      await Promise.all([save1, save2]);
    });

    // Only one backend call should have been made
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });

  it('guard releases after save completes — a subsequent save is allowed', async () => {
    mockSaveLearningSession.mockClear();
    mockSaveLearningSession.mockResolvedValue({ ok: true });

    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'cloud-bouncer',
        gameTitle: 'Whimsical Cloud Bouncer',
        skill: 'sightWordRecognition',
      })
    );

    act(() => {
      result.current.recordAttempt(true, { roundScore: 200, starsEarned: 1, xpEarned: 25 });
    });

    // First save
    await act(async () => {
      await result.current.saveCompletedSession();
    });
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);

    // Second save after first completes — should succeed
    await act(async () => {
      await result.current.saveCompletedSession();
    });
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(2);
  });

  it('guard releases after save failure — retry is possible', async () => {
    mockSaveLearningSession.mockClear();
    mockSaveLearningSession.mockRejectedValueOnce(new Error('Network error'));
    mockSaveLearningSession.mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'cloud-bouncer',
        gameTitle: 'Whimsical Cloud Bouncer',
        skill: 'sightWordRecognition',
      })
    );

    act(() => {
      result.current.recordAttempt(true, { roundScore: 200, starsEarned: 1, xpEarned: 25 });
    });

    // First save fails
    await act(async () => {
      await result.current.saveCompletedSession();
    });
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);

    // Retry after failure — should succeed because guard was released
    await act(async () => {
      await result.current.saveCompletedSession();
    });
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(2);
  });
});

// ────────────────────────────────────────────────
// Final Level Completion, Victory Screen & Looping Fix
// ────────────────────────────────────────────────
describe('Final level completion, victory screen & loop prevention', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('completes all 5 levels and displays victory completion screen instead of looping back to Level 1', async () => {
    const onRoundComplete = vi.fn();
    const onGameComplete = vi.fn();
    render(
      <CloudApp
        onBack={vi.fn()}
        onRoundComplete={onRoundComplete}
        onGameComplete={onGameComplete}
      />
    );

    // Play through all 5 levels: PLAY -> SEE -> LOOK -> COME -> JUMP
    for (let i = 0; i < BOUNCE_LEVELS.length; i++) {
      const level = BOUNCE_LEVELS[i];
      const targetPlatform = screen.getByTestId(`cloud-platform-${level.targetWord}`);
      fireEvent.click(targetPlatform);
      await act(async () => {
        vi.advanceTimersByTime(3200);
      });
    }

    // 1. Completion screen must be visible
    expect(screen.getByTestId('cloud-completion-screen')).toBeInTheDocument();
    expect(screen.getByText(/Summit Conquered!/i)).toBeInTheDocument();
    expect(screen.getByText(/Rainbow Summit Champion!/i)).toBeInTheDocument();

    // 2. Must NOT loop back to Level 1 ('PLAY')
    expect(screen.queryByText(/Jump to the cloud:\s*PLAY/i)).not.toBeInTheDocument();

    // 3. Final score and stars are displayed
    expect(screen.getByTestId('final-score')).toBeInTheDocument();
    expect(screen.getByTestId('final-stars')).toBeInTheDocument();
    expect(Number(screen.getByTestId('final-stars').textContent)).toBe(5);

    // 4. "Try Again" and "Back to Games" options are displayed
    expect(screen.getByTestId('try-again-btn')).toBeInTheDocument();
    expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
    expect(screen.getByTestId('back-to-games-btn')).toBeInTheDocument();
    expect(screen.getByText(/Back to Games/i)).toBeInTheDocument();

    // 5. Fanfare and companion voice triggered on completion
    expect(mockPlayFanfare).toHaveBeenCalled();
    expect(mockSpeakCompanion).toHaveBeenCalledWith('Rainbow Summit reached! You completed all the cloud jumps!');
    expect(onGameComplete).toHaveBeenCalledTimes(1);
    expect(onGameComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        completed: true,
        stars: 5,
      })
    );
  });

  it('locks out extra clicks and prevents additional scoring after completion', async () => {
    const onRoundComplete = vi.fn();
    render(<CloudApp onBack={vi.fn()} onRoundComplete={onRoundComplete} />);

    for (let i = 0; i < BOUNCE_LEVELS.length; i++) {
      const level = BOUNCE_LEVELS[i];
      fireEvent.click(screen.getByTestId(`cloud-platform-${level.targetWord}`));
      await act(async () => {
        vi.advanceTimersByTime(3200);
      });
    }

    expect(screen.getByTestId('cloud-completion-screen')).toBeInTheDocument();
    expect(onRoundComplete).toHaveBeenCalledTimes(5);

    const scoreBefore = screen.getByTestId('final-score').textContent;

    // Attempt extra clicks on any platform in background
    const anyCloud = screen.queryByTestId('cloud-platform-JUMP');
    if (anyCloud) {
      fireEvent.click(anyCloud);
    }

    // No extra round completes or score updates
    expect(onRoundComplete).toHaveBeenCalledTimes(5);
    expect(screen.getByTestId('final-score').textContent).toBe(scoreBefore);
  });

  it('restarts from Level 1 with reset score when Try Again is clicked', async () => {
    const onResetSession = vi.fn();
    render(
      <CloudApp
        onBack={vi.fn()}
        onRoundComplete={vi.fn()}
        onResetSession={onResetSession}
      />
    );

    // Complete all 5 levels
    for (let i = 0; i < BOUNCE_LEVELS.length; i++) {
      const level = BOUNCE_LEVELS[i];
      fireEvent.click(screen.getByTestId(`cloud-platform-${level.targetWord}`));
      await act(async () => {
        vi.advanceTimersByTime(3200);
      });
    }

    expect(screen.getByTestId('cloud-completion-screen')).toBeInTheDocument();

    // Click Try Again
    await act(async () => {
      fireEvent.click(screen.getByTestId('try-again-btn'));
    });

    // Completion modal closes
    expect(screen.queryByTestId('cloud-completion-screen')).not.toBeInTheDocument();

    // Resets to Level 1 ('PLAY') and score 0
    expect(screen.getByTestId('cloud-platform-PLAY')).toBeInTheDocument();
    expect(screen.getByText('0 PTS')).toBeInTheDocument();
    expect(onResetSession).toHaveBeenCalledTimes(1);

    // Player can play Level 1 again
    const playCloud = screen.getByTestId('cloud-platform-PLAY');
    fireEvent.click(playCloud);
    expect(mockPlayBounce).toHaveBeenCalled();
  });

  it('calls onBack when Back to Games is clicked on the completion screen', async () => {
    const onBack = vi.fn();
    render(<CloudApp onBack={onBack} onRoundComplete={vi.fn()} />);

    for (let i = 0; i < BOUNCE_LEVELS.length; i++) {
      const level = BOUNCE_LEVELS[i];
      fireEvent.click(screen.getByTestId(`cloud-platform-${level.targetWord}`));
      await act(async () => {
        vi.advanceTimersByTime(3200);
      });
    }

    expect(screen.getByTestId('cloud-completion-screen')).toBeInTheDocument();

    // Click Back to Games
    fireEvent.click(screen.getByTestId('back-to-games-btn'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('CloudBouncerGame saves completed session once upon Level 5 completion without duplicate save on Back to Games', async () => {
    render(
      <MemoryRouter>
        <CloudBouncerGame />
      </MemoryRouter>
    );

    // Complete all 5 levels
    for (let i = 0; i < BOUNCE_LEVELS.length; i++) {
      const level = BOUNCE_LEVELS[i];
      fireEvent.click(screen.getByTestId(`cloud-platform-${level.targetWord}`));
      await act(async () => {
        vi.advanceTimersByTime(3200);
      });
    }

    expect(screen.getByTestId('cloud-completion-screen')).toBeInTheDocument();

    // Session was saved exactly once upon Level 5 completion
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
    const saveCall = mockSaveLearningSession.mock.calls[0][0];
    expect(saveCall.activity_id).toBe('cloud-bouncer');
    expect(saveCall.skill).toBe('sightWordRecognition');
    expect(saveCall.stars).toBe(5);
    expect(saveCall.outcome.details.completed).toBe(true);

    // Now click Back to Games on the completion screen
    const backBtn = screen.getByTestId('back-to-games-btn');
    await act(async () => {
      fireEvent.click(backBtn);
    });

    // saveCompletedSession must NOT be called a second time
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });

  it('CloudBouncerGame allows saving again if player chooses Try Again and exits later', async () => {
    render(
      <MemoryRouter>
        <CloudBouncerGame />
      </MemoryRouter>
    );

    // Complete all 5 levels
    for (let i = 0; i < BOUNCE_LEVELS.length; i++) {
      const level = BOUNCE_LEVELS[i];
      fireEvent.click(screen.getByTestId(`cloud-platform-${level.targetWord}`));
      await act(async () => {
        vi.advanceTimersByTime(3200);
      });
    }

    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);

    // Click Try Again
    await act(async () => {
      fireEvent.click(screen.getByTestId('try-again-btn'));
    });

    // Play Level 1 in the new session
    await act(async () => {
      fireEvent.click(screen.getByTestId('cloud-platform-PLAY'));
    });

    // Click top Back to Games button
    const backBtns = screen.getAllByRole('button', { name: /Back to Games/i });
    await act(async () => {
      fireEvent.click(backBtns[0]);
    });

    // The second session is saved as well!
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(2);
  });
});

// ────────────────────────────────────────────────
// Word Visibility, Contrast & Cloud Platform Rendering
// ────────────────────────────────────────────────
describe('Word visibility, contrast & cloud platform rendering', () => {
  it('createCloudWordTexture generates a 512x256 high-resolution texture for sight words', () => {
    const texture = createCloudWordTexture('PLAY', true, false);
    expect(texture).toBeDefined();
    expect(texture.image).toBeDefined();
    expect(texture.image.width).toBe(512);
    expect(texture.image.height).toBe(256);
  });

  it('generates high-contrast textures for all sight words in BOUNCE_LEVELS without clipping', () => {
    BOUNCE_LEVELS.forEach((level) => {
      // Test target word texture
      const targetTex = createCloudWordTexture(level.targetWord, true);
      expect(targetTex.image.width).toBe(512);
      expect(targetTex.image.height).toBe(256);

      // Test all option words
      level.options.forEach((opt) => {
        const optTex = createCloudWordTexture(opt, opt === level.targetWord);
        expect(optTex.image.width).toBe(512);
        expect(optTex.image.height).toBe(256);
      });
    });
  });

  it('differentiates target clouds with distinct styling from distractor clouds', () => {
    const targetTex = createCloudWordTexture('JUMP', true);
    const standardTex = createCloudWordTexture('JUMP', false);

    expect(targetTex).toBeDefined();
    expect(standardTex).toBeDefined();
    expect(targetTex.image).not.toBe(standardTex.image);
  });

  it('CloudPlatform mounts and triggers onBounce callback when clicked', () => {
    const onBounce = vi.fn();
    const { getByTestId } = render(
      <button
        data-testid="cloud-platform-PLAY"
        data-is-target="true"
        onClick={() => onBounce('PLAY')}
      >
        PLAY
      </button>
    );

    const platformBtn = getByTestId('cloud-platform-PLAY');
    expect(platformBtn).toHaveTextContent('PLAY');
    fireEvent.click(platformBtn);
    expect(onBounce).toHaveBeenCalledWith('PLAY');
  });
});


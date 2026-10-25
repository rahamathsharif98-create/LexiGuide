import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  PHONICS_TARGETS,
  PHONICS_TARGETS_25,
  SKY_ARCHER_CURRICULUM,
  SKY_ARCHER_STATIONS,
  TOTAL_SKY_ARCHER_ROUNDS,
  TOTAL_SKY_ARCHER_STATIONS,
  ROUNDS_PER_STATION,
  getPhonicsRound,
  getPhonicsCurriculumRound,
} from '../games/sky-archer/engine/phonicsTargets';
import { getGameById } from '../data/gamingZoneRegistry';
import SkyArcherApp from '../games/sky-archer/SkyArcherApp';
import SkyArcherGame from '../pages/child/SkyArcherGame';
import ArrowProjectile, { calculateArrowPosition, calculateArrowLookAt } from '../games/sky-archer/components/ArrowProjectile';
import {
  loadSkyArcherCheckpoint,
  saveSkyArcherCheckpoint,
  resetSkyArcherCheckpoint,
  getSkyArcherCheckpointKey,
  loadSkyArcherCheckpointData,
  DEFAULT_MAX_ROUNDS,
} from '../games/sky-archer/engine/skyArcherCheckpoint';

// ────────────────────────────────────────────────
// Mocks for JSDOM 3D canvas, context, and audio
// ────────────────────────────────────────────────
const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 1, ok: true });
const mockShowToast = vi.fn();

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    activeChild: { id: 1, name: 'Archer Tester' },
    isRealBackend: true,
    saveLearningSession: mockSaveLearningSession,
    applySessionOutcome: vi.fn(),
    showToast: mockShowToast,
  }),
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => (
    <div data-testid="mock-canvas">
      {React.Children.toArray(children).filter((c) => c && c.type !== 'color')}
    </div>
  ),
  useFrame: (cb) => {
    // Expose frame callback for direct projectile unit tests if needed
    if (typeof cb === 'function') {
      ArrowProjectile.__frameCallback = cb;
    }
  },
}));

const mockPlaySnap = vi.fn();
const mockPlayPop = vi.fn();
const mockPlayLetterNote = vi.fn();
const mockPlaySparkle = vi.fn();
const mockSpeakCompanion = vi.fn();
const mockPlayGentleOops = vi.fn();

vi.mock('../services/gameSoundService', () => ({
  gameSound: {
    playSnap: (...args) => mockPlaySnap(...args),
    playPop: (...args) => mockPlayPop(...args),
    playLetterNote: (...args) => mockPlayLetterNote(...args),
    playSparkle: (...args) => mockPlaySparkle(...args),
    speakCompanion: (...args) => mockSpeakCompanion(...args),
    playGentleOops: (...args) => mockPlayGentleOops(...args),
    getSoundMode: () => 'voice_and_sfx',
    subscribe: () => () => {},
    cycleSoundMode: vi.fn(),
  },
}));

vi.mock('../games/sky-archer/SkyArcherWorld', () => ({
  default: ({ currentRound, poppedLetters, activeArrow, onHitBalloon, onArrowImpact }) => (
    <div data-testid="mock-sky-world">
      {activeArrow && (
        <div
          data-testid="mock-active-arrow"
          data-letter={activeArrow.letter}
          data-target={activeArrow.isTarget ? 'true' : 'false'}
          data-pos={JSON.stringify(activeArrow.pos)}
          onClick={() => onArrowImpact && onArrowImpact(activeArrow)}
        >
          Arrow flying to {activeArrow.letter}
        </div>
      )}
      {currentRound.shuffledOptions.map((letter, idx) => (
        <button
          key={`${letter}-${idx}`}
          data-testid={`balloon-${letter}`}
          data-popped={poppedLetters.includes(letter) ? 'true' : 'false'}
          onClick={() => onHitBalloon(letter, letter === currentRound.correct, [0, 0, 0], idx)}
        >
          {letter}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../games/common/vfx/VFXScreenConfetti', () => ({
  default: ({ active }) => <div data-testid="mock-confetti" data-active={active ? 'true' : 'false'} />,
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('Sky Island Word Archer (3D Phonics Adventure)', () => {
  it('loads valid phonics target database with essential early reading digraphs and blends', () => {
    expect(PHONICS_TARGETS.length).toBeGreaterThanOrEqual(10);
    PHONICS_TARGETS.forEach((target) => {
      expect(target.id).toBeDefined();
      expect(target.sound).toBeDefined();
      expect(target.correct).toBeDefined();
      expect(target.options).toContain(target.correct);
      expect(target.options.length).toBe(4);
      expect(target.prompt).toBeDefined();
    });
  });

  it('generates a round with shuffled options containing the target answer', () => {
    const round0 = getPhonicsRound(0);
    expect(round0.correct).toBe('SH');
    expect(round0.shuffledOptions).toHaveLength(4);
    expect(round0.shuffledOptions).toContain('SH');
  });

  it('progresses through diverse rounds without index out of bounds', () => {
    for (let i = 0; i < 20; i++) {
      const round = getPhonicsRound(i);
      expect(round).toBeDefined();
      expect(round.correct).toBeDefined();
      expect(round.sound).toBeDefined();
    }
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('sky-archer');
    expect(game).toBeDefined();
    expect(game.title).toBe('Sky Word Archer');
    expect(game.route).toBe('/child/games/sky-archer');
    expect(game.dimension).toBe('3D Adventure');
  });
});

describe('Sky Archer Critical Bug Fixes (Step 1)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('P0-1: prevents round-transition soft-lock when a distractor is clicked after a correct hit', () => {
    vi.useFakeTimers();
    const onRoundComplete = vi.fn();
    render(<SkyArcherApp onRoundComplete={onRoundComplete} />);

    // Round 1 target is 'SH', distractors include 'CH', 'TH', 'WH'
    const targetBtn = screen.getByTestId('balloon-SH');
    const distractorBtn = screen.getByTestId('balloon-CH');

    // Child shoots arrow at correct target balloon 'SH'
    fireEvent.click(targetBtn);
    expect(mockPlaySnap).toHaveBeenCalledTimes(1);

    // Child immediately tries clicking a distractor while arrow is flying or during transition
    fireEvent.click(distractorBtn);

    // Transition guard prevents distractor hit processing
    expect(mockPlayGentleOops).not.toHaveBeenCalled();

    // Advance timers for arrow impact (300ms) + round transition (1400ms)
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    // Successfully transitioned to Round 2 (target 'CH') without freezing!
    expect(screen.getByText('/ch/')).toBeInTheDocument();
  });

  it('P0-4: prevents duplicate scoring, stars, and combo from rapid clicks on the same balloon', () => {
    vi.useFakeTimers();
    const onRoundComplete = vi.fn();
    render(<SkyArcherApp onRoundComplete={onRoundComplete} />);

    const targetBtn = screen.getByTestId('balloon-SH');

    // Simulate 4 rapid clicks before React re-render or arrow impact
    fireEvent.click(targetBtn);
    fireEvent.click(targetBtn);
    fireEvent.click(targetBtn);
    fireEvent.click(targetBtn);

    // Synchronous ref tracking ensures arrow launch snap fires exactly once
    expect(mockPlaySnap).toHaveBeenCalledTimes(1);

    // Advance timer for arrow impact
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Pop SFX, letter note, and event fire exactly once
    expect(mockPlayPop).toHaveBeenCalledTimes(1);
    expect(mockPlayLetterNote).toHaveBeenCalledTimes(1);
    expect(onRoundComplete).toHaveBeenCalledTimes(1);
    expect(onRoundComplete).toHaveBeenCalledWith(
      expect.objectContaining({ score: 150, stars: 1, isCorrect: true })
    );
  });

  it('P0-3: stops after Level 25, shows Master Archer victory screen, fires onComplete, and resets on Play Again', () => {
    vi.useFakeTimers();
    const onRoundComplete = vi.fn();
    const onComplete = vi.fn();
    const onBack = vi.fn();

    // Mount child at Level 24 (index 23, PH /ph/)
    saveSkyArcherCheckpoint('test-p03', 23);

    render(
      <SkyArcherApp
        childId="test-p03"
        onRoundComplete={onRoundComplete}
        onComplete={onComplete}
        onBack={onBack}
      />
    );

    // Level 24: target 'PH' (/ph/)
    expect(screen.getByText('/ph/')).toBeInTheDocument();
    expect(screen.getByText(/Level 24 of 25/i)).toBeInTheDocument();
    const round24Btn = screen.getByTestId('balloon-PH');
    fireEvent.click(round24Btn);

    // Advance arrow flight & round advance
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    // Now at Level 25: target 'IGH' (/igh/)
    expect(screen.getByText('/igh/')).toBeInTheDocument();
    expect(screen.getByText(/Level 25 of 25/i)).toBeInTheDocument();
    const round25Btn = screen.getByTestId('balloon-IGH');
    fireEvent.click(round25Btn);

    // Advance past arrow flight (350ms)
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // onComplete callback must be invoked with final stats (roundsCompleted: 25)
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        roundsCompleted: 25,
      })
    );

    // Advance past victory transition timer (1200ms)
    act(() => {
      vi.advanceTimersByTime(1300);
    });

    // Master Archer victory panel is displayed
    const victoryPanel = screen.getByTestId('archer-victory-panel');
    expect(victoryPanel).toBeInTheDocument();
    expect(screen.getByText('Master Archer!')).toBeInTheDocument();
    expect(
      screen.getByText('Amazing work! You popped every magical phonics balloon!')
    ).toBeInTheDocument();
    expect(screen.getByTestId('victory-stars')).toBeInTheDocument();
    expect(screen.getByTestId('final-score')).toBeInTheDocument();

    // Verify progression halted — does NOT wrap to Round 1 ('SH')
    expect(screen.queryByText('/sh/')).not.toBeInTheDocument();

    // Test Back to Games button from victory modal
    const backToGamesBtn = screen.getByTestId('back-to-games-btn');
    fireEvent.click(backToGamesBtn);
    expect(onBack).toHaveBeenCalledTimes(1);

    // Test Play Again button
    const playAgainBtn = screen.getByTestId('play-again-btn');
    act(() => {
      fireEvent.click(playAgainBtn);
    });

    // Victory panel is closed and game resets to Round 1 ('/sh/')
    expect(screen.queryByTestId('archer-victory-panel')).not.toBeInTheDocument();
    expect(screen.getByText('/sh/')).toBeInTheDocument();
    expect(screen.getByText(/Level 1 of 25/i)).toBeInTheDocument();
    expect(screen.getByText('0 Stars')).toBeInTheDocument();
    expect(screen.getByText('SCORE: 0')).toBeInTheDocument();
  });

  it('P0-2: SkyArcherGame records attempts without premature session saving, and saves once on exit with isSavedRef', async () => {
    vi.useFakeTimers();
    await act(async () => {
      render(
        <MemoryRouter>
          <SkyArcherGame />
        </MemoryRouter>
      );
    });

    // Round 1 balloon 'SH'
    const targetBtn = screen.getByTestId('balloon-SH');
    await act(async () => {
      fireEvent.click(targetBtn);
    });

    // Advance arrow impact
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Correct hit must NOT prematurely trigger saveCompletedSession
    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Click "Back to Games" navigation button in page header
    const backBtn = screen.getByRole('button', { name: /back to games/i });
    await act(async () => {
      fireEvent.click(backBtn);
    });

    // Session is saved exactly once on exit
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);

    // Clicking again is guarded by isSavedRef
    await act(async () => {
      fireEvent.click(backBtn);
    });
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });
});

describe('Sky Archer Step 2: Animated Arrow Projectile and Balloon Burst', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('launches visible arrow projectile toward balloon on click and plays bowstring snap sound', () => {
    vi.useFakeTimers();
    render(<SkyArcherApp />);

    const targetBtn = screen.getByTestId('balloon-SH');

    // Click target balloon
    fireEvent.click(targetBtn);

    // Plays bowstring snap sound on launch
    expect(mockPlaySnap).toHaveBeenCalledTimes(1);

    // Active arrow element is visible in 3D world with correct target information
    const activeArrow = screen.getByTestId('mock-active-arrow');
    expect(activeArrow).toBeInTheDocument();
    expect(activeArrow.getAttribute('data-letter')).toBe('SH');
    expect(activeArrow.getAttribute('data-target')).toBe('true');

    // Target coordinates are offset to center of the balloon (Y = +1.2)
    const pos = JSON.parse(activeArrow.getAttribute('data-pos'));
    expect(pos).toEqual([0, 1.2, 0]);
  });

  it('prevents launching duplicate arrows or hits while an arrow is in flight', () => {
    vi.useFakeTimers();
    render(<SkyArcherApp />);

    const targetBtn = screen.getByTestId('balloon-SH');

    // Launch arrow
    fireEvent.click(targetBtn);
    expect(mockPlaySnap).toHaveBeenCalledTimes(1);

    // Rapidly click same balloon again while arrow is in flight
    fireEvent.click(targetBtn);
    fireEvent.click(targetBtn);

    // Still only 1 arrow launched
    expect(mockPlaySnap).toHaveBeenCalledTimes(1);
    expect(screen.getAllByTestId('mock-active-arrow')).toHaveLength(1);
  });

  it('triggers balloon burst with pop SFX, letter chime, and sparkles upon arrow impact', () => {
    vi.useFakeTimers();
    const onRoundComplete = vi.fn();
    render(<SkyArcherApp onRoundComplete={onRoundComplete} />);

    const targetBtn = screen.getByTestId('balloon-SH');
    fireEvent.click(targetBtn);

    // Pop and letter note have not fired yet during flight
    expect(mockPlayPop).not.toHaveBeenCalled();
    expect(mockPlayLetterNote).not.toHaveBeenCalled();

    // Advance timer past arrow duration to trigger arrival impact
    act(() => {
      vi.advanceTimersByTime(320);
    });

    // Arrow is cleared after impact
    expect(screen.queryByTestId('mock-active-arrow')).not.toBeInTheDocument();

    // Balloon pop sound and chime fired
    expect(mockPlayPop).toHaveBeenCalledTimes(1);
    expect(mockPlayLetterNote).toHaveBeenCalledTimes(1);
    expect(mockPlaySparkle).toHaveBeenCalledTimes(1);

    // Balloon state updated to popped
    expect(targetBtn.getAttribute('data-popped')).toBe('true');

    // Score and HUD updated
    expect(screen.getByText(/SCORE:\s*150/i)).toBeInTheDocument();
  });

  it('handles distractor arrow flight with gentle oops and no round progression', () => {
    vi.useFakeTimers();
    const onRoundComplete = vi.fn();
    render(<SkyArcherApp onRoundComplete={onRoundComplete} />);

    const distractorBtn = screen.getByTestId('balloon-CH');
    fireEvent.click(distractorBtn);

    expect(mockPlaySnap).toHaveBeenCalledTimes(1);
    const arrow = screen.getByTestId('mock-active-arrow');
    expect(arrow.getAttribute('data-letter')).toBe('CH');
    expect(arrow.getAttribute('data-target')).toBe('false');

    // Advance to impact
    act(() => {
      vi.advanceTimersByTime(320);
    });

    // Oops sound played for distractor
    expect(mockPlayGentleOops).toHaveBeenCalledTimes(1);
    expect(onRoundComplete).toHaveBeenCalledWith(
      expect.objectContaining({ isCorrect: false, letter: 'CH' })
    );

    // Round has NOT changed
    expect(screen.getByText('/sh/')).toBeInTheDocument();
  });

  it('ArrowProjectile computes ballistic parabolic arc and forward look-at vector along trajectory', () => {
    const start = [0, -1.5, 4.5];
    const target = [2, 1, -5.5];

    // At launch (progress 0)
    const posStart = calculateArrowPosition(start, target, 0);
    expect(posStart[0]).toBeCloseTo(0, 4);
    expect(posStart[1]).toBeCloseTo(-1.5, 4);
    expect(posStart[2]).toBeCloseTo(4.5, 4);

    // At midpoint (progress 0.5): Y is boosted by parabolic arc (0.45)
    const posMid = calculateArrowPosition(start, target, 0.5);
    expect(posMid[0]).toBeCloseTo(1.0, 4);
    expect(posMid[1]).toBeGreaterThan(-0.25);
    expect(posMid[2]).toBeCloseTo(-0.5, 4);

    // At impact (progress 1.0): exact target reached
    const posEnd = calculateArrowPosition(start, target, 1.0);
    expect(posEnd[0]).toBeCloseTo(2.0, 4);
    expect(posEnd[1]).toBeCloseTo(1.0, 4);
    expect(posEnd[2]).toBeCloseTo(-5.5, 4);

    // Tangent look-at points ahead of the arrow
    const lookAtMid = calculateArrowLookAt(start, target, 0.5);
    expect(lookAtMid[2]).toBeLessThan(posMid[2]);
  });
});

describe('Sky Archer Step 3: Child-Specific Checkpoint and Resume', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a new child at Round 1 (index 0) when no checkpoint exists', () => {
    render(<SkyArcherApp childId="brand-new-archer" />);

    // Starts on Round 1: SH (/sh/)
    expect(screen.getByText('/sh/')).toBeInTheDocument();
    expect(loadSkyArcherCheckpoint('brand-new-archer')).toBe(0);
  });

  it('resumes from saved round for a returning child without duplicating score or stars', () => {
    // Save checkpoint at Round 4 (index 3: WH)
    saveSkyArcherCheckpoint('archer-tim', 3);
    expect(loadSkyArcherCheckpoint('archer-tim')).toBe(3);

    render(<SkyArcherApp childId="archer-tim" />);

    // Resumes directly at Round 4: WH (/wh/)
    expect(screen.getByText('/wh/')).toBeInTheDocument();

    // Session score and stars start clean for new play session
    expect(screen.getByText(/SCORE:\s*0/i)).toBeInTheDocument();
    expect(screen.getByText('0 Stars')).toBeInTheDocument();
  });

  it('saves progress to next round upon successful hit and resumes after remount', () => {
    vi.useFakeTimers();
    const childId = 'archer-sam';

    const { unmount } = render(<SkyArcherApp childId={childId} />);

    // Initially at Round 1: SH
    expect(screen.getByText('/sh/')).toBeInTheDocument();
    expect(loadSkyArcherCheckpoint(childId)).toBe(0);

    // Shoot correct target balloon 'SH'
    const targetBtn = screen.getByTestId('balloon-SH');
    fireEvent.click(targetBtn);

    // Advance arrow flight & impact
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Checkpoint must be saved as index 1 (Round 2: CH)
    expect(loadSkyArcherCheckpoint(childId)).toBe(1);

    // Simulate leaving / refreshing by unmounting and remounting
    unmount();

    render(<SkyArcherApp childId={childId} />);

    // Resumes at saved round: Round 2 (CH, /ch/)
    expect(screen.getByText('/ch/')).toBeInTheDocument();
  });

  it('isolates checkpoints across separate child profiles and guest mode', () => {
    // Distinct checkpoints for separate profiles
    saveSkyArcherCheckpoint('child-alpha', 2); // Level 3: TH (/th/)
    saveSkyArcherCheckpoint('child-beta', 7);  // Level 8: TR (/tr/)
    saveSkyArcherCheckpoint(null, 1);          // Guest: Level 2: CH (/ch/)

    const { unmount: unmountA } = render(<SkyArcherApp childId="child-alpha" />);
    expect(screen.getByText('/th/')).toBeInTheDocument();
    unmountA();

    const { unmount: unmountB } = render(<SkyArcherApp childId="child-beta" />);
    expect(screen.getByText('/tr/')).toBeInTheDocument();
    unmountB();

    render(<SkyArcherApp childId={null} />);
    expect(screen.getByText('/ch/')).toBeInTheDocument();
  });

  it('handles corrupted, negative, and out-of-range checkpoint values safely', () => {
    const childId = 'corrupt-tester';

    // Direct string integer "5"
    localStorage.setItem(getSkyArcherCheckpointKey(childId), '5');
    expect(loadSkyArcherCheckpoint(childId)).toBe(5);

    // Object format { roundIndex: 7 }
    localStorage.setItem(getSkyArcherCheckpointKey(childId), JSON.stringify({ roundIndex: 7 }));
    expect(loadSkyArcherCheckpoint(childId)).toBe(7);

    // Object format with savedRoundIndex
    localStorage.setItem(getSkyArcherCheckpointKey(childId), JSON.stringify({ savedRoundIndex: 4 }));
    expect(loadSkyArcherCheckpoint(childId)).toBe(4);

    // Object format with currentRound: 4 (1-based -> 3 0-based)
    localStorage.setItem(getSkyArcherCheckpointKey(childId), JSON.stringify({ currentRound: 4 }));
    expect(loadSkyArcherCheckpoint(childId)).toBe(3);

    // Corrupted JSON -> defaults safely to 0
    localStorage.setItem(getSkyArcherCheckpointKey(childId), '{corrupt-json{{');
    expect(loadSkyArcherCheckpoint(childId)).toBe(0);

    // Negative value -> defaults safely to 0
    localStorage.setItem(getSkyArcherCheckpointKey(childId), '-5');
    expect(loadSkyArcherCheckpoint(childId)).toBe(0);

    // Out-of-range value >= 10 -> defaults safely to 0
    localStorage.setItem(getSkyArcherCheckpointKey(childId), '999');
    expect(loadSkyArcherCheckpoint(childId)).toBe(0);

    // Level 10 completion clamped at index 9 without wrapping
    saveSkyArcherCheckpoint(childId, 9);
    expect(loadSkyArcherCheckpoint(childId)).toBe(9);
  });

  it('resets checkpoint back to Round 1 when Play Again is clicked', () => {
    vi.useFakeTimers();
    const childId = 'player-replay';

    // Child is at Level 25 (index 24)
    saveSkyArcherCheckpoint(childId, 24);
    expect(loadSkyArcherCheckpoint(childId)).toBe(24);

    render(<SkyArcherApp childId={childId} />);
    expect(screen.getByText('/igh/')).toBeInTheDocument();

    // Complete Level 25
    const round25Btn = screen.getByTestId('balloon-IGH');
    fireEvent.click(round25Btn);

    // Advance arrow impact & victory screen delay
    act(() => {
      vi.advanceTimersByTime(350);
      vi.advanceTimersByTime(1300);
    });

    // Victory panel visible
    expect(screen.getByTestId('archer-victory-panel')).toBeInTheDocument();

    // Click Play Again
    const playAgainBtn = screen.getByTestId('play-again-btn');
    act(() => {
      fireEvent.click(playAgainBtn);
    });

    // Checkpoint must be reset to 0 (Level 1)
    expect(loadSkyArcherCheckpoint(childId)).toBe(0);
    expect(screen.getByText('/sh/')).toBeInTheDocument();
  });

  it('SkyArcherGame page wrapper passes activeChild.id to checkpoint persistence', () => {
    // activeChild.id is 1 in mock AppContext
    saveSkyArcherCheckpoint(1, 5); // Level 6: ST (/st/)

    render(
      <MemoryRouter>
        <SkyArcherGame />
      </MemoryRouter>
    );

    // Resumes at Level 6: ST (/st/) for child 1
    expect(screen.getByText('/st/')).toBeInTheDocument();
  });
});

describe('Sky Archer 25-Level Phonics Curriculum (Step 4 Stage 1)', () => {
  it('exports curriculum constants correctly', () => {
    expect(TOTAL_SKY_ARCHER_ROUNDS).toBe(25);
    expect(TOTAL_SKY_ARCHER_STATIONS).toBe(5);
    expect(ROUNDS_PER_STATION).toBe(5);
    expect(PHONICS_TARGETS_25).toHaveLength(25);
    expect(SKY_ARCHER_CURRICULUM).toBe(PHONICS_TARGETS_25);
    expect(SKY_ARCHER_STATIONS).toHaveLength(5);
  });

  it('organizes targets across 5 stations with 5 levels each', () => {
    SKY_ARCHER_STATIONS.forEach((station, idx) => {
      expect(station.station).toBe(idx + 1);
      expect(station.title).toBeTruthy();
      expect(station.shortTitle).toBeTruthy();
      expect(station.roundRange).toEqual([idx * 5 + 1, (idx + 1) * 5]);
      expect(station.badge).toBeTruthy();
      expect(station.themeColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    for (let stationNum = 1; stationNum <= 5; stationNum++) {
      const stationTargets = PHONICS_TARGETS_25.filter((t) => t.station === stationNum);
      expect(stationTargets).toHaveLength(5);
      stationTargets.forEach((target, indexInStation) => {
        expect(target.level).toBe((stationNum - 1) * 5 + indexInStation + 1);
        expect(target.stationTitle).toBeTruthy();
      });
    }
  });

  it('guarantees unique IDs across all 25 phonics targets', () => {
    const ids = PHONICS_TARGETS_25.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(25);
  });

  it('validates every target has all required fields and exactly 4 distinct options including correct answer', () => {
    PHONICS_TARGETS_25.forEach((target, index) => {
      expect(target.id).toBeTruthy();
      expect(target.level).toBe(index + 1);
      expect(target.station).toBeGreaterThanOrEqual(1);
      expect(target.station).toBeLessThanOrEqual(5);
      expect(target.sound).toBeTruthy();
      expect(target.correct).toBeTruthy();
      expect(target.options).toHaveLength(4);

      // Exactly 4 distinct options
      const uniqueOptions = new Set(target.options);
      expect(uniqueOptions.size).toBe(4);

      // Must include correct answer
      expect(target.options).toContain(target.correct);

      // Child-friendly metadata
      expect(target.prompt).toBeTruthy();
      expect(target.wordHint).toBeTruthy();
      expect(target.emoji).toBeTruthy();
      expect(target.speechText).toBeTruthy();
    });
  });

  it('preserves the original 10 targets in PHONICS_TARGETS for backward compatibility', () => {
    expect(PHONICS_TARGETS).toHaveLength(10);
    const expectedSounds = [
      '/sh/', '/ch/', '/th/', '/wh/',
      '/st/', '/bl/', '/tr/', '/fl/',
      '/ee/', '/oo/'
    ];
    PHONICS_TARGETS.forEach((target, idx) => {
      expect(target.sound).toBe(expectedSounds[idx]);
    });
  });

  it('provides getPhonicsCurriculumRound helper that generates valid shuffled rounds for any index 0-24', () => {
    for (let i = 0; i < 25; i++) {
      const round = getPhonicsCurriculumRound(i);
      expect(round.level).toBe(i + 1);
      expect(round.shuffledOptions).toHaveLength(4);
      expect(round.shuffledOptions).toContain(round.correct);
      // All shuffled options should match target options
      expect(new Set(round.shuffledOptions)).toEqual(new Set(round.options));
    }
  });
});

describe('Sky Archer 25-Level Checkpoint Engine (Step 4 Stage 2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to 25-round maximum bounds matching TOTAL_SKY_ARCHER_ROUNDS', () => {
    expect(DEFAULT_MAX_ROUNDS).toBe(25);
    expect(DEFAULT_MAX_ROUNDS).toBe(TOTAL_SKY_ARCHER_ROUNDS);

    const data = loadSkyArcherCheckpointData('test-bounds-child');
    expect(data.roundIndex).toBe(0);
    expect(data.currentRound).toBe(1);
    expect(data.highestUnlockedRound).toBe(1);

    // Index 24 (Level 25) is valid within default 25 bounds
    localStorage.setItem(getSkyArcherCheckpointKey('test-bounds-child'), '24');
    expect(loadSkyArcherCheckpoint('test-bounds-child')).toBe(24);

    // Index 25 (Level 26) is out of bounds and falls back to Round 1 (index 0)
    localStorage.setItem(getSkyArcherCheckpointKey('test-bounds-child'), '25');
    expect(loadSkyArcherCheckpoint('test-bounds-child')).toBe(0);
  });

  it('correctly saves and loads milestone indices 0, 9, 10, and 24', () => {
    // Round 1 (index 0)
    saveSkyArcherCheckpoint('milestone-0', 0);
    const m0 = loadSkyArcherCheckpointData('milestone-0');
    expect(m0.roundIndex).toBe(0);
    expect(m0.currentRound).toBe(1);
    expect(m0.highestUnlockedRound).toBe(1);

    // Round 10 (index 9) - previous cap milestone
    saveSkyArcherCheckpoint('milestone-9', 9);
    const m9 = loadSkyArcherCheckpointData('milestone-9');
    expect(m9.roundIndex).toBe(9);
    expect(m9.currentRound).toBe(10);
    expect(m9.highestUnlockedRound).toBe(10);

    // Round 11 (index 10) - first level of new Station 3 expansion
    saveSkyArcherCheckpoint('milestone-10', 10);
    const m10 = loadSkyArcherCheckpointData('milestone-10');
    expect(m10.roundIndex).toBe(10);
    expect(m10.currentRound).toBe(11);
    expect(m10.highestUnlockedRound).toBe(11);

    // Round 25 (index 24) - final curriculum level
    saveSkyArcherCheckpoint('milestone-24', 24);
    const m24 = loadSkyArcherCheckpointData('milestone-24');
    expect(m24.roundIndex).toBe(24);
    expect(m24.currentRound).toBe(25);
    expect(m24.highestUnlockedRound).toBe(25);
  });

  it('preserves existing valid saves from the original 10-level version without data loss', () => {
    const childId = 'legacy-player';

    // Direct string integer "7" (Round 8)
    localStorage.setItem(getSkyArcherCheckpointKey(childId), '7');
    expect(loadSkyArcherCheckpoint(childId)).toBe(7);

    // Legacy JSON object with roundIndex: 8 (Round 9)
    localStorage.setItem(
      getSkyArcherCheckpointKey(childId),
      JSON.stringify({ roundIndex: 8, highestUnlockedIndex: 8 })
    );
    const legacyObj = loadSkyArcherCheckpointData(childId);
    expect(legacyObj.roundIndex).toBe(8);
    expect(legacyObj.currentRound).toBe(9);
    expect(legacyObj.highestUnlockedRound).toBe(9);

    // Legacy JSON object with savedRoundIndex: 5 (Round 6)
    localStorage.setItem(
      getSkyArcherCheckpointKey(childId),
      JSON.stringify({ savedRoundIndex: 5 })
    );
    expect(loadSkyArcherCheckpoint(childId)).toBe(5);

    // Legacy JSON object with 1-based currentRound: 4 (Round 4 -> index 3)
    localStorage.setItem(
      getSkyArcherCheckpointKey(childId),
      JSON.stringify({ currentRound: 4 })
    );
    expect(loadSkyArcherCheckpoint(childId)).toBe(3);
  });

  it('handles invalid, negative, non-integer, and out-of-range indices safely', () => {
    const childId = 'invalid-tester';

    // Existing valid checkpoint at index 5
    saveSkyArcherCheckpoint(childId, 5);
    expect(loadSkyArcherCheckpoint(childId)).toBe(5);

    // Invalid inputs to saveSkyArcherCheckpoint must NOT overwrite valid checkpoint
    saveSkyArcherCheckpoint(childId, -1);
    expect(loadSkyArcherCheckpoint(childId)).toBe(5);

    saveSkyArcherCheckpoint(childId, -10);
    expect(loadSkyArcherCheckpoint(childId)).toBe(5);

    saveSkyArcherCheckpoint(childId, 3.14);
    expect(loadSkyArcherCheckpoint(childId)).toBe(5);

    saveSkyArcherCheckpoint(childId, 'not-a-number');
    expect(loadSkyArcherCheckpoint(childId)).toBe(5);

    saveSkyArcherCheckpoint(childId, null);
    expect(loadSkyArcherCheckpoint(childId)).toBe(5);

    saveSkyArcherCheckpoint(childId, undefined);
    expect(loadSkyArcherCheckpoint(childId)).toBe(5);

    saveSkyArcherCheckpoint(childId, '');
    expect(loadSkyArcherCheckpoint(childId)).toBe(5);

    // Out-of-range values in storage fall back safely to 0 (Round 1)
    localStorage.setItem(getSkyArcherCheckpointKey(childId), '-5');
    expect(loadSkyArcherCheckpoint(childId)).toBe(0);

    localStorage.setItem(getSkyArcherCheckpointKey(childId), '25');
    expect(loadSkyArcherCheckpoint(childId)).toBe(0);

    localStorage.setItem(getSkyArcherCheckpointKey(childId), '100');
    expect(loadSkyArcherCheckpoint(childId)).toBe(0);

    localStorage.setItem(getSkyArcherCheckpointKey(childId), '4.8');
    expect(loadSkyArcherCheckpoint(childId)).toBe(0);
  });

  it('handles corrupted, unparseable, or missing saved data with safe Round 1 fallback', () => {
    // Missing key
    expect(loadSkyArcherCheckpoint('non-existent-child')).toBe(0);
    expect(loadSkyArcherCheckpointData('non-existent-child')).toEqual({
      roundIndex: 0,
      savedRoundIndex: 0,
      currentRound: 1,
      highestUnlockedRound: 1,
      highestUnlockedIndex: 0,
    });

    // Malformed JSON string
    localStorage.setItem(getSkyArcherCheckpointKey('corrupt-child'), '{broken-json:');
    expect(loadSkyArcherCheckpoint('corrupt-child')).toBe(0);
    expect(loadSkyArcherCheckpointData('corrupt-child').currentRound).toBe(1);

    // Object with NaN or null index
    localStorage.setItem(
      getSkyArcherCheckpointKey('corrupt-child-2'),
      JSON.stringify({ roundIndex: 'invalid' })
    );
    expect(loadSkyArcherCheckpoint('corrupt-child-2')).toBe(0);
  });

  it('maintains strict child-specific checkpoint isolation across profiles', () => {
    saveSkyArcherCheckpoint('child-station1', 3);  // Level 4
    saveSkyArcherCheckpoint('child-station3', 12); // Level 13
    saveSkyArcherCheckpoint('child-station5', 23); // Level 24
    saveSkyArcherCheckpoint(null, 1);              // Guest at Level 2

    expect(loadSkyArcherCheckpoint('child-station1')).toBe(3);
    expect(loadSkyArcherCheckpoint('child-station3')).toBe(12);
    expect(loadSkyArcherCheckpoint('child-station5')).toBe(23);
    expect(loadSkyArcherCheckpoint('guest')).toBe(1);
    expect(loadSkyArcherCheckpoint(null)).toBe(1);

    // Modifying one child does not impact others
    saveSkyArcherCheckpoint('child-station1', 4);
    expect(loadSkyArcherCheckpoint('child-station1')).toBe(4);
    expect(loadSkyArcherCheckpoint('child-station3')).toBe(12);
    expect(loadSkyArcherCheckpoint('child-station5')).toBe(23);
  });

  it('resets a child checkpoint back to Round 1 without disturbing other children', () => {
    saveSkyArcherCheckpoint('reset-target', 20); // Level 21
    saveSkyArcherCheckpoint('reset-innocent', 15); // Level 16

    expect(loadSkyArcherCheckpoint('reset-target')).toBe(20);
    expect(loadSkyArcherCheckpoint('reset-innocent')).toBe(15);

    resetSkyArcherCheckpoint('reset-target');

    expect(loadSkyArcherCheckpoint('reset-target')).toBe(0);
    const targetData = loadSkyArcherCheckpointData('reset-target');
    expect(targetData.currentRound).toBe(1);
    expect(targetData.highestUnlockedRound).toBe(1);

    // Other child remains at Level 16
    expect(loadSkyArcherCheckpoint('reset-innocent')).toBe(15);
  });

  it('safely bounds completion at Level 25 and prevents advancing to Level 26', () => {
    const childId = 'champion-archer';

    // Completing Level 25 (saving index 24)
    saveSkyArcherCheckpoint(childId, 24);
    expect(loadSkyArcherCheckpoint(childId)).toBe(24);

    // Attempting to advance beyond Level 25 (e.g. index 25, 26, 99) clamps safely to index 24 (Level 25)
    saveSkyArcherCheckpoint(childId, 25);
    const data25 = loadSkyArcherCheckpointData(childId);
    expect(data25.roundIndex).toBe(24);
    expect(data25.currentRound).toBe(25);
    expect(data25.highestUnlockedRound).toBe(25);

    saveSkyArcherCheckpoint(childId, 99);
    const data99 = loadSkyArcherCheckpointData(childId);
    expect(data99.roundIndex).toBe(24);
    expect(data99.currentRound).toBe(25);
  });
});

describe('Sky Archer 25-Level Curriculum Gameplay Integration (Step 4 Stage 3)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders representative levels (1, 10, 11, 20, 21, 25) with correct target sound, 4 options, and HUD indicators', () => {
    const representativeMilestones = [
      { index: 0, level: 1, sound: '/sh/', correct: 'SH', station: 1, stationTitle: 'Simple Early Phonics Sounds' },
      { index: 9, level: 10, sound: '/gr/', correct: 'GR', station: 2, stationTitle: 'Common Consonant Blends' },
      { index: 10, level: 11, sound: '/ee/', correct: 'EE', station: 3, stationTitle: 'Digraphs & Vowel Patterns' },
      { index: 19, level: 20, sound: '/oi/', correct: 'OI', station: 4, stationTitle: 'Complex Sound Combinations' },
      { index: 20, level: 21, sound: '/or/', correct: 'OR', station: 5, stationTitle: 'Mixed Review & Advanced Phonics' },
      { index: 24, level: 25, sound: '/igh/', correct: 'IGH', station: 5, stationTitle: 'Mixed Review & Advanced Phonics' },
    ];

    representativeMilestones.forEach(({ index, level, sound, correct, station, stationTitle }) => {
      saveSkyArcherCheckpoint(`rep-child-${level}`, index);
      const { unmount } = render(<SkyArcherApp childId={`rep-child-${level}`} />);

      // Sound and correct balloon option present
      expect(screen.getByText(sound)).toBeInTheDocument();
      expect(screen.getByTestId(`balloon-${correct}`)).toBeInTheDocument();

      // HUD indicators
      expect(screen.getByText(`Level ${level} of 25`)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`STATION ${station}:`, 'i'))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(stationTitle, 'i'))).toBeInTheDocument();

      // Exactly 4 options rendered
      const balloons = screen.getAllByRole('button').filter((b) => b.getAttribute('data-testid')?.startsWith('balloon-'));
      expect(balloons).toHaveLength(4);

      unmount();
    });
  });

  it('advances seamlessly across station boundaries (Station 1->2 at level 5->6, Station 2->3 at level 10->11)', () => {
    vi.useFakeTimers();
    const childId = 'station-crosser';

    // Start at Level 5 (index 4, Station 1: CK /ck/)
    saveSkyArcherCheckpoint(childId, 4);
    const { unmount } = render(<SkyArcherApp childId={childId} />);

    expect(screen.getByText('/ck/')).toBeInTheDocument();
    expect(screen.getByText(/Level 5 of 25/i)).toBeInTheDocument();
    expect(screen.getByText(/STATION 1:/i)).toBeInTheDocument();

    // Hit Level 5 correct balloon (CK)
    fireEvent.click(screen.getByTestId('balloon-CK'));
    act(() => {
      vi.advanceTimersByTime(350); // Arrow flight
      vi.advanceTimersByTime(1400); // Transition
    });

    // Successfully transitioned to Station 2 (Level 6: ST /st/)
    expect(screen.getByText('/st/')).toBeInTheDocument();
    expect(screen.getByText(/Level 6 of 25/i)).toBeInTheDocument();
    expect(screen.getByText(/STATION 2:/i)).toBeInTheDocument();
    expect(loadSkyArcherCheckpoint(childId)).toBe(5);

    unmount();

    // Test Station 2 to 3 transition: Level 10 (index 9, GR /gr/)
    saveSkyArcherCheckpoint(childId, 9);
    render(<SkyArcherApp childId={childId} />);

    expect(screen.getByText('/gr/')).toBeInTheDocument();
    expect(screen.getByText(/Level 10 of 25/i)).toBeInTheDocument();
    expect(screen.getByText(/STATION 2:/i)).toBeInTheDocument();

    // Hit Level 10 correct balloon (GR)
    fireEvent.click(screen.getByTestId('balloon-GR'));
    act(() => {
      vi.advanceTimersByTime(350);
      vi.advanceTimersByTime(1400);
    });

    // Successfully transitioned to Station 3 (Level 11: EE /ee/)
    expect(screen.getByText('/ee/')).toBeInTheDocument();
    expect(screen.getByText(/Level 11 of 25/i)).toBeInTheDocument();
    expect(screen.getByText(/STATION 3:/i)).toBeInTheDocument();
    expect(loadSkyArcherCheckpoint(childId)).toBe(10);
  });

  it('does NOT trigger victory screen at Level 10 or Level 20; advances to next level instead', () => {
    vi.useFakeTimers();
    const childId = 'no-early-victory-child';

    // Complete Level 10 (GR)
    saveSkyArcherCheckpoint(childId, 9);
    const { unmount } = render(<SkyArcherApp childId={childId} />);
    fireEvent.click(screen.getByTestId('balloon-GR'));

    act(() => {
      vi.advanceTimersByTime(350);
      vi.advanceTimersByTime(1400);
    });

    // No victory panel at Level 10
    expect(screen.queryByTestId('archer-victory-panel')).not.toBeInTheDocument();
    expect(screen.getByText('/ee/')).toBeInTheDocument(); // Level 11
    unmount();

    // Complete Level 20 (OI)
    saveSkyArcherCheckpoint(childId, 19);
    render(<SkyArcherApp childId={childId} />);
    fireEvent.click(screen.getByTestId('balloon-OI'));

    act(() => {
      vi.advanceTimersByTime(350);
      vi.advanceTimersByTime(1400);
    });

    // No victory panel at Level 20
    expect(screen.queryByTestId('archer-victory-panel')).not.toBeInTheDocument();
    expect(screen.getByText('/or/')).toBeInTheDocument(); // Level 21
  });

  it('triggers Master Archer victory ONLY after completing Level 25, calling onComplete and clamping at Level 25', () => {
    vi.useFakeTimers();
    const childId = 'victorious-child';
    const onComplete = vi.fn();

    saveSkyArcherCheckpoint(childId, 24); // Level 25
    render(<SkyArcherApp childId={childId} onComplete={onComplete} />);

    expect(screen.getByText('/igh/')).toBeInTheDocument();
    expect(screen.getByText(/Level 25 of 25/i)).toBeInTheDocument();

    // Pop final balloon (IGH)
    fireEvent.click(screen.getByTestId('balloon-IGH'));

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        roundsCompleted: 25,
      })
    );

    act(() => {
      vi.advanceTimersByTime(1300);
    });

    // Victory panel appears
    expect(screen.getByTestId('archer-victory-panel')).toBeInTheDocument();
    expect(screen.getByText('Master Archer!')).toBeInTheDocument();

    // Checkpoint clamped at Level 25 (index 24) without advancing to 25 or 26
    expect(loadSkyArcherCheckpoint(childId)).toBe(24);
  });

  it('correctly resumes gameplay from saved checkpoint indices 0, 9, 10, and 24', () => {
    const resumeCases = [
      { id: 'resume-0', index: 0, expectedSound: '/sh/', expectedLevel: 'Level 1 of 25' },
      { id: 'resume-9', index: 9, expectedSound: '/gr/', expectedLevel: 'Level 10 of 25' },
      { id: 'resume-10', index: 10, expectedSound: '/ee/', expectedLevel: 'Level 11 of 25' },
      { id: 'resume-24', index: 24, expectedSound: '/igh/', expectedLevel: 'Level 25 of 25' },
    ];

    resumeCases.forEach(({ id, index, expectedSound, expectedLevel }) => {
      saveSkyArcherCheckpoint(id, index);
      const { unmount } = render(<SkyArcherApp childId={id} />);

      expect(screen.getByText(expectedSound)).toBeInTheDocument();
      expect(screen.getByText(expectedLevel)).toBeInTheDocument();

      unmount();
    });
  });

  it('Play Again resets only the active child checkpoint and restarts at Level 1', () => {
    vi.useFakeTimers();
    const childId = 'replay-target';
    const innocentChild = 'innocent-other';

    saveSkyArcherCheckpoint(childId, 24);
    saveSkyArcherCheckpoint(innocentChild, 18);

    render(<SkyArcherApp childId={childId} />);
    fireEvent.click(screen.getByTestId('balloon-IGH'));

    act(() => {
      vi.advanceTimersByTime(350);
      vi.advanceTimersByTime(1300);
    });

    const playAgainBtn = screen.getByTestId('play-again-btn');
    act(() => {
      fireEvent.click(playAgainBtn);
    });

    // Active child reset
    expect(loadSkyArcherCheckpoint(childId)).toBe(0);
    expect(screen.getByText('/sh/')).toBeInTheDocument();
    expect(screen.getByText(/Level 1 of 25/i)).toBeInTheDocument();

    // Other child unchanged
    expect(loadSkyArcherCheckpoint(innocentChild)).toBe(18);
  });

  it('prevents rapid clicks from creating multiple arrows or skipping levels during 25-level gameplay', () => {
    vi.useFakeTimers();
    render(<SkyArcherApp />);

    const targetBtn = screen.getByTestId('balloon-SH');

    // Rapid double-click
    fireEvent.click(targetBtn);
    fireEvent.click(targetBtn);

    // Only 1 arrow projectile
    expect(mockPlaySnap).toHaveBeenCalledTimes(1);
    expect(screen.getAllByTestId('mock-active-arrow')).toHaveLength(1);

    // Impact
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Try clicking other balloons during transition window
    const otherBtn = screen.getByTestId('balloon-CH');
    fireEvent.click(otherBtn);

    // Transition guard prevents any extra shots
    expect(mockPlaySnap).toHaveBeenCalledTimes(1);
  });
});

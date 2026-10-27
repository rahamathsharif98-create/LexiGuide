import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, renderHook, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { DINO_TARGETS, getDinoTarget } from '../games/dino-fossil/engine/dinoTargets';
import { TARGET_MEANINGS } from '../games/dino-fossil/hud/DinoHUD';
import { getGameById } from '../data/gamingZoneRegistry';
import DinoApp, { getDinoCheckpointKey, loadDinoCheckpoint, saveDinoCheckpoint } from '../games/dino-fossil/DinoApp';
import DinoFossilGame from '../pages/child/DinoFossilGame';
import { useGameSessionTracker } from '../hooks/useGameSessionTracker';

// ────────────────────────────────────────────────
// Mocks for 3D canvas and audio in JSDOM environment
// ────────────────────────────────────────────────
vi.mock('../games/dino-fossil/DinoWorld', () => ({
  default: ({ target, slabs, onBrushSlab, mascotState }) => (
    <div data-testid="mock-dino-world" data-mascot-state={mascotState} data-target={target?.id}>
      {slabs.map((s) => (
        <button
          key={s.id}
          data-testid={`slab-${s.chunk}`}
          onClick={() => onBrushSlab(s)}
        >
          {s.chunk}
        </button>
      ))}
    </div>
  ),
}));

const mockPlayBrush = vi.fn();
const mockPlayLetterNote = vi.fn();
const mockPlayFanfare = vi.fn();
const mockPlayRoar = vi.fn();
const mockSpeakCompanion = vi.fn();
const mockPlayGentleOops = vi.fn();

vi.mock('../services/gameSoundService', () => ({
  gameSound: {
    playBrush: (...args) => mockPlayBrush(...args),
    playLetterNote: (...args) => mockPlayLetterNote(...args),
    playFanfare: (...args) => mockPlayFanfare(...args),
    playRoar: (...args) => mockPlayRoar(...args),
    speakCompanion: (...args) => mockSpeakCompanion(...args),
    playGentleOops: (...args) => mockPlayGentleOops(...args),
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
    activeChild: { id: 1, name: 'Dino Explorer' },
    isRealBackend: true,
    saveLearningSession: mockSaveLearningSession,
    applySessionOutcome: vi.fn(),
    showToast: mockShowToast,
  }),
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('Dino Fossil Excavator 3D (Phonics Dig Site)', () => {
  it('loads exactly 10 valid onset-rime fossil targets with distractors and clues', () => {
    expect(DINO_TARGETS.length).toBe(10);
    const targetIds = new Set();
    const targetNames = new Set();

    DINO_TARGETS.forEach((target) => {
      expect(target.id).toBeDefined();
      expect(target.name).toBeDefined();
      expect(target.emoji).toBeDefined();
      expect(target.onset).toBeDefined();
      expect(target.rime).toBeDefined();
      expect(target.distractors.length).toBeGreaterThanOrEqual(2);
      expect(target.prompt).toBeDefined();
      expect(target.speechText).toBeDefined();

      // Ensure IDs and Names are unique
      expect(targetIds.has(target.id)).toBe(false);
      expect(targetNames.has(target.name)).toBe(false);
      targetIds.add(target.id);
      targetNames.add(target.name);

      // Verify onset + rime matches name (or T + REX for T-REX)
      if (target.name === 'T-REX') {
        expect(`${target.onset}-${target.rime}`).toBe(target.name);
      } else {
        expect(`${target.onset}${target.rime}`).toBe(target.name);
      }

      // Verify every target has an associated visual meaning in TARGET_MEANINGS
      const meaning = TARGET_MEANINGS[target.id];
      expect(meaning).toBeDefined();
      expect(meaning.title).toBe(target.name);
      expect(meaning.badge).toBeDefined();
      expect(meaning.icon).toBeDefined();
      expect(meaning.description).toBeDefined();
    });
  });

  it('progresses through all 10 levels and cycles predictably without crashing on index overflow', () => {
    const expectedLevels = [
      { index: 0, name: 'T-REX', onset: 'T', rime: 'REX' },
      { index: 1, name: 'BONE', onset: 'B', rime: 'ONE' },
      { index: 2, name: 'ROAR', onset: 'R', rime: 'OAR' },
      { index: 3, name: 'CLAW', onset: 'CL', rime: 'AW' },
      { index: 4, name: 'TAIL', onset: 'T', rime: 'AIL' },
      { index: 5, name: 'FANG', onset: 'F', rime: 'ANG' },
      { index: 6, name: 'HORN', onset: 'H', rime: 'ORN' },
      { index: 7, name: 'SPINE', onset: 'SP', rime: 'INE' },
      { index: 8, name: 'TRACK', onset: 'TR', rime: 'ACK' },
      { index: 9, name: 'SKULL', onset: 'SK', rime: 'ULL' },
    ];

    expectedLevels.forEach(({ index, name, onset, rime }) => {
      const target = getDinoTarget(index);
      expect(target.name).toBe(name);
      expect(target.onset).toBe(onset);
      expect(target.rime).toBe(rime);
    });

    // Verify modular loop back to Level 1 (T-REX) at index 10
    const loopTarget = getDinoTarget(10);
    expect(loopTarget.name).toBe('T-REX');

    const tOverflow = getDinoTarget(23);
    expect(tOverflow.name).toBe('CLAW'); // 23 % 10 = 3 -> CLAW
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('dino-fossil');
    expect(game).toBeDefined();
    expect(game.title).toBe('Dino Fossil Excavator 3D');
    expect(game.route).toBe('/child/games/dino-fossil');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('words');
  });
});

// ────────────────────────────────────────────────
// P0 Fix #1 — Duplicate Session Save Prevention
// ────────────────────────────────────────────────
describe('P0 Fix #1 — Session tracking & no duplicate session saves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recordAttempt accumulates attempts without triggering backend saves', () => {
    const { result } = renderHook(() =>
      useGameSessionTracker({
        gameId: 'dino-fossil',
        gameTitle: 'Dino Fossil Excavator 3D',
        skill: 'onsetRimeBlending',
      })
    );

    act(() => {
      result.current.recordAttempt(true, { roundScore: 150, starsEarned: 1, xpEarned: 20 });
      result.current.recordAttempt(false);
      result.current.recordAttempt(true, { roundScore: 150, starsEarned: 1, xpEarned: 20 });
    });

    expect(result.current.stats.roundsAttempted).toBe(3);
    expect(result.current.stats.roundsCorrect).toBe(2);
    expect(result.current.stats.score).toBe(300);
    expect(mockSaveLearningSession).not.toHaveBeenCalled();
  });

  it('DinoFossilGame wrapper saves completed session only on exit, not on round completion', async () => {
    render(
      <MemoryRouter>
        <DinoFossilGame />
      </MemoryRouter>
    );

    // Initial render should not save
    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Trigger round completion by clicking correct slabs: 'T' then 'REX'
    const slabT = screen.getByTestId('slab-T');
    fireEvent.click(slabT);

    const slabREX = screen.getByTestId('slab-REX');
    fireEvent.click(slabREX);

    // Fossil is completed, victory displayed, but NO session save should fire during gameplay
    expect(screen.getByText(/ROAAAR! FOSSIL EXCAVATED!/i)).toBeInTheDocument();
    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Now exit via Back button
    const backBtn = screen.getAllByRole('button', { name: /Back to Games/i })[0];
    await act(async () => {
      fireEvent.click(backBtn);
    });

    // Session is saved exactly once on exit
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
    const payload = mockSaveLearningSession.mock.calls[0][0];
    expect(payload.activity_id).toBe('dino-fossil');
    expect(payload.skill).toBe('onsetRimeBlending');
  });
});

// ────────────────────────────────────────────────
// P0 Fix #2 — Rapid-click synchronous guard in DinoApp
// ────────────────────────────────────────────────
describe('P0 Fix #2 — Rapid-click synchronous guard (handleBrushSlab)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('synchronously blocks rapid double-clicks on the same onset slab', () => {
    const onRoundComplete = vi.fn();
    render(<DinoApp onBack={vi.fn()} onRoundComplete={onRoundComplete} />);

    const slabT = screen.getByTestId('slab-T');

    // First click on onset slab 'T'
    fireEvent.click(slabT);
    expect(mockPlayBrush).toHaveBeenCalledTimes(1);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    // Rapid second click on the same slab 'T' before any state update / re-render
    fireEvent.click(slabT);

    // Synchronous guard must reject: brush sound not re-triggered, still 1/2
    expect(mockPlayBrush).toHaveBeenCalledTimes(1);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(onRoundComplete).not.toHaveBeenCalled();
  });

  it('incorrect clicks do not block valid subsequent tries', () => {
    const onRoundComplete = vi.fn();
    render(<DinoApp onBack={vi.fn()} onRoundComplete={onRoundComplete} />);

    const currentTarget = getDinoTarget(0); // T-REX, distractors e.g. P, ING
    const wrongChunk = currentTarget.distractors[0];
    const wrongSlab = screen.getByTestId(`slab-${wrongChunk}`);

    // Click incorrect slab
    fireEvent.click(wrongSlab);
    expect(mockPlayGentleOops).toHaveBeenCalledTimes(1);
    expect(onRoundComplete).toHaveBeenCalledWith({
      isCorrect: false,
      target: currentTarget,
    });

    // Valid onset slab should still be clickable and processed
    const slabT = screen.getByTestId('slab-T');
    fireEvent.click(slabT);
    expect(mockPlayBrush).toHaveBeenCalledTimes(1);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('roundLockRef blocks rapid duplicate clicks after fossil is completed', () => {
    const onRoundComplete = vi.fn();
    render(<DinoApp onBack={vi.fn()} onRoundComplete={onRoundComplete} />);

    // Step 1: Click onset
    fireEvent.click(screen.getByTestId('slab-T'));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    // Step 2: Click rime
    const slabREX = screen.getByTestId('slab-REX');
    fireEvent.click(slabREX);

    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(onRoundComplete).toHaveBeenCalledTimes(1);
    expect(onRoundComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        isCorrect: true,
        stars: 1,
        score: 500,
      })
    );

    // Rapid extra clicks on slabREX or slabT after completion
    fireEvent.click(slabREX);
    fireEvent.click(screen.getByTestId('slab-T'));

    // roundLockRef must block them: onRoundComplete is not called again
    expect(onRoundComplete).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────
// P0 Fix #3 — Mascot timer race condition & cleanup
// ────────────────────────────────────────────────
describe('P0 Fix #3 — Mascot timer race condition & cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears celebration timeout when completing fossil so victory state is not reverted', () => {
    render(<DinoApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    const world = screen.getByTestId('mock-dino-world');

    // Step 1: Brush onset slab -> mascot enters 'celebrate'
    fireEvent.click(screen.getByTestId('slab-T'));
    expect(world.getAttribute('data-mascot-state')).toBe('celebrate');

    // Step 2: Quickly brush rime slab (e.g. 300ms later) -> mascot enters 'victory'
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.click(screen.getByTestId('slab-REX'));
    expect(world.getAttribute('data-mascot-state')).toBe('victory');

    // Step 3: Advance past the original 1200ms celebrate timeout
    act(() => {
      vi.advanceTimersByTime(1000); // 1300ms total from start
    });

    // Mascot must STILL be in 'victory' because celebrate timeout was cancelled!
    expect(world.getAttribute('data-mascot-state')).toBe('victory');

    // Step 4: Advance past 3400ms transition timeout -> transitions to next target and idle
    act(() => {
      vi.advanceTimersByTime(2500); // 3800ms total
    });
    expect(world.getAttribute('data-mascot-state')).toBe('idle');
  });

  it('resets and cleans up timers cleanly when dig site is reset', () => {
    render(<DinoApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    const world = screen.getByTestId('mock-dino-world');

    // Brush onset slab
    fireEvent.click(screen.getByTestId('slab-T'));
    expect(world.getAttribute('data-mascot-state')).toBe('celebrate');

    // Reset dig site via HUD button
    const resetBtn = screen.getByTitle('Reset Dig Site');
    fireEvent.click(resetBtn);

    // Mascot is reset to idle and fossils restored is reset to 0 / 2
    expect(world.getAttribute('data-mascot-state')).toBe('idle');
    expect(screen.getByText('0 / 2')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────
// Visual representation of word meaning after completion
// ────────────────────────────────────────────────
describe('Visual representation of word meaning upon completion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('visual meaning representation is hidden during word building and only appears after correct completion', () => {
    render(<DinoApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Before solving: meaning representation must not be present
    expect(screen.queryByTestId('fossil-meaning-visual')).not.toBeInTheDocument();

    // After picking only onset chunk 'T': still not complete
    fireEvent.click(screen.getByTestId('slab-T'));
    expect(screen.queryByTestId('fossil-meaning-visual')).not.toBeInTheDocument();

    // After picking rime chunk 'REX': completed! Visual representation appears
    fireEvent.click(screen.getByTestId('slab-REX'));
    expect(screen.getByTestId('fossil-meaning-visual')).toBeInTheDocument();
    expect(screen.getByTestId('meaning-shape-fossil-rex')).toBeInTheDocument();
    expect(screen.getByText('Tyrannosaurus Rex')).toBeInTheDocument();
    expect(within(screen.getByTestId('fossil-meaning-visual')).getByText('T-REX')).toBeInTheDocument();
  });

  it('pronunciation button on meaning visual speaks the completed word aloud', () => {
    render(<DinoApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    fireEvent.click(screen.getByTestId('slab-T'));
    fireEvent.click(screen.getByTestId('slab-REX'));

    const pronounceBtn = screen.getByRole('button', { name: /Hear T-REX pronounced/i });
    expect(pronounceBtn).toBeInTheDocument();

    fireEvent.click(pronounceBtn);
    expect(mockSpeakCompanion).toHaveBeenCalledWith('T-REX');
  });

  it('displays recognizable BONE shape and meaning description for BONE target', () => {
    vi.useFakeTimers();
    render(<DinoApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Complete target 0 (T-REX)
    fireEvent.click(screen.getByTestId('slab-T'));
    fireEvent.click(screen.getByTestId('slab-REX'));

    // Advance 3400ms to cycle to target 1 (BONE)
    act(() => {
      vi.advanceTimersByTime(3400);
    });

    // On target 1 (BONE): meaning visual resets
    expect(screen.queryByTestId('fossil-meaning-visual')).not.toBeInTheDocument();

    // Excavate BONE (onset: B, rime: ONE)
    fireEvent.click(screen.getByTestId('slab-B'));
    fireEvent.click(screen.getByTestId('slab-ONE'));

    // Visual representation for BONE appears with recognizable bone icon and description
    expect(screen.getByTestId('fossil-meaning-visual')).toBeInTheDocument();
    expect(screen.getByTestId('meaning-shape-fossil-bone')).toBeInTheDocument();
    expect(screen.getByText('Ancient Fossil Bone')).toBeInTheDocument();
    expect(screen.getByText(/A sturdy prehistoric bone/i)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('displays roaring dinosaur representation and plays roar audio for ROAR target', () => {
    vi.useFakeTimers();
    render(<DinoApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Fast-forward to target 2 (ROAR): complete target 0 then 1
    fireEvent.click(screen.getByTestId('slab-T'));
    fireEvent.click(screen.getByTestId('slab-REX'));
    act(() => { vi.advanceTimersByTime(3400); });

    fireEvent.click(screen.getByTestId('slab-B'));
    fireEvent.click(screen.getByTestId('slab-ONE'));
    act(() => { vi.advanceTimersByTime(3400); });

    // Excavate ROAR (onset: R, rime: OAR)
    fireEvent.click(screen.getByTestId('slab-R'));
    fireEvent.click(screen.getByTestId('slab-OAR'));

    // Visual representation for ROAR appears
    expect(screen.getByTestId('fossil-meaning-visual')).toBeInTheDocument();
    expect(screen.getByTestId('meaning-shape-fossil-roar')).toBeInTheDocument();
    expect(screen.getByText('Dinosaur Roar')).toBeInTheDocument();
    expect(screen.getByText(/opening its mouth wide/i)).toBeInTheDocument();

    // Roar audio should have played
    expect(mockPlayRoar).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('displays recognizable TAIL and CLAW representations on respective completed words', () => {
    vi.useFakeTimers();
    render(<DinoApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Target 0 (T-REX) -> Target 1 (BONE) -> Target 2 (ROAR) -> Target 3 (CLAW)
    fireEvent.click(screen.getByTestId('slab-T'));
    fireEvent.click(screen.getByTestId('slab-REX'));
    act(() => { vi.advanceTimersByTime(3400); });

    fireEvent.click(screen.getByTestId('slab-B'));
    fireEvent.click(screen.getByTestId('slab-ONE'));
    act(() => { vi.advanceTimersByTime(3400); });

    fireEvent.click(screen.getByTestId('slab-R'));
    fireEvent.click(screen.getByTestId('slab-OAR'));
    act(() => { vi.advanceTimersByTime(3400); });

    // Excavate CLAW (onset: CL, rime: AW)
    fireEvent.click(screen.getByTestId('slab-CL'));
    fireEvent.click(screen.getByTestId('slab-AW'));
    expect(screen.getByTestId('meaning-shape-fossil-claw')).toBeInTheDocument();
    expect(screen.getByText('Sharp Talon Claw')).toBeInTheDocument();

    // Advance to Target 4 (TAIL)
    act(() => { vi.advanceTimersByTime(3400); });

    // Excavate TAIL (onset: T, rime: AIL)
    fireEvent.click(screen.getByTestId('slab-T'));
    fireEvent.click(screen.getByTestId('slab-AIL'));
    expect(screen.getByTestId('meaning-shape-fossil-tail')).toBeInTheDocument();
    expect(screen.getByText('Dinosaur Tail')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('displays visual meanings and correct progression for new levels (FANG, HORN, SPINE, TRACK, SKULL)', () => {
    vi.useFakeTimers();
    render(<DinoApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Fast-forward through levels 1-5 (T-REX, BONE, ROAR, CLAW, TAIL)
    const levelsToSkip = [
      { onset: 'T', rime: 'REX' },
      { onset: 'B', rime: 'ONE' },
      { onset: 'R', rime: 'OAR' },
      { onset: 'CL', rime: 'AW' },
      { onset: 'T', rime: 'AIL' },
    ];

    levelsToSkip.forEach(({ onset, rime }) => {
      fireEvent.click(screen.getByTestId(`slab-${onset}`));
      fireEvent.click(screen.getByTestId(`slab-${rime}`));
      act(() => {
        vi.advanceTimersByTime(3400);
      });
    });

    // Level 6: FANG (onset: F, rime: ANG)
    expect(screen.queryByTestId('fossil-meaning-visual')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('slab-F'));
    fireEvent.click(screen.getByTestId('slab-ANG'));
    expect(screen.getByTestId('meaning-shape-fossil-fang')).toBeInTheDocument();
    expect(screen.getByText('Saber Dinosaur Fang')).toBeInTheDocument();
    expect(within(screen.getByTestId('fossil-meaning-visual')).getByText('FANG')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3400);
    });

    // Level 7: HORN (onset: H, rime: ORN)
    expect(screen.queryByTestId('fossil-meaning-visual')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('slab-H'));
    fireEvent.click(screen.getByTestId('slab-ORN'));
    expect(screen.getByTestId('meaning-shape-fossil-horn')).toBeInTheDocument();
    expect(screen.getByText('Triceratops Horn')).toBeInTheDocument();
    expect(within(screen.getByTestId('fossil-meaning-visual')).getByText('HORN')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3400);
    });

    // Level 8: SPINE (onset: SP, rime: INE)
    expect(screen.queryByTestId('fossil-meaning-visual')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('slab-SP'));
    fireEvent.click(screen.getByTestId('slab-INE'));
    expect(screen.getByTestId('meaning-shape-fossil-spine')).toBeInTheDocument();
    expect(screen.getByText('Spinosaurus Spine')).toBeInTheDocument();
    expect(within(screen.getByTestId('fossil-meaning-visual')).getByText('SPINE')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3400);
    });

    // Level 9: TRACK (onset: TR, rime: ACK)
    expect(screen.queryByTestId('fossil-meaning-visual')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('slab-TR'));
    fireEvent.click(screen.getByTestId('slab-ACK'));
    expect(screen.getByTestId('meaning-shape-fossil-track')).toBeInTheDocument();
    expect(screen.getByText('Fossil Dinosaur Track')).toBeInTheDocument();
    expect(within(screen.getByTestId('fossil-meaning-visual')).getByText('TRACK')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3400);
    });

    // Level 10: SKULL (onset: SK, rime: ULL)
    expect(screen.queryByTestId('fossil-meaning-visual')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('slab-SK'));
    fireEvent.click(screen.getByTestId('slab-ULL'));
    expect(screen.getByTestId('meaning-shape-fossil-skull')).toBeInTheDocument();
    expect(screen.getByText('Armored Dinosaur Skull')).toBeInTheDocument();
    expect(within(screen.getByTestId('fossil-meaning-visual')).getByText('SKULL')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3400);
    });

    // After Level 10: shows victory completion screen instead of cycling back to Level 1
    expect(screen.getByTestId('dino-completion-screen')).toBeInTheDocument();
    expect(screen.getByText('All Fossils Excavated!')).toBeInTheDocument();

    vi.useRealTimers();
  });
});

// ────────────────────────────────────────────────
// Checkpoint System (Persistence, Resuming, Validation, Multi-Profile)
// ────────────────────────────────────────────────
describe('Checkpoint System (Persistence, Resuming, Validation, Multi-Profile)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('saves next level index to child-specific localStorage key upon level completion', () => {
    render(<DinoApp childId="child-101" onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Level 1: T-REX (onset T, rime REX)
    fireEvent.click(screen.getByTestId('slab-T'));
    fireEvent.click(screen.getByTestId('slab-REX'));

    const raw = localStorage.getItem('lexiguide_dino_fossil_checkpoint_child-101');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.levelIndex).toBe(1); // Next level is BONE (index 1)
    expect(loadDinoCheckpoint('child-101')).toBe(1);
  });

  it('saves Level 10 progress correctly without wrapping back to Level 1 as a checkpoint', () => {
    saveDinoCheckpoint('child-101', 9); // Level 10: SKULL
    render(<DinoApp childId="child-101" onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Excavate Level 10 (SKULL: onset SK, rime ULL)
    fireEvent.click(screen.getByTestId('slab-SK'));
    fireEvent.click(screen.getByTestId('slab-ULL'));

    // Checkpoint must stay at index 9 (Level 10), NOT wrap to index 0 (Level 1)
    const raw = localStorage.getItem('lexiguide_dino_fossil_checkpoint_child-101');
    const parsed = JSON.parse(raw);
    expect(parsed.levelIndex).toBe(9);
    expect(loadDinoCheckpoint('child-101')).toBe(9);
  });

  it('resumes from saved level on refresh or reopen', () => {
    saveDinoCheckpoint('child-202', 5); // Level 6: FANG (index 5)

    render(<DinoApp childId="child-202" onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Slabs for Level 6 (FANG) must be rendered: 'F' and 'ANG'
    expect(screen.getByTestId('slab-F')).toBeInTheDocument();
    expect(screen.getByTestId('slab-ANG')).toBeInTheDocument();
    expect(screen.getByText('FANG')).toBeInTheDocument();
  });

  it('starts at Level 1 when there is no saved checkpoint', () => {
    render(<DinoApp childId="brand-new-child" onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    expect(screen.getByTestId('slab-T')).toBeInTheDocument();
    expect(screen.getByTestId('slab-REX')).toBeInTheDocument();
    expect(loadDinoCheckpoint('brand-new-child')).toBe(0);
  });

  it('maintains separate checkpoints for separate child profiles and guest profile', () => {
    saveDinoCheckpoint('child-A', 2); // Level 3: ROAR
    saveDinoCheckpoint('child-B', 6); // Level 7: HORN
    saveDinoCheckpoint(null, 3); // Level 4: CLAW for guest
    saveDinoCheckpoint(undefined, 4); // Level 5: TAIL for guest

    expect(loadDinoCheckpoint('child-A')).toBe(2);
    expect(loadDinoCheckpoint('child-B')).toBe(6);
    expect(loadDinoCheckpoint(null)).toBe(4);
    expect(loadDinoCheckpoint(undefined)).toBe(4);

    expect(getDinoCheckpointKey('child-A')).toBe('lexiguide_dino_fossil_checkpoint_child-A');
    expect(getDinoCheckpointKey(null)).toBe('lexiguide_dino_fossil_checkpoint_guest');
    expect(getDinoCheckpointKey(undefined)).toBe('lexiguide_dino_fossil_checkpoint_guest');
  });

  it('validates saved data and safely recovers from invalid or corrupted checkpoints', () => {
    const key = getDinoCheckpointKey('child-corrupted');

    // Corrupted JSON
    localStorage.setItem(key, '{not valid json!!!');
    expect(loadDinoCheckpoint('child-corrupted')).toBe(0);

    // Negative number
    localStorage.setItem(key, '-3');
    expect(loadDinoCheckpoint('child-corrupted')).toBe(0);

    // Out-of-bounds (>= 10)
    localStorage.setItem(key, '15');
    expect(loadDinoCheckpoint('child-corrupted')).toBe(0);

    // Float number
    localStorage.setItem(key, '4.2');
    expect(loadDinoCheckpoint('child-corrupted')).toBe(0);

    // String junk
    localStorage.setItem(key, 'invalid-string');
    expect(loadDinoCheckpoint('child-corrupted')).toBe(0);

    // Object without level index
    localStorage.setItem(key, JSON.stringify({ score: 9999 }));
    expect(loadDinoCheckpoint('child-corrupted')).toBe(0);

    // DinoApp starts safely at Level 1 with corrupted data without crashing
    render(<DinoApp childId="child-corrupted" onBack={vi.fn()} onRoundComplete={vi.fn()} />);
    expect(screen.getByTestId('slab-T')).toBeInTheDocument();
    expect(screen.getByTestId('slab-REX')).toBeInTheDocument();
  });

  it('DinoFossilGame wrapper passes activeChild.id to DinoApp and keeps session tracker independent', async () => {
    render(
      <MemoryRouter>
        <DinoFossilGame />
      </MemoryRouter>
    );

    // In AppContext mock, activeChild.id is 1
    // Completing Level 1 saves checkpoint for child 1
    fireEvent.click(screen.getByTestId('slab-T'));
    fireEvent.click(screen.getByTestId('slab-REX'));

    expect(loadDinoCheckpoint(1)).toBe(1);

    // Session tracker has NOT called backend save yet
    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Session is saved strictly on exit
    const backBtn = screen.getAllByRole('button', { name: /Back to Games/i })[0];
    await act(async () => {
      fireEvent.click(backBtn);
    });

    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
    expect(mockSaveLearningSession.mock.calls[0][0].activity_id).toBe('dino-fossil');
  });
});

// ────────────────────────────────────────────────
// Final-Level Victory Screen & Play Again Flow
// ────────────────────────────────────────────────
describe('Final-Level Victory Screen & Play Again Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('completing Level 10 shows victory completion screen with final score and stars instead of looping', () => {
    vi.useFakeTimers();
    saveDinoCheckpoint('child-champ', 9); // Start directly at Level 10: SKULL

    render(<DinoApp childId="child-champ" onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Excavate Level 10 (SKULL: onset SK, rime ULL)
    fireEvent.click(screen.getByTestId('slab-SK'));
    fireEvent.click(screen.getByTestId('slab-ULL'));

    // Victory celebration (fossil excavated meaning shows first)
    expect(screen.getByTestId('fossil-meaning-visual')).toBeInTheDocument();

    // Advance past celebration timer (3400ms)
    act(() => {
      vi.advanceTimersByTime(3400);
    });

    // Victory completion screen appears
    expect(screen.getByTestId('dino-completion-screen')).toBeInTheDocument();
    expect(screen.getByText('Chief Paleontologist! 🏆')).toBeInTheDocument();
    expect(screen.getByText('All Fossils Excavated!')).toBeInTheDocument();
    expect(screen.getByTestId('final-stars')).toBeInTheDocument();
    expect(screen.getByTestId('final-score')).toBeInTheDocument();
    expect(screen.getByTestId('play-again-btn')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-games-btn')).toBeInTheDocument();

    // Ensure it did NOT loop back to Level 1
    expect(screen.queryByTestId('slab-T')).not.toBeInTheDocument();
    expect(screen.queryByTestId('slab-REX')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('blocks further excavation and rapid clicks after Level 10 is completed', () => {
    vi.useFakeTimers();
    const onRoundComplete = vi.fn();
    saveDinoCheckpoint('child-guard', 9);

    render(<DinoApp childId="child-guard" onBack={vi.fn()} onRoundComplete={onRoundComplete} />);

    // Complete Level 10
    const slabSK = screen.getByTestId('slab-SK');
    const slabULL = screen.getByTestId('slab-ULL');
    fireEvent.click(slabSK);
    fireEvent.click(slabULL);

    const callCountAfterComplete = onRoundComplete.mock.calls.length;

    // Rapidly click slabs during celebration
    fireEvent.click(slabSK);
    fireEvent.click(slabULL);

    act(() => {
      vi.advanceTimersByTime(3400);
    });

    // Completion modal is visible
    expect(screen.getByTestId('dino-completion-screen')).toBeInTheDocument();

    // Rapid clicks after completion screen
    fireEvent.click(slabSK);
    fireEvent.click(slabULL);

    // No extra calls to onRoundComplete
    expect(onRoundComplete.mock.calls.length).toBe(callCountAfterComplete);

    vi.useRealTimers();
  });

  it('Play Again resets checkpoint to 0, resets score and stars, and restarts from Level 1', () => {
    vi.useFakeTimers();
    saveDinoCheckpoint('child-restart', 9);

    render(<DinoApp childId="child-restart" onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Complete Level 10
    fireEvent.click(screen.getByTestId('slab-SK'));
    fireEvent.click(screen.getByTestId('slab-ULL'));
    act(() => {
      vi.advanceTimersByTime(3400);
    });

    expect(screen.getByTestId('dino-completion-screen')).toBeInTheDocument();

    // Click Play Again
    const playAgainBtn = screen.getByTestId('play-again-btn');
    fireEvent.click(playAgainBtn);

    // Completion screen must close
    expect(screen.queryByTestId('dino-completion-screen')).not.toBeInTheDocument();

    // Checkpoint in localStorage must be reset to 0
    expect(loadDinoCheckpoint('child-restart')).toBe(0);

    // Level 1: T-REX slabs must now be present
    expect(screen.getByTestId('slab-T')).toBeInTheDocument();
    expect(screen.getByTestId('slab-REX')).toBeInTheDocument();

    // Score and stars are reset to 0 in HUD
    expect(screen.getByText('0 PTS')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('Back to Games button calls onBack callback', () => {
    vi.useFakeTimers();
    const onBack = vi.fn();
    saveDinoCheckpoint('child-exit', 9);

    render(<DinoApp childId="child-exit" onBack={onBack} onRoundComplete={vi.fn()} />);

    fireEvent.click(screen.getByTestId('slab-SK'));
    fireEvent.click(screen.getByTestId('slab-ULL'));
    act(() => {
      vi.advanceTimersByTime(3400);
    });

    const backBtn = screen.getByTestId('back-to-games-btn');
    fireEvent.click(backBtn);

    expect(onBack).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('DinoFossilGame wrapper saves completed session upon Level 10 finish and does not duplicate on exit', async () => {
    vi.useFakeTimers();
    saveDinoCheckpoint(1, 9); // Active child id is 1

    render(
      <MemoryRouter>
        <DinoFossilGame />
      </MemoryRouter>
    );

    // Complete Level 10
    fireEvent.click(screen.getByTestId('slab-SK'));
    fireEvent.click(screen.getByTestId('slab-ULL'));

    // Advance 3400ms to trigger game completion
    await act(async () => {
      vi.advanceTimersByTime(3400);
    });

    // Session save must be triggered once on game completion
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
    expect(mockSaveLearningSession.mock.calls[0][0].activity_id).toBe('dino-fossil');

    // Now click Back to Games on the completion modal
    const backBtn = screen.getByTestId('back-to-games-btn');
    await act(async () => {
      fireEvent.click(backBtn);
    });

    // Save must NOT be duplicated
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('preserves checkpoints for unfinished progress during Levels 1-9 without resetting', () => {
    vi.useFakeTimers();
    render(<DinoApp childId="child-progress" onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Complete Level 1 (T-REX)
    fireEvent.click(screen.getByTestId('slab-T'));
    fireEvent.click(screen.getByTestId('slab-REX'));
    expect(loadDinoCheckpoint('child-progress')).toBe(1);

    act(() => {
      vi.advanceTimersByTime(3400);
    });

    // On Level 2 (BONE)
    expect(screen.getByTestId('slab-B')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('slab-B'));
    fireEvent.click(screen.getByTestId('slab-ONE'));
    expect(loadDinoCheckpoint('child-progress')).toBe(2);

    act(() => {
      vi.advanceTimersByTime(3400);
    });

    // Checkpoint remains preserved at 2
    expect(loadDinoCheckpoint('child-progress')).toBe(2);

    vi.useRealTimers();
  });
});

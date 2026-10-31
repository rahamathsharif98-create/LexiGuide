import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { LABYRINTH_RIDDLES, getLabyrinthRiddle } from '../games/ancient-labyrinth/engine/labyrinthGlyphs';
import { getGameById } from '../data/gamingZoneRegistry';
import LabyrinthApp, {
  getLabyrinthCheckpointKey,
  loadLabyrinthCheckpoint,
  saveLabyrinthCheckpoint,
} from '../games/ancient-labyrinth/LabyrinthApp';
import AncientLabyrinthGame from '../pages/child/AncientLabyrinthGame';

// ────────────────────────────────────────────────
// Mocks for 3D canvas and audio in JSDOM environment
// ────────────────────────────────────────────────
vi.mock('../games/ancient-labyrinth/LabyrinthWorld', () => ({
  default: ({ keystones, onCollectKeystone, mascotState, isUnlocked, isVictory }) => (
    <div
      data-testid="mock-labyrinth-world"
      data-mascot-state={mascotState}
      data-unlocked={isUnlocked ? 'true' : 'false'}
      data-victory={isVictory ? 'true' : 'false'}
    >
      {keystones.map((k) => (
        <button
          key={k.id}
          data-testid={`keystone-${k.glyph}`}
          data-id={k.id}
          data-pos={JSON.stringify(k.pos)}
          data-collected={k.isCollected ? 'true' : 'false'}
          data-is-next={k.isNext ? 'true' : 'false'}
          onClick={() => onCollectKeystone(k)}
        >
          {k.glyph}
        </button>
      ))}
    </div>
  ),
}));

const mockPlayLetterNote = vi.fn();
const mockPlayFanfare = vi.fn();
const mockSpeakCompanion = vi.fn();
const mockPlayGentleOops = vi.fn();

vi.mock('../services/gameSoundService', () => ({
  gameSound: {
    playLetterNote: (...args) => mockPlayLetterNote(...args),
    playFanfare: (...args) => mockPlayFanfare(...args),
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
    activeChild: { id: 1, name: 'Labyrinth Explorer' },
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

describe('Ancient Labyrinth of Glyphs (3D Torchlight Maze) — 10 Levels Expansion', () => {
  it('loads exactly 10 valid labyrinth riddles with gradual difficulty and distinct chambers', () => {
    expect(LABYRINTH_RIDDLES.length).toBe(10);

    // Verify existing 5 riddles are strictly preserved in their original order
    expect(LABYRINTH_RIDDLES[0].word).toBe('OPEN');
    expect(LABYRINTH_RIDDLES[1].word).toBe('LIGHT');
    expect(LABYRINTH_RIDDLES[2].word).toBe('DOOR');
    expect(LABYRINTH_RIDDLES[3].word).toBe('GOLD');
    expect(LABYRINTH_RIDDLES[4].word).toBe('RUBY');

    // Verify 5 new riddles
    expect(LABYRINTH_RIDDLES[5].word).toBe('CHEST');
    expect(LABYRINTH_RIDDLES[6].word).toBe('TORCH');
    expect(LABYRINTH_RIDDLES[7].word).toBe('CROWN');
    expect(LABYRINTH_RIDDLES[8].word).toBe('SHIELD');
    expect(LABYRINTH_RIDDLES[9].word).toBe('TEMPLE');

    const ids = new Set();
    const words = new Set();
    const chambers = new Set();

    LABYRINTH_RIDDLES.forEach((riddle) => {
      expect(riddle.id).toBeDefined();
      expect(riddle.word).toBeDefined();
      expect(riddle.emoji).toBeDefined();
      expect(riddle.chamber).toBeDefined();
      expect(riddle.distractors.length).toBeGreaterThanOrEqual(2);
      expect(riddle.prompt).toBeDefined();
      expect(riddle.speechText).toBeDefined();

      // Ensure word length is between 4 and 6 letters
      expect(riddle.word.length).toBeGreaterThanOrEqual(4);
      expect(riddle.word.length).toBeLessThanOrEqual(6);

      // Verify distractors are not letters in the target word
      riddle.distractors.forEach((d) => {
        expect(riddle.word.includes(d)).toBe(false);
      });

      // Verify unique IDs, words, and chambers
      expect(ids.has(riddle.id)).toBe(false);
      expect(words.has(riddle.word)).toBe(false);
      expect(chambers.has(riddle.chamber)).toBe(false);

      ids.add(riddle.id);
      words.add(riddle.word);
      chambers.add(riddle.chamber);
    });
  });

  it('cycles all 10 riddles predictably with getLabyrinthRiddle without out-of-bounds error', () => {
    const expectedWords = [
      'OPEN',
      'LIGHT',
      'DOOR',
      'GOLD',
      'RUBY',
      'CHEST',
      'TORCH',
      'CROWN',
      'SHIELD',
      'TEMPLE',
    ];

    expectedWords.forEach((word, index) => {
      const riddle = getLabyrinthRiddle(index);
      expect(riddle.word).toBe(word);
    });

    // Verify wrapping at boundary
    expect(getLabyrinthRiddle(10).word).toBe('OPEN');
    expect(getLabyrinthRiddle(11).word).toBe('LIGHT');
    expect(getLabyrinthRiddle(21).word).toBe('LIGHT');
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('ancient-labyrinth');
    expect(game).toBeDefined();
    expect(game.title).toBe('Ancient Labyrinth of Glyphs');
    expect(game.route).toBe('/child/games/ancient-labyrinth');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('letters');
  });
});

// ────────────────────────────────────────────────
// Level Progression & Keystone Assembly
// ────────────────────────────────────────────────
describe('Ancient Labyrinth — Consecutive Level Progression', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('progresses smoothly through consecutive levels upon riddle completion', () => {
    render(<LabyrinthApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // --- LEVEL 0: OPEN ---
    expect(screen.getByText('Chamber of Whispering Doors')).toBeInTheDocument();
    expect(screen.getByText('0 / 4')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('keystone-O'));
    fireEvent.click(screen.getByTestId('keystone-P'));
    fireEvent.click(screen.getByTestId('keystone-E'));
    fireEvent.click(screen.getByTestId('keystone-N'));

    expect(screen.getByText('4 / 4')).toBeInTheDocument();
    expect(screen.getByText(/TEMPLE GATE UNLOCKED!/i)).toBeInTheDocument();

    // Advance 3400ms transition timer
    act(() => {
      vi.advanceTimersByTime(3400);
    });

    // --- LEVEL 1: LIGHT ---
    expect(screen.getByText('Hall of Eternal Torches')).toBeInTheDocument();
    expect(screen.getByText('0 / 5')).toBeInTheDocument();
    expect(screen.getByTestId('keystone-L')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('keystone-L'));
    fireEvent.click(screen.getByTestId('keystone-I'));
    fireEvent.click(screen.getByTestId('keystone-G'));
    fireEvent.click(screen.getByTestId('keystone-H'));
    fireEvent.click(screen.getByTestId('keystone-T'));

    expect(screen.getByText('5 / 5')).toBeInTheDocument();

    // Advance 3400ms transition timer
    act(() => {
      vi.advanceTimersByTime(3400);
    });

    // --- LEVEL 2: DOOR ---
    expect(screen.getByText('Stone Gateway of the Sphinx')).toBeInTheDocument();
    expect(screen.getByText('0 / 4')).toBeInTheDocument();
    expect(screen.getByTestId('keystone-D')).toBeInTheDocument();
  });

  it('assigns non-overlapping 3D coordinates to all keystones in a level', () => {
    render(<LabyrinthApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    const buttons = screen.getAllByRole('button').filter((b) => b.getAttribute('data-id')?.startsWith('glyph-'));
    expect(buttons.length).toBeGreaterThanOrEqual(6);

    const positions = new Set();
    buttons.forEach((btn) => {
      const pos = btn.getAttribute('data-pos');
      expect(pos).toBeTruthy();
      expect(positions.has(pos)).toBe(false);
      positions.add(pos);

      // Verify coordinate bounds: all pedestals are inside open temple hall (X between -3.5 and 3.5)
      const [x, y, z] = JSON.parse(pos);
      expect(x).toBeGreaterThanOrEqual(-3.5);
      expect(x).toBeLessThanOrEqual(3.5);
      expect(y).toBe(0);
      expect(z).toBeGreaterThanOrEqual(-8.0);
      expect(z).toBeLessThanOrEqual(2.0);
    });
  });

  it('guarantees 100% line-of-sight visibility with zero sightline occlusion from gameplay camera', () => {
    render(<LabyrinthApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    const buttons = screen.getAllByRole('button').filter((b) => b.getAttribute('data-id')?.startsWith('glyph-'));
    const parsedCoords = buttons.map((btn) => JSON.parse(btn.getAttribute('data-pos')));

    // Camera at [0, 5.0, 8.0]
    const camZ = 8.0;

    // Group coords by side (left vs right)
    const rightCoords = parsedCoords.filter(([x]) => x > 0);
    const leftCoords = parsedCoords.filter(([x]) => x < 0);

    // Compute screen projections u = x / (camZ - z)
    // Pedestals on right side must have strictly distinct projections with adequate spacing
    const rightProjections = rightCoords
      .map(([x, , z]) => ({ x, z, u: x / (camZ - z) }))
      .sort((a, b) => a.u - b.u);

    for (let i = 0; i < rightProjections.length - 1; i++) {
      const current = rightProjections[i];
      const next = rightProjections[i + 1];
      // Adequate spacing between neighboring screen projections ensures no pedestal overlaps another
      expect(next.u - current.u).toBeGreaterThanOrEqual(0.05);
    }

    const leftProjections = leftCoords
      .map(([x, , z]) => ({ x, z, u: x / (camZ - z) }))
      .sort((a, b) => a.u - b.u);

    for (let i = 0; i < leftProjections.length - 1; i++) {
      const current = leftProjections[i];
      const next = leftProjections[i + 1];
      expect(next.u - current.u).toBeGreaterThanOrEqual(0.05);
    }
  });

  it('highlights the next required letter and dynamically advances isNext indicator as glyphs are collected', () => {
    render(<LabyrinthApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Initially for 'OPEN': 'O' is the next required letter
    const btnO = screen.getByTestId('keystone-O');
    const btnP = screen.getByTestId('keystone-P');
    expect(btnO.getAttribute('data-is-next')).toBe('true');
    expect(btnP.getAttribute('data-is-next')).toBe('false');

    // Collect 'O'
    fireEvent.click(btnO);

    // Now 'P' becomes the next required letter with highlight indicator
    expect(btnO.getAttribute('data-is-next')).toBe('false');
    expect(btnP.getAttribute('data-is-next')).toBe('true');
  });
});

// ────────────────────────────────────────────────
// Checkpoint System Tests
// ────────────────────────────────────────────────
describe('Ancient Labyrinth — Checkpoint System', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('generates the correct storage key for child profiles and guest fallback', () => {
    expect(getLabyrinthCheckpointKey('child-1')).toBe('lexiguide_ancient_labyrinth_checkpoint_child-1');
    expect(getLabyrinthCheckpointKey(42)).toBe('lexiguide_ancient_labyrinth_checkpoint_42');
    expect(getLabyrinthCheckpointKey(null)).toBe('lexiguide_ancient_labyrinth_checkpoint_guest');
    expect(getLabyrinthCheckpointKey(undefined)).toBe('lexiguide_ancient_labyrinth_checkpoint_guest');
    expect(getLabyrinthCheckpointKey('')).toBe('lexiguide_ancient_labyrinth_checkpoint_guest');
  });

  it('safely handles missing, invalid, or corrupted checkpoint data by defaulting to Level 1 (index 0)', () => {
    // Missing key
    expect(loadLabyrinthCheckpoint('guest')).toBe(0);

    // Corrupted non-JSON string
    localStorage.setItem(getLabyrinthCheckpointKey('guest'), '{invalid-json:::');
    expect(loadLabyrinthCheckpoint('guest')).toBe(0);

    // Out of bounds negative index
    saveLabyrinthCheckpoint('guest', -5);
    expect(loadLabyrinthCheckpoint('guest')).toBe(0);

    // Out of bounds excessive index (>= 10)
    localStorage.setItem(
      getLabyrinthCheckpointKey('guest'),
      JSON.stringify({ levelIndex: 99 })
    );
    expect(loadLabyrinthCheckpoint('guest')).toBe(0);

    // Non-numeric value
    localStorage.setItem(
      getLabyrinthCheckpointKey('guest'),
      JSON.stringify({ levelIndex: 'invalid' })
    );
    expect(loadLabyrinthCheckpoint('guest')).toBe(0);
  });

  it('correctly loads numeric and object checkpoint formats', () => {
    // Number format
    localStorage.setItem(getLabyrinthCheckpointKey('child-1'), '3');
    expect(loadLabyrinthCheckpoint('child-1')).toBe(3);

    // Object format
    saveLabyrinthCheckpoint('child-1', 5);
    expect(loadLabyrinthCheckpoint('child-1')).toBe(5);

    const raw = JSON.parse(localStorage.getItem(getLabyrinthCheckpointKey('child-1')));
    expect(raw.levelIndex).toBe(5);
    expect(raw.savedLevelIndex).toBe(5);
    expect(raw.updatedAt).toBeDefined();
  });

  it('saves the next level index upon riddle completion and resumes after remount', () => {
    const childId = 'explorer-101';
    const { unmount } = render(
      <LabyrinthApp childId={childId} onBack={vi.fn()} onRoundComplete={vi.fn()} />
    );

    // Initially at Level 1 ('OPEN')
    expect(screen.getByText('Chamber of Whispering Doors')).toBeInTheDocument();
    expect(loadLabyrinthCheckpoint(childId)).toBe(0);

    // Solve Level 1
    fireEvent.click(screen.getByTestId('keystone-O'));
    fireEvent.click(screen.getByTestId('keystone-P'));
    fireEvent.click(screen.getByTestId('keystone-E'));
    fireEvent.click(screen.getByTestId('keystone-N'));

    // Checkpoint must be saved as index 1 (Level 2: LIGHT)
    expect(loadLabyrinthCheckpoint(childId)).toBe(1);

    // Simulate leaving / refreshing the page by unmounting and remounting
    unmount();

    render(<LabyrinthApp childId={childId} onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Resumes at saved level: Level 2 ('LIGHT', Hall of Eternal Torches)
    expect(screen.getByText('Hall of Eternal Torches')).toBeInTheDocument();
    expect(screen.getByTestId('keystone-L')).toBeInTheDocument();
  });

  it('isolates checkpoints for separate child profiles and guest', () => {
    // Setup distinct saved checkpoints
    saveLabyrinthCheckpoint('child-a', 2); // Level 3: DOOR
    saveLabyrinthCheckpoint('child-b', 5); // Level 6: CHEST
    // guest has no checkpoint -> Level 1: OPEN

    const { unmount: unmountA } = render(
      <LabyrinthApp childId="child-a" onBack={vi.fn()} onRoundComplete={vi.fn()} />
    );
    expect(screen.getByText('Stone Gateway of the Sphinx')).toBeInTheDocument();
    unmountA();

    const { unmount: unmountB } = render(
      <LabyrinthApp childId="child-b" onBack={vi.fn()} onRoundComplete={vi.fn()} />
    );
    expect(screen.getByText('Chamber of the Hidden Chest')).toBeInTheDocument();
    unmountB();

    render(<LabyrinthApp childId={null} onBack={vi.fn()} onRoundComplete={vi.fn()} />);
    expect(screen.getByText('Chamber of Whispering Doors')).toBeInTheDocument();
  });

  it('clamps final Level 10 completion at index 9 without wrapping back to Level 1 in storage', () => {
    const childId = 'master-explorer';
    // Set checkpoint at Level 10 (index 9: TEMPLE)
    saveLabyrinthCheckpoint(childId, 9);
    expect(loadLabyrinthCheckpoint(childId)).toBe(9);

    render(<LabyrinthApp childId={childId} onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Starts at Level 10 ('TEMPLE', Sanctum of the Eternal Temple)
    expect(screen.getByText('Sanctum of the Eternal Temple')).toBeInTheDocument();

    // Complete Level 10: T-E-M-P-L-E
    // Handle double 'E': find the available 'E' keystones
    fireEvent.click(screen.getByTestId('keystone-T'));
    const allE = screen.getAllByTestId('keystone-E');
    fireEvent.click(allE[0]);
    fireEvent.click(screen.getByTestId('keystone-M'));
    fireEvent.click(screen.getByTestId('keystone-P'));
    fireEvent.click(screen.getByTestId('keystone-L'));
    fireEvent.click(allE[1] || allE[0]);

    // Checkpoint must remain clamped at index 9, NEVER wrapped to 0 or 1
    expect(loadLabyrinthCheckpoint(childId)).toBe(9);
  });

  it('AncientLabyrinthGame wrapper retrieves activeChild and passes childId to resume saved level', () => {
    // activeChild has id: 1 in mock AppContext
    saveLabyrinthCheckpoint(1, 4); // Level 5: RUBY

    render(
      <MemoryRouter>
        <AncientLabyrinthGame />
      </MemoryRouter>
    );

    // Resumes at Level 5 ('RUBY', Crypt of Glowing Jewels) for activeChild id 1
    expect(screen.getByText('Crypt of Glowing Jewels')).toBeInTheDocument();
    expect(screen.getByTestId('keystone-R')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────
// Requirement 1 — Prevent duplicate session saves
// ────────────────────────────────────────────────
describe('Ancient Labyrinth — Session saving on exit only', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not save session on level completion', async () => {
    render(
      <MemoryRouter>
        <AncientLabyrinthGame />
      </MemoryRouter>
    );

    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Complete riddle 0 ('OPEN')
    fireEvent.click(screen.getByTestId('keystone-O'));
    fireEvent.click(screen.getByTestId('keystone-P'));
    fireEvent.click(screen.getByTestId('keystone-E'));
    fireEvent.click(screen.getByTestId('keystone-N'));

    // Riddle is complete, but session should NOT be saved yet
    expect(mockSaveLearningSession).not.toHaveBeenCalled();
  });

  it('saves session once when exiting via Back to Games', async () => {
    render(
      <MemoryRouter>
        <AncientLabyrinthGame />
      </MemoryRouter>
    );

    // Complete riddle
    fireEvent.click(screen.getByTestId('keystone-O'));
    fireEvent.click(screen.getByTestId('keystone-P'));
    fireEvent.click(screen.getByTestId('keystone-E'));
    fireEvent.click(screen.getByTestId('keystone-N'));

    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Click Back to Games
    const backBtn = screen.getAllByRole('button', { name: /Back to Games/i })[0];
    await act(async () => {
      fireEvent.click(backBtn);
    });

    // Session is saved exactly once on exit
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
    const payload = mockSaveLearningSession.mock.calls[0][0];
    expect(payload.activity_id).toBe('ancient-labyrinth');
    expect(payload.skill).toBe('phonicsDecodingIncantation');
  });

  it('isSavedRef guard blocks duplicate session saves on repeated exit clicks', async () => {
    render(
      <MemoryRouter>
        <AncientLabyrinthGame />
      </MemoryRouter>
    );

    // Complete riddle so there is an active session
    fireEvent.click(screen.getByTestId('keystone-O'));
    fireEvent.click(screen.getByTestId('keystone-P'));
    fireEvent.click(screen.getByTestId('keystone-E'));
    fireEvent.click(screen.getByTestId('keystone-N'));

    const backBtn = screen.getAllByRole('button', { name: /Back to Games/i })[0];
    await act(async () => {
      fireEvent.click(backBtn);
      fireEvent.click(backBtn);
      fireEvent.click(backBtn);
    });

    // Only one save call made despite repeated rapid exit clicks
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────
// Requirement 2 — Prevent rapid-click scoring exploits
// ────────────────────────────────────────────────
describe('Ancient Labyrinth — Synchronous rapid-click guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('synchronously blocks collecting the same keystone multiple times before re-render', () => {
    const onRoundComplete = vi.fn();
    render(<LabyrinthApp onBack={vi.fn()} onRoundComplete={onRoundComplete} />);

    const keystoneO = screen.getByTestId('keystone-O');

    // First click on 'O'
    fireEvent.click(keystoneO);
    expect(mockPlayLetterNote).toHaveBeenCalledTimes(1);
    expect(screen.getByText('150 PTS')).toBeInTheDocument();

    // Rapid second and third clicks on the same 'O'
    fireEvent.click(keystoneO);
    fireEvent.click(keystoneO);

    // Guard must block duplicate collections: chime note and score are unchanged
    expect(mockPlayLetterNote).toHaveBeenCalledTimes(1);
    expect(screen.getByText('150 PTS')).toBeInTheDocument();
    expect(onRoundComplete).not.toHaveBeenCalled();
  });

  it('roundLockRef blocks extra scoring and bonus calls after word completion', () => {
    const onRoundComplete = vi.fn();
    render(<LabyrinthApp onBack={vi.fn()} onRoundComplete={onRoundComplete} />);

    // Solve word 'OPEN'
    fireEvent.click(screen.getByTestId('keystone-O'));
    fireEvent.click(screen.getByTestId('keystone-P'));
    fireEvent.click(screen.getByTestId('keystone-E'));
    const keystoneN = screen.getByTestId('keystone-N');
    fireEvent.click(keystoneN);

    // Completion should be registered once: 150 + 300*3 + 500 = 1550 PTS (with combo multiplier)
    expect(screen.getByText('1550 PTS')).toBeInTheDocument();
    expect(onRoundComplete).toHaveBeenCalledTimes(1);
    expect(onRoundComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        isCorrect: true,
        stars: 1,
        score: 500,
      })
    );

    // Rapid extra clicks on 'N' or other keystones after completion
    fireEvent.click(keystoneN);
    fireEvent.click(screen.getByTestId('keystone-O'));

    // roundLockRef must block: onRoundComplete not called again, score unchanged
    expect(onRoundComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText('1550 PTS')).toBeInTheDocument();
  });

  it('incorrect clicks do not lock the round or prevent subsequent correct collection', () => {
    const onRoundComplete = vi.fn();
    render(<LabyrinthApp onBack={vi.fn()} onRoundComplete={onRoundComplete} />);

    const r0 = getLabyrinthRiddle(0);
    const distractorGlyph = r0.distractors[0]; // e.g. 'M'
    const distractorBtn = screen.getByTestId(`keystone-${distractorGlyph}`);

    // Click wrong keystone
    fireEvent.click(distractorBtn);
    expect(mockPlayGentleOops).toHaveBeenCalledTimes(1);
    expect(onRoundComplete).toHaveBeenCalledWith({
      isCorrect: false,
      riddle: r0,
    });

    // Valid keystone 'O' should still be collectible
    fireEvent.click(screen.getByTestId('keystone-O'));
    expect(mockPlayLetterNote).toHaveBeenCalledTimes(1);
    expect(screen.getByText('150 PTS')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────
// Requirement 3 — Timer cleanup and race prevention
// ────────────────────────────────────────────────
describe('Ancient Labyrinth — Timer cleanup and race prevention', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prevents celebration timer from overriding final victory mascot state', () => {
    render(<LabyrinthApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);
    const world = screen.getByTestId('mock-labyrinth-world');

    // Click 'O', 'P', 'E'
    fireEvent.click(screen.getByTestId('keystone-O'));
    fireEvent.click(screen.getByTestId('keystone-P'));
    fireEvent.click(screen.getByTestId('keystone-E'));
    expect(world.getAttribute('data-mascot-state')).toBe('celebrate');

    // Advance 400ms (within 1200ms celebration timer)
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Click final letter 'N' -> enters victory state
    fireEvent.click(screen.getByTestId('keystone-N'));
    expect(world.getAttribute('data-mascot-state')).toBe('victory');

    // Advance 900ms past the original 1200ms celebration timeout (1300ms total)
    act(() => {
      vi.advanceTimersByTime(900);
    });

    // Mascot state MUST remain 'victory', not reverted to 'idle'
    expect(world.getAttribute('data-mascot-state')).toBe('victory');

    // Advance through the remaining transition timer (3400ms total from completion)
    act(() => {
      vi.advanceTimersByTime(2600);
    });

    // After transition completes, advances to next riddle and resets mascot to idle
    expect(world.getAttribute('data-mascot-state')).toBe('idle');
  });

  it('cleans up timers on unmount without throwing errors or stale state updates', () => {
    const { unmount } = render(<LabyrinthApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Collect letters to start timers
    fireEvent.click(screen.getByTestId('keystone-O'));
    fireEvent.click(screen.getByTestId('keystone-P'));
    fireEvent.click(screen.getByTestId('keystone-E'));
    fireEvent.click(screen.getByTestId('keystone-N'));

    // Unmount while 3400ms transition timer is running
    unmount();

    // Advance past transition timeout
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    }).not.toThrow();
  });

  it('cancels pending transition timer when riddle is manually reset', () => {
    render(<LabyrinthApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);
    const world = screen.getByTestId('mock-labyrinth-world');

    // Solve riddle 0
    fireEvent.click(screen.getByTestId('keystone-O'));
    fireEvent.click(screen.getByTestId('keystone-P'));
    fireEvent.click(screen.getByTestId('keystone-E'));
    fireEvent.click(screen.getByTestId('keystone-N'));
    expect(world.getAttribute('data-unlocked')).toBe('true');

    // Click Reset button on HUD
    const resetBtn = screen.getByTitle('Reset Riddle');
    fireEvent.click(resetBtn);

    // Should be locked again, mascot idle
    expect(world.getAttribute('data-unlocked')).toBe('false');
    expect(world.getAttribute('data-mascot-state')).toBe('idle');

    // Advance 4000ms past the original transition timer
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    // Because transition was cancelled, riddle 0 is still active ('OPEN', not riddle 1 'LIGHT')
    expect(screen.getByTestId('keystone-O')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────
// Final Level Victory & Completion Flow Tests
// ────────────────────────────────────────────────
describe('Ancient Labyrinth — Final Level Victory & Completion Flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('completes Level 10 (TEMPLE), halts progression without wrapping to Level 1, and shows the Temple Conquered victory panel', () => {
    const childId = 'conqueror-child';
    // Position at Level 10 (index 9: TEMPLE)
    saveLabyrinthCheckpoint(childId, 9);

    render(<LabyrinthApp childId={childId} onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Starts at Level 10
    expect(screen.getByText('Sanctum of the Eternal Temple')).toBeInTheDocument();

    const world = screen.getByTestId('mock-labyrinth-world');

    // Solve Level 10: T - E - M - P - L - E
    fireEvent.click(screen.getByTestId('keystone-T'));
    const allE = screen.getAllByTestId('keystone-E');
    fireEvent.click(allE[0]);
    fireEvent.click(screen.getByTestId('keystone-M'));
    fireEvent.click(screen.getByTestId('keystone-P'));
    fireEvent.click(screen.getByTestId('keystone-L'));
    fireEvent.click(allE[1] || allE[0]);

    // Check 3D victory moment is active
    expect(world.getAttribute('data-unlocked')).toBe('true');
    expect(world.getAttribute('data-victory')).toBe('true');

    // Advance 2000ms victory moment timer
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Victory panel must be visible
    const panel = screen.getByTestId('labyrinth-victory-panel');
    expect(panel).toBeInTheDocument();

    // Check Title
    expect(screen.getByText('Temple Conquered!')).toBeInTheDocument();

    // Check Message
    expect(screen.getByText('Amazing work! You solved every word!')).toBeInTheDocument();

    // Check Three gold stars celebratory reward
    const starsContainer = screen.getByTestId('victory-stars');
    expect(starsContainer).toBeInTheDocument();
    expect(starsContainer.children.length).toBe(3);

    // Check Actual final score
    const finalScore = screen.getByTestId('final-score');
    expect(finalScore).toBeInTheDocument();
    expect(finalScore.textContent).toContain('pts');

    // Check Buttons
    expect(screen.getByTestId('play-again-btn')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-games-btn')).toBeInTheDocument();

    // Advance further (5000ms) to ensure progression NEVER wraps back to Level 1
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Level 1 chamber must NOT be active
    expect(screen.queryByText('Chamber of Whispering Doors')).not.toBeInTheDocument();
    expect(screen.getByText('Temple Conquered!')).toBeInTheDocument();
  });

  it('prevents further scoring or keystone clicks after game completion', () => {
    const childId = 'guard-child';
    saveLabyrinthCheckpoint(childId, 9);

    render(<LabyrinthApp childId={childId} onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Complete Level 10
    fireEvent.click(screen.getByTestId('keystone-T'));
    const allE = screen.getAllByTestId('keystone-E');
    fireEvent.click(allE[0]);
    fireEvent.click(screen.getByTestId('keystone-M'));
    fireEvent.click(screen.getByTestId('keystone-P'));
    fireEvent.click(screen.getByTestId('keystone-L'));
    fireEvent.click(allE[1] || allE[0]);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const scoreBefore = screen.getByTestId('final-score').textContent;

    // Attempt to click remaining distractors or buttons
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      if (btn.getAttribute('data-id')?.startsWith('glyph-')) {
        fireEvent.click(btn);
      }
    });

    // Score remains strictly unchanged
    expect(screen.getByTestId('final-score').textContent).toBe(scoreBefore);
  });

  it('clicking Play Again resets to Level 1, resets score and stars to 0, clears guards, and resets checkpoint', () => {
    const childId = 'replay-child';
    saveLabyrinthCheckpoint(childId, 9);

    render(<LabyrinthApp childId={childId} onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Complete Level 10
    fireEvent.click(screen.getByTestId('keystone-T'));
    const allE = screen.getAllByTestId('keystone-E');
    fireEvent.click(allE[0]);
    fireEvent.click(screen.getByTestId('keystone-M'));
    fireEvent.click(screen.getByTestId('keystone-P'));
    fireEvent.click(screen.getByTestId('keystone-L'));
    fireEvent.click(allE[1] || allE[0]);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('labyrinth-victory-panel')).toBeInTheDocument();

    // Click "Play Again"
    fireEvent.click(screen.getByTestId('play-again-btn'));

    // Victory modal should be dismissed
    expect(screen.queryByTestId('labyrinth-victory-panel')).not.toBeInTheDocument();

    // Game should be back at Level 1 ('OPEN')
    expect(screen.getByText('Chamber of Whispering Doors')).toBeInTheDocument();
    expect(screen.getByText('0 / 4')).toBeInTheDocument();
    expect(screen.getByText('0 PTS')).toBeInTheDocument();

    // Checkpoint in localStorage must be reset to 0 so reopening does not resume at Level 10
    expect(loadLabyrinthCheckpoint(childId)).toBe(0);

    // Can immediately play Level 1
    const btnO = screen.getByTestId('keystone-O');
    expect(btnO.getAttribute('data-is-next')).toBe('true');
    fireEvent.click(btnO);
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
  });

  it('clicking Back to Games navigates back using existing handler and avoids duplicate session saves', async () => {
    // AncientLabyrinthGame wrapper has activeChild { id: 1 } in mock AppContext
    saveLabyrinthCheckpoint(1, 9);

    render(
      <MemoryRouter>
        <AncientLabyrinthGame />
      </MemoryRouter>
    );

    // Complete Level 10 in full game wrapper
    act(() => {
      fireEvent.click(screen.getByTestId('keystone-T'));
      const allE = screen.getAllByTestId('keystone-E');
      fireEvent.click(allE[0]);
      fireEvent.click(screen.getByTestId('keystone-M'));
      fireEvent.click(screen.getByTestId('keystone-P'));
      fireEvent.click(screen.getByTestId('keystone-L'));
      fireEvent.click(allE[1] || allE[0]);
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('labyrinth-victory-panel')).toBeInTheDocument();

    // Click "Back to Games" on the victory panel
    await act(async () => {
      fireEvent.click(screen.getByTestId('back-to-games-btn'));
    });

    // Verify session save was triggered exactly once
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);

    // Repeated clicks should NOT cause duplicate session saves
    await act(async () => {
      fireEvent.click(screen.getByTestId('back-to-games-btn'));
    });
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });
});

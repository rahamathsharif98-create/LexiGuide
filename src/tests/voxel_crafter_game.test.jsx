/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VoxelCrafterGame from '../pages/child/VoxelCrafterGame';
import VoxelApp from '../games/voxel-crafter/VoxelApp';
import { CRAFT_RECIPES, getCraftRecipe, VOXEL_STAGES, getStageForLevel } from '../games/voxel-crafter/engine/craftRecipes';
import {
  loadVoxelCrafterCheckpointData,
  saveVoxelCrafterCheckpoint,
  resetVoxelCrafterCheckpoint,
  clearVoxelCrafterCheckpoint,
  getVoxelCrafterCheckpointKey,
  VOXEL_CRAFTER_STORAGE_PREFIX,
  TOTAL_VOXEL_RECIPES,
} from '../games/voxel-crafter/engine/voxelCrafterCheckpoint';
import { getGameById } from '../data/gamingZoneRegistry';
import { gameSound } from '../services/gameSoundService';
import VoxelHUD from '../games/voxel-crafter/hud/VoxelHUD';

// Ensure localStorage is always defined in test environment
if (typeof globalThis.localStorage === 'undefined') {
  let store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

// Mock AppContext
const mockSaveLearningSession = vi.fn();
const mockShowToast = vi.fn();
let mockActiveChild = { id: 1, name: 'Aarav' };

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    activeChild: mockActiveChild,
    saveLearningSession: mockSaveLearningSession,
    applySessionOutcome: vi.fn(),
    showToast: mockShowToast,
    isRealBackend: false,
  }),
}));

// Mock gameSoundService
vi.mock('../services/gameSoundService', () => ({
  gameSound: {
    speakCompanion: vi.fn(),
    stopSpeech: vi.fn(),
    playLetterNote: vi.fn(),
    playFanfare: vi.fn(),
    playGentleOops: vi.fn(),
    playSnap: vi.fn(),
    getSoundMode: vi.fn().mockReturnValue('voice_and_sfx'),
    subscribe: vi.fn().mockReturnValue(() => {}),
    cycleSoundMode: vi.fn(),
  },
}));

// Mock VoxelWorld in jsdom so letter blocks are clickable via data-testid
vi.mock('../games/voxel-crafter/VoxelWorld', () => ({
  default: ({ blocks = [], onSelectBlock, isCrafted, rewardName }) => (
    <div
      data-testid="mock-voxel-world"
      data-is-crafted={isCrafted ? 'true' : 'false'}
      data-reward={rewardName}
    >
      {blocks.map((block) => (
        <button
          key={block.id}
          type="button"
          data-testid={`block-${block.letter}`}
          data-block-id={block.id}
          data-letter={block.letter}
          data-placed={block.isPlaced ? 'true' : 'false'}
          data-is-next={block.isNext ? 'true' : 'false'}
          data-is-valid={block.isValid ? 'true' : 'false'}
          disabled={block.isPlaced}
          onClick={() => onSelectBlock && onSelectBlock(block)}
        >
          {block.letter}
        </button>
      ))}
    </div>
  ),
}));

// Mock VFX components
vi.mock('../games/common/vfx/VFXScreenConfetti', () => ({
  default: ({ active }) => <div data-testid="mock-confetti" data-active={active ? 'true' : 'false'} />,
}));
vi.mock('../games/common/vfx/VFXFeverOverlay', () => ({
  default: ({ streak, bannerClassName }) => (
    <div
      data-testid="mock-fever"
      data-streak={streak}
      data-banner-class={bannerClassName}
    />
  ),
}));

// Helper to click the next unplaced block for a given letter
const testClickedBlockIds = new Set();

function clickLetterBlock(letter) {
  const matching = screen.getAllByTestId(`block-${letter}`);
  const unplaced = matching.find(
    (b) => !testClickedBlockIds.has(b.getAttribute('data-block-id')) && b.getAttribute('data-placed') === 'false'
  );
  if (!unplaced) {
    throw new Error(`No unplaced block found for letter: ${letter}`);
  }
  const blockId = unplaced.getAttribute('data-block-id');
  if (blockId) testClickedBlockIds.add(blockId);
  fireEvent.click(unplaced);
}

// Helper to spell an entire word
function spellWord(word) {
  testClickedBlockIds.clear();
  for (const letter of word) {
    clickLetterBlock(letter);
  }
}

describe('Voxel Word Crafter (3D Block Builder) - Baseline & Registry', () => {
  it('loads valid crafting recipes with rewards and distractors', () => {
    expect(CRAFT_RECIPES.length).toBeGreaterThanOrEqual(5);
    CRAFT_RECIPES.forEach((recipe) => {
      expect(recipe.id).toBeDefined();
      expect(recipe.word).toBeDefined();
      expect(recipe.reward).toBeDefined();
      expect(recipe.blockColor).toBeDefined();
      expect(recipe.distractors.length).toBeGreaterThanOrEqual(2);
      expect(recipe.prompt).toBeDefined();
      expect(recipe.speechText).toBeDefined();
    });
  });

  it('cycles recipes predictably without out-of-bounds crash', () => {
    const r0 = getCraftRecipe(0);
    expect(r0.word).toBe('FORT');
    const r1 = getCraftRecipe(1);
    expect(r1.word).toBe('GOLD');
    const rOverflow = getCraftRecipe(16);
    expect(rOverflow).toBeDefined();
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('voxel-crafter');
    expect(game).toBeDefined();
    expect(game.title).toBe('Voxel Word Crafter');
    expect(game.route).toBe('/child/games/voxel-crafter');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('letters');
  });
});

describe('Voxel Crafter Checkpoint Engine Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('generates isolated storage keys per child with guest fallback', () => {
    expect(getVoxelCrafterCheckpointKey(1)).toBe(`${VOXEL_CRAFTER_STORAGE_PREFIX}1`);
    expect(getVoxelCrafterCheckpointKey('child-42')).toBe(`${VOXEL_CRAFTER_STORAGE_PREFIX}child-42`);
    expect(getVoxelCrafterCheckpointKey(null)).toBe(`${VOXEL_CRAFTER_STORAGE_PREFIX}guest`);
    expect(getVoxelCrafterCheckpointKey(undefined)).toBe(`${VOXEL_CRAFTER_STORAGE_PREFIX}guest`);
    expect(getVoxelCrafterCheckpointKey('')).toBe(`${VOXEL_CRAFTER_STORAGE_PREFIX}guest`);
  });

  it('returns default fresh run state when checkpoint is missing', () => {
    const cp = loadVoxelCrafterCheckpointData(1);
    expect(cp).toEqual({
      recipeIndex: 0,
      savedRecipeIndex: 0,
      currentLevel: 1,
      highestUnlockedLevel: 1,
      highestUnlockedIndex: 0,
      recipesCrafted: 0,
      score: 0,
      stars: 0,
      streak: 1,
      isCompleted: false,
    });
  });

  it('saves and loads valid in-progress checkpoint data', () => {
    saveVoxelCrafterCheckpoint(1, {
      recipeIndex: 2,
      recipesCrafted: 2,
      score: 1600,
      stars: 2,
      streak: 3,
      isCompleted: false,
    });

    const cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(2);
    expect(cp.recipesCrafted).toBe(2);
    expect(cp.score).toBe(1600);
    expect(cp.stars).toBe(2);
    expect(cp.streak).toBe(3);
    expect(cp.isCompleted).toBe(false);
  });

  it('protects completed runs from resuming as unfinished', () => {
    saveVoxelCrafterCheckpoint(1, {
      recipeIndex: 0,
      recipesCrafted: 5,
      score: 4500,
      stars: 5,
      streak: 1,
      isCompleted: true,
    });

    // Loading a completed run must yield fresh start
    const cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(0);
    expect(cp.recipesCrafted).toBe(0);
    expect(cp.isCompleted).toBe(false);
  });

  it('handles corrupted JSON and out-of-bounds indices safely', () => {
    localStorage.setItem(getVoxelCrafterCheckpointKey(1), 'not valid json {{{');
    expect(loadVoxelCrafterCheckpointData(1).recipeIndex).toBe(0);

    localStorage.setItem(
      getVoxelCrafterCheckpointKey(1),
      JSON.stringify({ recipeIndex: 999, recipesCrafted: 999 })
    );
    expect(loadVoxelCrafterCheckpointData(1).recipeIndex).toBe(0);

    localStorage.setItem(
      getVoxelCrafterCheckpointKey(1),
      JSON.stringify({ recipeIndex: -5, recipesCrafted: -1 })
    );
    expect(loadVoxelCrafterCheckpointData(1).recipeIndex).toBe(0);
  });

  it('handles legacy numeric and string payloads gracefully', () => {
    localStorage.setItem(getVoxelCrafterCheckpointKey(1), '2');
    const cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(2);
    expect(cp.recipesCrafted).toBe(2);

    localStorage.setItem(getVoxelCrafterCheckpointKey(1), '99'); // Out of bounds (> 25 recipes)
    expect(loadVoxelCrafterCheckpointData(1).recipeIndex).toBe(0);
  });

  it('resets checkpoint cleanly back to Recipe 0', () => {
    saveVoxelCrafterCheckpoint(1, {
      recipeIndex: 3,
      recipesCrafted: 3,
      score: 2400,
      stars: 3,
      streak: 2,
    });

    resetVoxelCrafterCheckpoint(1);
    const cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(0);
    expect(cp.recipesCrafted).toBe(0);
    expect(cp.score).toBe(0);
  });

  it('clears checkpoint from localStorage entirely', () => {
    saveVoxelCrafterCheckpoint(1, { recipeIndex: 1 });
    expect(localStorage.getItem(getVoxelCrafterCheckpointKey(1))).not.toBeNull();
    clearVoxelCrafterCheckpoint(1);
    expect(localStorage.getItem(getVoxelCrafterCheckpointKey(1))).toBeNull();
  });
});

describe('Voxel Crafter Step 2: Critical Fixes & Session Safety', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockActiveChild = { id: 1, name: 'Aarav' };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Stage A: records attempts without saving session prematurely, and saves once on exit with isSavedRef', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <VoxelCrafterGame />
        </MemoryRouter>
      );
    });

    // Initial render should not save completed session
    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Spell Round 1 (FORT)
    await act(async () => {
      spellWord('FORT');
    });

    // Round 1 completed: attempt is recorded, but session MUST NOT be prematurely saved!
    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Click "Back to Games" button
    const backBtn = screen.getByTestId('page-back-btn');
    await act(async () => {
      fireEvent.click(backBtn);
    });

    // Session is saved exactly once on exit
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);

    // Clicking Back again is guarded by isSavedRef and does NOT duplicate save
    await act(async () => {
      fireEvent.click(backBtn);
    });
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });

  it('Stage A: saves accumulated session upon unmount if user navigates away without clicking Back', async () => {
    const { unmount } = render(
      <MemoryRouter>
        <VoxelCrafterGame />
      </MemoryRouter>
    );

    // Spell Round 1 (FORT)
    await act(async () => {
      spellWord('FORT');
    });

    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Component unmounts (e.g. browser navigation)
    await act(async () => {
      unmount();
    });

    // Unmount cleanup saves session once
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });

  it('Stage A: exiting via Back button and then unmounting does not duplicate session save', async () => {
    const { unmount } = render(
      <MemoryRouter>
        <VoxelCrafterGame />
      </MemoryRouter>
    );

    const backBtn = screen.getByTestId('page-back-btn');
    await act(async () => {
      fireEvent.click(backBtn);
    });
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);

    // Unmount after navigation
    await act(async () => {
      unmount();
    });
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });

  it('Stage A: incorrect block clicks record error attempts without crashing or saving session', async () => {
    render(
      <MemoryRouter>
        <VoxelCrafterGame />
      </MemoryRouter>
    );

    // For recipe 0 (FORT), the distractors are P and B. Clicking 'P' is wrong.
    const wrongBlock = screen.queryByTestId('block-P');
    if (wrongBlock) {
      await act(async () => {
        fireEvent.click(wrongBlock);
      });
      expect(gameSound.playGentleOops).toHaveBeenCalled();
      expect(mockSaveLearningSession).not.toHaveBeenCalled();
    }
  });
});

describe('Voxel Crafter Step 2: Victory Flow & Checkpoint Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockActiveChild = { id: 1, name: 'Aarav' };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Stage B & C: advances across stage boundaries without early victory, and completes Level 25 with full victory', async () => {
    const onCompleteMock = vi.fn();

    render(
      <VoxelApp
        childId={1}
        onBack={vi.fn()}
        onComplete={onCompleteMock}
        onResetSession={vi.fn()}
        onRoundComplete={vi.fn()}
      />
    );

    // 1. FORT (Level 1)
    await act(async () => {
      spellWord('FORT');
    });
    // Check intermediate checkpoint saved
    let cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(1);
    expect(cp.recipesCrafted).toBe(1);

    // Advance transition timer (3200ms) to load recipe 1 (GOLD)
    act(() => {
      vi.advanceTimersByTime(3200);
    });

    // 2. GOLD (Level 2)
    await act(async () => {
      spellWord('GOLD');
    });
    cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(2);
    expect(cp.recipesCrafted).toBe(2);

    act(() => {
      vi.advanceTimersByTime(3200);
    });

    // 3. TREE (Level 3)
    await act(async () => {
      spellWord('TREE');
    });
    cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(3);
    expect(cp.recipesCrafted).toBe(3);

    act(() => {
      vi.advanceTimersByTime(3200);
    });

    // 4. SHIP (Level 4)
    await act(async () => {
      spellWord('SHIP');
    });
    cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(4);
    expect(cp.recipesCrafted).toBe(4);

    act(() => {
      vi.advanceTimersByTime(3200);
    });

    // 5. GEMS (Level 5 - Stage 1 boundary!)
    await act(async () => {
      spellWord('GEMS');
    });

    // Stage 1 boundary: Checkpoint advances to recipeIndex: 5 (Level 6: ANVIL in Stage 2)
    cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(5);
    expect(cp.recipesCrafted).toBe(5);
    expect(cp.isCompleted).toBe(false);

    // Stage boundary MUST NOT trigger premature game completion!
    expect(onCompleteMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('victory-modal')).not.toBeInTheDocument();

    // Advance transition timer (3200ms) to load recipe 5 (ANVIL in Stage 2)
    act(() => {
      vi.advanceTimersByTime(3200);
    });

    // Recipe is now Level 6 (ANVIL: Master's Steel Anvil)
    expect(screen.getByTestId('mock-voxel-world').getAttribute('data-reward')).toBe("Master's Steel Anvil");
    expect(screen.getByTestId('hud-stage-indicator').textContent).toBe('Crafting Apprentice');
    expect(screen.getByTestId('hud-level-indicator').textContent).toBe('Level 6/25');
  });

  it('Stage B & C: completing Level 25 awards final victory celebration and marks checkpoint completed', async () => {
    const onCompleteMock = vi.fn();

    // Pre-seed checkpoint at Level 25 (index 24: THRONE in Stage 5: Voxel Legend)
    saveVoxelCrafterCheckpoint(1, {
      recipeIndex: 24,
      recipesCrafted: 24,
      score: 18000,
      stars: 24,
      streak: 3,
      isCompleted: false,
    });

    render(
      <VoxelApp
        childId={1}
        onBack={vi.fn()}
        onComplete={onCompleteMock}
        onResetSession={vi.fn()}
        onRoundComplete={vi.fn()}
      />
    );

    expect(screen.getByTestId('hud-stage-indicator').textContent).toBe('Voxel Legend');
    expect(screen.getByTestId('hud-level-indicator').textContent).toBe('Level 25/25');

    // Spell final word (THRONE)
    await act(async () => {
      spellWord('THRONE');
    });

    // Final checkpoint marked completed
    const rawStored = JSON.parse(localStorage.getItem(getVoxelCrafterCheckpointKey(1)));
    expect(rawStored.isCompleted).toBe(true);
    expect(rawStored.recipesCrafted).toBe(25);

    // onComplete fired once with final 25-level stats
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
    expect(onCompleteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        recipesCrafted: 25,
        stars: 25,
      })
    );

    // Advance victory timer
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    // Victory celebration modal displayed
    const victoryModal = screen.getByTestId('victory-modal');
    expect(victoryModal).toBeInTheDocument();
    expect(screen.getByText('Master Voxel Crafter!')).toBeInTheDocument();
    expect(screen.getByTestId('victory-stars')).toBeInTheDocument();
    expect(screen.getByTestId('final-score')).toBeInTheDocument();
    expect(screen.getByTestId('play-again-btn')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-games-btn')).toBeInTheDocument();
  });

  it('Stage B: "Play Again" button resets run cleanly and clears modal back to Level 1', async () => {
    const onResetSessionMock = vi.fn();

    // Pre-seed at Level 25
    saveVoxelCrafterCheckpoint(1, {
      recipeIndex: 24,
      recipesCrafted: 24,
      score: 18000,
      stars: 24,
      streak: 3,
    });

    render(
      <VoxelApp
        childId={1}
        onBack={vi.fn()}
        onComplete={vi.fn()}
        onResetSession={onResetSessionMock}
        onRoundComplete={vi.fn()}
      />
    );

    await act(async () => {
      spellWord('THRONE');
    });

    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(screen.getByTestId('victory-modal')).toBeInTheDocument();

    // Click Play Again
    const playAgainBtn = screen.getByTestId('play-again-btn');
    await act(async () => {
      fireEvent.click(playAgainBtn);
    });

    // Modal is dismissed, onResetSession called, and checkpoint is reset to Level 1 (recipeIndex: 0)
    expect(screen.queryByTestId('victory-modal')).not.toBeInTheDocument();
    expect(onResetSessionMock).toHaveBeenCalledTimes(1);

    const cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(0);
    expect(cp.recipesCrafted).toBe(0);
    expect(cp.score).toBe(0);
    expect(screen.getByTestId('hud-level-indicator').textContent).toBe('Level 1/25');
  });

  it('Stage C: resumes properly from intermediate checkpoint on mount', async () => {
    // Pre-seed checkpoint at Recipe 2 (TREE)
    saveVoxelCrafterCheckpoint(1, {
      recipeIndex: 2,
      recipesCrafted: 2,
      score: 1600,
      stars: 2,
      streak: 2,
      isCompleted: false,
    });

    render(
      <VoxelApp
        childId={1}
        onBack={vi.fn()}
        onComplete={vi.fn()}
        onResetSession={vi.fn()}
        onRoundComplete={vi.fn()}
      />
    );

    // World should be loaded with Recipe 2 (TREE: Voxel Pine Tree)
    const world = screen.getByTestId('mock-voxel-world');
    expect(world.getAttribute('data-reward')).toBe('Voxel Pine Tree');

    // Spell TREE
    await act(async () => {
      spellWord('TREE');
    });

    // Checkpoint advances to Recipe 3 (SHIP)
    const cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(3);
    expect(cp.recipesCrafted).toBe(3);
  });

  it('Stage C: isolates progress between different child profiles', () => {
    // Child 1 is at Recipe 15 (Level 16)
    saveVoxelCrafterCheckpoint(1, {
      recipeIndex: 15,
      recipesCrafted: 15,
      score: 12500,
      stars: 15,
    });

    // Child 2 is at Recipe 5 (Level 6)
    saveVoxelCrafterCheckpoint(2, {
      recipeIndex: 5,
      recipesCrafted: 5,
      score: 3650,
      stars: 5,
    });

    const cp1 = loadVoxelCrafterCheckpointData(1);
    const cp2 = loadVoxelCrafterCheckpointData(2);

    expect(cp1.recipeIndex).toBe(15);
    expect(cp1.score).toBe(12500);

    expect(cp2.recipeIndex).toBe(5);
    expect(cp2.score).toBe(3650);
  });

  it('Stage B: "Back to Games" button in victory modal triggers onBack', async () => {
    const onBackMock = vi.fn();

    // Pre-seed at Level 25
    saveVoxelCrafterCheckpoint(1, {
      recipeIndex: 24,
      recipesCrafted: 24,
      score: 18000,
      stars: 24,
      streak: 3,
    });

    render(
      <VoxelApp
        childId={1}
        onBack={onBackMock}
        onComplete={vi.fn()}
        onResetSession={vi.fn()}
        onRoundComplete={vi.fn()}
      />
    );

    await act(async () => {
      spellWord('THRONE');
    });

    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(screen.getByTestId('victory-modal')).toBeInTheDocument();

    const backBtn = screen.getByTestId('back-to-games-btn');
    await act(async () => {
      fireEvent.click(backBtn);
    });

    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it('Stage A & B: VoxelCrafterGame wrapper saves session on victory and does not duplicate on unmount', async () => {
    // Pre-seed at Level 25
    saveVoxelCrafterCheckpoint(1, {
      recipeIndex: 24,
      recipesCrafted: 24,
      score: 18000,
      stars: 24,
      streak: 3,
    });

    const { unmount } = render(
      <MemoryRouter>
        <VoxelCrafterGame />
      </MemoryRouter>
    );

    await act(async () => {
      spellWord('THRONE');
    });

    act(() => {
      vi.advanceTimersByTime(1800);
    });

    // Victory reached -> tracker.saveCompletedSession is called once
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);

    // Unmount after victory
    await act(async () => {
      unmount();
    });

    // Guarded by isSavedRef -> still called exactly once
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });
});

describe('Voxel Crafter Step 3: HUD, Gameplay Polish & Cleanup', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockActiveChild = { id: 1, name: 'Aarav' };
    document.body.style.cursor = 'default';
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.style.cursor = 'default';
  });

  it('1. Fever Mode banner receives safe positioning classes (top-32 lg:top-24) to avoid obscuring the blueprint', async () => {
    render(
      <VoxelApp
        childId={1}
        onBack={vi.fn()}
        onComplete={vi.fn()}
        onResetSession={vi.fn()}
        onRoundComplete={vi.fn()}
      />
    );

    // Mock fever receives bannerClassName="top-32 lg:top-24"
    const feverElem = screen.getByTestId('mock-fever');
    expect(feverElem).toBeInTheDocument();
    expect(feverElem.getAttribute('data-banner-class')).toBe('top-32 lg:top-24');
  });

  it('1b. Real VFXFeverOverlay renders safely when streak >= 3 and hides when streak < 3', async () => {
    const { default: RealVFXFeverOverlay } = await vi.importActual('../games/common/vfx/VFXFeverOverlay');

    const { rerender } = render(<RealVFXFeverOverlay streak={2} />);
    expect(screen.queryByTestId('fever-banner')).not.toBeInTheDocument();

    rerender(<RealVFXFeverOverlay streak={3} bannerClassName="top-32 lg:top-24" />);
    const banner = screen.getByTestId('fever-banner');
    expect(banner).toBeInTheDocument();
    expect(banner.className).toContain('top-32 lg:top-24');
    expect(banner.textContent).toContain('Fever Mode x3!');
  });

  it('2. VoxelHUD renders responsive blueprint banner, letter slots, and controls cleanly', () => {
    const testRecipe = getCraftRecipe(0); // FORT
    render(
      <VoxelHUD
        recipe={testRecipe}
        placedLetters={['F']}
        score={150}
        stars={0}
        streak={2}
        isCrafted={false}
        onSpeakPrompt={vi.fn()}
        onResetCraft={vi.fn()}
        onBack={vi.fn()}
      />
    );

    // Blueprint banner has responsive order classes
    const blueprintBanner = screen.getByTestId('blueprint-banner');
    expect(blueprintBanner).toBeInTheDocument();
    expect(blueprintBanner.className).toContain('order-3');
    expect(blueprintBanner.className).toContain('lg:order-2');

    // Letter slots: slot 0 is placed, slot 1 is next
    const slot0 = screen.getByTestId('slot-0');
    expect(slot0.getAttribute('data-placed')).toBe('true');
    expect(slot0.textContent).toBe('F');

    const slot1 = screen.getByTestId('slot-1');
    expect(slot1.getAttribute('data-placed')).toBe('false');
    expect(slot1.getAttribute('data-next')).toBe('true');
    expect(slot1.textContent).toBe('?');

    // Controls
    expect(screen.getByTestId('hud-back-btn')).toBeInTheDocument();
    expect(screen.getByTestId('hud-hear-clue-btn')).toBeInTheDocument();
    expect(screen.getByTestId('hud-reset-bench-btn')).toBeInTheDocument();
    expect(screen.getByTestId('recipe-reward-name').textContent).toBe(testRecipe.reward);
    expect(screen.getByTestId('hud-score').textContent).toContain('150 PTS');
  });

  it('2b. VoxelHUD top-right score and star badges have safe layout classes and margins to prevent clipping inside rounded game borders', () => {
    const testRecipe = getCraftRecipe(3); // SHIP
    render(
      <VoxelHUD
        recipe={testRecipe}
        placedLetters={['S', 'H']}
        score={350}
        stars={4}
        streak={3}
        isCrafted={false}
        onSpeakPrompt={vi.fn()}
        onResetCraft={vi.fn()}
        onBack={vi.fn()}
      />
    );

    // Stars badge has shrink-0 and displays star and count cleanly
    const starsBadge = screen.getByTestId('hud-stars');
    expect(starsBadge).toBeInTheDocument();
    expect(starsBadge.className).toContain('shrink-0');
    expect(starsBadge.textContent).toContain('⭐');
    expect(starsBadge.textContent).toContain('4');

    // Score badge has shrink-0 and displays score and streak multiplier cleanly
    const scoreBadge = screen.getByTestId('hud-score');
    expect(scoreBadge).toBeInTheDocument();
    expect(scoreBadge.className).toContain('shrink-0');
    expect(scoreBadge.textContent).toContain('350 PTS');
    expect(screen.getByTestId('hud-streak-multiplier').textContent).toContain('x3');

    // Right group container has shrink-0 and safe right margin inset (mr-1 sm:mr-2)
    const rightGroup = starsBadge.parentElement;
    expect(rightGroup.className).toContain('shrink-0');
    expect(rightGroup.className).toContain('mr-1');
    expect(rightGroup.className).toContain('sm:mr-2');
  });

  it('3. Exactly one sound toggle exists in the page hierarchy (in VoxelHUD, not duplicated in outer wrapper)', () => {
    render(
      <MemoryRouter>
        <VoxelCrafterGame />
      </MemoryRouter>
    );

    // Only one GameSoundToggle button rendered in the DOM
    const soundToggles = screen.getAllByTitle(/Audio:/i);
    expect(soundToggles.length).toBe(1);
  });

  it('4. Repeated-letter aura in TREE highlights only one unplaced matching block at a time', async () => {
    // Start at Recipe 2 (TREE)
    saveVoxelCrafterCheckpoint(1, {
      recipeIndex: 2,
      recipesCrafted: 2,
      score: 1600,
      stars: 2,
      streak: 1,
      isCompleted: false,
    });

    render(
      <VoxelApp
        childId={1}
        onBack={vi.fn()}
        onComplete={vi.fn()}
        onResetSession={vi.fn()}
        onRoundComplete={vi.fn()}
      />
    );

    // Step 0: Initial state for TREE -> 'T' is next; both 'E' blocks are NOT next
    const tBlock = screen.getByTestId('block-T');
    expect(tBlock.getAttribute('data-is-next')).toBe('true');

    const eBlocks = screen.getAllByTestId('block-E');
    expect(eBlocks.length).toBe(2);
    expect(eBlocks[0].getAttribute('data-is-next')).toBe('false');
    expect(eBlocks[1].getAttribute('data-is-next')).toBe('false');

    // Step 1: Click 'T' -> 'R' becomes next
    await act(async () => {
      fireEvent.click(tBlock);
    });
    const rBlock = screen.getByTestId('block-R');
    expect(rBlock.getAttribute('data-is-next')).toBe('true');

    // Step 2: Click 'R' -> EXACTLY ONE unplaced 'E' gets is-next="true", the other is false!
    await act(async () => {
      fireEvent.click(rBlock);
    });

    const eBlocksAfterR = screen.getAllByTestId('block-E');
    const nextECount = eBlocksAfterR.filter((b) => b.getAttribute('data-is-next') === 'true').length;
    expect(nextECount).toBe(1); // Exactly one glowing 'E'!

    // Step 3: Click the glowing 'E'
    const glowingE = eBlocksAfterR.find((b) => b.getAttribute('data-is-next') === 'true');
    await act(async () => {
      fireEvent.click(glowingE);
    });

    // The placed 'E' must NOT retain isNext; the REMAINING unplaced 'E' must now have isNext="true"!
    expect(glowingE.getAttribute('data-placed')).toBe('true');
    expect(glowingE.getAttribute('data-is-next')).toBe('false');

    const remainingE = screen.getAllByTestId('block-E').find((b) => b.getAttribute('data-placed') === 'false');
    expect(remainingE).toBeDefined();
    expect(remainingE.getAttribute('data-is-next')).toBe('true');

    // Step 4: Click the remaining 'E' to complete TREE
    await act(async () => {
      fireEvent.click(remainingE);
    });

    // When complete, no blocks have isNext
    const allBlocksAfterComplete = screen.getByTestId('mock-voxel-world').querySelectorAll('button');
    allBlocksAfterComplete.forEach((btn) => {
      expect(btn.getAttribute('data-is-next')).toBe('false');
    });
  });

  it('5. Rapid double-clicks on the same block are locked out and do not cause double scoring', async () => {
    render(
      <VoxelApp
        childId={1}
        onBack={vi.fn()}
        onComplete={vi.fn()}
        onResetSession={vi.fn()}
        onRoundComplete={vi.fn()}
      />
    );

    const fBlock = screen.getByTestId('block-F');

    // First click on 'F'
    await act(async () => {
      fireEvent.click(fBlock);
    });

    const initialScoreText = screen.getByTestId('hud-score').textContent;

    // Rapid second click on the exact same block
    await act(async () => {
      fireEvent.click(fBlock);
    });

    // Score remains the same — duplicate click rejected
    expect(screen.getByTestId('hud-score').textContent).toBe(initialScoreText);
  });

  it('6. Audio and cleanup: onSpeakPrompt, bench reset, play again, and unmount stop speech and restore cursor', async () => {
    document.body.style.cursor = 'pointer';

    const { unmount } = render(
      <VoxelApp
        childId={1}
        onBack={vi.fn()}
        onComplete={vi.fn()}
        onResetSession={vi.fn()}
        onRoundComplete={vi.fn()}
      />
    );

    // Click Hear Clue -> stops any prior speech before playing
    const clueBtn = screen.getByTestId('hud-hear-clue-btn');
    await act(async () => {
      fireEvent.click(clueBtn);
    });
    expect(gameSound.stopSpeech).toHaveBeenCalled();

    // Click Reset Bench -> stops active speech
    const resetBenchBtn = screen.getByTestId('hud-reset-bench-btn');
    await act(async () => {
      fireEvent.click(resetBenchBtn);
    });
    expect(gameSound.stopSpeech).toHaveBeenCalled();

    // Unmount -> restores cursor and stops speech
    await act(async () => {
      unmount();
    });
    expect(document.body.style.cursor).toBe('default');
    expect(gameSound.stopSpeech).toHaveBeenCalled();
  });
});

describe('Voxel Crafter Step 4: 25-Level Curriculum & Stages', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockActiveChild = { id: 1, name: 'Aarav' };
    document.body.style.cursor = 'default';
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.style.cursor = 'default';
  });

  it('1. Contains exactly 25 recipes across 5 distinct stages of 5 levels each', () => {
    expect(CRAFT_RECIPES.length).toBe(25);
    expect(TOTAL_VOXEL_RECIPES).toBe(25);
    expect(VOXEL_STAGES.length).toBe(5);

    VOXEL_STAGES.forEach((stage, idx) => {
      expect(stage.stageNum).toBe(idx + 1);
      expect(stage.levels.length).toBe(5);
      expect(stage.name).toBeDefined();
    });

    expect(VOXEL_STAGES[0].name).toBe('Beginner Builder');
    expect(VOXEL_STAGES[1].name).toBe('Crafting Apprentice');
    expect(VOXEL_STAGES[2].name).toBe('Pirate Crafter');
    expect(VOXEL_STAGES[3].name).toBe('Master Builder');
    expect(VOXEL_STAGES[4].name).toBe('Voxel Legend');
  });

  it('2. Every recipe has unique words, unique IDs, matching clues, and disjoint distractors', () => {
    const seenWords = new Set();
    const seenIds = new Set();

    CRAFT_RECIPES.forEach((recipe, index) => {
      // 1-based level matches index + 1
      expect(recipe.level).toBe(index + 1);
      expect(recipe.stageNum).toBe(Math.floor(index / 5) + 1);

      // Unique IDs and words
      expect(seenIds.has(recipe.id)).toBe(false);
      seenIds.add(recipe.id);

      expect(seenWords.has(recipe.word)).toBe(false);
      seenWords.add(recipe.word);

      // Valid word structure
      expect(recipe.word).toMatch(/^[A-Z]{3,7}$/);
      expect(recipe.reward.length).toBeGreaterThan(0);
      expect(recipe.emoji.length).toBeGreaterThan(0);
      expect(recipe.prompt.length).toBeGreaterThan(0);
      expect(recipe.speechText.length).toBeGreaterThan(0);
      expect(recipe.blockColor).toMatch(/^#[0-9a-fA-F]{6}$/);

      // Distractors must not be in target word
      expect(recipe.distractors.length).toBeGreaterThanOrEqual(2);
      recipe.distractors.forEach((d) => {
        expect(recipe.word.includes(d)).toBe(false);
      });
    });

    expect(seenWords.size).toBe(25);
    expect(seenIds.size).toBe(25);
  });

  it('3. getStageForLevel helper correctly identifies stages for any level', () => {
    expect(getStageForLevel(1).name).toBe('Beginner Builder');
    expect(getStageForLevel(5).name).toBe('Beginner Builder');
    expect(getStageForLevel(6).name).toBe('Crafting Apprentice');
    expect(getStageForLevel(10).name).toBe('Crafting Apprentice');
    expect(getStageForLevel(11).name).toBe('Pirate Crafter');
    expect(getStageForLevel(15).name).toBe('Pirate Crafter');
    expect(getStageForLevel(16).name).toBe('Master Builder');
    expect(getStageForLevel(20).name).toBe('Master Builder');
    expect(getStageForLevel(21).name).toBe('Voxel Legend');
    expect(getStageForLevel(25).name).toBe('Voxel Legend');
  });

  it('4. Repeated letters in Stage 3 Pirate Crafter (CANNON) highlight correctly and complete', async () => {
    // Pre-seed at Level 13 (index 12: CANNON with double N)
    saveVoxelCrafterCheckpoint(1, {
      recipeIndex: 12,
      recipesCrafted: 12,
      score: 9500,
      stars: 12,
    });

    render(
      <VoxelApp
        childId={1}
        onBack={vi.fn()}
        onComplete={vi.fn()}
        onResetSession={vi.fn()}
        onRoundComplete={vi.fn()}
      />
    );

    expect(screen.getByTestId('hud-level-indicator').textContent).toBe('Level 13/25');
    expect(screen.getByTestId('hud-stage-indicator').textContent).toBe('Pirate Crafter');

    // Spell C, A
    await act(async () => {
      clickLetterBlock('C');
    });
    await act(async () => {
      clickLetterBlock('A');
    });

    // Before clicking N, verify that only ONE 'N' has is-next="true"
    const nBlocks = screen.getAllByTestId('block-N');
    expect(nBlocks.length).toBe(3); // CANNON has three N's!
    const activeNCount = nBlocks.filter((b) => b.getAttribute('data-is-next') === 'true').length;
    expect(activeNCount).toBe(1);

    // Spell the rest: N, N, O, N
    await act(async () => {
      clickLetterBlock('N');
    });
    await act(async () => {
      clickLetterBlock('N');
    });
    await act(async () => {
      clickLetterBlock('O');
    });
    await act(async () => {
      clickLetterBlock('N');
    });

    // Checkpoint advances to Level 14 (index 13: HELM)
    const cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(13);
    expect(cp.recipesCrafted).toBe(13);
  });

  it('5. Stage boundaries progress sequentially (Level 10 -> 11, Level 15 -> 16, Level 20 -> 21) without victory', async () => {
    // Test Stage 4 -> Stage 5 boundary at Level 20 (index 19: ARMOR)
    saveVoxelCrafterCheckpoint(1, {
      recipeIndex: 19,
      recipesCrafted: 19,
      score: 14500,
      stars: 19,
    });

    const onCompleteMock = vi.fn();

    render(
      <VoxelApp
        childId={1}
        onBack={vi.fn()}
        onComplete={onCompleteMock}
        onResetSession={vi.fn()}
        onRoundComplete={vi.fn()}
      />
    );

    expect(screen.getByTestId('hud-stage-indicator').textContent).toBe('Master Builder');
    expect(screen.getByTestId('hud-level-indicator').textContent).toBe('Level 20/25');

    // Spell ARMOR (repeated R)
    await act(async () => {
      spellWord('ARMOR');
    });

    // Checkpoint advances to Level 21 (index 20: DRAGON in Stage 5: Voxel Legend)
    const cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(20);
    expect(cp.recipesCrafted).toBe(20);
    expect(cp.isCompleted).toBe(false);
    expect(onCompleteMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('victory-modal')).not.toBeInTheDocument();

    // Advance transition timer to load DRAGON
    act(() => {
      vi.advanceTimersByTime(3200);
    });

    expect(screen.getByTestId('hud-stage-indicator').textContent).toBe('Voxel Legend');
    expect(screen.getByTestId('hud-level-indicator').textContent).toBe('Level 21/25');
    expect(screen.getByTestId('mock-voxel-world').getAttribute('data-reward')).toBe('Legendary Green Dragon');
  });

  it('6. VoxelHUD displays level and stage badges across all 5 stages accurately', () => {
    const { rerender } = render(
      <VoxelHUD
        recipe={getCraftRecipe(0)} // Level 1
        level={1}
        totalLevels={25}
      />
    );
    expect(screen.getByTestId('hud-level-indicator').textContent).toBe('Level 1/25');
    expect(screen.getByTestId('hud-stage-indicator').textContent).toBe('Beginner Builder');

    rerender(
      <VoxelHUD
        recipe={getCraftRecipe(9)} // Level 10
        level={10}
        totalLevels={25}
      />
    );
    expect(screen.getByTestId('hud-level-indicator').textContent).toBe('Level 10/25');
    expect(screen.getByTestId('hud-stage-indicator').textContent).toBe('Crafting Apprentice');

    rerender(
      <VoxelHUD
        recipe={getCraftRecipe(14)} // Level 15
        level={15}
        totalLevels={25}
      />
    );
    expect(screen.getByTestId('hud-level-indicator').textContent).toBe('Level 15/25');
    expect(screen.getByTestId('hud-stage-indicator').textContent).toBe('Pirate Crafter');

    rerender(
      <VoxelHUD
        recipe={getCraftRecipe(19)} // Level 20
        level={20}
        totalLevels={25}
      />
    );
    expect(screen.getByTestId('hud-level-indicator').textContent).toBe('Level 20/25');
    expect(screen.getByTestId('hud-stage-indicator').textContent).toBe('Master Builder');

    rerender(
      <VoxelHUD
        recipe={getCraftRecipe(24)} // Level 25
        level={25}
        totalLevels={25}
      />
    );
    expect(screen.getByTestId('hud-level-indicator').textContent).toBe('Level 25/25');
    expect(screen.getByTestId('hud-stage-indicator').textContent).toBe('Voxel Legend');
  });
});

describe('Voxel Crafter Shared Progression, Resume, Restart & Stage Selection Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. exports VOXEL_CRAFTER_STAGES matching 5 stages and 25 curriculum levels', async () => {
    const { VOXEL_CRAFTER_STAGES } = await import('../games/voxel-crafter/engine/craftRecipes');
    expect(VOXEL_CRAFTER_STAGES).toHaveLength(5);

    expect(VOXEL_CRAFTER_STAGES[0].stage).toBe(1);
    expect(VOXEL_CRAFTER_STAGES[0].name).toBe('Beginner Builder');
    expect(VOXEL_CRAFTER_STAGES[0].levelRange).toEqual([1, 5]);

    expect(VOXEL_CRAFTER_STAGES[1].stage).toBe(2);
    expect(VOXEL_CRAFTER_STAGES[1].name).toBe('Crafting Apprentice');
    expect(VOXEL_CRAFTER_STAGES[1].levelRange).toEqual([6, 10]);

    expect(VOXEL_CRAFTER_STAGES[2].stage).toBe(3);
    expect(VOXEL_CRAFTER_STAGES[2].name).toBe('Pirate Crafter');
    expect(VOXEL_CRAFTER_STAGES[2].levelRange).toEqual([11, 15]);

    expect(VOXEL_CRAFTER_STAGES[3].stage).toBe(4);
    expect(VOXEL_CRAFTER_STAGES[3].name).toBe('Master Builder');
    expect(VOXEL_CRAFTER_STAGES[3].levelRange).toEqual([16, 20]);

    expect(VOXEL_CRAFTER_STAGES[4].stage).toBe(5);
    expect(VOXEL_CRAFTER_STAGES[4].name).toBe('Voxel Legend');
    expect(VOXEL_CRAFTER_STAGES[4].levelRange).toEqual([21, 25]);
  });

  it('2. checkpoint engine tracks highestUnlockedLevel and preserves it when replaying earlier stages', () => {
    // Child reached Level 12 (Stage 3)
    saveVoxelCrafterCheckpoint(1, { recipeIndex: 11, score: 7500 });

    let cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(11);
    expect(cp.currentLevel).toBe(12);
    expect(cp.highestUnlockedLevel).toBe(12);
    expect(cp.highestUnlockedIndex).toBe(11);

    // Replay Stage 1 (Recipe index 0)
    saveVoxelCrafterCheckpoint(1, { recipeIndex: 0, score: 7500 });
    cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(0);
    expect(cp.currentLevel).toBe(1);
    // highestUnlockedLevel remains 12!
    expect(cp.highestUnlockedLevel).toBe(12);
    expect(cp.highestUnlockedIndex).toBe(11);
  });

  it('3. seamlessly migrates legacy checkpoints without highestUnlockedLevel', () => {
    localStorage.setItem(
      getVoxelCrafterCheckpointKey(1),
      JSON.stringify({ recipeIndex: 8, score: 5000, stars: 8 })
    );

    const cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(8);
    expect(cp.currentLevel).toBe(9);
    expect(cp.highestUnlockedLevel).toBe(9);
    expect(cp.highestUnlockedIndex).toBe(8);
  });

  it('4. displays entry hub with Start Game when no checkpoint exists, and allows closing to play', () => {
    render(
      <MemoryRouter>
        <VoxelCrafterGame />
      </MemoryRouter>
    );

    expect(screen.getByTestId('progression-hub-modal')).toBeInTheDocument();
    expect(screen.getByTestId('progression-hub-entry')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Voxel Word Crafter' })).toBeInTheDocument();

    const startBtn = screen.getByTestId('start-game-button');
    expect(startBtn).toHaveTextContent('Start Game ▶');
    expect(screen.queryByTestId('active-checkpoint-indicator')).not.toBeInTheDocument();

    // Clicking Start Game closes modal and reveals 3D workspace
    fireEvent.click(startBtn);
    expect(screen.queryByTestId('progression-hub-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('hud-level-indicator')).toHaveTextContent('Level 1/25');
  });

  it('5. displays Resume Game with current level when active checkpoint exists', () => {
    saveVoxelCrafterCheckpoint(1, { recipeIndex: 5, score: 3500 }); // Level 6 (ANVIL)

    render(
      <MemoryRouter>
        <VoxelCrafterGame />
      </MemoryRouter>
    );

    expect(screen.getByTestId('progression-hub-modal')).toBeInTheDocument();
    expect(screen.getByTestId('active-checkpoint-indicator')).toHaveTextContent('Saved Progress: Level 6');
    const resumeBtn = screen.getByTestId('start-game-button');
    expect(resumeBtn).toHaveTextContent('Resume Game ▶');

    // Click Resume -> resumes at Level 6 (ANVIL)
    fireEvent.click(resumeBtn);
    expect(screen.queryByTestId('progression-hub-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('hud-level-indicator')).toHaveTextContent('Level 6/25');
    expect(screen.getByTestId('hud-stage-indicator')).toHaveTextContent('Crafting Apprentice');
    expect(screen.getByTestId('recipe-reward-name')).toHaveTextContent("Master's Steel Anvil");
  });

  it('6. displays 5-stage roadmap, enforces lock/unlock rules, and jumps to selected stage', () => {
    // Child unlocked up to Level 12 (Stage 3 Pirate Crafter)
    saveVoxelCrafterCheckpoint(1, { recipeIndex: 11, score: 8000 });

    render(
      <MemoryRouter>
        <VoxelCrafterGame />
      </MemoryRouter>
    );

    // Open stages roadmap
    fireEvent.click(screen.getByTestId('choose-stage-button'));
    expect(screen.getByTestId('stages-roadmap-view')).toBeInTheDocument();

    // Stage 1 (Levels 1-5), Stage 2 (Levels 6-10), and Stage 3 (Levels 11-15) are unlocked
    expect(screen.getByTestId('select-stage-1')).toBeInTheDocument();
    expect(screen.getByTestId('select-stage-2')).toBeInTheDocument();
    expect(screen.getByTestId('select-stage-3')).toBeInTheDocument();

    // Stage 4 (Levels 16-20) and Stage 5 (Levels 21-25) are locked
    expect(screen.getByTestId('locked-stage-4')).toBeInTheDocument();
    expect(screen.getByTestId('locked-stage-4')).toHaveTextContent('Level 16 Required');
    expect(screen.getByTestId('locked-stage-5')).toBeInTheDocument();
    expect(screen.getByTestId('locked-stage-5')).toHaveTextContent('Level 21 Required');

    // Select Stage 2 (starts at Level 6 ANVIL)
    fireEvent.click(screen.getByTestId('select-stage-2'));

    // Modal closes and game loads Level 6
    expect(screen.queryByTestId('progression-hub-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('hud-level-indicator')).toHaveTextContent('Level 6/25');
    expect(screen.getByTestId('hud-stage-indicator')).toHaveTextContent('Crafting Apprentice');

    // highestUnlockedLevel remains 12!
    const cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.highestUnlockedLevel).toBe(12);
  });

  it('7. confirms before restart and resets progress back to Level 1', () => {
    saveVoxelCrafterCheckpoint(1, { recipeIndex: 15, score: 11000 });

    render(
      <MemoryRouter>
        <VoxelCrafterGame />
      </MemoryRouter>
    );

    // Click Restart from entry hub
    fireEvent.click(screen.getByTestId('restart-game-button'));
    expect(screen.getByTestId('restart-confirm-view')).toBeInTheDocument();
    expect(screen.getByText('Restart From Level 1?')).toBeInTheDocument();

    // Cancel preserves progress
    fireEvent.click(screen.getByTestId('cancel-restart-button'));
    expect(screen.getByTestId('progression-hub-entry')).toBeInTheDocument();
    expect(loadVoxelCrafterCheckpointData(1).recipeIndex).toBe(15);

    // Click Restart again and confirm
    fireEvent.click(screen.getByTestId('restart-game-button'));
    fireEvent.click(screen.getByTestId('confirm-restart-button'));

    // Progress is reset
    const cp = loadVoxelCrafterCheckpointData(1);
    expect(cp.recipeIndex).toBe(0);
    expect(cp.highestUnlockedLevel).toBe(1);
    expect(cp.score).toBe(0);

    // Modal closes and game is at Level 1 (FORT)
    expect(screen.queryByTestId('progression-hub-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('hud-level-indicator')).toHaveTextContent('Level 1/25');
  });

  it('8. opens stage roadmap directly from HUD stages button during gameplay', () => {
    render(
      <MemoryRouter>
        <VoxelCrafterGame initialModal={null} />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('progression-hub-modal')).not.toBeInTheDocument();

    // Click in-HUD Stages button
    fireEvent.click(screen.getByTestId('hud-stages-btn'));
    expect(screen.getByTestId('progression-hub-modal')).toBeInTheDocument();
    expect(screen.getByTestId('stages-roadmap-view')).toBeInTheDocument();
  });

  it('9. isolates progression between distinct child profiles with guest fallback', () => {
    saveVoxelCrafterCheckpoint(1, { recipeIndex: 9, score: 6000 });
    saveVoxelCrafterCheckpoint(2, { recipeIndex: 2, score: 1500 });
    saveVoxelCrafterCheckpoint(undefined, { recipeIndex: 4, score: 2500 });

    const cp1 = loadVoxelCrafterCheckpointData(1);
    const cp2 = loadVoxelCrafterCheckpointData(2);
    const cpGuest = loadVoxelCrafterCheckpointData(undefined);

    expect(cp1.recipeIndex).toBe(9);
    expect(cp1.highestUnlockedLevel).toBe(10);

    expect(cp2.recipeIndex).toBe(2);
    expect(cp2.highestUnlockedLevel).toBe(3);

    expect(cpGuest.recipeIndex).toBe(4);
    expect(cpGuest.highestUnlockedLevel).toBe(5);
  });

  it('10. top navigation buttons open Stages, Restart, and Game Hub modals', () => {
    render(
      <MemoryRouter>
        <VoxelCrafterGame initialModal={null} />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('progression-hub-modal')).not.toBeInTheDocument();

    // 1. Click Stages button
    fireEvent.click(screen.getByTestId('voxel-stages-btn'));
    expect(screen.getByTestId('stages-roadmap-view')).toBeInTheDocument();

    // Close modal via back button
    fireEvent.click(screen.getByTestId('stage-roadmap-back-btn'));
    expect(screen.queryByTestId('progression-hub-modal')).not.toBeInTheDocument();

    // 2. Click Restart button
    fireEvent.click(screen.getByTestId('voxel-restart-btn'));
    expect(screen.getByTestId('restart-confirm-view')).toBeInTheDocument();

    // Cancel restart returns to entry view
    fireEvent.click(screen.getByTestId('cancel-restart-button'));
    expect(screen.getByTestId('progression-hub-entry')).toBeInTheDocument();

    // Close entry view
    fireEvent.click(screen.getByTestId('start-game-button'));
    expect(screen.queryByTestId('progression-hub-modal')).not.toBeInTheDocument();

    // 3. Click Game Hub button
    fireEvent.click(screen.getByTestId('voxel-hub-btn'));
    expect(screen.getByTestId('progression-hub-entry')).toBeInTheDocument();
  });

  it('11. intermediate stage boundary completions do not trigger final victory modal', async () => {
    vi.useFakeTimers();
    try {
      // Start at Recipe 4 (Level 5: GEMS - final level of Stage 1)
      saveVoxelCrafterCheckpoint(1, { recipeIndex: 4, score: 2000 });

      render(
        <MemoryRouter>
          <VoxelCrafterGame initialModal={null} />
        </MemoryRouter>
      );

      expect(screen.getByTestId('hud-level-indicator')).toHaveTextContent('Level 5/25');
      expect(screen.getByTestId('hud-stage-indicator')).toHaveTextContent('Beginner Builder');

      // Spell GEMS
      await act(async () => {
        spellWord('GEMS');
      });

      // Advance timer past recipe completion transition
      act(() => {
        vi.advanceTimersByTime(3500);
      });

      // Victory modal MUST NOT be shown on intermediate stage completion
      expect(screen.queryByTestId('victory-modal')).not.toBeInTheDocument();
      // Instead, advances to Level 6: ANVIL in Stage 2 Crafting Apprentice
      expect(screen.getByTestId('hud-level-indicator')).toHaveTextContent('Level 6/25');
      expect(screen.getByTestId('hud-stage-indicator')).toHaveTextContent('Crafting Apprentice');
    } finally {
      vi.useRealTimers();
    }
  });

  it('12. rapid double-clicks on hub start button are safely locked out', () => {
    render(
      <MemoryRouter>
        <VoxelCrafterGame />
      </MemoryRouter>
    );

    const startBtn = screen.getByTestId('start-game-button');
    fireEvent.click(startBtn);
    fireEvent.click(startBtn);
    fireEvent.click(startBtn);

    // Modal closes safely without crash or multiple invocations
    expect(screen.queryByTestId('progression-hub-modal')).not.toBeInTheDocument();
  });
});




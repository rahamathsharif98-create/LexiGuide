/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SafariPhotoGame from '../pages/child/SafariPhotoGame';
import SafariApp from '../games/safari-photo/SafariApp';
import SafariAnimal from '../games/safari-photo/components/SafariAnimal';
import { SAFARI_TARGETS, getSafariTarget } from '../games/safari-photo/engine/safariAnimals';
import {
  loadSafariPhotoCheckpointData,
  saveSafariPhotoCheckpoint,
  resetSafariPhotoCheckpoint,
  clearSafariPhotoCheckpoint,
  getSafariPhotoCheckpointKey,
} from '../games/safari-photo/engine/safariPhotoCheckpoint';
import { getGameById } from '../data/gamingZoneRegistry';
import { gameSound } from '../services/gameSoundService';

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
    playShutter: vi.fn(),
    playLetterNote: vi.fn(),
    playFanfare: vi.fn(),
    playGentleOops: vi.fn(),
    playSnap: vi.fn(),
    getSoundMode: vi.fn().mockReturnValue('voice_and_sfx'),
    subscribe: vi.fn().mockReturnValue(() => {}),
    cycleSoundMode: vi.fn(),
  },
}));

// Mock SafariWorld in jsdom so animals are clickable via data-testid
vi.mock('../games/safari-photo/SafariWorld', () => ({
  default: ({ currentTarget, isPhotoComplete, isVictory, onSnapAnimal }) => (
    <div
      data-testid="mock-safari-world"
      data-current-target={currentTarget?.animal}
      data-is-victory={isVictory ? 'true' : 'false'}
    >
      {SAFARI_TARGETS.map((animal) => (
        <button
          key={animal.id}
          type="button"
          data-testid={`animal-${animal.animal.toLowerCase()}`}
          data-animal-id={animal.id}
          data-is-target={animal.id === currentTarget?.id ? 'true' : 'false'}
          onClick={() => onSnapAnimal && onSnapAnimal(animal)}
        >
          {animal.animal}
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
  default: ({ active, combo }) => <div data-testid="mock-fever" data-active={active ? 'true' : 'false'} data-combo={combo} />,
}));

describe('Safari Wildlife Photographer (3D Sight & Snap)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('loads valid savanna animal targets with phonics letters and sounds', () => {
    expect(SAFARI_TARGETS.length).toBeGreaterThanOrEqual(5);
    SAFARI_TARGETS.forEach((target) => {
      expect(target.id).toBeDefined();
      expect(target.animal).toBeDefined();
      expect(target.letter).toBeDefined();
      expect(target.sound).toBeDefined();
      expect(target.position.length).toBe(3);
      expect(target.fact).toBeDefined();
      expect(target.prompt).toBeDefined();
      expect(target.speechText).toBeDefined();
    });
  });

  it('cycles animal targets predictably without crash', () => {
    const a0 = getSafariTarget(0);
    expect(a0.animal).toBe('LION');
    const a1 = getSafariTarget(1);
    expect(a1.animal).toBe('ZEBRA');
    const aOverflow = getSafariTarget(22);
    expect(aOverflow).toBeDefined();
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('safari-photo');
    expect(game).toBeDefined();
    expect(game.title).toBe('Safari Wildlife Photographer');
    expect(game.route).toBe('/child/games/safari-photo');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('sounds');
  });
});

describe('Safari Photo Step 2: Critical Bug Fixes & Session Safety', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('P0-1: records attempts without saving session prematurely, and saves once on exit with isSavedRef', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <SafariPhotoGame />
        </MemoryRouter>
      );
    });

    // Initial render should not save
    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Snap Round 1 correct target (Lion)
    const lionBtn = screen.getByTestId('animal-lion');
    await act(async () => {
      fireEvent.click(lionBtn);
    });

    // Advance photo flash
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Correct hit MUST NOT prematurely trigger saveCompletedSession!
    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Click "Back to Games" navigation button in page header
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

  it('P0-1b: saves accumulated session upon unmount if user navigates away without clicking Back', async () => {
    const { unmount } = render(
      <MemoryRouter>
        <SafariPhotoGame />
      </MemoryRouter>
    );

    // Snap Round 1 correct target (Lion)
    const lionBtn = screen.getByTestId('animal-lion');
    await act(async () => {
      fireEvent.click(lionBtn);
    });

    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Component unmounts (e.g. browser back button)
    await act(async () => {
      unmount();
    });

    // Unmount cleanup saves session once
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });

  it('P0-1c: exiting via Back button and then unmounting does not trigger duplicate session save', async () => {
    const { unmount } = render(
      <MemoryRouter>
        <SafariPhotoGame />
      </MemoryRouter>
    );

    const lionBtn = screen.getByTestId('animal-lion');
    await act(async () => {
      fireEvent.click(lionBtn);
    });

    // Click Back to Games
    const backBtn = screen.getByTestId('page-back-btn');
    await act(async () => {
      fireEvent.click(backBtn);
    });
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);

    // Component unmounts after navigation
    await act(async () => {
      unmount();
    });
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });

  it('P0-1d: SafariPhotoGame wrapper saves completed session upon game victory and does not duplicate on exit', async () => {
    render(
      <MemoryRouter>
        <SafariPhotoGame />
      </MemoryRouter>
    );

    // Complete all 5 animals
    const sequence = ['lion', 'zebra', 'giraffe', 'monkey', 'hippo'];
    for (let i = 0; i < sequence.length; i++) {
      const btn = screen.getByTestId(`animal-${sequence[i]}`);
      await act(async () => {
        fireEvent.click(btn);
      });
      if (i < sequence.length - 1) {
        act(() => {
          vi.advanceTimersByTime(3300);
        });
      }
    }

    // Victory triggers onComplete and saves session
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);

    // Advance to victory modal
    act(() => {
      vi.advanceTimersByTime(1700);
    });
    const backBtn = screen.getByTestId('back-to-games-btn');
    await act(async () => {
      fireEvent.click(backBtn);
    });

    // Guarded by isSavedRef: still exactly 1 call!
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });

  it('P0-2: shutter button does NOT automatically select or photograph the correct target animal', async () => {
    render(
      <MemoryRouter>
        <SafariApp onRoundComplete={vi.fn()} />
      </MemoryRouter>
    );

    // Shutter button in HUD
    const shutterBtn = screen.getByTestId('shutter-snap-btn');
    expect(shutterBtn).toBeInTheDocument();

    // Album photos initially 0
    expect(screen.getByTestId('album-counter')).toHaveTextContent('0 / 5');

    // Click shutter button without selecting an animal
    await act(async () => {
      fireEvent.click(shutterBtn);
    });

    // It must NOT have auto-completed the photo! Photos count remains 0
    expect(screen.getByTestId('album-counter')).toHaveTextContent('0 / 5');
    expect(screen.queryByText(/PERFECT PHOTO CAPTURED/i)).not.toBeInTheDocument();

    // Guidance prompt played
    expect(gameSound.speakCompanion).toHaveBeenCalledWith(
      expect.stringMatching(/tap an animal on the savanna/i)
    );
  });

  it('P0-2b: correct animal selection scores points, while incorrect animal awards 0 points and resets streak', async () => {
    const onRoundComplete = vi.fn();
    render(
      <MemoryRouter>
        <SafariApp onRoundComplete={onRoundComplete} />
      </MemoryRouter>
    );

    // Round 1 target is Lion (/l/). Click incorrect animal (Zebra)
    const zebraBtn = screen.getByTestId('animal-zebra');
    await act(async () => {
      fireEvent.click(zebraBtn);
    });

    // Should register incorrect attempt
    expect(onRoundComplete).toHaveBeenCalledWith(
      expect.objectContaining({ isCorrect: false })
    );
    expect(gameSound.playGentleOops).toHaveBeenCalled();
    expect(screen.getByTestId('album-counter')).toHaveTextContent('0 / 5');

    // Now click the correct animal (Lion)
    const lionBtn = screen.getByTestId('animal-lion');
    await act(async () => {
      fireEvent.click(lionBtn);
    });

    // Correct hit: scores points, increments album photos, plays shutter & fanfare
    expect(onRoundComplete).toHaveBeenCalledWith(
      expect.objectContaining({ isCorrect: true, score: 150 })
    );
    expect(gameSound.playShutter).toHaveBeenCalled();
    expect(gameSound.playFanfare).toHaveBeenCalled();
    expect(screen.getByTestId('album-counter')).toHaveTextContent('1 / 5');
  });

  it('P0-3: SafariAnimal component does not contain permanent red spoiler ring on target', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const animalSource = fs.readFileSync(
      path.resolve(__dirname, '../games/safari-photo/components/SafariAnimal.jsx'),
      'utf8'
    );
    expect(animalSource).not.toContain('#ef4444');
    expect(animalSource).not.toContain('<ringGeometry args={[1.4, 1.55, 24]}');
    expect(animalSource).toContain('hitbox-');
  });

  it('P0-4: completing the 5th animal triggers Master Wildlife Photographer victory modal and stops loop', async () => {
    const onComplete = vi.fn();
    render(
      <MemoryRouter>
        <SafariApp onComplete={onComplete} />
      </MemoryRouter>
    );

    // Target sequence: LION -> ZEBRA -> GIRAFFE -> MONKEY -> HIPPO
    const sequence = ['lion', 'zebra', 'giraffe', 'monkey', 'hippo'];

    for (let i = 0; i < sequence.length; i++) {
      const animalName = sequence[i];
      const btn = screen.getByTestId(`animal-${animalName}`);

      await act(async () => {
        fireEvent.click(btn);
      });

      if (i < sequence.length - 1) {
        // Advance transition delay between rounds (3200ms)
        act(() => {
          vi.advanceTimersByTime(3300);
        });
      }
    }

    // onComplete fired exactly once
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Advance 1600ms to open victory modal
    act(() => {
      vi.advanceTimersByTime(1700);
    });

    // Victory modal is displayed
    const victoryModal = screen.getByTestId('victory-modal');
    expect(victoryModal).toBeInTheDocument();
    expect(screen.getByText(/Master Wildlife Photographer!/i)).toBeInTheDocument();
    expect(screen.getByTestId('victory-stars')).toBeInTheDocument();
    expect(screen.getByTestId('final-score')).toHaveTextContent(/pts/i);

    // Album photos counter must NOT wrap to 0 or 6/5
    expect(screen.getByTestId('album-counter')).toHaveTextContent('5 / 5');

    // Does NOT loop back to animal 0 (Lion)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId('victory-modal')).toBeInTheDocument();
    expect(screen.getByTestId('album-counter')).toHaveTextContent('5 / 5');
  });

  it('P0-4b: Play Again resets game to fresh run and allows new session saving', async () => {
    const onResetSession = vi.fn();
    const onComplete = vi.fn();

    render(
      <MemoryRouter>
        <SafariApp onComplete={onComplete} onResetSession={onResetSession} />
      </MemoryRouter>
    );

    // Complete all 5 animals
    const sequence = ['lion', 'zebra', 'giraffe', 'monkey', 'hippo'];
    for (let i = 0; i < sequence.length; i++) {
      const btn = screen.getByTestId(`animal-${sequence[i]}`);
      await act(async () => {
        fireEvent.click(btn);
      });
      if (i < sequence.length - 1) {
        act(() => {
          vi.advanceTimersByTime(3300);
        });
      }
    }

    // Advance to victory modal
    act(() => {
      vi.advanceTimersByTime(1700);
    });
    expect(screen.getByTestId('victory-modal')).toBeInTheDocument();

    // Click Play Again
    const playAgainBtn = screen.getByTestId('play-again-btn');
    await act(async () => {
      fireEvent.click(playAgainBtn);
    });

    // Victory modal closes
    expect(screen.queryByTestId('victory-modal')).not.toBeInTheDocument();

    // Album counter resets to 0 / 5
    expect(screen.getByTestId('album-counter')).toHaveTextContent('0 / 5');

    // Reset session callback invoked
    expect(onResetSession).toHaveBeenCalledTimes(1);

    // Target is Lion again
    expect(screen.getByText(/L - LION/i)).toBeInTheDocument();
  });
});

describe('Safari Photo Step 2.5: Clearly Recognizable 3D Animals', () => {
  it('contains distinct anatomical components for each of the 5 animals in SafariAnimal.jsx', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const animalSource = fs.readFileSync(
      path.resolve(__dirname, '../games/safari-photo/components/SafariAnimal.jsx'),
      'utf8'
    );

    // Lion: Mane, 4 legs with paws, cream muzzle, dark nose, tufted tail
    expect(animalSource).toContain('LionModel');
    expect(animalSource).toContain('torusGeometry args={[0.48, 0.24, 12, 24]}'); // Mane
    expect(animalSource).toContain('#fef3c7'); // Cream muzzle
    expect(animalSource).toContain('#d97706'); // Tawny body

    // Zebra: Crisp stripes, hooves, upright crest mane, dark muzzle
    expect(animalSource).toContain('ZebraModel');
    expect(animalSource).toContain('zebra-stripe');
    expect(animalSource).toContain('#0f172a'); // Black stripes
    expect(animalSource).toContain('#f8fafc'); // White coat
    expect(animalSource).toContain('#1e293b'); // Dark muzzle

    // Giraffe: Tall neck, brown patches/spots, 4 slender legs with hooves, ossicones
    expect(animalSource).toContain('GiraffeModel');
    expect(animalSource).toContain('giraffe-neck-patch');
    expect(animalSource).toContain('#78350f'); // Brown spots
    expect(animalSource).toContain('#f59e0b'); // Golden amber body
    expect(animalSource).toContain('cylinderGeometry args={[0.02, 0.022, 0.18, 6]}'); // Ossicones

    // Monkey: Round head, expressive face mask, smile, light belly, round ears, 2 arms, 2 legs, curved tail
    expect(animalSource).toContain('MonkeyModel');
    expect(animalSource).toContain('torusGeometry args={[0.038, 0.012, 6, 8, Math.PI]}'); // Smile
    expect(animalSource).toContain('torusGeometry args={[0.15, 0.035, 8, 16, Math.PI * 1.3]}'); // Curled tail
    expect(animalSource).toContain('#fde68a'); // Peach/cream face and hands

    // Hippo: Large rounded bulky body, 4 sturdy legs with toenails, broad snout with raised nostrils
    expect(animalSource).toContain('HippoModel');
    expect(animalSource).toContain('hippo-nail-fl'); // Toenails
    expect(animalSource).toContain('#64748b'); // Slate-purple gray skin
    expect(animalSource).toContain('torusGeometry args={[0.065, 0.03, 8, 12]}'); // Raised nostrils
  });

  it('assigns accessible hitboxes and non-overlapping world positions to all animals', () => {
    // Check all 5 targets exist
    expect(SAFARI_TARGETS).toHaveLength(5);

    // Verify distinct positions across the savanna from left to right
    const xPositions = SAFARI_TARGETS.map((t) => t.position[0]);
    expect(xPositions[0]).toBeLessThan(xPositions[3]); // Lion (-4.5) < Monkey (-2.0)
    expect(xPositions[3]).toBeLessThan(xPositions[4]); // Monkey (-2.0) < Hippo (-0.6)
    expect(xPositions[4]).toBeLessThan(xPositions[2]); // Hippo (-0.6) < Giraffe (1.4)
    expect(xPositions[2]).toBeLessThan(xPositions[1]); // Giraffe (1.4) < Zebra (4.2)

    // Check minimum Euclidean distance between all pairs
    for (let i = 0; i < SAFARI_TARGETS.length; i++) {
      for (let j = i + 1; j < SAFARI_TARGETS.length; j++) {
        const p1 = SAFARI_TARGETS[i].position;
        const p2 = SAFARI_TARGETS[j].position;
        const dist = Math.hypot(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]);
        // Every animal is at least 3.0 units away from any other animal
        expect(dist).toBeGreaterThanOrEqual(3.0);
      }
    }
  });

  it('positions animals in authentic savanna habitats with Baobab branch grounding', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const envSource = fs.readFileSync(
      path.resolve(__dirname, '../games/safari-photo/components/SavannaEnvironment.jsx'),
      'utf8'
    );

    // SavannaEnvironment includes Baobab Tree with branch for Monkey
    expect(envSource).toContain('Baobab Tree with Branch for Monkey');
    expect(envSource).toContain('Riverbank mud/shallow water patch for Hippo');

    // Animal habitats agree with descriptions
    const habitats = SAFARI_TARGETS.map((t) => t.habitat);
    expect(habitats).toContain('Pride Rock');
    expect(habitats).toContain('Watering Hole');
    expect(habitats).toContain('Acacia Trees');
    expect(habitats).toContain('Baobab Branch');
    expect(habitats).toContain('River Bank');
  });
});

describe('Safari Photo Step 2.7: Fix Monkey and Hippo Faces, Improve Zebra Stripes', () => {
  it('implements recognizable Hippo face, elevated head, visible eyes, nostrils, tusks, and ears', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const animalSource = fs.readFileSync(
      path.resolve(__dirname, '../games/safari-photo/components/SafariAnimal.jsx'),
      'utf8'
    );

    // Hippo head is elevated and connected with neck
    expect(animalSource).toContain('Elevated Cranium');
    expect(animalSource).toContain('cylinderGeometry args={[0.48, 0.64, 0.75, 14]}'); // Neck
    expect(animalSource).toContain('#cbd5e1'); // Lighter lower jaw
    expect(animalSource).toContain('color="#1e293b"'); // Mouth line

    // Large visible eyes with pupils and highlights
    expect(animalSource).toContain('sphereGeometry args={[0.085, 10, 10]}'); // Eyeballs
    expect(animalSource).toContain('sphereGeometry args={[0.052, 8, 8]}'); // Pupils
    expect(animalSource).toContain('sphereGeometry args={[0.020, 6, 6]}'); // Highlights

    // Distinct dark nostrils on raised mounds
    expect(animalSource).toContain('torusGeometry args={[0.065, 0.03, 8, 12]}');
    expect(animalSource).toContain('sphereGeometry args={[0.11, 10, 10]}');

    // Rounded ears with pink inner cups
    expect(animalSource).toContain('#fda4af');

    // White tusks
    expect(animalSource).toContain('coneGeometry args={[0.032, 0.08, 6]}');

    // Facing camera
    expect(animalSource).toContain('rotation = [0, 0.15, 0]');
  });

  it('implements Monkey with large round head, face mask, smile, ears, holding branch, and clear position', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const animalSource = fs.readFileSync(
      path.resolve(__dirname, '../games/safari-photo/components/SafariAnimal.jsx'),
      'utf8'
    );
    const animalsSource = fs.readFileSync(
      path.resolve(__dirname, '../games/safari-photo/engine/safariAnimals.js'),
      'utf8'
    );

    // Monkey scaled up and rotated toward camera
    expect(animalSource).toContain('scale={1.65}');
    expect(animalSource).toContain('rotation = [0, 0.22, 0]');

    // Monkey position moved to clear branch position away from trunk
    expect(animalsSource).toContain('position: [-1.6, 2.35, -4.8]');

    // Large head, peach mask, protruding muzzle, dark nose, cheerful smile
    expect(animalSource).toContain('sphereGeometry args={[0.38, 16, 16]}'); // Head
    expect(animalSource).toContain('sphereGeometry args={[0.25, 14, 14]}'); // Mask
    expect(animalSource).toContain('sphereGeometry args={[0.20, 14, 14]}'); // Muzzle
    expect(animalSource).toContain('sphereGeometry args={[0.042, 8, 8]}'); // Button nose
    expect(animalSource).toContain('torusGeometry args={[0.038, 0.012, 6, 8, Math.PI]}'); // Smile

    // Two big round ears with peach inner cups
    expect(animalSource).toContain('cylinderGeometry args={[0.16, 0.16, 0.05, 14]}');
    expect(animalSource).toContain('cylinderGeometry args={[0.11, 0.11, 0.055, 12]}');

    // Arms and hands grasping branch
    expect(animalSource).toContain('Peach Hand gripping branch');
    expect(animalSource).toContain('Peach Foot clutching branch');

    // Long curved tail
    expect(animalSource).toContain('torusGeometry args={[0.15, 0.035, 8, 16, Math.PI * 1.3]}');
  });

  it('implements Zebra with bold wrap-around torso stripes, neck stripes, and camera orientation', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const animalSource = fs.readFileSync(
      path.resolve(__dirname, '../games/safari-photo/components/SafariAnimal.jsx'),
      'utf8'
    );

    // Rotated slightly toward camera
    expect(animalSource).toContain('rotation = [0, -0.42, 0]');

    // 8 wrap-around torso stripes
    expect(animalSource).toContain('torusGeometry args={[0.445, 0.082, 10, 24]}');

    // Neck stripes, shoulder/flank stripes, hooves
    expect(animalSource).toContain('torusGeometry args={[0.26, 0.062, 8, 16]}');
    expect(animalSource).toContain('cylinderGeometry args={[0.09, 0.10, 0.14, 8]}'); // Hooves
  });
});

describe('Safari Wildlife Photographer — Step 3: Checkpoint Persistence & Polish', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('Stage 2: saves and restores checkpoint correctly for the same child', () => {
    const childId = 'child-tim';
    expect(loadSafariPhotoCheckpointData(childId)).toEqual({
      targetIndex: 0,
      photosSnapped: 0,
      score: 0,
      stars: 0,
      streak: 1,
      isCompleted: false,
    });

    saveSafariPhotoCheckpoint(childId, {
      targetIndex: 2,
      photosSnapped: 2,
      score: 300,
      stars: 2,
      streak: 3,
      isCompleted: false,
    });

    const restored = loadSafariPhotoCheckpointData(childId);
    expect(restored.targetIndex).toBe(2);
    expect(restored.photosSnapped).toBe(2);
    expect(restored.score).toBe(300);
    expect(restored.stars).toBe(2);
    expect(restored.streak).toBe(3);
    expect(restored.isCompleted).toBe(false);
  });

  it('Stage 2: keeps checkpoints strictly isolated between different children', () => {
    saveSafariPhotoCheckpoint('child-alpha', {
      targetIndex: 1,
      photosSnapped: 1,
      score: 150,
      stars: 1,
      streak: 2,
    });

    saveSafariPhotoCheckpoint('child-beta', {
      targetIndex: 3,
      photosSnapped: 3,
      score: 600,
      stars: 3,
      streak: 4,
    });

    saveSafariPhotoCheckpoint(null, {
      targetIndex: 0,
      photosSnapped: 0,
      score: 0,
      stars: 0,
      streak: 1,
    });

    expect(loadSafariPhotoCheckpointData('child-alpha').targetIndex).toBe(1);
    expect(loadSafariPhotoCheckpointData('child-alpha').photosSnapped).toBe(1);

    expect(loadSafariPhotoCheckpointData('child-beta').targetIndex).toBe(3);
    expect(loadSafariPhotoCheckpointData('child-beta').photosSnapped).toBe(3);

    expect(loadSafariPhotoCheckpointData('guest').targetIndex).toBe(0);
    expect(loadSafariPhotoCheckpointData(null).targetIndex).toBe(0);
  });

  it('Stage 2: handles invalid, missing, or corrupt stored data gracefully', () => {
    const childId = 'child-corrupt';
    const storageKey = getSafariPhotoCheckpointKey(childId);

    // Corrupt JSON
    localStorage.setItem(storageKey, '{{corrupt-data!!');
    expect(loadSafariPhotoCheckpointData(childId).targetIndex).toBe(0);

    // Negative out-of-range index
    localStorage.setItem(storageKey, JSON.stringify({ targetIndex: -5 }));
    expect(loadSafariPhotoCheckpointData(childId).targetIndex).toBe(0);

    // Beyond max targets (out-of-range)
    localStorage.setItem(storageKey, JSON.stringify({ targetIndex: 99 }));
    expect(loadSafariPhotoCheckpointData(childId).targetIndex).toBe(0);

    // Legacy numeric string
    localStorage.setItem(storageKey, '2');
    const legacy = loadSafariPhotoCheckpointData(childId);
    expect(legacy.targetIndex).toBe(2);
    expect(legacy.photosSnapped).toBe(2);
  });

  it('Stage 2: ensures a completed run cannot accidentally resume as an unfinished run', () => {
    const childId = 'child-completed';

    // Save completed run
    saveSafariPhotoCheckpoint(childId, {
      targetIndex: 0,
      photosSnapped: 5,
      score: 1050,
      stars: 5,
      streak: 1,
      isCompleted: true,
    });

    // Loading returns fresh run state (Round 1 / Lion)
    const state = loadSafariPhotoCheckpointData(childId);
    expect(state.targetIndex).toBe(0);
    expect(state.photosSnapped).toBe(0);
    expect(state.score).toBe(0);
    expect(state.isCompleted).toBe(false);
  });

  it('Stage 2: resetSafariPhotoCheckpoint and clearSafariPhotoCheckpoint reset progress cleanly', () => {
    const childId = 'child-reset';
    saveSafariPhotoCheckpoint(childId, {
      targetIndex: 3,
      photosSnapped: 3,
      score: 450,
      stars: 3,
    });

    expect(loadSafariPhotoCheckpointData(childId).targetIndex).toBe(3);

    resetSafariPhotoCheckpoint(childId);
    expect(loadSafariPhotoCheckpointData(childId).targetIndex).toBe(0);
    expect(loadSafariPhotoCheckpointData(childId).photosSnapped).toBe(0);

    clearSafariPhotoCheckpoint(childId);
    expect(localStorage.getItem(getSafariPhotoCheckpointKey(childId))).toBeNull();
  });

  it('Stage 2: resumes correct target animal, score, stars, and album count when child mounts SafariApp', () => {
    const childId = 'child-resume';
    // Save checkpoint at Giraffe (index 2)
    saveSafariPhotoCheckpoint(childId, {
      targetIndex: 2,
      photosSnapped: 2,
      score: 350,
      stars: 2,
      streak: 2,
      isCompleted: false,
    });

    render(
      <MemoryRouter>
        <SafariApp childId={childId} />
      </MemoryRouter>
    );

    // Target is GIRAFFE
    expect(screen.getByText(/G - GIRAFFE/i)).toBeInTheDocument();
    // Album photos counter shows 2 / 5
    expect(screen.getByTestId('album-counter')).toHaveTextContent('2 / 5');
    // Score shows 350 PTS
    expect(screen.getByText(/350 PTS/i)).toBeInTheDocument();
  });

  it('Stage 3: removes duplicate sound toggle from wrapper, keeping single setting in game HUD', () => {
    render(
      <MemoryRouter>
        <SafariPhotoGame />
      </MemoryRouter>
    );

    // Check all buttons matching sound toggle text in the DOM
    const soundToggles = screen.getAllByRole('button', { name: /voice \+ chimes/i });
    // Exactly ONE sound toggle in the game HUD (duplicate removed from page wrapper bar)
    expect(soundToggles).toHaveLength(1);

    // Hear Guide button exists in the HUD
    expect(screen.getByTitle('Hear Safari Guide Radio')).toBeInTheDocument();
  });

  it('Stage 3: cleans up active speech on unmount and navigation', () => {
    const { unmount } = render(
      <MemoryRouter>
        <SafariPhotoGame />
      </MemoryRouter>
    );

    // Speech is called on target mount
    expect(gameSound.speakCompanion).toHaveBeenCalled();

    // Component unmounts
    act(() => {
      unmount();
    });

    // stopSpeech is called to prevent lingering speech synthesis
    expect(gameSound.stopSpeech).toHaveBeenCalled();
  });

  it('Stage 4: activates victory camera only upon game completion, and resets on Play Again', async () => {
    vi.useFakeTimers();
    try {
      render(
        <MemoryRouter>
          <SafariApp childId="child-victory-cam" onComplete={vi.fn()} onResetSession={vi.fn()} />
        </MemoryRouter>
      );

      const world = screen.getByTestId('mock-safari-world');

      // Initially in normal gameplay, isVictory is false
      expect(world).toHaveAttribute('data-is-victory', 'false');

      // Snap animals 1 through 4
      const sequence = ['lion', 'zebra', 'giraffe', 'monkey'];
      for (let i = 0; i < sequence.length; i++) {
        const btn = screen.getByTestId(`animal-${sequence[i]}`);
        await act(async () => {
          fireEvent.click(btn);
        });
        // Camera is STILL false during intermediate rounds
        expect(world).toHaveAttribute('data-is-victory', 'false');
        act(() => {
          vi.advanceTimersByTime(3300);
        });
      }

      // Snap 5th animal (Hippo)
      const hippoBtn = screen.getByTestId('animal-hippo');
      await act(async () => {
        fireEvent.click(hippoBtn);
      });

      // Advance to victory completion transition (1600ms)
      act(() => {
        vi.advanceTimersByTime(1700);
      });

      // VICTORY CAMERA: isVictory is now TRUE!
      expect(world).toHaveAttribute('data-is-victory', 'true');

      // Click Play Again
      const playAgainBtn = screen.getByTestId('play-again-btn');
      await act(async () => {
        fireEvent.click(playAgainBtn);
      });

      // RESET: isVictory resets to FALSE and camera returns to normal gameplay orientation
      expect(world).toHaveAttribute('data-is-victory', 'false');
      expect(screen.getByText(/L - LION/i)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});


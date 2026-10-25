import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { BAKERY_RECIPES, getBakeryRecipe } from '../games/magic-bakery/engine/bakeryRecipes';
import { getGameById } from '../data/gamingZoneRegistry';
import BakeryApp, {
  getBakeryCheckpointKey,
  loadBakeryCheckpoint,
  saveBakeryCheckpoint,
  BAKERY_TIER_SPAWN_POSITIONS,
} from '../games/magic-bakery/BakeryApp';
import MagicBakeryGame from '../pages/child/MagicBakeryGame';
import {
  TIER_GEOMETRY,
  createSyllableBadgeTexture,
  getSyllableFontSize,
} from '../games/magic-bakery/components/CakeTier';

// ────────────────────────────────────────────────
// Mocks for 3D canvas, context, and audio in JSDOM environment
// ────────────────────────────────────────────────
const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 1, ok: true });
const mockShowToast = vi.fn();

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    activeChild: { id: 1, name: 'Bakery Chef' },
    isRealBackend: true,
    saveLearningSession: mockSaveLearningSession,
    applySessionOutcome: vi.fn(),
    showToast: mockShowToast,
  }),
}));
vi.mock('../games/magic-bakery/BakeryWorld', () => ({
  default: ({ tiers, onSelectTier, mascotState, isBakeComplete }) => (
    <div
      data-testid="mock-bakery-world"
      data-mascot-state={mascotState}
      data-bake-complete={isBakeComplete ? 'true' : 'false'}
    >
      {tiers.map((t) => (
        <button
          key={t.id}
          data-testid={`tier-${t.syllable}`}
          data-id={t.id}
          data-pos={JSON.stringify(t.pos)}
          data-stacked={t.isStacked ? 'true' : 'false'}
          onClick={() => onSelectTier(t)}
        >
          {t.syllable}
        </button>
      ))}
    </div>
  ),
}));

const mockPlayLetterNote = vi.fn();
const mockPlaySparkle = vi.fn();
const mockPlayFanfare = vi.fn();
const mockSpeakCompanion = vi.fn();
const mockPlayGentleOops = vi.fn();

vi.mock('../services/gameSoundService', () => ({
  gameSound: {
    playLetterNote: (...args) => mockPlayLetterNote(...args),
    playSparkle: (...args) => mockPlaySparkle(...args),
    playFanfare: (...args) => mockPlayFanfare(...args),
    speakCompanion: (...args) => mockSpeakCompanion(...args),
    playGentleOops: (...args) => mockPlayGentleOops(...args),
    getSoundMode: () => 'voice_and_sfx',
    subscribe: () => () => {},
    cycleSoundMode: vi.fn(),
  },
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('Magic Bakery 3D (Syllable Stacker) — 10 Level Curriculum', () => {
  it('loads exactly 10 valid compound word recipes in gradual progression', () => {
    expect(BAKERY_RECIPES.length).toBe(10);

    const expectedOrder = [
      'CUPCAKE',
      'RAINBOW',
      'PANCAKE',
      'SUNSHINE',
      'SNOWMAN',
      'STARFISH',
      'CAMPFIRE',
      'BUTTERFLY',
      'WATERMELON',
      'GINGERBREAD',
    ];

    expectedOrder.forEach((expectedWord, idx) => {
      expect(BAKERY_RECIPES[idx].name).toBe(expectedWord);
    });

    const ids = new Set();
    const names = new Set();

    BAKERY_RECIPES.forEach((recipe) => {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.compoundWord).toBe(recipe.name);
      expect(recipe.emoji).toBeDefined();
      expect(recipe.syllables.length).toBeGreaterThanOrEqual(2);
      expect(recipe.frostingColors.length).toBe(recipe.syllables.length);
      expect(recipe.distractors.length).toBeGreaterThanOrEqual(2);
      expect(recipe.prompt).toBeDefined();
      expect(recipe.speechText).toBeDefined();

      // Distractors must not be valid syllables of the recipe
      recipe.distractors.forEach((d) => {
        expect(recipe.syllables.includes(d)).toBe(false);
      });

      // Unique IDs and names
      expect(ids.has(recipe.id)).toBe(false);
      expect(names.has(recipe.name)).toBe(false);
      ids.add(recipe.id);
      names.add(recipe.name);
    });
  });

  it('verifies syllable breakdown for 2-syllable, 3-syllable, and 4-syllable cakes', () => {
    // 2-syllable examples
    expect(BAKERY_RECIPES[0].syllables).toEqual(['CUP', 'CAKE']);
    expect(BAKERY_RECIPES[1].syllables).toEqual(['RAIN', 'BOW']);
    expect(BAKERY_RECIPES[2].syllables).toEqual(['PAN', 'CAKE']);
    expect(BAKERY_RECIPES[3].syllables).toEqual(['SUN', 'SHINE']);
    expect(BAKERY_RECIPES[4].syllables).toEqual(['SNOW', 'MAN']);
    expect(BAKERY_RECIPES[5].syllables).toEqual(['STAR', 'FISH']);
    expect(BAKERY_RECIPES[6].syllables).toEqual(['CAMP', 'FIRE']);

    // 3-syllable examples
    expect(BAKERY_RECIPES[7].syllables).toEqual(['BUT', 'TER', 'FLY']);
    expect(BAKERY_RECIPES[9].syllables).toEqual(['GIN', 'GER', 'BREAD']);

    // 4-syllable example
    expect(BAKERY_RECIPES[8].syllables).toEqual(['WA', 'TER', 'MEL', 'ON']);
  });

  it('cycles all 10 recipes predictably with getBakeryRecipe without out-of-bounds error', () => {
    const expectedWords = [
      'CUPCAKE',
      'RAINBOW',
      'PANCAKE',
      'SUNSHINE',
      'SNOWMAN',
      'STARFISH',
      'CAMPFIRE',
      'BUTTERFLY',
      'WATERMELON',
      'GINGERBREAD',
    ];

    expectedWords.forEach((word, index) => {
      const recipe = getBakeryRecipe(index);
      expect(recipe.name).toBe(word);
    });

    // Verify wrapping at boundary
    expect(getBakeryRecipe(10).name).toBe('CUPCAKE');
    expect(getBakeryRecipe(11).name).toBe('RAINBOW');
    expect(getBakeryRecipe(25).name).toBe('STARFISH');
  });

  it('is correctly registered in the Gaming Zone registry with 3D Adventure dimension', () => {
    const game = getGameById('magic-bakery');
    expect(game).toBeDefined();
    expect(game.title).toBe('Magic Bakery 3D');
    expect(game.route).toBe('/child/games/magic-bakery');
    expect(game.dimension).toBe('3D Adventure');
    expect(game.category).toBe('words');
  });
});

describe('Magic Bakery 3D — Audio Speech Text & Gameplay Fixes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('speaks the correct compound word on completion and NEVER says "undefined"', () => {
    render(<BakeryApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Initial companion prompt
    expect(mockSpeakCompanion).toHaveBeenCalledWith(
      'Let us bake a delicious Cupcake! First find CUP, then find CAKE!'
    );

    // Complete Level 1: CUP + CAKE
    fireEvent.click(screen.getByTestId('tier-CUP'));
    fireEvent.click(screen.getByTestId('tier-CAKE'));

    // Verify completion speech text
    expect(mockSpeakCompanion).toHaveBeenCalledWith('Delicious! You baked the magical CUPCAKE!');
    expect(mockPlayFanfare).toHaveBeenCalled();

    // Ensure the speech call NEVER produced "undefined"
    mockSpeakCompanion.mock.calls.forEach(([spokenText]) => {
      expect(spokenText).not.toContain('undefined');
    });
  });

  it('assigns unique, non-overlapping 3D positions to all tiers even on 4-syllable cakes', () => {
    render(<BakeryApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Advance to Level 9 (WATERMELON, index 8, 4 syllables + 2 distractors = 6 tiers)
    for (let i = 0; i < 8; i++) {
      const r = getBakeryRecipe(i);
      r.syllables.forEach((syl) => {
        fireEvent.click(screen.getByTestId(`tier-${syl}`));
      });
      act(() => {
        vi.advanceTimersByTime(3400);
      });
    }

    // Now at Level 9: WATERMELON
    expect(screen.getByText('WATERMELON')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button').filter((b) => b.getAttribute('data-id')?.startsWith('tier-'));
    expect(buttons.length).toBe(6); // 4 syllables + 2 distractors

    const positions = new Set();
    buttons.forEach((btn) => {
      const pos = btn.getAttribute('data-pos');
      expect(pos).toBeTruthy();
      expect(positions.has(pos)).toBe(false); // No two tiers share the same coordinate!
      positions.add(pos);
    });
  });

  it('progresses smoothly through all 10 levels with correct syllables and stops at Level 10 victory', () => {
    const onRoundComplete = vi.fn();
    render(<BakeryApp onBack={vi.fn()} onRoundComplete={onRoundComplete} />);

    // Step through levels 0 to 8 (levels 1 to 9)
    for (let levelIdx = 0; levelIdx < 9; levelIdx++) {
      const recipe = getBakeryRecipe(levelIdx);
      expect(screen.getByText(recipe.name)).toBeInTheDocument();

      recipe.syllables.forEach((syl) => {
        const btn = screen.getByTestId(`tier-${syl}`);
        fireEvent.click(btn);
      });

      expect(onRoundComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          isCorrect: true,
          recipe: expect.objectContaining({ name: recipe.name }),
        })
      );

      // Verify completion cheer does not contain undefined
      const lastCall = mockSpeakCompanion.mock.calls[mockSpeakCompanion.mock.calls.length - 1][0];
      expect(lastCall).toBe(`Delicious! You baked the magical ${recipe.name}!`);

      act(() => {
        vi.advanceTimersByTime(3400);
      });
    }

    // Now at Level 10: GINGERBREAD
    const finalRecipe = getBakeryRecipe(9);
    expect(screen.getByText(finalRecipe.name)).toBeInTheDocument();

    finalRecipe.syllables.forEach((syl) => {
      const btn = screen.getByTestId(`tier-${syl}`);
      fireEvent.click(btn);
    });

    // Advance time for victory moment
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Progression stops! Never wraps back to Level 1 automatically!
    expect(screen.getByTestId('bakery-victory-panel')).toBeInTheDocument();
    expect(screen.getByText('Master Baker!')).toBeInTheDocument();
    expect(screen.getByText('Amazing work! You baked every magical recipe!')).toBeInTheDocument();
  });
});

describe('Magic Bakery 3D — Cake Stacking Geometry, Letter Readability & Plaque Alignment', () => {
  it('guarantees exact flush stacking without gaps or intersections across all tier heights', () => {
    expect(TIER_GEOMETRY.SPONGE_HEIGHT).toBe(0.52);
    expect(TIER_GEOMETRY.FROSTING_HEIGHT).toBe(0.06);
    expect(TIER_GEOMETRY.TOTAL_HEIGHT).toBeCloseTo(0.58, 5);
    expect(TIER_GEOMETRY.PLATTER_Y).toBe(0.70);

    // Verify flush contact: each tier's top must match the next tier's bottom exactly
    for (let stackIndex = 0; stackIndex < 4; stackIndex++) {
      const currentBottomY = TIER_GEOMETRY.getTargetY(stackIndex);
      const currentTopY = currentBottomY + TIER_GEOMETRY.TOTAL_HEIGHT;
      const nextBottomY = TIER_GEOMETRY.getTargetY(stackIndex + 1);

      // Contact error must be zero (no floating gap, no penetration overlap)
      expect(currentTopY).toBeCloseTo(nextBottomY, 5);
    }

    // Level 1 base rests directly on silver platter surface (0.70)
    expect(TIER_GEOMETRY.getTargetY(0)).toBeCloseTo(0.70, 5);
    // Level 2 tier rests at 1.28
    expect(TIER_GEOMETRY.getTargetY(1)).toBeCloseTo(1.28, 5);
    // Level 3 tier rests at 1.86
    expect(TIER_GEOMETRY.getTargetY(2)).toBeCloseTo(1.86, 5);
    // Level 4 tier rests at 2.44
    expect(TIER_GEOMETRY.getTargetY(3)).toBeCloseTo(2.44, 5);
  });

  it('calculates proportional cake tier radii for 2-tier, 3-tier, and 4-tier recipes', () => {
    // 2-tier recipe (e.g. CUPCAKE, RAINBOW, PANCAKE)
    const r2Base = TIER_GEOMETRY.getTierRadius(0, 2);
    const r2Top = TIER_GEOMETRY.getTierRadius(1, 2);
    expect(r2Base).toBeCloseTo(1.80, 5);
    expect(r2Top).toBeCloseTo(1.05, 5);
    expect(r2Base).toBeGreaterThan(r2Top);

    // 3-tier recipe (e.g. BUTTERFLY, GINGERBREAD)
    const r3_0 = TIER_GEOMETRY.getTierRadius(0, 3);
    const r3_1 = TIER_GEOMETRY.getTierRadius(1, 3);
    const r3_2 = TIER_GEOMETRY.getTierRadius(2, 3);
    expect(r3_0).toBeCloseTo(1.80, 5);
    expect(r3_1).toBeCloseTo(1.425, 5);
    expect(r3_2).toBeCloseTo(1.05, 5);
    expect(r3_0).toBeGreaterThan(r3_1);
    expect(r3_1).toBeGreaterThan(r3_2);

    // 4-tier recipe (e.g. WATERMELON)
    const r4_0 = TIER_GEOMETRY.getTierRadius(0, 4);
    const r4_1 = TIER_GEOMETRY.getTierRadius(1, 4);
    const r4_2 = TIER_GEOMETRY.getTierRadius(2, 4);
    const r4_3 = TIER_GEOMETRY.getTierRadius(3, 4);
    expect(r4_0).toBeCloseTo(1.80, 5);
    expect(r4_3).toBeCloseTo(1.05, 5);
    expect(r4_0).toBeGreaterThan(r4_1);
    expect(r4_1).toBeGreaterThan(r4_2);
    expect(r4_2).toBeGreaterThan(r4_3);

    // Distractor pieces have fixed compact radius
    expect(TIER_GEOMETRY.getTierRadius(-1, 2)).toBe(1.15);
    expect(TIER_GEOMETRY.getTierRadius(-1, 4)).toBe(1.15);
  });

  it('guarantees syllable label offset is positioned proud of the cylinder surface', () => {
    // Label offset is positive to prevent z-fighting and model clipping
    expect(TIER_GEOMETRY.LABEL_OFFSET).toBeGreaterThan(0);
    expect(TIER_GEOMETRY.LABEL_OFFSET).toBe(0.04);

    // Front label z position for base tier:
    const baseRadius = TIER_GEOMETRY.getTierRadius(0, 2);
    const frontLabelZ = baseRadius + TIER_GEOMETRY.LABEL_OFFSET;
    expect(frontLabelZ).toBeCloseTo(1.84, 5);
    expect(frontLabelZ).toBeGreaterThan(baseRadius);
  });

  it('creates valid syllable plaque textures for short and long syllables without clipping', () => {
    // Test font auto-scaling sizes for syllables of various lengths:
    // 2-char syllables (WA, ON) -> 116px
    expect(getSyllableFontSize('WA')).toBe(116);
    expect(getSyllableFontSize('ON')).toBe(116);

    // 3-char syllables (CUP, BOW, PAN, SUN, MAN, BUT, TER, FLY, GIN, GER, MEL) -> 98px
    expect(getSyllableFontSize('CUP')).toBe(98);
    expect(getSyllableFontSize('BUT')).toBe(98);
    expect(getSyllableFontSize('GIN')).toBe(98);

    // 4-char syllables (CAKE, RAIN, SHINE, SNOW, STAR, FISH, CAMP, FIRE) -> 82px
    expect(getSyllableFontSize('CAKE')).toBe(82);
    expect(getSyllableFontSize('RAIN')).toBe(82);

    // 5-char syllables (WATER, MELON, BREAD) -> 70px (scaled down to prevent horizontal clipping)
    expect(getSyllableFontSize('WATER')).toBe(70);
    expect(getSyllableFontSize('BREAD')).toBe(70);
    expect(getSyllableFontSize('MELON')).toBe(70);

    // Verify texture instantiation
    const testSyllables = ['WA', 'CUP', 'CAKE', 'RAIN', 'BUT', 'TER', 'FLY', 'MEL', 'ON', 'BREAD'];

    testSyllables.forEach((syl) => {
      const textureUnstacked = createSyllableBadgeTexture(syl, false);
      const textureStacked = createSyllableBadgeTexture(syl, true);

      expect(textureUnstacked).toBeDefined();
      expect(textureStacked).toBeDefined();
      expect(textureUnstacked.image).toBeDefined();
      expect(textureStacked.image).toBeDefined();
    });
  });

  it('isolates distractor tiers from the assembled cake when clicked', () => {
    render(<BakeryApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // On Level 1 (CUPCAKE), syllables are CUP, CAKE. Distractors might be e.g. POP, TART
    const currentRecipe = getBakeryRecipe(0);
    const distractorWord = currentRecipe.distractors[0];

    const distractorBtn = screen.getByTestId(`tier-${distractorWord}`);
    expect(distractorBtn).toBeInTheDocument();
    expect(distractorBtn.getAttribute('data-stacked')).toBe('false');

    // Click distractor piece
    fireEvent.click(distractorBtn);

    // Distractor should NOT be stacked
    expect(distractorBtn.getAttribute('data-stacked')).toBe('false');

    // Stack valid first syllable
    fireEvent.click(screen.getByTestId('tier-CUP'));
    expect(screen.getByTestId('tier-CUP').getAttribute('data-stacked')).toBe('true');

    // Distractor must STILL not be stacked
    expect(distractorBtn.getAttribute('data-stacked')).toBe('false');

    // Stack valid second syllable to complete cake
    fireEvent.click(screen.getByTestId('tier-CAKE'));
    expect(screen.getByTestId('tier-CAKE').getAttribute('data-stacked')).toBe('true');

    // Even when cake is complete, distractor piece remains unstacked on the counter
    expect(distractorBtn.getAttribute('data-stacked')).toBe('false');
  });

  it('arranges tiers neatly around central platter inside the visible countertop area', () => {
    render(<BakeryApp onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    const allTierButtons = screen.getAllByRole('button').filter((b) =>
      b.getAttribute('data-id')?.startsWith('tier-')
    );

    // Central platter disc has radius 2.05.
    // Tiers are arranged compactly around the platter (dist > 3.2), inside visible screen bounds (|X| <= 4.8)
    allTierButtons.forEach((btn) => {
      const pos = JSON.parse(btn.getAttribute('data-pos'));
      const [x, y, z] = pos;

      // Every tier is placed within compact visible bounds (no clipping at screen edges)
      expect(Math.abs(x)).toBeLessThanOrEqual(4.8);
      expect(Math.abs(x)).toBeGreaterThanOrEqual(2.7);
      expect(y).toBe(0.45);

      // Distance from center of platter (0, 0) provides comfortable clearance around platter
      const distFromPlatterCenter = Math.sqrt(x * x + z * z);
      expect(distFromPlatterCenter).toBeGreaterThan(3.2);
    });
  });

  it('guarantees pairwise 3D Euclidean distances between adjacent spawn positions are >= 2.40 units', () => {
    // In Level 9 (WATERMELON), up to 6 positions are simultaneously occupied by tiers:
    // Pos 0 to Pos 5. All adjacent positions maintain comfortable clearance >= 2.40 units.
    const activePositions = BAKERY_TIER_SPAWN_POSITIONS.slice(0, 6);

    // Check adjacent pairs around horseshoe
    const adjacentPairs = [
      [0, 1], // Front-Left to Front-Right (center corridor = 6.2)
      [0, 2], // Front-Left to Left-Flank
      [2, 4], // Left-Flank to Back-Left
      [1, 3], // Front-Right to Right-Flank
      [3, 5], // Right-Flank to Back-Right
      [4, 5], // Back-Left to Back-Right (across back = 5.6)
      [0, 4], // Front-Left to Back-Left
      [1, 5], // Front-Right to Back-Right
    ];

    adjacentPairs.forEach(([i, j]) => {
      const p1 = activePositions[i];
      const p2 = activePositions[j];
      const dist = Math.hypot(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]);
      expect(dist).toBeGreaterThanOrEqual(2.40);
    });
  });

  it('guarantees camera line-of-sight ray projection separation so tiers never hide behind each other', () => {
    // Camera is at [0, 5.0, 10.2] looking down at [0, 1.2, -0.2].
    // Downward angle creates natural vertical separation in screen NDC:
    // Front row (Z=1.1), Flank row (Z=-0.7), Back row (Z=-2.2).
    const cam = { x: 0, y: 5.0, z: 10.2 };
    const lookAt = { x: 0, y: 1.2, z: -0.2 };
    const fovY = (46 * Math.PI) / 180;
    const aspect = 16 / 9;

    const fwd = { x: lookAt.x - cam.x, y: lookAt.y - cam.y, z: lookAt.z - cam.z };
    const fwdLen = Math.hypot(fwd.x, fwd.y, fwd.z);
    fwd.x /= fwdLen; fwd.y /= fwdLen; fwd.z /= fwdLen;

    const right = { x: fwd.z, y: 0, z: -fwd.x };
    const rightLen = Math.hypot(right.x, right.y, right.z);
    right.x /= rightLen; right.y /= rightLen; right.z /= rightLen;

    const up = {
      x: right.y * fwd.z - right.z * fwd.y,
      y: right.z * fwd.x - right.x * fwd.z,
      z: right.x * fwd.y - right.y * fwd.x,
    };

    function projectToNDC(pos) {
      const v = { x: pos[0] - cam.x, y: pos[1] - cam.y, z: pos[2] - cam.z };
      const xCam = v.x * right.x + v.y * right.y + v.z * right.z;
      const yCam = v.x * up.x + v.y * up.y + v.z * up.z;
      const zCam = -(v.x * fwd.x + v.y * fwd.y + v.z * fwd.z);

      const tanHalfFov = Math.tan(fovY / 2);
      const ndcY = (yCam / zCam) / tanHalfFov;
      const ndcX = (xCam / zCam) / (tanHalfFov * aspect);
      return { ndcX, ndcY };
    }

    const ndcCoords = BAKERY_TIER_SPAWN_POSITIONS.slice(0, 6).map(projectToNDC);

    // 1. All positions must be well inside the visible screen frustum (|ndcX| <= 0.70, |ndcY| <= 0.60)
    ndcCoords.forEach(({ ndcX, ndcY }) => {
      expect(Math.abs(ndcX)).toBeLessThanOrEqual(0.70);
      expect(Math.abs(ndcY)).toBeLessThanOrEqual(0.60);
    });

    // 2. Clear horizontal and vertical separation between columns and rows
    // Pos 2 (outer flank), Pos 0 (inner front), Pos 4 (inner back)
    const deltaX_0_2 = Math.abs(ndcCoords[0].ndcX - ndcCoords[2].ndcX);
    const deltaX_0_4 = Math.abs(ndcCoords[0].ndcX - ndcCoords[4].ndcX);
    expect(deltaX_0_2).toBeGreaterThanOrEqual(0.10);
    expect(deltaX_0_4).toBeGreaterThanOrEqual(0.10);

    const deltaY_0_2 = Math.abs(ndcCoords[0].ndcY - ndcCoords[2].ndcY);
    const deltaY_2_4 = Math.abs(ndcCoords[2].ndcY - ndcCoords[4].ndcY);
    expect(deltaY_0_2).toBeGreaterThanOrEqual(0.10);
    expect(deltaY_2_4).toBeGreaterThanOrEqual(0.08);

    // 3. Central Platter Corridor remains completely open in foreground (between Pos 0 and 1)
    expect(Math.abs(ndcCoords[0].ndcX)).toBeGreaterThan(0.35);
    expect(Math.abs(ndcCoords[1].ndcX)).toBeGreaterThan(0.35);
  });

  it('smoothly stacks pieces in multi-tier recipes like WATERMELON and GINGERBREAD without obscuring remaining pieces', () => {
    const childId = 'multi-tier-layout-test';
    // Start at Level 9 (WATERMELON, index 8)
    saveBakeryCheckpoint(childId, 8);

    render(<BakeryApp childId={childId} onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    expect(screen.getByText('WATERMELON')).toBeInTheDocument();

    // 4 syllables + 2 distractors = 6 tiers
    const tierButtons = screen.getAllByRole('button').filter((b) =>
      b.getAttribute('data-id')?.startsWith('tier-')
    );
    expect(tierButtons.length).toBe(6);

    // Syllables to click in order: WA, TER, MEL, ON
    const syllables = ['WA', 'TER', 'MEL', 'ON'];
    syllables.forEach((syl, stepIdx) => {
      const btn = screen.getByTestId(`tier-${syl}`);
      expect(btn.getAttribute('data-stacked')).toBe('false');

      // Click to stack
      fireEvent.click(btn);
      expect(btn.getAttribute('data-stacked')).toBe('true');

      // Verify the remaining unstacked pieces remain unstacked and visible
      const remainingUnstacked = screen.getAllByRole('button').filter(
        (b) => b.getAttribute('data-id')?.startsWith('tier-') && b.getAttribute('data-stacked') === 'false'
      );
      expect(remainingUnstacked.length).toBe(6 - (stepIdx + 1));
    });
  });

  it('maintains safe clearance between companion Mascot Fox and all tier spawn positions', () => {
    // Mascot Fox is stationed at [5.2, 0.0, -2.6]
    const mascotPos = [5.2, 0.0, -2.6];

    BAKERY_TIER_SPAWN_POSITIONS.forEach((tierPos) => {
      const dist = Math.hypot(
        mascotPos[0] - tierPos[0],
        mascotPos[1] - tierPos[1],
        mascotPos[2] - tierPos[2]
      );
      // Distance to any tier position must be >= 1.95 units so mascot never crowds pieces
      expect(dist).toBeGreaterThanOrEqual(1.95);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Checkpoints, Child Profile Isolation, Rapid-Click Guards & Session Safety
// ─────────────────────────────────────────────────────────────────────────────
describe('Magic Bakery 3D — Checkpoints, Gameplay Guards & Session Safety', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('generates the correct storage key for child profiles and guest fallback', () => {
    expect(getBakeryCheckpointKey('child-1')).toBe('lexiguide_magic_bakery_checkpoint_child-1');
    expect(getBakeryCheckpointKey(42)).toBe('lexiguide_magic_bakery_checkpoint_42');
    expect(getBakeryCheckpointKey(null)).toBe('lexiguide_magic_bakery_checkpoint_guest');
    expect(getBakeryCheckpointKey(undefined)).toBe('lexiguide_magic_bakery_checkpoint_guest');
    expect(getBakeryCheckpointKey('')).toBe('lexiguide_magic_bakery_checkpoint_guest');
  });

  it('safely handles missing, invalid, or corrupted checkpoint data by defaulting to Level 1 (index 0)', () => {
    // Missing key
    expect(loadBakeryCheckpoint('guest')).toBe(0);

    // Corrupted non-JSON string
    localStorage.setItem(getBakeryCheckpointKey('guest'), '{corrupt-json:::');
    expect(loadBakeryCheckpoint('guest')).toBe(0);

    // Negative out-of-bounds index
    saveBakeryCheckpoint('guest', -4);
    expect(loadBakeryCheckpoint('guest')).toBe(0);

    // Out-of-bounds excessive index (>= 10)
    localStorage.setItem(
      getBakeryCheckpointKey('guest'),
      JSON.stringify({ recipeIndex: 99 })
    );
    expect(loadBakeryCheckpoint('guest')).toBe(0);

    // Non-numeric value
    localStorage.setItem(
      getBakeryCheckpointKey('guest'),
      JSON.stringify({ recipeIndex: 'not-a-number' })
    );
    expect(loadBakeryCheckpoint('guest')).toBe(0);
  });

  it('correctly loads numeric and object checkpoint formats', () => {
    // Number format
    localStorage.setItem(getBakeryCheckpointKey('child-1'), '3');
    expect(loadBakeryCheckpoint('child-1')).toBe(3);

    // Object format with recipeIndex
    saveBakeryCheckpoint('child-1', 4);
    expect(loadBakeryCheckpoint('child-1')).toBe(4);

    const raw = JSON.parse(localStorage.getItem(getBakeryCheckpointKey('child-1')));
    expect(raw.recipeIndex).toBe(4);
    expect(raw.savedLevelIndex).toBe(4);
    expect(raw.updatedAt).toBeDefined();

    // Object format with levelIndex fallback
    localStorage.setItem(
      getBakeryCheckpointKey('child-1'),
      JSON.stringify({ levelIndex: 6 })
    );
    expect(loadBakeryCheckpoint('child-1')).toBe(6);
  });

  it('saves the next recipe index upon completion and resumes after remount', () => {
    const childId = 'baker-101';
    const { unmount } = render(
      <BakeryApp childId={childId} onBack={vi.fn()} onRoundComplete={vi.fn()} />
    );

    // Initially at Level 1 ('CUPCAKE')
    expect(screen.getByText('CUPCAKE')).toBeInTheDocument();
    expect(loadBakeryCheckpoint(childId)).toBe(0);

    // Solve Level 1: CUP + CAKE
    fireEvent.click(screen.getByTestId('tier-CUP'));
    fireEvent.click(screen.getByTestId('tier-CAKE'));

    // Checkpoint must be saved as index 1 (Level 2: RAINBOW)
    expect(loadBakeryCheckpoint(childId)).toBe(1);

    // Simulate leaving / refreshing by unmounting and remounting
    unmount();

    render(<BakeryApp childId={childId} onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Resumes at saved level: Level 2 ('RAINBOW')
    expect(screen.getByText('RAINBOW')).toBeInTheDocument();
    expect(screen.getByTestId('tier-RAIN')).toBeInTheDocument();
  });

  it('isolates checkpoints for separate child profiles and guest', () => {
    // Setup distinct saved checkpoints for each profile
    saveBakeryCheckpoint('child-a', 2); // Level 3: PANCAKE
    saveBakeryCheckpoint('child-b', 5); // Level 6: STARFISH
    // guest has no checkpoint -> Level 1: CUPCAKE

    const { unmount: unmountA } = render(
      <BakeryApp childId="child-a" onBack={vi.fn()} onRoundComplete={vi.fn()} />
    );
    expect(screen.getByText('PANCAKE')).toBeInTheDocument();
    unmountA();

    const { unmount: unmountB } = render(
      <BakeryApp childId="child-b" onBack={vi.fn()} onRoundComplete={vi.fn()} />
    );
    expect(screen.getByText('STARFISH')).toBeInTheDocument();
    unmountB();

    render(<BakeryApp childId={null} onBack={vi.fn()} onRoundComplete={vi.fn()} />);
    expect(screen.getByText('CUPCAKE')).toBeInTheDocument();
  });

  it('clamps final Level 10 completion at index 9 without wrapping back to Level 1 in storage', () => {
    const childId = 'master-pastry-chef';
    // Set checkpoint at Level 10 (index 9: GINGERBREAD)
    saveBakeryCheckpoint(childId, 9);
    expect(loadBakeryCheckpoint(childId)).toBe(9);

    render(<BakeryApp childId={childId} onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Starts at Level 10 ('GINGERBREAD')
    expect(screen.getByText('GINGERBREAD')).toBeInTheDocument();

    // Complete Level 10: GIN + GER + BREAD
    fireEvent.click(screen.getByTestId('tier-GIN'));
    fireEvent.click(screen.getByTestId('tier-GER'));
    fireEvent.click(screen.getByTestId('tier-BREAD'));

    // Checkpoint must remain clamped at index 9, NEVER wrapped to 0 or 1
    expect(loadBakeryCheckpoint(childId)).toBe(9);
  });

  it('prevents rapid clicks and duplicate tier collection using synchronous ref guards', () => {
    const onRoundComplete = vi.fn();
    render(<BakeryApp childId="tester" onBack={vi.fn()} onRoundComplete={onRoundComplete} />);

    const cupBtn = screen.getByTestId('tier-CUP');

    // Simulate 5 rapid clicks on the same tier before React re-render
    fireEvent.click(cupBtn);
    fireEvent.click(cupBtn);
    fireEvent.click(cupBtn);
    fireEvent.click(cupBtn);
    fireEvent.click(cupBtn);

    // Letter note should only be sounded once for slot 0
    expect(mockPlayLetterNote).toHaveBeenCalledTimes(1);
    expect(mockPlayLetterNote).toHaveBeenCalledWith(0);

    // Score in HUD should be 150 (not 150 * 5 = 750)
    expect(screen.getByText('150 PTS')).toBeInTheDocument();
  });

  it('cleans up timers on unmount to prevent state updates on unmounted component', () => {
    vi.useFakeTimers();

    const { unmount } = render(<BakeryApp childId="timer-test" onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Complete Level 1 to schedule the 3400ms transition timer
    fireEvent.click(screen.getByTestId('tier-CUP'));
    fireEvent.click(screen.getByTestId('tier-CAKE'));

    // Unmount before timer fires
    unmount();

    // Advance time past the 3400ms transition delay
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Cleanup should complete without throwing warnings or errors
    vi.useRealTimers();
  });

  it('MagicBakeryGame wrapper passes activeChild.id and saves session only once on exit using isSavedRef', () => {
    // activeChild has id: 1 in mock AppContext
    saveBakeryCheckpoint(1, 3); // Level 4: SUNSHINE

    render(
      <MemoryRouter>
        <MagicBakeryGame />
      </MemoryRouter>
    );

    // Resumes at Level 4 ('SUNSHINE') for activeChild id 1
    expect(screen.getByText('SUNSHINE')).toBeInTheDocument();

    // Solve Level 4: SUN + SHINE
    fireEvent.click(screen.getByTestId('tier-SUN'));
    fireEvent.click(screen.getByTestId('tier-SHINE'));

    // During round completion, saveLearningSession must NOT have been called yet
    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Click "Back to Games" button
    const backBtn = screen.getAllByRole('button', { name: /back/i })[0];
    act(() => {
      fireEvent.click(backBtn);
    });

    // Session must be saved exactly once on exit
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);

    // Clicking back again or re-triggering must NOT save duplicate session
    act(() => {
      fireEvent.click(backBtn);
    });
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });
});

describe('Magic Bakery 3D — Camera-Facing Letter Orientation & Bakery Environment', () => {
  it('ensures syllable labels for key compound words remain fully readable and auto-scaled', () => {
    // 2-syllable, 3-syllable, and 4-syllable target words from curriculum:
    // CUPCAKE (CUP, CAKE), WATERMELON (WA, TER, MEL, ON), GINGERBREAD (GIN, GER, BREAD)
    const requiredSyllables = ['WA', 'TER', 'MEL', 'ON', 'CUP', 'CAKE', 'GIN', 'GER', 'BREAD'];

    requiredSyllables.forEach((syl) => {
      const fontSize = getSyllableFontSize(syl);
      expect(fontSize).toBeGreaterThanOrEqual(70);
      expect(fontSize).toBeLessThanOrEqual(116);

      const texture = createSyllableBadgeTexture(syl, false);
      expect(texture).toBeDefined();
      expect(texture.image).toBeDefined();
    });
  });

  it('guarantees central platter remains centered and at exact height Y = 0.70', () => {
    expect(TIER_GEOMETRY.PLATTER_Y).toBe(0.70);
    // Base tier rests flush on platter
    expect(TIER_GEOMETRY.getTargetY(0)).toBe(0.70);
  });

  it('verifies that all selectable cake tiers remain strictly in front of background decorations', () => {
    render(<BakeryApp childId="layout-depth-check" onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    const allTierButtons = screen.getAllByRole('button').filter((b) =>
      b.getAttribute('data-id')?.startsWith('tier-')
    );

    // Background shelves and wall elements are situated at Z <= -6.5
    // All gameplay tiers must be at Z >= -3.3 to guarantee zero overlap or occlusion
    allTierButtons.forEach((btn) => {
      const pos = JSON.parse(btn.getAttribute('data-pos'));
      const [x, y, z] = pos;

      expect(z).toBeGreaterThan(-4.0);
      expect(z).toBeLessThan(3.0);
      expect(Math.abs(x)).toBeLessThanOrEqual(4.8);
      expect(Math.abs(x)).toBeGreaterThanOrEqual(2.7);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Final Victory Screen, Play Again Reset & Safety
// ─────────────────────────────────────────────────────────────────────────────
describe('Magic Bakery 3D — Step 3: Final Victory Screen, Play Again & Safety', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays the Master Baker! victory screen with message, 3 gold stars, and actual final score upon completing Level 10', () => {
    const childId = 'hero-chef';
    // Start at Level 10 (index 9: GINGERBREAD)
    saveBakeryCheckpoint(childId, 9);

    render(<BakeryApp childId={childId} onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    expect(screen.getByText('GINGERBREAD')).toBeInTheDocument();

    // Complete Level 10: GIN + GER + BREAD
    fireEvent.click(screen.getByTestId('tier-GIN'));
    fireEvent.click(screen.getByTestId('tier-GER'));
    fireEvent.click(screen.getByTestId('tier-BREAD'));

    // Advance 2000ms for victory moment
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Victory panel must be visible
    expect(screen.getByTestId('bakery-victory-panel')).toBeInTheDocument();
    expect(screen.getByText('Master Baker!')).toBeInTheDocument();
    expect(screen.getByText('Amazing work! You baked every magical recipe!')).toBeInTheDocument();

    // Must display 3 celebratory gold stars
    const starsContainer = screen.getByTestId('victory-stars');
    expect(starsContainer).toBeInTheDocument();
    expect(starsContainer.children.length).toBe(3);

    // Must display the actual final score
    const finalScoreEl = screen.getByTestId('final-score');
    expect(finalScoreEl).toBeInTheDocument();
    // 3 syllables = 3 * 150 (plus fever bonus) + 500 recipe completion bonus = at least 950 pts
    expect(finalScoreEl.textContent).toMatch(/\d+\s*pts/);

    // Companion speech announced
    expect(mockSpeakCompanion).toHaveBeenCalledWith(
      'Master Baker! Amazing work! You baked every magical recipe!'
    );
    expect(mockPlayFanfare).toHaveBeenCalled();
  });

  it('stops progression after Level 10 and prevents further scoring or tier collection', () => {
    const childId = 'final-stop-test';
    saveBakeryCheckpoint(childId, 9);

    render(<BakeryApp childId={childId} onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Solve Level 10
    fireEvent.click(screen.getByTestId('tier-GIN'));
    fireEvent.click(screen.getByTestId('tier-GER'));
    fireEvent.click(screen.getByTestId('tier-BREAD'));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const scoreAfterWin = screen.getByTestId('final-score').textContent;

    // Advance further in time - it must NEVER advance to CUPCAKE automatically
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByTestId('bakery-victory-panel')).toBeInTheDocument();
    expect(screen.queryByText('CUPCAKE')).not.toBeInTheDocument();

    // Checkpoint in storage remains at Level 10 (index 9)
    expect(loadBakeryCheckpoint(childId)).toBe(9);

    // Attempt clicking distractor or tier buttons after completion
    const distractorItem = getBakeryRecipe(9).distractors[0];
    const distractorBtn = screen.getByTestId(`tier-${distractorItem}`);
    fireEvent.click(distractorBtn);

    // Score must not change
    expect(screen.getByTestId('final-score').textContent).toBe(scoreAfterWin);
  });

  it('Play Again button resets game to Level 1 (CUPCAKE), clears score, and saves checkpoint to Level 1', () => {
    const childId = 'replay-chef';
    saveBakeryCheckpoint(childId, 9);

    render(<BakeryApp childId={childId} onBack={vi.fn()} onRoundComplete={vi.fn()} />);

    // Solve Level 10
    fireEvent.click(screen.getByTestId('tier-GIN'));
    fireEvent.click(screen.getByTestId('tier-GER'));
    fireEvent.click(screen.getByTestId('tier-BREAD'));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('bakery-victory-panel')).toBeInTheDocument();

    // Click "Play Again"
    const playAgainBtn = screen.getByTestId('play-again-btn');
    fireEvent.click(playAgainBtn);

    // Victory modal should be dismissed
    expect(screen.queryByTestId('bakery-victory-panel')).not.toBeInTheDocument();

    // Level must reset to Level 1: CUPCAKE
    expect(screen.getByText('CUPCAKE')).toBeInTheDocument();
    expect(screen.getByTestId('tier-CUP')).toBeInTheDocument();

    // Score must reset to 0
    expect(screen.getByText('0 PTS')).toBeInTheDocument();

    // Checkpoint in storage must be reset to Level 1 (index 0)
    expect(loadBakeryCheckpoint(childId)).toBe(0);
  });

  it('Back to Games button from victory screen invokes onBack and preserves single session saving', () => {
    saveBakeryCheckpoint(1, 9);

    render(
      <MemoryRouter>
        <MagicBakeryGame />
      </MemoryRouter>
    );

    // Complete Level 10
    fireEvent.click(screen.getByTestId('tier-GIN'));
    fireEvent.click(screen.getByTestId('tier-GER'));
    fireEvent.click(screen.getByTestId('tier-BREAD'));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('bakery-victory-panel')).toBeInTheDocument();

    // Session must not have been saved prematurely
    expect(mockSaveLearningSession).not.toHaveBeenCalled();

    // Click "Back to Games" button on the victory modal
    const victoryBackBtn = screen.getByTestId('back-to-games-btn');
    act(() => {
      fireEvent.click(victoryBackBtn);
    });

    // Session must be saved exactly once on exit
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);

    // Extra clicks do not double save
    act(() => {
      fireEvent.click(victoryBackBtn);
    });
    expect(mockSaveLearningSession).toHaveBeenCalledTimes(1);
  });
});

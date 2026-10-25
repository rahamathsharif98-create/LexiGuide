import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GamePlay from '../pages/child/GamePlay';
import SkyArcherGame from '../pages/child/SkyArcherGame';
import {
  saveSoundHuntCheckpoint,
  loadSoundHuntCheckpointData,
  resetSoundHuntCheckpoint,
} from '../games/sound-hunt/engine/soundHuntCheckpoint';
import {
  saveWordTrainCheckpoint,
  loadWordTrainCheckpointData,
  resetWordTrainCheckpoint,
} from '../games/word-train/engine/wordTrainCheckpoint';
import {
  saveSkyArcherCheckpoint,
  loadSkyArcherCheckpointData,
  resetSkyArcherCheckpoint,
} from '../games/sky-archer/engine/skyArcherCheckpoint';
import {
  saveCosmicSafariCheckpoint,
  loadCosmicSafariCheckpointData,
  resetCosmicSafariCheckpoint,
} from '../games/cosmic-safari/engine/cosmicSafariCheckpoint';

// Mock audio & three fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => (
    <div data-testid="mock-canvas">
      {React.Children.toArray(children).filter((c) => c && c.type !== 'color')}
    </div>
  ),
  useFrame: vi.fn(),
}));

let activeChildId = 1;
vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    activeChild: { id: activeChildId, name: 'Progression Tester' },
    isRealBackend: false,
    applySessionOutcome: vi.fn(),
    saveLearningSession: vi.fn().mockResolvedValue({ id: 1, ok: true }),
  }),
}));

describe('Shared Game Progression & Stage Selection Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Space Sound Mission (sound-hunt)', () => {
    const renderSoundHunt = () =>
      render(
        <MemoryRouter initialEntries={['/child/games/sound-hunt']}>
          <Routes>
            <Route path="/child/games/:gameId" element={<GamePlay />} />
          </Routes>
        </MemoryRouter>
      );

    it('displays Start Game when no checkpoint exists, and allows opening stage roadmap', () => {
      renderSoundHunt();

      expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument();
      const chooseStageBtn = screen.getByTestId('choose-stage-button');
      expect(chooseStageBtn).toBeInTheDocument();

      // Open roadmap
      fireEvent.click(chooseStageBtn);
      expect(screen.getByTestId('stages-roadmap-view')).toBeInTheDocument();

      // Stage 1 is unlocked, Stage 2-5 are locked
      expect(screen.getByTestId('select-stage-1')).toBeInTheDocument();
      expect(screen.getByTestId('locked-stage-2')).toBeInTheDocument();
      expect(screen.getByTestId('locked-stage-3')).toBeInTheDocument();
      expect(screen.getByTestId('locked-stage-4')).toBeInTheDocument();
      expect(screen.getByTestId('locked-stage-5')).toBeInTheDocument();
    });

    it('resumes from saved checkpoint, displays stage roadmap with unlocked stages, and allows stage selection', () => {
      // Child previously unlocked up to Level 12 (Stage 3)
      saveSoundHuntCheckpoint(1, { roundIndex: 11, score: 10 });

      renderSoundHunt();

      // Shows Resume Game and Active Checkpoint indicator
      expect(screen.getByRole('button', { name: /Resume Game ▶/i })).toBeInTheDocument();
      expect(screen.getByTestId('active-checkpoint-indicator')).toHaveTextContent(/Level 12/);

      // Open stages view
      fireEvent.click(screen.getByTestId('choose-stage-button'));

      // Stages 1, 2, and 3 are unlocked because highestUnlockedLevel is 12 (>= 1, >= 6, >= 11)
      expect(screen.getByTestId('select-stage-1')).toBeInTheDocument();
      expect(screen.getByTestId('select-stage-2')).toBeInTheDocument();
      expect(screen.getByTestId('select-stage-3')).toBeInTheDocument();
      // Stage 4 (Level 16) is still locked
      expect(screen.getByTestId('locked-stage-4')).toBeInTheDocument();

      // Select Stage 2 (starts at Level 6 -> 0-based round 5)
      fireEvent.click(screen.getByTestId('select-stage-2'));

      // Transitions into game at Level 6
      expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 6 of 25/);
      expect(screen.getByTestId('sound-hunt-stage-badge')).toHaveTextContent(/Stage 2 of 5: Cosmic Voyager/);
    });

    it('provides restart confirmation and resets progress when confirmed', () => {
      saveSoundHuntCheckpoint(1, { roundIndex: 14, score: 14 });

      renderSoundHunt();

      // Click Restart
      fireEvent.click(screen.getByTestId('restart-game-button'));
      expect(screen.getByTestId('restart-confirm-view')).toBeInTheDocument();
      expect(screen.getByText('Restart From Level 1?')).toBeInTheDocument();

      // Confirm Restart
      fireEvent.click(screen.getByTestId('confirm-restart-button'));

      // Checkpoint is reset
      const checkpoint = loadSoundHuntCheckpointData(1);
      expect(checkpoint.roundIndex).toBe(0);
      expect(checkpoint.highestUnlockedLevel).toBe(1);

      // Entry view now shows Start Game
      expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument();
      expect(screen.queryByTestId('active-checkpoint-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Word Train (word-train)', () => {
    const renderWordTrain = () =>
      render(
        <MemoryRouter initialEntries={['/child/games/word-train']}>
          <Routes>
            <Route path="/child/games/:gameId" element={<GamePlay />} />
          </Routes>
        </MemoryRouter>
      );

    it('displays stage roadmap for Word Train and respects locked stations', () => {
      // Child unlocked up to Station 2 (Level 15)
      saveWordTrainCheckpoint(1, 14, 50);

      renderWordTrain();

      expect(screen.getByRole('button', { name: /Resume Game ▶/i })).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('choose-stage-button'));

      // Station 1 (1-10) and Station 2 (11-20) unlocked
      expect(screen.getByTestId('select-stage-1')).toBeInTheDocument();
      expect(screen.getByTestId('select-stage-2')).toBeInTheDocument();
      // Station 3 (21-30) locked
      expect(screen.getByTestId('locked-stage-3')).toBeInTheDocument();

      // Jump to Station 1
      fireEvent.click(screen.getByTestId('select-stage-1'));
      expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 1 of 50/);
    });
  });

  describe('Sky Word Archer (sky-archer)', () => {
    const renderSkyArcher = () =>
      render(
        <MemoryRouter>
          <SkyArcherGame />
        </MemoryRouter>
      );

    it('opens stage selection modal from top bar, displays 5 stations, and jumps to selected station', () => {
      // Child reached Level 12 (Station 3)
      saveSkyArcherCheckpoint(1, 11);

      renderSkyArcher();

      // Sky Archer is running at Level 12 (Station 3)
      expect(screen.getByTestId('station-badge')).toHaveTextContent(/Station 3/i);

      // Click "Stages" button in top bar
      fireEvent.click(screen.getByTestId('sky-archer-stages-button'));
      expect(screen.getByTestId('progression-hub-modal')).toBeInTheDocument();

      // Stations 1, 2, 3 are unlocked; Station 4 is locked
      expect(screen.getByTestId('select-stage-1')).toBeInTheDocument();
      expect(screen.getByTestId('select-stage-2')).toBeInTheDocument();
      expect(screen.getByTestId('select-stage-3')).toBeInTheDocument();
      expect(screen.getByTestId('locked-stage-4')).toBeInTheDocument();

      // Select Station 1 (Level 1)
      fireEvent.click(screen.getByTestId('select-stage-1'));

      // Modal closes and game is now at Station 1 (Level 1: /sh/)
      expect(screen.queryByTestId('progression-hub-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('station-badge')).toHaveTextContent(/Station 1/i);
      expect(screen.getByText('/sh/')).toBeInTheDocument();
    });

    it('opens restart confirmation and resets progress when confirmed', () => {
      saveSkyArcherCheckpoint(1, 14);

      renderSkyArcher();

      // Click "Restart" in top bar
      fireEvent.click(screen.getByTestId('sky-archer-restart-button'));
      expect(screen.getByTestId('restart-confirm-view')).toBeInTheDocument();

      // Confirm restart
      fireEvent.click(screen.getByTestId('confirm-restart-button'));

      // Checkpoint is reset to 0
      const checkpoint = loadSkyArcherCheckpointData(1);
      expect(checkpoint.roundIndex).toBe(0);
      expect(checkpoint.highestUnlockedRound).toBe(1);

      // Game is now at Level 1 (/sh/)
      expect(screen.getByTestId('station-badge')).toHaveTextContent(/Station 1/i);
      expect(screen.getByText('/sh/')).toBeInTheDocument();
    });
  });

  describe('Cosmic Safari (match-sound / cosmic-safari)', () => {
    const renderCosmicSafari = (path = '/child/games/cosmic-safari') =>
      render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/child/games/:gameId" element={<GamePlay />} />
          </Routes>
        </MemoryRouter>
      );

    it('displays Start Game and badge on entry, and opens stage roadmap', () => {
      renderCosmicSafari();

      expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument();
      expect(screen.getByTestId('cosmic-safari-badge')).toHaveTextContent(/Cosmic Safari/i);

      // Open roadmap
      fireEvent.click(screen.getByTestId('choose-stage-button'));
      expect(screen.getByTestId('stages-roadmap-view')).toBeInTheDocument();

      // Stage 1 unlocked, 2-5 locked
      expect(screen.getByTestId('select-stage-1')).toBeInTheDocument();
      expect(screen.getByTestId('locked-stage-2')).toBeInTheDocument();
      expect(screen.getByTestId('locked-stage-3')).toBeInTheDocument();
      expect(screen.getByTestId('locked-stage-4')).toBeInTheDocument();
      expect(screen.getByTestId('locked-stage-5')).toBeInTheDocument();
    });

    it('resumes from saved checkpoint, displays stage roadmap with unlocked stages, and allows stage selection', () => {
      saveCosmicSafariCheckpoint(1, { roundIndex: 11, score: 10 });

      renderCosmicSafari();

      expect(screen.getByRole('button', { name: /Resume Game ▶/i })).toBeInTheDocument();
      expect(screen.getByTestId('active-checkpoint-indicator')).toHaveTextContent(/Level 12/);

      // Open stages view
      fireEvent.click(screen.getByTestId('choose-stage-button'));

      // Stages 1, 2, 3 are unlocked because highestUnlockedLevel is 12 (>= 1, >= 6, >= 11)
      expect(screen.getByTestId('select-stage-1')).toBeInTheDocument();
      expect(screen.getByTestId('select-stage-2')).toBeInTheDocument();
      expect(screen.getByTestId('select-stage-3')).toBeInTheDocument();
      expect(screen.getByTestId('locked-stage-4')).toBeInTheDocument();

      // Select Stage 2 (starts at Level 6)
      fireEvent.click(screen.getByTestId('select-stage-2'));

      expect(screen.getByTestId('round-progress-label')).toHaveTextContent(/Level 6 of 25/);
      expect(screen.getByTestId('cosmic-safari-stage-badge')).toHaveTextContent(/Stage 2 of 5: Starlight Savanna/);
    });

    it('provides restart confirmation and resets progress when confirmed', () => {
      saveCosmicSafariCheckpoint(1, { roundIndex: 14, score: 14 });

      renderCosmicSafari();

      // Click Restart
      fireEvent.click(screen.getByTestId('restart-game-button'));
      expect(screen.getByTestId('restart-confirm-view')).toBeInTheDocument();
      expect(screen.getByText('Restart From Level 1?')).toBeInTheDocument();

      // Confirm Restart
      fireEvent.click(screen.getByTestId('confirm-restart-button'));

      // Checkpoint is reset
      const checkpoint = loadCosmicSafariCheckpointData(1);
      expect(checkpoint.roundIndex).toBe(0);
      expect(checkpoint.highestUnlockedLevel).toBe(1);

      // Entry view now shows Start Game
      expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument();
      expect(screen.queryByTestId('active-checkpoint-indicator')).not.toBeInTheDocument();
    });
  });
});

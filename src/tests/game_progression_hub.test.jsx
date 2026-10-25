import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import GameProgressionHub from '../components/games/GameProgressionHub';

describe('GameProgressionHub Component', () => {
  const mockStages = [
    {
      stage: 1,
      title: 'Stage 1: Cadet Launchpad',
      shortTitle: 'Cadet Launchpad',
      levelRange: [1, 5],
      badge: '🚀',
      themeColor: '#13CFE3',
      description: 'Master foundational beginning sounds!',
    },
    {
      stage: 2,
      title: 'Stage 2: Cosmic Voyager',
      shortTitle: 'Cosmic Voyager',
      levelRange: [6, 10],
      badge: '🛰️',
      themeColor: '#34D399',
      description: 'Explore planetary orbits and cosmic phonemes!',
    },
    {
      stage: 3,
      title: 'Stage 3: Deep Space Explorer',
      shortTitle: 'Deep Space Explorer',
      levelRange: [11, 15],
      badge: '🪐',
      themeColor: '#FBBF24',
      description: 'Navigate deep space star systems!',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Entry View & Checkpoint Resume', () => {
    it('renders clean entry view with Start Game when no progress exists', () => {
      const handleStart = vi.fn();
      render(
        <GameProgressionHub
          gameTitle="Space Sound Mission"
          gameIcon="🚀"
          gameBadge="Space Sound Mission"
          instructions="Listen to the sound and choose the picture!"
          stages={mockStages}
          currentLevel={1}
          highestUnlockedLevel={1}
          hasSavedProgress={false}
          onStart={handleStart}
        />
      );

      expect(screen.getByRole('heading', { name: 'Space Sound Mission' })).toBeInTheDocument();
      expect(screen.getByText('🚀')).toBeInTheDocument();
      expect(screen.getByText('Listen to the sound and choose the picture!')).toBeInTheDocument();

      const startBtn = screen.getByTestId('start-game-button');
      expect(startBtn).toHaveTextContent('Start Game ▶');

      // Stage selection is available
      expect(screen.getByTestId('choose-stage-button')).toBeInTheDocument();

      // Restart button is hidden when there is no saved progress to restart
      expect(screen.queryByTestId('restart-game-button')).not.toBeInTheDocument();

      fireEvent.click(startBtn);
      expect(handleStart).toHaveBeenCalledTimes(1);
    });

    it('renders Resume Game with current level when active checkpoint exists', () => {
      const handleResume = vi.fn();
      render(
        <GameProgressionHub
          gameTitle="Space Sound Mission"
          gameIcon="🚀"
          stages={mockStages}
          currentLevel={8}
          highestUnlockedLevel={8}
          hasSavedProgress={true}
          onResume={handleResume}
        />
      );

      expect(screen.getByTestId('active-checkpoint-indicator')).toHaveTextContent('Saved Progress: Level 8');
      const resumeBtn = screen.getByTestId('start-game-button');
      expect(resumeBtn).toHaveTextContent('Resume Game ▶');

      // Restart button is visible
      expect(screen.getByTestId('restart-game-button')).toBeInTheDocument();

      fireEvent.click(resumeBtn);
      expect(handleResume).toHaveBeenCalledTimes(1);
    });

    it('prevents rapid double-clicks on start/resume action', () => {
      const handleStart = vi.fn();
      render(
        <GameProgressionHub
          gameTitle="Space Sound Mission"
          hasSavedProgress={false}
          onStart={handleStart}
        />
      );

      const startBtn = screen.getByTestId('start-game-button');
      fireEvent.click(startBtn);
      fireEvent.click(startBtn);
      fireEvent.click(startBtn);

      expect(handleStart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Stage Roadmap & Lock / Unlock Rules', () => {
    it('switches to stages view and displays unlocked vs locked stages accurately', () => {
      const handleSelectStage = vi.fn();
      render(
        <GameProgressionHub
          gameTitle="Space Sound Mission"
          stages={mockStages}
          currentLevel={6}
          highestUnlockedLevel={6}
          hasSavedProgress={true}
          onSelectStage={handleSelectStage}
        />
      );

      // Open stages view
      fireEvent.click(screen.getByTestId('choose-stage-button'));
      expect(screen.getByTestId('stages-roadmap-view')).toBeInTheDocument();
      expect(screen.getByText('Highest Unlocked: Level 6')).toBeInTheDocument();

      // Stage 1 (Levels 1-5): Unlocked
      expect(screen.getByTestId('select-stage-1')).toBeInTheDocument();

      // Stage 2 (Levels 6-10): Unlocked because highestUnlockedLevel >= 6
      expect(screen.getByTestId('select-stage-2')).toBeInTheDocument();

      // Stage 3 (Levels 11-15): Locked because highestUnlockedLevel (6) < 11
      expect(screen.queryByTestId('select-stage-3')).not.toBeInTheDocument();
      expect(screen.getByTestId('locked-stage-3')).toBeInTheDocument();
      expect(screen.getByTestId('locked-stage-3')).toHaveTextContent('Level 11 Required');
    });

    it('allows selecting an unlocked stage and triggers callback with correct level info', () => {
      const handleSelectStage = vi.fn();
      render(
        <GameProgressionHub
          gameTitle="Space Sound Mission"
          stages={mockStages}
          currentLevel={6}
          highestUnlockedLevel={6}
          hasSavedProgress={true}
          onSelectStage={handleSelectStage}
        />
      );

      fireEvent.click(screen.getByTestId('choose-stage-button'));

      // Select Stage 2 (starts at Level 6 -> 0-based index 5)
      fireEvent.click(screen.getByTestId('select-stage-2'));
      expect(handleSelectStage).toHaveBeenCalledTimes(1);
      expect(handleSelectStage).toHaveBeenCalledWith(
        expect.objectContaining({
          stageNumber: 2,
          startLevel: 6,
          startLevelIndex: 5,
        })
      );
    });

    it('navigates back from stages view to entry view', () => {
      render(
        <GameProgressionHub
          gameTitle="Space Sound Mission"
          stages={mockStages}
          currentLevel={1}
        />
      );

      fireEvent.click(screen.getByTestId('choose-stage-button'));
      expect(screen.getByTestId('stages-roadmap-view')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('stage-roadmap-back-btn'));
      expect(screen.getByTestId('progression-hub-entry')).toBeInTheDocument();
    });
  });

  describe('Restart Flow with Confirmation', () => {
    it('prompts confirmation when clicking restart and cancels safely', () => {
      const handleRestart = vi.fn();
      render(
        <GameProgressionHub
          gameTitle="Space Sound Mission"
          stages={mockStages}
          currentLevel={12}
          hasSavedProgress={true}
          onRestart={handleRestart}
        />
      );

      fireEvent.click(screen.getByTestId('restart-game-button'));
      expect(screen.getByTestId('restart-confirm-view')).toBeInTheDocument();
      expect(screen.getByText('Restart From Level 1?')).toBeInTheDocument();
      expect(screen.getByText(/You are currently on/)).toBeInTheDocument();
      expect(screen.getByText('Level 12')).toBeInTheDocument();

      // Cancel keeps current state and returns to entry
      fireEvent.click(screen.getByTestId('cancel-restart-button'));
      expect(handleRestart).not.toHaveBeenCalled();
      expect(screen.getByTestId('progression-hub-entry')).toBeInTheDocument();
    });

    it('confirms restart, executes callback, and returns to entry view', () => {
      const handleRestart = vi.fn();
      render(
        <GameProgressionHub
          gameTitle="Space Sound Mission"
          stages={mockStages}
          currentLevel={12}
          hasSavedProgress={true}
          onRestart={handleRestart}
        />
      );

      fireEvent.click(screen.getByTestId('restart-game-button'));
      fireEvent.click(screen.getByTestId('confirm-restart-button'));

      expect(handleRestart).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('progression-hub-entry')).toBeInTheDocument();
    });
  });

  describe('Modal Mode', () => {
    it('renders as modal and supports close callback', () => {
      const handleClose = vi.fn();
      render(
        <GameProgressionHub
          mode="modal"
          initialView="stages"
          stages={mockStages}
          onClose={handleClose}
        />
      );

      expect(screen.getByTestId('progression-hub-modal')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('stage-roadmap-back-btn'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});

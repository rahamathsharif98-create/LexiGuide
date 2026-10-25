import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2, Sparkles, Hammer, RotateCcw } from 'lucide-react';
import VoxelApp from '../../games/voxel-crafter/VoxelApp';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { gameSound } from '../../services/gameSoundService';
import GameProgressionHub from '../../components/games/GameProgressionHub';
import { VOXEL_CRAFTER_STAGES } from '../../games/voxel-crafter/engine/craftRecipes';
import {
  loadVoxelCrafterCheckpointData,
  saveVoxelCrafterCheckpoint,
  resetVoxelCrafterCheckpoint,
} from '../../games/voxel-crafter/engine/voxelCrafterCheckpoint';
import { useGameSessionTracker } from '../../hooks/useGameSessionTracker';
import { useApp } from '../../context/AppContext';

function useSafeApp() {
  try {
    return useApp();
  } catch {
    return { activeChild: null };
  }
}

export default function VoxelCrafterGame({ initialModal = 'entry' }) {
  const navigate = useNavigate();
  const { activeChild } = useSafeApp();
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeModal, setActiveModal] = useState(initialModal); // 'entry' | 'stages' | 'restartConfirm' | null
  const [appKey, setAppKey] = useState(0);
  const [targetRecipe, setTargetRecipe] = useState(null);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(() => {
    return loadVoxelCrafterCheckpointData(activeChild?.id).recipeIndex;
  });
  const isSavedRef = useRef(false);

  useEffect(() => {
    const data = loadVoxelCrafterCheckpointData(activeChild?.id);
    setCurrentRecipeIndex(data.recipeIndex);
    setTargetRecipe(null);
  }, [activeChild?.id]);

  const tracker = useGameSessionTracker({
    gameId: 'voxel-crafter',
    gameTitle: 'Voxel Word Crafter',
    skill: 'wordSpellingConstruction',
  });

  const checkpointData = loadVoxelCrafterCheckpointData(activeChild?.id);
  const highestUnlockedLevel = checkpointData.highestUnlockedLevel;
  const hasSavedProgress = currentRecipeIndex > 0;

  const handleSelectStage = useCallback(
    ({ startLevelIndex }) => {
      saveVoxelCrafterCheckpoint(activeChild?.id, { recipeIndex: startLevelIndex });
      setTargetRecipe(startLevelIndex);
      setCurrentRecipeIndex(startLevelIndex);
      setActiveModal(null);
    },
    [activeChild?.id]
  );

  const handleRestart = useCallback(() => {
    resetVoxelCrafterCheckpoint(activeChild?.id);
    setTargetRecipe(0);
    setCurrentRecipeIndex(0);
    setAppKey((k) => k + 1);
    setActiveModal(null);
  }, [activeChild?.id]);

  const handleRoundComplete = useCallback((result) => {
    tracker.recordAttempt(result.isCorrect, {
      roundScore: result.score || 150,
      starsEarned: result.stars || 1,
      xpEarned: result.xp || 20,
    });
    // Session is saved once on victory or exit via handleBack, guarded by isSavedRef
  }, [tracker]);

  const handleGameComplete = useCallback((finalStats = {}) => {
    if (!isSavedRef.current) {
      isSavedRef.current = true;
      tracker.saveCompletedSession(finalStats);
    }
  }, [tracker]);

  const handleResetSession = useCallback(() => {
    isSavedRef.current = false;
  }, []);

  const handleBack = useCallback(() => {
    gameSound.stopSpeech?.();
    if (!isSavedRef.current) {
      isSavedRef.current = true;
      tracker.saveCompletedSession();
    }
    navigate('/child/games');
  }, [tracker, navigate]);

  const trackerRef = useRef(tracker);
  trackerRef.current = tracker;

  // Unmount safety guard — ensures accumulated session is saved if user navigates away, and stops active speech
  useEffect(() => {
    return () => {
      gameSound.stopSpeech?.();
      if (!isSavedRef.current) {
        isSavedRef.current = true;
        trackerRef.current?.saveCompletedSession?.();
      }
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-4">
      {/* 1. Top Navigation - Back button, Stage selection, Restart, and Fullscreen toggle */}
      <div className="flex items-center justify-between gap-3 px-2">
        <button
          type="button"
          data-testid="page-back-btn"
          onClick={handleBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/90 hover:bg-white text-[#08233A] font-extrabold text-sm border border-[#D7EEF1] shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>Back to Games</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveModal('entry')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-400/50 hover:border-emerald-500 text-emerald-700 font-extrabold text-xs shadow-xs transition-all cursor-pointer active:scale-95 hover:bg-emerald-50"
            data-testid="voxel-hub-btn"
            title="Open Mission Hub"
          >
            <span>🎮</span>
            <span>Game Hub</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('stages')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-400/50 hover:border-emerald-500 text-emerald-700 font-extrabold text-xs shadow-xs transition-all cursor-pointer active:scale-95 hover:bg-emerald-50"
            data-testid="voxel-stages-btn"
            title="Choose Stage Roadmap"
          >
            <span>🗺️</span>
            <span>Stages</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('restartConfirm')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-600 font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
            data-testid="voxel-restart-btn"
            title="Start Over from Level 1"
          >
            <RotateCcw size={14} />
            <span>Restart</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#08233A] hover:bg-[#0D3252] text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* 2. 3D Game Canvas Container */}
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden bg-sky-900 transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none border-0'
            : 'h-[75vh] min-h-[560px] max-h-[800px] rounded-3xl border-4 border-emerald-400/40 shadow-[0_16px_40px_rgba(16,185,129,0.25)]'
        }`}
      >
        <ErrorBoundary
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-emerald-950 text-emerald-100">
              <span className="text-5xl mb-3">🧱</span>
              <h3 className="font-display font-black text-lg text-emerald-300 mb-1">Voxel Word Crafter</h3>
              <p className="text-xs text-emerald-200/70 max-w-sm mb-4">Click below to start crafting voxel words!</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-sm cursor-pointer"
              >
                Start Crafting
              </button>
            </div>
          }
        >
          <VoxelApp
            key={appKey}
            childId={activeChild?.id}
            targetRecipeIndex={targetRecipe}
            onBack={handleBack}
            onComplete={handleGameComplete}
            onResetSession={handleResetSession}
            onRoundComplete={handleRoundComplete}
            onRoundChange={(idx) => setCurrentRecipeIndex(idx)}
            onOpenStages={() => setActiveModal('stages')}
          />
        </ErrorBoundary>
      </div>

      {/* 3. Guidance Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-200 font-semibold">
        <div className="flex items-center gap-2">
          <Hammer size={16} className="text-emerald-400" />
          <span className="font-extrabold text-emerald-300">Voxel Crafting:</span>
          <span>Click the letter cubes in order to craft amazing 3D voxel items on your workbench!</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <Sparkles size={14} />
          <span>3D Voxel Word Crafter</span>
        </div>
      </div>

      {/* 4. Progression Hub Modal (Game Entry, Stages Roadmap, Restart Confirmation) */}
      {activeModal && (
        <GameProgressionHub
          mode="modal"
          initialView={activeModal}
          gameTitle="Voxel Word Crafter"
          gameIcon="🧱"
          gameBadge="3D Voxel Crafter"
          instructions="Click the floating letter cubes in sequence to craft amazing 3D voxel creations on your workbench!"
          stages={VOXEL_CRAFTER_STAGES}
          currentLevel={currentRecipeIndex + 1}
          highestUnlockedLevel={highestUnlockedLevel}
          hasSavedProgress={hasSavedProgress}
          theme={{ primaryColor: '#10b981', mascot: '🧱 Blocky' }}
          onStart={() => setActiveModal(null)}
          onResume={() => setActiveModal(null)}
          onSelectStage={handleSelectStage}
          onRestart={handleRestart}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}

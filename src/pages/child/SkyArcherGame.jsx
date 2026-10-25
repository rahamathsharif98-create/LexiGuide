import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2, Sparkles, Volume2, RotateCcw } from 'lucide-react';
import SkyArcherApp from '../../games/sky-archer/SkyArcherApp';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import GameSoundToggle from '../../components/games/GameSoundToggle';
import GameProgressionHub from '../../components/games/GameProgressionHub';
import { SKY_ARCHER_STATIONS } from '../../games/sky-archer/engine/phonicsTargets';
import {
  loadSkyArcherCheckpointData,
  saveSkyArcherCheckpoint,
  resetSkyArcherCheckpoint,
} from '../../games/sky-archer/engine/skyArcherCheckpoint';
import { useGameSessionTracker } from '../../hooks/useGameSessionTracker';
import { useApp } from '../../context/AppContext';

function useSafeApp() {
  try {
    return useApp();
  } catch {
    return { activeChild: null };
  }
}

export default function SkyArcherGame() {
  const navigate = useNavigate();
  const { activeChild } = useSafeApp();
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'stages' | 'restartConfirm' | null
  const [appKey, setAppKey] = useState(0);
  const [targetRound, setTargetRound] = useState(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(() => {
    return loadSkyArcherCheckpointData(activeChild?.id).roundIndex;
  });
  const isSavedRef = useRef(false);

  useEffect(() => {
    const data = loadSkyArcherCheckpointData(activeChild?.id);
    setCurrentRoundIndex(data.roundIndex);
    setTargetRound(null);
  }, [activeChild?.id]);

  const tracker = useGameSessionTracker({
    gameId: 'sky-archer',
    gameTitle: 'Sky Word Archer',
    skill: 'phonicsDiscrimination',
  });

  const checkpointData = loadSkyArcherCheckpointData(activeChild?.id);
  const highestUnlockedRound = checkpointData.highestUnlockedRound;
  const hasSavedProgress = currentRoundIndex > 0;

  const handleSelectStage = useCallback(
    ({ startLevelIndex }) => {
      saveSkyArcherCheckpoint(activeChild?.id, startLevelIndex);
      setTargetRound(startLevelIndex);
      setCurrentRoundIndex(startLevelIndex);
      setActiveModal(null);
    },
    [activeChild?.id]
  );

  const handleRestart = useCallback(() => {
    resetSkyArcherCheckpoint(activeChild?.id);
    setTargetRound(0);
    setCurrentRoundIndex(0);
    setAppKey((k) => k + 1);
    setActiveModal(null);
  }, [activeChild?.id]);

  const handleRoundComplete = useCallback((result) => {
    tracker.recordAttempt(result.isCorrect, {
      roundScore: result.score || 150,
      starsEarned: result.stars || 1,
      xpEarned: result.xp || 20,
    });
    // Session is saved once on exit via handleBack
  }, [tracker]);

  const handleBack = useCallback(() => {
    if (!isSavedRef.current) {
      isSavedRef.current = true;
      tracker.saveCompletedSession();
    }
    navigate('/child/games');
  }, [tracker, navigate]);

  const handleGameComplete = useCallback((summary) => {
    // Game completed (Master Archer victory)
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
      {/* 1. Top Header */}
      <div className="flex items-center justify-between gap-3 px-2">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/90 hover:bg-white text-[#08233A] font-extrabold text-sm border border-[#D7EEF1] shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>Back to Games</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveModal('stages')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#38bdf8]/40 hover:border-[#38bdf8] text-[#0284c7] font-extrabold text-xs shadow-xs transition-all cursor-pointer active:scale-95 hover:bg-sky-50"
            data-testid="sky-archer-stages-button"
            title="Choose Stage Roadmap"
          >
            <span>🗺️</span>
            <span>Stages</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('restartConfirm')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-600 font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
            data-testid="sky-archer-restart-button"
            title="Start Over from Level 1"
          >
            <RotateCcw size={14} />
            <span>Restart</span>
          </button>

          <GameSoundToggle />
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

      {/* 2. 3D Game Container */}
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden bg-[#e0f2fe] transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none border-0'
            : 'h-[75vh] min-h-[560px] max-h-[800px] rounded-3xl border-4 border-[#38bdf8]/40 shadow-[0_16px_40px_rgba(56,189,248,0.2)]'
        }`}
      >
        <ErrorBoundary
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-sky-50">
              <span className="text-5xl mb-3">🏹</span>
              <h3 className="font-display font-black text-lg text-[#08233A] mb-1">Sky Word Archer</h3>
              <p className="text-xs text-[#527080] max-w-sm mb-4">Click below to start playing!</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Reload Game
              </button>
            </div>
          }
        >
          <SkyArcherApp
            key={appKey}
            childId={activeChild?.id}
            targetRoundIndex={targetRound}
            onBack={handleBack}
            onComplete={handleGameComplete}
            onRoundComplete={handleRoundComplete}
            onRoundChange={(idx) => setCurrentRoundIndex(idx)}
          />
        </ErrorBoundary>
      </div>

      {/* 3. Controls & Guidance Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[#f0f9ff] border border-[#bae6fd] text-xs text-[#0369a1] font-semibold">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-[#0c4a6e]">🏹 Instructions:</span>
          <span>Listen to the sound prompt, aim your cursor, and click/tap to pop the matching balloon!</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#0284c7] font-bold">
          <Sparkles size={14} />
          <span>3D Phonics Adventure</span>
        </div>
      </div>

      {/* 4. Progression Hub Modal (Stage Selection Roadmap & Restart Confirmation) */}
      {activeModal && (
        <GameProgressionHub
          mode="modal"
          initialView={activeModal}
          gameTitle="Sky Word Archer"
          gameIcon="🏹"
          instructions="Aim your cursor and pop the balloon matching the target phonics sound!"
          stages={SKY_ARCHER_STATIONS}
          currentLevel={currentRoundIndex + 1}
          highestUnlockedLevel={highestUnlockedRound}
          hasSavedProgress={hasSavedProgress}
          onSelectStage={handleSelectStage}
          onRestart={handleRestart}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
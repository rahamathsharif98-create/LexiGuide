import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2, Sparkles, Rocket } from 'lucide-react';
import CosmicMinerApp from '../../games/cosmic-miner/CosmicMinerApp';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import GameSoundToggle from '../../components/games/GameSoundToggle';
import { gameSound } from '../../services/gameSoundService';
import { useGameSessionTracker } from '../../hooks/useGameSessionTracker';
import { useApp } from '../../context/AppContext';

function useSafeApp() {
  try {
    return useApp();
  } catch {
    return { activeChild: null };
  }
}

export default function CosmicMinerGame() {
  const navigate = useNavigate();
  const { activeChild } = useSafeApp();
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isSavedRef = useRef(false);

  const tracker = useGameSessionTracker({
    gameId: 'cosmic-miner',
    gameTitle: 'Cosmic Letter Miner',
    skill: 'letterSequencing',
  });

  const handleRoundComplete = useCallback(
    (result) => {
      tracker.recordAttempt(result.isCorrect, {
        roundScore: result.score || 150,
        starsEarned: result.stars || 1,
        xpEarned: result.xp || 20,
      });
    },
    [tracker]
  );

  const handleGameComplete = useCallback(
    (finalStats = {}) => {
      if (!isSavedRef.current) {
        isSavedRef.current = true;
        tracker.saveCompletedSession(finalStats);
      }
    },
    [tracker]
  );

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

  // Unmount safety guard — ensures accumulated session is saved if user navigates away, and stops speech
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
    <div className="w-full flex flex-col h-[calc(100vh-8.2rem)] min-h-[460px] -my-3 pb-0 space-y-2">
      {/* 1. Top Navigation */}
      <div className="flex-shrink-0 flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#08233A] font-extrabold text-xs sm:text-sm border border-[#D7EEF1] shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft size={15} />
          <span>Back to Games</span>
        </button>

        <div className="flex items-center gap-2">
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

      {/* 2. 3D Game Canvas Container */}
      <div
        ref={containerRef}
        className={`relative w-full flex-1 min-h-[360px] overflow-hidden bg-[#050814] transition-all duration-200 ${
          isFullscreen
            ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none border-0 shadow-none'
            : 'rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-cyan-500/40 shadow-[0_12px_36px_rgba(6,182,212,0.22)]'
        }`}
      >
        <ErrorBoundary
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-cyan-200">
              <span className="text-5xl mb-3">🪐</span>
              <h3 className="font-display font-black text-lg text-cyan-400 mb-1">Cosmic Letter Miner</h3>
              <p className="text-xs text-cyan-300/70 max-w-sm mb-4">Click below to start mining space crystals!</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs shadow-sm cursor-pointer"
              >
                Start Mining
              </button>
            </div>
          }
        >
          <CosmicMinerApp
            childId={activeChild?.id}
            onBack={handleBack}
            onComplete={handleGameComplete}
            onResetSession={handleResetSession}
            onRoundComplete={handleRoundComplete}
          />
        </ErrorBoundary>
      </div>

      {/* 3. Footer Guidance */}
      <div className="flex-shrink-0 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-800/60 text-[11px] text-cyan-200 font-semibold overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <Rocket size={14} className="text-cyan-400 shrink-0" />
          <span className="font-extrabold text-cyan-300 shrink-0">Lunar Mission:</span>
          <span className="truncate">Drive rover or click crystals to spell mission words and fuel up the rocket!</span>
        </div>
        <div className="flex items-center gap-1 text-amber-400 font-bold text-[10px] sm:text-xs shrink-0">
          <Sparkles size={12} />
          <span>3D Space Letter Miner</span>
        </div>
      </div>
    </div>
  );
}

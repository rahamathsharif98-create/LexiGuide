import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2, Sparkles, Volume2 } from 'lucide-react';
import SkyArcherApp from '../../games/sky-archer/SkyArcherApp';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import GameSoundToggle from '../../components/games/GameSoundToggle';
import { useGameSessionTracker } from '../../hooks/useGameSessionTracker';

export default function SkyArcherGame() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const tracker = useGameSessionTracker({
    gameId: 'sky-archer',
    gameTitle: 'Sky Word Archer',
    skill: 'phonicsDiscrimination',
  });

  const handleRoundComplete = useCallback((result) => {
    tracker.recordAttempt(result.isCorrect, {
      roundScore: result.score || 150,
      starsEarned: result.stars || 1,
      xpEarned: result.xp || 20,
    });
    if (result.isCorrect) {
      tracker.saveCompletedSession({
        stars: result.stars || 1,
        xp: result.xp || 20,
        score: result.score || 150,
        details: { letter: result.letter },
      });
    }
  }, [tracker]);

  const handleBack = useCallback(() => {
    tracker.saveCompletedSession();
    navigate('/child/games');
  }, [tracker, navigate]);

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
          <SkyArcherApp onComplete={handleRoundComplete} onRoundComplete={handleRoundComplete} />
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
    </div>
  );
}
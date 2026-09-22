import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import SpiderApp from '../../games/spider-weaver/SpiderApp';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import GameSoundToggle from '../../components/games/GameSoundToggle';
import { useGameSessionTracker } from '../../hooks/useGameSessionTracker';

/**
 * SpiderWeaverGame.jsx
 * Full-screen Child Game Page for "Spinny the Spider: Web Weaver"
 */
export default function SpiderWeaverGame() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const tracker = useGameSessionTracker({
    gameId: 'spider-weaver',
    gameTitle: 'Spinny the Spider: Web Weaver',
    skill: 'rimeBlending',
  });

  const handleRoundComplete = useCallback((result) => {
    tracker.recordAttempt(result.isCorrect, {
      roundScore: result.score || 250,
      starsEarned: result.stars || 1,
      xpEarned: result.xp || 25,
      targetWord: result.targetWord,
    });
    if (result.isCorrect) {
      tracker.saveCompletedSession({
        stars: result.stars || 1,
        xp: result.xp || 25,
        score: result.score || 500,
        details: { targetWord: result.targetWord },
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
      {/* 1. Top Navigation */}
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

      {/* 2. 3D Game Canvas Container */}
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden bg-slate-950 transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none border-0'
            : 'h-[75vh] min-h-[560px] max-h-[800px] rounded-3xl border-4 border-purple-500/40 shadow-[0_16px_40px_rgba(168,85,247,0.25)]'
        }`}
      >
        <ErrorBoundary
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-purple-200">
              <span className="text-5xl mb-3">🕷️</span>
              <h3 className="font-display font-black text-lg text-purple-300 mb-1">Spinny the Spider: Web Weaver</h3>
              <p className="text-xs text-purple-200/70 max-w-sm mb-4">Click below to start weaving words on the web!</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-slate-950 font-black text-xs shadow-sm cursor-pointer"
              >
                Reload Web Adventure
              </button>
            </div>
          }
        >
          <SpiderApp onBack={handleBack} onRoundComplete={handleRoundComplete} />
        </ErrorBoundary>
      </div>

      {/* 3. Educational Helper Card */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-white/80 border border-purple-100 shadow-sm text-xs font-medium text-slate-600">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600 shrink-0" />
          <span>
            <strong>Phonics Word Weaving:</strong> Help Spinny connect the beginning sound (onset) to the ending rime on the glistening silk web.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-purple-700 font-bold bg-purple-50 px-3 py-1 rounded-xl">
          <span>Target Skill:</span>
          <span className="font-black text-purple-900">Word Recognition</span>
        </div>
      </div>
    </div>
  );
}

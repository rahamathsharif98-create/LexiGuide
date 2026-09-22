import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Maximize2, Minimize2, Star, Sparkles, Trophy, Gamepad2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import LearningRunApp from '../../games/learning-run/App'
import { setHostStudentId, setHostSessionHandler } from '../../games/learning-run/services/integration/gameBridge'
import GameSoundToggle from '../../components/games/GameSoundToggle'

function useSafeApp() {
  try {
    return useApp()
  } catch {
    return {
      activeChild: null,
      saveLearningSession: async () => {},
      showToast: () => {},
    }
  }
}

export default function LearningRunGame() {
  const navigate = useNavigate()
  const { activeChild, saveLearningSession, showToast } = useSafeApp()
  const containerRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen request denied or unsupported:', err)
      })
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
    }
  }, [])

  // Connect host AppContext to gameBridge
  useEffect(() => {
    setHostStudentId(activeChild?.id || 'child_1')

    setHostSessionHandler(async (finalResult) => {
      setLastResult(finalResult)
      const starsEarned = finalResult.starsEarned ?? 3
      const xpEarned = starsEarned * 10
      const lettersCount = finalResult.lettersCollected?.length || 0
      const wordsCount = finalResult.wordsCompleted?.length || 0

      try {
        if (typeof saveLearningSession === 'function') {
          await saveLearningSession({
            activity_id: 'learning-run',
            skill: 'phonologicalAwareness',
            outcome: {
              type: 'game',
              gameId: 'learning-run',
              title: 'LexiGuide Learning Run',
              score: Math.round(finalResult.distance || 0),
              starsGain: starsEarned,
              xpGain: xpEarned,
              accuracy: finalResult.challengesCompleted > 0
                ? Math.round(((finalResult.challengesCorrect || 0) / finalResult.challengesCompleted) * 100)
                : 92,
              duration: finalResult.duration || 60,
              lettersCount,
              wordsCount,
              details: {
                distance: finalResult.distance,
                lettersCollected: finalResult.lettersCollected,
                wordsCompleted: finalResult.wordsCompleted,
                observedPatterns: finalResult.observedPatterns,
                difficultLetters: finalResult.difficultLetters,
              },
            },
            stars: starsEarned,
            xp: xpEarned,
          })
        }
        if (typeof showToast === 'function') {
          showToast(`🏃‍♂️ Amazing run! +${starsEarned} ⭐ & +${xpEarned} XP saved!`, 'success')
        }
      } catch (err) {
        console.error('Failed to persist learning run session to LexiGuide:', err)
      }
    })

    return () => {
      setHostSessionHandler(null);
    }
  }, [activeChild?.id, saveLearningSession, showToast])

  return (
    <div className="w-full flex flex-col gap-3 pb-8" data-testid="learning-run-page">
      {/* 1. Header Bar: Navigation, child status, and fullscreen toggle */}
      <div className="flex items-center justify-between gap-3 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border-2 border-[#D7EEF1] shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/child/games')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F2FBFC] hover:bg-[#DDF9FC] text-[#08233A] hover:text-[#0899AA] font-bold text-sm border border-[#D7EEF1] transition-all cursor-pointer shadow-2xs active:scale-95"
            aria-label="Back to Gaming Zone"
          >
            <ArrowLeft size={16} />
            <span>Games</span>
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xl">🏃‍♂️</span>
            <div className="flex flex-col">
              <span className="font-extrabold text-[#08233A] text-sm leading-tight">LexiGuide Learning Run</span>
              <span className="text-[11px] text-[#527080] font-semibold">3D Phonics Adventure</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {activeChild && (
            <div className="hidden md:flex items-center gap-2 bg-[#F2FBFC] px-3 py-1 rounded-full border border-[#D7EEF1] text-xs font-bold text-[#08233A]">
              <span>{activeChild.avatar || '🧒'}</span>
              <span>{activeChild.name}</span>
              <span className="text-[#0899AA] font-extrabold flex items-center gap-0.5">
                <Star size={12} className="fill-[#0899AA]" />
                {activeChild.stars || 0}
              </span>
            </div>
          )}

          <GameSoundToggle />

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#08233A] hover:bg-[#0D3252] text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Game Viewport Frame */}
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden bg-[#dcfce7] transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none border-0'
            : 'h-[76vh] min-h-[580px] max-h-[820px] rounded-3xl border-4 border-[#22c55e]/40 shadow-[0_16px_40px_rgba(34,197,94,0.2)]'
        }`}
      >
        {/* Floating exit fullscreen button when in fullscreen mode */}
        {isFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-xs border border-white/20 backdrop-blur shadow-lg transition-all cursor-pointer"
          >
            <Minimize2 size={14} />
            <span>Exit Fullscreen</span>
          </button>
        )}

        {/* The 3D Endless Runner Game Engine */}
        <div className="w-full h-full relative">
          <LearningRunApp />
        </div>
      </div>

      {/* 3. Controls & Guidance Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-[#E6F8FA]/60 border border-[#D7EEF1] text-xs text-[#527080] font-semibold">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-[#08233A]">🎮 Controls:</span>
          <span className="bg-white px-2 py-0.5 rounded border border-[#D7EEF1] font-mono text-[11px] text-[#08233A]">← / A</span>
          <span className="bg-white px-2 py-0.5 rounded border border-[#D7EEF1] font-mono text-[11px] text-[#08233A]">→ / D</span>
          <span>Switch Lanes</span>
          <span className="text-gray-300">•</span>
          <span className="bg-white px-2 py-0.5 rounded border border-[#D7EEF1] font-mono text-[11px] text-[#08233A]">Space / ↑</span>
          <span>Jump</span>
          <span className="text-gray-300">•</span>
          <span className="bg-white px-2 py-0.5 rounded border border-[#D7EEF1] font-mono text-[11px] text-[#08233A]">↓ / S</span>
          <span>Slide</span>
          <span className="text-gray-300">•</span>
          <span>Mobile: Swipe left, right, up, down</span>
        </div>

        <div className="flex items-center gap-1.5 text-[#0899AA] font-bold">
          <Sparkles size={14} />
          <span>Non-clinical, encouraging 3D learning</span>
        </div>
      </div>
    </div>
  )
}

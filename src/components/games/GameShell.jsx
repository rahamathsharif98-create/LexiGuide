import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { ChildDotProgress } from '../child/ChildDotProgress'
import { GameAudioButton } from './GameAudioButton'
import { HelpButton } from '../child/HelpButton'
import { GameFeedback } from './GameFeedback'
import { GameReward } from './GameReward'

/**
 * GameShell (Section 5, 6, 33, 38)
 * Standardized container ensuring every game maintains:
 * - One primary action per screen
 * - Secondary controls (Back, Help, Replay) visually subdued
 * - SEE -> HEAR -> TRY -> HELP -> RETRY -> CELEBRATE progression
 */
export function GameShell({
  title = 'Adventure',
  icon = '🎮',
  prompt = '',
  audioPrompt = '',
  audioLang = 'en',
  stage = 'intro', // 'intro' | 'playing' | 'finished'
  roundIdx = 0,
  totalRounds = 3,
  score = 0,
  feedback = null, // 'correct' | 'wrong' | null
  hint = '',
  onStart,
  onRestart,
  nextGame = null,
  children,
  className = '',
}) {
  const navigate = useNavigate()

  return (
    <div className={`max-w-xl mx-auto pb-8 ${className}`}>
      {/* Top Bar: Back button + Non-anxious dot progress */}
      <div className="flex items-center justify-between gap-3 mb-4 px-1">
        <button
          type="button"
          onClick={() => navigate('/child/games')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-[#D7EEF1] text-[#527080] hover:text-[#08233A] font-display font-bold text-xs hover:bg-[#F2FBFC] min-h-[40px] shadow-2xs transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Games</span>
        </button>

        {stage === 'playing' && (
          <ChildDotProgress
            current={roundIdx + 1}
            total={totalRounds}
            label={`Round ${roundIdx + 1} of ${totalRounds}`}
            size="sm"
          />
        )}
      </div>

      {/* Stage 1: INTRO SCREEN */}
      {stage === 'intro' && (
        <div className="text-center p-6 sm:p-8 rounded-3xl border border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white animate-fadeIn">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#DDF9FC] border border-[#D7EEF1] flex items-center justify-center text-5xl mb-4 shadow-inner">
            {icon}
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#08233A]">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-[#527080] font-semibold mt-2 mb-4 max-w-sm mx-auto leading-relaxed">
            {prompt}
          </p>

          {audioPrompt && (
            <div className="flex justify-center mb-6">
              <GameAudioButton
                text={audioPrompt}
                lang={audioLang}
                label="Hear Instructions"
                size="md"
              />
            </div>
          )}

          <button
            type="button"
            onClick={onStart}
            className="w-full sm:w-auto min-h-[52px] px-8 rounded-2xl font-display font-black text-base border-b-4 border-[#0899AA] active:border-b-0 active:translate-y-1 shadow-md bg-[#13CFE3] text-[#08233A] hover:bg-[#0899AA] hover:text-white transition-all cursor-pointer"
          >
            START GAME ▶
          </button>
        </div>
      )}

      {/* Stage 2: PLAYING ARENA */}
      {stage === 'playing' && (
        <div className="relative rounded-3xl p-6 bg-white border border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] min-h-[320px] flex flex-col justify-between">
          <GameFeedback status={feedback} />

          {/* Prompt Header */}
          <div className="text-center mb-5">
            <h2 className="font-display font-black text-lg sm:text-xl text-[#08233A]">
              {prompt}
            </h2>
            {audioPrompt && (
              <div className="mt-2.5 flex justify-center">
                <GameAudioButton
                  text={audioPrompt}
                  lang={audioLang}
                  size="sm"
                  label="Listen"
                />
              </div>
            )}
          </div>

          {/* Game Interaction Area */}
          <div className="my-auto py-2">
            {children}
          </div>

          {/* Secondary Footer: Clue / Help Assistant */}
          <div className="mt-6 pt-4 border-t border-[#F2FBFC] flex items-center justify-center gap-3">
            <HelpButton
              instruction={prompt}
              visualHint={hint}
              lang={audioLang}
            />
          </div>
        </div>
      )}

      {/* Stage 3: FINISHED REWARD */}
      {stage === 'finished' && (
        <GameReward
          score={score}
          total={totalRounds}
          gameTitle={title}
          onRestart={onRestart}
          nextGame={nextGame}
          onNavigateHome={() => navigate('/child/games')}
        />
      )}
    </div>
  )
}

export default GameShell

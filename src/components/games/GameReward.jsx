import React from 'react'
import { AppLink as Link } from '../nav/AppLink'
import { ChildTactileButton } from '../child/ChildTactileButton'

/**
 * GameReward (Section 25 & 29)
 * Gentle completion screen:
 * - "Nice work!"
 * - Stars earned ⭐
 * - Recommended next activity
 * - Simple buttons: Play Again or Next
 */
export function GameReward({
  score = 0,
  total = 3,
  gameTitle = 'Adventure',
  onRestart,
  nextGame = null,
  onNavigateHome,
  className = '',
}) {
  return (
    <div
      className={`text-center p-6 sm:p-8 rounded-3xl border border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white max-w-md mx-auto animate-fadeIn ${className}`}
    >
      <div className="relative inline-block mb-3">
        <div className="w-20 h-20 rounded-3xl bg-[#FEF8EC] border-2 border-[#FDE6BE] flex items-center justify-center text-5xl shadow-inner mx-auto">
          ⭐
        </div>
        <span className="absolute -top-1 -right-1 text-2xl animate-pulse">✨</span>
      </div>

      <h2 className="font-display font-black text-2xl sm:text-3xl text-[#08233A] mb-1">
        Awesome Job! 🎉
      </h2>
      <p className="text-xs sm:text-sm text-[#527080] font-semibold">
        You completed {gameTitle}!
      </p>

      {/* Star award */}
      <div className="inline-flex items-center gap-2 bg-[#FEF8EC] border border-[#FDE6BE] px-4 py-2 rounded-2xl my-4 text-sm font-display font-black text-[#B45309]">
        <span>⭐</span>
        <span>+{score} Stars Earned!</span>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 my-4">
        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border-2 border-[#D7EEF1] text-xs font-display font-black text-[#08233A] hover:bg-[#F2FBFC] transition-colors cursor-pointer"
          >
            Play Again 🔄
          </button>
        )}
        {onNavigateHome && (
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#F2FBFC] border border-[#D7EEF1] text-xs font-display font-black text-[#08233A] hover:bg-[#E6F8FA] transition-colors cursor-pointer"
          >
            Gaming Zone 🎮
          </button>
        )}
      </div>

      {/* Next Game Recommendation */}
      {nextGame && (
        <div className="mt-5 pt-5 border-t border-[#F2FBFC] text-left">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#0899AA] bg-[#DDF9FC] px-2.5 py-0.5 rounded-md">
            Recommended Next ✨
          </span>
          <div className="flex items-center justify-between gap-3 mt-2 bg-[#F2FBFC] p-3.5 rounded-2xl border border-[#D7EEF1]">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl">{nextGame.icon || '🚀'}</span>
              <div className="min-w-0">
                <p className="font-display font-black text-xs sm:text-sm text-[#08233A] truncate">
                  {nextGame.title}
                </p>
                <p className="text-[11px] text-[#527080] truncate font-medium">
                  {nextGame.desc}
                </p>
              </div>
            </div>
            <Link to={nextGame.route} className="no-underline shrink-0">
              <ChildTactileButton size="sm" variant="cyan">
                PLAY NEXT ▶
              </ChildTactileButton>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameReward

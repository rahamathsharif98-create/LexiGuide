import React from 'react'

/**
 * GameFeedback (Section 24)
 * Calm, encouraging feedback overlays.
 * Never displays "WRONG", "FAIL", or "GAME OVER".
 */
export function GameFeedback({
  status = null, // 'correct' | 'wrong' | null
  correctMessage = '🎉 Great job!',
  retryMessage = "💛 Let's try again!",
  className = '',
}) {
  if (!status) return null

  const isCorrect = status === 'correct'

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center rounded-3xl z-30 transition-all backdrop-blur-xs p-6 animate-fadeIn ${
        isCorrect
          ? 'bg-[#E6F8FA]/95 text-[#0899AA] border-2 border-[#13CFE3] shadow-lg'
          : 'bg-[#FFF9E6]/95 text-[#B87D00] border-2 border-[#FFC857] shadow-lg'
      } ${className}`}
      role="status"
      data-testid="game-feedback-overlay"
    >
      <div className="text-5xl mb-2 animate-bounce">
        {isCorrect ? '⭐' : '🌱'}
      </div>
      <h3 className="font-display font-black text-2xl sm:text-3xl text-center">
        {isCorrect ? correctMessage : retryMessage}
      </h3>
      <p className="text-xs sm:text-sm font-bold mt-1 opacity-90 text-center">
        {isCorrect ? 'You found the right match!' : 'Take your time and listen closely.'}
      </p>
    </div>
  )
}

export default GameFeedback

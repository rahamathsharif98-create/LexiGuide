import React from 'react'
import { Sparkles, RotateCcw, ArrowRight, Volume2 } from 'lucide-react'
import { ChildButton } from './ChildButton'

/**
 * FeedbackMessage (Section 16 & 17)
 * Calm, encouraging, non-punitive feedback experience.
 *
 * Success (Section 16):
 * - Calm reward (⭐ Great listening!)
 * - Soft star animation (⭐ → ✨ → ⭐)
 * - [Next Adventure] CTA
 *
 * Retry (Section 17):
 * - Never "WRONG", "FAILED", or "INCORRECT"
 * - "Let's try again."
 * - [🔊 Listen Again] & [TRY AGAIN]
 */
export function FeedbackMessage({
  type = 'success', // 'success' | 'retry'
  title = '',
  message = '',
  onNext,
  onRetry,
  onListenAgain,
  nextLabel = 'Next Adventure ▶',
  retryLabel = 'Try Again 🔄',
  className = '',
}) {
  if (type === 'success') {
    return (
      <div
        className={`p-6 rounded-3xl bg-[#EBF9F2] border-2 border-b-4 border-[#39B87F] text-center max-w-md mx-auto shadow-md shadow-[#39B87F]/10 animate-fadeIn ${className}`}
        data-testid="feedback-success"
      >
        <div className="flex items-center justify-center gap-2 text-4xl mb-3 animate-bounce">
          <span>⭐</span>
          <span className="text-3xl text-[#FFC857] animate-pulse">✨</span>
          <span>⭐</span>
        </div>

        <h3 className="font-display font-black text-xl text-[#08233A] mb-1">
          {title || 'Great listening! ⭐'}
        </h3>
        <p className="text-xs sm:text-sm font-semibold text-[#527080] mb-5">
          {message || 'You found the right sound! Ready for the next adventure?'}
        </p>

        {onNext && (
          <ChildButton
            variant="emerald"
            size="md"
            onClick={onNext}
            className="w-full"
          >
            {nextLabel}
          </ChildButton>
        )}
      </div>
    )
  }

  // Retry feedback (gentle & non-punitive)
  return (
    <div
      className={`p-6 rounded-3xl bg-[#FEF8EC] border-2 border-b-4 border-[#FDE6BE] text-center max-w-md mx-auto shadow-xs animate-fadeIn ${className}`}
      data-testid="feedback-retry"
    >
      <div className="text-4xl mb-3 select-none">
        🌱
      </div>

      <h3 className="font-display font-black text-xl text-[#08233A] mb-1">
        {title || "Let's try again! 🌸"}
      </h3>
      <p className="text-xs sm:text-sm font-semibold text-[#527080] mb-5">
        {message || 'Listen carefully to the sound one more time.'}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
        {onListenAgain && (
          <ChildButton
            variant="calm"
            size="sm"
            onClick={onListenAgain}
            icon={Volume2}
            className="w-full sm:w-auto"
          >
            Listen Again
          </ChildButton>
        )}
        {onRetry && (
          <ChildButton
            variant="gold"
            size="sm"
            onClick={onRetry}
            icon={RotateCcw}
            className="w-full sm:w-auto"
          >
            {retryLabel}
          </ChildButton>
        )}
      </div>
    </div>
  )
}

export default FeedbackMessage

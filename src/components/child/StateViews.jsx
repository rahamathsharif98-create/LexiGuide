import React from 'react'
import { Sparkles, RotateCcw, Compass, Compass as CompassIcon } from 'lucide-react'
import { ChildButton } from './ChildButton'

/**
 * LoadingState (Section 32)
 * Friendly child loading screen: "Getting your adventure ready..."
 * Uses gentle pulse animation rather than rapid anxious spinners.
 */
export function LoadingState({
  message = 'Getting your adventure ready...',
  emoji = '✨',
  className = '',
}) {
  return (
    <div
      className={`py-16 px-6 text-center max-w-sm mx-auto flex flex-col items-center justify-center animate-fadeIn ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="w-20 h-20 rounded-3xl bg-[#DDF9FC] border-2 border-[#BCEBF2] flex items-center justify-center text-4xl mb-4 shadow-sm animate-pulse">
        {emoji}
      </div>
      <h3 className="font-display font-black text-lg text-[#08233A] mb-1">
        {message}
      </h3>
      <p className="text-xs text-[#527080] font-semibold">
        Just a quick moment! 🎒
      </p>
    </div>
  )
}

/**
 * EmptyState (Section 33)
 * Friendly child empty state: "Let's find something fun to practice."
 */
export function EmptyState({
  title = "Let's find something fun to practice!",
  message = 'Explore stories, sounds, or words to start your adventure.',
  actionLabel = 'Explore Activities 🚀',
  onAction,
  emoji = '🎒',
  className = '',
}) {
  return (
    <div
      className={`py-12 px-6 text-center max-w-md mx-auto bg-white rounded-3xl border border-[#D7EEF1] shadow-xs flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-18 h-18 rounded-3xl bg-[#FEF8EC] border-2 border-[#FDE6BE] flex items-center justify-center text-4xl mb-4 shadow-inner">
        {emoji}
      </div>
      <h3 className="font-display font-black text-lg text-[#08233A] mb-1">
        {title}
      </h3>
      <p className="text-xs text-[#527080] font-semibold mb-5">
        {message}
      </p>
      {onAction && (
        <ChildButton variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </ChildButton>
      )}
    </div>
  )
}

/**
 * ErrorState (Section 34)
 * Gentle non-technical error view: "Something didn't load."
 * Never exposes stack traces or technical errors to young learners.
 */
export function ErrorState({
  title = "Something didn't load 🌸",
  message = 'Tap below and we will try to load it again!',
  onRetry,
  retryLabel = 'Try Again 🔄',
  className = '',
}) {
  return (
    <div
      className={`py-12 px-6 text-center max-w-md mx-auto bg-white rounded-3xl border-2 border-[#FFD9CC] shadow-xs flex flex-col items-center justify-center ${className}`}
      role="alert"
    >
      <div className="w-18 h-18 rounded-3xl bg-[#FFF2ED] border-2 border-[#FFD9CC] flex items-center justify-center text-4xl mb-4">
        🌱
      </div>
      <h3 className="font-display font-black text-lg text-[#08233A] mb-1">
        {title}
      </h3>
      <p className="text-xs text-[#527080] font-semibold mb-5">
        {message}
      </p>
      {onRetry && (
        <ChildButton variant="primary" size="md" onClick={onRetry} icon={RotateCcw}>
          {retryLabel}
        </ChildButton>
      )}
    </div>
  )
}

/**
 * SuccessState (Section 16 & Section 36)
 * Rewarding, calm success experience: "Great listening! ⭐"
 * Uses subtle star twinkle animation rather than overwhelming noisy fanfare.
 */
export function SuccessState({
  title = 'Great listening! ⭐',
  message = 'You did a fantastic job on this step.',
  actionLabel = 'Next Adventure ▶',
  onAction,
  emoji = '⭐',
  className = '',
}) {
  return (
    <div
      className={`py-12 px-6 text-center max-w-md mx-auto bg-white rounded-3xl border-2 border-[#CDEFD9] shadow-xs flex flex-col items-center justify-center animate-fadeIn ${className}`}
      role="status"
    >
      <div className="relative mb-4">
        <div className="w-20 h-20 rounded-3xl bg-[#EEF8F3] border-2 border-[#CDEFD9] flex items-center justify-center text-4xl shadow-inner">
          <span className="animate-bounce" style={{ animationDuration: '2s' }}>{emoji}</span>
        </div>
        <span className="absolute -top-1 -right-1 text-xl animate-pulse">✨</span>
      </div>
      <h3 className="font-display font-black text-xl text-[#08233A] mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#527080] font-semibold mb-6">
        {message}
      </p>
      {onAction && (
        <ChildButton variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </ChildButton>
      )}
    </div>
  )
}

export default {
  LoadingState,
  EmptyState,
  ErrorState,
  SuccessState,
}

import React from 'react'
import audioAtmosphereService from '../../services/audioAtmosphereService'

/**
 * PictureChoice (Section 14 & 18)
 * Large, accessible picture selection tile for Sound Safari, Letter Detective, etc.
 * - Min 64px - 96px touch target
 * - Tactile 3D press feedback
 * - Visual states: idle | selected | correct | retry | disabled
 */
export function PictureChoice({
  item, // { id, emoji, label, sublabel, sound }
  isSelected = false,
  isCorrect = null, // true | false | null
  disabled = false,
  onClick,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const { emoji, label, sublabel } = item

  const handleClick = () => {
    if (disabled) return
    try {
      audioAtmosphereService?.playChime?.(600, 0.06)
    } catch {}
    onClick?.(item)
  }

  // Dimension scaling
  const sizeStyles = {
    sm: 'p-3 min-h-[90px]',
    md: 'p-4 sm:p-5 min-h-[120px]',
    lg: 'p-6 min-h-[150px]',
  }[size] || 'p-4 sm:p-5 min-h-[120px]'

  const emojiSizes = {
    sm: 'text-3xl sm:text-4xl',
    md: 'text-4xl sm:text-5xl',
    lg: 'text-5xl sm:text-6xl',
  }[size] || 'text-4xl sm:text-5xl'

  // Visual state classes
  let stateClasses = 'bg-white border-2 border-b-4 border-[#D7EEF1] hover:border-[#13CFE3] hover:shadow-md'

  if (isCorrect === true) {
    stateClasses = 'bg-[#EBF9F2] border-2 border-b-4 border-[#39B87F] shadow-md shadow-[#39B87F]/20 scale-105 ring-4 ring-[#39B87F]/20'
  } else if (isCorrect === false) {
    stateClasses = 'bg-[#FFF2ED] border-2 border-b-4 border-[#D95C5C] shadow-xs animate-shake'
  } else if (isSelected) {
    stateClasses = 'bg-[#DDF9FC] border-2 border-b-4 border-[#13CFE3] shadow-md ring-4 ring-[#13CFE3]/30 scale-102'
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={`${label || ''} choice`}
      aria-pressed={isSelected}
      className={`group relative rounded-3xl flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none active:border-b-2 active:translate-y-1 outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/50 disabled:opacity-60 disabled:cursor-not-allowed ${sizeStyles} ${stateClasses} ${className}`}
    >
      <span className={`${emojiSizes} mb-2 select-none group-hover:scale-110 transition-transform`}>
        {emoji}
      </span>

      {label && (
        <span className="font-display font-black text-sm sm:text-base text-[#08233A] tracking-wide block">
          {label}
        </span>
      )}

      {sublabel && (
        <span className="text-[11px] font-semibold text-[#527080] block mt-0.5">
          {sublabel}
        </span>
      )}

      {/* Correct / Retry indicator */}
      {isCorrect === true && (
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#39B87F] text-white flex items-center justify-center text-xs font-black shadow-xs">
          ✓
        </span>
      )}
    </button>
  )
}

export default PictureChoice

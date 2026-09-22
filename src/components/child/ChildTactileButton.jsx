import React from 'react'
import audioAtmosphereService from '../../services/audioAtmosphereService'

/**
 * ChildTactileButton
 * Accessible, 3D-feel tactile button designed specifically for young learners.
 * - Min 48px touch target
 * - Tactile shadow depression on press
 * - High-contrast focus state
 */
export function ChildTactileButton({
  children,
  onClick,
  variant = 'cyan', // 'cyan' | 'gold' | 'white' | 'emerald' | 'ghost'
  size = 'md', // 'sm' (44px) | 'md' (52px) | 'lg' (60px)
  playSound = true,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const handleClick = (e) => {
    if (disabled) return
    if (playSound) {
      try {
        audioAtmosphereService?.playChime?.(640, 0.08)
      } catch {
        // audio service unavailable
      }
    }
    onClick?.(e)
  }

  const baseStyles = 'inline-flex items-center justify-center gap-2.5 font-display font-extrabold rounded-2xl transition-all select-none cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'

  const sizeStyles = {
    sm: 'min-h-[44px] px-4 py-2 text-xs',
    md: 'min-h-[52px] px-6 py-3 text-sm sm:text-base',
    lg: 'min-h-[60px] px-8 py-4 text-base sm:text-lg',
  }

  const variantStyles = {
    cyan: 'bg-[#13CFE3] text-[#08233A] border-b-4 border-[#0899AA] hover:bg-[#20D9ED] active:border-b-0 active:translate-y-1 shadow-[0_4px_16px_rgba(19,207,227,0.25)]',
    gold: 'bg-[#FFC857] text-[#08233A] border-b-4 border-[#E0A838] hover:bg-[#FFD16E] active:border-b-0 active:translate-y-1 shadow-[0_4px_16px_rgba(255,200,87,0.25)]',
    emerald: 'bg-[#39B87F] text-white border-b-4 border-[#2D9B69] hover:bg-[#42C88B] active:border-b-0 active:translate-y-1 shadow-[0_4px_16px_rgba(57,184,127,0.25)]',
    white: 'bg-white text-[#08233A] border border-[#D7EEF1] border-b-4 border-b-[#B8E0E6] hover:bg-[#F2FBFC] active:border-b active:translate-y-1 shadow-[0_4px_16px_rgba(8,35,58,0.06)]',
    ghost: 'bg-transparent text-[#527080] hover:bg-[#E6F8FA] hover:text-[#08233A] active:translate-y-0.5',
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.cyan} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default ChildTactileButton

import React from 'react'

/**
 * InterestCard (Section 6 & Section 36)
 */
export function InterestCard({
  icon = '🚀',
  label = 'Space',
  selected = false,
  onSelect,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`min-h-[52px] px-4 py-3 rounded-2xl border-2 font-display font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/40 active:scale-95 select-none ${
        selected
          ? 'bg-[#13CFE3] text-[#08233A] border-[#0899AA] shadow-md shadow-[#13CFE3]/20'
          : 'bg-white text-[#08233A] border-[#D7EEF1] hover:border-[#13CFE3] hover:bg-[#F2FBFC]'
      } ${className}`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

/**
 * ThemeCard (Section 6 & Section 36)
 */
export function ThemeCard({
  id = 'space',
  name = 'Space World',
  emoji = '🚀',
  emojis = '🌙 ⭐ 🚀',
  selected = false,
  onSelect,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      aria-pressed={selected}
      className={`p-4 rounded-3xl border-2 text-left transition-all cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/40 active:scale-95 flex flex-col justify-between ${
        selected
          ? 'bg-[#DDF9FC] border-[#13CFE3] shadow-md shadow-[#13CFE3]/20 ring-2 ring-[#13CFE3]/30'
          : 'bg-white border-[#D7EEF1] hover:border-[#13CFE3]/60 hover:bg-[#F2FBFC]'
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{emoji}</span>
        <span className="text-xs">{emojis}</span>
      </div>
      <div>
        <p className="font-display font-black text-sm text-[#08233A]">
          {name}
        </p>
        <span className="text-[10px] font-bold text-[#527080]">
          {selected ? 'Active World ✓' : 'Tap to switch'}
        </span>
      </div>
    </button>
  )
}

export default {
  InterestCard,
  ThemeCard,
}

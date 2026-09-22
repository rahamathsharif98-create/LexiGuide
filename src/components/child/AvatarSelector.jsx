import React from 'react'

export const AVATAR_CHOICES = [
  { id: 'fox', emoji: '🦊', label: 'Playful Fox' },
  { id: 'panda', emoji: '🐼', label: 'Gentle Panda' },
  { id: 'lion', emoji: '🦁', label: 'Brave Lion' },
  { id: 'koala', emoji: '🐨', label: 'Calm Koala' },
  { id: 'rocket', emoji: '🚀', label: 'Space Star' },
  { id: 'dolphin', emoji: '🐬', label: 'Ocean Dolphin' },
  { id: 'unicorn', emoji: '🦄', label: 'Magic Unicorn' },
  { id: 'star', emoji: '⭐', label: 'Superstar' },
]

/**
 * AvatarSelector (Section 7 & Section 36)
 * Simple, friendly avatar chooser with consistent sizing and touch targets.
 */
export function AvatarSelector({
  selectedEmoji = '🦊',
  onSelect,
  className = '',
}) {
  return (
    <div className={`grid grid-cols-4 gap-3 ${className}`}>
      {AVATAR_CHOICES.map((choice) => {
        const isSelected = selectedEmoji === choice.emoji
        return (
          <button
            key={choice.id}
            type="button"
            onClick={() => onSelect?.(choice.emoji)}
            aria-label={`Select ${choice.label}`}
            className={`min-h-[56px] p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/40 active:scale-95 ${
              isSelected
                ? 'bg-[#DDF9FC] border-[#13CFE3] shadow-md shadow-[#13CFE3]/20 scale-105'
                : 'bg-white border-[#D7EEF1] hover:border-[#13CFE3]/50 hover:bg-[#F2FBFC]'
            }`}
          >
            <span className="text-3xl select-none">{choice.emoji}</span>
            <span className="text-[10px] font-extrabold text-[#08233A] mt-1 truncate max-w-full">
              {choice.label.split(' ')[1] || choice.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default AvatarSelector

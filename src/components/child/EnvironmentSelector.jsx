import React from 'react'
import audioAtmosphereService from '../../services/audioAtmosphereService'

export const ENVIRONMENTS = [
  {
    id: 'space',
    name: 'Space World',
    emoji: '🚀',
    motion: 'animate-vfx-rocket-fly',
    particle: '✨',
    emojis: '🌙 ⭐ 🚀',
    greeting: 'Welcome to your Space World! ✨',
    subGreeting: "Let's explore some starry words today!",
    accent: '#0899AA',
    bg: 'from-[#08233A] via-[#0B5264] to-[#13CFE3]',
    cardBg: 'bg-[#EBF7FD]',
    borderColor: 'border-[#BAE6FD]',
  },
  {
    id: 'animals',
    name: 'Animal World',
    emoji: '🐾',
    motion: 'animate-vfx-sound-pulse',
    particle: '🦁',
    emojis: '🦊 🐼 🐯',
    greeting: 'Welcome to your Animal World! 🌿',
    subGreeting: "Let's meet friendly animal words today!",
    accent: '#39B87F',
    bg: 'from-[#0B4D36] via-[#157347] to-[#39B87F]',
    cardBg: 'bg-[#EEF8F3]',
    borderColor: 'border-[#CDEFD9]',
  },
  {
    id: 'music',
    name: 'Music World',
    emoji: '🎵',
    motion: 'animate-vfx-sound-pulse',
    particle: '🎶',
    emojis: '🎵 🎶 🎧',
    greeting: 'Welcome to your Music World! 🎶',
    subGreeting: "Let's sing and rhythm through words today!",
    accent: '#D97706',
    bg: 'from-[#6E3C00] via-[#B45309] to-[#FFC857]',
    cardBg: 'bg-[#FEF8EC]',
    borderColor: 'border-[#FDE6BE]',
  },
  {
    id: 'ocean',
    name: 'Ocean World',
    emoji: '🌊',
    motion: 'animate-vfx-ocean-drift',
    particle: '🫧',
    emojis: '🐬 🌊 🐳',
    greeting: 'Welcome to your Ocean World! 🌊',
    subGreeting: "Let's dive into cool story waters!",
    accent: '#0284C7',
    bg: 'from-[#033B61] via-[#0369A1] to-[#38BDF8]',
    cardBg: 'bg-[#E0F2FE]',
    borderColor: 'border-[#BAE6FD]',
  },
  {
    id: 'forest',
    name: 'Forest World',
    emoji: '🌳',
    motion: 'animate-vfx-sunflower-sway',
    particle: '🍃',
    emojis: '🌲 🦌 🍃',
    greeting: 'Welcome to your Forest World! 🌲',
    subGreeting: "Let's wander through the peaceful story trees!",
    accent: '#059669',
    bg: 'from-[#064E3B] via-[#047857] to-[#34D399]',
    cardBg: 'bg-[#ECFDF5]',
    borderColor: 'border-[#A7F3D0]',
  },
  {
    id: 'fantasy',
    name: 'Fantasy World',
    emoji: '🏰',
    motion: 'animate-vfx-book-float',
    particle: '✨',
    emojis: '🦄 🏰 🪄',
    greeting: 'Welcome to your Fantasy Castle! 🏰',
    subGreeting: "Magic words and fairytale quests await!",
    accent: '#7C3AED',
    bg: 'from-[#3B0764] via-[#6D28D9] to-[#C084FC]',
    cardBg: 'bg-[#F3F0FF]',
    borderColor: 'border-[#DDD6FE]',
  },
  {
    id: 'train',
    name: 'Train World',
    emoji: '🚂',
    motion: 'animate-vfx-train',
    particle: '💨',
    emojis: '🚂 🚃 🛤️',
    greeting: 'Welcome to your Train World! 🚂',
    subGreeting: 'All aboard the reading express!',
    accent: '#D95C5C',
    bg: 'from-[#5F1D1D] via-[#991B1B] to-[#F87171]',
    cardBg: 'bg-[#FEF2F2]',
    borderColor: 'border-[#FECACA]',
  },
]

/**
 * EnvironmentSelector (Section 6)
 * Visual environment picker allowing the child to customize their learning world.
 */
export function EnvironmentSelector({
  currentId = 'space',
  onSelect,
  className = '',
}) {
  const handleSelect = (env) => {
    try {
      audioAtmosphereService?.playChime?.(550, 0.08)
    } catch {}
    onSelect?.(env.id)
  }

  return (
    <div className={`space-y-3 ${className}`} data-testid="environment-selector">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="font-display font-black text-sm sm:text-base text-[#08233A] flex items-center gap-1.5">
            <span>My Learning World</span>
            <span className="select-none animate-story-bob">🌍</span>
          </h3>
          <p className="text-[11px] font-semibold text-[#527080]">
            Choose your favorite world to explore
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
        {ENVIRONMENTS.map((env) => {
          const isSelected = env.id === currentId
          return (
            <button
              key={env.id}
              type="button"
              onClick={() => handleSelect(env)}
              className={`relative overflow-hidden p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer select-none group ${
                isSelected
                  ? 'border-[#13CFE3] bg-gradient-to-b from-[#DDF9FC] to-[#F2FBFC] shadow-md -translate-y-1 ring-2 ring-[#13CFE3]/50'
                  : 'border-[#D7EEF1] bg-white hover:bg-[#F2FBFC] hover:border-[#13CFE3]/60 hover:-translate-y-0.5 shadow-2xs'
              }`}
            >
              {/* Active Breathing Aura */}
              {isSelected && (
                <div className="absolute inset-0 pointer-events-none animate-story-aura opacity-40 bg-radial from-[#13CFE3]/40 via-transparent to-transparent" />
              )}

              {/* Floating Sparkle when selected */}
              {isSelected && (
                <span className="absolute top-1 right-1.5 text-[9px] select-none pointer-events-none animate-story-sparkle-1 text-[#0899AA]">
                  ✨
                </span>
              )}

              {/* Animated Icon Box */}
              <div className="w-10 h-10 rounded-xl bg-white/95 shadow-2xs border border-[#D7EEF1] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <span className={`text-2xl select-none ${isSelected ? env.motion : 'group-hover:' + env.motion}`}>
                  {env.emoji}
                </span>
              </div>

              <span
                className={`text-[11px] font-display font-black tracking-tight truncate w-full ${
                  isSelected ? 'text-[#0899AA]' : 'text-[#08233A]'
                }`}
              >
                {env.name.replace(' World', '')}
              </span>

              {/* Glossy Sheen */}
              {isSelected && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-story-sheen" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default EnvironmentSelector


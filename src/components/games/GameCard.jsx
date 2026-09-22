import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Sparkles } from 'lucide-react'
import { ChildTactileButton } from '../child/ChildTactileButton'

/**
 * GameCard (Section 7 & 33)
 * Composition:
 * - Large illustration at top
 * - Large title
 * - One short sentence
 * - Gentle difficulty badge
 * - Favorite button
 * - Tactile PLAY button
 */
const GAME_VFX_MAP = {
  'sound-hunt': {
    wrapperClass: 'animate-vfx-rocket-fly',
    overlay: (
      <>
        {/* Shooting meteor streak */}
        <div className="absolute top-2 right-2 pointer-events-none animate-vfx-shooting-star z-10">
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-cyan-200 to-white rounded-full shadow-[0_0_10px_#13CFE3]" />
        </div>
        {/* Thruster Flame blast */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center animate-vfx-thruster z-10">
          <span className="text-xl filter drop-shadow-[0_0_12px_rgba(255,140,0,1)]">🔥</span>
        </div>
        <span className="absolute top-3 right-4 text-sm animate-story-sparkle-1 z-10">✨</span>
        <span className="absolute top-8 left-3 text-xs animate-story-sparkle-2 z-10">⭐</span>
      </>
    ),
  },
  'match-sound': {
    wrapperClass: 'animate-vfx-ufo',
    overlay: (
      <>
        {/* Glowing cosmic saucer lights */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none w-16 h-4 bg-cyan-400/40 blur-md rounded-full animate-story-aura z-0" />
        <span className="absolute top-3 right-4 text-sm animate-story-sparkle-1 z-10">🛸</span>
        <span className="absolute bottom-6 right-3 text-xs animate-story-sparkle-2 z-10">✨</span>
        <span className="absolute top-7 left-3 text-xs animate-story-sparkle-3 z-10">🌟</span>
      </>
    ),
  },
  'sound-match': {
    wrapperClass: 'animate-vfx-sound-pulse',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-base filter drop-shadow-sm animate-vfx-note-1 z-10">🎵</span>
        <span className="absolute bottom-5 left-3 text-sm filter drop-shadow-sm animate-vfx-note-2 z-10">🎶</span>
        <span className="absolute top-6 left-3 text-xs animate-story-sparkle-1 z-10">🌈</span>
      </>
    ),
  },
  'sound-rhythm': {
    wrapperClass: 'animate-vfx-drum',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-base filter drop-shadow-sm animate-vfx-note-1 z-10">🥁</span>
        <span className="absolute bottom-5 left-3 text-sm filter drop-shadow-sm animate-vfx-note-2 z-10">🎵</span>
        <span className="absolute top-5 left-3 text-xs animate-story-sparkle-2 z-10">⭐</span>
      </>
    ),
  },
  'trace-speak': {
    wrapperClass: 'animate-vfx-pencil-trace',
    overlay: (
      <>
        <span className="absolute top-3 right-3 text-sm animate-story-sparkle-1 z-10">✨</span>
        <span className="absolute bottom-5 left-3 text-base animate-story-sparkle-3 z-10">🌈</span>
        <span className="absolute top-8 left-3 text-xs animate-story-sparkle-2 z-10">✏️</span>
      </>
    ),
  },
  'find-sound': {
    wrapperClass: 'animate-vfx-detective-search',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-sm filter drop-shadow-sm animate-story-sparkle-1 z-10">✨</span>
        <span className="absolute bottom-6 right-4 text-xs filter drop-shadow-sm animate-story-sparkle-2 z-10">🔍</span>
        <span className="absolute top-6 left-3 text-xs animate-story-sparkle-3 z-10">🕵️</span>
      </>
    ),
  },
  'missing-letter': {
    wrapperClass: 'animate-vfx-blocks-bounce',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-sm animate-story-sparkle-1 z-10">🧩</span>
        <span className="absolute bottom-5 left-3 text-xs animate-story-sparkle-2 z-10">⭐</span>
      </>
    ),
  },
  'build-word': {
    wrapperClass: 'animate-vfx-blocks-bounce',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-sm animate-story-sparkle-1 z-10">⭐</span>
        <span className="absolute bottom-5 left-3 text-xs animate-story-sparkle-3 z-10">🧱</span>
      </>
    ),
  },
  'picture-word': {
    wrapperClass: 'animate-vfx-camera-snap',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-sm animate-story-sparkle-1 z-10">📸</span>
        <span className="absolute bottom-5 left-3 text-xs animate-story-sparkle-2 z-10">✨</span>
      </>
    ),
  },
  'word-train': {
    wrapperClass: 'animate-vfx-train',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-sm animate-story-sparkle-1 z-10">💨</span>
        <span className="absolute bottom-5 left-3 text-xs animate-story-sparkle-2 z-10">🚂</span>
        <span className="absolute top-6 left-3 text-xs animate-story-sparkle-3 z-10">✨</span>
      </>
    ),
  },
  'speak-shine': {
    wrapperClass: 'animate-vfx-mic-shine',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-base filter drop-shadow-sm animate-vfx-note-1 z-10">🎶</span>
        <span className="absolute bottom-5 left-3 text-xs animate-story-sparkle-1 z-10">✨</span>
        <span className="absolute top-6 left-3 text-xs animate-story-sparkle-2 z-10">🌟</span>
      </>
    ),
  },
  'story-adventures': {
    wrapperClass: 'animate-vfx-book-float',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-sm animate-story-sparkle-1 z-10">🏰</span>
        <span className="absolute bottom-5 left-3 text-xs animate-story-sparkle-2 z-10">✨</span>
      </>
    ),
  },
  'learning-run': {
    wrapperClass: 'animate-vfx-runner-dash',
    overlay: (
      <>
        {/* Speed streak lines */}
        <div className="absolute top-3 left-2 pointer-events-none flex flex-col gap-1.5 opacity-80 z-10">
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-white rounded-full animate-vfx-shooting-star" />
          <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-white rounded-full animate-vfx-shooting-star [animation-delay:200ms]" />
        </div>
        <span className="absolute top-3 right-4 text-base filter drop-shadow-sm animate-story-sparkle-1 z-10">⭐</span>
        <span className="absolute bottom-5 left-3 text-sm filter drop-shadow-sm animate-story-sparkle-2 z-10">🏃‍♂️</span>
        <span className="absolute bottom-5 right-4 text-xs filter drop-shadow-sm animate-story-sparkle-3 z-10">✨</span>
      </>
    ),
  },
  'sky-archer': {
    wrapperClass: 'animate-vfx-archer-float',
    overlay: (
      <>
        <div className="absolute top-2 right-2 pointer-events-none animate-vfx-shooting-star z-10">
          <div className="w-14 h-0.5 bg-gradient-to-r from-transparent via-sky-300 to-white rounded-full shadow-[0_0_8px_#38bdf8]" />
        </div>
        <span className="absolute top-3 right-4 text-base filter drop-shadow-sm animate-story-sparkle-1 z-10">🏹</span>
        <span className="absolute bottom-5 left-3 text-sm filter drop-shadow-sm animate-story-sparkle-2 z-10">🎈</span>
        <span className="absolute top-8 left-4 text-xs filter drop-shadow-sm animate-story-sparkle-3 z-10">🎯</span>
        <span className="absolute bottom-6 right-3 text-xs animate-story-sparkle-1 z-10">✨</span>
      </>
    ),
  },
  'cosmic-miner': {
    wrapperClass: 'animate-vfx-cosmic-drift',
    overlay: (
      <>
        <div className="absolute top-3 right-3 pointer-events-none animate-vfx-shooting-star z-10">
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-purple-300 to-cyan-200 rounded-full shadow-[0_0_10px_#a855f7]" />
        </div>
        <span className="absolute top-3 right-4 text-base filter drop-shadow-sm animate-story-sparkle-1 z-10">🪐</span>
        <span className="absolute bottom-5 left-3 text-sm filter drop-shadow-sm animate-story-sparkle-2 z-10">💎</span>
        <span className="absolute top-7 left-3 text-xs filter drop-shadow-sm animate-story-sparkle-3 z-10">✨</span>
        <span className="absolute bottom-6 right-4 text-xs animate-story-sparkle-1 z-10">⭐</span>
      </>
    ),
  },
  'coral-diver': {
    wrapperClass: 'animate-vfx-submarine-bob',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-base filter drop-shadow-sm animate-story-sparkle-1 z-10">🫧</span>
        <span className="absolute bottom-5 left-3 text-sm filter drop-shadow-sm animate-story-sparkle-2 z-10">🐠</span>
        <span className="absolute top-7 left-3 text-xs filter drop-shadow-sm animate-story-sparkle-3 z-10">🤿</span>
        <span className="absolute bottom-6 right-3 text-xs animate-story-sparkle-1 z-10">✨</span>
      </>
    ),
  },
  'magic-bakery': {
    wrapperClass: 'animate-vfx-bakery-bounce',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-base filter drop-shadow-sm animate-story-sparkle-1 z-10">🧁</span>
        <span className="absolute bottom-5 left-3 text-sm filter drop-shadow-sm animate-story-sparkle-2 z-10">🍓</span>
        <span className="absolute top-7 left-3 text-xs filter drop-shadow-sm animate-story-sparkle-3 z-10">✨</span>
        <span className="absolute bottom-6 right-4 text-xs animate-story-sparkle-1 z-10">🍰</span>
      </>
    ),
  },
  'dino-fossil': {
    wrapperClass: 'animate-vfx-fossil-rumble',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-base filter drop-shadow-sm animate-story-sparkle-1 z-10">🦖</span>
        <span className="absolute bottom-5 left-3 text-sm filter drop-shadow-sm animate-story-sparkle-2 z-10">🦴</span>
        <span className="absolute top-7 left-3 text-xs filter drop-shadow-sm animate-story-sparkle-3 z-10">⛏️</span>
        <span className="absolute bottom-6 right-4 text-xs animate-story-sparkle-1 z-10">✨</span>
      </>
    ),
  },
  'cloud-bouncer': {
    wrapperClass: 'animate-vfx-cloud-jump',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-base filter drop-shadow-sm animate-story-sparkle-1 z-10">🐰</span>
        <span className="absolute bottom-5 left-3 text-sm filter drop-shadow-sm animate-story-sparkle-2 z-10">🌈</span>
        <span className="absolute top-7 left-3 text-xs filter drop-shadow-sm animate-story-sparkle-3 z-10">☁️</span>
        <span className="absolute bottom-6 right-4 text-xs animate-story-sparkle-1 z-10">⭐</span>
      </>
    ),
  },
  'voxel-crafter': {
    wrapperClass: 'animate-vfx-voxel-cube',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-base filter drop-shadow-sm animate-story-sparkle-1 z-10">🧱</span>
        <span className="absolute bottom-5 left-3 text-sm filter drop-shadow-sm animate-story-sparkle-2 z-10">🔨</span>
        <span className="absolute top-7 left-3 text-xs filter drop-shadow-sm animate-story-sparkle-3 z-10">✨</span>
        <span className="absolute bottom-6 right-4 text-xs animate-story-sparkle-1 z-10">💎</span>
      </>
    ),
  },
  'safari-photo': {
    wrapperClass: 'animate-vfx-safari-zoom',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-base filter drop-shadow-sm animate-story-sparkle-1 z-10">📸</span>
        <span className="absolute bottom-5 left-3 text-sm filter drop-shadow-sm animate-story-sparkle-2 z-10">🦁</span>
        <span className="absolute top-7 left-3 text-xs filter drop-shadow-sm animate-story-sparkle-3 z-10">🐾</span>
        <span className="absolute bottom-6 right-4 text-xs animate-story-sparkle-1 z-10">✨</span>
      </>
    ),
  },
  'ancient-labyrinth': {
    wrapperClass: 'animate-vfx-torch-flame',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-base filter drop-shadow-sm animate-story-sparkle-1 z-10">🗝️</span>
        <span className="absolute bottom-5 left-3 text-sm filter drop-shadow-sm animate-story-sparkle-2 z-10">🔥</span>
        <span className="absolute top-7 left-3 text-xs filter drop-shadow-sm animate-story-sparkle-3 z-10">⚡</span>
        <span className="absolute bottom-6 right-4 text-xs animate-story-sparkle-1 z-10">✨</span>
      </>
    ),
  },
  'learning-run': {
    wrapperClass: 'animate-vfx-speed-dash',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-base filter drop-shadow-sm animate-story-sparkle-1 z-10">🪙</span>
        <span className="absolute bottom-5 left-3 text-sm filter drop-shadow-sm animate-story-sparkle-2 z-10">⚡</span>
        <span className="absolute top-7 left-3 text-xs filter drop-shadow-sm animate-story-sparkle-3 z-10">👟</span>
        <span className="absolute bottom-6 right-4 text-xs animate-story-sparkle-1 z-10">✨</span>
      </>
    ),
  },
}

export function GameCard({
  game,
  isFavorite = false,
  onToggleFavorite,
  themeContext = null,
  className = '',
}) {
  const navigate = useNavigate()
  const displayTitle = themeContext?.title || game.title
  const displayIcon = themeContext?.icon || game.icon
  const displayImage = themeContext?.image3d || game.image3d
  const vfx = GAME_VFX_MAP[game.id] || {
    wrapperClass: 'animate-story-bob',
    overlay: (
      <>
        <span className="absolute top-3 right-4 text-sm animate-story-sparkle-1 z-10">✨</span>
        <span className="absolute bottom-5 left-3 text-xs animate-story-sparkle-2 z-10">⭐</span>
      </>
    ),
  }

  const handlePlay = (e) => {
    e?.stopPropagation?.()
    navigate(game.route)
  }

  return (
    <div
      data-testid={`game-card-${game.id}`}
      role="button"
      tabIndex={0}
      onClick={handlePlay}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handlePlay(e)
        }
      }}
      aria-label={`Play ${displayTitle}`}
      className={`group relative bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#D7EEF1] hover:border-[#13CFE3] shadow-[0_6px_20px_rgba(8,35,58,0.04)] hover:shadow-[0_16px_36px_rgba(19,207,227,0.18)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between text-left cursor-pointer active:scale-[0.985] select-none ${className}`}
    >
      {/* Top Bar: Difficulty chip + Favorite Heart */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] font-extrabold tracking-wider bg-[#F2FBFC] text-[#0899AA] border border-[#D7EEF1] px-2.5 py-0.5 rounded-full pointer-events-none">
          {game.difficulty || 'Ready 🌱'}
        </span>

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite(game.id)
            }}
            aria-label={isFavorite ? `Remove ${game.title} from favorites` : `Add ${game.title} to favorites`}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#13CFE3] z-10 ${
              isFavorite
                ? 'bg-[#FFE8EC] text-[#E0245E] shadow-2xs'
                : 'bg-[#F2FBFC] text-[#527080] hover:text-[#E0245E] hover:bg-[#FFE8EC]'
            }`}
          >
            <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
          </button>
        )}
      </div>

      {/* 3D Visual Game Cover with Custom Action Motion & Moving VFX */}
      <div className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-[#E6F8FA] via-[#DDF9FC] to-[#F2FBFC] mb-4 border border-[#D7EEF1] flex items-center justify-center group-hover:border-[#13CFE3] transition-all shadow-xs group-hover:shadow-md pointer-events-none">
        {/* Soft Ambient Breathing Aura */}
        <div className="absolute inset-0 pointer-events-none animate-story-aura opacity-40 bg-radial from-white via-transparent to-transparent z-0" />

        {/* 3D Visual Image / Character with Custom Action Motion */}
        <div className={`w-full h-full flex items-center justify-center ${vfx.wrapperClass}`}>
          {displayImage ? (
            <img
              src={displayImage}
              alt={displayTitle}
              className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="text-5xl group-hover:scale-110 transition-transform select-none">
              {displayIcon}
            </div>
          )}
        </div>

        {/* Moving Particle VFX Overlays */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {vfx.overlay}
        </div>

        {/* Glossy Sheen Beam Sweep */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent animate-story-sheen" />
        </div>

        {/* 3D Badge Pill */}
        <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-md border border-white/80 px-2.5 py-0.5 rounded-xl flex items-center gap-1.5 shadow-sm z-30 pointer-events-none">
          <span className="text-xs select-none">{displayIcon}</span>
          <span className="text-[10px] font-black text-[#08233A] tracking-wider uppercase">
            3D Game
          </span>
        </div>

        {/* Tap to Play Pill on Hover */}
        <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#13CFE3] text-[#08233A] text-[10px] font-black px-2.5 py-1 rounded-xl shadow-md z-30 pointer-events-none uppercase tracking-wider flex items-center gap-1">
          <span>Tap to Play</span>
          <span>▶</span>
        </div>
      </div>

      {/* Title and Short Description */}
      <div className="mb-5 pointer-events-none">
        <h3 className="font-display font-black text-lg text-[#08233A] group-hover:text-[#0899AA] transition-colors leading-snug">
          {displayTitle}
        </h3>
        <p className="text-xs text-[#527080] font-semibold mt-1 line-clamp-2">
          {game.desc}
        </p>
      </div>

      {/* Footer: Play Action Button */}
      <div className="pt-2 border-t border-[#F2FBFC] flex items-center justify-between">
        <span className="text-[10px] font-extrabold text-[#0899AA] bg-[#DDF9FC] px-2.5 py-0.5 rounded-md border border-[#D7EEF1] uppercase tracking-wider pointer-events-none">
          {game.dimension?.includes('Adventure') ? game.dimension : `${game.dimension || '3D'} Adventure`}
        </span>
        <ChildTactileButton
          size="sm"
          variant="cyan"
          onClick={handlePlay}
          aria-label={`Play ${displayTitle}`}
        >
          PLAY ▶
        </ChildTactileButton>
      </div>
    </div>
  )
}

export default GameCard

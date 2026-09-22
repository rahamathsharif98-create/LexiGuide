import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChildAudioGuideBadge } from './child/ChildAudioGuideBadge'
import { ChildTactileButton } from './child/ChildTactileButton'
import { Sparkles, Clock, BookOpen } from 'lucide-react'

const THEME_STYLES = {
  peach: {
    bg: 'from-amber-100/90 via-orange-50 to-amber-50',
    aura: 'rgba(255, 138, 76, 0.35)',
    borderHover: 'hover:border-amber-400',
    badge: 'bg-amber-100/90 text-amber-900 border-amber-200/80',
    glow: 'rgba(255, 138, 76, 0.2)',
  },
  brand: {
    bg: 'from-sky-100/90 via-cyan-50 to-blue-50',
    aura: 'rgba(19, 207, 227, 0.38)',
    borderHover: 'hover:border-[#13CFE3]',
    badge: 'bg-[#E6F8FA]/90 text-[#0899AA] border-[#D7EEF1]',
    glow: 'rgba(19, 207, 227, 0.25)',
  },
  mint: {
    bg: 'from-emerald-100/90 via-teal-50 to-green-50',
    aura: 'rgba(57, 184, 127, 0.35)',
    borderHover: 'hover:border-emerald-400',
    badge: 'bg-emerald-100/90 text-emerald-900 border-emerald-200/80',
    glow: 'rgba(57, 184, 127, 0.2)',
  },
  berry: {
    bg: 'from-purple-100/90 via-pink-50 to-fuchsia-50',
    aura: 'rgba(168, 107, 255, 0.35)',
    borderHover: 'hover:border-purple-400',
    badge: 'bg-purple-100/90 text-purple-900 border-purple-200/80',
    glow: 'rgba(168, 107, 255, 0.2)',
  },
  sun: {
    bg: 'from-yellow-100/90 via-amber-50 to-yellow-50',
    aura: 'rgba(255, 200, 87, 0.4)',
    borderHover: 'hover:border-yellow-400',
    badge: 'bg-yellow-100/90 text-yellow-900 border-yellow-200/80',
    glow: 'rgba(255, 200, 87, 0.25)',
  },
}

/**
 * Story-specific custom moving VFX:
 * 1. Rocket -> lifts and flies upwards toward the top side with thruster flame & shooting star
 * 2. Sunflower -> sways gently left & right in the breeze with floating pollen
 * 3. Curious Fox -> curious breathing with glowing blue crystal beacon pulse & forest fireflies
 * 4. Starfish -> buoyant aquatic bob with rising bubbles and darting clownfish
 * 5. Baking Bear -> joyful cheerful bob with rising warm aroma steam spirals from cake
 */
const STORY_MOTION_MAP = {
  'story-space': {
    wrapperClass: 'animate-vfx-rocket-fly',
    overlay: (
      <>
        {/* Shooting meteor streak soaring across deep space */}
        <div className="absolute top-3 right-3 pointer-events-none animate-vfx-shooting-star z-10">
          <div className="w-20 h-1 bg-gradient-to-r from-transparent via-cyan-200 to-white rounded-full shadow-[0_0_12px_#13CFE3]" />
        </div>
        {/* Rocket Thruster Flame blast & glow at bottom */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center animate-vfx-thruster z-10">
          <span className="text-2xl filter drop-shadow-[0_0_14px_rgba(255,140,0,1)]">🔥</span>
          <div className="w-10 h-5 rounded-full bg-orange-500/50 blur-md -mt-3" />
        </div>
        {/* Cosmic sparkles & twinkle stars */}
        <span className="absolute top-5 right-6 text-xl animate-story-sparkle-1 z-10">✨</span>
        <span className="absolute top-14 left-6 text-base animate-story-sparkle-2 z-10">⭐</span>
        <span className="absolute bottom-10 right-8 text-sm animate-story-sparkle-3 z-10">🪐</span>
      </>
    ),
  },
  'story-garden': {
    wrapperClass: 'animate-vfx-sunflower-sway',
    overlay: (
      <>
        {/* Floating golden pollen spores drifting upwards in the breeze */}
        <span className="absolute bottom-8 left-8 text-sm filter drop-shadow-sm animate-vfx-pollen-1 z-10">✨</span>
        <span className="absolute bottom-14 right-10 text-xs filter drop-shadow-sm animate-vfx-pollen-2 z-10">🌼</span>
        <span className="absolute top-10 right-8 text-sm animate-vfx-pollen-1 z-10" style={{ animationDelay: '1.8s' }}>🍃</span>
        <span className="absolute top-14 left-7 text-xs animate-vfx-pollen-2 z-10" style={{ animationDelay: '2.6s' }}>✨</span>
        {/* Sunny golden glow aura */}
        <div className="absolute top-0 left-0 w-36 h-36 bg-gradient-to-br from-yellow-300/40 via-yellow-100/10 to-transparent pointer-events-none rounded-full blur-xl animate-story-aura z-0" />
      </>
    ),
  },
  'story-forest': {
    wrapperClass: 'animate-vfx-fox-curious',
    overlay: (
      <>
        {/* Glowing Blue Crystal Beacon in bottom-right where the stone is */}
        <div className="absolute bottom-5 right-12 pointer-events-none flex items-center justify-center z-10">
          <div className="w-14 h-14 rounded-full bg-cyan-400/50 blur-lg animate-vfx-crystal" />
          <span className="absolute text-2xl filter drop-shadow-[0_0_14px_#13CFE3] animate-vfx-crystal">💎</span>
        </div>
        {/* Enchanted forest fireflies & leaves drifting */}
        <span className="absolute bottom-10 left-8 text-xs filter drop-shadow-sm animate-vfx-firefly-1 z-10">✨</span>
        <span className="absolute top-10 right-10 text-sm filter drop-shadow-sm animate-vfx-firefly-2 z-10">🌟</span>
        <span className="absolute top-7 left-10 text-xs animate-story-sparkle-3 z-10">🍃</span>
      </>
    ),
  },
  'story-ocean': {
    wrapperClass: 'animate-vfx-ocean-drift',
    overlay: (
      <>
        {/* Rising glowing bubbles floating from ocean floor */}
        <span className="absolute bottom-4 left-8 text-xl filter drop-shadow-md animate-vfx-bubble-1 z-10">🫧</span>
        <span className="absolute bottom-8 right-12 text-lg filter drop-shadow-md animate-vfx-bubble-2 z-10">🫧</span>
        <span className="absolute bottom-2 left-1/2 text-sm filter drop-shadow-md animate-vfx-bubble-3 z-10">🫧</span>
        {/* Little friendly clownfish swimming across */}
        <span className="absolute top-7 left-0 text-lg filter drop-shadow-md animate-vfx-fish pointer-events-none z-10">🐠</span>
        <span className="absolute top-5 right-6 text-sm animate-story-sparkle-1 z-10">⭐</span>
      </>
    ),
  },
  'story-farm': {
    wrapperClass: 'animate-vfx-bear-bake',
    overlay: (
      <>
        {/* Warm rising steam aroma spirals from the hot honey cake */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none flex gap-2 z-10">
          <span className="text-lg text-amber-950/70 filter drop-shadow-sm animate-vfx-steam-1">♨️</span>
          <span className="text-base text-amber-950/60 filter drop-shadow-sm animate-vfx-steam-2">♨️</span>
        </div>
        {/* Sweet floating bakery hearts & honey sparkles */}
        <span className="absolute top-8 right-8 text-base animate-vfx-heart z-10">💛</span>
        <span className="absolute bottom-8 left-10 text-sm animate-story-sparkle-1 z-10">✨</span>
        <span className="absolute top-10 left-8 text-xs animate-story-sparkle-2 z-10">🍯</span>
      </>
    ),
  },
}

export function StoryCard({ story }) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)
  const readRoute = `/child/stories/${story.id}`
  const theme = THEME_STYLES[story.color] || THEME_STYLES.brand
  const motionConfig = STORY_MOTION_MAP[story.id] || {
    wrapperClass: 'animate-story-bob',
    overlay: (
      <>
        <span className="absolute top-4 right-5 text-xl animate-story-sparkle-1 z-10">✨</span>
        <span className="absolute bottom-8 left-5 text-base animate-story-sparkle-2 z-10">⭐</span>
      </>
    ),
  }

  const hasImage = story.image && !imgError

  return (
    <div
      className={`group h-full overflow-hidden border-2 border-[#D7EEF1] ${theme.borderHover} shadow-[0_8px_30px_rgba(8,35,58,0.06)] hover:shadow-[0_16px_40px_${theme.glow}] transition-all duration-300 hover:-translate-y-1.5 bg-white rounded-3xl flex flex-col justify-between`}
    >
      {/* 3D Visual Cover with Story-Specific Moving Action VFX */}
      <div
        className={`h-48 sm:h-52 relative overflow-hidden select-none bg-gradient-to-b ${theme.bg} flex items-center justify-center`}
      >
        {/* Soothing Ambient Breathing Aura */}
        <div
          className="absolute inset-0 pointer-events-none animate-story-aura z-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${theme.aura} 0%, transparent 70%)`,
          }}
        />

        {/* The Cover Visual with Unique Action Motion (Rocket flies up, sunflower sways, etc.) */}
        <div
          className={`w-full h-full flex items-center justify-center ${motionConfig.wrapperClass}`}
        >
          {hasImage ? (
            <img
              src={story.image}
              alt={story.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="text-7xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]">
              {story.cover}
            </div>
          )}
        </div>

        {/* Story-Specific Moving VFX Elements (Flames, Pollen, Crystal Beacon, Bubbles, Steam) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {motionConfig.overlay}
        </div>

        {/* Moving VFX: Gentle Glossy Light Sheen */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent animate-story-sheen" />
        </div>

        {/* Floating Glassmorphic Badges on Top */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-30">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs border ${theme.badge}`}
          >
            <Sparkles size={11} className="text-current opacity-80" />
            <span>{story.genre || story.difficulty || 'Storybook'}</span>
          </span>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#08233A] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs border border-white/80">
            <Clock size={11} className="text-[#527080]" />
            <span>{story.duration}</span>
          </span>
        </div>

        {/* Bottom Floating Badge: 3D Story */}
        <div className="absolute bottom-2.5 left-3 pointer-events-none z-30">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-[#08233A] bg-white/85 backdrop-blur-md border border-white/70 shadow-xs">
            <BookOpen size={10} className="text-[#0899AA]" />
            <span>3D Adventure</span>
          </span>
        </div>
      </div>

      {/* Story Details */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-display font-black text-base sm:text-lg text-[#08233A] mb-1.5 leading-snug group-hover:text-[#0899AA] transition-colors">
            {story.title}
          </h3>

          <p className="text-xs font-semibold text-[#527080] line-clamp-2 mb-4 leading-relaxed">
            {story.description || 'A calm and fun story adventure.'}
          </p>
        </div>

        {/* Dual Actions: [▶ Listen] and [📖 Read] */}
        <div className="pt-3 border-t border-[#D7EEF1] flex items-center gap-2.5">
          <div className="flex-1">
            <ChildAudioGuideBadge
              text={`${story.title}. ${story.description || ''}`}
              label="▶ Listen"
              className="w-full justify-center py-2 text-xs font-bold shadow-xs hover:bg-[#E6F8FA]"
            />
          </div>

          <ChildTactileButton
            variant="cyan"
            size="sm"
            onClick={() => navigate(readRoute)}
            className="flex-1 text-xs shadow-xs"
          >
            📖 Read
          </ChildTactileButton>
        </div>
      </div>
    </div>
  )
}



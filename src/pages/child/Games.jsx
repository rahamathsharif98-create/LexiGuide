import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { GAMING_ZONE_GAMES, GAME_CATEGORIES } from '../../data/gamingZoneRegistry'
import { GameCard } from '../../components/games/GameCard'
import { resolveThemePackage, applyThemeToActivity } from '../../services/personalizationService'
import { generateRecommendations } from '../../services/adaptiveEngine'
import VoiceModeIndicator from '../../components/VoiceModeIndicator'
import { ChildAudioGuideBadge } from '../../components/child/ChildAudioGuideBadge'
import { ChildTactileButton } from '../../components/child/ChildTactileButton'
import { Heart, Sparkles, Compass, Globe, RotateCcw } from 'lucide-react'

function useSafeApp() {
  try {
    return useApp()
  } catch {
    return { activeChild: null }
  }
}

export default function Games() {
  const {
    activeChild,
    isRealBackend,
    nextRecommendedActivity,
    nextBestAction,
    errorPatterns,
    recentActivityTitles,
    learningHistory,
  } = useSafeApp()

  const navigate = useNavigate()
  const theme = resolveThemePackage(activeChild?.interests)
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Favorites management persisted in localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('lexi_favorite_games')
      return saved ? JSON.parse(saved) : ['match-sound', 'word-train']
    } catch {
      return ['match-sound', 'word-train']
    }
  })

  const toggleFavorite = (gameId) => {
    setFavorites((prev) => {
      const updated = prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId]
      try {
        localStorage.setItem('lexi_favorite_games', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  // Section 9: Adaptive Recommendation (Made For You)
  const interestKey = activeChild?.interests?.[0] || 'space'
  const demoRecs = (!isRealBackend && activeChild?.fingerprint)
    ? generateRecommendations(activeChild.fingerprint, errorPatterns, { recentTitles: recentActivityTitles })
    : []

  const primaryRaw = isRealBackend
    ? (nextBestAction?.best_action || nextRecommendedActivity)
    : (nextRecommendedActivity || demoRecs[0])

  const primaryThemed = primaryRaw ? applyThemeToActivity(primaryRaw, theme) : null
  const heroTitle = primaryThemed?.themedTitle || (interestKey === 'space' ? 'Space Sound Mission' : 'Animal Sound Hunt')
  const heroIcon = primaryThemed?.themedIcon || theme.mascot || '🚀'
  const heroImage3d = primaryThemed?.image3d || (interestKey === 'space' ? '/assets/games/space-rocket.jpg' : '/assets/games/cosmic-ufo.jpg')
  const heroRoute = primaryThemed?.route || '/child/games/sound-hunt'
  const heroPrompt = primaryThemed?.reason || 'Let\'s practice beginning sounds today!'

  // Section 27: Continue Playing
  const lastUnfinished = (learningHistory && learningHistory.length > 0)
    ? learningHistory[0]
    : (recentActivityTitles && recentActivityTitles.length > 0)
    ? { title: recentActivityTitles[0], route: '/child/games/build-word' }
    : null

  // Flagship 3D Learning Worlds
  const FLAGSHIP_3D_IDS = [
    'spider-weaver',
    'learning-run',
    'ancient-labyrinth',
    'safari-photo',
    'voxel-crafter',
    'cloud-bouncer',
    'dino-fossil',
    'magic-bakery',
    'coral-diver',
    'cosmic-miner',
    'sky-archer',
  ]
  const flagship3DGames = GAMING_ZONE_GAMES.filter((g) => FLAGSHIP_3D_IDS.includes(g.id))

  // Filtered games by category
  const filteredGames = selectedCategory === 'all'
    ? GAMING_ZONE_GAMES
    : selectedCategory === '3d'
    ? flagship3DGames
    : GAMING_ZONE_GAMES.filter((g) => g.category === selectedCategory)

  // Favorite games list
  const favoriteGames = GAMING_ZONE_GAMES.filter((g) => favorites.includes(g.id))

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-7" data-testid="games-catalog-container">
      {/* 1. Header Bar: Arcade mascot badge + Voice mode indicator */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDF9FC] border border-[#D7EEF1] text-xs font-black uppercase tracking-wider text-[#0899AA]">
          <span>{theme.mascot || '🎮'}</span>
          <span>Gaming Zone 🎮</span>
        </div>
        <VoiceModeIndicator />
      </div>

      {/* 2. Hero Banner: Welcome to Gaming Zone */}
      <div className="rounded-3xl bg-[linear-gradient(135deg,#08233A_0%,#0B5264_55%,#13CFE3_100%)] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-[0_12px_40px_rgba(8,35,58,0.12)] border border-[#13CFE3]/30 relative overflow-hidden">
        <div className="flex items-center gap-4 sm:gap-5 relative z-10">
          <span className="text-5xl sm:text-6xl select-none animate-bounce">{theme.badgeIcon || '🎮'}</span>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
                Let's Play &amp; Learn!
              </h1>
              <ChildAudioGuideBadge
                text={`Welcome to the Gaming Zone! Choose an adventure and have fun playing!`}
                label="Listen"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              />
            </div>
            <p className="text-[#DDF9FC] text-xs sm:text-sm font-semibold mt-1">
              Pick a game and have fun while you learn! Choose an adventure and tap any game to start.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Section 9: 🌟 MADE FOR YOU (Personalized Recommendation) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(heroRoute)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            navigate(heroRoute)
          }
        }}
        aria-label={`Play recommended game: ${heroTitle}`}
        className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#D7EEF1] hover:border-[#13CFE3] shadow-[0_8px_30px_rgba(8,35,58,0.06)] hover:shadow-[0_12px_36px_rgba(19,207,227,0.18)] transition-all cursor-pointer active:scale-[0.99] relative overflow-hidden group select-none"
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FEF8EC] text-[#B45309] border border-[#FDE6BE]">
              🌟 Made For You
            </span>
            <span className="text-xs text-[#527080] font-semibold hidden sm:inline">
              Personalized adventure • Tap to Play
            </span>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <ChildAudioGuideBadge
              text={`Made for you: ${heroTitle}. ${heroPrompt}`}
              label="Listen"
              size="sm"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#DDF9FC] border-2 border-[#13CFE3]/40 group-hover:border-[#13CFE3] flex items-center justify-center shrink-0 shadow-md transition-all">
              {heroImage3d ? (
                <img
                  src={heroImage3d}
                  alt={heroTitle}
                  className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-300"
                />
              ) : (
                <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform">{heroIcon}</span>
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0899AA] bg-[#DDF9FC] px-2 py-0.5 rounded-md mb-1 inline-block">
                3D Adventure 🎮
              </span>
              <h3 className="font-display font-black text-lg sm:text-xl text-[#08233A] group-hover:text-[#0899AA] transition-colors truncate">
                {heroTitle}
              </h3>
              <p className="text-xs text-[#527080] font-semibold truncate mt-0.5">
                {heroPrompt}
              </p>
            </div>
          </div>

          <div className="shrink-0 self-end sm:self-center">
            <ChildTactileButton
              variant="cyan"
              size="md"
              onClick={(e) => {
                e?.stopPropagation?.()
                navigate(heroRoute)
              }}
            >
              PLAY ▶
            </ChildTactileButton>
          </div>
        </div>
      </div>

      {/* 3.5 🕶️ 3D LEARNING WORLDS SPOTLIGHT CAROUSEL */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-cyan-400/40 p-5 shadow-xl text-white">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🕶️</span>
            <h2 className="font-display font-black text-lg sm:text-xl text-white">
              3D Learning Worlds
            </h2>
            <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950 px-2 py-0.5 rounded-full">
              10 Games
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCategory('3d')}
            className="text-xs font-bold text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
          >
            View All 3D
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {flagship3DGames.map((game) => (
            <div
              key={game.id}
              onClick={() => navigate(game.route)}
              className="w-48 sm:w-52 shrink-0 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 hover:border-cyan-400 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {game.icon}
                </span>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800">
                  3D
                </span>
              </div>
              <h4 className="font-display font-black text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                {game.title}
              </h4>
              <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 font-medium leading-snug">
                {game.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Category Tabs: 🎮 EASY GAMES */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="font-display font-black text-xl text-[#08233A] flex items-center gap-2">
              <span>🎮 Easy Games</span>
              <span className="text-xs font-bold text-[#0899AA] bg-[#DDF9FC] px-2.5 py-0.5 rounded-full border border-[#D7EEF1]">
                {filteredGames.length} Games
              </span>
            </h2>
            <p className="text-xs text-[#527080] font-semibold mt-0.5">
              Pick what you want to practice!
            </p>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {GAME_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-[44px] px-4 py-2 rounded-2xl font-display font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer outline-none border-2 select-none ${
                  isSelected
                    ? 'bg-[#13CFE3] text-[#08233A] border-[#0899AA] shadow-sm shadow-[#13CFE3]/25'
                    : 'bg-white text-[#527080] border-[#D7EEF1] hover:border-[#13CFE3] hover:text-[#08233A]'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
          {filteredGames.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              isFavorite={favorites.includes(g.id)}
              onToggleFavorite={toggleFavorite}
              themeContext={g.themeContext?.[interestKey]}
            />
          ))}
        </div>
      </div>

      {/* 5. Section 26: ❤️ MY GAMES (Favorites) */}
      {favoriteGames.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D7EEF1] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-black text-lg text-[#08233A] flex items-center gap-2">
              <span className="text-[#E0245E]">❤️</span>
              <span>My Games</span>
              <span className="text-xs text-[#527080] font-semibold font-sans">
                ({favoriteGames.length} saved)
              </span>
            </h3>
            <span className="text-xs text-[#527080] font-semibold">Touch to play</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {favoriteGames.map((g) => (
              <div
                key={g.id}
                onClick={() => navigate(g.route)}
                className="p-3.5 rounded-2xl bg-[#F2FBFC] border border-[#D7EEF1] hover:border-[#13CFE3] flex items-center justify-between gap-3 cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                    {g.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display font-black text-sm text-[#08233A] group-hover:text-[#0899AA] transition-colors truncate">
                      {g.title}
                    </p>
                    <p className="text-[11px] text-[#527080] truncate font-medium">
                      {g.desc}
                    </p>
                  </div>
                </div>
                <span className="text-[#0899AA] font-black text-xs shrink-0">PLAY ▶</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Section 27: 🔄 CONTINUE PLAYING */}
      {lastUnfinished && (
        <div className="bg-white p-5 rounded-3xl border border-[#D7EEF1] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#DDF9FC] flex items-center justify-center text-2xl shrink-0">
              <RotateCcw size={22} className="text-[#0899AA]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0899AA] bg-[#DDF9FC] px-2 py-0.5 rounded-md">
                  Continue
                </span>
                <span className="text-xs text-[#527080] font-semibold">
                  Continue where you stopped
                </span>
              </div>
              <h3 className="font-display font-black text-base text-[#08233A] mt-0.5">
                {lastUnfinished.title || 'Word Builder'}
              </h3>
            </div>
          </div>
          <ChildTactileButton
            variant="cyan"
            size="sm"
            onClick={() => navigate(lastUnfinished.route || '/child/games/build-word')}
            className="w-full sm:w-auto"
          >
            CONTINUE ▶
          </ChildTactileButton>
        </div>
      )}

      {/* 7. Section 21: 🌏 LANGUAGE ADVENTURE */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D7EEF1] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EEF8F3] text-[#047857] flex items-center justify-center">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-[#08233A]">
                🌏 Language Adventure
              </h3>
              <p className="text-xs text-[#527080] font-semibold">
                Explore letters, words, and sounds in your language!
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Telugu */}
          <div
            onClick={() => navigate('/child/games/trace-speak?lang=te')}
            className="p-4 rounded-2xl bg-[#F2FBFC] border-2 border-[#D7EEF1] hover:border-[#13CFE3] cursor-pointer group transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">అ</span>
              <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-md text-[#08233A] border border-[#D7EEF1]">
                🇮🇳 Telugu
              </span>
            </div>
            <div>
              <p className="font-display font-black text-sm text-[#08233A] group-hover:text-[#0899AA] transition-colors">
                తెలుగు అక్షరాలు
              </p>
              <p className="text-xs text-[#527080] font-medium mt-0.5">
                అమ్మ, ఆట, ఇల్లు...
              </p>
            </div>
            <span className="text-[11px] font-extrabold text-[#0899AA] mt-3 block">
              Trace &amp; Say ▶
            </span>
          </div>

          {/* Hindi */}
          <div
            onClick={() => navigate('/child/games/trace-speak?lang=hi')}
            className="p-4 rounded-2xl bg-[#F2FBFC] border-2 border-[#D7EEF1] hover:border-[#13CFE3] cursor-pointer group transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">अ</span>
              <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-md text-[#08233A] border border-[#D7EEF1]">
                🇮🇳 Hindi
              </span>
            </div>
            <div>
              <p className="font-display font-black text-sm text-[#08233A] group-hover:text-[#0899AA] transition-colors">
                हिन्दी वर्णमाला
              </p>
              <p className="text-xs text-[#527080] font-medium mt-0.5">
                अनार, आम, इमली...
              </p>
            </div>
            <span className="text-[11px] font-extrabold text-[#0899AA] mt-3 block">
              Trace &amp; Say ▶
            </span>
          </div>

          {/* English */}
          <div
            onClick={() => navigate('/child/games/trace-speak?lang=en')}
            className="p-4 rounded-2xl bg-[#F2FBFC] border-2 border-[#D7EEF1] hover:border-[#13CFE3] cursor-pointer group transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">A</span>
              <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-md text-[#08233A] border border-[#D7EEF1]">
                🇬🇧 English
              </span>
            </div>
            <div>
              <p className="font-display font-black text-sm text-[#08233A] group-hover:text-[#0899AA] transition-colors">
                English Alphabet
              </p>
              <p className="text-xs text-[#527080] font-medium mt-0.5">
                Apple, Ball, Cat...
              </p>
            </div>
            <span className="text-[11px] font-extrabold text-[#0899AA] mt-3 block">
              Trace &amp; Say ▶
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

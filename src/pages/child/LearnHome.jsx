import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Card, Skeleton } from '../../components/ui'
import { GAMES, STORIES } from '../../data/demoData'
import { generateRecommendations } from '../../services/adaptiveEngine'
import { SearchModal } from '../../components/SearchModal'
import { Search, Sparkles, Volume2, ArrowRight, Compass } from 'lucide-react'
import { ChildTactileButton } from '../../components/child/ChildTactileButton'
import { ChildAudioGuideBadge } from '../../components/child/ChildAudioGuideBadge'

const CATEGORIES = [
  {
    key: 'sounds',
    label: 'Sounds',
    title: 'Phonics & Letters',
    emoji: '🔤',
    accent: 'from-[#08233A] to-[#0899AA]',
    border: 'border-[#D7EEF1]',
    badge: 'Phonics Lab',
    desc: 'Master phonemes, blends, and sound detective skills',
    activities: [
      {
        icon: '🦁',
        image: '/assets/games/sound-match.jpg',
        title: 'Sound Safari',
        desc: 'Hear and match animal phonemes',
        route: '/child/games/match-sound',
        motionClass: 'animate-vfx-sound-pulse',
        badge: '🎧 Audio Fun',
        particles: (
          <>
            <span className="absolute top-2 right-2 text-xs animate-vfx-note-1">🎵</span>
            <span className="absolute bottom-2 left-2 text-xs animate-vfx-note-2">🎶</span>
          </>
        ),
      },
      {
        icon: '🔍',
        image: '/assets/games/letter-detective.jpg',
        title: 'Letter Detective',
        desc: 'Investigate target letter phonemes',
        route: '/child/games/find-sound',
        motionClass: 'animate-vfx-detective-search',
        badge: '🔍 Clue Hunt',
        particles: (
          <>
            <span className="absolute top-2 right-2 text-xs animate-story-sparkle-1">✨</span>
            <span className="absolute bottom-2 right-2 text-xs animate-story-sparkle-2">🔍</span>
          </>
        ),
      },
      {
        icon: '✍️',
        image: '/assets/games/letter-trace.jpg',
        title: 'Trace & Speak',
        desc: 'Trace multilingual letters and hear pronunciation',
        route: '/child/games/trace-speak',
        motionClass: 'animate-vfx-pencil-trace',
        badge: '✏️ Magic Trace',
        particles: (
          <>
            <span className="absolute top-2 right-2 text-xs animate-story-sparkle-1">✨</span>
            <span className="absolute bottom-2 left-2 text-xs animate-story-sparkle-3">🌈</span>
          </>
        ),
      },
    ],
  },
  {
    key: 'reading',
    label: 'Reading',
    title: 'Word Blending & Passages',
    emoji: '📖',
    accent: 'from-[#0899AA] to-[#13CFE3]',
    border: 'border-[#D7EEF1]',
    badge: 'Book Grove',
    desc: 'Passages aloud, build sight words, and match pictures',
    activities: [
      {
        icon: '📖',
        image: '/assets/games/story-puzzle.jpg',
        title: 'Read With Me',
        desc: 'Guided interactive story practice',
        route: '/child/read',
        motionClass: 'animate-vfx-book-float',
        badge: '📖 Story Magic',
        particles: (
          <>
            <span className="absolute top-2 right-2 text-xs animate-story-sparkle-1">✨</span>
            <span className="absolute bottom-2 right-2 text-xs animate-story-sparkle-2">⭐</span>
          </>
        ),
      },
      {
        icon: '🧩',
        image: '/assets/games/word-builder.jpg',
        title: 'Word Builder',
        desc: 'Tile-by-tile phonics blending',
        route: '/child/games/build-word',
        motionClass: 'animate-vfx-blocks-bounce',
        badge: '🧩 Word Blocks',
        particles: (
          <>
            <span className="absolute top-2 right-2 text-xs animate-story-sparkle-1">⭐</span>
            <span className="absolute bottom-2 left-2 text-xs animate-story-sparkle-3">🧩</span>
          </>
        ),
      },
      {
        icon: '🖼️',
        image: '/assets/games/picture-match.jpg',
        title: 'Picture Match',
        desc: 'Connect vocabulary to visual meaning',
        route: '/child/games/picture-word',
        motionClass: 'animate-vfx-camera-snap',
        badge: '📷 Photo Match',
        particles: (
          <>
            <span className="absolute top-2 right-2 text-xs animate-story-sparkle-1">✨</span>
            <span className="absolute bottom-2 right-2 text-xs animate-story-sparkle-2">📸</span>
          </>
        ),
      },
    ],
  },
  {
    key: 'speaking',
    label: 'Speaking',
    title: 'Voice & Articulation',
    emoji: '🗣️',
    accent: 'from-[#FFC857] to-[#FF9F1C]',
    border: 'border-[#FFE8A3]',
    badge: 'Speech Studio',
    desc: 'Practice clear, confident speech with real-time feedback',
    activities: [
      {
        icon: '🎤',
        image: '/assets/games/speak-mic.jpg',
        title: 'Speak & Shine',
        desc: 'Speak target words into the microphone',
        route: '/child/speak',
        motionClass: 'animate-vfx-mic-shine',
        badge: '🎤 Voice Star',
        particles: (
          <>
            <span className="absolute top-2 right-2 text-xs animate-vfx-note-1">🎶</span>
            <span className="absolute bottom-2 left-2 text-xs animate-story-sparkle-1">✨</span>
            <span className="absolute top-2 left-2 text-xs animate-story-sparkle-2">🌟</span>
          </>
        ),
      },
    ],
  },
  {
    key: 'understanding',
    label: 'Understanding',
    title: 'Comprehension & Meaning',
    emoji: '🧠',
    accent: 'from-[#39B87F] to-[#2E9566]',
    border: 'border-[#D7EEF1]',
    badge: 'Story Sanctuary',
    desc: 'Answer fun questions and understand story journeys',
    activities: [
      {
        icon: '📚',
        image: '/assets/stories/curious-fox.jpg',
        title: 'Story Time',
        desc: 'Explore curated illustrated storybooks',
        route: '/child/stories',
        motionClass: 'animate-vfx-fox-curious',
        badge: '🦊 Story Woods',
        particles: (
          <>
            <span className="absolute top-2 right-2 text-xs animate-story-sparkle-1">💎</span>
            <span className="absolute bottom-2 right-2 text-xs animate-story-sparkle-2">✨</span>
          </>
        ),
      },
    ],
  },
]

export default function LearnHome() {
  const {
    activeChild, errorPatterns, isRealBackend,
    nextRecommendedActivity, recommendationsLoading,
    personalizedContent, personalizedContentLoading,
  } = useApp()
  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Use Step 17 primary recommended candidate if available, fallback to nextRecommendedActivity or demo
  const primaryPersonalized = personalizedContent?.primary_recommendation
  const picked = primaryPersonalized
    ? {
        title: primaryPersonalized.content?.title,
        activity: primaryPersonalized.content?.title,
        icon: primaryPersonalized.content?.icon || '✨',
        reason: primaryPersonalized.why,
        route: primaryPersonalized.content?.route || '/child/read',
        learning_mode: primaryPersonalized.learning_mode,
        difficulty_level: primaryPersonalized.content?.difficulty_level,
      }
    : (isRealBackend
        ? nextRecommendedActivity
        : (nextRecommendedActivity || generateRecommendations(activeChild?.fingerprint, errorPatterns)[0]))

  const isLoading = recommendationsLoading || personalizedContentLoading

  return (
    <div className="max-w-4xl mx-auto pb-8 space-y-6">
      {/* Header Banner */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DDF9FC] border border-[#D7EEF1] text-[#08233A] text-xs font-bold uppercase tracking-wider mb-2">
          <Compass size={14} className="text-[#0899AA]" />
          <span>Learning Worlds</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#08233A]">
          Let's Learn! Learn 📚
        </h1>
        <p className="text-[#527080] text-sm font-semibold mt-1">Pick something to practice!</p>
      </div>

      {/* Learning Search Button */}
      <button
        type="button"
        onClick={() => setIsSearchOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-2xl border border-[#D7EEF1] shadow-2xs hover:border-[#13CFE3] transition-all text-left group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#13CFE3]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#DDF9FC] flex items-center justify-center text-[#0899AA]">
            <Search size={16} />
          </div>
          <span className="text-sm font-medium text-[#527080] group-hover:text-[#08233A] transition-colors">
            Find fun adventures, letters, or games...
          </span>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#DDF9FC] text-[#08233A] border border-[#D7EEF1]">
          Search 🔍
        </span>
      </button>

      {isSearchOpen && (
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          childId={activeChild?.id}
        />
      )}

      {isLoading && (
        <Skeleton className="h-44 w-full rounded-3xl" />
      )}

      {/* Primary Picked Hero Card */}
      {!isLoading && picked && (
        <div className="relative rounded-3xl bg-[linear-gradient(135deg,#08233A_0%,#0B5264_55%,#13CFE3_100%)] text-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(8,35,58,0.12)] overflow-hidden border-b-4 border-[#08233A]">
          <div className="absolute -right-4 -bottom-4 text-9xl opacity-20 select-none pointer-events-none">{picked.icon || '✨'}</div>
          <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
                ✨ Picked for you
              </span>
              {picked.learning_mode && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/20">
                  {picked.learning_mode.replace('_', ' ')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                {picked.title || picked.activity}!
              </h2>
              <ChildAudioGuideBadge
                text={`${picked.title || picked.activity}. ${picked.reason || 'Practice today!'}`}
                label="Listen"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              />
            </div>

            {picked.reason && (
              <div className="mb-5 flex items-start gap-2 bg-black/20 p-3 rounded-xl border border-white/15">
                <span className="inline-block bg-white/25 text-white text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 mt-0.5">WHY?</span>
                <span className="text-white/90 text-xs sm:text-sm font-medium leading-relaxed">{picked.reason}</span>
              </div>
            )}

            <ChildTactileButton
              variant="cyan"
              size="md"
              onClick={() => navigate(picked.route || '/child/read')}
              className="mt-1"
            >
              PLAY ▶
            </ChildTactileButton>
          </div>
        </div>
      )}

      {/* 4 Category Worlds */}
      <div className="space-y-6">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="bg-white rounded-3xl p-6 border border-[#D7EEF1] shadow-[0_8px_30px_rgba(8,35,58,0.06)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.accent} text-white flex items-center justify-center text-2xl shadow-sm shrink-0 animate-story-bob`}>
                  {cat.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-black text-lg text-[#08233A]">
                      {cat.emoji} {cat.label}
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#DDF9FC] text-[#08233A] border border-[#D7EEF1]">
                      {cat.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#527080] font-medium mt-0.5">{cat.desc}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {cat.activities.map((a) => (
                <button
                  key={a.title}
                  type="button"
                  onClick={() => navigate(a.route)}
                  className="group text-left cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/40 rounded-3xl transition-all duration-300 hover:-translate-y-1"
                >
                  <Card
                    hover
                    className="p-3.5 sm:p-4 rounded-3xl border-2 border-[#D7EEF1] hover:border-[#13CFE3] h-full flex items-center gap-3.5 transition-all bg-white hover:bg-[#F2FBFC] shadow-[0_4px_20px_rgba(8,35,58,0.04)] hover:shadow-[0_12px_30px_rgba(19,207,227,0.18)]"
                  >
                    {/* 3D Visual Box with Action Motion & Particle VFX */}
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl relative overflow-hidden shrink-0 border border-[#D7EEF1] shadow-xs bg-gradient-to-br from-[#E6F8FA] to-[#DDF9FC] flex items-center justify-center">
                      {/* Ambient breathing glow */}
                      <div className="absolute inset-0 pointer-events-none animate-story-aura opacity-50 bg-radial from-white via-transparent to-transparent z-0" />

                      {/* Moving 3D Image with unique action motion */}
                      {a.image ? (
                        <img
                          src={a.image}
                          alt={a.title}
                          className={`w-full h-full object-cover select-none transition-transform duration-500 group-hover:scale-110 ${a.motionClass}`}
                          loading="lazy"
                        />
                      ) : (
                        <span className={`text-3xl select-none ${a.motionClass}`}>{a.icon}</span>
                      )}

                      {/* Moving Particles */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                        {a.particles}
                      </div>

                      {/* Glossy Sheen */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                        <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-story-sheen" />
                      </div>
                    </div>

                    {/* Activity Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E6F8FA] text-[#0899AA] border border-[#D7EEF1] truncate">
                          {a.badge}
                        </span>
                      </div>
                      <p className="font-display font-black text-sm sm:text-base text-[#08233A] group-hover:text-[#0899AA] transition-colors truncate">
                        {a.title}
                      </p>
                      <p className="text-[11px] font-semibold text-[#527080] line-clamp-2 mt-0.5 leading-snug">
                        {a.desc}
                      </p>
                    </div>

                    {/* Action Arrow Pill */}
                    <div className="w-8 h-8 rounded-full bg-[#E6F8FA] group-hover:bg-[#13CFE3] text-[#0899AA] group-hover:text-[#08233A] flex items-center justify-center transition-all shrink-0 shadow-2xs group-hover:translate-x-0.5">
                      <ArrowRight size={16} />
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Button, Card, Skeleton } from '../../components/ui'
import { ProfileAvatar } from '../../components/ProfileAvatar'
import { generateRecommendations, detectSkillPattern, childFriendlyPatternText } from '../../services/adaptiveEngine'
import { LANGUAGES } from '../../i18n/translations'
import { SearchModal } from '../../components/SearchModal'
import { Search, Volume2, Sparkles, BookOpen, Gamepad2, Library, Mic } from 'lucide-react'
import { NextBestActionCard } from '../../components/NextBestActionCard'
import { LearningJourneyPlan } from '../../components/LearningJourneyPlan'
import { resolveThemePackage, applyThemeToActivity } from '../../services/personalizationService'
import audioAtmosphereService from '../../services/audioAtmosphereService'
import { SmoothTonePill, SmoothToneModal } from '../../components/audio/SmoothTonePlayer'
import { speakLanguageAudio } from '../../services/multilingualVoiceService'
import {
  ChildWorldCard,
  ChildDotProgress,
  ChildAudioGuideBadge,
  ChildButton,
  AudioControl,
  EnvironmentSelector,
  ENVIRONMENTS,
} from '../../components/child'

// Section 3: Quick Learning (4 age-appropriate domain paths matching Read, Speak, Play, Stories)
const QUICK_LEARNING_ITEMS = [
  {
    id: 'read',
    label: 'Read',
    sublabel: 'Read with me',
    route: '/child/read',
    badge: 'Reading Grove',
    emoji: '📖',
    bg: 'bg-[#EBF7FD]',
    border: 'border-[#BAE6FD]',
    text: 'text-[#0369A1]',
    iconBg: 'bg-[#BAE6FD]/60',
    shadow: 'shadow-sky-500/10',
    Icon: BookOpen,
  },
  {
    id: 'speak',
    label: 'Speak',
    sublabel: 'Say the word',
    route: '/child/speak',
    badge: 'Speech Studio',
    emoji: '🗣️',
    bg: 'bg-[#FEF8EC]',
    border: 'border-[#FDE6BE]',
    text: 'text-[#B45309]',
    iconBg: 'bg-[#FDE6BE]/60',
    shadow: 'shadow-amber-500/10',
    Icon: Mic,
  },
  {
    id: 'play',
    label: 'Play',
    sublabel: '10 fun learning games',
    route: '/child/games',
    badge: 'Gaming Zone 🎮',
    emoji: '🎮',
    bg: 'bg-[#FEF2F4]',
    border: 'border-[#FDCED6]',
    text: 'text-[#E0245E]',
    iconBg: 'bg-[#FDCED6]/60',
    shadow: 'shadow-rose-500/10',
    Icon: Gamepad2,
  },
  {
    id: 'stories',
    label: 'Stories',
    sublabel: 'Story sanctuary',
    route: '/child/stories',
    badge: 'Story Woods',
    emoji: '📚',
    bg: 'bg-[#EEF8F3]',
    border: 'border-[#CDEFD9]',
    text: 'text-[#047857]',
    iconBg: 'bg-[#CDEFD9]/60',
    shadow: 'shadow-emerald-500/10',
    Icon: Library,
  },
]


export default function Home() {
  const {
    activeChild, tr, language, setLanguage, errorPatterns, history,
    recentActivityTitles, isRealBackend, updateActiveChild,
    nextRecommendedActivity, learningPath,
    recommendationsLoading, recommendationsError, refreshRecommendations,
    nextBestAction, nextBestActionLoading, nextBestActionError, refreshNextBestAction,
    learningGoals, learningGoalsLoading, learningGoalsError, refreshLearningGoals,
    weeklyPlan, weeklyPlanLoading, weeklyPlanError, refreshWeeklyPlan,
    refreshProgress, learningHistory,
  } = useApp()

  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isQuiet, setIsQuiet] = useState(Boolean(audioAtmosphereService?.quietMode))
  const [isMusicPlaying, setIsMusicPlaying] = useState(Boolean(audioAtmosphereService?.isPlayingMusic))
  const [showToneModal, setShowToneModal] = useState(false)

  useEffect(() => {
    const unsub = audioAtmosphereService?.subscribe?.((state) => {
      setIsQuiet(Boolean(state.quietMode))
      setIsMusicPlaying(Boolean(state.isPlayingMusic))
    })
    return unsub
  }, [])

  // Section 6: Dynamic Learning World / Environment
  const defaultEnv = activeChild?.environment || (activeChild?.interests && activeChild.interests[0]) || 'space'
  const [currentEnvId, setCurrentEnvId] = useState(defaultEnv)

  useEffect(() => {
    if (activeChild?.environment && activeChild.environment !== currentEnvId) {
      setCurrentEnvId(activeChild.environment)
    }
  }, [activeChild?.environment])

  const currentEnv = ENVIRONMENTS.find((e) => e.id === currentEnvId) || ENVIRONMENTS[0]

  const handleSelectEnvironment = (envId) => {
    setCurrentEnvId(envId)
    updateActiveChild?.({ environment: envId, interests: [envId] })
    try {
      if (audioAtmosphereService?.isPlayingMusic) {
        audioAtmosphereService.startAmbientAtmosphere(envId)
      }
    } catch {}
  }

  useEffect(() => {
    if (isRealBackend) {
      refreshRecommendations()
      refreshProgress()
    }
  }, [isRealBackend, refreshRecommendations, refreshProgress])

  const themePackage = resolveThemePackage(activeChild?.interests)

  const demoRecs = !isRealBackend
    ? generateRecommendations(activeChild?.fingerprint, errorPatterns, { recentTitles: recentActivityTitles })
    : []

  const rawPrimary = isRealBackend
    ? nextRecommendedActivity
    : (nextRecommendedActivity || demoRecs[0])

  const primary = rawPrimary ? applyThemeToActivity(rawPrimary, themePackage) : null

  const rawRecs = isRealBackend
    ? (learningPath || []).filter((r) => r.route !== primary?.route).slice(0, 2)
    : (demoRecs.slice(1, 3).length > 0 ? demoRecs.slice(1, 3) : demoRecs.slice(0, 2))

  const recs = rawRecs.map((r) => applyThemeToActivity(r, themePackage))

  const playGreetingAudio = () => {
    let greetingText = ''
    if (language === 'hi') {
      greetingText = `नमस्ते! आपके ${currentEnv.name} में वापस आने के लिए स्वागत है, ${activeChild?.name || 'दोस्त'}! चलिए मिलकर कुछ नया सीखते हैं।`
    } else if (language === 'te') {
      greetingText = `హాయ్! మీ ${currentEnv.name} కి మళ్లీ వచ్చినందుకు స్వాగతం, ${activeChild?.name || 'స్నేహితుడా'}! రండి, ఇద్దరం కలిసి సరదాగా నేర్చుకుందాం.`
    } else {
      greetingText = `${currentEnv.greeting} ${currentEnv.subGreeting} Ready for today’s adventure, ${activeChild?.name || 'friend'}?`
    }

    try {
      audioAtmosphereService?.duckMusic?.()
    } catch {}

    speakLanguageAudio({
      text: greetingText,
      lang: language || 'en',
      rate: 0.86,
      pitch: 1.05,
      onEnd: () => {
        try {
          audioAtmosphereService?.restoreMusic?.()
        } catch {}
      },
    })
  }

  const primaryPattern = primary && primary.skill && primary.skill !== 'targeted' && primary.skill !== 'story'
    ? detectSkillPattern(history, primary.skill)
    : (primary?.pattern || null)

  const heroTitle = primary?.themedTitle || primary?.title || primary?.activity || "Sound Safari"
  const heroRoute = primary?.route || '/child/read'
  const heroReason = primary?.reason || (primaryPattern ? childFriendlyPatternText(primaryPattern) : "Listen, look, and find the friendly sounds!")

  // Section 4: Continue Learning Activity check
  // "If there is no previous activity, hide this section. Do not create empty placeholder cards."
  const recentHistoryItem = (learningHistory && learningHistory.length > 0)
    ? learningHistory[0]
    : (history && history.length > 0)
    ? history[0]
    : (recentActivityTitles && recentActivityTitles.length > 0)
    ? { title: recentActivityTitles[0], route: '/child/games/build-word' }
    : null

  const recentItem = (recentHistoryItem && recentHistoryItem.title !== heroTitle)
    ? recentHistoryItem
    : null


  return (
    <div className="max-w-4xl mx-auto pb-8 space-y-6">
      {/* 1. Top Header: Learner Greeting, Language Selector, and Tap for Profile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-[#D7EEF1] shadow-[0_8px_30px_rgba(8,35,58,0.06)]">
        <button
          onClick={() => navigate('/child/profile')}
          className="flex items-center gap-3.5 text-left group"
          title="View My Space & Profile"
        >
          <div className="relative">
            <ProfileAvatar emoji={activeChild.avatar} colorName={activeChild.color} size={56} ring />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#39B87F] border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
              ✓
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-xl text-[#08233A] group-hover:text-[#0899AA] transition-colors">
                {tr('greeting')}, {activeChild.name}! 👋
              </h1>
            </div>
            <p className="text-xs font-semibold text-[#527080] mt-0.5">
              Ready for today's adventure?
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Smooth Background Tone Player Pill */}
          <SmoothTonePill onOpenModal={() => setShowToneModal(true)} />

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-1.5 bg-[#E6F8FA] border border-[#D7EEF1] px-3 py-1.5 rounded-2xl text-xs font-bold text-[#08233A]">
            <span className="text-[#FFC857]">⭐</span>
            <span>{activeChild.stars}</span>
            <span className="text-[#527080] font-normal">Stars</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#E6F8FA] border border-[#D7EEF1] px-3 py-1.5 rounded-2xl text-xs font-bold text-[#08233A]">
            <span>🔥</span>
            <span>{activeChild.streak}</span>
            <span className="text-[#527080] font-normal">Streak</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#E6F8FA] border border-[#D7EEF1] px-3 py-1.5 rounded-2xl text-xs font-bold text-[#08233A]">
            <span>🏆</span>
            <span>Lvl {activeChild.level}</span>
            <span className="text-[#527080] font-normal">Level</span>
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Language"
            className="bg-[#E6F8FA] border border-[#D7EEF1] rounded-2xl px-3 py-1.5 text-xs font-bold text-[#08233A] outline-none hover:border-[#13CFE3] transition-colors cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name || l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Personalized Hero Area: My Learning World (Section 1) */}
      <div
        className={`p-5 sm:p-6 rounded-3xl bg-gradient-to-r ${currentEnv.bg || 'from-[#08233A] via-[#0B5264] to-[#13CFE3]'} text-white border border-white/20 shadow-[0_8px_30px_rgba(8,35,58,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-500`}
        data-testid="personalized-theme-banner"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-3xl shrink-0 shadow-inner">
            {currentEnv.emoji}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm tracking-widest select-none">{currentEnv.emojis}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-[#DDF9FC] px-2.5 py-0.5 rounded-full border border-white/20">
                {currentEnv.name}
              </span>
            </div>
            <h2 className="font-display font-black text-lg sm:text-xl text-white">
              {currentEnv.greeting}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#DDF9FC] mt-0.5">
              {currentEnv.subGreeting}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            onClick={playGreetingAudio}
            className="p-3 rounded-2xl bg-[#13CFE3] text-[#08233A] hover:bg-white active:scale-95 shadow-md shadow-[#13CFE3]/20 transition-all flex items-center gap-2 font-display font-black text-xs cursor-pointer"
            aria-label="Listen to theme welcome"
          >
            <Volume2 className="w-4 h-4 text-[#08233A]" />
            <span>Listen</span>
          </button>
        </div>
      </div>

      {/* 3. Child Search Bar */}
      <button
        onClick={() => setIsSearchOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-[#D7EEF1] shadow-[0_4px_16px_rgba(8,35,58,0.04)] hover:border-[#13CFE3] transition-all text-left group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#DDF9FC] flex items-center justify-center text-[#0899AA]">
            <Search size={16} />
          </div>
          <span className="text-sm font-medium text-[#527080] group-hover:text-[#08233A] transition-colors">
            Search stories, sounds, and games...
          </span>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#DDF9FC] text-[#08233A] border border-[#D7EEF1]">
          Find ✨
        </span>
      </button>

      {isSearchOpen && (
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          childId={activeChild?.id}
        />
      )}

      {/* 4. TODAY'S ADVENTURE — ONE PRIMARY HERO ACTIVITY (Section 2) */}
      {nextBestAction?.best_action ? (
        <NextBestActionCard
          nextBestAction={nextBestAction}
          loading={nextBestActionLoading}
          error={nextBestActionError}
          onRetry={refreshNextBestAction}
          title="Today's Adventure 🌟"
        />
      ) : (
        <>
          {recommendationsError && (
            <Card className="bg-coral-50 border border-coral-200 text-center p-6 rounded-3xl">
              <p className="font-display font-bold text-coral-600 mb-1">Could not load today's activities ⚠️</p>
              <p className="text-xs text-slate-500 mb-4">{recommendationsError}</p>
              <Button size="sm" onClick={refreshRecommendations}>Tap to Retry 🔄</Button>
            </Card>
          )}

          {recommendationsLoading && (
            <Skeleton className="h-52 w-full rounded-3xl" />
          )}

          {!recommendationsLoading && primary && (
            <div
              className="relative rounded-[28px] bg-[linear-gradient(135deg,#08233A_0%,#0B5264_55%,#13CFE3_100%)] text-white p-7 sm:p-9 overflow-hidden shadow-[0_12px_40px_rgba(8,35,58,0.12)] border-b-4 border-[#08233A]"
            >
              <div className="absolute -right-6 -bottom-6 text-9xl opacity-20 select-none pointer-events-none">
                {primary.themedIcon || primary.icon || '🦊'}
              </div>

              <div className="relative z-10 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles size={13} />
                  <span>Today's Adventure</span>
                  <span className="mx-1">·</span>
                  <span className="font-semibold text-[#DDF9FC]">Continue Learning</span>
                </div>

                <h2 className="font-display font-black text-2xl sm:text-4xl text-white mb-2 leading-tight">
                  {heroTitle}
                </h2>

                <p className="text-xs sm:text-sm font-bold text-[#DDF9FC] mb-3">
                  Listen • Look • Find
                </p>

                <div className="mb-4 flex items-start gap-2 bg-black/20 p-3.5 rounded-2xl border border-white/15">
                  <span className="inline-block bg-white/25 text-white text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                    WHY?
                  </span>
                  <span className="text-white/90 text-xs sm:text-sm font-medium leading-relaxed">
                    {heroReason}
                  </span>
                </div>

                {/* Multisensory & Progress Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                  <ChildDotProgress
                    total={4}
                    current={2}
                    label="Adventure Progress"
                    sublabel="2 of 4 milestones"
                    className="text-white"
                  />
                  <ChildAudioGuideBadge
                    text={`Today's adventure is ${heroTitle}. Listen, look, and find the sounds!`}
                    lang={language || 'en'}
                    label="Hear Instructions"
                    className="bg-white/20 text-white border-white/25 hover:bg-white/30"
                  />
                </div>

                <button
                  onClick={() => navigate(heroRoute)}
                  data-testid="hero-activity-btn"
                  className="inline-flex items-center gap-2.5 bg-[#13CFE3] text-[#08233A] hover:bg-white active:scale-95 font-display font-black px-8 py-4 rounded-2xl shadow-lg text-base border-b-4 border-[#0899AA] transition-all cursor-pointer"
                >
                  START ADVENTURE · PLAY <span className="text-lg">▶</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 4.5. DEDICATED GAMING ZONE PORTAL SECTION */}
      <div
        data-testid="child-gaming-zone-banner"
        className="rounded-[28px] bg-[linear-gradient(135deg,#08233A_0%,#0B5264_55%,#13CFE3_100%)] text-white p-6 sm:p-7 shadow-[0_12px_40px_rgba(8,35,58,0.12)] border-2 border-[#13CFE3]/40 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5"
      >
        <div className="absolute -right-6 -bottom-6 text-9xl opacity-15 select-none pointer-events-none">
          🎮
        </div>

        <div className="flex items-center gap-4 sm:gap-5 relative z-10 min-w-0">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl overflow-hidden bg-white/15 backdrop-blur-md border-2 border-white/30 flex items-center justify-center shadow-lg shrink-0">
            <img
              src="/assets/games/space-rocket.jpg"
              alt="Gaming Zone 3D"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FFC857] text-[#08233A] shadow-xs">
                Play &amp; Learn!
              </span>
              <span className="text-xs text-[#DDF9FC] font-bold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                3D &amp; 2D Learning Games 🎮
              </span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white">
              Gaming Zone 🕹️
            </h2>
            <p className="text-xs sm:text-sm text-[#DDF9FC] font-medium mt-0.5">
              10 Interactive 3D Learning Worlds, Safari Run, Sky Archer, Cosmic Miner &amp; more!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/child/games')}
          className="relative z-10 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-[#FFC857] hover:bg-[#FFD16E] active:scale-95 text-[#08233A] font-display font-black text-sm sm:text-base border-b-4 border-[#E0A838] transition-all cursor-pointer shadow-lg shadow-[#FFC857]/30 shrink-0"
        >
          <span>OPEN GAMING ZONE</span>
          <span>▶</span>
        </button>
      </div>

      {/* 5. QUICK LEARNING — 4 CORE FOUNDATIONS (Section 3) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="font-display font-extrabold text-lg text-[#08233A] flex items-center gap-2">
              <span>Quick Learning &amp; Worlds</span>
              <span className="text-xs font-bold text-[#08233A] bg-[#DDF9FC] px-2.5 py-0.5 rounded-full border border-[#D7EEF1]">
                4 Worlds
              </span>
            </h2>
            <p className="text-xs text-[#527080] font-semibold mt-0.5">
              What would you like to do? Touch to enter
            </p>
          </div>
          <span className="text-xs text-[#527080] font-semibold self-start sm:self-center">Touch to enter</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_LEARNING_ITEMS.map((item) => (
            <ChildWorldCard
              key={item.label}
              world={item}
              onClick={() => navigate(item.route)}
            />
          ))}
        </div>
      </div>

      {/* 6. CONTINUE WHERE YOU LEFT OFF (Section 4) */}
      {recentItem && (
        <div className="bg-white p-5 rounded-3xl border border-[#D7EEF1] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#DDF9FC] flex items-center justify-center text-2xl shrink-0">
              {recentItem.icon || '🧩'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0899AA] bg-[#DDF9FC] px-2 py-0.5 rounded-md">
                  Resume
                </span>
                <span className="text-xs text-[#527080] font-semibold">
                  Continue where you left off
                </span>
              </div>
              <h3 className="font-display font-black text-base text-[#08233A] mt-0.5">
                {recentItem.title || 'Word Builder'}
              </h3>
              <p className="text-xs text-[#527080] font-medium">
                Let's finish this adventure together!
              </p>
            </div>
          </div>
          <ChildButton
            variant="cyan"
            size="sm"
            onClick={() => navigate(recentItem.route || '/child/games/build-word')}
            className="w-full sm:w-auto"
          >
            CONTINUE ▶
          </ChildButton>
        </div>
      )}

      {/* 7. MADE FOR YOU ✨ — TAILORED ACTIVITIES (Section 5) */}
      {!recommendationsLoading && recs.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-[#D7EEF1] shadow-[0_8px_30px_rgba(8,35,58,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-display font-black text-[#08233A] text-base sm:text-lg flex items-center gap-1.5">
                <span>Made just for you</span>
                <span className="select-none animate-story-sparkle-1 text-amber-400">✨</span>
              </p>
              <p className="text-xs text-[#527080] font-semibold mt-0.5">Based on your learning adventure</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E6F8FA] text-[#0899AA] border border-[#D7EEF1]">
              🌟 Daily Pick
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5">
            {recs.map((r, i) => {
              const recImg = r.image3d || (
                (r.route?.includes('read') || r.title?.toLowerCase().includes('read')) ? '/assets/games/story-puzzle.jpg' :
                (r.route?.includes('sound') || r.title?.toLowerCase().includes('sound') || r.title?.toLowerCase().includes('safari')) ? '/assets/games/sound-match.jpg' :
                (r.route?.includes('word') || r.title?.toLowerCase().includes('word')) ? '/assets/games/word-builder.jpg' :
                (r.route?.includes('picture') || r.title?.toLowerCase().includes('picture')) ? '/assets/games/picture-match.jpg' :
                (r.route?.includes('detective')) ? '/assets/games/letter-detective.jpg' :
                (r.route?.includes('trace')) ? '/assets/games/letter-trace.jpg' :
                (r.route?.includes('speak')) ? '/assets/games/speak-mic.jpg' :
                '/assets/stories/curious-fox.jpg'
              )
              const motionClass = (r.route?.includes('sound') || r.title?.toLowerCase().includes('sound')) ? 'animate-vfx-sound-pulse' :
                (r.route?.includes('read') || r.title?.toLowerCase().includes('read')) ? 'animate-vfx-book-float' :
                'animate-story-bob'

              return (
                <div
                  key={i}
                  className="group relative overflow-hidden flex items-center gap-3.5 bg-gradient-to-r from-[#F2FBFC] to-white border-2 border-[#D7EEF1] hover:border-[#13CFE3] p-4 rounded-2xl hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_20px_rgba(8,35,58,0.04)] hover:shadow-[0_12px_28px_rgba(19,207,227,0.18)]"
                >
                  {/* Soft ambient aura */}
                  <div className="absolute inset-0 pointer-events-none animate-story-aura opacity-30 bg-radial from-[#13CFE3]/30 via-transparent to-transparent" />

                  {/* 3D Visual Box */}
                  <div className="w-16 h-16 rounded-xl relative overflow-hidden bg-gradient-to-br from-[#E6F8FA] to-[#DDF9FC] flex items-center justify-center shrink-0 shadow-xs border border-[#D7EEF1] group-hover:scale-105 transition-transform">
                    {recImg ? (
                      <img
                        src={recImg}
                        alt={r.themedTitle || r.title}
                        className={`w-full h-full object-cover select-none ${motionClass}`}
                        loading="lazy"
                      />
                    ) : (
                      <span className={`text-2xl select-none ${motionClass}`}>{r.themedIcon || r.icon}</span>
                    )}

                    {/* Sheen beam */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-story-sheen" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-black text-sm text-[#08233A] group-hover:text-[#0899AA] transition-colors truncate">
                      {r.themedTitle || r.title}
                    </p>
                    <p className="text-[11px] text-[#527080] font-semibold truncate mt-0.5 leading-snug">
                      {r.themeContext || r.reason || 'Practice today!'}
                    </p>
                  </div>

                  {/* Play Button */}
                  <button
                    type="button"
                    onClick={() => navigate(r.route)}
                    className="min-h-[40px] px-4 rounded-xl font-display font-extrabold text-xs bg-[#13CFE3] hover:bg-[#0899AA] text-[#08233A] hover:text-white transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#13CFE3]"
                  >
                    PLAY ▶
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 8. MY WORLD — ENVIRONMENT SELECTOR (Section 6) */}
      <div className="bg-white p-5 rounded-3xl border-2 border-[#D7EEF1] shadow-xs">
        <EnvironmentSelector
          currentId={currentEnvId}
          onSelect={handleSelectEnvironment}
        />
      </div>

      {/* 9. SENSORY SANCTUARY QUICK TOGGLES */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 bg-gradient-to-r from-[#F0FDF4] via-[#F2FBFC] to-[#ECFDF5] rounded-3xl border-2 border-[#D7EEF1] shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white border border-[#A7F3D0] shadow-2xs flex items-center justify-center text-2xl shrink-0">
            <span className="select-none animate-story-bob">🌿</span>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-display font-black text-[#08233A] flex items-center gap-1.5">
              <span>Sensory Comfort</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                Calm &amp; Cozy
              </span>
            </p>
            <p className="text-[11px] text-[#527080] font-semibold mt-0.5">
              Gentle learning, quiet audio &amp; focus controls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const nextMusic = audioAtmosphereService.toggleMusic(currentEnvId)
              setIsMusicPlaying(nextMusic)
            }}
            className={`min-h-[42px] px-4 py-2 rounded-2xl text-xs font-display font-extrabold transition-all border-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#13CFE3] shadow-xs active:scale-95 flex items-center gap-1.5 ${
              isMusicPlaying && !isQuiet
                ? 'bg-[#13CFE3] text-[#08233A] border-[#0899AA] shadow-sm shadow-[#13CFE3]/25'
                : 'bg-white text-[#527080] border-[#D7EEF1] hover:bg-[#F2FBFC] hover:border-[#13CFE3]'
            }`}
          >
            {isMusicPlaying && !isQuiet ? (
              <>
                <span className="flex items-center gap-0.5 h-3">
                  <span className="w-1 h-3 bg-[#08233A] rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-2 bg-[#08233A] rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-3 bg-[#08233A] rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
                <span>🎵 {audioAtmosphereService?.getActiveToneConfig?.()?.name || 'Smooth Tones'}: ON</span>
              </>
            ) : (
              <span>🎵 Music: OFF</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowToneModal(true)}
            className="min-h-[42px] px-3.5 py-2 rounded-2xl text-xs font-display font-extrabold bg-white text-[#0899AA] border-2 border-[#D7EEF1] hover:border-[#13CFE3] hover:bg-[#F2FBFC] transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[#13CFE3]"
            title="Choose smooth relaxing music tones & volume"
          >
            <span>☁️ Smooth Tones</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !isQuiet
              setIsQuiet(next)
              audioAtmosphereService.setQuietMode(next)
              if (next) setIsMusicPlaying(false)
            }}
            className={`min-h-[42px] px-4 py-2 rounded-2xl text-xs font-display font-extrabold transition-all border-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#FFC857] shadow-xs active:scale-95 ${
              isQuiet
                ? 'bg-[#FFC857] text-[#08233A] border-[#E0A838] shadow-sm shadow-[#FFC857]/25'
                : 'bg-white text-[#527080] border-[#D7EEF1] hover:bg-[#F2FBFC] hover:border-[#FFC857]'
            }`}
          >
            {isQuiet ? '🤫 Quiet Mode: ON' : '🤫 Quiet Mode'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/child/settings')}
            className="min-h-[42px] px-4 py-2 rounded-2xl text-xs font-display font-extrabold bg-white text-[#08233A] border-2 border-[#D7EEF1] hover:border-[#13CFE3] hover:bg-[#F2FBFC] transition-all cursor-pointer shadow-xs active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[#13CFE3]"
          >
            ⚙️ My Comfort
          </button>
        </div>
      </div>

      <SmoothToneModal isOpen={showToneModal} onClose={() => setShowToneModal(false)} />

      {/* 10. Step 16: Weekly Learning Journey & Target Goals Preview */}
      <LearningJourneyPlan
        goals={learningGoals}
        weeklyPlan={weeklyPlan}
        loading={learningGoalsLoading || weeklyPlanLoading}
        error={learningGoalsError || weeklyPlanError}
        onRetry={() => {
          refreshLearningGoals()
          refreshWeeklyPlan()
        }}
        title="This Week's Learning Journey 🗺️"
        compact={true}
      />
    </div>
  )
}

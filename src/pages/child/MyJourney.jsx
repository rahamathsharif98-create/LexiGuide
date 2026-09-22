import { useState, useEffect, useCallback } from 'react'
import { AppLink as Link } from '../../components/nav/AppLink'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Card, ProgressBar, ProgressRing, Button, Skeleton } from '../../components/ui'
import { FingerprintRadar, FingerprintTrend } from '../../components/FingerprintChart'
import { SKILL_KEYS, SKILL_LABELS, SKILL_COLORS, getFriendlySkills } from '../../data/demoData'
import { generateRecommendations } from '../../services/adaptiveEngine'
import { endpoints } from '../../services/api'
import { Trophy, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { LearningJourneyPlan } from '../../components/LearningJourneyPlan'

export default function MyJourney() {
  const {
    activeChild,
    history,
    errorPatterns,
    isRealBackend,
    nextRecommendedActivity,
    progressData,
    reassessmentInsight,
    refreshProgress,
    learningGoals,
    weeklyPlan,
    refreshLearningGoals,
    refreshWeeklyPlan,
  } = useApp()
  const navigate = useNavigate()
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(isRealBackend)
  const [error, setError] = useState(null)
  const [backendFingerprint, setBackendFingerprint] = useState(null)
  const [backendHistory, setBackendHistory] = useState(null)
  const [dayByDayData, setDayByDayData] = useState(null)

  const loadRealData = useCallback(async () => {
    if (!isRealBackend) return
    setLoading(true)
    setError(null)
    try {
      const [payload, dailyPayload] = await Promise.all([
        endpoints.fingerprint(activeChild.id),
        endpoints.dayByDayAnalysis(activeChild.id, { period: 7 }).catch(() => null),
        refreshProgress ? refreshProgress() : Promise.resolve(),
      ])
      if (payload?.current) {
        setBackendFingerprint({
          phonologicalAwareness: payload.current.phonological_awareness,
          pronunciation: payload.current.pronunciation,
          wordRecognition: payload.current.word_recognition,
          readingFluency: payload.current.reading_fluency,
          comprehension: payload.current.comprehension,
        })
      }
      if (payload?.history && payload.history.length > 0) {
        setBackendHistory(payload.history.map((h) => ({
          date: h.recorded_at ? new Date(h.recorded_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : 'Session',
          phonologicalAwareness: h.phonological_awareness,
          pronunciation: h.pronunciation,
          wordRecognition: h.word_recognition,
          readingFluency: h.reading_fluency,
          comprehension: h.comprehension,
        })))
      }
      if (dailyPayload) {
        setDayByDayData(dailyPayload)
      }
      setLoading(false)
    } catch (err) {
      setLoading(false)
      if (err?.status === 503 || err?.message?.includes('static host')) {
        setError(null)
      } else {
        setError(err?.message || 'Could not load Reading Fingerprint')
      }
    }
  }, [isRealBackend, activeChild.id, refreshProgress])

  useEffect(() => {
    if (isRealBackend) {
      loadRealData()
    } else {
      setLoading(false)
      setError(null)
    }
  }, [isRealBackend, loadRealData])

  const activeFingerprint = (isRealBackend && backendFingerprint) ? backendFingerprint : activeChild.fingerprint
  const activeHistory = (isRealBackend && backendHistory) ? backendHistory : history

  const friendly = getFriendlySkills(activeFingerprint)
  const strongest = [...friendly].sort((a, b) => b.value - a.value)[0] || friendly[0]
  const weakest = [...friendly].sort((a, b) => a.value - b.value)[0] || friendly[0]
  const nextBest = isRealBackend
    ? nextRecommendedActivity
    : (nextRecommendedActivity || generateRecommendations(activeFingerprint, errorPatterns)[0])

  return (
    <div className="max-w-2xl mx-auto pb-4">
      <h1 className="font-display font-extrabold text-2xl text-slate-800 mb-6 text-center">My Journey ⭐</h1>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <StatPill type="stars" icon="⭐" value={activeChild.stars} label="Stars" />
        <StatPill type="streak" icon="🔥" value={activeChild.streak} label="Streak" />
        <StatPill type="level" icon="🏆" value={activeChild.level} label="Level" />
      </div>

      {loading && (
        <div className="space-y-4 mb-6">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
        </div>
      )}

      {error && (
        <Card className="my-6 bg-coral-50 border border-coral-200 text-center">
          <p className="font-display font-bold text-coral-600 mb-1">Could not load Reading Fingerprint ⚠️</p>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <div className="flex justify-center">
            <Button size="sm" onClick={loadRealData}>Tap to Retry 🔄</Button>
          </div>
        </Card>
      )}

      {!loading && !error && (
        <>
          {/* Real Backend Reassessment Insight Card */}
          {reassessmentInsight && (
            <Card className="mb-6 bg-gradient-to-r from-mint-50 to-sky-50 border border-mint-200">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🌱</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-mint-700">Latest Reassessment</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-mint-100 text-mint-800">
                      {reassessmentInsight.change > 0 ? `+${reassessmentInsight.change}%` : `${reassessmentInsight.change}%`}
                    </span>
                  </div>
                  <p className="font-display font-semibold text-slate-800 text-sm mb-1">
                    {reassessmentInsight.message}
                  </p>
                  <div className="text-xs text-slate-500 flex gap-4 mt-2">
                    <span>Practiced: <strong className="text-slate-700 capitalize">{reassessmentInsight.practiced_skill}</strong></span>
                    <span>Previous: <strong className="text-slate-700">{reassessmentInsight.previous_accuracy}%</strong></span>
                    <span>Current: <strong className="text-slate-700">{reassessmentInsight.current_accuracy}%</strong></span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Backend Progress Honesty Note */}
          {progressData?.note && (
            <div className="mb-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
              ℹ️ {progressData.note}
            </div>
          )}

      {/* Friendly skill bars with 3D Action Avatars & Animated Progress */}
      <Card className="mb-6 border-2 border-[#D7EEF1] hover:border-[#13CFE3] shadow-[0_8px_30px_rgba(8,35,58,0.06)] bg-white rounded-3xl p-6 transition-all">
        <div className="flex items-center justify-between mb-2">
          <p className="font-display font-black text-[#08233A] text-lg sm:text-xl flex items-center gap-2">
            <span>My Reading Journey</span>
            <span className="text-xl select-none animate-story-bob">🗺️</span>
          </p>
          <button
            type="button"
            onClick={() => navigate('/child/achievements')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#FFF9E6] border border-[#FFE8A3] text-xs font-black text-[#B87D00] hover:bg-[#FFF3CD] transition-all cursor-pointer shadow-2xs hover:scale-105"
          >
            <Trophy size={14} />
            <span>Achievements</span>
          </button>
        </div>
        <p className="text-xs text-[#527080] font-semibold mb-5">
          You've explored {activeChild.stars > 0 ? Math.round(activeChild.stars / 10) + 5 : 12} fun adventures!
        </p>

        <div className="flex flex-col gap-3.5">
          {friendly.map((s) => {
            const domainConfigs = {
              sounds: {
                motion: 'animate-vfx-sound-pulse',
                particle: '🎵',
                particleClass: 'animate-vfx-note-1 text-purple-500',
                barGrad: 'from-[#a86bff] to-[#7c3aed]',
                shadow: 'shadow-[0_0_12px_rgba(168,107,255,0.4)]',
              },
              reading: {
                motion: 'animate-vfx-book-float',
                particle: '✨',
                particleClass: 'animate-story-sparkle-1 text-cyan-400',
                barGrad: 'from-[#13CFE3] to-[#0899AA]',
                shadow: 'shadow-[0_0_12px_rgba(19,207,227,0.4)]',
              },
              speaking: {
                motion: 'animate-vfx-mic-shine',
                particle: '🎶',
                particleClass: 'animate-vfx-note-2 text-orange-400',
                barGrad: 'from-[#ff8a4c] to-[#f97316]',
                shadow: 'shadow-[0_0_12px_rgba(255,138,76,0.4)]',
              },
              understanding: {
                motion: 'animate-vfx-crystal',
                particle: '💎',
                particleClass: 'animate-story-sparkle-2 text-emerald-400',
                barGrad: 'from-[#2fd486] to-[#059669]',
                shadow: 'shadow-[0_0_12px_rgba(47,212,134,0.4)]',
              },
            }
            const dCfg = domainConfigs[s.key] || domainConfigs.reading

            return (
              <div
                key={s.key}
                className="p-3.5 rounded-2xl bg-[#F2FBFC] border border-[#D7EEF1] hover:border-[#13CFE3] transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  {/* Animated 3D Skill Avatar Box */}
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#D7EEF1] flex items-center justify-center relative overflow-hidden shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className={`text-xl select-none ${dCfg.motion}`}>{s.emoji}</span>
                    <span className={`absolute top-0.5 right-0.5 text-[10px] pointer-events-none ${dCfg.particleClass}`}>
                      {dCfg.particle}
                    </span>
                  </div>

                  {/* Skill Label & Status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-black text-sm sm:text-base text-[#08233A] group-hover:text-[#0899AA] transition-colors">
                      {s.label}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white text-[#0899AA] border border-[#D7EEF1] shadow-2xs">
                      {s.value >= 75 ? 'Mastering 🌟' : s.value >= 60 ? 'Practicing 📖' : 'Growing 🌱'}
                    </span>
                  </div>

                  {/* Value Percent */}
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-sm font-black text-[#08233A]">{s.value}%</span>
                  </div>
                </div>

                {/* Animated Glowing Progress Bar with Sheen */}
                <div className="w-full bg-white h-3.5 rounded-full overflow-hidden p-0.5 border border-[#D7EEF1] relative">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${dCfg.barGrad} ${dCfg.shadow} transition-all duration-1000 ease-out relative overflow-hidden`}
                    style={{ width: `${Math.max(6, Math.min(100, s.value))}%` }}
                  >
                    {/* Moving gloss sheen beam */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-story-sheen" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Plain-language summary cards with Celebratory Visuals */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#E6F8FA] via-emerald-50/50 to-[#DDF9FC] border-2 border-[#D7EEF1] hover:border-[#13CFE3] text-center p-6 rounded-3xl shadow-[0_8px_30px_rgba(8,35,58,0.06)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute inset-0 pointer-events-none animate-story-aura opacity-40 bg-radial from-emerald-200/50 via-transparent to-transparent" />
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-[#D7EEF1] shadow-xs flex items-center justify-center text-3xl mb-2 group-hover:scale-110 transition-transform">
            <span className="animate-story-bob">{strongest.emoji}</span>
          </div>
          <p className="text-[11px] font-black text-[#0899AA] uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <span>✨</span> Skills you're growing <span>✨</span>
          </p>
          <p className="font-display font-black text-[#08233A] text-base leading-snug">
            {strongest.label} — you're getting better! 🎉
          </p>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#FFF9E6] via-amber-50/50 to-[#FFF3CD] border-2 border-[#FFE8A3] hover:border-amber-400 text-center p-6 rounded-3xl shadow-[0_8px_30px_rgba(8,35,58,0.06)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute inset-0 pointer-events-none animate-story-aura opacity-40 bg-radial from-amber-200/50 via-transparent to-transparent" />
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-[#FFE8A3] shadow-xs flex items-center justify-center text-3xl mb-2 group-hover:scale-110 transition-transform">
            <span className="animate-vfx-trophy">{weakest.emoji}</span>
          </div>
          <p className="text-[11px] font-black text-[#B87D00] uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <span>⭐</span> Skills to practice <span>⭐</span>
          </p>
          <p className="font-display font-black text-[#08233A] text-base leading-snug">
            {weakest.label} 💪 Let's explore together!
          </p>
        </div>
      </div>

      {/* Step 16: Learning Journey Goals & Plan */}
      {isRealBackend && (
        <LearningJourneyPlan
          goals={learningGoals?.goals}
          weeklyPlan={weeklyPlan}
          onRetry={() => {
            refreshLearningGoals?.()
            refreshWeeklyPlan?.()
          }}
          title="My Learning Goals & Weekly Plan"
        />
      )}

      {/* Child Learning Days — Simple, motivating display */}
      {isRealBackend && dayByDayData && dayByDayData.days && dayByDayData.days.length > 0 && (
        <Card className="mb-6 bg-white border border-brand-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <p className="font-display font-bold text-slate-800 text-sm">Recent Learning Days</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
              {dayByDayData.summary?.active_days || 0} Days Active 🌱
            </span>
          </div>

          <div className="space-y-2">
            {dayByDayData.days.slice(0, 3).map((d) => (
              <div key={d.date} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⭐</span>
                  <div>
                    <span className="font-display font-bold text-slate-700 block">{d.date}</span>
                    <span className="text-slate-400">{d.activity_count} {d.activity_count === 1 ? 'activity' : 'activities'} finished</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-brand-600 block">{d.learning_minutes} min</span>
                  <span className="text-slate-400 text-[10px]">practice time</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {nextBest && (
        <Card className="mb-6 bg-gradient-to-br from-brand-50 to-white border border-brand-100 text-center">
          <p className="text-xs font-bold text-brand-500 uppercase mb-2">Next Best Activity</p>
          <p className="font-display font-bold text-slate-800 mb-2">{nextBest.icon || '✨'} {nextBest.title || nextBest.activity}</p>
          {nextBest.reason && (
            <div className="mb-3 max-w-sm mx-auto">
              <span className="inline-block bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full mr-1.5">WHY?</span>
              <span className="text-xs text-slate-600 font-medium">{nextBest.reason}</span>
            </div>
          )}
          <Button onClick={() => navigate(nextBest.route || '/child/read')}>PLAY NOW</Button>
        </Card>
      )}

      {/* Detailed Reading Fingerprint — tucked away, not front and center */}
      <button
        onClick={() => setShowDetails((v) => !v)}
        className="w-full flex items-center justify-center gap-2 text-sm font-display font-semibold text-slate-400 hover:text-slate-600 py-3"
      >
        {showDetails ? 'Hide' : 'See'} My Reading Fingerprint {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showDetails && (
        <div className="animate-pop">
          <Card className="mb-4">
            <FingerprintRadar fingerprint={activeFingerprint} height={260} />
          </Card>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            {SKILL_KEYS.map((k) => (
              <Card key={k} className="text-center">
                <ProgressRing value={activeFingerprint[k]} size={64} color={SKILL_COLORS[k]} />
                <p className="text-[11px] font-display font-bold text-slate-600 mt-2 leading-tight">{SKILL_LABELS[k]}</p>
              </Card>
            ))}
          </div>
          <Card className="mb-4">
            <p className="font-display font-bold text-slate-700 mb-2 text-sm">Progress Over Time</p>
            {activeHistory && activeHistory.length > 0 ? (
              <FingerprintTrend history={activeHistory} height={220} />
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                No reading sessions recorded yet. Practice an activity to see your progress trend!
              </p>
            )}
          </Card>
          <p className="text-xs text-slate-400 text-center px-4">
            This is an educational reading-skill profile to guide practice — not a medical diagnosis.
          </p>
        </div>
      )}
        </>
      )}

      {/* Quiet footer links — not on the primary nav */}
      <div className="flex justify-center gap-6 mt-8">
        <Link to="/child/achievements" className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-600">
          <Trophy size={16} /> Achievements
        </Link>
        <Link to="/child/profile" className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-600">
          <Settings size={16} /> Profile & Settings
        </Link>
      </div>
    </div>
  )
}

function StatPill({ type = 'stars', icon, value, label }) {
  const configs = {
    stars: {
      bg: 'from-amber-50 via-yellow-50/60 to-orange-50/80',
      border: 'border-amber-200 hover:border-amber-400',
      glow: 'rgba(255, 200, 87, 0.28)',
      numColor: 'text-[#08233A]',
      lblColor: 'text-amber-700',
      motionClass: 'animate-vfx-star',
      particle: '✨',
      particleClass: 'animate-story-sparkle-1 text-amber-400',
    },
    streak: {
      bg: 'from-orange-50 via-amber-50/60 to-red-50/80',
      border: 'border-orange-200 hover:border-orange-400',
      glow: 'rgba(255, 120, 0, 0.28)',
      numColor: 'text-[#08233A]',
      lblColor: 'text-orange-700',
      motionClass: 'animate-vfx-thruster',
      particle: '⚡',
      particleClass: 'animate-story-sparkle-2 text-orange-400',
    },
    level: {
      bg: 'from-cyan-50 via-sky-50/60 to-blue-50/80',
      border: 'border-cyan-200 hover:border-cyan-400',
      glow: 'rgba(19, 207, 227, 0.28)',
      numColor: 'text-[#08233A]',
      lblColor: 'text-cyan-800',
      motionClass: 'animate-vfx-trophy',
      particle: '🌟',
      particleClass: 'animate-story-sparkle-3 text-cyan-400',
    },
  }

  const cfg = configs[type] || configs.stars

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b ${cfg.bg} border-2 ${cfg.border} rounded-3xl py-3.5 sm:py-4 px-2 flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1.5 shadow-[0_8px_25px_rgba(8,35,58,0.06)] hover:shadow-[0_14px_32px_${cfg.glow}] group`}
    >
      {/* Soft Ambient Aura */}
      <div className="absolute inset-0 pointer-events-none animate-story-aura opacity-60 bg-radial from-white via-transparent to-transparent" />

      {/* Floating Sparkle Particle */}
      <span className={`absolute top-2 right-2.5 text-xs select-none pointer-events-none ${cfg.particleClass}`}>
        {cfg.particle}
      </span>

      {/* Animated 3D Icon Box */}
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/90 shadow-2xs border border-white flex items-center justify-center mb-1.5 backdrop-blur-xs group-hover:scale-110 transition-transform">
        <span className={`text-2xl select-none filter drop-shadow-sm ${cfg.motionClass}`}>{icon}</span>
      </div>

      <span className={`font-display font-extrabold font-black text-2xl sm:text-3xl ${cfg.numColor} leading-none tracking-tight`}>
        {value}
      </span>
      <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${cfg.lblColor} mt-1`}>
        {label}
      </span>

      {/* Glossy Sheen */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent animate-story-sheen" />
      </div>
    </div>
  )
}


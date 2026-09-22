import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { ParentShell } from './ParentShell'
import { StatCard, Card, ProgressBar, Button, Skeleton } from '../../components/ui'
import { ProfileAvatar } from '../../components/ProfileAvatar'
import { AchievementBadge } from '../../components/AchievementBadge'
import { endpoints } from '../../services/api'
import {
  getChildSummary, getLearningProgress, getRecentActivity, getStrengths,
  getAreasToPractice, getWeeklySummary, getInsights, getAchievements, getStreakCalendar,
} from '../../services/parentService'

const TREND_LABEL = { improving: '📈 Improving', steady: '➡️ Steady', 'needs practice': '💪 Needs more practice' }

const SKILL_ICONS = {
  readingFluency: '⏱️',
  phonologicalAwareness: '🦁',
  pronunciation: '🎤',
  comprehension: '📖',
  wordRecognition: '🧩',
}

export default function ParentDashboard() {
  const { activeChild, childrenState, setActiveChildId, errorPatterns } = useApp()
  const { auth } = useAuth()
  const navigate = useNavigate()

  const isReal = Boolean(auth?.isAuthenticated && auth?.token && !auth.token.includes('test') && !auth.token.includes('demo'))

  const [loading, setLoading] = useState(isReal)
  const [error, setError] = useState(null)
  const [realSummary, setRealSummary] = useState(null)
  const [realProgress, setRealProgress] = useState(null)
  const [realRecent, setRealRecent] = useState([])
  const [realRecommendations, setRealRecommendations] = useState([])
  const [realAchievements, setRealAchievements] = useState([])

  const childId = activeChild?.id

  const loadData = () => {
    if (!isReal || !childId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    Promise.all([
      endpoints.parentChildSummary(childId),
      endpoints.parentChildProgress(childId, '7d').catch(() => null),
      endpoints.parentChildActivities(childId).catch(() => []),
      endpoints.parentChildRecommendations(childId).catch(() => []),
      endpoints.achievements(childId).catch(() => []),
    ])
      .then(([summaryRes, progressRes, activitiesRes, recsRes, achRes]) => {
        setRealSummary(summaryRes)
        setRealProgress(progressRes)
        setRealRecent(Array.isArray(activitiesRes) ? activitiesRes : [])
        setRealRecommendations(Array.isArray(recsRes) ? recsRes : [])
        setRealAchievements(Array.isArray(achRes) ? achRes : [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.message || 'Could not load dashboard data')
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [isReal, childId])

  // Demo fallbacks
  const demoSummary = getChildSummary(activeChild)
  const demoProgress = getLearningProgress(activeChild)
  const demoRecent = getRecentActivity(activeChild)
  const demoStrengths = getStrengths(activeChild)
  const demoToPractice = getAreasToPractice(activeChild, errorPatterns)
  const demoWeekly = getWeeklySummary(activeChild)
  const demoInsights = getInsights(activeChild)
  const demoAchievements = getAchievements(activeChild)
  const streakCalendar = getStreakCalendar(activeChild)

  // Derived metrics from real data with fallback
  const summary = isReal && realSummary
    ? {
        stars: realSummary.total_stars ?? 0,
        streak: realSummary.streak ?? 0,
        activitiesCompleted: realSummary.activities_completed ?? 0,
        learningTimeMin: realSummary.learning_time_min ?? 0,
      }
    : demoSummary

  const progress = isReal && realProgress
    ? (realProgress.skills || []).map((s) => ({
        key: s.key,
        label: s.label,
        emoji: SKILL_ICONS[s.key] || '📚',
        value: s.value,
        trend: s.trend,
        color: '#12aeef',
      }))
    : demoProgress

  const recent = isReal
    ? realRecent.slice(0, 5).map((s) => {
        const title = (s.outcome || {}).get?.('title') || s.activity_name || (s.outcome || {}).title || s.skill || 'Learning Session'
        const acc = (s.outcome || {}).accuracy ?? ((s.outcome || {}).metrics?.accuracy ?? 80)
        return {
          id: s.id,
          label: title,
          icon: SKILL_ICONS[s.skill] || '📖',
          date: s.completed_at ? new Date(s.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently',
          accuracy: Number(acc),
          stars: s.stars ?? Math.max(1, Math.round(Number(acc) / 20)),
        }
      })
    : demoRecent

  const achievements = isReal ? realAchievements : demoAchievements

  const strengths = isReal
    ? [...(progress || [])].sort((a, b) => b.value - a.value).slice(0, 2).map((s) => `✨ Strong performance in ${s.label.toLowerCase()}`)
    : demoStrengths

  const toPractice = isReal
    ? (realRecommendations.length > 0
        ? realRecommendations.slice(0, 3).map((r) => ({
            title: r.activity_name || r.title || 'Practice Activity',
            reason: r.reason || 'Recommended based on recent learning sessions.',
          }))
        : [...(progress || [])].sort((a, b) => a.value - b.value).slice(0, 1).map((s) => ({
            title: s.label,
            reason: `A little more practice with ${s.label.toLowerCase()} will help build confidence.`,
          })))
    : demoToPractice

  return (
    <ParentShell title="Good morning, Parent 👋" subtitle="Here's how your child's learning is going.">
      {/* My Children selector */}
      {childrenState && childrenState.length > 1 && (
        <Card className="mb-6">
          <p className="font-display font-bold text-slate-700 mb-3">My Children</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {childrenState.map((c) => {
              const isSelected = String(c.id) === String(activeChild?.id)
              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isSelected ? 'bg-brand-50/60 border-brand-300' : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ProfileAvatar emoji={c.avatar || '👤'} name={c.name} size={42} colorName={c.color || 'brand'} />
                    <div>
                      <p className="font-display font-bold text-sm text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400">Age {c.age} · Level {c.level}</p>
                    </div>
                  </div>
                  {isSelected ? (
                    <span className="text-xs font-bold text-brand-600 bg-brand-100 px-2.5 py-1 rounded-full">Viewing</span>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setActiveChildId(c.id)}>
                      View
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {error && (
        <Card className="mb-6 bg-coral-50 border border-coral-200 text-center">
          <p className="font-display font-bold text-coral-700 mb-1">Could not load dashboard data ⚠️</p>
          <p className="text-xs text-slate-500 mb-3">{error}</p>
          <Button size="sm" onClick={loadData}>Retry 🔄</Button>
        </Card>
      )}

      {!error && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon="⭐" label="Total Stars" value={summary.stars} colorName="sun" />
            <StatCard icon="🔥" label="Learning Streak" value={`${summary.streak} days`} colorName="peach" />
            <StatCard icon="📚" label="Activities Completed" value={summary.activitiesCompleted} colorName="brand" />
            <StatCard icon="⏱️" label="Learning Time" value={`${summary.learningTimeMin} min`} colorName="mint" />
          </div>

          {isReal && summary.activitiesCompleted === 0 && (
            <Card className="mb-6 bg-brand-50/50 border border-brand-100 text-center py-8">
              <span className="text-4xl mb-2 block">🌱</span>
              <p className="font-display font-bold text-slate-800 text-base mb-1">No learning sessions yet</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Once {activeChild?.name || 'your child'} completes activities in the Child portal, real performance metrics, streaks, and progress trends will appear here automatically.
              </p>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-5 mb-6">
            {/* Learning Progress */}
            <Card className="lg:col-span-2">
              <p className="font-display font-bold text-slate-700 mb-4">Learning Progress</p>
              {progress.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No progress data recorded yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {progress.map((s) => (
                    <div key={s.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-600">{s.emoji} {s.label}</span>
                        <span className="text-xs font-semibold text-slate-400">{TREND_LABEL[s.trend] || s.trend}</span>
                      </div>
                      <ProgressBar value={s.value} colorHex={s.color} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Streak card */}
            <Card>
              <p className="font-display font-bold text-slate-700 mb-1">🔥 {summary.streak} Day Streak</p>
              <p className="text-xs text-slate-400 mb-4">
                {summary.streak > 0
                  ? `${activeChild?.name || 'Child'} has practiced ${summary.streak} day${summary.streak === 1 ? '' : 's'} in a row!`
                  : `${activeChild?.name || 'Child'} hasn't practiced yet today. A quick session will start the streak!`}
              </p>
              {!isReal && streakCalendar.length > 0 && (
                <div className="flex justify-between">
                  {streakCalendar.map((d, i) => (
                    <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${d.practiced ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {d.label}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-6">
            {/* Recent activity */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="font-display font-bold text-slate-700">Recent Activity</p>
                <button onClick={() => navigate('/parent/activities')} className="text-sm font-semibold text-brand-600">See all →</button>
              </div>
              {recent.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No recent activity recorded yet.</p>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100">
                  {recent.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 py-3">
                      <span className="text-xl">{s.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700">{s.label}</p>
                        <p className="text-xs text-slate-400">{s.date}</p>
                      </div>
                      <span className="text-sm">{'⭐'.repeat(Math.max(1, Math.min(5, s.stars || 1)))}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Strengths & Practice */}
            <div className="flex flex-col gap-5">
              <Card className="bg-mint-50 border border-mint-100">
                <p className="font-display font-bold text-mint-700 mb-2">Strengths ✨</p>
                {strengths.length === 0 ? (
                  <p className="text-xs text-slate-500">Strengths will appear as sessions are completed.</p>
                ) : (
                  strengths.map((s, i) => <p key={i} className="text-sm text-slate-700 font-semibold mb-1">{s}</p>)
                )}
              </Card>

              <Card className="bg-sun-50 border border-sun-100">
                <p className="font-display font-bold text-sun-700 mb-2">Skills to Practice 💪</p>
                {toPractice.length === 0 ? (
                  <p className="text-xs text-slate-500">No urgent practice areas detected.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {toPractice.map((a, i) => (
                      <div key={i}>
                        <p className="text-sm font-bold text-slate-800">{a.title}</p>
                        <p className="text-xs text-slate-500 mb-1">{a.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Achievements */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-bold text-slate-700">🏆 Achievements</p>
            </div>
            {achievements.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No achievements unlocked yet.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {achievements.map((a) => <AchievementBadge key={a.id || a.key} {...a} />)}
              </div>
            )}
          </Card>

          <p className="text-xs text-slate-400 mt-5 text-center">
            This is an educational screening tool for early reading progress — it does not provide a clinical diagnosis.
          </p>
        </>
      )}
    </ParentShell>
  )
}

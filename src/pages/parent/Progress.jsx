import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth, isRealBackendAuth } from '../../context/AuthContext'
import { ParentShell } from './ParentShell'
import { Card, Skeleton, Button } from '../../components/ui'
import { FingerprintTrend } from '../../components/FingerprintChart'
import { DayByDayTimeline } from '../../components/DayByDayTimeline'
import { getLearningProgress } from '../../services/parentService'
import { endpoints } from '../../services/api'
import { NextBestActionCard } from '../../components/NextBestActionCard'
import { LearningJourneyPlan } from '../../components/LearningJourneyPlan'

const RANGES = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
]

export default function ParentProgress() {
  const { activeChild, history, intelligenceData, refreshIntelligence } = useApp()
  const { auth } = useAuth()
  const [range, setRange] = useState('7d')

  const isReal = isRealBackendAuth(auth)
  const childId = activeChild?.id

  const [loading, setLoading] = useState(isReal)
  const [error, setError] = useState(null)
  const [progressData, setProgressData] = useState(null)
  const [nextBestAction, setNextBestAction] = useState(null)
  const [nbaLoading, setNbaLoading] = useState(isReal)
  const [nbaError, setNbaError] = useState(null)
  const [learningGoals, setLearningGoals] = useState(null)
  const [weeklyPlan, setWeeklyPlan] = useState(null)
  const [planLoading, setPlanLoading] = useState(isReal)

  const fetchProgress = () => {
    if (!isReal || !childId) {
      setLoading(false)
      setNbaLoading(false)
      setPlanLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    setNbaLoading(true)
    setNbaError(null)
    setPlanLoading(true)

    endpoints.parentChildProgress(childId, range)
      .then((res) => {
        setProgressData(res)
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.message || 'Could not load progress data')
        setLoading(false)
      })

    if (typeof endpoints.nextBestAction === 'function') {
      endpoints.nextBestAction(childId)
        .then((res) => {
          setNextBestAction(res)
          setNbaLoading(false)
        })
        .catch((err) => {
          setNbaError(err?.message || 'Could not load recommendation')
          setNbaLoading(false)
        })
    } else {
      setNbaLoading(false)
    }

    if (typeof endpoints.learningGoals === 'function' && typeof endpoints.learningPlan === 'function') {
      Promise.all([
        endpoints.learningGoals(childId).catch(() => null),
        endpoints.learningPlan(childId).catch(() => null),
      ]).then(([goalsRes, planRes]) => {
        setLearningGoals(goalsRes)
        setWeeklyPlan(planRes)
        setPlanLoading(false)
      }).catch(() => {
        setPlanLoading(false)
      })
    } else {
      setPlanLoading(false)
    }
  }

  useEffect(() => {
    fetchProgress()
  }, [isReal, childId, range])

  // Demo fallback only when not authenticated
  const demoProgress = !isReal ? getLearningProgress(activeChild) : null

  const progress = isReal
    ? (progressData?.skills || []).map((s) => ({
        key: s.key,
        label: s.label,
        value: s.value,
        trend: s.trend,
        color: '#12aeef',
      }))
    : demoProgress

  const sampleSize = isReal ? (progressData?.sample_size ?? 0) : history.length

  return (
    <ParentShell title="Progress" subtitle={`Is ${activeChild?.name || 'your child'} improving? Here's the trend.`}>
      <div className="flex gap-2 mb-6">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`px-4 py-2 rounded-2xl text-sm font-display font-semibold transition-colors ${range === r.key ? 'bg-brand-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && (
        <Card className="mb-6 bg-coral-50 border border-coral-200 text-center">
          <p className="font-display font-bold text-coral-700 mb-1">Could not load progress ⚠️</p>
          <p className="text-xs text-slate-500 mb-3">{error}</p>
          <Button size="sm" onClick={fetchProgress}>Retry 🔄</Button>
        </Card>
      )}

      {loading ? (
        <Skeleton className="h-64 rounded-2xl mb-6" />
      ) : (
        <>
          <Card className="mb-6">
            <p className="font-display font-bold text-slate-700 mb-1">Reading Progress Over Time</p>
            {progressData?.note && sampleSize > 0 && (
              <p className="text-xs text-brand-600 mb-3">{progressData.note}</p>
            )}

            {sampleSize === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <span className="text-3xl block mb-2">📊</span>
                <p className="font-display font-semibold text-slate-600 text-sm">
                  {progressData?.note || 'No activity recorded during this period.'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Try selecting a different time range or complete a new reading activity.</p>
              </div>
            ) : (
              <FingerprintTrend
                history={history}
                skills={['readingFluency', 'pronunciation', 'phonologicalAwareness', 'comprehension']}
                height={280}
              />
            )}
          </Card>

          {/* Day-by-Day Learning Analysis Timeline */}
          {childId && (
            <DayByDayTimeline
              childId={childId}
              isReal={isReal}
              title="Day-by-Day Learning Timeline"
              subtitle={`Track ${activeChild?.name || 'your child'}'s daily activity, time, and progress.`}
            />
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {progress.length === 0 ? (
              <Card className="sm:col-span-2 text-center py-8 text-slate-400">
                No skill metrics available for this period.
              </Card>
            ) : (
              progress.map((s) => (
                <Card key={s.key} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-brand-50 text-brand-600">
                    📖
                  </div>
                  <div>
                    <p className="font-display font-bold text-slate-800 text-sm">{s.label}</p>
                    <p className="text-xs text-slate-400">
                      {s.trend === 'improving' ? '📈 Improving over this period' : s.trend === 'steady' ? '➡️ Holding steady' : '💪 Could use more practice'}
                    </p>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Step 16: Learning Goals & Weekly Learning Plan */}
          {isReal && (
            <div className="mt-6">
              <LearningJourneyPlan
                goals={learningGoals?.goals}
                weeklyPlan={weeklyPlan}
                loading={planLoading}
                onRetry={fetchProgress}
                title="Learning Goals & Weekly Plan"
              />
            </div>
          )}

          {isReal && (
            <NextBestActionCard
              nextBestAction={nextBestAction}
              loading={nbaLoading}
              error={nbaError}
              onRetry={fetchProgress}
              title="Suggested Next Practice"
              className="mt-6"
            />
          )}

          {intelligenceData && (
            <Card className="mt-6 border border-brand-100 bg-gradient-to-br from-white to-mint-50/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧠</span>
                  <p className="font-display font-bold text-slate-800 text-base">AI Learning Intelligence</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-mint-100 text-mint-700">
                  {intelligenceData.fluency?.reading_pace || 'Developing Pace'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-white/80 p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400">Average WCPM</p>
                  <p className="text-lg font-display font-bold text-slate-800">{intelligenceData.fluency?.average_wcpm || 0}</p>
                  <p className="text-[10px] text-slate-400">Words / Minute</p>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400">Stability</p>
                  <p className="text-lg font-display font-bold text-slate-800">{intelligenceData.fluency?.fluency_stability || 'Consistent'}</p>
                  <p className="text-[10px] text-slate-400">Pace Stability</p>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400">Primary Error</p>
                  <p className="text-lg font-display font-bold text-slate-800 capitalize">{intelligenceData.error_distribution?.primary_error_type || 'None'}</p>
                  <p className="text-[10px] text-slate-400">{intelligenceData.error_distribution?.total_errors || 0} Total Patterns</p>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400">Data Level</p>
                  <p className="text-lg font-display font-bold text-slate-800 capitalize">{intelligenceData.data_sufficiency?.replace('_', ' ') || 'Developing'}</p>
                  <p className="text-[10px] text-slate-400">{intelligenceData.total_reading_sessions || 0} Sessions</p>
                </div>
              </div>

              {intelligenceData.guidance?.summary && (
                <div className="bg-white/80 rounded-xl p-3 mb-3 text-xs text-slate-600 border border-slate-100">
                  <p className="font-semibold text-slate-700 mb-1">Pedagogical Summary:</p>
                  <p>{intelligenceData.guidance.summary}</p>
                </div>
              )}

              {intelligenceData.guidance?.educator_tips?.length > 0 && (
                <div className="bg-brand-50/50 rounded-xl p-3 text-xs text-brand-800">
                  <p className="font-semibold mb-1">💡 Learning Support Tips:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {intelligenceData.guidance.educator_tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-[11px] text-slate-400 italic mt-3 text-center">
                {intelligenceData.disclaimer}
              </p>
            </Card>
          )}
        </>
      )}
    </ParentShell>
  )
}

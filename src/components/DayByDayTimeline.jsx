import { useState, useEffect } from 'react'
import { Card, Button, Skeleton } from './ui'
import { endpoints } from '../services/api'
import { Calendar, Clock, Award, TrendingUp, ChevronRight, AlertCircle, Sparkles } from 'lucide-react'

const PERIOD_OPTIONS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
]

const SKILL_EMOJIS = {
  phonological_awareness: '🔤',
  reading_fluency: '📖',
  pronunciation: '🗣️',
  comprehension: '🧠',
  word_recognition: '🧩',
}

export function DayByDayTimeline({
  childId,
  isReal = true,
  title = 'Day-by-Day Learning Analysis',
  subtitle = 'Track real session performance, trends, and consistency day-by-day.',
  onRefresh = null,
}) {
  const [period, setPeriod] = useState(7)
  const [loading, setLoading] = useState(isReal && Boolean(childId))
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const fetchData = async () => {
    if (!isReal || !childId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await endpoints.dayByDayAnalysis(childId, { period })
      if (res && res.summary && Array.isArray(res.days)) {
        setData(res)
      } else {
        setData(null)
      }
      setLoading(false)
    } catch (err) {
      setError(err?.message || 'Could not load day-by-day learning analysis')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [childId, period, isReal])

  // Format date helper: "Today", "Yesterday", or "Oct 14, 2026"
  const formatDateLabel = (isoDate) => {
    try {
      const d = new Date(isoDate + 'T00:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const target = new Date(d)
      target.setHours(0, 0, 0, 0)
      const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })
    } catch {
      return isoDate
    }
  }

  return (
    <Card className="mb-6 border border-brand-100 bg-white" data-testid="day-by-day-container">
      {/* Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" />
            <h2 className="font-display font-bold text-slate-800 text-base">{title}</h2>
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* 7d / 30d / 90d Filter */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 self-start sm:self-auto" role="group" aria-label="Select date period">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                period === opt.value
                  ? 'bg-white text-brand-700 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              aria-pressed={period === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 py-2" data-testid="day-by-day-loading">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      )}

      {/* Error View */}
      {error && !loading && (
        <div className="py-6 px-4 bg-coral-50 rounded-2xl border border-coral-200 text-center" data-testid="day-by-day-error">
          <AlertCircle className="w-8 h-8 text-coral-500 mx-auto mb-2" />
          <p className="font-display font-bold text-coral-800 text-sm mb-1">Unable to load daily analysis</p>
          <p className="text-xs text-coral-600 mb-3">{error}</p>
          <Button size="sm" variant="secondary" onClick={fetchData}>Retry 🔄</Button>
        </div>
      )}

      {/* Content View */}
      {!loading && !error && data && data.summary && (
        <>
          {/* Top Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5" data-testid="day-by-day-summary">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Days</p>
              <p className="text-xl font-display font-extrabold text-slate-800 mt-0.5">
                {data.summary.active_days ?? 0}
                <span className="text-xs font-normal text-slate-400 ml-1">/ {period}d</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{data.summary.weekly_consistency ?? 0}% consistency</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Streak</p>
              <p className="text-xl font-display font-extrabold text-brand-600 mt-0.5">
                🔥 {data.summary.current_streak ?? 0}
                <span className="text-xs font-normal text-slate-400 ml-1">days</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Best: {data.summary.longest_streak ?? 0} days</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Activities</p>
              <p className="text-xl font-display font-extrabold text-slate-800 mt-0.5">
                📚 {data.summary.total_activities ?? 0}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">~{data.summary.average_activities_per_active_day ?? 0}/active day</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Focus Skill</p>
              <p className="text-sm font-display font-bold text-sun-700 mt-1 capitalize truncate">
                🎯 {data.summary.focus_skill ? data.summary.focus_skill.replace(/_/g, ' ') : 'Balanced'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {data.summary.strongest_skill ? `Strong: ${data.summary.strongest_skill.replace(/_/g, ' ')}` : 'Practice in progress'}
              </p>
            </div>
          </div>

          {/* Educational / Sufficiency Note */}
          {data.summary.note && (
            <div className="mb-4 px-3 py-2.5 bg-brand-50/50 border border-brand-100 rounded-xl flex items-center gap-2 text-xs text-brand-800">
              <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
              <span>{data.summary.note}</span>
            </div>
          )}

          {/* Daily Timeline */}
          {(data.days || []).length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200" data-testid="day-by-day-empty">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-display font-bold text-slate-700 text-sm">No learning activity recorded yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Complete reading, sound, or spelling activities in the Child portal to start building a day-by-day learning timeline.
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="day-by-day-list">
              {(data.days || []).map((day) => (
                <div
                  key={day.date}
                  className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-brand-200 hover:shadow-sm transition-all"
                  data-testid={`day-item-${day.date}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-slate-800 text-sm">
                        {formatDateLabel(day.date)}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">({day.date})</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-medium">
                        📚 {day.activity_count} {day.activity_count === 1 ? 'activity' : 'activities'}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        ⏱️ {day.learning_minutes} min
                      </span>
                    </div>
                  </div>

                  {/* Skills Practiced Badges & Performance */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {day.changes.map((sk) => (
                      <div
                        key={sk.skill}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                          sk.trend === 'improving'
                            ? 'bg-mint-50 text-mint-800 border border-mint-200'
                            : sk.trend === 'needs_practice'
                            ? 'bg-peach-50 text-peach-800 border border-peach-200'
                            : 'bg-slate-50 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span>{SKILL_EMOJIS[sk.skill] || '⭐'}</span>
                        <span>{`${sk.label}:`}</span>
                        <span className="font-bold">{sk.accuracy ? `${Math.round(sk.accuracy)}%` : 'Completed'}</span>
                        {sk.change !== null && sk.change !== undefined && (
                          <span className={`text-[10px] font-bold ${sk.change > 0 ? 'text-mint-600' : sk.change < 0 ? 'text-coral-500' : 'text-slate-400'}`}>
                            ({sk.change > 0 ? `+${sk.change}%` : `${sk.change}%`})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Patterns & Notes for this day */}
                  {day.patterns.length > 0 && (
                    <div className="pt-2 border-t border-slate-50 space-y-1">
                      {day.patterns.map((p, idx) => (
                        <p key={idx} className="text-xs text-slate-500 flex items-start gap-1.5">
                          <span className="text-brand-500 mt-0.5">•</span>
                          <span>{p}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Educational Disclaimer */}
          <p className="text-[10px] text-slate-400 text-center italic mt-4">
            {data.disclaimer}
          </p>
        </>
      )}
    </Card>
  )
}

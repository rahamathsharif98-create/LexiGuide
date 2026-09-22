import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, ProgressBar, Skeleton } from './ui'
import { Calendar, Target, CheckCircle2, Circle, Clock, Flame, Play, Sparkles } from 'lucide-react'

export function LearningJourneyPlan({
  goals = [],
  weeklyPlan = null,
  loading = false,
  error = null,
  onRetry = null,
  compact = false,
  showGoals = true,
  showWeeklyPlan = true,
  title = "Weekly Learning Plan & Goals",
}) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mb-6 bg-coral-50 border border-coral-200 text-center py-5">
        <p className="font-display font-bold text-coral-700 text-sm mb-1">
          Could not load learning journey plan ⚠️
        </p>
        <p className="text-xs text-slate-500 mb-3">{error}</p>
        {onRetry && (
          <Button size="sm" onClick={onRetry}>
            Tap to Retry 🔄
          </Button>
        )}
      </Card>
    )
  }

  const days = weeklyPlan?.days || []
  const planGoals = goals && goals.length > 0 ? goals : (weeklyPlan?.goals || [])
  const completionRate = weeklyPlan?.completion_rate ?? 0
  const completedCount = weeklyPlan?.total_completed ?? 0
  const plannedCount = weeklyPlan?.total_planned ?? 7

  const planTypeStyles = {
    "New Learning": "bg-brand-100 text-brand-700",
    "Reinforcement": "bg-mint-100 text-mint-700",
    "Review": "bg-sun-100 text-sun-700",
    "Spaced Practice": "bg-peach-100 text-peach-700",
    "Challenge": "bg-berry-100 text-berry-700",
    "Easier Practice": "bg-sky-100 text-sky-700",
    "Exploration": "bg-indigo-100 text-indigo-700",
  }

  return (
    <Card className="mb-6 border border-brand-100 bg-gradient-to-br from-white via-white to-brand-50/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗺️</span>
          <div>
            <h3 className="font-display font-bold text-base text-slate-800">{title}</h3>
            <p className="text-xs text-slate-400">
              {weeklyPlan?.week_start && weeklyPlan?.week_end
                ? `Week of ${weeklyPlan.week_start} to ${weeklyPlan.week_end}`
                : "Personalized roadmap based on your Reading Fingerprint"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
            {completedCount} of {plannedCount} completed ({completionRate}%)
          </span>
        </div>
      </div>

      {/* Personalized Learning Goals Section */}
      {showGoals && planGoals.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Target size={15} className="text-brand-600" />
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
              Target Learning Goals
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {planGoals.slice(0, 3).map((g) => (
              <div
                key={g.goal_id || g.skill}
                className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {g.skill_name || g.skill}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        g.status === "achieved"
                          ? "bg-mint-100 text-mint-700"
                          : g.status === "needs_attention"
                          ? "bg-coral-100 text-coral-700"
                          : "bg-brand-100 text-brand-700"
                      }`}
                    >
                      {g.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="font-display font-bold text-xs text-slate-800 mb-1">{g.title}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{g.description}</p>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                    <span>Current: {g.current_score}%</span>
                    <span>Target: {g.target_score}%</span>
                  </div>
                  <ProgressBar value={g.progress_percentage || Math.min(100, Math.round((g.current_score / g.target_score) * 100))} height="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adaptive Weekly Plan Calendar Row */}
      {showWeeklyPlan && days.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Calendar size={15} className="text-brand-600" />
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
              7-Day Learning Schedule
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {days.map((day) => {
              const isCompleted = day.status === "completed"
              const isToday = day.is_today
              const isMissed = day.status === "missed"

              return (
                <div
                  key={day.date}
                  className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between text-center ${
                    isToday
                      ? "bg-brand-50/80 border-brand-300 ring-2 ring-brand-400/20 shadow-sm"
                      : isCompleted
                      ? "bg-mint-50/60 border-mint-200 text-slate-700"
                      : isMissed
                      ? "bg-slate-50 border-slate-200 opacity-75"
                      : "bg-white border-slate-100 text-slate-600"
                  }`}
                >
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                      {day.day_name.slice(0, 3)}
                    </p>
                    <p className="text-[10px] text-slate-400 mb-1.5">{day.date.slice(5)}</p>

                    <div className="flex justify-center mb-1.5">
                      {isCompleted ? (
                        <CheckCircle2 size={18} className="text-mint-600" />
                      ) : isToday ? (
                        <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold">
                          ▶
                        </span>
                      ) : isMissed ? (
                        <Circle size={16} className="text-slate-300" />
                      ) : (
                        <Clock size={16} className="text-brand-400" />
                      )}
                    </div>

                    <p className="font-display font-bold text-xs text-slate-800 line-clamp-1 mb-0.5">
                      {day.activity?.title || (isMissed ? "Rest Day" : "Practice")}
                    </p>
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1.5 ${
                        planTypeStyles[day.plan_type] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {day.plan_type}
                    </span>
                  </div>

                  {isToday && day.activity?.route && (
                    <Button
                      size="sm"
                      className="w-full text-[11px] py-1 mt-1"
                      onClick={() => navigate(day.activity.route)}
                    >
                      Play
                    </Button>
                  )}
                  {isCompleted && (
                    <span className="text-[10px] font-bold text-mint-700">
                      ✓ {day.accuracy_achieved ? `${Math.round(day.accuracy_achieved)}%` : "Done"}
                    </span>
                  )}
                  {!isToday && !isCompleted && !isMissed && day.activity?.difficulty_label && (
                    <span className="text-[10px] text-slate-400">
                      Level {day.activity?.difficulty || 1}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Educational disclaimer */}
      <p className="text-[11px] text-slate-400 mt-4 text-center">
        These goals and weekly recommendations are adaptive educational suggestions to build confidence — not a clinical diagnosis.
      </p>
    </Card>
  )
}

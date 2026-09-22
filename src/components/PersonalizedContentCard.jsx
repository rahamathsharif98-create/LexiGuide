import React from 'react'
import { Card, Button } from './ui'
import { Sparkles, ArrowRight, BookOpen, Volume2, Gamepad2, Compass, Award, ShieldAlert } from 'lucide-react'

const MODE_LABELS = {
  NEW_LEARNING: { label: 'New Concept 🌱', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REINFORCEMENT: { label: 'Reinforcement 💪', bg: 'bg-brand-50 text-brand-700 border-brand-200' },
  REVIEW: { label: 'Review 🔄', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  SPACED_REVIEW: { label: 'Spaced Practice 🧠', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  CHALLENGE: { label: 'Challenge ⭐', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  EASIER_PRACTICE: { label: 'Confidence Boost 🎈', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  EXPLORATION: { label: 'Fun Quest 🚀', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
}

export function PersonalizedContentCard({
  item,
  onPlay,
  featured = false,
  showWhy = true,
  className = '',
}) {
  if (!item) return null

  const content = item.content || item
  const why = item.reason || item.why || content.description || 'Specially selected for your learning progress'
  const modeKey = item.action_type || item.learning_mode || 'PRACTICE'
  const modeInfo = MODE_LABELS[modeKey] || {
    label: modeKey.replace('_', ' ') || 'Practice ✨',
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
  }

  const diffVal = content.difficulty ?? content.difficulty_level
  const difficultyLevel = typeof diffVal === 'number'
    ? `Level ${diffVal}`
    : (diffVal || content.difficulty_label || 'Just Right')

  const minutesVal = content.estimated_minutes ?? content.estimated_duration_minutes
  const scoreVal = item.fit_score ?? item.score

  if (featured) {
    return (
      <Card
        data-testid="personalized-featured-card"
        className={`relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white p-6 rounded-3xl shadow-xl border-0 ${className}`}
      >
        <div className="absolute -right-6 -bottom-6 text-9xl opacity-15 select-none pointer-events-none">
          {content.icon || '🌟'}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm border border-white/20">
            {modeInfo.label}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-brand-100">
            {difficultyLevel}
          </span>
          {minutesVal && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/20 text-white">
              ⏱️ {minutesVal} min
            </span>
          )}
        </div>

        <h3 className="font-display font-extrabold text-2xl mb-2 text-white drop-shadow-sm">
          {content.title}
        </h3>

        {content.description && (
          <p className="text-brand-100 text-sm mb-4 line-clamp-2 max-w-lg">
            {content.description}
          </p>
        )}

        {showWhy && why && (
          <div className="mb-5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 max-w-xl">
            <div className="flex items-start gap-2">
              <Sparkles size={16} className="text-amber-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200">Why this was chosen for you</p>
                <p className="text-xs text-white/90 font-medium mt-0.5">{why}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            className="!bg-white !text-brand-700 hover:!bg-brand-50 font-bold px-6 py-3 rounded-2xl shadow-md transition-transform hover:scale-[1.02]"
            onClick={() => onPlay && onPlay(content.route || '/child/read')}
          >
            Play Now ▶
          </Button>
          {scoreVal != null && (
            <span className="text-xs text-brand-200 font-medium">
              Match Score: {Math.round(scoreVal)}
            </span>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card
      hover
      data-testid="personalized-content-card"
      className={`p-4 flex items-center gap-4 border border-slate-100 rounded-2xl transition-all ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-3xl shrink-0">
        {content.icon || '📖'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${modeInfo.bg}`}>
            {modeInfo.label}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            {difficultyLevel}
          </span>
          {minutesVal && (
            <span className="text-[10px] text-slate-400">
              · {minutesVal} min
            </span>
          )}
        </div>

        <h4 className="font-display font-bold text-slate-800 text-sm truncate">
          {content.title}
        </h4>

        {showWhy && why && (
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
            <span className="text-brand-600 font-semibold">Why: </span>{why}
          </p>
        )}
      </div>

      <Button
        size="sm"
        className="shrink-0"
        onClick={() => onPlay && onPlay(content.route || '/child/read')}
      >
        Play
      </Button>
    </Card>
  )
}

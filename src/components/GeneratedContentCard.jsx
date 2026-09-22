import React from 'react'
import { Card, Button } from './ui'
import { Sparkles, Clock, Target, ShieldCheck } from 'lucide-react'

export function GeneratedContentCard({ item, onPlay, className = '' }) {
  if (!item) return null

  const title = item.title || 'Learning Quest'
  const icon = item.icon || '✨'
  const diffLabel = item.difficulty_label || (typeof item.difficulty === 'number' ? `Level ${item.difficulty}` : 'Just Right')
  const duration = item.estimated_minutes ? `${item.estimated_minutes} min` : '5 min'
  const objective = item.learning_objective || item.description || 'Focus on foundational literacy skills.'
  const sourceType = item.source_type || 'assembled'
  const isCurated = sourceType === 'curated'
  const route = item.route || '/child/read'

  return (
    <Card className={`p-4 bg-white border border-brand-100 shadow-sm rounded-2xl hover:border-brand-300 transition-all ${className}`}>
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-2xl shrink-0">
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isCurated
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
              data-testid="content-source-badge"
            >
              {isCurated ? 'Curated Activity 📚' : 'Assembled Quest ⚡'}
            </span>

            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {diffLabel}
            </span>

            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 flex items-center gap-1">
              <Clock size={10} /> {duration}
            </span>
          </div>

          <h4 className="font-display font-bold text-slate-800 text-base leading-tight">
            {title}
          </h4>

          <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
            <Target size={12} className="text-brand-500 shrink-0 mt-0.5" />
            <span>{objective}</span>
          </p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <ShieldCheck size={12} className="text-brand-500" />
              <span>Age-appropriate practice</span>
            </span>

            <Button
              size="sm"
              onClick={() => onPlay && onPlay(route)}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow-sm"
              data-testid="play-quest-btn"
            >
              Start Quest ▶
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

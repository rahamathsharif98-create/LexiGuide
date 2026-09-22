import { AppLink as Link } from './nav/AppLink'
import { Card, colorFor, Button } from './ui'

export function ActivityCard({ icon, title, subtitle, progress, route, colorName = 'brand' }) {
  const c = colorFor(colorName)
  return (
    <Link to={route} className="block shrink-0 w-44">
      <Card hover className="h-full">
        <div className={`w-14 h-14 rounded-2xl ${c.bgSoft} flex items-center justify-center text-3xl mb-3`}>{icon}</div>
        <p className="font-display font-bold text-sm text-slate-800 leading-tight">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        {typeof progress === 'number' && (
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className={`h-2 ${c.bg} rounded-full`} style={{ width: `${progress}%` }} />
          </div>
        )}
      </Card>
    </Link>
  )
}

export function RecommendationCard({ icon, title, reason, difficulty, time, route }) {
  return (
    <Link to={route} className="block shrink-0 w-64">
      <Card hover className="h-full bg-gradient-to-br from-brand-50 to-white border border-brand-100">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-2xl">{icon}</div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600 bg-brand-100 px-2 py-1 rounded-full">{difficulty}</span>
        </div>
        <p className="font-display font-bold text-sm text-slate-800 mt-3">{title}</p>
        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{reason}</p>
        <p className="text-[11px] text-brand-600 font-semibold mt-2">⏱ {time}</p>
      </Card>
    </Link>
  )
}

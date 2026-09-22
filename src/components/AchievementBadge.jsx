export function AchievementBadge({ icon, title, desc, earned }) {
  return (
    <div className={`rounded-2xl p-4 text-center border-2 transition-all ${earned ? 'bg-white border-sun-300 shadow-card' : 'bg-slate-50 border-slate-100 opacity-60 grayscale'}`}>
      <div className="text-4xl mb-2">{icon}</div>
      <p className="font-display font-bold text-sm text-slate-700 leading-tight">{title}</p>
      <p className="text-[11px] text-slate-400 mt-1">{desc}</p>
      {!earned && <p className="text-[10px] text-slate-300 font-semibold mt-2">🔒 Locked</p>}
    </div>
  )
}

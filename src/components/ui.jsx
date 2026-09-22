import { useEffect } from 'react'

const colorMap = {
  brand: { bg: 'bg-brand-500', bgSoft: 'bg-brand-100', text: 'text-brand-700', ring: 'ring-brand-300' },
  berry: { bg: 'bg-berry-500', bgSoft: 'bg-berry-100', text: 'text-berry-500', ring: 'ring-berry-300' },
  mint: { bg: 'bg-mint-500', bgSoft: 'bg-mint-100', text: 'text-mint-500', ring: 'ring-mint-300' },
  peach: { bg: 'bg-peach-500', bgSoft: 'bg-peach-100', text: 'text-peach-500', ring: 'ring-peach-300' },
  sun: { bg: 'bg-sun-500', bgSoft: 'bg-sun-100', text: 'text-sun-500', ring: 'ring-sun-300' },
}
export function colorFor(name) { return colorMap[name] || colorMap.brand }

export function Button({ children, variant = 'primary', size = 'md', className = '', icon, ...props }) {
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-base', lg: 'px-8 py-4 text-lg' }
  const variants = {
    primary: 'bg-[#13CFE3] text-[#08233A] font-extrabold shadow-[0_8px_30px_rgba(8,35,58,0.08)] hover:bg-[#0899AA] hover:text-white active:scale-[0.98]',
    secondary: 'bg-white text-[#08233A] border-2 border-[#D7EEF1] hover:border-[#13CFE3]',
    ghost: 'bg-transparent text-[#527080] hover:bg-[#DDF9FC] hover:text-[#08233A]',
    success: 'bg-[#39B87F] text-white shadow-[0_8px_30px_rgba(8,35,58,0.08)] hover:brightness-95',
    soft: 'bg-[#DDF9FC] text-[#08233A] font-bold hover:bg-[#b8f3fa]',
  }
  return (
    <button
      className={`font-display font-semibold rounded-2xl transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}{children}
    </button>
  )
}

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-white rounded-3xl shadow-[0_8px_30px_rgba(8,35,58,0.08)] border border-[#D7EEF1] p-5 ${hover ? 'transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(8,35,58,0.10)] cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function ProgressBar({ value, colorClass = 'bg-brand-500', colorHex, track = 'bg-slate-100', height = 'h-3', label }) {
  return (
    <div>
      {label && <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1"><span>{label}</span><span>{value}%</span></div>}
      <div className={`w-full ${track} ${height} rounded-full overflow-hidden`}>
        <div
          className={`${colorHex ? '' : colorClass} ${height} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: colorHex }}
        />
      </div>
    </div>
  )
}

export function ProgressRing({ value, size = 96, stroke = 10, color = '#12aeef', trackColor = '#eef4f8', label, sublabel }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display font-bold text-slate-800" style={{ fontSize: size * 0.22 }}>{label ?? `${value}%`}</span>
        {sublabel && <span className="text-[10px] text-slate-400 font-semibold">{sublabel}</span>}
      </div>
    </div>
  )
}

export function StatCard({ icon, label, value, colorName = 'brand' }) {
  const c = colorFor(colorName)
  return (
    <Card className="flex items-center gap-3 bg-white border border-[#D7EEF1] shadow-[0_8px_30px_rgba(8,35,58,0.06)]">
      <div className={`w-11 h-11 rounded-2xl ${c.bgSoft} flex items-center justify-center text-xl shrink-0`}>{icon}</div>
      <div>
        <p className="text-2xl font-display font-extrabold text-[#08233A] leading-none">{value}</p>
        <p className="text-xs text-[#527080] font-semibold mt-1">{label}</p>
      </div>
    </Card>
  )
}

export function Modal({ open, onClose, children, className = '' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08233A]/40 backdrop-blur-sm animate-pop" onClick={onClose}>
      <div className={`bg-white rounded-3xl shadow-[0_16px_50px_rgba(8,35,58,0.16)] border border-[#D7EEF1] max-w-lg w-full p-6 animate-pop ${className}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function Toast({ toast }) {
  if (!toast) return null
  const toneClass = toast.tone === 'success' ? 'bg-[#39B87F]' : toast.tone === 'error' ? 'bg-[#D95C5C]' : 'bg-[#13CFE3] text-[#08233A]'
  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-pop">
      <div className={`${toneClass} text-white font-display font-bold px-6 py-3 rounded-2xl shadow-2xl`}>
        {toast.message}
      </div>
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-shimmer rounded-2xl ${className}`} />
}

export function EmptyState({ icon = '🌱', title, subtitle, action }) {
  return (
    <div className="text-center py-14 px-4">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="font-display font-extrabold text-lg text-[#08233A]">{title}</h3>
      {subtitle && <p className="text-[#527080] text-sm mt-1 max-w-xs mx-auto">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', subtitle = 'Please try again in a moment.', onRetry }) {
  return (
    <div className="text-center py-14 px-4">
      <div className="text-5xl mb-3">😕</div>
      <h3 className="font-display font-extrabold text-lg text-[#08233A]">{title}</h3>
      <p className="text-[#527080] text-sm mt-1">{subtitle}</p>
      {onRetry && <Button variant="soft" className="mt-4" onClick={onRetry}>Try Again</Button>}
    </div>
  )
}

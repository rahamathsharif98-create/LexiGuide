import React from 'react'
import { ArrowRight } from 'lucide-react'
import audioAtmosphereService from '../../services/audioAtmosphereService'

/**
 * ChildWorldCard
 * Peaceful, pastel destination card for exploring learning domains.
 * Built with high legibility, gentle pastel surfaces, and a tactile button action.
 */
export function ChildWorldCard({
  world,
  onClick,
  className = '',
}) {
  const {
    label,
    sublabel,
    badge,
    emoji,
    bg = 'bg-[#EBF7FD]',
    border = 'border-[#BAE6FD]',
    text = 'text-[#0369A1]',
    iconBg = 'bg-[#BAE6FD]/60',
    shadow = 'shadow-sky-500/10',
    Icon,
  } = world

  const handleClick = (e) => {
    try {
      audioAtmosphereService?.playChime?.(520, 0.08)
    } catch {
      // audio service unavailable
    }
    onClick?.(e)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group text-left block w-full transition-all active:translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/40 rounded-3xl ${className}`}
    >
      <div
        className={`relative rounded-3xl ${bg} border-2 ${border} p-5 sm:p-6 h-full flex flex-col justify-between shadow-sm hover:shadow-md ${shadow} hover:-translate-y-1 transition-all overflow-hidden`}
      >
        {/* Subtle Watermark Emoji */}
        <div className="absolute -right-2 -top-2 text-6xl opacity-20 select-none pointer-events-none group-hover:scale-110 transition-transform">
          {emoji}
        </div>

        <div>
          {/* World Badge */}
          <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/70 text-[#08233A] border border-[#D7EEF1] mb-3 shadow-xs">
            {badge}
          </span>

          {/* Icon */}
          <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center ${text} mb-3 shadow-inner`}>
            {Icon ? <Icon size={24} /> : <span className="text-2xl">{emoji}</span>}
          </div>

          <h3 className="font-display font-extrabold text-xl text-[#08233A] group-hover:text-[#0899AA] transition-colors">
            {label}
          </h3>
          <p className="text-xs text-[#527080] font-semibold mt-1">
            {sublabel}
          </p>
        </div>

        {/* Action Link Footer */}
        <div className="mt-5 pt-3 border-t border-black/5 flex items-center justify-between text-xs font-extrabold text-[#08233A] group-hover:text-[#0899AA] transition-colors">
          <span>Enter World</span>
          <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform text-[#0899AA]" />
        </div>
      </div>
    </button>
  )
}

export default ChildWorldCard

import React from 'react'
import { ChevronLeft, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import audioAtmosphereService from '../../services/audioAtmosphereService'

/**
 * ActivityHeader (Section 14)
 * Distraction-free top navigation for active games, reading, and speech tasks.
 * Minimizes visual noise, keeping only essential Back action, Title, and status.
 */
export function ActivityHeader({
  title = '',
  mascot = '',
  badge = '',
  onBack,
  fallbackRoute = '/child/home',
  rightContent = null,
  className = '',
}) {
  const navigate = useNavigate()

  const handleBack = () => {
    try {
      audioAtmosphereService?.playChime?.(500, 0.06)
    } catch {}
    if (onBack) {
      onBack()
    } else {
      navigate(fallbackRoute)
    }
  }

  return (
    <header className={`flex items-center justify-between gap-3 mb-5 py-2 select-none ${className}`}>
      {/* Back Button */}
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-[#D7EEF1] text-[#08233A] font-display font-black text-xs hover:bg-[#F2FBFC] active:scale-95 shadow-xs transition-all cursor-pointer min-h-[44px]"
        aria-label="Go Back"
      >
        <ChevronLeft size={18} className="text-[#0899AA]" />
        <span>Back</span>
      </button>

      {/* Center Title & Badge */}
      <div className="text-center min-w-0 flex-1 px-2">
        {badge && (
          <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#DDF9FC] text-[#0899AA] border border-[#D7EEF1] mb-0.5">
            {badge}
          </span>
        )}
        <h1 className="font-display font-black text-lg sm:text-xl text-[#08233A] truncate">
          {mascot && <span className="mr-1.5">{mascot}</span>}
          {title}
        </h1>
      </div>

      {/* Right Content / Mode indicator */}
      <div className="flex items-center gap-2 shrink-0">
        {rightContent}
      </div>
    </header>
  )
}

export default ActivityHeader

import React from 'react'

/**
 * ComfortToggle (Section 26 & Section 36)
 * Child-friendly sensory switch with clear visual and tactile indicators.
 */
export function ComfortToggle({
  icon = '✨',
  label = 'Comfort Option',
  sublabel = '',
  enabled = false,
  onToggle,
  className = '',
}) {
  return (
    <div
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onToggle?.()
        }
      }}
      className={`p-4 rounded-3xl border-2 cursor-pointer select-none transition-all flex items-center justify-between gap-4 outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/40 ${
        enabled
          ? 'bg-[#EBFDF9] border-[#13CFE3] shadow-xs'
          : 'bg-white border-[#D7EEF1] hover:border-[#13CFE3]/60'
      } ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-colors ${
            enabled ? 'bg-[#DDF9FC] text-[#0899AA]' : 'bg-[#F2FBFC] text-[#527080]'
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-display font-black text-sm text-[#08233A] truncate">
            {label}
          </p>
          {sublabel && (
            <p className="text-xs text-[#527080] font-semibold truncate mt-0.5">
              {sublabel}
            </p>
          )}
        </div>
      </div>

      <div
        className={`w-14 h-8 rounded-full p-1 transition-colors shrink-0 flex items-center ${
          enabled ? 'bg-[#13CFE3] justify-end' : 'bg-[#D7EEF1] justify-start'
        }`}
      >
        <div className="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform" />
      </div>
    </div>
  )
}

export default ComfortToggle

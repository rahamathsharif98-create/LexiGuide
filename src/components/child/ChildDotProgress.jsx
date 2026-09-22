import React from 'react'

/**
 * ChildDotProgress
 * Low-anxiety visual progress indicator using rhythmic dots instead of numeric percentages.
 */
export function ChildDotProgress({
  total = 4,
  current = 1,
  label = '',
  sublabel = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const dotSize = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4.5 h-4.5',
  }[size] || 'w-3.5 h-3.5'

  return (
    <div
      className={`inline-flex flex-col gap-1.5 ${className}`}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={label || `Step ${current} of ${total}`}
    >
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => {
          const stepNum = i + 1
          const isCompleted = stepNum < current
          const isCurrent = stepNum === current

          return (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${dotSize} ${
                isCompleted
                  ? 'bg-[#39B87F] ring-2 ring-[#39B87F]/30 scale-100'
                  : isCurrent
                  ? 'bg-[#13CFE3] ring-4 ring-[#13CFE3]/30 scale-110'
                  : 'bg-[#D7EEF1] scale-90'
              }`}
              title={`Step ${stepNum}`}
            />
          )
        })}
      </div>

      {(label || sublabel) && (
        <div className="flex items-center gap-2 text-xs">
          {label && <span className="font-extrabold text-[#08233A]">{label}</span>}
          {sublabel && <span className="font-semibold text-[#527080]">· {sublabel}</span>}
        </div>
      )}
    </div>
  )
}

export default ChildDotProgress

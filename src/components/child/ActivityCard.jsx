import React from 'react'
import { AppLink as Link } from '../nav/AppLink'
import { ChildTactileButton } from './ChildTactileButton'
import { ChildAudioGuideBadge } from './ChildAudioGuideBadge'
import { ChildDotProgress } from './ChildDotProgress'

/**
 * ActivityCard (Section 12 & Section 36)
 * Child-friendly composition:
 * - Illustration at top
 * - Large title
 * - One short sentence
 * - Audio icon / guide badge
 * - Tactile START button
 */
export function ActivityCard({
  icon = '🦊',
  title = 'Adventure',
  description = 'Listen, look, and explore!',
  route = '/child/learn',
  progress = null,
  audioText = '',
  audioLang = 'en',
  badge = '',
  onClick,
  className = '',
}) {
  const CardContent = (
    <div
      className={`group relative bg-white rounded-3xl p-5 border-2 border-[#D7EEF1] hover:border-[#13CFE3] shadow-[0_6px_20px_rgba(8,35,58,0.04)] hover:shadow-[0_12px_32px_rgba(19,207,227,0.12)] transition-all duration-200 flex flex-col justify-between text-left ${className}`}
    >
      {badge && (
        <div className="absolute top-4 right-4 z-10">
          <span className="text-[10px] font-black uppercase tracking-wider bg-[#DDF9FC] text-[#0899AA] border border-[#BCEBF2] px-2.5 py-0.5 rounded-full">
            {badge}
          </span>
        </div>
      )}

      {/* Top illustration */}
      <div className="w-16 h-16 rounded-2xl bg-[#F2FBFC] border-2 border-[#E1F7FA] group-hover:scale-105 group-hover:bg-[#DDF9FC] flex items-center justify-center text-3xl mb-4 transition-transform shadow-inner">
        {icon}
      </div>

      {/* Title and Short Description */}
      <div className="mb-4">
        <h3 className="font-display font-black text-lg text-[#08233A] group-hover:text-[#0899AA] transition-colors leading-snug">
          {title}
        </h3>
        <p className="text-xs text-[#527080] font-semibold mt-1 line-clamp-2">
          {description}
        </p>
      </div>

      {/* Optional Dot Progress */}
      {progress && typeof progress.current === 'number' && (
        <div className="mb-4 pt-3 border-t border-[#F2FBFC]">
          <ChildDotProgress
            current={progress.current}
            total={progress.total || 4}
            size="sm"
          />
        </div>
      )}

      {/* Footer: Audio Guide + START button */}
      <div className="flex items-center justify-between gap-2 pt-2">
        {audioText ? (
          <ChildAudioGuideBadge
            text={audioText}
            lang={audioLang}
            size="sm"
          />
        ) : (
          <div />
        )}

        <ChildTactileButton
          size="sm"
          variant="cyan"
          onClick={(e) => {
            if (onClick) {
              e.preventDefault()
              onClick()
            }
          }}
        >
          START ▶
        </ChildTactileButton>
      </div>
    </div>
  )

  if (route && !onClick) {
    return (
      <Link to={route} className="block no-underline">
        {CardContent}
      </Link>
    )
  }

  return CardContent
}

export default ActivityCard

import React, { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { speakLanguageAudio } from '../../services/multilingualVoiceService'

/**
 * ChildAudioGuideBadge
 * Accessible button to hear instructions read aloud in the child's selected language.
 */
export function ChildAudioGuideBadge({
  text = '',
  lang = 'en',
  label = 'Hear Instruction',
  onClick,
  className = '',
  size = 'md', // 'sm' | 'md'
}) {
  const [isPlaying, setIsPlaying] = useState(false)

  const handleSpeak = (e) => {
    e.stopPropagation()
    if (onClick) {
      onClick(e)
      return
    }
    if (!text) return

    setIsPlaying(true)
    speakLanguageAudio({
      text,
      lang,
      rate: 0.88,
      pitch: 1.05,
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    })
  }

  const sizeClasses = size === 'sm'
    ? 'px-3 py-1.5 text-xs min-h-[36px]'
    : 'px-4 py-2.5 text-xs sm:text-sm min-h-[44px]'

  return (
    <button
      type="button"
      onClick={handleSpeak}
      aria-label={`${label}: ${text || ''}`}
      className={`inline-flex items-center gap-2 rounded-2xl font-display font-extrabold bg-[#DDF9FC] text-[#08233A] border border-[#BCEBF2] hover:bg-[#C9F4F9] active:scale-95 transition-all cursor-pointer shadow-xs focus-visible:ring-4 focus-visible:ring-[#13CFE3]/40 ${sizeClasses} ${className}`}
    >
      <Volume2 className={`w-4 h-4 text-[#0899AA] ${isPlaying ? 'animate-bounce text-[#13CFE3]' : ''}`} />
      <span>{label}</span>
      {isPlaying && (
        <span className="inline-block w-2 h-2 rounded-full bg-[#39B87F] animate-ping ml-0.5" />
      )}
    </button>
  )
}

export default ChildAudioGuideBadge

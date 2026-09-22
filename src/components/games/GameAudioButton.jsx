import React, { useState } from 'react'
import { Volume2, Loader2, RotateCcw } from 'lucide-react'
import { speakLanguageAudio } from '../../services/multilingualVoiceService'
import audioAtmosphereService from '../../services/audioAtmosphereService'

/**
 * GameAudioButton
 * One-tap child-friendly audio prompt button with instant audio chime
 * and SpeechSynthesis utterance.
 */
export function GameAudioButton({
  text = '',
  lang = 'en',
  label = 'Listen',
  size = 'md',
  className = '',
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)

  const handlePlay = (e) => {
    e?.stopPropagation?.()
    if (!text) return

    try {
      audioAtmosphereService?.playChime?.(587.33, 0.12)
    } catch {}

    setIsPlaying(true)
    speakLanguageAudio({
      text,
      lang,
      rate: 0.86,
      pitch: 1.05,
      onStart: () => setIsPlaying(true),
      onEnd: () => {
        setIsPlaying(false)
        setHasPlayed(true)
      },
      onError: () => {
        setIsPlaying(false)
        setHasPlayed(true)
      },
    })
  }

  const sizeClasses = {
    sm: 'min-h-[40px] px-3 py-1.5 text-xs rounded-xl',
    md: 'min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl',
    lg: 'min-h-[54px] px-6 py-3 text-sm sm:text-base rounded-2xl',
  }[size] || 'min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl'

  return (
    <button
      type="button"
      onClick={handlePlay}
      aria-label={`${label}: ${text}`}
      className={`inline-flex items-center justify-center gap-2 font-display font-black border-2 border-b-4 transition-all cursor-pointer select-none active:border-b-2 active:translate-y-0.5 outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/40 ${sizeClasses} ${
        isPlaying
          ? 'bg-[#13CFE3] text-[#08233A] border-[#0899AA] shadow-md shadow-[#13CFE3]/20 animate-pulse'
          : hasPlayed
          ? 'bg-[#EBF9F2] text-[#08233A] border-[#39B87F] hover:bg-[#D5F3E4]'
          : 'bg-[#DDF9FC] text-[#08233A] border-[#A8E6EE] hover:bg-[#CBF3F9] shadow-xs'
      } ${className}`}
    >
      {isPlaying ? (
        <span className="flex items-center gap-0.5">
          <span className="w-1 h-3 bg-[#08233A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-4 bg-[#08233A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-2.5 bg-[#08233A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      ) : hasPlayed ? (
        <RotateCcw size={16} className="text-[#39B87F]" />
      ) : (
        <Volume2 size={16} className="text-[#0899AA]" />
      )}
      <span>{isPlaying ? 'Playing...' : hasPlayed ? 'Listen Again 🔁' : `🔊 ${label}`}</span>
    </button>
  )
}

export default GameAudioButton

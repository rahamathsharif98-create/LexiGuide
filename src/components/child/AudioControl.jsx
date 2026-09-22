import React, { useState, useEffect } from 'react'
import { Volume2, Pause, Play, RotateCcw, AlertCircle, Loader2 } from 'lucide-react'
import { speakLanguageAudio } from '../../services/multilingualVoiceService'
import audioAtmosphereService from '../../services/audioAtmosphereService'

/**
 * AudioControl (Section 30)
 * Reusable child-friendly audio interaction component with honest states:
 * - idle: 🔊 Listen
 * - playing: ⏸ Pause
 * - paused: ▶ Resume
 * - loading: ⏳ Loading
 * - unavailable: Voice isn't available right now
 * - finished: ↻ Replay
 */
export function AudioControl({
  text = '',
  lang = 'en',
  audioSrc = null,
  rate = 0.88,
  pitch = 1.05,
  label = 'Listen',
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'cyan', // 'cyan' | 'calm' | 'gold'
  className = '',
  onPlayStart,
  onPlayEnd,
}) {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'playing' | 'paused' | 'unavailable' | 'error' | 'finished'
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false)

  // Verify voice synthesis or audio support
  useEffect(() => {
    if (typeof window === 'undefined') {
      setStatus('unavailable')
      return
    }
    if (!audioSrc && !('speechSynthesis' in window)) {
      setStatus('unavailable')
    }
  }, [audioSrc])

  const stopAudio = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    try {
      audioAtmosphereService?.restoreMusic?.()
    } catch {}
  }

  const handlePlay = () => {
    if (status === 'playing') {
      stopAudio()
      setStatus('paused')
      return
    }

    if (!text && !audioSrc) {
      setStatus('error')
      return
    }

    setStatus('loading')
    onPlayStart?.()

    try {
      audioAtmosphereService?.duckMusic?.()
    } catch {}

    speakLanguageAudio({
      text,
      lang,
      rate,
      pitch,
      onStart: () => setStatus('playing'),
      onEnd: () => {
        setStatus('finished')
        setHasPlayedOnce(true)
        onPlayEnd?.()
        try {
          audioAtmosphereService?.restoreMusic?.()
        } catch {}
      },
      onError: (err) => {
        // If canceled by user, don't show technical error
        if (err?.error === 'canceled') {
          setStatus('idle')
        } else {
          setStatus('unavailable')
        }
        try {
          audioAtmosphereService?.restoreMusic?.()
        } catch {}
      },
    })
  }

  const handleReplay = () => {
    handlePlay()
  }

  // Size styling
  const sizeClasses = {
    sm: 'min-h-[44px] px-3.5 py-1.5 text-xs rounded-xl',
    md: 'min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl',
    lg: 'min-h-[56px] px-6 py-3.5 text-sm sm:text-base rounded-2xl',
  }[size] || 'min-h-[48px] px-4 py-2.5 text-xs sm:text-sm rounded-2xl'

  if (status === 'unavailable') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFF2ED] border border-[#FFD9CC] text-[#D95C5C] text-xs font-semibold rounded-2xl ${className}`}
        role="status"
        aria-live="polite"
      >
        <AlertCircle size={14} />
        <span>Voice isn't available right now.</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={status === 'finished' ? handleReplay : handlePlay}
      aria-label={`${status === 'playing' ? 'Pause' : status === 'finished' ? 'Replay' : label}: ${text || ''}`}
      className={`inline-flex items-center justify-center gap-2 font-display font-black border-2 border-b-4 transition-all cursor-pointer select-none active:border-b-2 active:translate-y-0.5 outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/40 ${sizeClasses} ${
        status === 'playing'
          ? 'bg-[#13CFE3] text-[#08233A] border-[#0899AA] shadow-md shadow-[#13CFE3]/20 animate-pulse'
          : status === 'finished'
          ? 'bg-[#EBF9F2] text-[#08233A] border-[#39B87F] hover:bg-[#D5F3E4]'
          : 'bg-[#DDF9FC] text-[#08233A] border-[#A8E6EE] hover:bg-[#CBF3F9] shadow-xs'
      } ${className}`}
    >
      {status === 'loading' && <Loader2 size={18} className="animate-spin text-[#0899AA]" />}
      {status === 'playing' && <Pause size={18} className="text-[#08233A]" />}
      {status === 'paused' && <Play size={18} className="text-[#08233A]" />}
      {status === 'finished' && <RotateCcw size={18} className="text-[#39B87F]" />}
      {(status === 'idle' || status === 'error') && <Volume2 size={18} className="text-[#0899AA]" />}

      <span>
        {status === 'loading'
          ? 'Loading...'
          : status === 'playing'
          ? 'Pause'
          : status === 'paused'
          ? 'Resume'
          : status === 'finished'
          ? 'Replay'
          : label}
      </span>

      {status === 'playing' && (
        <span className="flex items-center gap-0.5 ml-1">
          <span className="w-1 h-3 bg-[#08233A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-4 bg-[#08233A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-2.5 bg-[#08233A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      )}
    </button>
  )
}

/**
 * AudioButton (Section 36)
 */
export const AudioButton = AudioControl

/**
 * ListenButton (Section 36)
 */
export function ListenButton(props) {
  return <AudioControl label="Listen" {...props} />
}

/**
 * ReplayButton (Section 36)
 */
export function ReplayButton(props) {
  return <AudioControl label="Replay" {...props} />
}

export default AudioControl


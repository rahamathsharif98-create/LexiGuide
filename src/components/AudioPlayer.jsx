import { useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { speakLanguageAudio } from '../services/multilingualVoiceService'

/**
 * Production Audio Player with Real Speech Synthesis.
 * Speaks the provided `text` (or fallback `label`) using child-friendly
 * language-aware SpeechSynthesis with atmosphere audio ducking.
 */
export function AudioPlayer({ label = 'Listen', text, lang = 'en', showCaption = false }) {
  const [playing, setPlaying] = useState(false)
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false)

  // Ensure playback cleans up if component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handle = () => {
    if (playing) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      setPlaying(false)
      return
    }

    const textToSpeak = (text || label || '').replace(/[^\w\s\u0C00-\u0C7F\u0900-\u097F.,!?'"-]/gi, ' ').trim()
    if (!textToSpeak) return

    setPlaying(true)
    const success = speakLanguageAudio({
      text: textToSpeak,
      lang: lang || 'en',
      onEnd: () => {
        setPlaying(false)
        setHasPlayedOnce(true)
      },
      onError: () => {
        // Fallback visual mock if speech engine encounters issues or isn't enabled
        setTimeout(() => {
          setPlaying(false)
          setHasPlayedOnce(true)
        }, 1400)
      }
    })

    if (!success) {
      // If speakLanguageAudio immediately failed (e.g. no window.speechSynthesis in mock test env)
      setTimeout(() => {
        setPlaying(false)
        setHasPlayedOnce(true)
      }, 1400)
    }
  }

  const spokenText = text || label || ''

  return (
    <div className="inline-flex flex-col items-center gap-1.5" data-testid="lexi-audio-player">
      <button
        type="button"
        onClick={handle}
        className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-display font-extrabold text-sm transition-all shadow-sm ${
          playing
            ? 'bg-[#13CFE3] text-[#08233A] shadow-[0_4px_20px_rgba(19,207,227,0.35)] scale-105'
            : 'bg-[#DDF9FC] text-[#08233A] hover:bg-[#13CFE3] hover:text-[#08233A] border border-[#D7EEF1]'
        }`}
        aria-label={label}
      >
        {playing ? (
          <>
            {/* Animated soothing soundwave indicators */}
            <span className="flex items-center gap-0.5 h-4">
              <span className="w-1 bg-[#08233A] rounded-full animate-[bounce_0.6s_infinite_100ms] h-3" />
              <span className="w-1 bg-[#08233A] rounded-full animate-[bounce_0.6s_infinite_250ms] h-4" />
              <span className="w-1 bg-[#08233A] rounded-full animate-[bounce_0.6s_infinite_400ms] h-2.5" />
            </span>
            <span>Listening to Voice…</span>
          </>
        ) : (
          <>
            <Volume2 size={18} className="text-[#0899AA]" />
            <span>{hasPlayedOnce ? 'Listen Again 🔁' : label}</span>
          </>
        )}
      </button>

      {/* Visual Caption: Ensures audio has a visual equivalent for cognitive accessibility */}
      {showCaption && spokenText && (
        <p className="text-[11px] font-medium text-[#527080] max-w-xs text-center italic bg-[#E6F8FA] px-2.5 py-0.5 rounded-full border border-[#D7EEF1]">
          💬 "{spokenText}"
        </p>
      )}
    </div>
  )
}


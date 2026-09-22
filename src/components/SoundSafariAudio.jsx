import { useState, useEffect } from 'react'
import { Volume2 } from 'lucide-react'
import { audioAtmosphere } from '../services/audioAtmosphereService'

/**
 * SoundSafariAudio
 * 
 * Provides accessible, child-friendly audio playback for the Sound Safari game.
 * Uses the browser's native SpeechSynthesis API as the local voice engine.
 * Cancels active speech on unmount or question change, handles errors gracefully,
 * triggers audio atmosphere ducking, and provides honest fallback when voices are absent.
 */
export function SoundSafariAudio({ sound, label, language = 'en' }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [nativeVoiceMissing, setNativeVoiceMissing] = useState(false)

  const isSpeechSupported = typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window

  // Clean up any ongoing speech when the target sound/question changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    audioAtmosphere?.restoreMusic?.()
    setIsPlaying(false)
    setHasPlayed(false)
    setHasError(false)

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      audioAtmosphere?.restoreMusic?.()
    }
  }, [sound, label])

  // Stop speech cleanly when the component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      audioAtmosphere?.restoreMusic?.()
    }
  }, [])

  const handleSpeak = () => {
    if (!isSpeechSupported) {
      setHasError(true)
      return
    }

    try {
      // Unpause speech synthesis if paused by browser (common Chromium bug)
      if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
        window.speechSynthesis.resume()
      }

      // Cancel previous speech before starting
      window.speechSynthesis.cancel()
      audioAtmosphere?.duckMusic?.()
      audioAtmosphere?.playChime?.(587.33, 0.15)
      setIsPlaying(true)
      setHasError(false)

      const targetText = sound || label || ''
      const utterance = new window.SpeechSynthesisUtterance(targetText)

      // Guard against V8 garbage collection dropping active utterance
      if (typeof window !== 'undefined') {
        window._activeSpeechUtterance = utterance
      }

      // Child-friendly speech rate (slower for phoneme clarity) and pitch
      utterance.rate = 0.85
      utterance.pitch = 1.0

      // Match voice using multilingual voice engine with Indian English & Indic prioritization
      let targetTag = 'en-IN'
      if (language === 'hi') {
        targetTag = 'hi-IN'
      } else if (language === 'te') {
        targetTag = 'te-IN'
      }
      utterance.lang = targetTag

      if (typeof window.speechSynthesis.getVoices === 'function') {
        const voices = window.speechSynthesis.getVoices() || []
        let matchedVoice = null
        if (language === 'en') {
          matchedVoice = voices.find((v) => (v.lang || '').replace('_', '-').toLowerCase() === 'en-in') ||
            voices.find((v) => {
              const name = (v.name || '').toLowerCase()
              return name.includes('india') || name.includes('heera') || name.includes('ravi') || name.includes('neerja') || name.includes('veena')
            }) ||
            voices.find((v) => (v.lang || '').toLowerCase().startsWith('en'))
        } else {
          matchedVoice = voices.find((v) => (v.lang || '').toLowerCase().startsWith(language.toLowerCase()))
        }

        if (matchedVoice) {
          utterance.voice = matchedVoice
          // Crucial: keep utterance.lang aligned with matched voice lang so Windows SAPI does not fail
          if (matchedVoice.lang) {
            utterance.lang = matchedVoice.lang
          }
          setNativeVoiceMissing(false)
        } else if (language !== 'en') {
          setNativeVoiceMissing(true)
        }
      }

      utterance.onstart = () => {
        setIsPlaying(true)
      }

      utterance.onend = () => {
        audioAtmosphere?.restoreMusic?.()
        setIsPlaying(false)
        setHasPlayed(true)
        if (typeof window !== 'undefined') {
          window._activeSpeechUtterance = null
        }
      }

      utterance.onerror = (e) => {
        audioAtmosphere?.restoreMusic?.()
        // Don't treat cancellation as a hard error
        if (e?.error !== 'canceled' && e?.error !== 'interrupted') {
          setHasError(true)
        }
        setIsPlaying(false)
        setHasPlayed(true)
        if (typeof window !== 'undefined') {
          window._activeSpeechUtterance = null
        }
      }

      window.speechSynthesis.speak(utterance)

      // Ensure synthesizer is unpaused after speak call
      if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
        window.speechSynthesis.resume()
      }
    } catch {
      audioAtmosphere?.restoreMusic?.()
      setHasError(true)
      setIsPlaying(false)
    }
  }


  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleSpeak}
        data-testid="hear-sound-btn"
        aria-label={hasPlayed ? 'Listen Again' : 'Hear the Sound'}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-display font-bold text-sm transition-all shadow-md cursor-pointer border-b-4 active:border-b-0 active:translate-y-1 min-h-[48px] ${
          isPlaying
            ? 'bg-brand-600 border-brand-800 text-white animate-pulse'
            : hasPlayed
              ? 'bg-brand-100 border-brand-300 text-brand-700 hover:bg-brand-200'
              : 'bg-brand-500 border-brand-700 text-white hover:bg-brand-600'
        }`}
      >
        <Volume2 size={18} className={isPlaying ? 'animate-bounce' : ''} />
        <span>{isPlaying ? 'Playing…' : (hasPlayed ? '🔊 Listen Again' : '🔊 Hear the Sound')}</span>
      </button>

      {nativeVoiceMissing && (
        <p
          data-testid="voice-honest-notice"
          className="text-[11px] text-sky-800 bg-sky-50 border border-sky-200 rounded-xl px-3 py-1.5 mt-1 max-w-sm text-center font-medium"
        >
          🎙️ Native voice for this language is unavailable on this device. Practice saying the sound aloud!
        </p>
      )}

      {(!isSpeechSupported || hasError) && (
        <p
          data-testid="sound-unavailable-fallback"
          className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 mt-1 max-w-sm text-center animate-fade-in font-medium"
        >
          Sound is not available right now. You can continue by matching the picture.
        </p>
      )}
    </div>
  )
}

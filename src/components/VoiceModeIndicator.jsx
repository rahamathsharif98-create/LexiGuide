import React, { useEffect, useState } from 'react'
import { Mic, Volume2, AlertCircle } from 'lucide-react'

/**
 * Phase 6: Truthful Voice & Audio Mode Indicator
 * 
 * Displays transparent, honest labels for:
 * - TTS Mode: "Browser Speech (Local)" vs "AI Neural TTS" vs "Unavailable"
 * - STT Mode: "Microphone Active" vs "Offline / Mock" vs "No Mic"
 * 
 * Never fabricates cloud TTS or real acoustic neural scoring when absent.
 */
export default function VoiceModeIndicator({ language = 'en', showDetails = false }) {
  const [ttsState, setTtsState] = useState('checking')
  const [hasMic, setHasMic] = useState(true)

  useEffect(() => {
    // Check browser speech synthesis capability
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setTtsState('browser_local')
    } else {
      setTtsState('unavailable')
    }

    // Check mediaDevices support
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      setHasMic(true)
    } else {
      setHasMic(false)
    }
  }, [])

  const langBadge = language === 'te' ? '🇮🇳 te-IN' : language === 'hi' ? '🇮🇳 hi-IN' : '🇮🇳 en-IN'

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E6F8FA] text-[#08233A] text-xs font-bold border border-[#D7EEF1] shadow-xs"
      data-testid="voice-mode-indicator"
    >
      <div className="flex items-center gap-1.5">
        <Volume2 className="w-3.5 h-3.5 text-[#0899AA]" />
        <span>{ttsState === 'browser_local' ? 'Local Voice' : 'Voice Unavailable'}</span>
        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-white border border-[#D7EEF1] text-[#08233A]">
          {langBadge}
        </span>
      </div>
      <span className="text-[#D7EEF1]">|</span>
      <div className="flex items-center gap-1">
        <Mic className="w-3.5 h-3.5 text-[#39B87F]" />
        <span>{hasMic ? 'Mic Ready' : 'No Mic'}</span>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { Lightbulb, X, Volume2, Sparkles, HelpCircle } from 'lucide-react'
import { speakLanguageAudio } from '../../services/multilingualVoiceService'
import audioAtmosphereService from '../../services/audioAtmosphereService'

/**
 * HelpButton (Section 15)
 * Child-friendly graduated assistance system:
 * - Level 1: Repeat instruction
 * - Level 2: Highlight visual clues
 * - Level 3: Model pronunciation / audio clue
 * - Level 4: Simplify task / eliminate non-targets
 */
export function HelpButton({
  instruction = '',
  visualHint = '',
  modelSound = '',
  onSimplify = null,
  lang = 'en',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [helpLevel, setHelpLevel] = useState(1)

  const handleOpen = () => {
    try {
      audioAtmosphereService?.playChime?.(587, 0.08)
    } catch {}
    setIsOpen(true)
  }

  const handleLevelAction = (level) => {
    setHelpLevel(level)
    if (level === 1 && instruction) {
      speakLanguageAudio({ text: instruction, lang, rate: 0.85 })
    } else if (level === 3 && modelSound) {
      speakLanguageAudio({ text: modelSound, lang, rate: 0.82 })
    } else if (level === 4 && onSimplify) {
      onSimplify()
      setIsOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Need a clue? Tap for Help"
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FFF9E6] text-[#B87D00] border-2 border-b-4 border-[#FFE8A3] hover:bg-[#FFF3CD] active:border-b-2 active:translate-y-0.5 font-display font-black text-xs transition-all shadow-xs cursor-pointer ${className}`}
      >
        <Lightbulb size={16} className="text-[#D49300]" />
        <span>Need a Clue?</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 border border-[#D7EEF1] shadow-[0_16px_50px_rgba(8,35,58,0.2)] text-center">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-[#527080] hover:text-[#08233A] hover:bg-[#F2FBFC] transition-colors"
              aria-label="Close Clue Dialog"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFF9E6] border border-[#FFE8A3] flex items-center justify-center text-3xl mb-3 shadow-inner">
              💡
            </div>

            <h3 className="font-display font-black text-xl text-[#08233A] mb-1">
              Let's get a clue! ✨
            </h3>
            <p className="text-xs text-[#527080] font-semibold mb-5">
              Take your time. You can do it!
            </p>

            <div className="space-y-2.5 text-left">
              {/* Clue 1: Hear it again */}
              <button
                type="button"
                onClick={() => handleLevelAction(1)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F2FBFC] hover:bg-[#DDF9FC] border border-[#D7EEF1] transition-all text-xs font-bold text-[#08233A]"
              >
                <span className="flex items-center gap-2">
                  <Volume2 size={16} className="text-[#0899AA]" />
                  <span>1. Hear the question again</span>
                </span>
                <span className="text-[10px] bg-[#0899AA] text-white px-2 py-0.5 rounded-full">Listen 🔊</span>
              </button>

              {/* Clue 2: Visual reminder */}
              {visualHint && (
                <button
                  type="button"
                  onClick={() => handleLevelAction(2)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F2FBFC] hover:bg-[#DDF9FC] border border-[#D7EEF1] transition-all text-xs font-bold text-[#08233A]"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#FFC857]" />
                    <span>2. See a hint</span>
                  </span>
                  <span className="text-[10px] text-[#527080]">{visualHint}</span>
                </button>
              )}

              {/* Clue 3: Sound model */}
              {modelSound && (
                <button
                  type="button"
                  onClick={() => handleLevelAction(3)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F2FBFC] hover:bg-[#DDF9FC] border border-[#D7EEF1] transition-all text-xs font-bold text-[#08233A]"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle size={16} className="text-[#39B87F]" />
                    <span>3. Hear the sound model</span>
                  </span>
                  <span className="text-[10px] bg-[#39B87F] text-white px-2 py-0.5 rounded-full">Play 🎵</span>
                </button>
              )}

              {/* Clue 4: Simplify choices */}
              {onSimplify && (
                <button
                  type="button"
                  onClick={() => handleLevelAction(4)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#FEF8EC] hover:bg-[#FDE6BE] border border-[#FDE6BE] transition-all text-xs font-bold text-[#08233A]"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#D97706]" />
                    <span>4. Make it a bit simpler</span>
                  </span>
                  <span className="text-[10px] bg-[#D97706] text-white px-2 py-0.5 rounded-full">Simplify ✨</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-5 w-full py-2.5 rounded-2xl bg-[#08233A] text-white font-display font-black text-xs hover:bg-[#0899AA] transition-colors"
            >
              I'm Ready to Try! 👍
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default HelpButton

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { ProfileAvatar } from '../ProfileAvatar'
import { LANGUAGES } from '../../i18n/translations'
import { Users, Volume2, VolumeX, Sparkles } from 'lucide-react'
import { audioAtmosphere } from '../../services/audioAtmosphereService'
import { SmoothTonePill, SmoothToneModal } from '../audio/SmoothTonePlayer'

export function ChildTopBar() {
  const { activeChild, language, setLanguage, showToast } = useApp()
  const navigate = useNavigate()
  const [isQuiet, setIsQuiet] = useState(audioAtmosphere?.quietMode || false)
  const [showToneModal, setShowToneModal] = useState(false)

  if (!activeChild) return null

  const toggleQuiet = () => {
    const next = !isQuiet
    setIsQuiet(next)
    audioAtmosphere?.setQuietMode?.(next)
    if (showToast) {
      showToast(next ? 'Quiet Mode on: Voice instructions only 🤫' : 'Quiet Mode off 🔊', 'info')
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#D7EEF1] px-4 md:px-8 py-3 transition-all shadow-2xs">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Avatar button linking directly to "My Space" */}
        <button
          type="button"
          onClick={() => navigate('/child/profile')}
          className="flex items-center gap-3 text-left group p-1 -ml-1 rounded-2xl hover:bg-[#F2FBFC] transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#13CFE3]"
          title="Open My Space & Profile"
          aria-label="Open My Space & Profile"
        >
          <div className="relative">
            <ProfileAvatar emoji={activeChild.avatar} colorName={activeChild.color} size={42} ring />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#39B87F] border-2 border-white flex items-center justify-center text-[8px] text-white font-black">
              ✓
            </span>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-sm text-[#08233A] group-hover:text-[#0899AA] transition-colors">
                {activeChild.name}
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#DDF9FC] text-[#0899AA] border border-[#D7EEF1]">
                Lvl {activeChild.level}
              </span>
            </div>
            <span className="text-[11px] font-bold text-[#13CFE3] block -mt-0.5 group-hover:underline">
              My Space ✨
            </span>
          </div>
        </button>

        {/* Center/Right: Child Stats (Stars, Streak), Quiet Mode, and Language Switcher */}
        <div className="flex items-center gap-2">
          {/* Smooth Background Tone Player Pill */}
          <SmoothTonePill onOpenModal={() => setShowToneModal(true)} />

          {/* Quiet Mode Quick Toggle */}
          <button
            type="button"
            onClick={toggleQuiet}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
              isQuiet
                ? 'bg-[#FFF9E6] border-[#FFE8A3] text-[#B87D00] shadow-xs'
                : 'bg-white border-[#D7EEF1] text-[#527080] hover:text-[#08233A] hover:bg-[#F2FBFC]'
            }`}
            title={isQuiet ? 'Quiet Mode Active (tap to restore sounds)' : 'Tap for Quiet Mode'}
            aria-label="Toggle quiet mode"
          >
            {isQuiet ? <VolumeX size={14} className="text-[#B87D00]" /> : <Volume2 size={14} className="text-[#527080]" />}
            <span className="hidden lg:inline text-[11px]">{isQuiet ? 'Quiet 🤫' : 'Quiet'}</span>
          </button>

          {/* Stars Pill */}
          <div
            className="flex items-center gap-1.5 bg-[#FFF9E6] border border-[#FFE8A3] px-3 py-1.5 rounded-2xl text-xs font-display font-black text-[#B87D00] shadow-xs cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/child/journey')}
            title="My Stars Vault"
          >
            <span className="text-sm">⭐</span>
            <span>{activeChild.stars}</span>
            <span className="hidden md:inline text-[11px] font-bold text-[#D49300]">Stars</span>
          </div>

          {/* Streak Pill */}
          <div
            className="flex items-center gap-1.5 bg-[#FFF2ED] border border-[#FFD9CC] px-2.5 py-1.5 rounded-2xl text-xs font-display font-black text-[#D95C5C] shadow-xs"
            title={`${activeChild.streak} Day Learning Streak!`}
          >
            <span className="text-sm">🔥</span>
            <span>{activeChild.streak}</span>
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Companion Language"
            className="bg-[#E6F8FA] border border-[#D7EEF1] rounded-2xl px-3 py-1.5 text-xs font-bold text-[#08233A] outline-none hover:border-[#13CFE3] transition-colors cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name || l.label}
              </option>
            ))}
          </select>

          {/* Switch Learner / Profile Selection Button */}
          <button
            type="button"
            onClick={() => navigate('/select-profile')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-[#D7EEF1] text-[#527080] hover:text-[#08233A] hover:bg-[#F2FBFC] text-xs font-bold transition-colors cursor-pointer"
            title="Switch Learner Profile"
          >
            <Users size={14} />
            <span>Switch</span>
          </button>
        </div>
      </div>

      <SmoothToneModal isOpen={showToneModal} onClose={() => setShowToneModal(false)} />
    </header>
  )
}
export default ChildTopBar

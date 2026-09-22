import React, { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { Card } from '../../components/ui'
import { LANGUAGES } from '../../i18n/translations'
import { Volume2, VolumeX, Eye, Sparkles, Moon, Sun, Sliders, Shield } from 'lucide-react'
import { audioAtmosphere, SMOOTH_TONE_STYLES } from '../../services/audioAtmosphereService'

export default function Settings() {
  const { language, setLanguage, activeChild, showToast } = useApp()

  // Comfort local states
  const [fontSize, setFontSize] = useState('large')
  const [fontFamily, setFontFamily] = useState('default')
  const [letterSpacing, setLetterSpacing] = useState('wide')
  const [motionLevel, setMotionLevel] = useState('gentle')
  const [quietMode, setQuietMode] = useState(Boolean(audioAtmosphere?.quietMode))
  const [focusMode, setFocusMode] = useState(false)
  const [voiceSpeed, setVoiceSpeed] = useState(0.85)
  const [isMusicPlaying, setIsMusicPlaying] = useState(Boolean(audioAtmosphere?.isPlayingMusic))
  const [musicVolume, setMusicVolume] = useState(audioAtmosphere?.musicVolume ?? 0.45)
  const [musicStyle, setMusicStyle] = useState(audioAtmosphere?.currentStyle || (activeChild?.environment || 'lullaby'))

  useEffect(() => {
    const unsub = audioAtmosphere?.subscribe?.((state) => {
      setQuietMode(Boolean(state.quietMode))
      setIsMusicPlaying(Boolean(state.isPlayingMusic))
      setMusicVolume(state.musicVolume)
      if (state.currentStyle) setMusicStyle(state.currentStyle)
    })
    return unsub
  }, [])

  const toggleMusic = () => {
    if (quietMode) {
      showToast('Quiet Mode is on. Turn off Quiet Mode to enjoy background music! 🤫', 'info')
      return
    }
    const next = audioAtmosphere.toggleMusic(musicStyle)
    setIsMusicPlaying(next)
    showToast(next ? 'Gentle atmosphere music started 🎵' : 'Music paused', 'info')
  }

  const changeMusicStyle = (style) => {
    setMusicStyle(style)
    if (isMusicPlaying) {
      audioAtmosphere.startAmbientAtmosphere(style)
    }
  }

  const handleMusicVolume = (vol) => {
    setMusicVolume(vol)
    audioAtmosphere.setMusicVolume(vol)
  }

  const toggleQuietMode = () => {
    const next = !quietMode
    setQuietMode(next)
    audioAtmosphere.setQuietMode(next)
    if (next) setIsMusicPlaying(false)
    showToast(next ? 'Quiet Mode on: Voice instructions only 🤫' : 'Quiet Mode off', 'info')
  }

  const toggleFocusMode = () => {
    const next = !focusMode
    setFocusMode(next)
    showToast(next ? 'Focus Mode on: Simplified screen & gentle pace 🎯' : 'Focus Mode off', 'info')
  }

  const playVoiceSample = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
        audioAtmosphere?.duckMusic?.()
        const utterance = new SpeechSynthesisUtterance("Hello! This is how calm and clear my voice sounds.")
        utterance.rate = voiceSpeed
        utterance.pitch = 1.0
        utterance.onend = () => audioAtmosphere?.restoreMusic?.()
        utterance.onerror = () => audioAtmosphere?.restoreMusic?.()
        window.speechSynthesis.speak(utterance)
      } catch {
        audioAtmosphere?.restoreMusic?.()
      }
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-8" data-testid="my-comfort-settings">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Personal Space</span>
          <h1 className="font-display font-extrabold text-2xl text-slate-800">My Comfort & Focus 🌿</h1>
        </div>
        <button
          onClick={playVoiceSample}
          className="p-3.5 rounded-2xl bg-brand-50 border-2 border-b-4 border-brand-200 text-brand-600 hover:bg-brand-100 active:border-b-2 active:translate-y-0.5 transition-all shadow-xs"
          aria-label="Test voice comfort"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {/* Focus & Quiet Quick Controls (Section 27 & 28) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className={`p-5 cursor-pointer border-2 border-b-4 transition-all active:border-b-2 active:translate-y-0.5 rounded-3xl ${
            focusMode ? 'border-[#13CFE3] bg-[#DDF9FC]/60 shadow-sm' : 'border-[#D7EEF1] bg-white shadow-xs'
          }`}
          onClick={toggleFocusMode}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl select-none">🎯</span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                focusMode ? 'bg-[#0899AA] text-white' : 'bg-[#F2FBFC] text-[#527080] border border-[#D7EEF1]'
              }`}
            >
              {focusMode ? 'Active 🎯' : 'Off'}
            </span>
          </div>
          <h3 className="font-display font-black text-[#08233A] text-base">Focus Mode</h3>
          <p className="text-xs text-[#527080] font-medium mt-1">
            Calms the page, reducing visual distractions and keeping only Listen &amp; Help visible.
          </p>
        </Card>

        <Card
          className={`p-5 cursor-pointer border-2 border-b-4 transition-all active:border-b-2 active:translate-y-0.5 rounded-3xl ${
            quietMode ? 'border-[#FFC857] bg-[#FFF9E6]/60 shadow-sm' : 'border-[#D7EEF1] bg-white shadow-xs'
          }`}
          onClick={toggleQuietMode}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl select-none">🤫</span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                quietMode ? 'bg-[#B87D00] text-white' : 'bg-[#F2FBFC] text-[#527080] border border-[#D7EEF1]'
              }`}
            >
              {quietMode ? 'Learning quietly 🤫' : 'Off'}
            </span>
          </div>
          <h3 className="font-display font-black text-[#08233A] text-base">Quiet Mode</h3>
          <p className="text-xs text-[#527080] font-medium mt-1">
            Learning quietly: silences background music and effects; keeps helpful speech only.
          </p>
        </Card>
      </div>

      {/* Background Atmosphere Music Controls */}
      <Card className="p-6 border-2 border-[#D7EEF1] shadow-sm rounded-3xl bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E6F8FA] border border-[#D7EEF1] flex items-center justify-center text-xl">
              🎵
            </div>
            <div>
              <h3 className="font-display font-black text-[#08233A] text-base">Background Atmosphere Music</h3>
              <p className="text-xs text-[#527080] font-medium">Gentle, calming ambient notes designed for relaxed focus</p>
            </div>
          </div>
          <button
            onClick={toggleMusic}
            disabled={quietMode}
            className={`px-4 py-2 rounded-2xl text-xs font-display font-extrabold transition-all border cursor-pointer ${
              quietMode
                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                : isMusicPlaying
                ? 'bg-[#13CFE3] text-[#08233A] border-[#0899AA] shadow-xs'
                : 'bg-[#F2FBFC] text-[#527080] border-[#D7EEF1] hover:bg-[#E6F8FA]'
            }`}
          >
            {quietMode ? 'Muted (Quiet Mode)' : isMusicPlaying ? '▶ Music: PLAYING' : '⏸ Music: OFF'}
          </button>
        </div>

        {/* World Atmosphere Selector */}
        <div>
          <label className="block text-xs font-bold text-[#08233A] mb-2 flex items-center justify-between">
            <span>Smooth Atmosphere Tones ☁️</span>
            <span className="text-[11px] text-[#0899AA] font-bold">Continuous velvet soundscapes</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'lullaby', label: 'Cloud Lullaby', emoji: '☁️' },
              { id: 'ocean', label: 'Ocean Whispers', emoji: '🌊' },
              { id: 'space', label: 'Starry Dreams', emoji: '✨' },
              { id: 'forest', label: 'Sunlit Meadow', emoji: '🌻' },
              { id: 'fantasy', label: 'Enchanted Castle', emoji: '🏰' },
              { id: 'music', label: 'Playful Melody', emoji: '🎵' },
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => changeMusicStyle(style.id)}
                className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  musicStyle === style.id
                    ? 'border-[#13CFE3] bg-[#DDF9FC] text-[#08233A] shadow-xs'
                    : 'border-[#D7EEF1] bg-[#F2FBFC] text-[#527080] hover:bg-white'
                }`}
              >
                <span>{style.emoji}</span>
                <span className="truncate">{style.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Volume Slider */}
        <div className="pt-2 border-t border-[#D7EEF1]">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-[#08233A]">Music Volume: {Math.round(musicVolume * 100)}%</label>
            <span className="text-[11px] text-[#0899AA] font-bold">Auto-ducks during speech 🦆</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={musicVolume}
            onChange={(e) => handleMusicVolume(Number(e.target.value))}
            className="w-full accent-[#13CFE3] h-2 bg-[#E6F8FA] rounded-lg cursor-pointer"
          />
        </div>
      </Card>

      {/* Reading Ergonomics & Visual Settings (Section 26) */}
      <Card className="p-6 border-2 border-[#D7EEF1] shadow-sm rounded-3xl bg-white space-y-4">
        <h3 className="font-display font-black text-[#08233A] text-base flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#0899AA]" /> Reading Comfort &amp; Ergonomics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#08233A] mb-1">🔤 Text Size</label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-full p-3 rounded-2xl border border-[#D7EEF1] text-xs font-bold bg-[#F2FBFC] text-[#08233A] outline-none hover:border-[#13CFE3] transition-colors"
            >
              <option value="normal">Standard</option>
              <option value="large">Large (Recommended)</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#08233A] mb-1">📖 Font Choice</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full p-3 rounded-2xl border border-[#D7EEF1] text-xs font-bold bg-[#F2FBFC] text-[#08233A] outline-none hover:border-[#13CFE3] transition-colors"
            >
              <option value="default">LexiGuide Peaceful Sans</option>
              <option value="open-dyslexic">OpenDyslexic (Weighted Bottom)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#08233A] mb-1">↔ Letter Spacing</label>
            <select
              value={letterSpacing}
              onChange={(e) => setLetterSpacing(e.target.value)}
              className="w-full p-3 rounded-2xl border border-[#D7EEF1] text-xs font-bold bg-[#F2FBFC] text-[#08233A] outline-none hover:border-[#13CFE3] transition-colors"
            >
              <option value="normal">Normal</option>
              <option value="wide">Wide (Comfortable)</option>
              <option value="extra-wide">Extra Wide</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#08233A] mb-1">✨ Motion &amp; Animation</label>
            <select
              value={motionLevel}
              onChange={(e) => setMotionLevel(e.target.value)}
              className="w-full p-3 rounded-2xl border border-[#D7EEF1] text-xs font-bold bg-[#F2FBFC] text-[#08233A] outline-none hover:border-[#13CFE3] transition-colors"
            >
              <option value="gentle">Gentle (Calm)</option>
              <option value="none">None (Reduced Motion)</option>
              <option value="full">Full (Playful)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Voice Speed Slider */}
      <Card className="p-6 border-2 border-slate-100 shadow-sm">
        <h3 className="font-display font-bold text-slate-800 text-base mb-2 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-brand-600" /> Voice Pace: {voiceSpeed}x
        </h3>
        <p className="text-xs text-slate-400 mb-4">A gentle, unhurried speaking rate helps early learners listen clearly.</p>
        <input
          type="range"
          min="0.6"
          max="1.1"
          step="0.05"
          value={voiceSpeed}
          onChange={(e) => setVoiceSpeed(Number(e.target.value))}
          className="w-full accent-brand-500 h-2.5 bg-slate-100 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Slower (0.6x)</span>
          <span>Child-friendly (0.85x)</span>
          <span>Normal (1.0x)</span>
        </div>
      </Card>

      {/* Language Toggle */}
      <Card className="p-6">
        <h3 className="font-display font-bold text-slate-800 text-base mb-3">Language Bridge</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-semibold text-xs transition-colors ${
                language === l.code ? 'bg-brand-500 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{l.flag}</span> {l.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Non-Clinical Privacy Guarantee */}
      <Card className="p-4 bg-slate-50/50 border border-slate-100">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            {activeChild.name}'s learning space is completely private and supportive. LexiGuide is an educational screening and learning support tool — it does not provide clinical diagnosis.
          </p>
        </div>
      </Card>
    </div>
  )
}

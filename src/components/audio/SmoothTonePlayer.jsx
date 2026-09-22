import React, { useState, useEffect } from 'react'
import { Music, Volume2, VolumeX, Play, Pause, Sparkles, X, Check, Sliders } from 'lucide-react'
import audioAtmosphere, { SMOOTH_TONE_STYLES } from '../../services/audioAtmosphereService'

/**
 * Hook to keep component synchronized with the background audio atmosphere service
 */
export function useAudioAtmosphere() {
  const [state, setState] = useState(() => audioAtmosphere.getState())

  useEffect(() => {
    const unsubscribe = audioAtmosphere.subscribe((nextState) => {
      setState(nextState)
    })
    return unsubscribe
  }, [])

  return {
    ...state,
    toggleMusic: (style) => audioAtmosphere.toggleMusic(style),
    startMusic: (style) => audioAtmosphere.startAmbientAtmosphere(style),
    stopMusic: () => audioAtmosphere.stopAmbientAtmosphere(),
    setVolume: (vol) => audioAtmosphere.setMusicVolume(vol),
    setQuietMode: (q) => audioAtmosphere.setQuietMode(q),
  }
}

/**
 * Compact Pill button for Navigation TopBar and headers
 */
export function SmoothTonePill({ onOpenModal }) {
  const { isPlayingMusic, quietMode, activeTone, toggleMusic } = useAudioAtmosphere()

  if (quietMode) {
    return (
      <button
        type="button"
        onClick={onOpenModal}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
        title="Quiet Mode active (music muted). Click to adjust."
        aria-label="Quiet Mode active"
      >
        <VolumeX size={14} className="text-slate-500" />
        <span className="hidden md:inline text-[11px]">Quiet Mode</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xs border border-[#D7EEF1] p-0.5 rounded-2xl shadow-2xs hover:border-[#13CFE3] transition-all">
      {/* Quick Play/Pause button */}
      <button
        type="button"
        onClick={() => toggleMusic()}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          isPlayingMusic
            ? 'bg-[#E6F8FA] text-[#0899AA] shadow-2xs'
            : 'text-[#527080] hover:text-[#08233A] hover:bg-[#F2FBFC]'
        }`}
        title={isPlayingMusic ? 'Pause background smooth music' : 'Play background smooth music'}
        aria-label={isPlayingMusic ? 'Pause background music' : 'Play background music'}
      >
        {isPlayingMusic ? (
          <>
            <span className="flex items-center gap-0.5 h-3">
              <span className="w-1 h-3 bg-[#13CFE3] rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-2 bg-[#0899AA] rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-3 bg-[#13CFE3] rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
            <span className="text-[11px] font-extrabold hidden sm:inline text-[#08233A]">
              {activeTone?.emoji} {activeTone?.name}
            </span>
          </>
        ) : (
          <>
            <Music size={13} className="text-[#527080]" />
            <span className="text-[11px] font-bold text-[#527080] hidden sm:inline">
              Smooth Tones
            </span>
          </>
        )}
      </button>

      {/* Tone details / modal opener */}
      <button
        type="button"
        onClick={onOpenModal}
        className="px-1.5 py-1 text-[11px] font-bold text-[#0899AA] hover:bg-[#DDF9FC] rounded-xl transition-colors cursor-pointer"
        title="Choose smooth tone style and volume"
        aria-label="Choose smooth music tone style"
      >
        <Sliders size={12} />
      </button>
    </div>
  )
}

/**
 * Child-Friendly Smooth Tone Selection & Volume Modal
 */
export function SmoothToneModal({ isOpen, onClose }) {
  const {
    isPlayingMusic,
    currentStyle,
    musicVolume,
    quietMode,
    toggleMusic,
    startMusic,
    setVolume,
    setQuietMode,
  } = useAudioAtmosphere()

  if (!isOpen) return null

  const handleSelectStyle = (styleId) => {
    if (quietMode) {
      setQuietMode(false)
    }
    startMusic(styleId)
  }

  const handleVolumePreset = (pct) => {
    setVolume(pct)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="smooth-music-title"
    >
      <div
        className="bg-white rounded-3xl border-2 border-[#D7EEF1] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#D7EEF1] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E6F8FA] border border-[#D7EEF1] flex items-center justify-center text-2xl shadow-xs">
              🎵
            </div>
            <div>
              <h2 id="smooth-music-title" className="text-lg font-display font-black text-[#08233A] flex items-center gap-2">
                <span>Smooth Calming Music</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Comfort Tones
                </span>
              </h2>
              <p className="text-xs text-[#527080] font-semibold mt-0.5">
                Soft, soothing background melodies designed to relax and focus your mind ✨
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-[#527080] hover:text-[#08233A] hover:bg-[#F2FBFC] border border-[#D7EEF1] transition-all cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Master Play / Pause Control */}
        <div className="bg-gradient-to-r from-[#F2FBFC] via-[#E6F8FA] to-[#DDF9FC] p-4 rounded-2xl border border-[#D7EEF1] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all shadow-xs ${
              isPlayingMusic && !quietMode ? 'bg-[#13CFE3] text-[#08233A] ring-4 ring-[#13CFE3]/20 animate-pulse' : 'bg-white text-slate-400'
            }`}>
              {isPlayingMusic && !quietMode ? '🎶' : '💤'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-display font-black text-[#08233A] truncate">
                {quietMode
                  ? 'Quiet Mode (Muted)'
                  : isPlayingMusic
                  ? 'Playing Smooth Tone'
                  : 'Music is Paused'}
              </p>
              <p className="text-[11px] text-[#527080] font-bold truncate">
                {quietMode
                  ? 'Tap play to restore relaxing music'
                  : isPlayingMusic
                  ? 'Continuous velvet pad & soft chimes'
                  : 'Tap to start relaxing ambient music'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (quietMode) setQuietMode(false)
              toggleMusic()
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-display font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${
              isPlayingMusic && !quietMode
                ? 'bg-[#FFC857] text-[#08233A] border border-[#E0A838] hover:bg-[#FFD270]'
                : 'bg-[#13CFE3] text-[#08233A] border border-[#0899AA] hover:bg-[#0899AA] hover:text-white'
            }`}
          >
            {isPlayingMusic && !quietMode ? (
              <>
                <Pause size={14} className="fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={14} className="fill-current" />
                <span>Play Tones ✨</span>
              </>
            )}
          </button>
        </div>

        {/* Tone Styles Grid */}
        <div>
          <label className="block text-xs font-display font-extrabold text-[#08233A] mb-2.5 flex items-center justify-between">
            <span>Choose Your Smooth Tone Style ☁️</span>
            <span className="text-[11px] font-semibold text-[#0899AA]">6 Gentle Moods</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SMOOTH_TONE_STYLES.map((style) => {
              const isSelected = currentStyle === style.id && isPlayingMusic && !quietMode
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleSelectStyle(style.id)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#13CFE3] bg-[#E6F8FA] shadow-xs'
                      : 'border-[#D7EEF1] bg-white hover:border-[#13CFE3]/60 hover:bg-[#F2FBFC]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{style.emoji}</span>
                      <div>
                        <span className="text-xs font-display font-black text-[#08233A] block">
                          {style.name}
                        </span>
                        <span className="text-[10px] font-bold text-[#527080] block -mt-0.5 line-clamp-1">
                          {style.subtitle}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-[#0899AA] bg-white px-2 py-0.5 rounded-full border border-[#13CFE3] shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#13CFE3] animate-ping" />
                        Playing
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#527080] mt-2 font-medium leading-relaxed">
                    {style.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Volume & Comfort Controls */}
        <div className="space-y-2 pt-2 border-t border-[#D7EEF1]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-display font-extrabold text-[#08233A] flex items-center gap-1.5">
              <Volume2 size={14} className="text-[#0899AA]" />
              <span>Music Volume: {Math.round(musicVolume * 100)}%</span>
            </label>
            {/* Quick Preset Pills */}
            <div className="flex items-center gap-1">
              {[
                { label: 'Whisper', val: 0.2 },
                { label: 'Smooth', val: 0.45 },
                { label: 'Comfort', val: 0.7 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleVolumePreset(p.val)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                    Math.abs(musicVolume - p.val) < 0.08
                      ? 'bg-[#13CFE3] text-[#08233A] border-[#0899AA]'
                      : 'bg-[#F2FBFC] text-[#527080] border-[#D7EEF1] hover:bg-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <input
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            value={musicVolume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-[#13CFE3] h-2 bg-[#E6F8FA] rounded-lg cursor-pointer"
            aria-label="Music volume level"
          />

          {/* Calming reassurance banner */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-2.5 flex items-start gap-2 text-[11px] text-amber-900 mt-2">
            <span className="text-sm">🦆</span>
            <div className="flex-1">
              <p className="font-bold">Auto-Comfort Audio Ducking</p>
              <p className="text-[10px] text-amber-800 leading-tight mt-0.5">
                Music automatically glides down when instructional speech or pronunciation speaks, so words are always crystal clear!
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#D7EEF1]">
          <button
            type="button"
            onClick={() => {
              const next = !quietMode
              setQuietMode(next)
            }}
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
              quietMode
                ? 'bg-[#FFC857] text-[#08233A] border-[#E0A838]'
                : 'bg-white text-[#527080] border-[#D7EEF1] hover:bg-[#F2FBFC]'
            }`}
          >
            {quietMode ? '🤫 Quiet Mode: ON' : '🤫 Switch to Quiet Mode'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-2xl text-xs font-display font-extrabold bg-[#08233A] text-white hover:bg-[#0899AA] transition-all cursor-pointer shadow-xs"
          >
            Done &amp; Enjoy 🌟
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Full card version for embedding into Sensory Comfort panels (Home & Settings)
 */
export function SmoothToneCard() {
  const [modalOpen, setModalOpen] = useState(false)
  const { isPlayingMusic, currentStyle, activeTone, quietMode, toggleMusic } = useAudioAtmosphere()

  return (
    <>
      <div className="bg-white border-2 border-[#D7EEF1] rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E6F8FA] to-[#DDF9FC] border border-[#D7EEF1] flex items-center justify-center text-2xl shadow-xs shrink-0">
            {activeTone?.emoji || '🎵'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-display font-black text-[#08233A]">
                {activeTone?.name || 'Cloud Lullaby'}
              </h3>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                isPlayingMusic && !quietMode
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {isPlayingMusic && !quietMode ? 'Playing Smoothly ✨' : 'Paused'}
              </span>
            </div>
            <p className="text-xs text-[#527080] font-semibold mt-0.5">
              {activeTone?.subtitle || 'Ultra-smooth velvet sine tones & soft music box'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => toggleMusic()}
            className={`px-4 py-2 rounded-2xl text-xs font-display font-extrabold transition-all border-2 cursor-pointer shadow-xs active:scale-95 ${
              isPlayingMusic && !quietMode
                ? 'bg-[#13CFE3] text-[#08233A] border-[#0899AA]'
                : 'bg-white text-[#527080] border-[#D7EEF1] hover:bg-[#F2FBFC]'
            }`}
          >
            {isPlayingMusic && !quietMode ? '⏸ Pause' : '▶ Play Tones'}
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl text-xs font-display font-extrabold bg-[#F2FBFC] text-[#08233A] border-2 border-[#D7EEF1] hover:border-[#13CFE3] transition-all cursor-pointer shadow-xs"
          >
            Choose Tone ☁️
          </button>
        </div>
      </div>

      <SmoothToneModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}

export default SmoothTonePill

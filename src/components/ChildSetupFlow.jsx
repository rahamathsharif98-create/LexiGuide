import React, { useState } from 'react'
import { Volume2, VolumeX, Sparkles, Check, ChevronRight, ChevronLeft, Heart, Music, Sliders, Globe, User } from 'lucide-react'
import { Card } from '../components/ui'

export const AVATAR_OPTIONS = ['🦊', '🐼', '🦁', '🐨', '🚀', '⭐', '🐬', '🦄']

export const MOTHER_TONGUES = [
  { code: 'te', label: 'తెలుగు', name: 'Telugu', flag: '🇮🇳', greeting: 'నమస్కారం' },
  { code: 'hi', label: 'हिन्दी', name: 'Hindi', flag: '🇮🇳', greeting: 'नमस्ते' },
  { code: 'en', label: 'English', name: 'English', flag: '🇬🇧', greeting: 'Hello' },
]

export const LEARNING_LANGUAGES = [
  { code: 'en', label: 'English', desc: 'Focus on English reading, phonics & words' },
  { code: 'te', label: 'తెలుగు (Telugu)', desc: 'Learn Telugu letters and vocabulary' },
  { code: 'hi', label: 'हिन्दी (Hindi)', desc: 'Learn Hindi letters and vocabulary' },
]

export const INTEREST_CARDS = [
  { id: 'animals', emoji: '🐶', label: 'Animals', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { id: 'space', emoji: '🚀', label: 'Space', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { id: 'vehicles', emoji: '🚗', label: 'Vehicles', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'music', emoji: '🎵', label: 'Music', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'stories', emoji: '📖', label: 'Stories', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { id: 'nature', emoji: '🌳', label: 'Nature', color: 'bg-green-50 border-green-200 text-green-700' },
  { id: 'fantasy', emoji: '🧚', label: 'Fantasy', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { id: 'sports', emoji: '⚽', label: 'Sports', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { id: 'drawing', emoji: '🎨', label: 'Drawing', color: 'bg-teal-50 border-teal-200 text-teal-700' },
  { id: 'puzzles', emoji: '🧩', label: 'Puzzles', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { id: 'colours', emoji: '🌈', label: 'Colours', color: 'bg-rose-50 border-rose-200 text-rose-700' },
]

export const MUSIC_STYLES = [
  { id: 'calm', label: 'Gentle & Calm', icon: '🍃' },
  { id: 'happy', label: 'Cheerful & Upbeat', icon: '☀️' },
  { id: 'adventure', label: 'Playful Adventure', icon: '🗺️' },
]

export const FAVORITE_COLORS = [
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Sunny Yellow', hex: '#facc15' },
  { name: 'Soft Purple', hex: '#c084fc' },
  { name: 'Mint Green', hex: '#4ade80' },
  { name: 'Warm Coral', hex: '#fb7185' },
]

export default function ChildSetupFlow({ onComplete, onCancel }) {
  // Steps: 1: Basic -> 2: Mother Tongue -> 3: Learning Lang -> 4: Interests -> 5: Favourites -> 6: Music/Sound -> 7: Comfort
  const [step, setStep] = useState(1)

  // Profile data state
  const [name, setName] = useState('')
  const [age, setAge] = useState(7)
  const [avatar, setAvatar] = useState('🦊')
  const [motherTongue, setMotherTongue] = useState('te')
  const [learningLanguage, setLearningLanguage] = useState('en')
  const [selectedInterests, setSelectedInterests] = useState(['space', 'animals'])
  const [favoriteColor, setFavoriteColor] = useState('Sky Blue')
  const [favoriteAnimal, setFavoriteAnimal] = useState('Panda')
  const [favoriteMusicStyle, setFavoriteMusicStyle] = useState('calm')
  
  // Music & sound preferences
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [quietMode, setQuietMode] = useState(false)
  const [audioDucking, setAudioDucking] = useState(true)

  // Comfort settings (sensible defaults)
  const [fontSize, setFontSize] = useState('large')
  const [fontFamily, setFontFamily] = useState('default')
  const [motionLevel, setMotionLevel] = useState('gentle')
  const [letterSpacing, setLetterSpacing] = useState('wide')

  // Audio instruction voice playback
  const playVoiceInstruction = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.85
        utterance.pitch = 1.0
        window.speechSynthesis.speak(utterance)
      } catch {}
    }
  }

  const toggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((item) => item !== id) : prev) : [...prev, id]
    )
  }

  const handleFinish = () => {
    const profilePayload = {
      name: name.trim() || 'Young Explorer',
      age: Number(age) || 7,
      avatar,
      languageProfile: {
        mother_tongue: motherTongue,
        support_language: motherTongue,
        target_learning_language: learningLanguage,
        interface_language: 'en',
        enabled_languages: Array.from(new Set(['en', motherTongue])),
      },
      interests: {
        interest_categories: selectedInterests,
        favorite_color: favoriteColor,
        favorite_animal: favoriteAnimal,
        favorite_music_style: favoriteMusicStyle,
      },
      comfort: {
        font_family: fontFamily,
        text_size: fontSize,
        letter_spacing: letterSpacing,
        motion_level: motionLevel,
        music_enabled: musicEnabled,
        quiet_mode: quietMode,
        audio_ducking_enabled: audioDucking,
      }
    }
    if (onComplete) onComplete(profilePayload)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6" data-testid="child-setup-flow">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-10">
        
        {/* Progress header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500">Step {step} of 7</span>
            <h2 className="font-display font-extrabold text-2xl text-slate-800">
              {step === 1 && "Child Profile"}
              {step === 2 && "Mother Tongue"}
              {step === 3 && "Learning Target"}
              {step === 4 && "Interests & Passions"}
              {step === 5 && "Favourite Things"}
              {step === 6 && "Music & Audio"}
              {step === 7 && "Comfort & Sensory Defaults"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const instructions = [
                  "",
                  "Enter child name, age, and choose a favourite avatar.",
                  "Choose mother tongue to support learning.",
                  "Choose target language.",
                  "Choose interests that make learning fun.",
                  "Pick favourite color and animal.",
                  "Set music and audio volume preferences.",
                  "Review comfort settings.",
                ]
                playVoiceInstruction(instructions[step] || "Setup profile")
              }}
              className="p-3 rounded-2xl bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all"
              aria-label="Listen to step instruction"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            {onCancel && (
              <button onClick={onCancel} className="text-sm font-semibold text-slate-400 hover:text-slate-600 px-2 py-1">
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Step 1: Basic Profile */}
        {step === 1 && (
          <div className="space-y-6" data-testid="step-basic-profile">
            <div>
              <label className="block font-display font-bold text-slate-700 text-sm mb-2">Child's Preferred Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav"
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-brand-500 focus:outline-none text-lg font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-display font-bold text-slate-700 text-sm mb-2">Age: {age} years</label>
              <input
                type="range"
                min="4"
                max="12"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full accent-brand-500 h-3 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1 font-semibold">
                <span>4 yrs</span>
                <span>8 yrs</span>
                <span>12 yrs</span>
              </div>
            </div>

            <div>
              <label className="block font-display font-bold text-slate-700 text-sm mb-3">Choose a Friendly Avatar</label>
              <div className="flex flex-wrap gap-3">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
                      avatar === emoji ? 'bg-brand-100 border-brand-500 shadow-md scale-105' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Mother Tongue */}
        {step === 2 && (
          <div className="space-y-6" data-testid="step-mother-tongue">
            <p className="text-sm text-slate-500">
              Mother tongue acts as a warm learning bridge. The child receives encouraging explanations in this language.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {MOTHER_TONGUES.map((item) => {
                const isSelected = motherTongue === item.code
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setMotherTongue(item.code)}
                    className={`p-5 rounded-2xl border-2 border-b-4 active:border-b-0 active:translate-y-1 text-left transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 shadow-md scale-105'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{item.flag}</div>
                    <div className="font-display font-extrabold text-lg text-slate-800">{item.label}</div>
                    <div className="text-xs text-slate-400 font-semibold">{item.name}</div>
                    <div className="text-xs text-brand-600 font-medium mt-3">"{item.greeting}!"</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3: Learning Language */}
        {step === 3 && (
          <div className="space-y-6" data-testid="step-learning-language">
            <p className="text-sm text-slate-500">
              Select the primary target language for reading mastery and phonics practice.
            </p>
            <div className="space-y-3">
              {LEARNING_LANGUAGES.map((item) => {
                const isSelected = learningLanguage === item.code
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLearningLanguage(item.code)}
                    className={`w-full p-5 rounded-2xl border-2 border-b-4 active:border-b-0 active:translate-y-1 text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-display font-bold text-slate-800 text-base">{item.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                    {isSelected && (
                      <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 4: Interests (Cards) */}
        {step === 4 && (
          <div className="space-y-6" data-testid="step-interests">
            <div>
              <p className="text-sm text-slate-500 mb-1">
                Select topics your child loves. These shape story themes, playful characters, and visual worlds!
              </p>
              <p className="text-xs text-slate-400 italic">
                * Note: Interests strictly change presentation themes — they never affect learning difficulty.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
              {INTEREST_CARDS.map((card) => {
                const isSelected = selectedInterests.includes(card.id)
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => toggleInterest(card.id)}
                    className={`p-4 rounded-2xl border-2 border-b-4 active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? `${card.color} border-current shadow-md scale-105 font-bold`
                        : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-4xl">{card.emoji}</span>
                    <span className="text-sm font-display">{card.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 5: Favourites */}
        {step === 5 && (
          <div className="space-y-6" data-testid="step-favourites">
            <div>
              <label className="block font-display font-bold text-slate-700 text-sm mb-3">Favourite Color</label>
              <div className="flex flex-wrap gap-3">
                {FAVORITE_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setFavoriteColor(c.name)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-b-4 active:border-b-0 active:translate-y-1 text-sm font-semibold transition-all ${
                      favoriteColor === c.name ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-slate-100 bg-white'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-display font-bold text-slate-700 text-sm mb-2">Favourite Animal or Character</label>
              <input
                type="text"
                value={favoriteAnimal}
                onChange={(e) => setFavoriteAnimal(e.target.value)}
                placeholder="e.g. Panda or Robot"
                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-200 focus:border-brand-500 focus:outline-none text-base font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-display font-bold text-slate-700 text-sm mb-3">Preferred Music Style</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MUSIC_STYLES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFavoriteMusicStyle(m.id)}
                    className={`p-3 rounded-2xl border-2 border-b-4 active:border-b-0 active:translate-y-1 text-center transition-all ${
                      favoriteMusicStyle === m.id
                        ? 'border-brand-500 bg-brand-50 font-bold text-brand-700 shadow-sm'
                        : 'border-slate-100 bg-white text-slate-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <div className="text-xs font-display">{m.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Music & Sound Preferences */}
        {step === 6 && (
          <div className="space-y-6" data-testid="step-music-sound">
            <p className="text-sm text-slate-500">
              Customize audio atmosphere. Background music automatically softens (ducks) when instructions speak.
            </p>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <div className="font-display font-bold text-slate-800 text-sm">Background Learning Music</div>
                  <div className="text-xs text-slate-400">Gentle soundscapes to promote focus</div>
                </div>
                <input
                  type="checkbox"
                  checked={musicEnabled}
                  onChange={(e) => setMusicEnabled(e.target.checked)}
                  className="w-6 h-6 accent-brand-500 rounded-lg cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <div className="font-display font-bold text-slate-800 text-sm">Quiet Mode</div>
                  <div className="text-xs text-slate-400">Voice instructions only — silence background music and SFX</div>
                </div>
                <input
                  type="checkbox"
                  checked={quietMode}
                  onChange={(e) => setQuietMode(e.target.checked)}
                  className="w-6 h-6 accent-brand-500 rounded-lg cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <div className="font-display font-bold text-slate-800 text-sm">Auto Audio Ducking</div>
                  <div className="text-xs text-slate-400">Automatically lowers music volume while characters speak</div>
                </div>
                <input
                  type="checkbox"
                  checked={audioDucking}
                  onChange={(e) => setAudioDucking(e.target.checked)}
                  className="w-6 h-6 accent-brand-500 rounded-lg cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Step 7: Comfort & Sensory Defaults */}
        {step === 7 && (
          <div className="space-y-6" data-testid="step-comfort-settings">
            <p className="text-sm text-slate-500">
              Sensible child-friendly visual ergonomics. Can be fine-tuned anytime in 'My Comfort'.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-display font-bold text-slate-700 text-xs mb-2">Text Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-white font-semibold text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="large">Large (Comfortable)</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>

              <div>
                <label className="block font-display font-bold text-slate-700 text-xs mb-2">Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-white font-semibold text-sm"
                >
                  <option value="default">LexiGuide Sans</option>
                  <option value="open-dyslexic">Dyslexia-Friendly Font</option>
                </select>
              </div>

              <div>
                <label className="block font-display font-bold text-slate-700 text-xs mb-2">Letter Spacing</label>
                <select
                  value={letterSpacing}
                  onChange={(e) => setLetterSpacing(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-white font-semibold text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="wide">Wide (Spaced)</option>
                  <option value="extra-wide">Extra Wide</option>
                </select>
              </div>

              <div>
                <label className="block font-display font-bold text-slate-700 text-xs mb-2">Motion & Animations</label>
                <select
                  value={motionLevel}
                  onChange={(e) => setMotionLevel(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-white font-semibold text-sm"
                >
                  <option value="none">None (Static)</option>
                  <option value="gentle">Gentle (Calm)</option>
                  <option value="full">Standard</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-b-4 border-slate-200 text-slate-600 font-display font-bold text-sm hover:bg-slate-50 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 7 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-500 border-b-4 border-brand-700 text-white font-display font-bold text-sm hover:bg-brand-600 active:border-b-0 active:translate-y-1 shadow-md hover:shadow-lg transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-500 border-b-4 border-emerald-700 text-white font-display font-extrabold text-sm hover:bg-emerald-600 active:border-b-0 active:translate-y-1 shadow-md hover:shadow-lg transition-all"
              data-testid="finish-setup-btn"
            >
              <Sparkles className="w-5 h-5" /> Complete Profile & Hand to Child
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

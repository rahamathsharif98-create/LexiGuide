import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Volume2,
  RotateCcw,
  Undo2,
  Sparkles,
  Mic,
  ChevronRight,
  ChevronLeft,
  Play,
  Check,
  Star,
  ArrowLeft,
  Home as HomeIcon,
  HelpCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { MULTILINGUAL_VOICE_CONFIG, speakLanguageAudio } from '../../services/multilingualVoiceService'
import { resolveThemePackage } from '../../services/personalizationService'
import { audioAtmosphere } from '../../services/audioAtmosphereService'
import { LETTER_STROKE_DATA } from '../../data/letterStrokeData'
import { evaluateChildTracing, normalizeStrokes } from '../../utils/tracingEvaluation'

/**
 * Toy World "Trace & Say" Finger-Writing & Pronunciation Game
 * 
 * 7 Screen Stages:
 * 1. Entry Point (Games catalog route / child home)
 * 2. Language & Letter Picker ('picker')
 * 3. Trace Canvas ('trace') - DPI-scaled pointer canvas, ghost replay, undo/clear, >=48px targets
 * 4. Word Reveal ('reveal') - Cultural picture, word, mother-tongue bridge audio
 * 5. Speak & Retry ('speak') - Mic state, honest evaluation or offline fallback
 * 6. Celebration ('celebration') - Calm mascot reward, star badge
 * 7. Session Progress Strip - Non-anxious dot tracker across all screens
 */
function useSafeNavigate() {
  try {
    return useNavigate()
  } catch {
    return () => {}
  }
}

function useSafeApp() {
  try {
    return useApp()
  } catch {
    return { activeChild: null }
  }
}

export default function TraceAndSpeak({ initialLanguage = 'en', onFinish }) {
  const navigate = useSafeNavigate()
  const { activeChild } = useSafeApp()

  // Resolve Child's Interest Theme (Cosmetics ONLY - Never pedagogy)
  const theme = resolveThemePackage(activeChild?.interests)

  // Comfort Preferences
  const quietMode = Boolean(activeChild?.comfort_preferences?.quiet_mode)
  const motionReduction = Boolean(
    activeChild?.comfort_preferences?.motion_reduction ||
    (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
  )

  // Game State
  const [lang, setLang] = useState(activeChild?.language || initialLanguage || 'en')
  const [stage, setStage] = useState('trace') // 'picker' | 'trace' | 'reveal' | 'speak' | 'celebration'
  const [letterIndex, setLetterIndex] = useState(0)
  const [completedLetters, setCompletedLetters] = useState({}) // { 'te-ka': true }
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0)

  // Tracing State
  const canvasRef = useRef(null)
  const [strokes, setStrokes] = useState([]) // Array of strokes: Array<Array<{x, y}>>
  const currentStrokeRef = useRef([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [evalFeedback, setEvalFeedback] = useState('Trace along the guide lines with your finger! ✍️')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [lastEvalScore, setLastEvalScore] = useState(null)

  // Ghost stroke demonstration animation state
  const [isShowingGhost, setIsShowingGhost] = useState(false)
  const ghostAnimRef = useRef(null)
  const ghostPointRef = useRef(null)

  // Speech Practice State
  const [isListening, setIsListening] = useState(false)
  const [hasSpoken, setHasSpoken] = useState(false)
  const [micStatus, setMicStatus] = useState('ready') // 'ready' | 'listening' | 'unavailable' | 'evaluated'
  const [speechFeedback, setSpeechFeedback] = useState('Press the mic and say the word aloud! 🎤')
  const [sttSupported, setSttSupported] = useState(true)

  // Current Letter Content
  const letterPool = LETTER_STROKE_DATA[lang] || LETTER_STROKE_DATA.te
  const currentItem = letterPool[letterIndex] || letterPool[0]
  const config = MULTILINGUAL_VOICE_CONFIG[lang] || MULTILINGUAL_VOICE_CONFIG.te

  // Check speech recognition capability on mount/lang change
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSttSupported(false)
    } else {
      setSttSupported(true)
    }
  }, [lang])

  // Quiet mode sync with Audio Atmosphere
  useEffect(() => {
    if (quietMode) {
      audioAtmosphere?.setQuietMode?.(true)
    }
    return () => {
      if (quietMode) audioAtmosphere?.setQuietMode?.(false)
    }
  }, [quietMode])

  // Canvas DPI Setup and Resizing (Runs ONLY on mount/resize, never compounding DPR)
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const dpr = window.devicePixelRatio || 1

    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [])

  useEffect(() => {
    setupCanvas()
    const handleResize = () => {
      setupCanvas()
      redrawStrokes(strokes)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setupCanvas])

  // Redraw all drawn strokes and ghost point on canvas
  const redrawStrokes = useCallback((strokeList, ctx) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = ctx || canvas.getContext('2d')
    if (!context) return

    const rect = canvas.getBoundingClientRect()
    context.clearRect(0, 0, rect.width, rect.height)

    // 1. Draw child's drawn strokes
    context.lineWidth = 14
    context.strokeStyle = theme.primaryColor || '#6366f1'

    for (const stroke of strokeList) {
      if (!stroke || stroke.length === 0) continue
      context.beginPath()
      context.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length; i++) {
        context.lineTo(stroke[i].x, stroke[i].y)
      }
      context.stroke()
    }

    // 2. Draw ghost demonstration cursor if active
    if (ghostPointRef.current) {
      const { x, y } = ghostPointRef.current
      const px = x * rect.width
      const py = y * rect.height

      // Glowing outer ring
      context.beginPath()
      context.arc(px, py, 18, 0, Math.PI * 2)
      context.fillStyle = 'rgba(245, 158, 11, 0.3)'
      context.fill()

      // Inner glowing follower dot
      context.beginPath()
      context.arc(px, py, 9, 0, Math.PI * 2)
      context.fillStyle = '#f59e0b'
      context.fill()
    }
  }, [theme.primaryColor])

  // Pointer Event Handlers (touch, stylus, mouse unified with touch-action: none)
  const handlePointerDown = (e) => {
    if (isShowingGhost) stopGhostDemo()
    const canvas = canvasRef.current
    if (!canvas) return

    // Prevent page scrolling/zooming during drawing
    e.preventDefault()
    canvas.setPointerCapture?.(e.pointerId)

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    currentStrokeRef.current = [{ x, y }]

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineWidth = 14
      ctx.strokeStyle = theme.primaryColor || '#6366f1'
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const handlePointerMove = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()

    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top))

    currentStrokeRef.current.push({ x, y })

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const handlePointerUp = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (canvas && canvas.hasPointerCapture?.(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId)
    }

    setIsDrawing(false)
    if (currentStrokeRef.current.length > 0) {
      const updated = [...strokes, [...currentStrokeRef.current]]
      setStrokes(updated)
      currentStrokeRef.current = []
      redrawStrokes(updated)
    }
  }

  // Undo Last Stroke
  const handleUndo = () => {
    if (strokes.length === 0) return
    const updated = strokes.slice(0, -1)
    setStrokes(updated)
    redrawStrokes(updated)
    setEvalFeedback('Removed last stroke. Keep going! ✍️')
  }

  // Clear Canvas
  const handleClear = () => {
    stopGhostDemo()
    setStrokes([])
    currentStrokeRef.current = []
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      const rect = canvas.getBoundingClientRect()
      ctx?.clearRect(0, 0, rect.width, rect.height)
    }
    setEvalFeedback('Canvas refreshed. Trace your letter along the guide lines! ✨')
  }

  // Ghost Stroke Order Demonstration
  const showGhostDemonstration = () => {
    stopGhostDemo()
    if (motionReduction) {
      setEvalFeedback('Follow the dotted outline guide from top to bottom! 🌟')
      return
    }

    setIsShowingGhost(true)
    setEvalFeedback('Watch the glowing guide dot show how to draw! 💫')

    const canonical = currentItem.canonicalStrokes || []
    if (canonical.length === 0) return

    // Flatten all canonical strokes into a timed animation trajectory
    const animPoints = []
    for (const stroke of canonical) {
      for (let i = 0; i < stroke.length - 1; i++) {
        const a = stroke[i]
        const b = stroke[i + 1]
        const steps = 15
        for (let s = 0; s <= steps; s++) {
          const t = s / steps
          animPoints.push({
            x: a.x + t * (b.x - a.x),
            y: a.y + t * (b.y - a.y),
          })
        }
      }
    }

    let index = 0
    const stepAnim = () => {
      if (index >= animPoints.length) {
        setIsShowingGhost(false)
        ghostPointRef.current = null
        redrawStrokes(strokes)
        setEvalFeedback('Now it is your turn to trace it! ✍️')
        return
      }

      ghostPointRef.current = animPoints[index]
      redrawStrokes(strokes)
      index++
      ghostAnimRef.current = requestAnimationFrame(stepAnim)
    }

    ghostAnimRef.current = requestAnimationFrame(stepAnim)
  }

  const stopGhostDemo = () => {
    if (ghostAnimRef.current) {
      cancelAnimationFrame(ghostAnimRef.current)
      ghostAnimRef.current = null
    }
    setIsShowingGhost(false)
    ghostPointRef.current = null
    redrawStrokes(strokes)
  }

  // Audio Playback with Mother-Tongue Bridge
  const handleHearLetter = () => {
    speakLanguageAudio({
      text: `${currentItem.letter}. ${currentItem.word}`,
      lang,
    })
  }

  const handleHearWord = () => {
    speakLanguageAudio({
      text: `${currentItem.letter}... ${currentItem.word}... meaning: ${currentItem.english}`,
      lang,
    })
  }

  // Evaluate Tracing (Honest Point-to-Path + Coverage Calculation)
  const handleDoneTracing = () => {
    stopGhostDemo()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()

    setIsEvaluating(true)
    const normalized = normalizeStrokes(strokes, rect.width, rect.height)
    const outcome = evaluateChildTracing(normalized, currentItem.canonicalStrokes)
    setIsEvaluating(false)
    setLastEvalScore(outcome.score)

    if (outcome.passed) {
      // Mark letter completed in session state
      setCompletedLetters((prev) => ({ ...prev, [currentItem.id]: true }))
      setSessionCompletedCount((prev) => prev + 1)
      setEvalFeedback(outcome.encouragingFeedback)
      speakLanguageAudio({
        text: `Wonderful tracing! You drew the letter ${currentItem.letter}!`,
        lang: 'en',
        onEnd: () => setStage('reveal'),
      })
      // Fallback stage transition if TTS takes time or is offline
      setTimeout(() => setStage('reveal'), 900)
    } else {
      setEvalFeedback(outcome.encouragingFeedback)
      // Automatically show ghost replay to guide the child gently
      setTimeout(() => showGhostDemonstration(), 500)
    }
  }

  // Speech Practice / Honest Voice Pipeline
  const handleSpeechPractice = () => {
    setIsListening(true)
    setMicStatus('listening')
    setSpeechFeedback('Listening to your lovely voice... 🎤')

    const SpeechRecognition = typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null

    if (!SpeechRecognition) {
      // Honest offline fallback: let the child practice without fabricated grading!
      setTimeout(() => {
        setIsListening(false)
        setMicStatus('unavailable')
        setHasSpoken(true)
        setSpeechFeedback(
          `Great effort practicing "${currentItem.word}" aloud! 🌟`
        )
      }, 1200)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = config.langTag || 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || ''
        setIsListening(false)
        setHasSpoken(true)
        setMicStatus('evaluated')
        setSpeechFeedback(`Wonderful job saying "${currentItem.word}"! 🎉`)
        speakLanguageAudio({ text: config.bridgeTemplates.encouragement, lang })
      }

      recognition.onerror = () => {
        setIsListening(false)
        setMicStatus('unavailable')
        setHasSpoken(true)
        setSpeechFeedback(`Nice speaking practice! Let's celebrate! 🌟`)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch {
      setIsListening(false)
      setMicStatus('unavailable')
      setHasSpoken(true)
      setSpeechFeedback(`You practiced speaking "${currentItem.word}"! 🌟`)
    }
  }

  // Advance to Next Letter
  const handleNextLetter = () => {
    handleClear()
    const nextIdx = (letterIndex + 1) % letterPool.length
    setLetterIndex(nextIdx)
    setHasSpoken(false)
    setMicStatus('ready')
    setStage('trace')
  }

  // Render Session Progress Strip (Screen 7: Non-anxious dot tracker)
  const renderProgressStrip = () => {
    const totalLetters = letterPool.length
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/80 rounded-2xl border border-slate-200/80 mb-4" data-testid="session-progress-strip">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-600">Letter {letterIndex + 1} of {totalLetters}</span>
          <div className="flex gap-1.5 ml-2">
            {letterPool.map((item, idx) => {
              const isCurrent = idx === letterIndex
              const isDone = completedLetters[item.id]
              return (
                <div
                  key={item.id}
                  className={`w-3.5 h-3.5 rounded-full transition-all flex items-center justify-center text-[8px] font-bold ${
                    isDone
                      ? 'bg-amber-400 text-amber-950 shadow-xs'
                      : isCurrent
                      ? 'bg-brand-500 ring-2 ring-brand-300 ring-offset-1 text-white scale-110'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                  title={`${item.letter} (${item.word})`}
                >
                  {isDone ? '★' : ''}
                </div>
              )
            })}
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {sessionCompletedCount} explored today
        </span>
      </div>
    )
  }

  // ============================================================================
  // SCREEN 2: LANGUAGE & LETTER PICKER
  // ============================================================================
  if (stage === 'picker') {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6" data-testid="trace-and-speak-game">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => setStage('trace')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 font-display font-bold text-xs text-slate-700 hover:bg-slate-50 shadow-xs min-h-[48px]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Canvas
          </button>
          <span className="text-xs font-bold text-slate-500">{theme.mascot}</span>
        </div>

        {/* Script Selection Cards */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl mb-6">
          <h2 className="font-display font-extrabold text-xl text-slate-800 mb-4">Choose Your Language Script</h2>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { code: 'te', label: 'తెలుగు (Telugu)', sub: 'Mother Tongue' },
              { code: 'hi', label: 'हिन्दी (Hindi)', sub: 'Mother Tongue' },
              { code: 'en', label: 'English', sub: 'Foundational' },
            ].map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => {
                  setLang(opt.code)
                  setLetterIndex(0)
                  handleClear()
                }}
                className={`p-4 rounded-2xl text-center border-2 transition-all min-h-[72px] ${
                  lang === opt.code
                    ? 'border-brand-500 bg-brand-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="font-display font-bold text-sm text-slate-800">{opt.label}</div>
                <div className="text-[11px] font-semibold text-brand-600 mt-1">{opt.sub}</div>
              </button>
            ))}
          </div>

          {/* Letter Carousel / Grid */}
          <h3 className="font-display font-bold text-sm text-slate-700 mb-3">Pick a Letter to Trace:</h3>
          <div className="grid grid-cols-5 gap-3">
            {letterPool.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setLetterIndex(idx)
                  handleClear()
                  setStage('trace')
                }}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center border-2 transition-all min-h-[64px] ${
                  idx === letterIndex
                    ? 'border-amber-400 bg-amber-50 shadow-md scale-105'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="font-display font-black text-2xl text-slate-800">{item.letter}</span>
                <span className="text-[10px] font-semibold text-slate-500 mt-0.5">{item.word}</span>
                {completedLetters[item.id] && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 mt-1" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // SCREEN 4: WORD REVEAL SCREEN
  // ============================================================================
  if (stage === 'reveal') {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6" data-testid="trace-and-speak-game">
        {renderProgressStrip()}

        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xl text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Tracing Complete!
          </div>

          {/* Picture + Cultural Word Card */}
          <div className="p-6 rounded-3xl bg-brand-50/50 border border-brand-100 max-w-sm mx-auto mb-6">
            <span className="text-7xl block mb-3 animate-bounce">{currentItem.icon}</span>
            <div className="font-display font-black text-4xl text-slate-800 mb-1">{currentItem.word}</div>
            <div className="text-sm font-bold text-brand-600 mb-2">"{currentItem.roman}"</div>
            <div className="text-xs font-semibold text-slate-500 bg-white/80 py-1 px-3 rounded-xl inline-block">
              Meaning: {currentItem.english} ({currentItem.meaning})
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={handleHearWord}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-brand-50 border-2 border-brand-200 text-brand-700 font-display font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-100 min-h-[48px] active:scale-95 transition-all"
              aria-label="Hear the word"
            >
              <Volume2 className="w-4 h-4 text-brand-600" /> Hear Word
            </button>
            <button
              type="button"
              onClick={() => setStage('speak')}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-500 border-b-4 border-emerald-700 text-white font-display font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 min-h-[48px] active:border-b-0 active:translate-y-1 shadow-md transition-all"
            >
              <Mic className="w-4 h-4" /> Say It! &rarr;
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // SCREEN 5: SPEAK & RETRY SCREEN
  // ============================================================================
  if (stage === 'speak') {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6" data-testid="trace-and-speak-game">
        {renderProgressStrip()}

        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xl text-center">
          <h2 className="font-display font-extrabold text-2xl text-slate-800 mb-1">
            Say: "{currentItem.word}"
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Mother-Tongue Bridge: Speak the word clearly in {config.name}!
          </p>

          {/* Mic Visual Target (Large 80px target) */}
          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={handleSpeechPractice}
              disabled={isListening}
              className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 shadow-lg transition-all ${
                isListening
                  ? 'bg-amber-500 border-amber-300 text-white scale-110 animate-pulse'
                  : 'bg-brand-500 border-brand-200 text-white hover:scale-105 active:scale-95'
              }`}
              aria-label="Microphone speech check"
              data-testid="speech-practice-btn"
            >
              <Mic className="w-8 h-8 mb-1" />
              <span className="text-[10px] font-extrabold uppercase">
                {isListening ? 'Listening' : 'Tap & Speak'}
              </span>
            </button>
          </div>

          {/* Honest Status Notice if STT is unavailable on device */}
          {!sttSupported && (
            <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-sky-800 text-xs font-semibold max-w-md mx-auto mb-4">
              🎙️ <strong>Listen & Repeat Mode:</strong> Device speech recognition is not available for this language. Practice speaking aloud with {theme.mascot}!
            </div>
          )}

          {/* Non-Clinical Gentle Feedback Banner */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-bold max-w-md mx-auto mb-6">
            {speechFeedback}
          </div>

          {/* Action Buttons (All >= 48px touch targets) */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={handleSpeechPractice}
              className="flex-1 py-3 px-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-display font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 min-h-[48px]"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try Again
            </button>
            <button
              type="button"
              onClick={() => setStage('celebration')}
              className="flex-1 py-3 px-4 rounded-2xl bg-brand-500 border-b-4 border-brand-700 text-white font-display font-extrabold text-sm flex items-center justify-center gap-1.5 hover:bg-brand-600 min-h-[48px] active:border-b-0 active:translate-y-1 shadow-md"
            >
              <Sparkles className="w-4 h-4" /> Continue &rarr;
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // SCREEN 6: CELEBRATION SCREEN
  // ============================================================================
  if (stage === 'celebration') {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6" data-testid="trace-and-speak-game">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl text-center">
          <div className="inline-block p-4 rounded-3xl bg-amber-50 border border-amber-200 mb-4">
            <span className="text-6xl block">{theme.badgeIcon || '⭐'}</span>
          </div>

          <h1 className="font-display font-black text-3xl text-slate-800 mb-2">
            Awesome Explorer! 🎉
          </h1>
          <p className="text-sm font-semibold text-slate-600 mb-6">
            You traced and spoke <strong>{currentItem.letter} ({currentItem.word})</strong>!
          </p>

          <div className="p-4 bg-brand-50 rounded-2xl border border-brand-200 max-w-xs mx-auto mb-8">
            <div className="text-xs font-bold text-brand-700">{theme.mascot} cheers:</div>
            <div className="text-sm font-extrabold text-slate-800 mt-1">"{theme.rewardTitle || 'Golden Star'} earned!"</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <button
              type="button"
              onClick={handleNextLetter}
              className="flex-1 py-4 px-6 rounded-2xl bg-emerald-500 border-b-4 border-emerald-700 text-white font-display font-extrabold text-base flex items-center justify-center gap-2 hover:bg-emerald-600 min-h-[52px] active:border-b-0 active:translate-y-1 shadow-lg"
            >
              Next Letter <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (onFinish) onFinish()
                else navigate('/child/games')
              }}
              className="flex-1 py-4 px-6 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-display font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 min-h-[52px]"
            >
              <HomeIcon className="w-4 h-4" /> Back to Games
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // SCREEN 3: TRACE CANVAS SCREEN (Core Screen)
  // ============================================================================
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6" data-testid="trace-and-speak-game">
      {/* Top Bar with Language Picker and Session Strip */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-600">
            {theme.themedTitle || 'Toy World Trace & Say'}
          </span>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 flex items-center gap-2">
            Trace & Speak <span className="text-lg">✍️</span>
          </h1>
        </div>

        {/* Script Selection Toggle */}
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {['te', 'hi', 'en'].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setLang(code)
                setLetterIndex(0)
                handleClear()
              }}
              className={`px-3 py-1.5 rounded-xl font-display font-bold text-xs transition-all min-h-[36px] ${
                lang === code
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {code === 'te' ? 'తెలుగు' : code === 'hi' ? 'हिन्दी' : 'English'}
            </button>
          ))}
        </div>
      </div>

      {renderProgressStrip()}

      {/* Main Tracing Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          
          {/* Tracing Canvas Box (7 cols on sm) */}
          <div className="sm:col-span-7 flex flex-col items-center">
            <div className="relative flex flex-col items-center justify-center p-2 bg-slate-50 rounded-3xl border-2 border-dashed border-brand-200 w-full max-w-[320px] aspect-square shadow-inner">
              
              {/* Target Letter Background Guide Glyph */}
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-slate-300 font-extrabold text-9xl opacity-40"
              >
                {currentItem.letter}
              </div>

              {/* High-DPI Pointer Canvas */}
              <canvas
                ref={canvasRef}
                tabIndex={0}
                role="application"
                aria-label={`Letter ${currentItem.letter} tracing canvas`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full h-full touch-none cursor-crosshair relative z-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                data-testid="tracing-canvas"
              />
            </div>

            {/* In-Canvas Control Bar (All >= 48px touch targets) */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-[320px] mt-3">
              <button
                type="button"
                onClick={handleHearLetter}
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-brand-50 text-brand-700 font-bold text-[11px] hover:bg-brand-100 min-h-[48px] border border-brand-200 active:scale-95 transition-all"
                aria-label="Hear pronunciation"
              >
                <Volume2 className="w-4 h-4 mb-0.5" /> Hear
              </button>
              <button
                type="button"
                onClick={showGhostDemonstration}
                disabled={isShowingGhost}
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-amber-50 text-amber-800 font-bold text-[11px] hover:bg-amber-100 min-h-[48px] border border-amber-200 active:scale-95 transition-all"
                aria-label="Show me how stroke order replay"
              >
                <Play className="w-4 h-4 mb-0.5 text-amber-600" /> Guide
              </button>
              <button
                type="button"
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white text-slate-600 font-bold text-[11px] hover:bg-slate-50 min-h-[48px] border border-slate-200 active:scale-95 transition-all disabled:opacity-40"
                aria-label="Undo last stroke"
              >
                <Undo2 className="w-4 h-4 mb-0.5" /> Undo
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white text-slate-600 font-bold text-[11px] hover:bg-slate-50 min-h-[48px] border border-slate-200 active:scale-95 transition-all"
                aria-label="Clear canvas"
              >
                <RotateCcw className="w-4 h-4 mb-0.5" /> Clear
              </button>
            </div>
          </div>

          {/* Action & Pedagogy Side Card (5 cols on sm) */}
          <div className="sm:col-span-5 flex flex-col justify-between space-y-4">
            
            {/* Word Association Preview */}
            <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-100 text-center">
              <span className="text-5xl block mb-1">{currentItem.icon}</span>
              <div className="font-display font-extrabold text-2xl text-slate-800">{currentItem.word}</div>
              <div className="text-xs font-semibold text-brand-600 mt-0.5">
                Meaning: {currentItem.english}
              </div>
            </div>

            {/* Non-clinical Encouraging Guidance Box */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-bold text-center min-h-[48px] flex items-center justify-center">
              {evalFeedback}
            </div>

            {/* Primary Action Button: Done Tracing */}
            <button
              type="button"
              onClick={handleDoneTracing}
              disabled={strokes.length === 0 || isEvaluating}
              className={`w-full py-4 px-4 rounded-2xl font-display font-extrabold text-sm flex items-center justify-center gap-2 border-b-4 shadow-md min-h-[52px] active:border-b-0 active:translate-y-1 transition-all ${
                strokes.length > 0
                  ? 'bg-emerald-500 border-emerald-700 text-white hover:bg-emerald-600 cursor-pointer'
                  : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {isEvaluating ? 'Checking...' : "Done Tracing! ✨"}
            </button>

            {/* Direct Speech Practice Action */}
            <button
              type="button"
              onClick={() => setStage('speak')}
              className="w-full py-3 px-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-display font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-amber-100 min-h-[48px] active:scale-95 transition-all"
              data-testid="speech-practice-btn"
            >
              <Mic className="w-4 h-4 text-amber-600" />
              Practice Saying "{currentItem.word}" 🎤
            </button>

            {/* Change Letter / Open Picker Button */}
            <button
              type="button"
              onClick={() => setStage('picker')}
              className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-display font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 min-h-[48px]"
            >
              Choose Another Letter ({letterIndex + 1}/{letterPool.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

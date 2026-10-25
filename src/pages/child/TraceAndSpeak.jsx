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
import { evaluateChildTracing, normalizeStrokes, getCatmullRomPoints } from '../../utils/tracingEvaluation'
import GameProgressionHub from '../../components/games/GameProgressionHub'
import {
  LETTER_TRACE_STAGES,
  TOTAL_LETTER_TRACE_LEVELS,
  getStageForLevel,
  isStageBoundary,
} from '../../games/letter-trace/engine/letterTraceCurriculum'
import {
  loadLetterTraceCheckpointData,
  saveLetterTraceCheckpoint,
  resetLetterTraceCheckpoint,
} from '../../games/letter-trace/engine/letterTraceCheckpoint'
import { useGameSessionTracker } from '../../hooks/useGameSessionTracker'

/**
 * Toy World "Trace & Say" Finger-Writing & Pronunciation Game
 * 
 * 7 Screen Stages:
 * 1. Entry Point (Games catalog route / child home / GameProgressionHub modal)
 * 2. Language & Letter Picker ('picker')
 * 3. Trace Canvas ('trace') - DPI-scaled pointer canvas, ghost replay, undo/clear, >=48px targets
 * 4. Word Reveal ('reveal') - Cultural picture, word, mother-tongue bridge audio
 * 5. Speak & Retry ('speak') - Mic state, honest evaluation or offline fallback
 * 6. Celebration ('celebration') - Calm mascot reward, star badge, stage clear transitions, grand victory
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

export default function TraceAndSpeak({ initialLanguage = 'en', initialModal = null, onFinish }) {
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

  // Session & Checkpoint persistence
  const tracker = useGameSessionTracker({
    gameId: 'trace-speak',
    gameTitle: 'Letter Trace',
    skill: 'phonologicalAwareness',
  })
  const isSavedRef = useRef(false)
  const isEvaluatingRef = useRef(false)
  const isAdvancingRef = useRef(false)

  const [activeModal, setActiveModal] = useState(initialModal) // 'entry' | 'stages' | 'restartConfirm' | null
  const activeLang = activeChild?.language || initialLanguage || 'en'
  const initialPool = (LETTER_STROKE_DATA[activeLang] || LETTER_STROKE_DATA.en || LETTER_STROKE_DATA.te)
    .filter((item) => !item.excluded && item.active !== false)
  const initialCheckpoint = loadLetterTraceCheckpointData(activeChild?.id, initialPool.length)

  // Game State
  const [lang, setLang] = useState(activeLang)
  const [stage, setStage] = useState('trace') // 'picker' | 'trace' | 'reveal' | 'speak' | 'celebration'
  const [letterIndex, setLetterIndex] = useState(
    Math.min(initialCheckpoint.levelIndex, Math.max(0, initialPool.length - 1))
  )
  const [score, setScore] = useState(initialCheckpoint.score)
  const [stars, setStars] = useState(initialCheckpoint.stars)
  const [completedLetters, setCompletedLetters] = useState({}) // { 'te-ka': true }
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0)
  const [isGrandVictory, setIsGrandVictory] = useState(false)

  // Tracing State
  const canvasRef = useRef(null)
  const [strokes, setStrokes] = useState([]) // Array of strokes: Array<Array<{x, y}>>
  const strokesRef = useRef([])
  strokesRef.current = strokes
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

  // Current Letter Content (filters out any excluded letters such as Telugu 'త')
  const letterPool = (LETTER_STROKE_DATA[lang] || LETTER_STROKE_DATA.en || LETTER_STROKE_DATA.te)
    .filter((item) => !item.excluded && item.active !== false)
  const currentItem = letterPool[letterIndex] || letterPool[0]
  const config = MULTILINGUAL_VOICE_CONFIG[lang] || MULTILINGUAL_VOICE_CONFIG.en || MULTILINGUAL_VOICE_CONFIG.te

  const totalLevels = letterPool.length
  const currentStage = getStageForLevel(letterIndex + 1)
  const checkpointData = loadLetterTraceCheckpointData(activeChild?.id, totalLevels)
  const highestUnlockedLevel = checkpointData.highestUnlockedLevel
  const hasSavedProgress = letterIndex > 0

  // Sync checkpoint on activeChild change
  useEffect(() => {
    const activeLetters = (LETTER_STROKE_DATA[lang] || LETTER_STROKE_DATA.en)
      .filter((item) => !item.excluded && item.active !== false)
    const data = loadLetterTraceCheckpointData(activeChild?.id, activeLetters.length)
    setLetterIndex(Math.min(data.levelIndex, Math.max(0, activeLetters.length - 1)))
    setScore(data.score)
    setStars(data.stars)
    setIsGrandVictory(false)
    isSavedRef.current = false
  }, [activeChild?.id, lang])

  // Save session on unmount if child navigates away
  useEffect(() => {
    return () => {
      if (!isSavedRef.current && sessionCompletedCount > 0) {
        isSavedRef.current = true
        tracker.saveCompletedSession({
          score,
          stars,
          levelsCompleted: sessionCompletedCount,
        })
      }
    }
  }, [score, stars, sessionCompletedCount, tracker])

  const handleBack = useCallback(() => {
    if (!isSavedRef.current && sessionCompletedCount > 0) {
      isSavedRef.current = true
      tracker.saveCompletedSession({
        score,
        stars,
        levelsCompleted: sessionCompletedCount,
      })
    }
    if (onFinish) onFinish()
    else navigate('/child/games')
  }, [sessionCompletedCount, score, stars, tracker, onFinish, navigate])

  const handleSelectStage = useCallback(
    ({ startLevelIndex }) => {
      saveLetterTraceCheckpoint(
        activeChild?.id,
        {
          levelIndex: startLevelIndex,
          score,
          stars,
        },
        TOTAL_LETTER_TRACE_LEVELS
      )
      setLetterIndex(startLevelIndex)
      handleClear()
      setStage('trace')
      setActiveModal(null)
    },
    [activeChild?.id, score, stars]
  )

  const handleRestart = useCallback(() => {
    resetLetterTraceCheckpoint(activeChild?.id)
    setLetterIndex(0)
    setScore(0)
    setStars(0)
    setCompletedLetters({})
    setSessionCompletedCount(0)
    setIsGrandVictory(false)
    handleClear()
    setStage('trace')
    setActiveModal(null)
  }, [activeChild?.id])

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
    const size = Math.max(rect.width, rect.height) || 320
    const width = rect.width || size
    const height = rect.height || size
    const dpr = window.devicePixelRatio || 1

    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [])

  // Redraw all drawn strokes, canonical guide tracks, and ghost point on canvas
  const redrawStrokes = useCallback((strokeList, ctx) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = ctx || canvas.getContext('2d')
    if (!context) return

    const rect = canvas.getBoundingClientRect()
    const width = rect.width || (canvas.width > 0 && canvas.width !== 300 ? canvas.width : 320)
    const height = rect.height || (canvas.height > 0 && canvas.height !== 300 ? canvas.height : 320)
    context.clearRect(0, 0, width, height)

    // 1. Draw canonical guide tracks (smooth soft dashed path with starting dots)
    const canonical = currentItem?.canonicalStrokes || []
    if (canonical.length > 0) {
      context.save()

      // Outer soft track bed for guide
      context.lineWidth = 14
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.strokeStyle = 'rgba(226, 232, 240, 0.7)'
      for (const cStroke of canonical) {
        if (!cStroke || cStroke.length === 0) continue
        const smoothPoints = cStroke.length > 2 ? getCatmullRomPoints(cStroke, 12) : cStroke
        context.beginPath()
        context.moveTo(smoothPoints[0].x * width, smoothPoints[0].y * height)
        for (let i = 1; i < smoothPoints.length; i++) {
          context.lineTo(smoothPoints[i].x * width, smoothPoints[i].y * height)
        }
        context.stroke()
      }

      // Center dashed guide line
      context.lineWidth = 3
      context.strokeStyle = '#94a3b8'
      context.setLineDash([5, 7])
      for (const cStroke of canonical) {
        if (!cStroke || cStroke.length === 0) continue
        const smoothPoints = cStroke.length > 2 ? getCatmullRomPoints(cStroke, 12) : cStroke
        context.beginPath()
        context.moveTo(smoothPoints[0].x * width, smoothPoints[0].y * height)
        for (let i = 1; i < smoothPoints.length; i++) {
          context.lineTo(smoothPoints[i].x * width, smoothPoints[i].y * height)
        }
        context.stroke()
      }

      // Start dots (showing where each stroke begins with sequence numbers)
      context.setLineDash([])
      for (let sIdx = 0; sIdx < canonical.length; sIdx++) {
        const cStroke = canonical[sIdx]
        if (!cStroke || cStroke.length === 0) continue
        const sx = cStroke[0].x * width
        const sy = cStroke[0].y * height
        const dotColor = sIdx === 0 ? '#3b82f6' : sIdx === 1 ? '#f59e0b' : sIdx === 2 ? '#10b981' : '#8b5cf6'

        // Soft outer glow
        context.beginPath()
        context.arc(sx, sy, 8, 0, Math.PI * 2)
        context.fillStyle = sIdx === 0 ? 'rgba(59, 130, 246, 0.25)' : 'rgba(245, 158, 11, 0.25)'
        context.fill()

        // Solid badge
        context.beginPath()
        context.arc(sx, sy, 5.5, 0, Math.PI * 2)
        context.fillStyle = dotColor
        context.fill()

        if (canonical.length > 1) {
          context.fillStyle = '#ffffff'
          context.font = 'bold 8px system-ui, sans-serif'
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          context.fillText(String(sIdx + 1), sx, sy + 0.5)
        }
      }

      context.restore()
    }

    // 2. Draw child's drawn strokes
    context.lineWidth = 14
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = theme.primaryColor || '#6366f1'
    context.fillStyle = theme.primaryColor || '#6366f1'

    for (const stroke of strokeList) {
      if (!stroke || stroke.length === 0) continue
      if (stroke.length === 1) {
        context.beginPath()
        context.arc(stroke[0].x, stroke[0].y, 7, 0, Math.PI * 2)
        context.fill()
        continue
      }
      context.beginPath()
      context.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length; i++) {
        context.lineTo(stroke[i].x, stroke[i].y)
      }
      context.stroke()
    }

    // 3. Draw ghost demonstration cursor if active
    if (ghostPointRef.current) {
      const { x, y } = ghostPointRef.current
      const px = x * width
      const py = y * height

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
  }, [currentItem, theme.primaryColor])

  useEffect(() => {
    setupCanvas()
    redrawStrokes(strokesRef.current)
    const handleResize = () => {
      setupCanvas()
      redrawStrokes(strokesRef.current)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setupCanvas, redrawStrokes, currentItem, stage])

  const getCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return { width: 320, height: 320, rect: { left: 0, top: 0, width: 320, height: 320 } }
    const rect = canvas.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) || (canvas.width > 0 && canvas.width !== 300 ? canvas.width : 320)
    return {
      width: rect.width || size,
      height: rect.height || size,
      rect,
    }
  }, [])

  // Pointer Event Handlers (touch, stylus, mouse unified with touch-action: none)
  const handlePointerDown = (e) => {
    if (isShowingGhost) stopGhostDemo()
    const canvas = canvasRef.current
    if (!canvas) return

    // Prevent page scrolling/zooming during drawing
    e.preventDefault()
    try {
      canvas.setPointerCapture?.(e.pointerId)
    } catch {
      // Safe fallback if pointer capture fails
    }

    const { width, height, rect } = getCanvasDimensions()
    const x = Math.max(0, Math.min(width, e.clientX - (rect.left || 0)))
    const y = Math.max(0, Math.min(height, e.clientY - (rect.top || 0)))

    setIsDrawing(true)
    currentStrokeRef.current = [{ x, y }]

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineWidth = 14
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = theme.primaryColor || '#6366f1'
      ctx.fillStyle = theme.primaryColor || '#6366f1'
      // Immediate circle mark so touch-down renders instant visual feedback
      ctx.beginPath()
      ctx.arc(x, y, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const handlePointerMove = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()

    const { width, height, rect } = getCanvasDimensions()
    const x = Math.max(0, Math.min(width, e.clientX - (rect.left || 0)))
    const y = Math.max(0, Math.min(height, e.clientY - (rect.top || 0)))

    // Skip sub-pixel micro-jitter duplicates
    const lastPt = currentStrokeRef.current[currentStrokeRef.current.length - 1]
    if (lastPt && Math.abs(lastPt.x - x) < 0.5 && Math.abs(lastPt.y - y) < 0.5) {
      return
    }

    currentStrokeRef.current.push({ x, y })

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineWidth = 14
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = theme.primaryColor || '#6366f1'
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const handlePointerUp = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (canvas && canvas.hasPointerCapture?.(e.pointerId)) {
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        // Safe release
      }
    }

    setIsDrawing(false)
    if (currentStrokeRef.current.length > 0) {
      const updated = [...strokesRef.current, [...currentStrokeRef.current]]
      setStrokes(updated)
      strokesRef.current = updated
      currentStrokeRef.current = []
      redrawStrokes(updated)
    }
  }

  // Undo Last Stroke
  const handleUndo = () => {
    if (strokesRef.current.length === 0) return
    const updated = strokesRef.current.slice(0, -1)
    setStrokes(updated)
    strokesRef.current = updated
    redrawStrokes(updated)
    setEvalFeedback('Removed last stroke. Keep going! ✍️')
  }

  // Clear Canvas
  const handleClear = () => {
    stopGhostDemo()
    setStrokes([])
    strokesRef.current = []
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
  const showGhostDemonstration = (customFeedback) => {
    stopGhostDemo()
    if (motionReduction) {
      if (customFeedback) {
        setEvalFeedback(customFeedback)
      } else {
        setEvalFeedback('Follow the dotted outline guide from top to bottom! 🌟')
      }
      return
    }

    setIsShowingGhost(true)
    if (customFeedback) {
      setEvalFeedback(customFeedback)
    } else {
      setEvalFeedback('Watch the glowing guide dot show how to draw! 💫')
    }

    const canonical = currentItem.canonicalStrokes || []
    if (canonical.length === 0) return

    // Flatten all canonical strokes into a timed animation trajectory
    const animPoints = []
    for (const stroke of canonical) {
      const smoothStroke = stroke.length > 2 ? getCatmullRomPoints(stroke, 8) : stroke
      for (let i = 0; i < smoothStroke.length - 1; i++) {
        const a = smoothStroke[i]
        const b = smoothStroke[i + 1]
        const steps = 6
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
        redrawStrokes(strokesRef.current)
        if (!customFeedback) {
          setEvalFeedback('Now it is your turn to trace it! ✍️')
        }
        return
      }

      ghostPointRef.current = animPoints[index]
      redrawStrokes(strokesRef.current)
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
    redrawStrokes(strokesRef.current)
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
    if (isEvaluatingRef.current) return
    isEvaluatingRef.current = true
    stopGhostDemo()
    const canvas = canvasRef.current
    if (!canvas) {
      isEvaluatingRef.current = false
      return
    }
    const { width, height } = getCanvasDimensions()

    setIsEvaluating(true)
    const normalized = normalizeStrokes(strokesRef.current, width, height)
    const outcome = evaluateChildTracing(normalized, currentItem.canonicalStrokes)
    setIsEvaluating(false)
    setLastEvalScore(outcome.score)

    if (outcome.passed) {
      const earnedScore = outcome.score || 100
      const newScore = score + earnedScore
      const newStars = stars + 1
      setScore(newScore)
      setStars(newStars)

      // Record successful attempt via session tracker
      tracker.recordAttempt(true, {
        roundScore: earnedScore,
        starsEarned: 1,
        xpEarned: 20,
      })

      // Mark letter completed in session state
      setCompletedLetters((prev) => ({ ...prev, [currentItem.id]: true }))
      const newCompletedCount = sessionCompletedCount + 1
      setSessionCompletedCount(newCompletedCount)

      // Save in-progress checkpoint
      const isFinal = lang === 'en' && letterIndex === totalLevels - 1
      if (isFinal) {
        saveLetterTraceCheckpoint(
          activeChild?.id,
          {
            isCompleted: true,
            score: newScore,
            stars: newStars,
          },
          totalLevels
        )
      } else {
        saveLetterTraceCheckpoint(
          activeChild?.id,
          {
            levelIndex: Math.min(letterIndex + 1, totalLevels - 1),
            score: newScore,
            stars: newStars,
            levelsCompleted: newCompletedCount,
          },
          totalLevels
        )
      }

      setEvalFeedback(outcome.encouragingFeedback)
      speakLanguageAudio({
        text: `Wonderful tracing! You drew the letter ${currentItem.letter}!`,
        lang: 'en',
        onEnd: () => {
          setStage('reveal')
          isEvaluatingRef.current = false
        },
      })
      // Fallback stage transition if TTS takes time or is offline
      setTimeout(() => {
        setStage('reveal')
        isEvaluatingRef.current = false
      }, 900)
    } else {
      tracker.recordAttempt(false, {
        roundScore: 0,
        starsEarned: 0,
        xpEarned: 5,
      })
      isEvaluatingRef.current = false
      setEvalFeedback(outcome.encouragingFeedback)
      speakLanguageAudio({
        text: outcome.encouragingFeedback,
        lang: 'en',
      })
      // Show ghost replay to guide the child while keeping the friendly message
      setTimeout(() => {
        showGhostDemonstration(outcome.encouragingFeedback)
      }, 400)
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
    if (isAdvancingRef.current) return
    isAdvancingRef.current = true

    handleClear()
    setHasSpoken(false)
    setMicStatus('ready')

    const nextIdx = letterIndex + 1
    if (lang === 'en' && nextIdx >= totalLevels) {
      // Completed final curriculum level! Show grand victory
      setIsGrandVictory(true)
      if (!isSavedRef.current) {
        isSavedRef.current = true
        tracker.saveCompletedSession({
          score,
          stars,
          levelsCompleted: totalLevels,
        })
      }
      isAdvancingRef.current = false
      return
    }

    setLetterIndex(nextIdx % letterPool.length)
    setStage('trace')
    setTimeout(() => {
      isAdvancingRef.current = false
    }, 300)
  }

  // Top Header Navigation Bar (Back, Game Hub, Stages, Restart, Stage/Level info, Score, Stars)
  const renderTopHeader = () => (
    <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4" data-testid="trace-top-header">
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="page-back-btn"
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 shadow-xs transition-all cursor-pointer active:scale-95"
          aria-label="Back to Games"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <button
          type="button"
          data-testid="trace-hub-btn"
          onClick={() => setActiveModal('entry')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-400/50 hover:border-emerald-500 text-emerald-700 font-extrabold text-xs shadow-xs transition-all cursor-pointer active:scale-95 hover:bg-emerald-50"
          title="Open Mission Hub"
        >
          <span>🎮</span>
          <span>Game Hub</span>
        </button>

        <button
          type="button"
          data-testid="trace-stages-btn"
          onClick={() => setActiveModal('stages')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-400/50 hover:border-emerald-500 text-emerald-700 font-extrabold text-xs shadow-xs transition-all cursor-pointer active:scale-95 hover:bg-emerald-50"
          title="Choose Stage Roadmap"
        >
          <span>🗺️</span>
          <span>Stages</span>
        </button>

        <button
          type="button"
          data-testid="trace-restart-btn"
          onClick={() => setActiveModal('restartConfirm')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-600 font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
          title="Start Over from Level 1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Restart</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div
          data-testid="trace-stage-indicator"
          className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
        >
          <span data-testid="trace-level-text">Level {letterIndex + 1}/{totalLevels}</span>
          <span className="text-emerald-400">•</span>
          <span data-testid="trace-stage-text">{currentStage?.title || 'Foundational'}</span>
        </div>

        <div
          data-testid="trace-score-badge"
          className="px-2.5 py-1 rounded-xl bg-slate-900 text-emerald-300 font-bold text-xs flex items-center gap-1 shadow-xs whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{score} PTS</span>
        </div>

        <div
          data-testid="trace-stars-badge"
          className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1 shadow-xs whitespace-nowrap"
        >
          <span>⭐</span>
          <span>{stars}</span>
        </div>
      </div>
    </div>
  )

  const renderProgressionModal = () => {
    if (!activeModal) return null
    return (
      <GameProgressionHub
        mode="modal"
        initialView={activeModal}
        gameTitle="Letter Trace"
        gameIcon="✏️"
        gameBadge="✏️ Letter Trace"
        gameBadgeTestId="letter-trace-badge"
        instructions="Trace the glowing letter strokes on your screen, hear how they sound, and practice speaking!"
        stages={LETTER_TRACE_STAGES}
        currentLevel={letterIndex + 1}
        highestUnlockedLevel={highestUnlockedLevel}
        hasSavedProgress={hasSavedProgress}
        theme={theme}
        onStart={() => setActiveModal(null)}
        onResume={() => setActiveModal(null)}
        onSelectStage={handleSelectStage}
        onRestart={handleRestart}
        onClose={() => setActiveModal(null)}
      />
    )
  }

  // Render Session Progress Strip (Screen 7: Non-anxious dot tracker)
  const renderProgressStrip = () => {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/80 rounded-2xl border border-slate-200/80 mb-4" data-testid="session-progress-strip">
        <div className="flex items-center gap-2 overflow-x-auto max-w-[70%]">
          <span className="text-xs font-extrabold text-slate-600 whitespace-nowrap">Letter {letterIndex + 1} of {totalLevels}</span>
          <div className="flex gap-1.5 ml-2">
            {letterPool.map((item, idx) => {
              const isCurrent = idx === letterIndex
              const isDone = completedLetters[item.id] || idx < letterIndex
              return (
                <div
                  key={item.id}
                  className={`w-3.5 h-3.5 rounded-full transition-all shrink-0 flex items-center justify-center text-[8px] font-bold ${
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
        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
          {sessionCompletedCount} explored today
        </span>
      </div>
    )
  }

  // ============================================================================
  // GRAND VICTORY SCREEN (Level 25 complete!)
  // ============================================================================
  if (isGrandVictory) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6" data-testid="letter-trace-victory-modal">
        {renderTopHeader()}
        {renderProgressionModal()}
        <div className="bg-white rounded-3xl border-2 border-emerald-400 p-8 shadow-2xl text-center">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-5xl mb-4 shadow-inner">
            🏆
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-800 mb-2">
            Letter Trace Champion! 🎉
          </h1>
          <p className="text-sm font-semibold text-slate-600 mb-6 max-w-md mx-auto">
            Incredible writing! You mastered all 25 letter tracing levels across all 5 stages!
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
            <div className="p-3 rounded-2xl bg-slate-900 text-emerald-300">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total Score</div>
              <div className="font-display font-black text-2xl">{score} PTS</div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Stars Earned</div>
              <div className="font-display font-black text-2xl">⭐ {stars}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <button
              type="button"
              data-testid="play-again-btn"
              onClick={handleRestart}
              className="flex-1 py-4 px-6 rounded-2xl bg-emerald-500 border-b-4 border-emerald-700 text-white font-display font-extrabold text-base flex items-center justify-center gap-2 hover:bg-emerald-600 min-h-[52px] active:border-b-0 active:translate-y-1 shadow-lg cursor-pointer"
            >
              <span>Play Again</span>
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              type="button"
              data-testid="victory-back-btn"
              onClick={handleBack}
              className="flex-1 py-4 px-6 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-display font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 min-h-[52px] cursor-pointer"
            >
              <HomeIcon className="w-4 h-4" /> Back to Games
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // SCREEN 2: LANGUAGE & LETTER PICKER
  // ============================================================================
  if (stage === 'picker') {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6" data-testid="trace-and-speak-game">
        {renderTopHeader()}
        {renderProgressionModal()}
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
          <div className="grid grid-cols-5 gap-3 max-h-[360px] overflow-y-auto p-1">
            {letterPool.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setLetterIndex(idx)
                  handleClear()
                  setStage('trace')
                }}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center border-2 transition-all min-h-[64px] cursor-pointer ${
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
        {renderTopHeader()}
        {renderProgressionModal()}
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
        {renderTopHeader()}
        {renderProgressionModal()}
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
    const isStageEnd = isStageBoundary(letterIndex + 1)
    const stageNum = Math.floor((letterIndex + 1) / 5)

    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6" data-testid="trace-and-speak-game">
        {renderTopHeader()}
        {renderProgressionModal()}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl text-center">
          <div className="inline-block p-4 rounded-3xl bg-amber-50 border border-amber-200 mb-4">
            <span className="text-6xl block">{isStageEnd ? '🌟' : theme.badgeIcon || '⭐'}</span>
          </div>

          <h1 className="font-display font-black text-3xl text-slate-800 mb-2">
            Awesome Explorer! 🎉
          </h1>
          <p className="text-sm font-semibold text-slate-600 mb-4">
            You traced and spoke <strong>{currentItem.letter} ({currentItem.word})</strong>!
          </p>

          {isStageEnd && (
            <div
              data-testid="stage-cleared-banner"
              className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-300 text-emerald-900 mb-6 max-w-sm mx-auto shadow-sm"
            >
              <div className="font-display font-black text-lg">Stage {stageNum} Cleared! 🚀</div>
              <div className="text-xs font-bold text-emerald-700 mt-1">
                Advancing to Stage {stageNum + 1}: {LETTER_TRACE_STAGES[stageNum]?.title}…
              </div>
            </div>
          )}

          <div className="p-4 bg-brand-50 rounded-2xl border border-brand-200 max-w-xs mx-auto mb-8">
            <div className="text-xs font-bold text-brand-700">{theme.mascot} cheers:</div>
            <div className="text-sm font-extrabold text-slate-800 mt-1">"{theme.rewardTitle || 'Golden Star'} earned!"</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <button
              type="button"
              data-testid="celebration-next-btn"
              onClick={handleNextLetter}
              className="flex-1 py-4 px-6 rounded-2xl bg-emerald-500 border-b-4 border-emerald-700 text-white font-display font-extrabold text-base flex items-center justify-center gap-2 hover:bg-emerald-600 min-h-[52px] active:border-b-0 active:translate-y-1 shadow-lg cursor-pointer"
            >
              Next Letter <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-4 px-6 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-display font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 min-h-[52px] cursor-pointer"
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
      {renderTopHeader()}
      {renderProgressionModal()}
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
            <div className="relative flex flex-col items-center justify-center p-2 bg-slate-50 rounded-3xl border-2 border-dashed border-brand-200 w-full max-w-[320px] aspect-square shadow-inner select-none touch-none">
              
              {/* Target Letter Background Guide Glyph */}
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-slate-300 font-extrabold text-9xl leading-none opacity-25 font-display"
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
                className="w-full h-full touch-none cursor-crosshair relative z-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-400 select-none"
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

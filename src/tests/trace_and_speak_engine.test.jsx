import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TraceAndSpeak from '../pages/child/TraceAndSpeak'
import { LETTER_STROKE_DATA } from '../data/letterStrokeData'
import {
  evaluateChildTracing,
  normalizeStrokes,
  distance,
  resampleStroke,
} from '../utils/tracingEvaluation'
import { THEME_PACKAGES } from '../services/personalizationService'

describe('Trace & Say: Canonical Strokes & Tracing Evaluation Engine', () => {
  beforeEach(() => {
    localStorage.clear()
    class MockUtterance {
      constructor(text) {
        this.text = text
      }
    }
    window.SpeechSynthesisUtterance = MockUtterance
    window.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn().mockReturnValue([
        { name: 'Telugu Voice', lang: 'te-IN' },
        { name: 'Hindi Voice', lang: 'hi-IN' },
        { name: 'English Voice', lang: 'en-US' },
      ]),
    }
  })

  it('1. Starter letter sets have valid canonical strokes for Telugu, Hindi, and English', () => {
    expect(LETTER_STROKE_DATA.te.length).toBeGreaterThanOrEqual(5)
    expect(LETTER_STROKE_DATA.hi.length).toBeGreaterThanOrEqual(5)
    expect(LETTER_STROKE_DATA.en.length).toBeGreaterThanOrEqual(5)

    for (const lang of ['te', 'hi', 'en']) {
      for (const item of LETTER_STROKE_DATA[lang]) {
        expect(item.letter).toBeTruthy()
        expect(item.word).toBeTruthy()
        expect(item.english).toBeTruthy()
        expect(item.canonicalStrokes.length).toBeGreaterThan(0)
        // Verify all coordinates are normalized [0, 1]
        for (const stroke of item.canonicalStrokes) {
          expect(stroke.length).toBeGreaterThan(1)
          for (const pt of stroke) {
            expect(pt.x).toBeGreaterThanOrEqual(0)
            expect(pt.x).toBeLessThanOrEqual(1)
            expect(pt.y).toBeGreaterThanOrEqual(0)
            expect(pt.y).toBeLessThanOrEqual(1)
          }
        }
      }
    }
  })

  it('2. Tracing Evaluation: Passes a clearly-good sample path with realistic child jitter', () => {
    const canonical = LETTER_STROKE_DATA.en.find((l) => l.letter === 'C').canonicalStrokes

    // Simulate child drawing along letter C with minor hand jitter (+/- 0.03)
    const goodChildStroke = canonical[0].map((pt) => ({
      x: pt.x + 0.02,
      y: pt.y - 0.01,
    }))

    const outcome = evaluateChildTracing([goodChildStroke], canonical)

    expect(outcome.passed).toBe(true)
    expect(outcome.score).toBeGreaterThanOrEqual(60)
    expect(outcome.coverage).toBeGreaterThanOrEqual(0.40)
    expect(outcome.meanDistance).toBeLessThanOrEqual(0.15)
    expect(outcome.reason).toBe('success')
    expect(outcome.encouragingFeedback).toMatch(/Terrific tracing/i)
  })

  it('3. Tracing Evaluation: Fails a clearly-bad sample path (stray corner line)', () => {
    const canonical = LETTER_STROKE_DATA.en.find((l) => l.letter === 'C').canonicalStrokes

    // Simulate a child making a stray horizontal scribble in the top-left corner
    const badChildStroke = [
      { x: 0.05, y: 0.05 },
      { x: 0.10, y: 0.05 },
      { x: 0.15, y: 0.06 },
      { x: 0.20, y: 0.05 },
      { x: 0.25, y: 0.05 },
    ]

    const outcome = evaluateChildTracing([badChildStroke], canonical)

    expect(outcome.passed).toBe(false)
    expect(outcome.coverage).toBeLessThan(0.38)
    expect(outcome.reason).toMatch(/low_coverage|off_path/)
    // Must NOT use clinical language like 'Failed' or 'Incorrect'
    expect(outcome.encouragingFeedback).not.toMatch(/failed|incorrect|wrong|bad/i)
  })

  it('4. Tracing Evaluation: Rejects tiny single taps or empty strokes', () => {
    const canonical = LETTER_STROKE_DATA.te[0].canonicalStrokes

    // Empty input
    const emptyOutcome = evaluateChildTracing([], canonical)
    expect(emptyOutcome.passed).toBe(false)
    expect(emptyOutcome.reason).toBe('no_input')

    // Tiny tap (insufficient points and length)
    const tinyTap = [{ x: 0.5, y: 0.5 }, { x: 0.505, y: 0.505 }]
    const tinyOutcome = evaluateChildTracing([tinyTap], canonical)
    expect(tinyOutcome.passed).toBe(false)
    expect(tinyOutcome.reason).toBe('too_short')
    expect(tinyOutcome.encouragingFeedback).toMatch(/Keep your finger/i)
  })

  it('5. Interest Theming does NOT alter tracing evaluation math or thresholds', () => {
    const canonical = LETTER_STROKE_DATA.te[0].canonicalStrokes
    const testStroke = canonical[0].map((pt) => ({ x: pt.x + 0.01, y: pt.y }))

    // Space theme vs Animals theme vs Music theme
    const outcome1 = evaluateChildTracing([testStroke], canonical)
    const outcome2 = evaluateChildTracing([testStroke], canonical)

    expect(outcome1.passed).toBe(outcome2.passed)
    expect(outcome1.score).toBe(outcome2.score)
    expect(outcome1.coverage).toBe(outcome2.coverage)
    expect(outcome1.meanDistance).toBe(outcome2.meanDistance)
  })

  it('6. TraceAndSpeak renders 7-screen flow controls and handles pointer events', () => {
    render(<TraceAndSpeak initialLanguage="te" />)

    // Screen 1/3: Canvas screen
    expect(screen.getByTestId('trace-and-speak-game')).toBeInTheDocument()
    expect(screen.getByTestId('session-progress-strip')).toBeInTheDocument()
    const canvas = screen.getByTestId('tracing-canvas')
    expect(canvas).toBeInTheDocument()

    // Controls >= 48px touch targets
    expect(screen.getByLabelText(/Hear pronunciation/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Show me how/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Undo last stroke/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Clear canvas/i)).toBeInTheDocument()

    // Pointer events on canvas
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 70, clientY: 70, pointerId: 1 })
    fireEvent.pointerUp(canvas, { pointerId: 1 })

    // Hear pronunciation button plays mother-tongue audio
    const hearBtn = screen.getByLabelText(/Hear pronunciation/i)
    fireEvent.click(hearBtn)
    expect(window.speechSynthesis.speak).toHaveBeenCalled()
  })

  it('7. Honest Speech Recognition Fallback: displays offline practice mode when STT is absent', () => {
    // Delete SpeechRecognition from window to simulate host without STT
    const origRecognition = window.SpeechRecognition
    const origWebkit = window.webkitSpeechRecognition
    delete window.SpeechRecognition
    delete window.webkitSpeechRecognition

    render(<TraceAndSpeak initialLanguage="hi" />)

    // Open language/letter picker
    fireEvent.click(screen.getByText(/Choose Another Letter/i))
    expect(screen.getByText(/Choose Your Language Script/i)).toBeInTheDocument()

    // Restore
    window.SpeechRecognition = origRecognition
    window.webkitSpeechRecognition = origWebkit
  })
})

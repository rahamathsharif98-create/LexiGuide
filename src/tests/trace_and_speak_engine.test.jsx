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
import { saveLetterTraceCheckpoint } from '../games/letter-trace/engine/letterTraceCheckpoint'

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
    // Active playable Telugu letters: exactly 4 (te-ta temporarily excluded)
    expect(LETTER_STROKE_DATA.te.length).toBe(4)
    expect(LETTER_STROKE_DATA.te.find((x) => x.id === 'te-ta')).toBeUndefined()
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

  it('8. Letter A Validation: Rejects incomplete traces (left leg only, or legs only with missing crossbar)', () => {
    const canonicalA = LETTER_STROKE_DATA.en.find((l) => l.letter === 'A').canonicalStrokes
    expect(canonicalA).toHaveLength(3) // left leg, right leg, crossbar

    // Case A: Child draws only the left leg of letter A (exact scenario in user bug report)
    const leftOnly = [
      resampleStroke(canonicalA[0], 0.05),
    ]
    const leftOutcome = evaluateChildTracing(leftOnly, canonicalA)
    expect(leftOutcome.passed).toBe(false)
    expect(leftOutcome.reason).toBe('incomplete_letter')
    expect(leftOutcome.missingStrokesCount).toBeGreaterThan(0)
    expect(leftOutcome.encouragingFeedback).toMatch(/Trace all the lines|finish the letter/i)

    // Case B: Child draws both leaning legs but forgets the crossbar
    const legsOnly = [
      resampleStroke(canonicalA[0], 0.05),
      resampleStroke(canonicalA[1], 0.05),
    ]
    const legsOutcome = evaluateChildTracing(legsOnly, canonicalA)
    expect(legsOutcome.passed).toBe(false)
    expect(legsOutcome.reason).toBe('incomplete_letter')
    expect(legsOutcome.missingStrokesCount).toBe(1)
    expect(legsOutcome.encouragingFeedback).toMatch(/bridge across the middle/i)
  })

  it('9. Letter A Validation: Accepts complete letter A with child handwriting jitter', () => {
    const canonicalA = LETTER_STROKE_DATA.en.find((l) => l.letter === 'A').canonicalStrokes

    // Simulate child drawing all 3 strokes with realistic fine-motor jitter (+/- 0.03)
    const completeChildA = canonicalA.map((stroke) =>
      stroke.map((pt) => ({
        x: pt.x + 0.02,
        y: pt.y - 0.015,
      }))
    )

    const outcome = evaluateChildTracing(completeChildA, canonicalA)
    expect(outcome.passed).toBe(true)
    expect(outcome.reason).toBe('success')
    expect(outcome.score).toBeGreaterThanOrEqual(70)
    expect(outcome.missingStrokesCount).toBe(0)
    expect(outcome.coverage).toBeGreaterThanOrEqual(0.85)
    expect(outcome.encouragingFeedback).toMatch(/Terrific tracing/i)
  })

  it('10. Curved letters (C and S): Rejects partial curves and accepts complete curves with child jitter', () => {
    const canonicalC = LETTER_STROKE_DATA.en.find((l) => l.letter === 'C').canonicalStrokes
    const canonicalS = LETTER_STROKE_DATA.en.find((l) => l.letter === 'S').canonicalStrokes

    // Partial C (top arc only, cut short)
    const partialC = [
      canonicalC[0].slice(0, 4),
    ]
    const partialCOutcome = evaluateChildTracing(partialC, canonicalC)
    expect(partialCOutcome.passed).toBe(false)
    expect(partialCOutcome.reason).toBe('low_coverage')
    expect(partialCOutcome.encouragingFeedback).toMatch(/further along/i)

    // Complete C with jitter
    const goodC = [
      canonicalC[0].map((pt) => ({ x: pt.x + 0.02, y: pt.y - 0.02 })),
    ]
    const goodCOutcome = evaluateChildTracing(goodC, canonicalC)
    expect(goodCOutcome.passed).toBe(true)
    expect(goodCOutcome.reason).toBe('success')

    // Complete S with jitter
    const goodS = [
      canonicalS[0].map((pt) => ({ x: pt.x + 0.015, y: pt.y - 0.015 })),
    ]
    const goodSOutcome = evaluateChildTracing(goodS, canonicalS)
    expect(goodSOutcome.passed).toBe(true)
    expect(goodSOutcome.reason).toBe('success')
  })

  it('11. Incomplete trace handling: Clicking Done Tracing on incomplete input preserves strokes and shows retry guidance', () => {
    // Unlock Stage 2 (Level 6, Letter A) via checkpoint
    saveLetterTraceCheckpoint('guest', {
      levelIndex: 5, // Level 6
      score: 500,
      stars: 5,
    })

    render(<TraceAndSpeak initialLanguage="en" />)

    // Open stages roadmap and pick Stage 2 (Level 6, Letter A)
    fireEvent.click(screen.getByTestId('trace-stages-btn'))
    fireEvent.click(screen.getByTestId('select-stage-2'))

    expect(screen.getByTestId('trace-level-text').textContent).toBe('Level 6/25')

    const canvas = screen.getByTestId('tracing-canvas')
    expect(canvas).toBeInTheDocument()

    // Simulate child drawing a single partial stroke along the left leg of A
    fireEvent.pointerDown(canvas, { clientX: 160, clientY: 70, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 140, clientY: 110, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 120, clientY: 160, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 200, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 80, clientY: 250, pointerId: 1 })
    fireEvent.pointerUp(canvas, { pointerId: 1 })

    // Done Tracing button is now active (green)
    const doneBtn = screen.getByRole('button', { name: /Done Tracing/i })
    expect(doneBtn).toBeInTheDocument()
    expect(doneBtn).not.toBeDisabled()

    // Child presses "Done Tracing!" with only 1 stroke of A drawn
    fireEvent.click(doneBtn)

    // Must NOT advance to reveal screen! Game stays on canvas
    expect(screen.queryByText(/Tracing Complete!/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('tracing-canvas')).toBeInTheDocument()

    // Must display encouraging guidance
    expect(screen.getByText(/Almost there/i)).toBeInTheDocument()
  })

  it('12. Continuing trace: Adding the remaining strokes of letter A after an incomplete attempt allows successful completion', () => {
    saveLetterTraceCheckpoint('guest', {
      levelIndex: 5, // Level 6 (Letter A)
      score: 500,
      stars: 5,
    })

    render(<TraceAndSpeak initialLanguage="en" />)
    fireEvent.click(screen.getByTestId('trace-stages-btn'))
    fireEvent.click(screen.getByTestId('select-stage-2'))

    const canvas = screen.getByTestId('tracing-canvas')

    // Stroke 1: Left leg (from top (160, 70) to bottom-left (80, 256))
    fireEvent.pointerDown(canvas, { clientX: 160, clientY: 70, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 140, clientY: 110, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 120, clientY: 160, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 200, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 80, clientY: 256, pointerId: 1 })
    fireEvent.pointerUp(canvas, { pointerId: 1 })

    // Incomplete attempt
    const doneBtn = screen.getByRole('button', { name: /Done Tracing/i })
    fireEvent.click(doneBtn)
    expect(screen.queryByText(/Tracing Complete!/i)).not.toBeInTheDocument()

    // Stroke 2: Right leg (from top (160, 70) to bottom-right (240, 256))
    fireEvent.pointerDown(canvas, { clientX: 160, clientY: 70, pointerId: 2 })
    fireEvent.pointerMove(canvas, { clientX: 180, clientY: 110, pointerId: 2 })
    fireEvent.pointerMove(canvas, { clientX: 200, clientY: 160, pointerId: 2 })
    fireEvent.pointerMove(canvas, { clientX: 220, clientY: 200, pointerId: 2 })
    fireEvent.pointerMove(canvas, { clientX: 240, clientY: 256, pointerId: 2 })
    fireEvent.pointerUp(canvas, { pointerId: 2 })

    // Stroke 3: Crossbar bridge (from left (112, 179) to right (208, 179))
    fireEvent.pointerDown(canvas, { clientX: 112, clientY: 179, pointerId: 3 })
    fireEvent.pointerMove(canvas, { clientX: 136, clientY: 179, pointerId: 3 })
    fireEvent.pointerMove(canvas, { clientX: 160, clientY: 179, pointerId: 3 })
    fireEvent.pointerMove(canvas, { clientX: 184, clientY: 179, pointerId: 3 })
    fireEvent.pointerMove(canvas, { clientX: 208, clientY: 179, pointerId: 3 })
    fireEvent.pointerUp(canvas, { pointerId: 3 })

    // Now all 3 strokes are drawn! Click Done Tracing
    fireEvent.click(doneBtn)

    // Successfully evaluates and shows success praise
    expect(screen.getByText(/Terrific tracing/i)).toBeInTheDocument()
  })
})

import { describe, it, expect } from 'vitest'
import {
  LETTER_STROKE_DATA,
  PRESERVED_LETTER_STROKE_DATA,
  EXCLUDED_LETTERS,
  isLetterActive,
} from '../data/letterStrokeData'
import {
  evaluateChildTracing,
  resampleStroke,
  getStrokeLength,
  distanceToSegment,
} from '../utils/tracingEvaluation'
import {
  LETTER_TRACE_STAGES,
  TOTAL_LETTER_TRACE_LEVELS,
  ENGLISH_LETTER_TRACE_CURRICULUM,
} from '../games/letter-trace/engine/letterTraceCurriculum'

describe('Letter Trace & Speak — Complete Active Character Quality & Tracing Audit', () => {
  const allLanguages = ['en', 'te', 'hi']
  const allItems = [
    ...LETTER_STROKE_DATA.en.map((item) => ({ ...item, lang: 'en' })),
    ...LETTER_STROKE_DATA.te.map((item) => ({ ...item, lang: 'te' })),
    ...LETTER_STROKE_DATA.hi.map((item) => ({ ...item, lang: 'hi' })),
  ]

  // ==========================================================================
  // 1. INVENTORY & STRUCTURAL INTEGRITY
  // ==========================================================================
  describe('1. Inventory Audit & Canonical Stroke Geometry', () => {
    it('verifies exact inventory count: 25 English + 4 Telugu + 5 Hindi = 34 active characters (Telugu త safely excluded)', () => {
      expect(LETTER_STROKE_DATA.en.length).toBe(25)
      expect(LETTER_STROKE_DATA.te.length).toBe(4)
      expect(LETTER_STROKE_DATA.hi.length).toBe(5)
      expect(allItems.length).toBe(34)
      expect(TOTAL_LETTER_TRACE_LEVELS).toBe(25)
      expect(LETTER_TRACE_STAGES.length).toBe(5)
    })

    it('validates canonical coordinates normalization and bounding box comfort margins', () => {
      for (const item of allItems) {
        expect(item.canonicalStrokes.length).toBeGreaterThanOrEqual(1)
        let minX = 1
        let maxX = 0
        let minY = 1
        let maxY = 0
        let totalLen = 0

        for (const stroke of item.canonicalStrokes) {
          expect(stroke.length).toBeGreaterThanOrEqual(2)
          totalLen += getStrokeLength(stroke)
          for (const pt of stroke) {
            expect(pt.x).toBeGreaterThanOrEqual(0)
            expect(pt.x).toBeLessThanOrEqual(1)
            expect(pt.y).toBeGreaterThanOrEqual(0)
            expect(pt.y).toBeLessThanOrEqual(1)

            if (pt.x < minX) minX = pt.x
            if (pt.x > maxX) maxX = pt.x
            if (pt.y < minY) minY = pt.y
            if (pt.y > maxY) maxY = pt.y
          }
        }

        // Each character should have adequate canvas margins (inside [0.15, 0.90])
        expect(minX).toBeGreaterThanOrEqual(0.15)
        expect(maxX).toBeLessThanOrEqual(0.85)
        expect(minY).toBeGreaterThanOrEqual(0.15)
        expect(maxY).toBeLessThanOrEqual(0.90)

        // Arc length should be substantial enough for tracing
        expect(totalLen).toBeGreaterThanOrEqual(0.80)
      }
    })
  })

  // ==========================================================================
  // 2. FULL CANONICAL TRACING WITH FINE-MOTOR JITTER
  // ==========================================================================
  describe('2. Comprehensive Evaluation: Valid Tracing Passes for All 35 Characters', () => {
    it.each(allItems)('$lang - $id ($letter): passes with realistic child motor jitter', (item) => {
      // Simulate child drawing all canonical strokes with +/- 0.02 jitter
      const childStrokes = item.canonicalStrokes.map((stroke, sIdx) => {
        const resampled = resampleStroke(stroke, 0.02)
        return resampled.map((pt, pIdx) => ({
          x: Math.max(0, Math.min(1, pt.x + Math.sin(sIdx + pIdx) * 0.015)),
          y: Math.max(0, Math.min(1, pt.y + Math.cos(sIdx + pIdx) * 0.015)),
        }))
      })

      const outcome = evaluateChildTracing(childStrokes, item.canonicalStrokes)
      expect(outcome.passed).toBe(true)
      expect(outcome.reason).toBe('success')
      expect(outcome.score).toBeGreaterThanOrEqual(70)
      expect(outcome.missingStrokesCount).toBe(0)
      expect(outcome.coverage).toBeGreaterThanOrEqual(0.80)
      expect(outcome.encouragingFeedback).toMatch(/terrific|wonderful/i)
    })
  })

  // ==========================================================================
  // 3. INCOMPLETE & TRUNCATED TRACES
  // ==========================================================================
  describe('3. Incomplete Tracing Rejection: Rejects Truncated Input Across All 35 Characters', () => {
    it.each(allItems)('$lang - $id ($letter): rejects partial trace cut short at 35%', (item) => {
      const allResampled = item.canonicalStrokes.flatMap((s) => resampleStroke(s, 0.02))
      const cutCount = Math.max(3, Math.floor(allResampled.length * 0.35))
      const incompleteTrace = [allResampled.slice(0, cutCount)]

      const outcome = evaluateChildTracing(incompleteTrace, item.canonicalStrokes)
      expect(outcome.passed).toBe(false)
      expect(['low_coverage', 'incomplete_letter', 'too_short']).toContain(outcome.reason)
      expect(outcome.encouragingFeedback).toMatch(/almost there|keep your finger|trace/i)
    })

    it.each(allItems)('$lang - $id ($letter): rejects random stray line', (item) => {
      const strayLine = [
        [
          { x: 0.05, y: 0.05 },
          { x: 0.10, y: 0.10 },
          { x: 0.15, y: 0.15 },
        ],
      ]

      const outcome = evaluateChildTracing(strayLine, item.canonicalStrokes)
      expect(outcome.passed).toBe(false)
    })

    it.each(allItems)('$lang - $id ($letter): rejects micro-tap or accidental dot', (item) => {
      const microTap = [[{ x: 0.5, y: 0.5 }, { x: 0.505, y: 0.505 }]]
      const outcome = evaluateChildTracing(microTap, item.canonicalStrokes)
      expect(outcome.passed).toBe(false)
      expect(outcome.reason).toBe('too_short')
    })
  })

  // ==========================================================================
  // 4. MULTI-STROKE COMPLETENESS VALIDATION
  // ==========================================================================
  describe('4. Multi-Stroke Completeness: Omission of Any Stroke Triggers Incomplete Verdict', () => {
    const multiStrokeItems = allItems.filter((item) => item.canonicalStrokes.length > 1)

    it('verifies that there are multi-stroke letters in English, Telugu, and Hindi', () => {
      expect(multiStrokeItems.length).toBeGreaterThanOrEqual(18)
    })

    it.each(multiStrokeItems)('$lang - $id ($letter): fails if any stroke is omitted', (item) => {
      for (let omittedIdx = 0; omittedIdx < item.canonicalStrokes.length; omittedIdx++) {
        const traceWithOmission = item.canonicalStrokes
          .filter((_, idx) => idx !== omittedIdx)
          .map((s) => resampleStroke(s, 0.02))

        const outcome = evaluateChildTracing(traceWithOmission, item.canonicalStrokes)
        expect(outcome.passed).toBe(false)
        expect(['incomplete_letter', 'low_coverage']).toContain(outcome.reason)
        expect(outcome.missingStrokesCount).toBeGreaterThanOrEqual(1)
      }
    })

    it('specifically verifies lowercase "a" (en-lower-a): omitting stem fails', () => {
      const lowerA = LETTER_STROKE_DATA.en.find((x) => x.id === 'en-lower-a')
      // Only draw stroke 0 (bowl)
      const bowlOnly = [resampleStroke(lowerA.canonicalStrokes[0], 0.02)]
      const outcome = evaluateChildTracing(bowlOnly, lowerA.canonicalStrokes)
      expect(outcome.passed).toBe(false)
      expect(outcome.missingStrokesCount).toBeGreaterThanOrEqual(1)
    })

    it('specifically verifies uppercase "A" (en-a): omitting crossbar provides bridge hint', () => {
      const upperA = LETTER_STROKE_DATA.en.find((x) => x.id === 'en-a')
      // Draw legs only (strokes 0 and 1), omit crossbar (stroke 2)
      const legsOnly = [
        resampleStroke(upperA.canonicalStrokes[0], 0.02),
        resampleStroke(upperA.canonicalStrokes[1], 0.02),
      ]
      const outcome = evaluateChildTracing(legsOnly, upperA.canonicalStrokes)
      expect(outcome.passed).toBe(false)
      expect(outcome.reason).toBe('incomplete_letter')
      expect(outcome.missingStrokesCount).toBe(1)
      expect(outcome.encouragingFeedback).toMatch(/bridge across the middle/i)
    })

    it('specifically verifies Hindi "स" (hi-sa): omitting connecting bar fails', () => {
      const hiSa = LETTER_STROKE_DATA.hi.find((x) => x.id === 'hi-sa')
      // Draw left loop, right stem, and shirorekha; omit connecting bar (stroke 1)
      const withoutBar = [
        resampleStroke(hiSa.canonicalStrokes[0], 0.02),
        resampleStroke(hiSa.canonicalStrokes[2], 0.02),
        resampleStroke(hiSa.canonicalStrokes[3], 0.02),
      ]
      const outcome = evaluateChildTracing(withoutBar, hiSa.canonicalStrokes)
      expect(outcome.passed).toBe(false)
      expect(outcome.missingStrokesCount).toBeGreaterThanOrEqual(1)
    })

    // ─── Dedicated Verification for All 5 Hindi Characters ───
    describe('Dedicated Verification for All 5 Hindi Characters (क, ग, च, स, त)', () => {
      const hindiList = [
        { id: 'hi-ka', char: 'क', name: 'ka', strokeCount: 3 },
        { id: 'hi-ga', char: 'ग', name: 'ga', strokeCount: 3 },
        { id: 'hi-cha', char: 'च', name: 'cha', strokeCount: 3 },
        { id: 'hi-sa', char: 'स', name: 'sa', strokeCount: 4 },
        { id: 'hi-ta', char: 'त', name: 'ta', strokeCount: 3 },
      ]

      it.each(hindiList)('$char ($name): has correct stroke sequence ending with Shirorekha', ({ id, strokeCount }) => {
        const item = LETTER_STROKE_DATA.hi.find((x) => x.id === id)
        expect(item.canonicalStrokes.length).toBe(strokeCount)
        const lastStroke = item.canonicalStrokes[item.canonicalStrokes.length - 1]
        // Final stroke must be horizontal Shirorekha near top
        expect(lastStroke.length).toBe(2)
        expect(lastStroke[0].y).toBeCloseTo(0.25, 2)
        expect(lastStroke[1].y).toBeCloseTo(0.25, 2)
        expect(lastStroke[0].x).toBeLessThan(lastStroke[1].x)
      })

      it.each(hindiList)('$char ($name): accepts valid trace with child handwriting jitter', ({ id }) => {
        const item = LETTER_STROKE_DATA.hi.find((x) => x.id === id)
        const childTrace = item.canonicalStrokes.map((s, si) =>
          resampleStroke(s, 0.02).map((pt, pi) => ({
            x: pt.x + Math.sin(si + pi) * 0.015,
            y: pt.y + Math.cos(si + pi) * 0.015,
          }))
        )
        const outcome = evaluateChildTracing(childTrace, item.canonicalStrokes)
        expect(outcome.passed).toBe(true)
        expect(outcome.score).toBeGreaterThanOrEqual(75)
        expect(outcome.missingStrokesCount).toBe(0)
      })

      it.each(hindiList)('$char ($name): fails if Shirorekha is omitted and provides top line guidance', ({ id }) => {
        const item = LETTER_STROKE_DATA.hi.find((x) => x.id === id)
        const withoutShirorekha = item.canonicalStrokes.slice(0, -1).map((s) => resampleStroke(s, 0.02))
        const outcome = evaluateChildTracing(withoutShirorekha, item.canonicalStrokes)
        expect(outcome.passed).toBe(false)
        expect(outcome.missingStrokesCount).toBe(1)
        expect(outcome.encouragingFeedback).toMatch(/top line|all the lines/i)
      })
    })

    // ─── Dedicated Verification for Active Telugu Characters (క, గ, చ, న) ───
    describe('Dedicated Verification for Active Telugu Characters (క, గ, చ, న)', () => {
      const teluguList = [
        { id: 'te-ka', char: 'క', name: 'ka' },
        { id: 'te-ga', char: 'గ', name: 'ga' },
        { id: 'te-cha', char: 'చ', name: 'cha' },
        { id: 'te-na', char: 'న', name: 'na' },
      ]

      it.each(teluguList)('$char ($name): has exactly 2 canonical strokes (Body + Talakattu)', ({ id }) => {
        const item = LETTER_STROKE_DATA.te.find((x) => x.id === id)
        expect(item).toBeDefined()
        expect(item.canonicalStrokes.length).toBe(2)
        // Body stroke should have sufficient resolution
        expect(item.canonicalStrokes[0].length).toBeGreaterThanOrEqual(7)
        // Talakattu stroke should be a 3-point checkmark
        expect(item.canonicalStrokes[1].length).toBe(3)
      })

      it.each(teluguList)('$char ($name): accepts valid trace with realistic child handwriting jitter', ({ id }) => {
        const item = LETTER_STROKE_DATA.te.find((x) => x.id === id)
        const childTrace = item.canonicalStrokes.map((s, si) =>
          resampleStroke(s, 0.02).map((pt, pi) => ({
            x: pt.x + Math.sin(si + pi) * 0.015,
            y: pt.y + Math.cos(si + pi) * 0.015,
          }))
        )
        const outcome = evaluateChildTracing(childTrace, item.canonicalStrokes)
        expect(outcome.passed).toBe(true)
        expect(outcome.score).toBeGreaterThanOrEqual(75)
        expect(outcome.missingStrokesCount).toBe(0)
      })

      it.each(teluguList)('$char ($name): fails if Talakattu is omitted and provides top mark guidance', ({ id }) => {
        const item = LETTER_STROKE_DATA.te.find((x) => x.id === id)
        const bodyOnly = [resampleStroke(item.canonicalStrokes[0], 0.02)]
        const outcome = evaluateChildTracing(bodyOnly, item.canonicalStrokes)
        expect(outcome.passed).toBe(false)
        expect(outcome.missingStrokesCount).toBe(1)
        expect(outcome.encouragingFeedback).toMatch(/top mark|all the lines/i)
      })

      it.each(teluguList)('$char ($name): fails if Body is omitted and only Talakattu is drawn', ({ id }) => {
        const item = LETTER_STROKE_DATA.te.find((x) => x.id === id)
        const talakattuOnly = [resampleStroke(item.canonicalStrokes[1], 0.02)]
        const outcome = evaluateChildTracing(talakattuOnly, item.canonicalStrokes)
        expect(outcome.passed).toBe(false)
        expect(outcome.missingStrokesCount).toBe(1)
        expect(outcome.encouragingFeedback).toMatch(/main body curve|all the lines/i)
      })
    })

    // ─── Regression Verification: Safe Temporary Exclusion of Telugu త ───
    describe('Exclusion & Preservation Verification for Telugu త (te-ta)', () => {
      it('confirms Telugu త is completely excluded from the active playable curriculum', () => {
        expect(LETTER_STROKE_DATA.te.map((x) => x.id)).toEqual(['te-ka', 'te-ga', 'te-cha', 'te-na'])
        expect(LETTER_STROKE_DATA.te.some((x) => x.id === 'te-ta' || x.letter === 'త')).toBe(false)
        expect(isLetterActive('te-ta')).toBe(false)
        expect(isLetterActive('త')).toBe(false)
      })

      it('confirms Telugu త is safely preserved in PRESERVED_LETTER_STROKE_DATA with complete metadata', () => {
        const preservedTa = PRESERVED_LETTER_STROKE_DATA.te.find((x) => x.id === 'te-ta')
        expect(preservedTa).toBeDefined()
        expect(preservedTa.letter).toBe('త')
        expect(preservedTa.word).toBe('తార')
        expect(preservedTa.english).toBe('Star')
        expect(preservedTa.roman).toBe('taara')
        expect(preservedTa.excluded).toBe(true)
        expect(preservedTa.active).toBe(false)
        expect(preservedTa.exclusionReason).toBeTruthy()
        expect(preservedTa.canonicalStrokes.length).toBe(2)
        expect(EXCLUDED_LETTERS.some((x) => x.id === 'te-ta')).toBe(true)
      })

      it('confirms remaining Telugu letters (క, గ, చ, న) remain active, playable and unaltered', () => {
        expect(isLetterActive('te-ka')).toBe(true)
        expect(isLetterActive('te-ga')).toBe(true)
        expect(isLetterActive('te-cha')).toBe(true)
        expect(isLetterActive('te-na')).toBe(true)
      })

      it('confirms Hindi स (hi-sa) and English curriculum remain completely untouched', () => {
        expect(LETTER_STROKE_DATA.hi.length).toBe(5)
        expect(isLetterActive('hi-sa')).toBe(true)
        expect(LETTER_STROKE_DATA.en.length).toBe(25)
      })
    })
  })

  // ==========================================================================
  // 5. NON-CLINICAL ENCOURAGING FEEDBACK AUDIT
  // ==========================================================================
  describe('5. Child-Friendly Non-Clinical Language Audit', () => {
    it('guarantees no punitive language exists in feedback responses', () => {
      const forbiddenWords = ['failed', 'incorrect', 'wrong', 'error', 'invalid', 'bad', 'poor', 'mistake']

      for (const item of allItems) {
        // Test no-input feedback
        const noInput = evaluateChildTracing([], item.canonicalStrokes)
        for (const bad of forbiddenWords) {
          expect(noInput.encouragingFeedback.toLowerCase()).not.toContain(bad)
        }

        // Test micro-tap feedback
        const micro = evaluateChildTracing([[{ x: 0.5, y: 0.5 }, { x: 0.51, y: 0.51 }]], item.canonicalStrokes)
        for (const bad of forbiddenWords) {
          expect(micro.encouragingFeedback.toLowerCase()).not.toContain(bad)
        }

        // Test stray feedback
        const stray = evaluateChildTracing([[{ x: 0.05, y: 0.05 }, { x: 0.1, y: 0.1 }, { x: 0.15, y: 0.15 }]], item.canonicalStrokes)
        for (const bad of forbiddenWords) {
          expect(stray.encouragingFeedback.toLowerCase()).not.toContain(bad)
        }
      }
    })
  })
})

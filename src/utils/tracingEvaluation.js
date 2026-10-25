/**
 * Tracing Evaluation Engine for LexiGuide "Trace & Say"
 * 
 * CORE PRINCIPLES:
 * 1. Concrete & honest mathematical comparison: Evaluates sampled point-to-path Euclidean
 *    distance and canonical shape coverage.
 * 2. Generous child-friendly tolerance: Designed for young children's fine motor skills on touchscreens.
 * 3. Differentiates actual tracing from stray marks or random scribbles:
 *    - Valid traces (following the general path) PASS with encouraging praise.
 *    - Wild scribbles or tiny taps do NOT pass automatically; instead, they trigger gentle
 *      invitations to watch the demonstration and try again.
 * 4. Zero clinical language: No "failed", "incorrect", or red warning banners.
 */

export function distance(p1, p2) {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function distanceToSegment(p, a, b) {
  const l2 = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y)
  if (l2 === 0) return distance(p, a)
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2
  t = Math.max(0, Math.min(1, t))
  return distance(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) })
}

/**
 * Computes smooth Catmull-Rom spline points for continuous curve rendering & evaluation
 */
export function getCatmullRomPoints(points, numSegments = 12) {
  if (!points || points.length <= 2) return points || []
  const result = []
  const pts = [points[0], ...points, points[points.length - 1]]

  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2]

    for (let t = 0; t <= numSegments; t++) {
      const u = t / numSegments
      const u2 = u * u
      const u3 = u2 * u

      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * u +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3
      )

      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * u +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3
      )

      result.push({ x, y })
    }
  }
  return result
}

/**
 * Resamples a polyline stroke into equidistant points with spacing `step`
 */
export function resampleStroke(stroke, step = 0.02) {
  if (!stroke || stroke.length === 0) return []
  if (stroke.length === 1) return [{ ...stroke[0] }]

  const points = [{ ...stroke[0] }]
  let accumulated = 0

  for (let i = 0; i < stroke.length - 1; i++) {
    const a = stroke[i]
    const b = stroke[i + 1]
    const segDist = distance(a, b)
    if (segDist === 0) continue

    let cursor = 0
    while (accumulated + (segDist - cursor) >= step) {
      const remaining = step - accumulated
      cursor += remaining
      const t = cursor / segDist
      points.push({
        x: a.x + t * (b.x - a.x),
        y: a.y + t * (b.y - a.y),
      })
      accumulated = 0
    }
    accumulated += segDist - cursor
  }

  // Ensure last point is represented
  points.push({ ...stroke[stroke.length - 1] })
  return points
}

/**
 * Calculates total arc-length of a stroke
 */
export function getStrokeLength(stroke) {
  if (!stroke || stroke.length < 2) return 0
  let len = 0
  for (let i = 0; i < stroke.length - 1; i++) {
    len += distance(stroke[i], stroke[i + 1])
  }
  return len
}

/**
 * Normalizes pixel points relative to canvas width and height into [0, 1] range
 */
export function normalizeStrokes(pixelStrokes, width, height) {
  if (!width || !height) return []
  return pixelStrokes.map((stroke) =>
    stroke.map((pt) => ({
      x: Math.max(0, Math.min(1, pt.x / width)),
      y: Math.max(0, Math.min(1, pt.y / height)),
    }))
  )
}

/**
 * Evaluates child drawn strokes against canonical strokes.
 * 
 * Supports both multi-stroke letters (e.g. 'A', 'T', 'B', 'E', Telugu 'ka') and
 * single-stroke curves (e.g. 'C', 'S', 'O').
 * 
 * CORE PRINCIPLES:
 * 1. Honest stroke-level validation: Multi-stroke letters require all canonical strokes
 *    to be traced (rejects letter A when right leg or crossbar is missing).
 * 2. Generous child motor tolerance: Accommodates touchscreen finger wobble and stylus jitter.
 * 3. Continuous segment coverage: Uses segment-to-point Euclidean distance to avoid artificial
 *    gaps caused by fast child drawing.
 * 4. Zero clinical language: Incomplete attempts return warm, actionable encouragement.
 * 
 * @param {Array<Array<{x: number, y: number}>>} childStrokes - Normalized [0, 1]
 * @param {Array<Array<{x: number, y: number}>>} canonicalStrokes - Normalized [0, 1]
 * @param {Object} options
 * @returns {Object} Evaluation outcome
 */
export function evaluateChildTracing(childStrokes, canonicalStrokes, options = {}) {
  const {
    toleranceRadius = 0.10, // ~32px on 320px canvas — generous for young children's fingers
    minOverallCoverage = 0.58, // At least 58% of canonical letter covered
    minStrokeCoverage = 0.50, // Each stroke in multi-stroke letters must have >= 50% coverage
    maxStrokeMaxDistance = 0.12, // Rejects omitted strokes where maximum gap exceeds 12%
    maxMeanDistance = 0.22, // Average distance of child points to canonical path
    minTotalLength = 0.14, // Reject micro-taps
  } = options

  if (!childStrokes || childStrokes.length === 0) {
    return {
      passed: false,
      score: 0,
      coverage: 0,
      meanDistance: 1,
      strokeCoverages: [],
      missingStrokesCount: canonicalStrokes?.length || 0,
      totalChildLength: 0,
      reason: 'no_input',
      encouragingFeedback: 'Trace your finger along the guide lines to draw the letter! ✍️',
    }
  }

  // 1. Check total drawn length and count raw points
  let totalChildLength = 0
  const allChildPoints = []
  for (const stroke of childStrokes) {
    totalChildLength += getStrokeLength(stroke)
    for (const pt of stroke) {
      allChildPoints.push(pt)
    }
  }

  if (allChildPoints.length < 4 || totalChildLength < minTotalLength) {
    return {
      passed: false,
      score: Math.round(totalChildLength * 100),
      coverage: 0,
      meanDistance: 1,
      strokeCoverages: [],
      missingStrokesCount: canonicalStrokes?.length || 0,
      totalChildLength: Math.round(totalChildLength * 100) / 100,
      reason: 'too_short',
      encouragingFeedback: 'Keep your finger on the screen and trace the whole shape! 🌟',
    }
  }

  if (!canonicalStrokes || canonicalStrokes.length === 0) {
    return {
      passed: true,
      score: 100,
      coverage: 1,
      meanDistance: 0,
      strokeCoverages: [],
      missingStrokesCount: 0,
      totalChildLength: Math.round(totalChildLength * 100) / 100,
      reason: 'success',
      encouragingFeedback: 'Terrific tracing! 🌟',
    }
  }

  // 2. Evaluate per-stroke canonical coverage using continuous segment distance
  let totalCanonicalPoints = 0
  let totalCoveredPoints = 0
  const strokeReports = []

  for (let sIdx = 0; sIdx < canonicalStrokes.length; sIdx++) {
    const stroke = canonicalStrokes[sIdx]
    const strokeLen = getStrokeLength(stroke)
    const resampled = resampleStroke(stroke, 0.02)
    totalCanonicalPoints += resampled.length

    let covered = 0
    let maxDistInStroke = 0
    let sumDistInStroke = 0

    for (const cp of resampled) {
      let minDist = Infinity
      for (const cs of childStrokes) {
        if (!cs || cs.length === 0) continue
        if (cs.length === 1) {
          const d = distance(cp, cs[0])
          if (d < minDist) minDist = d
        } else {
          for (let i = 0; i < cs.length - 1; i++) {
            const d = distanceToSegment(cp, cs[i], cs[i + 1])
            if (d < minDist) minDist = d
          }
        }
      }

      sumDistInStroke += minDist
      if (minDist > maxDistInStroke) maxDistInStroke = minDist
      if (minDist <= toleranceRadius) covered++
    }

    totalCoveredPoints += covered
    const strokeCoverage = resampled.length > 0 ? covered / resampled.length : 1
    const strokeAvgDist = resampled.length > 0 ? sumDistInStroke / resampled.length : 0

    strokeReports.push({
      strokeIndex: sIdx,
      length: strokeLen,
      pointsCount: resampled.length,
      coveredCount: covered,
      coverage: strokeCoverage,
      avgDist: strokeAvgDist,
      maxDist: maxDistInStroke,
    })
  }

  const overallCoverage = totalCanonicalPoints > 0 ? totalCoveredPoints / totalCanonicalPoints : 1

  // 3. Calculate mean distance of child points to canonical segments
  let sumChildMinDist = 0
  for (const dp of allChildPoints) {
    let minSegDist = Infinity
    for (const stroke of canonicalStrokes) {
      if (stroke.length === 1) {
        const d = distance(dp, stroke[0])
        if (d < minSegDist) minSegDist = d
      } else {
        for (let i = 0; i < stroke.length - 1; i++) {
          const d = distanceToSegment(dp, stroke[i], stroke[i + 1])
          if (d < minSegDist) minSegDist = d
        }
      }
    }
    sumChildMinDist += minSegDist
  }
  const meanDistance = sumChildMinDist / allChildPoints.length

  // 4. Check for missing strokes in multi-stroke letters
  const missingStrokes = []
  if (canonicalStrokes.length > 1) {
    for (const report of strokeReports) {
      if (report.coverage < minStrokeCoverage || report.maxDist > maxStrokeMaxDistance) {
        missingStrokes.push(report.strokeIndex)
      }
    }
  }

  // Check for large gaps in single-stroke curves (rejects truncated curves)
  let singleStrokeGapTooLarge = false
  if (canonicalStrokes.length === 1 && strokeReports.length > 0) {
    if (strokeReports[0].maxDist > maxStrokeMaxDistance) {
      singleStrokeGapTooLarge = true
    }
  }

  // 6. Final verdict & encouraging non-clinical feedback
  const isMultiStroke = canonicalStrokes.length > 1
  const isStrokeMissing = isMultiStroke && missingStrokes.length > 0
  const isCoverageLow = overallCoverage < minOverallCoverage || singleStrokeGapTooLarge
  const isOffPath = meanDistance > maxMeanDistance

  const passed = !isStrokeMissing && !isCoverageLow && !isOffPath

  let reason = 'success'
  let encouragingFeedback = 'Terrific tracing! You drew the letter beautifully! 🌟'

  if (!passed) {
    if (isStrokeMissing) {
      reason = 'incomplete_letter'
      // Specific stroke hints based on missing stroke geometry & position
      if (missingStrokes.length === 1) {
        const missingIdx = missingStrokes[0]
        const mStroke = canonicalStrokes[missingIdx]

        if (canonicalStrokes.length === 2 && missingIdx === 1) {
          // 2-stroke letters like Telugu where stroke 1 is Talakattu (top mark)
          encouragingFeedback = 'Almost there! Add the top mark to finish the letter! ✍️'
        } else if (canonicalStrokes.length === 2 && missingIdx === 0) {
          // 2-stroke letters where stroke 0 is the main body
          encouragingFeedback = 'Almost there! Trace the main body curve to finish the letter! ✍️'
        } else {
          const isHorizontal =
            mStroke &&
            mStroke.length >= 2 &&
            Math.abs(mStroke[0].y - mStroke[mStroke.length - 1].y) < 0.08 &&
            Math.abs(mStroke[0].x - mStroke[mStroke.length - 1].x) > 0.18

          if (isHorizontal && mStroke[0].y < 0.35) {
            encouragingFeedback = 'Almost there! Draw the top line across to finish the letter! ✍️'
          } else if (isHorizontal && mStroke[0].y >= 0.35) {
            encouragingFeedback = 'Almost there! Trace the bridge across the middle to finish the letter! ✍️'
          } else {
            encouragingFeedback = 'Almost there! Trace all the lines to finish the letter! ✍️'
          }
        }
      } else {
        encouragingFeedback = 'Almost there! Trace all the lines to finish the letter! ✍️'
      }
    } else if (isOffPath) {
      reason = 'off_path'
      encouragingFeedback = 'Great try! Let’s trace right along the lines! 🌈'
    } else if (isCoverageLow) {
      reason = 'low_coverage'
      encouragingFeedback = 'Almost there! Trace a little further along the guide line! 🚀'
    }
  }

  const score = passed
    ? Math.min(
        100,
        Math.max(60, Math.round(overallCoverage * 70 + Math.max(0, 1 - meanDistance / maxMeanDistance) * 30))
      )
    : Math.min(50, Math.max(10, Math.round(overallCoverage * 50)))

  return {
    passed,
    score,
    coverage: Math.round(overallCoverage * 100) / 100,
    meanDistance: Math.round(meanDistance * 100) / 100,
    strokeCoverages: strokeReports.map((s) => Math.round(s.coverage * 100) / 100),
    missingStrokesCount: missingStrokes.length,
    totalChildLength: Math.round(totalChildLength * 100) / 100,
    reason,
    encouragingFeedback,
  }
}

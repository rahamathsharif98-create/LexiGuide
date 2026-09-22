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
 * @param {Array<Array<{x: number, y: number}>>} childStrokes - Normalized [0, 1]
 * @param {Array<Array<{x: number, y: number}>>} canonicalStrokes - Normalized [0, 1]
 * @param {Object} options
 * @returns {Object} Evaluation outcome
 */
export function evaluateChildTracing(childStrokes, canonicalStrokes, options = {}) {
  const {
    toleranceRadius = 0.20, // Generous touch radius (20% of canvas)
    minCoverageThreshold = 0.38, // At least 38% of canonical shape covered
    maxMeanDistance = 0.26, // Child points must stay within ~26% of shape
    minTotalLength = 0.15, // Reject tiny taps
  } = options

  if (!childStrokes || childStrokes.length === 0) {
    return {
      passed: false,
      score: 0,
      coverage: 0,
      meanDistance: 1,
      reason: 'no_input',
      encouragingFeedback: 'Trace your finger along the guide lines to draw the letter! ✍️',
    }
  }

  // 1. Check total drawn length
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
      reason: 'too_short',
      encouragingFeedback: 'Keep your finger on the screen and trace the whole shape! 🌟',
    }
  }

  // 2. Generate canonical target sample points
  const canonicalSamplePoints = []
  for (const stroke of canonicalStrokes) {
    const resampled = resampleStroke(stroke, 0.02)
    canonicalSamplePoints.push(...resampled)
  }

  if (canonicalSamplePoints.length === 0) {
    return {
      passed: true,
      score: 100,
      coverage: 1,
      meanDistance: 0,
      reason: 'success',
      encouragingFeedback: 'Terrific tracing! 🌟',
    }
  }

  // 3. Calculate canonical coverage (how many canonical points child visited)
  let coveredCount = 0
  for (const cp of canonicalSamplePoints) {
    let matched = false
    for (const dp of allChildPoints) {
      if (distance(cp, dp) <= toleranceRadius) {
        matched = true
        break
      }
    }
    if (matched) coveredCount++
  }
  const coverage = coveredCount / canonicalSamplePoints.length

  // 4. Calculate mean distance of child points to the canonical strokes
  let sumMinDistance = 0
  for (const dp of allChildPoints) {
    let minSegDist = Infinity
    for (const stroke of canonicalStrokes) {
      for (let i = 0; i < stroke.length - 1; i++) {
        const segDist = distanceToSegment(dp, stroke[i], stroke[i + 1])
        if (segDist < minSegDist) minSegDist = segDist
      }
      if (stroke.length === 1) {
        const ptDist = distance(dp, stroke[0])
        if (ptDist < minSegDist) minSegDist = ptDist
      }
    }
    sumMinDistance += minSegDist
  }
  const meanDistance = sumMinDistance / allChildPoints.length

  // 5. Final verdict & gentle scoring
  const passed = coverage >= minCoverageThreshold && meanDistance <= maxMeanDistance
  const score = Math.min(
    100,
    Math.max(10, Math.round(coverage * 70 + Math.max(0, 1 - meanDistance / maxMeanDistance) * 30))
  )

  let reason = 'success'
  let encouragingFeedback = 'Terrific tracing! You drew the letter beautifully! 🌟'

  if (!passed) {
    if (coverage < minCoverageThreshold && meanDistance > maxMeanDistance) {
      reason = 'off_path'
      encouragingFeedback = 'Let’s try together! Watch the guide dot and follow along! 💫'
    } else if (coverage < minCoverageThreshold) {
      reason = 'low_coverage'
      encouragingFeedback = 'Almost there! Trace a little further along the curve! 🚀'
    } else {
      reason = 'off_path'
      encouragingFeedback = 'Great try! Let’s trace right along the lines! 🌈'
    }
  }

  return {
    passed,
    score,
    coverage: Math.round(coverage * 100) / 100,
    meanDistance: Math.round(meanDistance * 100) / 100,
    totalChildLength: Math.round(totalChildLength * 100) / 100,
    reason,
    encouragingFeedback,
  }
}

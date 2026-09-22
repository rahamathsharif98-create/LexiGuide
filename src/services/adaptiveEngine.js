// ============================================================
// ADAPTIVE LEARNING ENGINE (rule-based, deterministic)
// Maps: Weak Skill -> Recommended Activity
// This mirrors GET /api/recommendations/{childId}
// ============================================================
import { SKILL_LABELS } from '../data/demoData'

const THRESHOLDS = {
  pronunciation: 65,
  phonologicalAwareness: 65,
  readingFluency: 60,
  comprehension: 65,
  wordRecognition: 60,
}

const ACTIVITY_MAP = {
  pronunciation: { icon: '🎤', title: 'Speak & Shine', route: '/child/speak', difficulty: 'Level up', time: '5 min' },
  phonologicalAwareness: { icon: '🦁', title: 'Sound Safari', route: '/child/games/match-sound', difficulty: 'Practice', time: '4 min' },
  readingFluency: { icon: '⏱️', title: 'Read With Me', route: '/child/read', difficulty: 'Timed', time: '3 min' },
  comprehension: { icon: '📖', title: 'Story Challenge', route: '/child/stories', difficulty: 'Story', time: '6 min' },
  wordRecognition: { icon: '🧩', title: 'Word Builder', route: '/child/games/build-word', difficulty: 'Practice', time: '4 min' },
}

export function generateRecommendations(fingerprint, errorPatterns = [], options = {}) {
  const { excludeRoute, recentTitles = [] } = options
  const recs = []

  if (fingerprint) {
    Object.entries(THRESHOLDS).forEach(([skill, threshold]) => {
      if (fingerprint[skill] < threshold) {
        const activity = ACTIVITY_MAP[skill]
        recs.push({
          skill,
          reason: `Recommended because ${SKILL_LABELS[skill]} needs a little more practice.`,
          ...activity,
        })
      }
    })
  }

  const persistent = errorPatterns.filter((p) => p.trend === 'persistent').sort((a, b) => b.severity - a.severity)[0]
  if (persistent) {
    recs.unshift({
      skill: 'targeted',
      reason: `Recommended because you've been practicing "${persistent.pattern}" — let's give it focused attention.`,
      icon: '🔍',
      title: 'Letter Detective',
      route: '/child/games/find-sound',
      difficulty: 'Focus',
      time: '5 min',
    })
  }

  if (recs.length === 0) {
    recs.push({
      skill: 'story',
      reason: 'You are doing great across the board — try a new story!',
      icon: '📚',
      title: 'Story Time',
      route: '/child/stories',
      difficulty: 'Explore',
      time: '4 min',
    })
  }

  const filtered = recs.filter((r) => r.route !== excludeRoute)

  // Phase 9, STEP 10 — avoid over-practice: if the top pick was just
  // played REPETITION_LIMIT times in a row, and there's another
  // reasonable option, move it down instead of recommending the exact
  // same activity again with no documented reason.
  const REPETITION_LIMIT = 2
  const wasJustRepeated = (title) =>
    recentTitles.length >= REPETITION_LIMIT &&
    recentTitles.slice(0, REPETITION_LIMIT).every((t) => t === title)

  const reordered = [...filtered].sort((a, b) => Number(wasJustRepeated(a.title)) - Number(wasJustRepeated(b.title)))

  return reordered.slice(0, 5)
}

// ============================================================
// Phase 9 — explainable pattern detection (mirrors the backend's
// AdaptiveLearningEngine in backend/app/services/adaptive_learning_service.py:
// same thresholds, same "repeated evidence outweighs one unusual result"
// rule). Operates on a per-skill history series like the one returned by
// data/demoData.js's generateHistory() — oldest first.
// ============================================================
const RECENT_WINDOW = 4
const HIGH_PERFORMANCE_THRESHOLD = 80
const LOW_PERFORMANCE_THRESHOLD = 55
const INCONSISTENCY_SWING = 20

export function detectSkillPattern(historySeries, skillKey) {
  const values = historySeries.map((row) => row[skillKey]).filter((v) => typeof v === 'number')
  const window = values.slice(-RECENT_WINDOW)
  if (window.length < 2) return 'not_enough_data'

  const swings = window.slice(1).map((v, i) => Math.abs(v - window[i]))
  const maxSwing = swings.length ? Math.max(...swings) : 0
  if (window.length >= 3 && maxSwing >= INCONSISTENCY_SWING) return 'inconsistent'

  const delta = window[window.length - 1] - window[0]
  const recentAvg = window.reduce((a, b) => a + b, 0) / window.length

  if (delta >= 10) return delta >= INCONSISTENCY_SWING ? 'recently_improved' : 'improving'
  if (recentAvg <= LOW_PERFORMANCE_THRESHOLD) {
    const allLow = window.every((v) => v <= LOW_PERFORMANCE_THRESHOLD + 10)
    return allLow ? 'repeatedly_struggling' : 'needs_practice'
  }
  if (recentAvg >= HIGH_PERFORMANCE_THRESHOLD) return 'consistently_strong'
  return 'needs_practice'
}

// Child-facing copy only — never a technical term or a percentage
// (STEP 11: no "Dyslexia detected", no raw pattern names, no numbers).
const CHILD_FRIENDLY_PATTERN_TEXT = {
  consistently_strong: "You're doing great with this!",
  improving: "You're getting better at this!",
  recently_improved: 'Wow, big improvement — keep it up!',
  inconsistent: "Let's keep practicing this together!",
  needs_practice: "Let's practice this a bit more!",
  repeatedly_struggling: "Let's try this one together — you've got this!",
  not_practiced_recently: "Let's revisit this — try it again!",
  not_enough_data: 'Try this next!',
}

export function childFriendlyPatternText(pattern) {
  return CHILD_FRIENDLY_PATTERN_TEXT[pattern] || 'Try this next!'
}

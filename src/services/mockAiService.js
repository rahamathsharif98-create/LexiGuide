// ============================================================
// MOCK AI SERVICE
// ------------------------------------------------------------
// This file simulates the AI microservices described in the
// architecture (FastAPI + Whisper + Librosa + PyTorch/Scikit-Learn).
//
// Every function here mirrors a REAL future API endpoint 1:1:
//   analyzeSpeech        -> POST /api/speech/analyze
//   analyzeReading       -> POST /api/reading/analyze
//   evaluateComprehension-> POST /api/comprehension/evaluate
//   updateFingerprint     -> POST /api/fingerprint/update
//   getFingerprint        -> GET  /api/fingerprint/{childId}
//   getRecommendations    -> GET  /api/recommendations/{childId}
//   submitGameResult      -> POST /api/game/result
//   submitStoryResult     -> POST /api/story/result
//
// IMPORTANT: These are MOCK / DEMO implementations only.
// They do NOT run real speech recognition or acoustic analysis.
// When a real AI backend is available, replace the function
// bodies below with real `fetch()` calls to the FastAPI service —
// the calling components will not need to change.
// ============================================================

const MOCK_LATENCY = 900

function wait(ms = MOCK_LATENCY) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const PHONEMES = ['sh', 'ch', 'th', 'r', 'l', 's']
const ERROR_SUBTYPES = ['omission', 'substitution', 'repetition']

// Friendly, child-facing translations of technical reading observations.
// Technical detail (omission/substitution/repetition/hesitation) stays
// available in the metrics object for parent/teacher views later — the
// child only ever sees the friendly sentence.
const FRIENDLY_OBSERVATION = {
  omission: "Let's slow down and make sure we read every word.",
  substitution: "Let's look closely at each word before we say it.",
  repetition: "Let's try reading smoothly, one word at a time.",
  hesitation: "Take your time — you're doing great!",
  correct: 'Wow, you read that perfectly!',
}

/**
 * MOCK: simulates analyzing a recorded read-aloud clip.
 * A real implementation would run Whisper STT + Librosa acoustic
 * feature extraction (pitch, formants, pauses) here.
 */
export async function analyzeSpeech({ passageWords = [] }) {
  await wait()
  const results = passageWords.map((word) => {
    const roll = Math.random()
    let status = 'correct'
    let subtype = null
    if (roll > 0.88) {
      status = 'error'
      subtype = ERROR_SUBTYPES[Math.floor(Math.random() * ERROR_SUBTYPES.length)]
    } else if (roll > 0.72) {
      status = 'hesitation'
    }
    return { word, status, subtype }
  })
  const correct = results.filter((r) => r.status === 'correct').length
  const hesitations = results.filter((r) => r.status === 'hesitation').length
  const errorWords = results.filter((r) => r.status === 'error')
  const errors = errorWords.length

  // Determine the single dominant observation to translate into friendly
  // feedback — technical reading-error simulation per Phase 2 spec.
  let observation = 'correct'
  if (errorWords.length > 0) {
    const counts = {}
    errorWords.forEach((r) => { counts[r.subtype] = (counts[r.subtype] || 0) + 1 })
    observation = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  } else if (hesitations > 0) {
    observation = 'hesitation'
  }

  return {
    __mock: true,
    results,
    metrics: {
      wordsRead: passageWords.length,
      accuracy: Math.round((correct / passageWords.length) * 100),
      hesitations,
      errors,
      observation, // technical: omission | substitution | repetition | hesitation | correct
      friendlyFeedback: FRIENDLY_OBSERVATION[observation],
      soundsToPractice: errors > 0 ? [PHONEMES[Math.floor(Math.random() * PHONEMES.length)]] : [],
      smoothness: hesitations > 2 ? 'Needs practice' : hesitations > 0 ? 'Improving' : 'Great',
    },
  }
}

/** MOCK: reading fluency / pace analysis for a session */
export async function analyzeReading({ durationSec = 30, wordsRead = 20 }) {
  await wait(600)
  const wpm = Math.round((wordsRead / durationSec) * 60)
  return { __mock: true, wpm, pace: wpm < 40 ? 'Slow' : wpm < 70 ? 'Steady' : 'Fast' }
}

/** MOCK: comprehension scoring after story questions */
export async function evaluateComprehension({ answers = [] }) {
  await wait(500)
  const correct = answers.filter((a) => a.correct).length
  return {
    __mock: true,
    accuracy: answers.length ? Math.round((correct / answers.length) * 100) : 0,
    correct,
    total: answers.length,
  }
}

export const GRANULAR_SKILL_TO_PILLAR = {
  // Phonological Awareness
  phonologicalAwareness: 'phonologicalAwareness',
  phonological_awareness: 'phonologicalAwareness',
  auditoryPhonicsDiscrimination: 'phonologicalAwareness',
  phonicsDiscrimination: 'phonologicalAwareness',
  rhymeDiscrimination: 'phonologicalAwareness',
  rhymeMatch: 'phonologicalAwareness',
  rhyme: 'phonologicalAwareness',
  onsetRimeBlending: 'phonologicalAwareness',
  soundDifferentiation: 'phonologicalAwareness',
  phonemeTargetArchery: 'phonologicalAwareness',
  soundSafari: 'phonologicalAwareness',
  matchSound: 'phonologicalAwareness',
  findSound: 'phonologicalAwareness',
  soundHunt: 'phonologicalAwareness',

  // Word Recognition
  wordRecognition: 'wordRecognition',
  word_recognition: 'wordRecognition',
  wordSpellingConstruction: 'wordRecognition',
  sightWordRecognition: 'wordRecognition',
  syllableStacking: 'wordRecognition',
  letterSequencing: 'wordRecognition',
  phonicsWordCompletion: 'wordRecognition',
  phonicsDecodingIncantation: 'wordRecognition',
  letterTracing: 'wordRecognition',
  letterRecognition: 'wordRecognition',
  missingLetter: 'wordRecognition',
  spelling: 'wordRecognition',
  vocabulary: 'wordRecognition',
  wordBuilder: 'wordRecognition',
  rimeBlending: 'wordRecognition',
  spiderWebWeaving: 'wordRecognition',
  webWeavingConstruction: 'wordRecognition',

  // Reading Fluency
  readingFluency: 'readingFluency',
  reading_fluency: 'readingFluency',
  rhythmTiming: 'readingFluency',
  soundRhythm: 'readingFluency',
  fluency: 'readingFluency',
  readWithMe: 'readingFluency',

  // Pronunciation
  pronunciation: 'pronunciation',
  speech: 'pronunciation',
  speaking: 'pronunciation',
  traceAndSpeak: 'pronunciation',
  articulation: 'pronunciation',
  speakPlay: 'pronunciation',

  // Comprehension
  comprehension: 'comprehension',
  storyPuzzle: 'comprehension',
  story_puzzle: 'comprehension',
  story: 'comprehension',
  readingComprehension: 'comprehension',
  storyReader: 'comprehension',
}

export function normalizeSkillToPillar(skill) {
  if (!skill) return null
  return GRANULAR_SKILL_TO_PILLAR[skill] || GRANULAR_SKILL_TO_PILLAR[String(skill).trim()] || null
}

/**
 * MOCK: recompute the AI Reading Fingerprint from a session outcome.
 * This is the heart of the closed feedback loop:
 * Observed Error -> Recurring Pattern -> Weak Skill -> Updated Fingerprint
 */
export function updateFingerprint(currentFingerprint, sessionOutcome = {}) {
  const next = { ...currentFingerprint }
  const nudge = (key, delta) => {
    if (!key) return
    next[key] = Math.max(5, Math.min(98, Math.round((next[key] ?? 55) + delta)))
  }

  const targetPillar = normalizeSkillToPillar(sessionOutcome.skill)

  if (sessionOutcome.type === 'reading') {
    const { accuracy = 70, hesitations = 0 } = sessionOutcome.metrics || {}
    nudge('pronunciation', (accuracy - 70) / 8)
    nudge('readingFluency', hesitations > 2 ? -1.5 : 2)
    nudge('wordRecognition', (accuracy - 70) / 10)
  } else if (targetPillar) {
    const rawScore = sessionOutcome.score ?? sessionOutcome.accuracy ?? 70
    const score = (typeof rawScore === 'number' && rawScore <= 1.0 && rawScore > 0) ? rawScore * 100 : rawScore
    nudge(targetPillar, (score - 60) / 6)
  } else if (sessionOutcome.type === 'story') {
    const { accuracy = 70 } = sessionOutcome
    nudge('comprehension', (accuracy - 70) / 6)
  }
  return next
}

/**
 * MOCK: Adaptive Learning Engine.
 * Deterministic, threshold-based recommendations generated FROM
 * the fingerprint + persistent error patterns — never random.
 * See src/services/adaptiveEngine.js for the full rule set.
 */
export { generateRecommendations } from './adaptiveEngine'

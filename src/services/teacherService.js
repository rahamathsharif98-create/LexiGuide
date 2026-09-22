// ============================================================
// TEACHER DATA SERVICE LAYER (mock)
// ------------------------------------------------------------
// Same pattern as parentService.js: named functions wrapping/deriving
// teacher-facing data from the shared mock data + services, so components
// never touch raw shapes directly. Deliberately reuses existing services
// (getFriendlySkills, generateSessions, generateHistory, the adaptive
// recommendation engine) rather than duplicating logic — this is the seam
// where real FastAPI class/roster endpoints will slot in later.
// ============================================================
import { CLASS_STUDENTS, ERROR_PATTERNS, RECOMMENDED_SUPPORT, getFriendlySkills, generateSessions, generateHistory } from '../data/demoData'
import { generateRecommendations } from './adaptiveEngine'

export function getTeacherClasses() {
  return [{ id: 'grade2a', name: 'Grade 2 — Section A', studentCount: CLASS_STUDENTS.length }]
}

export function getStudents() {
  return CLASS_STUDENTS
}

export function getStudentById(id) {
  return CLASS_STUDENTS.find((s) => String(s.id) === String(id)) || null
}

/**
 * A single, consistent status category per student — used for both the
 * "Students Needing Support" dashboard section and the Students page filter,
 * so the two never disagree with each other.
 */
export function getStudentStatus(student, errorPatterns = []) {
  const persistentCount = errorPatterns.filter((p) => p.trend === 'persistent').length
  const avg = Math.round(Object.values(student.fingerprint).reduce((a, b) => a + b, 0) / 5)
  if (persistentCount >= 2 || avg < 55) return 'Needs Practice'
  if (avg >= 70) return 'Strong Progress'
  return 'Improving'
}

export function getClassSummary() {
  const students = getStudents()
  const needingSupport = students.filter((s) => getStudentStatus(s, ERROR_PATTERNS[s.id] || []) === 'Needs Practice')
  return {
    totalStudents: students.length,
    activeLearners: students.filter((s) => s.streak > 0).length,
    activitiesCompleted: students.reduce((sum, s) => sum + (8 + s.level * 3), 0),
    studentsNeedingSupport: needingSupport.length,
  }
}

export function getClassLearningProgress() {
  const students = getStudents()
  const avgFingerprint = {}
  Object.keys(students[0].fingerprint).forEach((key) => {
    avgFingerprint[key] = Math.round(students.reduce((sum, s) => sum + s.fingerprint[key], 0) / students.length)
  })
  return getFriendlySkills(avgFingerprint)
}

export function getStudentsNeedingSupport() {
  return getStudents()
    .map((s) => {
      const patterns = ERROR_PATTERNS[s.id] || []
      const status = getStudentStatus(s, patterns)
      if (status !== 'Needs Practice') return null
      const friendly = getFriendlySkills(s.fingerprint)
      const weakest = [...friendly].sort((a, b) => a.value - b.value)[0]
      const support = (RECOMMENDED_SUPPORT[s.id] || [])[0] || 'Short, regular practice sessions'
      return { student: s, skillArea: weakest, observation: `Needs more ${weakest.label.toLowerCase()} practice`, suggestion: support }
    })
    .filter(Boolean)
}

export function getRecentClassActivity(count = 6) {
  const students = getStudents()
  const out = []
  students.forEach((s) => {
    const sessions = generateSessions(s, 2)
    sessions.forEach((sess) => out.push({ ...sess, student: s }))
  })
  return out.slice(0, count)
}

export function getClassStrengths() {
  return [
    'Most students are progressing well with picture matching.',
    'Speaking practice participation has increased this week.',
  ]
}

export function getClassSkillsToPractice() {
  const progress = getClassLearningProgress()
  const weakest = [...progress].sort((a, b) => a.value - b.value).slice(0, 2)
  return weakest.map((s) => `${s.emoji} ${s.label} — several students may benefit from extra practice here.`)
}

export function getWeeklyClassSummary() {
  const students = getStudents()
  return {
    activitiesCompleted: students.length * 6,
    averageStreak: Math.round(students.reduce((sum, s) => sum + s.streak, 0) / students.length),
    studentsImproving: students.filter((s) => s.trend === 'improving').length,
  }
}

/**
 * Reuses the SAME adaptive recommendation engine as Child/Parent — this is
 * an aggregation across students' individual recommendations, not a second
 * independent algorithm.
 */
export function getTeacherRecommendations() {
  const students = getStudents()
  const bySkill = {}
  students.forEach((s) => {
    const patterns = ERROR_PATTERNS[s.id] || []
    const recs = generateRecommendations(s.fingerprint, patterns)
    recs.forEach((r) => {
      const key = r.skill
      if (!bySkill[key]) bySkill[key] = { ...r, students: [] }
      bySkill[key].students.push(s)
    })
  })

  const REASON_MAP = {
    pronunciation: 'Several students showed hesitation during recent speaking activities.',
    phonologicalAwareness: 'Several students showed difficulty during recent sound activities.',
    readingFluency: 'Some students showed hesitation during recent reading sessions.',
    wordRecognition: 'A few students would benefit from extra word-recognition practice.',
    comprehension: 'Some students found story comprehension questions challenging.',
    targeted: 'A recurring pattern was observed across recent sessions for these students.',
  }
  const TITLE_MAP = {
    pronunciation: 'Encourage more speaking practice',
    phonologicalAwareness: 'Increase beginning-sound practice',
    readingFluency: 'Encourage more reading practice',
    wordRecognition: 'Add more word-building practice',
    comprehension: 'Add more story comprehension practice',
    targeted: 'Give focused, targeted practice',
  }

  return Object.entries(bySkill)
    .sort((a, b) => b[1].students.length - a[1].students.length)
    .map(([skill, r]) => ({
      title: TITLE_MAP[skill] || r.title,
      reason: REASON_MAP[skill] || r.reason,
      students: r.students,
      suggestedActivity: r.title,
      route: r.route,
      priority: r.students.length >= 2 ? 'High attention' : r.students.length === 1 ? 'Worth practicing' : 'Going well',
    }))
}

export function getClassInsights() {
  return [
    'Reading practice is the most active area this week.',
    'Sound activities may need a little more classroom attention.',
  ]
}

export function getStudentProgressHistory(student, range = '7d') {
  const base = generateHistory(student)
  if (range === '7d') return base
  // Longer ranges are simulated by repeating the 7-day mock trend — a real
  // backend would query genuinely distinct historical session records.
  const repeats = range === '30d' ? 3 : 6
  return Array.from({ length: repeats }).flatMap(() => base)
}

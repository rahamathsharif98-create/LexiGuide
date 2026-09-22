// ============================================================
// PARENT DATA SERVICE LAYER (mock)
// ------------------------------------------------------------
// Wraps/derives parent-facing data from the shared child state
// (demoData + AppContext) behind named functions, so the actual
// UI components never touch raw data shapes directly. This is the
// seam where real FastAPI calls will slot in later — every
// function here has the same name/shape it would have as a real
// API call (e.g. getWeeklySummary(child) -> GET /api/parent/weekly-summary).
// ============================================================
import { getFriendlySkills, generateSessions, ACHIEVEMENTS } from '../data/demoData'
import { generateRecommendations } from './adaptiveEngine'

export function getChildSummary(child) {
  return {
    stars: child.stars,
    streak: child.streak,
    activitiesCompleted: 8 + child.level * 3,
    learningTimeMin: 12 + child.level * 6,
  }
}

const TREND_FOR = { sounds: 'improving', reading: 'steady', speaking: 'improving', understanding: 'needs practice' }

export function getSkillTrend(skillKey) {
  return TREND_FOR[skillKey] || 'steady'
}

export function getLearningProgress(child) {
  return getFriendlySkills(child.fingerprint).map((s) => ({ ...s, trend: getSkillTrend(s.key) }))
}

export function getRecentActivity(child, count = 5) {
  return generateSessions(child, count)
}

export function getStrengths(child) {
  const friendly = getFriendlySkills(child.fingerprint)
  const top = [...friendly].sort((a, b) => b.value - a.value).slice(0, 2)
  const notes = {
    reading: 'Strong word recognition',
    understanding: 'Good story understanding',
    sounds: 'Improving sound awareness',
    speaking: 'Clear, confident speaking',
  }
  return top.map((s) => `✨ ${notes[s.key] || `Strong ${s.label.toLowerCase()}`}`)
}

export function getAreasToPractice(child, errorPatterns) {
  const persistent = errorPatterns.filter((p) => p.trend === 'persistent')
  if (persistent.length > 0) {
    return persistent.map((p) => ({
      title: p.pattern,
      reason: `${child.name}'s recent activities have shown repeated difficulty with this.`,
    }))
  }
  const friendly = getFriendlySkills(child.fingerprint)
  const weakest = [...friendly].sort((a, b) => a.value - b.value)[0]
  return [{ title: weakest.label, reason: `A little more practice with ${weakest.label.toLowerCase()} will help build confidence.` }]
}

export function getRecommendationsForParent(child, errorPatterns) {
  const reasonMap = {
    pronunciation: 'Based on recent speaking activities.',
    phonologicalAwareness: 'Sound awareness improves with short, regular practice.',
    readingFluency: 'Reading fluency can improve with repeated reading.',
    wordRecognition: 'A little extra word practice will help build confidence.',
    comprehension: 'More comprehension practice is recommended.',
    targeted: `Based on a pattern noticed across ${child.name}'s recent sessions.`,
  }
  return generateRecommendations(child.fingerprint, errorPatterns).map((r) => ({
    ...r,
    parentReason: reasonMap[r.skill] || r.reason,
  }))
}

export function getWeeklySummary(child) {
  return {
    activitiesCompleted: 5 + Math.min(child.level, 5),
    learningTimeMin: 28 + child.level * 4,
    storiesRead: Math.min(3, Math.ceil(child.level / 2)),
    speakingActivities: Math.min(4, child.level),
  }
}

export function getInsights(child) {
  const friendly = getFriendlySkills(child.fingerprint)
  const best = [...friendly].sort((a, b) => b.value - a.value)[0]
  return [
    `✨ ${child.name} is improving in ${best.label.toLowerCase()}.`,
    '💡 Try a short reading activity today.',
    `🎉 ${child.name} completed ${5 + Math.min(child.level, 5)} activities this week.`,
  ]
}

export function getAchievements(child) {
  // In this mock, all children share the same demo achievement set —
  // a real backend would key this off the child's own stored history.
  return ACHIEVEMENTS
}

export function getStreakCalendar(child) {
  // Last 7 days, mock: streak days practiced = true for the most recent N days
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  return days.map((label, i) => ({ label, practiced: i >= 7 - Math.min(child.streak, 7) }))
}

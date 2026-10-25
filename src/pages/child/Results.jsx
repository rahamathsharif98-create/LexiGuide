import { useNavigate } from 'react-router-dom'
import { AppLink as Link } from '../../components/nav/AppLink'
import { useApp } from '../../context/AppContext'
import { Card, Button } from '../../components/ui'
import { FRIENDLY_SKILLS } from '../../data/demoData'
import { generateRecommendations } from '../../services/adaptiveEngine'

// Maps a completed session outcome to the friendly skill(s) it exercised,
// so "You practiced" reflects the real activity in plain language —
// never the technical fingerprint skill names.
function friendlySkillsTouchedBy(outcome) {
  if (!outcome) return []
  const keyToFriendly = { pronunciation: 'speaking', phonologicalAwareness: 'sounds', wordRecognition: 'reading', readingFluency: 'reading', comprehension: 'understanding' }
  let keys = []
  if (outcome.type === 'reading') keys = ['pronunciation', 'readingFluency']
  if (outcome.type === 'game' && outcome.skill) keys = [outcome.skill]
  if (outcome.type === 'story') keys = ['comprehension']
  const friendlyKeys = [...new Set(keys.map((k) => keyToFriendly[k]))]
  return FRIENDLY_SKILLS.filter((s) => friendlyKeys.includes(s.key))
}

export default function Results() {
  const {
    lastSessionSummary, activeChild, errorPatterns, isRealBackend,
    nextRecommendedActivity, reassessmentInsight,
    learningGoals, weeklyPlan
  } = useApp()
  const navigate = useNavigate()

  const improved = friendlySkillsTouchedBy(lastSessionSummary)
  const nextActivity = isRealBackend
    ? nextRecommendedActivity
    : (nextRecommendedActivity || generateRecommendations(activeChild.fingerprint, errorPatterns)[0])

  if (!lastSessionSummary) {
    return (
      <div className="max-w-md mx-auto text-center py-10">
        <div className="text-6xl mb-4">🌱</div>
        <h1 className="font-display font-bold text-xl text-slate-800 mb-2">No activity yet today</h1>
        <p className="text-slate-400 mb-6">Try a game, story, or reading to see your results here!</p>
        <Button onClick={() => navigate('/child/home')}>Back to Home</Button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="text-7xl mb-3 animate-pop">🎉</div>
      <h1 className="font-display font-extrabold text-2xl text-slate-800 mb-1">AMAZING!</h1>

      <div className="flex justify-center gap-1 my-4 text-4xl">
        {[1, 2, 3].map((n) => <span key={n}>⭐</span>)}
      </div>

      <Card className="mb-5">
        <p className="font-display font-bold text-3xl text-sun-500">+{lastSessionSummary.xpGain ?? 15} XP</p>
        <p className="text-xs text-slate-400 font-semibold mt-1">and +{lastSessionSummary.starsGain ?? 3} stars earned</p>
      </Card>

      <p className="font-display font-semibold text-slate-600 mb-5">You're getting better every day! 🌟</p>

      {improved.length > 0 && (
        <Card className="mb-5">
          <p className="font-display font-bold text-sm text-slate-700 mb-3">You practiced:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {improved.map((s) => (
              <span key={s.key} className="bg-mint-100 text-mint-700 text-sm font-bold px-4 py-2 rounded-full">{s.emoji} {s.label}</span>
            ))}
          </div>
        </Card>
      )}

      {reassessmentInsight && (
        <Card className="mb-5 bg-gradient-to-br from-brand-50 to-white border border-brand-100 text-center">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-1">Growth Update 🌱</p>
          <p className="font-display font-bold text-slate-700 text-sm">{reassessmentInsight.message}</p>
        </Card>
      )}

      {nextActivity && (
        <Card className="mb-5 bg-gradient-to-br from-brand-50 to-white border border-brand-100 text-center">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-1">Next For You 🎯</p>
          <p className="font-display font-extrabold text-slate-800 text-lg mb-2">
            {nextActivity.icon || '✨'} {nextActivity.title || nextActivity.activity}
          </p>
          {nextActivity.reason && (
            <div className="bg-white/80 rounded-xl p-2.5 mb-3 border border-brand-100">
              <span className="inline-block bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full mr-1.5">WHY?</span>
              <span className="text-xs text-slate-600 font-medium">{nextActivity.reason}</span>
            </div>
          )}
          <Button className="w-full" onClick={() => navigate(nextActivity.route || '/child/read')}>
            Play Next Activity ▶
          </Button>
        </Card>
      )}

      {learningGoals && learningGoals.length > 0 && (
        <Card className="mb-5 bg-gradient-to-br from-brand-50/50 to-white border border-brand-100 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-brand-700 uppercase tracking-wide">Weekly Goal Progress 🗺️</span>
            {weeklyPlan?.completion_rate !== undefined && (
              <span className="text-xs font-semibold text-slate-500">{weeklyPlan.completion_rate}% of week complete</span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-700 mb-1">
            Focus: <span className="font-bold text-brand-600">{learningGoals[0].skill_display}</span> ({learningGoals[0].current_level_display} → {learningGoals[0].target_level_display})
          </p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, learningGoals[0].progress_pct || 0))}%` }}
            />
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        <Button className="w-full" variant="secondary" onClick={() => navigate('/child/home')}>
          Back to Home
        </Button>
        <Link to="/child/journey" className="text-sm font-semibold text-brand-600 mt-1">See My Journey →</Link>
      </div>
    </div>
  )
}

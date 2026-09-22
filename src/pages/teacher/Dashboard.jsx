import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { TeacherShell } from './TeacherShell'
import { StatCard, Card, ProgressBar, Button, Skeleton } from '../../components/ui'
import { ProfileAvatar } from '../../components/ProfileAvatar'
import { endpoints } from '../../services/api'
import {
  getClassSummary, getClassLearningProgress, getStudentsNeedingSupport, getRecentClassActivity,
  getClassStrengths, getClassSkillsToPractice, getWeeklyClassSummary,
} from '../../services/teacherService'

const TREND_LABEL = { improving: '📈 Improving', steady: '➡️ Steady', 'needs practice': '💪 Needs practice' }
const TREND_FOR = { sounds: 'improving', reading: 'steady', speaking: 'improving', understanding: 'needs practice' }

export default function TeacherDashboard() {
  const { auth } = useAuth()
  const navigate = useNavigate()

  const isReal = Boolean(auth?.isAuthenticated && auth?.token && !auth.token.includes('test') && !auth.token.includes('demo'))

  const [loading, setLoading] = useState(isReal)
  const [error, setError] = useState(null)
  const [realDashboard, setRealDashboard] = useState(null)
  const [realProgress, setRealProgress] = useState(null)

  const fetchDashboard = () => {
    if (!isReal) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    Promise.all([
      endpoints.teacherDashboard().catch(() => null),
      endpoints.teacherProgress(null, '7d').catch(() => null),
    ])
      .then(([dashRes, progRes]) => {
        setRealDashboard(dashRes)
        setRealProgress(progRes)
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.message || 'Could not load classroom dashboard')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchDashboard()
  }, [isReal])

  // Demo fallback
  const demoSummary = !isReal ? getClassSummary() : null
  const demoProgress = !isReal ? getClassLearningProgress() : []
  const demoNeedingSupport = !isReal ? getStudentsNeedingSupport() : []
  const demoRecent = !isReal ? getRecentClassActivity(5) : []
  const demoStrengths = !isReal ? getClassStrengths() : []
  const demoToPractice = !isReal ? getClassSkillsToPractice() : []
  const demoWeekly = !isReal ? getWeeklyClassSummary() : null

  const summary = isReal
    ? {
        totalStudents: realDashboard?.total_students ?? 0,
        activeLearners: realDashboard?.active_learners ?? 0,
        activitiesCompleted: realDashboard?.activities_completed ?? 0,
        studentsNeedingSupport: realDashboard?.students_needing_support ?? 0,
      }
    : demoSummary

  const progress = isReal
    ? (realProgress?.skills || []).map((s) => ({
        key: s.key,
        label: s.label,
        emoji: s.emoji || '📖',
        value: s.value,
        color: s.color || '#12aeef',
        trend: s.value >= 70 ? 'improving' : s.value < 55 ? 'needs practice' : 'steady',
      }))
    : demoProgress

  const needingSupport = isReal
    ? (realDashboard?.needing_support_list || [])
    : demoNeedingSupport

  const recent = isReal
    ? (realDashboard?.recent_activity || []).map((a) => ({
        id: a.id,
        student: a.student,
        label: a.label || a.activity || 'Practice Session',
        date: a.date || 'Recently',
        accuracy: a.accuracy || 80,
      }))
    : demoRecent

  const strengths = isReal
    ? (realDashboard?.strengths || (progress.length > 0 ? [`Solid performance in ${progress[0].label.toLowerCase()}`] : []))
    : demoStrengths

  const toPractice = isReal
    ? (realDashboard?.to_practice || (progress.length > 0 ? [`${progress[progress.length - 1].label} — extra practice recommended`] : []))
    : demoToPractice

  return (
    <TeacherShell title="Good morning, Teacher" subtitle="Here's how your class is progressing.">
      {error && (
        <Card className="mb-6 bg-coral-50 border border-coral-200 text-center">
          <p className="font-display font-bold text-coral-700 mb-1">Could not load classroom data ⚠️</p>
          <p className="text-xs text-slate-500 mb-3">{error}</p>
          <Button size="sm" onClick={fetchDashboard}>Retry 🔄</Button>
        </Card>
      )}

      {!error && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon="🧑‍🎓" label="Total Students" value={summary.totalStudents} colorName="brand" />
            <StatCard icon="✅" label="Active Learners" value={summary.activeLearners} colorName="mint" />
            <StatCard icon="📚" label="Activities Completed" value={summary.activitiesCompleted} colorName="sun" />
            <StatCard icon="💪" label="Students Needing Support" value={summary.studentsNeedingSupport} colorName="peach" />
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-6">
            {/* Class Learning Progress */}
            <Card>
              <p className="font-display font-bold text-slate-700 mb-4">Class Learning Progress</p>
              {progress.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No skill assessments recorded for this class yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {progress.map((s) => (
                    <div key={s.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-600">{s.emoji} {s.label}</span>
                        <span className="text-xs font-semibold text-slate-400">
                          {TREND_LABEL[s.trend] || TREND_LABEL[TREND_FOR[s.key]] || s.trend}
                        </span>
                      </div>
                      <ProgressBar value={s.value} colorHex={s.color} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Students Needing Support */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="font-display font-bold text-slate-700">Students Needing Support</p>
                <button onClick={() => navigate('/teacher/students')} className="text-sm font-semibold text-brand-600">View all →</button>
              </div>
              {needingSupport.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No students flagged right now — everyone is progressing steadily.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {needingSupport.slice(0, 3).map(({ student, observation, suggestion }) => (
                    <button key={student.id} onClick={() => navigate(`/teacher/students/${student.id}`)} className="text-left">
                      <div className="flex items-center gap-3 bg-peach-50 border border-peach-100 rounded-2xl p-3 hover:bg-peach-100 transition-colors">
                        <ProfileAvatar emoji={student.avatar} colorName={student.color} size={40} />
                        <div className="min-w-0">
                          <p className="font-display font-semibold text-slate-800 text-sm">{student.name}</p>
                          <p className="text-xs text-slate-500">{observation}. Try: {suggestion}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-6">
            {/* Recent classroom activity */}
            <Card>
              <p className="font-display font-bold text-slate-700 mb-3">Recent Classroom Activity</p>
              {recent.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No classroom activities completed yet.</p>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100">
                  {recent.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 py-3">
                      <ProfileAvatar emoji={a.student?.avatar || '👤'} colorName={a.student?.color || 'brand'} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700">{a.student?.name || 'Student'} · {a.label}</p>
                        <p className="text-xs text-slate-400">{a.date}</p>
                      </div>
                      <span className="text-sm">{'⭐'.repeat(Math.max(1, Math.round(Number(a.accuracy) / 20)))}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Class strengths + skills to practice */}
            <div className="flex flex-col gap-5">
              <Card className="bg-mint-50 border border-mint-100">
                <p className="font-display font-bold text-mint-700 mb-2">Class Strengths ✨</p>
                {strengths.length === 0 ? (
                  <p className="text-xs text-slate-500">Class strengths will appear as students practice.</p>
                ) : (
                  strengths.map((s, i) => <p key={i} className="text-sm text-slate-700 mb-1">{s}</p>)
                )}
              </Card>
              <Card className="bg-sun-50 border border-sun-100">
                <p className="font-display font-bold text-sun-700 mb-2">Skills to Practice 💪</p>
                {toPractice.length === 0 ? (
                  <p className="text-xs text-slate-500">No urgent practice areas identified for the class.</p>
                ) : (
                  toPractice.map((s, i) => <p key={i} className="text-sm text-slate-700 mb-1">{s}</p>)
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </TeacherShell>
  )
}

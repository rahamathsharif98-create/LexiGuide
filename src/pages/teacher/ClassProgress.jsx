import { useState, useEffect } from 'react'
import { useAuth, isRealBackendAuth } from '../../context/AuthContext'
import { TeacherShell } from './TeacherShell'
import { Card, ProgressBar, Skeleton, Button } from '../../components/ui'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getStudents, getClassLearningProgress, getClassInsights, getStudentStatus } from '../../services/teacherService'
import { ERROR_PATTERNS } from '../../data/demoData'
import { endpoints } from '../../services/api'

const RANGES = [{ key: '7d', label: '7 Days' }, { key: '30d', label: '30 Days' }, { key: '90d', label: '90 Days' }]

export default function TeacherClassProgress() {
  const { auth } = useAuth()
  const [range, setRange] = useState('7d')

  const isReal = isRealBackendAuth(auth)

  const [loading, setLoading] = useState(isReal)
  const [error, setError] = useState(null)
  const [realProgress, setRealProgress] = useState(null)

  const fetchProgress = () => {
    if (!isReal) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    endpoints.teacherProgress(null, range)
      .then((res) => {
        setRealProgress(res)
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.message || 'Could not load class progress')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchProgress()
  }, [isReal, range])

  // Demo fallback
  const demoStudents = !isReal ? getStudents() : []
  const demoProgress = !isReal ? getClassLearningProgress() : []
  const demoInsights = !isReal ? getClassInsights() : []

  const demoDistribution = { Improving: 0, 'Strong Progress': 0, 'Needs Practice': 0 }
  if (!isReal) {
    demoStudents.forEach((s) => { demoDistribution[getStudentStatus(s, ERROR_PATTERNS[s.id] || [])]++ })
  }

  const chartData = isReal
    ? (realProgress?.skills || []).map((s) => ({ skill: s.label, value: s.value }))
    : demoProgress.map((s) => ({ skill: s.label, value: s.value }))

  const distribution = isReal
    ? (realProgress?.distribution || { Improving: 0, 'Strong Progress': 0, 'Needs Practice': 0 })
    : demoDistribution

  const totalStudents = Object.values(distribution).reduce((a, b) => a + b, 0) || 1

  // Real participation from database sessions (ZERO artificial multipliers!)
  const participation = isReal
    ? (realProgress?.participation || [])
    : [
        { activity: 'Read With Me', count: 6 },
        { activity: 'Speak & Shine', count: 5 },
        { activity: 'Sound Safari', count: 4 },
        { activity: 'Word Builder', count: 4 },
        { activity: 'Story Time', count: 3 },
      ]

  const insights = isReal
    ? (realProgress?.insights || [])
    : demoInsights

  return (
    <TeacherShell title="Class Progress" subtitle="Is the class improving? Here's the trend.">
      <div className="flex gap-2 mb-6">
        {RANGES.map((r) => (
          <button key={r.key} onClick={() => setRange(r.key)}
            className={`px-4 py-2 rounded-2xl text-sm font-display font-semibold transition-colors ${range === r.key ? 'bg-brand-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {error && (
        <Card className="mb-6 bg-coral-50 border border-coral-200 text-center">
          <p className="font-display font-bold text-coral-700 mb-1">Could not load progress ⚠️</p>
          <p className="text-xs text-slate-500 mb-3">{error}</p>
          <Button size="sm" onClick={fetchProgress}>Retry 🔄</Button>
        </Card>
      )}

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-5 mb-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          {realProgress?.note && (
            <p className="text-xs text-brand-600 mb-4 font-semibold">{realProgress.note}</p>
          )}

          <div className="grid lg:grid-cols-2 gap-5 mb-6">
            <Card>
              <p className="font-display font-bold text-slate-700 mb-4">Average Class Skill Scores</p>
              {chartData.length === 0 ? (
                <p className="text-sm text-slate-400 py-16 text-center">No skill assessments recorded for this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                    <XAxis dataKey="skill" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#12aeef" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card>
              <p className="font-display font-bold text-slate-700 mb-4">Student Distribution</p>
              <div className="flex flex-col gap-4 justify-center h-full">
                {Object.entries(distribution).map(([label, count]) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm font-semibold text-slate-600 mb-1">
                      <span>{label}</span><span>{count} student{count === 1 ? '' : 's'}</span>
                    </div>
                    <ProgressBar value={(count / totalStudents) * 100} colorHex={label === 'Needs Practice' ? '#ff8a4c' : label === 'Strong Progress' ? '#12aeef' : '#2fd486'} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-6">
            <Card>
              <p className="font-display font-bold text-slate-700 mb-4">Skill Averages</p>
              <div className="flex flex-col gap-3">
                {(isReal ? (realProgress?.skills || []) : demoProgress).map((s) => (
                  <div key={s.key} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                    <span className="text-sm font-semibold text-slate-600">{s.emoji} {s.label}</span>
                    <span className="text-xs font-bold text-slate-500">{s.value}%</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="font-display font-bold text-slate-700 mb-4">Activity Participation</p>
              {participation.length === 0 ? (
                <p className="text-sm text-slate-400 py-16 text-center">No activity recorded during this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={participation} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis dataKey="activity" type="category" width={100} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#2fd486" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {insights.length > 0 && (
            <Card>
              <p className="font-display font-bold text-slate-700 mb-3">Learning Insights</p>
              <div className="flex flex-col gap-2.5">
                {insights.map((i, idx) => <p key={idx} className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5">💡 {i}</p>)}
              </div>
            </Card>
          )}
        </>
      )}
    </TeacherShell>
  )
}

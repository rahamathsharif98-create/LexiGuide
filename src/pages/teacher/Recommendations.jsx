import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { TeacherShell } from './TeacherShell'
import { Card, Button, Skeleton } from '../../components/ui'
import { ProfileAvatar } from '../../components/ProfileAvatar'
import { getTeacherRecommendations } from '../../services/teacherService'
import { endpoints } from '../../services/api'

const PRIORITY_STYLE = {
  'High attention': 'bg-peach-100 text-peach-700',
  'Worth practicing': 'bg-sun-100 text-sun-700',
  'Going well': 'bg-mint-100 text-mint-700',
}

export default function TeacherRecommendations() {
  const { auth } = useAuth()
  const navigate = useNavigate()

  const isReal = Boolean(auth?.isAuthenticated && auth?.token)

  const [loading, setLoading] = useState(isReal)
  const [error, setError] = useState(null)
  const [realRecs, setRealRecs] = useState([])

  const fetchRecommendations = () => {
    if (!isReal) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    endpoints.teacherRecommendations()
      .then((res) => {
        setRealRecs(Array.isArray(res) ? res : [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.message || 'Could not load class recommendations')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchRecommendations()
  }, [isReal])

  const demoRecs = getTeacherRecommendations()

  const recs = isReal && realRecs.length > 0 ? realRecs : demoRecs

  return (
    <TeacherShell title="Recommendations" subtitle="Generated from the same adaptive engine used across the whole class — never random">
      {error && (
        <Card className="mb-6 bg-coral-50 border border-coral-200 text-center">
          <p className="font-display font-bold text-coral-700 mb-1">Could not load recommendations ⚠️</p>
          <p className="text-xs text-slate-500 mb-3">{error}</p>
          <Button size="sm" onClick={fetchRecommendations}>Retry 🔄</Button>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : recs.length === 0 ? (
        <Card className="text-center py-14 text-slate-400">No recommendations right now — the class is progressing steadily.</Card>
      ) : (
        <div className="flex flex-col gap-4">
          {recs.map((r, i) => (
            <Card key={i}>
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <p className="font-display font-bold text-slate-800">{r.title}</p>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${PRIORITY_STYLE[r.priority] || 'bg-brand-100 text-brand-700'}`}>{r.priority}</span>
              </div>
              <p className="text-sm text-slate-500 mb-3"><span className="font-semibold text-slate-600">Reason: </span>{r.reason}</p>

              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Students Affected</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {(r.students || []).map((s) => (
                  <button key={s.id} onClick={() => navigate(`/teacher/students/${s.id}`)}
                    className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 rounded-full pl-1 pr-3 py-1 transition-colors">
                    <ProfileAvatar emoji={s.avatar || '👤'} colorName={s.color || 'brand'} size={22} />
                    <span className="text-xs font-semibold text-slate-600">{s.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500"><span className="font-semibold text-slate-600">Suggested activity: </span>{r.suggestedActivity || r.title}</p>
                <Button size="sm" variant="soft" onClick={() => navigate('/teacher/students')}>Assign</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-400 mt-6 text-center">
        These are educational observations to guide practice — not a clinical diagnosis.
      </p>
    </TeacherShell>
  )
}

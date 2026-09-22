import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth, isRealBackendAuth } from '../../context/AuthContext'
import { ParentShell } from './ParentShell'
import { Card, Skeleton, Button } from '../../components/ui'
import { getRecentActivity } from '../../services/parentService'
import { endpoints } from '../../services/api'

const FILTERS = ['All', 'Reading', 'Speaking', 'Games', 'Stories']

const CATEGORY_MAP = {
  readingFluency: 'Reading',
  pronunciation: 'Speaking',
  phonologicalAwareness: 'Games',
  wordRecognition: 'Games',
  comprehension: 'Stories',
}

const SKILL_FOR_KEY = {
  readingFluency: 'Reading Fluency',
  pronunciation: 'Pronunciation',
  phonologicalAwareness: 'Phonological Awareness',
  wordRecognition: 'Word Recognition',
  comprehension: 'Comprehension',
}

export default function ParentActivities() {
  const { activeChild } = useApp()
  const { auth } = useAuth()
  const [filter, setFilter] = useState('All')

  const isReal = isRealBackendAuth(auth)
  const childId = activeChild?.id

  const [loading, setLoading] = useState(isReal)
  const [error, setError] = useState(null)
  const [realSessions, setRealSessions] = useState([])

  const fetchActivities = () => {
    if (!isReal || !childId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    endpoints.parentChildActivities(childId)
      .then((res) => {
        setRealSessions(Array.isArray(res) ? res : [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.message || 'Could not load activity history')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchActivities()
  }, [isReal, childId])

  const demoSessions = useMemo(() => (!isReal ? getRecentActivity(activeChild, 12) : []), [isReal, activeChild])

  const sessions = useMemo(() => {
    if (!isReal) return demoSessions
    return realSessions.map((s) => {
      const outcome = s.outcome || {}
      const title = outcome.title || s.activity_name || s.skill || 'Learning Session'
      const acc = outcome.accuracy ?? (outcome.metrics?.accuracy ?? 80)
      const cat = CATEGORY_MAP[s.skill] || (
        title.toLowerCase().includes('read') ? 'Reading' :
        title.toLowerCase().includes('speak') ? 'Speaking' :
        title.toLowerCase().includes('story') ? 'Stories' : 'Games'
      )
      return {
        id: s.id,
        label: title,
        category: cat,
        skill: SKILL_FOR_KEY[s.skill] || s.skill || 'General Practice',
        icon: cat === 'Reading' ? '⏱️' : cat === 'Speaking' ? '🎤' : cat === 'Stories' ? '📖' : '🧩',
        date: s.completed_at ? new Date(s.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently',
        stars: s.stars ?? Math.max(1, Math.round(Number(acc) / 20)),
        xp: s.xp ?? Math.round(Number(acc) / 5),
      }
    })
  }, [isReal, demoSessions, realSessions])

  const filtered = filter === 'All' ? sessions : sessions.filter((s) => s.category === filter)

  return (
    <ParentShell title="Activity History" subtitle={`Everything ${activeChild?.name || 'your child'} has practiced recently`}>
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-2xl text-sm font-display font-semibold transition-colors ${filter === f ? 'bg-brand-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <Card className="mb-6 bg-coral-50 border border-coral-200 text-center">
          <p className="font-display font-bold text-coral-700 mb-1">Could not load activities ⚠️</p>
          <p className="text-xs text-slate-500 mb-3">{error}</p>
          <Button size="sm" onClick={fetchActivities}>Retry 🔄</Button>
        </Card>
      )}

      {loading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <Card className="!p-0 overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-14">No activities in this category yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center text-xl shrink-0">{s.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-slate-700 text-sm">{s.label}</p>
                    <p className="text-xs text-slate-400">{s.date} · {s.skill}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm">{'⭐'.repeat(Math.max(1, Math.min(5, s.stars)))}</p>
                    <p className="text-[11px] text-slate-400">+{s.xp} XP</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </ParentShell>
  )
}

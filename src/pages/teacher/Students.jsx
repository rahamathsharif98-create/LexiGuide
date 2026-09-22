import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TeacherShell } from './TeacherShell'
import { ERROR_PATTERNS } from '../../data/demoData'
import { Card, ProgressBar } from '../../components/ui'
import { ProfileAvatar } from '../../components/ProfileAvatar'
import { getStudents, getStudentStatus } from '../../services/teacherService'
import { getFriendlySkills } from '../../data/demoData'
import { useApiData } from '../../hooks/useApiData'
import { endpoints } from '../../services/api'
import { Search, Wifi, WifiOff } from 'lucide-react'

const FILTERS = ['All', 'Needs Practice', 'Improving', 'Strong Progress']
const STATUS_STYLE = {
  'Needs Practice': 'bg-peach-100 text-peach-700',
  'Improving': 'bg-mint-100 text-mint-700',
  'Strong Progress': 'bg-brand-100 text-brand-700',
}

export default function TeacherStudents() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [sortBy, setSortBy] = useState('name')

  const mockStudents = getStudents()
  // Step 3 ID Harmonization: load real backend students when available.
  const fetchTeacherStudents = () => endpoints.teacherStudents().catch(() => endpoints.students())
  const { data: apiStudents, source } = useApiData(fetchTeacherStudents, () => mockStudents, [])
  const students = useMemo(() => {
    if (source !== 'api' || !apiStudents || !Array.isArray(apiStudents)) return mockStudents
    return apiStudents.map((apiS) => {
      const demo = mockStudents.find((m) => String(m.id) === String(apiS.id) || m.name === apiS.name) || {}
      return {
        ...demo,
        ...apiS,
        id: apiS.id, // CANONICAL BACKEND STUDENT ID PRESERVED
        name: apiS.name,
        age: apiS.age ?? demo.age,
        avatar: apiS.avatar ?? demo.avatar ?? '👤',
        fingerprint: demo.fingerprint || {
          phonologicalAwareness: 60,
          pronunciation: 60,
          wordRecognition: 60,
          readingFluency: 60,
          comprehension: 60,
        },
      }
    })
  }, [mockStudents, apiStudents, source])

  const filtered = useMemo(() => {
    let list = students
      .map((s) => ({ ...s, status: getStudentStatus(s, ERROR_PATTERNS[s.id] || []), friendly: getFriendlySkills(s.fingerprint) }))
      .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    if (filter !== 'All') list = list.filter((s) => s.status === filter)
    return [...list].sort((a, b) => sortBy === 'level' ? b.level - a.level : a.name.localeCompare(b.name))
  }, [query, filter, sortBy, students])

  return (
    <TeacherShell title="Students" subtitle={`${filtered.length} of ${students.length} students`}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-4">
        {source === 'api' ? <><Wifi size={13} className="text-mint-500" /> Connected to live backend</> : <><WifiOff size={13} /> Using demo data (backend not connected)</>}
      </div>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search students…"
            className="w-full border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-sm bg-white" />
        </div>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-2xl text-sm font-display font-semibold transition-colors ${filter === f ? 'bg-brand-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            {f}
          </button>
        ))}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white">
          <option value="name">Sort: Name</option>
          <option value="level">Sort: Level</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-14 text-slate-400">No students match this view.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const strongest = [...s.friendly].sort((a, b) => b.value - a.value)[0]
            const weakest = [...s.friendly].sort((a, b) => a.value - b.value)[0]
            const avg = Math.round(s.friendly.reduce((sum, f) => sum + f.value, 0) / s.friendly.length)
            return (
              <button key={s.id} onClick={() => navigate(`/teacher/students/${s.id}`)} className="text-left">
                <Card hover>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <ProfileAvatar emoji={s.avatar} colorName={s.color} size={44} />
                      <div>
                        <p className="font-display font-bold text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-400">Age {s.age} · Level {s.level}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                  </div>
                  <ProgressBar value={avg} colorHex="#12aeef" />
                  <div className="flex justify-between mt-2 text-[11px] text-slate-400">
                    <span>💪 Strongest: {strongest.label}</span>
                    <span>🎯 Practice: {weakest.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Last activity: {s.lastActivity}</p>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </TeacherShell>
  )
}

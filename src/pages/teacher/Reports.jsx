import { useState, useEffect } from 'react'
import { useAuth, isRealBackendAuth } from '../../context/AuthContext'
import { TeacherShell } from './TeacherShell'
import { CLASS_STUDENTS, SKILL_KEYS, SKILL_LABELS, ERROR_PATTERNS } from '../../data/demoData'
import { Card, Button, Skeleton } from '../../components/ui'
import { endpoints } from '../../services/api'
import { FileDown } from 'lucide-react'

export default function TeacherReports() {
  const { auth } = useAuth()
  const isReal = isRealBackendAuth(auth)

  const [studentId, setStudentId] = useState(CLASS_STUDENTS[0].id)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(isReal)
  const [error, setError] = useState(null)
  const [realStudents, setRealStudents] = useState([])
  const [studentFingerprint, setStudentFingerprint] = useState(null)

  useEffect(() => {
    if (!isReal) {
      setLoading(false)
      return
    }
    setLoading(true)
    endpoints.teacherStudents()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setRealStudents(res)
          setStudentId(res[0].id)
        }
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.message || 'Could not load student list')
        setLoading(false)
      })
  }, [isReal])

  useEffect(() => {
    if (!isReal || !studentId) return
    endpoints.studentFingerprint(studentId)
      .then((res) => setStudentFingerprint(res))
      .catch(() => setStudentFingerprint(null))
  }, [isReal, studentId])

  const studentsList = isReal && realStudents.length > 0 ? realStudents : CLASS_STUDENTS
  const currentStudent = studentsList.find((s) => String(s.id) === String(studentId)) || studentsList[0]

  const fp = isReal && studentFingerprint?.current
    ? {
        phonologicalAwareness: studentFingerprint.current.phonological_awareness ?? 60,
        readingFluency: studentFingerprint.current.reading_fluency ?? 60,
        pronunciation: studentFingerprint.current.pronunciation ?? 60,
        comprehension: studentFingerprint.current.comprehension ?? 60,
        wordRecognition: studentFingerprint.current.word_recognition ?? 60,
      }
    : (currentStudent?.fingerprint || {
        phonologicalAwareness: 60,
        readingFluency: 60,
        pronunciation: 60,
        comprehension: 60,
        wordRecognition: 60,
      })

  const patterns = isReal
    ? (studentFingerprint?.observations || []).map((o) => ({
        pattern: o.pattern || o.description || 'Observed reading pattern',
        trend: 'observed',
      }))
    : (ERROR_PATTERNS[currentStudent?.id] || [])

  const download = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      const content = `READING PROFILE REPORT\nStudent: ${currentStudent.name} (Age ${currentStudent.age || 'N/A'})\nLevel: ${currentStudent.level || 1}\n\nSKILL PERFORMANCE\n${SKILL_KEYS.map((k) => `- ${SKILL_LABELS[k]}: ${fp[k] ?? 0}%`).join('\n')}\n\nOBSERVED RECURRING PATTERNS\n${patterns.length > 0 ? patterns.map((p) => `- ${p.pattern} (${p.trend})`).join('\n') : '- No recurring error patterns recorded.'}\n\nDISCLAIMER\nThis platform provides educational screening and learning support. It does not provide a clinical diagnosis of dyslexia.`
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentStudent.name}-report.txt`
      a.click()
      URL.revokeObjectURL(url)
    }, 600)
  }

  return (
    <TeacherShell title="Reports" subtitle="Generate a shareable student report">
      {error && (
        <Card className="max-w-2xl mx-auto mb-6 bg-coral-50 border border-coral-200 text-center">
          <p className="font-display font-bold text-coral-700 mb-1">Could not load report ⚠️</p>
          <p className="text-xs text-slate-500 mb-3">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="max-w-2xl mx-auto p-8">
          <Skeleton className="h-48 rounded-2xl" />
        </Card>
      ) : (
        <Card className="max-w-2xl mx-auto">
          <select
            value={studentId}
            onChange={(e) => setStudentId(Number(e.target.value) || e.target.value)}
            className="border border-slate-200 rounded-2xl px-4 py-2.5 text-sm mb-5 w-full bg-white font-semibold text-slate-700"
          >
            {studentsList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (ID #{s.id})
              </option>
            ))}
          </select>

          <h2 className="font-display font-bold text-lg text-slate-800 mb-3">{currentStudent?.name}'s Reading Profile</h2>
          <ul className="text-sm text-slate-600 mb-4 grid grid-cols-2 gap-1">
            {SKILL_KEYS.map((k) => (
              <li key={k}>
                {SKILL_LABELS[k]}: <strong>{fp[k] ?? 0}%</strong>
              </li>
            ))}
          </ul>

          <p className="font-display font-bold text-xs text-slate-400 uppercase tracking-wide mb-1">Observed Patterns</p>
          {patterns.length === 0 ? (
            <p className="text-xs text-slate-400 mb-5">No recurring patterns or difficulties detected.</p>
          ) : (
            <ul className="text-sm text-slate-600 mb-5 list-disc list-inside">
              {patterns.map((p, i) => (
                <li key={i}>
                  {p.pattern} ({p.trend})
                </li>
              ))}
            </ul>
          )}

          <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-400 mb-5">
            This platform provides educational screening and learning support. It does not provide a clinical diagnosis of dyslexia.
          </div>

          <Button className="w-full" icon={<FileDown size={18} />} onClick={download} disabled={generating}>
            {generating ? 'Preparing report…' : 'Download Report'}
          </Button>
        </Card>
      )}
    </TeacherShell>
  )
}

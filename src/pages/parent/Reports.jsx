import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { ParentShell } from './ParentShell'
import { Card, Button, Skeleton } from '../../components/ui'
import { SKILL_KEYS, SKILL_LABELS } from '../../data/demoData'
import { endpoints } from '../../services/api'
import { FileDown } from 'lucide-react'

export default function ParentReports() {
  const { activeChild, errorPatterns } = useApp()
  const { auth } = useAuth()
  const [generating, setGenerating] = useState(false)

  const isReal = Boolean(auth?.isAuthenticated && auth?.token)
  const childId = activeChild?.id

  const [loading, setLoading] = useState(isReal)
  const [error, setError] = useState(null)
  const [realFingerprint, setRealFingerprint] = useState(null)
  const [realSummary, setRealSummary] = useState(null)

  useEffect(() => {
    if (!isReal || !childId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    Promise.all([
      endpoints.parentChildFingerprint(childId).catch(() => null),
      endpoints.parentChildSummary(childId).catch(() => null),
    ])
      .then(([fpRes, summaryRes]) => {
        setRealFingerprint(fpRes)
        setRealSummary(summaryRes)
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.message || 'Could not load report data')
        setLoading(false)
      })
  }, [isReal, childId])

  const demoFp = activeChild?.fingerprint || {}

  const fp = isReal && realFingerprint?.current
    ? {
        phonologicalAwareness: realFingerprint.current.phonological_awareness ?? 60,
        readingFluency: realFingerprint.current.reading_fluency ?? 60,
        pronunciation: realFingerprint.current.pronunciation ?? 60,
        comprehension: realFingerprint.current.comprehension ?? 60,
        wordRecognition: realFingerprint.current.word_recognition ?? 60,
      }
    : demoFp

  const patterns = isReal
    ? (realFingerprint?.observations || []).map((o) => ({
        pattern: o.pattern || o.description || 'Observed reading pattern',
        trend: 'observed',
        sessions: o.session_count || 1,
      }))
    : errorPatterns

  const childName = activeChild?.name || 'Child'
  const childAge = activeChild?.age || 'N/A'
  const completedActivities = isReal ? (realSummary?.activities_completed ?? 0) : (activeChild?.level || 1) * 3

  const download = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      const content = buildReportText(childName, childAge, completedActivities, fp, patterns)
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${childName}-reading-report.txt`
      a.click()
      URL.revokeObjectURL(url)
    }, 600)
  }

  return (
    <ParentShell title="Reports" subtitle="Preview and export a shareable progress report">
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
          <div className="text-center mb-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Report Preview</p>
            <h2 className="font-display font-bold text-xl text-slate-800 mt-1">{childName}'s Reading Profile</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-5">
            <Info label="Age" value={childAge} />
            <Info label="Completed Activities" value={completedActivities} />
          </div>

          <p className="font-display font-bold text-sm text-slate-700 mb-2">Skill Performance</p>
          <ul className="text-sm text-slate-600 mb-5 grid grid-cols-2 gap-1">
            {SKILL_KEYS.map((k) => (
              <li key={k}>
                {SKILL_LABELS[k]}: <strong>{fp[k] ?? 0}%</strong>
              </li>
            ))}
          </ul>

          <p className="font-display font-bold text-sm text-slate-700 mb-2">Observed Patterns</p>
          {patterns.length === 0 ? (
            <p className="text-xs text-slate-400 mb-5">No recurring difficulties or errors noted across sessions.</p>
          ) : (
            <ul className="text-sm text-slate-600 mb-5 list-disc list-inside">
              {patterns.map((p, i) => (
                <li key={i}>
                  {p.pattern} {p.sessions ? `(seen in ${p.sessions} sessions)` : ''}
                </li>
              ))}
            </ul>
          )}

          <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-400 mb-5">
            This platform provides educational learning support and screening. It does not provide a clinical diagnosis of dyslexia.
          </div>

          <Button className="w-full" icon={<FileDown size={18} />} onClick={download} disabled={generating}>
            {generating ? 'Preparing report…' : 'Download Report'}
          </Button>
        </Card>
      )}
    </ParentShell>
  )
}

function Info({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="font-bold text-slate-700">{value}</p>
    </div>
  )
}

function buildReportText(name, age, activities, fp, patterns) {
  return `READING PROFILE REPORT
Child: ${name} (Age: ${age})
Completed Activities: ${activities}

SKILL PERFORMANCE
${SKILL_KEYS.map((k) => `- ${SKILL_LABELS[k]}: ${fp[k] ?? 0}%`).join('\n')}

OBSERVED PATTERNS
${patterns.length > 0 ? patterns.map((p) => `- ${p.pattern}`).join('\n') : '- No persistent difficulties detected.'}

DISCLAIMER
This platform provides educational screening and learning support.
It does not provide a clinical diagnosis of dyslexia.
`
}

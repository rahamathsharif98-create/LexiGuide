import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth, isRealBackendAuth } from '../../context/AuthContext'
import { ParentShell } from './ParentShell'
import { Card, ProgressRing, Skeleton, Button } from '../../components/ui'
import { FingerprintRadar, FingerprintTrend } from '../../components/FingerprintChart'
import { SKILL_KEYS, SKILL_LABELS, SKILL_COLORS } from '../../data/demoData'
import { endpoints } from '../../services/api'

export default function ParentFingerprint() {
  const { activeChild, history, errorPatterns } = useApp()
  const { auth } = useAuth()

  const isReal = isRealBackendAuth(auth)
  const childId = activeChild?.id

  const [loading, setLoading] = useState(isReal)
  const [error, setError] = useState(null)
  const [realFingerprintData, setRealFingerprintData] = useState(null)

  const fetchFingerprint = () => {
    if (!isReal || !childId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    endpoints.parentChildFingerprint(childId)
      .then((res) => {
        setRealFingerprintData(res)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchFingerprint()
  }, [isReal, childId])

  const demoFp = activeChild?.fingerprint || {
    phonologicalAwareness: 60,
    pronunciation: 60,
    wordRecognition: 60,
    readingFluency: 60,
    comprehension: 60,
  }

  const fp = isReal && realFingerprintData?.current
    ? {
        phonologicalAwareness: realFingerprintData.current.phonological_awareness ?? 60,
        readingFluency: realFingerprintData.current.reading_fluency ?? 60,
        pronunciation: realFingerprintData.current.pronunciation ?? 60,
        comprehension: realFingerprintData.current.comprehension ?? 60,
        wordRecognition: realFingerprintData.current.word_recognition ?? 60,
      }
    : demoFp

  const sorted = [...SKILL_KEYS].sort((a, b) => (fp[b] ?? 0) - (fp[a] ?? 0))
  const strengths = sorted.slice(0, 2)
  const developing = sorted.slice(2, 4)
  const needsPractice = sorted.slice(4)

  const persistentPatterns = isReal
    ? (realFingerprintData?.observations || []).map((o) => ({
        pattern: o.pattern || o.description || 'Observed reading pattern',
        sessions: o.session_count || 1,
      }))
    : errorPatterns.filter((p) => p.trend === 'persistent')

  const hasCrossLang = !isReal && activeChild?.crossLanguage && Object.keys(activeChild.crossLanguage).length > 1

  return (
    <ParentShell title="Reading Fingerprint" subtitle={`${activeChild?.name || 'Child'}'s detailed skill profile`}>
      {error && (
        <Card className="mb-6 bg-coral-50 border border-coral-200 text-center">
          <p className="font-display font-bold text-coral-700 mb-1">Could not load Reading Fingerprint ⚠️</p>
          <p className="text-xs text-slate-500 mb-3">{error}</p>
          <Button size="sm" onClick={fetchFingerprint}>Retry 🔄</Button>
        </Card>
      )}

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-5 mb-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-5 mb-6">
            <Card><FingerprintRadar fingerprint={fp} height={280} /></Card>
            <Card>
              <p className="font-display font-bold text-slate-700 mb-3">Skill Scores</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {SKILL_KEYS.map((k) => (
                  <div key={k} className="text-center">
                    <ProgressRing value={fp[k] ?? 0} size={68} color={SKILL_COLORS[k]} />
                    <p className="text-[11px] font-display font-bold text-slate-600 mt-1 leading-tight">{SKILL_LABELS[k]}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <SummaryCard title="Strengths" tone="mint" items={strengths.map((k) => SKILL_LABELS[k])} />
            <SummaryCard title="Developing" tone="sun" items={developing.map((k) => SKILL_LABELS[k])} />
            <SummaryCard title="Needs Practice" tone="peach" items={needsPractice.map((k) => SKILL_LABELS[k])} />
          </div>

          <Card className="mb-6">
            <p className="font-display font-bold text-slate-700 mb-3">Observed Reading Patterns</p>
            {persistentPatterns.length === 0 ? (
              <p className="text-sm text-slate-400">No persistent patterns detected across recent sessions.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {persistentPatterns.map((p, i) => (
                  <li key={i} className="flex items-center justify-between bg-peach-50 rounded-xl px-4 py-2.5 border border-peach-100">
                    <span className="text-sm font-semibold text-slate-700">{p.pattern}</span>
                    <span className="text-xs text-slate-400">Seen in {p.sessions} session{p.sessions === 1 ? '' : 's'}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-slate-400 mt-4">
              These observations indicate areas where additional educational practice may be beneficial. This is an
              educational learning-support tool and does not provide a clinical diagnosis.
            </p>
          </Card>

          {hasCrossLang && (
            <Card>
              <p className="font-display font-bold text-slate-700 mb-3">Cross-Language Profile</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(activeChild.crossLanguage).map(([lang, scores]) => (
                  <div key={lang} className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">{lang === 'en' ? 'English' : lang === 'te' ? 'Telugu' : 'Hindi'}</p>
                    {Object.entries(scores).map(([skill, val]) => (
                      <div key={skill} className="flex justify-between text-sm text-slate-600 mb-1">
                        <span>{SKILL_LABELS[skill] || skill}</span><span className="font-bold">{val}%</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">This is an educational observation, not a diagnostic comparison.</p>
            </Card>
          )}

          <Card className="mt-6">
            <p className="font-display font-bold text-slate-700 mb-2">Progress Timeline</p>
            <FingerprintTrend history={history} height={260} />
          </Card>

          <p className="text-xs text-slate-400 mt-4 text-center">
            Educational screening tool for reading progress. Not a medical or clinical diagnosis.
          </p>
        </>
      )}
    </ParentShell>
  )
}

function SummaryCard({ title, tone, items }) {
  const tones = { mint: 'bg-mint-50 border-mint-100 text-mint-700', sun: 'bg-sun-50 border-sun-100 text-sun-700', peach: 'bg-peach-50 border-peach-100 text-peach-700' }
  return (
    <Card className={`${tones[tone]} border`}>
      <p className="text-xs font-bold uppercase mb-2">{title}</p>
      <ul className="text-sm font-semibold text-slate-700 flex flex-col gap-1">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </Card>
  )
}

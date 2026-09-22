import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { ParentShell } from './ParentShell'
import { Card, Button, Skeleton } from '../../components/ui'
import { getRecommendationsForParent, getAreasToPractice } from '../../services/parentService'
import { endpoints } from '../../services/api'

export default function ParentRecommendations() {
  const { activeChild, errorPatterns } = useApp()
  const { auth } = useAuth()
  const navigate = useNavigate()

  const isReal = Boolean(auth?.isAuthenticated && auth?.token)
  const childId = activeChild?.id

  const [loading, setLoading] = useState(isReal)
  const [error, setError] = useState(null)
  const [realRecommendations, setRealRecommendations] = useState([])
  const [realFingerprint, setRealFingerprint] = useState(null)
  const [personalizedContent, setPersonalizedContent] = useState(null)

  const fetchRecs = () => {
    if (!isReal || !childId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    Promise.all([
      endpoints.parentChildRecommendations(childId).catch(() => []),
      endpoints.parentChildFingerprint(childId).catch(() => null),
      typeof endpoints.personalizedContent === 'function'
        ? endpoints.personalizedContent(childId).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([recsRes, fpRes, persRes]) => {
        setRealRecommendations(Array.isArray(recsRes) ? recsRes : [])
        setRealFingerprint(fpRes)
        setPersonalizedContent(persRes)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchRecs()
  }, [isReal, childId])

  // Demo fallback
  const demoRecs = getRecommendationsForParent(activeChild, errorPatterns)
  const demoAreas = getAreasToPractice(activeChild, errorPatterns)

  const recs = isReal && personalizedContent?.candidates?.length > 0
    ? personalizedContent.candidates.slice(0, 6).map((c) => ({
        icon: c.content?.icon || '🎯',
        title: c.content?.title || 'Practice Activity',
        parentReason: c.why || 'Personalized based on Reading Fingerprint needs.',
        priority: c.learning_mode ? c.learning_mode.replace('_', ' ') : 'Practice needed',
        difficulty: typeof c.content?.difficulty_level === 'number' ? `Level ${c.content.difficulty_level}` : 'Adapted',
      }))
    : (isReal && realRecommendations.length > 0
        ? realRecommendations.map((r, i) => ({
            icon: r.icon || '🎯',
            title: r.activity_name || r.title || 'Practice Activity',
            parentReason: r.reason || 'Recommended based on recent learning sessions and skill patterns.',
            priority: r.priority || 'Practice needed',
          }))
        : demoRecs)

  const areas = isReal && realFingerprint && Array.isArray(realFingerprint.observations) && realFingerprint.observations.length > 0
    ? realFingerprint.observations.map((o) => ({
        skill: o.pattern || 'Observed Area',
        pattern: o.pattern || 'Needs attention',
        note: o.description || 'Recent practice indicates opportunity for growth.',
        action: 'Practice targeted activities',
      }))
    : demoAreas

  return (
    <ParentShell title={`Recommended for ${activeChild?.name || 'your child'}`} subtitle="Generated from recent activity and skill patterns — never random">
      {error && (
        <Card className="mb-6 bg-coral-50 border border-coral-200 text-center">
          <p className="font-display font-bold text-coral-700 mb-1">Could not load recommendations ⚠️</p>
          <p className="text-xs text-slate-500 mb-3">{error}</p>
          <Button size="sm" onClick={fetchRecs}>Retry 🔄</Button>
        </Card>
      )}

      {/* Step 19: Multimodal Support Level & Fading Trajectory */}
      <Card className="mb-6 bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-slate-50 border border-sky-200/60" data-testid="parent-multimodal-support-panel">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h3 className="font-display font-bold text-sm text-slate-800">Adaptive Presentation &amp; Support Level</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800" data-testid="parent-support-level-badge">
            Support Level: {personalizedContent?.adaptive_difficulty >= 3 ? 'Independent' : 'Guided'}
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Practice adapts between <strong>Guided Support</strong> and <strong>Independent Practice</strong> based on your child's recent accuracy. Scaffolding is gently faded as confidence and fluency improve.
        </p>
      </Card>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      ) : (
        <>
          {recs.length === 0 ? (
            <Card className="text-center py-12 text-slate-400 mb-8">
              No specific recommendations at this time. Your child is progressing steadily!
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {recs.map((r, i) => (
                <Card key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{r.icon}</span>
                    <div className="flex items-center gap-1.5">
                      {r.priority && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                          {r.priority}
                        </span>
                      )}
                      {r.difficulty && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {r.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-display font-bold text-slate-800">{r.title}</p>
                  <p className="text-xs text-slate-500 mt-2 mb-1 font-semibold">Reason: <span className="font-normal text-slate-400">Educational Rationale</span></p>
                  <p className="text-xs text-slate-500">{r.parentReason}</p>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <p className="font-display font-bold text-slate-700 mb-1">Observed Reading Patterns</p>
            <p className="text-xs text-slate-400 mb-4">
              Patterns noticed across {activeChild?.name || 'your child'}'s recent learning sessions — these guide practice, not a diagnosis.
            </p>
            {areas.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No persistent difficulties or error patterns observed.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {areas.map((a, i) => (
                  <div key={i} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-display font-semibold text-slate-700">{a.title}</p>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">{a.reason}</p>
                    <Button size="sm" onClick={() => navigate('/parent/fingerprint')}>See Details</Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-5">
              These are educational observations to guide practice — not a clinical diagnosis.
            </p>
          </Card>
        </>
      )}
    </ParentShell>
  )
}

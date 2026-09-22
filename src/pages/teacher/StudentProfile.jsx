import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, isRealBackendAuth } from '../../context/AuthContext'
import { TeacherShell } from './TeacherShell'
import { ERROR_PATTERNS, RECOMMENDED_SUPPORT, SKILL_KEYS, SKILL_LABELS, SKILL_COLORS, getFriendlySkills } from '../../data/demoData'
import { Card, ProgressBar, ProgressRing, Button, Skeleton } from '../../components/ui'
import { ProfileAvatar } from '../../components/ProfileAvatar'
import { FingerprintRadar, FingerprintTrend } from '../../components/FingerprintChart'
import { DayByDayTimeline } from '../../components/DayByDayTimeline'
import { getStudentById, getStudentStatus, getStudentProgressHistory } from '../../services/teacherService'
import { getRecentActivity } from '../../services/parentService'
import { endpoints } from '../../services/api'
import { ChevronLeft, Wifi, WifiOff } from 'lucide-react'
import { NextBestActionCard } from '../../components/NextBestActionCard'
import { LearningJourneyPlan } from '../../components/LearningJourneyPlan'

const RANGES = [{ key: '7d', label: '7 days' }, { key: '30d', label: '30 days' }, { key: '90d', label: '90 days' }]
const STATUS_STYLE = { 'Needs Practice': 'bg-peach-100 text-peach-700', 'Improving': 'bg-mint-100 text-mint-700', 'Strong Progress': 'bg-brand-100 text-brand-700' }

export default function TeacherStudentProfile() {
  const { studentId } = useParams()
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [range, setRange] = useState('7d')

  const isReal = isRealBackendAuth(auth)
  const numericId = Number(studentId)

  const [loading, setLoading] = useState(isReal)
  const [error, setError] = useState(null)
  const [realStudent, setRealStudent] = useState(null)
  const [realFingerprint, setRealFingerprint] = useState(null)
  const [realProgress, setRealProgress] = useState(null)
  const [realSessions, setRealSessions] = useState([])
  const [realRecs, setRealRecs] = useState([])
  const [realIntel, setRealIntel] = useState(null)
  const [realNextBestAction, setRealNextBestAction] = useState(null)
  const [realGoals, setRealGoals] = useState(null)
  const [realPlan, setRealPlan] = useState(null)
  const [realPersonalizedContent, setRealPersonalizedContent] = useState(null)

  const demoStudent = getStudentById(studentId)

  const fetchStudentData = () => {
    if (!isReal || !numericId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    Promise.all([
      endpoints.student(numericId).catch(() => null),
      endpoints.studentFingerprint(numericId).catch(() => null),
      endpoints.studentProgress(numericId, range).catch(() => null),
      endpoints.studentSessions(numericId).catch(() => []),
      endpoints.studentRecommendations(numericId).catch(() => []),
      endpoints.intelligence(numericId).catch(() => null),
      typeof endpoints.nextBestAction === 'function' ? endpoints.nextBestAction(numericId).catch(() => null) : Promise.resolve(null),
      typeof endpoints.learningGoals === 'function' ? endpoints.learningGoals(numericId).catch(() => null) : Promise.resolve(null),
      typeof endpoints.learningPlan === 'function' ? endpoints.learningPlan(numericId).catch(() => null) : Promise.resolve(null),
      typeof endpoints.personalizedContent === 'function' ? endpoints.personalizedContent(numericId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([sRes, fpRes, progRes, sessRes, recsRes, intelRes, nbaRes, goalsRes, planRes, persRes]) => {
        setRealStudent(sRes)
        setRealFingerprint(fpRes)
        setRealProgress(progRes)
        setRealSessions(Array.isArray(sessRes) ? sessRes : [])
        setRealRecs(Array.isArray(recsRes) ? recsRes : [])
        setRealIntel(intelRes)
        setRealNextBestAction(nbaRes)
        setRealGoals(goalsRes)
        setRealPlan(planRes)
        setRealPersonalizedContent(persRes)
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.message || 'Could not load student profile')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchStudentData()
  }, [isReal, numericId, range])

  if (!isReal && !demoStudent) return <div className="p-8 text-center text-slate-400">Student not found.</div>

  const student = isReal && realStudent
    ? {
        ...realStudent,
        id: realStudent.id,
        name: realStudent.name,
        age: realStudent.age || demoStudent?.age || 7,
        level: demoStudent?.level || 1,
        avatar: realStudent.avatar || demoStudent?.avatar || '👤',
        color: demoStudent?.color || 'brand',
      }
    : demoStudent

  const activeFingerprint = isReal && realFingerprint?.current
    ? {
        phonologicalAwareness: realFingerprint.current.phonological_awareness ?? 60,
        readingFluency: realFingerprint.current.reading_fluency ?? 60,
        pronunciation: realFingerprint.current.pronunciation ?? 60,
        comprehension: realFingerprint.current.comprehension ?? 60,
        wordRecognition: realFingerprint.current.word_recognition ?? 60,
      }
    : (demoStudent?.fingerprint || {
        phonologicalAwareness: 60,
        readingFluency: 60,
        pronunciation: 60,
        comprehension: 60,
        wordRecognition: 60,
      })

  const friendly = getFriendlySkills(activeFingerprint)
  const strongest = [...friendly].sort((a, b) => b.value - a.value)[0]
  const weakest = [...friendly].sort((a, b) => a.value - b.value)[0]

  const patterns = isReal
    ? (realFingerprint?.observations || []).map((o) => ({
        pattern: o.pattern || o.description || 'Observed reading pattern',
        trend: 'observed',
        severity: 50,
      }))
    : (ERROR_PATTERNS[student?.id] || [])

  const support = isReal
    ? (realRecs.length > 0
        ? realRecs.map((r) => r.reason || r.activity_name)
        : ['Short, regular practice sessions'])
    : (RECOMMENDED_SUPPORT[student?.id] || [])

  const avgFp = Math.round(Object.values(activeFingerprint).reduce((a, b) => a + b, 0) / 5)
  const status = avgFp >= 70 ? 'Strong Progress' : avgFp < 55 ? 'Needs Practice' : 'Improving'

  const sessions = isReal
    ? realSessions.map((s) => {
        const title = (s.outcome || {}).title || s.activity_name || s.skill || 'Session'
        const acc = (s.outcome || {}).accuracy ?? ((s.outcome || {}).metrics?.accuracy ?? 80)
        return {
          id: s.id,
          label: title,
          icon: '📖',
          date: s.completed_at ? new Date(s.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently',
          accuracy: Number(acc),
        }
      })
    : (demoStudent ? getRecentActivity(demoStudent, 5) : [])

  const history = isReal
    ? (realSessions.length > 0
        ? realSessions.map((s, idx) => ({
            session: `S${idx + 1}`,
            readingFluency: activeFingerprint.readingFluency,
            pronunciation: activeFingerprint.pronunciation,
            phonologicalAwareness: activeFingerprint.phonologicalAwareness,
            comprehension: activeFingerprint.comprehension,
          }))
        : (demoStudent ? getStudentProgressHistory(demoStudent, range) : []))
    : (demoStudent ? getStudentProgressHistory(demoStudent, range) : [])

  return (
    <TeacherShell
      title={student?.name || 'Student Profile'}
      subtitle={student?.class_name || 'Classroom Student'}
      right={<Button variant="ghost" size="sm" onClick={() => navigate('/teacher/students')}><ChevronLeft size={16} />Students</Button>}
    >
      {error && (
        <Card className="mb-6 bg-coral-50 border border-coral-200 text-center">
          <p className="font-display font-bold text-coral-700 mb-1">Could not load student profile ⚠️</p>
          <p className="text-xs text-slate-500 mb-3">{error}</p>
          <Button size="sm" onClick={fetchStudentData}>Retry 🔄</Button>
        </Card>
      )}

      {!error && (
        <>
          {/* Header */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <ProfileAvatar emoji={student?.avatar || '👤'} colorName={student?.color || 'brand'} size={64} ring />
            <div>
              <p className="font-display font-bold text-lg text-slate-800">{student?.name}</p>
              <p className="text-xs text-slate-400">ID #{student?.id} · Age {student?.age ?? 'N/A'}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_STYLE[status]}`}>{status}</span>
          </div>

          {/* Learning Overview */}
          <Card className="mb-6">
            <p className="font-display font-bold text-slate-700 mb-4">Learning Overview</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {friendly.map((s) => (
                <div key={s.key} className="text-center">
                  <ProgressRing value={s.value} size={64} color={s.color} />
                  <p className="text-xs font-display font-bold text-slate-600 mt-1">{s.emoji} {s.label}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-5 mb-6">
            <Card className="bg-mint-50 border border-mint-100">
              <p className="font-display font-bold text-mint-700 mb-2">Strengths</p>
              <p className="text-sm text-slate-700">Strong {strongest.label.toLowerCase()} — {strongest.emoji} {strongest.value}%</p>
            </Card>
            <Card className="bg-sun-50 border border-sun-100">
              <p className="font-display font-bold text-sun-700 mb-2">Areas to Practice</p>
              <p className="text-sm text-slate-700">Needs more practice with {weakest.label.toLowerCase()} activities.</p>
            </Card>
          </div>

          {/* Progress trend */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="font-display font-bold text-slate-700">Progress Trend</p>
              <div className="flex gap-2">
                {RANGES.map((r) => (
                  <button key={r.key} onClick={() => setRange(r.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-display font-semibold transition-colors ${range === r.key ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-500'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            {(!isReal || realSessions.length === 0) && range !== '7d' && (
              <p className="text-xs text-slate-400 mb-2 italic">Note: Historical trend for longer ranges is simulated in demo mode.</p>
            )}
            {history.length === 0 ? (
              <p className="text-sm text-slate-400 py-10 text-center">No progress history recorded for this period.</p>
            ) : (
              <FingerprintTrend history={history} height={240} />
            )}
          </Card>

          {/* Day-by-Day Learning Analysis */}
          {numericId ? (
            <DayByDayTimeline
              childId={numericId}
              isReal={isReal}
              title="Day-by-Day Student Learning Analysis"
              subtitle={`Detailed daily log of ${student?.name || 'student'}'s activity, session times, and skill shifts.`}
            />
          ) : null}

          {/* Reading Fingerprint */}
          <Card className="mb-6">
            <p className="font-display font-bold text-slate-700 mb-1 flex items-center gap-2">
              Reading Fingerprint
              {isReal ? <span className="text-[10px] font-semibold text-mint-600 flex items-center gap-1"><Wifi size={11} />Live</span> : <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1"><WifiOff size={11} />Demo data</span>}
            </p>
            <div className="grid lg:grid-cols-2 gap-5">
              <FingerprintRadar fingerprint={activeFingerprint} height={240} />
              <div className="grid grid-cols-2 gap-3">
                {SKILL_KEYS.map((k) => (
                  <div key={k}>
                    <ProgressBar value={activeFingerprint[k]} label={SKILL_LABELS[k]} colorHex={SKILL_COLORS[k]} height="h-2" />
                  </div>
                ))}
              </div>
            </div>

            <p className="font-display font-bold text-slate-700 mt-6 mb-3">Observed Reading Patterns</p>
            {patterns.length === 0 ? (
              <p className="text-xs text-slate-400">No recurring patterns or difficulties detected.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {patterns.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                      <span>{p.pattern}</span>
                      <span>{p.trend === 'persistent' ? '💪 Learning support recommended' : '➡️ Observed'}</span>
                    </div>
                    <ProgressBar value={p.severity || 60} colorHex={p.trend === 'persistent' ? '#ff8a4c' : '#2fd486'} height="h-2" />
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-4">
              These are observed learning patterns to guide practice — an educational screening tool, not a clinical diagnosis.
            </p>
          </Card>

          {realIntel && (
            <Card className="mb-6 border border-brand-100 bg-gradient-to-br from-white to-mint-50/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧠</span>
                  <p className="font-display font-bold text-slate-800 text-base">AI Learning Intelligence</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-100 text-brand-700">
                  {realIntel.fluency?.reading_pace || 'Developing Pace'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400">Average WCPM</p>
                  <p className="text-lg font-display font-bold text-slate-800">{realIntel.fluency?.average_wcpm || 0}</p>
                  <p className="text-[10px] text-slate-400">Words / Minute</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400">Pace Stability</p>
                  <p className="text-lg font-display font-bold text-slate-800">{realIntel.fluency?.fluency_stability || 'Consistent'}</p>
                  <p className="text-[10px] text-slate-400">Stability Index</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400">Primary Error</p>
                  <p className="text-lg font-display font-bold text-slate-800 capitalize">{realIntel.error_distribution?.primary_error_type || 'None'}</p>
                  <p className="text-[10px] text-slate-400">{realIntel.error_distribution?.total_errors || 0} Error Events</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400">Data Level</p>
                  <p className="text-lg font-display font-bold text-slate-800 capitalize">{realIntel.data_sufficiency?.replace('_', ' ') || 'Developing'}</p>
                  <p className="text-[10px] text-slate-400">{realIntel.total_reading_sessions || 0} Reading Sessions</p>
                </div>
              </div>

              {realIntel.guidance?.summary && (
                <div className="bg-white rounded-xl p-3 mb-3 text-xs text-slate-600 border border-slate-100">
                  <p className="font-semibold text-slate-700 mb-1">Instructional Assessment:</p>
                  <p>{realIntel.guidance.summary}</p>
                </div>
              )}

              {realIntel.guidance?.educator_tips?.length > 0 && (
                <div className="bg-mint-50/50 rounded-xl p-3 text-xs text-mint-900">
                  <p className="font-semibold mb-1">🍎 Teacher Action Items:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {realIntel.guidance.educator_tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-[11px] text-slate-400 italic mt-3 text-center">
                {realIntel.disclaimer}
              </p>
            </Card>
          )}

          {/* Step 16: Learning Goals & Weekly Learning Plan */}
          {isReal && (realGoals || realPlan) && (
            <LearningJourneyPlan
              goals={realGoals?.goals}
              weeklyPlan={realPlan}
              onRetry={fetchStudentData}
              title="Student Learning Goals & Weekly Plan"
            />
          )}

          {/* Step 15: Next Best Action Card */}
          {isReal && realNextBestAction && (
            <NextBestActionCard
              nextBestAction={realNextBestAction}
              title="Recommended Next Learning Action"
              className="mb-6"
            />
          )}

          {/* Step 19: Multimodal Presentation & Adaptive Scaffolding */}
          {isReal && (
            <Card className="mb-6 bg-gradient-to-r from-sky-50/70 via-indigo-50/30 to-purple-50/40 border border-sky-200/60" data-testid="teacher-multimodal-profile-section">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h3 className="font-display font-bold text-slate-800 text-sm">
                    Multimodal Presentation &amp; Adaptive Scaffolding
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800" data-testid="teacher-recommended-mode">
                    Mode: {realNextBestAction?.best_action?.skill === 'pronunciation' ? 'SPEAK' : 'READ_ALONG'}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800" data-testid="teacher-support-level">
                    Support: {realPersonalizedContent?.adaptive_difficulty >= 3 ? 'INDEPENDENT' : 'GUIDED'}
                  </span>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="bg-white/80 p-3 rounded-xl border border-sky-100">
                  <p className="font-bold text-slate-700 mb-1">🎯 Active Scaffolding:</p>
                  <p>{realPersonalizedContent?.adaptive_difficulty >= 3 ? 'Minimal hints, student operates independently with periodic comprehension checks.' : 'Visual word cards, image cues, and structured guidance enabled to reinforce developing skills.'}</p>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-sky-100">
                  <p className="font-bold text-slate-700 mb-1">📈 Support Fading Trajectory:</p>
                  <p>Support level gradually transitions as student demonstrates repeated mastery across sequential practice sessions.</p>
                </div>
              </div>
            </Card>
          )}

          {/* Step 17: Personalized Content Recommendations */}
          {isReal && realPersonalizedContent?.candidates?.length > 0 && (
            <Card className="mb-6" data-testid="teacher-personalized-content-section">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h3 className="font-display font-bold text-slate-800 text-sm">
                    Personalized Content Queue & Learning Modes
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {realPersonalizedContent.candidates.length} tailored items
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {realPersonalizedContent.candidates.slice(0, 4).map((cand, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800 truncate">{cand.content?.title}</span>
                        <div className="flex items-center gap-1">
                          {cand.content?.source_type && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              cand.content.source_type === 'curated' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {cand.content.source_type === 'curated' ? 'Curated' : 'Assembled'}
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-brand-700 border border-brand-100">
                            {cand.learning_mode ? cand.learning_mode.replace('_', ' ') : 'PRACTICE'}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        <span className="font-semibold text-slate-600">Why: </span>{cand.why}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>Level {cand.content?.difficulty_level} · {cand.content?.estimated_duration_minutes || 5} min</span>
                      {cand.score != null && <span>Match: {Math.round(cand.score)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent activities */}
          <Card className="mb-6">
            <p className="font-display font-bold text-slate-700 mb-3">Recent Activities</p>
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No recent activities completed yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 py-3">
                    <span className="text-xl">{s.icon}</span>
                    <div className="flex-1"><p className="text-sm font-semibold text-slate-700">{s.label}</p><p className="text-xs text-slate-400">{s.date}</p></div>
                    <span className="text-sm font-bold text-slate-600">{s.accuracy}%</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recommended learning support */}
          <Card>
            <p className="font-display font-bold text-slate-700 mb-3">Recommended Learning Support</p>
            <ul className="flex flex-col gap-2">
              {support.map((s, i) => <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-brand-500">✓</span>{s}</li>)}
            </ul>
          </Card>
        </>
      )}
    </TeacherShell>
  )
}

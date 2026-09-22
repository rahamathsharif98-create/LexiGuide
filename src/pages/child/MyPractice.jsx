import { useState } from 'react'
import { AppLink as Link } from '../../components/nav/AppLink'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { generateRecommendations, detectSkillPattern, childFriendlyPatternText } from '../../services/adaptiveEngine'
import { Card, Button, Skeleton } from '../../components/ui'
import { ChevronLeft, Target, Calendar, Sparkles, RefreshCw, Zap, Compass, Wand2 } from 'lucide-react'
import { NextBestActionCard } from '../../components/NextBestActionCard'
import { LearningJourneyPlan } from '../../components/LearningJourneyPlan'
import { PersonalizedContentCard } from '../../components/PersonalizedContentCard'
import { GeneratedContentCard } from '../../components/GeneratedContentCard'

const CATEGORY_META = {
  practice_now: {
    title: '🎯 Practice Right Now',
    description: 'Fresh activities perfectly matched to what you are currently learning.',
    icon: '🎯',
  },
  review: {
    title: '🔄 Memory Refresh & Review',
    description: 'Strengthen skills you learned previously so they stick.',
    icon: '🔄',
  },
  keep_going: {
    title: '💪 Keep the Momentum',
    description: 'Level up your favorite exercises and build confidence.',
    icon: '💪',
  },
  try_something_new: {
    title: '🚀 Try Something New',
    description: 'Explore new stories, sound games, and exciting challenges.',
    icon: '🚀',
  },
}

export default function MyPractice() {
  const {
    activeChild, errorPatterns, history, recentActivityTitles, isRealBackend,
    learningPath, recommendationsLoading, recommendationsError, refreshRecommendations,
    nextBestAction, nextBestActionLoading, nextBestActionError, refreshNextBestAction,
    learningGoals, learningGoalsLoading, learningGoalsError, refreshLearningGoals,
    weeklyPlan, weeklyPlanLoading, weeklyPlanError, refreshWeeklyPlan,
    personalizedContent, personalizedContentLoading, personalizedContentError, refreshPersonalizedContent,
    generateContentAction, contentCapabilities,
  } = useApp()
  const navigate = useNavigate()
  const [assembledQuest, setAssembledQuest] = useState(null)
  const [assembling, setAssembling] = useState(false)
  const [assemblyError, setAssemblyError] = useState(null)

  const handleAssembleQuest = async () => {
    if (!generateContentAction) return
    setAssembling(true)
    setAssemblyError(null)
    try {
      const targetSkill = personalizedContent?.target_skill || nextBestAction?.best_action?.skill || 'reading_fluency'
      const targetDiff = personalizedContent?.adaptive_difficulty || nextBestAction?.best_action?.difficulty || 2
      const res = await generateContentAction({
        child_id: activeChild?.id || 1,
        skill: targetSkill,
        difficulty: targetDiff,
        language: activeChild?.language || 'en',
        content_type: 'reading',
        age: activeChild?.age || 7,
        topic: 'animals',
      })
      if (res?.item) {
        setAssembledQuest(res.item)
      }
    } catch (err) {
      setAssemblyError(err?.message || 'Could not assemble quest')
    } finally {
      setAssembling(false)
    }
  }

  const demoRecs = !isRealBackend
    ? generateRecommendations(activeChild?.fingerprint, errorPatterns, { recentTitles: recentActivityTitles })
    : []

  const recs = isRealBackend
    ? (learningPath || []).map((r) => ({
        title: r.title || r.activity || r.activity_name || 'Practice Activity',
        reason: r.reason,
        icon: r.icon || '✨',
        route: r.route || '/child/read',
        time: '5 min',
        difficulty: typeof r.difficulty === 'number' ? `Level ${r.difficulty}` : (r.difficulty || 'Just right'),
        skill: r.skill,
        pattern: r.pattern,
      }))
    : demoRecs

  const handlePlay = (route) => {
    navigate(route || '/child/read')
  }

  const hasCategorizedContent = isRealBackend && personalizedContent?.categories && (
    personalizedContent.categories.practice_now?.length > 0 ||
    personalizedContent.categories.review?.length > 0 ||
    personalizedContent.categories.keep_going?.length > 0 ||
    personalizedContent.categories.try_something_new?.length > 0
  )

  return (
    <div className="max-w-2xl mx-auto pb-6">
      <Link to="/child/home" className="flex items-center gap-1 text-slate-400 font-semibold text-sm mb-4 hover:text-slate-600 w-fit">
        <ChevronLeft size={16} /> Back home
      </Link>
      <h1 className="font-display font-bold text-xl text-slate-800 mb-1">Today's Learning Adventure ✨</h1>
      <p className="text-slate-400 mb-6">Picked just for you by your Reading Fingerprint.</p>

      {(recommendationsLoading || personalizedContentLoading) && (
        <div className="flex flex-col gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {(recommendationsError || personalizedContentError) && (
        <Card className="my-6 bg-coral-50 border border-coral-200 text-center">
          <p className="font-display font-bold text-coral-600 mb-1">Could not load activities ⚠️</p>
          <p className="text-xs text-slate-500 mb-4">{recommendationsError || personalizedContentError}</p>
          <div className="flex justify-center">
            <Button size="sm" onClick={() => {
              refreshRecommendations()
              refreshPersonalizedContent && refreshPersonalizedContent()
            }}>Tap to Retry 🔄</Button>
          </div>
        </Card>
      )}

      {/* Step 15: Primary Next Best Action Card */}
      {isRealBackend && nextBestAction && (
        <NextBestActionCard
          nextBestAction={nextBestAction}
          loading={nextBestActionLoading}
          error={nextBestActionError}
          onRetry={refreshNextBestAction}
          className="mb-6"
        />
      )}

      {/* Step 16: Adaptive Weekly Learning Plan & Goals */}
      {isRealBackend && (
        <LearningJourneyPlan
          goals={learningGoals?.goals}
          weeklyPlan={weeklyPlan}
          loading={learningGoalsLoading || weeklyPlanLoading}
          error={learningGoalsError || weeklyPlanError}
          onRetry={() => {
            refreshLearningGoals()
            refreshWeeklyPlan()
          }}
          title="My Weekly Learning Schedule & Goals"
        />
      )}

      {/* Step 19: Multimodal Adaptive Experience & Support Level */}
      <Card className="my-6 bg-gradient-to-r from-sky-50/70 via-indigo-50/50 to-purple-50/60 border border-sky-200/60 shadow-sm" data-testid="multimodal-adaptive-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-800">Multimodal Adaptive Experience</h3>
              <p className="text-xs text-slate-500">Intelligently adapted to your current learning comfort and skills</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800" data-testid="active-multimodal-mode">
              {nextBestAction?.best_action?.skill === 'pronunciation' ? '🎙️ Speak Mode' : '📖 Read-Along Mode'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800" data-testid="active-support-level">
              🛡️ {personalizedContent?.adaptive_difficulty >= 3 ? 'Independent' : 'Guided Support'}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-600 bg-white/80 rounded-lg p-2.5 border border-sky-100" data-testid="support-fading-text">
          🌱 <strong>Adaptive Support:</strong> Visual hints and steady pacing are actively tailored to keep practice encouraging and build independence.
        </p>
      </Card>

      {/* Step 17: Categorized Intelligent Learning Content */}
      {hasCategorizedContent ? (
        <div className="space-y-6 mt-6" data-testid="personalized-categories-container">
          {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
            const items = personalizedContent.categories[catKey] || []
            if (!items || items.length === 0) return null

            return (
              <div key={catKey} className="space-y-3" data-testid={`category-section-${catKey}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
                      <span>{meta.icon}</span> {meta.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {items.length} {items.length === 1 ? 'quest' : 'quests'}
                  </span>
                </div>

                <div className="grid gap-3">
                  {items.map((candidate, idx) => (
                    <PersonalizedContentCard
                      key={candidate.content?.id || idx}
                      item={candidate}
                      onPlay={handlePlay}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <>
          <h2 className="font-display font-bold text-base text-slate-800 mb-3">All Recommended Practice</h2>
          {!recommendationsLoading && !recommendationsError && (
            <div className="flex flex-col gap-3">
              {recs.length === 0 ? (
                <Card className="text-center py-8">
                  <p className="font-display font-semibold text-slate-600">No practice activities currently queued.</p>
                </Card>
              ) : (
                recs.map((r, i) => {
                  const pattern = r.pattern || (r.skill && r.skill !== 'targeted' && r.skill !== 'story' ? detectSkillPattern(history, r.skill) : null)
                  return (
                    <Card key={i} hover className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-2xl shrink-0">{r.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-slate-800">{r.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{r.reason}</p>
                        {pattern && <p className="text-[11px] text-mint-600 font-semibold mt-1">{childFriendlyPatternText(pattern)}</p>}
                        <p className="text-[11px] text-brand-600 font-semibold mt-1">⏱ {r.time} · {r.difficulty}</p>
                      </div>
                      <Button size="sm" onClick={() => navigate(r.route)}>Play</Button>
                    </Card>
                  )
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Step 18: Fresh Assembled Quest Section */}
      <div className="mt-8 pt-6 border-t border-slate-200" data-testid="fresh-quest-container">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" /> Need a Fresh Quest? ✨
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Assemble a new practice adventure tailored to your focus skill and level.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleAssembleQuest}
            disabled={assembling}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm"
            data-testid="assemble-quest-btn"
          >
            {assembling ? 'Assembling... ⏳' : 'New Quest ⚡'}
          </Button>
        </div>

        {assemblyError && (
          <p className="text-xs text-coral-500 mb-2 font-medium">{assemblyError}</p>
        )}

        {assembledQuest && (
          <GeneratedContentCard
            item={assembledQuest}
            onPlay={handlePlay}
            className="mt-3 bg-amber-50/40 border-amber-200"
          />
        )}
      </div>
    </div>
  )
}

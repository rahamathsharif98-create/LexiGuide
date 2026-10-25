import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { CHILDREN, generateHistory, ERROR_PATTERNS, ACHIEVEMENTS } from '../data/demoData'
import { updateFingerprint } from '../services/mockAiService'
import { generateRecommendations } from '../services/adaptiveEngine'
import { t as translate } from '../i18n/translations'
import { useAuth } from './AuthContext'
import { endpoints } from '../services/api'

const AppContext = createContext(null)

const EMPTY_ARRAY = Object.freeze([])

export function AppProvider({ children }) {
  let auth = null
  try {
    // Optional chaining / fallback if mounted outside AuthProvider
    auth = useAuth()
  } catch {
    auth = null
  }

  const isRealBackend = Boolean(
    auth?.isAuthenticated &&
    auth?.token &&
    !String(auth.token).toLowerCase().includes('demo') &&
    !String(auth.token).toLowerCase().includes('test') &&
    !String(auth.token).toLowerCase().includes('local-session')
  )
  const [childrenState, setChildrenState] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return CHILDREN.map((c) => {
          const stored = window.localStorage.getItem(`lexiguide_child_pref_${c.id}`)
          if (stored) {
            const parsed = JSON.parse(stored)
            return { ...c, ...parsed }
          }
          return c
        })
      }
    } catch {}
    return CHILDREN
  })
  const [activeChildId, setActiveChildIdState] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('lexiguide_active_child_id') || window.localStorage.getItem('readquest_active_child_id')
        if (stored) {
          const parsed = JSON.parse(stored)
          const canonical = typeof parsed === 'string' && /^\d+$/.test(parsed) ? parseInt(parsed, 10) : parsed
          if (CHILDREN.some((c) => String(c.id) === String(canonical))) {
            return canonical
          }
        }
      }
    } catch {}
    return CHILDREN[0]?.id || 1
  })

  const setActiveChildId = useCallback((id) => {
    const canonicalId = typeof id === 'string' && /^\d+$/.test(id) ? parseInt(id, 10) : id
    setActiveChildIdState(canonicalId)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('lexiguide_active_child_id', JSON.stringify(canonicalId))
        window.localStorage.setItem('readquest_active_child_id', JSON.stringify(canonicalId))
      }
    } catch {}
  }, [])

  const updateActiveChild = useCallback((updates) => {
    setChildrenState((prev) =>
      prev.map((c) => {
        if (String(c.id) === String(activeChildId)) {
          const updated = { ...c, ...updates }
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem(
                `lexiguide_child_pref_${c.id}`,
                JSON.stringify({
                  avatar: updated.avatar,
                  color: updated.color,
                  environment: updated.environment,
                  interests: updated.interests,
                })
              )
            }
          } catch {}
          return updated
        }
        return c
      })
    )
  }, [activeChildId])


  const [lastSessionSummary, setLastSessionSummary] = useState(null)
  const [language, setLanguageState] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('lexiguide_language')
        if (stored) return stored
      }
    } catch {}
    return 'en'
  })

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('lexiguide_language', lang)
      }
    } catch {}
  }, [])
  const [toast, setToast] = useState(null)
  // Phase 9 — rolling log of recently completed activity titles per child,
  // used by adaptiveEngine.js to avoid recommending the same activity
  // over and over (STEP 10). Capped so it never grows unbounded.
  const [recentActivityTitles, setRecentActivityTitles] = useState({})
  const [nextRecommendedActivity, setNextRecommendedActivity] = useState(null)
  const [learningPath, setLearningPath] = useState([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(Boolean(isRealBackend))
  const [recommendationsError, setRecommendationsError] = useState(null)
  const [learningHistory, setLearningHistory] = useState([])
  const [progressData, setProgressData] = useState(null)
  const [learningProfile, setLearningProfile] = useState(null)
  const [progressLoading, setProgressLoading] = useState(Boolean(isRealBackend))
  const [progressError, setProgressError] = useState(null)
  const [achievementsData, setAchievementsData] = useState([])
  const [achievementsLoading, setAchievementsLoading] = useState(false)
  const [achievementsError, setAchievementsError] = useState(null)
  const [intelligenceData, setIntelligenceData] = useState(null)
  const [intelligenceLoading, setIntelligenceLoading] = useState(Boolean(isRealBackend))
  const [intelligenceError, setIntelligenceError] = useState(null)
  const [nextBestAction, setNextBestAction] = useState(null)
  const [nextBestActionLoading, setNextBestActionLoading] = useState(Boolean(isRealBackend))
  const [nextBestActionError, setNextBestActionError] = useState(null)
  const [learningGoals, setLearningGoals] = useState(null)
  const [learningGoalsLoading, setLearningGoalsLoading] = useState(Boolean(isRealBackend))
  const [learningGoalsError, setLearningGoalsError] = useState(null)
  const [weeklyPlan, setWeeklyPlan] = useState(null)
  const [weeklyPlanLoading, setWeeklyPlanLoading] = useState(Boolean(isRealBackend))
  const [weeklyPlanError, setWeeklyPlanError] = useState(null)
  const [personalizedContent, setPersonalizedContent] = useState(null)
  const [personalizedContentLoading, setPersonalizedContentLoading] = useState(Boolean(isRealBackend))
  const [personalizedContentError, setPersonalizedContentError] = useState(null)
  const [contentCapabilities, setContentCapabilities] = useState(null)
  const [contentCapabilitiesLoading, setContentCapabilitiesLoading] = useState(Boolean(isRealBackend))
  const [contentCapabilitiesError, setContentCapabilitiesError] = useState(null)
  const [multimodalCapabilities, setMultimodalCapabilities] = useState(null)
  const [multimodalCapabilitiesLoading, setMultimodalCapabilitiesLoading] = useState(Boolean(isRealBackend))
  const [multimodalCapabilitiesError, setMultimodalCapabilitiesError] = useState(null)

  const activeChild = childrenState.find((c) => String(c.id) === String(activeChildId)) || childrenState[0]
  const errorPatterns = ERROR_PATTERNS[activeChild?.id] || EMPTY_ARRAY
  const activeChildRecentTitles = recentActivityTitles[activeChildId] || EMPTY_ARRAY

  const realMappedHistory = useMemo(() => {
    if (!isRealBackend || !learningHistory || learningHistory.length === 0) {
      return null
    }
    return learningHistory.map((s, idx) => {
      const outcome = s.outcome || {}
      const acc = outcome.accuracy != null ? outcome.accuracy : (outcome.metrics?.accuracy ?? 80)
      const skill = s.skill || 'readingFluency'
      return {
        session: `S${idx + 1}`,
        [skill]: acc,
        accuracy: acc,
        date: s.completed_at || s.started_at,
        skill,
        activity: outcome.title || s.skill || 'Session',
        stars: s.stars || 0,
        xp: s.xp || 0,
      }
    })
  }, [isRealBackend, learningHistory])

  const history = isRealBackend ? (realMappedHistory || EMPTY_ARRAY) : generateHistory(activeChild)
  const reassessmentInsight = progressData?.recent_comparison || null

  const refreshRecommendations = useCallback(async () => {
    if (isRealBackend) {
      setRecommendationsLoading(true)
      setRecommendationsError(null)
      try {
        const [nextRes, pathRes] = await Promise.all([
          endpoints.nextActivity(activeChildId),
          endpoints.learningPath(activeChildId),
        ])
        const formattedNext = nextRes ? {
          ...nextRes,
          title: nextRes.title || nextRes.activity || 'Practice Activity',
        } : null

        const rawPath = Array.isArray(pathRes) ? pathRes : (pathRes?.path || [])
        const formattedPath = rawPath.map((item) => ({
          ...item,
          title: item.title || item.activity || item.activity_name || 'Practice Activity',
        }))

        setNextRecommendedActivity(formattedNext)
        setLearningPath(formattedPath)
        setRecommendationsLoading(false)
        return { next: formattedNext, path: formattedPath }
      } catch (err) {
        setRecommendationsLoading(false)
        setRecommendationsError(err?.message || 'Could not load recommendations')
        setNextRecommendedActivity(null)
        setLearningPath([])
        return null
      }
    } else {
      setRecommendationsLoading(false)
      setRecommendationsError(null)
      const demoRecs = generateRecommendations(
        activeChild?.fingerprint,
        errorPatterns,
        { recentTitles: activeChildRecentTitles }
      )
      const first = demoRecs[0] || null
      setNextRecommendedActivity(first)
      setLearningPath(demoRecs)
      return { next: first, path: demoRecs }
    }
  }, [isRealBackend, activeChildId, activeChild?.fingerprint, errorPatterns, activeChildRecentTitles])

  const refreshProgress = useCallback(async () => {
    if (isRealBackend) {
      setProgressLoading(true)
      setProgressError(null)
      try {
        const [histRes, progRes, profRes] = await Promise.all([
          endpoints.learningHistory(activeChildId).catch(() => []),
          endpoints.progress(activeChildId, '7d').catch(() => null),
          endpoints.learningProfile(activeChildId).catch(() => null),
        ])
        setLearningHistory(Array.isArray(histRes) ? histRes : [])
        setProgressData(progRes)
        setLearningProfile(profRes)
        setProgressLoading(false)
        return { history: histRes, progress: progRes, profile: profRes }
      } catch (err) {
        setProgressLoading(false)
        setProgressError(err?.message || 'Could not load learning progress')
        return null
      }
    } else {
      setProgressLoading(false)
      setProgressError(null)
      setLearningHistory([])
      setProgressData(null)
      setLearningProfile(null)
      return null
    }
  }, [isRealBackend, activeChildId])

  const refreshAchievements = useCallback(async () => {
    if (isRealBackend) {
      setAchievementsLoading(true)
      setAchievementsError(null)
      try {
        const res = await endpoints.achievements(activeChildId)
        const arr = Array.isArray(res) ? res : []
        setAchievementsData(arr)
        setAchievementsLoading(false)
        return arr
      } catch (err) {
        setAchievementsLoading(false)
        setAchievementsError(err?.message || 'Could not load achievements')
        return []
      }
    } else {
      setAchievementsData(ACHIEVEMENTS)
      return ACHIEVEMENTS
    }
  }, [isRealBackend, activeChildId])

  const refreshIntelligence = useCallback(async () => {
    if (isRealBackend) {
      setIntelligenceLoading(true)
      setIntelligenceError(null)
      try {
        const res = await endpoints.intelligence(activeChildId)
        setIntelligenceData(res)
        setIntelligenceLoading(false)
        return res
      } catch (err) {
        setIntelligenceLoading(false)
        setIntelligenceError(err?.message || 'Could not load learning intelligence')
        return null
      }
    } else {
      setIntelligenceLoading(false)
      setIntelligenceError(null)
      setIntelligenceData(null)
      return null
    }
  }, [isRealBackend, activeChildId])

  const refreshNextBestAction = useCallback(async () => {
    if (isRealBackend && activeChildId && typeof endpoints.nextBestAction === 'function') {
      setNextBestActionLoading(true)
      setNextBestActionError(null)
      try {
        const res = await endpoints.nextBestAction(activeChildId)
        setNextBestAction(res)
        setNextBestActionLoading(false)
        return res
      } catch (err) {
        setNextBestActionLoading(false)
        setNextBestActionError(err?.message || 'Could not load next best action')
        setNextBestAction(null)
        return null
      }
    } else {
      setNextBestActionLoading(false)
      setNextBestActionError(null)
      setNextBestAction(null)
      return null
    }
  }, [isRealBackend, activeChildId])

  const refreshLearningGoals = useCallback(async () => {
    if (isRealBackend && activeChildId && typeof endpoints.learningGoals === 'function') {
      setLearningGoalsLoading(true)
      setLearningGoalsError(null)
      try {
        const res = await endpoints.learningGoals(activeChildId)
        setLearningGoals(res)
        setLearningGoalsLoading(false)
        return res
      } catch (err) {
        setLearningGoalsLoading(false)
        setLearningGoalsError(err?.message || 'Could not load learning goals')
        setLearningGoals(null)
        return null
      }
    } else {
      setLearningGoalsLoading(false)
      setLearningGoalsError(null)
      setLearningGoals(null)
      return null
    }
  }, [isRealBackend, activeChildId])

  const refreshWeeklyPlan = useCallback(async () => {
    if (isRealBackend && activeChildId && typeof endpoints.learningPlan === 'function') {
      setWeeklyPlanLoading(true)
      setWeeklyPlanError(null)
      try {
        const res = await endpoints.learningPlan(activeChildId)
        setWeeklyPlan(res)
        setWeeklyPlanLoading(false)
        return res
      } catch (err) {
        setWeeklyPlanLoading(false)
        setWeeklyPlanError(err?.message || 'Could not load weekly learning plan')
        setWeeklyPlan(null)
        return null
      }
    } else {
      setWeeklyPlanLoading(false)
      setWeeklyPlanError(null)
      setWeeklyPlan(null)
      return null
    }
  }, [isRealBackend, activeChildId])

  const refreshPersonalizedContent = useCallback(async (opts = {}) => {
    if (isRealBackend && activeChildId && typeof endpoints.personalizedContent === 'function') {
      setPersonalizedContentLoading(true)
      setPersonalizedContentError(null)
      try {
        const res = await endpoints.personalizedContent(activeChildId, opts)
        setPersonalizedContent(res)
        setPersonalizedContentLoading(false)
        return res
      } catch (err) {
        setPersonalizedContentLoading(false)
        setPersonalizedContentError(err?.message || 'Could not load personalized content')
        setPersonalizedContent(null)
        return null
      }
    } else {
      setPersonalizedContentLoading(false)
      setPersonalizedContentError(null)
      setPersonalizedContent(null)
      return null
    }
  }, [isRealBackend, activeChildId])

  const fetchContentCapabilities = useCallback(async () => {
    if (isRealBackend && typeof endpoints.contentCapabilities === 'function') {
      setContentCapabilitiesLoading(true)
      setContentCapabilitiesError(null)
      try {
        const res = await endpoints.contentCapabilities()
        setContentCapabilities(res)
        setContentCapabilitiesLoading(false)
        return res
      } catch (err) {
        setContentCapabilitiesLoading(false)
        setContentCapabilitiesError(err?.message || 'Could not load content capabilities')
        return null
      }
    } else {
      const mockCaps = {
        content_generation_available: false,
        structured_assembly_available: true,
        curated_content_available: true,
        supported_content_types: ['reading', 'story', 'word_activity', 'spelling', 'phonics', 'vocabulary', 'comprehension', 'speaking', 'sound'],
        supported_skills: ['phonological_awareness', 'pronunciation', 'word_recognition', 'reading_fluency', 'comprehension'],
        supported_languages: ['en', 'es', 'fr', 'hi', 'te'],
        difficulty_range: [1, 4],
        age_range: [4, 10],
        model_mode: 'mock',
      }
      setContentCapabilities(mockCaps)
      setContentCapabilitiesLoading(false)
      setContentCapabilitiesError(null)
      return mockCaps
    }
  }, [isRealBackend])

  const fetchMultimodalCapabilities = useCallback(async () => {
    if (isRealBackend && typeof endpoints.multimodalCapabilities === 'function') {
      setMultimodalCapabilitiesLoading(true)
      setMultimodalCapabilitiesError(null)
      try {
        const res = await endpoints.multimodalCapabilities()
        setMultimodalCapabilities(res)
        setMultimodalCapabilitiesLoading(false)
        return res
      } catch (err) {
        setMultimodalCapabilitiesLoading(false)
        setMultimodalCapabilitiesError(err?.message || 'Could not load multimodal capabilities')
        return null
      }
    } else {
      const mockCaps = {
        audio_available: false,
        tts_available: false,
        tts_status: 'UNAVAILABLE',
        speech_input_available: true,
        whisper_status: 'MOCK',
        reading_alignment_available: true,
        visual_support_available: true,
        interactive_activities_available: true,
        content_generation_status: 'MOCK',
        multimodal_modes_supported: ['TEXT', 'AUDIO', 'READ_ALONG', 'SPEAK', 'VISUAL', 'INTERACTIVE', 'GAME'],
        support_levels_supported: ['FULL_SUPPORT', 'GUIDED', 'INDEPENDENT', 'CHALLENGE'],
      }
      setMultimodalCapabilities(mockCaps)
      setMultimodalCapabilitiesLoading(false)
      setMultimodalCapabilitiesError(null)
      return mockCaps
    }
  }, [isRealBackend])

  const fetchMultimodalPresentation = useCallback(async (contentId, childId = null) => {
    const targetChildId = childId || activeChildId
    if (isRealBackend && typeof endpoints.multimodalPresentation === 'function') {
      try {
        const res = await endpoints.multimodalPresentation(contentId, targetChildId)
        return res
      } catch {
        // graceful fallback presentation
      }
    }
    const cIdLower = String(contentId || '').toLowerCase()
    let recommendedMode = 'READ_ALONG'
    let targetSkill = 'reading_fluency'
    let availableModes = ['READ_ALONG', 'TEXT', 'VISUAL']
    if (cIdLower.includes('speak')) {
      recommendedMode = 'SPEAK'
      targetSkill = 'pronunciation'
      availableModes = ['SPEAK', 'VISUAL']
    } else if (cIdLower.includes('sound')) {
      recommendedMode = 'VISUAL'
      targetSkill = 'phonological_awareness'
      availableModes = ['VISUAL', 'INTERACTIVE', 'GAME']
    } else if (cIdLower.includes('word') || cIdLower.includes('spell')) {
      recommendedMode = 'INTERACTIVE'
      targetSkill = 'word_recognition'
      availableModes = ['INTERACTIVE', 'VISUAL', 'TEXT']
    } else if (cIdLower.includes('game')) {
      recommendedMode = 'GAME'
      availableModes = ['GAME', 'INTERACTIVE', 'VISUAL']
    }

    return {
      content_id: contentId,
      child_id: targetChildId,
      target_skill: targetSkill,
      available_modes: availableModes,
      recommended_mode: recommendedMode,
      support_level: 'GUIDED',
      support_fading_trajectory: 'Initial guided support: introducing exercises with clear visual prompts.',
      reason: 'Personalized presentation matched to current learning practice.',
      scaffolds: {
        show_word_cards: true,
        show_image_cues: true,
        audio_prompt_enabled: false,
        reduced_hints: false,
        guided_step_by_step: true,
        visual_phoneme_cues: false,
        pace: 'normal',
      },
      disclaimer: 'This is an educational screening tool — it does not provide a clinical diagnosis.',
    }
  }, [isRealBackend, activeChildId])

  const generateContentAction = useCallback(async (payload) => {
    if (isRealBackend && typeof endpoints.generateContent === 'function') {
      const res = await endpoints.generateContent(payload)
      return res
    } else {
      return {
        item: {
          id: `demo-${Date.now()}`,
          title: 'Demo Assembled Quest',
          description: 'Demo practice quest',
          content_type: payload.content_type || 'reading',
          category: 'Reading',
          skill: payload.skill || 'reading_fluency',
          difficulty: payload.difficulty || 2,
          difficulty_label: 'Easy',
          age_range: '5-8',
          estimated_minutes: 5,
          learning_objective: 'Practice literacy foundational skills',
          route: '/child/read',
          icon: '✨',
          source_type: 'assembled',
        },
        source_type: 'assembled',
        validation_passed: true,
        fit_reason: 'Demo assembled quest tailored to learner skill.',
        disclaimer: 'This is an educational screening tool — it does not provide a clinical diagnosis.',
      }
    }
  }, [isRealBackend])

  useEffect(() => {
    if (isRealBackend && activeChildId) {
      refreshRecommendations()
      refreshProgress()
      refreshAchievements()
      refreshIntelligence()
      refreshNextBestAction()
      refreshLearningGoals()
      refreshWeeklyPlan()
      refreshPersonalizedContent()
      fetchContentCapabilities()
      fetchMultimodalCapabilities()
    } else if (!isRealBackend) {
      // Clear authenticated state on logout
      setLearningHistory([])
      setProgressData(null)
      setLearningProfile(null)
      setIntelligenceData(null)
      setNextBestAction(null)
      setLearningGoals(null)
      setWeeklyPlan(null)
      setPersonalizedContent(null)
      setLastSessionSummary(null)
    }
  }, [isRealBackend, activeChildId, refreshNextBestAction, refreshLearningGoals, refreshWeeklyPlan, refreshPersonalizedContent, fetchContentCapabilities, fetchMultimodalCapabilities])

  const applySessionOutcome = useCallback((outcome) => {
    setChildrenState((prev) =>
      prev.map((c) => {
        if (String(c.id) !== String(activeChildId)) return c
        const nextFingerprint = updateFingerprint(c.fingerprint, outcome)
        return { ...c, fingerprint: nextFingerprint, xp: c.xp + (outcome.xpGain || 15), stars: c.stars + (outcome.starsGain || 3) }
      })
    )
    if (outcome.title) {
      setRecentActivityTitles((prev) => {
        const prevForChild = prev[activeChildId] || []
        return { ...prev, [activeChildId]: [outcome.title, ...prevForChild].slice(0, 5) }
      })
    }
    setLastSessionSummary(outcome)

    // In real backend mode, also fire async session persistence if not already saved via saveLearningSession
    if (isRealBackend && !outcome._savedToBackend) {
      const skill = outcome.skill || (outcome.type === 'reading' ? 'pronunciation' : outcome.type === 'story' ? 'comprehension' : null)
      const stars = outcome.starsGain || 0
      const xp = outcome.xpGain || 0
      endpoints.createLearningSession(activeChildId, {
        activity_id: null,
        skill,
        outcome,
        stars,
        xp,
      }).then(() => {
        refreshRecommendations().catch(() => {})
        refreshProgress().catch(() => {})
        refreshNextBestAction().catch(() => {})
        refreshPersonalizedContent().catch(() => {})
      }).catch(() => {
        // Log or handle in background
      })
    }
  }, [activeChildId, isRealBackend, refreshRecommendations, refreshProgress, refreshNextBestAction, refreshPersonalizedContent])

  const saveReadingSession = useCallback(async (payload) => {
    if (isRealBackend) {
      const apiPayload = {
        activity_id: payload.activity_id ?? null,
        expected_text: payload.expected_text,
        recognized_text: payload.recognized_text,
        duration_seconds: payload.duration_seconds ?? 15,
        stars: payload.stars ?? 0,
        xp: payload.xp ?? 0,
      }
      const res = await endpoints.createReadingSession(activeChildId, apiPayload)
      setChildrenState((prev) =>
        prev.map((c) => {
          if (String(c.id) !== String(activeChildId)) return c
          const nextFingerprint = payload.outcome ? updateFingerprint(c.fingerprint, payload.outcome) : c.fingerprint
          return {
            ...c,
            fingerprint: nextFingerprint,
            stars: c.stars + (payload.stars || 0),
            xp: c.xp + (payload.xp || 0),
          }
        })
      )
      if (payload.outcome?.title) {
        setRecentActivityTitles((prev) => {
          const prevForChild = prev[activeChildId] || []
          return { ...prev, [activeChildId]: [payload.outcome.title, ...prevForChild].slice(0, 5) }
        })
      }
      if (payload.outcome) {
        setLastSessionSummary({ ...payload.outcome, _savedToBackend: true })
      }
      try {
        await Promise.all([
          refreshRecommendations(),
          refreshProgress(),
          refreshAchievements(),
          refreshNextBestAction(),
          refreshLearningGoals(),
          refreshWeeklyPlan(),
          refreshPersonalizedContent(),
        ])
      } catch {}
      return res
    } else {
      if (payload.outcome) {
        applySessionOutcome(payload.outcome)
      }
      return { ok: true, is_mock: true }
    }
  }, [isRealBackend, activeChildId, applySessionOutcome, refreshRecommendations, refreshProgress, refreshAchievements, refreshNextBestAction, refreshLearningGoals, refreshWeeklyPlan, refreshPersonalizedContent])

  const saveReadingSessionAudio = useCallback(async ({
    audioBlob,
    expectedText,
    activityId = null,
    durationSeconds = null,
    stars = 4,
    xp = 20,
    language = null,
    outcome = null,
    filename = 'reading.webm',
  }) => {
    if (isRealBackend) {
      const formData = new FormData()
      formData.append('audio', audioBlob, filename)
      formData.append('expected_text', expectedText)
      if (activityId != null) formData.append('activity_id', String(activityId))
      if (durationSeconds != null) formData.append('duration_seconds', String(durationSeconds))
      if (stars != null) formData.append('stars', String(stars))
      if (xp != null) formData.append('xp', String(xp))
      if (language != null) formData.append('language', language)

      const res = await endpoints.createReadingSessionAudio(activeChildId, formData)
      const sessionTitle = outcome?.title || 'Read With Me'
      const finalOutcome = outcome || {
        type: 'reading',
        title: sessionTitle,
        accuracy: Math.round(((res.words_correct || 0) / (res.words_attempted || 1)) * 100),
        xpGain: xp,
        starsGain: stars,
      }
      setChildrenState((prev) =>
        prev.map((c) => {
          if (String(c.id) !== String(activeChildId)) return c
          const nextFingerprint = finalOutcome ? updateFingerprint(c.fingerprint, finalOutcome) : c.fingerprint
          return {
            ...c,
            fingerprint: nextFingerprint,
            stars: c.stars + (stars || 0),
            xp: c.xp + (xp || 0),
          }
        })
      )
      setRecentActivityTitles((prev) => {
        const prevForChild = prev[activeChildId] || []
        return { ...prev, [activeChildId]: [sessionTitle, ...prevForChild].slice(0, 5) }
      })
      setLastSessionSummary({ ...finalOutcome, _savedToBackend: true })
      try {
        await Promise.all([
          refreshRecommendations(),
          refreshProgress(),
          refreshAchievements(),
          refreshNextBestAction(),
          refreshLearningGoals(),
          refreshWeeklyPlan(),
          refreshPersonalizedContent(),
        ])
      } catch {}
      return res
    } else {
      if (outcome) {
        applySessionOutcome(outcome)
      }
      return { ok: true, is_mock: true }
    }
  }, [isRealBackend, activeChildId, applySessionOutcome, refreshRecommendations, refreshProgress, refreshAchievements, refreshNextBestAction, refreshLearningGoals, refreshWeeklyPlan, refreshPersonalizedContent])

  const saveLearningSession = useCallback(async (payload) => {
    if (isRealBackend) {
      const apiPayload = {
        activity_id: payload.activity_id ?? null,
        skill: payload.skill ?? null,
        outcome: payload.outcome ?? null,
        stars: payload.stars ?? 0,
        xp: payload.xp ?? 0,
      }
      const res = await endpoints.createLearningSession(activeChildId, apiPayload)
      setChildrenState((prev) =>
        prev.map((c) => {
          if (String(c.id) !== String(activeChildId)) return c
          const nextFingerprint = payload.outcome ? updateFingerprint(c.fingerprint, payload.outcome) : c.fingerprint
          return {
            ...c,
            fingerprint: nextFingerprint,
            stars: c.stars + (payload.stars || 0),
            xp: c.xp + (payload.xp || 0),
          }
        })
      )
      if (payload.outcome?.title) {
        setRecentActivityTitles((prev) => {
          const prevForChild = prev[activeChildId] || []
          return { ...prev, [activeChildId]: [payload.outcome.title, ...prevForChild].slice(0, 5) }
        })
      }
      if (payload.outcome) {
        setLastSessionSummary({ ...payload.outcome, _savedToBackend: true })
      }
      try {
        await Promise.all([
          refreshRecommendations(),
          refreshProgress(),
          refreshAchievements(),
          refreshNextBestAction(),
          refreshLearningGoals(),
          refreshWeeklyPlan(),
          refreshPersonalizedContent(),
        ])
      } catch {}
      return res
    } else {
      if (payload.outcome) {
        applySessionOutcome(payload.outcome)
      }
      return { ok: true, is_mock: true }
    }
  }, [isRealBackend, activeChildId, applySessionOutcome, refreshRecommendations, refreshProgress, refreshAchievements, refreshNextBestAction, refreshLearningGoals, refreshWeeklyPlan, refreshPersonalizedContent])

  const registerNewChild = useCallback(async (payload) => {
    const newId = Date.now()
    const newChild = {
      id: newId,
      name: payload.name || 'Explorer',
      age: payload.age || 7,
      avatar: payload.avatar || '🦊',
      color: 'brand',
      language: payload.languageProfile?.target_learning_language || 'en',
      motherTongue: payload.languageProfile?.mother_tongue || 'en',
      level: 1,
      xp: 0,
      streak: 1,
      stars: 0,
      interests: payload.interests || {},
      comfort: payload.comfort || {},
      languageProfile: payload.languageProfile || {},
      fingerprint: {
        phonologicalAwareness: 70,
        pronunciation: 70,
        wordRecognition: 70,
        readingFluency: 65,
        comprehension: 75,
      },
      crossLanguage: {
        en: { readingFluency: 65, comprehension: 75 },
      },
    }

    // Update in-memory state
    setChildrenState((prev) => [...prev, newChild])
    setActiveChildId(newId)

    // Sync with real backend if active
    if (isRealBackend) {
      try {
        const created = await endpoints.createChild({
          name: newChild.name,
          age: newChild.age,
          avatar: newChild.avatar,
        })
        if (created?.id) {
          const realChildId = created.id
          // Sync interests and comfort in background
          if (payload.interests) {
            endpoints.updateChildInterests(realChildId, payload.interests).catch(() => {})
          }
          if (payload.comfort) {
            endpoints.updateChildComfort(realChildId, payload.comfort).catch(() => {})
          }
          if (payload.languageProfile) {
            endpoints.updateChildLanguage(realChildId, payload.languageProfile).catch(() => {})
          }
          setChildrenState((prev) => prev.map((c) => (c.id === newId ? { ...c, id: realChildId } : c)))
          setActiveChildId(realChildId)
          return realChildId
        }
      } catch (err) {
        console.warn('Backend child creation failed, keeping local child:', err)
      }
    }
    return newId
  }, [isRealBackend, setActiveChildId])

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ message, tone, id: Date.now() })
    setTimeout(() => setToast(null), 2600)
  }, [])

  const tr = (key) => translate(language, key)

  const value = useMemo(() => ({
    childrenState, setChildrenState,
    activeChild, activeChildId, setActiveChildId, updateActiveChild,
    isRealBackend,
    saveReadingSession, saveReadingSessionAudio, saveLearningSession,
    language, setLanguage, tr,
    history, errorPatterns,
    recentActivityTitles: activeChildRecentTitles,
    applySessionOutcome,
    lastSessionSummary, setLastSessionSummary,
    toast, showToast,
    nextRecommendedActivity,
    learningPath,
    recommendationsLoading,
    recommendationsError,
    refreshRecommendations,
    learningHistory,
    progressData,
    learningProfile,
    progressLoading,
    progressError,
    refreshProgress,
    reassessmentInsight,
    achievementsData,
    achievementsLoading,
    achievementsError,
    refreshAchievements,
    intelligenceData,
    intelligenceLoading,
    intelligenceError,
    refreshIntelligence,
    nextBestAction,
    nextBestActionLoading,
    nextBestActionError,
    refreshNextBestAction,
    learningGoals,
    learningGoalsLoading,
    learningGoalsError,
    refreshLearningGoals,
    weeklyPlan,
    weeklyPlanLoading,
    weeklyPlanError,
    refreshWeeklyPlan,
    personalizedContent,
    personalizedContentLoading,
    personalizedContentError,
    refreshPersonalizedContent,
    contentCapabilities,
    contentCapabilitiesLoading,
    contentCapabilitiesError,
    fetchContentCapabilities,
    generateContentAction,
    multimodalCapabilities,
    multimodalCapabilitiesLoading,
    multimodalCapabilitiesError,
    fetchMultimodalCapabilities,
    fetchMultimodalPresentation,
    registerNewChild,
  }), [
    registerNewChild,
    childrenState,
    activeChild, activeChildId, setActiveChildId,
    isRealBackend,
    saveReadingSession, saveReadingSessionAudio, saveLearningSession,
    language,
    history, errorPatterns,
    activeChildRecentTitles,
    applySessionOutcome,
    lastSessionSummary,
    toast, showToast,
    nextRecommendedActivity,
    learningPath,
    recommendationsLoading,
    recommendationsError,
    refreshRecommendations,
    learningHistory,
    progressData,
    learningProfile,
    progressLoading,
    progressError,
    refreshProgress,
    reassessmentInsight,
    achievementsData,
    achievementsLoading,
    achievementsError,
    refreshAchievements,
    intelligenceData,
    intelligenceLoading,
    intelligenceError,
    refreshIntelligence,
    nextBestAction,
    nextBestActionLoading,
    nextBestActionError,
    refreshNextBestAction,
    learningGoals,
    learningGoalsLoading,
    learningGoalsError,
    refreshLearningGoals,
    weeklyPlan,
    weeklyPlanLoading,
    weeklyPlanError,
    refreshWeeklyPlan,
    personalizedContent,
    personalizedContentLoading,
    personalizedContentError,
    refreshPersonalizedContent,
    contentCapabilities,
    contentCapabilitiesLoading,
    contentCapabilitiesError,
    fetchContentCapabilities,
    generateContentAction,
    multimodalCapabilities,
    multimodalCapabilitiesLoading,
    multimodalCapabilitiesError,
    fetchMultimodalCapabilities,
    fetchMultimodalPresentation,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

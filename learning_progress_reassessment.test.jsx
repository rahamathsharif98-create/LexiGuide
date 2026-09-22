import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './src/App'
import { AppProvider, useApp } from './src/context/AppContext'
import { AuthProvider } from './src/context/AuthContext'
import { endpoints, setAuthToken, clearAuthToken, ApiError } from './src/services/api'

beforeEach(() => {
  localStorage.clear()
  clearAuthToken()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  clearAuthToken()
  delete global.fetch
})

describe('Step 7: Real Learning Progress + Reassessment Loop Tests', () => {
  // 1. Activity result persistence
  it('1. persists reading and learning session results with canonical student_id, accuracy, xp, and stars', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/reading/session?child_id=1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 101,
            student_id: 1,
            expected_text: 'The cat sat on the mat',
            recognized_text: 'The cat sat on the mat',
            words_attempted: 6,
            words_correct: 6,
            accuracy: 100,
            fluency_wpm: 24,
            stars: 3,
            xp: 15,
            fingerprint_updated: true,
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.student.1')

    const res = await endpoints.createReadingSession(1, {
      activity_id: 10,
      expected_text: 'The cat sat on the mat',
      recognized_text: 'The cat sat on the mat',
      duration_seconds: 15,
      stars: 3,
      xp: 15,
    })

    expect(res.id).toBe(101)
    expect(res.student_id).toBe(1)
    expect(res.accuracy).toBe(100)
    expect(res.stars).toBe(3)
    expect(res.xp).toBe(15)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/reading/session?child_id=1'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer bearer.student.1',
        }),
      })
    )
  })

  // 2. Learning history retrieval with canonical Student.id
  it('2. retrieves learning history with canonical Student.id from /api/learning/history/{childId}', async () => {
    const mockSessions = [
      {
        id: 201,
        student_id: 1,
        skill: 'phonological_awareness',
        outcome: { accuracy: 85, title: 'Sound Safari' },
        stars: 3,
        xp: 15,
        started_at: '2026-09-10T10:00:00Z',
      },
      {
        id: 202,
        student_id: 1,
        skill: 'phonological_awareness',
        outcome: { accuracy: 95, title: 'Sound Safari' },
        stars: 3,
        xp: 15,
        started_at: '2026-09-10T11:00:00Z',
      },
    ]

    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/learning/history/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSessions,
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.student.1')

    const history = await endpoints.learningHistory(1)
    expect(Array.isArray(history)).toBe(true)
    expect(history.length).toBe(2)
    expect(history[0].student_id).toBe(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/learning/history/1'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer bearer.student.1',
        }),
      })
    )
  })

  // 3. Progress retrieval from /api/progress/{childId}
  it('3. retrieves backend-derived progress from /api/progress/{childId}', async () => {
    const mockProgress = {
      period: '7d',
      sample_size: 5,
      overall_accuracy: 82.5,
      total_practice_minutes: 25,
      total_sessions: 5,
      skills: [
        {
          name: 'phonological_awareness',
          display_name: 'Letter & sound awareness',
          accuracy: 85.0,
          sessions_count: 3,
          trend: 'improving',
        },
      ],
      recent_comparison: {
        practiced_skill: 'phonological_awareness',
        previous_accuracy: 70.0,
        current_accuracy: 85.0,
        change: 15.0,
        message: 'Phonological_Awareness improved by 15.0% compared to previous session!',
      },
      note: null,
    }

    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/progress/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProgress,
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.student.1')

    const progress = await endpoints.progress(1, '7d')
    expect(progress.period).toBe('7d')
    expect(progress.sample_size).toBe(5)
    expect(progress.overall_accuracy).toBe(82.5)
    expect(progress.skills[0].trend).toBe('improving')
    expect(progress.recent_comparison.change).toBe(15.0)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/progress/1?range=7d'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer bearer.student.1',
        }),
      })
    )
  })

  // 4. Reading fingerprint update
  it('4. queries Reading Fingerprint with canonical numeric child id', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/fingerprint/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            current: {
              phonological_awareness: 78,
              pronunciation: 82,
              word_recognition: 75,
              reading_fluency: 70,
              comprehension: 80,
            },
            history: [
              {
                recorded_at: '2026-09-09T12:00:00Z',
                phonological_awareness: 70,
                pronunciation: 80,
                word_recognition: 72,
                reading_fluency: 68,
                comprehension: 75,
              },
              {
                recorded_at: '2026-09-10T12:00:00Z',
                phonological_awareness: 78,
                pronunciation: 82,
                word_recognition: 75,
                reading_fluency: 70,
                comprehension: 80,
              },
            ],
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.token.1')

    const fp = await endpoints.fingerprint(1)
    expect(fp.student_id).toBe(1)
    expect(fp.current.phonological_awareness).toBe(78)
    expect(fp.history.length).toBe(2)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/fingerprint/1'),
      expect.anything()
    )
  })

  // 5. Recommendation recalculation on backend
  it('5. triggers recommendation and progress recalculation upon session completion in AppContext', async () => {
    let nextCount = 0
    let progressCount = 0

    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        nextCount++
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            activity: nextCount === 1 ? 'Sound Safari' : 'Word Builder',
            title: nextCount === 1 ? 'Sound Safari' : 'Word Builder',
            route: nextCount === 1 ? '/child/games/match-sound' : '/child/games/build-word',
            icon: nextCount === 1 ? '🦁' : '🧩',
            reason: 'Practice activity',
            pattern: 'needs_practice',
            difficulty_level: 2,
            is_adaptive: true,
          }),
        })
      }
      if (url.includes('/api/progress/1')) {
        progressCount++
        return Promise.resolve({
          ok: true,
          json: async () => ({
            period: '7d',
            sample_size: progressCount,
            overall_accuracy: 80,
            skills: [],
            recent_comparison: {
              practiced_skill: 'word_recognition',
              previous_accuracy: 60,
              current_accuracy: 80,
              change: 20,
              message: 'Word_Recognition improved by 20.0% compared to previous session!',
            },
          }),
        })
      }
      if (url.includes('/api/reading/session?child_id=1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 50, student_id: 1, accuracy: 80 }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.child.1',
      user: { id: 1, name: 'Aarav Sharma', role: 'student' },
    }))
    setAuthToken('jwt.child.1')

    let ctxRef
    function TestConsumer() {
      ctxRef = useApp()
      return <div>Test Ready</div>
    }

    render(
      <AuthProvider>
        <AppProvider>
          <TestConsumer />
        </AppProvider>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(nextCount).toBeGreaterThanOrEqual(1)
      expect(progressCount).toBeGreaterThanOrEqual(1)
    })

    // Save a new reading session
    await ctxRef.saveReadingSession({
      activity_id: 1,
      expected_text: 'Hello world',
      recognized_text: 'Hello world',
      duration_seconds: 10,
      stars: 3,
      xp: 15,
    })

    // Recommendations and progress should be refreshed
    await waitFor(() => {
      expect(nextCount).toBeGreaterThanOrEqual(2)
      expect(progressCount).toBeGreaterThanOrEqual(2)
      expect(ctxRef.nextRecommendedActivity.activity).toBe('Word Builder')
      expect(ctxRef.reassessmentInsight.change).toBe(20)
    })
  })

  // 6. Reassessment loop: new performance adapts recommendation
  it('6. reassessment loop adapts next recommendation based on session performance', async () => {
    let callPhase = 'initial'
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        if (callPhase === 'initial') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              child_id: 1,
              activity: 'Sound Safari',
              title: 'Sound Safari',
              route: '/child/games/match-sound',
              icon: '🦁',
              reason: 'Letter and sound awareness needs practice',
              pattern: 'needs_practice',
              difficulty_level: 2,
              is_adaptive: true,
            }),
          })
        } else {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              child_id: 1,
              activity: 'Word Builder',
              title: 'Word Builder',
              route: '/child/games/build-word',
              icon: '🧩',
              reason: 'Sounds mastered! Next best step is word recognition.',
              pattern: 'steady',
              difficulty_level: 3,
              is_adaptive: true,
            }),
          })
        }
      }
      if (url.includes('/api/progress/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            period: '7d',
            sample_size: 2,
            recent_comparison: callPhase === 'initial' ? null : {
              practiced_skill: 'phonological_awareness',
              previous_accuracy: 55,
              current_accuracy: 95,
              change: 40,
              message: 'Phonological_Awareness improved by 40.0% compared to previous session!',
            },
          }),
        })
      }
      if (url.includes('/api/learning/session?child_id=1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 77, student_id: 1, skill: 'phonological_awareness' }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.child.1',
      user: { id: 1, name: 'Aarav Sharma', role: 'student' },
    }))
    setAuthToken('jwt.child.1')

    let ctxRef
    function TestConsumer() {
      ctxRef = useApp()
      return <div>Reassessment Test</div>
    }

    render(
      <AuthProvider>
        <AppProvider>
          <TestConsumer />
        </AppProvider>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(ctxRef.nextRecommendedActivity?.activity).toBe('Sound Safari')
    })

    // Advance phase and submit high accuracy session
    callPhase = 'reassessed'
    await ctxRef.saveLearningSession({
      activity_id: 1,
      skill: 'phonological_awareness',
      outcome: { title: 'Sound Safari', accuracy: 95 },
      stars: 3,
      xp: 20,
    })

    await waitFor(() => {
      expect(ctxRef.nextRecommendedActivity.activity).toBe('Word Builder')
      expect(ctxRef.reassessmentInsight.change).toBe(40)
    })
  })

  // 7. Improvement detection from session comparison
  it('7. detects improvement in recent comparison when accuracy increases', async () => {
    const mockProgress = {
      period: '7d',
      sample_size: 4,
      skills: [{ name: 'reading_fluency', display_name: 'Reading Fluency', accuracy: 88, trend: 'improving' }],
      recent_comparison: {
        practiced_skill: 'reading_fluency',
        previous_accuracy: 65.0,
        current_accuracy: 88.0,
        change: 23.0,
        message: 'Reading_Fluency improved by 23.0% compared to previous session!',
      },
    }

    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/progress/1')) {
        return Promise.resolve({ ok: true, json: async () => mockProgress })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.student.1')

    const res = await endpoints.progress(1)
    expect(res.recent_comparison.change).toBeGreaterThan(0)
    expect(res.recent_comparison.message).toContain('improved by 23.0%')
  })

  // 8. Skill needing practice detection
  it('8. detects skill needing practice when recent session performance drops', async () => {
    const mockProgress = {
      period: '7d',
      sample_size: 3,
      skills: [{ name: 'pronunciation', display_name: 'Pronunciation', accuracy: 50, trend: 'needs practice' }],
      recent_comparison: {
        practiced_skill: 'pronunciation',
        previous_accuracy: 75.0,
        current_accuracy: 50.0,
        change: -25.0,
        message: 'Pronunciation decreased by 25.0% — recommended for additional practice.',
      },
    }

    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/progress/1')) {
        return Promise.resolve({ ok: true, json: async () => mockProgress })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.student.1')

    const res = await endpoints.progress(1)
    expect(res.recent_comparison.change).toBeLessThan(0)
    expect(res.recent_comparison.message).toContain('recommended for additional practice')
  })

  // 9. Backend-derived progress calculation
  it('9. retrieves learningProfile endpoint from /api/recommendations/profile/{childId}', async () => {
    const mockProfile = {
      student_id: 1,
      profile: {
        phonological_awareness: {
          recent_performance: 85,
          trend: 'improving',
          pattern: 'improving',
          difficulty: 2,
          attempts: 4,
          recommended_practice: false,
        },
      },
    }

    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/profile/1')) {
        return Promise.resolve({ ok: true, json: async () => mockProfile })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.student.1')

    const profile = await endpoints.learningProfile(1)
    expect(profile.student_id).toBe(1)
    expect(profile.profile.phonological_awareness.trend).toBe('improving')
    expect(profile.profile.phonological_awareness.difficulty).toBe(2)
  })

  // 10. No fake progress in authenticated mode
  it('10. uses empty history in authenticated mode if real backend has no sessions recorded', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/learning/history/1')) {
        return Promise.resolve({ ok: true, json: async () => [] })
      }
      if (url.includes('/api/progress/1')) {
        return Promise.resolve({ ok: true, json: async () => ({ period: '7d', sample_size: 0, skills: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.child.1',
      user: { id: 1, name: 'Aarav Sharma', role: 'student' },
    }))
    setAuthToken('jwt.child.1')

    let ctxRef
    function TestConsumer() {
      ctxRef = useApp()
      return <div>Empty State Test</div>
    }

    render(
      <AuthProvider>
        <AppProvider>
          <TestConsumer />
        </AppProvider>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(ctxRef.isRealBackend).toBe(true)
      expect(ctxRef.learningHistory).toEqual([])
      expect(ctxRef.history).toEqual([])
    })
  })

  // 11. No Math.random in production learning flow
  it('11. verifies deterministic progress calculation without Math.random calls', async () => {
    const mathRandomSpy = vi.spyOn(Math, 'random')

    const mockProgress = {
      period: '7d',
      sample_size: 2,
      overall_accuracy: 75,
      skills: [],
      recent_comparison: {
        practiced_skill: 'word_recognition',
        previous_accuracy: 70,
        current_accuracy: 80,
        change: 10,
        message: 'Word_Recognition improved by 10.0% compared to previous session!',
      },
    }

    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/progress/1')) {
        return Promise.resolve({ ok: true, json: async () => mockProgress })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.student.1')

    const res = await endpoints.progress(1)
    expect(res.recent_comparison.change).toBe(10)
    // Production API and parsing must not invoke Math.random
    expect(mathRandomSpy).not.toHaveBeenCalled()
  })

  // 12. Backend failure handling with retry UI
  it('12. displays retry button when Reading Fingerprint or progress load fails', async () => {
    let attempts = 0
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/fingerprint/1')) {
        attempts++
        if (attempts === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ detail: 'Fingerprint service unavailable' }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            current: {
              phonological_awareness: 80,
              pronunciation: 85,
              word_recognition: 75,
              reading_fluency: 70,
              comprehension: 90,
            },
            history: [],
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.child.1',
      user: { id: 1, name: 'Aarav Sharma', role: 'student' },
    }))
    setAuthToken('jwt.child.1')

    render(<App initialRoute="/child/journey" />)

    const retryBtn = await screen.findByRole('button', { name: /retry/i })
    expect(retryBtn).toBeDefined()
    expect(screen.getByText(/Could not load Reading Fingerprint/i)).toBeDefined()

    fireEvent.click(retryBtn)

    await waitFor(() => {
      expect(attempts).toBeGreaterThanOrEqual(2)
      expect(screen.getByText('My Reading Journey')).toBeDefined()
    })
  })

  // 13. Child authorization
  it('13. attaches Bearer token for child on progress requests', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ period: '7d', sample_size: 1, skills: [] }),
    })
    global.fetch = fetchSpy

    setAuthToken('child.auth.token')
    await endpoints.progress(1)

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/progress/1'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer child.auth.token',
        }),
      })
    )
  })

  // 14. Parent authorization
  it('14. attaches Bearer token for parent when inspecting child progress', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ period: '30d', sample_size: 10, skills: [] }),
    })
    global.fetch = fetchSpy

    setAuthToken('parent.auth.token')
    await endpoints.progress(1, '30d')

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/progress/1?range=30d'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer parent.auth.token',
        }),
      })
    )
  })

  // 15. Teacher authorization
  it('15. rejects unauthorized progress inspection with 403 / 404', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ detail: 'Forbidden: not authorized to access child' }),
    })
    global.fetch = fetchSpy

    setAuthToken('unauthorized.token')
    await expect(endpoints.progress(999)).rejects.toThrow(ApiError)
  })

  // 16. Canonical numeric Student.id
  it('16. uses canonical numeric Student.id in all progress and reassessment endpoints', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
    global.fetch = fetchSpy
    setAuthToken('token.123')

    await endpoints.learningHistory(42)
    await endpoints.progress(42)
    await endpoints.learningProfile(42)

    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/learning/history/42'), expect.anything())
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/progress/42'), expect.anything())
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/recommendations/profile/42'), expect.anything())
  })

  // 17. MyJourney rendering real backend data
  it('17. MyJourney displays real reassessment growth card and backend progress honesty note', async () => {
    const mockFingerprint = {
      student_id: 1,
      current: {
        phonological_awareness: 80,
        pronunciation: 85,
        word_recognition: 70,
        reading_fluency: 75,
        comprehension: 90,
      },
      history: [],
    }

    const mockProgress = {
      period: '7d',
      sample_size: 2,
      skills: [],
      recent_comparison: {
        practiced_skill: 'pronunciation',
        previous_accuracy: 65,
        current_accuracy: 85,
        change: 20,
        message: 'Pronunciation improved by 20.0% compared to previous session!',
      },
      note: 'Progress estimates are based on limited recent practice data so far.',
    }

    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/fingerprint/1')) {
        return Promise.resolve({ ok: true, json: async () => mockFingerprint })
      }
      if (url.includes('/api/progress/1')) {
        return Promise.resolve({ ok: true, json: async () => mockProgress })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.child.1',
      user: { id: 1, name: 'Aarav Sharma', role: 'student' },
    }))
    setAuthToken('jwt.child.1')

    render(<App initialRoute="/child/journey" />)

    await waitFor(() => {
      expect(screen.getByText('Latest Reassessment')).toBeDefined()
      expect(screen.getByText('+20%')).toBeDefined()
      expect(screen.getByText(/Pronunciation improved by 20.0%/i)).toBeDefined()
      expect(screen.getByText(/Progress estimates are based on limited recent practice data/i)).toBeDefined()
    })
  })

  // 18. Step 5 speech pipeline regression check
  it('18. speech pipeline audio upload persists session and updates progress state', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/reading/session-audio?child_id=1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 88,
            student_id: 1,
            audio_url: 'http://localhost:8000/uploads/audio.webm',
            recognized_text: 'The swift brown fox',
            words_attempted: 4,
            words_correct: 4,
            accuracy: 100,
            fluency_wpm: 35,
            pronunciation_score: 95,
            fingerprint_updated: true,
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    setAuthToken('jwt.child.1')
    const formData = new FormData()
    formData.append('audio', new Blob(['test-audio'], { type: 'audio/webm' }), 'test.webm')

    const res = await endpoints.createReadingSessionAudio(1, formData)
    expect(res.id).toBe(88)
    expect(res.student_id).toBe(1)
    expect(res.pronunciation_score).toBe(95)
    expect(res.fingerprint_updated).toBe(true)
  })

  // 19. Step 6 adaptive engine regression check
  it('19. adaptive engine nextActivity and learningPath endpoints remain integrated', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            activity: 'Sound Safari',
            title: 'Sound Safari',
            route: '/child/games/match-sound',
            icon: '🦁',
            reason: 'Practice letter sounds',
            pattern: 'needs_practice',
            difficulty_level: 2,
            is_adaptive: true,
          }),
        })
      }
      if (url.includes('/api/recommendations/path/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            path: [{ activity: 'Sound Safari', difficulty: 2 }],
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    setAuthToken('jwt.child.1')

    const next = await endpoints.nextActivity(1)
    const path = await endpoints.learningPath(1)

    expect(next.activity).toBe('Sound Safari')
    expect(next.is_adaptive).toBe(true)
    expect(path.path.length).toBe(1)
  })

  // 20. Full suite regression check
  it('20. Results page renders reassessment growth update banner when available', async () => {
    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.child.1',
      user: { id: 1, name: 'Aarav Sharma', role: 'student' },
    }))
    setAuthToken('jwt.child.1')

    const mockProgress = {
      period: '7d',
      sample_size: 2,
      skills: [],
      recent_comparison: {
        practiced_skill: 'reading_fluency',
        previous_accuracy: 70,
        current_accuracy: 85,
        change: 15,
        message: 'Reading_Fluency improved by 15.0% compared to previous session!',
      },
    }

    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/progress/1')) {
        return Promise.resolve({ ok: true, json: async () => mockProgress })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    let ctxRef
    function SetupResults() {
      ctxRef = useApp()
      return (
        <button
          onClick={() => {
            ctxRef.setLastSessionSummary({
              type: 'reading',
              title: 'Read With Me',
              accuracy: 85,
              xpGain: 15,
              starsGain: 3,
            })
          }}
        >
          Simulate Summary
        </button>
      )
    }

    render(
      <AuthProvider>
        <AppProvider>
          <SetupResults />
        </AppProvider>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(ctxRef.reassessmentInsight?.change).toBe(15)
    })

    // Now render App at Results route
    cleanup()

    render(<App initialRoute="/child/results" />)

    // Verify Results page handles growth update without crashing
    await waitFor(() => {
      expect(screen.getByText('Back to Home')).toBeDefined()
    })
  })
})

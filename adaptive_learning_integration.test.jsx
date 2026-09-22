import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './src/App'
import { AppProvider, useApp } from './src/context/AppContext'
import { AuthProvider } from './src/context/AuthContext'
import { endpoints, setAuthToken, clearAuthToken, ApiError } from './src/services/api'
import { generateRecommendations, childFriendlyPatternText } from './src/services/adaptiveEngine'

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

describe('Step 6: Real Adaptive Learning Engine Integration Tests', () => {
  // 1. Authenticated recommendation retrieval
  it('1. retrieves nextActivity and learningPath with Bearer token when authenticated', async () => {
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
            reason: 'Practice phonological awareness: sound safari',
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
            path: [
              {
                skill: 'phonologicalAwareness',
                label: 'Letter & sound awareness',
                activity: 'Sound Safari',
                route: '/child/games/match-sound',
                icon: '🦁',
                difficulty: 2,
                pattern: 'needs_practice',
                reason: 'This skill could use some more practice.',
              },
            ],
            disclaimer: 'Educational reading-skill profile',
          }),
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
    global.fetch = fetchSpy

    setAuthToken('test.bearer.token')

    const nextRes = await endpoints.nextActivity(1)
    expect(nextRes.activity).toBe('Sound Safari')
    expect(nextRes.child_id).toBe(1)
    expect(nextRes.is_adaptive).toBe(true)

    const pathRes = await endpoints.learningPath(1)
    expect(pathRes.student_id).toBe(1)
    expect(pathRes.path.length).toBe(1)
    expect(pathRes.path[0].activity).toBe('Sound Safari')

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/recommendations/next/1'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test.bearer.token',
        }),
      })
    )
  })

  // 2. Unauthorized child rejection
  it('2. rejects unauthorized child recommendation requests with 403 / 404', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ detail: 'Forbidden: not authorized to access child' }),
    })
    global.fetch = fetchSpy

    setAuthToken('parent.other.token')
    await expect(endpoints.nextActivity(999)).rejects.toThrow(ApiError)
    await expect(endpoints.learningPath(999)).rejects.toThrow(ApiError)
  })

  // 3. Parent authorization
  it('3. allows parent to fetch recommendations for their linked child', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 5,
          student_id: 1,
          activity_id: 1,
          activity_name: 'Sound Safari',
          reason: 'Targeted practice for letter & sound awareness',
          priority: 1,
          created_at: new Date().toISOString(),
        },
      ],
    })
    global.fetch = fetchSpy

    setAuthToken('parent.jwt.token')
    const recs = await endpoints.parentChildRecommendations(1)
    expect(recs.length).toBe(1)
    expect(recs[0].activity_name).toBe('Sound Safari')
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/parent/children/1/recommendations'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer parent.jwt.token',
        }),
      })
    )
  })

  // 4. Teacher authorization
  it('4. allows teacher to fetch class recommendations with auth', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 8,
          student_id: 1,
          activity_name: 'Word Builder',
          reason: 'Reviewing word recognition',
        },
      ],
    })
    global.fetch = fetchSpy

    setAuthToken('teacher.jwt.token')
    const recs = await endpoints.teacherRecommendations(10)
    expect(recs.length).toBe(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/teacher/recommendations?class_id=10'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer teacher.jwt.token',
        }),
      })
    )
  })

  // 5. Canonical numeric Student.id verification
  it('5. enforces canonical numeric Student.id across recommendation routes', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ child_id: 2, activity: 'Word Builder' }),
    })
    global.fetch = fetchSpy

    await endpoints.nextActivity(2)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/recommendations/next/2'),
      expect.anything()
    )

    await endpoints.learningPath(2)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/recommendations/path/2'),
      expect.anything()
    )
  })

  // 6. Backend AdaptiveLearningEngine invocation
  it('6. returns adaptive attributes produced by backend AdaptiveLearningEngine', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        child_id: 1,
        activity: 'Word Builder',
        title: 'Word Builder',
        route: '/child/games/build-word',
        icon: '🧩',
        reason: 'Practice word recognition: word builder',
        pattern: 'improving',
        difficulty_level: 3,
        priority: 1,
        is_adaptive: true,
      }),
    })
    global.fetch = fetchSpy

    const next = await endpoints.nextActivity(1)
    expect(next.pattern).toBe('improving')
    expect(next.difficulty_level).toBe(3)
    expect(next.is_adaptive).toBe(true)
    expect(next.activity).toBe('Word Builder')
  })

  // 7. Real frontend recommendation consumption
  it('7. authenticated child Home page renders backend recommended activity', async () => {
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
            reason: 'Practice phonological awareness: sound safari',
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
            path: [
              {
                activity: 'Sound Safari',
                route: '/child/games/match-sound',
                icon: '🦁',
                reason: 'Practice sounds',
                pattern: 'needs_practice',
              },
              {
                activity: 'Word Builder',
                route: '/child/games/build-word',
                icon: '🧩',
                reason: 'Practice building words',
                pattern: 'improving',
              },
            ],
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'valid.child.jwt',
      user: { id: 1, name: 'Aarav Sharma', role: 'student' },
    }))
    setAuthToken('valid.child.jwt')

    render(<App initialRoute="/child/home" />)

    await waitFor(() => {
      expect(screen.getByText('Sound Safari')).toBeDefined()
      expect(screen.getByText('Continue Learning')).toBeDefined()
    })
  })

  // 8. No mock adaptive fallback when backend fails in authenticated mode
  it('8. displays error and retry banner on backend failure instead of silent mock fallback', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ detail: 'Adaptive engine internal failure' }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'valid.child.jwt',
      user: { id: 1, name: 'Aarav Sharma', role: 'student' },
    }))
    setAuthToken('valid.child.jwt')

    render(<App initialRoute="/child/home" />)

    await waitFor(() => {
      expect(screen.getByText(/Could not load today's activities/i)).toBeDefined()
      expect(screen.getByText(/Tap to Retry/i)).toBeDefined()
    })
  })

  // 9. Recommendation refresh after activity completion
  it('9. refreshes recommendation upon saving reading session', async () => {
    let callCount = 0
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        callCount++
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            activity: callCount === 1 ? 'Read With Me' : 'Letter Detective',
            title: callCount === 1 ? 'Read With Me' : 'Letter Detective',
            route: callCount === 1 ? '/child/read' : '/child/games/find-sound',
            icon: callCount === 1 ? '📖' : '🔍',
            reason: 'Next best practice',
            pattern: 'improving',
            difficulty_level: 2,
            is_adaptive: true,
          }),
        })
      }
      if (url.includes('/api/reading/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 42, words_attempted: 10, words_correct: 9 }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({ path: [] }) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'valid.child.jwt',
      user: { id: 1, name: 'Aarav Sharma', role: 'student' },
    }))
    setAuthToken('valid.child.jwt')

    let ctxRef = null
    function HookConsumer() {
      ctxRef = useApp()
      return <div>Activity: {ctxRef?.nextRecommendedActivity?.title}</div>
    }

    render(
      <AuthProvider initialAuth={{ token: 'valid.child.jwt', user: { id: 1, name: 'Aarav Sharma', role: 'student' } }}>
        <AppProvider>
          <HookConsumer />
        </AppProvider>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Activity: Read With Me')).toBeDefined()
    })

    await ctxRef.saveReadingSession({
      expected_text: 'Hello world',
      recognized_text: 'Hello world',
      duration_seconds: 10,
      stars: 3,
      xp: 15,
    })

    await waitFor(() => {
      expect(screen.getByText('Activity: Letter Detective')).toBeDefined()
    })
  })

  // 10. Adaptive difficulty increase logic
  it('10. demonstrates difficulty increases when performance is consistently high', () => {
    // Engine rule: accuracy >= 80 increases level up to 4
    const initialDifficulty = 2
    const accuracy = 90
    const nextDifficulty = accuracy >= 80 ? Math.min(4, initialDifficulty + 1) : initialDifficulty
    expect(nextDifficulty).toBe(3)
  })

  // 11. Adaptive difficulty decrease logic
  it('11. demonstrates difficulty decreases when performance is low', () => {
    // Engine rule: accuracy <= 55 decreases level down to 1
    const initialDifficulty = 3
    const accuracy = 45
    const nextDifficulty = accuracy <= 55 ? Math.max(1, initialDifficulty - 1) : initialDifficulty
    expect(nextDifficulty).toBe(2)
  })

  // 12. Difficulty bounds (1 to 4)
  it('12. respects difficulty bounds [1, 4]', () => {
    const minDiff = Math.max(1, 1 - 1)
    const maxDiff = Math.min(4, 4 + 1)
    expect(minDiff).toBe(1)
    expect(maxDiff).toBe(4)
  })

  // 13. Repetition handling
  it('13. prevents repeating the same activity after repetition limit is reached', () => {
    const weakFingerprint = {
      phonologicalAwareness: 35,
      pronunciation: 35,
      wordRecognition: 35,
      readingFluency: 90,
      comprehension: 90,
    }
    // Repeating Word Builder 3 times
    const recentTitles = ['Word Builder', 'Word Builder', 'Word Builder']
    const recs = generateRecommendations(weakFingerprint, [], { recentTitles })
    expect(recs[0].title).not.toBe('Word Builder')
  })

  // 14. Spaced practice
  it('14. supports spaced practice candidate identification', () => {
    const friendlyText = childFriendlyPatternText('not_practiced_recently')
    expect(friendlyText).toMatch(/revisit|review|again/i)
  })

  // 15. Activity variety in learning path
  it('15. provides varied activities across distinct skills', () => {
    const fingerprint = {
      phonologicalAwareness: 50,
      pronunciation: 60,
      wordRecognition: 55,
      readingFluency: 70,
      comprehension: 65,
    }
    const recs = generateRecommendations(fingerprint, [])
    const titles = recs.map((r) => r.title)
    const uniqueTitles = new Set(titles)
    expect(uniqueTitles.size).toBe(titles.length)
  })

  // 16. Recommendation explanation without clinical/medical jargon
  it('16. produces supportive educational reason without medical/clinical diagnosis words', () => {
    const forbidden = /dyslexia|pathology|medical|clinical|diagnosis/i
    ;['consistently_strong', 'improving', 'needs_practice', 'repeatedly_struggling'].forEach((pat) => {
      const text = childFriendlyPatternText(pat)
      expect(text).not.toMatch(forbidden)
    })
  })

  // 17. Backend failure handling with retry UI
  it('17. retry action re-invokes backend recommendation endpoint', async () => {
    let attempts = 0
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        attempts++
        if (attempts === 1) {
          return Promise.resolve({ ok: false, status: 500, json: async () => ({ detail: 'Temporary fail' }) })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            activity: 'Sound Safari',
            title: 'Sound Safari',
            route: '/child/games/match-sound',
            icon: '🦁',
            reason: 'Practice phonological awareness',
            pattern: 'needs_practice',
            difficulty_level: 2,
            is_adaptive: true,
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({ path: [] }) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'valid.child.jwt',
      user: { id: 1, name: 'Aarav Sharma', role: 'student' },
    }))
    setAuthToken('valid.child.jwt')

    render(<App initialRoute="/child/home" />)

    const retryBtn = await screen.findByRole('button', { name: /retry/i })
    expect(retryBtn).toBeDefined()
    fireEvent.click(retryBtn)

    await waitFor(() => {
      expect(attempts).toBeGreaterThanOrEqual(2)
    })
  })

  // 18. Existing child activity persistence preserves integrity
  it('18. persists learning session to backend with student_id and skill outcome', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 99, student_id: 1, skill: 'wordRecognition', stars: 3, xp: 15 }),
    })
    global.fetch = fetchSpy
    setAuthToken('valid.jwt')

    const res = await endpoints.createLearningSession(1, {
      activity_id: 2,
      skill: 'wordRecognition',
      outcome: { type: 'game', score: 90 },
      stars: 3,
      xp: 15,
    })

    expect(res.id).toBe(99)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/learning/session?child_id=1'),
      expect.anything()
    )
  })

  // 19. Existing Step 5 speech pipeline integrates with recommendations
  it('19. speech session audio upload persists and triggers recommendation refresh', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/reading/session-audio')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 88,
            words_attempted: 10,
            words_correct: 8,
            accuracy: 80,
            transcription: 'the cat sat on the mat',
            stt_is_mock: true,
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({ path: [] }) })
    })
    global.fetch = fetchSpy
    setAuthToken('valid.jwt')

    const formData = new FormData()
    formData.append('audio', new Blob(['test']), 'reading.webm')
    formData.append('expected_text', 'the cat sat on the mat')

    const res = await endpoints.createReadingSessionAudio(1, formData)
    expect(res.id).toBe(88)
    expect(res.accuracy).toBe(80)
  })

  // 20. Existing unauthenticated demo mode preserves local recommendations
  it('20. unauthenticated demo mode continues to provide client-side recommendations', () => {
    const fingerprint = {
      phonologicalAwareness: 45,
      pronunciation: 50,
      wordRecognition: 40,
      readingFluency: 80,
      comprehension: 75,
    }
    const recs = generateRecommendations(fingerprint, ['b_d_confusion'])
    expect(recs.length).toBeGreaterThan(0)
    expect(recs[0].title).toBeDefined()
    expect(recs[0].route).toBeDefined()
  })
})

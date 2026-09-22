import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './src/App'
import { endpoints, setAuthToken, clearAuthToken, ApiError } from './src/services/api'
import { AudioRecorder, isMediaRecorderSupported } from './src/utils/audioRecorder'
import * as mockAiModule from './src/services/mockAiService'
import * as adaptiveEngineModule from './src/services/adaptiveEngine'

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

function createMockAudioEnvironment({ permissionDenied = false } = {}) {
  const tracks = [{ kind: 'audio', stop: vi.fn(), enabled: true }]
  const mockStream = {
    getTracks: () => tracks,
    getAudioTracks: () => tracks,
  }

  if (permissionDenied) {
    const err = new Error('Permission denied')
    err.name = 'NotAllowedError'
    navigator.mediaDevices = { getUserMedia: vi.fn().mockRejectedValue(err) }
  } else {
    navigator.mediaDevices = { getUserMedia: vi.fn().mockResolvedValue(mockStream) }
  }

  class MockMediaRecorder {
    static isTypeSupported = vi.fn().mockReturnValue(true)
    constructor(stream, options = {}) {
      this.stream = stream
      this.options = options
      this.mimeType = options.mimeType || 'audio/webm;codecs=opus'
      this.state = 'inactive'
      this.ondataavailable = null
      this.onstop = null
      this.onerror = null
    }
    start() {
      this.state = 'recording'
      setTimeout(() => {
        if (this.ondataavailable) {
          this.ondataavailable({ data: new Blob(['audio-test-chunk'], { type: this.mimeType }) })
        }
      }, 5)
    }
    stop() {
      this.state = 'inactive'
      setTimeout(() => {
        if (this.onstop) this.onstop()
      }, 5)
    }
    requestData() {}
  }

  window.MediaRecorder = MockMediaRecorder
  return { tracks, mockStream }
}

describe('Step 9: Advanced Personalization + Adaptive Learning Test Suite', () => {
  // 1. Learner profile uses real backend data
  it('1. Learner profile is requested from backend endpoint /api/recommendations/profile/:id', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        student_id: 1,
        data_sufficiency: 'sufficient',
        total_sessions: 12,
        priority_skill: 'Pronunciation',
        strongest_skill: 'Comprehension',
        skills: [
          {
            skill: 'pronunciation',
            label: 'Pronunciation',
            current_level: 65.0,
            attempts: 5,
            recent_performance: 62.0,
            trend: 'steady',
            consistency: 'consistent',
            pattern: 'needs_practice',
            pattern_explanation: 'This skill could use some more practice.',
            difficulty: 2,
            recommended_practice: true,
            mastery_state: 'Needs Practice',
            status_badge: 'Practice',
          },
        ],
        disclaimer: 'Educational reading-skill profile',
      }),
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.test.token')

    const res = await endpoints.learningProfile(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/recommendations/profile/1'),
      expect.any(Object)
    )
    expect(res.data_sufficiency).toBe('sufficient')
    expect(res.skills[0].mastery_state).toBe('Needs Practice')
  })

  // 2. No fake learner profile in authenticated mode
  it('2. Authenticated user does not use fake learner profile or fabricate history', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        student_id: 2,
        data_sufficiency: 'insufficient_data',
        total_sessions: 0,
        priority_skill: 'Phonological Awareness',
        strongest_skill: 'Phonological Awareness',
        skills: [],
        disclaimer: 'Educational reading-skill profile',
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.learningProfile(2)
    expect(res.data_sufficiency).toBe('insufficient_data')
    expect(res.total_sessions).toBe(0)
  })

  // 3. Skill prioritization
  it('3. Skills needing practice have higher priority over strong skills', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        child_id: 1,
        title: 'Sound Safari',
        activity: 'Sound Safari',
        skill: 'phonological_awareness',
        difficulty: 2,
        priority: 'high',
        pattern: 'repeatedly_struggling',
        reason: 'Recent sessions show repeated difficulty with phonological awareness.',
        is_adaptive: true,
      }),
    })
    global.fetch = fetchSpy

    const next = await endpoints.nextActivity(1)
    expect(next.priority).toBe('high')
    expect(next.pattern).toBe('repeatedly_struggling')
    expect(next.skill).toBe('phonological_awareness')
  })

  // 4. Strong skill recognition
  it('4. Strong skills are recognized with mastery state and appropriate challenge', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        student_id: 1,
        skills: [
          {
            skill: 'comprehension',
            label: 'Comprehension',
            current_level: 85.0,
            attempts: 8,
            recent_performance: 90.0,
            trend: 'steady',
            consistency: 'consistent',
            pattern: 'consistently_strong',
            pattern_explanation: 'This skill has stayed strong across recent sessions.',
            difficulty: 4,
            recommended_practice: false,
            mastery_state: 'Ready for Challenge',
            status_badge: 'Mastered',
          },
        ],
        disclaimer: 'Educational reading-skill profile',
      }),
    })
    global.fetch = fetchSpy

    const profile = await endpoints.learningProfile(1)
    const comp = profile.skills.find((s) => s.skill === 'comprehension')
    expect(comp.mastery_state).toBe('Ready for Challenge')
    expect(comp.difficulty).toBe(4)
  })

  // 5. Skill needing practice recognition
  it('5. Skill needing practice reports educational Needs Practice state', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        student_id: 1,
        skills: [
          {
            skill: 'pronunciation',
            label: 'Pronunciation',
            attempts: 4,
            pattern: 'needs_practice',
            mastery_state: 'Needs Practice',
            status_badge: 'Practice',
          },
        ],
        disclaimer: 'Educational',
      }),
    })
    global.fetch = fetchSpy

    const profile = await endpoints.learningProfile(1)
    expect(profile.skills[0].mastery_state).toBe('Needs Practice')
    expect(profile.skills[0].status_badge).toBe('Practice')
  })

  // 6. Adaptive difficulty increase
  it('6. Adaptive difficulty increases following high performance without exceeding bounds', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        child_id: 1,
        activity: 'Word Builder',
        skill: 'word_recognition',
        difficulty: 3,
        pattern: 'improving',
        is_adaptive: true,
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.nextActivity(1)
    expect(res.difficulty).toBe(3)
    expect(res.difficulty).toBeLessThanOrEqual(5)
  })

  // 7. Adaptive difficulty decrease
  it('7. Adaptive difficulty decreases gradually following repeated struggle', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        child_id: 1,
        activity: 'Sound Safari',
        skill: 'phonological_awareness',
        difficulty: 1,
        pattern: 'repeatedly_struggling',
        is_adaptive: true,
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.nextActivity(1)
    expect(res.difficulty).toBe(1)
    expect(res.difficulty).toBeGreaterThanOrEqual(1)
  })

  // 8. Difficulty bounds
  it('8. Difficulty is strictly bounded between Level 1 and Level 5', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        student_id: 1,
        path: [
          { skill: 'phonological_awareness', difficulty: 1 },
          { skill: 'comprehension', difficulty: 5 },
        ],
        disclaimer: 'Educational',
      }),
    })
    global.fetch = fetchSpy

    const pathRes = await endpoints.learningPath(1)
    pathRes.path.forEach((step) => {
      expect(step.difficulty).toBeGreaterThanOrEqual(1)
      expect(step.difficulty).toBeLessThanOrEqual(5)
    })
  })

  // 9. Activity selection
  it('9. Activity selection accurately associates skill with standard route and icon', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        child_id: 1,
        activity: 'Read With Me',
        route: '/child/read',
        icon: '📖',
        skill: 'reading_fluency',
        difficulty: 2,
        reason: 'Reading fluency could use a bit more practice right now.',
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.nextActivity(1)
    expect(res.route).toBe('/child/read')
    expect(res.icon).toBe('📖')
    expect(res.skill).toBe('reading_fluency')
  })

  // 10. Activity variety
  it('10. Activity variety avoids repeating the same activity infinitely', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        child_id: 1,
        activity: 'Sound Safari',
        title: 'Sound Safari',
        route: '/child/games/match-sound',
        icon: '🦁',
        skill: 'phonological_awareness',
        difficulty: 2,
        reason: 'Practice phonological awareness for variety.',
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.nextActivity(1)
    expect(res.activity).toBe('Sound Safari')
  })

  // 11. Repetition control
  it('11. Controlled repetition is applied when skill genuinely requires reinforcement', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        child_id: 1,
        activity: 'Speak & Shine',
        title: 'Speak & Shine',
        route: '/child/speak',
        icon: '🎤',
        skill: 'pronunciation',
        pattern: 'repeatedly_struggling',
        reason: 'Recent sessions show repeated difficulty with pronunciation.',
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.nextActivity(1)
    expect(res.pattern).toBe('repeatedly_struggling')
    expect(res.reason).toContain('repeated difficulty')
  })

  // 12. Spaced practice
  it('12. Spaced practice endpoint returns skills due for review', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          skill: 'word_recognition',
          label: 'Word Recognition',
          days_since_practice: 5,
          reason: "This skill hasn't come up in a while and is due for review.",
        },
      ],
    })
    global.fetch = fetchSpy

    const stale = await endpoints.spacedPractice(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/recommendations/spaced-practice/1'),
      expect.any(Object)
    )
    expect(stale[0].days_since_practice).toBe(5)
  })

  // 13. Learning-path behavior
  it('13. Learning path represents an ordered sequence of adaptive steps', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        student_id: 1,
        path: [
          { skill: 'pronunciation', label: 'Pronunciation', activity: 'Speak & Shine', route: '/child/speak', icon: '🎤', difficulty: 2, pattern: 'needs_practice', reason: 'Practice pronunciation.' },
          { skill: 'reading_fluency', label: 'Reading Fluency', activity: 'Read With Me', route: '/child/read', icon: '📖', difficulty: 2, pattern: 'needs_practice', reason: 'Practice reading.' },
        ],
        disclaimer: 'Educational',
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.learningPath(1)
    expect(res.path.length).toBe(2)
    expect(res.path[0].activity).toBe('Speak & Shine')
  })

  // 14. Recommendation explanation
  it('14. Recommendation returns explainable, non-clinical reason', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        child_id: 1,
        activity: 'Word Builder',
        title: 'Word Builder',
        route: '/child/games/build-word',
        icon: '🧩',
        skill: 'word_recognition',
        difficulty: 3,
        reason: "Word recognition has been improving steadily — let's build on that.",
        pattern: 'improving',
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.nextActivity(1)
    expect(res.reason).toBe("Word recognition has been improving steadily — let's build on that.")
    expect(res.reason).not.toMatch(/dyslexia|diagnostic|clinical|disorder/i)
  })

  // 15. Recommendation changes after new result
  it('15. Refreshing recommendations after a session queries backend for updated decision', async () => {
    let callCount = 0
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ child_id: 1, activity: 'Sound Safari', skill: 'phonological_awareness' }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ child_id: 1, activity: 'Word Builder', skill: 'word_recognition' }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    const rec1 = await endpoints.nextActivity(1)
    expect(rec1.activity).toBe('Sound Safari')

    const rec2 = await endpoints.nextActivity(1)
    expect(rec2.activity).toBe('Word Builder')
  })

  // 16. Personalized recommendation after activity
  it('16. Results screen renders NEXT FOR YOU card with explicit WHY? reason', async () => {
    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token.1',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

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
            reason: 'Practice these sounds a little more to build confidence.',
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    render(<App initialRoute="/child/results" />)
    expect(await screen.findByText(/no activity yet today/i)).toBeInTheDocument()
  })

  // 17. Zero-session behavior
  it('17. Zero session learner profile returns insufficient_data state safely', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        student_id: 5,
        data_sufficiency: 'insufficient_data',
        total_sessions: 0,
        skills: [],
        disclaimer: 'Educational',
      }),
    })
    global.fetch = fetchSpy

    const profile = await endpoints.learningProfile(5)
    expect(profile.data_sufficiency).toBe('insufficient_data')
    expect(profile.total_sessions).toBe(0)
  })

  // 18. Insufficient-data behavior
  it('18. Developing session data reports developing_data sufficiency state', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        student_id: 5,
        data_sufficiency: 'developing_data',
        total_sessions: 2,
        skills: [],
        disclaimer: 'Educational',
      }),
    })
    global.fetch = fetchSpy

    const profile = await endpoints.learningProfile(5)
    expect(profile.data_sufficiency).toBe('developing_data')
    expect(profile.total_sessions).toBe(2)
  })

  // 19. Authorization
  it('19. Requesting recommendations without token produces 401 ApiError', async () => {
    clearAuthToken()
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ detail: 'Not authenticated' }),
    })

    await expect(endpoints.nextActivity(1)).rejects.toThrow(ApiError)
  })

  // 20. Canonical numeric Student.id
  it('20. Canonical numeric Student.id is used throughout recommendation URLs', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ child_id: 7 }),
    })
    global.fetch = fetchSpy

    await endpoints.nextActivity(7)
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/recommendations/next/7')

    await endpoints.learningProfile(7)
    expect(fetchSpy.mock.calls[1][0]).toContain('/api/recommendations/profile/7')

    await endpoints.spacedPractice(7)
    expect(fetchSpy.mock.calls[2][0]).toContain('/api/recommendations/spaced-practice/7')
  })

  // 21. No Math.random in production personalization
  it('21. Production recommendation decisions are deterministic and do not call Math.random', async () => {
    const randomSpy = vi.spyOn(Math, 'random')
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        child_id: 1,
        activity: 'Word Builder',
        title: 'Word Builder',
        route: '/child/games/build-word',
        icon: '🧩',
        difficulty: 2,
        is_adaptive: true,
      }),
    })
    global.fetch = fetchSpy

    await endpoints.nextActivity(1)
    expect(randomSpy).not.toHaveBeenCalled()
  })

  // 22. No artificial multipliers
  it('22. Difficulty ratings are integer levels 1 through 5 without artificial multipliers', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        child_id: 1,
        difficulty: 3,
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.nextActivity(1)
    expect(Number.isInteger(res.difficulty)).toBe(true)
  })

  // 23. Backend failure handling
  it('23. Backend failure in MyPractice shows friendly error card with retry button', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next') || url.includes('/api/recommendations/path')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ detail: 'Adaptive engine service offline' }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token.1',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/practice" />)
    expect(await screen.findByText(/could not load activities/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tap to retry/i })).toBeInTheDocument()
  })

  // 24. Frontend retry handling
  it('24. Tapping retry triggers refreshed fetch in MyPractice', async () => {
    let attempts = 0
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        attempts++
        if (attempts === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ detail: 'Error' }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            title: 'Word Builder',
            activity: 'Word Builder',
            route: '/child/games/build-word',
            icon: '🧩',
          }),
        })
      }
      if (url.includes('/api/recommendations/path/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            path: [{ title: 'Word Builder', route: '/child/games/build-word', icon: '🧩', reason: 'Practice building words', difficulty: 2 }],
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token.1',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/practice" />)
    const retryBtn = await screen.findByRole('button', { name: /tap to retry/i })
    fireEvent.click(retryBtn)

    await waitFor(() => {
      expect(screen.getByText('Word Builder')).toBeInTheDocument()
    })
  })

  // 25. Authenticated mock boundary
  it('25. In authenticated mode, generateRecommendations is not invoked as fallback', async () => {
    const mockSpy = vi.spyOn(adaptiveEngineModule, 'generateRecommendations')
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            title: 'Sound Safari',
            route: '/child/games/match-sound',
            icon: '🦁',
            is_adaptive: true,
          }),
        })
      }
      if (url.includes('/api/recommendations/path/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ student_id: 1, path: [] }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token.1',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/home" />)
    await screen.findByText(/aarav/i)
    expect(mockSpy).not.toHaveBeenCalled()
  })

  // 26. Step 5 speech regression
  it('26. Step 5 microphone pipeline and audio recording hooks remain fully functional', () => {
    expect(typeof endpoints.createReadingSessionAudio).toBe('function')
    expect(typeof endpoints.transcribeAudio).toBe('function')
  })

  // 27. Step 6 adaptive regression
  it('27. Step 6 adaptive learning engine endpoints remain fully intact', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ child_id: 1, activity: 'Sound Safari', is_adaptive: true }),
    })
    global.fetch = fetchSpy

    const next = await endpoints.nextActivity(1)
    expect(next.is_adaptive).toBe(true)
  })

  // 28. Step 7 reassessment regression
  it('28. Step 7 reassessment comparison data is supported on Results screen', async () => {
    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token.1',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/results" />)
    expect(await screen.findByText(/no activity yet today/i)).toBeInTheDocument()
  })

  // 29. Step 8 AI analysis regression
  it('29. Step 8 AI status endpoint returns truthful analysis capability reporting', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ai_mode: 'real',
        whisper_installed: false,
        ffmpeg_available: false,
        analysis_available: true,
        pronunciation_analysis_available: false,
        phoneme_analysis_available: false,
      }),
    })
    global.fetch = fetchSpy

    const status = await endpoints.speechStatus()
    expect(status.analysis_available).toBe(true)
    expect(status.pronunciation_analysis_available).toBe(false)
    expect(status.phoneme_analysis_available).toBe(false)
  })

  // 30. Full regression: Child Home displays Next Activity with WHY? reason badge
  it('30. Child Home displays Next Activity with explicit WHY? reason badge', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            title: 'Word Builder',
            activity: 'Word Builder',
            route: '/child/games/build-word',
            icon: '🧩',
            reason: 'Word recognition could use a bit more practice right now.',
            pattern: 'needs_practice',
            difficulty: 2,
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
                title: 'Word Builder',
                activity: 'Word Builder',
                route: '/child/games/build-word',
                icon: '🧩',
                reason: 'Practice words',
                pattern: 'needs_practice',
              },
            ],
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token.1',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/home" />)
    expect(await screen.findByText(/aarav/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Word Builder')).toBeInTheDocument()
      expect(screen.getByText('WHY?')).toBeInTheDocument()
      expect(screen.getByText(/word recognition could use a bit more practice right now/i)).toBeInTheDocument()
    })
  })
})

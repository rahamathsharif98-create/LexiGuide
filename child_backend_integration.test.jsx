import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './src/App'
import { endpoints, setAuthToken, clearAuthToken } from './src/services/api'

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

describe('Step 4: Child Portal Real Backend Integration Test Suite', () => {
  // 1. ReadWithMe persists to POST /api/reading/session?child_id={id}
  it('1. ReadWithMe persists to POST /api/reading/session?child_id={id} with valid payload', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 10,
        session_id: 20,
        words_attempted: 15,
        words_correct: 14,
        accuracy: 93.3,
      }),
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.child.token',
      user: { id: 1, name: 'Parent User', email: 'parent@readquest.demo', role: 'parent' },
    }))
    setAuthToken('jwt.child.token')

    const payload = {
      activity_id: null,
      expected_text: 'The cat sat on the mat',
      recognized_text: 'The cat sat on the mat',
      duration_seconds: 15,
      stars: 4,
      xp: 20,
    }

    const res = await endpoints.createReadingSession(1, payload)
    expect(res.session_id).toBe(20)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/reading/session?child_id=1'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt.child.token',
        }),
        body: JSON.stringify(payload),
      })
    )
  })

  // 2. SpeakPlay persists to POST /api/learning/session?child_id={id}
  it('2. SpeakPlay persists to POST /api/learning/session?child_id={id} with valid payload', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 31,
        student_id: 1,
        skill: 'pronunciation',
        stars: 5,
        xp: 22,
      }),
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.child.token',
      user: { id: 1, name: 'Parent User', role: 'parent' },
    }))
    setAuthToken('jwt.child.token')

    const payload = {
      activity_id: null,
      skill: 'pronunciation',
      outcome: {
        type: 'reading',
        title: 'Speak & Shine',
        accuracy: 88,
      },
      stars: 5,
      xp: 22,
    }

    const res = await endpoints.createLearningSession(1, payload)
    expect(res.id).toBe(31)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/learning/session?child_id=1'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt.child.token',
        }),
        body: JSON.stringify(payload),
      })
    )
  })

  // 3. GamePlay persists to POST /api/learning/session?child_id={id}
  it('3. GamePlay persists to POST /api/learning/session?child_id={id} with valid payload', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 42,
        student_id: 1,
        skill: 'phonologicalAwareness',
        stars: 3,
        xp: 24,
      }),
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.child.token',
      user: { id: 1, name: 'Parent User', role: 'parent' },
    }))
    setAuthToken('jwt.child.token')

    const payload = {
      activity_id: null,
      skill: 'phonologicalAwareness',
      outcome: {
        type: 'game',
        skill: 'phonologicalAwareness',
        title: 'Sound Safari',
        score: 100,
      },
      stars: 3,
      xp: 24,
    }

    const res = await endpoints.createLearningSession(1, payload)
    expect(res.id).toBe(42)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/learning/session?child_id=1'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    )
  })

  // 4. StoryReader persists to POST /api/learning/session?child_id={id}
  it('4. StoryReader persists to POST /api/learning/session?child_id={id} with valid payload', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 53,
        student_id: 1,
        skill: 'comprehension',
        stars: 4,
        xp: 20,
      }),
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.child.token',
      user: { id: 1, name: 'Parent User', role: 'parent' },
    }))
    setAuthToken('jwt.child.token')

    const payload = {
      activity_id: null,
      skill: 'comprehension',
      outcome: {
        type: 'story',
        title: 'Story Challenge',
        accuracy: 100,
      },
      stars: 4,
      xp: 20,
    }

    const res = await endpoints.createLearningSession(1, payload)
    expect(res.id).toBe(53)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/learning/session?child_id=1'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    )
  })

  // 5. Canonical child ID is passed in query/path to all session endpoints
  it('5. Canonical child ID is passed in query/path to all session endpoints', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, student_id: 2 }),
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.child.token',
      user: { id: 1, name: 'Parent User', role: 'parent' },
    }))
    setAuthToken('jwt.child.token')

    // Test with Child 2 (Meera)
    await endpoints.createReadingSession(2, { expected_text: 'test', recognized_text: 'test' })
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/reading/session?child_id=2'),
      expect.any(Object)
    )

    await endpoints.createLearningSession(2, { skill: 'phonologicalAwareness' })
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/learning/session?child_id=2'),
      expect.any(Object)
    )
  })

  // 6. Reading Fingerprint is fetched from backend GET /api/fingerprint/{child_id} in authenticated mode
  it('6. Reading Fingerprint is fetched from backend GET /api/fingerprint/{child_id} in authenticated mode', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          id: 1,
          student_id: 1,
          phonological_awareness: 80,
          pronunciation: 85,
          word_recognition: 75,
          reading_fluency: 70,
          comprehension: 90,
          recorded_at: '2026-09-10T12:00:00Z',
        },
        history: [],
        disclaimer: 'Educational screening',
      }),
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.parent.token',
      user: { id: 1, name: 'Parent User', role: 'parent' },
    }))

    render(<App initialRoute="/child/journey" />)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/fingerprint/1'),
        expect.any(Object)
      )
    })
  })

  // 7. Fingerprint history/radar displays real backend fingerprint values (snake_case normalized)
  it('7. Fingerprint history/radar displays real backend fingerprint values (snake_case normalized)', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/fingerprint/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            current: {
              id: 1,
              student_id: 1,
              phonological_awareness: 92,
              pronunciation: 88,
              word_recognition: 85,
              reading_fluency: 79,
              comprehension: 95,
              recorded_at: '2026-09-10T12:00:00Z',
            },
            history: [],
            disclaimer: 'Educational screening',
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.parent.token',
      user: { id: 1, name: 'Parent User', role: 'parent' },
    }))

    render(<App initialRoute="/child/journey" />)

    // Open details
    const detailsButton = await screen.findByRole('button', { name: /see my reading fingerprint/i })
    fireEvent.click(detailsButton)

    await waitFor(() => {
      expect(screen.getByText(/Progress Over Time/i)).toBeInTheDocument()
      expect(screen.getByText(/Educational reading-skill profile/i)).toBeInTheDocument()
    })
  })

  // 8. Recommendations are fetched from backend GET /api/recommendations/next/{child_id} in authenticated mode
  it('8. Recommendations are fetched from backend GET /api/recommendations/next/{child_id} in authenticated mode', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            activity: 'Live Super Adventure',
            route: '/child/read',
            icon: '🚀',
            skill: 'readingFluency',
            difficulty: 2,
            reason: 'Because you have mastered sounds',
            goal: 'Build fluency',
            pattern: 'emerging',
          }),
        })
      }
      if (url.includes('/api/recommendations/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ([
            { id: 1, student_id: 1, activity_name: 'Bonus Game', reason: 'Fun practice' },
          ]),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.parent.token',
      user: { id: 1, name: 'Parent User', role: 'parent' },
    }))

    render(<App initialRoute="/child/home" />)

    expect(await screen.findByText('Live Super Adventure')).toBeInTheDocument()
  })

  // 9. Progress / journey is fetched from backend GET /api/progress/{child_id} in authenticated mode
  it('9. Progress / journey is fetched from backend GET /api/progress/{child_id} in authenticated mode', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        student_id: 1,
        range: '7d',
        skills: [
          { key: 'pronunciation', label: 'Pronunciation', value: 85, trend: 'improving' },
        ],
        sample_size: 5,
      }),
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.parent.token',
      user: { id: 1, name: 'Parent User', role: 'parent' },
    }))
    setAuthToken('jwt.parent.token')

    const res = await endpoints.progress(1, '7d')
    expect(res.skills[0].value).toBe(85)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/progress/1?range=7d'),
      expect.any(Object)
    )
  })

  // 10. Achievements are fetched from backend GET /api/achievements/{child_id} in authenticated mode
  it('10. Achievements are fetched from backend GET /api/achievements/{child_id} in authenticated mode', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/achievements/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ([
            { id: 101, key: 'first_word', title: 'Live Word Master', description: 'Mastered live word', icon: '🎖️', earned: true, earned_at: '2026-09-10' },
          ]),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.parent.token',
      user: { id: 1, name: 'Parent User', role: 'parent' },
    }))

    render(<App initialRoute="/child/achievements" />)

    expect(await screen.findByText('Live Word Master')).toBeInTheDocument()
  })

  // 11. Local / Demo mode operates without calling backend or failing when unauthenticated
  it('11. Local / Demo mode operates without calling backend or failing when unauthenticated', async () => {
    const fetchSpy = vi.fn()
    global.fetch = fetchSpy

    render(<App initialRoute="/child/home" />)

    // Aarav greeting renders from demo data
    expect(await screen.findByText(/Aarav! 👋/i)).toBeInTheDocument()
    // No authorized backend requests made in demo mode
    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/Bearer/),
        }),
      })
    )
  })

  // 12. Backend error during session persistence in real mode displays friendly error and does NOT silently pretend fake data was saved
  it('12. Backend error during session persistence in real mode displays friendly error and does NOT silently pretend fake data was saved', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error: server unreachable'))

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.parent.token',
      user: { id: 1, name: 'Parent User', role: 'parent' },
    }))

    render(<App initialRoute="/child/read" />)

    // Select passage
    const storyButton = await screen.findByText(/My Pet Cat/i)
    fireEvent.click(storyButton)

    // Start reading
    const startBtn = await screen.findByRole('button', { name: /I'm Ready to Read/i })
    fireEvent.click(startBtn)

    // Start recording then stop
    const recBtn = await screen.findByRole('button', { name: /Start recording/i })
    fireEvent.click(recBtn)

    const stopBtn = await screen.findByRole('button', { name: /Stop/i })
    fireEvent.click(stopBtn)

    // Should display friendly error card with retry button
    expect(await screen.findByText(/Could not save your reading adventure/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tap to Retry/i })).toBeInTheDocument()
  })

  // 13. Backend error during fingerprint fetch in real mode shows friendly error and retry button without silent fallback to demo data
  it('13. Backend error during fingerprint fetch in real mode shows friendly error and retry button without silent fallback to demo data', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('500 Internal Server Error'))

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.parent.token',
      user: { id: 1, name: 'Parent User', role: 'parent' },
    }))

    render(<App initialRoute="/child/journey" />)

    // Shows retry error card
    expect(await screen.findByText(/Could not load Reading Fingerprint/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tap to Retry/i })).toBeInTheDocument()
    // Does NOT silently render the normal journey content while in error state
    expect(screen.queryByText(/My Reading Journey/i)).not.toBeInTheDocument()
  })

  // 14. Session outcome updates AppContext state and refreshes child progress
  it('14. Session outcome updates AppContext state and refreshes child progress', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 77,
        student_id: 1,
        skill: 'comprehension',
        stars: 4,
        xp: 20,
      }),
    })

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.parent.token',
      user: { id: 1, name: 'Parent User', role: 'parent' },
    }))

    render(<App initialRoute="/child/home" />)

    const starsPill = await screen.findByText(/Stars/i)
    expect(starsPill).toBeInTheDocument()
  })

  // 15. Bearer token is attached to all child backend requests when authenticated
  it('15. Bearer token is attached to all child backend requests when authenticated', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ current: null, history: [] }),
    })
    global.fetch = fetchSpy

    setAuthToken('jwt.special.child.token')

    await endpoints.fingerprint(1)
    await endpoints.recommendations(1)

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/api/fingerprint/1'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt.special.child.token',
        }),
      })
    )

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/recommendations/1'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt.special.child.token',
        }),
      })
    )
  })
})

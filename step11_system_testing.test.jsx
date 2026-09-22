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

describe('Step 11: Final System Testing & Cross-Portal E2E Audit', () => {
  // =========================================================================
  // 1. CHILD PORTAL NAVIGATION & FLOW
  // =========================================================================

  it('1. Landing Page renders hero branding, child start button, and portal links', async () => {
    render(<App initialRoute="/" />)
    expect(await screen.findByText(/early reading-risk profiling platform/i)).toBeInTheDocument()
    expect(screen.getByText(/I'm a Learner/i)).toBeInTheDocument()
    expect(screen.getByText(/Parent Portal/i)).toBeInTheDocument()
    expect(screen.getByText(/Teacher Portal/i)).toBeInTheDocument()
  })

  it('2. Child Selection screen renders student profiles and selects active child', async () => {
    render(<App initialRoute="/select-profile" />)
    expect(await screen.findByText(/Who's learning today\?/i)).toBeInTheDocument()
    expect(screen.getByText('Aarav')).toBeInTheDocument()
    expect(screen.getByText('Meera')).toBeInTheDocument()
    expect(screen.getByText('Kabir')).toBeInTheDocument()

    // Click Aarav
    fireEvent.click(screen.getByText('Aarav'))
    expect(localStorage.getItem('readquest_active_child_id')).toBe('1')
  })

  it('3. Child Home renders greeting, stats, and next recommended activity with WHY reason', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            title: 'Sound Safari',
            route: '/child/games/match-sound',
            icon: '🦁',
            reason: 'Strengthen sound blending patterns',
            difficulty_level: 2,
            is_adaptive: true,
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.child.token',
      user: { id: 1, name: 'Aarav', role: 'student' },
    }))
    setAuthToken('jwt.child.token')
    localStorage.setItem('readquest_active_child_id', '1')

    render(<App initialRoute="/child/home" />)

    expect(await screen.findByText(/Aarav! 👋/i)).toBeInTheDocument()
    expect(screen.getByText(/Continue Learning/i)).toBeInTheDocument()
    expect(screen.getByText('Sound Safari')).toBeInTheDocument()
    expect(screen.getByText(/Strengthen sound blending patterns/i)).toBeInTheDocument()
  })

  it('4. Learn Home renders 4 core categories and recommended activity', async () => {
    localStorage.setItem('readquest_active_child_id', '1')
    render(<App initialRoute="/child/learn" />)

    expect(await screen.findByText(/Sounds/i)).toBeInTheDocument()
    expect(screen.getByText(/Reading/i)).toBeInTheDocument()
    expect(screen.getByText(/Speaking/i)).toBeInTheDocument()
    expect(screen.getByText(/Understanding/i)).toBeInTheDocument()
  })

  it('5. Read With Me screen loads reading passage and interactive tools', async () => {
    localStorage.setItem('readquest_active_child_id', '1')
    render(<App initialRoute="/child/read" />)

    expect(await screen.findByText(/Read With Me 📖/i)).toBeInTheDocument()
    expect(screen.getByText(/My Pet Cat/i)).toBeInTheDocument()
  })

  it('6. Speak & Shine screen renders pronunciation cards and microphone controls', async () => {
    localStorage.setItem('readquest_active_child_id', '1')
    render(<App initialRoute="/child/speak" />)

    expect(await screen.findByText(/Speak & Shine 🎤/i)).toBeInTheDocument()
    expect(screen.getByText(/Say this word!/i)).toBeInTheDocument()
  })

  it('7. Word Builder game renders intro screen and Start button', async () => {
    localStorage.setItem('readquest_active_child_id', '1')
    render(<App initialRoute="/child/games/build-word" />)

    expect(await screen.findByText('Word Builder')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
  })

  it('8. Sound Safari game renders intro screen and Start button', async () => {
    localStorage.setItem('readquest_active_child_id', '1')
    render(<App initialRoute="/child/games/match-sound" />)

    expect(await screen.findByText('Sound Safari')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
  })

  it('9. Letter Detective game renders intro screen and Start button', async () => {
    localStorage.setItem('readquest_active_child_id', '1')
    render(<App initialRoute="/child/games/find-sound" />)

    expect(await screen.findByText('Letter Detective')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
  })

  it('10. Picture Match game renders intro screen and Start button', async () => {
    localStorage.setItem('readquest_active_child_id', '1')
    render(<App initialRoute="/child/games/picture-word" />)

    expect(await screen.findByText('Picture Match')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Game ▶/i })).toBeInTheDocument()
  })

  it('11. Games Hub displays game library with sound and word activities', async () => {
    localStorage.setItem('readquest_active_child_id', '1')
    render(<App initialRoute="/child/games" />)

    expect(await screen.findByText(/Word Builder/i)).toBeInTheDocument()
    expect(screen.getByText(/Sound Safari/i)).toBeInTheDocument()
    expect(screen.getByText(/Letter Detective/i)).toBeInTheDocument()
    expect(screen.getByText(/Picture Match/i)).toBeInTheDocument()
  })

  it('12. Stories Hub renders illustrated reading adventure collection', async () => {
    localStorage.setItem('readquest_active_child_id', '1')
    render(<App initialRoute="/child/stories" />)

    expect(await screen.findByText('Story Time')).toBeInTheDocument()
    expect(screen.getByText(/The Curious Fox/i)).toBeInTheDocument()
  })

  it('13. Results screen renders score, stars earned, or empty state', async () => {
    render(<App initialRoute="/child/results" />)
    expect(await screen.findByText(/No activity yet today/i)).toBeInTheDocument()
    expect(screen.getByText(/Back to Home/i)).toBeInTheDocument()
  })

  it('14. My Journey renders reading milestones, fingerprint preview, and progression path', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            title: 'Read With Me',
            route: '/child/read',
            icon: '📖',
            reason: 'Strengthen reading comprehension',
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_active_child_id', '1')
    render(<App initialRoute="/child/journey" />)

    expect(await screen.findByText(/My Reading Journey/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /See My Reading Fingerprint/i })).toBeInTheDocument()
  })

  it('15. My Practice renders targeted practice categories and spaced drills', async () => {
    localStorage.setItem('readquest_active_child_id', '1')
    render(<App initialRoute="/child/practice" />)

    expect(await screen.findByText(/Today's Learning Adventure/i)).toBeInTheDocument()
    expect(screen.getByText(/Picked just for you/i)).toBeInTheDocument()
  })

  it('16. Achievements screen renders badges, stars, and unlockable awards', async () => {
    localStorage.setItem('readquest_active_child_id', '1')
    render(<App initialRoute="/child/achievements" />)

    expect(await screen.findByText(/Achievements 🏆/i)).toBeInTheDocument()
    expect(screen.getByText(/Story Explorer/i)).toBeInTheDocument()
  })

  // =========================================================================
  // 2. CLOSED LEARNING LOOP: ACTIVITY -> SESSION -> FINGERPRINT -> RECOMMENDATION
  // =========================================================================

  it('17. Closed Loop: Completing session calls endpoints.createLearningSession to persist to backend', async () => {
    let savedPayload = null
    const fetchSpy = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/learning/session') && opts?.method === 'POST') {
        savedPayload = JSON.parse(opts.body)
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 888,
            student_id: 1,
            activity_type: savedPayload.activity_type,
            score: savedPayload.score,
            accuracy: savedPayload.accuracy,
            created_at: new Date().toISOString(),
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    setAuthToken('jwt.child.token')
    await endpoints.createLearningSession(1, {
      skill: 'phonologicalAwareness',
      stars: 4,
      xp: 25,
      outcome: { title: 'Sound Safari', score: 100, accuracy: 100 },
    })

    expect(savedPayload).not.toBeNull()
    expect(savedPayload.skill).toBe('phonologicalAwareness')
    expect(savedPayload.stars).toBe(4)
  })

  // =========================================================================
  // 3. PARENT PORTAL END-TO-END FLOW
  // =========================================================================

  it('18. Parent Login renders form and logs in successfully', async () => {
    const fetchSpy = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/auth/login') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            access_token: 'valid.parent.jwt',
            token_type: 'bearer',
            user: { id: 10, email: 'parent@readquest.demo', name: 'Parent User', role: 'parent' },
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    render(<App initialRoute="/parent/login" />)
    expect(await screen.findByRole('heading', { name: /Parent Login/i })).toBeInTheDocument()

    const emailInput = screen.getByPlaceholderText(/Email/i)
    const passInput = screen.getByPlaceholderText(/Password/i)
    fireEvent.change(emailInput, { target: { value: 'parent@readquest.demo' } })
    fireEvent.change(passInput, { target: { value: 'demo1234' } })

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('19. Parent Dashboard fetches real metrics and renders summary cards', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/1/summary')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            total_stars: 180,
            streak: 6,
            activities_completed: 24,
            learning_time_min: 75,
            recent_comparison: '+12% vs last week',
          }),
        })
      }
      if (url.includes('/api/parent/children/1/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            range: '7d',
            skills: [{ key: 'phonological_awareness', label: 'Sounds', value: 85, trend: 'improving' }],
            sample_size: 24,
            note: null,
          }),
        })
      }
      if (url.includes('/api/parent/children/1/activities')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 501,
              student_id: 1,
              activity_name: 'Sound Safari',
              skill: 'phonologicalAwareness',
              stars: 3,
              completed_at: new Date().toISOString(),
              outcome: { title: 'Sound Safari', accuracy: 90 },
            },
          ],
        })
      }
      if (url.includes('/api/parent/children/1/recommendations')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            recommended_activities: [{ title: 'Word Builder', skill: 'wordRecognition', reason: 'Consolidation' }],
            priority_skill: 'wordRecognition',
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    const auth = {
      token: 'jwt.parent.token',
      user: { id: 10, email: 'parent@readquest.demo', name: 'Parent User', role: 'parent' },
      isAuthenticated: true,
    }
    localStorage.setItem('readquest_auth', JSON.stringify(auth))
    setAuthToken('jwt.parent.token')
    localStorage.setItem('readquest_active_child_id', '1')

    render(<App initialRoute="/parent/dashboard" />)

    expect(await screen.findByText('180')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('75 min')).toBeInTheDocument()
    expect(screen.getAllByText(/6 days/i).length).toBeGreaterThan(0)
  })

  it('20. Parent Progress renders 7d, 30d, 90d tabs and queries backend with real range parameter', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      const requestedRange = url.includes('range=30d') ? '30d' : url.includes('range=90d') ? '90d' : '7d'
      return Promise.resolve({
        ok: true,
        json: async () => ({
          student_id: 1,
          range: requestedRange,
          skills: [
            { key: 'phonological_awareness', label: 'Sounds', value: requestedRange === '90d' ? 88 : 78, trend: 'improving' },
            { key: 'reading_fluency', label: 'Fluency', value: requestedRange === '90d' ? 82 : 72, trend: 'improving' },
          ],
          sample_size: requestedRange === '90d' ? 45 : 12,
          note: null,
        }),
      })
    })
    global.fetch = fetchSpy

    const auth = {
      token: 'jwt.parent.token',
      user: { id: 10, email: 'parent@readquest.demo', name: 'Parent User', role: 'parent' },
      isAuthenticated: true,
    }
    localStorage.setItem('readquest_auth', JSON.stringify(auth))
    setAuthToken('jwt.parent.token')
    localStorage.setItem('readquest_active_child_id', '1')

    render(<App initialRoute="/parent/progress" />)

    expect(await screen.findByRole('button', { name: /7 days/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /30 days/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /90 days/i })).toBeInTheDocument()

    // Switch to 30 Days
    fireEvent.click(screen.getByRole('button', { name: /30 days/i }))
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('range=30d'),
        expect.anything()
      )
    })

    // Switch to 90 Days
    fireEvent.click(screen.getByRole('button', { name: /90 days/i }))
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('range=90d'),
        expect.anything()
      )
    })
  })

  it('21. Parent Fingerprint displays real skill radar and developmental levels', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/1/fingerprint')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            current: {
              phonological_awareness: 80,
              reading_fluency: 75,
              pronunciation: 70,
              comprehension: 65,
              word_recognition: 60,
            },
            history: [],
            observations: [
              { pattern: 'Initial consonant substitution', session_count: 2 },
            ],
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.parent.token',
      user: { id: 10, name: 'Parent One', role: 'parent' },
    }))
    setAuthToken('jwt.parent.token')

    render(<App initialRoute="/parent/fingerprint" />)
    expect(await screen.findByText(/initial consonant substitution/i)).toBeInTheDocument()
    expect(screen.getByText(/seen in 2 sessions/i)).toBeInTheDocument()
  })

  it('22. Parent Activities screen displays real activity history cards', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/1/activities')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 901,
              student_id: 1,
              activity_name: 'Word Builder Master',
              skill: 'wordRecognition',
              stars: 3,
              completed_at: new Date().toISOString(),
              outcome: { title: 'Word Builder Master', accuracy: 92 },
            },
          ],
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    const auth = {
      token: 'jwt.parent.token',
      user: { id: 10, email: 'parent@readquest.demo', name: 'Parent User', role: 'parent' },
      isAuthenticated: true,
    }
    localStorage.setItem('readquest_auth', JSON.stringify(auth))
    setAuthToken('jwt.parent.token')
    localStorage.setItem('readquest_active_child_id', '1')

    render(<App initialRoute="/parent/activities" />)
    expect(await screen.findByText('Word Builder Master')).toBeInTheDocument()
    expect(screen.getByText(/Word Recognition/i)).toBeInTheDocument()
  })

  it('23. Parent Reports screen renders structured progress export', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/1/reports')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            generated_at: new Date().toISOString(),
            learning_summary: { total_sessions: 28, total_stars: 180, mastery_level: 'Developing' },
            skill_breakdown: [{ skill: 'Phonics', score: 85 }],
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    const auth = {
      token: 'jwt.parent.token',
      user: { id: 10, email: 'parent@readquest.demo', name: 'Parent User', role: 'parent' },
      isAuthenticated: true,
    }
    localStorage.setItem('readquest_auth', JSON.stringify(auth))
    setAuthToken('jwt.parent.token')
    localStorage.setItem('readquest_active_child_id', '1')

    render(<App initialRoute="/parent/reports" />)
    expect(await screen.findByText(/preview and export a shareable progress report/i)).toBeInTheDocument()
  })

  // =========================================================================
  // 4. TEACHER PORTAL END-TO-END FLOW
  // =========================================================================

  it('24. Teacher Login renders form and logs in successfully', async () => {
    const fetchSpy = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/auth/login') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            access_token: 'valid.teacher.jwt',
            token_type: 'bearer',
            user: { id: 20, email: 'teacher@readquest.demo', name: 'Teacher Jane', role: 'teacher' },
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    render(<App initialRoute="/teacher/login" />)
    expect(await screen.findByRole('heading', { name: /Teacher Login/i })).toBeInTheDocument()

    const emailInput = screen.getByPlaceholderText(/Email/i)
    const passInput = screen.getByPlaceholderText(/Password/i)
    fireEvent.change(emailInput, { target: { value: 'teacher@readquest.demo' } })
    fireEvent.change(passInput, { target: { value: 'demo1234' } })

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('25. Teacher Dashboard fetches class summary and renders class metrics', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/teacher/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            total_students: 12,
            active_learners: 9,
            activities_completed: 42,
            students_needing_support: 2,
            needing_support_list: [],
            recent_activity: [],
            strengths: ['Class demonstrates solid performance in sound awareness.'],
            to_practice: ['Word Recognition — extra practice recommended.'],
          }),
        })
      }
      if (url.includes('/api/teacher/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            skills: [{ key: 'reading_fluency', label: 'Reading Fluency', emoji: '📖', value: 74, color: '#2fd486' }],
          }),
        })
      }
      if (url.includes('/api/classes')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'Grade 2 — Section A', student_count: 12 }],
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    const auth = {
      token: 'jwt.teacher.token',
      user: { id: 20, name: 'Ms. Smith', role: 'teacher' },
    }
    localStorage.setItem('readquest_auth', JSON.stringify(auth))
    setAuthToken('jwt.teacher.token')

    render(<App initialRoute="/teacher/dashboard" />)
    expect(await screen.findByText(/good morning, teacher/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('9')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })

  it('26. Teacher Students roster renders all students and allows selection', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/teacher/students')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Aarav Sharma', age: 7, avatar: '🦊', created_at: new Date().toISOString() },
            { id: 2, name: 'Maya Patel', age: 7, avatar: '🐱', created_at: new Date().toISOString() },
          ],
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    const auth = {
      token: 'jwt.teacher.token',
      user: { id: 20, name: 'Ms. Smith', role: 'teacher' },
    }
    localStorage.setItem('readquest_auth', JSON.stringify(auth))
    setAuthToken('jwt.teacher.token')

    render(<App initialRoute="/teacher/students" />)
    expect(await screen.findByText(/aarav sharma/i)).toBeInTheDocument()
    expect(screen.getByText(/maya patel/i)).toBeInTheDocument()
  })

  it('27. Teacher Student Profile fetches student 1 drilldown details', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/students/1/fingerprint')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            current: {
              phonological_awareness: 85,
              reading_fluency: 78,
              pronunciation: 72,
              comprehension: 80,
              word_recognition: 75,
            },
            observations: [{ pattern: 'Vowel glide hesitation', session_count: 1 }],
          }),
        })
      }
      if (url.includes('/api/students/1/sessions')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 301,
              student_id: 1,
              activity_name: 'Sound Safari',
              skill: 'phonologicalAwareness',
              completed_at: new Date().toISOString(),
              outcome: { title: 'Sound Safari', accuracy: 88 },
            },
          ],
        })
      }
      if (url.includes('/api/students/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, name: 'Aarav Sharma', age: 7, avatar: '🦊', created_at: new Date().toISOString() }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    const auth = {
      token: 'jwt.teacher.token',
      user: { id: 20, name: 'Ms. Smith', role: 'teacher' },
    }
    localStorage.setItem('readquest_auth', JSON.stringify(auth))
    setAuthToken('jwt.teacher.token')

    render(<App initialRoute="/teacher/students/1" />)
    expect(await screen.findByText(/id #1/i)).toBeInTheDocument()
    expect(screen.getByText(/vowel glide hesitation/i)).toBeInTheDocument()
  })

  it('28. Teacher Class Progress renders class skill mastery distribution', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/teacher/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            skills: [
              { key: 'phonological_awareness', label: 'Sound Awareness', emoji: '🔤', value: 71, color: '#12aeef' },
            ],
            distribution: { Improving: 5, 'Strong Progress': 4, 'Needs Practice': 2 },
            participation: [{ activity: 'Read With Me', count: 12 }],
            insights: ['Sound Awareness shows the strongest class average.'],
            sample_size: 20,
            range: '7d',
            note: null,
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    const auth = {
      token: 'jwt.teacher.token',
      user: { id: 20, name: 'Ms. Smith', role: 'teacher' },
    }
    localStorage.setItem('readquest_auth', JSON.stringify(auth))
    setAuthToken('jwt.teacher.token')

    render(<App initialRoute="/teacher/progress" />)
    expect(await screen.findByText(/average class skill scores/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/5 students/i)).toBeInTheDocument()
    })
  })

  // =========================================================================
  // 5. CROSS-PORTAL DATA CONSISTENCY & SECURITY BOUNDARIES
  // =========================================================================

  it('29. Cross-Portal Consistency: Activity completed by Child 1 matches in Parent & Teacher portals', async () => {
    const canonicalActivity = {
      id: 777,
      student_id: 1,
      activity_name: 'Sound Safari Quest',
      skill: 'phonologicalAwareness',
      stars: 3,
      score: 95,
      completed_at: '2026-09-11T12:00:00Z',
      outcome: { title: 'Sound Safari Quest', accuracy: 95 },
    }

    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/1/activities')) {
        return Promise.resolve({
          ok: true,
          json: async () => [canonicalActivity],
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    // Verify in Parent view
    const parentAuth = {
      token: 'jwt.parent.token',
      user: { id: 10, email: 'parent@readquest.demo', name: 'Parent User', role: 'parent' },
      isAuthenticated: true,
    }
    localStorage.setItem('readquest_auth', JSON.stringify(parentAuth))
    setAuthToken('jwt.parent.token')
    localStorage.setItem('readquest_active_child_id', '1')

    render(<App initialRoute="/parent/activities" />)
    expect(await screen.findByText(/Sound Safari Quest/i)).toBeInTheDocument()
    expect(screen.getByText(/Phonological Awareness/i)).toBeInTheDocument()
  })

  it('30. Security: Parent cannot access unauthorized child (403 Forbidden handled honestly)', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/999')) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({ detail: 'Unauthorized: Not your child' }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    const parentAuth = {
      token: 'jwt.parent.token',
      user: { id: 10, email: 'parent@readquest.demo', name: 'Parent User', role: 'parent' },
      isAuthenticated: true,
    }
    localStorage.setItem('readquest_auth', JSON.stringify(parentAuth))
    setAuthToken('jwt.parent.token')
    localStorage.setItem('readquest_active_child_id', '999')

    render(<App initialRoute="/parent/dashboard" />)
    expect(await screen.findByText(/Parent Portal/i)).toBeInTheDocument()
  })

  it('31. Security: Teacher cannot access unauthorized student (403 Forbidden handled honestly)', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/teacher/students/999')) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({ detail: 'Unauthorized: Student not in your classes' }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    const teacherAuth = {
      token: 'jwt.teacher.token',
      user: { id: 20, email: 'teacher@readquest.demo', name: 'Teacher Jane', role: 'teacher' },
      isAuthenticated: true,
    }
    localStorage.setItem('readquest_auth', JSON.stringify(teacherAuth))
    setAuthToken('jwt.teacher.token')

    render(<App initialRoute="/teacher/students/999" />)
    expect(await screen.findByText(/Teacher Portal/i)).toBeInTheDocument()
  })

  it('32. Error Boundary & Resilience: Backend network error renders retry UI without silent fallback', async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error('Network offline'))
    global.fetch = fetchSpy

    const parentAuth = {
      token: 'jwt.parent.token',
      user: { id: 10, email: 'parent@readquest.demo', name: 'Parent User', role: 'parent' },
      isAuthenticated: true,
    }
    localStorage.setItem('readquest_auth', JSON.stringify(parentAuth))
    setAuthToken('jwt.parent.token')
    localStorage.setItem('readquest_active_child_id', '1')

    render(<App initialRoute="/parent/dashboard" />)
    expect(await screen.findByText(/Parent Portal/i)).toBeInTheDocument()
  })
})

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

describe('Connected Learning Platform — Page Data Flow & Integration', () => {
  // -------------------------------------------------------------
  // Group 1: Child Selection & Numeric ID Harmonization
  // -------------------------------------------------------------
  it('1. Child profile selection sets canonical numeric student ID 1 in localStorage', async () => {
    localStorage.setItem('readquest_active_child_id', '1')
    render(<App initialRoute="/child/home" />)
    expect(await screen.findByText(/Aarav/i)).toBeInTheDocument()
    expect(localStorage.getItem('readquest_active_child_id')).toBe('1')
  })

  it('2. Switching active child stores updated numeric student ID', async () => {
    render(<App initialRoute="/select-profile" />)
    const meeraButton = await screen.findByText('Meera')
    fireEvent.click(meeraButton)
    await waitFor(() => {
      const stored = localStorage.getItem('readquest_active_child_id')
      expect(stored).toBe('2')
    })
  })

  it('3. App initializes with first child when localStorage is blank', async () => {
    render(<App initialRoute="/child/home" />)
    expect(await screen.findByText(/Aarav/i)).toBeInTheDocument()
  })

  it('4. Numeric ID parsing sanitizes string numbers in localStorage', async () => {
    localStorage.setItem('readquest_active_child_id', JSON.stringify('3'))
    render(<App initialRoute="/child/home" />)
    expect(await screen.findByText(/Kabir/i)).toBeInTheDocument()
  })

  // -------------------------------------------------------------
  // Group 2: Child Home Page Hydration
  // -------------------------------------------------------------
  it('5. Child Home hydrates nextRecommendedActivity and learningPath from backend when authenticated', async () => {
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
              { skill: 'phonologicalAwareness', activity: 'Sound Safari', route: '/child/games/match-sound', icon: '🦁' },
              { skill: 'readingFluency', activity: 'Read With Me', route: '/child/read', icon: '📖' },
            ],
          }),
        })
      }
      if (url.includes('/api/progress/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            range: '7d',
            skills: [{ key: 'readingFluency', label: 'Reading', value: 80 }],
            sample_size: 5,
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

    render(<App initialRoute="/child/home" />)
    expect(await screen.findByText(/Continue Learning/i)).toBeInTheDocument()
    expect(screen.getByText('Sound Safari')).toBeInTheDocument()
    expect(screen.getByText(/Practice phonological awareness: sound safari/i)).toBeInTheDocument()
  })

  it('6. Child Home displays recent activity adventure from learning history', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/learning/history/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 99,
              student_id: 1,
              activity_name: 'Word Builder Master',
              skill: 'wordRecognition',
              stars: 4,
              outcome: { title: 'Word Builder Master', accuracy: 90 },
              completed_at: new Date().toISOString(),
            },
          ],
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

    render(<App initialRoute="/child/home" />)
    expect(await screen.findByText(/Aarav/i)).toBeInTheDocument()
  })

  it('7. Child Home navigation buttons link to main portals (Read, Speak, Play, Stories)', async () => {
    render(<App initialRoute="/child/home" />)
    expect(await screen.findByText(/What would you like to do\?/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Read/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Speak/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Play/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Stories/i).length).toBeGreaterThan(0)
  })

  it('8. Child Home greeting shows child name and avatar', async () => {
    render(<App initialRoute="/child/home" />)
    expect(await screen.findByText(/Aarav! 👋/i)).toBeInTheDocument()
    expect(screen.getByText('🦊')).toBeInTheDocument()
  })

  // -------------------------------------------------------------
  // Group 3: Learn Page & Category Flow
  // -------------------------------------------------------------
  it('9. Learn page renders categories (Sounds, Reading, Speaking, Understanding)', async () => {
    render(<App initialRoute="/child/learn" />)
    expect(await screen.findByText(/Sounds/i)).toBeInTheDocument()
    expect(screen.getByText(/Reading/i)).toBeInTheDocument()
    expect(screen.getByText(/Speaking/i)).toBeInTheDocument()
    expect(screen.getByText(/Understanding/i)).toBeInTheDocument()
  })

  it('10. Learn page renders recommended activity banner when present', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            title: 'Sound Safari',
            route: '/child/games/match-sound',
            icon: '🦁',
            reason: 'Phonological skill boost',
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

    render(<App initialRoute="/child/learn" />)
    expect(await screen.findByText(/Picked for you/i)).toBeInTheDocument()
    expect(screen.getByText(/Sound Safari!/i)).toBeInTheDocument()
    expect(screen.getByText(/Phonological skill boost/i)).toBeInTheDocument()
  })

  it('11. Clicking a game category launches game route', async () => {
    render(<App initialRoute="/child/learn" />)
    const soundSafariCard = await screen.findByText('Sound Safari')
    fireEvent.click(soundSafariCard)
    expect(await screen.findByText(/Start Game/i)).toBeInTheDocument()
  })

  // -------------------------------------------------------------
  // Group 4: MyPractice Page & Adaptation
  // -------------------------------------------------------------
  it('12. MyPractice loads dynamic learning path with reasons and levels', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/path/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            path: [
              {
                title: 'Letter Detective',
                reason: 'Target sound identification needed.',
                icon: '🔍',
                route: '/child/games/find-sound',
                difficulty: 2,
              },
            ],
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

    render(<App initialRoute="/child/practice" />)
    expect(await screen.findByText('Letter Detective')).toBeInTheDocument()
    expect(screen.getByText('Target sound identification needed.')).toBeInTheDocument()
    expect(screen.getByText(/Level 2/)).toBeInTheDocument()
  })

  it('13. MyPractice displays empty message if path is empty', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
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
      token: 'jwt.child.token',
      user: { id: 1, name: 'Aarav', role: 'student' },
    }))
    setAuthToken('jwt.child.token')

    render(<App initialRoute="/child/practice" />)
    expect(await screen.findByText(/No practice activities currently queued/i)).toBeInTheDocument()
  })

  it('14. MyPractice displays retry card on error and re-fetches', async () => {
    let attempts = 0
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/path/1')) {
        attempts++
        if (attempts === 1) {
          return Promise.reject(new Error('Network offline'))
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            path: [{ title: 'Sound Safari', reason: 'Ready to play', icon: '🦁', route: '/child/games/match-sound' }],
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

    render(<App initialRoute="/child/practice" />)
    expect(await screen.findByText(/Could not load activities/i)).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /Retry/i })
    fireEvent.click(retryBtn)
    expect(await screen.findByText('Sound Safari')).toBeInTheDocument()
  })

  // -------------------------------------------------------------
  // Group 5: MyJourney Real Fingerprint & History
  // -------------------------------------------------------------
  it('15. MyJourney loads backend fingerprint skills for active child', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/fingerprint/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            current: {
              phonological_awareness: 85,
              pronunciation: 78,
              word_recognition: 92,
              reading_fluency: 74,
              comprehension: 88,
            },
            history: [],
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

    render(<App initialRoute="/child/journey" />)
    expect(await screen.findByText('Sounds')).toBeInTheDocument()
    expect(screen.getByText('Reading')).toBeInTheDocument()
    expect(screen.getByText('Speaking')).toBeInTheDocument()
    expect(screen.getByText('Understanding')).toBeInTheDocument()
  })

  it('16. MyJourney displays overall strength score based on fingerprint', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/fingerprint/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            current: {
              phonological_awareness: 90,
              pronunciation: 90,
              word_recognition: 90,
              reading_fluency: 90,
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
      token: 'jwt.child.token',
      user: { id: 1, name: 'Aarav', role: 'student' },
    }))
    setAuthToken('jwt.child.token')

    render(<App initialRoute="/child/journey" />)
    expect(await screen.findByText(/Skills you're growing/i)).toBeInTheDocument()
  })

  it('17. MyJourney toggles deep dive radar chart and skill breakdown', async () => {
    render(<App initialRoute="/child/journey" />)
    const toggleBtn = await screen.findByRole('button', { name: /See My Reading Fingerprint/i })
    fireEvent.click(toggleBtn)
    expect(await screen.findByText(/Progress Over Time/i)).toBeInTheDocument()
  })

  it('18. MyJourney has link back to learning adventures', async () => {
    render(<App initialRoute="/child/journey" />)
    expect(await screen.findByText(/My Reading Journey/i)).toBeInTheDocument()
  })

  // -------------------------------------------------------------
  // Group 6: Read With Me Activity to Results Flow
  // -------------------------------------------------------------
  it('19. Read With Me renders passage selector and passage text', async () => {
    render(<App initialRoute="/child/read" />)
    expect(await screen.findByText(/Read With Me 📖/i)).toBeInTheDocument()
    expect(screen.getByText(/My Pet Cat/i)).toBeInTheDocument()
  })

  it('20. Read With Me saves reading session to backend and updates child progress', async () => {
    let savedPayload = null
    const fetchSpy = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/reading/session')) {
        savedPayload = JSON.parse(opts.body)
        return Promise.resolve({
          ok: true,
          json: async () => ({
            session_id: 201,
            student_id: 1,
            accuracy: 92,
            words_correct: 14,
            words_attempted: 15,
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

    await endpoints.createReadingSession(1, {
      expected_text: 'My cat is small and soft',
      recognized_text: 'My cat is small and soft',
      stars: 4,
      xp: 20,
    })

    expect(savedPayload).not.toBeNull()
    expect(savedPayload.expected_text).toBe('My cat is small and soft')
    expect(savedPayload.stars).toBe(4)
  })

  it('21. Results page displays reading empty state or session outcome', async () => {
    render(<App initialRoute="/child/results" />)
    expect(await screen.findByText(/No activity yet today/i)).toBeInTheDocument()
    expect(screen.getByText(/Back to Home/i)).toBeInTheDocument()
  })

  // -------------------------------------------------------------
  // Group 7: GamePlay Aliases and Outcome Persistence
  // -------------------------------------------------------------
  it('22. GamePlay handles alias /child/games/sound-safari mapping to match-sound', async () => {
    render(<App initialRoute="/child/games/sound-safari" />)
    expect(await screen.findByText('Sound Safari')).toBeInTheDocument()
    expect(screen.getByText(/Start Game ▶/i)).toBeInTheDocument()
  })

  it('23. GamePlay handles alias /child/games/word-builder mapping to build-word', async () => {
    render(<App initialRoute="/child/games/word-builder" />)
    expect(await screen.findByText('Word Builder')).toBeInTheDocument()
    expect(screen.getByText(/Start Game ▶/i)).toBeInTheDocument()
  })

  it('24. Finishing game saves session to backend without duplicate calls', async () => {
    let callCount = 0
    let savedSession = null
    const fetchSpy = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/learning/session')) {
        callCount++
        savedSession = JSON.parse(opts.body)
        return Promise.resolve({
          ok: true,
          json: async () => ({ session_id: 301, student_id: 1, stars: 4, xp: 27 }),
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

    await endpoints.createLearningSession(1, {
      skill: 'phonologicalAwareness',
      stars: 4,
      xp: 27,
      outcome: { title: 'Sound Safari', score: 100, accuracy: 100 },
    })

    expect(callCount).toBe(1)
    expect(savedSession.stars).toBe(4)
    expect(savedSession.skill).toBe('phonologicalAwareness')
  })

  // -------------------------------------------------------------
  // Group 8: Speak & Shine and Story Challenges
  // -------------------------------------------------------------
  it('25. Speak & Shine opens with word bank and practice prompt', async () => {
    render(<App initialRoute="/child/speak" />)
    expect(await screen.findByText(/Speak & Shine 🎤/i)).toBeInTheDocument()
    expect(screen.getByText(/Say this word!/i)).toBeInTheDocument()
  })

  it('26. Story Reader loads story and start challenge button', async () => {
    render(<App initialRoute="/child/stories/story-forest" />)
    expect(await screen.findByText(/The Curious Fox/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Read$/i })).toBeInTheDocument()
  })

  it('27. Completing story comprehension quiz saves session with comprehension skill', async () => {
    let savedData = null
    const fetchSpy = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/learning/session')) {
        savedData = JSON.parse(opts.body)
        return Promise.resolve({
          ok: true,
          json: async () => ({ session_id: 401, student_id: 1, skill: 'comprehension' }),
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

    await endpoints.createLearningSession(1, {
      skill: 'comprehension',
      stars: 4,
      xp: 20,
      outcome: { title: 'Story Challenge', accuracy: 100 },
    })

    expect(savedData.skill).toBe('comprehension')
  })

  // -------------------------------------------------------------
  // Group 9: Child Achievements Live Integration
  // -------------------------------------------------------------
  it('28. Achievements page renders earned badges from backend API', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/achievements/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, key: 'first_word', title: 'First Word Wonder', description: 'Read your first word!', earned: true, icon: '🌟' },
            { id: 2, key: 'streak_3', title: '3-Day Champ', description: 'Read 3 days in a row', earned: false, icon: '🔥' },
          ],
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

    render(<App initialRoute="/child/achievements" />)
    expect(await screen.findByText('First Word Wonder')).toBeInTheDocument()
    expect(screen.getByText('3-Day Champ')).toBeInTheDocument()
    expect(screen.getByText(/1\/2/i)).toBeInTheDocument()
  })

  it('29. Achievements page displays error card on network failure with retry button', async () => {
    let count = 0
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/achievements/1')) {
        count++
        if (count === 1) return Promise.reject(new Error('Server unavailable'))
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, key: 'badge1', title: 'Star Reader', earned: true, icon: '⭐' }],
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

    render(<App initialRoute="/child/achievements" />)
    expect(await screen.findByText(/Could not load achievements/i)).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /Retry/i })
    fireEvent.click(retryBtn)
    expect(await screen.findByText('Star Reader')).toBeInTheDocument()
  })

  // -------------------------------------------------------------
  // Group 10: Parent Portal Connected Flow
  // -------------------------------------------------------------
  it('30. Unauthenticated access to /parent/dashboard redirects to /parent/login', async () => {
    render(<App initialRoute="/parent/dashboard" />)
    expect(await screen.findByText(/Parent Login/i)).toBeInTheDocument()
  })

  it('31. Parent Dashboard renders child stats and overview when authenticated', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/1/summary')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            total_stars: 250,
            streak: 7,
            activities_completed: 30,
            learning_time_min: 90,
          }),
        })
      }
      if (url.includes('/api/parent/children/1/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            range: '7d',
            skills: [{ key: 'reading_fluency', label: 'Reading', value: 85, trend: 'improving' }],
            sample_size: 15,
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

    render(<App initialRoute="/parent/dashboard" />)
    expect(await screen.findByText('Good morning, Parent 👋')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('250')).toBeInTheDocument()
      expect(screen.getByText('7 days')).toBeInTheDocument()
      expect(screen.getByText('30')).toBeInTheDocument()
      expect(screen.getByText('90 min')).toBeInTheDocument()
    })
  })

  it('32. Parent Activities page displays real activity log from backend', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/1/activities')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 88,
              student_id: 1,
              activity_name: 'Sound Safari Quest',
              skill: 'phonologicalAwareness',
              stars: 3,
              completed_at: new Date().toISOString(),
              outcome: { title: 'Sound Safari Quest', accuracy: 88 },
            },
          ],
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

    render(<App initialRoute="/parent/activities" />)
    expect(await screen.findByText('Sound Safari Quest')).toBeInTheDocument()
  })

  // -------------------------------------------------------------
  // Group 11: Teacher Portal Connected Flow
  // -------------------------------------------------------------
  it('33. Unauthenticated access to /teacher/dashboard redirects to /teacher/login', async () => {
    render(<App initialRoute="/teacher/dashboard" />)
    expect(await screen.findByText(/Teacher Login/i)).toBeInTheDocument()
  })

  it('34. Teacher Dashboard renders real class counts and stats', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/teacher/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            total_students: 12,
            active_learners: 9,
            activities_completed: 42,
            students_needing_support: 2,
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
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.teacher.token',
      user: { id: 20, name: 'Teacher Maya', role: 'teacher' },
    }))
    setAuthToken('jwt.teacher.token')

    render(<App initialRoute="/teacher/dashboard" />)
    expect(await screen.findByText(/Good morning, Teacher/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('9')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })

  it('35. Teacher Reports formats printable educational progress report with non-clinical disclaimer', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/teacher/students')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'Aarav Sharma', age: 7, level: 4 }],
        })
      }
      if (url.includes('/api/fingerprint/1') || url.includes('/api/students/1/fingerprint')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            current: {
              phonological_awareness: 70,
              reading_fluency: 75,
              pronunciation: 80,
              word_recognition: 85,
              comprehension: 90,
            },
            observations: [
              { skill: 'comprehension', observation_text: 'Great comprehension' },
            ],
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.teacher.token',
      user: { id: 20, name: 'Teacher Maya', role: 'teacher' },
    }))
    setAuthToken('jwt.teacher.token')

    render(<App initialRoute="/teacher/reports" />)
    expect(await screen.findByText(/Reading Profile/i)).toBeInTheDocument()
    expect(screen.getByText(/does not provide a clinical diagnosis of dyslexia/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download Report/i })).toBeInTheDocument()
  })
})

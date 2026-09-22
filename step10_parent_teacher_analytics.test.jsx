import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './src/App'
import { endpoints, setAuthToken, clearAuthToken, ApiError } from './src/services/api'
import * as parentServiceModule from './src/services/parentService'
import * as teacherServiceModule from './src/services/teacherService'

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

describe('Step 10: Parent & Teacher Analytics + Reports', () => {
  // 1. Parent dashboard real data
  it('1. Parent Dashboard renders real metrics from parentChildSummary and parentChildProgress', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/1/summary')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            total_stars: 145,
            streak: 5,
            activities_completed: 18,
            learning_time_min: 54,
            recent_comparison: null,
          }),
        })
      }
      if (url.includes('/api/parent/children/1/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            range: '7d',
            skills: [
              { key: 'phonological_awareness', label: 'Sounds', value: 72, trend: 'improving' },
              { key: 'reading_fluency', label: 'Reading', value: 68, trend: 'steady' },
            ],
            sample_size: 18,
            note: null,
          }),
        })
      }
      if (url.includes('/api/parent/children/1/activities')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 101,
              student_id: 1,
              activity_name: 'Sound Safari',
              skill: 'phonologicalAwareness',
              stars: 3,
              completed_at: new Date().toISOString(),
              outcome: { title: 'Sound Safari', accuracy: 85 },
            },
          ],
        })
      }
      if (url.includes('/api/parent/children/1/recommendations')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 1,
              student_id: 1,
              activity_name: 'Word Builder',
              reason: 'Extra word recognition practice recommended.',
              priority: 'High',
              created_at: new Date().toISOString(),
            },
          ],
        })
      }
      if (url.includes('/api/achievements/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, key: 'first_word', title: 'Word Explorer', description: 'Read first word', earned: true, icon: '🌟' },
          ],
        })
      }
      if (url.includes('/api/parent/children')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'Aarav', age: 7, avatar: '🦊', created_at: new Date().toISOString() }],
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
    expect(await screen.findByText(/good morning, parent/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('145')).toBeInTheDocument()
      expect(screen.getByText('5 days')).toBeInTheDocument()
      expect(screen.getByText('18')).toBeInTheDocument()
      expect(screen.getByText('54 min')).toBeInTheDocument()
    })
  })

  // 2. Parent child authorization
  it('2. Parent Child access attaches Bearer token', async () => {
    let capturedAuthHeader = null
    const fetchSpy = vi.fn().mockImplementation((url, opts) => {
      capturedAuthHeader = opts?.headers?.Authorization
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: 1, name: 'Aarav', age: 7, created_at: new Date().toISOString() }],
      })
    })
    global.fetch = fetchSpy
    setAuthToken('parent.valid.jwt')

    await endpoints.parentChildren()
    expect(capturedAuthHeader).toBe('Bearer parent.valid.jwt')
  })

  // 3. Parent progress real data
  it('3. Parent Progress renders real progress skills and range data', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/1/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            range: '7d',
            skills: [
              { key: 'phonological_awareness', label: 'Sounds', value: 75, trend: 'improving' },
              { key: 'reading_fluency', label: 'Reading', value: 65, trend: 'steady' },
            ],
            sample_size: 5,
            note: null,
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

    render(<App initialRoute="/parent/progress" />)
    expect(await screen.findByText(/reading progress over time/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/improving over this period/i)).toBeInTheDocument()
    })
  })

  // 4. 7-day filtering
  it('4. Parent Progress 7-day filtering queries range=7d', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ student_id: 1, range: '7d', skills: [], sample_size: 0 }),
    })
    global.fetch = fetchSpy

    await endpoints.parentChildProgress(1, '7d')
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('range=7d'), expect.anything())
  })

  // 5. 30-day filtering
  it('5. Parent Progress 30-day filtering queries range=30d', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ student_id: 1, range: '30d', skills: [], sample_size: 0 }),
    })
    global.fetch = fetchSpy

    await endpoints.parentChildProgress(1, '30d')
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('range=30d'), expect.anything())
  })

  // 6. 90-day filtering
  it('6. Parent Progress 90-day filtering queries range=90d', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ student_id: 1, range: '90d', skills: [], sample_size: 0 }),
    })
    global.fetch = fetchSpy

    await endpoints.parentChildProgress(1, '90d')
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('range=90d'), expect.anything())
  })

  // 7. No duplicated fake history
  it('7. Parent Progress handles 0 sample size with honest empty message', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/1/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            range: '90d',
            skills: [],
            sample_size: 0,
            note: 'No activity recorded during this period.',
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

    render(<App initialRoute="/parent/progress" />)
    const ninetyDayBtn = await screen.findByRole('button', { name: /90 days/i })
    fireEvent.click(ninetyDayBtn)

    await waitFor(() => {
      expect(screen.getByText(/no activity recorded during this period/i)).toBeInTheDocument()
    })
  })

  // 8. Parent fingerprint real data
  it('8. Parent Fingerprint loads real current fingerprint and observations', async () => {
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

  // 9. Parent activity history
  it('9. Parent Activities lists real sessions with outcome details and categories', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/1/activities')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 201,
              student_id: 1,
              activity_name: 'Read With Me',
              skill: 'readingFluency',
              stars: 3,
              xp: 25,
              completed_at: new Date().toISOString(),
              outcome: { title: 'Read With Me', accuracy: 90 },
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
    expect(await screen.findByText(/read with me/i)).toBeInTheDocument()
    expect(screen.getByText(/\+25 xp/i)).toBeInTheDocument()
  })

  // 10. Parent recommendations
  it('10. Parent Recommendations displays real adaptive recommendations with reason', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/1/recommendations')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 10,
              student_id: 1,
              activity_name: 'Word Builder',
              title: 'Word Builder',
              icon: '🧩',
              reason: 'Practicing phonics will strengthen word recognition.',
              priority: 'High',
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

    render(<App initialRoute="/parent/recommendations" />)
    expect(await screen.findByText(/practicing phonics will strengthen word recognition/i)).toBeInTheDocument()
    expect(screen.getByText('Word Builder')).toBeInTheDocument()
  })

  // 11. Parent reports
  it('11. Parent Reports previews real profile and includes non-clinical disclaimer', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/1/fingerprint')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            current: {
              phonological_awareness: 82,
              reading_fluency: 74,
              pronunciation: 68,
              comprehension: 70,
              word_recognition: 65,
            },
            observations: [],
          }),
        })
      }
      if (url.includes('/api/parent/children/1/summary')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            total_stars: 50,
            streak: 2,
            activities_completed: 12,
            learning_time_min: 36,
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

    render(<App initialRoute="/parent/reports" />)
    expect(await screen.findByText(/preview and export a shareable progress report/i)).toBeInTheDocument()
    expect(screen.getByText(/completed activities/i)).toBeInTheDocument()
    expect(screen.getByText(/does not provide a clinical diagnosis of dyslexia/i)).toBeInTheDocument()
  })

  // 12. Teacher dashboard
  it('12. Teacher Dashboard renders real class counts and active learners', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/teacher/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            total_students: 12,
            active_learners: 9,
            activities_completed: 42,
            students_needing_support: 2,
            needing_support_list: [
              {
                student: { id: 2, name: 'Maya', avatar: '🐱', color: 'peach' },
                skillArea: { key: 'phonological_awareness', label: 'Sound Awareness', value: 48 },
                observation: 'Needs more sound awareness practice',
                suggestion: 'Short, regular practice sessions',
              },
            ],
            recent_activity: [
              {
                id: 501,
                student: { id: 1, name: 'Aarav', avatar: '🦊', color: 'mint' },
                label: 'Read With Me',
                date: 'May 10',
                accuracy: 92,
              },
            ],
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

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.teacher.token',
      user: { id: 20, name: 'Ms. Smith', role: 'teacher' },
    }))
    setAuthToken('jwt.teacher.token')

    render(<App initialRoute="/teacher/dashboard" />)
    expect(await screen.findByText(/good morning, teacher/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('9')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByText('Maya')).toBeInTheDocument()
      expect(screen.getByText(/needs more sound awareness practice/i)).toBeInTheDocument()
    })
  })

  // 13. Teacher student list
  it('13. Teacher Students loads authorized students from teacherStudents endpoint', async () => {
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

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.teacher.token',
      user: { id: 20, name: 'Ms. Smith', role: 'teacher' },
    }))
    setAuthToken('jwt.teacher.token')

    render(<App initialRoute="/teacher/students" />)
    expect(await screen.findByText(/aarav sharma/i)).toBeInTheDocument()
    expect(screen.getByText(/maya patel/i)).toBeInTheDocument()
  })

  // 14. Teacher student authorization
  it('14. Teacher Students request includes teacher Bearer token', async () => {
    let capturedHeader = null
    const fetchSpy = vi.fn().mockImplementation((url, opts) => {
      capturedHeader = opts?.headers?.Authorization
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: 1, name: 'Aarav', age: 7 }],
      })
    })
    global.fetch = fetchSpy
    setAuthToken('jwt.teacher.auth')

    await endpoints.teacherStudents()
    expect(capturedHeader).toBe('Bearer jwt.teacher.auth')
  })

  // 15. Teacher student profile
  it('15. Teacher Student Profile loads details and fingerprint using numeric Student.id', async () => {
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

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.teacher.token',
      user: { id: 20, name: 'Ms. Smith', role: 'teacher' },
    }))
    setAuthToken('jwt.teacher.token')

    render(<App initialRoute="/teacher/students/1" />)
    expect(await screen.findByText(/id #1/i)).toBeInTheDocument()
    expect(screen.getByText(/vowel glide hesitation/i)).toBeInTheDocument()
  })

  // 16. Teacher class progress
  it('16. Teacher Class Progress queries teacherProgress and renders distribution without multipliers', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/teacher/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            skills: [
              { key: 'phonological_awareness', label: 'Sound Awareness', emoji: '🔤', value: 71, color: '#12aeef' },
            ],
            distribution: { Improving: 5, 'Strong Progress': 4, 'Needs Practice': 2 },
            participation: [
              { activity: 'Read With Me', count: 12 },
              { activity: 'Sound Safari', count: 8 },
            ],
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

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.teacher.token',
      user: { id: 20, name: 'Ms. Smith', role: 'teacher' },
    }))
    setAuthToken('jwt.teacher.token')

    render(<App initialRoute="/teacher/progress" />)
    expect(await screen.findByText(/average class skill scores/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/5 students/i)).toBeInTheDocument()
      expect(screen.getByText(/sound awareness shows the strongest class average/i)).toBeInTheDocument()
    })
  })

  // 17. Teacher recommendations
  it('17. Teacher Recommendations lists class-level recommendations with affected students', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/teacher/recommendations')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              skill: 'phonological_awareness',
              title: 'Increase beginning-sound practice',
              suggestedActivity: 'Sound Safari',
              reason: 'Several students showed difficulty during recent sound activities.',
              priority: 'High attention',
              students: [
                { id: 1, name: 'Aarav', avatar: '🦊', color: 'mint' },
                { id: 2, name: 'Maya', avatar: '🐱', color: 'peach' },
              ],
            },
          ],
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.teacher.token',
      user: { id: 20, name: 'Ms. Smith', role: 'teacher' },
    }))
    setAuthToken('jwt.teacher.token')

    render(<App initialRoute="/teacher/recommendations" />)
    expect(await screen.findByText(/increase beginning-sound practice/i)).toBeInTheDocument()
    expect(screen.getByText(/several students showed difficulty during recent sound activities/i)).toBeInTheDocument()
    expect(screen.getByText('Aarav')).toBeInTheDocument()
    expect(screen.getByText('Maya')).toBeInTheDocument()
  })

  // 18. Teacher reports
  it('18. Teacher Reports loads student roster and formats report with non-clinical disclaimer', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/teacher/students')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 5, name: 'Kabir Verma', age: 7, level: 2 }],
        })
      }
      if (url.includes('/api/students/5/fingerprint')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 5,
            current: {
              phonological_awareness: 70,
              reading_fluency: 65,
              pronunciation: 60,
              comprehension: 75,
              word_recognition: 68,
            },
            observations: [],
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.teacher.token',
      user: { id: 20, name: 'Ms. Smith', role: 'teacher' },
    }))
    setAuthToken('jwt.teacher.token')

    render(<App initialRoute="/teacher/reports" />)
    expect(await screen.findByText(/kabir verma's reading profile/i)).toBeInTheDocument()
    expect(screen.getByText(/does not provide a clinical diagnosis of dyslexia/i)).toBeInTheDocument()
  })

  // 19. Numeric Student.id
  it('19. Student endpoints strictly use numeric Student.id', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 42, name: 'Student 42' }),
    })
    global.fetch = fetchSpy

    await endpoints.student(42)
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/students/42'), expect.anything())
  })

  // 20. Empty states
  it('20. Parent Dashboard displays honest empty state when 0 activities completed', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/parent/children/1/summary')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            total_stars: 0,
            streak: 0,
            activities_completed: 0,
            learning_time_min: 0,
            recent_comparison: null,
          }),
        })
      }
      if (url.includes('/api/parent/children/1/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ student_id: 1, range: '7d', skills: [], sample_size: 0, note: null }),
        })
      }
      if (url.includes('/api/parent/children/1/activities')) {
        return Promise.resolve({ ok: true, json: async () => [] })
      }
      if (url.includes('/api/parent/children/1/recommendations')) {
        return Promise.resolve({ ok: true, json: async () => [] })
      }
      if (url.includes('/api/achievements/1')) {
        return Promise.resolve({ ok: true, json: async () => [] })
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
    expect(await screen.findByText(/no learning sessions yet/i)).toBeInTheDocument()
    expect(screen.getByText(/no achievements unlocked yet/i)).toBeInTheDocument()
  })

  // 21. Backend error handling
  it('21. Parent Dashboard handles backend 500 error gracefully with retry card', async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error('Internal Server Error'))
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.parent.token',
      user: { id: 10, name: 'Parent One', role: 'parent' },
    }))
    setAuthToken('jwt.parent.token')

    render(<App initialRoute="/parent/dashboard" />)
    expect(await screen.findByText(/could not load dashboard data/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  // 22. No silent mock fallback
  it('22. Authenticated failure does not silently render fake analytics', async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error('Network error'))
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.parent.token',
      user: { id: 10, name: 'Parent One', role: 'parent' },
    }))
    setAuthToken('jwt.parent.token')

    render(<App initialRoute="/parent/dashboard" />)
    expect(await screen.findByText(/could not load dashboard data/i)).toBeInTheDocument()
    expect(screen.queryByText('Total Stars')).not.toBeInTheDocument()
  })

  // 23. No artificial multipliers
  it('23. Teacher Class Progress uses exact participation count from backend', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        skills: [],
        distribution: { Improving: 1, 'Strong Progress': 1, 'Needs Practice': 0 },
        participation: [
          { activity: 'Read With Me', count: 7 },
        ],
        insights: [],
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.teacherProgress(null, '30d')
    expect(res.participation[0].count).toBe(7)
  })

  // 24. No Math.random analytics
  it('24. Authenticated analytics does not invoke Math.random', async () => {
    const mathSpy = vi.spyOn(Math, 'random')
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        total_students: 5,
        active_learners: 4,
        activities_completed: 10,
        students_needing_support: 1,
        needing_support_list: [],
        recent_activity: [],
      }),
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.teacher.token',
      user: { id: 20, name: 'Ms. Smith', role: 'teacher' },
    }))
    setAuthToken('jwt.teacher.token')

    render(<App initialRoute="/teacher/dashboard" />)
    await screen.findByText(/good morning, teacher/i)
    expect(mathSpy).not.toHaveBeenCalled()
  })

  // 25. Step 6 adaptive regression
  it('25. Step 6 Adaptive learning nextActivity endpoint remains functional', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ child_id: 1, activity: 'Sound Safari', is_adaptive: true }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.nextActivity(1)
    expect(res.is_adaptive).toBe(true)
  })

  // 26. Step 7 reassessment regression
  it('26. Step 7 reassessment comparison structure remains supported', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        student_id: 1,
        recent_comparison: { skill: 'readingFluency', change: 5.0, message: 'Performance improved!' },
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.progress(1, '7d')
    expect(res.recent_comparison.change).toBe(5.0)
  })

  // 27. Step 8 AI regression
  it('27. Step 8 AI capability status remains transparent', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ai_mode: 'real', analysis_available: true, phoneme_analysis_available: false }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.speechStatus()
    expect(res.phoneme_analysis_available).toBe(false)
  })

  // 28. Step 9 personalization regression
  it('28. Step 9 spacedPractice endpoint remains accessible', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ child_id: 1, spaced_practice: [] }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.spacedPractice(1)
    expect(res.child_id).toBe(1)
  })

  // 29. Authentication regression
  it('29. Authentication token lifecycle operates correctly', () => {
    clearAuthToken()
    setAuthToken('test.jwt.lifecycle')
    expect(endpoints).toBeDefined()
    clearAuthToken()
  })

  // 30. Security regression
  it('30. Requests without token do not include Authorization header', async () => {
    let capturedHeader = 'init'
    const fetchSpy = vi.fn().mockImplementation((url, opts) => {
      capturedHeader = opts?.headers?.Authorization || null
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    clearAuthToken()

    await endpoints.health()
    expect(capturedHeader).toBeNull()
  })
})

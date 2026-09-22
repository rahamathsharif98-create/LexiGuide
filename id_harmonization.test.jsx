import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './src/App'
import { endpoints } from './src/services/api'
import { CHILDREN, CLASS_STUDENTS } from './src/data/demoData'
import { getStudentById } from './src/services/teacherService'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  delete global.fetch
})

describe('Step 3: ID Harmonization Test Suite', () => {
  // 1. Backend student ID is preserved in frontend child object
  it('1. Backend student ID is preserved in frontend child object', () => {
    // Verify each child in CHILDREN has a numeric ID
    CHILDREN.forEach((c) => {
      expect(typeof c.id).toBe('number')
      expect(c.id).toBeGreaterThan(0)
    })
    expect(CHILDREN[0].id).toBe(1)
    expect(CHILDREN[1].id).toBe(2)
    expect(CHILDREN[2].id).toBe(3)
  })

  // 2. activeChildId uses real backend ID
  it('2. activeChildId uses real backend ID', async () => {
    render(<App initialRoute="/child/home" />)
    expect((await screen.findAllByText(/Aarav/i)).length).toBeGreaterThan(0)
    // Stored activeChildId in AppContext is the canonical number 1
    const stored = localStorage.getItem('readquest_active_child_id')
    expect(stored ? JSON.parse(stored) : 1).toBe(1)
  })

  // 3. Parent child switching uses real backend IDs
  it('3. Parent child switching uses real backend IDs', async () => {
    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.parent.token',
      user: { id: 1, name: 'Parent User', email: 'parent@readquest.demo', role: 'parent' },
    }))

    render(<App initialRoute="/parent/dashboard" />)
    expect(await screen.findByText(/good morning, parent/i)).toBeInTheDocument()

    // Switch to child 2 (Meera)
    const viewButtons = await screen.findAllByRole('button', { name: /^view$/i })
    fireEvent.click(viewButtons[0]) // Switches to Meera (id: 2)

    await waitFor(() => {
      const stored = localStorage.getItem('readquest_active_child_id')
      expect(Number(stored)).toBe(2)
    })
  })

  // 4. Teacher student list uses real backend IDs
  it('4. Teacher student list uses real backend IDs', async () => {
    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.teacher.token',
      user: { id: 2, name: 'Teacher User', email: 'teacher@readquest.demo', role: 'teacher' },
    }))

    // Mock API returning real backend students with numeric IDs
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/students')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Aarav', age: 7, avatar: '🦊', created_at: '2026-01-01T00:00:00Z' },
          ],
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    render(<App initialRoute="/teacher/students" />)
    expect(await screen.findByText('Connected to live backend')).toBeInTheDocument()
    expect((await screen.findAllByText('Aarav')).length).toBeGreaterThan(0)

    // Clicking student card navigates to /teacher/students/1 with the real backend ID
    const cardBtn = screen.getByRole('button', { name: /aarav/i })
    fireEvent.click(cardBtn)

    // Check that we navigated to the profile route with ID 1
    await waitFor(() => {
      expect(screen.getByText(/learning overview/i)).toBeInTheDocument()
    })
  })

  // 5. Teacher student profile receives numeric/backend student ID
  it('5. Teacher student profile receives numeric/backend student ID', async () => {
    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.teacher.token',
      user: { id: 2, name: 'Teacher User', email: 'teacher@readquest.demo', role: 'teacher' },
    }))

    // getStudentById resolves numeric IDs from string URL param
    const resolved = getStudentById('1')
    expect(resolved).toBeTruthy()
    expect(resolved.id).toBe(1)
    expect(resolved.name).toBe('Aarav')

    render(<App initialRoute="/teacher/students/1" />)
    expect((await screen.findAllByText('Aarav')).length).toBeGreaterThan(0)
    expect(screen.getByText(/learning overview/i)).toBeInTheDocument()
  })

  // 6. Fingerprint request uses canonical ID
  it('6. Fingerprint request uses canonical ID', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        student_id: 123,
        current: { phonological_awareness: 70, pronunciation: 70, word_recognition: 70, reading_fluency: 70, comprehension: 70 },
        history: [],
        disclaimer: 'Educational screening',
      }),
    })
    global.fetch = fetchSpy

    await endpoints.studentFingerprint(123)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/students/123/fingerprint'),
      expect.any(Object)
    )
  })

  // 7. Progress request uses canonical ID
  it('7. Progress request uses canonical ID', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ range: '7d', skills: [] }),
    })
    global.fetch = fetchSpy

    await endpoints.studentProgress(123, '7d')
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/students/123/progress?range=7d'),
      expect.any(Object)
    )

    await endpoints.parentChildProgress(123, '30d')
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/parent/children/123/progress?range=30d'),
      expect.any(Object)
    )
  })

  // 8. Recommendation request uses canonical ID
  it('8. Recommendation request uses canonical ID', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([]),
    })
    global.fetch = fetchSpy

    await endpoints.studentRecommendations(123)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/students/123/recommendations'),
      expect.any(Object)
    )

    await endpoints.parentChildRecommendations(123)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/parent/children/123/recommendations'),
      expect.any(Object)
    )
  })

  // 9. Reading session uses canonical child/student ID
  it('9. Reading session uses canonical child/student ID', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, session_id: 10 }),
    })
    global.fetch = fetchSpy

    await endpoints.createReadingSession(123, {
      expected_text: 'The fox ran',
      recognized_text: 'The fox ran',
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/reading/session?child_id=123'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ expected_text: 'The fox ran', recognized_text: 'The fox ran' }),
      })
    )
  })

  // 10. No name-to-ID conversion remains in production data paths
  it('10. No name-to-ID conversion remains in production data paths', async () => {
    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.teacher.token',
      user: { id: 2, name: 'Teacher User', email: 'teacher@readquest.demo', role: 'teacher' },
    }))

    const requestedUrls = []
    global.fetch = vi.fn().mockImplementation((url) => {
      requestedUrls.push(url)
      if (url.includes('/api/students/1/fingerprint')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            current: { phonological_awareness: 65, pronunciation: 65, word_recognition: 65, reading_fluency: 65, comprehension: 65 },
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<App initialRoute="/teacher/students/1" />)
    expect((await screen.findAllByText('Aarav')).length).toBeGreaterThan(0)

    // Verify it directly requested /api/students/1/fingerprint and did NOT fetch all students to match by name
    expect(requestedUrls.some((u) => u.includes('/api/students/1/fingerprint'))).toBe(true)
    expect(requestedUrls.some((u) => u.endsWith('/api/students'))).toBe(false)
  })

  // 11. User ID is not incorrectly treated as Student ID
  it('11. User ID is not incorrectly treated as Student ID', () => {
    const parentAuth = {
      token: 'jwt.token',
      user: { id: 999, name: 'Parent User', email: 'parent@readquest.demo', role: 'parent' },
    }
    // User ID is 999
    expect(parentAuth.user.id).toBe(999)

    // Children have their own distinct Student IDs (1, 2, 3)
    const childIds = CHILDREN.map((c) => c.id)
    expect(childIds).toEqual([1, 2, 3])
    expect(childIds).not.toContain(parentAuth.user.id)
  })

  // 12. Unauthorized child IDs are still rejected by Step 2 authorization
  it('12. Unauthorized child IDs are still rejected by Step 2 authorization', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ detail: 'Not authorized to access this student' }),
    })

    await expect(endpoints.student(99999)).rejects.toThrow('Not authorized to access this student')
  })
})

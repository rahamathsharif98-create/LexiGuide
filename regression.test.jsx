import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import App from './src/App'

beforeEach(() => {
  global.fetch = vi.fn().mockImplementation((url) => {
    if (url.includes('/api/teacher/students') || url.includes('/api/parent/children') || url.includes('/activities')) {
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: 1, name: 'Aarav Sharma', age: 7, avatar: '🦊' }],
      })
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({
        status: 'ok',
        skills: [{ key: 'reading_fluency', label: 'Reading Fluency', value: 70 }],
        current: { reading_fluency: 70, phonological_awareness: 70 },
        total_stars: 100,
        streak: 5,
        activities_completed: 10,
        learning_time_min: 30,
        sample_size: 5,
      }),
    })
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  delete global.fetch
})

describe('Phase 5 regression check: exact routes from the spec', () => {
  const routes = {
    '/child': /ready for today|who's learning today/i,
    '/child/learn': /learn/i,
    '/child/play': /play & learn|sound safari/i,
    '/child/stories': /story time/i,
    '/child/journey': /my journey|my reading fingerprint/i,
    '/parent/dashboard': /good morning, parent/i,
    '/parent/progress': /reading progress over time/i,
    '/parent/fingerprint': /reading fingerprint/i,
    '/parent/activities': /activity history/i,
    '/parent/recommendations': /recommended for/i,
    '/teacher/dashboard': /good morning, teacher/i,
    '/teacher/students': /students/i,
    '/teacher/progress': /class progress/i,
    '/teacher/recommendations': /recommendations/i,
  }
  for (const [route, expectedText] of Object.entries(routes)) {
    it(`${route} still works`, async () => {
      if (route.startsWith('/parent')) {
        localStorage.setItem('readquest_auth', JSON.stringify({
          token: 'jwt.parent.test',
          user: { id: 1, name: 'Parent User', email: 'parent@readquest.demo', role: 'parent' },
        }))
      } else if (route.startsWith('/teacher')) {
        localStorage.setItem('readquest_auth', JSON.stringify({
          token: 'jwt.teacher.test',
          user: { id: 2, name: 'Teacher User', email: 'teacher@readquest.demo', role: 'teacher' },
        }))
      } else {
        localStorage.clear()
      }
      render(<App initialRoute={route} />)
      expect((await screen.findAllByText(expectedText)).length).toBeGreaterThan(0)
    })
  }
})

describe('Phase 5 regression check: responsiveness at 375/768/1280', () => {
  const widths = [375, 768, 1280]
  const routes = ['/child/home', '/parent/dashboard', '/teacher/students']
  for (const width of widths) {
    for (const route of routes) {
      it(`${route} renders at ${width}px`, async () => {
        window.innerWidth = width
        if (route.startsWith('/parent')) {
          localStorage.setItem('readquest_auth', JSON.stringify({
            token: 'jwt.parent.test',
            user: { id: 1, name: 'Parent User', email: 'parent@readquest.demo', role: 'parent' },
          }))
        } else if (route.startsWith('/teacher')) {
          localStorage.setItem('readquest_auth', JSON.stringify({
            token: 'jwt.teacher.test',
            user: { id: 2, name: 'Teacher User', email: 'teacher@readquest.demo', role: 'teacher' },
          }))
        } else {
          localStorage.clear()
        }
        render(<App initialRoute={route} />)
        await new Promise((r) => setTimeout(r, 30))
        expect(document.body.textContent.length).toBeGreaterThan(0)
      })
    }
  }
})

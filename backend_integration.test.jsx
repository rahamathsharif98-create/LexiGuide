import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, screen, waitFor } from '@testing-library/react'
import App from './src/App'

beforeEach(() => {
  localStorage.setItem('readquest_auth', JSON.stringify({
    token: 'jwt.teacher.test',
    user: { id: 2, name: 'Teacher User', email: 'teacher@readquest.demo', role: 'teacher' },
  }))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  delete global.fetch
})

describe('Phase 5: frontend API integration with mock fallback', () => {
  it('falls back to mock data cleanly when the backend is unreachable', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    render(<App initialRoute="/teacher/students" />)
    expect(await screen.findByText(/using demo data \(backend not connected\)/i)).toBeInTheDocument()
    // the page must still be fully usable on mock data
    expect(screen.getByText('Aarav')).toBeInTheDocument()
  })

  it('uses real backend data and shows the connected indicator when the API succeeds', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        { id: 1, name: 'Aarav', age: 7, avatar: '🦊', created_at: '2026-01-01T00:00:00Z' },
        { id: 2, name: 'Meera', age: 6, avatar: '🐼', created_at: '2026-01-01T00:00:00Z' },
        { id: 3, name: 'Kabir', age: 9, avatar: '🐯', created_at: '2026-01-01T00:00:00Z' },
        { id: 4, name: 'Priya', age: 8, avatar: '🐰', created_at: '2026-01-01T00:00:00Z' },
        { id: 5, name: 'Rohan', age: 6, avatar: '🐨', created_at: '2026-01-01T00:00:00Z' },
      ]),
    })
    render(<App initialRoute="/teacher/students" />)
    expect(await screen.findByText(/connected to live backend/i)).toBeInTheDocument()
    expect(screen.getByText('Aarav')).toBeInTheDocument()
  })

  it('a 500 error from the backend is treated as a failure and falls back, never crashes', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error', json: async () => ({ detail: 'Internal server error' }) })
    render(<App initialRoute="/teacher/students" />)
    expect(await screen.findByText(/using demo data/i)).toBeInTheDocument()
  })
})

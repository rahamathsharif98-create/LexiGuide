import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './src/App'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  delete global.fetch
})

describe('Phase 7 / Step 1: login pages enforce real auth and reject invalid or unreachable credentials', () => {
  it('Parent login displays error message when backend is unreachable, does not fall back to demo mode', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    render(<App initialRoute="/parent/login" />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/unable to connect to server/i)).toBeInTheDocument())
    expect(screen.queryByText(/good morning, parent/i)).not.toBeInTheDocument()
  })

  it('Parent login shows a real error on 401 from a live backend, does not fall back', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({ detail: 'Incorrect email or password' }) })
    render(<App initialRoute="/parent/login" />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument())
    expect(screen.queryByText(/good morning, parent/i)).not.toBeInTheDocument()
  })

  it('Parent login proceeds to dashboard on a real successful login', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: 'fake.jwt.token', token_type: 'bearer', role: 'parent', user_id: 1, name: 'Demo Parent' }) })
    render(<App initialRoute="/parent/login" />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/good morning, parent/i)).toBeInTheDocument(), { timeout: 4000 })
  })

  it('Teacher login displays error message when backend is unreachable, does not fall back to demo mode', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    render(<App initialRoute="/teacher/login" />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/unable to connect to server/i)).toBeInTheDocument(), { timeout: 4000 })
    expect(screen.queryByText(/good morning, teacher/i)).not.toBeInTheDocument()
  })

  it('Teacher login shows a real error on 401 from a live backend, does not fall back', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({ detail: 'Incorrect email or password' }) })
    render(<App initialRoute="/teacher/login" />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument(), { timeout: 4000 })
    expect(screen.queryByText(/good morning, teacher/i)).not.toBeInTheDocument()
  })

  it('Teacher login proceeds to dashboard on a real successful login', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: 'fake.jwt.token', token_type: 'bearer', role: 'teacher', user_id: 2, name: 'Demo Teacher' }) })
    render(<App initialRoute="/teacher/login" />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/good morning, teacher/i)).toBeInTheDocument(), { timeout: 4000 })
  })
})

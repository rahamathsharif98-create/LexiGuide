import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './src/App'
import { api, setAuthToken, clearAuthToken, onUnauthorized } from './src/services/api'
import { AUTH_STORAGE_KEY } from './src/context/AuthContext'

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

describe('Step 1: Complete Authentication Foundation & Route Protection', () => {
  it('1. Unauthenticated user accessing /parent/dashboard is redirected to /parent/login', async () => {
    render(<App initialRoute="/parent/dashboard" />)
    expect(await screen.findByText('Parent Login')).toBeInTheDocument()
    expect(screen.queryByText(/good morning, parent/i)).not.toBeInTheDocument()
  })

  it('2. Unauthenticated user accessing /teacher/dashboard is redirected to /teacher/login', async () => {
    render(<App initialRoute="/teacher/dashboard" />)
    expect(await screen.findByText('Teacher Login')).toBeInTheDocument()
    expect(screen.queryByText(/good morning, teacher/i)).not.toBeInTheDocument()
  })

  it('3. Authenticated parent can access /parent/dashboard and view overview', async () => {
    const parentAuth = {
      token: 'jwt.parent.token',
      user: { id: 1, name: 'Parent User', email: 'parent@readquest.demo', role: 'parent' },
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parentAuth))
    render(<App initialRoute="/parent/dashboard" />)
    expect(await screen.findByText(/good morning, parent/i)).toBeInTheDocument()
  })

  it('4. Authenticated teacher can access /teacher/dashboard and view overview', async () => {
    const teacherAuth = {
      token: 'jwt.teacher.token',
      user: { id: 2, name: 'Teacher User', email: 'teacher@readquest.demo', role: 'teacher' },
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(teacherAuth))
    render(<App initialRoute="/teacher/dashboard" />)
    expect(await screen.findByText(/good morning, teacher/i)).toBeInTheDocument()
  })

  it('5. Role enforcement: Parent cannot access /teacher/dashboard, gets redirected to parent portal', async () => {
    const parentAuth = {
      token: 'jwt.parent.token',
      user: { id: 1, name: 'Parent User', email: 'parent@readquest.demo', role: 'parent' },
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parentAuth))
    render(<App initialRoute="/teacher/dashboard" />)
    // Should NOT be on teacher dashboard; should redirect to parent dashboard
    expect(await screen.findByText(/good morning, parent/i)).toBeInTheDocument()
    expect(screen.queryByText(/good morning, teacher/i)).not.toBeInTheDocument()
  })

  it('6. Role enforcement: Teacher cannot access /parent/dashboard, gets redirected to teacher portal', async () => {
    const teacherAuth = {
      token: 'jwt.teacher.token',
      user: { id: 2, name: 'Teacher User', email: 'teacher@readquest.demo', role: 'teacher' },
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(teacherAuth))
    render(<App initialRoute="/parent/dashboard" />)
    // Should NOT be on parent dashboard; should redirect to teacher dashboard
    expect(await screen.findByText(/good morning, teacher/i)).toBeInTheDocument()
    expect(screen.queryByText(/good morning, parent/i)).not.toBeInTheDocument()
  })

  it('7. Parent logout clears auth state, localStorage, and navigates to login', async () => {
    const parentAuth = {
      token: 'jwt.parent.token',
      user: { id: 1, name: 'Parent User', email: 'parent@readquest.demo', role: 'parent' },
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parentAuth))
    render(<App initialRoute="/parent/dashboard" />)

    // Verify parent dashboard is loaded
    expect(await screen.findByText(/good morning, parent/i)).toBeInTheDocument()

    // Open avatar dropdown menu
    fireEvent.click(screen.getByRole('button', { name: /parent menu/i }))
    const signOutBtn = await screen.findByRole('button', { name: /sign out/i })
    expect(signOutBtn).toBeInTheDocument()

    // Click Sign Out
    fireEvent.click(signOutBtn)

    // Verify redirection to Parent Login
    await waitFor(() => expect(screen.getByText('Parent Login')).toBeInTheDocument())
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
    expect(screen.queryByText(/good morning, parent/i)).not.toBeInTheDocument()
  })

  it('8. Teacher logout clears auth state, localStorage, and navigates to login', async () => {
    const teacherAuth = {
      token: 'jwt.teacher.token',
      user: { id: 2, name: 'Teacher User', email: 'teacher@readquest.demo', role: 'teacher' },
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(teacherAuth))
    render(<App initialRoute="/teacher/dashboard" />)

    // Verify teacher dashboard is loaded
    expect(await screen.findByText(/good morning, teacher/i)).toBeInTheDocument()

    // Open avatar dropdown menu
    fireEvent.click(screen.getByRole('button', { name: /teacher menu/i }))
    const signOutBtn = await screen.findByRole('button', { name: /sign out/i })
    expect(signOutBtn).toBeInTheDocument()

    // Click Sign Out
    fireEvent.click(signOutBtn)

    // Verify redirection to Teacher Login
    await waitFor(() => expect(screen.getByText('Teacher Login')).toBeInTheDocument())
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
    expect(screen.queryByText(/good morning, teacher/i)).not.toBeInTheDocument()
  })

  it('9. api.js automatically attaches Authorization: Bearer <token> when token is present', async () => {
    setAuthToken('sample.jwt.token')
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    })

    await api.get('/api/test-protected')

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const callArgs = global.fetch.mock.calls[0]
    expect(callArgs[1].headers['Authorization']).toBe('Bearer sample.jwt.token')
  })

  it('10. api.js triggers onUnauthorized callback when 401 response is received', async () => {
    const unauthorizedSpy = vi.fn()
    onUnauthorized(unauthorizedSpy)

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ detail: 'Token has expired' }),
    })

    await expect(api.get('/api/protected-route')).rejects.toThrow('Token has expired')
    expect(unauthorizedSpy).toHaveBeenCalledTimes(1)
  })

  it('11. Child portal routes (/child/home, /select-profile, /) remain accessible without authentication', async () => {
    const { unmount } = render(<App initialRoute="/" />)
    expect(await screen.findByText(/i'm a learner/i)).toBeInTheDocument()
    unmount()

    const { unmount: unmountProfile } = render(<App initialRoute="/select-profile" />)
    expect(await screen.findByText(/who's learning today\?/i)).toBeInTheDocument()
    unmountProfile()

    render(<App initialRoute="/child/home" />)
    expect(await screen.findByText(/LexiGuide|ReadQuest/i)).toBeInTheDocument()
  })
})

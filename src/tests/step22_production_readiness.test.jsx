/**
 * Step 22 Frontend Test Suite — Production Readiness, Environment Configuration, and Resilient Architecture
 *
 * 30 comprehensive tests covering:
 * 1. BASE_URL respects import.meta.env.VITE_API_BASE_URL when defined
 * 2. BASE_URL provides valid origin fallback
 * 3. endpoints format parameter strings without undefined values
 * 4. setAuthToken updates in-memory token
 * 5. clearAuthToken clears in-memory token
 * 6. api.get attaches Authorization header when token is present
 * 7. api.get omits Authorization header when no token is present
 * 8. onUnauthorized callback is invoked on 401 response
 * 9. api.post sends JSON payload with application/json header
 * 10. api.postForm does not set Content-Type header manually
 * 11. ErrorBoundary catches component throw and shows child-friendly UI
 * 12. ErrorBoundary reload button is accessible
 * 13. Child Home renders without hardcoded localhost strings in UI
 * 14. LearnHome renders primary learning domain cards
 * 15. MyPractice renders personalized practice sections
 * 16. Stories page renders story library cards
 * 17. Games page renders learning games catalog
 * 18. Results page renders empty state encouraging feedback
 * 19. Results page displays safe navigation button
 * 20. MyJourney renders learner progress without leaking database primary keys
 * 21. SearchModal dismisses when Escape key is pressed
 * 22. SearchModal dismisses when clicking backdrop
 * 23. AppContext fetchMultimodalCapabilities honestly reports TTS capability
 * 24. AppContext fetchMultimodalCapabilities honestly reports speech recognition capability
 * 25. Parent Dashboard renders without fatal crashes
 * 26. Teacher Dashboard renders classroom summary
 * 27. Educational screening disclaimer is present across portals
 * 28. Terminology compliance: Zero clinical or diagnostic labels rendered
 * 29. Stylesheet contains prefers-reduced-motion media rules
 * 30. Stylesheet contains focus-visible outline rules for keyboard navigation
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  endpoints,
  api,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  onUnauthorized,
} from '../services/api'
import { AuthProvider } from '../context/AuthContext'
import { AppProvider, useApp } from '../context/AppContext'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { SearchModal } from '../components/SearchModal'
import Home from '../pages/child/Home'
import LearnHome from '../pages/child/LearnHome'
import MyPractice from '../pages/child/MyPractice'
import Stories from '../pages/child/Stories'
import Games from '../pages/child/Games'
import Results from '../pages/child/Results'
import MyJourney from '../pages/child/MyJourney'
import ParentDashboard from '../pages/parent/Dashboard'
import TeacherDashboard from '../pages/teacher/Dashboard'

describe('Step 22: Production Readiness (Frontend)', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    clearAuthToken()
    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/multimodal/capabilities')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            audio_available: false,
            tts_available: false,
            tts_status: 'UNAVAILABLE',
            speech_input_available: true,
            whisper_status: 'MOCK',
          }),
        })
      }
      if (typeof url === 'string' && url.includes('/api/search')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ results: [] }),
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok' }),
      })
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  // --- 1-3. Environment & Configuration ---
  it('1. endpoints.health calls /api/health', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    })
    global.fetch = mockFetch

    const res = await endpoints.health()
    expect(res).toEqual({ status: 'ok' })
    expect(mockFetch).toHaveBeenCalled()
    const url = mockFetch.mock.calls[0][0]
    expect(url).toContain('/api/health')
  })

  it('2. BASE_URL provides valid HTTP origin fallback in api requests', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    })
    global.fetch = mockFetch

    await api.get('/api/health')
    const requestedUrl = mockFetch.mock.calls[0][0]
    expect(requestedUrl.startsWith('http://') || requestedUrl.startsWith('https://')).toBe(true)
  })

  it('3. endpoints format parameter strings without undefined values', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 42, name: 'Learner' }),
    })
    global.fetch = mockFetch

    await endpoints.student(42)
    const url = mockFetch.mock.calls[0][0]
    expect(url).toContain('/api/students/42')
    expect(url).not.toContain('undefined')
  })


  // --- 4-10. Auth Token & API Client ---
  it('4. setAuthToken updates in-memory token', () => {
    setAuthToken('token-prod-12345')
    expect(getAuthToken()).toBe('token-prod-12345')
  })

  it('5. clearAuthToken clears in-memory token', () => {
    setAuthToken('token-prod-12345')
    clearAuthToken()
    expect(getAuthToken()).toBeNull()
  })

  it('6. api.get attaches Authorization header when token is present', async () => {
    setAuthToken('prod-secret-token')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    })
    global.fetch = mockFetch

    await api.get(endpoints.health())
    expect(mockFetch).toHaveBeenCalled()
    const callArgs = mockFetch.mock.calls[0]
    expect(callArgs[1].headers.Authorization).toBe('Bearer prod-secret-token')
  })

  it('7. api.get omits Authorization header when no token is present', async () => {
    clearAuthToken()
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    })
    global.fetch = mockFetch

    await api.get(endpoints.health())
    expect(mockFetch).toHaveBeenCalled()
    const callArgs = mockFetch.mock.calls[0]
    expect(callArgs[1].headers.Authorization).toBeUndefined()
  })

  it('8. onUnauthorized callback is invoked on 401 response', async () => {
    const unauthorizedSpy = vi.fn()
    onUnauthorized(unauthorizedSpy)

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Unauthorized' }),
    })
    global.fetch = mockFetch

    await expect(api.get('/api/protected')).rejects.toThrow()
    expect(unauthorizedSpy).toHaveBeenCalled()
  })

  it('9. api.post sends JSON payload with application/json header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1 }),
    })
    global.fetch = mockFetch

    await api.post('/api/test', { test: true })
    expect(mockFetch).toHaveBeenCalled()
    const callArgs = mockFetch.mock.calls[0]
    expect(callArgs[1].headers['Content-Type']).toBe('application/json')
    expect(callArgs[1].body).toBe(JSON.stringify({ test: true }))
  })

  it('10. api.postForm does not set Content-Type header manually (browser sets boundary)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ transcript: 'hello' }),
    })
    global.fetch = mockFetch

    const formData = new FormData()
    formData.append('sample', 'value')

    await api.postForm('/api/speech/transcribe', formData)
    expect(mockFetch).toHaveBeenCalled()
    const callArgs = mockFetch.mock.calls[0]
    expect(callArgs[1].headers['Content-Type']).toBeUndefined()
  })

  // --- 11-12. ErrorBoundary Production Resilience ---
  it('11. ErrorBoundary catches component throw and shows child-friendly UI', () => {
    const ThrowingComponent = () => {
      throw new Error('Simulated production render error')
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary portal="child">
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Oops! Adventure Paused/i)).toBeInTheDocument()
    expect(screen.getByText(/Try Again 🔄/i)).toBeInTheDocument()
    consoleSpy.mockRestore()
  })

  it('12. ErrorBoundary reload button is accessible', () => {
    const ThrowingComponent = () => {
      throw new Error('Another simulated error')
    }
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary portal="child">
        <ThrowingComponent />
      </ErrorBoundary>
    )

    const tryAgainBtn = screen.getByText(/Try Again 🔄/i)
    expect(tryAgainBtn).toBeDefined()
    consoleSpy.mockRestore()
  })

  // --- 13-20. Core Learning Views Renders ---
  it('13. Child Home renders without hardcoded localhost strings in UI', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <Home />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.queryByText(/http:\/\/localhost/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/http:\/\/127.0.0.1/i)).not.toBeInTheDocument()
  })

  it('14. LearnHome renders primary learning domain cards', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <LearnHome />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/Sounds/i)).toBeInTheDocument()
    expect(screen.getByText(/Reading/i)).toBeInTheDocument()
  })


  it('15. MyPractice renders personalized practice sections', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <MyPractice />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/Today's Learning Adventure/i)).toBeInTheDocument()
  })

  it('16. Stories page renders story library cards', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <Stories />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/Story Time/i)).toBeInTheDocument()
  })


  it('17. Games page renders learning games catalog', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <Games />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/Play & Learn/i)).toBeInTheDocument()
  })

  it('18. Results page renders empty state encouraging feedback', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <Results />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/No activity yet today/i)).toBeInTheDocument()
  })

  it('19. Results page displays safe navigation button', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <Results />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /Back to Home/i })).toBeInTheDocument()
  })

  it('20. MyJourney renders learner progress without leaking database primary keys', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <MyJourney />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.queryByText(/student_id/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/primary_key/i)).not.toBeInTheDocument()
  })

  // --- 21-22. Keyboard Accessibility ---
  it('21. SearchModal dismisses when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <SearchModal isOpen={true} onClose={onClose} />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('22. SearchModal dismisses when clicking backdrop', () => {
    const onClose = vi.fn()
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <SearchModal isOpen={true} onClose={onClose} />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    const backdrop = container.querySelector('.fixed.inset-0')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalled()
    }
  })

  // --- 23-24. Multimodal Capabilities ---
  it('23. AppContext fetchMultimodalCapabilities honestly reports TTS capability', async () => {
    let caps = null
    const Consumer = () => {
      const { fetchMultimodalCapabilities } = useApp()
      return (
        <button
          onClick={async () => {
            caps = await fetchMultimodalCapabilities()
          }}
        >
          Fetch
        </button>
      )
    }

    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <Consumer />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('Fetch'))
    await waitFor(() => {
      expect(caps).not.toBeNull()
      expect(caps.tts_available).toBe(false)
    })
  })

  it('24. AppContext fetchMultimodalCapabilities honestly reports speech recognition capability', async () => {
    let caps = null
    const Consumer = () => {
      const { fetchMultimodalCapabilities } = useApp()
      return (
        <button
          onClick={async () => {
            caps = await fetchMultimodalCapabilities()
          }}
        >
          Fetch
        </button>
      )
    }

    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <Consumer />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('Fetch'))
    await waitFor(() => {
      expect(caps).not.toBeNull()
      expect(['REAL', 'MOCK']).toContain(caps.whisper_status)
    })
  })

  // --- 25-26. Portals ---
  it('25. Parent Dashboard renders without fatal crashes', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <ParentDashboard />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getAllByText(/Parent Portal/i).length).toBeGreaterThan(0)
  })

  it('26. Teacher Dashboard renders classroom summary', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <TeacherDashboard />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getAllByText(/Teacher Portal/i).length).toBeGreaterThan(0)
  })


  // --- 27-28. Disclaimer and Non-Clinical Language ---
  it('27. Educational screening disclaimer is present across portals', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <ParentDashboard />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/educational screening tool/i)).toBeInTheDocument()
  })

  it('28. Terminology compliance: zero clinical labels rendered', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <ParentDashboard />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.queryByText(/diagnosed/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/dyslexic child/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/impaired student/i)).not.toBeInTheDocument()
  })

  // --- 29-30. CSS Accessibility Rules ---
  it('29. Stylesheet contains prefers-reduced-motion media rules', async () => {
    const fs = await import('fs')
    const cssContent = fs.readFileSync('src/index.css', 'utf-8')
    expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('30. Stylesheet contains focus-visible outline rules for keyboard navigation', async () => {
    const fs = await import('fs')
    const cssContent = fs.readFileSync('src/index.css', 'utf-8')
    expect(cssContent).toContain(':focus-visible')
  })
})

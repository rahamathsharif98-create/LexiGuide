import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider, useApp } from './src/context/AppContext'
import { AuthProvider } from './src/context/AuthContext'
import { endpoints } from './src/services/api'
import ParentProgress from './src/pages/parent/Progress'
import TeacherStudentProfile from './src/pages/teacher/StudentProfile'

const mockIntelligence = {
  student_id: 1,
  disclaimer: 'This is an educational screening tool. It provides learning observations and practice suggestions — it does not provide a clinical diagnosis.',
  data_sufficiency: 'sufficient',
  total_reading_sessions: 4,
  error_distribution: {
    omissions: 2,
    substitutions: 3,
    repetitions: 1,
    insertions: 0,
    hesitations: 1,
    total_errors: 7,
    omission_pct: 28.6,
    substitution_pct: 42.9,
    repetition_pct: 14.3,
    primary_error_type: 'substitution',
  },
  fluency: {
    average_wcpm: 52.5,
    highest_wcpm: 60.0,
    reading_pace: 'Steady Pace',
    fluency_stability: 'Consistent',
    sessions_analyzed: 4,
    timeline: [],
  },
  top_confusions: [
    {
      expected: 'cat',
      recognized: 'bat',
      count: 2,
      focus_pattern: 'Initial sound contrast (c vs b)',
      pedagogical_note: "Practice isolating initial sounds when reading 'cat'.",
    },
  ],
  guidance: {
    summary: 'Observed reading profile shows steady pace with 7 recorded error patterns.',
    observed_strengths: ['Strong reading pace maintaining an average of 52.5 words per minute.'],
    recommended_focus_areas: ['Sound-symbol matching: child substitutes visually or phonetically similar words.'],
    educator_tips: ['Use multi-sensory letter-sound contrast cards for frequent substitutions.'],
  },
}

function TestConsumer() {
  const { intelligenceData, intelligenceLoading, refreshIntelligence } = useApp()
  return (
    <div>
      <div data-testid="intel-loading">{String(intelligenceLoading)}</div>
      <div data-testid="intel-wcpm">{intelligenceData?.fluency?.average_wcpm || 0}</div>
      <button onClick={() => refreshIntelligence()}>Refresh</button>
    </div>
  )
}

describe('Step 12: AI Learning Intelligence Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('1. AppContext exposes intelligence state and fetch integration', async () => {
    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.mock.token',
      user: { id: 1, email: 'parent@readquest.demo', role: 'parent' },
    }))

    vi.spyOn(endpoints, 'intelligence').mockResolvedValue(mockIntelligence)
    vi.spyOn(endpoints, 'nextActivity').mockResolvedValue({ title: 'Test Activity' })
    vi.spyOn(endpoints, 'learningPath').mockResolvedValue([])
    vi.spyOn(endpoints, 'learningHistory').mockResolvedValue([])
    vi.spyOn(endpoints, 'progress').mockResolvedValue({ skills: [] })
    vi.spyOn(endpoints, 'learningProfile').mockResolvedValue({ skills: [] })
    vi.spyOn(endpoints, 'achievements').mockResolvedValue([])

    render(
      <AuthProvider>
        <AppProvider>
          <TestConsumer />
        </AppProvider>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('intel-wcpm').textContent).toBe('52.5')
    })
  })

  it('2. Parent Progress renders AI Learning Intelligence card with WCPM and error pattern', async () => {
    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.mock.token',
      user: { id: 1, email: 'parent@readquest.demo', role: 'parent' },
    }))

    vi.spyOn(endpoints, 'parentChildProgress').mockResolvedValue({
      sample_size: 4,
      skills: [{ key: 'readingFluency', label: 'Reading Fluency', value: 75, trend: 'improving' }],
    })
    vi.spyOn(endpoints, 'intelligence').mockResolvedValue(mockIntelligence)

    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <ParentProgress />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    expect(await screen.findByText(/AI Learning Intelligence/i)).toBeInTheDocument()
    expect(screen.getByText('52.5')).toBeInTheDocument()
    expect(screen.getAllByText(/Steady Pace/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('substitution')).toBeInTheDocument()
    expect(screen.getByText(/Pedagogical Summary/i)).toBeInTheDocument()
    expect(screen.getByText(/educational screening tool/i)).toBeInTheDocument()
  })

  it('3. Zero clinical diagnosis language rendered anywhere in the DOM', async () => {
    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.mock.token',
      user: { id: 1, email: 'parent@readquest.demo', role: 'parent' },
    }))

    vi.spyOn(endpoints, 'parentChildProgress').mockResolvedValue({ sample_size: 4, skills: [] })
    vi.spyOn(endpoints, 'intelligence').mockResolvedValue(mockIntelligence)

    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <ParentProgress />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    await screen.findByText(/AI Learning Intelligence/i)
    const text = document.body.textContent.toLowerCase()
    expect(text).not.toContain('dyslexia confirmed')
    expect(text).not.toContain('has dyslexia')
    expect(text).not.toContain('medical diagnosis')
    expect(text).not.toContain('learning disability confirmed')
  })
})

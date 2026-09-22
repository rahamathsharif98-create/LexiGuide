import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom'
import { DayByDayTimeline } from '../components/DayByDayTimeline'
import ParentProgress from '../pages/parent/Progress'
import TeacherStudentProfile from '../pages/teacher/StudentProfile'
import MyJourney from '../pages/child/MyJourney'
import { AppProvider } from '../context/AppContext'
import { AuthProvider } from '../context/AuthContext'
import { endpoints } from '../services/api'

// Mock endpoints
vi.mock('../services/api', () => ({
  setAuthToken: vi.fn(),
  getAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
  onUnauthorized: vi.fn(),
  endpoints: {
    dayByDayAnalysis: vi.fn(),
    parentChildren: vi.fn().mockResolvedValue([{ id: 1, name: 'Aarav', age: 7 }]),
    classes: vi.fn().mockResolvedValue([{ id: 1, name: 'Grade 2A' }]),
    parentChildProgress: vi.fn(),
    parentChildFingerprint: vi.fn(),
    parentChildSummary: vi.fn(),
    parentChildActivities: vi.fn(),
    parentChildRecommendations: vi.fn(),
    teacherStudents: vi.fn(),
    studentProgress: vi.fn(),
    student: vi.fn(),
    studentFingerprint: vi.fn(),
    studentSessions: vi.fn(),
    studentRecommendations: vi.fn().mockResolvedValue([]),
    intelligence: vi.fn().mockResolvedValue(null),
    fingerprint: vi.fn(),
    nextActivity: vi.fn(),
    learningPath: vi.fn(),
    learningHistory: vi.fn(),
    progress: vi.fn(),
    learningProfile: vi.fn(),
    achievements: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}))

const mockDailyData7d = {
  child_id: 1,
  period: 7,
  start_date: '2026-10-08',
  end_date: '2026-10-14',
  days: [
    {
      date: '2026-10-14',
      activity_count: 2,
      completed_count: 2,
      learning_minutes: 12,
      skills: ['reading_fluency', 'comprehension'],
      daily_performance: { reading_fluency: 85.0, comprehension: 90.0 },
      reading_performance: 85.0,
      comprehension_performance: 90.0,
      word_recognition: null,
      phonological_awareness: null,
      pronunciation: null,
      target_skill: 'reading_fluency',
      changes: [
        {
          skill: 'reading_fluency',
          label: 'Reading Fluency',
          accuracy: 85.0,
          previous_accuracy: 75.0,
          change: 10.0,
          trend: 'improving',
        },
        {
          skill: 'comprehension',
          label: 'Comprehension',
          accuracy: 90.0,
          previous_accuracy: null,
          change: null,
          trend: 'first_session',
        },
      ],
      patterns: [
        'Reading Fluency improved compared with the previous session.',
        'High learning engagement today.',
      ],
    },
    {
      date: '2026-10-13',
      activity_count: 1,
      completed_count: 1,
      learning_minutes: 6,
      skills: ['reading_fluency'],
      daily_performance: { reading_fluency: 75.0 },
      reading_performance: 75.0,
      comprehension_performance: null,
      word_recognition: null,
      phonological_awareness: null,
      pronunciation: null,
      target_skill: 'reading_fluency',
      changes: [
        {
          skill: 'reading_fluency',
          label: 'Reading Fluency',
          accuracy: 75.0,
          previous_accuracy: null,
          change: null,
          trend: 'first_session',
        },
      ],
      patterns: ['First recorded practice in Reading Fluency.'],
    },
  ],
  summary: {
    total_activities: 3,
    active_days: 2,
    current_streak: 2,
    longest_streak: 4,
    weekly_consistency: 28.6,
    average_activities_per_active_day: 1.5,
    strongest_skill: 'comprehension',
    focus_skill: 'reading_fluency',
    overall_change: 10.0,
    data_sufficiency: 'sufficient',
    note: null,
  },
  disclaimer: 'Educational day-by-day learning analysis provided for skill tracking and practice guidance. Not a clinical or medical diagnosis.',
}

const mockDailyEmpty = {
  child_id: 1,
  period: 7,
  start_date: '2026-10-08',
  end_date: '2026-10-14',
  days: [],
  summary: {
    total_activities: 0,
    active_days: 0,
    current_streak: 0,
    longest_streak: 0,
    weekly_consistency: 0.0,
    average_activities_per_active_day: 0.0,
    strongest_skill: null,
    focus_skill: null,
    overall_change: null,
    data_sufficiency: 'insufficient',
    note: 'No learning activity recorded during this period.',
  },
  disclaimer: 'Educational day-by-day learning analysis provided for skill tracking and practice guidance. Not a clinical or medical diagnosis.',
}

describe('Step 14: Day-by-Day Learning Analysis Frontend Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. API Call with childId and default 7 days
  it('01: calls endpoints.dayByDayAnalysis with childId and default period 7', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    await waitFor(() => {
      expect(endpoints.dayByDayAnalysis).toHaveBeenCalledWith(1, { period: 7 })
    })
  })

  // 2. 7-Day filter selection button exists and is active by default
  it('02: renders 7 Days button as active by default', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    const btn = await screen.findByRole('button', { name: /7d/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  // 3. Switching to 30-day selection calls API with period 30
  it('03: calls API with period 30 when 30 Days button is clicked', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    endpoints.dayByDayAnalysis.mockResolvedValueOnce({ ...mockDailyData7d, period: 30 })
    render(<DayByDayTimeline childId={1} isReal={true} />)
    await screen.findByText(/Day-by-Day Learning Analysis/i)
    const btn30 = screen.getByRole('button', { name: /30d/i })
    fireEvent.click(btn30)
    await waitFor(() => {
      expect(endpoints.dayByDayAnalysis).toHaveBeenCalledWith(1, { period: 30 })
    })
  })

  // 4. Switching to 90-day selection calls API with period 90
  it('04: calls API with period 90 when 90 Days button is clicked', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    endpoints.dayByDayAnalysis.mockResolvedValueOnce({ ...mockDailyData7d, period: 90 })
    render(<DayByDayTimeline childId={1} isReal={true} />)
    await screen.findByText(/Day-by-Day Learning Analysis/i)
    const btn90 = screen.getByRole('button', { name: /90d/i })
    fireEvent.click(btn90)
    await waitFor(() => {
      expect(endpoints.dayByDayAnalysis).toHaveBeenCalledWith(1, { period: 90 })
    })
  })

  // 5. Date timeline rendering
  it('05: renders daily items in timeline', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByTestId('day-by-day-list')).toBeInTheDocument()
    expect(screen.getByTestId('day-item-2026-10-14')).toBeInTheDocument()
    expect(screen.getByTestId('day-item-2026-10-13')).toBeInTheDocument()
  })

  // 6. Daily activity count display
  it('06: displays accurate daily activity count', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByText(/2 activities/i)).toBeInTheDocument()
    expect(screen.getByText(/1 activity/i)).toBeInTheDocument()
  })

  // 7. Learning time formatting
  it('07: displays learning minutes for each day', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByText(/12 min/i)).toBeInTheDocument()
    expect(screen.getByText(/6 min/i)).toBeInTheDocument()
  })

  // 8. Skill display pills
  it('08: displays practiced skills with their scores', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    const fluencyPills = await screen.findAllByText(/Reading Fluency:/i)
    expect(fluencyPills.length).toBeGreaterThan(0)
    expect(screen.getByText(/85%/i)).toBeInTheDocument()
  })

  // 9. Skill delta / improvement badge
  it('09: shows positive change delta badge for improving skill', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByText(/\(\+10%\)/i)).toBeInTheDocument()
  })

  // 10. Focus skill display in summary
  it('10: renders target focus skill in summary header', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByText(/Focus Skill/i)).toBeInTheDocument()
    expect(screen.getByText(/🎯 reading fluency/i)).toBeInTheDocument()
  })

  // 11. Current streak rendering
  it('11: renders current streak count with fire icon', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByText(/🔥 2/i)).toBeInTheDocument()
  })

  // 12. Longest streak rendering
  it('12: renders best / longest streak count', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByText(/Best: 4 days/i)).toBeInTheDocument()
  })

  // 13. Active days count in summary
  it('13: renders active days count in summary', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByText(/Active Days/i)).toBeInTheDocument()
    expect(screen.getByText(/\/ 7d/i)).toBeInTheDocument()
  })

  // 14. Total activities in summary
  it('14: renders total activities in summary', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByText(/📚 3/i)).toBeInTheDocument()
  })

  // 15. Empty state rendering
  it('15: renders friendly empty state when no learning recorded', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyEmpty)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByTestId('day-by-day-empty')).toBeInTheDocument()
    expect(screen.getByText(/No learning activity recorded yet/i)).toBeInTheDocument()
  })

  // 16. Educational note rendering
  it('16: displays educational note when provided by summary', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce({
      ...mockDailyData7d,
      summary: {
        ...mockDailyData7d.summary,
        note: 'Keep practicing to build a comprehensive progress trend.',
      },
    })
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByText(/Keep practicing to build a comprehensive progress trend/i)).toBeInTheDocument()
  })

  // 17. Loading state rendering
  it('17: renders skeleton loader when loading', () => {
    endpoints.dayByDayAnalysis.mockReturnValue(new Promise(() => {}))
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(screen.getByTestId('day-by-day-loading')).toBeInTheDocument()
  })

  // 18. Error state rendering
  it('18: renders error alert when API call rejects', async () => {
    endpoints.dayByDayAnalysis.mockRejectedValueOnce(new Error('Network failure'))
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByTestId('day-by-day-error')).toBeInTheDocument()
    expect(screen.getByText(/Network failure/i)).toBeInTheDocument()
  })

  // 19. Retry button on error triggers refetch
  it('19: clicking retry button triggers API call again', async () => {
    endpoints.dayByDayAnalysis.mockRejectedValueOnce(new Error('Network failure'))
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    const retryBtn = await screen.findByRole('button', { name: /Retry/i })
    fireEvent.click(retryBtn)
    await waitFor(() => {
      expect(endpoints.dayByDayAnalysis).toHaveBeenCalledTimes(2)
    })
  })

  // 20. Pattern notes displayed for day
  it('20: displays deterministic pattern observations on day card', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByText(/Reading Fluency improved compared with the previous session/i)).toBeInTheDocument()
    expect(screen.getByText(/High learning engagement today/i)).toBeInTheDocument()
  })

  // 21. Non-clinical disclaimer present
  it('21: renders non-clinical educational disclaimer', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByText(/Not a clinical or medical diagnosis/i)).toBeInTheDocument()
  })

  // 22. Zero fabricated metrics: null skills not rendered as fake pills
  it('22: does not render unpracticed skills on day card', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    await screen.findByTestId('day-by-day-list')
    expect(screen.queryByText(/Word Recognition:/i)).not.toBeInTheDocument()
  })

  // 23. Custom title and subtitle support
  it('23: supports custom title and subtitle props', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(
      <DayByDayTimeline
        childId={1}
        title="Custom Learning Title"
        subtitle="Custom Subtitle Message"
      />
    )
    expect(await screen.findByText(/Custom Learning Title/i)).toBeInTheDocument()
    expect(screen.getByText(/Custom Subtitle Message/i)).toBeInTheDocument()
  })

  // 24. No API call if unauthenticated and no childId
  it('24: does not call API when childId is null', () => {
    render(<DayByDayTimeline childId={null} isReal={false} />)
    expect(endpoints.dayByDayAnalysis).not.toHaveBeenCalled()
  })

  // 25. Accessibility: has accessible group label for period switcher
  it('25: has role="group" and aria-label on period filter', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByRole('group', { name: /Select date period/i })).toBeInTheDocument()
  })

  // 26. Parent Progress page integrates DayByDayTimeline
  it('26: renders DayByDayTimeline inside Parent Progress page', async () => {
    endpoints.parentChildren.mockResolvedValue([{ id: 1, name: 'Aarav', age: 7 }])
    endpoints.parentChildProgress.mockResolvedValue({ skills: [{ key: 'reading_fluency', label: 'Reading', value: 80, trend: 'steady' }], sample_size: 1 })
    endpoints.dayByDayAnalysis.mockResolvedValue(mockDailyData7d)
    render(
      <BrowserRouter>
        <AuthProvider initialAuth={{ token: 'mock-token', user: { role: 'parent', name: 'Parent' }, isAuthenticated: true }}>
          <AppProvider>
            <ParentProgress />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    )
    expect(await screen.findByText(/Day-by-Day Learning Timeline/i)).toBeInTheDocument()
  })

  // 27. Teacher StudentProfile page integrates DayByDayTimeline
  it('27: renders DayByDayTimeline inside Teacher StudentProfile page', async () => {
    endpoints.classes.mockResolvedValue([{ id: 1, name: 'Grade 2A' }])
    endpoints.student.mockResolvedValue({ id: 1, name: 'Alice', age: 7 })
    endpoints.studentFingerprint.mockResolvedValue({ current: { reading_fluency: 75 }, history: [] })
    endpoints.studentProgress.mockResolvedValue({ skills: [{ key: 'reading_fluency', label: 'Reading', value: 75, trend: 'steady' }], sample_size: 1 })
    endpoints.studentSessions.mockResolvedValue([])
    endpoints.studentRecommendations.mockResolvedValue([])
    endpoints.dayByDayAnalysis.mockResolvedValue(mockDailyData7d)
    render(
      <MemoryRouter initialEntries={['/teacher/students/1']}>
        <AuthProvider initialAuth={{ token: 'mock-token', user: { role: 'teacher', name: 'Teacher' }, isAuthenticated: true }}>
          <AppProvider>
            <Routes>
              <Route path="/teacher/students/:studentId" element={<TeacherStudentProfile />} />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(await screen.findByText(/Day-by-Day Student Learning Analysis/i)).toBeInTheDocument()
  })

  // 28. Child My Journey page renders learning days summary
  it('28: renders Recent Learning Days card in Child My Journey', async () => {
    endpoints.fingerprint.mockResolvedValue({ current: { reading_fluency: 80 }, history: [{ recorded_at: '2026-10-14', reading_fluency: 80 }] })
    endpoints.dayByDayAnalysis.mockResolvedValue(mockDailyData7d)
    render(
      <BrowserRouter>
        <AuthProvider initialAuth={{ token: 'mock-token', user: { role: 'child', name: 'Child' }, isAuthenticated: true }}>
          <AppProvider>
            <MyJourney />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    )
    expect(await screen.findByText(/Recent Learning Days/i)).toBeInTheDocument()
    expect(screen.getByText(/2 Days Active 🌱/i)).toBeInTheDocument()
  })

  // 29. Consistency percentage calculation display
  it('29: renders consistency percentage accurately', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByText(/28.6% consistency/i)).toBeInTheDocument()
  })

  // 30. Weekly consistency and average activities calculation
  it('30: renders average activities per active day in summary', async () => {
    endpoints.dayByDayAnalysis.mockResolvedValueOnce(mockDailyData7d)
    render(<DayByDayTimeline childId={1} isReal={true} />)
    expect(await screen.findByText(/~1.5\/active day/i)).toBeInTheDocument()
  })
})

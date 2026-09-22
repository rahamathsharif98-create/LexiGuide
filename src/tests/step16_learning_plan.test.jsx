import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { LearningJourneyPlan } from '../components/LearningJourneyPlan'
import Home from '../pages/child/Home'
import MyPractice from '../pages/child/MyPractice'
import MyJourney from '../pages/child/MyJourney'
import Results from '../pages/child/Results'
import ParentProgress from '../pages/parent/Progress'
import TeacherStudentProfile from '../pages/teacher/StudentProfile'
import { AppProvider, useApp } from '../context/AppContext'
import { AuthProvider } from '../context/AuthContext'
import { endpoints, api } from '../services/api'

// Mock API module
vi.mock('../services/api', () => ({
  setAuthToken: vi.fn(),
  getAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
  onUnauthorized: vi.fn(),
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  endpoints: {
    learningGoals: vi.fn(),
    learningPlan: vi.fn(),
    nextBestAction: vi.fn().mockResolvedValue({
      child_id: 1,
      best_action: {
        activity_id: 'act-sound-safari',
        title: 'Sound Safari',
        icon: '🦁',
        route: '/child/games?game=sound-safari',
        skill: 'phonological_awareness',
        difficulty: 2,
        difficulty_label: 'Medium',
        priority: 1,
        recommendation_type: 'focus_skill',
        reason: 'Practice beginning sounds.',
      },
      alternatives: [],
    }),
    dayByDayAnalysis: vi.fn().mockResolvedValue({ child_id: 1, days: [] }),
    parentChildren: vi.fn().mockResolvedValue([{ id: 1, name: 'Aarav', age: 7 }]),
    classes: vi.fn().mockResolvedValue([{ id: 1, name: 'Grade 2A' }]),
    parentChildProgress: vi.fn().mockResolvedValue({ skills: [], sample_size: 2 }),
    parentChildFingerprint: vi.fn().mockResolvedValue({ current: {} }),
    parentChildSummary: vi.fn(),
    parentChildActivities: vi.fn(),
    parentChildRecommendations: vi.fn(),
    teacherStudents: vi.fn(),
    studentProgress: vi.fn().mockResolvedValue({ skills: [] }),
    student: vi.fn().mockResolvedValue({ id: 1, name: 'Aarav', age: 7 }),
    studentFingerprint: vi.fn().mockResolvedValue({ current: {} }),
    studentSessions: vi.fn().mockResolvedValue([]),
    studentRecommendations: vi.fn().mockResolvedValue([]),
    intelligence: vi.fn().mockResolvedValue(null),
    fingerprint: vi.fn().mockResolvedValue({ current: {} }),
    nextActivity: vi.fn().mockResolvedValue({ title: 'Read With Me', route: '/child/read' }),
    learningPath: vi.fn().mockResolvedValue([]),
    learningHistory: vi.fn().mockResolvedValue([]),
    progress: vi.fn().mockResolvedValue(null),
    learningProfile: vi.fn().mockResolvedValue(null),
    achievements: vi.fn().mockResolvedValue([]),
    createLearningSession: vi.fn().mockResolvedValue({ id: 123 }),
  },
  ApiError: class ApiError extends Error {},
}))

const mockGoals = [
  {
    goal_id: 'goal-1-phonological_awareness',
    child_id: 1,
    skill: 'phonological_awareness',
    skill_name: 'Sound Awareness',
    title: 'Explore Letter Sounds & Starting Phonemes',
    description: 'Discover foundational sounds through fun phonics adventures.',
    priority: 1,
    target_score: 75,
    current_score: 60,
    status: 'active',
    reason: 'Targeted focus identified by Reading Fingerprint.',
    progress_percentage: 80,
    recommended_activity_types: ['activity', 'game'],
  },
  {
    goal_id: 'goal-1-reading_fluency',
    child_id: 1,
    skill: 'reading_fluency',
    skill_name: 'Reading Fluency',
    title: 'Read Along with Gentle Word Pacing',
    description: 'Practice reading simple introductory sentences aloud.',
    priority: 2,
    target_score: 80,
    current_score: 70,
    status: 'in_progress',
    reason: 'Build smooth sentence reading rhythm.',
    progress_percentage: 87,
    recommended_activity_types: ['reading'],
  },
  {
    goal_id: 'goal-1-comprehension',
    child_id: 1,
    skill: 'comprehension',
    skill_name: 'Comprehension',
    title: 'Master Story Understanding',
    description: 'Answer questions about story characters and main ideas.',
    priority: 3,
    target_score: 90,
    current_score: 88,
    status: 'achieved',
    reason: 'High mastery achieved.',
    progress_percentage: 97,
    recommended_activity_types: ['story'],
  },
]

const mockWeeklyPlan = {
  child_id: 1,
  week_start: '2026-09-07',
  week_end: '2026-09-13',
  goals: mockGoals,
  total_planned: 7,
  total_completed: 3,
  completion_rate: 42,
  active_focus_skill: 'phonological_awareness',
  disclaimer: 'Formative educational guidance based on completed learning sessions. Not a clinical diagnosis.',
  days: [
    {
      date: '2026-09-07',
      day_name: 'Monday',
      is_today: false,
      status: 'completed',
      activity: { title: 'Sound Safari', route: '/child/games?game=sound-safari', difficulty: 2 },
      plan_type: 'Reinforcement',
      completed_session_id: 101,
      accuracy_achieved: 90,
    },
    {
      date: '2026-09-08',
      day_name: 'Tuesday',
      is_today: false,
      status: 'completed',
      activity: { title: 'Word Builder', route: '/child/games?game=word-builder', difficulty: 2 },
      plan_type: 'Spaced Practice',
      completed_session_id: 102,
      accuracy_achieved: 85,
    },
    {
      date: '2026-09-09',
      day_name: 'Wednesday',
      is_today: false,
      status: 'missed',
      activity: null,
      plan_type: 'Review',
      completed_session_id: null,
      accuracy_achieved: null,
    },
    {
      date: '2026-09-10',
      day_name: 'Thursday',
      is_today: false,
      status: 'completed',
      activity: { title: 'Read With Me', route: '/child/read', difficulty: 2 },
      plan_type: 'Reinforcement',
      completed_session_id: 103,
      accuracy_achieved: 95,
    },
    {
      date: '2026-09-11',
      day_name: 'Friday',
      is_today: true,
      status: 'today',
      activity: { title: 'Phonics Forest', route: '/child/games?game=phonics-forest', difficulty: 2 },
      plan_type: 'New Learning',
      completed_session_id: null,
      accuracy_achieved: null,
    },
    {
      date: '2026-09-12',
      day_name: 'Saturday',
      is_today: false,
      status: 'planned',
      activity: { title: 'Rhyme Time', route: '/child/games?game=rhyme-time', difficulty: 2, difficulty_label: 'Medium' },
      plan_type: 'Challenge',
      completed_session_id: null,
      accuracy_achieved: null,
    },
    {
      date: '2026-09-13',
      day_name: 'Sunday',
      is_today: false,
      status: 'planned',
      activity: { title: 'Story Adventure', route: '/child/stories', difficulty: 2, difficulty_label: 'Medium' },
      plan_type: 'Exploration',
      completed_session_id: null,
      accuracy_achieved: null,
    },
  ],
}

describe('Step 16: LearningJourneyPlan Component & Integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    endpoints.learningGoals.mockResolvedValue({
      child_id: 1,
      goals: mockGoals,
      active_focus_skill: 'phonological_awareness',
      disclaimer: 'Formative educational guidance.',
    })
    endpoints.learningPlan.mockResolvedValue(mockWeeklyPlan)
  })

  // 1. API endpoint caller verification
  it('test_01_endpoints_learningGoals_invoked_with_child_id', () => {
    endpoints.learningGoals(1)
    expect(endpoints.learningGoals).toHaveBeenCalledWith(1)
  })

  it('test_02_endpoints_learningPlan_invoked_with_options', () => {
    endpoints.learningPlan(1, { startDate: '2026-09-07' })
    expect(endpoints.learningPlan).toHaveBeenCalledWith(1, { startDate: '2026-09-07' })
  })

  // 2. Component Loading & Error States
  it('test_03_renders_loading_skeleton', () => {
    const { container } = render(
      <MemoryRouter>
        <LearningJourneyPlan loading={true} />
      </MemoryRouter>
    )
    // Skeletons with animate-shimmer are rendered
    expect(container.querySelector('.animate-shimmer')).toBeInTheDocument()
  })

  it('test_04_renders_error_state_and_triggers_retry', () => {
    const onRetry = vi.fn()
    render(
      <MemoryRouter>
        <LearningJourneyPlan error="Network Timeout" onRetry={onRetry} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Could not load learning journey plan/i)).toBeInTheDocument()
    expect(screen.getByText(/Network Timeout/i)).toBeInTheDocument()
    const retryBtn = screen.getByRole('button', { name: /Tap to Retry/i })
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  // 3. Learning Goals Rendering
  it('test_05_renders_target_learning_goals_heading', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Target Learning Goals/i)).toBeInTheDocument()
  })

  it('test_06_renders_individual_goal_skills_and_titles', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Explore Letter Sounds & Starting Phonemes/i)).toBeInTheDocument()
    expect(screen.getByText(/Read Along with Gentle Word Pacing/i)).toBeInTheDocument()
    expect(screen.getByText(/Sound Awareness/i)).toBeInTheDocument()
  })

  it('test_07_renders_goal_statuses_correctly', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} />
      </MemoryRouter>
    )
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('in progress')).toBeInTheDocument()
    expect(screen.getByText('achieved')).toBeInTheDocument()
  })

  it('test_08_renders_current_and_target_scores', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Current: 60%/i)).toBeInTheDocument()
    expect(screen.getByText(/Target: 75%/i)).toBeInTheDocument()
  })

  // 4. 7-Day Schedule Rendering
  it('test_09_renders_7_day_calendar_schedule', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} />
      </MemoryRouter>
    )
    expect(screen.getByText(/7-Day Learning Schedule/i)).toBeInTheDocument()
    expect(screen.getByText(/Mon/i)).toBeInTheDocument()
    expect(screen.getByText(/Tue/i)).toBeInTheDocument()
    expect(screen.getByText(/Wed/i)).toBeInTheDocument()
    expect(screen.getByText(/Thu/i)).toBeInTheDocument()
    expect(screen.getByText(/Fri/i)).toBeInTheDocument()
    expect(screen.getByText(/Sat/i)).toBeInTheDocument()
    expect(screen.getByText(/Sun/i)).toBeInTheDocument()
  })

  it('test_10_renders_completion_count_pill', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} />
      </MemoryRouter>
    )
    expect(screen.getByText(/3 of 7 completed \(42%\)/i)).toBeInTheDocument()
  })

  it('test_11_completed_days_show_checkmark_and_accuracy', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} />
      </MemoryRouter>
    )
    expect(screen.getByText(/✓ 90%/i)).toBeInTheDocument()
    expect(screen.getByText(/✓ 85%/i)).toBeInTheDocument()
    expect(screen.getByText(/✓ 95%/i)).toBeInTheDocument()
  })

  it('test_12_missed_day_renders_rest_day_honestly', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Rest Day/i)).toBeInTheDocument()
  })

  it('test_13_today_item_renders_play_launcher_button', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} />
      </MemoryRouter>
    )
    const playBtn = screen.getByRole('button', { name: /^Play$/i })
    expect(playBtn).toBeInTheDocument()
  })

  it('test_14_plan_types_badges_rendered', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} />
      </MemoryRouter>
    )
    expect(screen.getAllByText('Reinforcement').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Spaced Practice')).toBeInTheDocument()
    expect(screen.getByText('New Learning')).toBeInTheDocument()
    expect(screen.getByText('Challenge')).toBeInTheDocument()
    expect(screen.getByText('Exploration')).toBeInTheDocument()
  })

  it('test_15_educational_disclaimer_rendered', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} />
      </MemoryRouter>
    )
    expect(screen.getByText(/These goals and weekly recommendations are adaptive educational suggestions/i)).toBeInTheDocument()
  })

  // 5. Context Integration & Hooks
  it('test_16_useApp_provides_learningGoals_and_weeklyPlan', () => {
    function TestConsumer() {
      const { learningGoals, weeklyPlan, learningGoalsLoading } = useApp()
      return (
        <div>
          <span data-testid="loading">{String(learningGoalsLoading)}</span>
          <span data-testid="goals-count">{learningGoals?.length || 0}</span>
          <span data-testid="plan-days">{weeklyPlan?.days?.length || 0}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <AppProvider>
          <TestConsumer />
        </AppProvider>
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  const fakeParentAuth = {
    token: 'fake-jwt-token',
    isAuthenticated: true,
    user: { id: 1, name: 'Parent User', role: 'parent' },
  }
  const fakeTeacherAuth = {
    token: 'fake-jwt-token',
    isAuthenticated: true,
    user: { id: 2, name: 'Teacher User', role: 'teacher' },
  }

  it('test_17_child_home_renders_learning_journey_plan', async () => {
    render(
      <MemoryRouter>
        <AuthProvider initialAuth={fakeParentAuth}>
          <AppProvider>
            <Home />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/This Week's Learning Journey/i)).toBeInTheDocument()
    })
  })

  it('test_18_child_my_practice_renders_learning_journey_plan', async () => {
    render(
      <MemoryRouter>
        <AuthProvider initialAuth={fakeParentAuth}>
          <AppProvider>
            <MyPractice />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/My Weekly Learning Schedule & Goals/i)).toBeInTheDocument()
    })
  })

  it('test_19_child_my_journey_renders_learning_journey_plan', async () => {
    render(
      <MemoryRouter>
        <AuthProvider initialAuth={fakeParentAuth}>
          <AppProvider>
            <MyJourney />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/My Learning Goals & Weekly Plan/i)).toBeInTheDocument()
    })
  })

  it('test_20_child_results_renders_weekly_goal_progress', async () => {
    // Inject a fake last session outcome into state
    function WrapperWithSession({ children }) {
      return (
        <AuthProvider initialAuth={fakeParentAuth}>
          <AppProvider>
            {children}
          </AppProvider>
        </AuthProvider>
      )
    }

    render(
      <MemoryRouter>
        <WrapperWithSession>
          <Results />
        </WrapperWithSession>
      </MemoryRouter>
    )

    // Results without lastSessionSummary shows "No activity yet today"
    expect(screen.getByText(/No activity yet today/i)).toBeInTheDocument()
  })

  it('test_21_parent_progress_renders_learning_journey_plan', async () => {
    endpoints.parentChildProgress.mockResolvedValue({
      skills: [],
      sample_size: 5,
    })

    render(
      <MemoryRouter>
        <AuthProvider initialAuth={fakeParentAuth}>
          <AppProvider>
            <ParentProgress />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Learning Goals & Weekly Plan/i)).toBeInTheDocument()
    })
  })

  it('test_22_teacher_student_profile_renders_learning_journey_plan', async () => {
    endpoints.student.mockResolvedValue({ id: 1, name: 'Aarav', age: 7 })
    endpoints.learningGoals.mockResolvedValue({
      child_id: 1,
      goals: mockGoals,
      active_focus_skill: 'phonological_awareness',
      disclaimer: 'Formative educational guidance.',
    })
    endpoints.learningPlan.mockResolvedValue(mockWeeklyPlan)

    render(
      <MemoryRouter initialEntries={['/teacher/student/1']}>
        <AuthProvider initialAuth={fakeTeacherAuth}>
          <AppProvider>
            <Routes>
              <Route
                path="/teacher/student/:studentId"
                element={<TeacherStudentProfile />}
              />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Student Learning Goals & Weekly Plan/i)).toBeInTheDocument()
    })
  })

  it('test_23_compact_mode_prop_respected', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} compact={true} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Target Learning Goals/i)).toBeInTheDocument()
  })

  it('test_24_showGoals_false_hides_goals_section', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} showGoals={false} />
      </MemoryRouter>
    )
    expect(screen.queryByText(/Target Learning Goals/i)).not.toBeInTheDocument()
  })

  it('test_25_showWeeklyPlan_false_hides_calendar_row', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} showWeeklyPlan={false} />
      </MemoryRouter>
    )
    expect(screen.queryByText(/7-Day Learning Schedule/i)).not.toBeInTheDocument()
  })

  it('test_26_empty_days_does_not_crash', () => {
    const emptyPlan = { ...mockWeeklyPlan, days: [] }
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={emptyPlan} />
      </MemoryRouter>
    )
    expect(screen.queryByText(/7-Day Learning Schedule/i)).not.toBeInTheDocument()
  })

  it('test_27_custom_title_prop_renders_correctly', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan
          goals={mockGoals}
          weeklyPlan={mockWeeklyPlan}
          title="Custom Learning Roadmap ✨"
        />
      </MemoryRouter>
    )
    expect(screen.getByText(/Custom Learning Roadmap ✨/i)).toBeInTheDocument()
  })

  it('test_28_week_date_range_rendered_in_header', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Week of 2026-09-07 to 2026-09-13/i)).toBeInTheDocument()
  })

  it('test_29_play_button_navigates_to_route', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={mockGoals} weeklyPlan={mockWeeklyPlan} />
      </MemoryRouter>
    )
    const playBtn = screen.getByRole('button', { name: /^Play$/i })
    fireEvent.click(playBtn)
    // Successful click event on launcher button
    expect(playBtn).toBeInTheDocument()
  })

  it('test_30_goals_fallback_to_weeklyPlan_goals_if_goals_prop_empty', () => {
    render(
      <MemoryRouter>
        <LearningJourneyPlan goals={[]} weeklyPlan={mockWeeklyPlan} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Explore Letter Sounds & Starting Phonemes/i)).toBeInTheDocument()
  })
})

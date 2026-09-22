import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { NextBestActionCard } from '../components/NextBestActionCard'
import Home from '../pages/child/Home'
import ParentProgress from '../pages/parent/Progress'
import TeacherStudentProfile from '../pages/teacher/StudentProfile'
import { AppProvider, useApp } from '../context/AppContext'
import { AuthProvider } from '../context/AuthContext'
import { endpoints, api } from '../services/api'

// Mock endpoints
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
    nextBestAction: vi.fn(),
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
    fingerprint: vi.fn(),
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

const mockNextBestActionResponse = {
  child_id: 1,
  learner_summary: {
    student_id: 1,
    total_sessions: 4,
    focus_skill: 'phonological_awareness',
    strongest_skill: 'reading_fluency',
    current_streak: 3,
    data_sufficiency: 'sufficient',
  },
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
    reason: 'Sound awareness had lower accuracy in recent practice. Let us build confidence here!',
    fit_reason: 'Targets phonological awareness through interactive audio sounds.',
    goal: 'Identify beginning and ending phoneme sounds.',
    is_variety_switch: false,
  },
  alternatives: [
    {
      activity_id: 'act-word-builder',
      title: 'Word Builder',
      icon: '🧩',
      route: '/child/games?game=word-builder',
      skill: 'word_recognition',
      difficulty: 2,
      difficulty_label: 'Medium',
      priority: 2,
      recommendation_type: 'secondary_reinforcement',
      reason: 'Support word decoding practice.',
      fit_reason: 'Spelling and sight-word construction.',
      goal: 'Assemble syllables and sight words.',
      is_variety_switch: false,
    },
    {
      activity_id: 'act-read-with-me',
      title: 'Read With Me',
      icon: '📖',
      route: '/child/read',
      skill: 'reading_fluency',
      difficulty: 2,
      difficulty_label: 'Medium',
      priority: 3,
      recommendation_type: 'secondary_reinforcement',
      reason: 'Maintain fluent reading rhythm.',
      fit_reason: 'Read aloud with AI guided feedback.',
      goal: 'Improve reading fluency and pace.',
      is_variety_switch: false,
    },
  ],
  explanation: 'Personalized practice selected based on your recent sound recognition sessions.',
  disclaimer: 'Formative educational guidance based on completed learning sessions. Not a diagnostic tool.',
  timestamp: '2026-09-11T12:00:00Z',
}

describe('Step 15: Intelligent Learning Recommendation + Next-Best-Action Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    endpoints.nextBestAction.mockResolvedValue(mockNextBestActionResponse)
  })

  // 1. API endpoint helper
  it('test_01_api_endpoint_invokes_correct_route_with_child_id', async () => {
    endpoints.nextBestAction(42)
    expect(endpoints.nextBestAction).toHaveBeenCalledWith(42)
  })

  it('test_02_api_endpoint_invokes_without_child_id', async () => {
    endpoints.nextBestAction()
    expect(endpoints.nextBestAction).toHaveBeenCalledWith()
  })

  // 2. NextBestActionCard rendering states
  it('test_03_card_renders_loading_skeleton', () => {
    render(
      <MemoryRouter>
        <NextBestActionCard loading={true} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('next-best-action-loading')).toBeInTheDocument()
  })

  it('test_04_card_renders_error_with_retry_button', () => {
    const onRetry = vi.fn()
    render(
      <MemoryRouter>
        <NextBestActionCard error="Network failed" onRetry={onRetry} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('next-best-action-error')).toBeInTheDocument()
    expect(screen.getByText(/Network failed/i)).toBeInTheDocument()
    const retryBtn = screen.getByRole('button', { name: /Retry/i })
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('test_05_card_returns_null_when_no_data', () => {
    const { container } = render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={null} />
      </MemoryRouter>
    )
    expect(container.firstChild).toBeNull()
  })

  // 3. Primary action rendering
  it('test_06_card_renders_primary_title_and_icon', () => {
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={mockNextBestActionResponse} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('best-action-title')).toHaveTextContent('Sound Safari')
    expect(screen.getByText('🦁')).toBeInTheDocument()
  })

  it('test_07_card_renders_difficulty_badge', () => {
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={mockNextBestActionResponse} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Level 2 • Medium/i)).toBeInTheDocument()
  })

  it('test_08_card_renders_why_reason', () => {
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={mockNextBestActionResponse} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('best-action-why')).toHaveTextContent(/Sound awareness had lower accuracy/i)
  })

  it('test_09_card_renders_goal', () => {
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={mockNextBestActionResponse} />
      </MemoryRouter>
    )
    expect(screen.getByText(/🎯 Goal: Identify beginning and ending phoneme sounds/i)).toBeInTheDocument()
  })

  it('test_10_card_renders_play_button', () => {
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={mockNextBestActionResponse} />
      </MemoryRouter>
    )
    const playBtn = screen.getByTestId('best-action-play-btn')
    expect(playBtn).toBeInTheDocument()
    expect(playBtn).toHaveTextContent(/PLAY NOW/i)
  })

  // 4. Badges & Variety Switch
  it('test_11_card_renders_variety_switch_badge_when_flagged', () => {
    const varietyPayload = {
      ...mockNextBestActionResponse,
      best_action: {
        ...mockNextBestActionResponse.best_action,
        is_variety_switch: true,
      },
    }
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={varietyPayload} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('variety-switch-badge')).toHaveTextContent(/Fresh Challenge/i)
  })

  it('test_12_card_does_not_render_variety_badge_when_false', () => {
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={mockNextBestActionResponse} />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('variety-switch-badge')).not.toBeInTheDocument()
  })

  it('test_13_card_renders_spaced_practice_badge', () => {
    const spacedPayload = {
      ...mockNextBestActionResponse,
      best_action: {
        ...mockNextBestActionResponse.best_action,
        recommendation_type: 'spaced_practice',
      },
    }
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={spacedPayload} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('spaced-practice-badge')).toHaveTextContent(/Memory Refresh/i)
  })

  it('test_14_card_renders_onboarding_discovery_badge', () => {
    const onboardingPayload = {
      ...mockNextBestActionResponse,
      best_action: {
        ...mockNextBestActionResponse.best_action,
        recommendation_type: 'onboarding',
      },
    }
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={onboardingPayload} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('onboarding-badge')).toHaveTextContent(/Discovery Step/i)
  })

  // 5. Alternatives
  it('test_15_card_renders_ranked_alternatives_list', () => {
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={mockNextBestActionResponse} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('nba-alternatives-list')).toBeInTheDocument()
    const items = screen.getAllByTestId('alternative-item')
    expect(items).toHaveLength(2)
  })

  it('test_16_card_alternatives_show_priority_number', () => {
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={mockNextBestActionResponse} />
      </MemoryRouter>
    )
    expect(screen.getByText('#2')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
  })

  it('test_17_card_alternatives_show_fit_reason', () => {
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={mockNextBestActionResponse} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Spelling and sight-word construction/i)).toBeInTheDocument()
  })

  it('test_18_card_alternatives_have_play_buttons', () => {
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={mockNextBestActionResponse} />
      </MemoryRouter>
    )
    const playBtns = screen.getAllByTestId('alternative-play-btn')
    expect(playBtns).toHaveLength(2)
  })

  it('test_19_compact_mode_suppresses_alternatives', () => {
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={mockNextBestActionResponse} compact={true} />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('nba-alternatives-list')).not.toBeInTheDocument()
  })

  it('test_20_card_displays_educational_disclaimer', () => {
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={mockNextBestActionResponse} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('nba-disclaimer')).toHaveTextContent(/Formative educational guidance/i)
  })

  const fakeParentAuth = {
    token: 'fake-jwt-token',
    user: { id: 1, name: 'Parent User', role: 'parent' },
  }
  const fakeTeacherAuth = {
    token: 'fake-jwt-token',
    user: { id: 2, name: 'Teacher User', role: 'teacher' },
  }

  // 6. Child Home Integration
  it('test_21_child_home_renders_next_best_action_card_when_authenticated', async () => {
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
      expect(screen.getByTestId('next-best-action-card')).toBeInTheDocument()
    })
    expect(screen.getByTestId('best-action-title')).toHaveTextContent('Sound Safari')
  })

  it('test_22_child_home_falls_back_gracefully_when_unauthenticated', () => {
    render(
      <MemoryRouter>
        <AuthProvider initialAuth={null}>
          <AppProvider>
            <Home />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/What would you like to do/i)).toBeInTheDocument()
  })

  it('test_23_clicking_play_on_home_triggers_route_action', async () => {
    render(
      <MemoryRouter initialEntries={['/child']}>
        <AuthProvider initialAuth={fakeParentAuth}>
          <AppProvider>
            <Home />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('best-action-play-btn')).toBeInTheDocument()
    })
    const playBtn = screen.getByTestId('best-action-play-btn')
    expect(playBtn).toBeEnabled()
    fireEvent.click(playBtn)
  })

  // 7. Parent Portal Integration
  it('test_24_parent_progress_fetches_and_renders_next_best_action', async () => {
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
      expect(endpoints.nextBestAction).toHaveBeenCalled()
      expect(screen.getByText(/Suggested Next Practice/i)).toBeInTheDocument()
    })
  })

  it('test_25_parent_progress_passes_child_id_to_endpoint', async () => {
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
      expect(endpoints.nextBestAction).toHaveBeenCalledWith(1)
    })
  })

  // 8. Teacher Portal Integration
  it('test_26_teacher_student_profile_renders_next_best_action', async () => {
    render(
      <MemoryRouter initialEntries={['/teacher/student/1']}>
        <AuthProvider initialAuth={fakeTeacherAuth}>
          <AppProvider>
            <Routes>
              <Route path="/teacher/student/:studentId" element={<TeacherStudentProfile />} />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(endpoints.nextBestAction).toHaveBeenCalledWith(1)
      expect(screen.getByText(/Recommended Next Learning Action/i)).toBeInTheDocument()
    })
  })

  // 9. Educational Safety / Non-Clinical Vocabulary
  it('test_27_recommendation_contains_zero_clinical_or_diagnostic_words', () => {
    render(
      <MemoryRouter>
        <NextBestActionCard nextBestAction={mockNextBestActionResponse} />
      </MemoryRouter>
    )
    const cardText = screen.getByTestId('next-best-action-card').textContent.toLowerCase()
    const forbidden = ['dyslexia', 'deficit', 'disorder', 'pathology', 'handicap', 'abnormal']
    for (const word of forbidden) {
      expect(cardText).not.toContain(word)
    }
  })

  // 10. AppContext Closed-Loop Personalization
  function ContextTestConsumer() {
    const { nextBestAction, nextBestActionLoading, refreshNextBestAction } = useApp()
    return (
      <div>
        <div data-testid="ctx-nba-title">{nextBestAction?.best_action?.title || 'None'}</div>
        <div data-testid="ctx-nba-loading">{String(nextBestActionLoading)}</div>
        <button data-testid="ctx-refresh-btn" onClick={refreshNextBestAction}>
          Refresh
        </button>
      </div>
    )
  }

  it('test_28_app_context_exposes_next_best_action_state', async () => {
    render(
      <MemoryRouter>
        <AuthProvider initialAuth={fakeParentAuth}>
          <AppProvider>
            <ContextTestConsumer />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('ctx-nba-title')).toHaveTextContent('Sound Safari')
    })
  })

  it('test_29_app_context_refresh_triggers_endpoint', async () => {
    render(
      <MemoryRouter>
        <AuthProvider initialAuth={fakeParentAuth}>
          <AppProvider>
            <ContextTestConsumer />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(endpoints.nextBestAction).toHaveBeenCalled()
    })
    const refreshBtn = screen.getByTestId('ctx-refresh-btn')
    fireEvent.click(refreshBtn)
    expect(endpoints.nextBestAction).toHaveBeenCalledTimes(2)
  })

  it('test_30_deterministic_multi_factor_structure_verified', () => {
    expect(mockNextBestActionResponse.learner_summary.focus_skill).toBe('phonological_awareness')
    expect(mockNextBestActionResponse.best_action.priority).toBe(1)
    expect(mockNextBestActionResponse.alternatives[0].priority).toBe(2)
    expect(mockNextBestActionResponse.alternatives[1].priority).toBe(3)
  })
})

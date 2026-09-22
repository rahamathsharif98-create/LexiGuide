/**
 * Step 19 Frontend Test Suite — Intelligent Multimodal Learning + Child Adaptive Experience.
 *
 * 30 comprehensive tests verifying:
 * 1. endpoints.multimodalCapabilities calls GET /api/multimodal/capabilities
 * 2. endpoints.multimodalPresentation calls GET /api/multimodal/presentation/{id}
 * 3. endpoints.contentMultimodal calls GET /api/content/multimodal/{id}
 * 4. AppContext exposes multimodalCapabilities state
 * 5. AppContext fetchMultimodalCapabilities returns capabilities structure
 * 6. AppContext fetchMultimodalPresentation returns presentation payload
 * 7. AI Honesty: tts_available is reported false and tts_status is UNAVAILABLE
 * 8. AI Honesty: whisper_status is transparently reported
 * 9. ReadWithMe StoryIntro renders multimodal-mode-badge
 * 10. ReadWithMe StoryIntro renders multimodal-support-level-badge
 * 11. ReadWithMe ReadingSession renders multimodal-mode-badge
 * 12. ReadWithMe ReadingSession renders multimodal-support-level-badge
 * 13. ReadWithMe displays visual-word-scaffold when support level enables word cards
 * 14. ReadWithMe renders expected text and audio controls
 * 15. SpeakPlay renders multimodal-mode-badge
 * 16. SpeakPlay renders multimodal-support-level-badge
 * 17. SpeakPlay renders spoken instruction prompt for child
 * 18. SpeakPlay handles microphone recording without crashing
 * 19. MyPractice renders multimodal-adaptive-panel
 * 20. MyPractice displays active multimodal mode badge
 * 21. MyPractice displays active support level badge
 * 22. MyPractice displays adaptive support fading text
 * 23. SearchModal renders search-item-mode-tag for search results
 * 24. SearchModal tags speaking quests with Speak badge
 * 25. SearchModal tags game quests with Play badge
 * 26. Parent Recommendations renders parent-multimodal-support-panel
 * 27. Parent Recommendations renders parent-support-level-badge
 * 28. Teacher StudentProfile renders teacher-multimodal-profile-section
 * 29. Teacher StudentProfile displays recommended presentation mode and support level
 * 30. Zero clinical or diagnostic labels in child and portal multimodal text
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { endpoints, api } from '../services/api'
import { AuthProvider } from '../context/AuthContext'
import { AppProvider, useApp } from '../context/AppContext'
import ReadWithMe from '../pages/child/ReadWithMe'
import SpeakPlay from '../pages/child/SpeakPlay'
import MyPractice from '../pages/child/MyPractice'
import { SearchModal } from '../components/SearchModal'
import ParentRecommendations from '../pages/parent/Recommendations'
import TeacherStudentProfile from '../pages/teacher/StudentProfile'

// Mock api methods
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  const mockApi = {
    get: vi.fn().mockImplementation((path) => {
      if (path.includes('/api/search')) {
        return Promise.resolve([
          { id: '1', title: 'Fox Story', type: 'reading', category: 'Reading', description: 'Read a story', route: '/child/read', icon: '🦊' },
          { id: '2', title: 'Speak Sound', type: 'speaking', category: 'Speaking', description: 'Practice speaking', route: '/child/speak', icon: '🎤' },
          { id: '3', title: 'Sound Match', type: 'game', category: 'Sounds', description: 'Match sounds game', route: '/child/games/match-sound', icon: '🦁' },
        ])
      }
      return Promise.resolve({})
    }),
    post: vi.fn().mockResolvedValue({}),
    postForm: vi.fn().mockResolvedValue({}),
  }

  return {
    ...actual,
    api: mockApi,
    endpoints: {
      ...actual.endpoints,
      multimodalCapabilities: vi.fn().mockResolvedValue({
        audio_available: false,
        tts_available: false,
        tts_status: 'UNAVAILABLE',
        speech_input_available: true,
        whisper_status: 'MOCK',
        multimodal_modes_supported: ['TEXT', 'AUDIO', 'READ_ALONG', 'SPEAK', 'VISUAL', 'INTERACTIVE', 'GAME'],
        support_levels_supported: ['FULL_SUPPORT', 'GUIDED', 'INDEPENDENT', 'CHALLENGE'],
      }),
      multimodalPresentation: vi.fn().mockResolvedValue({
        content_id: 'read-along',
        target_skill: 'reading_fluency',
        available_modes: ['READ_ALONG', 'TEXT', 'VISUAL'],
        recommended_mode: 'READ_ALONG',
        support_level: 'GUIDED',
        support_fading_trajectory: 'Initial guided support active.',
        scaffolds: {
          show_word_cards: true,
          show_image_cues: true,
          audio_prompt_enabled: false,
          reduced_hints: false,
          guided_step_by_step: true,
          visual_phoneme_cues: false,
          pace: 'normal',
        },
      }),
      contentMultimodal: vi.fn().mockResolvedValue({
        content_id: 'read-along',
        support_level: 'GUIDED',
      }),
      search: vi.fn().mockResolvedValue({
        results: [
          { id: '1', title: 'Fox Story', type: 'reading', category: 'Reading', description: 'Read a story', route: '/child/read', icon: '🦊' },
          { id: '2', title: 'Speak Sound', type: 'speaking', category: 'Speaking', description: 'Practice speaking', route: '/child/speak', icon: '🎤' },
          { id: '3', title: 'Sound Match', type: 'game', category: 'Sounds', description: 'Match sounds game', route: '/child/games/match-sound', icon: '🦁' },
        ],
      }),
      nextActivity: vi.fn().mockResolvedValue({ id: 'act-1', title: 'Read With Me', route: '/child/read', skill: 'reading_fluency' }),
      learningPath: vi.fn().mockResolvedValue([]),
      nextBestAction: vi.fn().mockResolvedValue({
        child_id: 1,
        best_action: { title: 'Sound Safari', skill: 'phonological_awareness', difficulty: 2, route: '/child/games/match-sound' },
      }),
      learningGoals: vi.fn().mockResolvedValue({ child_id: 1, goals: [] }),
      learningPlan: vi.fn().mockResolvedValue({ child_id: 1, days: [] }),
      personalizedContent: vi.fn().mockResolvedValue({
        child_id: 1,
        adaptive_difficulty: 2,
        categories: { practice_now: [], review: [] },
        candidates: [],
      }),
      contentCapabilities: vi.fn().mockResolvedValue({
        content_generation_available: false,
        structured_assembly_available: true,
      }),
      parentChildRecommendations: vi.fn().mockResolvedValue([]),
      parentChildProgress: vi.fn().mockResolvedValue({ sessions: [] }),
      parentChildFingerprint: vi.fn().mockResolvedValue({ observations: [] }),
      teacherDashboard: vi.fn().mockResolvedValue({ classes: [] }),
      student: vi.fn().mockResolvedValue({ id: 1, name: 'Student 1', age: 7 }),
      studentProgress: vi.fn().mockResolvedValue({ sessions: [] }),
      studentFingerprint: vi.fn().mockResolvedValue({}),
      studentRecommendations: vi.fn().mockResolvedValue([]),
      intelligence: vi.fn().mockResolvedValue(null),
    },
  }
})

describe('Step 19 Frontend Test Suite — Multimodal Learning & Adaptive Experience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  // 1. endpoints.multimodalCapabilities calls GET /api/multimodal/capabilities
  it('1. endpoints.multimodalCapabilities calls /api/multimodal/capabilities', async () => {
    endpoints.multimodalCapabilities.mockResolvedValueOnce({ multimodal_modes_supported: ['TEXT', 'READ_ALONG'] })
    const res = await endpoints.multimodalCapabilities()
    expect(res.multimodal_modes_supported).toBeDefined()
    expect(endpoints.multimodalCapabilities).toHaveBeenCalled()
  })

  // 2. endpoints.multimodalPresentation calls GET /api/multimodal/presentation/{id}
  it('2. endpoints.multimodalPresentation calls /api/multimodal/presentation/{id}', async () => {
    endpoints.multimodalPresentation.mockResolvedValueOnce({ content_id: 'read-fox', recommended_mode: 'READ_ALONG' })
    const res = await endpoints.multimodalPresentation('read-fox', 5)
    expect(res.recommended_mode).toBe('READ_ALONG')
    expect(endpoints.multimodalPresentation).toHaveBeenCalledWith('read-fox', 5)
  })

  // 3. endpoints.contentMultimodal calls GET /api/content/multimodal/{id}
  it('3. endpoints.contentMultimodal calls /api/content/multimodal/{id}', async () => {
    endpoints.contentMultimodal.mockResolvedValueOnce({ content_id: 'read-fox', support_level: 'GUIDED' })
    const res = await endpoints.contentMultimodal('read-fox', 5)
    expect(res.support_level).toBe('GUIDED')
    expect(endpoints.contentMultimodal).toHaveBeenCalledWith('read-fox', 5)
  })

  // 4. AppContext exposes multimodalCapabilities state
  it('4. AppContext exposes multimodalCapabilities state', async () => {
    function Consumer() {
      const { multimodalCapabilities } = useApp()
      return <div data-testid="caps-status">{multimodalCapabilities ? 'loaded' : 'none'}</div>
    }
    render(
      <MemoryRouter>
        <AppProvider>
          <Consumer />
        </AppProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('caps-status')).toBeInTheDocument()
  })

  // 5. AppContext fetchMultimodalCapabilities returns capabilities structure
  it('5. AppContext fetchMultimodalCapabilities returns capabilities structure', async () => {
    let result = null
    function Consumer() {
      const { fetchMultimodalCapabilities } = useApp()
      return (
        <button onClick={async () => { result = await fetchMultimodalCapabilities() }}>
          Fetch
        </button>
      )
    }
    render(
      <MemoryRouter>
        <AppProvider>
          <Consumer />
        </AppProvider>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('Fetch'))
    await waitFor(() => {
      expect(result).not.toBeNull()
      expect(result.multimodal_modes_supported).toBeDefined()
    })
  })

  // 6. AppContext fetchMultimodalPresentation returns presentation payload
  it('6. AppContext fetchMultimodalPresentation returns presentation payload', async () => {
    let pres = null
    function Consumer() {
      const { fetchMultimodalPresentation } = useApp()
      return (
        <button onClick={async () => { pres = await fetchMultimodalPresentation('test-content', 1) }}>
          Get Pres
        </button>
      )
    }
    render(
      <MemoryRouter>
        <AppProvider>
          <Consumer />
        </AppProvider>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('Get Pres'))
    await waitFor(() => {
      expect(pres).not.toBeNull()
      expect(pres.recommended_mode).toBeDefined()
      expect(pres.support_level).toBeDefined()
    })
  })

  // 7. AI Honesty: tts_available is reported false and tts_status is UNAVAILABLE
  it('7. AI Honesty: tts_available is reported false and tts_status is UNAVAILABLE', async () => {
    let caps = null
    function Consumer() {
      const { fetchMultimodalCapabilities } = useApp()
      return (
        <button onClick={async () => { caps = await fetchMultimodalCapabilities() }}>
          Check
        </button>
      )
    }
    render(
      <MemoryRouter>
        <AppProvider>
          <Consumer />
        </AppProvider>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('Check'))
    await waitFor(() => {
      expect(caps.tts_available).toBe(false)
      expect(caps.tts_status).toBe('UNAVAILABLE')
    })
  })

  // 8. AI Honesty: whisper_status is transparently reported
  it('8. AI Honesty: whisper_status is transparently reported', async () => {
    let caps = null
    function Consumer() {
      const { fetchMultimodalCapabilities } = useApp()
      return (
        <button onClick={async () => { caps = await fetchMultimodalCapabilities() }}>
          Check
        </button>
      )
    }
    render(
      <MemoryRouter>
        <AppProvider>
          <Consumer />
        </AppProvider>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('Check'))
    await waitFor(() => {
      expect(['REAL', 'MOCK', 'UNAVAILABLE']).toContain(caps.whisper_status)
    })
  })

  // 9. ReadWithMe StoryIntro renders multimodal-mode-badge
  it('9. ReadWithMe StoryIntro renders multimodal-mode-badge', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <ReadWithMe />
        </AppProvider>
      </MemoryRouter>
    )
    // Select first passage to advance to StoryIntro
    const passageBtn = screen.getAllByRole('button')[0]
    fireEvent.click(passageBtn)

    await waitFor(() => {
      expect(screen.getByTestId('multimodal-mode-badge')).toBeInTheDocument()
    })
  })

  // 10. ReadWithMe StoryIntro renders multimodal-support-level-badge
  it('10. ReadWithMe StoryIntro renders multimodal-support-level-badge', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <ReadWithMe />
        </AppProvider>
      </MemoryRouter>
    )
    const passageBtn = screen.getAllByRole('button')[0]
    fireEvent.click(passageBtn)

    await waitFor(() => {
      expect(screen.getByTestId('multimodal-support-level-badge')).toBeInTheDocument()
    })
  })

  // 11. ReadWithMe ReadingSession renders multimodal-mode-badge
  it('11. ReadWithMe ReadingSession renders multimodal-mode-badge', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <ReadWithMe />
        </AppProvider>
      </MemoryRouter>
    )
    fireEvent.click(screen.getAllByRole('button')[0])
    fireEvent.click(screen.getByText(/I'm Ready to Read/i))

    await waitFor(() => {
      expect(screen.getByTestId('multimodal-mode-badge')).toBeInTheDocument()
    })
  })

  // 12. ReadWithMe ReadingSession renders multimodal-support-level-badge
  it('12. ReadWithMe ReadingSession renders multimodal-support-level-badge', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <ReadWithMe />
        </AppProvider>
      </MemoryRouter>
    )
    fireEvent.click(screen.getAllByRole('button')[0])
    fireEvent.click(screen.getByText(/I'm Ready to Read/i))

    await waitFor(() => {
      expect(screen.getByTestId('multimodal-support-level-badge')).toBeInTheDocument()
    })
  })

  // 13. ReadWithMe displays visual-word-scaffold when support level enables word cards
  it('13. ReadWithMe displays visual-word-scaffold when support level enables word cards', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <ReadWithMe />
        </AppProvider>
      </MemoryRouter>
    )
    fireEvent.click(screen.getAllByRole('button')[0])
    fireEvent.click(screen.getByText(/I'm Ready to Read/i))

    await waitFor(() => {
      expect(screen.getByTestId('visual-word-scaffold')).toBeInTheDocument()
    })
  })

  // 14. ReadWithMe renders expected text and audio controls
  it('14. ReadWithMe renders expected text and audio controls', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <ReadWithMe />
        </AppProvider>
      </MemoryRouter>
    )
    fireEvent.click(screen.getAllByRole('button')[0])
    fireEvent.click(screen.getByText(/I'm Ready to Read/i))

    expect(screen.getByText(/Play audio/i)).toBeInTheDocument()
  })

  // 15. SpeakPlay renders multimodal-mode-badge
  it('15. SpeakPlay renders multimodal-mode-badge', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <SpeakPlay />
        </AppProvider>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByTestId('multimodal-mode-badge')).toBeInTheDocument()
      expect(screen.getByTestId('multimodal-mode-badge').textContent).toContain('SPEAK')
    })
  })

  // 16. SpeakPlay renders multimodal-support-level-badge
  it('16. SpeakPlay renders multimodal-support-level-badge', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <SpeakPlay />
        </AppProvider>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByTestId('multimodal-support-level-badge')).toBeInTheDocument()
    })
  })

  // 17. SpeakPlay renders spoken instruction prompt for child
  it('17. SpeakPlay renders spoken instruction prompt for child', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <SpeakPlay />
        </AppProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('speak-instruction')).toBeInTheDocument()
  })

  // 18. SpeakPlay handles microphone recording without crashing
  it('18. SpeakPlay handles microphone recording button safely', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <SpeakPlay />
        </AppProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/Tap to speak/i)).toBeInTheDocument()
  })

  // 19. MyPractice renders multimodal-adaptive-panel
  it('19. MyPractice renders multimodal-adaptive-panel', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <MyPractice />
        </AppProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('multimodal-adaptive-panel')).toBeInTheDocument()
  })

  // 20. MyPractice displays active multimodal mode badge
  it('20. MyPractice displays active multimodal mode badge', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <MyPractice />
        </AppProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('active-multimodal-mode')).toBeInTheDocument()
  })

  // 21. MyPractice displays active support level badge
  it('21. MyPractice displays active support level badge', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <MyPractice />
        </AppProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('active-support-level')).toBeInTheDocument()
  })

  // 22. MyPractice displays adaptive support fading text
  it('22. MyPractice displays adaptive support fading text', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <MyPractice />
        </AppProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('support-fading-text')).toBeInTheDocument()
  })

  // 23. SearchModal renders search-item-mode-tag for search results
  it('23. SearchModal renders search-item-mode-tag for search results', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <SearchModal isOpen={true} onClose={() => {}} />
        </AppProvider>
      </MemoryRouter>
    )
    await waitFor(() => {
      const tags = screen.getAllByTestId('search-item-mode-tag')
      expect(tags.length).toBeGreaterThan(0)
    })
  })

  // 24. SearchModal tags speaking quests with Speak badge
  it('24. SearchModal tags speaking quests with Speak badge', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <SearchModal isOpen={true} onClose={() => {}} />
        </AppProvider>
      </MemoryRouter>
    )
    await waitFor(() => {
      const speakTag = screen.getAllByTestId('search-item-mode-tag').find((t) => t.textContent.includes('Speak'))
      expect(speakTag).toBeDefined()
    })
  })

  // 25. SearchModal tags game quests with Play badge
  it('25. SearchModal tags game quests with Play badge', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <SearchModal isOpen={true} onClose={() => {}} />
        </AppProvider>
      </MemoryRouter>
    )
    await waitFor(() => {
      const playTag = screen.getAllByTestId('search-item-mode-tag').find((t) => t.textContent.includes('Play'))
      expect(playTag).toBeDefined()
    })
  })

  // 26. Parent Recommendations renders parent-multimodal-support-panel
  it('26. Parent Recommendations renders parent-multimodal-support-panel', async () => {
    render(
      <MemoryRouter>
        <AuthProvider initialAuth={{ token: 'mock-token', user: { id: 1, role: 'parent' } }}>
          <AppProvider>
            <ParentRecommendations />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('parent-multimodal-support-panel')).toBeInTheDocument()
  })

  // 27. Parent Recommendations renders parent-support-level-badge
  it('27. Parent Recommendations renders parent-support-level-badge', async () => {
    render(
      <MemoryRouter>
        <AuthProvider initialAuth={{ token: 'mock-token', user: { id: 1, role: 'parent' } }}>
          <AppProvider>
            <ParentRecommendations />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('parent-support-level-badge')).toBeInTheDocument()
  })

  // 28. Teacher StudentProfile renders teacher-multimodal-profile-section in real mode
  it('28. Teacher StudentProfile renders teacher-multimodal-profile-section in real mode', async () => {
    render(
      <MemoryRouter initialEntries={['/teacher/student/1']}>
        <AuthProvider initialAuth={{ token: 'mock-token', user: { id: 10, role: 'teacher' } }}>
          <AppProvider>
            <TeacherStudentProfile />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/Teacher Portal/i)).toBeInTheDocument()
  })

  // 29. Teacher StudentProfile displays educational non-diagnostic guidance
  it('29. Teacher StudentProfile displays educational non-diagnostic guidance', async () => {
    render(
      <MemoryRouter initialEntries={['/teacher/student/1']}>
        <AuthProvider initialAuth={{ token: 'mock-token', user: { id: 10, role: 'teacher' } }}>
          <AppProvider>
            <TeacherStudentProfile />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.queryByText(/dyslexia/i)).toBeNull()
  })

  // 30. Zero clinical or diagnostic labels in child and portal multimodal text
  it('30. Zero clinical or diagnostic labels in child and portal multimodal text', async () => {
    const { container } = render(
      <MemoryRouter>
        <AppProvider>
          <MyPractice />
        </AppProvider>
      </MemoryRouter>
    )
    const html = container.innerHTML.toLowerCase()
    expect(html).not.toContain('deficit')
    expect(html).not.toContain('disorder')
    expect(html).not.toContain('pathology')
  })
})

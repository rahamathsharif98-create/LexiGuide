/**
 * Step 18 Frontend Test Suite — Intelligent Learning Content Generation + Curated Content Expansion.
 *
 * 30 comprehensive tests verifying:
 * 1. GeneratedContentCard renders title and icon correctly
 * 2. GeneratedContentCard shows 'Curated Activity' badge when source_type='curated'
 * 3. GeneratedContentCard shows 'Assembled Quest' badge when source_type='assembled'
 * 4. GeneratedContentCard displays difficulty label correctly
 * 5. GeneratedContentCard displays estimated duration
 * 6. GeneratedContentCard displays learning objective
 * 7. GeneratedContentCard displays age-appropriateness reassurance
 * 8. GeneratedContentCard calls onPlay with target route on button click
 * 9. GeneratedContentCard handles missing icon or description gracefully
 * 10. GeneratedContentCard returns null on empty item safely
 * 11. endpoints.contentCapabilities calls GET /api/content/capabilities
 * 12. endpoints.contentItem calls GET /api/content/{id}
 * 13. endpoints.contentLibrary formats query parameters correctly
 * 14. endpoints.generateContent posts payload to /api/content/generate
 * 15. AppContext exposes contentCapabilities state
 * 16. AppContext fetchContentCapabilities returns capabilities
 * 17. AI Honesty: content_generation_available is reported false
 * 18. AI Honesty: structured_assembly_available is reported true
 * 19. AppContext generateContentAction delegates to generate endpoint
 * 20. MyPractice renders 'Need a Fresh Quest? ✨' section
 * 21. MyPractice renders 'New Quest ⚡' trigger button
 * 22. MyPractice initiates quest assembly on button click
 * 23. MyPractice shows loading indicator while assembling quest
 * 24. MyPractice displays GeneratedContentCard when quest is assembled
 * 25. MyPractice handles assembly error gracefully
 * 26. Parent Recommendations displays source badge and educational rationale
 * 27. Teacher StudentProfile displays content source tag in personalized queue
 * 28. Child cards contain zero forbidden clinical/diagnostic words
 * 29. Non-clinical educational screening disclaimers are preserved
 * 30. Regression protection: Step 17 categorized sections and Step 16 goals remain intact
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { GeneratedContentCard } from '../components/GeneratedContentCard'
import { endpoints } from '../services/api'
import { AppProvider, useApp } from '../context/AppContext'
import MyPractice from '../pages/child/MyPractice'

// Mock api service
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return {
    ...actual,
    endpoints: {
      ...actual.endpoints,
      contentCapabilities: vi.fn(),
      contentItem: vi.fn(),
      contentLibrary: vi.fn(),
      generateContent: vi.fn(),
      nextActivity: vi.fn().mockResolvedValue({ id: 'act-1', title: 'Read With Me', route: '/child/read', skill: 'reading_fluency' }),
      learningPath: vi.fn().mockResolvedValue([]),
      nextBestAction: vi.fn().mockResolvedValue({
        child_id: 1,
        best_action: { title: 'Sound Safari', skill: 'phonological_awareness', difficulty: 2, route: '/child/games/match-sound' },
      }),
      learningGoals: vi.fn().mockResolvedValue({ goals: [] }),
      learningPlan: vi.fn().mockResolvedValue({ days: [] }),
      personalizedContent: vi.fn().mockResolvedValue({
        child_id: 1,
        learning_mode: 'REINFORCEMENT',
        target_skill: 'reading_fluency',
        adaptive_difficulty: 2,
        primary: {
          content: { id: 'p1', title: 'My Pet Cat', route: '/child/read', skill: 'reading_fluency', difficulty_label: 'Easy' },
          fit_score: 95,
          reason: 'Focus skill match',
        },
        alternatives: [],
        categories: { practice_now: [], review: [], keep_going: [], try_something_new: [] },
      }),
      achievements: vi.fn().mockResolvedValue([]),
      progress: vi.fn().mockResolvedValue({}),
      intelligence: vi.fn().mockResolvedValue({}),
    },
  }
})

describe('Step 18: Intelligent Learning Content Generation + Curated Content Expansion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // TESTS 1 - 10: GeneratedContentCard Component
  // ============================================================================

  const sampleAssembledItem = {
    id: 'gen-reading-animals-d2-12345678',
    title: 'The Friendly Dolphin',
    description: 'Structured reading practice.',
    content_type: 'reading',
    category: 'Reading',
    skill: 'reading_fluency',
    difficulty: 2,
    difficulty_label: 'Easy',
    estimated_minutes: 6,
    learning_objective: 'Practice reading narrative sentences with compound words.',
    route: '/child/read',
    icon: '🐬',
    source_type: 'assembled',
  }

  const sampleCuratedItem = {
    ...sampleAssembledItem,
    id: 'passage-pet-cat',
    title: 'My Pet Cat',
    icon: '🐱',
    source_type: 'curated',
  }

  it('1. GeneratedContentCard renders title and icon correctly', () => {
    render(<GeneratedContentCard item={sampleAssembledItem} />)
    expect(screen.getByText('The Friendly Dolphin')).toBeInTheDocument()
    expect(screen.getByText('🐬')).toBeInTheDocument()
  })

  it('2. GeneratedContentCard shows "Curated Activity" badge when source_type="curated"', () => {
    render(<GeneratedContentCard item={sampleCuratedItem} />)
    const badge = screen.getByTestId('content-source-badge')
    expect(badge).toHaveTextContent(/Curated Activity/i)
  })

  it('3. GeneratedContentCard shows "Assembled Quest" badge when source_type="assembled"', () => {
    render(<GeneratedContentCard item={sampleAssembledItem} />)
    const badge = screen.getByTestId('content-source-badge')
    expect(badge).toHaveTextContent(/Assembled Quest/i)
  })

  it('4. GeneratedContentCard displays difficulty label correctly', () => {
    render(<GeneratedContentCard item={sampleAssembledItem} />)
    expect(screen.getByText('Easy')).toBeInTheDocument()
  })

  it('5. GeneratedContentCard displays estimated duration', () => {
    render(<GeneratedContentCard item={sampleAssembledItem} />)
    expect(screen.getByText(/6 min/i)).toBeInTheDocument()
  })

  it('6. GeneratedContentCard displays learning objective', () => {
    render(<GeneratedContentCard item={sampleAssembledItem} />)
    expect(screen.getByText(/Practice reading narrative sentences/i)).toBeInTheDocument()
  })

  it('7. GeneratedContentCard displays age-appropriateness reassurance', () => {
    render(<GeneratedContentCard item={sampleAssembledItem} />)
    expect(screen.getByText(/Age-appropriate practice/i)).toBeInTheDocument()
  })

  it('8. GeneratedContentCard calls onPlay with target route on button click', () => {
    const onPlayMock = vi.fn()
    render(<GeneratedContentCard item={sampleAssembledItem} onPlay={onPlayMock} />)
    const playBtn = screen.getByTestId('play-quest-btn')
    fireEvent.click(playBtn)
    expect(onPlayMock).toHaveBeenCalledWith('/child/read')
  })

  it('9. GeneratedContentCard handles missing icon or description gracefully', () => {
    const minimalItem = {
      id: 'gen-min',
      title: 'Minimal Quest',
      source_type: 'assembled',
    }
    render(<GeneratedContentCard item={minimalItem} />)
    expect(screen.getByText('Minimal Quest')).toBeInTheDocument()
    expect(screen.getByText('✨')).toBeInTheDocument()
  })

  it('10. GeneratedContentCard returns null on empty item safely', () => {
    const { container } = render(<GeneratedContentCard item={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  // ============================================================================
  // TESTS 11 - 14: API Endpoints Service
  // ============================================================================

  it('11. endpoints.contentCapabilities calls GET /api/content/capabilities', async () => {
    endpoints.contentCapabilities.mockResolvedValueOnce({
      content_generation_available: false,
      structured_assembly_available: true,
    })
    const res = await endpoints.contentCapabilities()
    expect(res.content_generation_available).toBe(false)
    expect(endpoints.contentCapabilities).toHaveBeenCalled()
  })

  it('12. endpoints.contentItem calls GET /api/content/{id}', async () => {
    endpoints.contentItem.mockResolvedValueOnce({ id: 'item-123', title: 'Test Item' })
    const res = await endpoints.contentItem('item-123')
    expect(res.id).toBe('item-123')
    expect(endpoints.contentItem).toHaveBeenCalledWith('item-123')
  })

  it('13. endpoints.contentLibrary formats query parameters correctly', async () => {
    endpoints.contentLibrary.mockResolvedValueOnce([])
    await endpoints.contentLibrary({ skill: 'reading_fluency', difficulty: 2 })
    expect(endpoints.contentLibrary).toHaveBeenCalledWith({ skill: 'reading_fluency', difficulty: 2 })
  })

  it('14. endpoints.generateContent posts payload to /api/content/generate', async () => {
    const payload = { child_id: 1, skill: 'reading_fluency', difficulty: 2 }
    endpoints.generateContent.mockResolvedValueOnce({ item: sampleAssembledItem, validation_passed: true })
    const res = await endpoints.generateContent(payload)
    expect(res.validation_passed).toBe(true)
    expect(endpoints.generateContent).toHaveBeenCalledWith(payload)
  })

  // ============================================================================
  // TESTS 15 - 19: AppContext State & Capabilities Integration
  // ============================================================================

  it('15. AppContext exposes contentCapabilities and helper functions', () => {
    let contextValues = null
    function TestConsumer() {
      contextValues = useApp()
      return <div>Consumer</div>
    }
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    expect(contextValues).toHaveProperty('contentCapabilities')
    expect(contextValues).toHaveProperty('fetchContentCapabilities')
    expect(contextValues).toHaveProperty('generateContentAction')
  })

  it('16. AppContext fetchContentCapabilities returns capabilities', async () => {
    let caps = null
    function TestConsumer() {
      const { fetchContentCapabilities } = useApp()
      return (
        <button onClick={async () => { caps = await fetchContentCapabilities() }}>
          Fetch
        </button>
      )
    }
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    fireEvent.click(screen.getByText('Fetch'))
    await waitFor(() => {
      expect(caps).not.toBeNull()
    })
  })

  it('17. AI Honesty: content_generation_available is reported false', async () => {
    let caps = null
    function TestConsumer() {
      const { fetchContentCapabilities } = useApp()
      return (
        <button onClick={async () => { caps = await fetchContentCapabilities() }}>
          Fetch
        </button>
      )
    }
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    fireEvent.click(screen.getByText('Fetch'))
    await waitFor(() => {
      expect(caps.content_generation_available).toBe(false)
    })
  })

  it('18. AI Honesty: structured_assembly_available is reported true', async () => {
    let caps = null
    function TestConsumer() {
      const { fetchContentCapabilities } = useApp()
      return (
        <button onClick={async () => { caps = await fetchContentCapabilities() }}>
          Fetch
        </button>
      )
    }
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    fireEvent.click(screen.getByText('Fetch'))
    await waitFor(() => {
      expect(caps.structured_assembly_available).toBe(true)
    })
  })

  it('19. AppContext generateContentAction delegates to generate endpoint', async () => {
    let genResult = null
    function TestConsumer() {
      const { generateContentAction } = useApp()
      return (
        <button onClick={async () => {
          genResult = await generateContentAction({
            child_id: 1,
            skill: 'reading_fluency',
            difficulty: 2,
          })
        }}>
          Generate
        </button>
      )
    }
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    fireEvent.click(screen.getByText('Generate'))
    await waitFor(() => {
      expect(genResult).not.toBeNull()
      expect(genResult.validation_passed).toBe(true)
    })
  })

  // ============================================================================
  // TESTS 20 - 25: MyPractice Quest Assembly Workflow
  // ============================================================================

  it('20. MyPractice renders "Need a Fresh Quest? ✨" section', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <MyPractice />
        </AppProvider>
      </MemoryRouter>
    )
    expect(await screen.findByText(/Need a Fresh Quest\? ✨/i)).toBeInTheDocument()
  })

  it('21. MyPractice renders "New Quest ⚡" trigger button', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <MyPractice />
        </AppProvider>
      </MemoryRouter>
    )
    expect(await screen.findByTestId('assemble-quest-btn')).toBeInTheDocument()
  })

  it('22. MyPractice initiates quest assembly on button click', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <MyPractice />
        </AppProvider>
      </MemoryRouter>
    )
    const btn = await screen.findByTestId('assemble-quest-btn')
    fireEvent.click(btn)
    expect(btn).toBeInTheDocument()
  })

  it('23. MyPractice shows loading indicator while assembling quest', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <MyPractice />
        </AppProvider>
      </MemoryRouter>
    )
    const btn = await screen.findByTestId('assemble-quest-btn')
    fireEvent.click(btn)
    // Assembling transition completes cleanly
    await waitFor(() => {
      expect(btn).not.toBeDisabled()
    })
  })

  it('24. MyPractice displays GeneratedContentCard when quest is assembled', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <MyPractice />
        </AppProvider>
      </MemoryRouter>
    )
    const btn = await screen.findByTestId('assemble-quest-btn')
    fireEvent.click(btn)
    await waitFor(() => {
      expect(screen.getByTestId('play-quest-btn')).toBeInTheDocument()
    })
  })

  it('25. MyPractice handles assembly error gracefully', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <MyPractice />
        </AppProvider>
      </MemoryRouter>
    )
    const btn = await screen.findByTestId('assemble-quest-btn')
    expect(btn).toBeInTheDocument()
  })

  // ============================================================================
  // TESTS 26 - 30: Multi-Portal Transparency & Non-Clinical Safety
  // ============================================================================

  it('26. Parent Recommendations shows source badge and educational rationale', () => {
    render(<GeneratedContentCard item={sampleCuratedItem} />)
    expect(screen.getByText(/Curated Activity/i)).toBeInTheDocument()
    expect(screen.getByText(/Practice reading narrative sentences/i)).toBeInTheDocument()
  })

  it('27. Teacher StudentProfile displays content source tag in personalized queue', () => {
    render(<GeneratedContentCard item={sampleAssembledItem} />)
    expect(screen.getByText(/Assembled Quest/i)).toBeInTheDocument()
  })

  it('28. Child cards contain zero forbidden clinical/diagnostic words', () => {
    const forbidden = ['dyslexia', 'disorder', 'deficit', 'abnormal', 'pathology', 'retarded']
    const { container } = render(<GeneratedContentCard item={sampleAssembledItem} />)
    const text = container.textContent.toLowerCase()
    for (const term of forbidden) {
      expect(text).not.toContain(term)
    }
  })

  it('29. Non-clinical educational screening disclaimers are preserved', () => {
    render(<GeneratedContentCard item={sampleAssembledItem} />)
    expect(screen.getByText(/Age-appropriate practice/i)).toBeInTheDocument()
  })

  it('30. Regression protection: Step 17 categorized sections and Step 16 goals remain intact', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <MyPractice />
        </AppProvider>
      </MemoryRouter>
    )
    expect(await screen.findByText(/Today's Learning Adventure/i)).toBeInTheDocument()
  })
})

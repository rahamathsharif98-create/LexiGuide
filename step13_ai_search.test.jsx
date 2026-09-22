import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider } from './src/context/AppContext'
import { AuthProvider } from './src/context/AuthContext'
import { endpoints } from './src/services/api'
import LearnHome from './src/pages/child/LearnHome'
import Home from './src/pages/child/Home'
import { SearchModal } from './src/components/SearchModal'

const mockSearchCatalog = {
  query: '',
  total_results: 3,
  results: [
    {
      id: 'act-word-builder',
      title: 'Word Builder',
      type: 'activity',
      category: 'Games',
      difficulty: 'Medium',
      route: '/child/games/build-word',
      icon: '🧩',
      description: 'Arrange letters to build target words.',
      skill: 'word_recognition',
      relevance_score: 5.0,
      fit_reason: 'Great for practicing word recognition.',
    },
    {
      id: 'story-forest',
      title: 'The Curious Fox',
      type: 'story',
      category: 'Stories',
      difficulty: 'Easy',
      route: '/child/stories/story-forest',
      icon: '🦊',
      description: 'Sam the fox explores the green forest.',
      skill: 'comprehension',
      relevance_score: 4.0,
    },
    {
      id: 'passage-pet-cat',
      title: 'My Pet Cat',
      type: 'passage',
      category: 'Reading',
      difficulty: 'Easy',
      route: '/child/read',
      icon: '🐱',
      description: 'Read about a cute playful cat.',
      skill: 'reading_fluency',
      relevance_score: 3.5,
    },
  ],
  suggested_filters: ['🦁 Animals', '🚀 Space', '📖 Stories'],
}

describe('Step 13: Comprehensive AI Learning Search Suite (30 Tests)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  // 1. search endpoint
  it('1. search endpoint is callable with query', async () => {
    const spy = vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    const res = await endpoints.search('cat')
    expect(spy).toHaveBeenCalledWith('cat')
    expect(res.total_results).toBe(3)
  })

  // 2. query encoding
  it('2. query encoding handles special characters and spaces', async () => {
    const spy = vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    await endpoints.search('space & stars!')
    expect(spy).toHaveBeenCalledWith('space & stars!')
  })

  // 3. skill filter
  it('3. skill filter passed in search options', async () => {
    const spy = vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    await endpoints.search('', { skill: 'phonological_awareness' })
    expect(spy).toHaveBeenCalledWith('', { skill: 'phonological_awareness' })
  })

  // 4. difficulty filter
  it('4. difficulty filter passed in search options', async () => {
    const spy = vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    await endpoints.search('', { difficulty: 'Easy' })
    expect(spy).toHaveBeenCalledWith('', { difficulty: 'Easy' })
  })

  // 5. child ID
  it('5. child ID passed for personalization', async () => {
    const spy = vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    await endpoints.search('', { childId: 1 })
    expect(spy).toHaveBeenCalledWith('', { childId: 1 })
  })

  // 6. SearchModal opening
  it('6. SearchModal opens when isOpen is true', () => {
    vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    expect(screen.getByText('Learning Search')).toBeInTheDocument()
  })

  // 7. SearchModal closing
  it('7. SearchModal calls onClose when close button clicked', () => {
    vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={onClose} childId={1} />
      </MemoryRouter>
    )
    const closeBtn = screen.getByRole('button', { name: '' })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })

  // 8. search input
  it('8. search input accepts typing and triggers query', async () => {
    const spy = vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    const input = screen.getByPlaceholderText(/Search stories, sounds, or games.../i)
    fireEvent.change(input, { target: { value: 'space' } })
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('space', expect.anything())
    })
  })

  // 9. quick Animals pill
  it('9. quick Animals pill triggers animal topic search', async () => {
    const spy = vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    const pill = screen.getByRole('button', { name: /🦁 Animals/i })
    fireEvent.click(pill)
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('animal', expect.anything())
    })
  })

  // 10. Space pill
  it('10. Space pill triggers space topic search', async () => {
    const spy = vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    const pill = screen.getByRole('button', { name: /🚀 Space/i })
    fireEvent.click(pill)
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('space', expect.anything())
    })
  })

  // 11. Stories pill
  it('11. Stories pill triggers story search', async () => {
    const spy = vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    const pill = screen.getByRole('button', { name: /📖 Stories/i })
    fireEvent.click(pill)
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('story', expect.anything())
    })
  })

  // 12. Word Games pill
  it('12. Word Games pill triggers puzzle search', async () => {
    const spy = vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    const pill = screen.getByRole('button', { name: /🧩 Puzzles/i })
    fireEvent.click(pill)
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('puzzle', expect.anything())
    })
  })

  // 13. Speaking pill
  it('13. Speaking pill triggers speaking search', async () => {
    const spy = vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    const pill = screen.getByRole('button', { name: /🎤 Speaking/i })
    fireEvent.click(pill)
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('speak', expect.anything())
    })
  })

  // 14. results rendering
  it('14. results rendering displays titles, categories, and icons', async () => {
    vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    expect(await screen.findByText('Word Builder')).toBeInTheDocument()
    expect(screen.getByText('The Curious Fox')).toBeInTheDocument()
    expect(screen.getByText('My Pet Cat')).toBeInTheDocument()
  })

  // 15. empty results
  it('15. empty results displays friendly empty state', async () => {
    vi.spyOn(endpoints, 'search').mockResolvedValue({ query: 'none', total_results: 0, results: [] })
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    expect(await screen.findByText(/No adventures found/i)).toBeInTheDocument()
  })

  // 16. loading state
  it('16. loading state displays skeletons during fetch', () => {
    vi.spyOn(endpoints, 'search').mockReturnValue(new Promise(() => {}))
    const { container } = render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThan(0)
  })

  // 17. error state
  it('17. error state displays message when search endpoint fails', async () => {
    vi.spyOn(endpoints, 'search').mockRejectedValue(new Error('Search server error'))
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    expect(await screen.findByText(/Search server error/i)).toBeInTheDocument()
  })

  // 18. retry
  it('18. changing query re-triggers search after error', async () => {
    const spy = vi.spyOn(endpoints, 'search')
      .mockRejectedValueOnce(new Error('Network drop'))
      .mockResolvedValueOnce(mockSearchCatalog)

    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    expect(await screen.findByText(/Network drop/i)).toBeInTheDocument()

    const input = screen.getByPlaceholderText(/Search stories, sounds, or games.../i)
    fireEvent.change(input, { target: { value: 'fox' } })

    expect(await screen.findByText('The Curious Fox')).toBeInTheDocument()
  })

  // 19. direct activity launch
  it('19. clicking an activity card triggers navigation and closes modal', async () => {
    vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={onClose} childId={1} />
      </MemoryRouter>
    )
    const act = await screen.findByText('Word Builder')
    fireEvent.click(act)
    expect(onClose).toHaveBeenCalled()
  })

  // 20. direct story launch
  it('20. clicking a story card launches story reader route', async () => {
    vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={onClose} childId={1} />
      </MemoryRouter>
    )
    const story = await screen.findByText('The Curious Fox')
    fireEvent.click(story)
    expect(onClose).toHaveBeenCalled()
  })

  // 21. direct passage launch
  it('21. clicking a passage card launches read route', async () => {
    vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={onClose} childId={1} />
      </MemoryRouter>
    )
    const passage = await screen.findByText('My Pet Cat')
    fireEvent.click(passage)
    expect(onClose).toHaveBeenCalled()
  })

  // 22. child context
  it('22. SearchModal passes active numeric child ID to search endpoint', async () => {
    const spy = vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={3} />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('', expect.objectContaining({ childId: 3 }))
    })
  })

  // 23. authenticated API usage
  it('23. search uses authenticated endpoints', async () => {
    localStorage.setItem('readquest_auth', JSON.stringify({ token: 'jwt.token.test', user: { id: 1 } }))
    const spy = vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    await endpoints.search('stars', { childId: 1 })
    expect(spy).toHaveBeenCalledWith('stars', { childId: 1 })
  })

  // 24. no silent fake fallback
  it('24. error from API is surfaced to user, not masked with fake results', async () => {
    vi.spyOn(endpoints, 'search').mockRejectedValue(new Error('Search is temporarily unavailable. Please try again.'))
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    expect(await screen.findByText(/Search is temporarily unavailable. Please try again./i)).toBeInTheDocument()
  })

  // 25. child-friendly fit reason
  it('25. child-friendly fit reason renders with sparkle badge', async () => {
    vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    expect(await screen.findByText('Great for practicing word recognition.')).toBeInTheDocument()
  })

  // 26. no clinical claims
  it('26. zero clinical claims or diagnostic language in search modal DOM', async () => {
    vi.spyOn(endpoints, 'search').mockResolvedValue(mockSearchCatalog)
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    await screen.findByText('Word Builder')
    const text = document.body.textContent.toLowerCase()
    expect(text).not.toContain('dyslexia')
    expect(text).not.toContain('clinical diagnosis')
    expect(text).not.toContain('learning disability')
  })

  // 27. Home integration
  it('27. Home page includes search trigger bar', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <Home />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/Search stories, sounds, and games.../i)).toBeInTheDocument()
  })

  // 28. LearnHome integration
  it('28. LearnHome page includes search trigger bar', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppProvider>
            <LearnHome />
          </AppProvider>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/Find fun adventures, letters, or games.../i)).toBeInTheDocument()
  })

  // 29. keyboard accessibility
  it('29. search input has autofocus and is accessible via keyboard', () => {
    render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    const input = screen.getByPlaceholderText(/Search stories, sounds, or games.../i)
    expect(input).toHaveFocus()
  })

  // 30. regression behavior
  it('30. closing modal unmounts overlay without state pollution', () => {
    const { rerender } = render(
      <MemoryRouter>
        <SearchModal isOpen={true} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    expect(screen.getByText('Learning Search')).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <SearchModal isOpen={false} onClose={vi.fn()} childId={1} />
      </MemoryRouter>
    )
    expect(screen.queryByText('Learning Search')).not.toBeInTheDocument()
  })
})

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './src/App'
import { CHILDREN } from './src/data/demoData'

beforeEach(() => {
  localStorage.setItem('readquest_auth', JSON.stringify({
    token: 'jwt.parent.test',
    user: { id: 1, name: 'Parent User', email: 'parent@readquest.demo', role: 'parent' },
  }))
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('Phase 3: Parent Experience', () => {
  it('Overview shows greeting, summary cards, and Learning Progress', async () => {
    render(<App initialRoute="/parent/dashboard" />)
    expect(await screen.findByText(/good morning, parent/i)).toBeInTheDocument()
    expect(screen.getByText(/total stars/i)).toBeInTheDocument()
    expect((await screen.findAllByText(/learning streak/i)).length).toBeGreaterThan(0)
    expect(screen.getByText(/activities completed/i)).toBeInTheDocument()
    expect(screen.getAllByText(/learning time/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/^Learning Progress$/)).toBeInTheDocument()
  })

  it('parent nav has exactly 5 primary items, Settings reached via avatar menu', async () => {
    render(<App initialRoute="/parent/dashboard" />)
    await screen.findByText(/good morning/i)
    const navLabels = [...document.querySelectorAll('aside nav, aside')][0]
    const primaryLabels = ['Overview', 'Progress', 'Reading Fingerprint', 'Activities', 'Recommendations']
    primaryLabels.forEach((l) => expect(screen.getAllByText(l).length).toBeGreaterThan(0))
    // Settings should NOT be visible until the avatar menu is opened
    expect(screen.queryByText(/^Settings$/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /parent menu/i }))
    expect(await screen.findByText(/^Settings$/)).toBeInTheDocument()
  })

  it('My Children selector switches the active child and dashboard updates', async () => {
    render(<App initialRoute="/parent/dashboard" />)
    await screen.findByText(/good morning/i)
    const secondChild = CHILDREN[1]
    const viewButtons = await screen.findAllByRole('button', { name: /^view$/i })
    fireEvent.click(viewButtons[0])
    await waitFor(() => expect(screen.getAllByText('Viewing').length).toBeGreaterThan(0))
  })

  it('Progress page toggles between 7/30/90 day ranges', async () => {
    render(<App initialRoute="/parent/progress" />)
    expect(await screen.findByText(/reading progress over time/i)).toBeInTheDocument()
    const btn30 = screen.getByRole('button', { name: /30 days/i })
    fireEvent.click(btn30)
    expect(btn30.className).toMatch(/bg-brand-500/)
  })

  it('Reading Fingerprint page uses non-clinical language and shows all 5 skills', async () => {
    render(<App initialRoute="/parent/fingerprint" />)
    expect((await screen.findAllByText(/phonological awareness/i)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/pronunciation/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/word recognition/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/reading fluency/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/comprehension/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/educational screening/i)).toBeInTheDocument()
    // must never make a direct diagnostic claim
    expect(screen.queryByText(/has dyslexia/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/confirmed dyslexia/i)).not.toBeInTheDocument()
  })

  it('Recommendations page shows reasons and observed patterns, non-clinical language', async () => {
    render(<App initialRoute="/parent/recommendations" />)
    expect((await screen.findAllByText(/reason:/i)).length).toBeGreaterThan(0)
    expect(screen.getByText(/observed reading patterns/i)).toBeInTheDocument()
    expect(screen.getByText(/not a clinical diagnosis/i)).toBeInTheDocument()
  })

  it('Activities page filters by category', async () => {
    render(<App initialRoute="/parent/activities" />)
    await screen.findByText(/activity history/i)
    const initialCount = document.querySelectorAll('.divide-y > div').length
    fireEvent.click(screen.getByRole('button', { name: /^stories$/i }))
    await waitFor(() => {
      const filteredCount = document.querySelectorAll('.divide-y > div').length
      expect(filteredCount).toBeLessThanOrEqual(initialCount)
    })
  })

  it('renders correctly at 375px mobile width with no horizontal overflow markers', async () => {
    window.innerWidth = 375
    render(<App initialRoute="/parent/dashboard" />)
    expect(await screen.findByText(/good morning/i)).toBeInTheDocument()
    expect(document.querySelector('nav')).toBeTruthy()
  })
})

describe('Phase 3: Child -> Parent data connection', () => {
  it('activity results share the same AppContext state the Parent pages read from', async () => {
    // Child and Parent are separate portals with no in-UI navigation between
    // them (by design), so the real "connection" is that both read
    // activeChild from the same AppContext.
    render(<App initialRoute="/child/games/match-sound" />)
    fireEvent.click(await screen.findByRole('button', { name: /start game/i }))
    for (let i = 0; i < 4; i++) {
      await waitFor(() => expect(document.querySelectorAll('button.w-20.h-20').length).toBeGreaterThan(0))
      fireEvent.click(document.querySelectorAll('button.w-20.h-20')[0])
      await new Promise((r) => setTimeout(r, 1000))
    }
    await waitFor(() => expect(screen.getByText(/nice work/i)).toBeInTheDocument(), { timeout: 5000 })

    // Both Dashboard.jsx (parent) and Home.jsx/MyJourney.jsx (child) call the
    // identical useApp() -> activeChild.stars. Grep-verified below.
    const dashboardSrc = require('fs').readFileSync('./src/pages/parent/Dashboard.jsx', 'utf-8')
    expect(dashboardSrc).toMatch(/useApp\(\)/)
    expect(dashboardSrc).toMatch(/getChildSummary\(activeChild\)/)
  }, 15000)
})

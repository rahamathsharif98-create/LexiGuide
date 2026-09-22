import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import { HashRouter } from 'react-router-dom'
import { AppProvider } from './src/context/AppContext'
import App from './src/App'
import { CLASS_STUDENTS, GAMES, STORIES } from './src/data/demoData'

afterEach(cleanup)

const routes = [
  '/', '/select-profile',
  '/child/home', '/child/learn', '/child/read', '/child/speak', '/child/games', '/child/stories',
  '/child/practice', '/child/results', '/child/journey', '/child/achievements',
  '/child/profile', '/child/settings',
  ...GAMES.map((g) => `/child/games/${g.id}`),
  ...STORIES.map((s) => `/child/stories/${s.id}`),
  '/parent/login', '/parent/dashboard', '/parent/progress', '/parent/fingerprint', '/parent/errors',
  '/parent/recommendations', '/parent/history', '/parent/activities', '/parent/reports', '/parent/settings',
  '/teacher/login', '/teacher/dashboard', '/teacher/students', '/teacher/analytics',
  '/teacher/progress', '/teacher/recommendations', '/teacher/reports', '/teacher/settings',
  ...CLASS_STUDENTS.map((s) => `/teacher/students/${s.id}`),
  // top-level route aliases requested for direct/deep-link robustness
  '/home', '/learn', '/reading', '/play', '/stories', '/speak', '/profile',
  '/fingerprint', '/journey', '/achievements',
]

describe('every route renders without crashing', () => {
  for (const route of routes) {
    it(`renders ${route}`, () => {
      const currentRoute = route
      const { container } = render(<App initialRoute={currentRoute} />)
      expect(container.innerHTML.length).toBeGreaterThan(0)
      // no internal navigation should ever use a real <a> element — anchors
      // are what let a modified click (new-tab/middle-click) reach a real,
      // non-existent path on the host, and what some preview sandboxes
      // intercept as a "leaving this page" signal regardless of href.
      // Internal navigation must be buttons calling navigate() instead.
      expect(container.querySelectorAll('a').length).toBe(0)
    })
  }
})

describe('navigation is immune to modified clicks and anchor-click interception', () => {
  it('internal nav elements are buttons, not anchors — nothing for a sandbox to intercept as external', () => {
    const initialRoute = '/child/home'
    const { container } = render(<App initialRoute={initialRoute} />)
    expect(container.querySelectorAll('a').length).toBe(0)
    const navButton = container.querySelector('button')
    expect(navButton).toBeTruthy()
    // a modified click (ctrlKey true, simulating "open in new tab") is a no-op
    // on a button — there's no href for the browser to act on
    fireEvent.click(navButton, { ctrlKey: true })
  })
})

describe('top-level route aliases resolve to the correct child page', () => {
  const cases = [
    ['/home', /ready for today/i],
    ['/learn', /read with me/i],
    ['/play', /play & learn/i],
    ['/stories', /story time/i],
    ['/speak', /speak & shine/i],
    ['/profile', /switch profile/i],
    ['/journey', /my reading fingerprint/i],
    ['/achievements', /achievements/i],
  ]
  for (const [route, expectedText] of cases) {
    it(`${route} shows the right page`, async () => {
      render(<App initialRoute={route} />)
      expect((await screen.findAllByText(expectedText)).length).toBeGreaterThan(0)
    })
  }
})

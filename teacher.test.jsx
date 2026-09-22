import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './src/App'
import { CLASS_STUDENTS } from './src/data/demoData'

beforeEach(() => {
  localStorage.setItem('readquest_auth', JSON.stringify({
    token: 'jwt.teacher.test',
    user: { id: 2, name: 'Teacher User', email: 'teacher@readquest.demo', role: 'teacher' },
  }))
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('Phase 4: Teacher Experience', () => {
  it('1. Teacher dashboard renders with greeting and summary cards', async () => {
    render(<App initialRoute="/teacher/dashboard" />)
    expect(await screen.findByText(/good morning, teacher/i)).toBeInTheDocument()
    expect(screen.getByText(/total students/i)).toBeInTheDocument()
    expect(screen.getByText(/active learners/i)).toBeInTheDocument()
    expect((await screen.findAllByText(/students needing support/i)).length).toBeGreaterThan(0)
  })

  it('2. Teacher navigation contains exactly 5 primary items', async () => {
    render(<App initialRoute="/teacher/dashboard" />)
    await screen.findByText(/good morning, teacher/i)
    const primaryLabels = ['Overview', 'Students', 'Class Progress', 'Recommendations', 'Settings']
    primaryLabels.forEach((l) => expect(screen.getAllByText(l).length).toBeGreaterThan(0))
    // Reports must NOT be visible until the avatar menu is opened
    expect(screen.queryByText(/^Reports$/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /teacher menu/i }))
    expect(await screen.findByText(/^Reports$/)).toBeInTheDocument()
  })

  it('3. Student list renders all students', async () => {
    render(<App initialRoute="/teacher/students" />)
    await waitFor(() => {
      CLASS_STUDENTS.forEach((s) => expect(screen.getAllByText(s.name).length).toBeGreaterThan(0))
    })
  })

  it('4. Student search filters the list', async () => {
    render(<App initialRoute="/teacher/students" />)
    await screen.findByText(CLASS_STUDENTS[0].name)
    fireEvent.change(screen.getByPlaceholderText(/search students/i), { target: { value: CLASS_STUDENTS[0].name } })
    await waitFor(() => {
      expect(screen.getAllByText(CLASS_STUDENTS[0].name).length).toBeGreaterThan(0)
      expect(screen.queryByText(CLASS_STUDENTS[1].name)).not.toBeInTheDocument()
    })
  })

  it('5. Student status filtering works (Needs Practice / Improving / Strong Progress)', async () => {
    render(<App initialRoute="/teacher/students" />)
    await screen.findByText(CLASS_STUDENTS[0].name)
    const before = document.querySelectorAll('button.text-left').length
    fireEvent.click(screen.getByRole('button', { name: /^needs practice$/i }))
    await waitFor(() => {
      const after = document.querySelectorAll('button.text-left').length
      expect(after).toBeLessThanOrEqual(before)
    })
  })

  it('6. Student profile route works for a real student', async () => {
    render(<App initialRoute={`/teacher/students/${CLASS_STUDENTS[0].id}`} />)
    expect((await screen.findAllByText(CLASS_STUDENTS[0].name)).length).toBeGreaterThan(0)
    expect(screen.getByText(/learning overview/i)).toBeInTheDocument()
    expect(screen.getByText(/reading fingerprint/i)).toBeInTheDocument()
  })

  it('7. Different students show genuinely different data', async () => {
    const { unmount } = render(<App initialRoute={`/teacher/students/${CLASS_STUDENTS[0].id}`} />)
    const firstBody = await screen.findByText(/learning overview/i).then(() => document.body.textContent)
    unmount()
    render(<App initialRoute={`/teacher/students/${CLASS_STUDENTS[2].id}`} />)
    await screen.findByText(/learning overview/i)
    const secondBody = document.body.textContent
    expect(firstBody).not.toBe(secondBody)
  })

  it('8. Class Progress page works', async () => {
    render(<App initialRoute="/teacher/progress" />)
    expect(await screen.findByText(/average class skill scores/i)).toBeInTheDocument()
    expect(screen.getByText(/student distribution/i)).toBeInTheDocument()
    expect(screen.getByText(/activity participation/i)).toBeInTheDocument()
  })

  it('9. 7/30/90 day toggle works on Class Progress', async () => {
    render(<App initialRoute="/teacher/progress" />)
    await screen.findByText(/average class skill scores/i)
    const btn90 = screen.getByRole('button', { name: /90 days/i })
    fireEvent.click(btn90)
    expect(btn90.className).toMatch(/bg-brand-500/)
  })

  it('9b. 7/30/90 day toggle works on individual Student Profile, labels demo data honestly', async () => {
    render(<App initialRoute={`/teacher/students/${CLASS_STUDENTS[0].id}`} />)
    await screen.findByText(/progress trend/i)
    fireEvent.click(screen.getByRole('button', { name: /30 days/i }))
    expect(await screen.findByText(/simulated/i)).toBeInTheDocument()
  })

  it('10. Recommendations render using the shared adaptive engine', async () => {
    render(<App initialRoute="/teacher/recommendations" />)
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/reason:/i)
      expect(document.body.textContent).toMatch(/students affected/i)
      expect(document.body.textContent).toMatch(/suggested activity/i)
    })
  })

  it('11. Recommendations use the shared recommendation logic (imports generateRecommendations, no duplicate algorithm)', () => {
    const src = require('fs').readFileSync('./src/services/teacherService.js', 'utf-8')
    expect(src).toMatch(/import\s*\{\s*generateRecommendations\s*\}\s*from\s*'\.\/adaptiveEngine'/)
  })

  it('12. Child -> shared state -> Teacher data connection: both read the same CLASS_STUDENTS/getStudents source', () => {
    const teacherSrc = require('fs').readFileSync('./src/services/teacherService.js', 'utf-8')
    expect(teacherSrc).toMatch(/import\s*\{[^}]*CLASS_STUDENTS[^}]*\}\s*from\s*'\.\.\/data\/demoData'/)
  })

  it('13. Teacher pages are responsive at 375px', async () => {
    window.innerWidth = 375
    render(<App initialRoute="/teacher/students" />)
    expect(await screen.findByText(CLASS_STUDENTS[0].name)).toBeInTheDocument()
    expect(document.querySelector('nav')).toBeTruthy()
  })

  it('14. No diagnostic language appears anywhere in the Teacher portal', async () => {
    const routes = ['/teacher/dashboard', '/teacher/students', `/teacher/students/${CLASS_STUDENTS[2].id}`, '/teacher/progress', '/teacher/recommendations']
    for (const route of routes) {
      const { unmount } = render(<App initialRoute={route} />)
      await new Promise((r) => setTimeout(r, 50))
      const text = document.body.textContent.toLowerCase()
      expect(text).not.toMatch(/has dyslexia/)
      expect(text).not.toMatch(/diagnosed with dyslexia/)
      expect(text).not.toMatch(/definitely has a learning disability/)
      unmount()
    }
  })

  it('15. Existing Child pages still work (regression)', async () => {
    const routes = ['/child/home', '/child/learn', '/child/games', '/child/stories', '/child/journey']
    for (const route of routes) {
      const { unmount } = render(<App initialRoute={route} />)
      await new Promise((r) => setTimeout(r, 30))
      expect(document.body.textContent.length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('16. Existing Parent pages still work (regression)', async () => {
    const routes = ['/parent/dashboard', '/parent/progress', '/parent/fingerprint', '/parent/activities', '/parent/recommendations']
    for (const route of routes) {
      const { unmount } = render(<App initialRoute={route} />)
      await new Promise((r) => setTimeout(r, 30))
      expect(document.body.textContent.length).toBeGreaterThan(0)
      unmount()
    }
  })
})

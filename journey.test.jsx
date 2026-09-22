import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './src/App'
import { SPEAK_WORDS } from './src/data/demoData'

afterEach(cleanup)

describe('core child journey', () => {
  it('Read With Me: select -> intro -> record -> analyze -> results -> next activity', async () => {
    const initialRoute = '/child/read'
    render(<App initialRoute={initialRoute} />)

    // select a passage
    fireEvent.click((await screen.findAllByText(/my pet cat/i))[0])
    // story intro screen
    fireEvent.click(await screen.findByRole('button', { name: /i'm ready to read/i }))

    // recording
    fireEvent.click(await screen.findByRole('button', { name: /start recording/i }))
    fireEvent.click(await screen.findByRole('button', { name: /^⏹ stop$/i }))

    await waitFor(() => expect(screen.getByText(/great job/i)).toBeInTheDocument(), { timeout: 8000 })
    // recommended "try this next" card should be present
    expect(screen.getByText(/try this next/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => expect(screen.getByText(/amazing/i)).toBeInTheDocument())
  }, 15000)

  it('Speak & Shine: cycles through multiple words with retry and next', async () => {
    const initialRoute = '/child/speak'
    render(<App initialRoute={initialRoute} />)

    expect(screen.getByText(/say this word/i)).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: /start recording/i }))
    fireEvent.click(await screen.findByRole('button', { name: /stop recording/i }))
    await waitFor(() => expect(screen.getByText(/nice try/i)).toBeInTheDocument(), { timeout: 5000 })

    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
    await waitFor(() => expect(screen.getByText(SPEAK_WORDS[1].word)).toBeInTheDocument())
  }, 15000)

  it('Sound Safari (game): shows live score, hint, and finishes with next activity', async () => {
    const initialRoute = '/child/games/match-sound'
    render(<App initialRoute={initialRoute} />)
    fireEvent.click(await screen.findByRole('button', { name: /start game/i }))

    // score starts as 4 empty stars, none filled
    const roundLabel = await screen.findByText(/round 1 of 4/i)
    expect(roundLabel).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /need a hint/i }))
    expect(screen.getByText(/listen for the very first sound/i)).toBeInTheDocument()

    for (let i = 0; i < 4; i++) {
      await waitFor(() => expect(document.querySelectorAll('button.w-20.h-20').length).toBeGreaterThan(0))
      const optionButtons = document.querySelectorAll('button.w-20.h-20')
      fireEvent.click(optionButtons[0])
      await new Promise((r) => setTimeout(r, 1000))
    }
    await waitFor(() => expect(screen.getByText(/nice work/i)).toBeInTheDocument(), { timeout: 5000 })
    expect(screen.getByText(/try this next/i)).toBeInTheDocument()
  }, 20000)

  it('Story: intro -> Read mode -> Continue -> questions -> results with recommended practice', async () => {
    const initialRoute = '/child/stories/story-forest'
    render(<App initialRoute={initialRoute} />)

    fireEvent.click(await screen.findByRole('button', { name: /^read$/i }))
    for (let i = 0; i < 4; i++) {
      fireEvent.click(await screen.findByRole('button', { name: /next/i }))
    }
    fireEvent.click(await screen.findByRole('button', { name: /continue/i }))

    for (let i = 0; i < 3; i++) {
      const options = await screen.findAllByRole('button')
      const answerButtons = options.filter((b) => b.className.includes('rounded-2xl bg-slate-50'))
      if (answerButtons.length === 0) break
      fireEvent.click(answerButtons[0])
      await new Promise((r) => setTimeout(r, 700))
    }
    await waitFor(() => expect(screen.getByText(/story complete/i)).toBeInTheDocument(), { timeout: 5000 })
  }, 15000)

  it('My Reading Fingerprint: shows next best activity linking to a real route', async () => {
    const initialRoute = '/child/journey'
    render(<App initialRoute={initialRoute} />)
    expect(await screen.findByText(/next best activity/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /play now/i })).toBeInTheDocument()
  })
})

describe('Phase 2 additions', () => {
  it('Learn Home shows a picked-for-you recommendation and all 4 categories', async () => {
    render(<App initialRoute="/child/learn" />)
    expect(await screen.findByText(/picked for you/i)).toBeInTheDocument()
    expect(screen.getByText(/🔤 Sounds/i)).toBeInTheDocument()
    expect(screen.getByText(/📖 Reading/i)).toBeInTheDocument()
    expect(screen.getByText(/🗣️ Speaking/i)).toBeInTheDocument()
    expect(screen.getByText(/🧠 Understanding/i)).toBeInTheDocument()
  })

  it('Learn Home category tile navigates to the right activity', async () => {
    render(<App initialRoute="/child/learn" />)
    fireEvent.click(await screen.findByText(/word builder/i))
    expect(await screen.findByText(/start game/i)).toBeInTheDocument()
  })

  it('Speak & Shine has at least 10 words in the bank', () => {
    expect(SPEAK_WORDS.length).toBeGreaterThanOrEqual(10)
  })

  it('Word Builder: full playthrough reaches finish screen', async () => {
    render(<App initialRoute="/child/games/build-word" />)
    fireEvent.click(await screen.findByRole('button', { name: /start game/i }))
    for (let round = 0; round < 4; round++) {
      // read the target word's letters from the visible letter tiles by
      // clicking them in an order that is very likely correct: use the
      // scrambled tile order as-is is not guaranteed correct, so instead
      // click letters matching the word length in order shown in the blanks
      await waitFor(() => expect(document.querySelectorAll('button.w-12.h-12').length).toBeGreaterThan(0))
      // Just click tiles until the round advances (round completes on wrong OR right answer)
      const tiles = [...document.querySelectorAll('button.w-12.h-12')]
      for (const tile of tiles.slice(0, 4)) {
        if (!tile.disabled) fireEvent.click(tile)
      }
      await new Promise((r) => setTimeout(r, 1000))
    }
    await waitFor(() => expect(screen.getByText(/nice work/i)).toBeInTheDocument(), { timeout: 5000 })
  }, 20000)

  it('Picture Match: full playthrough reaches finish screen', async () => {
    render(<App initialRoute="/child/games/picture-word" />)
    fireEvent.click(await screen.findByRole('button', { name: /start game/i }))
    for (let round = 0; round < 3; round++) {
      await waitFor(() => expect(document.querySelectorAll('button.bg-peach-100').length).toBeGreaterThan(0))
      fireEvent.click(document.querySelectorAll('button.bg-peach-100')[0])
      await new Promise((r) => setTimeout(r, 1000))
    }
    await waitFor(() => expect(screen.getByText(/nice work/i)).toBeInTheDocument(), { timeout: 5000 })
  }, 15000)

  it('Letter Detective (find-sound): full playthrough reaches finish screen', async () => {
    render(<App initialRoute="/child/games/find-sound" />)
    fireEvent.click(await screen.findByRole('button', { name: /start game/i }))
    for (let round = 0; round < 3; round++) {
      const checkBtn = await screen.findByRole('button', { name: /check answer/i })
      expect(checkBtn).toBeDisabled() // nothing selected yet
      // click exactly two word-option buttons, scoped to the round content
      // card by their distinctive rounded pill classes (not nav buttons)
      const wordButtons = [...document.querySelectorAll('button.rounded-xl.font-display.font-semibold')]
      expect(wordButtons.length).toBeGreaterThan(0)
      wordButtons.slice(0, 2).forEach((b) => fireEvent.click(b))
      fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
      await new Promise((r) => setTimeout(r, 1000))
    }
    await waitFor(() => expect(screen.getByText(/nice work/i)).toBeInTheDocument(), { timeout: 5000 })
  }, 15000)

  it('completing an activity updates stars visible on My Journey (same session, real navigation)', async () => {
    render(<App initialRoute="/child/games/match-sound" />)
    fireEvent.click(await screen.findByRole('button', { name: /start game/i }))
    for (let i = 0; i < 4; i++) {
      await waitFor(() => expect(document.querySelectorAll('button.w-20.h-20').length).toBeGreaterThan(0))
      fireEvent.click(document.querySelectorAll('button.w-20.h-20')[0])
      await new Promise((r) => setTimeout(r, 1000))
    }
    await waitFor(() => expect(screen.getByText(/nice work/i)).toBeInTheDocument(), { timeout: 5000 })

    // navigate to Results (in-app, same render tree — state persists)
    fireEvent.click(screen.getByRole('button', { name: /see results/i }))
    await waitFor(() => expect(screen.getByText(/amazing/i)).toBeInTheDocument())

    // follow the real "See My Journey" link, still same session
    fireEvent.click(screen.getByText(/see my journey/i))
    await waitFor(() => expect(screen.getByText(/my reading journey/i)).toBeInTheDocument())

    // Aarav's demo baseline is 342 stars — after a completed game it must be higher
    const starsValue = [...document.querySelectorAll('span.font-display.font-extrabold')]
      .find((el) => /^\d+$/.test(el.textContent.trim()))
    expect(starsValue).toBeTruthy()
    expect(Number(starsValue.textContent)).toBeGreaterThan(342)
  }, 15000)
})

describe('Phase 2, item 18: the complete final child journey', () => {
  it('Select Profile -> Home -> Recommendation -> Read With Me -> Record -> Result -> Stars+XP -> My Journey -> New Recommendation -> Second Activity, no page refresh', async () => {
    render(<App initialRoute="/select-profile" />)

    // Select Profile -> Home
    fireEvent.click((await screen.findAllByText(/level/i))[0])
    expect(await screen.findByText(/ready for today/i)).toBeInTheDocument()

    // Personalized recommendation visible on Home
    expect(screen.getByText(/made just for you/i)).toBeInTheDocument()

    // Go to Read With Me via the deterministic "Read" choice tile
    // (the "Continue Learning" card now shows the adaptive engine's top
    // pick, which can be any activity — a legitimate Phase 9 feature, not
    // a fixed Read With Me shortcut anymore)
    fireEvent.click(screen.getByText('Read'))
    fireEvent.click((await screen.findAllByText(/my pet cat/i))[0])
    fireEvent.click(await screen.findByRole('button', { name: /i'm ready to read/i }))
    fireEvent.click(await screen.findByRole('button', { name: /start recording/i }))
    fireEvent.click(await screen.findByRole('button', { name: /^⏹ stop$/i }))
    await waitFor(() => expect(screen.getByText(/great job/i)).toBeInTheDocument(), { timeout: 8000 })

    // Result -> Stars + XP
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => expect(screen.getByText(/amazing/i)).toBeInTheDocument())
    expect(screen.getByText(/xp/i)).toBeInTheDocument()

    // My Journey — updated skill visible
    fireEvent.click(screen.getByText(/see my journey/i))
    await waitFor(() => expect(screen.getByText(/my reading journey/i)).toBeInTheDocument())

    // New recommendation (Next Best Activity) -> Second Activity, all without a page refresh
    const playNow = screen.getByRole('button', { name: /play now/i })
    expect(playNow).toBeInTheDocument()
    fireEvent.click(playNow)
    // lands on some real second activity screen (game, read, or speak)
    await waitFor(() => {
      const body = document.body.textContent
      expect(/start game|read with me|say this word/i.test(body)).toBe(true)
    })
  }, 20000)
})

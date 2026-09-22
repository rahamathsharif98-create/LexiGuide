import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  LEXI_VOICE_SETTINGS,
  LEXI_PHRASE_LIBRARY,
  findLexiCompanionVoice,
  getLexiCompanionReport,
} from '../services/lexiVoiceConfig'
import {
  speakLanguageAudio,
  speakPacedUtterance,
  getLanguageAwareVoice,
  getVoiceEngineDetails,
} from '../services/multilingualVoiceService'

describe('LexiGuide Indian Companion Voice & Multilingual Audio Experience', () => {
  let createdUtterances = []
  let mockSpeak
  let mockCancel
  let mockVoices

  beforeEach(() => {
    createdUtterances = []
    mockSpeak = vi.fn()
    mockCancel = vi.fn()
    mockVoices = [
      { name: 'Microsoft Heera - English (India)', lang: 'en-IN' },
      { name: 'Microsoft Kalpana - Hindi (India)', lang: 'hi-IN' },
      { name: 'Microsoft Chitra - Telugu (India)', lang: 'te-IN' },
      { name: 'David - English (United States)', lang: 'en-US' },
    ]

    class MockUtterance {
      constructor(text) {
        this.text = text
        this.rate = 1
        this.pitch = 1
        this.lang = ''
        this.voice = null
        this.onend = null
        this.onerror = null
        createdUtterances.push(this)
      }
    }

    window.SpeechSynthesisUtterance = MockUtterance
    window.speechSynthesis = {
      speak: mockSpeak,
      cancel: mockCancel,
      getVoices: vi.fn(() => mockVoices),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('1. Voice settings define unhurried child pacing (rate 0.85-0.88) and sweet pitch (1.05)', () => {
    expect(LEXI_VOICE_SETTINGS.BASE_RATE).toBe(0.88)
    expect(LEXI_VOICE_SETTINGS.READING_RATE).toBe(0.85)
    expect(LEXI_VOICE_SETTINGS.WORD_RATE).toBe(0.82)
    expect(LEXI_VOICE_SETTINGS.PITCH).toBe(1.05)
    expect(LEXI_VOICE_SETTINGS.MICRO_PAUSE_MS).toBeGreaterThanOrEqual(280)
    expect(LEXI_VOICE_SETTINGS.SUPPORTED_LOCALES).toEqual({
      en: 'en-IN',
      hi: 'hi-IN',
      te: 'te-IN',
    })
  })

  it('2. Phrase library contains all 6 emotional states for English, Hindi, and Telugu', () => {
    const langs = ['en', 'hi', 'te']
    const requiredStates = ['welcome', 'instruction', 'encouragement', 'success', 'retry', 'processing']

    langs.forEach((l) => {
      const lib = LEXI_PHRASE_LIBRARY[l]
      expect(lib).toBeDefined()
      requiredStates.forEach((state) => {
        expect(lib[state]).toBeDefined()
      })
    })

    // English authentic phrasing
    expect(LEXI_PHRASE_LIBRARY.en.welcome[0]).toContain('Welcome back')
    expect(LEXI_PHRASE_LIBRARY.en.retry[0]).toContain('Almost there')

    // Hindi authentic phrasing
    expect(LEXI_PHRASE_LIBRARY.hi.welcome[0]).toContain('नमस्ते! वापस आने के लिए स्वागत है')
    expect(LEXI_PHRASE_LIBRARY.hi.success[0]).toContain('बहुत बढ़िया')

    // Telugu authentic phrasing
    expect(LEXI_PHRASE_LIBRARY.te.welcome[0]).toContain('హాయ్! మళ్లీ వచ్చినందుకు స్వాగతం')
    expect(LEXI_PHRASE_LIBRARY.te.success[0]).toContain('చాలా బాగుంది')
  })

  it('3. Selects natural Indian English (Heera), Hindi (Kalpana), and Telugu (Chitra) voices', () => {
    const enVoice = findLexiCompanionVoice(mockVoices, 'en')
    expect(enVoice.name).toContain('Heera')
    expect(enVoice.lang).toBe('en-IN')

    const hiVoice = findLexiCompanionVoice(mockVoices, 'hi')
    expect(hiVoice.name).toContain('Kalpana')
    expect(hiVoice.lang).toBe('hi-IN')

    const teVoice = findLexiCompanionVoice(mockVoices, 'te')
    expect(teVoice.name).toContain('Chitra')
    expect(teVoice.lang).toBe('te-IN')
  })

  it('4. Correctly reports Indian companion voice diagnostics', () => {
    const report = getLexiCompanionReport(mockVoices, 'en')
    expect(report.isIndianEnglish).toBe(true)
    expect(report.targetLocale).toBe('en-IN')
    expect(report.matchedVoiceName).toContain('Heera')
    expect(report.speakingRate).toBe(0.88)
    expect(report.pitch).toBe(1.05)
  })

  it('5. speakLanguageAudio applies Indian English voice, rate 0.88, and pitch 1.05', () => {
    speakLanguageAudio({ text: 'Welcome back, little explorer!', lang: 'en' })
    expect(createdUtterances.length).toBe(1)
    const utt = createdUtterances[0]
    expect(utt.text).toBe('Welcome back, little explorer!')
    expect(utt.lang).toBe('en-IN')
    expect(utt.rate).toBe(0.88)
    expect(utt.pitch).toBe(1.05)
    expect(utt.voice.name).toContain('Heera')
  })

  it('6. speakPacedUtterance breaks phrases into chunks with micro-pauses', async () => {
    vi.useFakeTimers()
    const chunkStarts = []
    let completed = false

    speakPacedUtterance({
      phrases: ['Listen carefully.', 'Now, say it with me.'],
      lang: 'en',
      pauseMs: 300,
      onChunkStart: (idx, text) => chunkStarts.push({ idx, text }),
      onEnd: () => { completed = true },
    })

    // First chunk starts immediately
    expect(chunkStarts.length).toBe(1)
    expect(chunkStarts[0].text).toBe('Listen carefully.')

    // Simulate first utterance end
    if (createdUtterances[0].onend) createdUtterances[0].onend()

    // Fast-forward pause
    vi.advanceTimersByTime(300)

    // Second chunk starts
    expect(chunkStarts.length).toBe(2)
    expect(chunkStarts[1].text).toBe('Now, say it with me.')

    // Simulate second utterance end
    if (createdUtterances[1].onend) createdUtterances[1].onend()

    expect(completed).toBe(true)
    vi.useRealTimers()
  })
})

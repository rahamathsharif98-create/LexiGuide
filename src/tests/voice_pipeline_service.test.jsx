import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getVoicePipelineCapabilities,
  findBestVoiceForLanguage,
  speakMultilingual,
  evaluatePronunciation,
} from '../services/voicePipelineService'

describe('Part 4: Voice Pipeline Service (Telugu, Hindi, English)', () => {
  let mockVoices = []

  beforeEach(() => {
    mockVoices = [
      { name: 'Telugu India Voice', lang: 'te-IN' },
      { name: 'Hindi India Voice', lang: 'hi-IN' },
      { name: 'English US Voice', lang: 'en-US' },
    ]

    class MockUtterance {
      constructor(text) {
        this.text = text
        this.rate = 1
        this.pitch = 1
        this.lang = ''
        this.voice = null
      }
    }
    window.SpeechSynthesisUtterance = MockUtterance
    window.speechSynthesis = {
      speak: vi.fn((utt) => {
        if (utt.onend) utt.onend()
      }),
      cancel: vi.fn(),
      getVoices: vi.fn(() => mockVoices),
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue({}) },
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('1. Honestly detects capabilities and local voices without fabricating neural AI', () => {
    const caps = getVoicePipelineCapabilities()
    expect(caps.pipeline_mode).toBe('browser_native')
    expect(caps.tts_available).toBe(true)
    expect(caps.mic_ready).toBe(true)
    expect(caps.voice_support.te).toBe(true)
    expect(caps.voice_support.hi).toBe(true)
    expect(caps.voice_support.en).toBe(true)
    expect(caps.honest_label).toBe('Local Device Speech Engine')
  })

  it('2. Finds best native voice matching Telugu and Hindi locales', () => {
    const teVoice = findBestVoiceForLanguage('te')
    expect(teVoice).toBeDefined()
    expect(teVoice.lang).toBe('te-IN')

    const hiVoice = findBestVoiceForLanguage('hi')
    expect(hiVoice).toBeDefined()
    expect(hiVoice.lang).toBe('hi-IN')

    const enVoice = findBestVoiceForLanguage('en')
    expect(enVoice).toBeDefined()
    expect(enVoice.lang).toBe('en-US')
  })

  it('3. Speaks multilingual text with audio ducking and voice assignment', async () => {
    const result = await speakMultilingual('అమ్మ', 'te', { rate: 0.8 })
    expect(result.success).toBe(true)
    expect(window.speechSynthesis.speak).toHaveBeenCalled()
  })

  it('4. Evaluates pronunciation accuracy with Levenshtein similarity and child-friendly praise', () => {
    // Exact match in Telugu
    const exactTe = evaluatePronunciation('అమ్మ', 'అమ్మ', 'te')
    expect(exactTe.isMatch).toBe(true)
    expect(exactTe.accuracyScore).toBe(100)
    expect(exactTe.feedback).toContain('బాగుంది')

    // Close match in Hindi
    const closeHi = evaluatePronunciation('कमल', 'कमल', 'hi')
    expect(closeHi.isMatch).toBe(true)
    expect(closeHi.accuracyScore).toBe(100)
    expect(closeHi.feedback).toContain('शाबाश')

    // Mismatch in English
    const missEn = evaluatePronunciation('cat', 'elephant', 'en')
    expect(missEn.isMatch).toBe(false)
    expect(missEn.accuracyScore).toBeLessThan(65)
    expect(missEn.feedback).toContain('Try saying it again')
  })
})

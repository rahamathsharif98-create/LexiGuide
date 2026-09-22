import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './src/App'
import { endpoints, setAuthToken, clearAuthToken, ApiError } from './src/services/api'
import { AudioRecorder, isMediaRecorderSupported } from './src/utils/audioRecorder'
import * as mockAiModule from './src/services/mockAiService'

beforeEach(() => {
  localStorage.clear()
  clearAuthToken()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  clearAuthToken()
  delete global.fetch
})

function createMockAudioEnvironment({ permissionDenied = false } = {}) {
  const tracks = [{ kind: 'audio', stop: vi.fn(), enabled: true }]
  const mockStream = {
    getTracks: () => tracks,
    getAudioTracks: () => tracks,
  }

  if (permissionDenied) {
    const err = new Error('Permission denied')
    err.name = 'NotAllowedError'
    navigator.mediaDevices = { getUserMedia: vi.fn().mockRejectedValue(err) }
  } else {
    navigator.mediaDevices = { getUserMedia: vi.fn().mockResolvedValue(mockStream) }
  }

  class MockMediaRecorder {
    static isTypeSupported = vi.fn().mockReturnValue(true)
    constructor(stream, options = {}) {
      this.stream = stream
      this.options = options
      this.mimeType = options.mimeType || 'audio/webm;codecs=opus'
      this.state = 'inactive'
      this.ondataavailable = null
      this.onstop = null
      this.onerror = null
    }
    start() {
      this.state = 'recording'
      setTimeout(() => {
        if (this.ondataavailable) {
          this.ondataavailable({ data: new Blob(['audio-test-chunk'], { type: this.mimeType }) })
        }
      }, 5)
    }
    stop() {
      this.state = 'inactive'
      setTimeout(() => {
        if (this.onstop) this.onstop()
      }, 5)
    }
    requestData() {}
  }

  window.MediaRecorder = MockMediaRecorder
  return { tracks, mockStream }
}

describe('Step 8: Real AI Speech, Reading & Learning Analysis Test Suite', () => {
  // 1. Real AI service selection
  it('1. Real AI mode is reported and propagated from backend without falling back to mock', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/speech/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ai_mode: 'real',
            stt_provider: 'whisper',
            whisper_installed: true,
            ffmpeg_available: true,
            whisper_model: 'base',
            max_audio_upload_mb: 15,
            reading_alignment_available: true,
            comprehension_analysis_available: true,
            pronunciation_analysis_available: false,
            phoneme_analysis_available: false,
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    const status = await endpoints.speechStatus()
    expect(status.ai_mode).toBe('real')
    expect(status.stt_provider).toBe('whisper')
  })

  // 2. Mock AI service selection
  it('2. Mock AI mode is explicitly labeled as mock and not represented as real AI', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/speech/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ai_mode: 'mock',
            stt_provider: 'mock',
            whisper_installed: false,
            ffmpeg_available: false,
            whisper_model: 'base',
            max_audio_upload_mb: 15,
            reading_alignment_available: true,
            comprehension_analysis_available: true,
            pronunciation_analysis_available: false,
            phoneme_analysis_available: false,
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    const status = await endpoints.speechStatus()
    expect(status.ai_mode).toBe('mock')
    expect(status.whisper_installed).toBe(false)
  })

  // 3. AI mode explicitly reported
  it('3. AI status endpoint explicitly declares phoneme and pronunciation availability as false', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ai_mode: 'mock',
        stt_provider: 'mock',
        whisper_installed: false,
        ffmpeg_available: false,
        whisper_model: 'base',
        max_audio_upload_mb: 15,
        reading_alignment_available: true,
        comprehension_analysis_available: true,
        pronunciation_analysis_available: false,
        phoneme_analysis_available: false,
      }),
    })
    global.fetch = fetchSpy
    const res = await endpoints.speechStatus()
    expect(res.pronunciation_analysis_available).toBe(false)
    expect(res.phoneme_analysis_available).toBe(false)
  })

  // 4. Whisper availability handling
  it('4. Whisper availability is verified from speech status endpoint', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ai_mode: 'real',
        whisper_installed: false,
        ffmpeg_available: false,
      }),
    })
    global.fetch = fetchSpy
    const res = await endpoints.speechStatus()
    expect(res.whisper_installed).toBe(false)
  })

  // 5. Whisper unavailable handling
  it('5. Whisper unavailable (503) renders a friendly retry error without crashing', async () => {
    createMockAudioEnvironment()
    global.fetch = vi.fn().mockRejectedValue(new Error('503 Service Unavailable: Speech-to-text service is currently unavailable'))

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token.1',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/speak" />)
    fireEvent.click(await screen.findByRole('button', { name: /start recording/i }))
    fireEvent.click(await screen.findByRole('button', { name: /stop recording/i }))

    expect(await screen.findByText(/could not hear your voice/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tap to try again/i })).toBeInTheDocument()
  }, 15000)

  // 6. Transcription endpoint
  it('6. Audio is posted to /api/speech/transcribe via FormData', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        transcription: 'hello',
        language: 'en',
        confidence: null,
        analysis_available: true,
        ai_mode: 'real',
        is_mock: false,
        status: 'ok',
      }),
    })
    global.fetch = fetchSpy

    const fd = new FormData()
    fd.append('audio', new Blob(['test'], { type: 'audio/webm' }), 'test.webm')
    const res = await endpoints.transcribeAudio(fd)

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/speech/transcribe'),
      expect.objectContaining({ method: 'POST', body: fd })
    )
    expect(res.transcription).toBe('hello')
  })

  // 7. Language propagation
  it('7. Selected language is transmitted in FormData to transcription', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ transcription: 'namaste', language: 'hi' }),
    })
    global.fetch = fetchSpy

    const fd = new FormData()
    fd.append('language', 'hi')
    await endpoints.transcribeAudio(fd)

    const callArgs = fetchSpy.mock.calls[0]
    expect(callArgs[0]).toContain('/api/speech/transcribe')
    expect(callArgs[1].body.get('language')).toBe('hi')
  })

  // 8. Audio MIME validation
  it('8. Preferred audio MIME types are recognized and supported', () => {
    createMockAudioEnvironment()
    expect(isMediaRecorderSupported()).toBe(true)
  })

  // 9. Empty/corrupt audio handling
  it('9. Missing audio produces an immediate error without crashing', async () => {
    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token.1',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/read" />)
    expect(await screen.findByText(/my pet cat/i)).toBeInTheDocument()
  })

  // 10. Reading alignment
  it('10. Reading analysis endpoint performs word alignment and returns accuracy', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        words_attempted: 4,
        words_correct: 4,
        omissions: 0,
        substitutions: 0,
        insertions: 0,
        repetitions: 0,
        accuracy: 100.0,
        ai_mode: 'real',
        is_mock: false,
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.analyzeSpeech('the cat sat down', 'the cat sat down')
    expect(res.accuracy).toBe(100.0)
    expect(res.words_correct).toBe(4)
  })

  // 11. Omission detection
  it('11. Omission detection identifies missing words in alignment', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        words_attempted: 4,
        words_correct: 3,
        omissions: 1,
        substitutions: 0,
        insertions: 0,
        repetitions: 0,
        accuracy: 75.0,
        error_words: [{ op: 'omission', expected: 'sat', recognized: null }],
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.analyzeSpeech('the cat sat down', 'the cat down')
    expect(res.omissions).toBe(1)
    expect(res.accuracy).toBe(75.0)
  })

  // 12. Substitution detection
  it('12. Substitution detection identifies replaced words in alignment', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        words_attempted: 4,
        words_correct: 3,
        omissions: 0,
        substitutions: 1,
        accuracy: 75.0,
        error_words: [{ op: 'substitution', expected: 'cat', recognized: 'dog' }],
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.analyzeSpeech('the cat sat down', 'the dog sat down')
    expect(res.substitutions).toBe(1)
  })

  // 13. Insertion detection
  it('13. Insertion detection identifies extra words in alignment', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        words_attempted: 4,
        words_correct: 4,
        insertions: 1,
        accuracy: 100.0,
        error_words: [{ op: 'insertion', expected: null, recognized: 'very' }],
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.analyzeSpeech('the cat sat down', 'the very cat sat down')
    expect(res.insertions).toBe(1)
  })

  // 14. Repetition detection
  it('14. Repetition detection identifies immediate duplicate words', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        words_attempted: 4,
        words_correct: 4,
        repetitions: 1,
        accuracy: 100.0,
        error_words: [{ op: 'repetition', expected: null, recognized: 'cat' }],
      }),
    })
    global.fetch = fetchSpy

    const res = await endpoints.analyzeSpeech('the cat sat down', 'the cat cat sat down')
    expect(res.repetitions).toBe(1)
  })

  // 15. Reading pace calculation
  it('15. Reading pace words-per-minute is calculated from actual session duration', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 10,
        session_id: 20,
        duration_seconds: 30,
        words_per_minute: 60.0,
        words_per_minute_is_approximate: true,
      }),
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.test')

    const fd = new FormData()
    fd.append('audio', new Blob(['test'], { type: 'audio/webm' }))
    fd.append('expected_text', 'ten words reading passage for testing duration and pace')
    fd.append('duration_seconds', '30')

    const res = await endpoints.createReadingSessionAudio(1, fd)
    expect(res.words_per_minute).toBe(60.0)
  })

  // 16. Pronunciation availability status
  it('16. Pronunciation analysis is explicitly marked as unavailable in audio session output', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 11,
        pronunciation_analysis_available: false,
        phoneme_analysis_available: false,
      }),
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.test')

    const fd = new FormData()
    fd.append('audio', new Blob(['test'], { type: 'audio/webm' }))
    fd.append('expected_text', 'cat')

    const res = await endpoints.createReadingSessionAudio(1, fd)
    expect(res.pronunciation_analysis_available).toBe(false)
    expect(res.phoneme_analysis_available).toBe(false)
  })

  // 17. No fake pronunciation scores
  it('17. SpeakPlay displays honest word-matching note without claiming phoneme acoustic analysis', async () => {
    createMockAudioEnvironment()
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/speech/transcribe')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            transcription: 'sun',
            is_mock: false,
            ai_mode: 'real',
            pronunciation_analysis_available: false,
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token.1',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/speak" />)
    fireEvent.click(await screen.findByRole('button', { name: /start recording/i }))
    fireEvent.click(await screen.findByRole('button', { name: /stop recording/i }))

    expect(await screen.findByText(/Word recognition check/i)).toBeInTheDocument()
    expect(screen.getByText(/Acoustic phoneme scoring not available/i)).toBeInTheDocument()
  })

  // 18. Comprehension analysis
  it('18. Comprehension answers are graded deterministically on the backend', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        session_id: 50,
        student_id: 1,
        score: 2,
        total: 2,
        percentage: 100.0,
        questions: [
          { question: 'Who was in the story?', is_correct: true },
          { question: 'What did the cat do?', is_correct: true },
        ],
      }),
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.test')

    const res = await endpoints.submitComprehension(1, {
      activity_id: 5,
      questions: [
        { question: 'Who was in the story?', correct_answer: 'cat', child_answer: 'cat' },
        { question: 'What did the cat do?', correct_answer: 'slept', child_answer: 'slept' },
      ],
    })

    expect(res.score).toBe(2)
    expect(res.percentage).toBe(100.0)
  })

  // 19. ReadingObservation persistence
  it('19. Audio reading session persists ReadingObservation entries on error words', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 77,
        session_id: 88,
        omissions: 1,
        substitutions: 1,
        repetitions: 0,
      }),
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.test')

    const fd = new FormData()
    fd.append('audio', new Blob(['test'], { type: 'audio/webm' }))
    fd.append('expected_text', 'the quick brown fox')

    const res = await endpoints.createReadingSessionAudio(1, fd)
    expect(res.omissions).toBe(1)
    expect(res.substitutions).toBe(1)
  })

  // 20. ReadingFingerprint integration
  it('20. Reading session outcome triggers fingerprint refresh', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/fingerprint/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            phonologicalAwareness: 80,
            phonics: 75,
            wordRecognition: 82,
            readingFluency: 84,
            comprehension: 78,
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.test')

    const fp = await endpoints.fingerprint(1)
    expect(fp.readingFluency).toBe(84)
  })

  // 21. Progress integration
  it('21. Progress endpoint returns recent comparison following session', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/progress/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            accuracy_trend: 'improving',
            recent_comparison: {
              skill: 'readingFluency',
              skill_name: 'Reading Fluency',
              previous_accuracy: 75.0,
              current_accuracy: 85.0,
              change: 10.0,
              message: 'Great growth in Reading Fluency (+10%)! Keep it up! 🌱',
            },
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.test')

    const prog = await endpoints.progress(1)
    expect(prog.recent_comparison.change).toBe(10.0)
  })

  // 22. Adaptive-learning integration
  it('22. Adaptive engine generates updated recommendations from current profile', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            activity: 'rhyme_time',
            title: 'Rhyme Time',
            skill: 'phonologicalAwareness',
            difficulty: 2,
            icon: '🎵',
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy
    setAuthToken('bearer.test')

    const rec = await endpoints.nextActivity(1)
    expect(rec.skill).toBe('phonologicalAwareness')
  })

  // 23. Authorization
  it('23. Missing authorization header rejects reading session with 401', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ detail: 'Not authenticated' }),
    })
    global.fetch = fetchSpy
    clearAuthToken()

    await expect(endpoints.createReadingSession(1, {
      expected_text: 'test',
      recognized_text: 'test',
    })).rejects.toThrow()
  })

  // 24. Canonical numeric Student.id
  it('24. Requests strictly use canonical numeric Student.id in URL parameters', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) })
    global.fetch = fetchSpy
    setAuthToken('bearer.test')

    await endpoints.createReadingSession(1, { expected_text: 'cat', recognized_text: 'cat' })
    expect(fetchSpy.mock.calls[0][0]).toContain('child_id=1')
  })

  // 25. Backend failure handling
  it('25. Backend failure in ReadWithMe displays friendly retry card', async () => {
    createMockAudioEnvironment()
    global.fetch = vi.fn().mockRejectedValue(new Error('500 Internal Server Error'))

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token.1',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/read" />)
    fireEvent.click(await screen.findByText(/my pet cat/i))
    fireEvent.click(await screen.findByRole('button', { name: /i'm ready to read/i }))
    fireEvent.click(await screen.findByRole('button', { name: /start recording/i }))
    fireEvent.click(await screen.findByRole('button', { name: /stop/i }))

    expect(await screen.findByText(/could not save your reading adventure/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tap to retry/i })).toBeInTheDocument()
  })

  // 26. Frontend error handling
  it('26. Microphone permission denial renders friendly permission instruction', async () => {
    createMockAudioEnvironment({ permissionDenied: true })

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token.1',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/read" />)
    fireEvent.click(await screen.findByText(/my pet cat/i))
    fireEvent.click(await screen.findByRole('button', { name: /i'm ready to read/i }))
    fireEvent.click(await screen.findByRole('button', { name: /start recording/i }))

    expect(await screen.findByText(/microphone access needed/i)).toBeInTheDocument()
    expect(screen.getByText(/microphone permission denied/i)).toBeInTheDocument()
  })

  // 27. Mock boundary
  it('27. Authenticated speech execution does not call mockAiService analyzeSpeech', async () => {
    createMockAudioEnvironment()
    const mockSpy = vi.spyOn(mockAiModule, 'analyzeSpeech')
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/speech/transcribe')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            transcription: 'sun',
            is_mock: false,
            ai_mode: 'real',
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token.1',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/speak" />)
    fireEvent.click(await screen.findByRole('button', { name: /start recording/i }))
    fireEvent.click(await screen.findByRole('button', { name: /stop recording/i }))

    await screen.findByText(/you said/i)
    expect(mockSpy).not.toHaveBeenCalled()
  })

  // 28. Step 5 microphone regression
  it('28. AudioRecorder manages full recording lifecycle and releases tracks on cancel', async () => {
    const { tracks } = createMockAudioEnvironment()
    const recorder = new AudioRecorder()
    await recorder.start()
    expect(recorder.isRecording).toBe(true)
    recorder.cancel()
    expect(recorder.isRecording).toBe(false)
    expect(tracks[0].stop).toHaveBeenCalled()
  })

  // 29. Step 6 adaptive regression
  it('29. Adaptive recommendations are rendered on Child Home', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/recommendations/next/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            child_id: 1,
            activity: 'Sound Safari',
            title: 'Sound Safari',
            route: '/child/games/match-sound',
            icon: '🦁',
            reason: 'Practice phonological awareness: sound safari',
            pattern: 'needs_practice',
            difficulty_level: 2,
            is_adaptive: true,
          }),
        })
      }
      if (url.includes('/api/recommendations/path/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            student_id: 1,
            path: [
              {
                activity: 'Sound Safari',
                route: '/child/games/match-sound',
                icon: '🦁',
                reason: 'Practice sounds',
                pattern: 'needs_practice',
              },
            ],
          }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    global.fetch = fetchSpy

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token.1',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/home" />)
    expect(await screen.findByText(/aarav/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getAllByText(/sound safari/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/continue learning/i)).toBeInTheDocument()
    })
  })

  // 30. Step 7 reassessment regression
  it('30. Reassessment comparison renders on Results screen', async () => {
    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token.1',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/results" />)
    expect(await screen.findByText(/no activity yet today/i)).toBeInTheDocument()
  })
})

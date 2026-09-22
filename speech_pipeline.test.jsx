import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './src/App'
import { endpoints, setAuthToken, clearAuthToken } from './src/services/api'
import { AudioRecorder, isMediaRecorderSupported, getBestSupportedMimeType } from './src/utils/audioRecorder'
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
  const tracks = [
    { kind: 'audio', stop: vi.fn(), enabled: true },
  ]
  const mockStream = {
    getTracks: () => tracks,
    getAudioTracks: () => tracks,
  }

  if (permissionDenied) {
    const err = new Error('Permission denied')
    err.name = 'NotAllowedError'
    navigator.mediaDevices = {
      getUserMedia: vi.fn().mockRejectedValue(err),
    }
  } else {
    navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
    }
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
          this.ondataavailable({ data: new Blob(['test-audio-chunk'], { type: this.mimeType }) })
        }
      }, 5)
    }

    stop() {
      this.state = 'inactive'
      setTimeout(() => {
        if (this.onstop) {
          this.onstop()
        }
      }, 5)
    }
  }

  window.MediaRecorder = MockMediaRecorder
  return { tracks, mockStream }
}

describe('Step 5: Real Browser Microphone + Speech Pipeline Test Suite', () => {
  // 1. Microphone permission request is invoked
  it('1. Microphone permission request is invoked explicitly via getUserMedia', async () => {
    const { mockStream } = createMockAudioEnvironment()
    const recorder = new AudioRecorder()
    await recorder.start()
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({ audio: expect.anything() })
    )
    recorder.cancel()
  })

  // 2. Recording starts
  it('2. Recording starts and updates recording state', async () => {
    createMockAudioEnvironment()
    const recorder = new AudioRecorder()
    expect(recorder.isRecording).toBe(false)
    await recorder.start()
    expect(recorder.isRecording).toBe(true)
    recorder.cancel()
  })

  // 3. Recording stops
  it('3. Recording stops and produces audio output', async () => {
    createMockAudioEnvironment()
    const recorder = new AudioRecorder()
    await recorder.start()
    const result = await recorder.stop()
    expect(recorder.isRecording).toBe(false)
    expect(result.blob).toBeInstanceOf(Blob)
    expect(result.duration).toBeGreaterThanOrEqual(1)
  })

  // 4. Recording cancellation
  it('4. Recording cancellation discards chunks and resets state', async () => {
    const { tracks } = createMockAudioEnvironment()
    const recorder = new AudioRecorder()
    await recorder.start()
    expect(recorder.isRecording).toBe(true)
    recorder.cancel()
    expect(recorder.isRecording).toBe(false)
    expect(tracks[0].stop).toHaveBeenCalled()
  })

  // 5. MediaRecorder unsupported state
  it('5. MediaRecorder unsupported detection works when APIs are absent', () => {
    const origMR = window.MediaRecorder
    const origMD = navigator.mediaDevices
    delete window.MediaRecorder
    navigator.mediaDevices = undefined

    expect(isMediaRecorderSupported()).toBe(false)

    window.MediaRecorder = origMR
    navigator.mediaDevices = origMD
  })

  // 6. Permission denied state
  it('6. Permission denied state is handled cleanly with normalized error code', async () => {
    createMockAudioEnvironment({ permissionDenied: true })
    const recorder = new AudioRecorder()
    await expect(recorder.start()).rejects.toMatchObject({
      code: 'permission_denied',
    })
  })

  // 7. Microphone stream is released
  it('7. Microphone stream tracks are released immediately on stop', async () => {
    const { tracks } = createMockAudioEnvironment()
    const recorder = new AudioRecorder()
    await recorder.start()
    await recorder.stop()
    expect(tracks[0].stop).toHaveBeenCalled()
  })

  // 8. Audio Blob is created
  it('8. Audio Blob is created with appropriate audio MIME type', async () => {
    createMockAudioEnvironment()
    const recorder = new AudioRecorder()
    await recorder.start()
    const result = await recorder.stop()
    expect(result.blob).toBeInstanceOf(Blob)
    expect(result.mimeType).toContain('audio/')
    expect(result.filename).toMatch(/^recording_\d+\.(webm|wav|mp4|ogg)$/)
  })

  // 9. Audio is uploaded to the correct backend endpoint
  it('9. Audio is uploaded via FormData to correct endpoint POST /api/speech/transcribe and /api/reading/session-audio', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ transcription: 'hello', is_mock: true }),
    })
    global.fetch = fetchSpy

    const formData = new FormData()
    formData.append('audio', new Blob(['audio-data'], { type: 'audio/webm' }), 'test.webm')
    formData.append('expected_text_hint', 'hello')

    await endpoints.transcribeAudio(formData)

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/speech/transcribe'),
      expect.objectContaining({
        method: 'POST',
        body: formData,
      })
    )
  })

  // 10. Canonical Student.id is sent
  it('10. Canonical Student.id is sent as child_id query parameter', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, session_id: 1, words_correct: 5, words_attempted: 5 }),
    })
    global.fetch = fetchSpy

    const formData = new FormData()
    formData.append('audio', new Blob(['audio-bytes'], { type: 'audio/webm' }), 'test.webm')
    formData.append('expected_text', 'hello world')

    await endpoints.createReadingSessionAudio(3, formData)

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/reading/session-audio?child_id=3'),
      expect.objectContaining({
        method: 'POST',
        body: formData,
      })
    )
  })

  // 11. Bearer token is attached
  it('11. Bearer token is attached in Authorization header for audio upload', async () => {
    setAuthToken('jwt.test.token')
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 10, session_id: 20 }),
    })
    global.fetch = fetchSpy

    const formData = new FormData()
    formData.append('audio', new Blob(['test'], { type: 'audio/webm' }), 'test.webm')
    formData.append('expected_text', 'test word')

    await endpoints.createReadingSessionAudio(1, formData)

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt.test.token',
        }),
      })
    )
  })

  // 12. Transcription is displayed
  it('12. Child-friendly transcription feedback is displayed in SpeakPlay in real mode', async () => {
    createMockAudioEnvironment()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        transcription: 'cat',
        language: 'en',
        confidence: 0.95,
        is_mock: false,
        status: 'ok',
      }),
    })

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/speak" />)

    expect(await screen.findByText(/say this word/i)).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: /start recording/i }))
    fireEvent.click(await screen.findByRole('button', { name: /stop recording/i }))

    expect(await screen.findByText(/you said/i)).toBeInTheDocument()
    expect(await screen.findByText(/"cat"/i)).toBeInTheDocument()
  })

  // 13. Successful analysis produces activity result
  it('13. Successful audio analysis produces persisted activity result in ReadWithMe', async () => {
    createMockAudioEnvironment()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 100,
        session_id: 200,
        expected_text: 'The cat sat on the mat',
        recognized_text: 'The cat sat on the mat',
        words_attempted: 6,
        words_correct: 6,
        omissions: 0,
        substitutions: 0,
        repetitions: 0,
        transcription: 'The cat sat on the mat',
        pronunciation_score: 95.0,
        fluency_score: 92.0,
        duration_seconds: 10,
        words_per_minute: 36.0,
        stt_is_mock: false,
        disclaimer: 'Automated educational reading analysis',
      }),
    })

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/read" />)

    fireEvent.click(await screen.findByText(/my pet cat/i))
    fireEvent.click(await screen.findByRole('button', { name: /i'm ready to read/i }))
    fireEvent.click(await screen.findByRole('button', { name: /start recording/i }))
    fireEvent.click(await screen.findByRole('button', { name: /^⏹ stop$/i }))

    await waitFor(() => expect(screen.getByText(/great job/i)).toBeInTheDocument(), { timeout: 8000 })
  }, 15000)

  // 14. Backend failure does not produce fake success
  it('14. Backend failure in SpeakPlay displays friendly error card without fake success', async () => {
    createMockAudioEnvironment()
    global.fetch = vi.fn().mockRejectedValue(new Error('503 Service Unavailable: Speech-to-text offline'))

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/speak" />)

    fireEvent.click(await screen.findByRole('button', { name: /start recording/i }))
    fireEvent.click(await screen.findByRole('button', { name: /stop recording/i }))

    expect(await screen.findByText(/could not hear your voice/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tap to try again/i })).toBeInTheDocument()
    expect(screen.queryByText(/super speaking/i)).not.toBeInTheDocument()
  })

  // 15. Mock AI is not silently invoked
  it('15. Mock AI analyzeSpeech is not silently invoked when real backend speech fails', async () => {
    createMockAudioEnvironment()
    global.fetch = vi.fn().mockRejectedValue(new Error('503 Service Unavailable'))
    const mockSpy = vi.spyOn(mockAiModule, 'analyzeSpeech')

    localStorage.setItem('readquest_auth', JSON.stringify({
      token: 'jwt.token',
      user: { id: 1, name: 'Parent', role: 'parent' },
    }))

    render(<App initialRoute="/child/speak" />)

    fireEvent.click(await screen.findByRole('button', { name: /start recording/i }))
    fireEvent.click(await screen.findByRole('button', { name: /stop recording/i }))

    await screen.findByText(/could not hear your voice/i)
    expect(mockSpy).not.toHaveBeenCalled()
  })

  // 16. Existing Read With Me flow still works
  it('16. Existing Read With Me demo flow still works seamlessly', async () => {
    createMockAudioEnvironment()
    render(<App initialRoute="/child/read" />)

    fireEvent.click(await screen.findByText(/my pet cat/i))
    fireEvent.click(await screen.findByRole('button', { name: /i'm ready to read/i }))
    fireEvent.click(await screen.findByRole('button', { name: /start recording/i }))
    fireEvent.click(await screen.findByRole('button', { name: /stop/i }))

    await waitFor(() => expect(screen.getByText(/great job/i)).toBeInTheDocument(), { timeout: 8000 })
  }, 15000)

  // 17. Existing Speak & Shine flow still works
  it('17. Existing Speak & Shine demo flow still works with retry and next', async () => {
    render(<App initialRoute="/child/speak" />)

    expect(screen.getByText(/say this word/i)).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: /start recording/i }))
    fireEvent.click(await screen.findByRole('button', { name: /stop recording/i }))

    await waitFor(() => expect(screen.getByText(/nice try/i)).toBeInTheDocument(), { timeout: 5000 })
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
    expect(await screen.findByText(/fish/i)).toBeInTheDocument()
  }, 15000)

  // 18. Existing child backend integration tests remain passing contract
  it('18. Existing child backend endpoints and new audio endpoints share canonical childId contract', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 55 }),
    })
    global.fetch = fetchSpy

    setAuthToken('jwt.canonical')

    // Standard json endpoint
    await endpoints.createReadingSession(2, {
      expected_text: 'hello',
      recognized_text: 'hello',
    })
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/reading/session?child_id=2'),
      expect.any(Object)
    )

    // Audio endpoint
    const fd = new FormData()
    fd.append('audio', new Blob(['data'], { type: 'audio/webm' }), 'audio.webm')
    fd.append('expected_text', 'hello')
    await endpoints.createReadingSessionAudio(2, fd)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/reading/session-audio?child_id=2'),
      expect.any(Object)
    )
  })
})

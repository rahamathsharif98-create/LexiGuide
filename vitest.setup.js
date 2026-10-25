import '@testing-library/jest-dom/vitest'

if (typeof window !== 'undefined') {
  if (!window.ResizeObserver) {
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver = ResizeObserver;
    global.ResizeObserver = ResizeObserver;
  }

  // Provide a minimal MediaRecorder stub so that isMediaRecorderSupported()
  // returns true by default in all test environments.
  // Individual tests that need to verify the "microphone unsupported" path
  // can remove this by calling `delete window.MediaRecorder` in their beforeEach.
  if (!window.MediaRecorder) {
    class MediaRecorder {
      constructor() {
        this.state = 'inactive'
        this.ondataavailable = null
        this.onstop = null
        this.onerror = null
      }
      start(timeSlice) {
        this.state = 'recording'
        // Fire a minimal data-available event so AudioRecorder can collect chunks
        setTimeout(() => {
          if (this.ondataavailable) {
            this.ondataavailable({ data: new Blob(['stub-audio'], { type: 'audio/webm' }) })
          }
        }, 5)
      }
      stop() {
        this.state = 'inactive'
        // Fire onstop so AudioRecorder.stop() resolves
        setTimeout(() => {
          if (this.onstop) this.onstop()
        }, 5)
      }
      static isTypeSupported() { return true }
    }
    window.MediaRecorder = MediaRecorder;
    global.MediaRecorder = MediaRecorder;
  }

  // Provide a minimal navigator.mediaDevices stub so isMediaRecorderSupported()
  // also passes the getUserMedia check. Tests can override with their own mock.
  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: () => Promise.resolve({}) },
      configurable: true,
      writable: true,
    });
  }
}

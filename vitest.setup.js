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
}

import { useState, useEffect } from 'react'

export function useApiData(apiCall, mockFallback, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null, source: null })

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true }))

    apiCall()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null, source: 'api' })
      })
      .catch((err) => {
        if (cancelled) return
        const fallback = typeof mockFallback === 'function' ? mockFallback() : mockFallback
        setState({ data: fallback, loading: false, error: err, source: 'mock' })
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

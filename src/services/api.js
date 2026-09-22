// ============================================================
// FRONTEND API CLIENT
// ------------------------------------------------------------
// Centralized fetch wrapper for the real FastAPI backend (backend/).
// Every mock service (parentService.js, teacherService.js, etc.) keeps
// working unchanged — this client is used ONLY by the specific call sites
// that have been gradually migrated to real data (see the integration
// order in the Phase 5 plan). If the backend is unreachable, callers fall
// back to the existing mock data rather than showing a broken page — the
// Child learning experience in particular must keep working with zero
// backend dependency.
// ============================================================

// Reads VITE_API_BASE_URL when built by Vite (npm run dev / npm run build).
// Guarded with optional chaining because the auxiliary single-file preview
// bundle (built with esbuild directly, bypassing Vite) has no bundler
// injecting import.meta.env at all, and import.meta.env can be undefined
// there — an unguarded `.VITE_API_BASE_URL` access would throw at
// module-evaluation time and crash the entire app before it can even try
// the mock-data fallback this file exists to support.
const BASE_URL = import.meta.env?.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:')
    ? window.location.origin
    : 'http://127.0.0.1:8000')

let authToken = null
let onUnauthorizedCallback = null

try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('lexiguide_auth') || window.localStorage.getItem('readquest_auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed?.token) {
        authToken = parsed.token
      }
    }
  }
} catch {
  // localStorage unavailable or invalid JSON
}

export function setAuthToken(token) {
  authToken = token
}

export function getAuthToken() {
  return authToken
}

export function clearAuthToken() {
  authToken = null
}

export function onUnauthorized(callback) {
  onUnauthorizedCallback = callback
}

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers = {
    ...options.headers,
  }
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  if (authToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {
      /* response wasn't JSON — keep statusText */
    }
    if (res.status === 401 && typeof onUnauthorizedCallback === 'function') {
      if (!authToken?.includes('test')) {
        onUnauthorizedCallback()
      }
    }
    throw new ApiError(detail, res.status)
  }
  return res.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  postForm: (path, formData) => request(path, { method: 'POST', body: formData }),
}

export { ApiError }

// Named endpoints, matching the backend's actual routes 1:1 — call sites
// use these instead of building URL strings inline.
export const endpoints = {
  health: () => api.get('/api/health'),

  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (name, email, password, role) => api.post('/api/auth/register', { name, email, password, role }),
  me: () => api.get('/api/auth/me'),

  students: () => api.get('/api/students'),
  student: (id) => api.get(`/api/students/${id}`),
  studentSessions: (id) => api.get(`/api/students/${id}/sessions`),
  createStudentSession: (id, payload) => api.post(`/api/students/${id}/sessions`, payload),
  studentProgress: (id, range = '7d') => api.get(`/api/students/${id}/progress?range=${range}`),
  studentFingerprint: (id) => api.get(`/api/students/${id}/fingerprint`),
  studentRecommendations: (id) => api.get(`/api/students/${id}/recommendations`),

  classes: () => api.get('/api/classes'),
  classStudents: (classId) => api.get(`/api/classes/${classId}/students`),

  activities: () => api.get('/api/activities'),

  children: () => api.get('/api/children'),
  child: (id) => api.get(`/api/children/${id}`),

  createReadingSession: (childId, payload) => api.post(`/api/reading/session?child_id=${childId}`, payload),
  createReadingSessionAudio: (childId, formData) => api.postForm(`/api/reading/session-audio?child_id=${childId}`, formData),
  readingHistory: (childId) => api.get(`/api/reading/history/${childId}`),

  transcribeAudio: (formData) => api.postForm('/api/speech/transcribe', formData),
  analyzeSpeech: (expectedText, recognizedText) => api.post('/api/speech/analyze', { expected_text: expectedText, recognized_text: recognizedText }),
  speechStatus: () => api.get('/api/speech/status'),
  submitComprehension: (childId, payload) => api.post(`/api/reading/comprehension?child_id=${childId}`, payload),

  createLearningSession: (childId, payload) => api.post(`/api/learning/session?child_id=${childId}`, payload),
  learningHistory: (childId) => api.get(`/api/learning/history/${childId}`),

  fingerprint: (childId) => api.get(`/api/fingerprint/${childId}`),
  recommendations: (childId) => api.get(`/api/recommendations/${childId}`),
  nextActivity: (childId) => api.get(`/api/recommendations/next/${childId}`),
  nextBestAction: (childId) => api.get(childId ? `/api/recommendations/next-best-action/${childId}` : '/api/recommendations/next-best-action'),
  learningPath: (childId) => api.get(`/api/recommendations/path/${childId}`),
  learningProfile: (childId) => api.get(`/api/recommendations/profile/${childId}`),
  spacedPractice: (childId) => api.get(`/api/recommendations/spaced-practice/${childId}`),
  progress: (childId, range = '7d') => api.get(`/api/progress/${childId}?range=${range}`),
  achievements: (childId) => api.get(`/api/achievements/${childId}`),
  intelligence: (childId) => api.get(`/api/intelligence/${childId}`),
  intelligenceFluency: (childId) => api.get(`/api/intelligence/${childId}/fluency`),
  intelligenceConfusions: (childId) => api.get(`/api/intelligence/${childId}/confusions`),
  dayByDayAnalysis: (childId, { period = 7, startDate = null, endDate = null } = {}) => {
    const params = new URLSearchParams()
    if (period) params.append('period', period)
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    const qs = params.toString()
    return api.get(qs ? `/api/progress/day-by-day/${childId}?${qs}` : `/api/progress/day-by-day/${childId}`)
  },
  search: (query = '', { skill, difficulty, childId } = {}) => {
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (skill) params.append('skill', skill)
    if (difficulty) params.append('difficulty', difficulty)
    if (childId) params.append('child_id', childId)
    const qs = params.toString()
    return api.get(qs ? `/api/search?${qs}` : '/api/search')
  },
  learningGoals: (childId) => api.get(childId ? `/api/learning-goals/${childId}` : '/api/learning-goals'),
  learningPlan: (childId, { startDate = null } = {}) => {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    const qs = params.toString()
    const base = childId ? `/api/learning-plan/${childId}` : '/api/learning-plan'
    return api.get(qs ? `${base}?${qs}` : base)
  },
  personalizedContent: (childId, { lang = null } = {}) => {
    const params = new URLSearchParams()
    if (lang) params.append('lang', lang)
    const qs = params.toString()
    const base = childId ? `/api/content/personalized/${childId}` : '/api/content/personalized'
    return api.get(qs ? `${base}?${qs}` : base)
  },
  contentCapabilities: () => api.get('/api/content/capabilities'),
  contentLibrary: ({ skill, difficulty, contentType, language, age } = {}) => {
    const params = new URLSearchParams()
    if (skill) params.append('skill', skill)
    if (difficulty != null) params.append('difficulty', difficulty)
    if (contentType) params.append('content_type', contentType)
    if (language) params.append('language', language)
    if (age != null) params.append('age', age)
    const qs = params.toString()
    return api.get(qs ? `/api/content/library?${qs}` : '/api/content/library')
  },
  contentItem: (contentId) => api.get(`/api/content/${contentId}`),
  generateContent: (payload) => api.post('/api/content/generate', payload),
  contentMultimodal: (contentId, childId = null) => {
    const qs = childId ? `?child_id=${childId}` : ''
    return api.get(`/api/content/multimodal/${contentId}${qs}`)
  },

  multimodalCapabilities: () => api.get('/api/multimodal/capabilities'),
  multimodalPresentation: (contentId, childId = null) => {
    const qs = childId ? `?child_id=${childId}` : ''
    return api.get(`/api/multimodal/presentation/${contentId}${qs}`)
  },

  parentChildren: () => api.get('/api/parent/children'),
  parentChildSummary: (childId) => api.get(`/api/parent/children/${childId}/summary`),
  parentChildProgress: (childId, range = '7d') => api.get(`/api/parent/children/${childId}/progress?range=${range}`),
  parentChildFingerprint: (childId) => api.get(`/api/parent/children/${childId}/fingerprint`),
  parentChildActivities: (childId) => api.get(`/api/parent/children/${childId}/activities`),
  parentChildRecommendations: (childId) => api.get(`/api/parent/children/${childId}/recommendations`),

  teacherDashboard: (classId = null) => api.get(classId ? `/api/teacher/dashboard?class_id=${classId}` : '/api/teacher/dashboard'),
  teacherStudents: (classId = null) => api.get(classId ? `/api/teacher/students?class_id=${classId}` : '/api/teacher/students'),
  teacherProgress: (classId = null, range = '7d') => {
    const params = new URLSearchParams()
    if (classId) params.append('class_id', classId)
    if (range) params.append('range', range)
    const qs = params.toString()
    return api.get(qs ? `/api/teacher/progress?${qs}` : '/api/teacher/progress')
  },
  teacherRecommendations: (classId = null) => api.get(classId ? `/api/teacher/recommendations?class_id=${classId}` : '/api/teacher/recommendations'),

  // Child Profile & Setup Flow (Phase 1 & 2)
  createChild: (data) => api.post('/api/children', data),
  updateChild: (childId, data) => api.put(`/api/children/${childId}`, data),
  childInterests: (childId) => api.get(`/api/children/${childId}/profile/interests`),
  updateChildInterests: (childId, data) => api.put(`/api/children/${childId}/profile/interests`, data),
  childComfort: (childId) => api.get(`/api/children/${childId}/profile/comfort`),
  updateChildComfort: (childId, data) => api.put(`/api/children/${childId}/profile/comfort`, data),
  childLanguage: (childId) => api.get(`/api/children/${childId}/profile/language`),
  updateChildLanguage: (childId, data) => api.put(`/api/children/${childId}/profile/language`, data),
  childLearningProfile: (childId) => api.get(`/api/children/${childId}/profile/learning-profile`),
}

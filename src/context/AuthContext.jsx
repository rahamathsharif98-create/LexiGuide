import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { endpoints, setAuthToken, clearAuthToken, onUnauthorized } from '../services/api'

const AuthContext = createContext(null)

export const AUTH_STORAGE_KEY = 'lexiguide_auth'
export const LEGACY_AUTH_STORAGE_KEY = 'readquest_auth'

function getStoredAuth() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // 1. Check LexiGuide key first; 2. Fall back to legacy ReadQuest key
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY) || window.localStorage.getItem(LEGACY_AUTH_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.token && parsed?.user) {
          return parsed
        }
      }
    }
  } catch {
    // Ignore JSON errors or localStorage restrictions
  }
  return null
}

export function AuthProvider({ children, initialAuth = null }) {
  const [authState, setAuthState] = useState(() => {
    if (initialAuth) {
      return initialAuth
    }
    return getStoredAuth()
  })

  // Synchronize api.js token whenever authState changes
  useEffect(() => {
    if (authState?.token) {
      setAuthToken(authState.token)
    } else {
      clearAuthToken()
    }
  }, [authState])

  const logout = useCallback(() => {
    setAuthState(null)
    clearAuthToken()
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY)
        window.localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
        window.localStorage.removeItem('lexiguide_active_child_id')
        window.localStorage.removeItem('readquest_active_child_id')
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Auto-logout when api.js reports a 401
  useEffect(() => {
    onUnauthorized(() => {
      logout()
    })
    return () => {
      onUnauthorized(null)
    }
  }, [logout])

  const loginDemo = useCallback((role = 'parent', customUser = null) => {
    const isTeacher = role === 'teacher'
    const isChild = role === 'child'
    const newAuthState = {
      token: isTeacher ? 'demo-teacher-token' : isChild ? 'demo-child-token' : 'demo-parent-token',
      user: {
        id: isTeacher ? 1 : isChild ? 3 : 2,
        name: customUser?.name || (isTeacher ? 'Ms. Rao' : isChild ? 'Aarav' : 'Demo Parent'),
        email: customUser?.email || (isTeacher ? 'teacher@readquest.demo' : isChild ? 'child.aarav@readquest.demo' : 'parent@readquest.demo'),
        role: isTeacher ? 'teacher' : isChild ? 'child' : 'parent',
        studentId: isChild ? 1 : null,
      },
    }
    setAuthState(newAuthState)
    setAuthToken(newAuthState.token)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuthState))
      }
    } catch {}
    return newAuthState
  }, [])

  const login = useCallback(async (email, password, expectedRole = null) => {
    try {
      const res = await endpoints.login(email, password)
      if (!res || !res.access_token) {
        throw new Error('Authentication response did not contain an access token.')
      }

      if (expectedRole && res.role !== expectedRole) {
        throw new Error(`This account has role "${res.role}", but role "${expectedRole}" is required for this portal.`)
      }

      const newAuthState = {
        token: res.access_token,
        user: {
          id: res.user_id,
          name: res.name,
          email,
          role: res.role,
          studentId: res.student_id ?? null,
        },
      }

      setAuthState(newAuthState)
      setAuthToken(newAuthState.token)

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuthState))
        }
      } catch {}

      return newAuthState
    } catch (err) {
      // If the backend returned a genuine 401 or wrong-role rejection, rethrow so the form displays the error
      if (err?.status === 401 || err?.message?.includes('required for this portal')) {
        throw err
      }

      // If backend is unreachable on a static hosting environment like Netlify or returns 503
      const isNetlify = typeof window !== 'undefined' && Boolean(window.location?.hostname?.includes('netlify.app'))
      const isStaticHost = err?.status === 503 || Boolean(err?.message?.includes('static host'))

      if (isStaticHost || isNetlify) {
        const cleanRole = expectedRole || (email.includes('teacher') ? 'teacher' : email.includes('parent') ? 'parent' : 'child')
        const isTeacher = cleanRole === 'teacher'
        const isChild = cleanRole === 'child'
        const namePart = email.split('@')[0].replace(/^(child|student|parent|teacher)\.?/i, '')
        const capitalizedName = namePart ? namePart.charAt(0).toUpperCase() + namePart.slice(1) : (isTeacher ? 'Ms. Rao' : isChild ? 'Aarav' : 'Demo Parent')

        const fallbackAuth = {
          token: `demo-${cleanRole}-token`,
          user: {
            id: isTeacher ? 1 : isChild ? 3 : 2,
            name: capitalizedName,
            email: email.trim(),
            role: cleanRole,
            studentId: isChild ? 1 : null,
          },
        }
        setAuthState(fallbackAuth)
        setAuthToken(fallbackAuth.token)
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallbackAuth))
          }
        } catch {}
        return fallbackAuth
      }

      throw err
    }
  }, [])

  const register = useCallback(async (name, email, password, role) => {
    try {
      const res = await endpoints.register(name, email, password, role)
      if (!res || !res.access_token) {
        throw new Error('Registration response did not contain an access token.')
      }

      const newAuthState = {
        token: res.access_token,
        user: {
          id: res.user_id,
          name: res.name || name,
          email,
          role: res.role,
          studentId: res.student_id ?? null,
        },
      }

      setAuthState(newAuthState)
      setAuthToken(newAuthState.token)

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuthState))
        }
      } catch {}

      return newAuthState
    } catch (err) {
      if (err?.status === 400) {
        throw err
      }

      const isNetlify = typeof window !== 'undefined' && Boolean(window.location?.hostname?.includes('netlify.app'))
      const isStaticHost = err?.status === 503 || Boolean(err?.message?.includes('static host'))

      if (isStaticHost || isNetlify) {
        const cleanRole = role || 'child'
        const isTeacher = cleanRole === 'teacher'
        const isChild = cleanRole === 'child'

        const fallbackAuth = {
          token: `demo-${cleanRole}-token`,
          user: {
            id: isTeacher ? 1 : isChild ? 3 : 2,
            name: name.trim(),
            email: email.trim(),
            role: cleanRole,
            studentId: isChild ? 1 : null,
          },
        }
        setAuthState(fallbackAuth)
        setAuthToken(fallbackAuth.token)
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallbackAuth))
          }
        } catch {}
        return fallbackAuth
      }

      throw err
    }
  }, [])

  const authObj = {
    user: authState?.user || null,
    token: authState?.token || null,
    isAuthenticated: Boolean(authState?.token && authState?.user),
    role: authState?.user?.role || null,
  }

  const isReal = isRealBackendAuth(authObj)

  const value = {
    ...authObj,
    auth: authObj,
    isRealBackend: isReal,
    login,
    loginDemo,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function isRealBackendAuth(auth) {
  if (!auth?.isAuthenticated || !auth?.token) return false
  const t = String(auth.token).toLowerCase()
  return !t.includes('demo') && !t.includes('test') && !t.includes('local-session')
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

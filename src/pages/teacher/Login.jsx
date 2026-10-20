import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLink as Link } from '../../components/nav/AppLink'
import { Card, Button } from '../../components/ui'
import { ApiError } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { ChevronLeft, Eye, EyeOff } from 'lucide-react'

export default function TeacherLogin() {
  const [email, setEmail] = useState('teacher@readquest.demo')
  const [password, setPassword] = useState('demo1234')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { login, loginDemo } = useAuth()

  const handleDemoSignIn = () => {
    loginDemo('teacher', { id: 2, name: 'Demo Educator', email: email.trim() || 'teacher@readquest.demo', role: 'teacher' })
    navigate('/teacher/dashboard')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await login(email.trim(), password, 'teacher')
      navigate('/teacher/dashboard')
    } catch (err) {
      const isNetlify = typeof window !== 'undefined' && Boolean(window.location?.hostname?.includes('netlify.app'))
      const isStaticHost = err?.status === 503 || Boolean(err?.message?.includes('static host'))

      if (isStaticHost || isNetlify) {
        handleDemoSignIn()
        return
      }

      if (err instanceof ApiError && err.status === 401) {
        setError('Incorrect email or password.')
      } else if (err.message && err.message.includes('required for this portal')) {
        setError(err.message)
      } else if (err instanceof ApiError && err.status >= 500) {
        setError('Server is temporarily unavailable. Please try again later.')
      } else {
        setError('Unable to connect to server. Please check your connection or try again later.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2FBFC] text-[#08233A] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#13CFE3]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#0899AA]/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md bg-white border border-[#D7EEF1] p-8 rounded-3xl shadow-[0_16px_50px_rgba(8,35,58,0.08)] relative z-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[#527080] hover:text-[#08233A] text-sm font-semibold mb-6 transition-colors">
          <ChevronLeft size={16} /> Back to Home
        </Link>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-2xl shadow-xs">
            🍎
          </div>
        </div>
        <div className="text-center mb-6">
          <span className="text-[11px] font-extrabold tracking-widest text-emerald-700 uppercase bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">LexiGuide Educator</span>
          <h1 className="font-display font-black text-2xl text-[#08233A] mt-2">Teacher Login</h1>
          <p className="text-[#527080] text-xs mt-1">Sign in to view your class dashboard and student analytics.</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-[#08233A] uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              type="email"
              autoComplete="email"
              className="w-full bg-[#F2FBFC] border border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white rounded-2xl px-4 py-3 text-sm text-[#08233A] placeholder-[#527080] transition-colors outline-none"
              placeholder="Email"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#08233A] uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="w-full bg-[#F2FBFC] border border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white rounded-2xl px-4 py-3 pr-11 text-sm text-[#08233A] placeholder-[#527080] transition-colors outline-none"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#527080] hover:text-[#08233A] p-1 rounded-lg cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p className="text-[#D95C5C] text-xs font-bold text-center bg-rose-50 border border-rose-200 py-2 px-3 rounded-xl">{error}</p>}
          <Button
            type="submit"
            className="mt-2 bg-[#08233A] hover:bg-[#0B5264] text-white font-display font-black py-3.5 rounded-2xl shadow-md transition-all cursor-pointer"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center mt-4 pt-4 border-t border-[#D7EEF1]">
          <p className="text-xs text-[#527080]">
            Don't have an account?{' '}
            <Link to="/teacher/register" className="text-[#0899AA] hover:underline font-bold ml-1">
              Create Educator Account
            </Link>
          </p>
        </div>

        <div className="text-center mt-3 flex flex-col items-center gap-2">
          <Button
            type="button"
            onClick={handleDemoSignIn}
            className="w-full bg-[#E6F8FA] hover:bg-[#DDF9FC] text-[#08233A] border border-[#D7EEF1] font-display font-extrabold py-2.5 rounded-2xl shadow-xs transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
          >
            ⚡ One-Click Instant Demo Educator Access
          </Button>

          <button
            type="button"
            onClick={() => {
              setEmail('teacher@readquest.demo')
              setPassword('demo1234')
            }}
            className="text-[11px] text-[#527080] hover:text-[#08233A] inline-flex items-center gap-1 cursor-pointer"
          >
            Fill credentials: <code className="text-[#08233A] bg-[#E6F8FA] px-2 py-0.5 rounded-md border border-[#D7EEF1] font-mono">teacher@readquest.demo</code> / <code className="text-[#08233A] bg-[#E6F8FA] px-2 py-0.5 rounded-md border border-[#D7EEF1] font-mono">demo1234</code>
          </button>
        </div>
      </Card>
    </div>
  )
}

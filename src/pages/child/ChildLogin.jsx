import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLink as Link } from '../../components/nav/AppLink'
import { Card, Button } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { ApiError } from '../../services/api'
import { ChevronLeft, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react'

export default function ChildLogin() {
  const [identifier, setIdentifier] = useState('child.aarav@readquest.demo')
  const [password, setPassword] = useState('demo1234')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const navigate = useNavigate()
  const { login } = useAuth()
  const { refreshChildren, setActiveChildId } = useApp()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!identifier.trim()) {
      setError('Please type your name or email!')
      return
    }
    if (!password) {
      setError('Please type your secret code or password!')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const email = identifier.includes('@')
        ? identifier.trim().toLowerCase()
        : `${identifier.trim().toLowerCase().replace(/\s+/g, '')}@lexiguide.student`

      const authResult = await login(email, password, 'child')

      // Synchronize student records in real time
      if (typeof refreshChildren === 'function') {
        const students = await refreshChildren()
        if (authResult?.user?.studentId) {
          setActiveChildId(authResult.user.studentId)
        } else if (students && students.length > 0) {
          setActiveChildId(students[0].id)
        }
      }

      navigate('/child/home')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Secret code or account does not match. Ask an adult or try again!')
      } else if (err.message && err.message.includes('required for this portal')) {
        setError(err.message)
      } else if (err instanceof ApiError && err.status >= 500) {
        setError('The learning castle server is resting. Please try again in a moment.')
      } else {
        setError('Cannot connect to server. Please check your internet connection.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2FBFC] text-[#08233A] flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Soft ambient playful glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#13CFE3]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#FFC857]/20 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md bg-white border border-[#D7EEF1] p-6 sm:p-8 rounded-3xl shadow-[0_16px_50px_rgba(8,35,58,0.08)] relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[#527080] hover:text-[#08233A] text-sm font-semibold mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Home
        </Link>

        {/* Mascot / Avatar Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#DDF9FC] border-2 border-[#D7EEF1] flex items-center justify-center text-4xl shadow-sm mb-3">
            <span>🦊</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-wider text-[#0899AA] uppercase bg-[#E6F8FA] border border-[#D7EEF1] px-3 py-1 rounded-full">
            <Sparkles size={12} /> Student Sign In
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#08233A] mt-2">
            Welcome Back!
          </h1>
          <p className="text-[#527080] text-sm font-medium mt-1">
            Sign in to continue your magical reading quests!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-extrabold text-[#08233A] uppercase tracking-wider mb-1.5">
              My Email or Account Name
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-[#F2FBFC] border-2 border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white rounded-2xl px-4 py-3.5 text-sm sm:text-base font-medium text-[#08233A] placeholder-[#8EA4B0] transition-colors outline-none"
              placeholder="e.g. child.aarav@readquest.demo"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#08233A] uppercase tracking-wider mb-1.5">
              Secret Code or Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F2FBFC] border-2 border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white rounded-2xl px-4 py-3.5 pr-12 text-sm sm:text-base font-medium text-[#08233A] placeholder-[#8EA4B0] transition-colors outline-none"
                placeholder="Your secret code"
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#527080] hover:text-[#08233A] p-1.5 rounded-lg transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide secret code' : 'Show secret code'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-[11px] text-[#527080] font-medium mt-1 flex items-center gap-1">
              <KeyRound size={12} className="text-[#0899AA]" /> Tap the eye to see your secret code.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-[#D95C5C] text-xs font-bold rounded-xl py-2.5 px-3 text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-4 rounded-2xl bg-[#13CFE3] hover:bg-[#0899AA] text-[#08233A] hover:text-white font-display font-black text-base shadow-md transition-all cursor-pointer border-b-4 border-[#0899AA] active:border-b-0 active:translate-y-1"
          >
            {loading ? 'Checking your code... 🔑' : 'Start My Adventure! 🚀'}
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/child/register"
              className="text-xs font-bold text-[#0899AA] hover:underline"
            >
              Don't have a profile yet? Create an account 🌟
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}

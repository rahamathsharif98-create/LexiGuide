import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLink as Link } from '../../components/nav/AppLink'
import { Card, Button } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { ApiError } from '../../services/api'
import { ChevronLeft, Eye, EyeOff, Sparkles, KeyRound, UserCheck, ShieldCheck } from 'lucide-react'

const EXPLORERS = [
  { id: 1, name: 'Aarav', avatar: '🦊', title: 'Curious Explorer', level: 4, email: 'child.aarav@readquest.demo' },
  { id: 2, name: 'Meera', avatar: '🐼', title: 'Story Detective', level: 2, email: 'child.meera@readquest.demo' },
  { id: 3, name: 'Kabir', avatar: '🐯', title: 'Word Champion', level: 6, email: 'child.kabir@readquest.demo' },
  { id: 4, name: 'Zara', avatar: '🦄', title: 'Star Speller', level: 1, email: 'child.zara@readquest.demo' },
]

export default function ChildLogin() {
  const [selectedExplorer, setSelectedExplorer] = useState(EXPLORERS[0])
  const [mode, setMode] = useState('explorers') // 'explorers' | 'account'
  const [identifier, setIdentifier] = useState('child.aarav@readquest.demo')
  const [password, setPassword] = useState('demo1234')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const navigate = useNavigate()
  const { login, loginDemo } = useAuth()
  const { refreshChildren, setActiveChildId } = useApp()

  const handleQuickLogin = (studentId = selectedExplorer.id, studentName = selectedExplorer.name) => {
    loginDemo('child', {
      id: 3,
      name: studentName,
      email: `child.${studentName.toLowerCase()}@readquest.demo`,
      role: 'child',
      studentId,
    })
    if (typeof setActiveChildId === 'function') {
      setActiveChildId(studentId)
    }
    navigate('/child/home')
  }

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
          const matched = students.find(
            (s) =>
              s.name.toLowerCase() === identifier.trim().toLowerCase() ||
              identifier.toLowerCase().includes(s.name.toLowerCase())
          )
          setActiveChildId(matched ? matched.id : students[0].id)
        }
      }

      navigate('/child/home')
    } catch (err) {
      const isNetlify = typeof window !== 'undefined' && Boolean(window.location?.hostname?.includes('netlify.app'))
      const isStaticHost = err?.status === 503 || Boolean(err?.message?.includes('static host'))

      if (isStaticHost || isNetlify) {
        handleQuickLogin(selectedExplorer.id, selectedExplorer.name)
        return
      }

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
    <div className="min-h-screen bg-[#F2FBFC] text-[#08233A] flex items-center justify-center px-4 py-10 relative overflow-hidden font-sans">
      {/* Soft ambient playful background glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#13CFE3]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#FFC857]/20 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-lg bg-white border border-[#D7EEF1] p-6 sm:p-8 rounded-3xl shadow-[0_16px_50px_rgba(8,35,58,0.08)] relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[#527080] hover:text-[#08233A] text-sm font-semibold mb-4 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Portals
        </Link>

        {/* Mascot / Avatar Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#DDF9FC] border-2 border-[#D7EEF1] flex items-center justify-center text-4xl shadow-sm mb-2 transform hover:scale-105 transition-transform">
            <span>{selectedExplorer.avatar}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider text-[#0899AA] uppercase bg-[#E6F8FA] border border-[#D7EEF1] px-3 py-1 rounded-full">
            <Sparkles size={12} /> Student Adventure Portal
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#08233A] mt-2">
            Who's Learning Today?
          </h1>
          <p className="text-[#527080] text-xs sm:text-sm font-medium mt-1">
            Tap your explorer card to begin your magical reading journey!
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-[#F2FBFC] border border-[#D7EEF1] rounded-2xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('explorers')}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'explorers'
                ? 'bg-white text-[#08233A] shadow-xs border border-[#D7EEF1]'
                : 'text-[#527080] hover:text-[#08233A]'
            }`}
          >
            <span>🌟 Pick My Explorer</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('account')}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'account'
                ? 'bg-white text-[#08233A] shadow-xs border border-[#D7EEF1]'
                : 'text-[#527080] hover:text-[#08233A]'
            }`}
          >
            <span>🔑 School ID / Account</span>
          </button>
        </div>

        {mode === 'explorers' ? (
          <div>
            {/* Visual 4 Explorer Cards Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {EXPLORERS.map((exp) => {
                const isSelected = selectedExplorer.id === exp.id
                return (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => {
                      setSelectedExplorer(exp)
                      setIdentifier(exp.email)
                    }}
                    className={`flex flex-col items-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-center relative ${
                      isSelected
                        ? 'border-[#13CFE3] bg-[#E6F8FA] shadow-[0_8px_20px_rgba(19,207,227,0.2)] scale-[1.02]'
                        : 'border-[#D7EEF1] bg-white hover:bg-[#F2FBFC] hover:border-[#A8E5EC]'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#13CFE3] text-[#08233A] text-[9px] font-black flex items-center justify-center shadow-xs">
                        ✓
                      </span>
                    )}
                    <span className="text-4xl mb-1 select-none transform hover:scale-110 transition-transform">
                      {exp.avatar}
                    </span>
                    <span className="font-display font-extrabold text-[#08233A] text-sm sm:text-base">
                      {exp.name}
                    </span>
                    <span className="text-[10px] font-bold text-[#0899AA] bg-white border border-[#D7EEF1] px-2 py-0.5 rounded-full mt-1">
                      Level {exp.level}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Secret Code Input (Optional for younger children, default filled) */}
            <div className="mb-4 bg-[#F2FBFC] border border-[#D7EEF1] rounded-2xl p-3.5">
              <label className="block text-xs font-bold text-[#08233A] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound size={14} className="text-[#0899AA]" /> Secret Code or PIN:
                </span>
                <span className="text-[10px] text-[#527080] font-normal">Default: demo1234</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#D7EEF1] rounded-xl px-3.5 py-2 text-sm font-medium text-[#08233A] outline-none focus:border-[#13CFE3]"
                  placeholder="Secret code"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#527080] hover:text-[#08233A] p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-[#D95C5C] text-xs font-bold rounded-2xl p-3 text-center flex flex-col items-center gap-2">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => handleQuickLogin(selectedExplorer.id, selectedExplorer.name)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#13CFE3] text-[#08233A] font-extrabold rounded-xl text-xs shadow-xs hover:bg-[#0899AA] hover:text-white transition-colors cursor-pointer"
                >
                  <Sparkles size={13} /> Continue as {selectedExplorer.name} (Offline Mode) 🚀
                </button>
              </div>
            )}

            {/* Big Launch Adventure Button */}
            <Button
              type="button"
              onClick={() => handleQuickLogin(selectedExplorer.id, selectedExplorer.name)}
              className="w-full py-4 rounded-2xl bg-[#13CFE3] hover:bg-[#0899AA] text-[#08233A] hover:text-white font-display font-black text-base shadow-md transition-all cursor-pointer border-b-4 border-[#0899AA] active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2"
            >
              <span>Play as {selectedExplorer.name} {selectedExplorer.avatar}!</span>
              <span>🚀</span>
            </Button>
          </div>
        ) : (
          /* Form for custom account / school login */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-extrabold text-[#08233A] uppercase tracking-wider mb-1.5">
                My Email or Student Name
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-[#F2FBFC] border-2 border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white rounded-2xl px-4 py-3 text-sm font-medium text-[#08233A] placeholder-[#8EA4B0] transition-colors outline-none"
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
                  className="w-full bg-[#F2FBFC] border-2 border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white rounded-2xl px-4 py-3 pr-12 text-sm font-medium text-[#08233A] placeholder-[#8EA4B0] transition-colors outline-none"
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
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-[#D95C5C] text-xs font-bold rounded-2xl p-3 text-center flex flex-col items-center gap-2">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => handleQuickLogin(1, 'Aarav')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#13CFE3] text-[#08233A] font-extrabold rounded-xl text-xs shadow-xs hover:bg-[#0899AA] hover:text-white transition-colors cursor-pointer"
                >
                  <Sparkles size={13} /> Continue as Aarav (Offline Mode) 🚀
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-4 rounded-2xl bg-[#13CFE3] hover:bg-[#0899AA] text-[#08233A] hover:text-white font-display font-black text-base shadow-md transition-all cursor-pointer border-b-4 border-[#0899AA] active:border-b-0 active:translate-y-1"
            >
              {loading ? 'Checking your code... 🔑' : 'Start My Adventure! 🚀'}
            </Button>
          </form>
        )}

        <div className="text-center pt-4 mt-4 border-t border-[#D7EEF1]">
          <Link
            to="/child/register"
            className="text-xs font-bold text-[#0899AA] hover:underline inline-flex items-center gap-1"
          >
            <span>Don't have a profile yet? Create an account 🌟</span>
          </Link>
        </div>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLink as Link } from '../../components/nav/AppLink'
import { Card, Button } from '../../components/ui'
import { ApiError } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { ChevronLeft, GraduationCap } from 'lucide-react'

export default function TeacherRegister() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { register } = useAuth()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please enter your full name and title.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid school/work email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-check.')
      return
    }

    setLoading(true)
    try {
      await register(name.trim(), email.trim(), password, 'teacher')
      navigate('/teacher/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError(err.message || 'An account with this email already exists.')
      } else {
        setError(err.message || 'Unable to complete registration. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2FBFC] text-[#08233A] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#13CFE3]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#0899AA]/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md bg-white border border-[#D7EEF1] p-8 rounded-3xl shadow-[0_16px_50px_rgba(8,35,58,0.08)] relative z-10">
        <Link to="/teacher/login" className="inline-flex items-center gap-1.5 text-[#527080] hover:text-[#08233A] text-sm font-semibold mb-6 transition-colors">
          <ChevronLeft size={16} /> Back to Login
        </Link>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-2xl shadow-xs">
            🍎
          </div>
        </div>
        <div className="text-center mb-6">
          <span className="text-[11px] font-extrabold tracking-widest text-emerald-700 uppercase bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">LexiGuide Educator</span>
          <h1 className="font-display font-black text-2xl text-[#08233A] mt-2">Create Teacher Account</h1>
          <p className="text-[#527080] text-xs mt-1">Access classroom analytics, phonological screening, and tier support.</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-bold text-[#08233A] uppercase tracking-wider mb-1.5">Educator Name &amp; Title</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#F2FBFC] border border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white rounded-2xl px-4 py-3 text-sm text-[#08233A] placeholder-[#527080] transition-colors outline-none"
              placeholder="e.g. Ms. Ananya Rao"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#08233A] uppercase tracking-wider mb-1.5">School / Institutional Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full bg-[#F2FBFC] border border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white rounded-2xl px-4 py-3 text-sm text-[#08233A] placeholder-[#527080] transition-colors outline-none"
              placeholder="teacher@school.edu"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#08233A] uppercase tracking-wider mb-1.5">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full bg-[#F2FBFC] border border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white rounded-2xl px-4 py-3 text-sm text-[#08233A] placeholder-[#527080] transition-colors outline-none"
              placeholder="At least 6 characters"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#08233A] uppercase tracking-wider mb-1.5">Confirm Password</label>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              className="w-full bg-[#F2FBFC] border border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white rounded-2xl px-4 py-3 text-sm text-[#08233A] placeholder-[#527080] transition-colors outline-none"
              placeholder="Re-enter password"
              required
            />
          </div>

          {error && (
            <p className="text-[#D95C5C] text-xs font-bold text-center bg-rose-50 border border-rose-200 py-2.5 px-3 rounded-xl">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="mt-2 bg-[#08233A] hover:bg-[#0B5264] text-white font-display font-black py-3.5 rounded-2xl shadow-md transition-all"
            disabled={loading}
          >
            {loading ? 'Registering Educator…' : 'Complete Teacher Registration'}
          </Button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-[#D7EEF1]">
          <p className="text-xs text-[#527080]">
            Already have an account?{' '}
            <Link to="/teacher/login" className="text-[#0899AA] hover:underline font-bold ml-1">
              Sign In
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

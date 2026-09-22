import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLink as Link } from '../../components/nav/AppLink'
import { Card, Button } from '../../components/ui'
import { ApiError } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { ChevronLeft } from 'lucide-react'

export default function ParentLogin() {
  const [email, setEmail] = useState('parent@readquest.demo')
  const [password, setPassword] = useState('demo1234')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { login, loginDemo } = useAuth()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password, 'parent')
      navigate('/parent/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Incorrect email or password.')
      } else if (err.message && err.message.includes('required for this portal')) {
        setError(err.message)
      } else {
        setError('Unable to connect to server. Please check your connection or try again later.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2FBFC] text-[#08233A] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#13CFE3]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#0899AA]/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md bg-white border border-[#D7EEF1] p-8 rounded-3xl shadow-[0_16px_50px_rgba(8,35,58,0.08)] relative z-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[#527080] hover:text-[#08233A] text-sm font-semibold mb-6 transition-colors">
          <ChevronLeft size={16} /> Back to Home
        </Link>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 text-2xl shadow-xs">
            👩‍👧
          </div>
        </div>
        <div className="text-center mb-6">
          <span className="text-[11px] font-extrabold tracking-widest text-purple-700 uppercase bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">LexiGuide Family</span>
          <h1 className="font-display font-black text-2xl text-[#08233A] mt-2">Parent Login</h1>
          <p className="text-[#527080] text-xs mt-1">Sign in to view your child's learning journey and progress.</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-[#08233A] uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F2FBFC] border border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white rounded-2xl px-4 py-3 text-sm text-[#08233A] placeholder-[#527080] transition-colors outline-none"
              placeholder="Email"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#08233A] uppercase tracking-wider mb-1.5">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full bg-[#F2FBFC] border border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white rounded-2xl px-4 py-3 text-sm text-[#08233A] placeholder-[#527080] transition-colors outline-none"
              placeholder="Password"
            />
          </div>
          {error && <p className="text-[#D95C5C] text-xs font-bold text-center bg-rose-50 border border-rose-200 py-2 px-3 rounded-xl">{error}</p>}
          <Button
            type="submit"
            className="mt-2 bg-[#08233A] hover:bg-[#0B5264] text-white font-display font-black py-3.5 rounded-2xl shadow-md transition-all cursor-pointer"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>

          <button
            type="button"
            onClick={() => {
              loginDemo('parent')
              navigate('/parent/dashboard')
            }}
            className="w-full py-3 px-4 rounded-2xl bg-[#E6F8FA] hover:bg-[#D4F4F7] text-[#0899AA] border border-[#A5E7EE] font-display font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            ⚡ Instant Demo Access (No Password Needed)
          </button>
        </form>

        <div className="text-center mt-4 pt-4 border-t border-[#D7EEF1]">
          <p className="text-xs text-[#527080]">
            Don't have an account?{' '}
            <Link to="/parent/register" className="text-[#0899AA] hover:underline font-bold ml-1">
              Create Parent Account
            </Link>
          </p>
        </div>

        <div className="text-center mt-3">
          <button
            type="button"
            onClick={() => {
              setEmail('parent@readquest.demo')
              setPassword('demo1234')
            }}
            className="text-[11px] text-[#527080] hover:text-[#08233A] inline-flex items-center gap-1 cursor-pointer"
          >
            Demo account: <code className="text-[#08233A] bg-[#E6F8FA] px-2 py-0.5 rounded-md border border-[#D7EEF1] font-mono">parent@readquest.demo</code> / <code className="text-[#08233A] bg-[#E6F8FA] px-2 py-0.5 rounded-md border border-[#D7EEF1] font-mono">demo1234</code>
          </button>
        </div>
      </Card>
    </div>
  )
}

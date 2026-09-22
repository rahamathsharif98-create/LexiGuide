import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLink as Link } from '../../components/nav/AppLink'
import { Card, Button } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { ChevronLeft, ChevronRight, Sparkles, Compass, Check } from 'lucide-react'

const AVATARS = [
  { emoji: '🦊', label: 'Fox' },
  { emoji: '🐼', label: 'Panda' },
  { emoji: '🦁', label: 'Lion' },
  { emoji: '🐨', label: 'Koala' },
  { emoji: '🚀', label: 'Space Hero' },
  { emoji: '🐬', label: 'Dolphin' },
  { emoji: '🦄', label: 'Magic Unicorn' },
  { emoji: '⭐', label: 'Superstar' },
]

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
]

export default function StudentRegister() {
  const [step, setStep] = useState(1) // 1: Name & Age, 2: Avatar & Language, 3: Account & PIN
  const [name, setName] = useState('')
  const [age, setAge] = useState(7)
  const [avatar, setAvatar] = useState('🦊')
  const [motherTongue, setMotherTongue] = useState('en')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const navigate = useNavigate()
  const { register } = useAuth()
  const { registerNewChild, setActiveChildId } = useApp()

  const handleNext = () => {
    setError(null)
    if (step === 1) {
      if (!name.trim()) {
        setError('Please tell us your name!')
        return
      }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const studentEmail = email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 899 + 100)}@lexiguide.student`
    const studentPassword = password || 'student123'

    setLoading(true)
    try {
      // 1. Real account registration via /api/auth/register
      await register(name.trim(), studentEmail, studentPassword, 'child')

      // 2. Set up learner profile
      if (registerNewChild) {
        const newChildId = await registerNewChild({
          name: name.trim(),
          age: Number(age),
          avatar,
          mother_tongue: motherTongue,
          learning_language: 'en',
          interests: ['space', 'animals'],
        })
        if (newChildId) setActiveChildId(newChildId)
      }

      navigate('/child/home')
    } catch (err) {
      setError(err.message || 'Could not complete setup. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2FBFC] text-[#08233A] flex items-center justify-center px-6 py-12 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#13CFE3]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#FFC857]/15 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-lg bg-white border border-[#D7EEF1] p-8 rounded-3xl shadow-[0_16px_50px_rgba(8,35,58,0.08)] relative z-10">
        <Link to="/select-profile" className="inline-flex items-center gap-1.5 text-[#527080] hover:text-[#08233A] text-sm font-semibold mb-4 transition-colors">
          <ChevronLeft size={16} /> Back to Profile Selection
        </Link>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`h-2.5 rounded-full transition-all ${step >= 1 ? 'w-10 bg-[#13CFE3] shadow-xs' : 'w-3 bg-[#D7EEF1]'}`} />
          <div className={`h-2.5 rounded-full transition-all ${step >= 2 ? 'w-10 bg-[#13CFE3] shadow-xs' : 'w-3 bg-[#D7EEF1]'}`} />
          <div className={`h-2.5 rounded-full transition-all ${step >= 3 ? 'w-10 bg-[#13CFE3] shadow-xs' : 'w-3 bg-[#D7EEF1]'}`} />
        </div>

        {step === 1 && (
          <div>
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#DDF9FC] text-[#0899AA]">
                <Sparkles size={12} /> Step 1 of 3
              </span>
              <h1 className="font-display font-black text-2xl text-[#08233A] mt-2">What's Your Name? 👋</h1>
              <p className="text-[#527080] text-sm mt-1">Let's create your personal LexiGuide learning world.</p>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-[#08233A] uppercase tracking-wider mb-2">My First Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F2FBFC] border-2 border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white focus:ring-2 focus:ring-[#13CFE3]/20 rounded-2xl px-5 py-3.5 text-base text-[#08233A] placeholder-[#527080]/50 transition-all outline-none font-display font-bold"
                  placeholder="e.g. Maya"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08233A] uppercase tracking-wider mb-2">My Age: {age} Years Old</label>
                <div className="flex items-center justify-between gap-2">
                  {[4, 5, 6, 7, 8, 9, 10].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAge(a)}
                      className={`flex-1 py-3 rounded-2xl font-display font-extrabold text-sm transition-all cursor-pointer ${
                        age === a
                          ? 'bg-[#13CFE3] text-[#08233A] border-2 border-[#0899AA] shadow-md scale-105'
                          : 'bg-[#F2FBFC] border-2 border-[#D7EEF1] text-[#527080] hover:border-[#13CFE3]/40'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-rose-700 text-xs font-bold text-center bg-rose-50 border border-rose-200 py-2.5 px-3 rounded-xl">{error}</p>}

              <Button
                type="button"
                onClick={handleNext}
                className="mt-2 bg-gradient-to-r from-[#13CFE3] to-[#0899AA] hover:opacity-95 text-[#08233A] font-display font-black py-4 rounded-2xl shadow-lg shadow-[#13CFE3]/25 flex items-center justify-center gap-2 cursor-pointer text-base"
              >
                Choose My Mascot <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#DDF9FC] text-[#0899AA]">
                <Sparkles size={12} /> Step 2 of 3
              </span>
              <h1 className="font-display font-black text-2xl text-[#08233A] mt-2">Pick Your Learning Companion 🦊</h1>
              <p className="text-[#527080] text-sm mt-1">Choose your avatar and preferred home language.</p>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-[#08233A] uppercase tracking-wider mb-2">Avatar Companion</label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATARS.map((av) => (
                    <button
                      key={av.label}
                      type="button"
                      onClick={() => setAvatar(av.emoji)}
                      className={`p-3.5 rounded-2xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        avatar === av.emoji
                          ? 'bg-[#DDF9FC] border-2 border-[#13CFE3] shadow-md scale-105 text-[#08233A]'
                          : 'bg-[#F2FBFC] border-2 border-[#D7EEF1] hover:border-[#13CFE3]/40 text-[#527080]'
                      }`}
                    >
                      <span className="text-3xl">{av.emoji}</span>
                      <span className="text-[10px] font-bold">{av.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08233A] uppercase tracking-wider mb-2">Home Bridge Language</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setMotherTongue(lang.code)}
                      className={`p-3 rounded-2xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        motherTongue === lang.code
                          ? 'bg-[#DDF9FC] border-2 border-[#13CFE3] text-[#08233A] font-bold shadow-xs'
                          : 'bg-[#F2FBFC] border-2 border-[#D7EEF1] text-[#527080] hover:border-[#13CFE3]/40'
                      }`}
                    >
                      <span className="text-sm font-black">{lang.native}</span>
                      <span className="text-[10px] opacity-80">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="text-[#527080] hover:text-[#08233A] font-bold">
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-[#13CFE3] to-[#0899AA] hover:opacity-95 text-[#08233A] font-display font-black py-4 rounded-2xl shadow-lg shadow-[#13CFE3]/25 flex items-center justify-center gap-2 cursor-pointer text-base"
                >
                  Next Step <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#DDF9FC] text-[#0899AA]">
                <Sparkles size={12} /> Step 3 of 3
              </span>
              <h1 className="font-display font-black text-2xl text-[#08233A] mt-2">Ready for Adventure! 🚀</h1>
              <p className="text-[#527080] text-sm mt-1">Set an optional parent email &amp; PIN or enter directly.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#08233A] uppercase tracking-wider mb-1.5">
                  Parent / Student Email <span className="text-[#527080] font-normal">(Optional for quick start)</span>
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F2FBFC] border-2 border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white focus:ring-2 focus:ring-[#13CFE3]/20 rounded-2xl px-4 py-3 text-sm text-[#08233A] placeholder-[#527080]/50 transition-all outline-none"
                  placeholder={`e.g. ${name.toLowerCase().replace(/\s+/g, '') || 'learner'}@lexiguide.student`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08233A] uppercase tracking-wider mb-1.5">
                  Secret Passcode / PIN <span className="text-[#527080] font-normal">(Default: student123)</span>
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full bg-[#F2FBFC] border-2 border-[#D7EEF1] focus:border-[#13CFE3] focus:bg-white focus:ring-2 focus:ring-[#13CFE3]/20 rounded-2xl px-4 py-3 text-sm text-[#08233A] placeholder-[#527080]/50 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-rose-700 text-xs font-bold text-center bg-rose-50 border border-rose-200 py-2 px-3 rounded-xl">{error}</p>}

              <div className="p-4 rounded-2xl bg-[#E6F8FA] border border-[#13CFE3]/30 flex items-center gap-3 mt-1">
                <span className="text-3xl">{avatar}</span>
                <div className="text-xs">
                  <span className="font-bold text-[#08233A] block text-sm">{name || 'Explorer'}'s World</span>
                  <span className="text-[#527080]">Level 1 Learner · {age} yrs · Indian English Pacing</span>
                </div>
              </div>

              <div className="flex gap-3 mt-3">
                <Button variant="ghost" type="button" onClick={() => setStep(2)} className="text-[#527080] hover:text-[#08233A] font-bold">
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-[#13CFE3] to-[#0899AA] hover:opacity-95 text-[#08233A] font-display font-black py-4 rounded-2xl shadow-lg shadow-[#13CFE3]/25 cursor-pointer text-base"
                >
                  {loading ? 'Creating World…' : 'Start My Learning Adventure! ▶'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

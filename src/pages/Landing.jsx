import { useState, useEffect } from 'react'
import { AppLink as Link } from '../components/nav/AppLink'
import { endpoints } from '../services/api'
import { Sparkles, Compass, ShieldCheck, HeartHandshake, GraduationCap, ArrowRight, BookOpen } from 'lucide-react'

const roles = [
  {
    to: '/select-profile',
    badge: 'Child & Learner',
    title: "I'm a Learner",
    desc: "Start your magical learning adventure with games, stories, voice companions, and fun challenges!",
    cta: "Let's Go",
    icon: Compass,
    accent: 'from-[#13CFE3] to-[#0899AA]',
    borderHover: 'hover:border-[#13CFE3] hover:shadow-[0_12px_40px_rgba(19,207,227,0.18)]',
    btnBg: 'bg-[#13CFE3] hover:bg-[#0899AA] text-[#08233A] hover:text-white',
    iconBg: 'bg-[#DDF9FC] text-[#0899AA] border border-[#D7EEF1]',
    highlightBadge: 'Adventure & Fun',
    badgeColor: 'bg-[#DDF9FC] text-[#08233A] border-[#D7EEF1]',
  },
  {
    to: '/parent/login',
    badge: 'Parent & Guardian',
    title: "Parent Portal",
    desc: 'Follow and support your child’s reading journey, phonics progress, strength milestones, and daily rhythm.',
    cta: 'Continue to Portal',
    icon: HeartHandshake,
    accent: 'from-purple-500 to-indigo-600',
    borderHover: 'hover:border-purple-300 hover:shadow-[0_12px_40px_rgba(147,51,234,0.12)]',
    btnBg: 'bg-[#08233A] hover:bg-[#0B5264] text-white',
    iconBg: 'bg-purple-50 text-purple-700 border border-purple-100',
    highlightBadge: 'Growth & Insights',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    to: '/teacher/login',
    badge: 'Educator & Specialist',
    title: "Teacher Portal",
    desc: 'Support your classroom learners with actionable progress insights, targeted practice, and early literacy care.',
    cta: 'Educator Sign In',
    icon: GraduationCap,
    accent: 'from-emerald-500 to-teal-600',
    borderHover: 'hover:border-emerald-300 hover:shadow-[0_12px_40px_rgba(16,185,129,0.12)]',
    btnBg: 'bg-[#08233A] hover:bg-[#0B5264] text-white',
    iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    highlightBadge: 'Class Analytics',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
]

export default function Landing() {
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    let mounted = true
    endpoints.health()
      .then((res) => {
        if (mounted) {
          setBackendStatus(res?.status === 'ok' ? 'online' : 'offline')
        }
      })
      .catch(() => {
        if (mounted) setBackendStatus('offline')
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F2FBFC] text-[#08233A] flex flex-col justify-between selection:bg-[#13CFE3] selection:text-[#08233A] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#13CFE3]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#0899AA]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#DDF9FC] rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#13CFE3] to-[#0899AA] flex items-center justify-center text-white shadow-lg shadow-[#13CFE3]/25">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div>
            <span className="font-display font-black text-2xl tracking-tight text-[#08233A] flex items-center gap-1.5">
              Lexi<span className="text-[#0899AA]">Guide</span>
            </span>
            <span className="block text-[10px] font-bold tracking-widest text-[#527080] uppercase -mt-0.5">
              Intelligent Learning Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-[#527080]">
          <span
            data-testid="backend-status-indicator"
            title={backendStatus === 'online' ? 'Connected to FastAPI backend services.' : 'Running client-side speech synthesis, WebGL 3D worlds, and adaptive activities.'}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border shadow-xs transition-all ${
              backendStatus === 'online'
                ? 'bg-[#EAFBF3] border-[#A8EBC7] text-[#1E7E51]'
                : backendStatus === 'checking'
                ? 'bg-white border-[#D7EEF1] text-[#527080]'
                : 'bg-[#E6F8FA] border-[#A8E5EC] text-[#0899AA]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full inline-block ${
                backendStatus === 'online'
                  ? 'bg-[#39B87F] animate-ping'
                  : backendStatus === 'checking'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-[#13CFE3]'
              }`}
            />
            {backendStatus === 'online'
              ? '🟢 AI Backend Connected'
              : backendStatus === 'checking'
              ? 'Connecting to Backend...'
              : '⚡ Interactive Web Engine (Ready)'}
          </span>
        </div>
      </header>

      {/* Main Hero & Role Selection */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {/* Hero Narrative */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DDF9FC] border border-[#D7EEF1] text-[#08233A] text-xs font-extrabold tracking-wide uppercase mb-6 shadow-xs">
            <Sparkles size={14} className="text-[#0899AA]" />
            Welcome to the Future of Early Literacy
          </div>

          <h1 className="font-display font-black text-4xl sm:text-6xl text-[#08233A] tracking-tight leading-[1.15] mb-5">
            Learn. Explore.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#13CFE3] via-[#0899AA] to-[#08233A]">
              Shine.
            </span>
          </h1>

          <p className="text-[#527080] text-base sm:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            Empowering every child with personalized phonics, interactive speech adventures, and gentle early reading guidance that feels like play.
          </p>

          <p className="text-xs text-[#527080]/90 mt-4 max-w-xl mx-auto font-medium">
            An early reading-risk profiling platform with educational screening and personalized literacy acceleration — designed with pediatric care, speech pacing, and multilingual mother-tongue support.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
          {roles.map((r) => {
            const Icon = r.icon
            return (
              <Link
                key={r.to}
                to={r.to}
                className={`group relative flex flex-col bg-white border border-[#D7EEF1] ${r.borderHover} rounded-3xl p-7 transition-all duration-300 hover:-translate-y-2 shadow-[0_8px_30px_rgba(8,35,58,0.06)]`}
              >
                {/* Top Badge & Icon */}
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${r.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                    <Icon size={28} />
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${r.badgeColor}`}>
                    {r.highlightBadge}
                  </span>
                </div>

                {/* Card Headings */}
                <div className="flex-1">
                  <span className="text-xs font-bold text-[#0899AA] tracking-wide uppercase block mb-1">
                    {r.badge}
                  </span>
                  <h2 className="font-display font-extrabold text-2xl text-[#08233A] mb-2 group-hover:text-[#0899AA] transition-colors">
                    {r.title}
                  </h2>
                  <p className="text-sm text-[#527080] leading-relaxed">
                    {r.desc}
                  </p>
                </div>

                {/* Bottom CTA Button */}
                <div className="mt-8 pt-5 border-t border-[#D7EEF1] flex items-center justify-between">
                  <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-display font-extrabold text-xs shadow-sm transition-all duration-200 ${r.btnBg}`}>
                    {r.cta}
                    <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                  <span className="text-xs font-bold text-[#527080] group-hover:text-[#08233A]">
                    Explore →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 border-t border-[#D7EEF1] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#527080]">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-[#08233A]">LexiGuide</span>
          <span>·</span>
          <span>Intelligent Early Literacy &amp; Reading Support Platform</span>
        </div>
        <p className="text-center sm:text-right text-[11px] text-[#527080]">
          Educational screening and adaptive learning tool — not a medical or clinical diagnosis.
        </p>
      </footer>
    </div>
  )
}

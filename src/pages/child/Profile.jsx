import { useState } from 'react'
import { AppLink as Link } from '../../components/nav/AppLink'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { ProfileAvatar } from '../../components/ProfileAvatar'
import { Card, Button } from '../../components/ui'
import { ACHIEVEMENTS } from '../../data/demoData'
import { resolveThemePackage } from '../../services/personalizationService'
import { Settings, Trophy, Fingerprint, LogOut, Sparkles, Compass, Star, Flame, BookOpen, Mic, Gamepad2, ArrowRight } from 'lucide-react'

export default function Profile() {
  const { activeChild, updateActiveChild } = useApp()
  const navigate = useNavigate()
  const theme = resolveThemePackage(activeChild?.interests)
  const earnedCount = ACHIEVEMENTS.filter((a) => a.earned).length

  const COLOR_GRADIENTS = {
    brand: 'from-[#08233A] via-[#0B5264] to-[#13CFE3]',
    mint: 'from-[#0B4D36] via-[#157347] to-[#39B87F]',
    sun: 'from-[#6E3C00] via-[#B45309] to-[#FFC857]',
    berry: 'from-[#3B0764] via-[#6D28D9] to-[#A78BFA]',
    peach: 'from-[#5F1D1D] via-[#BE123C] to-[#FB7185]',
  }

  const journeyMilestones = [
    { level: 1, title: 'Sound Explorer', icon: '🦁', unlocked: true, desc: 'Phonics & Letter Detective mastery' },
    { level: 2, title: 'Word Builder', icon: '🧩', unlocked: (activeChild?.level || 1) >= 2, desc: 'Blending sight words and vowels' },
    { level: 3, title: 'Story Voyager', icon: '📖', unlocked: (activeChild?.level || 1) >= 3, desc: 'Fluent passage reading with mascot' },
    { level: 4, title: 'Speech Champion', icon: '🎤', unlocked: (activeChild?.level || 1) >= 4, desc: 'Clear pronunciation & speech confidence' },
    { level: 5, title: 'LexiMaster', icon: '👑', unlocked: (activeChild?.level || 1) >= 5, desc: 'Mastery of foundational reading' },
  ]

  const quickActivities = [
    { label: 'Read With Me', icon: BookOpen, emoji: '📖', route: '/child/read', color: 'from-[#13CFE3] to-[#0899AA]' },
    { label: 'Speak & Shine', icon: Mic, emoji: '🎤', route: '/child/speak', color: 'from-[#FFC857] to-[#E5A82E]' },
    { label: 'Trace & Speak', icon: Gamepad2, emoji: '✍️', route: '/child/games/trace-speak', color: 'from-[#39B87F] to-[#2E9968]' },
  ]

  const links = [
    { to: '/child/journey', icon: Fingerprint, label: 'My Reading Fingerprint', desc: 'See your skill growth and balance' },
    { to: '/child/achievements', icon: Trophy, label: 'Badge Vault', desc: `${earnedCount} of ${ACHIEVEMENTS.length} badges collected` },
    { to: '/child/settings', icon: Settings, label: 'Sound & Comfort Settings', desc: 'Audio atmosphere, quiet mode & fonts' },
  ]

  const [selectedAvatar, setSelectedAvatar] = useState(activeChild?.avatar || '🦊')
  const [selectedColor, setSelectedColor] = useState(activeChild?.color || 'brand')

  const AVATARS = ['🦊', '🐼', '🦁', '🐻', '🐱', '🚀', '🐬', '🐨']
  const ACCENT_COLORS = [
    { id: 'brand', label: 'Soft Cyan', bg: 'bg-[#13CFE3]', border: 'border-[#0899AA]' },
    { id: 'mint', label: 'Mint Green', bg: 'bg-[#39B87F]', border: 'border-[#2E9566]' },
    { id: 'sun', label: 'Soft Yellow', bg: 'bg-[#FFC857]', border: 'border-[#D49300]' },
    { id: 'berry', label: 'Lavender', bg: 'bg-[#A78BFA]', border: 'border-[#8B5CF6]' },
    { id: 'peach', label: 'Peach', bg: 'bg-[#FB7185]', border: 'border-[#E11D48]' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* 1. Hero Card: My Space & Character Presence */}
      <div className={`relative rounded-3xl bg-gradient-to-r ${COLOR_GRADIENTS[selectedColor] || COLOR_GRADIENTS.brand} border border-white/20 p-7 text-white shadow-[0_12px_40px_rgba(8,35,58,0.12)] overflow-hidden transition-all duration-500`}>
        <div className="absolute -right-8 -bottom-8 text-9xl opacity-15 select-none pointer-events-none">
          {selectedAvatar}
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative">
            <ProfileAvatar emoji={selectedAvatar} colorName={selectedColor} size={96} ring />
            <span className="absolute -bottom-1 -right-1 bg-[#13CFE3] text-[#08233A] text-xs font-black px-2.5 py-0.5 rounded-full border-2 border-white shadow-sm">
              Lvl {activeChild.level}
            </span>
          </div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white border border-white/25 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={13} />
              <span>Learner World · {theme.name} Explorer</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">{activeChild.name}'s Space</h1>
            <p className="text-[#DDF9FC] text-xs sm:text-sm mt-1">
              Age {activeChild.age} · Companion: <strong className="text-white">{theme.mascot}</strong>
            </p>
          </div>
        </div>

        {/* Tactile Progress Stats Grid */}
        <div className="grid grid-cols-4 gap-2.5 mt-6 pt-6 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-display font-black text-[#FFC857] leading-none">{activeChild.streak} 🔥</p>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-1">Streak</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-display font-black text-[#FFC857] leading-none">{activeChild.stars} ⭐</p>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-1">Stars</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-display font-black text-[#DDF9FC] leading-none">{activeChild.xp}</p>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-1">XP Points</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-display font-black text-white leading-none">{earnedCount}/{ACHIEVEMENTS.length}</p>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-1">Badges</p>
          </div>
        </div>
      </div>

      {/* 2. Avatar & Color Customization (Section 7 & 8) */}
      <div className="bg-white rounded-3xl p-6 border border-[#D7EEF1] shadow-[0_8px_30px_rgba(8,35,58,0.06)] space-y-4">
        <div>
          <h2 className="font-display font-black text-base text-[#08233A] mb-2 flex items-center gap-2">
            <span>Choose Your Companion Avatar</span>
            <span className="text-xs font-bold text-[#0899AA] bg-[#DDF9FC] px-2.5 py-0.5 rounded-full border border-[#D7EEF1]">
              Tap to Pick
            </span>
          </h2>
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => {
                  setSelectedAvatar(av)
                  updateActiveChild?.({ avatar: av })
                }}
                className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition-all cursor-pointer border-2 ${
                  selectedAvatar === av
                    ? 'border-[#13CFE3] bg-[#DDF9FC] scale-110 shadow-xs'
                    : 'border-[#D7EEF1] bg-[#F2FBFC] hover:bg-white'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[#D7EEF1]">
          <h3 className="font-display font-black text-xs text-[#08233A] uppercase tracking-wider mb-2">
            Favorite Accent Color
          </h3>
          <div className="flex gap-3 items-center">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedColor(c.id)
                  updateActiveChild?.({ color: c.id })
                }}
                className={`w-8 h-8 rounded-full ${c.bg} transition-all cursor-pointer border-2 ${
                  selectedColor === c.id ? `${c.border} ring-2 ring-[#08233A] scale-110` : 'border-white'
                }`}
                title={c.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. Learner Profile Info (Section 25) */}
      <div className="bg-white rounded-3xl p-6 border border-[#D7EEF1] shadow-[0_8px_30px_rgba(8,35,58,0.06)]">
        <h2 className="font-display font-black text-base text-[#08233A] mb-3">
          My Language &amp; Learning Profile
        </h2>
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-[#F2FBFC] border border-[#D7EEF1]">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#527080]">Learner Name</p>
            <p className="font-display font-black text-sm text-[#08233A] mt-0.5">{activeChild.name}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F2FBFC] border border-[#D7EEF1]">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#527080]">Learning Language</p>
            <p className="font-display font-black text-sm text-[#08233A] mt-0.5">English 🇬🇧</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F2FBFC] border border-[#D7EEF1]">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#527080]">Mother Tongue</p>
            <p className="font-display font-black text-sm text-[#08233A] mt-0.5">
              {activeChild.language === 'te' ? 'Telugu (తెలుగు)' : activeChild.language === 'hi' ? 'Hindi (हिंदी)' : 'English'}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F2FBFC] border border-[#D7EEF1]">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#527080]">Atmosphere Music</p>
            <p className="font-display font-black text-sm text-[#08233A] mt-0.5">Gentle Ambience 🎵</p>
          </div>
        </div>
      </div>

      {/* 4. Quick Launch: Favorite Activities */}
      <div className="bg-white rounded-3xl p-6 border border-[#D7EEF1] shadow-[0_8px_30px_rgba(8,35,58,0.06)]">
        <h2 className="font-display font-black text-base text-[#08233A] mb-3 flex items-center gap-2">
          <span>My Favorite Learning Worlds</span>
          <span className="text-xs font-bold text-[#08233A] bg-[#DDF9FC] px-2.5 py-0.5 rounded-full border border-[#D7EEF1]">
            Jump In
          </span>
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActivities.map((act) => (
            <button
              key={act.label}
              onClick={() => navigate(act.route)}
              className="p-3.5 rounded-2xl bg-[#F2FBFC] hover:bg-[#E6F8FA] border border-[#D7EEF1] hover:border-[#13CFE3] text-center transition-all cursor-pointer group active:scale-95 shadow-2xs"
            >
              <div className="text-3xl mb-1 group-hover:scale-110 transition-transform select-none">
                {act.emoji}
              </div>
              <p className="font-display font-bold text-xs text-[#08233A] group-hover:text-[#0899AA] transition-colors truncate">
                {act.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Visual Journey Path: Adventure Road */}
      <div className="bg-white rounded-3xl p-6 border border-[#D7EEF1] shadow-[0_8px_30px_rgba(8,35,58,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-black text-base text-[#08233A] flex items-center gap-2">
              <Compass size={18} className="text-[#0899AA]" />
              My Learning Path
            </h2>
            <p className="text-xs text-[#527080] font-medium">Step through milestones to level up!</p>
          </div>
          <span className="text-xs font-bold text-[#08233A] bg-[#DDF9FC] border border-[#D7EEF1] px-3 py-1 rounded-full">
            Stage {activeChild.level} of 5
          </span>
        </div>

        <div className="space-y-3">
          {journeyMilestones.map((m) => (
            <div
              key={m.level}
              className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                m.unlocked
                  ? 'bg-[#F2FBFC] border-[#D7EEF1] text-[#08233A] shadow-2xs'
                  : 'bg-[#F2FBFC]/50 border-[#D7EEF1]/60 text-[#527080] opacity-60'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                m.unlocked ? 'bg-white shadow-xs border border-[#D7EEF1]' : 'bg-slate-200/70'
              }`}>
                {m.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm truncate text-[#08233A]">{m.title}</span>
                  {m.unlocked ? (
                    <span className="text-[10px] font-extrabold bg-[#E6F8FA] text-[#0899AA] border border-[#D7EEF1] px-2 py-0.5 rounded-md">
                      Unlocked ⭐
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                      Level {m.level} Goal
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5 truncate text-[#527080]">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Space Portals & Settings */}
      <div className="grid sm:grid-cols-2 gap-3">
        {links.map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to} className="group block">
            <Card hover className="flex items-center gap-3.5 p-4 h-full border border-[#D7EEF1] hover:border-[#13CFE3] transition-all bg-white shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#DDF9FC] flex items-center justify-center text-[#0899AA] shrink-0 group-hover:scale-110 transition-transform">
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-[#08233A] group-hover:text-[#0899AA] transition-colors truncate">{label}</p>
                <p className="text-[11px] text-[#527080] truncate mt-0.5">{desc}</p>
              </div>
              <ArrowRight size={15} className="text-[#527080] group-hover:text-[#13CFE3] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Card>
          </Link>
        ))}

        <Link to="/select-profile" className="group block sm:col-span-2">
          <Card hover className="flex items-center justify-between p-4 border border-[#D7EEF1] hover:border-[#13CFE3] transition-all bg-white shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E6F8FA] flex items-center justify-center text-[#0899AA] shrink-0">
                <LogOut size={20} />
              </div>
              <div>
                <p className="font-display font-bold text-sm text-[#08233A]">Switch Profile</p>
                <p className="text-[11px] text-[#527080]">Change who is learning or add a new learner</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#08233A] bg-[#DDF9FC] px-3 py-1.5 rounded-xl border border-[#D7EEF1]">
              Switch
            </span>
          </Card>
        </Link>
      </div>
    </div>
  )
}


import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui'
import ChildSetupFlow from '../../components/ChildSetupFlow'

export default function ProfileSelect() {
  const { childrenState, setActiveChildId, registerNewChild, showToast } = useApp()
  const { login, isAuthenticated } = useAuth()
  const [isSettingUp, setIsSettingUp] = useState(false)
  const navigate = useNavigate()

  const choose = async (id) => {
    setActiveChildId(id)
    if (!isAuthenticated) {
      try {
        await login('child.aarav@readquest.demo', 'demo1234', 'child')
      } catch {
        // Gracefully continue in offline mode if backend is unreachable
      }
    }
    navigate('/child/home')
  }

  const handleSetupComplete = async (profilePayload) => {
    try {
      const newChildId = await registerNewChild(profilePayload)
      showToast(`Welcome, ${profilePayload.name}! Your world is ready! 🌟`, 'success')
      setIsSettingUp(false)
      setActiveChildId(newChildId)
      navigate('/child/home')
    } catch (err) {
      showToast('Could not complete setup. Please try again.', 'error')
    }
  }

  if (isSettingUp) {
    return (
      <ChildSetupFlow
        onComplete={handleSetupComplete}
        onCancel={() => setIsSettingUp(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F2FBFC] flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden" data-testid="profile-select-screen">
      {/* Soft ambient background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-gradient-to-b from-[#DDF9FC]/60 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#DDF9FC] border border-[#D7EEF1] text-[#08233A] text-xs font-bold uppercase tracking-wider mb-4">
          <span>🌟</span> Welcome Explorer
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[#08233A] tracking-tight mb-2">Who's learning today?</h1>
        <p className="text-[#527080] font-medium text-base">Tap your picture to start!</p>
      </div>

      <div className="relative z-10 flex flex-wrap justify-center gap-8 max-w-2xl">
        {childrenState.map((c) => (
          <button key={c.id} onClick={() => choose(c.id)} className="group flex flex-col items-center gap-2.5 transition-all">
            <div className="w-36 h-36 flex items-center justify-center bg-white rounded-[28px] border-2 border-[#D7EEF1] shadow-[0_8px_30px_rgba(8,35,58,0.08)] group-hover:border-[#13CFE3] group-hover:shadow-[0_16px_40px_rgba(19,207,227,0.22)] group-hover:-translate-y-1.5 transition-all duration-200">
              <span className="text-6xl select-none transform transition-transform duration-200 group-hover:scale-110">{c.avatar}</span>
            </div>
            <span className="font-display font-extrabold text-[#08233A] text-lg group-hover:text-[#0899AA] transition-colors">{c.name}</span>
            <span className="text-xs font-bold text-[#08233A] bg-[#DDF9FC] border border-[#D7EEF1] px-3 py-0.5 rounded-full -mt-1 shadow-xs">Level {c.level}</span>
          </button>
        ))}

        <button
          onClick={() => setIsSettingUp(true)}
          className="group flex flex-col items-center gap-2.5"
          data-testid="add-profile-btn"
        >
          <div className="w-36 h-36 flex items-center justify-center rounded-[28px] border-2 border-dashed border-[#D7EEF1] bg-white/70 text-[#0899AA] group-hover:border-[#13CFE3] group-hover:bg-white group-hover:text-[#13CFE3] group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_30px_rgba(19,207,227,0.15)] transition-all duration-200">
            <span className="text-5xl select-none transition-transform duration-200 group-hover:scale-110">➕</span>
          </div>
          <span className="font-display font-bold text-[#527080] text-lg group-hover:text-[#08233A] transition-colors">Add New Profile</span>
          <span className="text-xs font-medium text-transparent select-none">-</span>
        </button>
      </div>
    </div>
  )
}

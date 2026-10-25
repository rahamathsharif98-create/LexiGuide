import { useState, useRef, useEffect } from 'react'
import { LayoutDashboard, TrendingUp, Fingerprint, BookOpen, Sparkles, Settings, FileText, ChevronDown, User, LogOut } from 'lucide-react'
import { DashboardShell } from '../../components/nav/DashboardShell'
import { useApp } from '../../context/AppContext'
import { useAuth, isRealBackendAuth } from '../../context/AuthContext'
import { Toast } from '../../components/ui'
import { useNavigate } from 'react-router-dom'
import { endpoints } from '../../services/api'

// Exactly 5 primary destinations, per spec — Settings/Reports live behind
// the avatar menu, not the primary nav.
const navItems = [
  { to: '/parent/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/parent/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/parent/fingerprint', icon: Fingerprint, label: 'Reading Fingerprint' },
  { to: '/parent/activities', icon: BookOpen, label: 'Activities' },
  { to: '/parent/recommendations', icon: Sparkles, label: 'Recommendations' },
]

export function ParentShell({ title, subtitle, children }) {
  const { childrenState, activeChildId, setActiveChildId, toast } = useApp()
  const { auth, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [realChildren, setRealChildren] = useState(null)
  const isReal = isRealBackendAuth(auth)

  useEffect(() => {
    let active = true
    if (isReal) {
      endpoints.parentChildren()
        .then((res) => {
          if (active && Array.isArray(res)) {
            setRealChildren(res)
            if (res.length > 0 && !res.some((c) => String(c.id) === String(activeChildId))) {
              setActiveChildId(res[0].id)
            }
          }
        })
        .catch(() => {})
    } else {
      setRealChildren(null)
    }
    return () => { active = false }
  }, [isReal])

  useEffect(() => {
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const effectiveChildren = realChildren !== null ? realChildren : childrenState

  return (
    <DashboardShell
      role="Parent"
      navItems={navItems}
      title={title}
      subtitle={subtitle}
      right={
        <div className="flex items-center gap-2.5">
          {effectiveChildren.length > 0 ? (
            <div className="relative">
              <select
                value={activeChildId}
                onChange={(e) => setActiveChildId(Number(e.target.value) || e.target.value)}
                className="appearance-none bg-white border border-[#D7EEF1] rounded-xl pl-3 pr-8 py-2 text-sm font-bold text-[#08233A] hover:border-[#13CFE3] outline-none transition-colors shadow-xs"
              >
                {effectiveChildren.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.avatar || '👤'} {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#527080] pointer-events-none" />
            </div>
          ) : (
            <span className="text-xs text-[#527080]">No children linked</span>
          )}

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-10 h-10 rounded-full bg-[#DDF9FC] text-[#08233A] border border-[#D7EEF1] flex items-center justify-center hover:bg-[#13CFE3] hover:text-[#08233A] transition-colors shadow-xs"
              aria-label="Parent menu"
            >
              <User size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-[0_12px_40px_rgba(8,35,58,0.12)] border border-[#D7EEF1] py-2 z-50 animate-pop">
                <button onClick={() => { setMenuOpen(false); navigate('/parent/reports') }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#08233A] hover:bg-[#E6F8FA] transition-colors">
                  <FileText size={16} className="text-[#0899AA]" /> Reports
                </button>
                <button onClick={() => { setMenuOpen(false); navigate('/parent/settings') }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#08233A] hover:bg-[#E6F8FA] transition-colors">
                  <Settings size={16} className="text-[#0899AA]" /> Settings
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    logout()
                    navigate('/parent/login')
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#D95C5C] hover:bg-rose-50 border-t border-[#D7EEF1] transition-colors"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      }
    >
      {children}
      <Toast toast={toast} />
    </DashboardShell>
  )
}

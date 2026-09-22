import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, TrendingUp, Sparkles, Settings, FileText, User, LogOut } from 'lucide-react'
import { DashboardShell } from '../../components/nav/DashboardShell'
import { useApp } from '../../context/AppContext'
import { useAuth, isRealBackendAuth } from '../../context/AuthContext'
import { Toast } from '../../components/ui'
import { getTeacherClasses } from '../../services/teacherService'
import { endpoints } from '../../services/api'

// Exactly 5 primary destinations, per spec.
const navItems = [
  { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/teacher/students', icon: Users, label: 'Students' },
  { to: '/teacher/progress', icon: TrendingUp, label: 'Class Progress' },
  { to: '/teacher/recommendations', icon: Sparkles, label: 'Recommendations' },
  { to: '/teacher/settings', icon: Settings, label: 'Settings' },
]

export function TeacherShell({ title, subtitle, children }) {
  const { toast } = useApp()
  const { auth, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const isReal = isRealBackendAuth(auth)
  const [realClasses, setRealClasses] = useState(null)

  useEffect(() => {
    let active = true
    if (isReal) {
      endpoints.classes()
        .then((res) => {
          if (active && Array.isArray(res)) setRealClasses(res)
        })
        .catch(() => {})
    } else {
      setRealClasses(null)
    }
    return () => { active = false }
  }, [isReal])

  const demoClasses = getTeacherClasses()
  const currentClass = realClasses && realClasses.length > 0 ? realClasses[0] : demoClasses[0]

  useEffect(() => {
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <DashboardShell
      role="Teacher"
      navItems={navItems}
      title={title}
      subtitle={subtitle}
      right={
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 bg-white border border-[#D7EEF1] rounded-xl px-3 py-2 text-sm font-bold text-[#08233A] shadow-xs">
            🏫 {currentClass?.name || 'My Classroom'}
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-10 h-10 rounded-full bg-[#DDF9FC] text-[#08233A] border border-[#D7EEF1] flex items-center justify-center hover:bg-[#13CFE3] hover:text-[#08233A] transition-colors shadow-xs"
              aria-label="Teacher menu"
            >
              <User size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-[0_12px_40px_rgba(8,35,58,0.12)] border border-[#D7EEF1] py-2 z-50 animate-pop">
                <button onClick={() => { setMenuOpen(false); navigate('/teacher/reports') }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#08233A] hover:bg-[#E6F8FA] transition-colors">
                  <FileText size={16} className="text-[#0899AA]" /> Reports
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    logout()
                    navigate('/teacher/login')
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

import { AppNavLink as NavLink } from './AppLink'
import { Home, BookOpen, Gamepad2, Library, Star, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import audioAtmosphereService from '../../services/audioAtmosphereService'

// Exactly 5 primary destinations — calm, predictable, age-appropriate.
// Profile and Comfort/Settings are accessible via the top bar and sidebar footer.
const items = [
  { to: '/child/home', icon: Home, key: 'home', emoji: '🏠' },
  { to: '/child/learn', icon: BookOpen, key: 'learn', emoji: '📚' },
  { to: '/child/games', icon: Gamepad2, key: 'play', emoji: '🎮' },
  { to: '/child/stories', icon: Library, key: 'stories', emoji: '📖' },
  { to: '/child/journey', icon: Star, key: 'journey', emoji: '⭐' },
]

export function ChildBottomNav() {
  const { tr } = useApp()
  return (
    <nav
      aria-label="Child Primary Navigation"
      className="fixed bottom-0 left-0 right-0 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#D7EEF1] shadow-[0_-4px_24px_rgba(8,35,58,0.06)] z-40 md:hidden"
    >
      <div className="flex justify-around items-center py-2 px-2 max-w-lg mx-auto">
        {items.map(({ to, icon: Icon, key, emoji }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => {
              try { audioAtmosphereService?.playChime?.(560, 0.05) } catch {}
            }}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl min-h-[52px] justify-center transition-all active:scale-95 touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-[#13CFE3] ${
                isActive
                  ? 'text-[#08233A] font-extrabold'
                  : 'text-[#527080] hover:text-[#08233A] font-semibold'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1.5 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-[#DDF9FC] text-[#0899AA] shadow-xs scale-110 border border-[#D7EEF1]'
                      : 'bg-transparent text-[#527080]'
                  }`}
                >
                  <Icon size={22} className={isActive ? 'text-[#0899AA]' : 'text-[#527080]'} />
                </div>
                <span className="text-[11px] font-display font-bold mt-0.5 tracking-tight">
                  {tr(key)}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#13CFE3] mt-0.5 animate-pulse" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function ChildSidebar() {
  const { tr } = useApp()
  return (
    <nav
      aria-label="Child Desktop Navigation"
      className="hidden md:flex flex-col w-64 shrink-0 border-r border-[#D7EEF1] bg-[#FFFFFF] h-screen sticky top-0 py-6 px-4 justify-between select-none shadow-[4px_0_24px_rgba(8,35,58,0.03)]"
    >
      <div>
        <div className="flex items-center gap-3 px-3 mb-8">
          <span className="text-3xl animate-bounce">🧸</span>
          <div>
            <span className="font-display font-black text-xl text-[#08233A] block tracking-tight">
              LexiGuide
            </span>
            <span className="text-[11px] font-extrabold text-[#0899AA] block -mt-1 uppercase tracking-wider">
              Learning World
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {items.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                try { audioAtmosphereService?.playChime?.(560, 0.05) } catch {}
              }}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-display font-bold text-sm transition-all border outline-none focus-visible:ring-2 focus-visible:ring-[#13CFE3] ${
                  isActive
                    ? 'bg-[#DDF9FC] text-[#08233A] border-[#D7EEF1] shadow-xs translate-x-1'
                    : 'border-transparent text-[#527080] hover:bg-[#F2FBFC] hover:text-[#08233A]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isActive ? 'bg-white text-[#0899AA] shadow-2xs' : 'text-[#527080]'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-[#0899AA]' : 'text-[#527080]'} />
                  </div>
                  <span className="flex-1">{tr(key)}</span>
                  {key === 'play' && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#FFE8EC] text-[#E0245E] border border-[#FDCED6]">
                      Games 🎮
                    </span>
                  )}
                  {isActive && <span className="w-2 h-2 rounded-full bg-[#13CFE3]" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-[#D7EEF1] flex flex-col gap-1.5">
        <NavLink
          to="/child/profile"
          onClick={() => {
            try { audioAtmosphereService?.playChime?.(560, 0.05) } catch {}
          }}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-display font-bold text-xs transition-all border ${
              isActive
                ? 'bg-[#DDF9FC] text-[#08233A] border-[#D7EEF1]'
                : 'border-transparent text-[#527080] hover:bg-[#F2FBFC] hover:text-[#08233A]'
            }`
          }
        >
          <Sparkles size={16} className="text-[#0899AA]" />
          <span>My Space</span>
        </NavLink>

        <NavLink
          to="/child/settings"
          onClick={() => {
            try { audioAtmosphereService?.playChime?.(560, 0.05) } catch {}
          }}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-display font-bold text-xs transition-all border ${
              isActive
                ? 'bg-[#DDF9FC] text-[#08233A] border-[#D7EEF1]'
                : 'border-transparent text-[#527080] hover:bg-[#F2FBFC] hover:text-[#08233A]'
            }`
          }
        >
          <SlidersHorizontal size={16} className="text-[#527080]" />
          <span>My Comfort 🌿</span>
        </NavLink>
      </div>
    </nav>
  )
}

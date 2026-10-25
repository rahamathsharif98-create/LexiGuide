import { AppLink as Link, AppNavLink as NavLink } from './AppLink'
export function DashboardShell({ role, navItems, title, subtitle, right, children }) {
  return (
    <div className="min-h-screen flex bg-[#F2FBFC]">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-[#D7EEF1] h-screen sticky top-0 py-6 px-4 shadow-[0_8px_30px_rgba(8,35,58,0.04)]">
        <Link to="/" className="flex items-center gap-2.5 px-2 mb-8">
          <span className="text-2xl">🧠</span>
          <span className="font-display font-black text-xl text-[#08233A] tracking-tight">Lexi<span className="text-[#13CFE3]">Guide</span></span>
        </Link>
        <p className="px-4 text-[11px] font-bold uppercase tracking-wider text-[#527080] mb-2">{role} Portal</p>
        <div className="flex flex-col gap-1.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl font-display font-semibold text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-[#DDF9FC] text-[#08233A] font-bold shadow-sm border border-[#D7EEF1]'
                  : 'text-[#527080] hover:bg-[#E6F8FA] hover:text-[#08233A]'
              }`
            }>
              {({ isActive }) => (
                <>
                  <Icon size={19} className={isActive ? 'text-[#0899AA]' : 'text-[#527080]'} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#D7EEF1] px-5 lg:px-8 py-4 flex items-center justify-between shadow-[0_2px_10px_rgba(8,35,58,0.03)]">
          <div>
            <h1 className="font-display font-extrabold text-xl text-[#08233A]">{title}</h1>
            {subtitle && <p className="text-sm font-medium text-[#527080]">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">{right}</div>
        </header>
        <main className="p-5 lg:p-8 pb-24 lg:pb-8">{children}</main>

        {/* mobile bottom nav for dashboards — scrollable so every item stays reachable */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#D7EEF1] z-40 flex overflow-x-auto no-scrollbar px-1 shadow-[0_-4px_20px_rgba(8,35,58,0.06)]">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end className={({ isActive }) => `flex flex-col items-center gap-1 px-3.5 py-2 text-[10px] font-bold shrink-0 transition-colors ${isActive ? 'text-[#0899AA]' : 'text-[#527080]'}`}>
              <Icon size={20} /> {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

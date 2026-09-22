import { Outlet, useLocation } from 'react-router-dom'
import { ChildBottomNav, ChildSidebar } from '../../components/nav/ChildBottomNav'
import { ChildTopBar } from '../../components/nav/ChildTopBar'
import { useApp } from '../../context/AppContext'
import { Toast } from '../../components/ui'

export function ChildLayout() {
  const { toast } = useApp()
  const location = useLocation()
  const isHome = location.pathname === '/child/home' || location.pathname === '/child'

  return (
    <div className="min-h-screen flex bg-[#F2FBFC]">
      <ChildSidebar />
      <div className="flex-1 min-w-0 flex flex-col pb-20 md:pb-8">
        {!isHome && <ChildTopBar />}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-6">
          <Outlet />
        </main>
      </div>
      <ChildBottomNav />
      <Toast toast={toast} />
    </div>
  )
}

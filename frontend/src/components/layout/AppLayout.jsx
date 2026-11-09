import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const KEY = 'sidebarCollapsed'
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

// Kirgandan keyingi umumiy ko'rinish: chapda menyu, tepada header, o'rtada sahifa
export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(KEY) === '1')
  const [mobileOpen, setMobileOpen] = useState(false)

  // Bitta toggle: kompyuterda yig'adi/yoyadi, telefonda chiqaradi/yashiradi
  const toggleSidebar = () => {
    if (isDesktop()) {
      setCollapsed((c) => {
        localStorage.setItem(KEY, c ? '0' : '1')
        return !c
      })
    } else {
      setMobileOpen((o) => !o)
    }
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onToggleSidebar={toggleSidebar} />
        <main className="scroll-thin flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
          <div className="mx-auto max-w-[1400px] pt-2">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

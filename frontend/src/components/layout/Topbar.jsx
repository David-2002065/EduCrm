import { todayLabel } from '../../utils/format'
import SidebarToggle from './SidebarToggle'
import ThemeToggle from './ThemeToggle'

export default function Topbar({ onToggleSidebar }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 px-4 sm:px-6">
      <SidebarToggle onClick={onToggleSidebar} />
      <span className="truncate text-sm text-text-secondary">{todayLabel()}</span>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}

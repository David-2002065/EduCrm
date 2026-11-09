import { useAuth } from '../../context/AuthContext'
import BranchSwitcher from './BranchSwitcher'
import NavItem from './NavItem'
import UserCard from './UserCard'
import { NAV_SECTIONS } from './navigation'

/**
 * Chap menyu. Foni sahifa foni bilan bir xil (bg-background).
 * - Kompyuterda: collapsed=true bo'lsa faqat ikonlar qoladi (88px)
 * - Telefonda: mobileOpen=true bo'lsa ustidan chiqib keladi
 */
export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const { can } = useAuth()
  // Telefonda ochilganda har doim to'liq ko'rinish
  const compact = collapsed && !mobileOpen
  // Faqat ruxsat berilgan bo'limlar; bo'sh qolgan sarlavhalar ko'rinmaydi
  const sections = NAV_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => !i.permission || can(i.permission)) })).filter(
    (s) => s.items.length > 0,
  )

  return (
    <>
      {mobileOpen && <div className="animate-fade-in fixed inset-0 z-30 bg-ink/50 lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-background p-4 lg:bg-transparent transition-[width,transform] duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${compact ? 'w-[264px] lg:w-[88px]' : 'w-[264px]'}`}
      >
        {/* Logo + brend; bosilsa filial tanlanadi */}
        <div className="pb-4">
          <BranchSwitcher compact={compact} />
        </div>

        <nav className="scroll-thin flex flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto pt-2">
          {sections.map((section) => (
            <div key={section.title}>
              {compact ? (
                <div className="mx-auto mb-2 h-px w-8 bg-border" />
              ) : (
                <div className="flex h-7 items-center px-3 text-[11px] font-semibold tracking-wider whitespace-nowrap text-text-secondary uppercase">
                  {section.title}
                </div>
              )}
              <div className="flex flex-col gap-1">
                {section.items.map((item) => <NavItem key={item.to} {...item} compact={compact} onClick={onCloseMobile} />)}
              </div>
            </div>
          ))}
        </nav>

        <UserCard compact={compact} />
      </aside>
    </>
  )
}

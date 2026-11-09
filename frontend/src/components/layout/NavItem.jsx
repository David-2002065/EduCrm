import { NavLink } from 'react-router-dom'
import { Icon, Tooltip } from '../ui'

// compact=true — faqat ikon ko'rinadi, nomi esa sichqoncha ustiga kelganda tooltip'da chiqadi
export default function NavItem({ to, label, icon, compact, onClick }) {
  return (
    <Tooltip label={label} side="right" disabled={!compact} className="flex">
      <NavLink
        to={to}
        onClick={onClick}
        aria-label={label}
        className={({ isActive }) =>
          `flex h-11 w-full items-center gap-3 rounded-2xl text-sm font-medium whitespace-nowrap no-underline transition-colors ${
            compact ? 'justify-center px-0' : 'px-3'
          } ${isActive ? 'bg-primary text-on-primary' : 'text-text-secondary hover:bg-card hover:text-text-primary'}`
        }
      >
        {({ isActive }) => (
          <>
            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${isActive ? 'bg-mint text-on-mint' : ''}`}>
              <Icon name={icon} size={17} />
            </span>
            {!compact && label}
          </>
        )}
      </NavLink>
    </Tooltip>
  )
}

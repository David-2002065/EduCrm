import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useBranch } from '../../context/BranchContext'
import { Icon, Popover, Tooltip } from '../ui'
import Logo from './Logo'

/**
 * Sidebar tepasidagi logo + brend. Bosilsa filiallar ro'yxati ochiladi.
 * - Filial tanlanmagan: "EduCRM / Barcha filiallar"
 * - Filial tanlangan:   "EduCRM / Chilonzor filiali"
 * compact=true (yig'ilgan sidebar) — faqat logo ko'rinadi.
 */
export default function BranchSwitcher({ compact = false }) {
  const { branches, branchId, setBranchId } = useBranch()
  const [open, setOpen] = useState(false)
  const { can } = useAuth()
  const anchorRef = useRef(null)
  const current = branches.find((b) => String(b.id) === branchId)

  const choose = (id) => {
    setBranchId(id)
    setOpen(false)
  }

  return (
    <>
      <Tooltip label={`Filial: ${current?.name || 'Barcha filiallar'}`} side="right" disabled={!compact || open} className="flex">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-2xl p-1.5 text-left transition-colors hover:bg-card ${
          open ? 'bg-card' : ''
        } ${compact ? 'justify-center' : ''}`}
      >
        <span className={compact ? '' : 'min-w-0 flex-1'}>
          <Logo compact={compact} subtitle={current?.name || 'Barcha filiallar'} badge={!!current} />
        </span>
        {!compact && (
          <Icon name="chevronDown" size={16} className={`text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>
      </Tooltip>

      <Popover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} width={260} maxHeight={420} className="flex flex-col p-1.5">
        <div className="px-3 pt-2 pb-1.5 text-[11px] font-semibold tracking-wider text-text-secondary uppercase">Filialni tanlang</div>
        <ul className="scroll-thin m-0 flex list-none flex-col gap-0.5 overflow-y-auto p-0">
          <BranchOption icon="layers" title="Barcha filiallar" sub={`${branches.length} ta filial`} active={!current} onClick={() => choose('')} />
          {branches.map((b) => (
            <BranchOption
              key={b.id}
              icon="building"
              title={b.name}
              sub={`${b.student_count} o'quvchi · ${b.group_count} guruh`}
              active={String(b.id) === branchId}
              onClick={() => choose(b.id)}
            />
          ))}
        </ul>
        {can('branches.manage') && (
        <Link
          to="/branches"
          onClick={() => setOpen(false)}
          className="mt-1 flex items-center gap-2 rounded-xl border-t border-border px-3 py-2.5 text-sm text-text-secondary no-underline hover:bg-background hover:text-text-primary"
        >
          <Icon name="edit" size={15} /> Filiallarni boshqarish
        </Link>
        )}
      </Popover>
    </>
  )
}

function BranchOption({ icon, title, sub, active, onClick }) {
  return (
    <li
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 ${active ? 'bg-background' : 'hover:bg-background'}`}
    >
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${active ? 'bg-primary text-primary-accent' : 'bg-background'}`}>
        <Icon name={icon} size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm ${active ? 'font-semibold' : ''}`}>{title}</span>
        <span className="block truncate text-xs text-text-secondary">{sub}</span>
      </span>
      {active && <Icon name="check" size={16} />}
    </li>
  )
}

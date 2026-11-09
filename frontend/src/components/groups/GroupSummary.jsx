import { money } from '../../utils/format'
import { Avatar, Icon } from '../ui'

/**
 * Guruh haqida qisqa ma'lumot: ustoz, kunlar, vaqt, o'quvchilar soni, narx.
 * O'quvchi formasida (guruh tanlanganda) va Davomat sahifasida ishlatiladi.
 */
export default function GroupSummary({ group, className = '' }) {
  if (!group) return null
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl bg-background px-4 py-3 text-sm ${className}`}>
      <span className="flex min-w-0 items-center gap-2">
        <Avatar name={group.teacher_name || '?'} size="sm" />
        <span className="min-w-0">
          <span className="block text-xs text-text-secondary">Ustoz</span>
          <span className="block truncate font-medium">{group.teacher_name || "Biriktirilmagan"}</span>
        </span>
      </span>
      <Item icon="calendar" text={group.days || '—'} />
      <Item icon="clock" text={group.time || '—'} />
      <Item icon="users" text={`${group.student_count} o'quvchi`} />
      <Item icon="wallet" text={money(group.monthly_fee)} />
    </div>
  )
}

function Item({ icon, text }) {
  return (
    <span className="flex items-center gap-1.5 text-text-secondary">
      <Icon name={icon} size={15} />
      <span className="text-text-primary">{text}</span>
    </span>
  )
}

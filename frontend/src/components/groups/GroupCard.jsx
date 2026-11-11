import { Badge, Icon } from '../ui'
import RowActions from '../common/RowActions'
import { money } from '../../utils/format'

export default function GroupCard({ group, onEdit, onDelete, onOpen, onTests }) {
  return (
    <article onClick={onOpen} className="flex cursor-pointer flex-col gap-4 rounded-card bg-card p-5 transition-shadow hover:shadow-float">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone="neutral" dot={false}>{group.course || 'Kurs'}</Badge>
          <h3 className="m-0 mt-3 truncate font-display text-xl font-medium">{group.name}</h3>
          <p className="m-0 mt-1 truncate text-sm text-text-secondary">{group.teacher_name || "O'qituvchi yo'q"}</p>
        </div>
        <RowActions onEdit={onEdit} onDelete={onDelete} extra={onTests ? [{ icon: 'clipboard', label: 'Test vazifalar', onClick: onTests }] : []} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Meta icon="calendar" text={group.days || '—'} />
        <Meta icon="clock" text={group.time || '—'} />
        <Meta icon="building" text={group.branch_name} />
        <Meta icon="users" text={`${group.student_count} o'quvchi`} />
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
        <span className="text-sm text-text-secondary">Oylik to'lov</span>
        <span className="font-semibold tabular-nums">{money(group.monthly_fee)}</span>
      </div>
    </article>
  )
}

function Meta({ icon, text }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-text-secondary">
      <Icon name={icon} size={15} />
      <span className="truncate">{text}</span>
    </span>
  )
}

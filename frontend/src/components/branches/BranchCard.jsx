import RowActions from '../common/RowActions'
import { formatPhone } from '../../utils/format'
import { Icon, InfoRow } from '../ui'

export default function BranchCard({ branch, active, onOpen, onEdit, onDelete }) {
  return (
    <article
      onClick={onOpen}
      className={`flex cursor-pointer flex-col gap-4 rounded-card bg-card p-5 transition-shadow hover:shadow-float ${active ? 'ring-2 ring-mint' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mint text-on-mint">
            <Icon name="building" size={19} />
          </span>
          <h3 className="m-0 truncate font-display text-xl font-medium">{branch.name}</h3>
        </div>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </div>
      <div className="flex flex-col gap-2">
        <InfoRow icon="mapPin" label="Manzil" value={branch.address} />
        <InfoRow icon="phone" label="Telefon" value={formatPhone(branch.phone)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Count value={branch.student_count} label="Faol o'quvchi" />
        <Count value={branch.group_count} label="Guruh" />
      </div>
    </article>
  )
}

function Count({ value, label }) {
  return (
    <div className="rounded-2xl bg-primary px-4 py-3 text-on-primary">
      <div className="font-display text-2xl font-medium tabular-nums">{value}</div>
      <div className="text-xs text-on-primary/60">{label}</div>
    </div>
  )
}

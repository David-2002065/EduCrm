import RowActions from '../common/RowActions'
import { Badge, Icon } from '../ui'

// Rol kartochkasi: nomi, nechta foydalanuvchi, ruxsatlar soni
export default function RoleCard({ role, catalog, onEdit, onDelete }) {
  // "Guruhlar: Ko'rish" — bo'lim nomi bilan, chunki tavsiflar bo'limlarda takrorlanadi
  const chips = catalog.flatMap((g) => g.items.filter((p) => role.permissions.includes(p.key)).map((p) => ({ key: p.key, text: `${g.group}: ${p.label}` })))
  return (
    <article onClick={onEdit} className={`flex flex-col gap-3 rounded-card bg-card p-5 ${onEdit ? 'cursor-pointer transition-shadow hover:shadow-float' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${role.is_system ? 'bg-primary text-primary-accent' : 'bg-mint text-on-mint'}`}>
            <Icon name="shield" size={19} />
          </span>
          <div className="min-w-0">
            <h3 className="m-0 truncate font-display text-xl font-medium">{role.name}</h3>
            <p className="m-0 text-xs text-text-secondary">{role.user_count} ta foydalanuvchi</p>
          </div>
        </div>
        {!role.is_system && <RowActions onEdit={onEdit} onDelete={onDelete} />}
      </div>
      {role.is_system ? (
        <Badge tone="dark">Hamma ruxsat</Badge>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {chips.length === 0 && <span className="text-sm text-text-secondary">Ruxsat berilmagan</span>}
          {chips.map((c) => (
            <span key={c.key} className="rounded-full bg-background px-2.5 py-1 text-xs">{c.text}</span>
          ))}
        </div>
      )}
    </article>
  )
}

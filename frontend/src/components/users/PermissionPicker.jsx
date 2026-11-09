import { usePermissionCatalog } from '../../hooks/usePermissionCatalog'
import { Checkbox } from '../ui'

/**
 * Ruxsatlarni bo'limlar bo'yicha belgilash.
 * value — tanlangan ruxsatlar; locked — roldan kelgan (o'zgarmaydi, kulrang ko'rinadi)
 */
export default function PermissionPicker({ value = [], onChange, locked = [] }) {
  const catalog = usePermissionCatalog()
  const toggle = (key, on) => onChange(on ? [...value, key] : value.filter((k) => k !== key))

  return (
    <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
      {catalog.map((section) => (
        <div key={section.group} className="rounded-2xl border border-border p-2">
          <div className="px-2 pt-1 pb-1 text-[11px] font-semibold tracking-wider text-text-secondary uppercase">{section.group}</div>
          {section.items.map((p) => {
            const isLocked = locked.includes(p.key)
            return (
              <Checkbox
                key={p.key}
                label={p.label}
                hint={isLocked ? 'Rol orqali berilgan' : undefined}
                checked={isLocked || value.includes(p.key)}
                locked={isLocked}
                onChange={(on) => toggle(p.key, on)}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

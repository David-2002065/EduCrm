import Icon from './Icon'

// "Telefon: +998 ..." ko'rinishidagi qator
export default function InfoRow({ icon, label, value, href }) {
  const content = value || '—'
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-background p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card">
        <Icon name={icon} size={16} />
      </span>
      <div className="min-w-0">
        <div className="text-xs text-text-secondary">{label}</div>
        {href && value ? (
          <a href={href} className="block truncate text-sm font-medium text-text-primary no-underline hover:underline">{content}</a>
        ) : (
          <div className="truncate text-sm font-medium">{content}</div>
        )}
      </div>
    </div>
  )
}

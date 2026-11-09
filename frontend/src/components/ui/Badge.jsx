const TONES = {
  success: 'bg-mint-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-background text-text-secondary',
  dark: 'bg-primary text-on-primary',
}

export default function Badge({ tone = 'neutral', children, dot = true }) {
  return (
    <span className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ${TONES[tone]}`}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

// Holat obyektidan ({label, tone}) badge yasaydi: <StatusBadge map={PAYMENT_STATUS} value="paid" />
export function StatusBadge({ map, value }) {
  const item = map[value]
  if (!item) return <Badge>—</Badge>
  return <Badge tone={item.tone}>{item.label}</Badge>
}

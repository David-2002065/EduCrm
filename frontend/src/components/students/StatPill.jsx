// Kichik raqamli blok: "18 · Keldi"
export default function StatPill({ value, label, tone }) {
  const color = { success: 'text-success', warning: 'text-warning', danger: 'text-danger' }[tone] || ''
  return (
    <div className="flex-1 rounded-2xl bg-background px-4 py-3">
      <div className={`font-display text-2xl font-medium tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-text-secondary">{label}</div>
    </div>
  )
}

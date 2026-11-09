// "Kutilgan: 21 500 000 so'm" ko'rinishidagi qator
export default function SummaryRow({ label, value, tone }) {
  const color = { danger: 'text-danger', success: 'text-success' }[tone] || ''
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  )
}

export default function ProgressBar({ value, max, className = '' }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-background ${className}`}>
      <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${percent}%` }} />
    </div>
  )
}

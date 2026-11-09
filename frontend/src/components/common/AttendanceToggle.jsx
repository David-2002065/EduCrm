import { ATTENDANCE_STATUS } from '../../utils/constants'

const ACTIVE = {
  present: 'bg-mint text-on-mint',
  late: 'bg-warning-soft text-warning',
  absent: 'bg-danger-soft text-danger',
}

// Keldi / Kechikdi / Kelmadi tugmalari
export default function AttendanceToggle({ value, onChange }) {
  return (
    <div className="inline-flex gap-1 rounded-full bg-background p-1">
      {Object.entries(ATTENDANCE_STATUS).map(([key, { label }]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`h-8 cursor-pointer rounded-full px-3 text-xs font-semibold transition-colors ${
            value === key ? ACTIVE[key] : 'text-text-secondary hover:bg-card'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

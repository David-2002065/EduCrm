import { ATTENDANCE_STATUS } from '../../utils/constants'
import { formatDate } from '../../utils/format'

const DOT = { present: 'bg-mint', late: 'bg-warning', absent: 'bg-danger' }

// Oxirgi darslar: rangli kvadratchalar (yashil — keldi, sariq — kechikdi, qizil — kelmadi)
export default function AttendanceHistory({ items }) {
  if (!items.length) return <p className="m-0 text-sm text-text-secondary">Davomat hali yo'q</p>
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {[...items].reverse().map((a) => (
          <span
            key={a.id}
            title={`${formatDate(a.date)} — ${ATTENDANCE_STATUS[a.status]?.label}`}
            className={`size-5 rounded-md ${DOT[a.status]}`}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-secondary">
        {Object.entries(ATTENDANCE_STATUS).map(([key, { label }]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${DOT[key]}`} /> {label}
          </span>
        ))}
      </div>
    </div>
  )
}

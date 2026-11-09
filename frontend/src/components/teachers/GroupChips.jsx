import { Link } from 'react-router-dom'

// Ustozning guruhlari: "English Beginner A · 14:00"
export default function GroupChips({ groups }) {
  if (!groups.length) return <span className="text-text-secondary">Guruh yo'q</span>
  return (
    <div className="flex min-w-0 gap-1.5 overflow-hidden">
      {groups.map((g) => (
        <Link
          key={g.id}
          to={`/attendance?group=${g.id}`}
          onClick={(e) => e.stopPropagation()}
          title={`${g.name} — ${g.days}, ${g.time}`}
          className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-background px-3 text-xs text-text-primary no-underline hover:bg-surface"
        >
          <span className="font-medium">{g.name}</span>
          <span className="text-text-secondary tabular-nums">{g.time}</span>
        </Link>
      ))}
    </div>
  )
}

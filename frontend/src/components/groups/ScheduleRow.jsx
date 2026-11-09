import { Avatar, Badge, Icon } from '../ui'

/**
 * Dars jadvalidagi bitta vaqt qatori: chapda vaqt, o'ngda shu vaqtdagi guruhlar.
 * Bir nechta guruh bo'lsa — ular parallel (turli ustozlar bilan) o'tadi.
 */
export default function ScheduleRow({ time, groups, onOpen }) {
  return (
    <div className="flex flex-col gap-3 rounded-card bg-card p-4 sm:flex-row sm:p-5">
      <div className="flex shrink-0 items-center gap-3 sm:w-36 sm:flex-col sm:items-start">
        <span className="font-display text-[32px] leading-9 font-light tabular-nums">{time}</span>
        {groups.length > 1 && <Badge tone="success">{groups.length} ta parallel</Badge>}
      </div>
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 md:grid-cols-2 2xl:grid-cols-3">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onOpen(g)}
            className="flex min-w-0 cursor-pointer flex-col gap-3 rounded-2xl bg-background p-4 text-left transition-colors hover:bg-surface"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium">{g.name}</div>
                <div className="truncate text-xs text-text-secondary">{g.course || 'Kurs'} · {g.branch_name}</div>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-xs text-text-secondary">
                <Icon name="users" size={14} /> {g.student_count}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <Avatar name={g.teacher_name || '?'} size="sm" />
                <span className="truncate">{g.teacher_name || <span className="text-danger">Ustoz yo'q</span>}</span>
              </span>
              <span className="shrink-0 text-xs text-text-secondary">{g.days}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

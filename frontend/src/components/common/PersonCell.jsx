import { Avatar } from '../ui'

// Jadvallarda: avatar + ism + pastida kichik matn
export default function PersonCell({ name, sub }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name} size="sm" />
      <div className="min-w-0">
        <div className="truncate font-medium">{name}</div>
        {sub && <div className="truncate text-xs text-text-secondary">{sub}</div>}
      </div>
    </div>
  )
}

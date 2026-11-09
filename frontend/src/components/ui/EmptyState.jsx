import Icon from './Icon'

export default function EmptyState({ icon = 'inbox', title = "Ma'lumot topilmadi", text, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-background text-text-secondary">
        <Icon name={icon} size={22} />
      </span>
      <p className="m-0 mt-1 font-medium">{title}</p>
      {text && <p className="m-0 max-w-sm text-sm text-text-secondary">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

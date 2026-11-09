import Button from './Button'
import Icon from './Icon'

export default function ErrorBox({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-card px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <Icon name="alert" size={22} />
      </span>
      <p className="m-0 text-sm text-text-secondary">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Qayta urinish</Button>}
    </div>
  )
}

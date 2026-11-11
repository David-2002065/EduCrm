import { IconButton } from '../ui'

// Jadval qatoridagi "tahrirlash" va "o'chirish" tugmalari. extra — oldidan qo'shimcha tugmalar: [{ icon, label, onClick }]
export default function RowActions({ onEdit, onDelete, extra = [] }) {
  const stop = (fn) => (e) => {
    e.stopPropagation()
    fn()
  }
  return (
    <div className="flex justify-end gap-1">
      {extra.map((a) => (
        <IconButton key={a.label} icon={a.icon} label={a.label} onClick={stop(a.onClick)} />
      ))}
      {onEdit && <IconButton icon="edit" label="Tahrirlash" onClick={stop(onEdit)} />}
      {onDelete && <IconButton icon="trash" label="O'chirish" variant="danger" onClick={stop(onDelete)} />}
    </div>
  )
}

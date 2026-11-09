import { IconButton } from '../ui'

// Jadval qatoridagi "tahrirlash" va "o'chirish" tugmalari
export default function RowActions({ onEdit, onDelete }) {
  const stop = (fn) => (e) => {
    e.stopPropagation()
    fn()
  }
  return (
    <div className="flex justify-end gap-1">
      {onEdit && <IconButton icon="edit" label="Tahrirlash" onClick={stop(onEdit)} />}
      {onDelete && <IconButton icon="trash" label="O'chirish" variant="danger" onClick={stop(onDelete)} />}
    </div>
  )
}

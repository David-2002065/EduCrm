import { useState } from 'react'
import Button from './Button'
import Modal from './Modal'

// O'chirishdan oldin so'rash oynasi. onConfirm async bo'lishi mumkin.
export default function ConfirmDialog({ open, onClose, onConfirm, title = "O'chirilsinmi?", text, confirmText = "O'chirish" }) {
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button variant="danger" loading={loading} onClick={handle}>{confirmText}</Button>
        </>
      }
    >
      <p className="m-0 text-sm text-text-secondary">{text}</p>
    </Modal>
  )
}

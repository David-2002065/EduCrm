import { useState } from 'react'
import { Button, Modal, useToast } from '../ui'

/**
 * Hamma forma oynalari uchun umumiy asos.
 * onSubmit — async funksiya. Muvaffaqiyatli bo'lsa oynani yopadi va xabar chiqaradi.
 */
export default function FormModal({ open, onClose, title, subtitle, onSubmit, submitText = 'Saqlash', successText = 'Saqlandi', size, children }) {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit()
      toast.success(successText)
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size={size}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button type="submit" form="form-modal" loading={loading}>{submitText}</Button>
        </>
      }
    >
      <form id="form-modal" onSubmit={handleSubmit} className="grid gap-4 pt-1 sm:grid-cols-2">
        {children}
      </form>
    </Modal>
  )
}

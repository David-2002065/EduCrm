import { useEffect, useState } from 'react'
import { Button, Modal, useToast } from '../ui'
import { SubmittedContext } from '../ui/Field'

/**
 * Hamma forma oynalari uchun umumiy asos.
 * onSubmit — async funksiya. Muvaffaqiyatli bo'lsa oynani yopadi va xabar chiqaradi.
 * required maydonlar to'ldirilmagan bo'lsa — onSubmit chaqirilmaydi, ular qizil bo'lib turadi.
 */
export default function FormModal({ open, onClose, title, subtitle, onSubmit, submitText = 'Saqlash', successText = 'Saqlandi', size, children }) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (open) setSubmitted(false)
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    const missing = e.currentTarget.querySelector('[data-missing]')
    if (missing) {
      missing.querySelector('input, textarea, button')?.focus()
      toast.error("Majburiy maydonlarni to'ldiring")
      return
    }
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
      <SubmittedContext.Provider value={submitted}>
        <form id="form-modal" noValidate onSubmit={handleSubmit} className="grid gap-4 pt-1 sm:grid-cols-2">
          {children}
        </form>
      </SubmittedContext.Provider>
    </Modal>
  )
}

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import IconButton from './IconButton'

const WIDTHS = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }

// Oyna. Esc yoki fonni bosish bilan yopiladi.
export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`animate-pop-in flex max-h-[92dvh] w-full flex-col rounded-t-card bg-card sm:rounded-card ${WIDTHS[size]}`}
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h2 className="m-0 font-display text-xl font-medium">{title}</h2>
            {subtitle && <p className="m-0 mt-1 text-sm text-text-secondary">{subtitle}</p>}
          </div>
          <IconButton icon="x" label="Yopish" variant="outline" onClick={onClose} />
        </header>
        <div className="scroll-thin overflow-y-auto px-6 pb-2">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 px-6 pt-4 pb-6">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}

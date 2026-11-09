import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Sichqoncha ustiga kelganda chiqadigan kichik yozuv.
 * side: 'top' (tepada) yoki 'right' (o'ngda — yig'ilgan sidebar uchun)
 * disabled — tooltip o'chiq, faqat children qaytadi.
 */
export default function Tooltip({ label, side = 'top', disabled = false, className = '', children }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(null)

  if (disabled || !label) return children

  const show = () => {
    const r = ref.current.getBoundingClientRect()
    setPos(
      side === 'right'
        ? { left: r.right + 10, top: r.top + r.height / 2, transform: 'translateY(-50%)' }
        : { left: r.left + r.width / 2, top: r.top - 8, transform: 'translate(-50%, -100%)' },
    )
  }
  const hide = () => setPos(null)

  return (
    <span ref={ref} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} onMouseDown={hide} className={className || 'inline-flex'}>
      {children}
      {pos &&
        createPortal(
          <span
            role="tooltip"
            style={{ position: 'fixed', ...pos }}
            className="animate-fade-in pointer-events-none z-[300] rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-float ring-1 ring-white/10"
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  )
}

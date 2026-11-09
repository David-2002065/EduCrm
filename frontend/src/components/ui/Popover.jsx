import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAnchorPosition } from '../../hooks/useAnchorPosition'
import { useClickOutside } from '../../hooks/useClickOutside'

/**
 * Biror element (anchor) ostida ochiladigan qalqib chiquvchi oyna.
 * Select, DatePicker, BranchSwitcher — hammasi shundan foydalanadi.
 *
 * width: 'anchor' — anchor bilan bir xil kenglik, raqam — px, 'auto' — ichidagiga qarab
 * Tashqariga bosilsa yoki Esc bosilsa onClose chaqiriladi.
 */
export default function Popover({ anchorRef, open, onClose, width = 'anchor', minWidth, maxHeight = 280, className = '', children }) {
  const ref = useRef(null)
  const position = useAnchorPosition(anchorRef, open, maxHeight)
  useClickOutside([anchorRef, ref], onClose, open)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !position) return null

  const w = width === 'anchor' ? position.width : width
  const realWidth = typeof w === 'number' ? Math.max(w, minWidth || 0) : 320
  const style = {
    ...position,
    width: w,
    minWidth,
    // Ekranning o'ng chetidan chiqib ketmasin
    left: Math.max(8, Math.min(position.left, window.innerWidth - realWidth - 8)),
  }

  return createPortal(
    <div
      ref={ref}
      style={style}
      // Modal ichida bo'lsa, bosish modalni yopib yubormasin
      onMouseDown={(e) => e.stopPropagation()}
      className={`animate-fade-in z-[100] rounded-2xl border border-border bg-card shadow-float ${className}`}
    >
      {children}
    </div>,
    document.body,
  )
}

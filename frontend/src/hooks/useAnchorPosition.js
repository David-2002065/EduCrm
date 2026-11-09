import { useLayoutEffect, useState } from 'react'

/**
 * Ochiladigan ro'yxat (dropdown) uchun joy hisoblaydi.
 * Pastda joy yetmasa — yuqoriga ochiladi. Scroll/resize bo'lsa qayta hisoblaydi.
 */
export function useAnchorPosition(anchorRef, open, maxHeight = 280) {
  const [style, setStyle] = useState(null)

  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect()
      if (!rect) return
      const spaceBelow = window.innerHeight - rect.bottom - 8
      const openUp = spaceBelow < Math.min(maxHeight, 200) && rect.top > spaceBelow
      setStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 6, maxHeight: Math.min(maxHeight, rect.top - 16) }
          : { top: rect.bottom + 6, maxHeight: Math.min(maxHeight, spaceBelow) }),
      })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [anchorRef, open, maxHeight])

  return style
}

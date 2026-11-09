import { useCallback, useEffect, useState } from 'react'

/**
 * Virtualizatsiya: faqat ko'rinib turgan qatorlarni chizadi.
 * 10 000 qator bo'lsa ham ekranda ~15 tasi render bo'ladi.
 *
 * containerRef — "callback ref": konteyner keyinroq paydo bo'lsa ham (masalan yuklanishdan keyin) ishlaydi.
 */
export function useVirtualList({ count, rowHeight, overscan = 6 }) {
  const [element, setElement] = useState(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(0)

  const containerRef = useCallback((node) => setElement(node), [])

  useEffect(() => {
    if (!element) return
    const observer = new ResizeObserver(() => setViewport(element.clientHeight))
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  // Ro'yxat qisqarsa (filtr), scroll joyidan chiqib ketmasligi uchun
  useEffect(() => {
    if (element && element.scrollTop > count * rowHeight) {
      element.scrollTop = 0
      setScrollTop(0)
    }
  }, [count, rowHeight, element])

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const end = Math.min(count, Math.ceil((scrollTop + viewport) / rowHeight) + overscan)

  return {
    containerRef,
    onScroll: (e) => setScrollTop(e.currentTarget.scrollTop),
    start,
    end,
    offsetTop: start * rowHeight,
    totalHeight: count * rowHeight,
  }
}

import { useEffect } from 'react'

// refs ichidan tashqariga bosilganda handler chaqiriladi.
// "capture" (true) — hodisani boshqa elementlar to'xtatib qo'yishidan oldin ushlaydi (masalan Modal ichida)
export function useClickOutside(refs, handler, active = true) {
  useEffect(() => {
    if (!active) return
    const listener = (e) => {
      if (refs.some((r) => r.current && r.current.contains(e.target))) return
      handler(e)
    }
    document.addEventListener('mousedown', listener, true)
    return () => document.removeEventListener('mousedown', listener, true)
  }, [refs, handler, active])
}

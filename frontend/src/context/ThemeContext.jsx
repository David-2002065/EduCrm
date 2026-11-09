import { createContext, useContext, useEffect, useState } from 'react'

/**
 * Yorug' / qorong'i mavzu. Tanlov localStorage'da saqlanadi.
 * Birinchi kirishda — kompyuter sozlamasiga qaraladi.
 * (index.html'dagi kichik skript sahifa ochilishidayoq klassni qo'yadi — oq "miltillash" bo'lmasin)
 */
const ThemeContext = createContext(null)
const KEY = 'theme'

const initialTheme = () => {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // localStorage yopiq bo'lishi mumkin
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // e'tiborsiz
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

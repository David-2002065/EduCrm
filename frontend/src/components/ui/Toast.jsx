import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'

const ToastContext = createContext(null)

// Ilova tepasiga o'raladi. Ishlatish: const toast = useToast(); toast.success('Saqlandi')
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const push = useCallback((type, text) => {
    const id = Math.random()
    setItems((list) => [...list, { id, type, text }])
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 3200)
  }, [])

  const value = useMemo(() => ({
    success: (text) => push('success', text),
    error: (text) => push('error', text),
  }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed right-4 bottom-4 z-[200] flex flex-col gap-2">
          {items.map((t) => (
            <div key={t.id} className="animate-pop-in flex items-center gap-3 rounded-full bg-primary py-2 pr-5 pl-2 text-sm text-on-primary shadow-float">
              <span className={`flex size-7 items-center justify-center rounded-full ${t.type === 'success' ? 'bg-mint text-on-mint' : 'bg-danger text-white'}`}>
                <Icon name={t.type === 'success' ? 'check' : 'alert'} size={15} />
              </span>
              {t.text}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

import { createContext, useContext } from 'react'

// FormModal "Saqlash" bosilgandan keyin true bo'ladi — shunda to'ldirilmagan majburiy maydonlar qizil bo'ladi
export const SubmittedContext = createContext(false)

/**
 * Maydon xatosi: tashqaridan berilgan error yoki (forma yuborilgan bo'lsa) majburiy maydon bo'sh.
 * missing — true (bo'sh) yoki matn (masalan "Raqamni to'liq kiriting")
 */
export function useFieldError({ error, required, missing }) {
  const submitted = useContext(SubmittedContext)
  if (error) return error
  if (submitted && required && missing) return typeof missing === 'string' ? missing : "To'ldirilishi shart"
  return undefined
}

// Forma maydoni uchun umumiy o'ram: label + kontrol + xato matni.
// required + missing bo'lsa data-missing qo'yiladi — FormModal shu bo'yicha formani tekshiradi.
export default function Field({ label, error, hint, required, missing, children, className = '' }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`} data-missing={required && missing ? '' : undefined}>
      {label && (
        <span className="text-[13px] font-medium text-text-secondary">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : (
        hint && <span className="text-xs text-text-secondary">{hint}</span>
      )}
    </label>
  )
}

export const isEmpty = (value) => value === '' || value === null || value === undefined

// Input, Select va boshqalar bir xil ko'rinishi uchun umumiy klasslar
export const controlClass = (error) =>
  `h-11 w-full rounded-2xl border bg-card px-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary/70 disabled:bg-background ${
    error ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'
  }`

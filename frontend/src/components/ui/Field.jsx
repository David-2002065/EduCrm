// Forma maydoni uchun umumiy o'ram: label + kontrol + xato matni
export default function Field({ label, error, hint, children, className = '' }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      {label && <span className="text-[13px] font-medium text-text-secondary">{label}</span>}
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : (
        hint && <span className="text-xs text-text-secondary">{hint}</span>
      )}
    </label>
  )
}

// Input, Select va boshqalar bir xil ko'rinishi uchun umumiy klasslar
export const controlClass = (error) =>
  `h-11 w-full rounded-2xl border bg-card px-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary/70 focus:border-primary disabled:bg-background ${
    error ? 'border-danger' : 'border-border'
  }`

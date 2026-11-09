// Oq kartochka. title/action berilsa sarlavha qatori chiqadi.
export default function Card({ title, subtitle, action, children, className = '', padding = 'p-5 sm:p-6' }) {
  return (
    <section className={`min-w-0 rounded-card bg-card ${padding} ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="m-0 font-display text-lg font-medium">{title}</h3>}
            {subtitle && <p className="m-0 mt-0.5 text-[13px] text-text-secondary">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

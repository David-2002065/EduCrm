// Sahifa sarlavhasi: katta yengil shrift + o'ng tomonda tugmalar
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="m-0 font-display text-[28px] leading-9 font-light tracking-[-0.01em] sm:text-[32px]">{title}</h1>
        {subtitle && <p className="m-0 mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

// Pill ko'rinishidagi tablar. items: [{ value, label, count? }]
export default function Tabs({ items, value, onChange, className = '' }) {
  return (
    <div className={`scroll-thin inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-card p-1 ${className}`}>
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-colors ${
              active ? 'bg-primary text-on-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${active ? 'bg-mint text-on-mint' : 'bg-background'}`}>
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

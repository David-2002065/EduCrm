import { useState } from 'react'

/**
 * Oddiy ustunli grafik (kutubxonasiz).
 * data: [{ label, value }], format — qiymatni chiroyli yozish funksiyasi
 * Oxirgi ustun (joriy davr) mint rangda ajratiladi.
 */
export default function BarChart({ data, format = String, height = 200 }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="flex items-end gap-2 sm:gap-4" style={{ height }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1
        const h = Math.max(4, (d.value / max) * (height - 48))
        return (
          <div
            key={i}
            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className={`text-[11px] font-semibold whitespace-nowrap tabular-nums transition-opacity ${hover === i || isLast ? 'opacity-100' : 'opacity-0'}`}>
              {format(d.value)}
            </span>
            <div
              className={`w-full max-w-14 rounded-2xl transition-colors ${isLast ? 'bg-mint' : hover === i ? 'bg-primary' : 'bg-surface'}`}
              style={{ height: h }}
            />
            <span className="text-xs text-text-secondary">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

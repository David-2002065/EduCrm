import { useVirtualList } from '../../hooks/useVirtualList'
import EmptyState from './EmptyState'
import Loader from './Loader'

/**
 * Virtualizatsiyali jadval — faqat ekranda ko'ringan qatorlar chiziladi.
 *
 * columns: [{ key, title, width: '2fr' | '120px', align: 'right', render: (row, index) => ... }]
 * rows:    massiv
 * height:  jadval tanasining maksimal balandligi (px)
 *
 * Ustunlar CSS grid orqali joylashadi, shuning uchun sarlavha va qatorlar doim bir tekis turadi.
 */
export default function VirtualTable({
  columns,
  rows = [],
  rowKey = 'id',
  rowHeight = 60,
  height = 520,
  minWidth = 720,
  loading = false,
  onRowClick,
  empty,
}) {
  const { containerRef, onScroll, start, end, offsetTop, totalHeight } = useVirtualList({
    count: rows.length,
    rowHeight,
  })

  const grid = { gridTemplateColumns: columns.map((c) => c.width || '1fr').join(' ') }
  const visible = rows.slice(start, end)
  const bodyHeight = Math.min(height, Math.max(totalHeight, rowHeight))

  return (
    <div className="scroll-thin overflow-x-auto">
      <div style={{ minWidth }}>
        {/* Sarlavha */}
        <div style={grid} className="grid gap-4 rounded-2xl bg-background px-4 py-3 text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
          {columns.map((c) => (
            <div key={c.key} className={`truncate ${c.align === 'right' ? 'text-right' : ''}`}>{c.title}</div>
          ))}
        </div>

        {loading ? (
          <Loader className="h-60" />
        ) : rows.length === 0 ? (
          empty || <EmptyState />
        ) : (
          // Tana: scroll bo'ladigan konteyner, ichida umumiy balandlikdagi "bo'sh joy"
          <div ref={containerRef} onScroll={onScroll} style={{ height: bodyHeight }} className="scroll-thin relative overflow-y-auto">
            <div style={{ height: totalHeight }}>
              <div style={{ transform: `translateY(${offsetTop}px)` }}>
                {visible.map((row, i) => {
                  const index = start + i
                  return (
                    <div
                      key={row[rowKey] ?? index}
                      style={{ ...grid, height: rowHeight }}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={`grid items-center gap-4 border-b border-border/70 px-4 text-sm last:border-0 ${
                        onRowClick ? 'cursor-pointer transition-colors hover:bg-background/70' : ''
                      }`}
                    >
                      {columns.map((c) => (
                        <div key={c.key} className={`min-w-0 truncate ${c.align === 'right' ? 'flex justify-end text-right' : ''}`}>
                          {c.render ? c.render(row, index) : row[c.key] ?? '—'}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

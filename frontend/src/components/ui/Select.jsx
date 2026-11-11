import { useEffect, useMemo, useRef, useState } from 'react'
import Field, { controlClass, useFieldError } from './Field'
import Icon from './Icon'
import Popover from './Popover'

/**
 * O'zimiz yasagan Select.
 * options: [{ value, label, hint? }]
 * - 7 tadan ko'p variant bo'lsa qidiruv chiqadi
 * - klaviatura: ↑ ↓ Enter Esc
 * - placeholder — hech narsa tanlanmagandagi matn (masalan "Barcha guruhlar")
 */
export default function Select({
  label,
  error,
  hint,
  options = [],
  value,
  onChange,
  placeholder = 'Tanlang',
  clearable = false,
  searchable,
  disabled = false,
  required = false,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const triggerRef = useRef(null)
  const listRef = useRef(null)

  const showSearch = searchable ?? options.length > 7
  const selected = options.find((o) => String(o.value) === String(value))
  error = useFieldError({ error, required, missing: !selected })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => String(o.label).toLowerCase().includes(q)) : options
  }, [options, query])

  // Ochilganda tanlangan elementni belgilaymiz
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(Math.max(0, options.findIndex((o) => String(o.value) === String(value))))
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (option) => {
    onChange?.(option ? option.value : '')
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onKeyDown = (e) => {
    if (disabled) return
    if (!open && ['ArrowDown', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      return setOpen(true)
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, filtered.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[active]) choose(filtered[active])
    }
  }

  // Faol element ko'rinib turishi uchun scroll
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  return (
    <Field label={label} error={error} hint={hint} required={required} missing={!selected} className={className}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`${controlClass(error)} flex cursor-pointer items-center justify-between gap-2 text-left ${open ? 'border-primary' : ''}`}
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? '' : 'text-text-secondary/80'}`}>
          {selected ? selected.label : placeholder}
          {selected?.hint && <span className="text-text-secondary"> · {selected.hint}</span>}
        </span>
        <span className="flex items-center gap-1 text-text-secondary">
          {clearable && selected && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation()
                choose(null)
              }}
              className="rounded-full p-0.5 hover:bg-background hover:text-text-primary"
            >
              <Icon name="x" size={14} />
            </span>
          )}
          <Icon name="chevronDown" size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      <Popover anchorRef={triggerRef} open={open} onClose={() => setOpen(false)} minWidth={200} className="flex flex-col overflow-hidden p-1.5">
        {showSearch && (
          <div className="relative mb-1">
            <Icon name="search" size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-text-secondary" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={onKeyDown}
              placeholder="Qidirish..."
              className="h-9 w-full rounded-xl bg-background pr-3 pl-9 text-sm outline-none"
            />
          </div>
        )}
        <ul ref={listRef} className="scroll-thin m-0 list-none overflow-y-auto p-0">
          {filtered.length === 0 && <li className="px-3 py-2.5 text-sm text-text-secondary">Topilmadi</li>}
          {filtered.map((o, i) => {
            const isSelected = String(o.value) === String(value)
            return (
              <li
                key={o.value}
                data-index={i}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm ${
                  i === active ? 'bg-background' : ''
                } ${isSelected ? 'font-semibold' : ''}`}
              >
                <span className="min-w-0">
                  <span className="block truncate">{o.label}</span>
                  {o.hint && <span className="block truncate text-xs font-normal text-text-secondary">{o.hint}</span>}
                </span>
                {isSelected && <Icon name="check" size={16} />}
              </li>
            )
          })}
        </ul>
      </Popover>
    </Field>
  )
}

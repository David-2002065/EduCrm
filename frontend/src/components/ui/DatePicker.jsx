import { useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { uz } from 'react-day-picker/locale'
import 'react-day-picker/style.css'
import { formatDate, today } from '../../utils/format'
import Field, { controlClass, useFieldError } from './Field'
import Icon from './Icon'
import Popover from './Popover'

// "2026-10-31" <-> Date (mahalliy vaqt bo'yicha)
const toDate = (s) => (s ? new Date(`${s}T00:00:00`) : undefined)
const toValue = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * Sana tanlash (react-day-picker asosida).
 * value / onChange — "YYYY-MM-DD" ko'rinishidagi matn.
 * yearSelect=true — oy va yilni ro'yxatdan tanlash (tug'ilgan sana uchun qulay).
 */
export default function DatePicker({
  label,
  error,
  value,
  onChange,
  min,
  max,
  placeholder = 'Sanani tanlang',
  clearable = false,
  required = false,
  yearSelect = false,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)

  const selected = toDate(value)
  error = useFieldError({ error, required, missing: !value })
  const disabled = [min && { before: toDate(min) }, max && { after: toDate(max) }].filter(Boolean)

  const choose = (date) => {
    onChange?.(date ? toValue(date) : '')
    setOpen(false)
  }

  return (
    <Field label={label} error={error} required={required} missing={!value} className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${controlClass(error)} flex cursor-pointer items-center gap-2.5 text-left ${open ? 'border-primary' : ''}`}
      >
        <Icon name="calendar" size={17} className="text-text-secondary" />
        <span className={`flex-1 truncate ${value ? '' : 'text-text-secondary/80'}`}>
          {value ? formatDate(value) : placeholder}
        </span>
        {clearable && value && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation()
              choose(null)
            }}
            className="rounded-full p-0.5 text-text-secondary hover:bg-background hover:text-text-primary"
          >
            <Icon name="x" size={14} />
          </span>
        )}
      </button>

      <Popover anchorRef={triggerRef} open={open} onClose={() => setOpen(false)} width="auto" maxHeight={420} className="rounded-card p-3">
        <DayPicker
          mode="single"
          locale={uz}
          weekStartsOn={1}
          selected={selected}
          defaultMonth={selected || toDate(max) || new Date()}
          onSelect={choose}
          disabled={disabled}
          captionLayout={yearSelect ? 'dropdown' : 'label'}
          startMonth={yearSelect ? new Date(1990, 0) : undefined}
          endMonth={max ? toDate(max) : yearSelect ? new Date() : undefined}
          className="edu-calendar"
        />
        <div className="mt-2 flex justify-between gap-2 border-t border-border pt-3">
          <button type="button" onClick={() => choose(toDate(today()))} className="cursor-pointer rounded-full bg-background px-4 py-2 text-xs font-semibold hover:bg-surface">
            Bugun
          </button>
          <button type="button" onClick={() => setOpen(false)} className="cursor-pointer rounded-full px-4 py-2 text-xs font-medium text-text-secondary hover:bg-background">
            Yopish
          </button>
        </div>
      </Popover>
    </Field>
  )
}

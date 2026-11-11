import { useEffect, useRef, useState } from 'react'
import Field, { controlClass, useFieldError } from './Field'
import Icon from './Icon'
import Popover from './Popover'

const HOURS = Array.from({ length: 16 }, (_, i) => String(i + 7).padStart(2, '0')) // 07..22
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')) // 00, 05 .. 55
const QUICK = ['08:00', '10:00', '14:00', '16:00', '18:00']

/**
 * Vaqt tanlash: chapda soatlar, o'ngda daqiqalar, tepada tez tanlash.
 * value / onChange — "HH:MM" ko'rinishida.
 */
export default function TimePicker({ label, error, value, onChange, placeholder = 'Vaqtni tanlang', clearable = false, required = false, className = '' }) {
  error = useFieldError({ error, required, missing: !value })
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const [hour, minute] = value ? value.split(':') : ['', '']

  const set = (h, m) => onChange?.(`${h || '09'}:${m || '00'}`)

  return (
    <Field label={label} error={error} required={required} missing={!value} className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${controlClass(error)} flex cursor-pointer items-center gap-2.5 text-left ${open ? 'border-primary' : ''}`}
      >
        <Icon name="clock" size={17} className="text-text-secondary" />
        <span className={`flex-1 tabular-nums ${value ? '' : 'text-text-secondary/80'}`}>{value || placeholder}</span>
        {clearable && value && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation()
              onChange?.('')
            }}
            className="rounded-full p-0.5 text-text-secondary hover:bg-background hover:text-text-primary"
          >
            <Icon name="x" size={14} />
          </span>
        )}
      </button>

      <Popover anchorRef={triggerRef} open={open} onClose={() => setOpen(false)} width={260} maxHeight={360} className="flex flex-col gap-2 p-2">
        <div className="flex flex-wrap gap-1">
          {QUICK.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onChange?.(t)
                setOpen(false)
              }}
              className={`h-7 cursor-pointer rounded-full px-2.5 text-xs font-medium tabular-nums ${
                value === t ? 'bg-primary text-primary-accent' : 'bg-background hover:bg-surface'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-border pt-2">
          <TimeColumn title="Soat" items={HOURS} active={hour} onPick={(h) => set(h, minute)} />
          <TimeColumn title="Daqiqa" items={MINUTES} active={minute} onPick={(m) => { set(hour, m); setOpen(false) }} />
        </div>
      </Popover>
    </Field>
  )
}

// Bitta ustun (soatlar yoki daqiqalar). Tanlangan qiymat ko'rinadigan joyga scroll qilinadi.
function TimeColumn({ title, items, active, onPick }) {
  const listRef = useRef(null)
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'center' })
  }, [])
  return (
    <div className="flex min-w-0 flex-col">
      <span className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-text-secondary uppercase">{title}</span>
      <ul ref={listRef} className="scroll-thin m-0 h-52 list-none overflow-y-auto p-0">
        {items.map((v) => (
          <li
            key={v}
            data-active={v === active}
            onClick={() => onPick(v)}
            className={`cursor-pointer rounded-xl px-3 py-2 text-center text-sm tabular-nums ${
              v === active ? 'bg-primary font-semibold text-primary-accent' : 'hover:bg-background'
            }`}
          >
            {v}
          </li>
        ))}
      </ul>
    </div>
  )
}

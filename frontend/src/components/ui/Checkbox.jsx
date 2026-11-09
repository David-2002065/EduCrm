import Icon from './Icon'

/**
 * Belgilash katakchasi. onChange(true/false).
 * locked — rol orqali berilgan, o'zgartirib bo'lmaydi (kulrang belgi).
 */
export default function Checkbox({ checked, onChange, label, hint, disabled = false, locked = false }) {
  const off = disabled || locked
  return (
    <label className={`flex items-start gap-3 rounded-xl px-2 py-2 ${off ? 'cursor-default' : 'cursor-pointer hover:bg-background'}`}>
      <input type="checkbox" className="sr-only" checked={checked} disabled={off} onChange={(e) => onChange?.(e.target.checked)} />
      <span
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          checked ? (locked ? 'border-surface bg-surface text-text-secondary' : 'border-primary bg-primary text-on-primary') : 'border-border bg-card'
        }`}
      >
        {checked && <Icon name="check" size={13} strokeWidth={2.6} />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm">{label}</span>
        {hint && <span className="block text-xs text-text-secondary">{hint}</span>}
      </span>
    </label>
  )
}

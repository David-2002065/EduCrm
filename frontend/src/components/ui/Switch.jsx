// Yoqish / o'chirish tugmasi. onChange(true/false)
export default function Switch({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-background px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-text-secondary">{hint}</span>}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-mint' : 'bg-surface'}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </label>
  )
}

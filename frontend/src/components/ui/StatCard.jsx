import Icon from './Icon'

// Raqamli ko'rsatkich kartasi. dark=true — qora fon (asosiy ko'rsatkich uchun)
export default function StatCard({ label, value, icon, hint, dark = false, tone }) {
  const hintColor = { danger: 'text-danger', success: 'text-success' }[tone] || (dark ? 'text-on-primary/60' : 'text-text-secondary')
  return (
    <div className={`flex min-w-0 flex-col gap-4 rounded-card p-5 ${dark ? 'bg-primary text-on-primary' : 'bg-card'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm ${dark ? 'text-on-primary/70' : 'text-text-secondary'}`}>{label}</span>
        <span className={`flex size-10 items-center justify-center rounded-full ${dark ? 'bg-mint text-on-mint' : 'bg-background'}`}>
          <Icon name={icon} size={18} />
        </span>
      </div>
      <div>
        <div className="truncate font-display text-[28px] leading-8 font-medium tabular-nums sm:text-[32px] sm:leading-9">{value}</div>
        {hint && <div className={`mt-1 truncate text-[13px] ${hintColor}`}>{hint}</div>}
      </div>
    </div>
  )
}

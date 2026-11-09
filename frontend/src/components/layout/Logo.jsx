import { Icon } from '../ui'

/**
 * Logo + "EduCRM" yozuvi.
 * compact — faqat ikon; subtitle — pastida kichik matn (masalan filial nomi);
 * badge — ikon burchagida kichik belgi.
 */
export default function Logo({ light = false, compact = false, subtitle, badge = false }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-mint text-on-mint">
        <Icon name="graduation" size={20} />
        {badge && <span className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-background bg-primary" />}
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className={`block font-display text-xl leading-6 font-semibold tracking-tight whitespace-nowrap ${light ? 'text-white' : ''}`}>
            Edu<span className="font-light">CRM</span>
          </span>
          {subtitle && <span className="block truncate text-xs text-text-secondary">{subtitle}</span>}
        </span>
      )}
    </span>
  )
}

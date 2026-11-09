import Icon from './Icon'
import Tooltip from './Tooltip'

const VARIANTS = {
  outline: 'border border-border bg-card text-text-primary hover:bg-surface',
  ghost: 'text-text-secondary hover:bg-background hover:text-text-primary',
  danger: 'text-text-secondary hover:bg-danger-soft hover:text-danger',
}

// Faqat ikonli dumaloq tugma. label — tooltip'da chiqadi (tooltipSide: 'top' | 'right')
export default function IconButton({ icon, label, variant = 'ghost', size = 36, tooltipSide = 'top', className = '', ...props }) {
  return (
    <Tooltip label={label} side={tooltipSide}>
      <button
        type="button"
        aria-label={label}
        style={{ width: size, height: size }}
        className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${VARIANTS[variant]} ${className}`}
        {...props}
      >
        <Icon name={icon} size={Math.round(size * 0.47)} />
      </button>
    </Tooltip>
  )
}

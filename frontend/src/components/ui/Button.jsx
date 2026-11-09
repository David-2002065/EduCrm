import Icon from './Icon'
import Spinner from './Spinner'

const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary/85',
  secondary: 'bg-card text-text-primary border border-border hover:bg-surface',
  soft: 'bg-background text-text-primary hover:bg-surface',
  mint: 'bg-mint text-on-mint hover:brightness-95',
  danger: 'bg-danger text-white hover:bg-danger/90',
  ghost: 'text-text-secondary hover:bg-background hover:text-text-primary',
}

const SIZES = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
}

// Asosiy tugma. icon — chap tomondagi ikon nomi.
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={loading || props.disabled}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner size={14} /> : icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
    </button>
  )
}

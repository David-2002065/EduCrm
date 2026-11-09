import Field, { controlClass } from './Field'
import Icon from './Icon'

/**
 * onChange qiymatning o'zini qaytaradi (event emas): onChange={(v) => ...}
 * clearable — qiymat bo'lsa o'ng tomonda ✕ chiqadi (type="search" bo'lsa avtomatik)
 */
export default function Input({ label, error, hint, icon, onChange, clearable, className = '', ...props }) {
  const showClear = (clearable ?? props.type === 'search') && props.value !== '' && props.value != null && !props.disabled
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      <span className="relative block">
        {icon && (
          <Icon name={icon} size={17} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-secondary" />
        )}
        <input
          className={`${controlClass(error)} ${icon ? 'pl-11' : ''} ${showClear ? 'pr-10' : ''}`}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        />
        {showClear && (
          <button
            type="button"
            aria-label="Tozalash"
            onClick={(e) => {
              e.preventDefault()
              onChange?.('')
            }}
            className="absolute top-1/2 right-3 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-text-secondary hover:bg-background hover:text-text-primary"
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </span>
    </Field>
  )
}

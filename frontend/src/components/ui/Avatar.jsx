import { initials } from '../../utils/format'

const SIZES = { sm: 'size-8 text-[11px]', md: 'size-10 text-xs', lg: 'size-16 text-xl' }

export default function Avatar({ name, size = 'md', dark = false }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold ${SIZES[size]} ${
        dark ? 'bg-primary text-primary-accent' : 'bg-mint text-on-mint'
      }`}
    >
      {initials(name)}
    </span>
  )
}

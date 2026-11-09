import { formatPhone } from '../../utils/format'

// Bosilganda qo'ng'iroq qiladigan telefon raqami (ekranda: +998 99 089 39 54)
export default function PhoneLink({ phone }) {
  if (!phone) return <span className="text-text-secondary">—</span>
  return (
    <a
      href={`tel:${phone.replace(/\s/g, '')}`}
      onClick={(e) => e.stopPropagation()}
      className="text-text-primary tabular-nums no-underline hover:underline"
    >
      {formatPhone(phone)}
    </a>
  )
}

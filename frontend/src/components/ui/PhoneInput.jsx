import { cleanPhone, formatPhone } from '../../utils/format'
import Input from './Input'

/**
 * Telefon raqami. Ekranda "+998 99 089 39 54" ko'rinadi,
 * onChange esa bazaga yoziladigan probelsiz qiymatni beradi: "+998990893954".
 */
export default function PhoneInput({ value, onChange, placeholder = '+998 90 123 45 67', ...props }) {
  const handle = (text) => {
    let digits = text.replace(/\D/g, '').slice(0, 12)
    // Foydalanuvchi "90..." deb boshlasa, 998 ni o'zimiz qo'shamiz
    if (digits && !digits.startsWith('998')) digits = ('998' + digits).slice(0, 12)
    onChange?.(digits.length > 3 ? cleanPhone(digits) : '')
  }
  return (
    <Input
      type="tel"
      inputMode="tel"
      icon="phone"
      placeholder={placeholder}
      value={formatPhone(value)}
      onChange={handle}
      {...props}
    />
  )
}

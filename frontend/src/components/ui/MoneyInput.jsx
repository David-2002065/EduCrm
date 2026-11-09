import { formatAmount } from '../../utils/format'
import Input from './Input'

/**
 * Summa. Ekranda "450 000" ko'rinadi, onChange esa son beradi: 450000 (bo'sh bo'lsa '').
 */
export default function MoneyInput({ value, onChange, placeholder = '0', ...props }) {
  return (
    <Input
      inputMode="numeric"
      icon="wallet"
      placeholder={placeholder}
      value={formatAmount(value)}
      onChange={(text) => {
        const digits = text.replace(/\D/g, '').slice(0, 12)
        onChange?.(digits ? Number(digits) : '')
      }}
      {...props}
    />
  )
}

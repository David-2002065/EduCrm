import Input from './Input'

// Qidiruv maydoni: lupa ikoni + qiymat bo'lsa ✕ (tozalash)
export default function SearchInput({ placeholder = 'Qidirish...', ...props }) {
  return <Input type="search" icon="search" placeholder={placeholder} autoComplete="off" {...props} />
}

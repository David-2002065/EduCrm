import { useState } from 'react'

// Forma qiymatlarini boshqarish. field('name') -> { value, onChange } qaytaradi.
export function useForm(initial) {
  const [values, setValues] = useState(initial)
  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }))
  const field = (name) => ({ value: values[name] ?? '', onChange: (v) => set(name, v) })
  return { values, set, setValues, field, reset: () => setValues(initial) }
}

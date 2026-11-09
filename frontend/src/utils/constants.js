// Holatlar uchun matn va rang — bir joyda saqlanadi, hamma joyda shu ishlatiladi.
export const STUDENT_STATUS = {
  active: { label: 'Faol', tone: 'success' },
  left: { label: 'Ketgan', tone: 'neutral' },
}

export const PAYMENT_STATUS = {
  paid: { label: "To'lagan", tone: 'success' },
  partial: { label: 'Qisman', tone: 'warning' },
  unpaid: { label: "To'lamagan", tone: 'danger' },
}

export const ATTENDANCE_STATUS = {
  present: { label: 'Keldi', tone: 'success' },
  late: { label: 'Kechikdi', tone: 'warning' },
  absent: { label: 'Kelmadi', tone: 'danger' },
}

export const PAYMENT_METHODS = [
  { value: 'naqd', label: 'Naqd' },
  { value: 'karta', label: 'Karta' },
  { value: 'click', label: 'Click / Payme' },
]

// Guruh dars kunlari
export const GROUP_DAYS = [
  { value: 'Du, Chor, Ju', label: 'Du, Chor, Ju (toq kunlar)' },
  { value: 'Se, Pay, Sha', label: 'Se, Pay, Sha (juft kunlar)' },
  { value: 'Har kuni', label: 'Har kuni' },
  { value: 'Sha, Yak', label: 'Dam olish kunlari' },
]

export const toOptions = (map) => Object.entries(map).map(([value, { label }]) => ({ value, label }))

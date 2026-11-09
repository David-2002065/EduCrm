const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

// 450000 -> "450 000 so'm"
export const money = (n) => `${formatAmount(Math.round(Number(n || 0))) || 0} so'm`

// Qisqa ko'rinish: 19 875 000 -> "19.9 mln"
export const shortMoney = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} mln`
  if (n >= 1_000) return `${Math.round(n / 1_000)} ming`
  return String(n)
}

// "2026-10-31" -> "31.10.2026"
export const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

// Mahalliy vaqt bo'yicha "2026-10-31" (toISOString UTC beradi, shuning uchun qo'lda)
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
// "2026-10-31T14:05:00" -> "14:05"
export const formatTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const today = () => ymd(new Date())
export const currentMonth = () => today().slice(0, 7)

const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']

// Brauzer o'zbek tilini bilmasa ham to'g'ri chiqishi uchun qo'lda: "Shanba, 31-oktabr"
export const todayLabel = (d = new Date()) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()}-${MONTHS[d.getMonth()].toLowerCase()}`

// "2026-10" -> "Oktabr 2026"
export const monthLabel = (m) => {
  const [y, mm] = m.split('-')
  return `${MONTHS[Number(mm) - 1]} ${y}`
}
const MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
export const monthShort = (m) => MONTHS_SHORT[Number(m.split('-')[1]) - 1]

// Oxirgi N oy ro'yxati (Select uchun)
export const monthOptions = (count = 12) => {
  const result = []
  const d = new Date()
  d.setDate(1)
  for (let i = 0; i < count; i++) {
    const value = ymd(d).slice(0, 7)
    result.push({ value, label: monthLabel(value) })
    d.setMonth(d.getMonth() - 1)
  }
  return result
}

// "Aziz Karimov" -> "AK"
export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

// ---------- Telefon ----------
// Bazada: "+998990893954"  ->  ekranda: "+998 99 089 39 54"
export function formatPhone(value = '') {
  const d = String(value).replace(/\D/g, '')
  if (!d) return ''
  if (!d.startsWith('998')) return `+${d}`
  const parts = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean)
  return `+${parts.join(' ')}`
}

// Ekrandagi matndan bazaga: "+998 99 089 39 54" -> "+998990893954"
export const cleanPhone = (value = '') => {
  const d = String(value).replace(/\D/g, '')
  return d ? `+${d}` : ''
}

// ---------- Summa ----------
// 450000 -> "450 000" (inputda ko'rsatish uchun)
export const formatAmount = (value) => {
  const d = String(value ?? '').replace(/\D/g, '')
  return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''
}

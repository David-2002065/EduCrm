// Dars jadvali bilan ishlash (backend'dagi utils.py bilan bir xil qoida)
const ALL_DAYS = ['Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha']

// "Du, Chor, Ju" -> ['Du', 'Chor', 'Ju']
export const parseDays = (days = '') =>
  days.trim().toLowerCase() === 'har kuni' ? ALL_DAYS : days.split(',').map((d) => d.trim()).filter(Boolean)

// Ikki guruh bir vaqtga to'g'ri keladimi: vaqti bir xil va kamida bitta kuni umumiy
export const sameSlot = (a, b) =>
  !!a.time && a.time === b.time && parseDays(a.days).some((d) => parseDays(b.days).includes(d))

/**
 * Guruhlarni vaqt bo'yicha to'plash:
 * [{ time: '14:00', groups: [...] }, ...] — bir qatordagi guruhlar parallel o'tadi
 */
export function groupByTime(groups) {
  const map = new Map()
  for (const g of groups) {
    const key = g.time || '—'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(g)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([time, list]) => ({ time, groups: list }))
}

import { PAYMENT_METHODS } from './constants'
import { formatDate, formatPhone, formatTime, money, monthLabel } from './format'

/**
 * Chek printeri. Sozlamalar HAR BIR KOMPYUTER uchun alohida (localStorage) —
 * kassa kompyuterida bir printer, boshqasida boshqa bo'lishi mumkin.
 *
 * mode 'agent'   — kompyuterdagi EduCRM agenti orqali: oynasiz, darhol chiqadi (tavsiya)
 * mode 'browser' — brauzerning print oynasi orqali
 */
const KEY = 'printerSettings'
export const PRINTER_DEFAULTS = { mode: 'agent', agentUrl: 'http://127.0.0.1:17777', printer: '', width: 80, autoPrint: true }

export function loadPrinterSettings() {
  try {
    return { ...PRINTER_DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...PRINTER_DEFAULTS }
  }
}

export function savePrinterSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // brauzer saqlashga ruxsat bermasa — sozlama shu sessiya uchun qoladi
  }
}

// Agent ishlayaptimi + printerlar ro'yxati
export async function agentHealth(url) {
  const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2500) })
  if (!res.ok) throw new Error('Agent javob bermadi')
  return res.json()
}

// ---------- Chek matni (kassa printeri uchun qatorlar) ----------
const pad = (left, right, cols) => {
  const space = cols - left.length - right.length
  return space >= 1 ? [left + ' '.repeat(space) + right] : [left, ' '.repeat(Math.max(0, cols - right.length)) + right]
}

export function receiptLines(d, width = 80) {
  const cols = width === 58 ? 32 : 48 // Font A: 80mm = 48 belgi, 58mm = 32 belgi
  const line = { text: '-'.repeat(cols) }
  const row = (label, value, bold) => pad(`${label}:`, String(value ?? ''), cols).map((text) => ({ text, bold }))
  const method = PAYMENT_METHODS.find((m) => m.value === d.method)?.label || d.method

  return [
    { text: d.center_name, align: 'center', bold: true },
    d.branch_name && { text: d.branch_name, align: 'center' },
    d.branch_address && { text: d.branch_address, align: 'center' },
    d.branch_phone && { text: `Tel: ${formatPhone(d.branch_phone)}`, align: 'center' },
    line,
    { text: "TO'LOV CHEKI", align: 'center', bold: true },
    { text: `No ${d.number}`, align: 'center' },
    line,
    ...row('Sana', formatDate(d.paid_at)),
    ...row('Vaqt', formatTime(d.paid_at)),
    line,
    ...row("O'quvchi", d.student_name),
    ...(d.group_name ? row('Guruh', d.group_name) : []),
    ...(d.teacher_name ? row('Ustoz', d.teacher_name) : []),
    ...row("To'lov oyi", monthLabel(d.month)),
    ...row("To'lov turi", method),
    ...(d.note ? row('Izoh', d.note) : []),
    line,
    { text: "TO'LANDI", align: 'center' },
    { text: money(d.amount), align: 'center', bold: true, size: 'double' },
    line,
    ...row("Oylik to'lov", money(d.monthly_fee)),
    ...row('Shu oy jami', money(d.paid_total)),
    ...row('Qoldiq qarz', d.debt ? money(d.debt) : "Yo'q", true),
    line,
    ...row('Kassir', d.cashier_name),
    { text: '' },
    { text: 'Imzo: ' + '_'.repeat(cols - 6) },
    line,
    { text: "To'lovingiz uchun rahmat!", align: 'center' },
  ].filter(Boolean)
}

/**
 * Chekni chop etish. Qaytaradi: 'agent' yoki 'browser'.
 * Agent ishlamasa — xato tashlaydi (chaqiruvchi brauzer orqali chop etishni taklif qiladi).
 */
export async function printReceipt(data, settings = loadPrinterSettings()) {
  if (settings.mode !== 'agent') {
    window.print()
    return 'browser'
  }
  const res = await fetch(`${settings.agentUrl}/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ printer: settings.printer, lines: receiptLines(data, settings.width) }),
    signal: AbortSignal.timeout(10000),
  })
  const result = await res.json().catch(() => ({}))
  if (!result.ok) throw new Error(result.error || 'Printerga yuborib bo\'lmadi')
  return 'agent'
}

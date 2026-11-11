// Backend bilan ishlash uchun yagona joy.
//
// GET so'rovlar uchun o'zimizning kichik kesh (react-query o'rniga):
//  1) Bir xil manzilga bir vaqtda bir nechta so'rov bo'lsa — faqat BITTASI ketadi (dedupe).
//  2) Natija STALE_MS davomida keshda turadi — sahifaga qaytilganda qayta so'rov ketmaydi.
//  3) POST / PUT / DELETE muvaffaqiyatli bo'lsa — kesh tozalanadi va ekrandagi
//     useQuery'lar o'zi yangilanadi (invalidate).
const TOKEN_KEY = 'token'
const STALE_MS = 30_000

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    tokenStore.clear()
    clearCache()
    window.dispatchEvent(new Event('auth:logout'))
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = data?.detail
    // Pydantic tekshiruvi xatosi: [{ msg: 'Value error, Telefon raqamni ...' }]
    const message = typeof detail === 'string' ? detail : detail?.[0]?.msg?.replace(/^Value error, /, '')
    throw new Error(message || 'Xatolik yuz berdi')
  }
  return data
}

// ---------- Kesh ----------
const cache = new Map() // path -> { data, time }
const inflight = new Map() // path -> Promise (hozir ketayotgan so'rov)
const listeners = new Set() // kesh tozalanganda xabar oladiganlar (useQuery)

// Keshdagi yangi (eskirmagan) qiymat yoki undefined
export const peek = (path) => {
  const hit = cache.get(path)
  return hit && Date.now() - hit.time < STALE_MS ? hit.data : undefined
}

function get(path, { force = false } = {}) {
  if (!force) {
    const fresh = peek(path)
    if (fresh !== undefined) return Promise.resolve(fresh)
  }
  // Shu manzilga so'rov allaqachon ketayotgan bo'lsa — o'shani kutamiz
  if (inflight.has(path)) return inflight.get(path)
  const promise = request('GET', path)
    .then((data) => {
      cache.set(path, { data, time: Date.now() })
      return data
    })
    .finally(() => inflight.delete(path))
  inflight.set(path, promise)
  return promise
}

export function clearCache() {
  cache.clear()
}

// Ma'lumot o'zgardi: keshni tozalab, ekrandagi ro'yxatlarni yangilaymiz
export function invalidate() {
  cache.clear()
  listeners.forEach((fn) => fn())
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

const mutate = (method) => async (path, body) => {
  const data = await request(method, path, body)
  if (!path.startsWith('/auth/')) invalidate()
  return data
}

// Bo'sh qiymatlarni tashlab, query string yasaydi: { a: 1, b: '' } -> "?a=1"
export function qs(params = {}) {
  const clean = Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  return clean.length ? '?' + new URLSearchParams(clean).toString() : ''
}

export const api = {
  get,
  post: mutate('POST'),
  put: mutate('PUT'),
  delete: mutate('DELETE'),
}

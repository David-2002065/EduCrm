import { useCallback, useEffect, useState } from 'react'
import { api, peek, subscribe } from '../api'

/**
 * API'dan ma'lumot olish (keshli). const { data, loading, error, reload } = useQuery('/groups?branch_id=1')
 * - path null bo'lsa so'rov yuborilmaydi
 * - bir xil path'ni bir nechta komponent ishlatsa ham so'rov bitta ketadi
 * - biror narsa saqlansa/o'chirilsa (api.post/put/delete) o'zi yangilanadi
 */
export function useQuery(path) {
  const [state, setState] = useState(() => {
    const cached = path ? peek(path) : undefined
    return { data: cached ?? null, loading: !!path && cached === undefined, error: null }
  })

  const load = useCallback(
    (force) => {
      if (!path) return Promise.resolve()
      const cached = force ? undefined : peek(path)
      // Keshda bo'lsa — darhol ko'rsatamiz, "yuklanmoqda" chiqmaydi
      setState((s) => (cached !== undefined ? { data: cached, loading: false, error: null } : { ...s, loading: true, error: null }))
      if (cached !== undefined) return Promise.resolve()
      return api
        .get(path, { force })
        .then((data) => setState({ data, loading: false, error: null }))
        .catch((e) => setState((s) => ({ ...s, loading: false, error: e.message })))
    },
    [path],
  )

  useEffect(() => {
    load(false)
  }, [load])

  // Ma'lumot o'zgarganda (invalidate) qayta olamiz
  useEffect(() => subscribe(() => load(true)), [load])

  return { ...state, reload: () => load(true) }
}

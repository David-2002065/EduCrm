import { useState } from 'react'
import { useBranch } from '../context/BranchContext'

/**
 * Sahifa ichidagi filial filtri.
 * Yuqorida (sidebar'da) filial tanlangan bo'lsa — o'sha ishlatiladi va filtr yashiriladi.
 * Aks holda sahifaning o'zida filial tanlash mumkin.
 *
 * const { branchId, showFilter, local, setLocal } = useBranchFilter()
 */
export function useBranchFilter() {
  const { branchId: globalId, branchOptions } = useBranch()
  const [local, setLocal] = useState('')
  return {
    branchId: globalId || local,
    showFilter: !globalId,
    local,
    setLocal,
    branchOptions,
  }
}

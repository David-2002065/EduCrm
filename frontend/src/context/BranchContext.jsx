import { createContext, useContext, useState } from 'react'
import { useQuery } from '../hooks/useQuery'

/**
 * Tanlangan filial. Header'dagi Select orqali o'zgaradi,
 * sahifalar esa ma'lumotni shu filial bo'yicha oladi. '' = barcha filiallar.
 */
const BranchContext = createContext(null)
const KEY = 'branchId'

export function BranchProvider({ children }) {
  const [branchId, setBranchIdState] = useState(() => localStorage.getItem(KEY) || '')

  const { data, reload: reloadBranches } = useQuery('/branches')
  const branches = data || []

  const setBranchId = (id) => {
    setBranchIdState(String(id || ''))
    localStorage.setItem(KEY, String(id || ''))
  }

  const branchOptions = branches.map((b) => ({ value: String(b.id), label: b.name }))

  return (
    <BranchContext.Provider value={{ branches, branchOptions, branchId, setBranchId, reloadBranches }}>
      {children}
    </BranchContext.Provider>
  )
}

export const useBranch = () => useContext(BranchContext)

import { Select } from '../ui'

// Jadval tepasidagi filial filtri. useBranchFilter() bilan birga ishlatiladi.
export default function BranchFilter({ filter, className = 'w-full sm:w-52' }) {
  if (!filter.showFilter) return null
  return (
    <Select
      options={filter.branchOptions}
      value={filter.local}
      onChange={filter.setLocal}
      placeholder="Barcha filiallar"
      clearable
      className={className}
    />
  )
}

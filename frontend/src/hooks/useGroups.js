import { qs } from '../api'
import { useQuery } from './useQuery'

// Select uchun variant. Bir xil nomli/vaqtli guruhlar ko'p bo'lishi mumkin — shuning uchun ustoz va vaqt ham ko'rsatiladi
export const groupToOption = (g) => ({
  value: String(g.id),
  label: g.name,
  hint: [g.teacher_name, g.time].filter(Boolean).join(', '),
})

// Guruhlar ro'yxati + Select uchun tayyor variantlar
export function useGroups(branchId) {
  const { data, loading, reload } = useQuery(`/groups${qs({ branch_id: branchId })}`)
  const groups = data || []
  const groupOptions = groups.map(groupToOption)
  return { groups, groupOptions, loading, reload }
}

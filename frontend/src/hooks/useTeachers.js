import { qs } from '../api'
import { useQuery } from './useQuery'

// Ustozlar ro'yxati + Select uchun tayyor variantlar
export function useTeachers(branchId) {
  const { data, loading, error, reload } = useQuery(`/teachers${qs({ branch_id: branchId })}`)
  const teachers = data || []
  const teacherOptions = teachers.map((t) => ({ value: String(t.id), label: t.full_name, hint: t.subject }))
  return { teachers, teacherOptions, loading, error, reload }
}

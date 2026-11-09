import { useQuery } from './useQuery'

// Ruxsatlar katalogi: [{ group: "To'lovlar", items: [{ key, label }] }]
export function usePermissionCatalog() {
  const { data } = useQuery('/permissions')
  return data || []
}

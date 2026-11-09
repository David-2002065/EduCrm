import { api } from '../../api'
import { useDisclosure } from '../../hooks/useDisclosure'
import { usePermissionCatalog } from '../../hooks/usePermissionCatalog'
import { useQuery } from '../../hooks/useQuery'
import RoleFormModal from '../forms/RoleFormModal'
import { Button, ConfirmDialog, Loader, useToast } from '../ui'
import RoleCard from './RoleCard'

export default function RolesTab() {
  const toast = useToast()
  const { data: roles, loading } = useQuery('/roles')
  const catalog = usePermissionCatalog()
  const form = useDisclosure()
  const remove = useDisclosure()

  const deleteRole = async () => {
    try {
      await api.delete(`/roles/${remove.item.id}`)
      toast.success("Rol o'chirildi")
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button icon="plus" onClick={() => form.open()}>Yangi rol</Button>
      </div>
      {loading && !roles ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(roles || []).map((r) => (
            <RoleCard
              key={r.id}
              role={r}
              catalog={catalog}
              onEdit={r.is_system ? undefined : () => form.open(r)}
              onDelete={() => remove.open(r)}
            />
          ))}
        </div>
      )}
      <RoleFormModal open={form.isOpen} onClose={form.close} role={form.item} />
      <ConfirmDialog
        open={remove.isOpen}
        onClose={remove.close}
        onConfirm={deleteRole}
        title="Rolni o'chirish"
        text={`"${remove.item?.name}" roli o'chiriladi. Bu rolda foydalanuvchi bo'lsa, o'chmaydi.`}
      />
    </>
  )
}

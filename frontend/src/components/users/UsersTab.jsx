import { api } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useDisclosure } from '../../hooks/useDisclosure'
import { useQuery } from '../../hooks/useQuery'
import { roleTone } from '../../utils/permissions'
import PersonCell from '../common/PersonCell'
import RowActions from '../common/RowActions'
import UserFormModal from '../forms/UserFormModal'
import { Badge, Button, Card, ConfirmDialog, VirtualTable, useToast } from '../ui'

export default function UsersTab() {
  const toast = useToast()
  const { user: me } = useAuth()
  const { data, loading } = useQuery('/users')
  const form = useDisclosure()
  const remove = useDisclosure()

  const columns = [
    { key: 'name', title: 'Foydalanuvchi', width: '1.6fr', render: (u) => <PersonCell name={u.full_name} sub={`@${u.username}`} /> },
    { key: 'role', title: 'Rol', width: '1fr', render: (u) => <Badge tone={roleTone(u)}>{u.role_name}</Badge> },
    { key: 'teacher', title: 'Ustoz akkaunti', width: '1fr', render: (u) => u.teacher_name || <span className="text-text-secondary">—</span> },
    { key: 'perms', title: 'Ruxsatlar', width: '1fr', render: (u) => (
      <span className="text-text-secondary">
        {u.is_superadmin ? 'Hammasi' : `${u.permissions.length} ta`}
        {u.extra_permissions.length > 0 && <span className="text-success"> (+{u.extra_permissions.length} qo'shimcha)</span>}
      </span>
    ) },
    { key: 'act', title: '', width: '84px', align: 'right', render: (u) => (
      <RowActions onEdit={() => form.open(u)} onDelete={u.id !== me.id ? () => remove.open(u) : undefined} />
    ) },
  ]

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button icon="plus" onClick={() => form.open()}>Yangi foydalanuvchi</Button>
      </div>
      <Card padding="p-3 sm:p-4">
        <VirtualTable columns={columns} rows={data || []} loading={loading && !data} height={560} minWidth={820} onRowClick={(u) => form.open(u)} />
      </Card>
      <UserFormModal open={form.isOpen} onClose={form.close} user={form.item} />
      <ConfirmDialog
        open={remove.isOpen}
        onClose={remove.close}
        onConfirm={async () => {
          await api.delete(`/users/${remove.item.id}`)
          toast.success("Foydalanuvchi o'chirildi")
        }}
        title="Foydalanuvchini o'chirish"
        text={`${remove.item?.full_name} endi tizimga kira olmaydi.`}
      />
    </>
  )
}

import { useEffect } from 'react'
import { api } from '../../api'
import { useForm } from '../../hooks/useForm'
import PermissionPicker from '../users/PermissionPicker'
import FormSection from './FormSection'
import FormModal from './FormModal'
import { Input } from '../ui'

const EMPTY = { name: '', permissions: [] }

// Rol: nomi + ruxsatlari (masalan "Kassir": to'lov qabul qilish, to'lovlarni ko'rish)
export default function RoleFormModal({ open, onClose, role }) {
  const form = useForm(EMPTY)

  useEffect(() => {
    if (open) form.setValues(role ? { name: role.name, permissions: role.permissions } : EMPTY)
  }, [open, role]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (role) await api.put(`/roles/${role.id}`, form.values)
    else await api.post('/roles', form.values)
  }

  return (
    <FormModal open={open} onClose={onClose} title={role ? 'Rolni tahrirlash' : 'Yangi rol'} onSubmit={submit} size="lg">
      <Input label="Rol nomi" required placeholder="Masalan: Kassir" className="sm:col-span-2" {...form.field('name')} />
      <FormSection title="Bu rol nimalarni qila oladi" />
      <PermissionPicker value={form.values.permissions} onChange={(v) => form.set('permissions', v)} />
    </FormModal>
  )
}

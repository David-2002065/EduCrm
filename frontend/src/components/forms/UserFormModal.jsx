import { useEffect } from 'react'
import { api } from '../../api'
import { useForm } from '../../hooks/useForm'
import { useQuery } from '../../hooks/useQuery'
import { useTeachers } from '../../hooks/useTeachers'
import PermissionPicker from '../users/PermissionPicker'
import FormModal from './FormModal'
import FormSection from './FormSection'
import { Input, Select } from '../ui'

const EMPTY = { full_name: '', username: '', password: '', role_id: '', teacher_id: '', extra_permissions: [] }

/**
 * Foydalanuvchi qo'shish / tahrirlash.
 * Rol tanlanadi -> uning ruxsatlari belgilangan holda ko'rinadi; ustiga qo'shimcha ruxsat berish mumkin.
 * Ustoz akkaunti bo'lsa — ustozga bog'lanadi (faqat o'z guruhlarini ko'radi).
 */
export default function UserFormModal({ open, onClose, user }) {
  const form = useForm(EMPTY)
  const { data: roles } = useQuery(open ? '/roles' : null)
  const { teacherOptions } = useTeachers('')
  const role = (roles || []).find((r) => String(r.id) === String(form.values.role_id))

  useEffect(() => {
    if (!open) return
    form.setValues(
      user
        ? { ...EMPTY, ...user, password: '', role_id: String(user.role_id || ''), teacher_id: user.teacher_id ? String(user.teacher_id) : '' }
        : EMPTY,
    )
  }, [open, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    const v = form.values
    if (!v.role_id) throw new Error('Rolni tanlang')
    const body = {
      full_name: v.full_name, username: v.username, password: v.password || null,
      role_id: Number(v.role_id), teacher_id: v.teacher_id ? Number(v.teacher_id) : null,
      // roldan kelganlari qayta yuborilmaydi — faqat qo'shimchalar
      extra_permissions: v.extra_permissions.filter((p) => !role?.permissions.includes(p)),
    }
    if (user) await api.put(`/users/${user.id}`, body)
    else await api.post('/users', body)
  }

  return (
    <FormModal open={open} onClose={onClose} title={user ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'} onSubmit={submit} size="lg">
      <Input label="Ism familiya" required className="sm:col-span-2" {...form.field('full_name')} />
      <Input label="Login" required autoComplete="off" {...form.field('username')} />
      <Input
        label={user ? 'Yangi parol' : 'Parol'}
        type="password"
        required={!user}
        autoComplete="new-password"
        hint={user ? "Bo'sh qoldirilsa — parol o'zgarmaydi" : 'Kamida 6 belgi'}
        {...form.field('password')}
      />
      <Select
        label="Rol"
        options={(roles || []).map((r) => ({ value: String(r.id), label: r.name, hint: r.is_system ? 'hamma ruxsat' : `${r.permissions.length} ta ruxsat` }))}
        placeholder="Rolni tanlang"
        {...form.field('role_id')}
      />
      <Select
        label="Ustoz akkaunti (ixtiyoriy)"
        options={teacherOptions}
        placeholder="Bog'lanmagan"
        clearable
        hint="Tanlansa — faqat shu ustozning guruhlari ko'rinadi"
        {...form.field('teacher_id')}
      />

      {role && !role.is_system && (
        <>
          <FormSection title="Ruxsatlar — roldagilar belgilangan, qo'shimchasini belgilashingiz mumkin" />
          <PermissionPicker
            value={form.values.extra_permissions}
            locked={role.permissions}
            onChange={(v) => form.set('extra_permissions', v)}
          />
        </>
      )}
      {role?.is_system && (
        <p className="m-0 rounded-2xl bg-mint-soft p-3 text-sm text-success sm:col-span-2">Bosh admin — tizimdagi hamma narsaga ruxsati bor.</p>
      )}
    </FormModal>
  )
}

import { useEffect } from 'react'
import { api } from '../../api'
import { useBranch } from '../../context/BranchContext'
import { useForm } from '../../hooks/useForm'
import { Input, PhoneInput, Select } from '../ui'
import FormModal from './FormModal'

const EMPTY = { full_name: '', phone: '', subject: '', branch_id: '' }

export default function TeacherFormModal({ open, onClose, teacher, onSaved }) {
  const { branchOptions, branchId } = useBranch()
  const form = useForm(EMPTY)

  useEffect(() => {
    if (!open) return
    form.setValues(
      teacher
        ? { ...EMPTY, ...teacher, branch_id: teacher.branch_id ? String(teacher.branch_id) : '' }
        : { ...EMPTY, branch_id: branchId },
    )
  }, [open, teacher]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    const v = form.values
    const body = { full_name: v.full_name, phone: v.phone, subject: v.subject, branch_id: v.branch_id ? Number(v.branch_id) : null }
    const saved = teacher ? await api.put(`/teachers/${teacher.id}`, body) : await api.post('/teachers', body)
    onSaved?.(saved)
  }

  return (
    <FormModal open={open} onClose={onClose} title={teacher ? 'Ustozni tahrirlash' : 'Yangi ustoz'} onSubmit={submit}>
      <Input label="Ism familiya" required placeholder="Malika Saidova" className="sm:col-span-2" {...form.field('full_name')} />
      <PhoneInput label="Telefon" {...form.field('phone')} />
      <Input label="Fani" placeholder="Ingliz tili" icon="book" {...form.field('subject')} />
      <Select
        label="Filial"
        options={branchOptions}
        placeholder="Hamma filiallarda"
        clearable
        hint="Bo'sh qoldirilsa — hamma filialda dars bera oladi"
        className="sm:col-span-2"
        {...form.field('branch_id')}
      />
    </FormModal>
  )
}

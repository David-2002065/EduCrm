import { useEffect } from 'react'
import { api } from '../../api'
import { useBranch } from '../../context/BranchContext'
import { useForm } from '../../hooks/useForm'
import { useGroups } from '../../hooks/useGroups'
import { STUDENT_STATUS, toOptions } from '../../utils/constants'
import { today } from '../../utils/format'
import { DatePicker, Input, PhoneInput, Select, Textarea } from '../ui'
import GroupSummary from '../groups/GroupSummary'
import FormModal from './FormModal'
import FormSection from './FormSection'

const EMPTY = {
  full_name: '', phone: '', birth_date: '', address: '',
  parent_name: '', parent_phone: '', status: 'active', note: '',
  branch_id: '', group_id: '',
}

export default function StudentFormModal({ open, onClose, student, onSaved }) {
  const { branchOptions, branchId } = useBranch()
  const form = useForm(EMPTY)
  const { groups, groupOptions } = useGroups(form.values.branch_id)
  const selectedGroup = groups.find((g) => String(g.id) === String(form.values.group_id))

  useEffect(() => {
    if (!open) return
    form.setValues(
      student
        ? { ...EMPTY, ...student, birth_date: student.birth_date || '', branch_id: String(student.branch_id), group_id: student.group_id ? String(student.group_id) : '' }
        : { ...EMPTY, branch_id: branchId },
    )
  }, [open, student]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filial o'zgarsa, guruhni tozalaymiz (boshqa filial guruhi bo'lib qolmasin)
  const changeBranch = (value) => form.setValues((v) => ({ ...v, branch_id: value, group_id: '' }))

  const submit = async () => {
    const v = form.values
    if (!v.branch_id) throw new Error('Filialni tanlang')
    const body = {
      full_name: v.full_name, phone: v.phone, birth_date: v.birth_date || null, address: v.address,
      parent_name: v.parent_name, parent_phone: v.parent_phone, status: v.status, note: v.note || '',
      branch_id: Number(v.branch_id), group_id: v.group_id ? Number(v.group_id) : null,
    }
    const saved = student ? await api.put(`/students/${student.id}`, body) : await api.post('/students', body)
    onSaved?.(saved)
  }

  return (
    <FormModal open={open} onClose={onClose} title={student ? "O'quvchini tahrirlash" : "Yangi o'quvchi"} onSubmit={submit} size="lg">
      <FormSection title="O'quvchi" />
      <Input label="Ism familiya" required placeholder="Aziz Karimov" {...form.field('full_name')} />
      <PhoneInput label="Telefon" {...form.field('phone')} />
      <DatePicker label="Tug'ilgan sana" yearSelect clearable max={today()} {...form.field('birth_date')} />
      <Input label="Manzil" placeholder="Toshkent, ..." icon="mapPin" {...form.field('address')} />

      <FormSection title="Ota-ona" />
      <Input label="Ota-onasining ismi" placeholder="Akmal Karimov" icon="user" {...form.field('parent_name')} />
      <PhoneInput label="Ota-onasining telefoni" {...form.field('parent_phone')} />

      <FormSection title="O'qish" />
      <Select label="Filial" required options={branchOptions} value={form.values.branch_id} onChange={changeBranch} />
      <Select
        label="Guruh"
        options={groupOptions}
        placeholder={form.values.branch_id ? 'Guruhni tanlang' : 'Avval filialni tanlang'}
        disabled={!form.values.branch_id}
        clearable
        {...form.field('group_id')}
      />
      {/* Guruh tanlanganda ustoz va dars vaqti avtomatik ko'rinadi */}
      <GroupSummary group={selectedGroup} className="sm:col-span-2" />
      <Select label="Holati" options={toOptions(STUDENT_STATUS)} {...form.field('status')} />
      <Textarea label="Izoh" placeholder="Qo'shimcha ma'lumot" className="sm:col-span-2" {...form.field('note')} />
    </FormModal>
  )
}

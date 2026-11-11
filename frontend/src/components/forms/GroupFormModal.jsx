import { useEffect } from 'react'
import { api } from '../../api'
import { useBranch } from '../../context/BranchContext'
import { useForm } from '../../hooks/useForm'
import { useGroups } from '../../hooks/useGroups'
import { useTeachers } from '../../hooks/useTeachers'
import { GROUP_DAYS } from '../../utils/constants'
import SlotInfo from '../groups/SlotInfo'
import { Input, MoneyInput, Select, TimePicker } from '../ui'
import FormModal from './FormModal'

const EMPTY = { name: '', course: '', teacher_id: '', days: '', time: '', monthly_fee: '', branch_id: '' }


export default function GroupFormModal({ open, onClose, group, onSaved }) {
  const { branchOptions, branchId } = useBranch()
  const form = useForm(EMPTY)
  const { teacherOptions } = useTeachers(form.values.branch_id)
  const { groups: allGroups, reload: reloadGroups } = useGroups('') // ustoz bandligini hamma filial bo'yicha tekshiramiz

  useEffect(() => {
    if (!open) return
    reloadGroups()
    form.setValues(
      group
        ? { ...EMPTY, ...group, branch_id: String(group.branch_id), teacher_id: group.teacher_id ? String(group.teacher_id) : '' }
        : { ...EMPTY, branch_id: branchId },
    )
  }, [open, group]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    const v = form.values
    if (!v.branch_id) throw new Error('Filialni tanlang')
    const body = {
      name: v.name, course: v.course, days: v.days, time: v.time,
      teacher_id: v.teacher_id ? Number(v.teacher_id) : null,
      monthly_fee: Number(v.monthly_fee) || 0, branch_id: Number(v.branch_id),
    }
    const saved = group ? await api.put(`/groups/${group.id}`, body) : await api.post('/groups', body)
    onSaved?.(saved)
  }

  return (
    <FormModal open={open} onClose={onClose} title={group ? 'Guruhni tahrirlash' : 'Yangi guruh'} onSubmit={submit}>
      <Input label="Guruh nomi" required placeholder="English Beginner A" {...form.field('name')} />
      <Input label="Kurs / fan" placeholder="Ingliz tili" icon="book" {...form.field('course')} />
      <Select label="Filial" required options={branchOptions} {...form.field('branch_id')} />
      <Select label="Ustoz" options={teacherOptions} placeholder="Ustozni tanlang" clearable {...form.field('teacher_id')} />
      <Select label="Dars kunlari" options={GROUP_DAYS} {...form.field('days')} />
      <TimePicker label="Vaqti" {...form.field('time')} />
      <SlotInfo values={form.values} groups={allGroups} editingId={group?.id} />
      <MoneyInput label="Oylik to'lov (so'm)" placeholder="450 000" className="sm:col-span-2" {...form.field('monthly_fee')} />
    </FormModal>
  )
}

import { useEffect } from 'react'
import { api } from '../../api'
import { useForm } from '../../hooks/useForm'
import { Input, PhoneInput } from '../ui'
import FormModal from './FormModal'

const EMPTY = { name: '', address: '', phone: '' }

// branch berilsa — tahrirlash, bo'lmasa — yangi qo'shish
export default function BranchFormModal({ open, onClose, branch, onSaved }) {
  const form = useForm(EMPTY)

  useEffect(() => {
    if (open) form.setValues(branch ? { ...EMPTY, ...branch } : EMPTY)
  }, [open, branch]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    const body = { name: form.values.name, address: form.values.address, phone: form.values.phone }
    const saved = branch ? await api.put(`/branches/${branch.id}`, body) : await api.post('/branches', body)
    onSaved?.(saved)
  }

  return (
    <FormModal open={open} onClose={onClose} title={branch ? 'Filialni tahrirlash' : 'Yangi filial'} onSubmit={submit}>
      <Input label="Filial nomi" required placeholder="Chilonzor filiali" className="sm:col-span-2" {...form.field('name')} />
      <Input label="Manzil" placeholder="Toshkent, ..." icon="mapPin" className="sm:col-span-2" {...form.field('address')} />
      <PhoneInput label="Telefon" placeholder="+998 71 200 10 10" {...form.field('phone')} />
    </FormModal>
  )
}

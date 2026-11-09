import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useForm } from '../../hooks/useForm'
import { PAYMENT_METHODS } from '../../utils/constants'
import { currentMonth, money, monthOptions } from '../../utils/format'
import { Input, MoneyInput, Select } from '../ui'
import ReceiptModal from '../receipt/ReceiptModal'
import FormModal from './FormModal'

/**
 * To'lov qabul qilish. Saqlangach chek avtomatik ochiladi (chop etish mumkin).
 * student: { id, full_name }, defaults: { month, amount }
 */
export default function PaymentFormModal({ open, onClose, student, defaults = {}, onSaved }) {
  const form = useForm({ month: currentMonth(), amount: '', method: 'naqd', note: '' })
  const [receiptId, setReceiptId] = useState(null)

  useEffect(() => {
    if (open) form.setValues({ month: defaults.month || currentMonth(), amount: defaults.amount || '', method: 'naqd', note: '' })
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    const amount = Number(form.values.amount)
    if (!amount || amount <= 0) throw new Error('Summani kiriting')
    const saved = await api.post('/payments', { ...form.values, amount, student_id: student.id })
    setReceiptId(saved.id)
    onSaved?.(saved)
  }

  return (
    <>
      <FormModal
        open={open}
        onClose={onClose}
        title="To'lov qabul qilish"
        subtitle={student?.full_name}
        onSubmit={submit}
        submitText="To'lovni saqlash"
        successText="To'lov qabul qilindi"
      >
        <Select label="Qaysi oy uchun" options={monthOptions(12)} {...form.field('month')} />
        <Select label="To'lov turi" options={PAYMENT_METHODS} {...form.field('method')} />
        <MoneyInput
          label="Summa (so'm)"
          required
          hint={defaults.amount ? `Qarzi: ${money(defaults.amount)}` : undefined}
          className="sm:col-span-2"
          {...form.field('amount')}
        />
        <Input label="Izoh" placeholder="Ixtiyoriy" className="sm:col-span-2" {...form.field('note')} />
      </FormModal>
      <ReceiptModal paymentId={receiptId} onClose={() => setReceiptId(null)} autoPrint />
    </>
  )
}

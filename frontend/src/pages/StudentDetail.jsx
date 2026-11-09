import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import RowActions from '../components/common/RowActions'
import PaymentFormModal from '../components/forms/PaymentFormModal'
import StudentFormModal from '../components/forms/StudentFormModal'
import ReceiptButton from '../components/receipt/ReceiptButton'
import ReceiptModal from '../components/receipt/ReceiptModal'
import AttendanceHistory from '../components/students/AttendanceHistory'
import StatPill from '../components/students/StatPill'
import { Avatar, Button, Card, ConfirmDialog, EmptyState, ErrorBox, IconButton, InfoRow, Loader, StatusBadge, SummaryRow, VirtualTable, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useDisclosure } from '../hooks/useDisclosure'
import { useQuery } from '../hooks/useQuery'
import { PAYMENT_METHODS, PAYMENT_STATUS, STUDENT_STATUS } from '../utils/constants'
import { formatDate, formatPhone, money, monthLabel } from '../utils/format'

const tel = (p) => (p ? `tel:${p.replace(/\s/g, '')}` : undefined)
const methodLabel = (m) => PAYMENT_METHODS.find((x) => x.value === m)?.label || m

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { can } = useAuth()
  const { data, loading, error, reload } = useQuery(`/students/${id}`)
  const [editOpen, setEditOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const removePayment = useDisclosure()
  const [receiptId, setReceiptId] = useState(null)

  if (loading && !data) return <Loader />
  if (error) return <ErrorBox message={error} onRetry={reload} />

  const { student: s, payments, attendance, attendance_stats: st, payment_status, can_see_money: showMoney } = data
  const debt = Math.max(s.monthly_fee - s.paid_this_month, 0)

  const paymentColumns = [
    { key: 'month', title: 'Oy', width: '1.2fr', render: (p) => <span className="font-medium">{monthLabel(p.month)}</span> },
    { key: 'amount', title: 'Summa', width: '1fr', render: (p) => <span className="font-semibold text-success tabular-nums">{money(p.amount)}</span> },
    { key: 'method', title: 'Turi', width: '0.8fr', render: (p) => methodLabel(p.method) },
    { key: 'date', title: 'Sana', width: '0.8fr', render: (p) => formatDate(p.paid_at) },
    { key: 'cashier', title: 'Kassir', width: '1fr', render: (p) => p.cashier_name || '—' },
    { key: 'actions', title: '', width: '84px', align: 'right', render: (p) => (
      <div className="flex justify-end gap-1">
        <ReceiptButton onClick={() => setReceiptId(p.id)} />
        {can('payments.delete') && <RowActions onDelete={() => removePayment.open(p)} />}
      </div>
    ) },
  ]

  const deletePayment = async () => {
    await api.delete(`/payments/${removePayment.item.id}`)
    toast.success("To'lov o'chirildi")
    reload()
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <IconButton icon="chevronLeft" label="Orqaga" variant="outline" size={40} onClick={() => navigate(-1)} />
        <span className="text-sm text-text-secondary">O'quvchilar</span>
      </div>

      {/* Sarlavha kartasi */}
      <Card className="mb-3">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={s.full_name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="m-0 font-display text-[28px] leading-9 font-light">{s.full_name}</h1>
              <StatusBadge map={STUDENT_STATUS} value={s.status} />
            </div>
            <p className="m-0 mt-1 text-sm text-text-secondary">
              {s.group_name || 'Guruhsiz'} · {s.branch_name} · {formatDate(s.joined_at)} dan beri
            </p>
          </div>
          <div className="flex gap-2">
            {can('students.edit') && <Button variant="secondary" icon="edit" onClick={() => setEditOpen(true)}>Tahrirlash</Button>}
            {can('payments.create') && <Button icon="wallet" onClick={() => setPayOpen(true)}>To'lov qilish</Button>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Card title="Shaxsiy ma'lumot">
            <div className="flex flex-col gap-2">
              <InfoRow icon="phone" label="Telefon" value={formatPhone(s.phone)} href={tel(s.phone)} />
              <InfoRow icon="calendar" label="Tug'ilgan sana" value={s.birth_date && formatDate(s.birth_date)} />
              <InfoRow icon="mapPin" label="Manzil" value={s.address} />
            </div>
            {s.note && <p className="m-0 mt-3 rounded-2xl bg-warning-soft p-3 text-sm text-warning">{s.note}</p>}
          </Card>
          <Card title="Ota-ona">
            <div className="flex flex-col gap-2">
              <InfoRow icon="user" label="Ismi" value={s.parent_name} />
              <InfoRow icon="phone" label="Telefoni" value={formatPhone(s.parent_phone)} href={tel(s.parent_phone)} />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-3 xl:col-span-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {showMoney && (
            <Card title="Shu oy to'lovi" action={<StatusBadge map={PAYMENT_STATUS} value={payment_status} />}>
              <div className="flex flex-col gap-2">
                <SummaryRow label="Oylik summa" value={money(s.monthly_fee)} />
                <SummaryRow label="To'lagan" value={money(s.paid_this_month)} tone="success" />
                <SummaryRow label="Qarzi" value={money(debt)} tone={debt ? 'danger' : undefined} />
              </div>
            </Card>
            )}
            <Card title="Davomat" subtitle="Oxirgi darslar">
              <div className="mb-4 flex gap-2">
                <StatPill value={st.present} label="Keldi" tone="success" />
                <StatPill value={st.late} label="Kechikdi" tone="warning" />
                <StatPill value={st.absent} label="Kelmadi" tone="danger" />
              </div>
              <AttendanceHistory items={attendance} />
            </Card>
          </div>

          {showMoney && (
          <Card title="To'lovlar tarixi" padding="p-4 sm:p-6">
            <VirtualTable
              columns={paymentColumns}
              rows={payments}
              rowHeight={52}
              height={360}
              minWidth={640}
              empty={<EmptyState icon="wallet" title="To'lovlar yo'q" />}
            />
          </Card>
          )}
        </div>
      </div>

      <StudentFormModal open={editOpen} onClose={() => setEditOpen(false)} student={s} onSaved={reload} />
      <PaymentFormModal open={payOpen} onClose={() => setPayOpen(false)} student={s} defaults={{ amount: debt || s.monthly_fee }} onSaved={reload} />
      <ReceiptModal paymentId={receiptId} onClose={() => setReceiptId(null)} />
      <ConfirmDialog
        open={removePayment.isOpen}
        onClose={removePayment.close}
        onConfirm={deletePayment}
        title="To'lovni o'chirish"
        text={removePayment.item && `${monthLabel(removePayment.item.month)} uchun ${money(removePayment.item.amount)} to'lov o'chiriladi.`}
      />
    </>
  )
}

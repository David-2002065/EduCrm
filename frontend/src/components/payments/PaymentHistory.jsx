import { useState } from 'react'
import { api, qs } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useBranchFilter } from '../../hooks/useBranchFilter'
import { useDisclosure } from '../../hooks/useDisclosure'
import { useQuery } from '../../hooks/useQuery'
import { PAYMENT_METHODS } from '../../utils/constants'
import { formatDate, money, monthOptions } from '../../utils/format'
import BranchFilter from '../common/BranchFilter'
import PersonCell from '../common/PersonCell'
import RowActions from '../common/RowActions'
import Toolbar from '../common/Toolbar'
import ReceiptButton from '../receipt/ReceiptButton'
import ReceiptModal from '../receipt/ReceiptModal'
import { Card, ConfirmDialog, EmptyState, Select, VirtualTable, useToast } from '../ui'

// ---------- Tarix: qabul qilingan to'lovlar ----------
export default function PaymentHistory({ month, setMonth }) {
  const toast = useToast()
  const { can } = useAuth()
  const branch = useBranchFilter()
  const { branchId } = branch
  const remove = useDisclosure()
  const [receiptId, setReceiptId] = useState(null)
  const { data, loading, reload } = useQuery(`/payments${qs({ month, branch_id: branchId })}`)
  const rows = data || []
  const total = rows.reduce((s, p) => s + p.amount, 0)

  const columns = [
    { key: 'name', title: "O'quvchi", width: '2fr', render: (p) => <PersonCell name={p.student_name} sub={p.group_name} /> },
    { key: 'amount', title: 'Summa', width: '1fr', render: (p) => <span className="font-semibold text-success tabular-nums">+{money(p.amount)}</span> },
    { key: 'method', title: 'Turi', width: '0.8fr', render: (p) => PAYMENT_METHODS.find((m) => m.value === p.method)?.label },
    { key: 'date', title: 'Sana', width: '0.8fr', render: (p) => formatDate(p.paid_at) },
    { key: 'cashier', title: 'Kassir', width: '1fr', render: (p) => p.cashier_name || '—' },
    { key: 'note', title: 'Izoh', width: '1fr', render: (p) => <span className="text-text-secondary">{p.note || '—'}</span> },
    { key: 'act', title: '', width: '84px', align: 'right', render: (p) => (
      <div className="flex justify-end gap-1">
        <ReceiptButton onClick={() => setReceiptId(p.id)} />
        {can('payments.delete') && <RowActions onDelete={() => remove.open(p)} />}
      </div>
    ) },
  ]

  const deletePayment = async () => {
    await api.delete(`/payments/${remove.item.id}`)
    toast.success("To'lov o'chirildi")
    reload()
  }

  return (
    <>
      <Toolbar>
        <Select options={monthOptions(12)} value={month} onChange={setMonth} className="w-full sm:w-48" />
        <BranchFilter filter={branch} />
        <span className="text-sm text-text-secondary sm:ml-auto">
          Jami: <b className="text-text-primary">{money(total)}</b> · {rows.length} ta to'lov
        </span>
      </Toolbar>
      <Card padding="p-3 sm:p-4">
        <VirtualTable columns={columns} rows={rows} loading={loading && !data} height={600} minWidth={980} empty={<EmptyState icon="wallet" title="Bu oyda to'lov yo'q" />} />
      </Card>
      <ReceiptModal paymentId={receiptId} onClose={() => setReceiptId(null)} />
      <ConfirmDialog
        open={remove.isOpen}
        onClose={remove.close}
        onConfirm={deletePayment}
        title="To'lovni o'chirish"
        text={remove.item && `${remove.item.student_name} — ${money(remove.item.amount)} o'chiriladi.`}
      />
    </>
  )
}

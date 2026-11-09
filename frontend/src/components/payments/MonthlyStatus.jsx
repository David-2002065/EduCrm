import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { qs } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useBranchFilter } from '../../hooks/useBranchFilter'
import { useDisclosure } from '../../hooks/useDisclosure'
import { useQuery } from '../../hooks/useQuery'
import { useGroups } from '../../hooks/useGroups'
import { PAYMENT_STATUS } from '../../utils/constants'
import { money, monthOptions, shortMoney } from '../../utils/format'
import BranchFilter from '../common/BranchFilter'
import PersonCell from '../common/PersonCell'
import PhoneLink from '../common/PhoneLink'
import Toolbar from '../common/Toolbar'
import PaymentFormModal from '../forms/PaymentFormModal'
import { Button, Card, EmptyState, ErrorBox, SearchInput, Select, StatCard, StatusBadge, Tabs, VirtualTable } from '../ui'

// ---------- Oylik holat: har bir o'quvchi to'ladimi ----------
export default function MonthlyStatus({ month, setMonth }) {
  const navigate = useNavigate()
  const branch = useBranchFilter()
  const { can } = useAuth()
  const { branchId } = branch
  const { groupOptions } = useGroups(branchId)
  const [groupId, setGroupId] = useState('')
  useEffect(() => setGroupId(''), [branchId]) // filial o'zgarsa guruh filtri tozalanadi
  const [filter, setFilter] = useState('debt')
  const [search, setSearch] = useState('')
  const pay = useDisclosure()

  const { data, loading, error, reload } = useQuery(`/payments/status${qs({ month, branch_id: branchId, group_id: groupId })}`)

  const all = data?.rows || []
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all
      .filter((r) => (filter === 'debt' ? r.status !== 'paid' : filter === 'paid' ? r.status === 'paid' : true))
      .filter((r) => !q || r.full_name.toLowerCase().includes(q))
  }, [all, filter, search])

  if (error) return <ErrorBox message={error} onRetry={reload} />
  const sum = data?.summary

  const tabs = [
    { value: 'debt', label: 'Qarzdorlar', count: sum?.unpaid_count },
    { value: 'paid', label: "To'laganlar", count: sum?.paid_count },
    { value: 'all', label: 'Hammasi', count: all.length },
  ]

  const columns = [
    { key: 'name', title: "O'quvchi", width: '2fr', render: (r) => <PersonCell name={r.full_name} sub={[r.group_name, r.branch_name].filter(Boolean).join(' · ')} /> },
    { key: 'parent', title: 'Ota-ona', width: '1.3fr', render: (r) => <PhoneLink phone={r.parent_phone} /> },
    { key: 'fee', title: 'Oylik', width: '1fr', render: (r) => <span className="tabular-nums">{money(r.fee)}</span> },
    { key: 'paid', title: "To'lagan", width: '1fr', render: (r) => <span className="text-success tabular-nums">{money(r.paid)}</span> },
    { key: 'debt', title: 'Qarz', width: '1fr', render: (r) => <span className={`tabular-nums ${r.debt ? 'font-semibold text-danger' : 'text-text-secondary'}`}>{money(r.debt)}</span> },
    { key: 'status', title: 'Holati', width: '110px', render: (r) => <StatusBadge map={PAYMENT_STATUS} value={r.status} /> },
    { key: 'act', title: '', width: '110px', align: 'right', render: (r) =>
      r.debt > 0 && can('payments.create') && (
        <Button size="sm" variant="mint" onClick={(e) => { e.stopPropagation(); pay.open(r) }}>To'lash</Button>
      ),
    },
  ]

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard dark label="Tushgan" value={shortMoney(sum?.collected || 0)} icon="wallet" hint={money(sum?.collected || 0)} />
        <StatCard label="Kutilgan" value={shortMoney(sum?.expected || 0)} icon="calendar" hint={money(sum?.expected || 0)} />
        <StatCard label="Qarz" value={shortMoney(sum?.debt || 0)} icon="alert" hint={`${sum?.unpaid_count || 0} ta o'quvchi`} tone="danger" />
      </div>

      <Toolbar>
        <Select options={monthOptions(12)} value={month} onChange={setMonth} className="w-full sm:w-48" />
        <BranchFilter filter={branch} />
        <Select options={groupOptions} value={groupId} onChange={setGroupId} placeholder="Barcha guruhlar" clearable className="w-full sm:w-56" />
        <SearchInput placeholder="Ism bo'yicha..." value={search} onChange={setSearch} className="w-full sm:w-60" />
        <Tabs items={tabs} value={filter} onChange={setFilter} className="sm:ml-auto" />
      </Toolbar>

      <Card padding="p-3 sm:p-4">
        <VirtualTable
          columns={columns}
          rows={rows}
          rowKey="student_id"
          loading={loading && !data}
          height={560}
          minWidth={960}
          onRowClick={(r) => navigate(`/students/${r.student_id}`)}
          empty={<EmptyState icon="check" title={filter === 'debt' ? "Qarzdor yo'q" : 'Topilmadi'} />}
        />
      </Card>

      <PaymentFormModal
        open={pay.isOpen}
        onClose={pay.close}
        student={pay.item && { id: pay.item.student_id, full_name: pay.item.full_name }}
        defaults={{ month, amount: pay.item?.debt }}
        onSaved={reload}
      />
    </>
  )
}

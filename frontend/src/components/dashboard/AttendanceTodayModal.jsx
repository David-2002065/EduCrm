import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { qs } from '../../api'
import { useQuery } from '../../hooks/useQuery'
import PersonCell from '../common/PersonCell'
import PhoneLink from '../common/PhoneLink'
import { Badge, EmptyState, ErrorBox, Modal, SearchInput, Select, Tabs, VirtualTable } from '../ui'

const STATUS = {
  absent: { label: 'Kelmadi', tone: 'danger', tab: 'danger' },
  present: { label: 'Keldi', tone: 'success' }, // faol tab — odatiy (qora)
  late: { label: 'Kechikdi', tone: 'warning', tab: 'warning' },
}

// Bosh sahifa: bugun kim keldi / kelmadi — guruhi va ota-onasining telefoni bilan
export default function AttendanceTodayModal({ open, onClose, branchId }) {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useQuery(open ? `/dashboard/attendance-today${qs({ branch_id: branchId })}` : null)
  const rows = useMemo(() => data || [], [data])
  const [tab, setTab] = useState('absent')
  const [groupId, setGroupId] = useState('')
  const [search, setSearch] = useState('')

  // Har ochilganda — "Kelmadi" tabidan boshlanadi
  useEffect(() => {
    if (!open) return
    setTab('absent')
    setGroupId('')
    setSearch('')
  }, [open])

  const groupOptions = useMemo(() => {
    const seen = new Map()
    rows.forEach((r) => r.group_id && seen.set(r.group_id, { value: String(r.group_id), label: r.group_name, hint: [r.teacher_name, r.group_time].filter(Boolean).join(', ') }))
    return [...seen.values()]
  }, [rows])

  const inGroup = rows.filter((r) => !groupId || String(r.group_id) === groupId)
  const count = (status) => inGroup.filter((r) => r.status === status).length
  const q = search.trim().toLowerCase()
  const list = inGroup.filter(
    (r) => r.status === tab && (!q || `${r.full_name} ${r.parent_name} ${r.parent_phone} ${r.group_name}`.toLowerCase().includes(q)),
  )

  const columns = [
    { key: 'n', title: '№', width: '40px', render: (_, i) => <span className="text-text-secondary">{i + 1}</span> },
    { key: 'name', title: "O'quvchi", width: '1.6fr', render: (r) => <PersonCell name={r.full_name} sub={<PhoneLink phone={r.phone} />} /> },
    { key: 'group', title: 'Guruh', width: '1.3fr', render: (r) => (
      <div className="min-w-0">
        <div className="truncate font-medium">{r.group_name || 'Guruhsiz'}</div>
        <div className="truncate text-xs text-text-secondary">{[r.teacher_name, r.group_time].filter(Boolean).join(' · ') || '—'}</div>
      </div>
    ) },
    { key: 'parent', title: 'Ota-onasi', width: '1.2fr', render: (r) => <span className="truncate">{r.parent_name || '—'}</span> },
    { key: 'parent_phone', title: 'Ota-ona telefoni', width: '1.2fr', render: (r) => <PhoneLink phone={r.parent_phone} /> },
    { key: 'status', title: 'Holati', width: '110px', align: 'right', render: (r) => <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge> },
  ]

  const tabs = Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label, count: count(value), tone: s.tab }))

  return (
    <Modal open={open} onClose={onClose} title="Bugungi davomat" subtitle="Kim keldi, kim kelmadi — guruhi va ota-onasining telefoni" size="xl">
      {error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <div className="flex flex-col gap-3 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Tabs items={tabs} value={tab} onChange={setTab} className="border border-border" />
            <SearchInput placeholder="Ism, ota-ona yoki telefon..." value={search} onChange={setSearch} className="w-full sm:ml-auto sm:w-72" />
            <Select options={groupOptions} value={groupId} onChange={setGroupId} placeholder="Barcha guruhlar" clearable className="w-full sm:w-56" />
          </div>
          <VirtualTable
            columns={columns}
            rows={list}
            rowKey="student_id"
            loading={loading && !data}
            height={480}
            minWidth={900}
            onRowClick={(r) => navigate(`/students/${r.student_id}`)}
            empty={<EmptyState icon={tab === 'absent' ? 'check' : 'users'} title={tab === 'absent' ? "Kelmaganlar yo'q" : "Ro'yxat bo'sh"} />}
          />
        </div>
      )}
    </Modal>
  )
}

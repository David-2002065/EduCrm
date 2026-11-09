import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, qs } from '../api'
import PersonCell from '../components/common/PersonCell'
import PhoneLink from '../components/common/PhoneLink'
import RowActions from '../components/common/RowActions'
import Toolbar from '../components/common/Toolbar'
import StudentFormModal from '../components/forms/StudentFormModal'
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorBox, PageHeader, SearchInput, Select, StatusBadge, Tabs, VirtualTable, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useBranch } from '../context/BranchContext'
import { useDebounce } from '../hooks/useDebounce'
import { useDisclosure } from '../hooks/useDisclosure'
import { useQuery } from '../hooks/useQuery'
import { useGroups } from '../hooks/useGroups'
import { STUDENT_STATUS } from '../utils/constants'
import { money } from '../utils/format'

export default function Students() {
  const navigate = useNavigate()
  const toast = useToast()
  const { can } = useAuth()
  const { branchId } = useBranch()
  const { groupOptions } = useGroups(branchId)

  const [search, setSearch] = useState('')
  const [groupId, setGroupId] = useState('')
  useEffect(() => setGroupId(''), [branchId]) // filial o'zgarsa guruh filtri tozalanadi
  const [status, setStatus] = useState('active')
  const q = useDebounce(search)

  const { data, loading, error, reload } = useQuery(`/students${qs({ branch_id: branchId, group_id: groupId, search: q })}`)

  const form = useDisclosure()
  const remove = useDisclosure()

  // Holat bo'yicha filtr brauzerda — tab'lardagi sonlar to'g'ri chiqishi uchun
  const all = data || []
  const rows = useMemo(() => (status ? all.filter((s) => s.status === status) : all), [all, status])
  const tabs = [
    { value: 'active', label: 'Faol', count: all.filter((s) => s.status === 'active').length },
    { value: 'left', label: 'Ketganlar', count: all.filter((s) => s.status === 'left').length },
    { value: '', label: 'Hammasi', count: all.length },
  ]

  const columns = [
    { key: 'name', title: "O'quvchi", width: '2fr', render: (s) => <PersonCell name={s.full_name} sub={<PhoneLink phone={s.phone} />} /> },
    { key: 'parent', title: 'Ota-onasi', width: '1.6fr', render: (s) => (
      <div className="min-w-0">
        <div className="truncate">{s.parent_name || '—'}</div>
        <div className="truncate text-xs"><PhoneLink phone={s.parent_phone} /></div>
      </div>
    ) },
    { key: 'group', title: 'Guruh', width: '1.3fr', render: (s) => (
      <div className="min-w-0">
        <div className="truncate">{s.group_name || '—'}</div>
        <div className="truncate text-xs text-text-secondary">{s.branch_name}</div>
      </div>
    ) },
    { key: 'pay', title: 'Shu oy', width: '130px', render: (s) =>
      s.status !== 'active' ? <span className="text-text-secondary">—</span>
        : s.paid_this_month >= s.monthly_fee ? <Badge tone="success">To'lagan</Badge>
        : <Badge tone="danger">-{money(s.monthly_fee - s.paid_this_month)}</Badge>,
    },
    { key: 'status', title: 'Holati', width: '100px', render: (s) => <StatusBadge map={STUDENT_STATUS} value={s.status} /> },
    { key: 'actions', title: '', width: '84px', align: 'right', render: (s) => <RowActions onEdit={can('students.edit') ? () => form.open(s) : undefined} onDelete={can('students.delete') ? () => remove.open(s) : undefined} /> },
  ]

  const deleteStudent = async () => {
    await api.delete(`/students/${remove.item.id}`)
    toast.success("O'quvchi o'chirildi")
    reload()
  }

  return (
    <>
      <PageHeader
        title="O'quvchilar"
        subtitle="Barcha o'quvchilar, ota-onalari va to'lov holati"
        actions={can('students.edit') && <Button icon="plus" onClick={() => form.open()}>Yangi o'quvchi</Button>}
      />

      <Toolbar>
        <SearchInput placeholder="Ism yoki telefon..." value={search} onChange={setSearch} className="w-full sm:w-72" />
        <Select options={groupOptions} value={groupId} onChange={setGroupId} placeholder="Barcha guruhlar" clearable className="w-full sm:w-56" />
        <Tabs items={tabs} value={status} onChange={setStatus} className="sm:ml-auto" />
      </Toolbar>

      {error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <Card padding="p-3 sm:p-4">
          <VirtualTable
            columns={columns}
            rows={rows}
            loading={loading && !data}
            height={600}
            minWidth={900}
            onRowClick={(s) => navigate(`/students/${s.id}`)}
            empty={<EmptyState icon="users" title="O'quvchi topilmadi" text="Filtrni o'zgartiring yoki yangi o'quvchi qo'shing" />}
          />
        </Card>
      )}

      <StudentFormModal open={form.isOpen} onClose={form.close} student={form.item} onSaved={reload} />
      <ConfirmDialog
        open={remove.isOpen}
        onClose={remove.close}
        onConfirm={deleteStudent}
        title="O'quvchini o'chirish"
        text={`${remove.item?.full_name} va uning barcha to'lov hamda davomat ma'lumotlari o'chadi. Agar o'quvchi shunchaki ketgan bo'lsa, holatini "Ketgan" qilib qo'ying.`}
      />
    </>
  )
}

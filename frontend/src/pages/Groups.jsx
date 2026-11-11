import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import Toolbar from '../components/common/Toolbar'
import GroupFormModal from '../components/forms/GroupFormModal'
import GroupCard from '../components/groups/GroupCard'
import ScheduleBoard from '../components/groups/ScheduleBoard'
import { Button, ConfirmDialog, EmptyState, Loader, PageHeader, Select, Tabs, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useBranch } from '../context/BranchContext'
import { useDisclosure } from '../hooks/useDisclosure'
import { useGroups } from '../hooks/useGroups'
import { GROUP_DAYS } from '../utils/constants'
import { parseDays } from '../utils/schedule'

const VIEWS = [
  { value: 'cards', label: 'Kartochkalar' },
  { value: 'schedule', label: 'Dars jadvali' },
]

export default function Groups() {
  const navigate = useNavigate()
  const toast = useToast()
  const { can } = useAuth()
  const canManage = can('groups.manage')
  const canTests = can('tests.manage')
  // Guruh bosilsa — davomatga (ruxsat bo'lsa)
  const openAttendance = (g) => can('attendance.mark') && navigate(`/attendance?group=${g.id}`)
  const { branchId, reloadBranches } = useBranch()
  const { groups, loading, reload } = useGroups(branchId)
  const [view, setView] = useState('cards')
  const [course, setCourse] = useState('')
  const [days, setDays] = useState('')
  const form = useDisclosure()
  const remove = useDisclosure()

  const courseOptions = useMemo(
    () => [...new Set(groups.map((g) => g.course).filter(Boolean))].map((c) => ({ value: c, label: c })),
    [groups],
  )

  const filtered = groups.filter(
    (g) =>
      (!course || g.course === course) &&
      (!days || parseDays(g.days).some((d) => parseDays(days).includes(d))),
  )

  const onSaved = () => {
    reload()
    reloadBranches()
  }

  const deleteGroup = async () => {
    await api.delete(`/groups/${remove.item.id}`)
    toast.success("Guruh o'chirildi")
    onSaved()
  }

  return (
    <>
      <PageHeader
        title="Guruhlar"
        subtitle="Bir xil kurs va vaqtda turli ustozlar bilan bir nechta guruh bo'lishi mumkin"
        actions={canManage && <Button icon="plus" onClick={() => form.open()}>Yangi guruh</Button>}
      />

      <Toolbar>
        <Select options={courseOptions} value={course} onChange={setCourse} placeholder="Barcha kurslar" clearable className="w-full sm:w-52" />
        <Select options={GROUP_DAYS} value={days} onChange={setDays} placeholder="Barcha kunlar" clearable className="w-full sm:w-60" />
        <Tabs items={VIEWS} value={view} onChange={setView} className="sm:ml-auto" />
      </Toolbar>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <div className="rounded-card bg-card">
          <EmptyState icon="layers" title="Guruhlar yo'q" action={canManage && <Button icon="plus" onClick={() => form.open()}>Guruh qo'shish</Button>} />
        </div>
      ) : view === 'schedule' ? (
        <ScheduleBoard groups={filtered} onOpen={openAttendance} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              onOpen={() => openAttendance(g)}
              onTests={canTests ? () => navigate(`/groups/${g.id}/tests`) : undefined}
              onEdit={canManage ? () => form.open(g) : undefined}
              onDelete={canManage ? () => remove.open(g) : undefined}
            />
          ))}
        </div>
      )}

      <GroupFormModal open={form.isOpen} onClose={form.close} group={form.item} onSaved={onSaved} />
      <ConfirmDialog
        open={remove.isOpen}
        onClose={remove.close}
        onConfirm={deleteGroup}
        title="Guruhni o'chirish"
        text={`"${remove.item?.name}" o'chiriladi. O'quvchilar o'chmaydi, faqat guruhsiz qoladi.`}
      />
    </>
  )
}

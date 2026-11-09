import { useMemo, useState } from 'react'
import { api } from '../api'
import BranchFilter from '../components/common/BranchFilter'
import PersonCell from '../components/common/PersonCell'
import PhoneLink from '../components/common/PhoneLink'
import RowActions from '../components/common/RowActions'
import Toolbar from '../components/common/Toolbar'
import TeacherFormModal from '../components/forms/TeacherFormModal'
import GroupChips from '../components/teachers/GroupChips'
import { Button, Card, ConfirmDialog, EmptyState, ErrorBox, PageHeader, SearchInput, VirtualTable, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useBranchFilter } from '../hooks/useBranchFilter'
import { useDisclosure } from '../hooks/useDisclosure'
import { useTeachers } from '../hooks/useTeachers'

export default function Teachers() {
  const toast = useToast()
  const { can } = useAuth()
  const canManage = can('teachers.manage')
  const branch = useBranchFilter() // yuqorida filial tanlanmagan bo'lsa — sahifada filtr chiqadi
  const { branchId } = branch
  const { teachers, loading, error, reload } = useTeachers(branchId)
  const [search, setSearch] = useState('')
  const form = useDisclosure()
  const remove = useDisclosure()

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? teachers.filter((t) => `${t.full_name} ${t.subject} ${t.phone}`.toLowerCase().includes(q)) : teachers
  }, [teachers, search])

  const columns = [
    { key: 'name', title: 'Ustoz', width: '1.6fr', render: (t) => <PersonCell name={t.full_name} sub={<PhoneLink phone={t.phone} />} /> },
    { key: 'subject', title: 'Fani', width: '1fr', render: (t) => t.subject || '—' },
    { key: 'branch', title: 'Filial', width: '1fr', render: (t) => t.branch_name || <span className="text-text-secondary">Hamma filial</span> },
    { key: 'groups', title: 'Guruhlari', width: '2.4fr', render: (t) => <GroupChips groups={t.groups} /> },
    { key: 'students', title: "O'quvchi", width: '90px', render: (t) => <span className="tabular-nums">{t.student_count}</span> },
    { key: 'act', title: '', width: '84px', align: 'right', render: (t) => canManage && <RowActions onEdit={() => form.open(t)} onDelete={() => remove.open(t)} /> },
  ]

  const deleteTeacher = async () => {
    await api.delete(`/teachers/${remove.item.id}`)
    toast.success("Ustoz o'chirildi")
    reload()
  }

  return (
    <>
      <PageHeader
        title="Ustozlar"
        subtitle="Har bir ustoz qaysi fandan va qaysi guruhlarda dars berishi"
        actions={canManage && <Button icon="plus" onClick={() => form.open()}>Yangi ustoz</Button>}
      />
      <Toolbar>
        <SearchInput placeholder="Ism, fan yoki telefon..." value={search} onChange={setSearch} className="w-full sm:w-72" />
        <BranchFilter filter={branch} />
      </Toolbar>
      {error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <Card padding="p-3 sm:p-4">
          <VirtualTable
            columns={columns}
            rows={rows}
            loading={loading && !teachers.length}
            height={600}
            minWidth={960}
            onRowClick={canManage ? (t) => form.open(t) : undefined}
            empty={<EmptyState icon="teacher" title="Ustozlar yo'q" action={canManage && <Button icon="plus" onClick={() => form.open()}>Ustoz qo'shish</Button>} />}
          />
        </Card>
      )}
      <TeacherFormModal open={form.isOpen} onClose={form.close} teacher={form.item} onSaved={reload} />
      <ConfirmDialog
        open={remove.isOpen}
        onClose={remove.close}
        onConfirm={deleteTeacher}
        title="Ustozni o'chirish"
        text={`${remove.item?.full_name} o'chiriladi. Uning guruhlari o'chmaydi, faqat ustozsiz qoladi.`}
      />
    </>
  )
}

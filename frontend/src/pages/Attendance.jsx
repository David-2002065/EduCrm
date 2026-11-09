import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, qs } from '../api'
import AttendanceToggle from '../components/common/AttendanceToggle'
import PersonCell from '../components/common/PersonCell'
import PhoneLink from '../components/common/PhoneLink'
import Toolbar from '../components/common/Toolbar'
import GroupSummary from '../components/groups/GroupSummary'
import { Badge, Button, Card, DatePicker, EmptyState, PageHeader, Select, VirtualTable, useToast } from '../components/ui'
import { useBranch } from '../context/BranchContext'
import { groupToOption, useGroups } from '../hooks/useGroups'
import { today } from '../utils/format'

export default function Attendance() {
  const toast = useToast()
  const { branchId } = useBranch()
  const { groups: allGroups } = useGroups('') // ?group=3 boshqa filialniki bo'lsa ham topilsin
  const groups = branchId ? allGroups.filter((g) => String(g.branch_id) === branchId) : allGroups
  const [params, setParams] = useSearchParams()
  const groupId = params.get('group') || ''
  const [day, setDay] = useState(today())

  const [rows, setRows] = useState([])
  const [marks, setMarks] = useState({}) // { student_id: 'present' | 'late' | 'absent' }
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const group = allGroups.find((g) => String(g.id) === groupId)
  // Tanlangan guruh boshqa filialniki bo'lsa ham ro'yxatda turadi
  const groupOptions = (group && !groups.includes(group) ? [group, ...groups] : groups).map(groupToOption)

  // Guruh tanlanmagan bo'lsa (yoki boshqa filial guruhi bo'lsa) — birinchisini tanlaymiz.
  // /groups sahifasidan ?group=3 bilan kelinsa, aynan shu guruh ochiladi.
  useEffect(() => {
    if (groups.length && !group) {
      setParams({ group: String(groups[0].id) }, { replace: true })
    }
  }, [groups, group]) // eslint-disable-line react-hooks/exhaustive-deps

  // Yuqoridagi filial almashtirilsa — shu filialning guruhiga o'tamiz
  useEffect(() => {
    if (branchId && group && String(group.branch_id) !== branchId && groups.length) {
      setParams({ group: String(groups[0].id) }, { replace: true })
    }
  }, [branchId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!groupId || !day) return
    setLoading(true)
    api.get(`/attendance${qs({ group_id: groupId, day })}`)
      .then((list) => {
        setRows(list)
        setMarks(Object.fromEntries(list.filter((r) => r.status).map((r) => [r.student_id, r.status])))
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [groupId, day, toast])

  const setMark = (id, status) => setMarks((m) => ({ ...m, [id]: status }))
  const markAll = () => setMarks(Object.fromEntries(rows.map((r) => [r.student_id, 'present'])))

  const counts = Object.values(marks).reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {})
  const unmarked = rows.length - Object.keys(marks).length

  const save = async () => {
    setSaving(true)
    try {
      const items = Object.entries(marks).map(([student_id, status]) => ({ student_id: Number(student_id), status }))
      await api.post('/attendance', { group_id: Number(groupId), date: day, items })
      toast.success('Davomat saqlandi')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'n', title: '№', width: '40px', render: (_, i) => <span className="text-text-secondary">{i + 1}</span> },
    { key: 'name', title: "O'quvchi", width: '2fr', render: (r) => <PersonCell name={r.full_name} sub={<PhoneLink phone={r.phone} />} /> },
    { key: 'parent', title: 'Ota-ona telefoni', width: '1.2fr', render: (r) => <PhoneLink phone={r.parent_phone} /> },
    { key: 'mark', title: 'Holati', width: '250px', align: 'right', render: (r) => (
      <AttendanceToggle value={marks[r.student_id]} onChange={(s) => setMark(r.student_id, s)} />
    ) },
  ]

  return (
    <>
      <PageHeader title="Davomat" subtitle="Guruh va kunni tanlab, kim kelganini qo'lda belgilang" />

      <Toolbar>
        <Select
          label="Guruh"
          options={groupOptions}
          value={groupId}
          onChange={(v) => setParams({ group: v })}
          placeholder="Guruhni tanlang"
          className="w-full sm:w-64"
        />
        <DatePicker label="Sana" value={day} max={today()} onChange={(v) => v && setDay(v)} className="w-full sm:w-48" />
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Badge tone="success">Keldi: {counts.present || 0}</Badge>
          <Badge tone="warning">Kechikdi: {counts.late || 0}</Badge>
          <Badge tone="danger">Kelmadi: {counts.absent || 0}</Badge>
          {unmarked > 0 && <Badge>Belgilanmagan: {unmarked}</Badge>}
        </div>
      </Toolbar>

      <Card padding="p-3 sm:p-4">
        <GroupSummary group={group} className="mb-3" />
        <VirtualTable
          columns={columns}
          rows={rows}
          rowKey="student_id"
          loading={loading}
          height={560}
          minWidth={760}
          empty={<EmptyState icon="users" title={groupId ? "Guruhda o'quvchi yo'q" : 'Guruhni tanlang'} />}
        />
        {rows.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" icon="check" onClick={markAll}>Hammasi keldi</Button>
            <Button icon="attendance" loading={saving} onClick={save} disabled={!Object.keys(marks).length}>Saqlash</Button>
          </div>
        )}
      </Card>
    </>
  )
}

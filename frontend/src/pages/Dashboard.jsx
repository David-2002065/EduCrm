import { Link, useNavigate } from 'react-router-dom'
import { qs } from '../api'
import PersonCell from '../components/common/PersonCell'
import PhoneLink from '../components/common/PhoneLink'
import { Badge, BarChart, Card, EmptyState, ErrorBox, Loader, PageHeader, ProgressBar, StatCard, SummaryRow } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useBranch } from '../context/BranchContext'
import { useQuery } from '../hooks/useQuery'
import { formatDate, money, monthLabel, monthShort, shortMoney } from '../utils/format'

export default function Dashboard() {
  const { user } = useAuth()
  const { branchId } = useBranch()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useQuery(`/dashboard${qs({ branch_id: branchId })}`)

  if (loading && !data) return <Loader />
  if (error) return <ErrorBox message={error} onRetry={reload} />

  const { stats, income_chart, debtors, recent_payments } = data
  const marked = stats.present_today + stats.absent_today
  const percent = stats.expected_month ? Math.round((stats.income_month / stats.expected_month) * 100) : 0

  return (
    <>
      <PageHeader title={`Salom, ${user.full_name.split(' ')[0]}`} subtitle="Bugungi holat va shu oy ko'rsatkichlari" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark label="Shu oy tushum" value={shortMoney(stats.income_month)} icon="wallet" hint={`Rejadan ${percent}%`} />
        <StatCard label="Faol o'quvchilar" value={stats.students} icon="users" hint={`${stats.groups} ta guruh, ${stats.branches} ta filial`} />
        <StatCard
          label="Bugun keldi"
          value={marked ? `${stats.present_today}/${marked}` : '—'}
          icon="attendance"
          hint={marked ? `${stats.absent_today} kishi kelmadi` : 'Davomat hali olinmagan'}
          tone={stats.absent_today ? 'danger' : undefined}
        />
        <StatCard label="Qarzdorlar" value={stats.debtors} icon="alert" hint={money(stats.expected_month - stats.income_month)} tone="danger" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Card title="Oylik tushum" subtitle="Oxirgi 6 oy" className="xl:col-span-2">
          <BarChart data={income_chart.map((d) => ({ label: monthShort(d.month), value: d.amount }))} format={shortMoney} height={240} />
        </Card>

        <Card title="Shu oy rejasi" subtitle={monthLabel(income_chart.at(-1).month)}>
          <div className="font-display text-[32px] leading-9 font-medium tabular-nums">{percent}%</div>
          <ProgressBar value={stats.income_month} max={stats.expected_month} className="mt-4" />
          <div className="mt-6 flex flex-col gap-2">
            <SummaryRow label="Kutilgan" value={money(stats.expected_month)} />
            <SummaryRow label="Tushgan" value={money(stats.income_month)} tone="success" />
            <SummaryRow label="Qoldiq" value={money(stats.expected_month - stats.income_month)} tone="danger" />
          </div>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Card title="Qarzdorlar" subtitle="Shu oy to'lamaganlar" action={<Link to="/payments" className="text-sm font-medium text-text-primary">Hammasi →</Link>}>
          {debtors.length === 0 ? (
            <EmptyState icon="check" title="Qarzdor yo'q" />
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {debtors.map((d) => (
                <li key={d.student_id} onClick={() => navigate(`/students/${d.student_id}`)} className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl p-2 hover:bg-background">
                  <PersonCell name={d.full_name} sub={<PhoneLink phone={d.parent_phone} />} />
                  <Badge tone="danger">{money(d.debt)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Oxirgi to'lovlar" action={<Link to="/payments" className="text-sm font-medium text-text-primary">Hammasi →</Link>}>
          {recent_payments.length === 0 ? (
            <EmptyState title="To'lovlar yo'q" />
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {recent_payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-2xl p-2">
                  <PersonCell name={p.student_name} sub={`${monthLabel(p.month)} · ${formatDate(p.paid_at)}`} />
                  <span className="text-sm font-semibold whitespace-nowrap text-success tabular-nums">+{money(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}

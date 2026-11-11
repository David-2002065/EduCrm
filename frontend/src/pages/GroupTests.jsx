import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import RowActions from '../components/common/RowActions'
import GroupSummary from '../components/groups/GroupSummary'
import TestFormModal from '../components/tests/TestFormModal'
import TestResultsModal from '../components/tests/TestResultsModal'
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorBox, Icon, Loader, PageHeader, useToast } from '../components/ui'
import { useDisclosure } from '../hooks/useDisclosure'
import { useGroups } from '../hooks/useGroups'
import { useQuery } from '../hooks/useQuery'
import { formatDate } from '../utils/format'

// Guruhning test vazifalari: ustoz qo'shadi, o'quvchilar Telegram botda bajaradi, natijalar shu yerda
export default function GroupTests() {
  const { id } = useParams()
  const toast = useToast()
  const { groups } = useGroups('')
  const group = groups.find((g) => String(g.id) === id)
  const { data, loading, error, reload } = useQuery(`/tests?group_id=${id}`)
  const form = useDisclosure()
  const results = useDisclosure()
  const remove = useDisclosure()

  const deleteTest = async () => {
    await api.delete(`/tests/${remove.item.id}`)
    toast.success("Test o'chirildi")
  }

  if (error) return <ErrorBox message={error} onRetry={reload} />
  if (loading && !data) return <Loader />

  const { tests, student_count, telegram_count, bot_enabled } = data

  return (
    <>
      <Link to="/groups" className="mb-3 inline-flex items-center gap-1 text-sm text-text-secondary no-underline hover:text-text-primary">
        <Icon name="chevronLeft" size={16} /> Guruhlar
      </Link>
      <PageHeader
        title={group ? `${group.name} — testlar` : 'Test vazifalar'}
        subtitle="Test qo'shilgach, Telegram botda ro'yxatdan o'tgan o'quvchilarga avtomatik yuboriladi"
        actions={<Button icon="plus" onClick={() => form.open()}>Test vazifa qo'shish</Button>}
      />

      <Card padding="p-4" className="mb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <GroupSummary group={group} className="min-w-0 flex-1" />
          <div className="flex flex-wrap gap-2">
            <Badge tone={telegram_count === student_count && student_count ? 'success' : 'warning'}>
              Telegramda: {telegram_count}/{student_count} o'quvchi
            </Badge>
            {!bot_enabled && <Badge tone="danger">Bot sozlanmagan (TELEGRAM_BOT_TOKEN)</Badge>}
          </div>
        </div>
      </Card>

      {tests.length === 0 ? (
        <div className="rounded-card bg-card">
          <EmptyState icon="clipboard" title="Hali test yo'q" text="Birinchi test vazifani qo'shing" action={<Button icon="plus" onClick={() => form.open()}>Test vazifa qo'shish</Button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((t) => (
            <article key={t.id} onClick={() => results.open(t)} className="flex cursor-pointer flex-col gap-4 rounded-card bg-card p-5 transition-shadow hover:shadow-float">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge tone="neutral" dot={false}>{t.question_count} ta savol</Badge>
                  <h3 className="m-0 mt-3 truncate font-display text-xl font-medium">{t.title}</h3>
                  <p className="m-0 mt-1 truncate text-sm text-text-secondary">{formatDate(t.created_at)} · {t.author_name || '—'}</p>
                </div>
                <RowActions
                  onEdit={t.finished_count ? undefined : () => form.open(t)}
                  onDelete={() => remove.open(t)}
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                <span className="text-sm text-text-secondary">Bajardi</span>
                <span className="font-semibold tabular-nums">{t.finished_count}/{student_count}</span>
              </div>
              <span className="text-sm font-medium">Natijalarni ko'rish →</span>
            </article>
          ))}
        </div>
      )}

      <TestFormModal open={form.isOpen} onClose={form.close} groupId={id} testId={form.item?.id} />
      <TestResultsModal open={results.isOpen} onClose={results.close} testId={results.item?.id} />
      <ConfirmDialog
        open={remove.isOpen}
        onClose={remove.close}
        onConfirm={deleteTest}
        title="Testni o'chirish"
        text={`"${remove.item?.title}" va uning barcha natijalari o'chiriladi.`}
      />
    </>
  )
}

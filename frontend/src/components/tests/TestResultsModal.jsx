import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '../../hooks/useQuery'
import { formatDate, formatTime } from '../../utils/format'
import PersonCell from '../common/PersonCell'
import PhoneLink from '../common/PhoneLink'
import { Badge, EmptyState, ErrorBox, Icon, Loader, Modal, Tabs } from '../ui'
import { LETTERS } from './TestFormModal'

const STATUS = {
  done: { label: 'Bajardi', tone: 'success' },
  started: { label: 'Bajaryapti', tone: 'warning' },
  pending: { label: 'Bajarmagan', tone: 'neutral' },
}

// Test natijalari: har bir o'quvchi nechta to'g'ri / xato va qaysi savolga qanday javob bergani
export default function TestResultsModal({ open, onClose, testId }) {
  const { data, loading, error, reload } = useQuery(open && testId ? `/tests/${testId}/results` : null)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(() => new Set()) // tafsiloti ochilgan o'quvchilar
  useEffect(() => {
    if (open) setExpanded(new Set())
  }, [open, testId])
  const toggle = (id) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const rows = useMemo(() => data?.results || [], [data])
  const questions = data?.test.questions || []

  const done = rows.filter((r) => r.status === 'done')
  const average = done.length ? Math.round((done.reduce((s, r) => s + r.correct / r.total, 0) / done.length) * 100) : 0
  const list = filter === 'all' ? rows : rows.filter((r) => r.status === filter)
  const tabs = [
    { value: 'all', label: 'Hammasi', count: rows.length },
    ...Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label, count: rows.filter((r) => r.status === value).length })),
  ]

  return (
    <Modal open={open} onClose={onClose} title={data?.test.title || 'Natijalar'} subtitle={data && `${data.test.group_name} · ${questions.length} ta savol`} size="lg">
      {error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : loading && !data ? (
        <Loader />
      ) : (
        <div className="flex flex-col gap-3 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Summary label="Bajardi" value={`${done.length}/${rows.length}`} />
            <Summary label="O'rtacha natija" value={`${average}%`} />
            <Summary label="To'g'ri javoblar" value={questions.map((q, i) => `${i + 1}-${LETTERS[q.correct_index]}`).join(', ')} small />
          </div>
          <Tabs items={tabs} value={filter} onChange={setFilter} className="border border-border" />

          {list.length === 0 ? (
            <EmptyState icon="users" title="Ro'yxat bo'sh" />
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {list.map((r) => {
                const open = expanded.has(r.student_id) || list.length === 1
                const canOpen = r.status !== 'pending'
                return (
                  <li key={r.student_id} className="flex flex-col rounded-2xl border border-border">
                    <div
                      onClick={canOpen ? () => toggle(r.student_id) : undefined}
                      className={`flex flex-wrap items-center justify-between gap-2 p-3 ${canOpen ? 'cursor-pointer rounded-2xl hover:bg-background' : ''}`}
                    >
                      <PersonCell name={r.full_name} sub={<>Ota-ona: <PhoneLink phone={r.parent_phone} /></>} />
                      <div className="flex flex-wrap items-center gap-1.5">
                        {!r.telegram && r.status === 'pending' && <Badge tone="warning" dot={false}>Telegram ulanmagan</Badge>}
                        <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                        {canOpen && (
                          <>
                            <Badge tone="success" dot={false}>To'g'ri: {r.correct}</Badge>
                            <Badge tone="danger" dot={false}>Xato: {r.answered - r.correct}</Badge>
                            {r.answered < r.total && <Badge dot={false}>Javobsiz: {r.total - r.answered}</Badge>}
                            <span className="ml-1 text-sm font-semibold tabular-nums">{Math.round((r.correct / r.total) * 100)}%</span>
                            <Icon name="chevronDown" size={18} className={`text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
                          </>
                        )}
                      </div>
                    </div>
                    {canOpen && open && (
                      <div className="flex flex-col gap-2 border-t border-border p-3">
                        {r.finished_at && (
                          <span className="text-xs text-text-secondary">Tugatgan vaqti: {formatDate(r.finished_at)}, {formatTime(r.finished_at)}</span>
                        )}
                        {questions.map((q, i) => (
                          <AnswerDetail key={q.id} n={i + 1} question={q} answer={r.answers[i]} />
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </Modal>
  )
}

function Summary({ label, value, small }) {
  return (
    <div className="min-w-0 flex-1 rounded-2xl bg-background px-3 py-2.5">
      <div className="truncate text-xs text-text-secondary">{label}</div>
      <div className={`truncate font-semibold tabular-nums ${small ? 'text-[13px]' : 'text-lg'}`} title={value}>{value}</div>
    </div>
  )
}

// Bitta savol: savol matni, o'quvchi tanlagan javob va to'g'ri javob.
// Yashil — to'g'ri, qizil — xato, kulrang — javob bermagan
function AnswerDetail({ n, question, answer }) {
  const state = answer?.choice == null ? 'none' : answer.correct ? 'ok' : 'wrong'
  const look = {
    ok: { box: 'border-success/30 bg-mint-soft', icon: 'check', color: 'text-success', label: "To'g'ri" },
    wrong: { box: 'border-danger/30 bg-danger-soft', icon: 'x', color: 'text-danger', label: 'Xato' },
    none: { box: 'border-border bg-background', icon: 'clock', color: 'text-text-secondary', label: 'Javob bermagan' },
  }[state]

  return (
    <div className={`rounded-2xl border p-3 ${look.box}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-sm font-medium">
          <span className="text-text-secondary">{n}. </span>{question.text}
        </div>
        <span className={`flex shrink-0 items-center gap-1 text-xs font-semibold ${look.color}`}>
          <Icon name={look.icon} size={14} strokeWidth={2.4} /> {look.label}
        </span>
      </div>
      <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
        {question.options.map((option, i) => {
          const chosen = answer?.choice === i
          const correct = question.correct_index === i
          return (
            <li
              key={i}
              className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm ${
                correct ? 'bg-card font-medium text-success' : chosen ? 'bg-card font-medium text-danger' : 'text-text-secondary'
              }`}
            >
              <span className="w-5 shrink-0 font-semibold">{LETTERS[i]})</span>
              <span className="min-w-0 flex-1">{option}</span>
              {chosen && <span className="shrink-0 text-xs">o'quvchi javobi</span>}
              {correct && !chosen && <span className="shrink-0 text-xs">to'g'ri javob</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

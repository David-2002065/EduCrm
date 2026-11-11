import { useContext, useEffect, useState } from 'react'
import { api } from '../../api'
import FormModal from '../forms/FormModal'
import { Button, IconButton, Icon, Input, Loader, Textarea, useToast } from '../ui'
import { SubmittedContext } from '../ui/Field'

export const LETTERS = 'ABCDEFGH'
const MAX_OPTIONS = 6
const newQuestion = () => ({ key: Math.random(), text: '', options: ['', '', ''], correct_index: null })

/**
 * Test vazifa qo'shish / tahrirlash. Har bir savol: matn + A, B, C ... javoblar.
 * To'g'ri javobni ustoz chapdagi doirachani bosib belgilaydi.
 */
export default function TestFormModal({ open, onClose, groupId, testId, onSaved }) {
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState([newQuestion()])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!testId) {
      setTitle('')
      setQuestions([newQuestion()])
      return
    }
    setLoading(true)
    api.get(`/tests/${testId}`, { force: true })
      .then((t) => {
        setTitle(t.title)
        setQuestions(t.questions.map((q) => ({ ...q, key: q.id })))
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [open, testId, toast])

  const update = (i, patch) => setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)))
  const remove = (i) => setQuestions((qs) => qs.filter((_, j) => j !== i))

  const submit = async () => {
    const body = {
      group_id: Number(groupId),
      title,
      questions: questions.map(({ text, options, correct_index }) => ({ text, options, correct_index })),
    }
    const saved = testId ? await api.put(`/tests/${testId}`, body) : await api.post('/tests', body)
    onSaved?.(saved)
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={testId ? 'Testni tahrirlash' : 'Yangi test vazifa'}
      subtitle="To'g'ri javobni chapdagi doirachani bosib belgilang"
      onSubmit={submit}
      successText={testId ? 'Test saqlandi' : "Test qo'shildi va o'quvchilarga yuborildi"}
      size="lg"
    >
      {loading ? (
        <Loader className="sm:col-span-2" />
      ) : (
        <>
          <Input label="Test nomi" required placeholder="Masalan: 3-dars bo'yicha test" className="sm:col-span-2" value={title} onChange={setTitle} />
          {questions.map((q, i) => (
            <QuestionEditor
              key={q.key}
              index={i}
              question={q}
              onChange={(patch) => update(i, patch)}
              onRemove={questions.length > 1 ? () => remove(i) : undefined}
            />
          ))}
          <Button variant="soft" icon="plus" className="sm:col-span-2" onClick={() => setQuestions((qs) => [...qs, newQuestion()])}>
            Savol qo'shish
          </Button>
        </>
      )}
    </FormModal>
  )
}

function QuestionEditor({ index, question, onChange, onRemove }) {
  const submitted = useContext(SubmittedContext)
  const noCorrect = question.correct_index === null || question.correct_index >= question.options.length

  const setOption = (i, value) => onChange({ options: question.options.map((o, j) => (j === i ? value : o)) })
  const removeOption = (i) =>
    onChange({
      options: question.options.filter((_, j) => j !== i),
      correct_index: question.correct_index === i ? null : question.correct_index > i ? question.correct_index - 1 : question.correct_index,
    })

  return (
    <section className={`flex flex-col gap-3 rounded-2xl border p-4 sm:col-span-2 ${submitted && noCorrect ? 'border-danger' : 'border-border'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{index + 1}-savol</span>
        {onRemove && <IconButton icon="trash" label="Savolni o'chirish" variant="danger" onClick={onRemove} />}
      </div>
      <Textarea label="Savol" required rows={2} placeholder="Savol matnini yozing" value={question.text} onChange={(text) => onChange({ text })} />

      <div className="flex flex-col gap-2">
        {question.options.map((option, i) => {
          const correct = question.correct_index === i
          return (
            <div key={i} className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => onChange({ correct_index: i })}
                aria-label={`${LETTERS[i]} — to'g'ri javob`}
                title="To'g'ri javob deb belgilash"
                className={`mt-1.5 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                  correct ? 'border-success bg-success text-white' : 'border-border bg-card text-text-secondary hover:border-success hover:text-success'
                }`}
              >
                {correct ? <Icon name="check" size={15} strokeWidth={2.6} /> : LETTERS[i]}
              </button>
              <Input
                required
                placeholder={`${LETTERS[i]} javob`}
                value={option}
                onChange={(v) => setOption(i, v)}
                className="flex-1"
              />
              {question.options.length > 2 && (
                <IconButton icon="x" label="Javobni o'chirish" className="mt-1" onClick={() => removeOption(i)} />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {question.options.length < MAX_OPTIONS ? (
          <Button variant="ghost" size="sm" icon="plus" onClick={() => onChange({ options: [...question.options, ''] })}>
            Javob qo'shish
          </Button>
        ) : <span />}
        {noCorrect ? (
          <span data-missing="" className={`text-xs ${submitted ? 'text-danger' : 'text-text-secondary'}`}>To'g'ri javobni belgilang</span>
        ) : (
          <span className="text-xs text-success">To'g'ri javob: {LETTERS[question.correct_index]}</span>
        )}
      </div>
    </section>
  )
}

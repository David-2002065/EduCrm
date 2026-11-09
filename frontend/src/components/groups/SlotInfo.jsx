import { sameSlot } from '../../utils/schedule'
import { Icon } from '../ui'

/**
 * Guruh formasida: tanlangan kun/vaqtda yana qaysi guruhlar borligini ko'rsatadi.
 * - Boshqa ustozlar bilan parallel guruhlar — mumkin (yashil xabar)
 * - Shu ustozning o'zi shu vaqtda band — mumkin emas (qizil xabar)
 */
export default function SlotInfo({ values, groups, editingId }) {
  if (!values.time || !values.days) return null
  const parallel = groups.filter((g) => g.id !== editingId && sameSlot(values, g))
  if (!parallel.length) return null

  const busy = values.teacher_id && parallel.find((g) => String(g.teacher_id) === String(values.teacher_id))

  if (busy) {
    return (
      <Box tone="danger" icon="alert">
        <b>{busy.teacher_name}</b> shu vaqtda «{busy.name}» guruhida dars beradi. Boshqa ustozni yoki boshqa vaqtni tanlang.
      </Box>
    )
  }

  return (
    <Box tone="mint" icon="layers">
      Shu vaqtda yana {parallel.length} ta guruh bor:{' '}
      {parallel.map((g, i) => (
        <span key={g.id}>
          {i > 0 && ', '}
          <b>{g.name}</b> ({g.teacher_name || 'ustozsiz'})
        </span>
      ))}
      . Ustozlar har xil bo'lsa — parallel guruh ochish mumkin.
    </Box>
  )
}

function Box({ tone, icon, children }) {
  const cls = tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-mint-soft text-success'
  return (
    <div className={`flex gap-3 rounded-2xl p-3 text-sm sm:col-span-2 ${cls}`}>
      <Icon name={icon} size={18} className="mt-0.5" />
      <p className="m-0 leading-5">{children}</p>
    </div>
  )
}

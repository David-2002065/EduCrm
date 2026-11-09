import { groupByTime } from '../../utils/schedule'
import ScheduleRow from './ScheduleRow'

// Dars jadvali: guruhlar vaqt bo'yicha qatorlarga ajratiladi
export default function ScheduleBoard({ groups, onOpen }) {
  return (
    <div className="flex flex-col gap-3">
      {groupByTime(groups).map((slot) => (
        <ScheduleRow key={slot.time} time={slot.time} groups={slot.groups} onOpen={onOpen} />
      ))}
    </div>
  )
}

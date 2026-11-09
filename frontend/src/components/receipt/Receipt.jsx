import { PAYMENT_METHODS } from '../../utils/constants'
import { formatDate, formatPhone, formatTime, money, monthLabel } from '../../utils/format'

/**
 * Chek ko'rinishi (kassa cheki uslubida, 80 mm).
 * Ekranda ham, chop etishda ham aynan shu komponent ishlatiladi.
 */
export default function Receipt({ data }) {
  const method = PAYMENT_METHODS.find((m) => m.value === data.method)?.label || data.method
  return (
    <div className="receipt mx-auto w-full max-w-[320px] bg-white px-5 py-6 font-mono text-[12px] leading-[1.5] text-black">
      <div className="text-center">
        <div className="font-sans text-[16px] font-bold">{data.center_name}</div>
        {data.branch_name && <div>{data.branch_name}</div>}
        {data.branch_address && <div>{data.branch_address}</div>}
        {data.branch_phone && <div>Tel: {formatPhone(data.branch_phone)}</div>}
      </div>

      <Divider />
      <div className="text-center font-sans text-[14px] font-bold tracking-wider">TO'LOV CHEKI</div>
      <div className="text-center">№ {data.number}</div>
      <Divider />

      <Row label="Sana" value={formatDate(data.paid_at)} />
      <Row label="Vaqt" value={formatTime(data.paid_at)} />
      <Divider />
      <Row label="O'quvchi" value={data.student_name} />
      {data.group_name && <Row label="Guruh" value={data.group_name} />}
      {data.teacher_name && <Row label="Ustoz" value={data.teacher_name} />}
      <Row label="To'lov oyi" value={monthLabel(data.month)} />
      <Row label="To'lov turi" value={method} />
      {data.note && <Row label="Izoh" value={data.note} />}

      <Divider />
      <div className="flex items-baseline justify-between gap-2 font-sans">
        <span className="text-[13px] font-semibold">TO'LANDI</span>
        <span className="text-[18px] font-bold">{money(data.amount)}</span>
      </div>
      <Divider />

      <Row label="Oylik to'lov" value={money(data.monthly_fee)} />
      <Row label="Shu oy jami" value={money(data.paid_total)} />
      <Row label="Qoldiq qarz" value={data.debt ? money(data.debt) : "Yo'q"} bold />

      <Divider />
      <Row label="Kassir" value={data.cashier_name} />
      <div className="mt-6 flex items-end justify-between gap-4">
        <span>Imzo:</span>
        <span className="mb-1 flex-1 border-b border-black" />
      </div>
      <Divider />
      <div className="text-center">To'lovingiz uchun rahmat!</div>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0">{label}:</span>
      <span className={`text-right ${bold ? 'font-bold' : ''}`}>{value}</span>
    </div>
  )
}

const Divider = () => <div className="my-2 border-t border-dashed border-black" />

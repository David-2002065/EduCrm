import { useState } from 'react'
import MonthlyStatus from '../components/payments/MonthlyStatus'
import PaymentHistory from '../components/payments/PaymentHistory'
import { PageHeader, Tabs } from '../components/ui'
import { currentMonth } from '../utils/format'

const VIEWS = [
  { value: 'status', label: 'Oylik holat' },
  { value: 'history', label: "To'lovlar tarixi" },
]

export default function Payments() {
  const [view, setView] = useState('status')
  const [month, setMonth] = useState(currentMonth())
  const View = view === 'status' ? MonthlyStatus : PaymentHistory

  return (
    <>
      <PageHeader
        title="To'lovlar"
        subtitle="Kim to'ladi, kim to'lamadi — oy bo'yicha"
        actions={<Tabs items={VIEWS} value={view} onChange={setView} />}
      />
      <View month={month} setMonth={setMonth} />
    </>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import AgentInstallSteps from '../components/printer/AgentInstallSteps'
import AgentStatus from '../components/printer/AgentStatus'
import Receipt from '../components/receipt/Receipt'
import { Button, Card, Input, PageHeader, Select, Switch, Tabs, useToast } from '../components/ui'
import { currentMonth, today } from '../utils/format'
import { agentHealth, loadPrinterSettings, printReceipt, savePrinterSettings } from '../utils/printer'

const MODES = [
  { value: 'agent', label: 'Avtomatik (agent)' },
  { value: 'browser', label: 'Brauzer orqali' },
]
const WIDTHS = [
  { value: 80, label: '80 mm' },
  { value: 58, label: '58 mm' },
]

// Sinov cheki uchun namunaviy ma'lumot
const SAMPLE = {
  number: '000000', center_name: "EduCRM o'quv markazi", branch_name: 'Sinov filiali', branch_address: 'Toshkent',
  branch_phone: '+998712001010', student_name: 'Sinov O\'quvchi', group_name: 'English Beginner A', teacher_name: 'Malika Saidova',
  month: currentMonth(), amount: 450000, method: 'naqd', note: '', paid_at: `${today()}T12:00:00`,
  monthly_fee: 450000, paid_total: 450000, debt: 0, cashier_name: 'Kassir',
}

/**
 * Chek printeri sozlamalari — shu KOMPYUTER uchun saqlanadi.
 * Kassada: agent + printer + "avtomatik chop etish" yoqiladi — to'lovdan keyin chek o'zi chiqadi.
 */
export default function Printer() {
  const toast = useToast()
  const [settings, setSettings] = useState(loadPrinterSettings)
  const [health, setHealth] = useState(null)
  const [checking, setChecking] = useState(false)
  const [testing, setTesting] = useState(false)

  const update = (patch) =>
    setSettings((s) => {
      const next = { ...s, ...patch }
      savePrinterSettings(next)
      return next
    })

  const check = useCallback(async () => {
    setChecking(true)
    try {
      setHealth(await agentHealth(settings.agentUrl))
    } catch {
      setHealth(null)
    } finally {
      setChecking(false)
    }
  }, [settings.agentUrl])

  useEffect(() => {
    if (settings.mode === 'agent') check()
  }, [settings.mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Printer tanlanmagan bo'lsa — kompyuterning asosiy printerini taklif qilamiz
  useEffect(() => {
    if (health && !settings.printer && health.default) update({ printer: health.default })
  }, [health]) // eslint-disable-line react-hooks/exhaustive-deps

  const printerOptions = [
    ...(health?.printers || []).map((p) => ({ value: p, label: p, hint: p === health.default ? 'asosiy printer' : undefined })),
    ...(settings.printer && !health?.printers?.includes(settings.printer) ? [{ value: settings.printer, label: settings.printer }] : []),
  ]

  const test = async () => {
    setTesting(true)
    try {
      await printReceipt(SAMPLE, settings)
      if (settings.mode === 'agent') toast.success('Sinov cheki printerga yuborildi')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Chek printeri"
        subtitle="Bu sozlamalar faqat shu kompyuter uchun saqlanadi"
        actions={<Button icon="printer" loading={testing} onClick={test}>Sinov cheki</Button>}
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="flex flex-col gap-3 xl:col-span-2">
          <Card title="Qanday chop etilsin">
            <Tabs items={MODES} value={settings.mode} onChange={(mode) => update({ mode })} className="mb-4" />
            {settings.mode === 'agent' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <AgentStatus health={health} checking={checking} onCheck={check} />
                </div>
                <Select
                  label="Printer"
                  options={printerOptions}
                  value={settings.printer}
                  onChange={(printer) => update({ printer })}
                  placeholder={health ? 'Printerni tanlang' : 'Avval agentni ishga tushiring'}
                />
                <Input
                  label="yoki tarmoq printeri"
                  placeholder="tcp://192.168.1.50:9100"
                  // ro'yxatdagi printer tanlangan bo'lsa — bo'sh; aks holda yozilgan manzil
                  value={health?.printers?.includes(settings.printer) ? '' : settings.printer}
                  onChange={(printer) => update({ printer })}
                  clearable
                />
              </div>
            ) : (
              <p className="m-0 rounded-2xl bg-warning-soft p-3 text-sm text-warning">
                Har safar brauzerning print oynasi chiqadi va printerni qo'lda tanlash kerak bo'ladi. Kassa uchun "Avtomatik (agent)" tavsiya
                qilinadi.
              </p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 text-[13px] font-medium text-text-secondary">Qog'oz eni</div>
                <Tabs items={WIDTHS} value={settings.width} onChange={(width) => update({ width })} />
              </div>
              <Switch
                label="To'lovdan keyin avtomatik chop etish"
                hint="To'lov saqlanishi bilan chek o'zi chiqadi"
                checked={settings.autoPrint}
                onChange={(autoPrint) => update({ autoPrint })}
              />
            </div>
          </Card>

          {settings.mode === 'agent' && !health && !checking && <AgentInstallSteps />}
        </div>

        <Card title="Chek ko'rinishi" subtitle={`${settings.width} mm`}>
          <div className="rounded-2xl bg-background p-3">
            <div className={`mx-auto shadow-float ${settings.width === 58 ? 'max-w-[230px] text-[10px]' : ''}`}>
              <Receipt data={SAMPLE} />
            </div>
          </div>
        </Card>
      </div>

      {/* "Brauzer orqali" rejimida sinov cheki chop etilishi uchun */}
      {createPortal(
        <div id="print-area" data-width={settings.width}>
          <Receipt data={SAMPLE} />
        </div>,
        document.body,
      )}
    </>
  )
}

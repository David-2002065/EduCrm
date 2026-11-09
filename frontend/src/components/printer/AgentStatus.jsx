import { Badge, Button } from '../ui'

// Agent holati: ulangan / topilmadi / tekshirilmoqda
export default function AgentStatus({ health, checking, onCheck }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">Printer agenti</div>
        <div className="text-xs text-text-secondary">
          {checking ? 'Tekshirilmoqda...' : health ? `Versiya ${health.version} · ${health.printers.length} ta printer topildi` : "Bu kompyuterda agent ishlamayapti"}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!checking && <Badge tone={health ? 'success' : 'danger'}>{health ? 'Ulangan' : 'Topilmadi'}</Badge>}
        <Button size="sm" variant="secondary" loading={checking} onClick={onCheck}>Tekshirish</Button>
      </div>
    </div>
  )
}

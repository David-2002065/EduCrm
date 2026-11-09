import { Button, Card } from '../ui'

const STEPS = [
  ['Python o\'rnating', 'python.org/downloads saytidan. O\'rnatishda "Add Python to PATH" belgisini qo\'ying.'],
  ['pywin32 o\'rnating', 'Buyruqlar oynasida (cmd): pip install pywin32'],
  ['Agentni yuklab oling', 'Pastdagi tugma orqali. Arxivni ochib, masalan C:\\EduCRM ga ko\'chiring.'],
  ['Ishga tushiring', 'start_agent_windows.bat ni ikki marta bosing. Holat "Ulangan" bo\'ladi.'],
  ['Avtomatik yoqilsin', 'Win+R → shell:startup → start_agent_windows.bat yorlig\'ini shu papkaga tashlang.'],
]

// Kassa kompyuteriga agentni o'rnatish yo'riqnomasi (bir marta qilinadi)
export default function AgentInstallSteps() {
  return (
    <Card title="Agentni o'rnatish (bir marta)" subtitle="Faqat chek chiqaradigan kassa kompyuterida">
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {STEPS.map(([title, text], i) => (
          <li key={title} className="flex gap-3 rounded-2xl bg-background p-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mint text-xs font-semibold text-on-mint">{i + 1}</span>
            <span className="min-w-0 text-sm">
              <b className="font-medium">{title}</b>
              <span className="block text-text-secondary">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      <a href="/api/print-agent.zip" download className="mt-4 inline-block no-underline">
        <Button icon="arrowUpRight">Agentni yuklab olish</Button>
      </a>
    </Card>
  )
}

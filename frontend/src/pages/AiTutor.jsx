import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import TutorFace from '../components/ai-tutor/TutorFace'
import { Button, Card, Icon, PageHeader, Select, useToast } from '../components/ui'
import useSpeech from '../hooks/useSpeech'

// [kalit, nomi, ovoz kodi]
const LANGUAGES = [
  { value: 'en', label: 'Ingliz tili', voice: 'en-US' },
  { value: 'ru', label: 'Rus tili', voice: 'ru-RU' },
]
const VOICES = [
  { value: 'female', label: 'Ayol (Madina)' },
  { value: 'male', label: 'Erkak (Sardor)' },
]
const HISTORY_LIMIT = 20 // AI'ga oxirgi nechta xabar yuboriladi

const GREETING = {
  en: [
    { lang: 'uz', text: "Salom! Men Zukko, ingliz tili bo'yicha yordamchingman. O'zbekcha ham, inglizcha ham gapiraver. Qani, inglizcha salomlashib ko'ramiz:" },
    { lang: 'target', text: 'Hi! How are you today?' },
  ],
  ru: [
    { lang: 'uz', text: "Salom! Men Zukko, rus tili bo'yicha yordamchingman. O'zbekcha ham, ruscha ham gapiraver. Qani, ruscha salomlashib ko'ramiz:" },
    { lang: 'target', text: 'Привет! Как у тебя дела?' },
  ],
}

// O'zbekcha gap ichidagi [[word]] — o'rganilayotgan til ovozida aytiladi
function splitInline(speech) {
  return speech.flatMap((seg) =>
    seg.lang !== 'uz'
      ? [seg]
      : seg.text
          .split(/\[\[(.+?)\]\]/)
          .map((text, i) => ({ lang: i % 2 ? 'target' : 'uz', text: text.trim(), inline: true }))
          .filter((p) => p.text),
  )
}

// AI javobi -> chat xabari. content — AI'ga tarix sifatida qaytariladigan matn
const toMessage = (res) => ({
  role: 'assistant',
  content: res.speech.map((p) => p.text).join(' '),
  speech: splitInline(res.speech),
  emotion: res.emotion,
  correction: res.correction,
  pronunciation: res.pronunciation,
})
const greeting = (lang) => toMessage({ speech: GREETING[lang], emotion: 'happy', correction: '', pronunciation: [] })

const STATUS = {
  idle: 'Space tugmasini bosib turing yoki mikrofonni bosing',
  listening: 'Tinglayapman...',
  thinking: "O'ylayapman...",
  speaking: 'Zukko gapiryapti...',
}

/** AI ustoz: o'quvchi gapiradi, Zukko javob beradi, xatoni tuzatadi va o'zbekcha tushuntiradi. */
export default function AiTutor() {
  const toast = useToast()
  const speech = useSpeech()
  const [language, setLanguage] = useState('en')
  // Mikrofon qaysi tilni tinglaydi: o'zbekcha yoki o'qitilayotgan til
  const [micLang, setMicLang] = useState('uz')
  const [gender, setGender] = useState('female')
  const [messages, setMessages] = useState(() => [greeting('en')])
  const [emotion, setEmotion] = useState('happy')
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)

  const voice = LANGUAGES.find((l) => l.value === language).voice
  // Javob bo'laklari: o'zbekchasi o'zbekcha ovozda, o'rganilayotgan til o'z ovozida
  const say = (parts) => speech.speak(parts.map((p) => ({ text: p.text, lang: p.lang === 'uz' ? 'uz' : language })), gender)

  const state = speech.listening ? 'listening' : loading ? 'thinking' : speech.speaking ? 'speaking' : 'idle'

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, speech.interim])

  const restart = (lang = language) => {
    speech.silence()
    setMessages([greeting(lang)])
    setEmotion('happy')
  }

  const send = async (text) => {
    text = text.trim()
    if (!text || loading) return
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setLoading(true)
    try {
      const history = next.slice(-HISTORY_LIMIT).map(({ role, content }) => ({ role, content }))
      // Anthropic API birinchi xabar o'quvchidan bo'lishini talab qiladi
      while (history[0]?.role !== 'user') history.shift()
      const res = await api.post('/ai-tutor/chat', { language, messages: history })
      setMessages((m) => [...m, toMessage(res)])
      setEmotion(res.emotion)
      say(splitInline(res.speech))
    } catch (e) {
      toast.error(e.message)
      setMessages((m) => m.slice(0, -1))
      setEmotion('sad')
    } finally {
      setLoading(false)
    }
  }

  const startTalking = () => {
    if (loading) return
    speech.listen(micLang === 'uz' ? 'uz-UZ' : voice)
  }
  const stopTalking = async () => send(await speech.stop())

  // Space bosib turilganda tinglaydi (matn yozayotganda emas)
  useEffect(() => {
    const typing = (e) => ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable
    const down = (e) => {
      if (e.code !== 'Space' || e.repeat || typing(e)) return
      e.preventDefault()
      startTalking()
    }
    const up = (e) => {
      if (e.code !== 'Space' || typing(e)) return
      e.preventDefault()
      stopTalking()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  })

  return (
    <>
      <PageHeader
        title="AI ustoz"
        subtitle="Darsdan tashqari gapirib mashq qilish: Zukko xatolarni tuzatadi va o'zbekcha tushuntiradi"
        actions={
          <Button variant="secondary" icon="refresh" onClick={() => restart()}>
            Yangi suhbat
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="flex flex-col items-center">
          <div className="grid w-full gap-3 sm:grid-cols-3">
            <Select
              label="O'rganiladigan til"
              options={LANGUAGES}
              value={language}
              onChange={(v) => {
                setLanguage(v)
                restart(v)
              }}
            />
            <Select
              label="Men gapiraman"
              options={[
                { value: 'uz', label: "O'zbekcha" },
                { value: 'target', label: LANGUAGES.find((l) => l.value === language).label },
              ]}
              value={micLang}
              onChange={setMicLang}
            />
            <Select label="Zukko ovozi" options={VOICES} value={gender} onChange={setGender} />
          </div>

          <div className="my-4">
            <TutorFace emotion={emotion} state={state} size={240} />
          </div>

          <p className="m-0 min-h-5 text-center text-sm text-text-secondary">{speech.interim || STATUS[state]}</p>

          {speech.supported ? (
            <button
              type="button"
              aria-label="Bosib turib gapiring"
              onPointerDown={startTalking}
              onPointerUp={stopTalking}
              onPointerLeave={() => speech.listening && stopTalking()}
              disabled={loading}
              className={`mt-5 grid size-20 cursor-pointer touch-none place-items-center rounded-full transition-all select-none disabled:opacity-50 ${
                speech.listening ? 'scale-110 bg-danger text-white' : 'bg-primary text-on-primary hover:scale-105'
              }`}
            >
              <Icon name="mic" size={30} />
            </button>
          ) : (
            <p className="m-0 mt-4 rounded-2xl bg-warning-soft px-4 py-3 text-center text-[13px] text-warning">
              Bu brauzer ovozni tanimaydi. Chrome yoki Edge'da oching, yoki pastda yozib yuboring.
            </p>
          )}
          <p className="m-0 mt-3 text-xs text-text-secondary">
            <kbd className="rounded-md border border-border bg-background px-1.5 py-0.5 font-sans">Space</kbd> bosib turing
          </p>
        </Card>

        {/* Balandligi qotirilgan: sahifa emas, faqat chat ichi scroll bo'ladi */}
        <Card padding="p-0" className="flex h-[70dvh] min-h-[440px] flex-col overflow-hidden lg:h-[calc(100dvh-210px)] lg:min-h-[520px]">
          <div ref={listRef} className="scroll-thin flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-5 sm:p-6">
            {messages.map((m, i) => (
              <Bubble key={i} message={m} onReplay={() => say(m.speech)} onSayWord={(word) => say([{ lang: 'target', text: word }])} />
            ))}
            {speech.listening && speech.interim && <Bubble message={{ role: 'user', content: speech.interim }} faded />}
            {loading && <Bubble message={{ role: 'assistant', content: '...' }} faded />}
          </div>
          <form
            className="flex gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault()
              send(draft)
              setDraft('')
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Yoki shu yerga yozing..."
              maxLength={2000}
              className="h-11 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-text-secondary"
            />
            <Button type="submit" icon="send" disabled={!draft.trim() || loading} aria-label="Yuborish" />
          </form>
        </Card>
      </div>
    </>
  )
}

function Bubble({ message, faded, onReplay, onSayWord }) {
  const mine = message.role === 'user'
  return (
    <div className={`flex max-w-[85%] flex-col gap-1.5 ${mine ? 'self-end items-end' : 'self-start'} ${faded ? 'opacity-60' : 'animate-pop-in'}`}>
      <div className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">{mine ? 'Siz' : 'Zukko'}</div>
      <div
        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${mine ? 'rounded-br-md bg-primary text-on-primary' : 'rounded-bl-md bg-background'}`}
      >
        {message.speech
          ? message.speech.map((p, i) => (
              // O'rganilayotgan tildagi gaplar ajralib tursin
              <span key={i} className={p.lang === 'target' ? 'font-semibold text-success' : ''}>
                {p.text}{' '}
              </span>
            ))
          : message.content}
        {onReplay && message.speech && !faded && (
          <button type="button" onClick={onReplay} className="ml-1 cursor-pointer align-middle text-text-secondary hover:text-text-primary" aria-label="Qayta eshitish">
            ▶
          </button>
        )}
      </div>
      {message.correction && (
        <div className="rounded-2xl bg-mint-soft px-4 py-2 text-[13px]">
          <span className="font-semibold">To'g'risi: </span>
          {message.correction}
        </div>
      )}
      {message.pronunciation?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {message.pronunciation.map((p) => (
            <button
              key={p.word}
              type="button"
              onClick={() => onSayWord(p.word)}
              className="cursor-pointer rounded-full border border-border bg-card px-3 py-1 text-[13px] hover:bg-surface"
              title="Eshitish"
            >
              🔊 <span className="font-semibold">{p.word}</span> <span className="text-text-secondary">[{p.say}]</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

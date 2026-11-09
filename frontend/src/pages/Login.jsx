import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Logo from '../components/layout/Logo'
import ThemeToggle from '../components/layout/ThemeToggle'
import { Button, Icon, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  { icon: 'attendance', text: 'Kunlik davomat — kim keldi, kim kelmadi' },
  { icon: 'wallet', text: "Oylik to'lovlar va qarzdorlar nazorati" },
  { icon: 'building', text: 'Bir nechta filialni bitta joydan boshqarish' },
]

export default function Login() {
  const { user, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-dvh gap-3 p-3 lg:grid-cols-2">
      {/* Chap: forma */}
      <div className="flex min-h-[calc(100dvh-24px)] items-center justify-center rounded-[32px] bg-card px-6 py-10 lg:min-h-0">
        <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4">
          <div className="flex items-center justify-between">
            <Logo />
            <ThemeToggle />
          </div>
          <div className="mt-6 mb-2">
            <h1 className="m-0 font-display text-[32px] leading-9 font-light tracking-[-0.01em]">Xush kelibsiz</h1>
            <p className="m-0 mt-2 text-sm text-text-secondary">Davom etish uchun tizimga kiring</p>
          </div>
          <Input label="Login" icon="user" value={username} onChange={setUsername} autoFocus required />
          <Input label="Parol" icon="shield" type="password" value={password} onChange={setPassword} required error={error} />
          <Button type="submit" loading={loading} className="mt-2 w-full">Kirish</Button>
          <p className="m-0 mt-4 rounded-2xl bg-background px-4 py-3 text-center text-xs text-text-secondary">
            Sinov uchun: <b>admin</b> / <b>admin123</b>
          </p>
        </form>
      </div>

      {/* O'ng: qora panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden rounded-[32px] bg-ink p-12 text-white ring-1 ring-white/5 lg:flex">
        <div className="absolute -top-24 -right-24 size-80 rounded-full bg-mint/20 blur-3xl" />
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs">
          <span className="size-1.5 rounded-full bg-mint" /> O'quv markaz boshqaruvi
        </span>
        <div>
          <h2 className="m-0 max-w-[16ch] font-display text-5xl leading-[1.1] font-light">
            O'quvchilar, davomat va to'lovlar — <span className="text-mint">bir joyda</span>
          </h2>
          <ul className="m-0 mt-10 flex list-none flex-col gap-4 p-0">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm text-white/70">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-mint">
                  <Icon name={f.icon} size={17} />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

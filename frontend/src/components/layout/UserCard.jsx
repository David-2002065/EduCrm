import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Avatar, ConfirmDialog, IconButton, Tooltip } from '../ui'

export default function UserCard({ compact }) {
  const { user, logout } = useAuth()
  const [confirm, setConfirm] = useState(false)

  const dialog = (
    <ConfirmDialog
      open={confirm}
      onClose={() => setConfirm(false)}
      onConfirm={logout}
      title="Tizimdan chiqish"
      text="Haqiqatan ham tizimdan chiqmoqchimisiz? Qayta kirish uchun login va parol kerak bo'ladi."
      confirmText="Chiqish"
    />
  )
  const logoutButton = <IconButton icon="logout" label="Chiqish" variant={compact ? 'outline' : 'ghost'} tooltipSide={compact ? 'right' : 'top'} onClick={() => setConfirm(true)} />

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Tooltip label={`${user?.full_name} · ${user?.role_name}`} side="right">
          <Avatar name={user?.full_name} />
        </Tooltip>
        {logoutButton}
        {dialog}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-2.5">
      <Avatar name={user?.full_name} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{user?.full_name}</div>
        <div className="truncate text-xs text-text-secondary">{user?.role_name}</div>
      </div>
      {logoutButton}
      {dialog}
    </div>
  )
}

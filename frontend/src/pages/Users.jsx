import { useState } from 'react'
import { PageHeader, Tabs } from '../components/ui'
import RolesTab from '../components/users/RolesTab'
import UsersTab from '../components/users/UsersTab'

const TABS = [
  { value: 'users', label: 'Foydalanuvchilar' },
  { value: 'roles', label: 'Rollar va ruxsatlar' },
]

export default function Users() {
  const [tab, setTab] = useState('users')
  return (
    <>
      <PageHeader
        title="Foydalanuvchilar"
        subtitle="Kim tizimga kira oladi va nimalarni qila oladi"
        actions={<Tabs items={TABS} value={tab} onChange={setTab} />}
      />
      {tab === 'users' ? <UsersTab /> : <RolesTab />}
    </>
  )
}

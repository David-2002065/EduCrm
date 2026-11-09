import { createContext, useContext, useEffect, useState } from 'react'
import { api, clearCache, tokenStore } from '../api'
import { can as canDo } from '../utils/permissions'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(!!tokenStore.get())

  // Sahifa yangilanganda token bo'lsa — foydalanuvchini qayta olamiz
  useEffect(() => {
    if (tokenStore.get()) {
      api.get('/auth/me').then(setUser).catch(() => setUser(null)).finally(() => setChecking(false))
    }
    const onLogout = () => setUser(null)
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  const login = async (username, password) => {
    const data = await api.post('/auth/login', { username, password })
    tokenStore.set(data.token)
    clearCache()
    setUser(data.user)
  }

  const logout = () => {
    tokenStore.clear()
    clearCache()
    setUser(null)
  }

  // can('groups.manage') — joriy foydalanuvchi shu amalni qila oladimi
  const can = (permission) => canDo(user, permission)

  return <AuthContext.Provider value={{ user, checking, login, logout, can }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

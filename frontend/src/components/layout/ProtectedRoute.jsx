import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loader } from '../ui'
import { firstAllowedPath } from './navigation'

/**
 * Kirmagan foydalanuvchini login sahifasiga yuboradi.
 * permission berilsa va foydalanuvchida u bo'lmasa — o'zi kira oladigan birinchi sahifaga.
 */
export default function ProtectedRoute({ children, permission }) {
  const { user, checking, can } = useAuth()
  if (checking) return <Loader className="h-dvh" />
  if (!user) return <Navigate to="/login" replace />
  if (permission && !can(permission)) return <Navigate to={firstAllowedPath(can)} replace />
  return children
}

// "/" — foydalanuvchi uchun mos bosh sahifa
export function HomeRedirect() {
  const { can } = useAuth()
  return <Navigate to={firstAllowedPath(can)} replace />
}

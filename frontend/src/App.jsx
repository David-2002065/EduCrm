import { Route, Routes } from 'react-router-dom'
import AiTutor from './pages/AiTutor'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute, { HomeRedirect } from './components/layout/ProtectedRoute'
import { EmptyState } from './components/ui'
import { BranchProvider } from './context/BranchContext'
import Attendance from './pages/Attendance'
import Branches from './pages/Branches'
import Dashboard from './pages/Dashboard'
import Groups from './pages/Groups'
import GroupTests from './pages/GroupTests'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Payments from './pages/Payments'
import StudentDetail from './pages/StudentDetail'
import Students from './pages/Students'
import Teachers from './pages/Teachers'
import Printer from './pages/Printer'
import Users from './pages/Users'

// [manzil, kerakli ruxsat, sahifa]
const ROUTES = [
  ['/dashboard', 'dashboard.view', Dashboard],
  ['/students', 'students.view', Students],
  ['/students/:id', 'students.view', StudentDetail],
  ['/groups', 'groups.view', Groups],
  ['/groups/:id/tests', 'tests.manage', GroupTests],
  ['/teachers', 'teachers.view', Teachers],
  ['/attendance', 'attendance.mark', Attendance],
  ['/payments', 'payments.view', Payments],
  ['/branches', 'branches.manage', Branches],
  ['/users', 'users.manage', Users],
  ['/printer', 'payments.create', Printer],
  ['/ai-tutor', null, AiTutor], // hozircha hammaga ochiq
]

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <BranchProvider>
              <AppLayout />
            </BranchProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeRedirect />} />
        {ROUTES.map(([path, permission, Page]) => (
          <Route key={path} path={path} element={<ProtectedRoute permission={permission}><Page /></ProtectedRoute>} />
        ))}
        <Route path="/no-access" element={<div className="rounded-card bg-card"><EmptyState icon="shield" title="Sizga hali bo'lim ochilmagan" text="Administratorga murojaat qiling" /></div>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

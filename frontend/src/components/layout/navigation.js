// Menyu elementlari. permission — shu ruxsati bor foydalanuvchiga ko'rinadi (yo'q bo'lsa — hammaga)
export const NAV_SECTIONS = [
  {
    title: 'Asosiy',
    items: [
      { to: '/dashboard', label: 'Bosh sahifa', icon: 'home', permission: 'dashboard.view' },
      { to: '/students', label: "O'quvchilar", icon: 'users', permission: 'students.view' },
      { to: '/groups', label: 'Guruhlar', icon: 'layers', permission: 'groups.view' },
      { to: '/teachers', label: 'Ustozlar', icon: 'teacher', permission: 'teachers.view' },
    ],
  },
  {
    title: 'Kundalik ish',
    items: [
      { to: '/attendance', label: 'Davomat', icon: 'attendance', permission: 'attendance.mark' },
      { to: '/payments', label: "To'lovlar", icon: 'wallet', permission: 'payments.view' },
    ],
  },
  {
    title: "Mashg'ulot",
    items: [{ to: '/ai-tutor', label: 'AI ustoz', icon: 'sparkles' }],
  },
  {
    title: 'Sozlamalar',
    items: [
      { to: '/branches', label: 'Filiallar', icon: 'building', permission: 'branches.manage' },
      { to: '/users', label: 'Foydalanuvchilar', icon: 'shield', permission: 'users.manage' },
      { to: '/printer', label: 'Chek printeri', icon: 'printer', permission: 'payments.create' },
    ],
  },
]

// Foydalanuvchi kira oladigan birinchi sahifa (bosh sahifa ruxsati bo'lmasa)
export const firstAllowedPath = (can) =>
  NAV_SECTIONS.flatMap((s) => s.items).find((i) => !i.permission || can(i.permission))?.to || '/no-access'

// Sahifa uchun kerakli ruxsat
export const permissionFor = (path) => NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.to === path)?.permission

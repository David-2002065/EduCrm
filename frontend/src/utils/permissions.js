/**
 * Ruxsatlar backend'dan keladi (/auth/me -> user.permissions).
 * Rollar va ruxsatlarni "Foydalanuvchilar" bo'limida bosh admin sozlaydi.
 */
export const can = (user, permission) => !!user?.permissions?.includes(permission)

// Rol nomi bo'yicha badge rangi (bosh admin — qora, qolganlari — kulrang)
export const roleTone = (user) => (user?.is_superadmin ? 'dark' : 'neutral')

import { useTheme } from '../../context/ThemeContext'
import { IconButton } from '../ui'

// Yorug' / qorong'i mavzuni almashtirish
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'
  return (
    <IconButton
      icon={dark ? 'sun' : 'moon'}
      label={dark ? "Yorug' mavzu" : "Qorong'i mavzu"}
      variant="outline"
      size={44}
      tooltipSide="top"
      onClick={toggleTheme}
    />
  )
}

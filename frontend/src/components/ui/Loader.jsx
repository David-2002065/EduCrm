import Spinner from './Spinner'

// Sahifa yoki blok yuklanayotganda
export default function Loader({ text = 'Yuklanmoqda...', className = 'min-h-[40vh]' }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-sm text-text-secondary ${className}`}>
      <Spinner size={18} />
      {text}
    </div>
  )
}

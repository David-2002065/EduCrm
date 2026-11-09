export default function Spinner({ size = 16, className = '' }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  )
}

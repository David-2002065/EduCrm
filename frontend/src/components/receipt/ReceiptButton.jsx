import { IconButton } from '../ui'

// Jadval qatoridagi "Chek" tugmasi
export default function ReceiptButton({ onClick }) {
  return (
    <IconButton
      icon="receipt"
      label="Chek"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    />
  )
}

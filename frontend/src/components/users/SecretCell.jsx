import { useState } from 'react'
import { IconButton, Tooltip, useToast } from '../ui'

/**
 * Yashirin qiymat (login / parol): avval ******, bosilsa ochiladi va nusxalash tugmasi chiqadi,
 * yana bosilsa — qayta yashiriladi.
 */
export default function SecretCell({ value, label, emptyHint }) {
  const toast = useToast()
  const [shown, setShown] = useState(false)

  if (!value) {
    return (
      <Tooltip label={emptyHint}>
        <span className="text-text-secondary">—</span>
      </Tooltip>
    )
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} nusxalandi`)
    } catch {
      toast.error("Nusxalab bo'lmadi")
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        title={shown ? 'Yashirish' : "Ko'rsatish"}
        className={`min-w-0 cursor-pointer truncate rounded-lg px-1.5 py-1 text-left hover:bg-background ${shown ? 'font-mono text-[13px]' : 'tracking-widest text-text-secondary'}`}
      >
        {shown ? value : '********'}
      </button>
      {shown && <IconButton icon="copy" label={`${label}ni nusxalash`} size={28} onClick={copy} />}
    </div>
  )
}

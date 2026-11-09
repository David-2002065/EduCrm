import Field, { controlClass } from './Field'

export default function Textarea({ label, error, onChange, rows = 3, className = '', ...props }) {
  return (
    <Field label={label} error={error} className={className}>
      <textarea
        rows={rows}
        className={`${controlClass(error)} h-auto resize-none py-3`}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
    </Field>
  )
}

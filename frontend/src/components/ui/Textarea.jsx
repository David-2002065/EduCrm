import Field, { controlClass, isEmpty, useFieldError } from './Field'

export default function Textarea({ label, error, onChange, required, rows = 3, className = '', ...props }) {
  const missing = isEmpty(props.value) || !String(props.value).trim()
  error = useFieldError({ error, required, missing })
  return (
    <Field label={label} error={error} required={required} missing={missing} className={className}>
      <textarea
        rows={rows}
        className={`${controlClass(error)} h-auto resize-none py-3`}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
    </Field>
  )
}

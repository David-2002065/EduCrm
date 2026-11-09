// Filtrlar qatori (qidiruv, select'lar, tablar)
export default function Toolbar({ children }) {
  return <div className="mb-4 flex flex-wrap items-end gap-3 [&>*]:min-w-0">{children}</div>
}

import { IconButton } from '../ui'

// Sidebarni ochib-yopish tugmasi. Telefonda ham, kompyuterda ham shu bitta tugma ishlaydi.
export default function SidebarToggle({ onClick }) {
  return <IconButton icon="sidebar" label="Menyuni ochish / yopish" variant="outline" size={44} onClick={onClick} />
}

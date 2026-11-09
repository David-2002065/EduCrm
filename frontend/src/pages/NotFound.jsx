import { Link } from 'react-router-dom'
import { Button, EmptyState } from '../components/ui'

export default function NotFound() {
  return (
    <div className="rounded-card bg-card">
      <EmptyState
        icon="alert"
        title="Sahifa topilmadi"
        text="Bunday sahifa mavjud emas"
        action={<Link to="/dashboard"><Button>Bosh sahifaga</Button></Link>}
      />
    </div>
  )
}

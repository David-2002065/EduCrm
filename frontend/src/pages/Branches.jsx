import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import BranchCard from '../components/branches/BranchCard'
import BranchFormModal from '../components/forms/BranchFormModal'
import { Button, ConfirmDialog, EmptyState, PageHeader, useToast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useBranch } from '../context/BranchContext'
import { useDisclosure } from '../hooks/useDisclosure'

export default function Branches() {
  const toast = useToast()
  const navigate = useNavigate()
  const { can } = useAuth()
  const canManage = can('branches.manage')
  const { branches, reloadBranches, branchId, setBranchId } = useBranch()
  const form = useDisclosure()
  const remove = useDisclosure()

  const deleteBranch = async () => {
    try {
      await api.delete(`/branches/${remove.item.id}`)
      if (String(remove.item.id) === branchId) setBranchId('')
      toast.success("Filial o'chirildi")
      reloadBranches()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Filiallar"
        subtitle="Filialni bosing — tizim shu filialga o'tadi"
        actions={canManage && <Button icon="plus" onClick={() => form.open()}>Yangi filial</Button>}
      />

      {branches.length === 0 ? (
        <div className="rounded-card bg-card">
          <EmptyState icon="building" title="Filiallar yo'q" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((b) => (
            <BranchCard
              key={b.id}
              branch={b}
              active={String(b.id) === branchId}
              onOpen={() => {
                setBranchId(b.id)
                navigate('/dashboard')
              }}
              onEdit={canManage ? () => form.open(b) : undefined} onDelete={canManage ? () => remove.open(b) : undefined} />
          ))}
        </div>
      )}

      <BranchFormModal open={form.isOpen} onClose={form.close} branch={form.item} onSaved={reloadBranches} />
      <ConfirmDialog
        open={remove.isOpen}
        onClose={remove.close}
        onConfirm={deleteBranch}
        title="Filialni o'chirish"
        text={`"${remove.item?.name}" o'chiriladi. Filialda guruh yoki o'quvchi bo'lsa, o'chmaydi.`}
      />
    </>
  )
}

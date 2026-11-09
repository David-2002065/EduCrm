import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { loadPrinterSettings, printReceipt } from '../../utils/printer'
import { Button, ErrorBox, Icon, Loader, Modal } from '../ui'
import Receipt from './Receipt'

/**
 * Chekni ko'rsatish va chop etish.
 * autoPrint=true (to'lov endigina qabul qilinganda) — sozlamada yoqilgan bo'lsa, chek o'zi chop etiladi.
 * Printer agenti ishlamasa — sabab ko'rsatiladi va brauzer orqali chop etish taklif qilinadi.
 */
export default function ReceiptModal({ paymentId, onClose, autoPrint = false }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState(null) // { type: 'ok' | 'error' | 'printing', text }
  const settings = loadPrinterSettings()
  const autoDone = useRef(null)

  useEffect(() => {
    if (!paymentId) return
    setData(null)
    setError(null)
    setStatus(null)
    api.get(`/payments/${paymentId}/receipt`).then(setData).catch((e) => setError(e.message))
  }, [paymentId])

  const print = async (mode) => {
    setStatus({ type: 'printing', text: 'Chop etilmoqda...' })
    try {
      const via = await printReceipt(data, mode ? { ...settings, mode } : settings)
      setStatus(via === 'agent' ? { type: 'ok', text: `Chek printerga yuborildi${settings.printer ? ` (${settings.printer})` : ''}` } : null)
    } catch (e) {
      setStatus({ type: 'error', text: `Printer agenti ishlamadi: ${e.message}` })
    }
  }

  // To'lovdan keyin avtomatik chop etish (bir marta)
  useEffect(() => {
    if (autoPrint && data && settings.autoPrint && autoDone.current !== paymentId) {
      autoDone.current = paymentId
      print()
    }
  }, [autoPrint, data]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Modal
        open={!!paymentId}
        onClose={onClose}
        title="To'lov cheki"
        subtitle={data ? `№ ${data.number}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>Yopish</Button>
            {status?.type === 'error' && (
              <Button variant="secondary" icon="printer" onClick={() => print('browser')}>Brauzer orqali</Button>
            )}
            <Button icon="printer" disabled={!data} loading={status?.type === 'printing'} onClick={() => print()}>
              {status?.type === 'ok' ? 'Yana chop etish' : 'Chop etish'}
            </Button>
          </>
        }
      >
        {status && status.type !== 'printing' && (
          <div className={`mb-3 flex items-start gap-2 rounded-2xl p-3 text-sm ${status.type === 'ok' ? 'bg-mint-soft text-success' : 'bg-danger-soft text-danger'}`}>
            <Icon name={status.type === 'ok' ? 'check' : 'alert'} size={17} className="mt-0.5" />
            <span>
              {status.text}
              {status.type === 'error' && (
                <>
                  {' '}— <Link to="/printer" onClick={onClose} className="font-semibold text-danger">sozlamalarni tekshiring</Link>
                </>
              )}
            </span>
          </div>
        )}
        <div className="rounded-2xl bg-background p-3">
          {error ? <ErrorBox message={error} /> : data ? <div className="shadow-float"><Receipt data={data} /></div> : <Loader className="h-60" />}
        </div>
      </Modal>

      {/* Brauzer orqali chop etish uchun nusxa: ekranda ko'rinmaydi, print paytida faqat shu chiqadi */}
      {paymentId && data &&
        createPortal(
          <div id="print-area" data-width={settings.width}>
            <Receipt data={data} />
          </div>,
          document.body,
        )}
    </>
  )
}

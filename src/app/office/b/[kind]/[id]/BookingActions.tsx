'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

const METHODS = ['Cash', 'Bank Transfer', 'Easypaisa', 'JazzCash']
const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Mstr', 'CHD', 'INF']
const money = (n: number) => 'PKR ' + Number(n || 0).toLocaleString('en-US')

const css = `
.ba{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0 22px}
.ba .btn{padding:12px 22px;font-size:14px}
.ba .pay{margin-left:auto}
.ov{position:fixed;inset:0;background:rgba(18,51,95,.45);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
.md{background:#fff;border-radius:16px;padding:26px;width:100%;max-width:460px;box-shadow:0 20px 50px rgba(18,51,95,.3)}
.md h3{margin:0 0 4px;font-size:18px;color:#12335f}
.md .sub{margin:0 0 18px;font-size:13px;color:#6b7c93;line-height:1.5}
.md .bal{display:flex;justify-content:space-between;align-items:baseline;background:#f4f7fb;border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:13px;color:#4b5f7a}
.md .bal b{font-size:18px;color:#12335f}
.md .fld{margin-bottom:14px}
.md .acts{display:flex;gap:10px;justify-content:flex-end;margin-top:20px}
.md .err{background:#fdecea;border:1px solid #f0c9c6;color:#b3261e;padding:10px 14px;border-radius:9px;font-size:13px;font-weight:600;margin-bottom:14px}
`

export default function BookingActions(props: {
  kind: string
  bookingId: string
  status: string
  paymentType: string | null
  balance: number
  isOffline: boolean
  passengers: any[]
  remarks: string
}) {
  const { kind, bookingId, status, paymentType, balance, isOffline, passengers, remarks } = props
  const router = useRouter()
  const supabase = createClient()

  const [payOpen, setPayOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [amount, setAmount] = useState(String(balance))
  const [method, setMethod] = useState('Cash')
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [editing, setEditing] = useState(false)
  const [pax, setPax] = useState<any[]>(passengers)
  const [rem, setRem] = useState(remarks)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [modalErr, setModalErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setPax(passengers)
    setRem(remarks)
  }, [passengers, remarks])

  const mustFull = kind === 'ticket' || paymentType === 'Pay Later'
  const canPay = isOffline && (status === 'Unpaid' || status === 'Partial') && balance > 0
  const canChange = isOffline && ['Unpaid', 'Partial', 'Paid'].includes(status)

  const amt = Number(amount) || 0
  const after = Math.max(0, balance - amt)

  const openPay = () => {
    setAmount(String(balance))
    setMethod('Cash')
    setNote('')
    setModalErr('')
    setPayOpen(true)
  }

  const confirmPay = async () => {
    if (!amt || amt <= 0) { setModalErr('Enter an amount above zero.'); return }
    if (amt > balance) { setModalErr('The amount is more than the balance.'); return }
    setBusy(true)
    setModalErr('')
    const { error } = await supabase.rpc('record_offline_payment', {
      p_kind: kind, p_booking_id: bookingId, p_amount: amt,
      p_method: method, p_note: note.trim() || null,
    })
    setBusy(false)
    if (error) { setModalErr(error.message); return }
    setPayOpen(false)
    setMsg({ ok: true, text: 'Payment recorded.' })
    router.refresh()
  }

  const openCancel = () => {
    setReason('')
    setModalErr('')
    setCancelOpen(true)
  }

  const confirmCancel = async () => {
    setBusy(true)
    setModalErr('')
    const { error } = await supabase.rpc('cancel_offline_booking', {
      p_kind: kind, p_booking_id: bookingId, p_reason: reason.trim() || null,
    })
    setBusy(false)
    if (error) { setModalErr(error.message); return }
    setCancelOpen(false)
    setMsg({ ok: true, text: 'Booking cancelled and seats returned.' })
    router.refresh()
  }

  const save = async () => {
    setBusy(true)
    setMsg(null)
    const { error } = await supabase.rpc('update_offline_booking', {
      p_kind: kind, p_booking_id: bookingId, p_passengers: pax, p_remarks: rem.trim() || null,
    })
    setBusy(false)
    if (error) {
      setMsg({ ok: false, text: error.message })
      return
    }
    setMsg({ ok: true, text: 'Changes saved.' })
    setEditing(false)
    router.refresh()
  }

  const setP = (i: number, k: string, v: string) =>
    setPax((l) => l.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)))

  return (
    <div>
      <style>{css}</style>

      {msg && <div className={'msg ' + (msg.ok ? 'ok' : 'bad')}>{msg.text}</div>}

      <div className="ba no-print">
        <Link href={`/office/b/${kind}/${bookingId}/voucher`} className="btn ghost">Open voucher</Link>
        {canChange && (
          <button className="btn ghost" onClick={() => setEditing(!editing)}>
            {editing ? 'Close edit' : 'Edit'}
          </button>
        )}
        {canChange && <button className="btn red" onClick={openCancel}>Cancel booking</button>}
        {canPay && <button className="btn navy pay" onClick={openPay}>Pay now</button>}
      </div>

      {!isOffline && (
        <p className="note no-print" style={{ marginTop: -12, marginBottom: 20 }}>
          This is an online booking. Payment and changes are handled by the customer and Super Admin.
        </p>
      )}

      {editing && (
        <div className="card no-print">
          <h3>Edit passengers</h3>
          {pax.map((p, i) => (
            <div key={p.id} style={{ border: '1px solid #e3e9f1', borderRadius: 12, padding: 16, marginBottom: 12, background: '#fbfcfe' }}>
              <b style={{ fontSize: 14 }}>Passenger {i + 1}</b>
              <div className="g3" style={{ marginTop: 12 }}>
                <div>
                  <label className="lab">Title</label>
                  <select className="in" value={p.title} onChange={(e) => setP(i, 'title', e.target.value)}>
                    {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="lab">Given name</label>
                  <input className="in" value={p.given_name} onChange={(e) => setP(i, 'given_name', e.target.value)} /></div>
                <div><label className="lab">Surname</label>
                  <input className="in" value={p.surname} onChange={(e) => setP(i, 'surname', e.target.value)} /></div>
                <div><label className="lab">Date of birth</label>
                  <input type="date" className="in" value={p.date_of_birth} onChange={(e) => setP(i, 'date_of_birth', e.target.value)} /></div>
                <div><label className="lab">Nationality</label>
                  <input className="in" value={p.nationality} onChange={(e) => setP(i, 'nationality', e.target.value)} /></div>
                <div><label className="lab">Passport number</label>
                  <input className="in" value={p.passport_number} onChange={(e) => setP(i, 'passport_number', e.target.value)} /></div>
                <div><label className="lab">Passport issue date</label>
                  <input type="date" className="in" value={p.passport_issue_date} onChange={(e) => setP(i, 'passport_issue_date', e.target.value)} /></div>
                <div><label className="lab">Passport expiry date</label>
                  <input type="date" className="in" value={p.passport_expiry_date} onChange={(e) => setP(i, 'passport_expiry_date', e.target.value)} /></div>
              </div>
            </div>
          ))}
          <label className="lab">Remarks</label>
          <textarea className="in" style={{ height: 70, padding: 10 }} value={rem} onChange={(e) => setRem(e.target.value)} />
          <p className="note">A passenger cannot be changed between Adult, Child and Infant here. Cancel and make a new booking for that.</p>
          <div style={{ marginTop: 14 }}>
            <button className="btn" disabled={busy} onClick={save}>Save changes</button>
          </div>
        </div>
      )}

      {payOpen && (
        <div className="ov no-print" onClick={() => { if (!busy) setPayOpen(false) }}>
          <div className="md" onClick={(e) => e.stopPropagation()}>
            <h3>Pay now</h3>
            <p className="sub">Record the money received at the counter.</p>

            {modalErr && <div className="err">{modalErr}</div>}

            <div className="bal"><span>Balance due</span><b>{money(balance)}</b></div>

            <div className="fld">
              <label className="lab">Amount (PKR)</label>
              <input className="in" type="number" value={amount} readOnly={mustFull}
                onChange={(e) => setAmount(e.target.value)} />
              {mustFull && <p className="note" style={{ marginTop: 6 }}>This booking must be paid in full in one go.</p>}
            </div>

            <div className="bal"><span>Balance after this payment</span><b>{money(after)}</b></div>

            <div className="fld">
              <label className="lab">Method</label>
              <select className="in" value={method} onChange={(e) => setMethod(e.target.value)}>
                {METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div className="fld" style={{ marginBottom: 0 }}>
              <label className="lab">Note (optional)</label>
              <input className="in" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="acts">
              <button className="btn ghost" disabled={busy} onClick={() => setPayOpen(false)}>Close</button>
              <button className="btn navy" disabled={busy} onClick={confirmPay}>
                {busy ? 'Saving...' : 'Confirm payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelOpen && (
        <div className="ov no-print" onClick={() => { if (!busy) setCancelOpen(false) }}>
          <div className="md" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel this booking?</h3>
            <p className="sub">The seats go back to the public site. The booking stays in the records and is never deleted.</p>

            {modalErr && <div className="err">{modalErr}</div>}

            <div className="fld" style={{ marginBottom: 0 }}>
              <label className="lab">Reason (optional)</label>
              <input className="in" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>

            <div className="acts">
              <button className="btn ghost" disabled={busy} onClick={() => setCancelOpen(false)}>Keep booking</button>
              <button className="btn" disabled={busy} onClick={confirmCancel}
                style={{ background: '#b3261e' }}>
                {busy ? 'Cancelling...' : 'Yes, cancel booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

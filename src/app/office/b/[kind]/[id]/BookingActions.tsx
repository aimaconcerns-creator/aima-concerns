'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

const METHODS = ['Cash', 'Bank Transfer', 'Easypaisa', 'JazzCash']
const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Mstr', 'CHD', 'INF']

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

  const [amount, setAmount] = useState(String(balance))
  const [method, setMethod] = useState('Cash')
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [editing, setEditing] = useState(false)
  const [pax, setPax] = useState<any[]>(passengers)
  const [rem, setRem] = useState(remarks)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const mustFull = kind === 'ticket' || paymentType === 'Pay Later'
  const canPay = isOffline && (status === 'Unpaid' || status === 'Partial')
  const canChange = isOffline && ['Unpaid', 'Partial', 'Paid'].includes(status)

  const run = async (fn: string, args: any, okText: string) => {
    setBusy(true)
    setMsg(null)
    const { error } = await supabase.rpc(fn, args)
    setBusy(false)
    if (error) {
      setMsg({ ok: false, text: error.message })
      return false
    }
    setMsg({ ok: true, text: okText })
    router.refresh()
    return true
  }

  const pay = () =>
    run('record_offline_payment', {
      p_kind: kind, p_booking_id: bookingId, p_amount: Number(amount),
      p_method: method, p_note: note.trim() || null,
    }, 'Payment recorded.')

  const cancel = async () => {
    if (!window.confirm('Cancel this booking? The seats will go back to the public site.')) return
    await run('cancel_offline_booking', {
      p_kind: kind, p_booking_id: bookingId, p_reason: reason.trim() || null,
    }, 'Booking cancelled and seats returned.')
  }

  const save = async () => {
    const ok = await run('update_offline_booking', {
      p_kind: kind, p_booking_id: bookingId, p_passengers: pax, p_remarks: rem.trim() || null,
    }, 'Changes saved.')
    if (ok) setEditing(false)
  }

  const setP = (i: number, k: string, v: string) =>
    setPax((l) => l.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)))

  return (
    <div>
      {msg && <div className={'msg ' + (msg.ok ? 'ok' : 'bad')}>{msg.text}</div>}

      <div className="card no-print">
        <h3>Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href={`/office/b/${kind}/${bookingId}/voucher`} className="btn navy">Open voucher</Link>
          {canChange && (
            <button className="btn ghost" onClick={() => setEditing(!editing)}>
              {editing ? 'Close editing' : 'Edit passengers / remarks'}
            </button>
          )}
        </div>
        {!isOffline && <p className="note">This is an online booking. Payment and changes are handled by the customer and Super Admin.</p>}
      </div>

      {canPay && (
        <div className="card no-print">
          <h3>Record a payment</h3>
          <div className="g3">
            <div>
              <label className="lab">Amount (PKR)</label>
              <input className="in" type="number" value={amount} readOnly={mustFull}
                onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="lab">Method</label>
              <select className="in" value={method} onChange={(e) => setMethod(e.target.value)}>
                {METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="lab">Note (optional)</label>
              <input className="in" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          {mustFull && <p className="note">This booking must be paid in full in one go.</p>}
          <div style={{ marginTop: 14 }}>
            <button className="btn" disabled={busy} onClick={pay}>Record payment</button>
          </div>
        </div>
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

      {canChange && (
        <div className="card no-print">
          <h3>Cancel booking</h3>
          <label className="lab">Reason (optional)</label>
          <input className="in" value={reason} onChange={(e) => setReason(e.target.value)} />
          <p className="note">Cancelling returns the seats to the public site. The booking is kept in the records and is never deleted.</p>
          <div style={{ marginTop: 14 }}>
            <button className="btn red" disabled={busy} onClick={cancel}>Cancel this booking</button>
          </div>
        </div>
      )}
    </div>
  )
}

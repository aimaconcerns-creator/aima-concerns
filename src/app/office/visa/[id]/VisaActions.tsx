'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { acceptVisa, refundVisa, rejectVisa, setVisaStage } from '@/app/office/visa/actions'

type Props = {
  id: string
  status: string
  hasPaid: boolean
  refunded: boolean
  isSuper: boolean
  fee: number
  missingVisas: number
}

type Res = { ok: boolean; message: string }

const STAGES = ['Processing', 'Approved', 'Issued']
const money = (n: number) => 'PKR ' + Number(n || 0).toLocaleString('en-US')

const css = `
.va-row{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0 22px;align-items:center}
.va-row .btn{padding:12px 22px;font-size:14px}
.va-stage{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#fff;border:1px solid #e3e9f1;border-radius:12px;padding:8px 10px}
.va-stage label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#6b7c93;margin:0 4px 0 6px}
.va-stage select{height:42px;padding:0 12px;border:1px solid #d5dde8;border-radius:9px;font-size:14px;font-family:inherit;color:#12335f;background:#fff}
.va-hint{font-size:12.5px;color:#a8761a;font-weight:600;margin:0 0 14px}
.va-ov{position:fixed;inset:0;background:rgba(18,51,95,.45);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
.va-md{background:#fff;border-radius:16px;padding:26px;width:100%;max-width:480px;box-shadow:0 20px 50px rgba(18,51,95,.3)}
.va-md h3{margin:0 0 6px;font-size:18px;color:#12335f}
.va-md p.s{margin:0 0 16px;font-size:13px;color:#6b7c93;line-height:1.5}
.va-md .e{background:#fdecea;border:1px solid #f0c9c6;color:#b3261e;padding:10px 14px;border-radius:9px;font-size:13px;font-weight:600;margin-bottom:14px}
.va-md .a{display:flex;gap:10px;justify-content:flex-end;margin-top:18px}
`

export default function VisaActions({ id, status, hasPaid, refunded, isSuper, fee, missingVisas }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [modal, setModal] = useState<'' | 'reject' | 'refund'>('')
  const [text, setText] = useState('')
  const [stage, setStage] = useState(status)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [err, setErr] = useState('')

  const canAccept = status === 'Submitted'
  const canStage = hasPaid && STAGES.includes(status)
  const canReject = status === 'Submitted' || status === 'Processing' || status === 'Approved'
  const canRefund = isSuper && status === 'Rejected' && hasPaid && !refunded

  const needFiles = stage === 'Issued' && missingVisas > 0

  const run = (fn: () => Promise<Res>, closeOnOk: boolean) => {
    setMsg(null)
    setErr('')
    start(async () => {
      const r = await fn()
      if (r.ok) {
        if (closeOnOk) {
          setModal('')
          setText('')
        }
        setMsg({ ok: true, text: r.message })
        router.refresh()
      } else if (modal) {
        setErr(r.message)
      } else {
        setMsg({ ok: false, text: r.message })
      }
    })
  }

  const accept = () => {
    if (!window.confirm(`Accept this application?\n\nThe customer will be asked to pay ${money(fee)} within 3 days, and an email will be sent.`)) return
    run(() => acceptVisa(id), false)
  }

  const changeStage = () => {
    if (stage === status) return
    if (!window.confirm(`Change the stage to ${stage}?\n\nMoving forward to Approved or Issued emails the customer, the first time only.`)) return
    run(() => setVisaStage(id, stage), false)
  }

  return (
    <div>
      <style>{css}</style>

      {msg && <div className={'msg ' + (msg.ok ? 'ok' : 'bad')}>{msg.text}</div>}

      <div className="va-row no-print">
        {canAccept && <button className="btn navy" disabled={pending} onClick={accept}>Accept</button>}

        {canStage && (
          <div className="va-stage">
            <label>Stage</label>
            <select value={stage} onChange={(e) => setStage(e.target.value)} disabled={pending}>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn navy" style={{ padding: '10px 18px' }}
              disabled={pending || stage === status || needFiles} onClick={changeStage}>
              {pending ? 'Saving...' : 'Update stage'}
            </button>
          </div>
        )}

        {canReject && (
          <button className="btn red" disabled={pending} onClick={() => { setText(''); setErr(''); setModal('reject') }}>Reject</button>
        )}
        {canRefund && (
          <button className="btn" disabled={pending} onClick={() => { setText(''); setErr(''); setModal('refund') }}>Refund to wallet</button>
        )}
        {status === 'Awaiting Payment' && (
          <span className="note" style={{ margin: 0 }}>Waiting for the customer to pay. If nothing is paid within 3 days, the application expires.</span>
        )}
        {status === 'Rejected' && hasPaid && !refunded && !isSuper && (
          <span className="note" style={{ margin: 0 }}>This application was paid. Only the Super Admin can refund it.</span>
        )}
      </div>

      {needFiles && (
        <p className="va-hint no-print">
          Upload a visa file for {missingVisas} more {missingVisas === 1 ? 'person' : 'people'} below before choosing Issued.
        </p>
      )}
      {status === 'Issued' && (
        <p className="note no-print" style={{ marginTop: -10 }}>
          The customer can download the visa now. To reject it or remove a file, move the stage back to Approved first.
        </p>
      )}

      {modal === 'reject' && (
        <div className="va-ov no-print" onClick={() => { if (!pending) setModal('') }}>
          <div className="va-md" onClick={(e) => e.stopPropagation()}>
            <h3>Reject this application</h3>
            <p className="s">Write the reason. It is saved on the application and included in the email to the customer.</p>
            {err && <div className="e">{err}</div>}
            <label className="lab">Reason (required)</label>
            <textarea className="in" style={{ height: 100, padding: 10 }} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="e.g. The embassy did not approve this application." />
            <div className="a">
              <button className="btn ghost" disabled={pending} onClick={() => setModal('')}>Close</button>
              <button className="btn" style={{ background: '#b3261e' }} disabled={pending}
                onClick={() => run(() => rejectVisa(id, text), true)}>
                {pending ? 'Rejecting...' : 'Reject application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'refund' && (
        <div className="va-ov no-print" onClick={() => { if (!pending) setModal('') }}>
          <div className="va-md" onClick={(e) => e.stopPropagation()}>
            <h3>Refund {money(fee)} to the wallet?</h3>
            <p className="s">The fee goes back into the customer's wallet and shows in their history. This can be done only once for this application.</p>
            {err && <div className="e">{err}</div>}
            <label className="lab">Note (optional)</label>
            <input className="in" value={text} onChange={(e) => setText(e.target.value)} />
            <div className="a">
              <button className="btn ghost" disabled={pending} onClick={() => setModal('')}>Close</button>
              <button className="btn navy" disabled={pending} onClick={() => run(() => refundVisa(id, text), true)}>
                {pending ? 'Refunding...' : 'Refund to wallet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

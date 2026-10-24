'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

type Item = {
  kind: 'package' | 'ticket'
  id: string
  title: string
  subtitle: string
  departure: string
  price: number
  childPrice: number
  infantPrice: number
  seats: number
}

type Passenger = {
  title: string
  given_name: string
  surname: string
  date_of_birth: string
  nationality: string
  passport_number: string
  passport_issue_date: string
  passport_expiry_date: string
}

const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Mstr', 'CHD', 'INF']
const METHODS = ['Cash', 'Bank Transfer', 'Easypaisa', 'JazzCash']

const blank = (): Passenger => ({
  title: 'Mr', given_name: '', surname: '', date_of_birth: '', nationality: 'Pakistani',
  passport_number: '', passport_issue_date: '', passport_expiry_date: '',
})

const pad = (n: number) => String(n).padStart(2, '0')
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const toLocalInput = (d: Date) => `${toDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const fmt = (n: number) => 'PKR ' + Number(n).toLocaleString('en-PK')

export default function BookingForm({ item }: { item: Item }) {
  const supabase = createClient()

  const defaultDue = (() => {
    const d = new Date(item.departure + 'T00:00:00')
    d.setDate(d.getDate() - 14)
    return toDateInput(d < new Date() ? new Date() : d)
  })()

  const [custMode, setCustMode] = useState<'walkin' | 'existing'>('walkin')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [customer, setCustomer] = useState<any>(null)
  const [searchMsg, setSearchMsg] = useState('')

  const [passengers, setPassengers] = useState<Passenger[]>([blank()])

  const [payType, setPayType] = useState('Paid in full')
  const [method, setMethod] = useState('Cash')
  const [deposit, setDeposit] = useState('')
  const [dueDate, setDueDate] = useState(defaultDue)
  const [holdUntil, setHoldUntil] = useState('')
  const [focReason, setFocReason] = useState('')
  const [remarks, setRemarks] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ reference: string; id: string } | null>(null)

  const infants = passengers.filter((p) => p.title === 'INF').length
  const children = passengers.filter((p) => p.title === 'CHD').length
  const seatsNeeded = passengers.length - infants
  const adults = item.kind === 'ticket' ? passengers.length - infants - children : passengers.length - infants

  const total = item.kind === 'ticket'
    ? adults * item.price + children * item.childPrice + infants * item.infantPrice
    : seatsNeeded * item.price + infants * item.infantPrice
  const shownTotal = payType === 'FOC' ? 0 : total

  const payTypes = item.kind === 'package'
    ? ['Paid in full', 'Partial', 'Pay Later', 'FOC']
    : ['Paid in full', 'Pay Later', 'FOC']

  const holdDays = holdUntil ? Math.ceil((new Date(holdUntil).getTime() - Date.now()) / 86400000) : 0

  const setHoldHours = (h: number) => {
    setHoldUntil(toLocalInput(new Date(Date.now() + h * 3600000)))
  }

  const updatePassenger = (i: number, key: keyof Passenger, value: string) => {
    setPassengers((list) => list.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)))
  }

  const searchCustomers = async () => {
    setSearchMsg('')
    if (query.trim().length < 2) {
      setSearchMsg('Type at least 2 characters.')
      return
    }
    const { data, error } = await supabase.rpc('search_customers_for_booking', { p_query: query.trim() })
    if (error) {
      setSearchMsg('Search failed: ' + error.message)
      return
    }
    setResults(data || [])
    if (!data || data.length === 0) setSearchMsg('No approved customer found.')
  }

  const submit = async () => {
    setError('')
    if (custMode === 'existing' && !customer) {
      setError('Search and select a customer, or switch to Walk-in.')
      return
    }
    if (payType === 'Partial') {
      const dep = Number(deposit)
      if (!dep || dep <= 0 || dep >= total) {
        setError('The deposit must be above zero and below the total.')
        return
      }
    }
    if (payType === 'Pay Later' && !holdUntil) {
      setError('Choose the hold date and time.')
      return
    }
    if (payType === 'FOC' && !focReason.trim()) {
      setError('A reason is required for an FOC booking.')
      return
    }

    const needsMethod = payType === 'Paid in full' || payType === 'Partial'
    const base: any = {
      p_customer_id: custMode === 'existing' ? customer.out_id : null,
      p_passengers: passengers,
      p_payment_type: payType,
      p_payment_method: needsMethod ? method : null,
      p_hold_until: payType === 'Pay Later' ? new Date(holdUntil).toISOString() : null,
      p_remarks: remarks.trim() || null,
      p_foc_reason: payType === 'FOC' ? focReason.trim() : null,
    }

    let fn = ''
    let args: any = {}
    if (item.kind === 'package') {
      fn = 'create_offline_package_booking'
      args = {
        ...base,
        p_package_id: item.id,
        p_amount_paid: payType === 'Partial' ? Number(deposit) : null,
        p_balance_due_date: payType === 'Partial' ? dueDate : null,
      }
    } else {
      fn = 'create_offline_ticket_booking'
      args = { ...base, p_ticket_id: item.id }
    }

    setBusy(true)
    const { data, error } = await supabase.rpc(fn, args)
    setBusy(false)
    if (error) {
      setError(error.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setDone({ reference: (data as any).reference, id: (data as any).id })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (done) {
    return (
      <div style={{ marginTop: 24, background: '#fff', border: '1px solid #cfe8dd', borderRadius: 18,
        padding: '44px 32px', textAlign: 'center', boxShadow: '0 8px 28px rgba(18,51,95,0.08)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e6f4ee', margin: '0 auto 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2f7f7a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-10" />
          </svg>
        </div>
        <h2 style={{ margin: 0, fontSize: 24, color: '#12335f' }}>Booking saved</h2>
        <p style={{ color: '#6b7c93', margin: '8px 0 18px' }}>Booking reference</p>
        <div style={{ display: 'inline-block', fontSize: 34, fontWeight: 800, letterSpacing: '0.12em',
          color: '#12335f', background: '#f4f7fb', border: '1px dashed #b8c6d8', borderRadius: 12, padding: '10px 28px' }}>
          {done.reference}
        </div>
        <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={`/office/b/${item.kind}/${done.id}/voucher`} style={{ padding: '12px 24px', borderRadius: 10, background: '#12335f',
            color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>Open voucher</Link>
          <Link href={`/office/b/${item.kind}/${done.id}`} style={{ padding: '12px 24px', borderRadius: 10, background: '#fff',
            color: '#12335f', border: '1px solid #d5dde8', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>View booking</Link>
          <Link href="/office/booking" style={{ padding: '12px 24px', borderRadius: 10, background: '#2f7f7a',
            color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>New booking</Link>
          <Link href="/office" style={{ padding: '12px 24px', borderRadius: 10, background: '#fff',
            color: '#12335f', border: '1px solid #d5dde8', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <style>{`
        .f-head { margin: 18px 0 22px; }
        .f-head h1 { margin: 0; font-size: 24px; font-weight: 800; color: #12335f; }
        .f-head p { margin: 6px 0 0; color: #6b7c93; font-size: 14px; }
        .f-layout { display: grid; grid-template-columns: 1fr 330px; gap: 24px; align-items: start; }
        .f-card { background: #fff; border: 1px solid #e3e9f1; border-radius: 16px; padding: 24px; margin-bottom: 20px;
          box-shadow: 0 3px 14px rgba(18,51,95,0.05); }
        .f-card h3 { margin: 0 0 16px; font-size: 16px; font-weight: 800; color: #12335f; }
        .f-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .f-lab { display: block; font-size: 12px; font-weight: 700; color: #4b5f7a; margin-bottom: 6px; }
        .f-in { width: 100%; height: 44px; padding: 0 12px; border: 1px solid #d5dde8; border-radius: 9px; font-size: 14px;
          font-family: inherit; color: #12335f; background: #fff; }
        .f-in:focus { outline: none; border-color: #2f7f7a; box-shadow: 0 0 0 3px rgba(47,127,122,0.12); }
        textarea.f-in { height: 80px; padding: 10px 12px; resize: vertical; }
        .f-seg { display: flex; gap: 8px; flex-wrap: wrap; }
        .f-opt { padding: 10px 18px; border-radius: 9px; border: 1px solid #d5dde8; background: #fff; color: #4b5f7a;
          font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .f-opt.on { background: #12335f; color: #fff; border-color: #12335f; }
        .f-btn { padding: 11px 20px; border-radius: 9px; border: none; background: #2f7f7a; color: #fff; font-weight: 700;
          font-size: 13.5px; cursor: pointer; font-family: inherit; }
        .f-btn.ghost { background: #fff; color: #12335f; border: 1px solid #d5dde8; }
        .f-btn.red { background: #fff; color: #b3261e; border: 1px solid #f0c9c6; }
        .f-pax { border: 1px solid #e3e9f1; border-radius: 12px; padding: 18px; margin-bottom: 14px; background: #fbfcfe; }
        .f-pax-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .f-pax-top b { color: #12335f; font-size: 14px; }
        .f-res { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border: 1px solid #e3e9f1;
          border-radius: 9px; margin-top: 8px; background: #fff; font-size: 14px; }
        .f-side { position: sticky; top: 92px; }
        .f-sum { background: #fff; border: 1px solid #e3e9f1; border-top: 4px solid #d9a441; border-radius: 16px; padding: 24px;
          box-shadow: 0 6px 22px rgba(18,51,95,0.08); }
        .f-sum h3 { margin: 0 0 14px; font-size: 16px; color: #12335f; }
        .f-line { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13.5px; color: #4b5f7a; border-bottom: 1px solid #eef2f7; }
        .f-total { display: flex; justify-content: space-between; align-items: baseline; margin: 16px 0; color: #12335f; }
        .f-total b { font-size: 24px; }
        .f-submit { width: 100%; height: 52px; border: none; border-radius: 11px; background: #12335f; color: #fff; font-size: 15px;
          font-weight: 800; cursor: pointer; font-family: inherit; }
        .f-submit:disabled { opacity: 0.6; cursor: default; }
        .f-err { background: #fdecea; border: 1px solid #f0c9c6; color: #b3261e; padding: 12px 16px; border-radius: 10px;
          font-size: 13.5px; font-weight: 600; margin-bottom: 18px; }
        .f-warn { background: #fff4de; border: 1px solid #f0dca8; color: #8a6414; padding: 10px 14px; border-radius: 9px;
          font-size: 13px; font-weight: 600; margin-top: 12px; }
        .f-note { font-size: 12.5px; color: #6b7c93; margin: 10px 0 0; line-height: 1.5; }
        @media (max-width: 900px) {
          .f-layout { grid-template-columns: 1fr; }
          .f-grid { grid-template-columns: 1fr 1fr; }
          .f-side { position: static; }
        }
        @media (max-width: 560px) { .f-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="f-head">
        <h1>{item.title}</h1>
        <p>{item.subtitle} · Departs {item.departure} · {item.seats} seats left</p>
      </div>

      {error && <div className="f-err">{error}</div>}

      <div className="f-layout">
        <div>
          <div className="f-card">
            <h3>1. Customer</h3>
            <div className="f-seg">
              <button type="button" className={'f-opt' + (custMode === 'walkin' ? ' on' : '')}
                onClick={() => { setCustMode('walkin'); setCustomer(null) }}>Walk-in (no account)</button>
              <button type="button" className={'f-opt' + (custMode === 'existing' ? ' on' : '')}
                onClick={() => setCustMode('existing')}>Existing customer</button>
            </div>

            {custMode === 'existing' && (
              <div style={{ marginTop: 16 }}>
                {customer ? (
                  <div className="f-res" style={{ background: '#eef7f3', borderColor: '#cfe8dd' }}>
                    <span><b>{customer.out_full_name}</b> · {customer.out_customer_code} · {customer.out_phone}</span>
                    <button type="button" className="f-btn ghost" onClick={() => setCustomer(null)}>Change</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input className="f-in" placeholder="Search by name, phone or customer code"
                        value={query} onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchCustomers() } }} />
                      <button type="button" className="f-btn" onClick={searchCustomers}>Search</button>
                    </div>
                    {searchMsg && <p className="f-note">{searchMsg}</p>}
                    {results.map((r) => (
                      <div className="f-res" key={r.out_id}>
                        <span><b>{r.out_full_name}</b> · {r.out_customer_code} · {r.out_phone}</span>
                        <button type="button" className="f-btn" onClick={() => setCustomer(r)}>Select</button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="f-card">
            <h3>2. Passengers ({passengers.length} of 9)</h3>
            {passengers.map((p, i) => (
              <div className="f-pax" key={i}>
                <div className="f-pax-top">
                  <b>Passenger {i + 1}</b>
                  {passengers.length > 1 && (
                    <button type="button" className="f-btn red"
                      onClick={() => setPassengers((l) => l.filter((_, idx) => idx !== i))}>Remove</button>
                  )}
                </div>
                <div className="f-grid">
                  <div>
                    <label className="f-lab">Title</label>
                    <select className="f-in" value={p.title} onChange={(e) => updatePassenger(i, 'title', e.target.value)}>
                      {TITLES.map((t) => <option key={t} value={t}>{t === 'CHD' ? 'CHD (Child)' : t === 'INF' ? 'INF (Infant)' : t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="f-lab">Given name</label>
                    <input className="f-in" value={p.given_name} onChange={(e) => updatePassenger(i, 'given_name', e.target.value)} />
                  </div>
                  <div>
                    <label className="f-lab">Surname</label>
                    <input className="f-in" value={p.surname} onChange={(e) => updatePassenger(i, 'surname', e.target.value)} />
                  </div>
                  <div>
                    <label className="f-lab">Date of birth</label>
                    <input type="date" className="f-in" value={p.date_of_birth} onChange={(e) => updatePassenger(i, 'date_of_birth', e.target.value)} />
                  </div>
                  <div>
                    <label className="f-lab">Nationality</label>
                    <input className="f-in" value={p.nationality} onChange={(e) => updatePassenger(i, 'nationality', e.target.value)} />
                  </div>
                  <div>
                    <label className="f-lab">Passport number</label>
                    <input className="f-in" value={p.passport_number} onChange={(e) => updatePassenger(i, 'passport_number', e.target.value)} />
                  </div>
                  <div>
                    <label className="f-lab">Passport issue date</label>
                    <input type="date" className="f-in" value={p.passport_issue_date} onChange={(e) => updatePassenger(i, 'passport_issue_date', e.target.value)} />
                  </div>
                  <div>
                    <label className="f-lab">Passport expiry date</label>
                    <input type="date" className="f-in" value={p.passport_expiry_date} onChange={(e) => updatePassenger(i, 'passport_expiry_date', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            {passengers.length < 9 && (
              <button type="button" className="f-btn ghost" onClick={() => setPassengers((l) => [...l, blank()])}>
                + Add passenger
              </button>
            )}
            <p className="f-note">Passport must be valid at least 6 months after departure. At least one adult is needed, and infants cannot outnumber adults.</p>
          </div>

          <div className="f-card">
            <h3>3. Payment</h3>
            <div className="f-seg">
              {payTypes.map((t) => (
                <button key={t} type="button" className={'f-opt' + (payType === t ? ' on' : '')}
                  onClick={() => setPayType(t)}>{t}</button>
              ))}
            </div>

            {(payType === 'Paid in full' || payType === 'Partial') && (
              <div className="f-grid" style={{ marginTop: 16 }}>
                <div>
                  <label className="f-lab">Payment method</label>
                  <select className="f-in" value={method} onChange={(e) => setMethod(e.target.value)}>
                    {METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                {payType === 'Partial' && (
                  <>
                    <div>
                      <label className="f-lab">Deposit paid now (PKR)</label>
                      <input type="number" className="f-in" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
                    </div>
                    <div>
                      <label className="f-lab">Balance due date</label>
                      <input type="date" className="f-in" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
            )}

            {payType === 'Partial' && deposit && Number(deposit) > 0 && Number(deposit) < total && (
              <p className="f-note">Balance remaining: <b>{fmt(total - Number(deposit))}</b></p>
            )}

            {payType === 'Pay Later' && (
              <div style={{ marginTop: 16 }}>
                <label className="f-lab">Hold seats until</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input type="datetime-local" className="f-in" style={{ maxWidth: 260 }}
                    value={holdUntil} onChange={(e) => setHoldUntil(e.target.value)} />
                  <button type="button" className="f-btn ghost" onClick={() => setHoldHours(12)}>+12 hours</button>
                  <button type="button" className="f-btn ghost" onClick={() => setHoldHours(24)}>+24 hours</button>
                  <button type="button" className="f-btn ghost" onClick={() => setHoldHours(48)}>+48 hours</button>
                </div>
                {holdUntil && holdDays > 3 && (
                  <div className="f-warn">This holds seats for {holdDays} days. Check the date is correct.</div>
                )}
                <p className="f-note">Seats return to the public site automatically when this time passes.</p>
              </div>
            )}

            {payType === 'FOC' && (
              <div style={{ marginTop: 16 }}>
                <label className="f-lab">Reason for FOC (required)</label>
                <input className="f-in" placeholder="e.g. Tour leader, Owner's guest"
                  value={focReason} onChange={(e) => setFocReason(e.target.value)} />
              </div>
            )}
          </div>

          <div className="f-card">
            <h3>4. Remarks</h3>
            <textarea className="f-in" placeholder="e.g. C/O Mohib 0300-1234567"
              value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        </div>

        <div className="f-side">
          <div className="f-sum">
            <h3>Booking summary</h3>
            {item.kind === 'ticket' ? (
              <>
                <div className="f-line"><span>{adults} × Adult</span><b>{fmt(adults * item.price)}</b></div>
                {children > 0 && <div className="f-line"><span>{children} × Child</span><b>{fmt(children * item.childPrice)}</b></div>}
                {infants > 0 && <div className="f-line"><span>{infants} × Infant</span><b>{fmt(infants * item.infantPrice)}</b></div>}
              </>
            ) : (
              <>
                <div className="f-line"><span>{seatsNeeded} × Passenger</span><b>{fmt(seatsNeeded * item.price)}</b></div>
                {infants > 0 && <div className="f-line"><span>{infants} × Infant</span><b>{fmt(infants * item.infantPrice)}</b></div>}
              </>
            )}
            <div className="f-line"><span>Seats needed</span><b>{seatsNeeded}</b></div>
            <div className="f-total">
              <span>Total</span>
              <b>{fmt(shownTotal)}</b>
            </div>
            {payType === 'FOC' && <p className="f-note" style={{ marginTop: 0 }}>FOC: nothing to pay.</p>}
            <button type="button" className="f-submit" disabled={busy} onClick={submit}>
              {busy ? 'Saving...' : 'Save booking'}
            </button>
            <p className="f-note">The reference is created as soon as you save.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Initial = {
  entry_date?: string
  description?: string
  pnr_voucher_no?: string | null
  type?: string
  seats?: number | null
  price_per_seat?: number | null
  currency?: string | null
  roe?: number | null
  amount?: number
  payment_method?: string | null
}

type Result = { ok: boolean; message: string }

export default function EntryForm({
  airlineId,
  ledgerId,
  entryId,
  action,
  initial,
  submitLabel,
  backHref,
}: {
  airlineId: string
  ledgerId: string
  entryId?: string
  action: (formData: FormData) => Promise<Result>
  initial?: Initial
  submitLabel: string
  backHref?: string
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [currency, setCurrency] = useState(initial?.currency || 'PKR')
  const [seats, setSeats] = useState(initial?.seats != null ? String(initial.seats) : '')
  const [pricePerSeat, setPricePerSeat] = useState(initial?.price_per_seat != null ? String(initial.price_per_seat) : '')
  const [roe, setRoe] = useState(initial?.roe != null ? String(initial.roe) : '')
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '')

  const recalc = (s: string, p: string, r: string, cur: string) => {
    const sNum = Number(s)
    const pNum = Number(p)
    if (!sNum || !pNum) return
    let total = sNum * pNum
    if (cur !== 'PKR') {
      const rNum = Number(r)
      if (!rNum) return
      total = total * rNum
    }
    setAmount((Math.round(total * 100) / 100).toString())
  }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    start(async () => {
      try {
        const r = await action(fd)
        if (!r.ok) {
          setMsg({ ok: false, text: r.message })
          return
        }
        if (entryId) {
          router.push(backHref || '/admin/airlines/ledgers')
          router.refresh()
          return
        }
        setMsg({ ok: true, text: r.message })
        formRef.current?.reset()
        setCurrency('PKR')
        setSeats('')
        setPricePerSeat('')
        setRoe('')
        setAmount('')
        router.refresh()
      } catch {
        setMsg({ ok: false, text: 'The entry could not be saved. Please check your connection and try again.' })
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={submit}>
      <input type="hidden" name="airlineId" value={airlineId} />
      <input type="hidden" name="ledgerId" value={ledgerId} />
      {entryId && <input type="hidden" name="entryId" value={entryId} />}

      {msg && (
        <div
          style={{
            padding: '11px 15px',
            borderRadius: 9,
            fontSize: 13.5,
            fontWeight: 600,
            marginBottom: 14,
            lineHeight: 1.5,
            background: msg.ok ? 'rgba(95,224,160,0.1)' : 'rgba(255,143,138,0.1)',
            border: '1px solid ' + (msg.ok ? 'rgba(95,224,160,0.3)' : 'rgba(255,143,138,0.3)'),
            color: msg.ok ? '#5FE0A0' : '#ff8f8a',
          }}
        >
          {msg.text}
        </div>
      )}

      <div className="add-grid">
        <div className="add-field">
          <label>Date</label>
          <input
            type="date"
            name="entry_date"
            required
            defaultValue={initial?.entry_date ? String(initial.entry_date).slice(0, 10) : undefined}
            className="add-input"
          />
        </div>

        <div className="add-field">
          <label>Type</label>
          <select name="type" required defaultValue={initial?.type || 'debit'} className="add-input">
            <option value="debit">Debit — increases balance</option>
            <option value="credit">Credit — payment made</option>
          </select>
        </div>

        <div className="add-field wide">
          <label>Description</label>
          <input
            type="text"
            name="description"
            required
            maxLength={300}
            defaultValue={initial?.description}
            className="add-input"
            placeholder="e.g. Seats for PK-305"
          />
        </div>

        <div className="add-field">
          <label>PNR / Voucher No.</label>
          <input type="text" name="pnr_voucher_no" maxLength={60} defaultValue={initial?.pnr_voucher_no || ''} className="add-input" />
        </div>

        <div className="add-field">
          <label>Currency</label>
          <select
            name="currency"
            className="add-input"
            value={currency}
            onChange={(e) => {
              const v = e.target.value
              setCurrency(v)
              recalc(seats, pricePerSeat, roe, v)
            }}
          >
            <option value="PKR">PKR</option>
            <option value="USD">USD</option>
            <option value="SAR">SAR</option>
          </select>
        </div>

        {currency !== 'PKR' && (
          <div className="add-field">
            <label>Rate of Exchange (ROE)</label>
            <input
              type="number"
              name="roe"
              min="0"
              step="0.0001"
              className="add-input"
              placeholder="e.g. 278.50"
              value={roe}
              onChange={(e) => {
                const v = e.target.value
                setRoe(v)
                recalc(seats, pricePerSeat, v, currency)
              }}
            />
          </div>
        )}

        <div className="add-field">
          <label>Seats</label>
          <input
            type="number"
            name="seats"
            min="0"
            step="1"
            className="add-input"
            value={seats}
            onChange={(e) => {
              const v = e.target.value
              setSeats(v)
              recalc(v, pricePerSeat, roe, currency)
            }}
          />
        </div>

        <div className="add-field">
          <label>Price per Seat ({currency})</label>
          <input
            type="number"
            name="price_per_seat"
            min="0"
            step="0.01"
            className="add-input"
            value={pricePerSeat}
            onChange={(e) => {
              const v = e.target.value
              setPricePerSeat(v)
              recalc(seats, v, roe, currency)
            }}
          />
        </div>

        <div className="add-field">
          <label>Amount (PKR, total)</label>
          <input
            type="number"
            name="amount"
            min="0.01"
            step="0.01"
            required
            className="add-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="add-field">
          <label>Payment Method</label>
          <input
            type="text"
            name="payment_method"
            maxLength={60}
            defaultValue={initial?.payment_method || ''}
            className="add-input"
            placeholder="e.g. Bank Transfer"
          />
        </div>
      </div>

      <button type="submit" className="add-btn" disabled={pending}>
        {pending ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}

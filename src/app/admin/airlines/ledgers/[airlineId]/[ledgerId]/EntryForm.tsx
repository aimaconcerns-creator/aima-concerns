'use client'

import { useState } from 'react'

type Initial = {
  entry_date?: string
  description?: string
  pnr_voucher_no?: string
  type?: string
  seats?: number | null
  price_per_seat?: number | null
  currency?: string
  roe?: number | null
  amount?: number
  payment_method?: string
}

export default function EntryForm({
  airlineId,
  ledgerId,
  entryId,
  action,
  initial,
  submitLabel,
}: {
  airlineId: string
  ledgerId: string
  entryId?: string
  action: (formData: FormData) => void
  initial?: Initial
  submitLabel: string
}) {
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
    if (cur === 'USD') {
      const rNum = Number(r)
      if (!rNum) return
      total = total * rNum
    }
    setAmount((Math.round(total * 100) / 100).toString())
  }

  return (
    <form action={action}>
      <input type="hidden" name="airlineId" value={airlineId} />
      <input type="hidden" name="ledgerId" value={ledgerId} />
      {entryId && <input type="hidden" name="entryId" value={entryId} />}

      <div className="add-grid">
        <div className="add-field">
          <label>Date</label>
          <input type="date" name="entry_date" required defaultValue={initial?.entry_date} className="add-input" />
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
          <input type="text" name="description" required defaultValue={initial?.description} className="add-input" placeholder="e.g. Seats for PK-305" />
        </div>

        <div className="add-field">
          <label>PNR / Voucher No.</label>
          <input type="text" name="pnr_voucher_no" defaultValue={initial?.pnr_voucher_no} className="add-input" />
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
          </select>
        </div>

        {currency === 'USD' && (
          <div className="add-field">
            <label>Rate of Exchange (ROE)</label>
            <input
              type="number"
              name="roe"
              min="0"
              step="0.01"
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
            min="1"
            step="0.01"
            required
            className="add-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="add-field">
          <label>Payment Method</label>
          <input type="text" name="payment_method" defaultValue={initial?.payment_method} className="add-input" placeholder="e.g. Bank Transfer" />
        </div>
      </div>

      <button type="submit" className="add-btn">{submitLabel}</button>
    </form>
  )
}
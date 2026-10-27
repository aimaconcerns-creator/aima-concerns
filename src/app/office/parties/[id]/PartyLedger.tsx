'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import PrintButton from '@/app/office/PrintButton'

type Row = {
  id: string
  kind: 'passenger' | 'payment'
  date: string
  dateLabel: string
  particulars: string
  debit: number
  credit: number
  method: string | null
  note: string | null
  by: string | null
  balance: number
  cancelled: boolean
}

type Props = {
  party: { id: string; name: string; note: string | null }
  rows: Row[]
  received: number
  remaining: number
  preparedBy: string
  today: string
  todayLabel: string
}

type Pick = { on: boolean; amount: string }

const METHODS = ['Cash', 'Bank Transfer', 'Easypaisa', 'JazzCash']
const n0 = (n: number) => Number(n || 0).toLocaleString('en-US')
const bal = (n: number) => (n < 0 ? `(${n0(-n)})` : n0(n))
const keyOf = (h: any) => `${h.out_kind}:${h.out_passenger_id}`
const isAvailable = (h: any) => {
  if (h.out_in_party) return false
  if (h.out_status === 'Paid' || h.out_status === 'Partial') return true
  if (h.out_status === 'Unpaid') return new Date(h.out_expires_at).getTime() > Date.now()
  return false
}

const css = `
.pl-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px}
.pl-acts{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.pl-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;align-items:end}
.pl-hit{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid #e3e9f1;border-radius:10px;margin-top:8px;background:#fff;flex-wrap:wrap}
.pl-hit.off{opacity:.55}
.pl-hit .who{flex:1;min-width:220px;font-size:13.5px;color:#12335f}
.pl-hit .who small{display:block;color:#6b7c93;font-size:12px;margin-top:2px}
.pl-hit input.in{width:130px;height:36px}
.lnk{background:none;border:none;color:#2f7f7a;font-weight:700;cursor:pointer;font-size:12.5px;padding:0;margin-right:10px;font-family:inherit}
.lnk.red{color:#b3261e}
.sheet{background:#fff;color:#000;max-width:860px;margin:0 auto;padding:28px 32px 20px;border:1px solid #e3e9f1;border-radius:6px}
.sheet .mh{display:flex;justify-content:space-between;align-items:center;gap:16px;border-bottom:2px solid #000;padding-bottom:12px}
.sheet .brand{display:flex;align-items:center;gap:12px}
.sheet .brand img{height:46px;width:auto}
.sheet .brand b{display:block;font-size:17px;letter-spacing:.08em}
.sheet .brand span{display:block;font-size:11px;margin-top:2px}
.sheet .brand > div{min-width:0}
.sheet .brand .ct{display:block;font-size:10.5px;margin-top:1px;color:#000}
.sheet .doc{font-size:20px;font-weight:800;letter-spacing:.08em;text-align:right}
.sheet .subj{margin-top:14px;font-size:15px}
.sheet .meta{margin:4px 0 12px;font-size:13px}
.sheet .prep{margin-top:14px;font-size:12px;color:#333}
table.pt{width:100%;border-collapse:collapse;table-layout:fixed;font-size:13px;font-variant-numeric:tabular-nums;margin-top:10px}
table.pt th{text-align:left;font-size:11px;letter-spacing:.05em;text-transform:uppercase;padding:8px;border-top:1px solid #000;border-bottom:1px solid #000;font-weight:700;vertical-align:bottom}
table.pt th small{display:block;font-weight:400;text-transform:none;letter-spacing:0;font-size:10px;margin-top:1px}
table.pt td{padding:7px 8px;border-bottom:1px solid #bbb;vertical-align:top;overflow-wrap:anywhere}
table.pt .r{text-align:right}
table.pt td.nw{white-space:nowrap;overflow-wrap:normal}
table.pt .sm{font-size:10.5px;color:#666;margin-top:2px}
table.pt tr.sp td{border:none;padding:0;height:0}
table.pt tr.tt td{font-weight:800;font-size:14px;border-bottom:none;padding:7px 8px}
table.pt tr.tt.f td{border-top:1px solid #000;padding-top:10px}
table.pt tr.tt.l td{border-bottom:1px solid #000}
table.pt td.none{text-align:center;color:#555;padding:24px}
table.pt tr.er td{background:#f4f7fb}
@page{size:A4 portrait;margin:0}
@media print{
  .sheet{border:none;border-radius:0;max-width:none;margin:0;padding:8mm 12mm 8mm}
  table.pt{font-size:12px}
  table.pt tr.sp td{height:8mm}
  table.pt tr{break-inside:avoid}
}
`

export default function PartyLedger(props: Props) {
  const { party, rows, received, remaining, preparedBy, today, todayLabel } = props
  const router = useRouter()
  const supabase = createClient()

  const [panel, setPanel] = useState<'' | 'pax' | 'pay'>('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const [payDate, setPayDate] = useState(today)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('Cash')
  const [payNote, setPayNote] = useState('')

  const [q, setQ] = useState('')
  const [hits, setHits] = useState<any[]>([])
  const [searched, setSearched] = useState(false)
  const [picked, setPicked] = useState<Record<string, Pick>>({})

  const [editId, setEditId] = useState<string | null>(null)
  const [eDate, setEDate] = useState('')
  const [eText, setEText] = useState('')
  const [eAmount, setEAmount] = useState('')
  const [eMethod, setEMethod] = useState('Cash')
  const [eNote, setENote] = useState('')

  const [renaming, setRenaming] = useState(false)
  const [rName, setRName] = useState(party.name)
  const [rNote, setRNote] = useState(party.note || '')

  const run = async (fn: string, args: any, okText: string): Promise<boolean> => {
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

  const addPayment = async () => {
    const amt = Number(payAmount)
    if (!amt || amt <= 0) {
      setMsg({ ok: false, text: 'Enter an amount above zero.' })
      return
    }
    const ok = await run('add_party_payment', {
      p_party_id: party.id, p_date: payDate || today, p_amount: amt,
      p_method: payMethod, p_note: payNote.trim() || null,
    }, 'Payment added.')
    if (ok) {
      setPayAmount('')
      setPayNote('')
      setPanel('')
    }
  }

  const search = async () => {
    setMsg(null)
    if (q.trim().length < 3) {
      setMsg({ ok: false, text: 'Type at least 3 characters of a name, passport number or reference.' })
      return
    }
    setBusy(true)
    const { data, error } = await supabase.rpc('search_passengers', { p_query: q.trim() })
    setBusy(false)
    if (error) {
      setMsg({ ok: false, text: error.message })
      return
    }
    const list: any[] = data || []
    const next: Record<string, Pick> = {}
    list.forEach((h) => {
      next[keyOf(h)] = { on: false, amount: String(h.out_amount ?? 0) }
    })
    setHits(list)
    setPicked(next)
    setSearched(true)
  }

  const selectAll = () => {
    setPicked((p) => {
      const next: Record<string, Pick> = { ...p }
      hits.forEach((h) => {
        if (isAvailable(h)) next[keyOf(h)] = { ...next[keyOf(h)], on: true }
      })
      return next
    })
  }

  const chosen = hits.filter((h) => picked[keyOf(h)] && picked[keyOf(h)].on)

  const addSelected = async () => {
    if (!chosen.length) {
      setMsg({ ok: false, text: 'Tick at least one passenger.' })
      return
    }
    const items = chosen.map((h) => ({
      kind: h.out_kind,
      passenger_id: h.out_passenger_id,
      amount: Number(picked[keyOf(h)].amount),
    }))
    if (items.some((i) => isNaN(i.amount) || i.amount < 0)) {
      setMsg({ ok: false, text: 'Check the amounts. They cannot be negative.' })
      return
    }
    const ok = await run('add_party_passengers', { p_party_id: party.id, p_items: items },
      `${items.length} passenger(s) added to ${party.name}.`)
    if (ok) {
      setHits([])
      setPicked({})
      setSearched(false)
      setQ('')
    }
  }

  const startEdit = (r: Row) => {
    setEditId(r.id)
    setEDate(r.date)
    setEText(r.particulars)
    setEAmount(String(r.kind === 'passenger' ? r.debit : r.credit))
    setEMethod(r.method || 'Cash')
    setENote(r.note || '')
    setMsg(null)
  }

  const saveEdit = async (r: Row) => {
    const amt = Number(eAmount)
    if (isNaN(amt) || amt < 0) {
      setMsg({ ok: false, text: 'Enter a valid amount.' })
      return
    }
    const ok = await run('update_party_entry', {
      p_entry_id: r.id, p_date: eDate || null, p_particulars: eText, p_amount: amt,
      p_method: r.kind === 'payment' ? eMethod : null, p_note: eNote.trim() || null,
    }, 'Entry updated.')
    if (ok) setEditId(null)
  }

  const remove = async (r: Row) => {
    if (!window.confirm('Delete this line from the ledger? The booking itself is not touched.')) return
    await run('delete_party_entry', { p_entry_id: r.id }, 'Entry deleted.')
  }

  const saveRename = async () => {
    const ok = await run('rename_party', { p_party_id: party.id, p_name: rName, p_note: rNote.trim() || null }, 'Party updated.')
    if (ok) setRenaming(false)
  }

  return (
    <div>
      <style>{css}</style>

      <div className="pl-top no-print">
        <Link href="/office/parties" style={{ color: '#2f7f7a', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
          ← All parties
        </Link>
        <div className="pl-acts">
          <button className={'btn' + (panel === 'pax' ? ' navy' : '')} onClick={() => setPanel(panel === 'pax' ? '' : 'pax')}>
            Add passengers
          </button>
          <button className={'btn' + (panel === 'pay' ? ' navy' : '')} onClick={() => setPanel(panel === 'pay' ? '' : 'pay')}>
            Add payment
          </button>
          <button className="btn ghost" onClick={() => setRenaming(!renaming)}>Rename party</button>
          <PrintButton label="Print ledger" />
        </div>
      </div>

      {msg && <div className={'msg no-print ' + (msg.ok ? 'ok' : 'bad')}>{msg.text}</div>}

      {renaming && (
        <div className="card no-print">
          <h3>Rename party</h3>
          <div className="pl-grid">
            <div><label className="lab">Party name</label><input className="in" value={rName} onChange={(e) => setRName(e.target.value)} /></div>
            <div><label className="lab">Note (optional)</label><input className="in" value={rNote} onChange={(e) => setRNote(e.target.value)} /></div>
            <div><button className="btn" disabled={busy} onClick={saveRename}>Save</button></div>
          </div>
        </div>
      )}

      {panel === 'pay' && (
        <div className="card no-print">
          <h3>Add a payment received from {party.name}</h3>
          <div className="pl-grid">
            <div><label className="lab">Date</label><input type="date" className="in" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></div>
            <div><label className="lab">Amount (PKR)</label><input type="number" className="in" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></div>
            <div>
              <label className="lab">Method</label>
              <select className="in" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                {METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div><label className="lab">Note (optional)</label><input className="in" value={payNote} onChange={(e) => setPayNote(e.target.value)} /></div>
            <div><button className="btn" disabled={busy} onClick={addPayment}>{busy ? 'Saving...' : 'Save payment'}</button></div>
          </div>
          <p className="note">If this is more than the party owes, the extra shows as a credit in TOTAL REMAINING.</p>
        </div>
      )}

      {panel === 'pax' && (
        <div className="card no-print">
          <h3>Add passengers to {party.name}</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input className="in" style={{ flex: 1, minWidth: 240 }} value={q}
              placeholder="Search by passenger name, passport number or booking reference"
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search() } }} />
            <button className="btn" disabled={busy} onClick={search}>Search</button>
          </div>

          {searched && hits.length === 0 && <p className="note">No passenger found.</p>}

          {hits.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn ghost" onClick={selectAll}>Tick all available</button>
              <span className="note" style={{ margin: 0 }}>The amount is the fare on the booking. You can change it before adding.</span>
            </div>
          )}

          {hits.map((h) => {
            const k = keyOf(h)
            const ok = isAvailable(h)
            const st = picked[k]
            return (
              <div className={'pl-hit' + (ok ? '' : ' off')} key={k}>
                <input type="checkbox" disabled={!ok} checked={!!(st && st.on)}
                  onChange={(e) => setPicked((p) => ({ ...p, [k]: { ...p[k], on: e.target.checked } }))} />
                <div className="who">
                  <b>{h.out_title} {h.out_given_name} {h.out_surname}</b> · {h.out_reference}
                  <small>
                    {h.out_what} · {h.out_passport} · {h.out_status}
                    {h.out_in_party ? ` · already on party ${h.out_in_party}` : ''}
                  </small>
                </div>
                <input type="number" className="in" disabled={!ok} value={st ? st.amount : ''}
                  onChange={(e) => setPicked((p) => ({ ...p, [k]: { ...p[k], amount: e.target.value } }))} />
              </div>
            )
          })}

          {hits.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <button className="btn navy" disabled={busy || chosen.length === 0} onClick={addSelected}>
                {busy ? 'Adding...' : `Add selected (${chosen.length})`}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="sheet">
        <div className="mh">
          <div className="brand">
            <img src="/logo.png" alt="" />
            <div>
              <b>AIMA CONCERNS</b>
              <span>Travel &amp; Tours · Est. 1999</span>
              <span className="ct">Office 102 &amp; 103, Eden Heights, Jail Road, Lahore</span>
              <span className="ct">+92 322 4631622 · +92 332 7869765</span>
              <span className="ct">aimaconcerns@gmail.com · aimaconcerns.com</span>
            </div>
          </div>
          <div className="doc">PARTY LEDGER</div>
        </div>

        <div className="subj"><b>Party:</b> {party.name}</div>
        {party.note ? <div className="meta">{party.note}</div> : null}

        <table className="pt">
          <colgroup>
            <col style={{ width: '12%' }} />
            <col style={{ width: '38%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '14%' }} />
            <col className="no-print" style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr className="sp"><td colSpan={6}></td></tr>
            <tr>
              <th>Date</th>
              <th>Particulars</th>
              <th className="r">Debit<small>(PKR)</small></th>
              <th className="r">Credit<small>(PKR)</small></th>
              <th className="r">Balance<small>(PKR)</small></th>
              <th className="no-print"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="none">No entries yet. Add passengers or a payment above.</td></tr>
            )}

            {rows.map((r) =>
              editId === r.id ? (
                <tr key={r.id} className="no-print er">
                  <td><input type="date" className="in" value={eDate} onChange={(e) => setEDate(e.target.value)} /></td>
                  <td>
                    {r.kind === 'passenger' ? (
                      <input className="in" value={eText} onChange={(e) => setEText(e.target.value)} />
                    ) : (
                      <select className="in" value={eMethod} onChange={(e) => setEMethod(e.target.value)}>
                        {METHODS.map((m) => <option key={m}>{m}</option>)}
                      </select>
                    )}
                    <input className="in" style={{ marginTop: 6 }} placeholder="Note (optional)" value={eNote}
                      onChange={(e) => setENote(e.target.value)} />
                  </td>
                  <td>
                    {r.kind === 'passenger' ? (
                      <input type="number" className="in" value={eAmount} onChange={(e) => setEAmount(e.target.value)} />
                    ) : null}
                  </td>
                  <td>
                    {r.kind === 'payment' ? (
                      <input type="number" className="in" value={eAmount} onChange={(e) => setEAmount(e.target.value)} />
                    ) : null}
                  </td>
                  <td></td>
                  <td>
                    <button className="lnk" disabled={busy} onClick={() => saveEdit(r)}>Save</button>
                    <button className="lnk red" onClick={() => setEditId(null)}>Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={r.id}>
                  <td className="nw">{r.dateLabel}</td>
                  <td>
                    {r.particulars}
                    {r.note ? <div className="sm">{r.note}</div> : null}
                    {r.cancelled ? <div className="sm">Booking cancelled</div> : null}
                    {r.by ? <div className="sm no-print">by {r.by}</div> : null}
                  </td>
                  <td className="r">{r.kind === 'passenger' ? n0(r.debit) : ''}</td>
                  <td className="r">{r.kind === 'payment' ? n0(r.credit) : ''}</td>
                  <td className="r">{bal(r.balance)}</td>
                  <td className="no-print">
                    <button className="lnk" onClick={() => startEdit(r)}>Edit</button>
                    <button className="lnk red" onClick={() => remove(r)}>Delete</button>
                  </td>
                </tr>
              )
            )}

            {rows.length > 0 && (
              <>
                <tr className="tt f">
                  <td colSpan={3} className="r">TOTAL RECEIVED</td>
                  <td className="r">{n0(received)}</td>
                  <td></td>
                  <td className="no-print"></td>
                </tr>
                <tr className="tt l">
                  <td colSpan={4} className="r">TOTAL REMAINING</td>
                  <td className="r">{remaining < 0 ? `(${n0(-remaining)}) credit` : n0(remaining)}</td>
                  <td className="no-print"></td>
                </tr>
              </>
            )}
          </tbody>
          <tfoot>
            <tr className="sp"><td colSpan={6}></td></tr>
          </tfoot>
        </table>

        <div className="prep">Prepared by {preparedBy || '—'} · {todayLabel}</div>
      </div>
    </div>
  )
}

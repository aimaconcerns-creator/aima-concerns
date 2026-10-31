import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { dmy, pkt } from '@/app/office/lib'
import { addEntry } from './actions'
import EntryForm from './EntryForm'
import PrintButton from './PrintButton'
import DeleteEntryButton from './DeleteEntryButton'

export const dynamic = 'force-dynamic'

const n2 = (v: number) =>
  Number(Math.round(Number(v || 0) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })

const side = (b: number) => (b > 0.004 ? 'Dr' : b < -0.004 ? 'Cr' : '')

function seatText(e: any): { main: string; roe: string } | null {
  const hasSeats = e.seats !== null && e.seats !== undefined
  const hasPrice = e.price_per_seat !== null && e.price_per_seat !== undefined && Number(e.price_per_seat) > 0
  if (!hasSeats && !hasPrice) return null
  const cur = e.currency || 'PKR'
  const price = hasPrice ? `${cur !== 'PKR' ? cur + ' ' : ''}${n2(Number(e.price_per_seat))}` : ''
  const main =
    hasSeats && hasPrice
      ? `${e.seats} × ${price}`
      : hasSeats
      ? `${e.seats} seat${Number(e.seats) === 1 ? '' : 's'}`
      : price
  const roe = cur !== 'PKR' && e.roe ? `ROE ${Number(e.roe)}` : ''
  return { main, roe }
}

function describe(l: any): string {
  const d = l.details || {}
  const kind = (t: string) => (t === 'credit' ? 'Credit' : 'Debit')
  if (l.action === 'Entry added') {
    return `${kind(d.type)} ${n2(Number(d.amount))} · ${d.description || ''}${d.pnr ? ' · ' + d.pnr : ''}`
  }
  if (l.action === 'Entry deleted') {
    return `${kind(d.type)} ${n2(Number(d.amount))} · ${d.description || ''} · ${d.date || ''}${d.pnr ? ' · ' + d.pnr : ''}`
  }
  if (l.action === 'Entry edited') {
    const b = d.before || {}
    const a = d.after || {}
    const bits: string[] = []
    if (b.type !== a.type) bits.push(`type ${b.type} → ${a.type}`)
    if (Number(b.amount) !== Number(a.amount)) bits.push(`amount ${n2(Number(b.amount))} → ${n2(Number(a.amount))}`)
    if (b.description !== a.description) bits.push(`description "${b.description}" → "${a.description}"`)
    if (b.date !== a.date) bits.push(`date ${b.date} → ${a.date}`)
    if ((b.pnr || '') !== (a.pnr || '')) bits.push(`PNR/voucher ${b.pnr || '—'} → ${a.pnr || '—'}`)
    if ((b.method || '') !== (a.method || '')) bits.push(`method ${b.method || '—'} → ${a.method || '—'}`)
    if ((b.seats ?? null) !== (a.seats ?? null)) bits.push(`seats ${b.seats ?? '—'} → ${a.seats ?? '—'}`)
    if (Number(b.price || 0) !== Number(a.price || 0)) bits.push(`price ${b.price ?? '—'} → ${a.price ?? '—'}`)
    if ((b.currency || '') !== (a.currency || '')) bits.push(`currency ${b.currency || '—'} → ${a.currency || '—'}`)
    if (Number(b.roe || 0) !== Number(a.roe || 0)) bits.push(`ROE ${b.roe ?? '—'} → ${a.roe ?? '—'}`)
    return bits.length ? bits.join(' · ') : 'Saved with no visible change'
  }
  return ''
}

export default async function LedgerDetailPage({
  params,
}: {
  params: Promise<{ airlineId: string; ledgerId: string }>
}) {
  const { airlineId, ledgerId } = await params
  const supabase = await createClient()

  const { data: airline } = await supabase
    .from('airlines')
    .select('id, name, logo_url')
    .eq('id', airlineId)
    .single()

  const { data: ledger } = await supabase
    .from('airline_ledgers')
    .select('id, name, airline_id')
    .eq('id', ledgerId)
    .single()

  if (!airline || !ledger || ledger.airline_id !== airlineId) notFound()

  const { data: entries } = await supabase
    .from('airline_ledger_entries')
    .select('*')
    .eq('ledger_id', ledgerId)
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true })

  const { data: logRaw } = await supabase
    .from('airline_ledger_log')
    .select('*')
    .eq('ledger_id', ledgerId)
    .order('created_at', { ascending: false })
    .limit(100)
  const log: any[] = logRaw || []

  let preparedBy = ''
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: me } = await supabase.from('staff').select('full_name').eq('id', user.id).single()
    preparedBy = me?.full_name || ''
  }

  let running = 0
  let totalDr = 0
  let totalCr = 0
  const rows = (entries ?? []).map((e: any) => {
    const amt = Number(e.amount || 0)
    if (e.type === 'debit') {
      running += amt
      totalDr += amt
    } else {
      running -= amt
      totalCr += amt
    }
    return { ...e, balance_after: running }
  })
  const balance = Math.round(running * 100) / 100

  const todayIso = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })
  const todayLabel = dmy(todayIso)
  const period = rows.length
    ? rows[0].entry_date === rows[rows.length - 1].entry_date
      ? dmy(rows[0].entry_date)
      : `${dmy(rows[0].entry_date)} to ${dmy(rows[rows.length - 1].entry_date)}`
    : 'No entries yet'

  const statusText =
    balance > 0.004
      ? `balance payable to ${airline.name}`
      : balance < -0.004
      ? `excess payment held with ${airline.name} (credit balance)`
      : 'account settled'

  return (
    <div className="page">
      <style>{`
        .page { padding: 34px; }
        .back-link { color: #7d93a3; font-size: 13px; text-decoration: none; }
        .back-link:hover { color: #cfe0ea; }

        .bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin: 14px 0 20px; }
        .bar h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 800; }
        .bar p { color: #7d93a3; font-size: 14px; margin: 4px 0 0; }
        .bar-acts { display: flex; gap: 10px; flex-wrap: wrap; }
        .act-btn, .print-btn {
          padding: 10px 22px; background: rgba(217,164,65,0.18); color: #d9a441; border: 1px solid rgba(217,164,65,0.4);
          border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13.5px; font-family: inherit;
          text-decoration: none; display: inline-block;
        }

        .add-box {
          border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02);
          padding: 22px; margin: 0 0 26px; box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        .add-box h3 { color: #fff; margin: 0 0 16px; font-size: 15px; font-weight: 800; }

        .sheet { background: #fff; color: #000; max-width: 1100px; margin: 0 auto; padding: 28px 32px 22px; border: 1px solid #e3e9f1; border-radius: 6px; }
        .sheet .mh { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 2px solid #000; padding-bottom: 12px; }
        .sheet .brand { display: flex; align-items: center; gap: 12px; }
        .sheet .brand img { height: 50px; width: auto; }
        .sheet .brand > div { min-width: 0; }
        .sheet .brand b { display: block; font-size: 18px; letter-spacing: .08em; }
        .sheet .brand span { display: block; font-size: 11px; margin-top: 2px; }
        .sheet .brand .ct { display: block; font-size: 10.5px; margin-top: 1px; color: #000; }
        .sheet .doc { text-align: right; }
        .sheet .doc h2 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: .08em; }
        .sheet .doc small { display: block; font-size: 11px; margin-top: 4px; letter-spacing: .14em; text-transform: uppercase; color: #333; }

        .sheet .det { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #000; margin: 14px 0; }
        .sheet .det > div { padding: 7px 10px; border-right: 1px solid #000; border-bottom: 1px solid #000; font-size: 12.5px; }
        .sheet .det > div:nth-child(3n) { border-right: none; }
        .sheet .det > div:nth-last-child(-n+3) { border-bottom: none; }
        .sheet .det span { display: block; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #444; margin-bottom: 2px; }
        .sheet .det b { font-size: 13px; overflow-wrap: anywhere; }
        .sheet .det b.fl { display: flex; align-items: center; gap: 8px; }

        table.al { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12.5px; font-variant-numeric: tabular-nums; }
        table.al th { text-align: left; font-size: 10.5px; letter-spacing: .05em; text-transform: uppercase; padding: 8px; border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: 700; vertical-align: bottom; }
        table.al th small { display: block; font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 10px; margin-top: 1px; }
        table.al td { padding: 7px 8px; border-bottom: 1px solid #bbb; vertical-align: top; overflow-wrap: anywhere; }
        table.al .r { text-align: right; }
        table.al td.nw { white-space: nowrap; overflow-wrap: normal; }
        table.al .sm { font-size: 10.5px; color: #555; margin-top: 2px; }
        table.al tr.sp td { border: none; padding: 0; height: 0; }
        table.al tr.tt td { font-weight: 800; font-size: 13px; border-bottom: none; padding: 7px 8px; }
        table.al tr.tt.f td { border-top: 1px solid #000; padding-top: 10px; }
        table.al tr.tt.l td { border-bottom: 2px solid #000; }
        table.al td.none { text-align: center; color: #555; padding: 24px; }

        .lnk { background: none; border: none; color: #1a6b66; font-weight: 700; cursor: pointer; font-size: 12.5px; padding: 0; margin-right: 10px; font-family: inherit; text-decoration: none; }
        .lnk.red { color: #b3261e; }

        .stmt { margin-top: 14px; font-size: 13px; line-height: 1.6; }
        .sig { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 30px; }
        .sig .sg { display: flex; flex-direction: column; justify-content: flex-end; min-height: 46px; }
        .sig .nm { text-align: center; font-size: 12px; min-height: 16px; padding-bottom: 3px; }
        .sig .lb { border-top: 1px solid #000; padding-top: 4px; text-align: center; font-size: 11px; }
        .foot-n { margin-top: 18px; font-size: 10.5px; color: #333; line-height: 1.6; border-top: 1px solid #bbb; padding-top: 8px; }

        .hist { margin-top: 28px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); padding: 22px; box-shadow: 0 8px 24px rgba(0,0,0,0.35); }
        .hist h3 { color: #fff; margin: 0 0 6px; font-size: 15px; font-weight: 800; }
        .hist .hn { color: #7d93a3; font-size: 12.5px; margin: 0 0 14px; }
        .hist table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .hist th { text-align: left; padding: 10px 12px; color: #7d93a3; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .hist td { padding: 10px 12px; border-top: 1px solid rgba(255,255,255,0.06); color: #cfe0ea; vertical-align: top; }
        .hist .tw { overflow-x: auto; }

        @page { size: A4 landscape; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          .page { padding: 0; }
          .sheet { border: none; border-radius: 0; max-width: none; margin: 0; padding: 8mm 12mm 8mm; }
          table.al { font-size: 11.5px; }
          table.al tr.sp td { height: 8mm; }
          table.al tr { break-inside: avoid; }
          .sig, .stmt { break-inside: avoid; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <Link href={`/admin/airlines/ledgers/${airlineId}`} className="back-link no-print">
        ← Back to {airline.name} Ledgers
      </Link>

      <div className="bar no-print">
        <div>
          <h1>{ledger.name}</h1>
          <p>
            Closing balance:{' '}
            <strong style={{ color: balance > 0.004 ? '#ff8f8a' : balance < -0.004 ? '#5FE0A0' : '#a9bccb' }}>
              PKR {n2(Math.abs(balance))} {side(balance)}
            </strong>
          </p>
        </div>
        <div className="bar-acts">
          <a className="act-btn" href={`/admin/airlines/ledgers/${airlineId}/${ledgerId}/export`}>Export to Excel</a>
          <PrintButton />
        </div>
      </div>

      <div className="add-box no-print">
        <h3>Add Entry</h3>
        <EntryForm airlineId={airlineId} ledgerId={ledgerId} action={addEntry} submitLabel="Add Entry" />
      </div>

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
          <div className="doc">
            <h2>AIRLINE LEDGER</h2>
            <small>Statement of account</small>
          </div>
        </div>

        <div className="det">
          <div>
            <span>Airline</span>
            <b className="fl">
              {airline.logo_url ? (
                <img src={airline.logo_url} alt="" style={{ height: 22, width: 'auto', maxWidth: 60, objectFit: 'contain' }} />
              ) : null}
              {airline.name}
            </b>
          </div>
          <div><span>Ledger</span><b>{ledger.name}</b></div>
          <div><span>Statement date</span><b>{todayLabel}</b></div>
          <div><span>Period covered</span><b>{period}</b></div>
          <div><span>Currency</span><b>Pakistani Rupee (PKR)</b></div>
          <div><span>Number of entries</span><b>{rows.length}</b></div>
        </div>

        <table className="al">
          <colgroup>
            <col style={{ width: '9%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
            <col className="no-print" style={{ width: '7%' }} />
          </colgroup>
          <thead>
            <tr className="sp"><td colSpan={7}></td></tr>
            <tr>
              <th>Date</th>
              <th>Particulars</th>
              <th>PNR / Voucher No.</th>
              <th>Seats × Rate</th>
              <th className="r">Debit<small>(PKR)</small></th>
              <th className="r">Credit<small>(PKR)</small></th>
              <th className="r">Balance<small>(PKR)</small></th>
              <th className="no-print"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} className="none">No entries yet. Add the first one above.</td></tr>
            )}

            {rows.map((e: any) => {
              const st = seatText(e)
              const bal = Math.round(e.balance_after * 100) / 100
              const label = `${dmy(e.entry_date)} · ${e.description} · ${e.type === 'credit' ? 'Credit' : 'Debit'} ${n2(Number(e.amount))}`
              return (
                <tr key={e.id}>
                  <td className="nw">{dmy(e.entry_date)}</td>
                  <td>
                    {e.description}
                    {e.type === 'credit' && e.payment_method ? <div className="sm">Paid by {e.payment_method}</div> : null}
                    {e.created_by_name ? (
                      <div className="sm no-print">
                        Entered by {e.created_by_name}
                        {e.updated_by_name ? ` · edited by ${e.updated_by_name}` : ''}
                      </div>
                    ) : null}
                  </td>
                  <td className="nw">{e.pnr_voucher_no || '—'}</td>
                  <td>
                    {st ? (
                      <>
                        {st.main}
                        {st.roe ? <div className="sm">{st.roe}</div> : null}
                      </>
                    ) : '—'}
                  </td>
                  <td className="r">{e.type === 'debit' ? n2(Number(e.amount)) : ''}</td>
                  <td className="r">{e.type === 'credit' ? n2(Number(e.amount)) : ''}</td>
                  <td className="r">{n2(Math.abs(bal))} {side(bal)}</td>
                  <td className="no-print">
                    <Link href={`/admin/airlines/ledgers/${airlineId}/${ledgerId}/${e.id}/edit`} className="lnk">Edit</Link>
                    <DeleteEntryButton airlineId={airlineId} ledgerId={ledgerId} entryId={e.id} label={label} />
                  </td>
                </tr>
              )
            })}

            {rows.length > 0 && (
              <>
                <tr className="tt f">
                  <td colSpan={4} className="r">TOTAL</td>
                  <td className="r">{n2(totalDr)}</td>
                  <td className="r">{n2(totalCr)}</td>
                  <td></td>
                  <td className="no-print"></td>
                </tr>
                <tr className="tt l">
                  <td colSpan={6} className="r">CLOSING BALANCE</td>
                  <td className="r">{n2(Math.abs(balance))} {side(balance)}</td>
                  <td className="no-print"></td>
                </tr>
              </>
            )}
          </tbody>
          <tfoot>
            <tr className="sp"><td colSpan={7}></td></tr>
          </tfoot>
        </table>

        {rows.length > 0 && (
          <div className="stmt">
            <b>Statement of account:</b> as at {todayLabel}, the closing balance is{' '}
            <b>PKR {n2(Math.abs(balance))}{side(balance) ? ' ' + side(balance) : ''}</b>, being {statusText}.
          </div>
        )}

        <div className="sig">
          <div className="sg"><div className="nm">{preparedBy}</div><div className="lb">Prepared by</div></div>
          <div className="sg"><div className="nm"></div><div className="lb">Checked by</div></div>
          <div className="sg"><div className="nm"></div><div className="lb">Authorised signatory</div></div>
        </div>

        <div className="foot-n">
          Notes: (1) Debit entries record seats or services charged by the airline; credit entries record payments made
          by Aima Concerns. (2) A Dr balance is payable to the airline; a Cr balance is an excess payment held with the
          airline. (3) Amounts in foreign currency are converted to PKR at the rate of exchange (ROE) shown. (4) This
          statement is computer generated from the records of Aima Concerns Travel &amp; Tours. E. &amp; O. E.
        </div>
      </div>

      <div className="hist no-print">
        <h3>Change history</h3>
        <p className="hn">Every entry that is added, edited or deleted is recorded here with the staff member&apos;s name. Changes made before this was introduced are not listed.</p>
        {log.length ? (
          <div className="tw">
            <table>
              <thead>
                <tr><th>When (PKT)</th><th>Action</th><th>By</th><th>Details</th></tr>
              </thead>
              <tbody>
                {log.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{pkt(l.created_at)}</td>
                    <td>{l.action}</td>
                    <td>{l.done_by_name || '—'}</td>
                    <td>{describe(l)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="hn" style={{ margin: 0 }}>No changes have been recorded yet.</p>
        )}
      </div>
    </div>
  )
}

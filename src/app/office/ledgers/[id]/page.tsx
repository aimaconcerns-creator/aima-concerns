import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Badge, customerMap, fmt, officeCss, paidOf, payLabel } from '../../lib'
import PrintButton from '../../PrintButton'

export default async function LedgerDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  await supabase.rpc('expire_stale_bookings')

  const { data: p } = await supabase.from('packages').select('*').eq('id', id).single()
  if (!p) notFound()

  const { data: bk } = await supabase
    .from('bookings')
    .select('*')
    .eq('package_id', id)
    .in('status', ['Paid', 'Partial', 'Unpaid'])
    .order('created_at')
  const bookings = bk || []
  const ids = bookings.map((b: any) => b.id)

  let pax: any[] = []
  if (ids.length) {
    const { data: x } = await supabase.from('booking_passengers').select('*').in('booking_id', ids).order('created_at')
    pax = x || []
  }
  const cmap = await customerMap(supabase, bookings.map((b: any) => b.customer_id))

  let sumTotal = 0
  let sumPaid = 0
  const rows = bookings.map((b: any, i: number) => {
    const mine = pax.filter((x) => x.booking_id === b.id)
    const lead = mine[0]
    const total = Number(b.total_amount || 0)
    const paid = paidOf(b)
    sumTotal += total
    sumPaid += paid
    const cust = b.customer_id ? cmap.get(b.customer_id) : null
    return { i: i + 1, b, lead, count: mine.length, total, paid, pending: Math.max(0, total - paid), cust }
  })
  const sumPending = rows.reduce((a, r) => a + r.pending, 0)

  return (
    <div>
      <style>{officeCss}</style>
      <Link href="/office/ledgers" className="no-print"
        style={{ color: '#2f7f7a', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>← Back to ledgers</Link>

      <div className="pg-bar" style={{ marginTop: 14 }}>
        <div className="pg-h">
          <h1>{p.name} — Ledger</h1>
          <p>{p.package_type} · {p.days} days · Departs {String(p.departure_date).slice(0, 10)}</p>
        </div>
        <PrintButton label="Print ledger" />
      </div>

      <div className="card">
        {rows.length ? (
          <div className="tw">
            <table className="t">
              <thead>
                <tr><th>#</th><th>Reference</th><th>Passenger</th><th>Booked by</th><th>Status</th><th>Remarks</th><th className="num">Total</th><th className="num">Paid</th><th className="num">Pending</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.b.id}>
                    <td>{r.i}</td>
                    <td><Link href={`/office/b/package/${r.b.id}`} style={{ color: '#2f7f7a', fontWeight: 800 }}>{r.b.reference}</Link></td>
                    <td>{r.lead ? `${r.lead.title} ${r.lead.given_name} ${r.lead.surname}` : '—'}{r.count > 1 ? ` (+${r.count - 1})` : ''}</td>
                    <td>{r.cust ? r.cust.out_full_name : r.b.booking_source === 'offline' ? 'Walk-in' : '—'}</td>
                    <td><Badge label={payLabel(r.b)} /></td>
                    <td>{(r.b.foc_reason ? 'FOC: ' + r.b.foc_reason + ' ' : '') + (r.b.remarks || '')}</td>
                    <td className="num">{fmt(r.total)}</td>
                    <td className="num">{fmt(r.paid)}</td>
                    <td className="num" style={{ fontWeight: 700, color: r.pending > 0 ? '#b3261e' : '#1f7a55' }}>{fmt(r.pending)}</td>
                  </tr>
                ))}
                <tr className="tot">
                  <td colSpan={6}>TOTAL REMAINING BALANCE</td>
                  <td className="num">{fmt(sumTotal)}</td>
                  <td className="num">{fmt(sumPaid)}</td>
                  <td className="num">{fmt(sumPending)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : <div className="empty">No active bookings on this package yet.</div>}
        <p className="note">Includes online and offline bookings. Cancelled and expired bookings are not counted.</p>
      </div>
    </div>
  )
}

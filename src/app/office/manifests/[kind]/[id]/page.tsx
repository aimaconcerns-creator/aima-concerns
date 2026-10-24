import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Badge, customerMap, officeCss, payLabel } from '../../../lib'
import PrintButton from '../../../PrintButton'

export default async function ManifestDetail({
  params,
}: {
  params: Promise<{ kind: string; id: string }>
}) {
  const { kind, id } = await params
  if (kind !== 'package' && kind !== 'ticket') notFound()
  const isPkg = kind === 'package'
  const supabase = await createClient()
  await supabase.rpc('expire_stale_bookings')

  let title = ''
  let sub = ''
  if (isPkg) {
    const { data: p } = await supabase.from('packages').select('*').eq('id', id).single()
    if (!p) notFound()
    title = p.name
    sub = `${p.package_type} · ${p.days} days · Departs ${String(p.departure_date).slice(0, 10)}`
  } else {
    const { data: t } = await supabase.from('tickets').select('*').eq('id', id).single()
    if (!t) notFound()
    const { data: a } = await supabase.from('airlines').select('name').eq('id', t.airline_id).maybeSingle()
    title = `${t.origin} → ${t.destination}`
    sub = `${a?.name || 'Airline'} · ${t.flight_number} · ${String(t.departure_datetime).slice(0, 10)} ${String(t.departure_datetime).slice(11, 16)}`
  }

  const { data: bk } = await supabase
    .from(isPkg ? 'bookings' : 'ticket_bookings')
    .select('*')
    .eq(isPkg ? 'package_id' : 'ticket_id', id)
    .in('status', ['Paid', 'Partial', 'Unpaid'])
    .order('created_at')
  const bookings = bk || []
  const ids = bookings.map((b: any) => b.id)

  let pax: any[] = []
  if (ids.length) {
    const { data: x } = await supabase
      .from(isPkg ? 'booking_passengers' : 'ticket_booking_passengers')
      .select('*')
      .in(isPkg ? 'booking_id' : 'ticket_booking_id', ids)
      .order('created_at')
    pax = x || []
  }

  const cmap = await customerMap(supabase, bookings.map((b: any) => b.customer_id))
  const key = isPkg ? 'booking_id' : 'ticket_booking_id'

  let n = 0
  const rows: any[] = []
  bookings.forEach((b: any) => {
    pax.filter((p) => p[key] === b.id).forEach((p, idx) => {
      n += 1
      rows.push({ n, b, p, first: idx === 0 })
    })
  })

  return (
    <div>
      <style>{officeCss}</style>
      <Link href={isPkg ? '/office/manifests' : '/office/manifests?tab=tickets'} className="no-print"
        style={{ color: '#2f7f7a', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>← Back to manifests</Link>

      <div className="pg-bar" style={{ marginTop: 14 }}>
        <div className="pg-h"><h1>{title}</h1><p>{sub} · {rows.length} passengers</p></div>
        <PrintButton label="Print manifest" />
      </div>

      <div className="card">
        {rows.length ? (
          <div className="tw">
            <table className="t">
              <thead>
                <tr><th>#</th><th>Reference</th><th>Passenger</th><th>DOB</th><th>Nationality</th><th>Passport</th><th>Expiry</th><th>Booked by</th><th>Status</th><th>Remarks / FOC</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const cust = r.b.customer_id ? cmap.get(r.b.customer_id) : null
                  return (
                    <tr key={r.p.id}>
                      <td>{r.n}</td>
                      <td>{r.first ? <Link href={`/office/b/${kind}/${r.b.id}`} style={{ color: '#2f7f7a', fontWeight: 800 }}>{r.b.reference}</Link> : ''}</td>
                      <td>{r.p.title} {r.p.given_name} {r.p.surname}</td>
                      <td>{r.p.date_of_birth}</td>
                      <td>{r.p.nationality}</td>
                      <td>{r.p.passport_number}</td>
                      <td>{r.p.passport_expiry_date}</td>
                      <td>{r.first ? (cust ? cust.out_full_name : r.b.booking_source === 'offline' ? 'Walk-in' : '—') : ''}</td>
                      <td>{r.first ? <><Badge label={payLabel(r.b)} /><div style={{ fontSize: 11, color: '#6b7c93', marginTop: 4 }}>{r.b.booking_source === 'offline' ? 'Offline' : 'Online'}</div></> : ''}</td>
                      <td>{r.first ? (r.b.foc_reason ? 'FOC: ' + r.b.foc_reason : '') + (r.b.foc_reason && r.b.remarks ? ' · ' : '') + (r.b.remarks || '') : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="empty">No active bookings yet.</div>}
        <p className="note">Cancelled and expired bookings are not listed here.</p>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { fmt, officeCss, paidOf } from '../lib'

export default async function LedgersHome() {
  const supabase = await createClient()
  await supabase.rpc('expire_stale_bookings')

  const { data: packages } = await supabase
    .from('packages')
    .select('id, name, package_type, departure_date')
    .order('departure_date', { ascending: false })
  const { data: bk } = await supabase
    .from('bookings')
    .select('package_id, total_amount, amount_paid, status, booking_source')
    .in('status', ['Paid', 'Partial', 'Unpaid'])

  const sums = new Map<string, { total: number; paid: number }>()
  ;(bk || []).forEach((b: any) => {
    const s = sums.get(b.package_id) || { total: 0, paid: 0 }
    s.total += Number(b.total_amount || 0)
    s.paid += paidOf(b)
    sums.set(b.package_id, s)
  })

  return (
    <div>
      <style>{officeCss}</style>
      <div className="pg-h"><h1>Group Ledgers</h1><p>Money collected and still pending, one ledger per package.</p></div>
      <div style={{ marginTop: 22 }}>
        {packages?.length ? packages.map((p: any) => {
          const s = sums.get(p.id) || { total: 0, paid: 0 }
          return (
            <div className="row" key={p.id}>
              <div className="main"><h3>{p.name}</h3><p>{p.package_type} · Departs {String(p.departure_date).slice(0, 10)}</p></div>
              <div className="stat"><b>{fmt(s.total)}</b><span>total</span></div>
              <div className="stat"><b>{fmt(s.paid)}</b><span>paid</span></div>
              <div className="stat"><b style={{ color: s.total - s.paid > 0 ? '#b3261e' : '#1f7a55' }}>{fmt(s.total - s.paid)}</b><span>pending</span></div>
              <Link className="btn" href={`/office/ledgers/${p.id}`}>Open</Link>
            </div>
          )
        }) : <div className="empty">No packages yet.</div>}
      </div>
    </div>
  )
}

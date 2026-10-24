import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { officeCss } from '../lib'

export default async function ManifestsHome({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const active = tab === 'tickets' ? 'tickets' : 'packages'
  const supabase = await createClient()
  await supabase.rpc('expire_stale_bookings')

  const { data: packages } = await supabase
    .from('packages')
    .select('id, name, package_type, departure_date')
    .order('departure_date', { ascending: false })
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, origin, destination, flight_number, departure_datetime')
    .order('departure_datetime', { ascending: false })

  const { data: pb } = await supabase.from('bookings').select('package_id, seats_held, infant_count').in('status', ['Paid', 'Partial', 'Unpaid'])
  const { data: tb } = await supabase.from('ticket_bookings').select('ticket_id, seats_held, infant_count').in('status', ['Paid', 'Partial', 'Unpaid'])

  const pc = new Map<string, number>()
  ;(pb || []).forEach((x: any) => pc.set(x.package_id, (pc.get(x.package_id) || 0) + x.seats_held + x.infant_count))
  const tc = new Map<string, number>()
  ;(tb || []).forEach((x: any) => tc.set(x.ticket_id, (tc.get(x.ticket_id) || 0) + x.seats_held + x.infant_count))

  return (
    <div>
      <style>{officeCss}</style>
      <div className="pg-h"><h1>Manifests</h1><p>Who is booked on every package and flight.</p></div>

      <div className="tabs">
        <Link href="/office/manifests" className={'tab' + (active === 'packages' ? ' on' : '')}>Group manifests (Packages)</Link>
        <Link href="/office/manifests?tab=tickets" className={'tab' + (active === 'tickets' ? ' on' : '')}>Flight manifests (Tickets)</Link>
      </div>

      {active === 'packages' && (packages?.length ? packages.map((p: any) => (
        <div className="row" key={p.id}>
          <div className="main"><h3>{p.name}</h3><p>{p.package_type} · Departs {String(p.departure_date).slice(0, 10)}</p></div>
          <div className="stat"><b>{pc.get(p.id) || 0}</b><span>passengers</span></div>
          <Link className="btn" href={`/office/manifests/package/${p.id}`}>Open</Link>
        </div>
      )) : <div className="empty">No packages yet.</div>)}

      {active === 'tickets' && (tickets?.length ? tickets.map((t: any) => (
        <div className="row" key={t.id}>
          <div className="main">
            <h3>{t.origin} → {t.destination}</h3>
            <p>{t.flight_number} · {String(t.departure_datetime).slice(0, 10)} {String(t.departure_datetime).slice(11, 16)}</p>
          </div>
          <div className="stat"><b>{tc.get(t.id) || 0}</b><span>passengers</span></div>
          <Link className="btn" href={`/office/manifests/ticket/${t.id}`}>Open</Link>
        </div>
      )) : <div className="empty">No flights yet.</div>)}
    </div>
  )
}

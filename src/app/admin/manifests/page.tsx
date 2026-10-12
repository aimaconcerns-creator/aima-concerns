import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function ManifestsPage() {
  const supabase = await createClient()

  // Release seats from any unpaid bookings past 12 hours
  await supabase.rpc('expire_stale_bookings')

  const { data: packages } = await supabase
    .from('packages')
    .select('id, name, package_type, days, departure_date, status, is_hidden, airlines(name)')
    .order('departure_date', { ascending: true })

  const { data: paidBookings } = await supabase
    .from('bookings')
    .select('id, package_id')
    .eq('status', 'Paid')

  const bookingIds = (paidBookings ?? []).map((b: any) => b.id)

  const { data: passengers } = bookingIds.length
    ? await supabase
        .from('booking_passengers')
        .select('id, booking_id')
        .in('booking_id', bookingIds)
    : { data: [] }

  const bookingToPackage = new Map((paidBookings ?? []).map((b: any) => [b.id, b.package_id]))

  const counts: Record<string, { bookings: number; passengers: number }> = {}
  ;(paidBookings ?? []).forEach((b: any) => {
    const c = counts[b.package_id] ?? { bookings: 0, passengers: 0 }
    c.bookings += 1
    counts[b.package_id] = c
  })
  ;(passengers ?? []).forEach((p: any) => {
    const pkgId = bookingToPackage.get(p.booking_id)
    if (!pkgId) return
    const c = counts[pkgId] ?? { bookings: 0, passengers: 0 }
    c.passengers += 1
    counts[pkgId] = c
  })

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = (packages ?? []).filter((p: any) => p.departure_date >= today)
  const departed = (packages ?? []).filter((p: any) => p.departure_date < today).reverse()

  const Table = ({ rows }: { rows: any[] }) => (
    <div className="man-table-wrap">
      <table className="man-table">
        <thead>
          <tr>
            <th>Package</th>
            <th>Type</th>
            <th>Departure</th>
            <th>Airline</th>
            <th>Bookings</th>
            <th>Passengers</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#5a7184' }}>
                Nothing here yet.
              </td>
            </tr>
          )}
          {rows.map((p: any) => {
            const c = counts[p.id] ?? { bookings: 0, passengers: 0 }
            const airline = Array.isArray(p.airlines) ? p.airlines[0] : p.airlines
            return (
              <tr key={p.id}>
                <td>
                  <div className="pkg-name">{p.name}</div>
                  <div className="pkg-days">{p.days} days</div>
                </td>
                <td className="cell">{p.package_type}</td>
                <td className="cell">
                  {new Date(p.departure_date).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </td>
                <td className="cell">{airline?.name ?? '—'}</td>
                <td className="cell">{c.bookings}</td>
                <td className="count">{c.passengers}</td>
                <td>
                  <Link href={`/admin/manifests/${p.id}`} className="btn-view">
                    View Manifest
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div style={{ padding: '34px' }}>
      <style>{`
        .section-title { color: #fff; font-size: 16px; font-weight: 800; margin: 0 0 14px; }
        .man-table-wrap {
          border-radius: 14px; overflow: auto; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02); box-shadow: 0 8px 24px rgba(0,0,0,0.35);
          margin-bottom: 32px;
        }
        table.man-table { width: 100%; border-collapse: collapse; min-width: 900px; }
        .man-table thead tr { background: rgba(255,255,255,0.03); text-align: left; }
        .man-table th {
          padding: 14px 16px; color: #7d93a3; font-size: 12px; text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 700;
        }
        .man-table td { padding: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
        .pkg-name { font-weight: 800; color: #cfe0ea; font-size: 14px; }
        .pkg-days { font-size: 12px; color: #7d93a3; margin-top: 2px; }
        .cell { color: #a9bccb; font-size: 13.5px; }
        .count { font-weight: 700; color: #fff; font-size: 14.5px; }
        .btn-view {
          padding: 6px 14px; background: rgba(217, 164, 65, 0.15); color: #e0c060;
          border-radius: 6px; text-decoration: none; font-size: 12.5px; font-weight: 700;
        }
      `}</style>

      <h1 style={{ color: '#fff', margin: '0 0 28px', fontSize: '22px', fontWeight: 800 }}>
        Group Manifests
      </h1>

      <h2 className="section-title">Upcoming Departures</h2>
      <Table rows={upcoming} />

      <h2 className="section-title">Departed</h2>
      <Table rows={departed} />
    </div>
  )
}
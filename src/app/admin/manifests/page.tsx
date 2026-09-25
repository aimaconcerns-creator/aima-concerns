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

  const { data: paid } = await supabase
    .from('bookings')
    .select('package_id, booking_passengers(id)')
    .eq('status', 'Paid')

  const counts: Record<string, { bookings: number; passengers: number }> = {}
  ;(paid ?? []).forEach((b: any) => {
    const c = counts[b.package_id] ?? { bookings: 0, passengers: 0 }
    c.bookings += 1
    c.passengers += (b.booking_passengers ?? []).length
    counts[b.package_id] = c
  })

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = (packages ?? []).filter((p: any) => p.departure_date >= today)
  const departed = (packages ?? []).filter((p: any) => p.departure_date < today).reverse()

  const th = { padding: '12px 15px', color: '#155263' }
  const td = { padding: '12px 15px' }

  const Table = ({ rows }: { rows: any[] }) => (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '10px',
        overflow: 'auto',
        boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
        marginBottom: '30px',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f3f4', textAlign: 'left' }}>
            <th style={th}>Package</th>
            <th style={th}>Type</th>
            <th style={th}>Departure</th>
            <th style={th}>Airline</th>
            <th style={th}>Bookings</th>
            <th style={th}>Passengers</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#888' }}>
                Nothing here yet.
              </td>
            </tr>
          )}
          {rows.map((p: any) => {
            const c = counts[p.id] ?? { bookings: 0, passengers: 0 }
            const airline = Array.isArray(p.airlines) ? p.airlines[0] : p.airlines
            return (
              <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ ...td, fontWeight: 'bold', color: '#155263' }}>
                  {p.name}
                  <div style={{ fontSize: '12px', color: '#888', fontWeight: 'normal' }}>{p.days} days</div>
                </td>
                <td style={td}>{p.package_type}</td>
                <td style={td}>
                  {new Date(p.departure_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td style={td}>{airline?.name ?? '—'}</td>
                <td style={td}>{c.bookings}</td>
                <td style={{ ...td, fontWeight: 'bold', color: '#155263' }}>{c.passengers}</td>
                <td style={td}>
                  <Link
                    href={`/admin/manifests/${p.id}`}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#155263',
                      color: '#fff',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '13px',
                    }}
                  >
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
    <div style={{ padding: '30px' }}>
      <h1 style={{ color: '#155263', marginBottom: '20px' }}>Group Manifests</h1>

      <h3 style={{ color: '#155263', margin: '0 0 12px' }}>Upcoming Departures</h3>
      <Table rows={upcoming} />

      <h3 style={{ color: '#155263', margin: '0 0 12px' }}>Departed</h3>
      <Table rows={departed} />
    </div>
  )
}
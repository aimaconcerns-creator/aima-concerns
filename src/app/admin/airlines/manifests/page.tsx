import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function FlightManifestsPage() {
  const supabase = await createClient()

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, airlines(name)')
    .order('departure_datetime', { ascending: true })

  const { data: paidBookings } = await supabase
    .from('ticket_bookings')
    .select('ticket_id')
    .eq('status', 'Paid')

  const passengerCounts = new Map<string, number>()
  for (const b of paidBookings ?? []) {
    passengerCounts.set(b.ticket_id, (passengerCounts.get(b.ticket_id) ?? 0) + 1)
  }

  const now = new Date()
  const upcoming = (tickets ?? []).filter((t) => new Date(t.departure_datetime) >= now)
  const departed = (tickets ?? []).filter((t) => new Date(t.departure_datetime) < now)

  const renderTable = (rows: any[]) => (
    <div className="man-table-wrap">
      <table className="man-table">
        <thead>
          <tr>
            <th>Route</th>
            <th>Airline</th>
            <th>Departure</th>
            <th>Bookings (Paid)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#5a7184' }}>
                No tickets here.
              </td>
            </tr>
          )}
          {rows.map((t) => (
            <tr key={t.id}>
              <td>
                <div className="route">{t.origin} → {t.destination}</div>
                <div className="flight-no">{t.flight_number}</div>
              </td>
              <td className="cell">{t.airlines?.name || '—'}</td>
              <td className="cell">
                {new Date(t.departure_datetime).toLocaleString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </td>
              <td className="count">{passengerCounts.get(t.id) ?? 0}</td>
              <td>
                <Link href={`/admin/airlines/manifests/${t.id}`} className="btn-view">
                  View Manifest
                </Link>
              </td>
            </tr>
          ))}
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
        table.man-table { width: 100%; border-collapse: collapse; min-width: 760px; }
        .man-table thead tr { background: rgba(255,255,255,0.03); text-align: left; }
        .man-table th {
          padding: 14px 16px; color: #7d93a3; font-size: 12px; text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 700;
        }
        .man-table td { padding: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
        .route { font-weight: 800; color: #cfe0ea; font-size: 14px; }
        .flight-no { font-size: 12px; color: #7d93a3; margin-top: 2px; }
        .cell { color: #a9bccb; font-size: 13.5px; }
        .count { font-weight: 700; color: #fff; font-size: 14.5px; }
        .btn-view {
          padding: 6px 14px; background: rgba(217, 164, 65, 0.15); color: #e0c060;
          border-radius: 6px; text-decoration: none; font-size: 12.5px; font-weight: 700;
        }
      `}</style>

      <h1 style={{ color: '#fff', margin: '0 0 28px', fontSize: '22px', fontWeight: 800 }}>
        Flight Manifests
      </h1>

      <h2 className="section-title">Upcoming Departures</h2>
      {renderTable(upcoming)}

      <h2 className="section-title">Departed</h2>
      {renderTable(departed)}
    </div>
  )
}
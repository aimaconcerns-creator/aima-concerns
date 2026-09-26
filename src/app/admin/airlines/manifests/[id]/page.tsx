import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function TicketManifestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, airlines(name)')
    .eq('id', id)
    .single()

  const { data: bookings } = await supabase
    .from('ticket_bookings')
    .select('*')
    .eq('ticket_id', id)
    .eq('status', 'Paid')

  const customerIds = (bookings ?? []).map((b) => b.customer_id)

  const { data: customers } = customerIds.length
    ? await supabase
        .from('csp')
        .select('id, customer_code, "Full Name:", "Email"')
        .in('id', customerIds)
    : { data: [] }

  const customerMap = new Map((customers ?? []).map((c: any) => [c.id, c]))

  const bookingIds = (bookings ?? []).map((b) => b.id)

  const { data: passengers } = bookingIds.length
    ? await supabase
        .from('ticket_booking_passengers')
        .select('*')
        .in('ticket_booking_id', bookingIds)
    : { data: [] }

  const bookingMap = new Map((bookings ?? []).map((b) => [b.id, b]))

  const totalAdults = (passengers ?? []).filter((p) => p.title !== 'INF' && p.title !== 'CHD').length
  const totalChildren = (passengers ?? []).filter((p) => p.title === 'CHD').length
  const totalInfants = (passengers ?? []).filter((p) => p.title === 'INF').length

  return (
    <div style={{ padding: '34px' }}>
      <style>{`
        .back-link { color: #7d93a3; font-size: 13px; text-decoration: none; }
        .back-link:hover { color: #cfe0ea; }

        .summary-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px;
          margin: 20px 0 28px;
        }
        .summary-card {
          border-radius: 12px; padding: 18px; background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 6px 18px rgba(0,0,0,0.3);
        }
        .summary-label { color: #7d93a3; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin: 0; }
        .summary-value { color: #fff; font-size: 26px; font-weight: 800; margin: 6px 0 0; }

        .man-table-wrap {
          border-radius: 14px; overflow: auto; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02); box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        table.man-table { width: 100%; border-collapse: collapse; min-width: 1000px; }
        .man-table thead tr { background: rgba(255,255,255,0.03); text-align: left; }
        .man-table th {
          padding: 14px 16px; color: #7d93a3; font-size: 12px; text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 700;
        }
        .man-table td { padding: 14px 16px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 13.5px; color: #cfe0ea; }
        .ref { font-weight: 700; color: #e0c060; }
        .title-tag {
          display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700;
          background: rgba(47, 127, 122, 0.2); color: #6fd0c8;
        }
      `}</style>

      <Link href="/admin/airlines/manifests" className="back-link">← Back to Flight Manifests</Link>

      <h1 style={{ color: '#fff', margin: '14px 0 4px', fontSize: '22px', fontWeight: 800 }}>
        {ticket?.origin} → {ticket?.destination}
      </h1>
      <p style={{ color: '#7d93a3', fontSize: '14px', margin: 0 }}>
        {ticket?.airlines?.name} · {ticket?.flight_number} ·{' '}
        {ticket && new Date(ticket.departure_datetime).toLocaleString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })}
      </p>

      <div className="summary-grid">
        <div className="summary-card">
          <p className="summary-label">Total Passengers</p>
          <p className="summary-value">{passengers?.length ?? 0}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">Adults</p>
          <p className="summary-value">{totalAdults}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">Children</p>
          <p className="summary-value">{totalChildren}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">Infants</p>
          <p className="summary-value">{totalInfants}</p>
        </div>
      </div>

      <div className="man-table-wrap">
        <table className="man-table">
          <thead>
            <tr>
              <th>Booking Ref</th>
              <th>Name</th>
              <th>Type</th>
              <th>DOB</th>
              <th>Nationality</th>
              <th>Passport No.</th>
              <th>Issue</th>
              <th>Expiry</th>
              <th>Booked By</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {(!passengers || passengers.length === 0) && (
              <tr>
                <td colSpan={10} style={{ padding: '24px', textAlign: 'center', color: '#5a7184' }}>
                  No paid passengers yet for this ticket.
                </td>
              </tr>
            )}
            {passengers?.map((p: any) => {
              const booking = bookingMap.get(p.ticket_booking_id)
              const customer = booking ? customerMap.get(booking.customer_id) : undefined
              return (
                <tr key={p.id}>
                  <td className="ref">{booking?.reference || '—'}</td>
                  <td>{p.given_name} {p.surname}</td>
                  <td><span className="title-tag">{p.title}</span></td>
                  <td>{new Date(p.date_of_birth).toLocaleDateString('en-GB')}</td>
                  <td>{p.nationality}</td>
                  <td>{p.passport_number}</td>
                  <td>{new Date(p.passport_issue_date).toLocaleDateString('en-GB')}</td>
                  <td>{new Date(p.passport_expiry_date).toLocaleDateString('en-GB')}</td>
                  <td>{customer?.['Full Name:'] || customer?.['Email'] || '—'}</td>
                  <td style={{ color: '#7d93a3' }}>{p.remarks || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

const dayTime = (s: string) =>
  new Date(s.slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }) + ' ' + s.slice(11, 16)

const paxType = (title: string) => (title === 'INF' ? 'Infant' : title === 'CHD' ? 'Child' : 'Adult')

export default async function VerifyBookingPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  const reference = decodeURIComponent(ref).toUpperCase()
  const supabase = await createClient()

  const card = {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '28px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
    maxWidth: '720px',
  }

  const { data: pb } = await supabase
    .from('bookings')
    .select(
      'id, reference, status, total_amount, paid_at, customer_id, packages(name, package_type, days, departure_date), booking_passengers(id, title, given_name, surname, passport_number, price)'
    )
    .eq('reference', reference)
    .maybeSingle()

  let tb: any = null
  if (!pb) {
    const { data } = await supabase
      .from('ticket_bookings')
      .select(
        'id, reference, status, total_amount, paid_at, customer_id, phone_number, tickets(origin, destination, flight_number, ticket_type, departure_datetime, arrival_datetime, return_departure_datetime, return_arrival_datetime, return_flight_number, airlines(name)), ticket_booking_passengers(id, title, given_name, surname, passport_number, price)'
      )
      .eq('reference', reference)
      .maybeSingle()
    tb = data
  }

  const b: any = pb || tb

  if (!b) {
    return (
      <div style={{ padding: '30px' }}>
        <div style={card}>
          <h1 style={{ color: '#c0392b', marginTop: 0 }}>Not Found</h1>
          <p style={{ color: '#666' }}>No booking exists with the reference <b>{reference}</b>.</p>
          <Link href="/admin" style={{ color: '#155263' }}>← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const { data: customer } = await supabase
    .from('csp')
    .select('customer_code, "Full Name:"')
    .eq('id', b.customer_id)
    .single()

  const isTicket = !!tb
  const paid = b.status === 'Paid'
  const pkg: any = !isTicket ? (Array.isArray(b.packages) ? b.packages[0] : b.packages) : null
  const t: any = isTicket ? (Array.isArray(b.tickets) ? b.tickets[0] : b.tickets) : null
  const airline: any = t ? (Array.isArray(t.airlines) ? t.airlines[0] : t.airlines) : null
  const passengers: any[] = isTicket ? (b.ticket_booking_passengers ?? []) : (b.booking_passengers ?? [])

  return (
    <div style={{ padding: '30px' }}>
      <div style={card}>
        <div
          style={{
            display: 'inline-block',
            padding: '8px 20px',
            borderRadius: '20px',
            color: '#fff',
            fontWeight: 800,
            letterSpacing: '0.1em',
            backgroundColor: paid ? '#5FAE8C' : '#d9534f',
          }}
        >
          {paid ? 'VALID · PAID' : `NOT VALID · ${b.status.toUpperCase()}`}
        </div>

        <h1 style={{ color: '#155263', letterSpacing: '4px', margin: '16px 0 4px' }}>{b.reference}</h1>
        <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
          Customer: <b style={{ color: '#155263' }}>{(customer as any)?.['Full Name:'] ?? '—'}</b>
          {(customer as any)?.customer_code ? ` (${(customer as any).customer_code})` : ''}
        </p>
        {isTicket && b.phone_number && (
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: '14px' }}>
            Contact phone: <b style={{ color: '#155263' }}>{b.phone_number}</b>
          </p>
        )}

        <div style={{ margin: '20px 0', padding: '16px', backgroundColor: '#f5f7f8', borderRadius: '8px' }}>
          {isTicket ? (
            <>
              <p style={{ margin: 0, color: '#155263', fontWeight: 'bold' }}>
                Flight: {t?.origin} → {t?.destination}
              </p>
              <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
                {airline?.name || 'Airline'}{t?.flight_number ? ` · ${t.flight_number}` : ''} · {t?.ticket_type}
              </p>
              {t?.departure_datetime && (
                <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
                  Departs {dayTime(t.departure_datetime)}
                  {t.arrival_datetime ? ` · Arrives ${dayTime(t.arrival_datetime)}` : ''}
                </p>
              )}
              {t?.ticket_type === 'Return' && t?.return_departure_datetime && (
                <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
                  Return{t.return_flight_number ? ` ${t.return_flight_number}` : ''}: {dayTime(t.return_departure_datetime)}
                  {t.return_arrival_datetime ? ` → ${dayTime(t.return_arrival_datetime)}` : ''}
                </p>
              )}
            </>
          ) : (
            <>
              <p style={{ margin: 0, color: '#155263', fontWeight: 'bold' }}>{pkg?.name}</p>
              <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
                {pkg?.package_type} · {pkg?.days} days · Departs{' '}
                {pkg?.departure_date
                  ? new Date(pkg.departure_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : ''}
              </p>
            </>
          )}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f3f4', textAlign: 'left' }}>
              <th style={{ padding: '10px', color: '#155263' }}>Passenger</th>
              {isTicket && <th style={{ padding: '10px', color: '#155263' }}>Type</th>}
              <th style={{ padding: '10px', color: '#155263' }}>Passport</th>
              <th style={{ padding: '10px', color: '#155263', textAlign: 'right' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {passengers.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{p.title} {p.given_name} {p.surname}</td>
                {isTicket && <td style={{ padding: '10px' }}>{paxType(p.title)}</td>}
                <td style={{ padding: '10px' }}>{p.passport_number}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>PKR {Number(p.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ textAlign: 'right', color: '#155263', fontWeight: 'bold', fontSize: '18px', marginBottom: 0 }}>
          Total: PKR {Number(b.total_amount).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

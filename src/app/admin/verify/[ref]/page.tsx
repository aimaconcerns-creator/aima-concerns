import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

const dayTime = (s: string) =>
  new Date(s.slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }) + ' ' + s.slice(11, 16)

const paxType = (title: string) => (title === 'INF' ? 'Infant' : title === 'CHD' ? 'Child' : 'Adult')

const money = (n: any) => 'PKR ' + Number(n || 0).toLocaleString()

const pktTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' })

export default async function VerifyBookingPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  const reference = decodeURIComponent(ref).toUpperCase()
  const supabase = await createClient()
  await supabase.rpc('expire_stale_bookings')

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
      'id, reference, status, total_amount, paid_at, customer_id, booking_source, payment_type, amount_paid, balance_due_date, remarks, foc_reason, expires_at, packages(name, package_type, days, departure_date), booking_passengers(id, title, given_name, surname, passport_number, price)'
    )
    .eq('reference', reference)
    .maybeSingle()

  let tb: any = null
  if (!pb) {
    const { data } = await supabase
      .from('ticket_bookings')
      .select(
        'id, reference, status, total_amount, paid_at, customer_id, phone_number, booking_source, payment_type, amount_paid, remarks, foc_reason, expires_at, tickets(origin, destination, flight_number, ticket_type, departure_datetime, arrival_datetime, return_departure_datetime, return_arrival_datetime, return_flight_number, airlines(name)), ticket_booking_passengers(id, title, given_name, surname, passport_number, price)'
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

  let customer: any = null
  if (b.customer_id) {
    const { data } = await supabase
      .from('csp')
      .select('customer_code, "Full Name:"')
      .eq('id', b.customer_id)
      .single()
    customer = data
  }

  const isTicket = !!tb
  const kind = isTicket ? 'ticket' : 'package'
  const offline = b.booking_source === 'offline'
  const foc = b.payment_type === 'FOC'
  const paid = b.status === 'Paid'
  const total = Number(b.total_amount || 0)
  const paidAmount = offline ? Number(b.amount_paid || 0) : paid ? total : 0
  const balance = b.status === 'Cancelled' || b.status === 'Expired' ? 0 : Math.max(0, total - paidAmount)

  let banner = { text: `NOT VALID · ${String(b.status).toUpperCase()}`, bg: '#d9534f' }
  if (b.status === 'Cancelled') banner = { text: 'NOT VALID · CANCELLED', bg: '#d9534f' }
  else if (b.status === 'Expired') banner = { text: 'NOT VALID · EXPIRED', bg: '#999' }
  else if (paid && foc) banner = { text: 'VALID · FOC (FREE OF CHARGE)', bg: '#6a3fb5' }
  else if (paid) banner = { text: 'VALID · PAID', bg: '#5FAE8C' }
  else if (b.status === 'Partial') banner = { text: 'PARTIAL PAYMENT · BALANCE DUE', bg: '#e0a030' }
  else if (offline) banner = { text: 'PAY LATER · NOT YET PAID', bg: '#2a5fa8' }

  const pkg: any = !isTicket ? (Array.isArray(b.packages) ? b.packages[0] : b.packages) : null
  const t: any = isTicket ? (Array.isArray(b.tickets) ? b.tickets[0] : b.tickets) : null
  const airline: any = t ? (Array.isArray(t.airlines) ? t.airlines[0] : t.airlines) : null
  const passengers: any[] = isTicket ? (b.ticket_booking_passengers ?? []) : (b.booking_passengers ?? [])

  const voucherHref = offline
    ? `/office/b/${kind}/${b.id}/voucher`
    : isTicket
    ? `/dashboard/bookings/ticket/${b.id}/voucher`
    : `/dashboard/bookings/${b.id}/voucher`

  const btnStyle = {
    display: 'inline-block',
    padding: '10px 20px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 'bold' as const,
    fontSize: '14px',
  }

  const line = { color: '#888', margin: '4px 0 0', fontSize: '14px' }

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
            backgroundColor: banner.bg,
          }}
        >
          {banner.text}
        </div>

        <h1 style={{ color: '#155263', letterSpacing: '4px', margin: '16px 0 4px' }}>{b.reference}</h1>
        <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
          Customer:{' '}
          <b style={{ color: '#155263' }}>
            {customer ? (customer as any)['Full Name:'] ?? '—' : b.customer_id ? '—' : 'Walk-in customer (no account)'}
          </b>
          {(customer as any)?.customer_code ? ` (${(customer as any).customer_code})` : ''}
        </p>
        <p style={line}>
          Source: <b style={{ color: '#155263' }}>{offline ? 'Offline (office)' : 'Online'}</b>
        </p>
        {isTicket && b.phone_number && (
          <p style={line}>
            Contact phone: <b style={{ color: '#155263' }}>{b.phone_number}</b>
          </p>
        )}
        {b.remarks && (
          <p style={line}>
            Remarks: <b style={{ color: '#155263' }}>{b.remarks}</b>
          </p>
        )}
        {b.foc_reason && (
          <p style={line}>
            FOC reason: <b style={{ color: '#155263' }}>{b.foc_reason}</b>
          </p>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
          {b.customer_id && (
            <Link
              href={`/admin/customers/${b.customer_id}`}
              style={{ ...btnStyle, backgroundColor: '#155263', color: '#fff' }}
            >
              View Customer
            </Link>
          )}
          {offline && (
            <Link
              href={`/office/b/${kind}/${b.id}`}
              style={{ ...btnStyle, backgroundColor: '#12335f', color: '#fff' }}
            >
              Open booking
            </Link>
          )}
          {(paid || offline) && (
            <Link
              href={voucherHref}
              style={{ ...btnStyle, backgroundColor: '#5FAE8C', color: '#fff' }}
            >
              Download Voucher/Ticket
            </Link>
          )}
        </div>

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

        <div style={{ textAlign: 'right', marginTop: '14px', color: '#155263' }}>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>Total: {money(total)}</p>
          {offline && (
            <>
              <p style={{ margin: '4px 0 0', fontSize: '14px' }}>Paid: {money(paidAmount)}</p>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 'bold', color: balance > 0 ? '#c0392b' : '#155263' }}>
                Balance: {money(balance)}
              </p>
              {b.status === 'Partial' && b.balance_due_date && (
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
                  Balance due by {dayTime(String(b.balance_due_date) + 'T00:00').slice(0, -6)}
                </p>
              )}
              {b.status === 'Unpaid' && b.expires_at && (
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
                  Seats held until {pktTime(b.expires_at)}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

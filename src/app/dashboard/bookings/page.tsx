import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import BookingCard from './BookingCard'

const dateOnly = (s: string) =>
  new Date(s.slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

export default async function MyBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard/bookings')
  }

  // Release seats from any unpaid bookings that ran past 12 hours
  await supabase.rpc('expire_stale_bookings')

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      'id, reference, status, total_amount, expires_at, paid_at, created_at, packages(name, package_type, days, departure_date), booking_passengers(id)'
    )
    .eq('customer_id', user.id)

  const { data: ticketBookings, error: ticketError } = await supabase
    .from('ticket_bookings')
    .select(
      'id, reference, status, total_amount, expires_at, paid_at, created_at, tickets(origin, destination, flight_number, ticket_type, departure_datetime), ticket_booking_passengers(id)'
    )
    .eq('customer_id', user.id)

  if (ticketError) console.error('TICKET BOOKINGS ERROR:', ticketError)

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('id', user.id)
    .single()

  const balance = Number(wallet?.balance ?? 0)

  const packageItems = (bookings ?? []).map((b: any) => {
    const pkg = Array.isArray(b.packages) ? b.packages[0] : b.packages
    const count = (b.booking_passengers ?? []).length as number
    const dep = pkg?.departure_date ? dateOnly(pkg.departure_date) : ''
    return {
      kind: 'package' as const,
      id: b.id as string,
      reference: (b.reference as string | null) ?? null,
      status: b.status as string,
      total: Number(b.total_amount),
      expiresAt: b.expires_at as string,
      createdAt: b.created_at as string,
      tag: (pkg?.package_type as string) ?? 'Package',
      title: (pkg?.name as string) ?? 'Package',
      subtitle: `${pkg?.days ?? 0} days · Departs ${dep} · ${count} passenger${count === 1 ? '' : 's'}`,
    }
  })

  const ticketItems = (ticketBookings ?? []).map((b: any) => {
    const t = Array.isArray(b.tickets) ? b.tickets[0] : b.tickets
    const count = (b.ticket_booking_passengers ?? []).length as number
    const dep = t?.departure_datetime
      ? `${dateOnly(t.departure_datetime)} ${t.departure_datetime.slice(11, 16)}`
      : ''
    return {
      kind: 'ticket' as const,
      id: b.id as string,
      reference: (b.reference as string | null) ?? null,
      status: b.status as string,
      total: Number(b.total_amount),
      expiresAt: b.expires_at as string,
      createdAt: b.created_at as string,
      tag: `Flight · ${t?.ticket_type ?? ''}`,
      title: t ? `${t.origin} → ${t.destination}` : 'Flight',
      subtitle: `${t?.flight_number ? t.flight_number + ' · ' : ''}Departs ${dep} · ${count} passenger${count === 1 ? '' : 's'}`,
    }
  })

  const items = [...packageItems, ...ticketItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7f8', fontFamily: 'sans-serif' }}>
      <div
        style={{
          backgroundColor: '#155263',
          padding: '20px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/dashboard" style={{ color: '#fff', fontSize: '22px', textDecoration: 'none' }} aria-label="Back to dashboard">
            ←
          </Link>
          <Image src="/logo.png" alt="Aima Concerns" width={40} height={40} style={{ objectFit: 'contain' }} />
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>Aima Concerns</span>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '30px 20px' }}>
        <h1 style={{ color: '#155263', margin: '0 0 6px' }}>My Bookings</h1>
        <p style={{ color: '#666', margin: '0 0 22px' }}>
          Wallet balance: <b style={{ color: '#155263' }}>PKR {balance.toLocaleString()}</b>
        </p>

        {items.length === 0 && (
          <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
            <p style={{ color: '#888', margin: '0 0 16px' }}>You have no bookings yet.</p>
            <Link
              href="/packages/umrah"
              style={{ padding: '11px 22px', backgroundColor: '#5FAE8C', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', marginRight: '10px' }}
            >
              Browse Packages
            </Link>
            <Link
              href="/tickets"
              style={{ padding: '11px 22px', backgroundColor: '#155263', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}
            >
              Browse Flights
            </Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map((b) => (
            <BookingCard key={`${b.kind}-${b.id}`} booking={b} />
          ))}
        </div>
      </div>
    </div>
  )
}

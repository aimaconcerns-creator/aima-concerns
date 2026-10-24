import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import BookingForm from './BookingForm'

export default async function NewBookingPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>
}) {
  const { kind, id } = await params
  if (kind !== 'package' && kind !== 'ticket') notFound()

  const supabase = await createClient()
  let item: any = null

  if (kind === 'package') {
    const { data: p } = await supabase.from('packages').select('*').eq('id', id).single()
    if (!p) notFound()
    item = {
      kind: 'package',
      id: p.id,
      title: p.name,
      subtitle: `${p.package_type} · ${p.days} days`,
      departure: String(p.departure_date).slice(0, 10),
      price: Number(p.price),
      childPrice: Number(p.price),
      infantPrice: Number(p.infant_price || 0),
      seats: Number(p.available_seats),
      status: p.status,
    }
  } else {
    const { data: t } = await supabase.from('tickets').select('*').eq('id', id).single()
    if (!t) notFound()
    const { data: a } = await supabase.from('airlines').select('name').eq('id', t.airline_id).single()
    const dt = String(t.departure_datetime)
    item = {
      kind: 'ticket',
      id: t.id,
      title: `${t.origin} → ${t.destination}`,
      subtitle: `${a?.name || 'Airline'} · ${t.flight_number} · ${t.ticket_type} · ${dt.slice(0, 10)} ${dt.slice(11, 16)}`,
      departure: dt.slice(0, 10),
      price: Number(t.price),
      childPrice: Number(t.child_price ?? t.price),
      infantPrice: Number(t.infant_price || 0),
      seats: Number(t.available_seats),
      status: t.status,
    }
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })
  const blocked = item.status === 'Sold Out' || item.seats <= 0 || item.departure < today

  return (
    <div>
      <Link href={kind === 'ticket' ? '/office/booking?tab=tickets' : '/office/booking'}
        style={{ color: '#2f7f7a', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
        ← Back to list
      </Link>
      {blocked ? (
        <div style={{ marginTop: 20, background: '#fff', border: '1px solid #f0c9c6', color: '#b3261e',
          borderRadius: 14, padding: 28, fontWeight: 600 }}>
          This item is Sold Out or has already departed, so it cannot be booked.
        </div>
      ) : (
        <BookingForm item={item} />
      )}
    </div>
  )
}

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import BookingForm from './BookingForm'

export default async function TicketBookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/tickets/${id}/book`)}`)
  }

  const { data: t } = await supabase
    .from('tickets')
    .select('id, origin, destination, flight_number, ticket_type, departure_datetime, arrival_datetime, price, child_price, infant_price, available_seats, status, is_hidden, airlines(name)')
    .eq('id', id)
    .eq('is_hidden', false)
    .maybeSingle()

  if (!t) notFound()
  if (Date.parse(t.departure_datetime) < Date.now()) notFound()

  if (t.status !== 'Booking Open' || t.available_seats <= 0) {
    redirect(`/tickets/${id}`)
  }

  const { data: profile } = await supabase
    .from('csp')
    .select('"Full Name:"')
    .eq('id', user.id)
    .single()

  const full = (((profile as any)?.['Full Name:'] as string) || '').trim()
  const parts = full.split(/\s+/).filter(Boolean)
  const surname = parts.length > 1 ? parts[parts.length - 1] : ''
  const given = parts.length > 1 ? parts.slice(0, -1).join(' ') : full

  const airline: any = Array.isArray(t.airlines) ? t.airlines[0] : t.airlines

  return (
    <BookingForm
      ticket={{
        id: t.id,
        origin: t.origin,
        destination: t.destination,
        flight_number: t.flight_number || '',
        airline: airline?.name || '',
        ticket_type: t.ticket_type,
        departure_datetime: t.departure_datetime,
        price: Number(t.price),
        child_price: Number(t.child_price),
        infant_price: Number(t.infant_price),
        available_seats: t.available_seats,
      }}
      defaultGiven={given}
      defaultSurname={surname}
    />
  )
}

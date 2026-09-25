import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import BookingForm from './BookingForm'

const TYPE_TO_DB: Record<string, string> = { umrah: 'Umrah', ziyarat: 'Ziyarat' }

export default async function BookPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>
}) {
  const { type, id } = await params
  const dbType = TYPE_TO_DB[type]
  if (!dbType) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/packages/${type}/${id}/book`)}`)
  }

  const { data: p } = await supabase
    .from('packages')
    .select('id, name, days, price, infant_price, available_seats, departure_date, status, is_hidden')
    .eq('id', id)
    .eq('package_type', dbType)
    .eq('is_hidden', false)
    .single()

  if (!p) notFound()

  const today = new Date().toISOString().slice(0, 10)
  if (p.departure_date < today) notFound()

  if (p.status !== 'Booking Open' || p.available_seats <= 0) {
    redirect(`/packages/${type}/${id}`)
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

  return (
    <BookingForm
      type={type}
      pkg={{
        id: p.id,
        name: p.name,
        days: p.days,
        price: Number(p.price),
        infant_price: Number(p.infant_price),
        available_seats: p.available_seats,
        departure_date: p.departure_date,
      }}
      defaultGiven={given}
      defaultSurname={surname}
    />
  )
}
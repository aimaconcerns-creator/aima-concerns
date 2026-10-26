import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { dmy, officeCss } from '@/app/office/lib'
import PartyLedger from './PartyLedger'

export const dynamic = 'force-dynamic'

export default async function PartyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  await supabase.rpc('expire_stale_bookings')

  const { data: party } = await supabase.from('parties').select('id, name, note').eq('id', id).maybeSingle()
  if (!party) notFound()

  const { data: ent } = await supabase
    .from('party_entries')
    .select('*')
    .eq('party_id', id)
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true })
  const entries: any[] = ent || []

  const pkgIds = entries.filter((e) => e.booking_kind === 'package' && e.booking_id).map((e) => e.booking_id)
  const tktIds = entries.filter((e) => e.booking_kind === 'ticket' && e.booking_id).map((e) => e.booking_id)
  const dead = new Set<string>()

  if (pkgIds.length) {
    const { data } = await supabase.from('bookings').select('id, status').in('id', pkgIds)
    for (const b of (data || []) as any[]) {
      if (b.status === 'Cancelled' || b.status === 'Expired') dead.add(b.id)
    }
  }
  if (tktIds.length) {
    const { data } = await supabase.from('ticket_bookings').select('id, status').in('id', tktIds)
    for (const b of (data || []) as any[]) {
      if (b.status === 'Cancelled' || b.status === 'Expired') dead.add(b.id)
    }
  }

  let running = 0
  let owed = 0
  let received = 0
  const rows = entries.map((e) => {
    const debit = Number(e.debit || 0)
    const credit = Number(e.credit || 0)
    owed += debit
    received += credit
    running += debit - credit
    return {
      id: e.id as string,
      kind: e.kind as 'passenger' | 'payment',
      date: String(e.entry_date).slice(0, 10),
      dateLabel: dmy(e.entry_date),
      particulars: e.particulars as string,
      debit,
      credit,
      method: (e.payment_method as string | null) ?? null,
      note: (e.note as string | null) ?? null,
      by: (e.created_by_name as string | null) ?? null,
      balance: running,
      cancelled: !!e.booking_id && dead.has(e.booking_id),
    }
  })

  const { data: { user } } = await supabase.auth.getUser()
  const { data: staff } = await supabase.from('staff').select('full_name').eq('id', user!.id).single()
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })

  return (
    <div>
      <style>{officeCss}</style>
      <PartyLedger
        party={{ id: party.id, name: party.name, note: party.note ?? null }}
        rows={rows}
        received={received}
        remaining={owed - received}
        preparedBy={staff?.full_name || ''}
        today={today}
        todayLabel={dmy(today)}
      />
    </div>
  )
}

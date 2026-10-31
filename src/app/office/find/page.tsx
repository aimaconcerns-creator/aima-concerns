import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Badge, dmy, officeCss, payLabel } from '@/app/office/lib'

export default async function FindBooking({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams
  const raw = (ref || '').trim()
  const code = raw.toUpperCase().replace(/\s+/g, '')
  const supabase = await createClient()

  if (code) {
    const { data: pb } = await supabase.from('bookings').select('id').eq('reference', code).maybeSingle()
    if (pb) redirect(`/office/b/package/${pb.id}`)
    const { data: tb } = await supabase.from('ticket_bookings').select('id').eq('reference', code).maybeSingle()
    if (tb) redirect(`/office/b/ticket/${tb.id}`)
  }

  // A PNR lists every booking on that flight
  let pnrFlights: any[] = []
  let pnrBookings: any[] = []
  const leadName = new Map<string, string>()
  const paxCount = new Map<string, number>()

  if (code.length >= 4 && code.length <= 10) {
    const { data: pr } = await supabase.from('ticket_pnr').select('ticket_id').eq('pnr', code)
    const ticketIds: string[] = (pr || []).map((r: any) => r.ticket_id)
    if (ticketIds.length) {
      const { data: tk } = await supabase
        .from('tickets')
        .select('id, origin, destination, flight_number, departure_datetime')
        .in('id', ticketIds)
      pnrFlights = tk || []

      const { data: bk } = await supabase
        .from('ticket_bookings')
        .select('id, ticket_id, reference, status, payment_type, booking_source, created_at')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: true })
        .limit(150)
      pnrBookings = bk || []

      if (pnrBookings.length) {
        const { data: px } = await supabase
          .from('ticket_booking_passengers')
          .select('ticket_booking_id, title, given_name, surname, created_at')
          .in('ticket_booking_id', pnrBookings.map((b: any) => b.id))
          .order('created_at', { ascending: true })
        ;(px || []).forEach((p: any) => {
          paxCount.set(p.ticket_booking_id, (paxCount.get(p.ticket_booking_id) || 0) + 1)
          if (!leadName.has(p.ticket_booking_id)) {
            leadName.set(p.ticket_booking_id, `${p.title} ${p.given_name} ${p.surname}`)
          }
        })
      }
    }
  }

  const activeBookings = pnrBookings.filter((b) => ['Paid', 'Partial', 'Unpaid'].includes(b.status))
  const activePax = activeBookings.reduce((a, b) => a + (paxCount.get(b.id) || 0), 0)

  let hits: any[] = []
  let searchError = ''
  if (raw.length >= 3) {
    const { data, error } = await supabase.rpc('search_passengers', { p_query: raw })
    if (error) searchError = error.message
    else hits = data || []
  }

  return (
    <div>
      <style>{officeCss}</style>
      <div className="pg-h">
        <h1>Search results</h1>
        <p>
          {raw ? (
            <>Showing results for <b>{raw}</b></>
          ) : (
            'Type a booking reference, a PNR, a passenger name or a passport number in the search box at the top.'
          )}
        </p>
      </div>

      <div style={{ marginTop: 22 }}>
        {raw.length > 0 && raw.length < 3 && (
          <div className="empty">Type at least 3 characters of a name or passport number, or the full booking reference or PNR.</div>
        )}

        {searchError && <div className="msg bad">{searchError}</div>}

        {pnrFlights.length > 0 && (
          <div className="card">
            <h3>PNR {code}</h3>
            {pnrFlights.map((f) => (
              <p key={f.id} className="note" style={{ margin: '0 0 4px' }}>
                {f.origin} → {f.destination}
                {f.flight_number ? ` · ${f.flight_number}` : ''} · {dmy(String(f.departure_datetime).slice(0, 10))}
              </p>
            ))}
            <p className="note" style={{ margin: '6px 0 12px' }}>
              {activeBookings.length} active booking{activeBookings.length === 1 ? '' : 's'} · {activePax} passenger
              {activePax === 1 ? '' : 's'}
            </p>
            {pnrBookings.length ? (
              <div className="tw">
                <table className="t">
                  <thead>
                    <tr><th>Booking code</th><th>Passengers</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {pnrBookings.map((b) => {
                      const n = paxCount.get(b.id) || 0
                      return (
                        <tr key={b.id}>
                          <td>
                            <Link href={`/office/b/ticket/${b.id}`} style={{ color: '#2f7f7a', fontWeight: 800 }}>
                              {b.reference || '—'}
                            </Link>
                            <div style={{ fontSize: 11, color: '#6b7c93', marginTop: 3 }}>
                              {b.booking_source === 'offline' ? 'Offline' : 'Online'}
                            </div>
                          </td>
                          <td>{leadName.get(b.id) || '—'}{n > 1 ? ` (+${n - 1})` : ''}</td>
                          <td><Badge label={payLabel(b)} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="note">No bookings have been made on this PNR yet.</p>
            )}
            {pnrBookings.length >= 150 && <p className="note">Showing the first 150 bookings.</p>}
          </div>
        )}

        {raw.length >= 3 && !searchError && hits.length === 0 && pnrFlights.length === 0 && (
          <div className="empty">
            No booking, PNR or passenger found for <b>{raw}</b>. Check the spelling and try again.
            <div style={{ marginTop: 18 }}>
              <Link href="/office" className="btn">Back to home</Link>
            </div>
          </div>
        )}

        {hits.length > 0 && (
          <div className="card">
            <h3>Passengers</h3>
            <div className="tw">
              <table className="t">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Passenger</th>
                    <th>Passport</th>
                    <th>Package / Flight</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hits.map((h) => (
                    <tr key={h.out_kind + h.out_passenger_id}>
                      <td>
                        <Link href={`/office/b/${h.out_kind}/${h.out_booking_id}`} style={{ color: '#2f7f7a', fontWeight: 800 }}>
                          {h.out_reference}
                        </Link>
                        <div style={{ fontSize: 11, color: '#6b7c93', marginTop: 3 }}>
                          {h.out_kind === 'package' ? 'Package' : 'Flight'} · {h.out_source === 'offline' ? 'Offline' : 'Online'}
                        </div>
                      </td>
                      <td>
                        {h.out_title} {h.out_given_name} {h.out_surname}
                        {h.out_in_party ? <div style={{ fontSize: 11, color: '#6b7c93', marginTop: 3 }}>Party: {h.out_in_party}</div> : null}
                      </td>
                      <td>{h.out_passport}</td>
                      <td>{h.out_what}</td>
                      <td>
                        <Badge label={payLabel({ status: h.out_status, payment_type: h.out_payment_type, booking_source: h.out_source })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hits.length >= 50 && <p className="note">Showing the 50 newest matches. Type more of the name to narrow it down.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Badge, officeCss, payLabel } from '@/app/office/lib'

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
        <p>{raw ? <>Showing results for <b>{raw}</b></> : 'Type a booking reference, a passenger name or a passport number in the search box at the top.'}</p>
      </div>

      <div style={{ marginTop: 22 }}>
        {raw.length > 0 && raw.length < 3 && (
          <div className="empty">Type at least 3 characters of a name or passport number, or the full booking reference.</div>
        )}

        {searchError && <div className="msg bad">{searchError}</div>}

        {raw.length >= 3 && !searchError && hits.length === 0 && (
          <div className="empty">
            No booking or passenger found for <b>{raw}</b>. Check the spelling and try again.
            <div style={{ marginTop: 18 }}>
              <Link href="/office" className="btn">Back to home</Link>
            </div>
          </div>
        )}

        {hits.length > 0 && (
          <div className="card">
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

import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import QRCode from 'qrcode'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/server'
import PrintButton from '@/app/dashboard/bookings/[id]/voucher/PrintButton'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

// Fixed cabin class shown on every flight voucher
const CABIN = 'Economy'

// EDIT THESE: confirm your real contact details
const COMPANY = {
  name: 'AIMA CONCERNS',
  address: '102–103 Eden Heights, Jail Road, Lahore',
  phones: '0331 3331214 · 0322 4631622 · 0300 4219008 · 0334 7821214',
  website: 'aimaconcerns.com',
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const dayText = (s: string) =>
  new Date(s.slice(0, 10) + 'T00:00:00Z')
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .toUpperCase()

const clock = (s: string) => s.slice(11, 16)

const duration = (a: string, b: string) => {
  const m = Math.round((Date.parse(b.slice(0, 16) + 'Z') - Date.parse(a.slice(0, 16) + 'Z')) / 60000)
  if (isNaN(m) || m <= 0) return ''
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

const paxType = (title: string) => (title === 'INF' ? 'Infant' : title === 'CHD' ? 'Child' : 'Adult')

export default async function TicketVoucherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/bookings/ticket/${id}/voucher`)}`)

  const { data: b } = await supabase
    .from('ticket_bookings')
    .select(
      'id, reference, status, total_amount, paid_at, phone_number, tickets(origin, destination, flight_number, ticket_type, departure_datetime, arrival_datetime, return_departure_datetime, return_arrival_datetime, return_flight_number, baggage_allowance, airlines(name, logo_url)), ticket_booking_passengers(id, title, given_name, surname, date_of_birth, nationality, passport_number, price, created_at)'
    )
    .eq('id', id)
    .eq('customer_id', user.id)
    .single()

  if (!b) notFound()
  if (b.status !== 'Paid' || !b.reference) redirect('/dashboard/bookings')

  const t: any = Array.isArray(b.tickets) ? b.tickets[0] : b.tickets
  const airline: any = t ? (Array.isArray(t.airlines) ? t.airlines[0] : t.airlines) : null
  const passengers: any[] = [...(b.ticket_booking_passengers ?? [])].sort(
    (a, c) => new Date(a.created_at).getTime() - new Date(c.created_at).getTime()
  )

  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const verifyUrl = `${proto}://${host}/admin/verify/${b.reference}`
  const qr = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 220 })

  const Leg = ({ title, o, d, dep, arr, flight }: { title: string; o: string; d: string; dep: string; arr: string; flight?: string }) => (
    <div className="v-leg">
      <div className="v-legtitle">✈ {title}</div>
      <div className="v-legrow">
        <div>
          <p className="v-time">{clock(dep)}</p>
          <p className="v-city">{o}</p>
        </div>
        <div className="v-mid">
          <b>{flight || ''}</b>
          <div className="v-line"><i /></div>
          <span>{duration(dep, arr)}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="v-time">{clock(arr)}</p>
          <p className="v-city">{d}</p>
        </div>
      </div>
      <p className="v-date">{dayText(dep)}</p>
    </div>
  )

  return (
    <div className={montserrat.className} style={{ minHeight: '100vh', backgroundColor: '#eef2f5' }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .v-bar { max-width: 820px; margin: 0 auto; padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .v-back { color: #12335f; text-decoration: none; font-weight: 600; font-size: 14px; }
        .v-sheet { max-width: 820px; margin: 0 auto 40px; background: #fff; border-radius: 12px; box-shadow: 0 10px 40px rgba(18,51,95,0.12); overflow: hidden; }
        .v-head { border-bottom: 4px solid #d9a441; padding: 24px 34px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
        .v-airline { display: flex; align-items: center; gap: 14px; }
        .v-airline img { width: 64px; height: 64px; object-fit: contain; }
        .v-airline b { display: block; color: #12335f; font-size: 20px; font-weight: 800; }
        .v-airline span { display: block; color: #7a8699; font-size: 12px; letter-spacing: 0.2em; font-weight: 700; margin-top: 4px; }
        .v-conf { display: inline-block; margin-top: 8px; background: #e3f1ea; color: #2f7f4a; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: 0.1em; }
        .v-pnr { text-align: right; }
        .v-pnr p { margin: 0; color: #7a8699; font-size: 11px; letter-spacing: 0.2em; font-weight: 700; }
        .v-pnr h1 { margin: 4px 0 0; color: #12335f; font-size: 38px; letter-spacing: 6px; font-weight: 800; }
        .v-body { padding: 10px 34px 30px; }
        .v-sec { margin: 26px 0 12px; color: #b9791a; font-size: 13px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding-bottom: 8px; border-bottom: 1px solid #e6edf3; }
        .v-k { color: #7a8699; font-size: 12px; margin: 0; }
        .v-v { color: #12335f; font-size: 15px; font-weight: 700; margin: 3px 0 0; }
        .v-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .v-table th { text-align: left; background: #f0f5f8; color: #12335f; padding: 10px; font-size: 12px; }
        .v-table td { padding: 10px; border-top: 1px solid #eef2f5; color: #3c4a5c; }
        .v-scroll { overflow-x: auto; }
        .v-leg { padding: 14px 0; }
        .v-leg + .v-leg { border-top: 1px dashed #dfe6ec; }
        .v-legtitle { font-size: 12px; font-weight: 800; color: #4a9c7a; letter-spacing: 0.1em; margin-bottom: 10px; }
        .v-legrow { display: flex; align-items: center; gap: 18px; }
        .v-time { margin: 0; font-size: 30px; font-weight: 800; color: #12335f; }
        .v-city { margin: 2px 0 0; font-size: 15px; font-weight: 700; color: #12335f; text-transform: uppercase; }
        .v-mid { flex: 1; text-align: center; font-size: 12px; color: #7a8699; }
        .v-mid b { color: #12335f; font-size: 14px; }
        .v-line { height: 2px; background: #c9d3dc; margin: 6px 0; position: relative; }
        .v-line i { position: absolute; right: 0; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: #d9a441; }
        .v-date { margin: 10px 0 0; color: #12335f; font-size: 13px; font-weight: 700; }
        .v-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 16px; }
        .v-verify { display: flex; align-items: center; gap: 18px; }
        .v-verify img { width: 120px; height: 120px; display: block; }
        .v-verify p { margin: 0; color: #7a8699; font-size: 13px; }
        .v-total { display: flex; justify-content: space-between; margin-top: 14px; padding: 12px 16px; background: #f0f5f8; border-radius: 8px; color: #12335f; font-size: 14px; }
        .v-agency { border-top: 1px solid #e6edf3; padding: 18px 34px 24px; text-align: center; background: #fafcfd; }
        .v-agency p { margin: 3px 0; color: #7a8699; font-size: 12px; }
        .v-agency b { color: #12335f; }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .v-sheet { box-shadow: none; border-radius: 0; margin: 0; max-width: none; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="v-bar no-print">
        <Link href="/dashboard/bookings" className="v-back">← Back to My Bookings</Link>
        <PrintButton />
      </div>

      <div className="v-sheet">
        <div className="v-head">
          <div className="v-airline">
            {airline?.logo_url && <img src={airline.logo_url} alt={airline.name} />}
            <div>
              <b>{airline?.name || 'Airline'}</b>
              <span>E-TICKET / ELECTRONIC TICKET</span>
              <em className="v-conf" style={{ fontStyle: 'normal' }}>CONFIRMED</em>
            </div>
          </div>
          <div className="v-pnr">
            <p>PNR / BOOKING REFERENCE</p>
            <h1>{b.reference}</h1>
          </div>
        </div>

        <div className="v-body">
          <div className="v-sec">Flight Itinerary</div>
          {t && (
            <>
              <Leg title="OUTBOUND" o={t.origin} d={t.destination} dep={t.departure_datetime} arr={t.arrival_datetime} flight={t.flight_number} />
              {t.ticket_type === 'Return' && t.return_departure_datetime && t.return_arrival_datetime && (
                <Leg title="RETURN" o={t.destination} d={t.origin} dep={t.return_departure_datetime} arr={t.return_arrival_datetime} flight={t.return_flight_number} />
              )}
            </>
          )}

          <div className="v-sec">Passengers</div>
          <div className="v-scroll">
            <table className="v-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Passenger Name</th>
                  <th>Type</th>
                  <th>Date of Birth</th>
                  <th>Passport No.</th>
                  <th style={{ textAlign: 'right' }}>Fare</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((p, i) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td><b style={{ color: '#12335f', textTransform: 'uppercase' }}>{p.title} {p.given_name} {p.surname}</b></td>
                    <td>{paxType(p.title)}</td>
                    <td>{fmt(p.date_of_birth)}</td>
                    <td>{p.passport_number}</td>
                    <td style={{ textAlign: 'right' }}>PKR {Number(p.price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="v-total">
            <span>Total Paid</span>
            <b>PKR {Number(b.total_amount).toLocaleString()}</b>
          </div>

          <div className="v-sec">Travel Details</div>
          <div className="v-grid">
            <div><p className="v-k">Booking Date</p><p className="v-v">{b.paid_at ? dayText(b.paid_at) : '—'}</p></div>
            <div><p className="v-k">Cabin</p><p className="v-v">{CABIN}</p></div>
            <div><p className="v-k">Ticket Type</p><p className="v-v">{t?.ticket_type}</p></div>
            <div><p className="v-k">Baggage</p><p className="v-v">{t?.baggage_allowance || '—'}</p></div>
            <div><p className="v-k">Ticket Status</p><p className="v-v">Confirmed</p></div>
            <div><p className="v-k">Contact Phone</p><p className="v-v">{b.phone_number}</p></div>
          </div>

          <div className="v-sec">Verification</div>
          <div className="v-verify">
            <img src={qr} alt="Booking QR code" />
            <p>Scan to verify your booking</p>
          </div>
        </div>

        <div className="v-agency">
          <p>Booked through <b>{COMPANY.name}</b></p>
          <p>{COMPANY.address}</p>
          <p>{COMPANY.phones}</p>
          <p>{COMPANY.website}</p>
        </div>
      </div>
    </div>
  )
}

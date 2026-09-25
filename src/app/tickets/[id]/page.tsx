import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/server'
import SiteHeader from '@/components/SiteHeader'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const clock = (s: string) => s.slice(11, 16)

const dayLabel = (s: string) =>
  new Date(s.slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

const duration = (a: string, b: string) => {
  const m = Math.round((Date.parse(b.slice(0, 16) + 'Z') - Date.parse(a.slice(0, 16) + 'Z')) / 60000)
  if (isNaN(m) || m <= 0) return ''
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: t } = await supabase
    .from('tickets')
    .select('*, airlines(name, logo_url)')
    .eq('id', id)
    .maybeSingle()

  if (!t) notFound()

  const a = Array.isArray(t.airlines) ? t.airlines[0] : t.airlines
  const soldOut = t.status === 'Sold Out' || t.available_seats <= 0
  const closed = t.status === 'Booking Closed' || t.status === 'Departed'
  const canBook = !soldOut && !closed
  const low = canBook && t.available_seats <= 5

  const Leg = ({ title, o, d, dep, arr, flight }: { title: string; o: string; d: string; dep: string; arr: string; flight?: string }) => (
    <div className="td-leg">
      <div className="td-legtitle">
        {title}
        {flight ? ` · ${flight}` : ''}
      </div>
      <div className="td-legrow">
        <div className="td-time">
          <strong>{clock(dep)}</strong>
          <span>{o}</span>
          <em>{dayLabel(dep)}</em>
        </div>
        <div className="td-mid">
          <span>{duration(dep, arr)}</span>
          <div className="td-line"><i /></div>
        </div>
        <div className="td-time" style={{ textAlign: 'right' }}>
          <strong>{clock(arr)}</strong>
          <span>{d}</span>
          <em>{dayLabel(arr)}</em>
        </div>
      </div>
    </div>
  )

  return (
    <div className={montserrat.className} style={{ background: '#eef2f7', minHeight: '100vh' }}>
      <style>{`
        .td-hero {
          background: linear-gradient(135deg, #0d1b2a 0%, #12335f 100%);
          border-bottom: 4px solid #d9a441; color: #fff; padding: 40px 20px 70px; text-align: center;
        }
        .td-hero h1 { margin: 0; font-size: clamp(24px, 4vw, 38px); font-weight: 800; }
        .td-hero p { margin: 10px 0 0; color: #c9d8e8; font-size: 15px; }
        .td-wrap { max-width: 980px; margin: -40px auto 0; padding: 0 16px 50px; display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start; }
        .td-main { flex: 2 1 460px; min-width: 0; }
        .td-side { flex: 1 1 280px; }
        .td-box { background: #fff; border-radius: 12px; padding: 22px; box-shadow: 0 6px 20px rgba(13,27,42,0.10); border-top: 4px solid #d9a441; margin-bottom: 18px; }
        .td-airline { display: flex; align-items: center; gap: 12px; font-weight: 700; color: #12335f; font-size: 16px; flex-wrap: wrap; }
        .td-airline img { width: 40px; height: 40px; object-fit: contain; }
        .td-chip { font-size: 11px; background: #eaf0f7; color: #12335f; padding: 4px 10px; border-radius: 12px; font-weight: 700; }
        .td-chip.warn { background: #fdf1dc; color: #b9791a; }
        .td-leg { padding: 14px 0; }
        .td-leg + .td-leg { border-top: 1px dashed #dfe6ec; }
        .td-legtitle { font-size: 12px; font-weight: 800; color: #4a9c7a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .td-legrow { display: flex; align-items: center; gap: 16px; }
        .td-time strong { display: block; font-size: 26px; color: #12335f; font-weight: 800; }
        .td-time span { display: block; font-size: 14px; color: #12335f; font-weight: 600; }
        .td-time em { font-size: 12px; color: #7a8699; font-style: normal; }
        .td-mid { flex: 1; text-align: center; font-size: 12px; color: #7a8699; }
        .td-line { height: 2px; background: #c9d3dc; margin: 6px 0; position: relative; }
        .td-line i { position: absolute; right: 0; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: #d9a441; }
        .td-h { margin: 0 0 12px; color: #12335f; font-size: 16px; font-weight: 800; }
        .td-fare { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eef1f4; color: #12335f; font-size: 14px; }
        .td-fare:last-of-type { border-bottom: none; }
        .td-fare b { font-weight: 800; }
        .td-info { color: #5b6b7e; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap; }
        .td-btn { display: block; text-align: center; margin-top: 16px; padding: 14px; background: #12335f; color: #fff; text-decoration: none; font-weight: 800; font-size: 15px; border-radius: 8px; }
        .td-btn:hover { background: #d9a441; color: #12335f; }
        .td-btn.off { background: #b8c2cc; color: #fff; pointer-events: none; }
        .td-back { display: inline-block; margin-bottom: 14px; color: #12335f; font-size: 13px; font-weight: 700; text-decoration: none; }
        .td-note { font-size: 12px; color: #7a8699; margin: 12px 0 0; text-align: center; }
      `}</style>

      <SiteHeader />

      <div className="td-hero">
        <h1>{t.origin} → {t.destination}</h1>
        <p>{a?.name || 'Airline'}{t.flight_number ? ` · ${t.flight_number}` : ''}</p>
      </div>

      <div className="td-wrap">
        <div className="td-main">
          <Link href="/tickets" className="td-back">← Back to all flights</Link>

          <div className="td-box">
            <div className="td-airline">
              {a?.logo_url && <img src={a.logo_url} alt={a.name} />}
              <span>{a?.name || 'Airline'}</span>
              <span className="td-chip">{t.ticket_type}</span>
              {t.baggage_allowance && <span className="td-chip">Baggage {t.baggage_allowance}</span>}
              {low && <span className="td-chip warn">Only {t.available_seats} seats left</span>}
            </div>

            <Leg
              title="Outbound"
              o={t.origin}
              d={t.destination}
              dep={t.departure_datetime}
              arr={t.arrival_datetime}
              flight={t.flight_number}
            />

            {t.ticket_type === 'Return' && t.return_departure_datetime && t.return_arrival_datetime && (
              <Leg
                title="Return"
                o={t.destination}
                d={t.origin}
                dep={t.return_departure_datetime}
                arr={t.return_arrival_datetime}
                flight={t.return_flight_number}
              />
            )}
          </div>

          {t.notes && (
            <div className="td-box">
              <h3 className="td-h">Important Notes</h3>
              <p className="td-info">{t.notes}</p>
            </div>
          )}
        </div>

        <div className="td-side">
          <div className="td-box" style={{ marginTop: 32 }}>
            <h3 className="td-h">Fares (per person)</h3>
            <div className="td-fare"><span>Adult</span><b>PKR {Number(t.price).toLocaleString()}</b></div>
            {Number(t.child_price) > 0 && (
              <div className="td-fare"><span>Child</span><b>PKR {Number(t.child_price).toLocaleString()}</b></div>
            )}
            {Number(t.infant_price) > 0 && (
              <div className="td-fare"><span>Infant</span><b>PKR {Number(t.infant_price).toLocaleString()}</b></div>
            )}

            <Link href={`/tickets/${t.id}/book`} className={`td-btn ${canBook ? '' : 'off'}`}>
              {soldOut ? 'Sold Out' : closed ? 'Booking Closed' : 'Book Now'}
            </Link>
            {canBook && <p className="td-note">Seats are held for 12 hours until payment.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

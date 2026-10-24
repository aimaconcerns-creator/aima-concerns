import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function BookingHome({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const active = tab === 'tickets' ? 'tickets' : 'packages'
  const supabase = await createClient()
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })

  const { data: packages } = await supabase
    .from('packages')
    .select('id, package_type, name, days, departure_date, price, available_seats, status, is_hidden')
    .gte('departure_date', today)
    .gt('available_seats', 0)
    .neq('status', 'Sold Out')
    .order('departure_date', { ascending: true })

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, ticket_type, airline_id, origin, destination, departure_datetime, flight_number, price, available_seats, status, is_hidden')
    .gte('departure_datetime', today)
    .gt('available_seats', 0)
    .neq('status', 'Sold Out')
    .order('departure_datetime', { ascending: true })

  const { data: airlines } = await supabase.from('airlines').select('id, name')
  const airlineName = new Map((airlines || []).map((a: any) => [a.id, a.name]))

  const fmt = (n: number) => 'PKR ' + Number(n).toLocaleString('en-PK')

  return (
    <div>
      <style>{`
        .bk-head h1 { margin: 0; font-size: 26px; font-weight: 800; color: #12335f; }
        .bk-head p { margin: 6px 0 0; color: #6b7c93; font-size: 14px; }
        .bk-tabs { display: flex; gap: 8px; margin: 24px 0 20px; }
        .bk-tab {
          padding: 11px 22px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700;
          background: #fff; color: #4b5f7a; border: 1px solid #e3e9f1;
        }
        .bk-tab.on { background: #12335f; color: #fff; border-color: #12335f; }
        .bk-list { display: grid; gap: 14px; }
        .bk-row {
          display: flex; align-items: center; gap: 20px; background: #fff; border: 1px solid #e3e9f1;
          border-radius: 14px; padding: 18px 22px; box-shadow: 0 3px 14px rgba(18,51,95,0.05); flex-wrap: wrap;
        }
        .bk-main { flex: 1; min-width: 240px; }
        .bk-main h3 { margin: 0; font-size: 16px; font-weight: 700; color: #12335f; }
        .bk-main p { margin: 5px 0 0; font-size: 13px; color: #6b7c93; }
        .bk-pill { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; margin-left: 8px; }
        .bk-pill.hid { background: #fff4de; color: #a8761a; }
        .bk-stat { text-align: right; min-width: 110px; }
        .bk-stat b { display: block; font-size: 15px; color: #12335f; }
        .bk-stat span { font-size: 12px; color: #6b7c93; }
        .bk-go {
          padding: 11px 22px; border-radius: 10px; background: #2f7f7a; color: #fff; text-decoration: none;
          font-size: 13.5px; font-weight: 700;
        }
        .bk-go:hover { background: #276a66; }
        .bk-empty { background: #fff; border: 1px dashed #cdd7e4; border-radius: 14px; padding: 40px; text-align: center; color: #6b7c93; }
      `}</style>

      <div className="bk-head">
        <h1>Offline Booking</h1>
        <p>Choose what the customer wants to book. Hidden items are included.</p>
      </div>

      <div className="bk-tabs">
        <Link href="/office/booking" className={'bk-tab' + (active === 'packages' ? ' on' : '')}>
          Packages ({packages?.length || 0})
        </Link>
        <Link href="/office/booking?tab=tickets" className={'bk-tab' + (active === 'tickets' ? ' on' : '')}>
          Flights ({tickets?.length || 0})
        </Link>
      </div>

      <div className="bk-list">
        {active === 'packages' && (packages?.length ? packages.map((p: any) => (
          <div className="bk-row" key={p.id}>
            <div className="bk-main">
              <h3>
                {p.name}
                {p.is_hidden && <span className="bk-pill hid">Hidden</span>}
              </h3>
              <p>{p.package_type} · {p.days} days · Departs {String(p.departure_date).slice(0, 10)}</p>
            </div>
            <div className="bk-stat"><b>{fmt(p.price)}</b><span>per person</span></div>
            <div className="bk-stat"><b>{p.available_seats}</b><span>seats left</span></div>
            <Link className="bk-go" href={`/office/booking/package/${p.id}`}>Book</Link>
          </div>
        )) : <div className="bk-empty">No packages are open for sale.</div>)}

        {active === 'tickets' && (tickets?.length ? tickets.map((t: any) => (
          <div className="bk-row" key={t.id}>
            <div className="bk-main">
              <h3>
                {t.origin} → {t.destination}
                {t.is_hidden && <span className="bk-pill hid">Hidden</span>}
              </h3>
              <p>
                {airlineName.get(t.airline_id) || 'Airline'} · {t.flight_number} · {t.ticket_type} ·{' '}
                {String(t.departure_datetime).slice(0, 10)} {String(t.departure_datetime).slice(11, 16)}
              </p>
            </div>
            <div className="bk-stat"><b>{fmt(t.price)}</b><span>adult fare</span></div>
            <div className="bk-stat"><b>{t.available_seats}</b><span>seats left</span></div>
            <Link className="bk-go" href={`/office/booking/ticket/${t.id}`}>Book</Link>
          </div>
        )) : <div className="bk-empty">No flights are open for sale.</div>)}
      </div>
    </div>
  )
}

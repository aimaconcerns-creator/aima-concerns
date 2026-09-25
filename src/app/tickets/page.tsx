import Link from 'next/link'
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
    timeZone: 'UTC',
  })

const minutesBetween = (a: string, b: string) =>
  Math.round((Date.parse(b.slice(0, 16) + 'Z') - Date.parse(a.slice(0, 16) + 'Z')) / 60000)

const duration = (a: string, b: string) => {
  const m = minutesBetween(a, b)
  if (isNaN(m) || m <= 0) return ''
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

const nextDay = (a: string, b: string) => (b.slice(0, 10) > a.slice(0, 10) ? '+1' : '')

export default async function TicketsListPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; sort?: string }>
}) {
  const { from = '', to = '', sort = 'earliest' } = await searchParams
  const supabase = await createClient()
  const now = new Date().toISOString()

  let q = supabase
    .from('tickets')
    .select('*, airlines(name, logo_url)')
    .eq('is_hidden', false)
    .gte('departure_datetime', now)

  if (from.trim()) q = q.ilike('origin', `%${from.trim()}%`)
  if (to.trim()) q = q.ilike('destination', `%${to.trim()}%`)

  q = sort === 'cheapest'
    ? q.order('price', { ascending: true })
    : q.order('departure_datetime', { ascending: true })

  const { data: tickets } = await q

  const tabHref = (s: string) => {
    const p = new URLSearchParams()
    if (from) p.set('from', from)
    if (to) p.set('to', to)
    p.set('sort', s)
    return `/tickets?${p.toString()}`
  }

  const Leg = ({ o, d, dep, arr }: { o: string; d: string; dep: string; arr: string }) => (
    <div className="sk-leg">
      <div className="sk-time">
        <strong>{clock(dep)}</strong>
        <span>{o}</span>
      </div>
      <div className="sk-mid">
        <span className="sk-dur">{duration(dep, arr)}</span>
        <div className="sk-line"><i /></div>
        <span className="sk-direct">{dayLabel(dep)}</span>
      </div>
      <div className="sk-time">
        <strong>
          {clock(arr)}
          <sup>{nextDay(dep, arr)}</sup>
        </strong>
        <span>{d}</span>
      </div>
    </div>
  )

  return (
    <div className={montserrat.className} style={{ background: '#eef2f7', minHeight: '100vh' }}>
      <style>{`
        .sk-hero {
          background: linear-gradient(135deg, #0d1b2a 0%, #12335f 100%);
          border-bottom: 4px solid #d9a441; color: #fff; padding: 46px 20px 80px; text-align: center;
        }
        .sk-hero h1 { margin: 0; font-size: clamp(24px, 4vw, 42px); font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
        .sk-hero h1 span { color: #d9a441; }
        .sk-hero p { margin: 12px 0 0; font-size: 15px; color: #c9d8e8; letter-spacing: 0.5px; }
        .sk-wrap { max-width: 980px; margin: -50px auto 0; padding: 0 16px 50px; }
        .sk-search {
          background: #fff; border-radius: 12px; padding: 18px; display: flex; flex-wrap: wrap; gap: 12px;
          box-shadow: 0 10px 30px rgba(13,27,42,0.18); align-items: flex-end; border-top: 4px solid #d9a441;
        }
        .sk-field { flex: 1 1 200px; }
        .sk-field label { display: block; font-size: 11px; font-weight: 700; color: #7a8699; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
        .sk-field input {
          width: 100%; padding: 12px; border: 1px solid #d5dde5; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: #fff; font-family: inherit;
        }
        .sk-go { padding: 13px 30px; background: #d9a441; color: #12335f; border: none; border-radius: 8px; font-weight: 800; font-size: 14px; cursor: pointer; font-family: inherit; }
        .sk-reset { padding: 12px 6px; color: #7a8699; font-size: 13px; text-decoration: none; }
        .sk-tabs { display: flex; gap: 10px; margin: 24px 0 14px; align-items: center; flex-wrap: wrap; }
        .sk-tabs span { color: #12335f; font-weight: 700; font-size: 14px; margin-right: 6px; }
        .sk-tab { padding: 8px 18px; border-radius: 20px; background: #fff; color: #12335f; text-decoration: none; font-size: 13px; font-weight: 700; border: 1px solid #d5dde5; }
        .sk-tab.on { background: #12335f; color: #fff; border-color: #12335f; }
        .sk-tabs .sk-count { color: #5b6b7e; font-size: 13px; font-weight: 600; margin-left: auto; margin-right: 0; }
        .sk-row {
          background: #fff; border-radius: 12px; margin-bottom: 14px; display: flex; overflow: hidden;
          box-shadow: 0 2px 10px rgba(18,51,95,0.08); border: 1px solid #dfe6ee; border-left: 5px solid #d9a441; transition: box-shadow .15s;
        }
        .sk-row:hover { box-shadow: 0 8px 24px rgba(18,51,95,0.16); }
        .sk-main { flex: 1; padding: 18px 22px; min-width: 0; }
        .sk-leg { display: flex; align-items: center; gap: 16px; padding: 8px 0; }
        .sk-leg + .sk-leg { border-top: 1px dashed #dfe6ec; margin-top: 6px; padding-top: 14px; }
        .sk-time { min-width: 70px; }
        .sk-time strong { display: block; font-size: 22px; color: #12335f; font-weight: 800; }
        .sk-time sup { font-size: 11px; color: #d9534f; margin-left: 2px; }
        .sk-time span { font-size: 13px; color: #7a8699; }
        .sk-mid { flex: 1; text-align: center; min-width: 90px; }
        .sk-dur { font-size: 12px; color: #7a8699; }
        .sk-line { height: 2px; background: #c9d3dc; margin: 6px 0; position: relative; }
        .sk-line i { position: absolute; right: 0; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: #d9a441; }
        .sk-direct { font-size: 12px; color: #4a9c7a; font-weight: 700; }
        .sk-info { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 13px; color: #12335f; font-weight: 600; flex-wrap: wrap; }
        .sk-info img { width: 28px; height: 28px; object-fit: contain; }
        .sk-chip { font-size: 11px; background: #eaf0f7; color: #12335f; padding: 3px 9px; border-radius: 12px; font-weight: 700; }
        .sk-chip.warn { background: #fdf1dc; color: #b9791a; }
        .sk-side {
          width: 200px; border-left: 1px solid #e6ecf1; padding: 18px; display: flex; flex-direction: column;
          justify-content: center; align-items: center; text-align: center; background: #f8fafc;
        }
        .sk-price { font-size: 25px; font-weight: 800; color: #12335f; margin: 0; }
        .sk-price small { display: block; font-size: 11px; color: #7a8699; font-weight: 500; }
        .sk-btn { margin-top: 12px; width: 100%; padding: 12px; background: #12335f; color: #fff; text-decoration: none; font-weight: 800; font-size: 14px; border-radius: 8px; text-align: center; box-sizing: border-box; }
        .sk-btn:hover { background: #d9a441; color: #12335f; }
        .sk-btn.off { background: #b8c2cc; color: #fff; pointer-events: none; }
        .sk-empty { text-align: center; color: #7a8699; padding: 60px 20px; background: #fff; border-radius: 12px; }
        @media (max-width: 720px) {
          .sk-row { flex-direction: column; }
          .sk-side { width: auto; border-left: none; border-top: 1px solid #e6ecf1; flex-direction: row; justify-content: space-between; }
          .sk-btn { width: auto; padding: 11px 24px; margin-top: 0; }
        }
      `}</style>

      <SiteHeader />

      <div className="sk-hero">
        <h1>Aima Concerns <span>Ticketing Portal</span></h1>
        <p>Search flights and book instantly with your wallet.</p>
      </div>

      <div className="sk-wrap">
        <form method="get" action="/tickets" className="sk-search">
          <div className="sk-field">
            <label>From</label>
            <input type="text" name="from" defaultValue={from} placeholder="e.g. Lahore" />
          </div>
          <div className="sk-field">
            <label>To</label>
            <input type="text" name="to" defaultValue={to} placeholder="e.g. Jeddah" />
          </div>
          <input type="hidden" name="sort" value={sort} />
          <button type="submit" className="sk-go">Search</button>
          {(from || to) && <Link href="/tickets" className="sk-reset">Clear</Link>}
        </form>

        <div className="sk-tabs">
          <span>Sort by</span>
          <Link href={tabHref('earliest')} className={`sk-tab ${sort !== 'cheapest' ? 'on' : ''}`}>Earliest</Link>
          <Link href={tabHref('cheapest')} className={`sk-tab ${sort === 'cheapest' ? 'on' : ''}`}>Cheapest</Link>
          <span className="sk-count">{tickets?.length || 0} flights</span>
        </div>

        {(!tickets || tickets.length === 0) && (
          <div className="sk-empty">No flights match your search. Try changing or clearing the filters.</div>
        )}

        {tickets?.map((t: any) => {
          const a = Array.isArray(t.airlines) ? t.airlines[0] : t.airlines
          const soldOut = t.status === 'Sold Out' || t.available_seats <= 0
          const closed = t.status === 'Booking Closed'
          const canBook = !soldOut && !closed
          const low = canBook && t.available_seats <= 5

          return (
            <div key={t.id} className="sk-row">
              <div className="sk-main">
                <div className="sk-info">
                  {a?.logo_url && <img src={a.logo_url} alt={a.name} />}
                  <span>{a?.name || 'Airline'}{t.flight_number ? ` · ${t.flight_number}` : ''}</span>
                  <span className="sk-chip">{t.ticket_type}</span>
                  {t.baggage_allowance && <span className="sk-chip">Baggage {t.baggage_allowance}</span>}
                  {low && <span className="sk-chip warn">Only {t.available_seats} seats left</span>}
                </div>

                <Leg o={t.origin} d={t.destination} dep={t.departure_datetime} arr={t.arrival_datetime} />

                {t.ticket_type === 'Return' && t.return_departure_datetime && t.return_arrival_datetime && (
                  <Leg o={t.destination} d={t.origin} dep={t.return_departure_datetime} arr={t.return_arrival_datetime} />
                )}
              </div>

              <div className="sk-side">
                <p className="sk-price">
                  <small>Per adult</small>
                  PKR {Number(t.price).toLocaleString()}
                </p>
                <Link href={`/tickets/${t.id}`} className={`sk-btn ${canBook ? '' : 'off'}`}>
                  {soldOut ? 'Sold Out' : closed ? 'Closed' : 'Book Now'}
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

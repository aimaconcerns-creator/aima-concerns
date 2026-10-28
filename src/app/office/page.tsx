import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { officeCss, pktShort, timeLeft } from './lib'
import NoticeBoard from './NoticeBoard'

type Hold = {
  id: string
  kind: 'package' | 'ticket'
  reference: string
  lead: string
  what: string
  pax: number
  expires_at: string
  remarks: string | null
}

export default async function OfficeHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: staff } = await supabase
    .from('staff')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  await supabase.rpc('expire_stale_bookings')
  const nowIso = new Date().toISOString()

  const { data: pb } = await supabase
    .from('bookings')
    .select('id, reference, package_id, seats_held, infant_count, expires_at, remarks')
    .eq('status', 'Unpaid')
    .gt('expires_at', nowIso)
  const { data: tb } = await supabase
    .from('ticket_bookings')
    .select('id, reference, ticket_id, seats_held, infant_count, expires_at, remarks')
    .eq('status', 'Unpaid')
    .gt('expires_at', nowIso)

  const pbList: any[] = pb || []
  const tbList: any[] = tb || []

  const pkgIds = Array.from(new Set(pbList.map((x) => x.package_id)))
  const tktIds = Array.from(new Set(tbList.map((x) => x.ticket_id)))
  const pkgName = new Map<string, string>()
  const tktName = new Map<string, string>()

  if (pkgIds.length) {
    const { data } = await supabase.from('packages').select('id, name').in('id', pkgIds)
    ;(data || []).forEach((p: any) => pkgName.set(p.id, p.name))
  }
  if (tktIds.length) {
    const { data } = await supabase.from('tickets').select('id, origin, destination, flight_number').in('id', tktIds)
    ;(data || []).forEach((t: any) => tktName.set(t.id, `${t.origin} → ${t.destination} · ${t.flight_number}`))
  }

  const lead = new Map<string, string>()
  if (pbList.length) {
    const { data } = await supabase
      .from('booking_passengers')
      .select('booking_id, title, given_name, surname, created_at')
      .in('booking_id', pbList.map((x) => x.id))
      .order('created_at')
    ;(data || []).forEach((p: any) => {
      if (!lead.has(p.booking_id)) lead.set(p.booking_id, `${p.title} ${p.given_name} ${p.surname}`)
    })
  }
  if (tbList.length) {
    const { data } = await supabase
      .from('ticket_booking_passengers')
      .select('ticket_booking_id, title, given_name, surname, created_at')
      .in('ticket_booking_id', tbList.map((x) => x.id))
      .order('created_at')
    ;(data || []).forEach((p: any) => {
      if (!lead.has(p.ticket_booking_id)) lead.set(p.ticket_booking_id, `${p.title} ${p.given_name} ${p.surname}`)
    })
  }

  const holds: Hold[] = []
  pbList.forEach((b) =>
    holds.push({
      id: b.id, kind: 'package', reference: b.reference,
      lead: lead.get(b.id) || '—', what: pkgName.get(b.package_id) || 'Package',
      pax: Number(b.seats_held) + Number(b.infant_count), expires_at: b.expires_at, remarks: b.remarks,
    })
  )
  tbList.forEach((b) =>
    holds.push({
      id: b.id, kind: 'ticket', reference: b.reference,
      lead: lead.get(b.id) || '—', what: tktName.get(b.ticket_id) || 'Flight',
      pax: Number(b.seats_held) + Number(b.infant_count), expires_at: b.expires_at, remarks: b.remarks,
    })
  )
  holds.sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const cards = [
    {
      href: '/office/booking',
      title: 'Offline Booking',
      text: 'Book Umrah, Ziyarat packages and airline tickets for walk-in and phone customers.',
      color: '#2f7f7a',
      icon: (
        <>
          <rect x="3" y="4" width="18" height="17" rx="3" />
          <path d="M8 2v4M16 2v4M3 10h18M12 13v5M9.5 15.5h5" />
        </>
      ),
    },
    {
      href: '/office/manifests',
      title: 'Manifests',
      text: 'See who is booked on every package and every flight, ready to print.',
      color: '#12335f',
      icon: (
        <>
          <path d="M8 3h8l4 4v14H4V3z" />
          <path d="M8 11h8M8 15h8M8 7h3" />
        </>
      ),
    },
    {
      href: '/office/accounts',
      title: 'Accounts & Finance',
      text: 'Group ledgers for every package, and party ledgers for the agents who bring you groups.',
      color: '#d9a441',
      icon: (
        <>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M3 10h18M7 15h4" />
        </>
      ),
    },
  ]

  return (
    <div>
      <style>{officeCss}{`
        .hero {
          background: linear-gradient(135deg, #0d3b47 0%, #2f7f7a 55%, #5FAE8C 100%);
          border-radius: 18px; padding: 38px 40px; color: #fff; position: relative; overflow: hidden;
          box-shadow: 0 12px 32px rgba(18, 51, 95, 0.15);
        }
        .hero::after {
          content: ''; position: absolute; right: -60px; top: -80px; width: 260px; height: 260px;
          border-radius: 50%; background: rgba(240, 168, 96, 0.35);
        }
        .hero-date { font-size: 12px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.85; margin: 0 0 10px; }
        .hero h1 { margin: 0; font-size: 30px; font-weight: 800; position: relative; z-index: 1; }
        .hero p.sub { margin: 10px 0 0; font-size: 15px; opacity: 0.92; max-width: 520px; position: relative; z-index: 1; line-height: 1.6; }

        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 22px; margin-top: 28px; }
        .tile {
          display: block; text-decoration: none; background: #fff; border: 1px solid #e3e9f1;
          border-radius: 16px; padding: 28px; box-shadow: 0 4px 18px rgba(18, 51, 95, 0.06);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .tile:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(18, 51, 95, 0.12); }
        .icon-box { width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .tile h3 { margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #12335f; }
        .tile p { margin: 0; font-size: 13.5px; line-height: 1.65; color: #6b7c93; }
        .tile .go { margin-top: 18px; font-size: 13px; font-weight: 700; color: #2f7f7a; }

        .tl-ref { color: #2f7f7a; font-weight: 800; text-decoration: none; }
        .tl-ref:hover { text-decoration: underline; }
        .tl-sub { font-size: 12px; color: #6b7c93; margin-top: 3px; }
      `}</style>

      <div className="hero">
        <p className="hero-date">{today}</p>
        <h1>Welcome, {staff?.full_name || 'Team'}</h1>
        <p className="sub">Choose what you would like to do today.</p>
      </div>

      <NoticeBoard />

      <div className="grid">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="tile">
            <div className="icon-box" style={{ background: c.color + '1a' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {c.icon}
              </svg>
            </div>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
            <div className="go">Open →</div>
          </Link>
        ))}
      </div>

      <div className="card" style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>Time-limit bookings</h3>
          <span style={{ fontSize: 13, color: '#6b7c93', fontWeight: 600 }}>{holds.length} on hold</span>
        </div>
        {holds.length ? (
          <div className="tw">
            <table className="t">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Passenger</th>
                  <th>Package / Flight</th>
                  <th className="num">Pax</th>
                  <th>Expires (PKT)</th>
                </tr>
              </thead>
              <tbody>
                {holds.map((h) => {
                  const urgent = new Date(h.expires_at).getTime() - Date.now() < 3 * 3600 * 1000
                  return (
                    <tr key={h.kind + h.id}>
                      <td><Link className="tl-ref" href={`/office/b/${h.kind}/${h.id}`}>{h.reference}</Link></td>
                      <td>
                        {h.lead}
                        {h.remarks ? <div className="tl-sub">{h.remarks}</div> : null}
                      </td>
                      <td>{h.what}</td>
                      <td className="num">{h.pax}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {pktShort(h.expires_at)}
                        <div className="tl-sub" style={urgent ? { color: '#b3261e', fontWeight: 700 } : undefined}>
                          {timeLeft(h.expires_at)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="note" style={{ margin: 0 }}>No bookings are on hold right now.</p>
        )}
        <p className="note">Seats return to the public site when the time runs out. Reload the page to refresh the countdown.</p>
      </div>
    </div>
  )
}

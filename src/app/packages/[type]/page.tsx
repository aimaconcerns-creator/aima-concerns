import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

const TYPES: Record<string, { label: string; db: string; blurb: string }> = {
  umrah: {
    label: 'Umrah Packages',
    db: 'Umrah',
    blurb: 'Browse our upcoming Umrah group packages.',
  },
  ziyarat: {
    label: 'Ziyarat Packages',
    db: 'Ziyarat',
    blurb: 'Browse our upcoming Ziyarat group packages.',
  },
}

export default async function PackagesListPage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = await params
  const config = TYPES[type]
  if (!config) notFound()

  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: packages } = await supabase
    .from('packages')
    .select('*, airlines(name, logo_url)')
    .eq('package_type', config.db)
    .eq('is_hidden', false)
    .gte('departure_date', today)
    .order('departure_date', { ascending: true })

  const statusInfo = (p: any) => {
    if (p.status === 'Sold Out' || p.available_seats <= 0) return { text: 'Sold Out', color: '#d9534f', open: false }
    if (p.status === 'Booking Closed') return { text: 'Booking Closed', color: '#e0a030', open: false }
    return { text: 'Booking Open', color: '#4a9c7a', open: true }
  }

  return (
    <div>
      <style>{`
        .pl-hero {
          background: linear-gradient(135deg, #0d3b47 0%, #2f7f7a 40%, #5FAE8C 70%, #f0a860 100%);
          border-bottom: 3px solid #d9a441; color: #fff; text-align: center; padding: 50px 20px;
        }
        .pl-hero h1 { margin: 0; font-size: clamp(28px, 4vw, 44px); font-weight: 800; letter-spacing: 1px; }
        .pl-hero p { margin: 12px 0 0; font-size: 16px; letter-spacing: 1px; }
        .pl-wrap { max-width: 1100px; margin: 40px auto 0; padding: 0 20px; }
        .pl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
        .pl-card {
          background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 8px 30px rgba(18,51,95,0.08);
          display: flex; flex-direction: column; border-top: 4px solid #d9a441;
        }
        .pl-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .pl-tag { font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #4a9c7a; }
        .pl-status { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; color: #fff; white-space: nowrap; }
        .pl-name { margin: 14px 0 4px; color: #12335f; font-size: 21px; font-weight: 800; line-height: 1.25; }
        .pl-meta { color: #7a8699; font-size: 14px; margin: 0; }
        .pl-airline { display: flex; align-items: center; gap: 10px; margin: 18px 0; padding: 12px; background: #f5f8fa; border-radius: 8px; color: #12335f; font-size: 14px; font-weight: 600; }
        .pl-airline img { width: 34px; height: 34px; object-fit: contain; }
        .pl-price { color: #12335f; font-size: 26px; font-weight: 800; margin: 0; }
        .pl-price small { display: block; color: #7a8699; font-size: 12px; font-weight: 500; }
        .pl-seats { font-size: 13px; font-weight: 600; margin: 0; text-align: right; }
        .pl-btn {
          display: block; text-align: center; margin-top: 20px; padding: 13px; border-radius: 8px;
          background: #4a9c7a; color: #fff; text-decoration: none; font-weight: 700; font-size: 15px;
        }
        .pl-btn:hover { background: #3f8b6c; }
        .pl-empty { text-align: center; color: #7a8699; padding: 60px 20px; font-size: 16px; }
      `}</style>

      <div className="pl-hero">
        <h1>{config.label}</h1>
        <p>{config.blurb}</p>
      </div>

      <div className="pl-wrap">
        {(!packages || packages.length === 0) && (
          <div className="pl-empty">No packages are available right now. Please check back soon.</div>
        )}

        <div className="pl-grid">
          {packages?.map((p: any) => {
            const s = statusInfo(p)
            const airline = Array.isArray(p.airlines) ? p.airlines[0] : p.airlines
            const low = s.open && p.available_seats <= 5

            return (
              <div key={p.id} className="pl-card">
                <div className="pl-row">
                  <span className="pl-tag">{p.package_type}</span>
                  <span className="pl-status" style={{ backgroundColor: s.color }}>{s.text}</span>
                </div>

                <h2 className="pl-name">{p.name}</h2>
                <p className="pl-meta">
                  {p.days} days · Departs{' '}
                  {new Date(p.departure_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>

                {airline && (
                  <div className="pl-airline">
                    {airline.logo_url && <img src={airline.logo_url} alt={airline.name} />}
                    {airline.name}
                  </div>
                )}

                <div className="pl-row" style={{ marginTop: airline ? 0 : 18 }}>
                  <p className="pl-price">
                    <small>Price per person</small>
                    PKR {Number(p.price).toLocaleString()}
                  </p>
                  <p className="pl-seats" style={{ color: low ? '#e0a030' : '#7a8699' }}>
                    {s.text === 'Sold Out' ? 'No seats left' : low ? `Only ${p.available_seats} left` : `${p.available_seats} seats left`}
                  </p>
                </div>

                <Link href={`/packages/${type}/${p.id}`} className="pl-btn">
                  View Details
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

const TYPE_TO_DB: Record<string, string> = { umrah: 'Umrah', ziyarat: 'Ziyarat' }

function IncludeIcon({ name }: { name: string }) {
  const props = {
    width: 26,
    height: 26,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'Air Ticket':
      return (
        <svg {...props}>
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
        </svg>
      )
    case 'Visa':
      return (
        <svg {...props}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <circle cx="12" cy="10" r="3" />
          <path d="M9 17h6" />
        </svg>
      )
    case 'Hotel Accommodation':
      return (
        <svg {...props}>
          <path d="M3 19v-9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9" />
          <path d="M3 15h18" />
          <path d="M7 8V5h4v3" />
        </svg>
      )
    case 'Meals':
      return (
        <svg {...props}>
          <path d="M6 3v6a2 2 0 0 0 4 0V3" />
          <path d="M8 11v10" />
          <path d="M17 3c-2 1-3 3.5-3 6 0 2 1 3 3 3v9" />
        </svg>
      )
    case 'Transport':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="13" rx="2" />
          <path d="M4 11h16" />
          <path d="M7 17v3M17 17v3" />
          <circle cx="8" cy="14" r="0.6" />
          <circle cx="16" cy="14" r="0.6" />
        </svg>
      )
    case 'Ziyarat':
      return (
        <svg {...props}>
          <path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <path d="M5 12l5 5 9-10" />
        </svg>
      )
  }
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>
}) {
  const { type, id } = await params
  const dbType = TYPE_TO_DB[type]
  if (!dbType) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: p } = await supabase
    .from('packages')
    .select('*, airlines(name, logo_url)')
    .eq('id', id)
    .eq('package_type', dbType)
    .eq('is_hidden', false)
    .single()

  if (!p) notFound()

  const today = new Date().toISOString().slice(0, 10)
  if (p.departure_date < today) notFound()

  const airline = Array.isArray(p.airlines) ? p.airlines[0] : p.airlines
  const includes: string[] = p.includes ?? []

  const soldOut = p.status === 'Sold Out' || p.available_seats <= 0
  const closed = p.status === 'Booking Closed'
  const canBook = !soldOut && !closed

  const bookPath = `/packages/${type}/${p.id}/book`
  const bookHref = user ? bookPath : `/login?next=${encodeURIComponent(bookPath)}`

  const brochureIsImage = p.brochure_url && /\.(png|jpe?g|webp|gif)$/i.test(p.brochure_url.split('?')[0])

  const departure = new Date(p.departure_date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      <style>{`
        .pd-hero {
          background: linear-gradient(135deg, #0d3b47 0%, #2f7f7a 40%, #5FAE8C 70%, #f0a860 100%);
          border-bottom: 3px solid #d9a441; color: #fff; padding: 40px 5% 44px;
        }
        .pd-hero-in { max-width: 1100px; margin: 0 auto; }
        .pd-back { color: #f3d9a4; text-decoration: none; font-size: 14px; font-weight: 600; }
        .pd-tag { margin-top: 18px; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #f3d9a4; }
        .pd-hero h1 { margin: 6px 0 0; font-size: clamp(28px, 4vw, 44px); font-weight: 800; line-height: 1.15; }
        .pd-hero p { margin: 10px 0 0; font-size: 16px; opacity: 0.95; }

        .pd-wrap { max-width: 1100px; margin: 36px auto 0; padding: 0 20px; display: grid; grid-template-columns: 1fr 340px; gap: 28px; align-items: start; }
        .pd-box { background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 8px 30px rgba(18,51,95,0.08); margin-bottom: 24px; }
        .pd-box h2 { margin: 0 0 16px; color: #12335f; font-size: 20px; font-weight: 800; }
        .pd-details { color: #3c4a5c; line-height: 1.8; font-size: 15px; white-space: pre-wrap; margin: 0; }

        .pd-inc { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
        .pd-inc-item {
          display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;
          padding: 20px 10px; border: 1px solid #e3ebf0; border-radius: 10px; color: #4a9c7a;
        }
        .pd-inc-item span { color: #12335f; font-size: 14px; font-weight: 600; }

        .pd-side { position: sticky; top: 90px; }
        .pd-price-l { color: #7a8699; font-size: 13px; margin: 0; }
        .pd-price { color: #12335f; font-size: 34px; font-weight: 800; margin: 2px 0 0; }
        .pd-line { display: flex; justify-content: space-between; padding: 12px 0; border-top: 1px solid #eef2f5; color: #3c4a5c; font-size: 14px; }
        .pd-line b { color: #12335f; }
        .pd-airline { display: flex; align-items: center; gap: 12px; padding: 14px; margin-top: 8px; background: #f5f8fa; border-radius: 8px; color: #12335f; font-weight: 700; font-size: 15px; }
        .pd-airline img { width: 44px; height: 44px; object-fit: contain; }
        .pd-book {
          display: block; text-align: center; margin-top: 20px; padding: 15px; border-radius: 8px;
          background: #4a9c7a; color: #fff; text-decoration: none; font-weight: 800; font-size: 16px;
        }
        .pd-book:hover { background: #3f8b6c; }
        .pd-book.off { background: #c9d2da; color: #fff; cursor: not-allowed; }
        .pd-note { text-align: center; color: #7a8699; font-size: 12px; margin: 10px 0 0; line-height: 1.5; }
        .pd-brochure { display: inline-block; padding: 12px 22px; border-radius: 8px; background: #12335f; color: #fff; text-decoration: none; font-weight: 700; font-size: 14px; }
        .pd-img { max-width: 100%; border-radius: 8px; margin-top: 14px; display: block; }

        @media (max-width: 860px) {
          .pd-wrap { grid-template-columns: 1fr; }
          .pd-side { position: static; order: -1; }
        }
      `}</style>

      <div className="pd-hero">
        <div className="pd-hero-in">
          <Link href={`/packages/${type}`} className="pd-back">← Back to {dbType} Packages</Link>
          <div className="pd-tag">{p.package_type}</div>
          <h1>{p.name}</h1>
          <p>{p.days} days · Departs {departure}</p>
        </div>
      </div>

      <div className="pd-wrap">
        <div>
          <div className="pd-box">
            <h2>Package Details</h2>
            {p.details ? (
              <p className="pd-details">{p.details}</p>
            ) : (
              <p className="pd-details" style={{ color: '#7a8699' }}>Details will be added soon.</p>
            )}
          </div>

          {includes.length > 0 && (
            <div className="pd-box">
              <h2>Package Includes</h2>
              <div className="pd-inc">
                {includes.map((item) => (
                  <div key={item} className="pd-inc-item">
                    <IncludeIcon name={item} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {p.brochure_url && (
            <div className="pd-box">
              <h2>Group Brochure</h2>
              <a href={p.brochure_url} target="_blank" rel="noopener noreferrer" className="pd-brochure">
                {brochureIsImage ? 'Open full size' : 'Download Brochure'}
              </a>
              {brochureIsImage && <img src={p.brochure_url} alt={`${p.name} brochure`} className="pd-img" />}
            </div>
          )}
        </div>

        <div className="pd-side">
          <div className="pd-box" style={{ marginBottom: 0 }}>
            <p className="pd-price-l">Price per person</p>
            <p className="pd-price">PKR {Number(p.price).toLocaleString()}</p>

            <div className="pd-line" style={{ marginTop: 14 }}>
              <span>Infant price</span>
              <b>PKR {Number(p.infant_price).toLocaleString()}</b>
            </div>
            <div className="pd-line">
              <span>Duration</span>
              <b>{p.days} days</b>
            </div>
            <div className="pd-line">
              <span>Departure</span>
              <b>{departure}</b>
            </div>
            <div className="pd-line">
              <span>Seats available</span>
              <b style={{ color: soldOut ? '#d9534f' : '#12335f' }}>{soldOut ? 'Sold Out' : p.available_seats}</b>
            </div>

            {airline && (
              <div className="pd-airline">
                {airline.logo_url && <img src={airline.logo_url} alt={airline.name} />}
                {airline.name}
              </div>
            )}

            {canBook ? (
              <Link href={bookHref} className="pd-book">Book Now</Link>
            ) : (
              <div className="pd-book off">{soldOut ? 'Sold Out' : 'Booking Closed'}</div>
            )}

            {canBook && (
              <p className="pd-note">
                {user
                  ? 'Add up to 4 passengers. Your seats are held for 12 hours until you pay.'
                  : 'You will be asked to log in before booking.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
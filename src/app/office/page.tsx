import { redirect } from 'next/navigation';
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function OfficeHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: staff } = await supabase
    .from('staff')
    .select('full_name')
    .eq('id', (user ?? redirect('/admin-login')).id)
    .single()

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
      href: '/office/ledgers',
      title: 'Group Ledgers',
      text: 'Check what each customer has paid and what is still pending on a package.',
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
      <style>{`
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
      `}</style>

      <div className="hero">
        <p className="hero-date">{today}</p>
        <h1>Welcome, {staff?.full_name || 'Team'}</h1>
        <p className="sub">Choose what you would like to do today.</p>
      </div>

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
    </div>
  )
}

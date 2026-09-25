'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/client'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const slides = [
  {
    title: 'Your Journey, Our Concerns',
    text: 'Trusted travel partner since 1999',
    bg: 'linear-gradient(180deg, #1b4a7a 0%, #3d76a8 40%, #f0a860 80%, #2a3f66 100%)',
  },
  {
    title: 'Visas, Tickets & Packages',
    text: 'Everything your travel needs, under one roof',
    bg: 'linear-gradient(135deg, #0d1b2a 0%, #1f5f8b 60%, #5FAE8C 100%)',
  },
  {
    title: 'Group Travel, Made Simple',
    text: 'Smooth planning for every group, every time',
    bg: 'linear-gradient(160deg, #12335f 0%, #3d76a8 55%, #d9a441 100%)',
  },
]

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Umrah Packages', href: '/packages/umrah' },
  { label: 'Ziyarat Packages', href: '/packages/ziyarat' },
  { label: 'Airline Tickets', href: '/tickets' },
  { label: 'Visa Services', href: '/visa-services' },
  { label: 'About Us', href: '/about' },
]

const stats = [
  { label: 'Years of Experience', value: new Date().getFullYear() - 1999, suffix: '+', decimals: 0 },
  { label: 'Satisfied Travellers', value: 20, suffix: 'K+', decimals: 0 },
  { label: 'Client Rating', value: 4.9, suffix: '', decimals: 1 },
  { label: 'Destinations', value: 32, suffix: '+', decimals: 0 },
]

const FAQS = [
  {
    q: 'How do I book a package?',
    a: 'Browse Umrah or Ziyarat Packages, click a package, then Book Now. You\u2019ll need to log in or create an account first.',
  },
  {
    q: 'Is there an age restriction for the Iraq (Ziyarat) visa?',
    a: 'Yes. Solo male travelers must be 50 years or older, and solo female travelers must be 40 years or older. There is no age restriction when traveling with family.',
  },
  {
    q: 'How do I pay for a booking?',
    a: 'Payments are made from your Aima Concerns wallet. Add money to your wallet, and once it\u2019s approved, you can pay for your reserved booking.',
  },
  {
    q: 'How long are my seats held before I have to pay?',
    a: 'Once you reserve a package, your seats are held for 12 hours. If payment isn\u2019t made within that time, the booking expires and the seats are released.',
  },
  {
    q: 'Can I cancel or get a refund after paying?',
    a: 'No. All payments are final and cannot be cancelled or refunded once confirmed.',
  },
  {
    q: 'How long does account approval take?',
    a: 'After signing up, your application is reviewed by our team. You\u2019ll be notified once your account is approved and ready to log in.',
  },
  {
    q: 'What passport requirements apply to bookings?',
    a: 'Your passport must be valid for at least 6 months beyond your departure date for any package booking.',
  },
]

function Counter({ value, suffix, decimals }: { value: number; suffix: string; decimals: number }) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const duration = 2000
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 3)
          setN(value * eased)
          if (p < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value])

  return (
    <div ref={ref} className="num">
      {n.toFixed(decimals)}
      {suffix}
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const [packages, setPackages] = useState<any[]>([])
  const [airlines, setAirlines] = useState<any[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null)
      if (data.user) {
        const { data: profile } = await supabase
          .from('csp')
          .select('"Full Name:"')
          .eq('id', data.user.id)
          .single()
        setDisplayName(profile?.['Full Name:'] || data.user.email || null)
      }
      setChecked(true)
    })

    const today = new Date().toISOString().slice(0, 10)
    supabase
      .from('packages')
      .select('id, package_type, name, days, departure_date, price, available_seats, airlines(name, logo_url)')
      .eq('status', 'Booking Open')
      .eq('is_hidden', false)
      .gte('departure_date', today)
      .order('departure_date', { ascending: true })
      .limit(3)
      .then(({ data }) => setPackages(data || []))

    supabase
      .from('airlines')
      .select('id, name, logo_url')
      .order('name', { ascending: true })
      .then(({ data }) => setAirlines(data || []))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setCurrent((c) => (c + 1) % slides.length), 5000)
    return () => clearTimeout(t)
  }, [current])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const go = (i: number) => setCurrent((i + slides.length) % slides.length)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const marqueeAirlines = airlines.length > 0 ? [...airlines, ...airlines] : []

  return (
    <div className={montserrat.className}>
      <style>{`
      * { box-sizing: border-box; }
        html { color-scheme: light; }
        body { margin: 0; background: #ffffff !important; color: #12335f; }
        .topbar {
          background: #0d1b2a; padding: 14px 5%; display: flex; justify-content: space-between;
          align-items: center; position: sticky; top: 0; z-index: 20; flex-wrap: wrap; gap: 12px;
        }
        .brand { display: flex; align-items: center; gap: 12px; }
        .logo { color: #fff; font-weight: 800; font-size: 20px; letter-spacing: 1.5px; text-transform: uppercase; line-height: 1.1; }
        .logo small { display: block; font-size: 10px; letter-spacing: 4px; font-weight: 600; color: #d9a441; }

        .menu { display: flex; gap: 26px; list-style: none; margin: 0; padding: 0; }
        .menu a { color: #dce6f0; text-decoration: none; font-size: 14px; font-weight: 500; }
        .menu a:hover { color: #d9a441; }

        .authbtns { display: flex; align-items: center; gap: 12px; }
        .loginbtn { border: 2px solid #fff; color: #fff; padding: 9px 20px; border-radius: 6px; font-weight: 700; font-size: 13px; text-decoration: none; }
        .signupbtn { background: #d9a441; color: #12335f; padding: 11px 20px; border-radius: 6px; font-weight: 700; font-size: 13px; text-decoration: none; }

        .usermenu { position: relative; }
        .userbtn { display: flex; align-items: center; gap: 10px; color: #fff; background: none; border: none; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .avatar { width: 34px; height: 34px; border-radius: 50%; background: #5FAE8C; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
        .caret { font-size: 10px; margin-left: 2px; }
        .dropdown {
          position: absolute; top: calc(100% + 12px); right: 0; background: #fff; border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2); min-width: 170px; overflow: hidden; z-index: 30;
        }
        .dropdown a, .dropdown button {
          display: block; width: 100%; text-align: left; padding: 12px 16px; color: #12335f;
          text-decoration: none; font-size: 14px; font-weight: 500; background: none; border: none;
          cursor: pointer; font-family: inherit;
        }
        .dropdown a:hover, .dropdown button:hover { background: #f5f7f8; }
        .dropdown .logout { color: #c0392b; border-top: 1px solid #eee; }

        .burger { display: none; background: none; border: none; color: #fff; font-size: 26px; cursor: pointer; }

        .hero { position: relative; height: 88vh; min-height: 520px; overflow: hidden; }
        .slide {
          position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center;
          align-items: center; text-align: center; color: #fff; padding: 0 8%;
          opacity: 0; transition: opacity 1s ease; pointer-events: none;
        }
        .slide.active { opacity: 1; pointer-events: auto; }
        .slide h1 { margin: 0; font-size: clamp(34px, 6vw, 76px); font-weight: 800; line-height: 1.1; }
        .slide p { margin: 18px 0 0; font-size: clamp(16px, 2vw, 24px); letter-spacing: 3px; font-weight: 400; }

        .arrow {
          position: absolute; top: 50%; transform: translateY(-50%); z-index: 5;
          width: 48px; height: 48px; border-radius: 50%; border: none; cursor: pointer;
          background: rgba(255,255,255,0.2); color: #fff; font-size: 22px;
        }
        .arrow:hover { background: rgba(255,255,255,0.35); }
        .dots { position: absolute; bottom: 30px; left: 0; right: 0; display: flex; justify-content: center; gap: 10px; z-index: 5; }
        .dot { width: 12px; height: 12px; border-radius: 50%; border: none; cursor: pointer; background: rgba(255,255,255,0.4); }
        .dot.on { background: #d9a441; }

        .stats { background: #fff; padding: 70px 5%; }
        .grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; text-align: center; }
        .num { font-size: clamp(38px, 5vw, 60px); font-weight: 800; color: #12335f; }
        .lbl { margin-top: 6px; color: #7a8699; font-size: 15px; font-weight: 500; letter-spacing: 1px; }
        .bar { width: 40px; height: 3px; background: #d9a441; margin: 12px auto 0; }

        /* Featured Packages */
        .hp-sec { padding: 70px 5%; }
        .hp-sec.alt { background: #f5f8fa; }
        .hp-sec-head { max-width: 1100px; margin: 0 auto 36px; text-align: center; }
        .hp-sec-head h2 { color: #12335f; font-size: clamp(24px, 3vw, 34px); font-weight: 800; margin: 0; }
        .hp-sec-head p { color: #7a8699; margin: 10px 0 0; font-size: 15px; }
        .hp-pkg-grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .hp-pkg-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 8px 30px rgba(18,51,95,0.08); border-top: 4px solid #d9a441; display: flex; flex-direction: column; }
        .hp-pkg-tag { font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #4a9c7a; }
        .hp-pkg-card h3 { margin: 12px 0 4px; color: #12335f; font-size: 20px; font-weight: 800; }
        .hp-pkg-meta { color: #7a8699; font-size: 13px; margin: 0; }
        .hp-pkg-air { display: flex; align-items: center; gap: 10px; margin: 16px 0; padding: 10px 12px; background: #f5f8fa; border-radius: 8px; color: #12335f; font-size: 13px; font-weight: 600; }
        .hp-pkg-air img { width: 28px; height: 28px; object-fit: contain; }
        .hp-pkg-foot { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 14px; }
        .hp-pkg-price-l { display: block; color: #7a8699; font-size: 11px; }
        .hp-pkg-price { color: #12335f; font-size: 21px; font-weight: 800; }
        .hp-pkg-btn { padding: 10px 18px; border-radius: 6px; background: #4a9c7a; color: #fff; text-decoration: none; font-weight: 700; font-size: 13px; white-space: nowrap; }
        .hp-pkg-btn:hover { background: #3f8b6c; }
        .hp-empty { text-align: center; color: #7a8699; grid-column: 1 / -1; padding: 20px; }
        .hp-sec-more { max-width: 1100px; margin: 30px auto 0; display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; }
        .hp-sec-more a { color: #4a9c7a; font-weight: 700; text-decoration: none; font-size: 14px; }
        .hp-sec-more a:hover { text-decoration: underline; }

        /* Airline partners marquee */
        .hp-marquee-wrap { overflow: hidden; padding: 30px 0; position: relative; }
        .hp-marquee-wrap::before, .hp-marquee-wrap::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 80px; z-index: 2;
        }
        .hp-marquee-wrap::before { left: 0; background: linear-gradient(90deg, #f5f8fa, transparent); }
        .hp-marquee-wrap::after { right: 0; background: linear-gradient(270deg, #f5f8fa, transparent); }
        .hp-marquee-track { display: flex; align-items: center; gap: 60px; width: max-content; animation: hp-scroll 30s linear infinite; }
        .hp-marquee-item { display: flex; align-items: center; justify-content: center; height: 60px; min-width: 110px; }
        .hp-marquee-item img { max-height: 50px; max-width: 130px; object-fit: contain; filter: grayscale(15%); }
        .hp-marquee-item span { color: #12335f; font-weight: 700; font-size: 14px; white-space: nowrap; }
        @keyframes hp-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* FAQ */
        .hp-faq-list { max-width: 780px; margin: 0 auto; }
        .hp-faq-item { border-bottom: 1px solid #e6edf3; }
        .hp-faq-item button {
          width: 100%; text-align: left; background: none; border: none; padding: 20px 4px;
          display: flex; justify-content: space-between; align-items: center; gap: 16px;
          color: #12335f; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit;
        }
        .hp-faq-item span { color: #4a9c7a; font-size: 20px; font-weight: 800; flex-shrink: 0; }
        .hp-faq-item p { margin: 0 4px 20px; color: #5c6b7a; font-size: 14px; line-height: 1.7; }

        /* Footer */
        .site-footer { background: #0a1420; padding: 60px 5% 0; position: relative; }
        .site-footer::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #d9a441, #4a9c7a, #d9a441); }
        .sf-top { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.6fr 1fr 1fr 1.2fr; gap: 40px; padding-bottom: 44px; }
        .sf-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .sf-brand-name { color: #fff; font-weight: 800; font-size: 19px; letter-spacing: 1.5px; text-transform: uppercase; line-height: 1.1; }
        .sf-brand-name small { display: block; font-size: 10px; letter-spacing: 4px; font-weight: 600; color: #d9a441; margin-top: 3px; }
        .sf-desc { color: #8fa2b3; font-size: 14px; line-height: 1.7; margin: 0; max-width: 340px; }
        .sf-col h4 { color: #d9a441; font-size: 15px; font-weight: 700; margin: 0 0 20px; letter-spacing: 0.03em; }
        .sf-col ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 13px; }
        .sf-col ul a { color: #b7c6d4; text-decoration: none; font-size: 14px; transition: color 0.15s; }
        .sf-col ul a:hover { color: #4a9c7a; }
        .sf-contact p { color: #b7c6d4; font-size: 14px; line-height: 1.7; margin: 0 0 16px; }
        .sf-contact a { color: #b7c6d4; text-decoration: none; }
        .sf-contact a:hover { color: #4a9c7a; }
        .sf-bottom { max-width: 1200px; margin: 0 auto; border-top: 1px solid rgba(255,255,255,0.08); padding: 22px 0; text-align: center; }
        .sf-bottom p { margin: 0; color: #7188a0; font-size: 13px; }
        @media (max-width: 900px) {
          .sf-top { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 560px) {
          .sf-top { grid-template-columns: 1fr; }
        }

        @media (max-width: 900px) {
          .menu { display: none; }
          .burger { display: block; }
          .grid { grid-template-columns: repeat(2, 1fr); }
          .arrow { display: none; }
        }

        .mobilemenu { background: #0d1b2a; padding: 10px 5% 20px; }
        .mobilemenu a { display: block; color: #dce6f0; text-decoration: none; padding: 10px 0; font-size: 15px; border-top: 1px solid rgba(255,255,255,0.08); }
      `}</style>

      <div className="topbar">
        <div className="brand">
          <Image src="/logo.png" alt="Aima Concerns" width={42} height={42} style={{ objectFit: 'contain' }} />
          <div className="logo">
            Aima Concerns
            <small>EST. 1999</small>
          </div>
        </div>

        <ul className="menu">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>

        {checked && (
          user ? (
            <div className="usermenu" ref={userMenuRef}>
              <button className="userbtn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <span className="avatar">{(displayName || 'U').charAt(0).toUpperCase()}</span>
                {displayName}
                <span className="caret">▾</span>
              </button>
              {userMenuOpen && (
                <div className="dropdown">
                  <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}>Dashboard</Link>
                  <button className="logout" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div className="authbtns">
              <Link href="/login" className="loginbtn">Login</Link>
              <Link href="/register" className="signupbtn">Sign up</Link>
            </div>
          )
        )}

        <button className="burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          ☰
        </button>
      </div>

      {menuOpen && (
        <div className="mobilemenu">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <div className="hero">
        {slides.map((s, i) => (
          <div key={i} className={`slide ${i === current ? 'active' : ''}`} style={{ background: s.bg }}>
            <h1>{s.title}</h1>
            <p>{s.text}</p>
          </div>
        ))}

        <button className="arrow" style={{ left: 20 }} onClick={() => go(current - 1)} aria-label="Previous slide">‹</button>
        <button className="arrow" style={{ right: 20 }} onClick={() => go(current + 1)} aria-label="Next slide">›</button>

        <div className="dots">
          {slides.map((_, i) => (
            <button key={i} className={`dot ${i === current ? 'on' : ''}`} onClick={() => go(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      </div>

      <div className="stats" id="stats">
        <div className="grid">
          {stats.map((s) => (
            <div key={s.label}>
              <Counter value={s.value} suffix={s.suffix} decimals={s.decimals} />
              <div className="bar" />
              <div className="lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Packages */}
      <div className="hp-sec">
        <div className="hp-sec-head">
          <h2>Featured Packages</h2>
          <p>Handpicked Umrah and Ziyarat packages currently open for booking</p>
        </div>
        <div className="hp-pkg-grid">
          {packages.length === 0 && (
            <p className="hp-empty">No active packages right now. Please check back soon.</p>
          )}
          {packages.map((p) => {
            const airline = Array.isArray(p.airlines) ? p.airlines[0] : p.airlines
            const typePath = p.package_type === 'Ziyarat' ? 'ziyarat' : 'umrah'
            return (
              <div key={p.id} className="hp-pkg-card">
                <span className="hp-pkg-tag">{p.package_type}</span>
                <h3>{p.name}</h3>
                <p className="hp-pkg-meta">
                  {p.days} days · Departs{' '}
                  {new Date(p.departure_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {airline && (
                  <div className="hp-pkg-air">
                    {airline.logo_url && <img src={airline.logo_url} alt={airline.name} />}
                    {airline.name}
                  </div>
                )}
                <div className="hp-pkg-foot">
                  <div>
                    <span className="hp-pkg-price-l">From</span>
                    <div className="hp-pkg-price">PKR {Number(p.price).toLocaleString()}</div>
                  </div>
                  <Link href={`/packages/${typePath}/${p.id}`} className="hp-pkg-btn">View Details</Link>
                </div>
              </div>
            )
          })}
        </div>
        <div className="hp-sec-more">
          <Link href="/packages/umrah">View All Umrah Packages →</Link>
          <Link href="/packages/ziyarat">View All Ziyarat Packages →</Link>
        </div>
      </div>

      {/* Airline Partners */}
      <div className="hp-sec alt">
        <div className="hp-sec-head">
          <h2>Our Global Airline Partners</h2>
          <p>We work with leading airlines to get you where you need to go</p>
        </div>
        {marqueeAirlines.length > 0 && (
          <div className="hp-marquee-wrap">
            <div className="hp-marquee-track">
              {marqueeAirlines.map((a, i) => (
                <div key={`${a.id}-${i}`} className="hp-marquee-item">
                  {a.logo_url ? <img src={a.logo_url} alt={a.name} /> : <span>{a.name}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAQs */}
      <div className="hp-sec" id="faq">
        <div className="hp-sec-head">
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know before you book</p>
        </div>
        <div className="hp-faq-list">
          {FAQS.map((f, i) => (
            <div key={i} className="hp-faq-item">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {f.q}
                <span>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && <p>{f.a}</p>}
            </div>
          ))}
        </div>
      </div>

      <footer className="site-footer">
        <div className="sf-top">
          <div>
            <div className="sf-brand">
              <Image src="/logo.png" alt="Aima Concerns" width={40} height={40} style={{ objectFit: 'contain' }} />
              <div className="sf-brand-name">
                Aima Concerns
                <small>EST. 1999</small>
              </div>
            </div>
            <p className="sf-desc">
              Your trusted travel partner for Umrah, Ziyarat and worldwide air travel.
              Serving pilgrims and travellers with care since 1999.
            </p>
          </div>

          <div className="sf-col">
            <h4>Services</h4>
            <ul>
              <li><Link href="/packages/umrah">Umrah Packages</Link></li>
              <li><Link href="/packages/ziyarat">Ziyarat Packages</Link></li>
              <li><Link href="/tickets">Airline Tickets</Link></li>
              <li><Link href="/visa-services">Visa Services</Link></li>
            </ul>
          </div>

          <div className="sf-col">
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/#faq">FAQs</Link></li>
            </ul>
          </div>

          <div className="sf-col sf-contact">
            <h4>Contact Us</h4>
            <p>
              Office 102 &amp; 103, Eden Heights,<br />
              Jail Road, Lahore
            </p>
            <p>
              <a href="tel:+923224631622">+92 322 4631622</a><br />
              <a href="tel:+923327869765">+92 332 7869765</a>
            </p>
            <p>
              <a href="mailto:aimaconcerns@gmail.com">aimaconcerns@gmail.com</a>
            </p>
          </div>
        </div>

        <div className="sf-bottom">
          <p>© {new Date().getFullYear()} Aima Concerns. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
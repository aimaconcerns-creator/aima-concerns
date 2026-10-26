import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/server'
import OfficeLogoutButton from './OfficeLogoutButton'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export default async function OfficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin-login')
  }

  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!staff || !['Super Admin', 'Office'].includes(staff.role)) {
    redirect('/dashboard')
  }

  const navItems = [
    { href: '/office', label: 'Home' },
    { href: '/office/booking', label: 'Offline Booking' },
    { href: '/office/manifests', label: 'Manifests' },
    { href: '/office/accounts', label: 'Accounts & Finance' },
  ]

  return (
    <div className={`office-shell ${montserrat.className}`}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .office-shell { min-height: 100vh; background: #f4f7fb; color: #12335f; }

        .topbar {
          position: sticky; top: 0; z-index: 20; background: #fff;
          border-bottom: 1px solid #e3e9f1; box-shadow: 0 2px 12px rgba(18, 51, 95, 0.05);
        }
        .topbar-inner {
          max-width: 1280px; margin: 0 auto; padding: 0 28px; height: 72px;
          display: flex; align-items: center; gap: 24px;
        }
        .logo-wrap { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .logo-wrap img { height: 42px; width: auto; }
        .logo-text { display: flex; flex-direction: column; line-height: 1.15; }
        .logo-text b { font-size: 15px; font-weight: 800; letter-spacing: 0.08em; color: #12335f; }
        .logo-text span { font-size: 10px; font-weight: 600; letter-spacing: 0.3em; color: #d9a441; }

        .menu { display: flex; gap: 4px; flex: 1; }
        .menu a {
          padding: 10px 14px; border-radius: 8px; text-decoration: none;
          font-size: 13.5px; font-weight: 600; color: #4b5f7a; white-space: nowrap;
        }
        .menu a:hover { background: #eef4f3; color: #2f7f7a; }

        .search { display: flex; gap: 6px; }
        .search input {
          width: 260px; height: 40px; padding: 0 12px; border: 1px solid #d5dde8; border-radius: 9px;
          font-size: 13px; font-family: inherit; color: #12335f; text-transform: uppercase;
        }
        .search input::placeholder { text-transform: none; color: #8a96a8; }
        .search input:focus { outline: none; border-color: #2f7f7a; box-shadow: 0 0 0 3px rgba(47,127,122,0.12); }
        .search button {
          height: 40px; padding: 0 16px; border: none; border-radius: 9px; background: #2f7f7a; color: #fff;
          font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer;
        }

        .who { display: flex; align-items: center; gap: 14px; }
        .who-text { text-align: right; line-height: 1.25; }
        .who-name { font-size: 13px; font-weight: 700; color: #12335f; margin: 0; }
        .who-role { font-size: 10.5px; font-weight: 600; color: #2f7f7a; margin: 0; letter-spacing: 0.1em; text-transform: uppercase; }

        .content { max-width: 1280px; margin: 0 auto; padding: 36px 28px 60px; }

        @media (max-width: 1100px) { .who-text { display: none; } }
        @media (max-width: 900px) {
          .topbar-inner { flex-wrap: wrap; height: auto; padding: 12px 16px; gap: 10px; }
          .menu { order: 3; width: 100%; overflow-x: auto; }
          .search { order: 2; flex: 1; }
          .search input { width: 100%; }
          .content { padding: 24px 16px 40px; }
        }

        @media print {
          .topbar { display: none !important; }
          .office-shell { background: #fff !important; }
          .content { padding: 0 !important; max-width: none !important; }
        }
      `}</style>

      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/office" className="logo-wrap">
            <img src="/logo.png" alt="Aima Concerns" />
            <span className="logo-text">
              <b>AIMA CONCERNS</b>
              <span>WORK PORTAL</span>
            </span>
          </Link>

          <nav className="menu">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>{item.label}</Link>
            ))}
            {staff.role === 'Super Admin' && <Link href="/admin">Admin panel</Link>}
          </nav>

          <form action="/office/find" method="get" className="search">
            <input name="ref" placeholder="Search reference, name or passport" required />
            <button type="submit">Search</button>
          </form>

          <div className="who">
            <div className="who-text">
              <p className="who-name">{staff.full_name}</p>
              <p className="who-role">{staff.role}</p>
            </div>
            <OfficeLogoutButton />
          </div>
        </div>
      </header>

      <main className="content">{children}</main>
    </div>
  )
}

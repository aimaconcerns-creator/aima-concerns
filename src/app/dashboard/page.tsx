import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/server'
import LogoutButton from './LogoutButton'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('csp')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('id', user.id)
    .single()

  const displayName = profile?.['Full Name:'] || user.email
  const balance = wallet?.balance ?? 0

  return (
    <div className={montserrat.className}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .wrap { min-height: 100vh; background: #f4f7f9; }

        .topbar {
          background: linear-gradient(90deg, #0d3b47 0%, #2f7f7a 100%);
          padding: 18px 30px; display: flex; justify-content: space-between; align-items: center;
        }
        .topbar-left { display: flex; align-items: center; gap: 14px; }
        .topbar-left a { color: #fff; font-size: 20px; text-decoration: none; display: flex; align-items: center; }
        .brand-name { color: #fff; font-weight: 800; font-size: 18px; letter-spacing: 0.02em; }

        .content { padding: 30px 20px; max-width: 900px; margin: 0 auto; }
        h1 { color: #12335f; margin: 0 0 4px; font-size: 26px; font-weight: 800; }
        .sub { color: #7a8699; margin: 0 0 22px; font-size: 15px; }

        .hero {
          border-radius: 18px; padding: 26px; margin-bottom: 26px; color: #fff;
          background: linear-gradient(135deg, #0d3b47 0%, #2f7f7a 45%, #5FAE8C 80%, #f0a860 120%);
          box-shadow: 0 10px 30px rgba(13, 59, 71, 0.25);
          display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;
        }
        .hero .label { margin: 0; color: rgba(255,255,255,0.8); font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; }
        .hero .amount { margin: 6px 0 0; font-size: 32px; font-weight: 800; }
        .hero-actions { display: flex; gap: 10px; }
        .hero-actions a {
          padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; white-space: nowrap; font-size: 14px;
        }
        .btn-ghost { background: rgba(255,255,255,0.18); color: #fff; }
        .btn-solid { background: #fff; color: #2f7f5a; }

        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }
        .card {
          background: #fff; border-radius: 14px; padding: 22px;
          box-shadow: 0 6px 20px rgba(18, 51, 95, 0.07); text-decoration: none; color: inherit; display: block;
        }
        .card h3 { color: #12335f; margin: 0 0 8px; font-size: 16px; font-weight: 700; }
        .card p { color: #7a8699; margin: 0; font-size: 14px; line-height: 1.5; }
        .card.disabled { opacity: 0.55; }
      `}</style>

      <div className="wrap">
        <div className="topbar">
          <div className="topbar-left">
            <Link href="/" aria-label="Back to home">←</Link>
            <Image src="/logo.png" alt="Aima Concerns" width={36} height={36} style={{ objectFit: 'contain' }} />
            <span className="brand-name">Aima Concerns</span>
          </div>
          <LogoutButton />
        </div>

        <div className="content">
          <h1>Welcome, {displayName}</h1>
          <p className="sub">Here&apos;s an overview of your account</p>

          <div className="hero">
            <div>
              <p className="label">Wallet Balance</p>
              <p className="amount">PKR {Number(balance).toLocaleString()}</p>
            </div>
            <div className="hero-actions">
              <Link href="/wallet/history" className="btn-ghost">History</Link>
              <Link href="/wallet/add-money" className="btn-solid">+ Add Money</Link>
            </div>
          </div>

          <div className="grid">
            <Link href="/profile" className="card">
              <h3>My Profile</h3>
              <p>View and update your personal details, CNIC, and passport information.</p>
            </Link>

            <Link href="/dashboard/bookings" className="card">
              <h3>My Bookings</h3>
              <p>View your bookings, pay for reserved seats, and open your vouchers.</p>
            </Link>

            <div className="card disabled">
              <h3>Visa Status</h3>
              <p>Coming soon</p>
            </div>

            <div className="card disabled">
              <h3>Documents</h3>
              <p>Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
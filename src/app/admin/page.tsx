import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function AdminHomePage() {
  const supabase = await createClient()

  const { count: customerCount } = await supabase
    .from('csp')
    .select('*', { count: 'exact', head: true })

  const { count: pendingTopups } = await supabase
    .from('topup_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Pending Verification')

  const { count: pendingBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Unpaid')

  const { count: pendingApprovals } = await supabase
    .from('csp')
    .select('*', { count: 'exact', head: true })
    .eq('approval_status', 'Pending')

  const { data: wallets } = await supabase
    .from('wallets')
    .select('balance')

  const totalBalance = wallets?.reduce((sum, w) => sum + Number(w.balance), 0) ?? 0

  const cards = [
    {
      label: 'Total Customers',
      value: customerCount ?? 0,
      href: '/admin/customers',
      alert: false,
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals ?? 0,
      href: '/admin/approvals',
      alert: (pendingApprovals ?? 0) > 0,
    },
    {
      label: 'Pending Top-up Requests',
      value: pendingTopups ?? 0,
      href: '/admin/payments',
      alert: (pendingTopups ?? 0) > 0,
    },
    {
      label: 'Unpaid Bookings',
      value: pendingBookings ?? 0,
      href: '/admin/bookings',
      alert: (pendingBookings ?? 0) > 0,
    },
  ]

  return (
    <div style={{ padding: '34px' }}>
      <style>{`
        .ov-title { color: #fff; font-size: 22px; font-weight: 800; letter-spacing: 0.02em; margin: 0 0 6px; }
        .ov-sub { color: #5a7184; font-size: 13.5px; margin: 0 0 28px; }

        .ov-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 16px; margin-bottom: 30px; }
        .ov-card {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
          padding: 22px; text-decoration: none; display: block; box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        }
        .ov-card.alert { border-left: 3px solid #d9a441; border-top-color: rgba(255,255,255,0.08); border-right-color: rgba(255,255,255,0.08); border-bottom-color: rgba(255,255,255,0.08); }
        .ov-label { color: #7d93a3; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
        .ov-value { color: #fff; margin: 10px 0 0; font-size: 30px; font-weight: 800; }
        .ov-value.gold { color: #d9a441; }

        .ov-balance {
          background: linear-gradient(135deg, rgba(217,164,65,0.10), rgba(47,127,122,0.10));
          border: 1px solid rgba(217, 164, 65, 0.25); border-radius: 14px; padding: 26px 28px;
          display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;
        }
        .ov-balance-label { color: #a8c5cc; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; }
        .ov-balance-value { color: #fff; margin: 6px 0 0; font-size: 34px; font-weight: 800; }

        .ov-note { color: #5a7184; margin-top: 30px; font-size: 13.5px; }
      `}</style>

      <h1 className="ov-title">Overview</h1>
      <p className="ov-sub">A quick snapshot of Aima Concerns right now.</p>

      <div className="ov-grid">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className={`ov-card ${c.alert ? 'alert' : ''}`}>
            <p className="ov-label">{c.label}</p>
            <p className={`ov-value ${c.alert ? 'gold' : ''}`}>{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="ov-balance">
        <div>
          <p className="ov-balance-label">Total Wallet Balance (all customers)</p>
          <p className="ov-balance-value">PKR {totalBalance.toLocaleString()}</p>
        </div>
      </div>

      <p className="ov-note">Select a section from the sidebar to manage your business.</p>
    </div>
  )
}
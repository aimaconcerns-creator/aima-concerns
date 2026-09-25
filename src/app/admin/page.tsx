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

  const { data: wallets } = await supabase
    .from('wallets')
    .select('balance')

  const totalBalance = wallets?.reduce((sum, w) => sum + Number(w.balance), 0) ?? 0

  return (
    <div style={{ padding: '34px' }}>
      <style>{`
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 34px; }
        .stat-card {
          position: relative; overflow: hidden; border-radius: 14px; padding: 24px;
          background: linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
          text-decoration: none; color: inherit; display: block;
        }
        .stat-card::before {
          content: ''; position: absolute; top: -40%; right: -20%; width: 160px; height: 160px;
          border-radius: 50%; filter: blur(40px); opacity: 0.35;
        }
        .stat-card.teal::before { background: #2f7f7a; }
        .stat-card.gold::before { background: #d9a441; }
        .stat-card.alert::before { background: #d9534f; }
        .stat-label { color: #7d93a3; margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; position: relative; z-index: 1; }
        .stat-value { color: #fff; margin: 8px 0 0; font-size: 32px; font-weight: 800; position: relative; z-index: 1; }
        .stat-flag { display: inline-block; margin-top: 10px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; position: relative; z-index: 1; }

        .hint { color: #5a7184; font-size: 14px; }
      `}</style>

      <h1 style={{ color: '#fff', margin: '0 0 30px', fontSize: '24px', fontWeight: 800, letterSpacing: '0.02em' }}>
        Overview
      </h1>

      <div className="stat-grid">
        <div className="stat-card teal">
          <p className="stat-label">Total Customers</p>
          <p className="stat-value">{customerCount ?? 0}</p>
        </div>

        <Link href="/admin/payments" className={`stat-card ${pendingTopups ? 'alert' : 'gold'}`}>
          <p className="stat-label">Pending Top-up Requests</p>
          <p className="stat-value">{pendingTopups ?? 0}</p>
          {!!pendingTopups && (
            <span className="stat-flag" style={{ background: 'rgba(217, 83, 79, 0.15)', color: '#ff8f8a' }}>
              Needs review
            </span>
          )}
        </Link>

        <div className="stat-card gold">
          <p className="stat-label">Total Wallet Balance</p>
          <p className="stat-value">PKR {totalBalance.toLocaleString()}</p>
        </div>
      </div>

      <p className="hint">Select a section from the sidebar to manage your business.</p>
    </div>
  )
}
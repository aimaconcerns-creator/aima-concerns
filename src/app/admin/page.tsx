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

  const { data: wallets } = await supabase
    .from('wallets')
    .select('balance')

  const totalBalance = wallets?.reduce((sum, w) => sum + Number(w.balance), 0) ?? 0

  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '25px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
  }

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ color: '#155263', marginBottom: '25px' }}>Overview</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}
      >
        <div style={cardStyle}>
          <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Total Customers</p>
          <p style={{ color: '#155263', margin: '5px 0 0', fontSize: '28px', fontWeight: 'bold' }}>
            {customerCount ?? 0}
          </p>
        </div>

        <Link href="/admin/payments" style={{ textDecoration: 'none' }}>
          <div style={{ ...cardStyle, borderLeft: pendingTopups ? '4px solid #e0a030' : '4px solid transparent' }}>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Pending Top-up Requests</p>
            <p style={{ color: '#155263', margin: '5px 0 0', fontSize: '28px', fontWeight: 'bold' }}>
              {pendingTopups ?? 0}
            </p>
          </div>
        </Link>

        <Link href="/admin/bookings" style={{ textDecoration: 'none' }}>
          <div style={{ ...cardStyle, borderLeft: pendingBookings ? '4px solid #e0a030' : '4px solid transparent' }}>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Unpaid Bookings</p>
            <p style={{ color: '#155263', margin: '5px 0 0', fontSize: '28px', fontWeight: 'bold' }}>
              {pendingBookings ?? 0}
            </p>
          </div>
        </Link>

        <div style={cardStyle}>
          <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Total Wallet Balance (all customers)</p>
          <p style={{ color: '#155263', margin: '5px 0 0', fontSize: '28px', fontWeight: 'bold' }}>
            PKR {totalBalance.toLocaleString()}
          </p>
        </div>
      </div>

      <p style={{ color: '#666' }}>Select a section from the sidebar to manage your business.</p>
    </div>
  )
}
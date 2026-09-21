import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import LogoutButton from './LogoutButton'

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

  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '25px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7f8', fontFamily: 'sans-serif' }}>
      <div
        style={{
          backgroundColor: '#155263',
          padding: '20px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Image src="/logo.png" alt="Aima Concerns" width={40} height={40} style={{ objectFit: 'contain' }} />
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>Aima Concerns</span>
        </div>
        <LogoutButton />
      </div>

      <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ color: '#155263', marginBottom: '5px' }}>Welcome, {displayName}</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>Here&apos;s an overview of your account</p>

        <div
          style={{
            backgroundColor: '#155263',
            borderRadius: '10px',
            padding: '25px',
            marginBottom: '25px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px',
          }}
        >
          <div>
            <p style={{ color: '#a8c5cc', margin: 0, fontSize: '14px' }}>Wallet Balance</p>
            <p style={{ color: '#fff', margin: 0, fontSize: '32px', fontWeight: 'bold' }}>
              PKR {Number(balance).toLocaleString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/wallet/history"
              style={{
                padding: '12px 20px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}
            >
              History
            </Link>
            <Link
              href="/wallet/add-money"
              style={{
                padding: '12px 25px',
                backgroundColor: '#5FAE8C',
                color: '#fff',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}
            >
              + Add Money
            </Link>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          <Link href="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={cardStyle}>
              <h3 style={{ color: '#155263', marginTop: 0 }}>My Profile</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                View and update your personal details, CNIC, and passport information.
              </p>
            </div>
          </Link>

          <div style={{ ...cardStyle, opacity: 0.6 }}>
            <h3 style={{ color: '#155263', marginTop: 0 }}>My Bookings</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Coming soon</p>
          </div>

          <div style={{ ...cardStyle, opacity: 0.6 }}>
            <h3 style={{ color: '#155263', marginTop: 0 }}>Visa Status</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Coming soon</p>
          </div>

          <div style={{ ...cardStyle, opacity: 0.6 }}>
            <h3 style={{ color: '#155263', marginTop: 0 }}>Documents</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}
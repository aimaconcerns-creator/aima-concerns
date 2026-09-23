import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import LogoutButton from '../dashboard/LogoutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!staff) {
    redirect('/dashboard')
  }

  const linkStyle = {
    display: 'block',
    padding: '12px 20px',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '14px',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'sans-serif' }}>
      <div
        style={{
          width: '220px',
          backgroundColor: '#155263',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
            Aima Concerns
          </span>
          <p style={{ color: '#a8c5cc', fontSize: '12px', margin: '4px 0 0' }}>Admin Panel</p>
        </div>

        <nav style={{ flex: 1, paddingTop: '10px' }}>
          <Link href="/admin" style={linkStyle}>Dashboard</Link>
          <Link href="/admin/approvals" style={linkStyle}>Pending Approvals</Link>
          <Link href="/admin/customers" style={linkStyle}>Customers</Link>
          <Link href="/admin/payments" style={linkStyle}>Payments</Link>
          <Link href="/admin/visa" style={linkStyle}>Visa Applications</Link>
          <Link href="/admin/packages" style={linkStyle}>Packages</Link>
          <Link href="/admin/manifests" style={linkStyle}>Group Manifests</Link>
          <Link href="/admin/airlines" style={linkStyle}>Manage Airlines</Link>
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <p style={{ color: '#a8c5cc', fontSize: '12px', margin: '0 0 10px' }}>
            {staff.full_name} ({staff.role})
          </p>
          <LogoutButton />
        </div>
      </div>

      <div style={{ flex: 1, backgroundColor: '#f5f7f8' }}>
        {children}
      </div>
    </div>
  )
}
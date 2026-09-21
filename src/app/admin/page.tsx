import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LogoutButton from '../dashboard/LogoutButton'

export default async function AdminPage() {
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
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>
          Aima Concerns — Admin Panel
        </span>
        <LogoutButton />
      </div>

      <div style={{ padding: '30px' }}>
        <h1 style={{ color: '#155263' }}>Welcome, {staff.full_name}</h1>
        <p style={{ color: '#666' }}>Role: {staff.role}</p>
      </div>
    </div>
  )
}
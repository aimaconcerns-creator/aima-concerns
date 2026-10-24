'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function OfficeLogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin-login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '9px 16px',
        borderRadius: 8,
        border: '1px solid #d5dde8',
        background: '#fff',
        color: '#12335f',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: 'pointer',
      }}
    >
      Log out
    </button>
  )
}

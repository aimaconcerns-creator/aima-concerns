import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import NoticeManager from './NoticeManager'

export const dynamic = 'force-dynamic'

export default async function NoticesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const { data: me } = await supabase.from('staff').select('role, full_name').eq('id', user.id).single()
  if (!me || me.role !== 'Super Admin') redirect('/office')

  const { data } = await supabase
    .from('notices')
    .select('id, title, message, important, expires_on, created_by_name, created_at')
    .order('created_at', { ascending: false })

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })

  return (
    <NoticeManager
      notices={data || []}
      today={today}
      userId={user.id}
      userName={me.full_name || ''}
    />
  )
}

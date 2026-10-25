import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient, hasAdminKey } from '@/utils/supabase/admin'
import StaffManager from './StaffManager'

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const { data: me } = await supabase.from('staff').select('role').eq('id', user.id).single()
  if (!me || me.role !== 'Super Admin') redirect('/office')

  const { data: staff } = await supabase
    .from('staff')
    .select('id, full_name, role, created_at')
    .order('created_at', { ascending: true })

  const keyReady = hasAdminKey()
  const info = new Map<string, { email: string | null; last: string | null }>()

  if (keyReady) {
    try {
      const admin = createAdminClient()
      const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      for (const u of data?.users || []) {
        info.set(u.id, { email: u.email ?? null, last: u.last_sign_in_at ?? null })
      }
    } catch {
      // the list still shows, just without emails
    }
  }

  const rows = (staff || []).map((s: any) => {
    const i = info.get(s.id)
    return {
      id: s.id as string,
      full_name: s.full_name as string | null,
      role: s.role as string,
      email: i?.email ?? null,
      lastLogin: i?.last
        ? new Date(i.last).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' })
        : 'Never',
      isMe: s.id === user.id,
    }
  })

  return <StaffManager rows={rows} keyReady={keyReady} />
}

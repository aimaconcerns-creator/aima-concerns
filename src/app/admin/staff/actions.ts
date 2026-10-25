'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient, hasAdminKey } from '@/utils/supabase/admin'

type Result = { ok: boolean; message: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function currentSuperAdminId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: staff } = await supabase.from('staff').select('role').eq('id', user.id).single()
  if (!staff || staff.role !== 'Super Admin') return null
  return user.id
}

async function officeTarget(admin: ReturnType<typeof createAdminClient>, id: string) {
  const { data } = await admin.from('staff').select('id, full_name, role').eq('id', id).maybeSingle()
  if (!data || data.role !== 'Office') return null
  return data
}

export async function createStaff(input: { fullName: string; email: string; password: string }): Promise<Result> {
  try {
    const me = await currentSuperAdminId()
    if (!me) return { ok: false, message: 'Only the Super Admin can create staff logins.' }
    if (!hasAdminKey()) return { ok: false, message: 'The secret key is not set up yet.' }

    const fullName = (input.fullName || '').trim()
    const email = (input.email || '').trim().toLowerCase()
    const password = input.password || ''

    if (fullName.length < 2) return { ok: false, message: 'Type the staff member\'s full name.' }
    if (!EMAIL_RE.test(email)) return { ok: false, message: 'That email address does not look right.' }
    if (password.length < 8) return { ok: false, message: 'The password must be at least 8 characters.' }

    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (error || !data.user) {
      const msg = error?.message || 'Could not create the login.'
      if (/already|registered|exists/i.test(msg)) {
        return { ok: false, message: 'That email is already used by another account.' }
      }
      return { ok: false, message: msg }
    }

    const { error: insErr } = await admin
      .from('staff')
      .insert({ id: data.user.id, full_name: fullName, role: 'Office' })
    if (insErr) {
      await admin.auth.admin.deleteUser(data.user.id)
      return { ok: false, message: 'Could not save the staff record: ' + insErr.message }
    }

    revalidatePath('/admin/staff')
    return { ok: true, message: `Office login created for ${fullName}.` }
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Something went wrong.' }
  }
}

export async function renameStaff(staffId: string, fullName: string): Promise<Result> {
  try {
    const me = await currentSuperAdminId()
    if (!me) return { ok: false, message: 'Only the Super Admin can do this.' }
    if (!hasAdminKey()) return { ok: false, message: 'The secret key is not set up yet.' }

    const name = (fullName || '').trim()
    if (name.length < 2) return { ok: false, message: 'Type the full name.' }

    const admin = createAdminClient()
    const target = await officeTarget(admin, staffId)
    if (!target) return { ok: false, message: 'Only Office logins can be changed here.' }

    const { error } = await admin.from('staff').update({ full_name: name }).eq('id', staffId)
    if (error) return { ok: false, message: error.message }

    revalidatePath('/admin/staff')
    return { ok: true, message: `Name changed to ${name}.` }
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Something went wrong.' }
  }
}

export async function setStaffPassword(staffId: string, password: string): Promise<Result> {
  try {
    const me = await currentSuperAdminId()
    if (!me) return { ok: false, message: 'Only the Super Admin can do this.' }
    if (!hasAdminKey()) return { ok: false, message: 'The secret key is not set up yet.' }
    if ((password || '').length < 8) return { ok: false, message: 'The password must be at least 8 characters.' }

    const admin = createAdminClient()
    const target = await officeTarget(admin, staffId)
    if (!target) return { ok: false, message: 'Only Office logins can be changed here.' }

    const { error } = await admin.auth.admin.updateUserById(staffId, { password })
    if (error) return { ok: false, message: error.message }

    return { ok: true, message: `Password changed for ${target.full_name}.` }
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Something went wrong.' }
  }
}

export async function removeStaff(staffId: string): Promise<Result> {
  try {
    const me = await currentSuperAdminId()
    if (!me) return { ok: false, message: 'Only the Super Admin can do this.' }
    if (!hasAdminKey()) return { ok: false, message: 'The secret key is not set up yet.' }
    if (staffId === me) return { ok: false, message: 'You cannot remove yourself.' }

    const admin = createAdminClient()
    const target = await officeTarget(admin, staffId)
    if (!target) return { ok: false, message: 'Only Office logins can be removed here.' }

    const { error: delErr } = await admin.from('staff').delete().eq('id', staffId)
    if (delErr) return { ok: false, message: delErr.message }

    const { error: userErr } = await admin.auth.admin.deleteUser(staffId)
    revalidatePath('/admin/staff')

    if (userErr) {
      return {
        ok: true,
        message: `${target.full_name} can no longer open the work portal. (The login itself could not be deleted: ${userErr.message})`,
      }
    }
    return { ok: true, message: `${target.full_name} has been removed.` }
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Something went wrong.' }
  }
}

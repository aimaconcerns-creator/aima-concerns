'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { sendVisaMail } from './mail'

type Result = { ok: boolean; message: string }

async function noticeInfo(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data } = await supabase.rpc('get_visa_notice_info', { p_application_id: id })
  return data as any
}

function refresh(id: string) {
  revalidatePath('/office/visa')
  revalidatePath(`/office/visa/${id}`)
  revalidatePath('/dashboard/visa')
}

export async function acceptVisa(id: string): Promise<Result> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('staff_accept_visa', { p_application_id: id })
    if (error) return { ok: false, message: error.message }
    refresh(id)
    const mail = await sendVisaMail('accepted', await noticeInfo(supabase, id))
    return { ok: true, message: 'Application accepted and the fee is set. ' + mail }
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Something went wrong.' }
  }
}

export async function rejectVisa(id: string, reason: string): Promise<Result> {
  try {
    const why = (reason || '').trim()
    if (why.length < 3) return { ok: false, message: 'Write the reason for rejecting this application.' }
    const supabase = await createClient()
    const { error } = await supabase.rpc('staff_reject_visa', { p_application_id: id, p_reason: why })
    if (error) return { ok: false, message: error.message }
    refresh(id)
    const mail = await sendVisaMail('rejected', await noticeInfo(supabase, id))
    return { ok: true, message: 'Application rejected. ' + mail }
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Something went wrong.' }
  }
}

export async function setVisaStage(id: string, stage: string): Promise<Result> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('staff_set_visa_stage', { p_application_id: id, p_stage: stage })
    if (error) return { ok: false, message: error.message }
    refresh(id)
    const out = data as any
    if (out?.email === 'approved' || out?.email === 'issued') {
      const mail = await sendVisaMail(out.email, await noticeInfo(supabase, id))
      return { ok: true, message: `Stage changed to ${stage}. ${mail}` }
    }
    return { ok: true, message: `Stage changed to ${stage}. No email was sent for this change.` }
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Something went wrong.' }
  }
}

export async function refundVisa(id: string, note: string): Promise<Result> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('refund_visa_application', {
      p_application_id: id,
      p_note: (note || '').trim() || null,
    })
    if (error) return { ok: false, message: error.message }
    refresh(id)
    const amount = Number((data as any)?.amount || 0).toLocaleString('en-US')
    return { ok: true, message: `PKR ${amount} was refunded to the customer's wallet.` }
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Something went wrong.' }
  }
}

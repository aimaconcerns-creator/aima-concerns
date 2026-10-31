'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

function revalidateAll(airlineId: string, ledgerId: string) {
  revalidatePath(`/admin/airlines/ledgers/${airlineId}/${ledgerId}`)
  revalidatePath(`/admin/airlines/ledgers/${airlineId}`)
  revalidatePath('/admin/airlines/ledgers')
}

export async function addEntry(formData: FormData) {
  const airlineId = formData.get('airlineId') as string
  const ledgerId = formData.get('ledgerId') as string
  const entryDate = formData.get('entry_date') as string
  const description = formData.get('description') as string
  const pnrVoucherNo = (formData.get('pnr_voucher_no') as string) || null
  const type = formData.get('type') as string
  const seats = formData.get('seats') ? Number(formData.get('seats')) : null
  const pricePerSeat = formData.get('price_per_seat') ? Number(formData.get('price_per_seat')) : null
  const currency = (formData.get('currency') as string) || 'PKR'
  const roe = formData.get('roe') ? Number(formData.get('roe')) : null
  const amount = Number(formData.get('amount'))
  const paymentMethod = (formData.get('payment_method') as string) || null

  if (!description?.trim() || !amount) return

  const supabase = await createClient()
  await supabase.from('airline_ledger_entries').insert({
    ledger_id: ledgerId,
    entry_date: entryDate,
    description: description.trim(),
    pnr_voucher_no: pnrVoucherNo,
    type,
    seats,
    price_per_seat: pricePerSeat,
    currency,
    roe: currency === 'USD' ? roe : null,
    amount,
    payment_method: paymentMethod,
  })

  revalidateAll(airlineId, ledgerId)
}

export async function updateEntry(formData: FormData) {
  const airlineId = formData.get('airlineId') as string
  const ledgerId = formData.get('ledgerId') as string
  const entryId = formData.get('entryId') as string
  const entryDate = formData.get('entry_date') as string
  const description = formData.get('description') as string
  const pnrVoucherNo = (formData.get('pnr_voucher_no') as string) || null
  const type = formData.get('type') as string
  const seats = formData.get('seats') ? Number(formData.get('seats')) : null
  const pricePerSeat = formData.get('price_per_seat') ? Number(formData.get('price_per_seat')) : null
  const currency = (formData.get('currency') as string) || 'PKR'
  const roe = formData.get('roe') ? Number(formData.get('roe')) : null
  const amount = Number(formData.get('amount'))
  const paymentMethod = (formData.get('payment_method') as string) || null

  if (!description?.trim() || !amount) return

  const supabase = await createClient()
  await supabase
    .from('airline_ledger_entries')
    .update({
      entry_date: entryDate,
      description: description.trim(),
      pnr_voucher_no: pnrVoucherNo,
      type,
      seats,
      price_per_seat: pricePerSeat,
      currency,
      roe: currency === 'USD' ? roe : null,
      amount,
      payment_method: paymentMethod,
    })
    .eq('id', entryId)

  revalidateAll(airlineId, ledgerId)
  redirect(`/admin/airlines/ledgers/${airlineId}/${ledgerId}`)
}
export async function deleteEntry(formData: FormData) {
  const airlineId = formData.get('airlineId') as string
  const ledgerId = formData.get('ledgerId') as string
  const entryId = formData.get('entryId') as string

  if (!entryId) return

  const supabase = await createClient()
  const { error } = await supabase
    .from('airline_ledger_entries')
    .delete()
    .eq('id', entryId)

  if (error) throw new Error(error.message)

  revalidateAll(airlineId, ledgerId)
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

type Result = { ok: boolean; message: string }

type Row = {
  entry_date: string
  description: string
  pnr_voucher_no: string | null
  type: 'debit' | 'credit'
  seats: number | null
  price_per_seat: number | null
  currency: string
  roe: number | null
  amount: number
  payment_method: string | null
}

function revalidateAll(airlineId: string, ledgerId: string) {
  revalidatePath(`/admin/airlines/ledgers/${airlineId}/${ledgerId}`)
  revalidatePath(`/admin/airlines/ledgers/${airlineId}`)
  revalidatePath('/admin/airlines/ledgers')
}

// Returns the database client, or a message when the person may not change the ledger
async function guard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Please log in again.'
  const { data: staff } = await supabase.from('staff').select('role').eq('id', user.id).single()
  if (!staff || staff.role !== 'Super Admin') return 'Only the Super Admin can change the airline ledger.'
  return supabase
}

// Returns the cleaned entry, or a message describing what is wrong
function parse(fd: FormData): string | Row {
  const type = String(fd.get('type') || '')
  if (type !== 'debit' && type !== 'credit') return 'Choose Debit or Credit.'

  const entry_date = String(fd.get('entry_date') || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry_date)) return 'Choose the date.'

  const description = String(fd.get('description') || '').trim()
  if (!description) return 'Write the description.'
  if (description.length > 300) return 'The description can be up to 300 characters.'

  const pnr = String(fd.get('pnr_voucher_no') || '').trim()
  if (pnr.length > 60) return 'The PNR / voucher number can be up to 60 characters.'

  const amount = Number(fd.get('amount'))
  if (!isFinite(amount) || amount <= 0) return 'Enter an amount above zero.'
  if (amount > 1000000000000) return 'That amount is too large. Please check it.'

  const currency = String(fd.get('currency') || 'PKR')
  if (!['PKR', 'USD', 'SAR'].includes(currency)) return 'Choose PKR, USD or SAR.'

  const roeRaw = String(fd.get('roe') || '').trim()
  const roe = roeRaw ? Number(roeRaw) : null
  if (roe !== null && (!isFinite(roe) || roe <= 0)) return 'The rate of exchange must be above zero.'

  const seatsRaw = String(fd.get('seats') || '').trim()
  const seats = seatsRaw ? Number(seatsRaw) : null
  if (seats !== null && (!Number.isInteger(seats) || seats < 0)) return 'Seats must be a whole number.'

  const priceRaw = String(fd.get('price_per_seat') || '').trim()
  const price = priceRaw ? Number(priceRaw) : null
  if (price !== null && (!isFinite(price) || price < 0)) return 'The price per seat cannot be negative.'

  const method = String(fd.get('payment_method') || '').trim()
  if (method.length > 60) return 'The payment method can be up to 60 characters.'

  return {
    entry_date,
    description,
    pnr_voucher_no: pnr || null,
    type,
    seats,
    price_per_seat: price,
    currency,
    roe: currency === 'PKR' ? null : roe,
    amount,
    payment_method: method || null,
  }
}

export async function addEntry(fd: FormData): Promise<Result> {
  try {
    const supabase = await guard()
    if (typeof supabase === 'string') return { ok: false, message: supabase }

    const airlineId = String(fd.get('airlineId') || '')
    const ledgerId = String(fd.get('ledgerId') || '')
    const row = parse(fd)
    if (typeof row === 'string') return { ok: false, message: row }

    const { data: ledger } = await supabase
      .from('airline_ledgers')
      .select('id')
      .eq('id', ledgerId)
      .eq('airline_id', airlineId)
      .maybeSingle()
    if (!ledger) return { ok: false, message: 'This ledger was not found.' }

    const { error } = await supabase.from('airline_ledger_entries').insert({ ledger_id: ledgerId, ...row })
    if (error) return { ok: false, message: 'The entry could not be saved: ' + error.message }

    revalidateAll(airlineId, ledgerId)
    return { ok: true, message: 'Entry added.' }
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Something went wrong.' }
  }
}

export async function updateEntry(fd: FormData): Promise<Result> {
  try {
    const supabase = await guard()
    if (typeof supabase === 'string') return { ok: false, message: supabase }

    const airlineId = String(fd.get('airlineId') || '')
    const ledgerId = String(fd.get('ledgerId') || '')
    const entryId = String(fd.get('entryId') || '')
    const row = parse(fd)
    if (typeof row === 'string') return { ok: false, message: row }

    const { data, error } = await supabase
      .from('airline_ledger_entries')
      .update(row)
      .eq('id', entryId)
      .eq('ledger_id', ledgerId)
      .select('id')
    if (error) return { ok: false, message: 'The changes could not be saved: ' + error.message }
    if (!data || data.length === 0) return { ok: false, message: 'This entry was not found. It may have been deleted.' }

    revalidateAll(airlineId, ledgerId)
    return { ok: true, message: 'Changes saved.' }
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Something went wrong.' }
  }
}

export async function deleteEntry(args: { airlineId: string; ledgerId: string; entryId: string }): Promise<Result> {
  try {
    const supabase = await guard()
    if (typeof supabase === 'string') return { ok: false, message: supabase }

    const { data, error } = await supabase
      .from('airline_ledger_entries')
      .delete()
      .eq('id', args.entryId)
      .eq('ledger_id', args.ledgerId)
      .select('id')
    if (error) return { ok: false, message: 'The entry could not be deleted: ' + error.message }
    if (!data || data.length === 0) return { ok: false, message: 'This entry was not found. It may already be deleted.' }

    revalidateAll(args.airlineId, args.ledgerId)
    return { ok: true, message: 'Entry deleted.' }
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Something went wrong.' }
  }
}

import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: customer } = await supabase
    .from('csp')
    .select('*')
    .eq('id', id)
    .single()

  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })

  const rows = (transactions ?? []).map((t) => ({
    Date: new Date(t.created_at).toLocaleDateString('en-GB'),
    Type: t.type,
    Amount: Number(t.amount),
    'Balance After': Number(t.balance_after),
    Note: t.note || '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  const fileName = (customer?.customer_code || 'customer') + '-ledger.xlsx'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
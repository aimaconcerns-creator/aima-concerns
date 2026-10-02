import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: pkg } = await supabase
    .from('packages')
    .select('id, name, package_type, days, departure_date')
    .eq('id', id)
    .single()

  if (!pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  }

  const { data: paid } = await supabase
    .from('bookings')
    .select(
      'id, reference, customer_id, booking_passengers(id, title, given_name, surname, date_of_birth, nationality, passport_number, passport_issue_date, passport_expiry_date, remarks, created_at)'
    )
    .eq('package_id', id)
    .eq('status', 'Paid')
    .order('paid_at', { ascending: true })

  const customerIds = Array.from(new Set((paid ?? []).map((b: any) => b.customer_id)))
  const names: Record<string, string> = {}
  if (customerIds.length > 0) {
    const { data: customers } = await supabase
      .from('csp')
      .select('id, customer_code, "Full Name:"')
      .in('id', customerIds)
    ;(customers ?? []).forEach((c: any) => {
      names[c.id] = c['Full Name:'] || c.customer_code || '—'
    })
  }

  const rows: any[] = []
  ;(paid ?? []).forEach((b: any) => {
    const list = [...(b.booking_passengers ?? [])].sort(
      (a: any, c: any) => new Date(a.created_at).getTime() - new Date(c.created_at).getTime()
    )
    list.forEach((p: any) => rows.push({ ...p, reference: b.reference, bookedBy: names[b.customer_id] ?? '—' }))
  })

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Manifest')

  sheet.columns = [
    { header: '#', key: 'num', width: 6 },
    { header: 'Booking Ref', key: 'reference', width: 16 },
    { header: 'Passenger', key: 'passenger', width: 26 },
    { header: 'Date of Birth', key: 'dob', width: 14 },
    { header: 'Nationality', key: 'nationality', width: 16 },
    { header: 'Passport No.', key: 'passport', width: 16 },
    { header: 'Issued', key: 'issued', width: 14 },
    { header: 'Expires', key: 'expires', width: 14 },
    { header: 'Remarks', key: 'remarks', width: 24 },
    { header: 'Booked By', key: 'bookedBy', width: 22 },
  ]

  const headerRow = sheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EDEF' } }
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    }
  })

  rows.forEach((r, i) => {
    const row = sheet.addRow({
      num: i + 1,
      reference: r.reference,
      passenger: `${r.title} ${r.given_name} ${r.surname}`,
      dob: fmt(r.date_of_birth),
      nationality: r.nationality,
      passport: r.passport_number,
      issued: fmt(r.passport_issue_date),
      expires: fmt(r.passport_expiry_date),
      remarks: r.remarks || '—',
      bookedBy: r.bookedBy,
    })
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      }
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const fileName = `${pkg.name.replace(/[^a-z0-9]+/gi, '-')}-manifest.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
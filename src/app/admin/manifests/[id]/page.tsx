import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default async function ManifestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  await supabase.rpc('expire_stale_bookings')

  const { data: pkg } = await supabase
    .from('packages')
    .select('id, name, package_type, days, departure_date, airlines(name)')
    .eq('id', id)
    .single()

  if (!pkg) notFound()

  const { data: paid } = await supabase
    .from('bookings')
    .select(
      'id, reference, paid_at, customer_id, booking_passengers(id, title, given_name, surname, date_of_birth, nationality, passport_number, passport_issue_date, passport_expiry_date, remarks, created_at)'
    )
    .eq('package_id', id)
    .eq('status', 'Paid')
    .order('paid_at', { ascending: true })

  const { data: unpaid } = await supabase
    .from('bookings')
    .select('seats_held')
    .eq('package_id', id)
    .eq('status', 'Unpaid')

  const heldSeats = (unpaid ?? []).reduce((sum: number, b: any) => sum + (b.seats_held ?? 0), 0)

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

  const infants = rows.filter((r) => r.title === 'INF').length
  const adults = rows.length - infants
  const airline: any = Array.isArray(pkg.airlines) ? pkg.airlines[0] : pkg.airlines

  const th = { padding: '10px 12px', color: '#155263', whiteSpace: 'nowrap' as const, fontSize: '13px' }
  const td = { padding: '10px 12px', fontSize: '14px', whiteSpace: 'nowrap' as const }

  const stat = (label: string, value: string | number) => (
    <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', minWidth: '150px' }}>
      <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>{label}</p>
      <p style={{ margin: '4px 0 0', color: '#155263', fontSize: '24px', fontWeight: 'bold' }}>{value}</p>
    </div>
  )

  return (
    <div style={{ padding: '30px' }}>
      <Link href="/admin/manifests" style={{ color: '#155263', fontSize: '14px' }}>
        ← Back to Group Manifests
      </Link>

      <h1 style={{ color: '#155263', margin: '10px 0 4px' }}>{pkg.name}</h1>
      <p style={{ color: '#666', margin: '0 0 20px' }}>
        {pkg.package_type} · {pkg.days} days · Departs {fmt(pkg.departure_date)}
        {airline?.name ? ` · ${airline.name}` : ''}
      </p>

      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {stat('Total passengers', rows.length)}
        {stat('Adults', adults)}
        {stat('Infants', infants)}
        {stat('Seats on hold (unpaid)', heldSeats)}
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '10px', overflow: 'auto', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f3f4', textAlign: 'left' }}>
              <th style={th}>#</th>
              <th style={th}>Booking Ref</th>
              <th style={th}>Passenger</th>
              <th style={th}>Date of Birth</th>
              <th style={th}>Nationality</th>
              <th style={th}>Passport No.</th>
              <th style={th}>Issued</th>
              <th style={th}>Expires</th>
              <th style={th}>Remarks</th>
              <th style={th}>Booked By</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                  No paid passengers on this manifest yet.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={td}>{i + 1}</td>
                <td style={{ ...td, fontWeight: 800, color: '#155263', letterSpacing: '1px' }}>{r.reference}</td>
                <td style={{ ...td, fontWeight: 'bold', color: '#155263' }}>
                  {r.title} {r.given_name} {r.surname}
                </td>
                <td style={td}>{fmt(r.date_of_birth)}</td>
                <td style={td}>{r.nationality}</td>
                <td style={td}>{r.passport_number}</td>
                <td style={td}>{fmt(r.passport_issue_date)}</td>
                <td style={td}>{fmt(r.passport_expiry_date)}</td>
                <td style={{ ...td, whiteSpace: 'normal', minWidth: '140px' }}>{r.remarks || '—'}</td>
                <td style={td}>{r.bookedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
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

  return (
    <div style={{ padding: '34px' }}>
      <style>{`
        .back-link { color: #7d93a3; font-size: 13px; text-decoration: none; }
        .back-link:hover { color: #cfe0ea; }

        .btn-export {
          display: inline-block; padding: 11px 22px; background: rgba(217, 164, 65, 0.15); color: #e0c060;
          border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; margin: 20px 0 26px;
        }

        .summary-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px;
          margin: 20px 0 28px;
        }
        .summary-card {
          border-radius: 12px; padding: 18px; background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 6px 18px rgba(0,0,0,0.3);
        }
        .summary-label { color: #7d93a3; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin: 0; }
        .summary-value { color: #fff; font-size: 26px; font-weight: 800; margin: 6px 0 0; }

        .man-table-wrap {
          border-radius: 14px; overflow: auto; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02); box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        table.man-table { width: 100%; border-collapse: collapse; min-width: 1000px; }
        .man-table thead tr { background: rgba(255,255,255,0.03); text-align: left; }
        .man-table th {
          padding: 14px 16px; color: #7d93a3; font-size: 12px; text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 700; white-space: nowrap;
        }
        .man-table td {
          padding: 14px 16px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 13.5px;
          color: #cfe0ea; white-space: nowrap;
        }
        .ref { font-weight: 700; color: #e0c060; }
        .passenger { font-weight: 700; color: #cfe0ea; }
      `}</style>

      <Link href="/admin/manifests" className="back-link">← Back to Group Manifests</Link>

      <h1 style={{ color: '#fff', margin: '14px 0 4px', fontSize: '22px', fontWeight: 800 }}>
        {pkg.name}
      </h1>
      <p style={{ color: '#7d93a3', fontSize: '14px', margin: 0 }}>
        {pkg.package_type} · {pkg.days} days · Departs {fmt(pkg.departure_date)}
        {airline?.name ? ` · ${airline.name}` : ''}
      </p>

      <a href={`/admin/manifests/${id}/export`} className="btn-export">
        Export to Excel
      </a>

      <div className="summary-grid">
        <div className="summary-card">
          <p className="summary-label">Total Passengers</p>
          <p className="summary-value">{rows.length}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">Adults</p>
          <p className="summary-value">{adults}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">Infants</p>
          <p className="summary-value">{infants}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">Seats on Hold (Unpaid)</p>
          <p className="summary-value">{heldSeats}</p>
        </div>
      </div>

      <div className="man-table-wrap">
        <table className="man-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Booking Ref</th>
              <th>Passenger</th>
              <th>Date of Birth</th>
              <th>Nationality</th>
              <th>Passport No.</th>
              <th>Issued</th>
              <th>Expires</th>
              <th>Remarks</th>
              <th>Booked By</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: '24px', textAlign: 'center', color: '#5a7184' }}>
                  No paid passengers on this manifest yet.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td className="ref">{r.reference}</td>
                <td className="passenger">{r.title} {r.given_name} {r.surname}</td>
                <td>{fmt(r.date_of_birth)}</td>
                <td>{r.nationality}</td>
                <td>{r.passport_number}</td>
                <td>{fmt(r.passport_issue_date)}</td>
                <td>{fmt(r.passport_expiry_date)}</td>
                <td style={{ whiteSpace: 'normal', minWidth: '140px', color: '#7d93a3' }}>{r.remarks || '—'}</td>
                <td>{r.bookedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
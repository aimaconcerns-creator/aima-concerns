import { createClient } from '@/utils/supabase/server'

export default async function UnpaidBookingsPage() {
  const supabase = await createClient()

  // Release any bookings that ran past their 12-hour window
  await supabase.rpc('expire_stale_bookings')

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      'id, total_amount, expires_at, created_at, customer_id, packages(name, package_type, departure_date)'
    )
    .eq('status', 'Unpaid')
    .order('expires_at', { ascending: true })

  const customerIds = Array.from(new Set((bookings ?? []).map((b: any) => b.customer_id)))
  const names: Record<string, { name: string; code: string }> = {}

  if (customerIds.length > 0) {
    const { data: customers } = await supabase
      .from('csp')
      .select('id, customer_code, "Full Name:", "Email"')
      .in('id', customerIds)
    ;(customers ?? []).forEach((c: any) => {
      names[c.id] = {
        name: c['Full Name:'] || c['Email'] || '—',
        code: c.customer_code || '',
      }
    })
  }

  const th = { padding: '12px 15px', color: '#155263' }
  const td = { padding: '12px 15px' }

  const timeLeft = (expiresAt: string) => {
    const ms = new Date(expiresAt).getTime() - Date.now()
    if (ms <= 0) return { text: 'Expiring...', color: '#d9534f' }
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    const text = h > 0 ? `${h}h ${m}m left` : `${m}m left`
    return { text, color: h < 2 ? '#e0a030' : '#5FAE8C' }
  }

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ color: '#155263', marginBottom: '20px' }}>Unpaid Bookings</h1>

      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          overflow: 'auto',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f3f4', textAlign: 'left' }}>
              <th style={th}>Client</th>
              <th style={th}>Package</th>
              <th style={th}>Departure</th>
              <th style={th}>Amount</th>
              <th style={th}>Reserved At</th>
              <th style={th}>Time Left</th>
            </tr>
          </thead>
          <tbody>
            {(!bookings || bookings.length === 0) && (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                  No unpaid bookings right now.
                </td>
              </tr>
            )}

            {bookings?.map((b: any) => {
              const pkg = Array.isArray(b.packages) ? b.packages[0] : b.packages
              const customer = names[b.customer_id] ?? { name: '—', code: '' }
              const left = timeLeft(b.expires_at)

              return (
                <tr key={b.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ ...td, fontWeight: 'bold', color: '#155263' }}>
                    {customer.name}
                    {customer.code && (
                      <div style={{ fontSize: '12px', color: '#888', fontWeight: 'normal' }}>{customer.code}</div>
                    )}
                  </td>
                  <td style={td}>
                    {pkg?.name}
                    <div style={{ fontSize: '12px', color: '#888' }}>{pkg?.package_type}</div>
                  </td>
                  <td style={td}>
                    {pkg?.departure_date
                      ? new Date(pkg.departure_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td style={{ ...td, fontWeight: 'bold' }}>PKR {Number(b.total_amount).toLocaleString()}</td>
                  <td style={td}>
                    {new Date(b.created_at).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td style={{ ...td, color: left.color, fontWeight: 'bold' }}>{left.text}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
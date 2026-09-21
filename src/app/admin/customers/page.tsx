import { createClient } from '@/utils/supabase/server'

export default async function AdminCustomersPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('csp')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ color: '#155263', marginBottom: '20px' }}>Customers</h1>

      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f3f4', textAlign: 'left' }}>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Customer ID</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Full Name</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Email</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Phone</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>CNIC</th>
            </tr>
          </thead>
          <tbody>
            {customers?.map((c) => (
              <tr key={c.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#155263' }}>
                  {c.customer_code}
                </td>
                <td style={{ padding: '12px 15px' }}>{c['Full Name:'] || '—'}</td>
                <td style={{ padding: '12px 15px' }}>{c['Email'] || '—'}</td>
                <td style={{ padding: '12px 15px' }}>{c['Phone'] || '—'}</td>
                <td style={{ padding: '12px 15px' }}>{c['CNIC'] || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function AdminCustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: customer } = await supabase
    .from('csp')
    .select('*')
    .eq('id', id)
    .single()

  if (!customer) notFound()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('id', id)
    .single()

  const row = (label: string, value: string | null | undefined) => (
    <div style={{ marginBottom: '16px', minWidth: 0 }}>
      <p style={{ margin: 0, color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </p>
      <p style={{ margin: '4px 0 0', color: '#155263', fontSize: '15px', fontWeight: 'bold', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {value || '—'}
      </p>
    </div>
  )

  return (
    <div style={{ padding: '30px' }}>
      <Link href="/admin/customers" style={{ color: '#155263', fontSize: '14px' }}>
        ← Back to Customers
      </Link>

      <h1 style={{ color: '#155263', marginTop: '10px', marginBottom: '20px' }}>
        Customer Profile
      </h1>

      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          padding: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          maxWidth: '700px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px',
            paddingBottom: '20px',
            borderBottom: '1px solid #eee',
            flexWrap: 'wrap',
            gap: '15px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#155263' }}>{customer['Full Name:'] || '—'}</h2>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
              {customer.customer_code}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>Wallet Balance</p>
            <p style={{ margin: '2px 0 0', color: '#5FAE8C', fontSize: '20px', fontWeight: 'bold' }}>
              PKR {Number(wallet?.balance ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px 30px',
          }}
        >
          {row('Email', customer['Email'])}
          {row('Phone', customer['Phone'])}
          {row('Date of Birth', customer['Date of Birth'])}
          {row('CNIC', customer['CNIC'])}
          {row('Nationality', customer['Nationality'])}
          {row('Gender', customer['Gender'])}
          {row('Passport No.', customer['Passport No.'])}
          {row('Passport Expiry', customer['Passport Expiry Date'])}
          {row('Approval Status', customer['approval_status'])}
          {row('Registered On', new Date(customer.created_at).toLocaleDateString('en-GB'))}
        </div>

        <div style={{ marginTop: '10px' }}>
          {row('Address', customer['Address'])}
        </div>
      </div>
    </div>
  )
}
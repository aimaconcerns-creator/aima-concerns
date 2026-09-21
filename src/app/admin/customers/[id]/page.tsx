import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function CustomerLedgerPage({
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

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('id', id)
    .single()

  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })

  const isCredit = (type: string) => type === 'Top-up' || type === 'Adjustment - Credit' || type === 'Refund'

  return (
    <div style={{ padding: '30px' }}>
      <Link href="/admin/customers" style={{ color: '#155263', fontSize: '14px' }}>
        Back to Customers
      </Link>

      <h1 style={{ color: '#155263', marginTop: '10px', marginBottom: '5px' }}>
        {customer?.['Full Name:'] || customer?.['Email']}
      </h1>
      <p style={{ color: '#888', marginBottom: '20px' }}>
        {customer?.customer_code} - Current Balance: PKR {Number(wallet?.balance ?? 0).toLocaleString()}
      </p>

      <div style={{ marginBottom: '15px' }}>
        
        <a
          href={'/admin/customers/' + id + '/export'}
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#155263',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Export to Excel
        </a>
      </div>

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
              <th style={{ padding: '12px 15px', color: '#155263' }}>Date</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Type</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Amount</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Balance After</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Note</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map((t) => (
              <tr key={t.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '12px 15px' }}>
                  {new Date(t.created_at).toLocaleDateString('en-GB')}
                </td>
                <td style={{ padding: '12px 15px' }}>{t.type}</td>
                <td
                  style={{
                    padding: '12px 15px',
                    fontWeight: 'bold',
                    color: isCredit(t.type) ? '#5FAE8C' : '#d9534f',
                  }}
                >
                  {isCredit(t.type) ? '+' : '-'} {Number(t.amount).toLocaleString()}
                </td>
                <td style={{ padding: '12px 15px' }}>
                  {Number(t.balance_after).toLocaleString()}
                </td>
                <td style={{ padding: '12px 15px', color: '#888', fontSize: '13px' }}>
                  {t.note || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
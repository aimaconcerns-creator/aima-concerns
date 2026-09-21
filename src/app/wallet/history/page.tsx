import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function WalletHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  const isCredit = (type: string) => type === 'Top-up' || type === 'Adjustment - Credit' || type === 'Refund'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7f8', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '30px 20px' }}>
        <Link href="/dashboard" style={{ color: '#155263', fontSize: '14px' }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ color: '#155263', marginTop: '10px', marginBottom: '25px' }}>
          Payment History
        </h1>

        {(!transactions || transactions.length === 0) && (
          <p style={{ color: '#888' }}>No transactions yet.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {transactions?.map((t) => (
            <div
              key={t.id}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '18px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ margin: 0, color: '#155263', fontWeight: 'bold', fontSize: '15px' }}>
                  {t.type}
                </p>
                <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
                  {new Date(t.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {t.note ? ` · ${t.note}` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: isCredit(t.type) ? '#5FAE8C' : '#d9534f',
                  }}
                >
                  {isCredit(t.type) ? '+' : '-'} PKR {Number(t.amount).toLocaleString()}
                </p>
                <p style={{ margin: '2px 0 0', color: '#aaa', fontSize: '12px' }}>
                  Balance: PKR {Number(t.balance_after).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
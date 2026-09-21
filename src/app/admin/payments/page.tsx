import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

async function approveTopup(formData: FormData) {
  'use server'

  const requestId = formData.get('requestId') as string
  const customerId = formData.get('customerId') as string
  const amount = Number(formData.get('amount'))

  const supabase = await createClient()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('id', customerId)
    .single()

  const currentBalance = Number(wallet?.balance ?? 0)
  const newBalance = currentBalance + amount

await supabase
    .from('wallets')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', customerId)

  await supabase.from('wallet_transactions').insert({
    customer_id: customerId,
    type: 'Top-up',
    amount: amount,
    balance_after: newBalance,
    note: 'Top-up approved via ' + formData.get('method'),
  })

  await supabase
    .from('topup_requests')
    .update({ status: 'Approved', reviewed_at: new Date().toISOString() })
    .eq('id', requestId)

  revalidatePath('/admin/payments')
  revalidatePath('/admin')
}

async function rejectTopup(formData: FormData) {
  'use server'

  const requestId = formData.get('requestId') as string
  const supabase = await createClient()

  await supabase
    .from('topup_requests')
    .update({ status: 'Rejected', reviewed_at: new Date().toISOString() })
    .eq('id', requestId)

  revalidatePath('/admin/payments')
  revalidatePath('/admin')
}

export default async function AdminPaymentsPage() {
  const supabase = await createClient()

  const { data: requests } = await supabase
    .from('topup_requests')
    .select('*, csp:customer_id (customer_code, "Full Name:", "Email")')
    .order('created_at', { ascending: false })

  const statusColor = (status: string) => {
    if (status === 'Approved') return '#5FAE8C'
    if (status === 'Rejected') return '#d9534f'
    return '#e0a030'
  }

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ color: '#155263', marginBottom: '20px' }}>Payments — Top-up Requests</h1>

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
              <th style={{ padding: '12px 15px', color: '#155263' }}>Customer</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Amount</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Method</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Reference</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Status</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests?.map((r: any) => (
              <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '12px 15px' }}>
                  <div style={{ fontWeight: 'bold', color: '#155263' }}>{r.csp?.customer_code}</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>{r.csp?.['Full Name:'] || r.csp?.['Email']}</div>
                </td>
                <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>
                  PKR {Number(r.amount).toLocaleString()}
                </td>
                <td style={{ padding: '12px 15px' }}>{r.payment_method}</td>
                <td style={{ padding: '12px 15px' }}>{r.reference_number || '—'}</td>
                <td style={{ padding: '12px 15px' }}>
                  <span style={{ color: statusColor(r.status), fontWeight: 'bold' }}>{r.status}</span>
                </td>
                <td style={{ padding: '12px 15px' }}>
                  {r.status === 'Pending Verification' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <form action={approveTopup}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <input type="hidden" name="customerId" value={r.customer_id} />
                        <input type="hidden" name="amount" value={r.amount} />                         <input type="hidden" name="method" value={r.payment_method} />
                        <button
                          type="submit"
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#5FAE8C',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          Approve
                        </button>
                      </form>
                      <form action={rejectTopup}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <button
                          type="submit"
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#d9534f',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
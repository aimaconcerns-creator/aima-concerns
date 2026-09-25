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

  const statusStyle = (status: string) => {
    if (status === 'Approved') return { color: '#5FE0A0', background: 'rgba(95, 224, 160, 0.12)' }
    if (status === 'Rejected') return { color: '#ff8f8a', background: 'rgba(217, 83, 79, 0.12)' }
    return { color: '#e0c060', background: 'rgba(224, 160, 48, 0.12)' }
  }

  return (
    <div style={{ padding: '34px' }}>
      <style>{`
        .pay-table-wrap {
          border-radius: 14px; overflow: auto; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02); box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        table.pay-table { width: 100%; border-collapse: collapse; min-width: 760px; }
        .pay-table thead tr { background: rgba(255,255,255,0.03); text-align: left; }
        .pay-table th {
          padding: 14px 16px; color: #7d93a3; font-size: 12px; text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 700;
        }
        .pay-table td { padding: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
        .cust-code { font-weight: 800; color: #cfe0ea; font-size: 14px; }
        .cust-name { font-size: 12.5px; color: #7d93a3; margin-top: 2px; }
        .amount { font-weight: 700; color: #fff; font-size: 14.5px; }
        .method, .ref { color: #a9bccb; font-size: 13.5px; }
        .status-pill { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 12.5px; }
        .btn-approve, .btn-reject {
          padding: 7px 14px; border: none; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 700;
        }
        .btn-approve { background: rgba(95, 224, 160, 0.15); color: #5FE0A0; }
        .btn-reject { background: rgba(217, 83, 79, 0.15); color: #ff8f8a; }
      `}</style>

      <h1 style={{ color: '#fff', margin: '0 0 24px', fontSize: '22px', fontWeight: 800 }}>
        Payments — Top-up Requests
      </h1>

      <div className="pay-table-wrap">
        <table className="pay-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests?.map((r: any) => {
              const st = statusStyle(r.status)
              return (
                <tr key={r.id}>
                  <td>
                    <div className="cust-code">{r.csp?.customer_code}</div>
                    <div className="cust-name">{r.csp?.['Full Name:'] || r.csp?.['Email']}</div>
                  </td>
                  <td className="amount">PKR {Number(r.amount).toLocaleString()}</td>
                  <td className="method">{r.payment_method}</td>
                  <td className="ref">{r.reference_number || '—'}</td>
                  <td>
                    <span className="status-pill" style={st}>{r.status}</span>
                  </td>
                  <td>
                    {r.status === 'Pending Verification' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <form action={approveTopup}>
                          <input type="hidden" name="requestId" value={r.id} />
                          <input type="hidden" name="customerId" value={r.customer_id} />
                          <input type="hidden" name="amount" value={r.amount} />
                          <input type="hidden" name="method" value={r.payment_method} />
                          <button type="submit" className="btn-approve">Approve</button>
                        </form>
                        <form action={rejectTopup}>
                          <input type="hidden" name="requestId" value={r.id} />
                          <button type="submit" className="btn-reject">Reject</button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
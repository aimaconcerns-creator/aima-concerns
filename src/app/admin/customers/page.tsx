import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

async function adjustBalance(formData: FormData) {
  'use server'

  const customerId = formData.get('customerId') as string
  const amount = Number(formData.get('amount'))
  const note = formData.get('note') as string

  if (!amount || amount <= 0) return

  const supabase = await createClient()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('id', customerId)
    .single()

  const currentBalance = Number(wallet?.balance ?? 0)
  const newBalance = currentBalance - amount

  await supabase
    .from('wallets')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', customerId)

  await supabase.from('wallet_transactions').insert({
    customer_id: customerId,
    type: 'Adjustment - Debit',
    amount: amount,
    balance_after: newBalance,
    note: note || 'Manual deduction by staff',
  })

  revalidatePath('/admin/customers')
  revalidatePath('/admin')
}

export default async function AdminCustomersPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('csp')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: wallets } = await supabase
    .from('wallets')
    .select('id, balance')

  const balanceMap = new Map(
    (wallets ?? []).map((w) => [w.id, Number(w.balance)])
  )

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
              <th style={{ padding: '12px 15px', color: '#155263' }}>Balance</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Deduct Balance</th>
            </tr>
          </thead>
          <tbody>
            {customers?.map((c: any) => (
              <tr key={c.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#155263' }}>
                  {c.customer_code}
                </td>
                <td style={{ padding: '12px 15px' }}>{c['Full Name:'] || '—'}</td>
                <td style={{ padding: '12px 15px' }}>{c['Email'] || '—'}</td>
                <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>
                  PKR {(balanceMap.get(c.id) ?? 0).toLocaleString()}
                </td>
                <td style={{ padding: '12px 15px' }}>
                  <form
                    action={adjustBalance}
                    style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}
                  >
                    <input type="hidden" name="customerId" value={c.id} />
                    <input
                      type="number"
                      name="amount"
                      placeholder="Amount"
                      required
                      style={{ width: '90px', padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                    <input
                      type="text"
                      name="note"
                      placeholder="Reason"
                      required
                      style={{ width: '130px', padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#d9534f',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      Deduct
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
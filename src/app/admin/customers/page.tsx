import Link from 'next/link'
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
    <div style={{ padding: '34px' }}>
      <style>{`
        .cust-table-wrap {
          border-radius: 14px; overflow: auto; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02); box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        table.cust-table { width: 100%; border-collapse: collapse; min-width: 860px; }
        .cust-table thead tr { background: rgba(255,255,255,0.03); text-align: left; }
        .cust-table th {
          padding: 14px 16px; color: #7d93a3; font-size: 12px; text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 700;
        }
        .cust-table td { padding: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
        .cust-code { font-weight: 800; color: #d9a441; font-size: 13.5px; }
        .cust-cell { color: #cfe0ea; font-size: 13.5px; }
        .balance { font-weight: 700; color: #fff; font-size: 14.5px; }
        .btn-ledger {
          padding: 6px 14px; background: rgba(47, 127, 122, 0.18); color: #6fd0c8;
          border-radius: 6px; text-decoration: none; font-size: 12.5px; font-weight: 700; display: inline-block;
        }
        .deduct-form { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .deduct-input {
          padding: 7px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04); color: #fff; font-size: 12.5px;
        }
        .deduct-input::placeholder { color: #5a7184; }
        .btn-deduct {
          padding: 7px 14px; background: rgba(217, 83, 79, 0.18); color: #ff8f8a;
          border: none; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 700;
        }
      `}</style>

      <h1 style={{ color: '#fff', margin: '0 0 24px', fontSize: '22px', fontWeight: 800 }}>
        Customers
      </h1>

      <div className="cust-table-wrap">
        <table className="cust-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Balance</th>
              <th>Ledger</th>
              <th>Deduct Balance</th>
            </tr>
          </thead>
          <tbody>
            {customers?.map((c: any) => (
              <tr key={c.id}>
                <td className="cust-code">{c.customer_code}</td>
                <td className="cust-cell">{c['Full Name:'] || '—'}</td>
                <td className="cust-cell">{c['Email'] || '—'}</td>
                <td className="balance">PKR {(balanceMap.get(c.id) ?? 0).toLocaleString()}</td>
                <td>
                  <Link href={'/admin/customers/' + c.id} className="btn-ledger">
                    View Ledger
                  </Link>
                </td>
                <td>
                  <form action={adjustBalance} className="deduct-form">
                    <input type="hidden" name="customerId" value={c.id} />
                    <input
                      type="number"
                      name="amount"
                      placeholder="Amount"
                      required
                      className="deduct-input"
                      style={{ width: '90px' }}
                    />
                    <input
                      type="text"
                      name="note"
                      placeholder="Reason"
                      required
                      className="deduct-input"
                      style={{ width: '130px' }}
                    />
                    <button type="submit" className="btn-deduct">Deduct</button>
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
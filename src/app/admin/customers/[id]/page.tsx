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
    <div style={{ padding: '34px' }}>
      <style>{`
        .back-link { color: #7d93a3; font-size: 13px; text-decoration: none; }
        .back-link:hover { color: #cfe0ea; }

        .btn-export {
          display: inline-block; padding: 11px 22px; background: rgba(217, 164, 65, 0.15); color: #e0c060;
          border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; margin: 20px 0 26px;
        }

        .ledger-table-wrap {
          border-radius: 14px; overflow: auto; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02); box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        table.ledger-table { width: 100%; border-collapse: collapse; min-width: 800px; }
        .ledger-table thead tr { background: rgba(255,255,255,0.03); text-align: left; }
        .ledger-table th {
          padding: 14px 16px; color: #7d93a3; font-size: 12px; text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 700;
        }
        .ledger-table td { padding: 15px 16px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 13.5px; }
        .date-cell { color: #a9bccb; }
        .type-cell { color: #cfe0ea; font-weight: 600; }
        .amount-credit { font-weight: 700; color: #5FE0A0; }
        .amount-debit { font-weight: 700; color: #ff8f8a; }
        .balance-cell { color: #a9bccb; }
        .note-cell { color: #7d93a3; font-size: 13px; }
      `}</style>

      <Link href="/admin/customers" className="back-link">← Back to Customers</Link>

      <h1 style={{ color: '#fff', margin: '14px 0 4px', fontSize: '22px', fontWeight: 800 }}>
        {customer?.['Full Name:'] || customer?.['Email']}
      </h1>
      <p style={{ color: '#7d93a3', fontSize: '14px', margin: 0 }}>
        {customer?.customer_code} — Current Balance: PKR {Number(wallet?.balance ?? 0).toLocaleString()}
      </p>

      <a href={'/admin/customers/' + id + '/export'} className="btn-export">
        Export to Excel
      </a>

      <div className="ledger-table-wrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Balance After</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {(!transactions || transactions.length === 0) && (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#5a7184' }}>
                  No transactions yet.
                </td>
              </tr>
            )}
            {transactions?.map((t) => (
              <tr key={t.id}>
                <td className="date-cell">
                  {new Date(t.created_at).toLocaleDateString('en-GB')}
                </td>
                <td className="type-cell">{t.type}</td>
                <td className={isCredit(t.type) ? 'amount-credit' : 'amount-debit'}>
                  {isCredit(t.type) ? '+' : '-'} {Number(t.amount).toLocaleString()}
                </td>
                <td className="balance-cell">
                  {Number(t.balance_after).toLocaleString()}
                </td>
                <td className="note-cell">{t.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
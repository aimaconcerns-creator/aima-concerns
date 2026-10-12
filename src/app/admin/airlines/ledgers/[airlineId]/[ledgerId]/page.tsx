import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { addEntry } from './actions'
import EntryForm from './EntryForm'
import PrintButton from './PrintButton'

export default async function LedgerDetailPage({
  params,
}: {
  params: Promise<{ airlineId: string; ledgerId: string }>
}) {
  const { airlineId, ledgerId } = await params
  const supabase = await createClient()

  const { data: airline } = await supabase
    .from('airlines')
    .select('id, name, logo_url')
    .eq('id', airlineId)
    .single()

  const { data: ledger } = await supabase
    .from('airline_ledgers')
    .select('id, name, airline_id')
    .eq('id', ledgerId)
    .single()

  if (!airline || !ledger || ledger.airline_id !== airlineId) notFound()

  const { data: entries } = await supabase
    .from('airline_ledger_entries')
    .select('*')
    .eq('ledger_id', ledgerId)
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true })

  let running = 0
  const rows = (entries ?? []).map((e: any) => {
    const delta = e.type === 'debit' ? Number(e.amount) : -Number(e.amount)
    running += delta
    return { ...e, balance_after: running }
  })

  const balance = running

  return (
    <div style={{ padding: '34px' }}>
      <style>{`
        .back-link { color: #7d93a3; font-size: 13px; text-decoration: none; }
        .back-link:hover { color: #cfe0ea; }

        .header-row { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px; margin-top: 14px; }
        .print-btn {
          padding: 10px 22px; background: rgba(217,164,65,0.18); color: #d9a441; border: 1px solid rgba(217,164,65,0.4);
          border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13.5px; font-family: inherit;
        }

        .add-box {
          border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02);
          padding: 22px; margin: 20px 0 26px; box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        .add-box h3 { color: #fff; margin: 0 0 16px; font-size: 15px; font-weight: 800; }
        .add-grid { display: flex; flex-wrap: wrap; gap: 14px; }
        .add-field { flex: 1 1 160px; }
        .add-field.wide { flex: 2 1 260px; }
        .add-field label { display: block; color: #7d93a3; font-size: 11.5px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        .add-input {
          width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04); color: #fff; font-size: 14px; box-sizing: border-box; font-family: inherit;
        }
        .add-input::placeholder { color: #5a7184; }
        .add-btn {
          padding: 12px 26px; background: #d9a441; color: #12335f; border: none; border-radius: 8px;
          font-weight: 800; font-size: 14px; cursor: pointer; font-family: inherit; margin-top: 8px;
        }

        .ledger-table-wrap {
          border-radius: 14px; overflow: auto; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02); box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        table.ledger-table { width: 100%; border-collapse: collapse; min-width: 1020px; }
        .ledger-table thead tr { background: rgba(255,255,255,0.03); text-align: left; }
        .ledger-table th {
          padding: 14px 16px; color: #7d93a3; font-size: 12px; text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 700;
        }
        .ledger-table td { padding: 14px 16px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 13.5px; }
        .date-cell { color: #a9bccb; white-space: nowrap; }
        .desc-cell { color: #cfe0ea; font-weight: 600; }
        .pnr-cell { color: #7d93a3; font-size: 12.5px; }
        .seats-cell { color: #a9bccb; }
        .amount-credit { font-weight: 700; color: #5FE0A0; white-space: nowrap; }
        .amount-debit { font-weight: 700; color: #ff8f8a; white-space: nowrap; }
        .balance-cell { color: #fff; font-weight: 700; white-space: nowrap; }
        .method-cell { color: #7d93a3; font-size: 12.5px; }
        .edit-link { color: #d9a441; font-size: 12.5px; font-weight: 700; text-decoration: none; }
        .ledger-empty { padding: 30px; text-align: center; color: #5a7184; }

        @media print {
          .no-print { display: none !important; }
          .sidebar { display: none !important; }
          .main-area { background: #fff !important; padding: 0 !important; }
          body { background: #fff !important; }
          h1, p, .date-cell, .desc-cell, .pnr-cell, .seats-cell, .method-cell, .balance-cell { color: #000 !important; }
          .amount-credit, .amount-debit { color: #000 !important; }
          .ledger-table-wrap { background: #fff !important; border: none !important; box-shadow: none !important; }
          .ledger-table thead tr { background: #f0f0f0 !important; }
          .ledger-table th { color: #000 !important; border-bottom: 2px solid #000 !important; }
          .ledger-table td { border-top: 1px solid #ccc !important; }
        }
      `}</style>

      <Link href={`/admin/airlines/ledgers/${airlineId}`} className="back-link no-print">
        ← Back to {airline.name} Ledgers
      </Link>

      <div className="header-row">
        <div>
          <h1 style={{ color: '#fff', margin: '0 0 2px', fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
            {airline.logo_url && (
              <img src={airline.logo_url} alt={airline.name} style={{ width: '30px', height: '30px', objectFit: 'contain', background: '#fff', borderRadius: '6px', padding: '3px' }} />
            )}
            {ledger.name}
          </h1>
          <p style={{ color: '#7d93a3', fontSize: '14px', margin: '4px 0 0' }}>
            Current balance:{' '}
            <strong style={{ color: balance > 0 ? '#ff8f8a' : balance < 0 ? '#5FE0A0' : '#a9bccb' }}>
              PKR {Math.abs(balance).toLocaleString()} {balance > 0 ? 'DR' : balance < 0 ? 'CR' : ''}
            </strong>
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="add-box no-print">
        <h3>Add Entry</h3>
        <EntryForm airlineId={airlineId} ledgerId={ledgerId} action={addEntry} submitLabel="Add Entry" />
      </div>

      <div className="ledger-table-wrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>PNR / Voucher</th>
              <th>Seats</th>
              <th>Amount</th>
              <th>Balance After</th>
              <th>Method</th>
              <th className="no-print">Edit</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="ledger-empty">No entries yet. Add one above.</td>
              </tr>
            )}
            {rows.map((e: any) => (
              <tr key={e.id}>
                <td className="date-cell">
                  {new Date(e.entry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="desc-cell">{e.description}</td>
                <td className="pnr-cell">{e.pnr_voucher_no || '—'}</td>
                <td className="seats-cell">
                  {e.seats ?? '—'}
                  {e.price_per_seat ? ` × ${Number(e.price_per_seat).toLocaleString()} ${e.currency}` : ''}
                  {e.currency === 'USD' && e.roe ? ` @ ${e.roe}` : ''}
                </td>
                <td className={e.type === 'credit' ? 'amount-credit' : 'amount-debit'}>
                  {e.type === 'credit' ? '-' : '+'} PKR {Number(e.amount).toLocaleString()}
                </td>
                <td className="balance-cell">
                  PKR {Math.abs(e.balance_after).toLocaleString()} {e.balance_after > 0 ? 'DR' : e.balance_after < 0 ? 'CR' : ''}
                </td>
                <td className="method-cell">{e.payment_method || '—'}</td>
                <td className="no-print">
                  <Link href={`/admin/airlines/ledgers/${airlineId}/${ledgerId}/${e.id}/edit`} className="edit-link">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

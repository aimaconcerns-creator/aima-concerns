import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { updateEntry } from '../../actions'
import EntryForm from '../../EntryForm'

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ airlineId: string; ledgerId: string; entryId: string }>
}) {
  const { airlineId, ledgerId, entryId } = await params
  const supabase = await createClient()

  const { data: entry } = await supabase
    .from('airline_ledger_entries')
    .select('*')
    .eq('id', entryId)
    .eq('ledger_id', ledgerId)
    .single()

  if (!entry) notFound()

  return (
    <div style={{ padding: '34px', maxWidth: '900px' }}>
      <style>{`
        .back-link { color: #7d93a3; font-size: 13px; text-decoration: none; }
        .back-link:hover { color: #cfe0ea; }
        .add-box {
          border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02);
          padding: 22px; margin: 20px 0 26px; box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
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
      `}</style>

      <Link href={`/admin/airlines/ledgers/${airlineId}/${ledgerId}`} className="back-link">
        ← Back to Ledger
      </Link>

      <h1 style={{ color: '#fff', margin: '14px 0 20px', fontSize: '22px', fontWeight: 800 }}>
        Edit Entry
      </h1>

      <div className="add-box">
        <EntryForm
          airlineId={airlineId}
          ledgerId={ledgerId}
          entryId={entry.id}
          action={updateEntry}
          submitLabel="Save Changes"
          initial={{
            entry_date: entry.entry_date,
            description: entry.description,
            pnr_voucher_no: entry.pnr_voucher_no,
            type: entry.type,
            seats: entry.seats,
            price_per_seat: entry.price_per_seat,
            currency: entry.currency,
            roe: entry.roe,
            amount: entry.amount,
            payment_method: entry.payment_method,
          }}
        />
      </div>
    </div>
  )
}
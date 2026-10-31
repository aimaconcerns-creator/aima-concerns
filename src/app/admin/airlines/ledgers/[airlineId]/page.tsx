import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

async function addLedger(formData: FormData) {
  'use server'

  const airlineId = formData.get('airlineId') as string
  const name = formData.get('name') as string

  if (!name?.trim()) return

  const supabase = await createClient()
  await supabase.from('airline_ledgers').insert({
    airline_id: airlineId,
    name: name.trim(),
  })

  revalidatePath(`/admin/airlines/ledgers/${airlineId}`)
}

export default async function AirlineLedgerListPage({
  params,
}: {
  params: Promise<{ airlineId: string }>
}) {
  const { airlineId } = await params
  const supabase = await createClient()

  const { data: airline } = await supabase
    .from('airlines')
    .select('id, name, logo_url')
    .eq('id', airlineId)
    .single()

  if (!airline) notFound()

  const { data: ledgers } = await supabase
    .from('airline_ledgers')
    .select('id, name, created_at')
    .eq('airline_id', airlineId)
    .order('created_at', { ascending: false })

  const ledgerIds = (ledgers ?? []).map((l) => l.id)

  const { data: entries } = ledgerIds.length
    ? await supabase
        .from('airline_ledger_entries')
        .select('ledger_id, type, amount')
        .in('ledger_id', ledgerIds)
    : { data: [] }

  const balanceByLedger: Record<string, number> = {}
  let totalDr = 0
  let totalCr = 0
  for (const e of entries ?? []) {
    const amt = Number(e.amount)
    if (e.type === 'debit') totalDr += amt
    else totalCr += amt
    const delta = e.type === 'debit' ? amt : -amt
    balanceByLedger[e.ledger_id] = (balanceByLedger[e.ledger_id] ?? 0) + delta
  }
  const totalBal = totalDr - totalCr
  const fmt = (n: number) => Math.round(n * 100) / 100

  return (
    <div style={{ padding: '34px' }}>
      <style>{`
        .back-link { color: #7d93a3; font-size: 13px; text-decoration: none; }
        .back-link:hover { color: #cfe0ea; }

        .form-card {
          border-radius: 14px; padding: 22px; margin: 20px 0 28px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        .form-card h3 { color: #fff; margin: 0 0 14px; font-size: 15px; font-weight: 800; }
        .new-ledger-form { display: flex; gap: 10px; flex-wrap: wrap; }
        .field-input {
          flex: 1; min-width: 240px; padding: 11px 14px; border-radius: 8px; font-size: 14px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); color: #fff;
        }
        .field-input::placeholder { color: #5a7184; }
        .btn-submit {
          padding: 11px 22px; background: #4a9c7a; color: #fff; border: none; border-radius: 8px;
          cursor: pointer; font-weight: 700; font-size: 14px;
        }

        .sum-bar {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin: 0 0 22px;
        }
        .sum-bar > div {
          border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02);
          padding: 14px 18px;
        }
        .sum-bar small { display: block; color: #7d93a3; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
        .sum-bar b { font-size: 18px; color: #fff; }

        .ledger-wrap {
          border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02); box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        .ledger-row {
          display: flex; align-items: center; justify-content: space-between; padding: 18px 20px;
          text-decoration: none; border-top: 1px solid rgba(255,255,255,0.06);
        }
        .ledger-row:first-child { border-top: none; }
        .ledger-row:hover { background: rgba(255,255,255,0.03); }
        .ledger-name { color: #fff; font-size: 15px; font-weight: 700; margin: 0; }
        .ledger-date { color: #7d93a3; font-size: 12px; margin: 2px 0 0; }
        .ledger-bal { font-size: 17px; font-weight: 800; }
        .ledger-bal.owe { color: #ff8f8a; }
        .ledger-bal.clear { color: #5FE0A0; }
        .ledger-empty { padding: 30px; text-align: center; color: #5a7184; }
      `}</style>

      <Link href="/admin/airlines/ledgers" className="back-link">← Back to Airline Ledgers</Link>

      <h1 style={{ color: '#fff', margin: '14px 0 20px', fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
        {airline.logo_url && (
          <img src={airline.logo_url} alt={airline.name} style={{ width: '32px', height: '32px', objectFit: 'contain', background: '#fff', borderRadius: '6px', padding: '3px' }} />
        )}
        {airline.name} — Ledgers
      </h1>

      <div className="form-card">
        <h3>Add New Ledger</h3>
        <form action={addLedger} className="new-ledger-form">
          <input type="hidden" name="airlineId" value={airlineId} />
          <input
            type="text"
            name="name"
            placeholder="e.g. Iran Airtour / 122"
            required
            className="field-input"
          />
          <button type="submit" className="btn-submit">Add Ledger</button>
        </form>
      </div>

      {(ledgers ?? []).length > 0 && (
        <div className="sum-bar">
          <div><small>Total debits</small><b>PKR {fmt(totalDr).toLocaleString()}</b></div>
          <div><small>Total credits</small><b>PKR {fmt(totalCr).toLocaleString()}</b></div>
          <div>
            <small>Total balance — {airline.name}</small>
            <b style={{ color: totalBal > 0.004 ? '#ff8f8a' : totalBal < -0.004 ? '#5FE0A0' : '#a9bccb' }}>
              PKR {Math.abs(fmt(totalBal)).toLocaleString()} {totalBal > 0.004 ? 'DR' : totalBal < -0.004 ? 'CR' : ''}
            </b>
          </div>
        </div>
      )}

      <div className="ledger-wrap">
        {(!ledgers || ledgers.length === 0) && (
          <div className="ledger-empty">No ledgers yet for this airline. Add one above.</div>
        )}
        {ledgers?.map((l) => {
          const bal = balanceByLedger[l.id] ?? 0
          return (
            <Link key={l.id} href={`/admin/airlines/ledgers/${airlineId}/${l.id}`} className="ledger-row">
              <div>
                <p className="ledger-name">{l.name}</p>
                <p className="ledger-date">
                  Created {new Date(l.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <p className={`ledger-bal ${bal > 0 ? 'owe' : 'clear'}`}>
                PKR {Math.abs(bal).toLocaleString()}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

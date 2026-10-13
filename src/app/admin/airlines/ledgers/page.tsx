import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function AirlineLedgersListPage() {
  const supabase = await createClient()

  const { data: airlines } = await supabase
    .from('airlines')
    .select('id, name, logo_url')
    .order('name')

  const { data: ledgers } = await supabase
    .from('airline_ledgers')
    .select('id, airline_id')

  const ledgerIds = (ledgers ?? []).map((l) => l.id)
  const ledgerToAirline = new Map((ledgers ?? []).map((l) => [l.id, l.airline_id]))

  const { data: entries } = ledgerIds.length
    ? await supabase
        .from('airline_ledger_entries')
        .select('ledger_id, type, amount')
        .in('ledger_id', ledgerIds)
    : { data: [] }

  const balanceByAirline: Record<string, number> = {}
  for (const e of entries ?? []) {
    const airlineId = ledgerToAirline.get(e.ledger_id)
    if (!airlineId) continue
    const delta = e.type === 'debit' ? Number(e.amount) : -Number(e.amount)
    balanceByAirline[airlineId] = (balanceByAirline[airlineId] ?? 0) + delta
  }

  return (
    <div style={{ padding: '34px' }}>
      <style>{`
        .al-wrap {
          border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02); box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        .al-row {
          display: flex; align-items: center; justify-content: space-between; padding: 18px 20px;
          text-decoration: none; border-top: 1px solid rgba(255,255,255,0.06);
        }
        .al-row:first-child { border-top: none; }
        .al-row:hover { background: rgba(255,255,255,0.03); }
        .al-left { display: flex; align-items: center; gap: 14px; }
        .al-left img { width: 36px; height: 36px; object-fit: contain; border-radius: 6px; background: #fff; padding: 3px; }
        .al-name { color: #fff; font-size: 15px; font-weight: 700; margin: 0; }
        .al-sub { color: #7d93a3; font-size: 12px; margin: 2px 0 0; }
        .al-bal { font-size: 18px; font-weight: 800; }
        .al-bal.owe { color: #ff8f8a; }
        .al-bal.clear { color: #5FE0A0; }
        .al-empty { padding: 30px; text-align: center; color: #5a7184; }
      `}</style>

      <h1 style={{ color: '#fff', margin: '0 0 4px', fontSize: '22px', fontWeight: 800 }}>Airline Ledgers</h1>
      <p style={{ color: '#7d93a3', fontSize: '14px', margin: '0 0 24px' }}>
        Track what Aima Concerns owes each airline. Click an airline to view its ledgers.
      </p>

      <div className="al-wrap">
        {(!airlines || airlines.length === 0) && (
          <div className="al-empty">No airlines yet. Add one under "Add Airline".</div>
        )}
        {airlines?.map((a) => {
          const bal = balanceByAirline[a.id] ?? 0
          return (
            <Link key={a.id} href={`/admin/airlines/ledgers/${a.id}`} className="al-row">
              <div className="al-left">
                {a.logo_url && <img src={a.logo_url} alt={a.name} />}
                <div>
                  <p className="al-name">{a.name}</p>
                  <p className="al-sub">{bal > 0 ? 'Balance owed' : bal < 0 ? 'Overpaid' : 'Settled'}</p>
                </div>
              </div>
              <p className={`al-bal ${bal > 0 ? 'owe' : 'clear'}`}>
                PKR {Math.abs(bal).toLocaleString()}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
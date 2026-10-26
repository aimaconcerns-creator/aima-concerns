import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { fmt, officeCss } from '@/app/office/lib'
import NewPartyForm from './NewPartyForm'

export const dynamic = 'force-dynamic'

export default async function PartiesHome() {
  const supabase = await createClient()
  const { data } = await supabase.rpc('list_parties')
  const parties: any[] = data || []

  return (
    <div>
      <style>{officeCss}</style>
      <Link href="/office/accounts" style={{ color: '#2f7f7a', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
        ← Accounts &amp; Finance
      </Link>

      <div className="pg-h" style={{ margin: '14px 0 22px' }}>
        <h1>Party Ledgers</h1>
        <p>An account for each party who brings you groups. Pick any passenger from any booking and add them to a party.</p>
      </div>

      <NewPartyForm />

      {parties.length ? parties.map((p) => {
        const owed = Number(p.out_owed || 0)
        const received = Number(p.out_received || 0)
        const rem = owed - received
        return (
          <div className="row" key={p.out_id}>
            <div className="main">
              <h3>{p.out_name}</h3>
              <p>{Number(p.out_count || 0)} passengers{p.out_note ? ' · ' + p.out_note : ''}</p>
            </div>
            <div className="stat"><b>{fmt(owed)}</b><span>owed</span></div>
            <div className="stat"><b>{fmt(received)}</b><span>received</span></div>
            <div className="stat">
              <b style={{ color: rem > 0 ? '#b3261e' : '#1f7a55' }}>{rem < 0 ? fmt(-rem) + ' credit' : fmt(rem)}</b>
              <span>remaining</span>
            </div>
            <Link className="btn" href={`/office/parties/${p.out_id}`}>Open</Link>
          </div>
        )
      }) : <div className="empty">No parties yet. Create the first one above.</div>}
    </div>
  )
}

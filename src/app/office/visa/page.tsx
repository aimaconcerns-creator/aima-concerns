import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { customerMap, dmy, fmt, officeCss, pktShort, timeLeft } from '@/app/office/lib'
import { VISA_STATUSES, VisaBadge } from '@/app/office/visa/visaLib'

export const dynamic = 'force-dynamic'

export default async function VisaList({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const sp = await searchParams
  const active = VISA_STATUSES.includes(sp.status || '') ? (sp.status as string) : 'All'
  const term = (sp.q || '').replace(/[^A-Za-z0-9\s.-]/g, '').trim()

  const supabase = await createClient()
  await supabase.rpc('expire_stale_visa_applications')

  const { data: allStatus } = await supabase.from('visa_applications').select('status')
  const counts = new Map<string, number>()
  ;(allStatus || []).forEach((r: any) => counts.set(r.status, (counts.get(r.status) || 0) + 1))
  const totalAll = (allStatus || []).length

  let ids: string[] = []
  if (term) {
    const words = term.split(/\s+/).slice(0, 3)
    const conds = words
      .flatMap((w) => [`given_name.ilike.%${w}%`, `surname.ilike.%${w}%`, `passport_number.ilike.%${w}%`])
      .join(',')
    const { data: hit } = await supabase.from('visa_applicants').select('application_id').or(conds).limit(300)
    ids = Array.from(new Set((hit || []).map((h: any) => h.application_id as string)))
  }

  let query: any = supabase
    .from('visa_applications')
    .select('id, customer_id, tracking_code, status, applicant_type, fee, total_amount, fee_set_at, created_at, product_id, visa_product_id, visa_type, refunded_at')
  if (active !== 'All') query = query.eq('status', active)
  if (term) {
    const parts = [`tracking_code.ilike.%${term.replace(/\s+/g, '')}%`]
    if (ids.length) parts.push(`id.in.(${ids.join(',')})`)
    query = query.or(parts.join(','))
  }
  const { data: appsRaw } = await query.order('created_at', { ascending: false }).limit(300)
  const apps: any[] = appsRaw || []

  const appIds = apps.map((a) => a.id)
  const lead = new Map<string, string>()
  const people = new Map<string, number>()
  if (appIds.length) {
    const { data: px } = await supabase
      .from('visa_applicants')
      .select('application_id, given_name, surname, created_at')
      .in('application_id', appIds)
      .order('created_at')
    ;(px || []).forEach((p: any) => {
      people.set(p.application_id, (people.get(p.application_id) || 0) + 1)
      if (!lead.has(p.application_id)) lead.set(p.application_id, `${p.given_name} ${p.surname}`)
    })
  }

  const prodIds = Array.from(new Set(apps.map((a) => a.product_id || a.visa_product_id).filter(Boolean)))
  const prodName = new Map<string, string>()
  if (prodIds.length) {
    const { data: pr } = await supabase.from('visa_products').select('id, name').in('id', prodIds)
    ;(pr || []).forEach((p: any) => prodName.set(p.id, p.name))
  }

  const cmap = await customerMap(supabase, apps.map((a) => a.customer_id))

  const tabHref = (s: string) => {
    const p = new URLSearchParams()
    if (s !== 'All') p.set('status', s)
    if (term) p.set('q', term)
    const qs = p.toString()
    return '/office/visa' + (qs ? '?' + qs : '')
  }

  return (
    <div>
      <style>{officeCss}{`
        .vl-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin: 20px 0 16px; }
        .vl-tab { padding: 9px 16px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: 700;
          background: #fff; color: #4b5f7a; border: 1px solid #e3e9f1; }
        .vl-tab.on { background: #12335f; color: #fff; border-color: #12335f; }
        .vl-tab small { opacity: .7; margin-left: 4px; font-weight: 600; }
        .vl-search { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
        .vl-search input { flex: 1; min-width: 240px; }
        .vl-sub { font-size: 11.5px; color: #6b7c93; margin-top: 3px; }
        .vl-ref { color: #2f7f7a; font-weight: 800; text-decoration: none; letter-spacing: .05em; }
        .vl-ref:hover { text-decoration: underline; }
      `}</style>

      <div className="pg-h">
        <h1>Visa Applications</h1>
        <p>Review applications, accept or reject them, and approve once the customer has paid.</p>
      </div>

      <div className="vl-tabs">
        <Link href={tabHref('All')} className={'vl-tab' + (active === 'All' ? ' on' : '')}>
          All<small>{totalAll}</small>
        </Link>
        {VISA_STATUSES.map((s) => (
          <Link key={s} href={tabHref(s)} className={'vl-tab' + (active === s ? ' on' : '')}>
            {s}<small>{counts.get(s) || 0}</small>
          </Link>
        ))}
      </div>

      <form method="get" action="/office/visa" className="vl-search">
        {active !== 'All' && <input type="hidden" name="status" value={active} />}
        <input className="in" name="q" defaultValue={term} placeholder="Search by tracking code, applicant name or passport number" />
        <button className="btn" type="submit">Search</button>
        {term && <Link className="btn ghost" href={tabHref('All').split('?')[0] + (active !== 'All' ? '?status=' + encodeURIComponent(active) : '')}>Clear</Link>}
      </form>

      <div className="card">
        {apps.length ? (
          <div className="tw">
            <table className="t">
              <thead>
                <tr>
                  <th>Tracking code</th>
                  <th>Applicant</th>
                  <th>Customer</th>
                  <th>Visa</th>
                  <th className="num">Amount</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => {
                  const c = cmap.get(a.customer_id)
                  const n = people.get(a.id) || 0
                  const pid = a.product_id || a.visa_product_id
                  const payBy = a.fee_set_at ? new Date(new Date(a.fee_set_at).getTime() + 3 * 86400000).toISOString() : null
                  return (
                    <tr key={a.id}>
                      <td><Link className="vl-ref" href={`/office/visa/${a.id}`}>{a.tracking_code || '—'}</Link></td>
                      <td>
                        {lead.get(a.id) || '—'}{n > 1 ? ` (+${n - 1})` : ''}
                        <div className="vl-sub">{a.applicant_type === 'family' ? 'Family' : 'Individual'} · {n} person{n === 1 ? '' : 's'}</div>
                      </td>
                      <td>{c ? `${c.out_full_name} (${c.out_customer_code})` : '—'}</td>
                      <td>{(pid && prodName.get(pid)) || a.visa_type || '—'}</td>
                      <td className="num">{fmt(a.fee ?? a.total_amount)}</td>
                      <td>
                        <VisaBadge status={a.status} refunded={!!a.refunded_at} />
                        {a.status === 'Awaiting Payment' && payBy && (
                          <div className="vl-sub">Pay by {pktShort(payBy)} · {timeLeft(payBy)}</div>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{dmy(a.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No visa applications found{term ? ` for "${term}"` : active !== 'All' ? ` with status ${active}` : ''}.</div>
        )}
        {apps.length >= 300 && <p className="note">Showing the 300 newest. Use the search to narrow it down.</p>}
      </div>
    </div>
  )
}

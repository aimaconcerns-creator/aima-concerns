import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import FocPrintButton from './FocPrintButton'

export const dynamic = 'force-dynamic'

const money = (n: number) => 'PKR ' + Number(n || 0).toLocaleString('en-US')
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' })
const uniq = (a: any[]) => Array.from(new Set(a.filter(Boolean)))

type Row = {
  key: string
  kind: 'package' | 'ticket'
  id: string
  reference: string
  status: string
  createdAt: string
  what: string
  lead: string
  pax: number
  reason: string
  remarks: string
  by: string
  customer: string
  value: number
}

const css = `
.foc-page{padding:32px 36px;color:#cfe0ea}
.foc-top{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.foc-h1{margin:0;font-size:26px;font-weight:800;color:#fff}
.foc-sub{margin:6px 0 0;color:#7d93a3;font-size:14px;line-height:1.6;max-width:640px}
.foc-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}
.foc-stat{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:20px}
.foc-stat small{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#7d93a3;margin-bottom:8px;font-weight:700}
.foc-stat b{font-size:26px;color:#e0c060}
.foc-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:18px}
.foc-tw{overflow-x:auto}
table.foc-t{width:100%;border-collapse:collapse;font-size:13px}
table.foc-t th{text-align:left;padding:10px 12px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#7d93a3;border-bottom:1px solid rgba(255,255,255,0.08);white-space:nowrap}
table.foc-t td{padding:12px;border-bottom:1px solid rgba(255,255,255,0.05);vertical-align:top}
table.foc-t td.r,table.foc-t th.r{text-align:right;white-space:nowrap}
.foc-ref{color:#e0c060;font-weight:800;text-decoration:none}
.foc-ref:hover{text-decoration:underline}
.foc-sm{font-size:11.5px;color:#7d93a3;margin-top:3px}
.foc-pill{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700}
.foc-pill.on{background:rgba(95,224,160,0.12);color:#5FE0A0}
.foc-pill.off{background:rgba(255,143,138,0.12);color:#ff8f8a}
.foc-empty{padding:36px;text-align:center;color:#7d93a3}
.foc-note{font-size:12.5px;color:#7d93a3;margin:14px 0 0;line-height:1.6}
@page{size:A4 landscape;margin:10mm}
@media print{
  .foc-page,.foc-page *{color:#000 !important;background:#fff !important;border-color:#999 !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .foc-page{padding:0}
  .no-print{display:none !important}
}
@media(max-width:800px){.foc-cards{grid-template-columns:1fr}.foc-page{padding:20px 16px}}
`

export default async function FocReport() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')
  const { data: me } = await supabase.from('staff').select('role').eq('id', user.id).single()
  if (!me || me.role !== 'Super Admin') redirect('/office')

  const { data: pbRaw } = await supabase
    .from('bookings')
    .select('id, reference, status, package_id, seats_held, infant_count, foc_reason, remarks, created_at, created_by, customer_id')
    .eq('payment_type', 'FOC')
    .order('created_at', { ascending: false })
  const { data: tbRaw } = await supabase
    .from('ticket_bookings')
    .select('id, reference, status, ticket_id, seats_held, child_count, infant_count, foc_reason, remarks, created_at, created_by, customer_id')
    .eq('payment_type', 'FOC')
    .order('created_at', { ascending: false })

  const pb: any[] = pbRaw || []
  const tb: any[] = tbRaw || []

  const pkgMap = new Map<string, any>()
  const tktMap = new Map<string, any>()
  const pkgIds = uniq(pb.map((x) => x.package_id))
  const tktIds = uniq(tb.map((x) => x.ticket_id))

  if (pkgIds.length) {
    const { data } = await supabase.from('packages').select('id, name, price, infant_price').in('id', pkgIds)
    for (const p of data || []) pkgMap.set(p.id, p)
  }
  if (tktIds.length) {
    const { data } = await supabase
      .from('tickets')
      .select('id, origin, destination, flight_number, price, child_price, infant_price')
      .in('id', tktIds)
    for (const t of data || []) tktMap.set(t.id, t)
  }

  const lead = new Map<string, string>()
  if (pb.length) {
    const { data } = await supabase
      .from('booking_passengers')
      .select('booking_id, title, given_name, surname, created_at')
      .in('booking_id', pb.map((x) => x.id))
      .order('created_at')
    for (const p of data || []) {
      if (!lead.has(p.booking_id)) lead.set(p.booking_id, `${p.title} ${p.given_name} ${p.surname}`)
    }
  }
  if (tb.length) {
    const { data } = await supabase
      .from('ticket_booking_passengers')
      .select('ticket_booking_id, title, given_name, surname, created_at')
      .in('ticket_booking_id', tb.map((x) => x.id))
      .order('created_at')
    for (const p of data || []) {
      if (!lead.has(p.ticket_booking_id)) lead.set(p.ticket_booking_id, `${p.title} ${p.given_name} ${p.surname}`)
    }
  }

  const allIds = [...pb.map((x) => x.id), ...tb.map((x) => x.id)]
  const loggedBy = new Map<string, string>()
  if (allIds.length) {
    const { data } = await supabase
      .from('booking_activity_log')
      .select('booking_id, done_by_name')
      .eq('action', 'Created')
      .in('booking_id', allIds)
    for (const l of data || []) {
      if (l.done_by_name) loggedBy.set(l.booking_id, l.done_by_name)
    }
  }

  const staffName = new Map<string, string>()
  {
    const { data } = await supabase.from('staff').select('id, full_name')
    for (const s of data || []) staffName.set(s.id, s.full_name)
  }

  const custName = new Map<string, string>()
  const custIds = uniq([...pb.map((x) => x.customer_id), ...tb.map((x) => x.customer_id)])
  if (custIds.length) {
    const { data } = await supabase.from('csp').select('id, customer_code, "Full Name:"').in('id', custIds)
    for (const c of (data as any[]) || []) {
      custName.set(c.id, `${c['Full Name:'] ?? '—'}${c.customer_code ? ' (' + c.customer_code + ')' : ''}`)
    }
  }

  const rows: Row[] = []

  for (const b of pb) {
    const p = pkgMap.get(b.package_id)
    const seats = Number(b.seats_held || 0)
    const inf = Number(b.infant_count || 0)
    const count = seats + inf
    rows.push({
      key: 'p' + b.id,
      kind: 'package',
      id: b.id,
      reference: b.reference,
      status: b.status,
      createdAt: b.created_at,
      what: p?.name || 'Package',
      lead: (lead.get(b.id) || '—') + (count > 1 ? ` (+${count - 1})` : ''),
      pax: count,
      reason: b.foc_reason || '—',
      remarks: b.remarks || '',
      by: loggedBy.get(b.id) || staffName.get(b.created_by) || 'Unknown',
      customer: b.customer_id ? custName.get(b.customer_id) || '—' : 'Walk-in',
      value: seats * Number(p?.price || 0) + inf * Number(p?.infant_price || 0),
    })
  }

  for (const b of tb) {
    const t = tktMap.get(b.ticket_id)
    const seats = Number(b.seats_held || 0)
    const kids = Number(b.child_count || 0)
    const inf = Number(b.infant_count || 0)
    const count = seats + inf
    rows.push({
      key: 't' + b.id,
      kind: 'ticket',
      id: b.id,
      reference: b.reference,
      status: b.status,
      createdAt: b.created_at,
      what: t ? `${t.origin} → ${t.destination} · ${t.flight_number || ''}` : 'Flight',
      lead: (lead.get(b.id) || '—') + (count > 1 ? ` (+${count - 1})` : ''),
      pax: count,
      reason: b.foc_reason || '—',
      remarks: b.remarks || '',
      by: loggedBy.get(b.id) || staffName.get(b.created_by) || 'Unknown',
      customer: b.customer_id ? custName.get(b.customer_id) || '—' : 'Walk-in',
      value:
        (seats - kids) * Number(t?.price || 0) +
        kids * Number(t?.child_price ?? t?.price ?? 0) +
        inf * Number(t?.infant_price || 0),
    })
  }

  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const active = rows.filter((r) => r.status !== 'Cancelled')
  const totalPax = active.reduce((a, r) => a + r.pax, 0)
  const totalValue = active.reduce((a, r) => a + r.value, 0)

  return (
    <div className="foc-page">
      <style>{css}</style>

      <div className="foc-top">
        <div>
          <h1 className="foc-h1">FOC Report</h1>
          <p className="foc-sub">
            Every free-of-charge booking, with the reason given and who created it. Cancelled bookings are listed
            but not counted in the totals.
          </p>
        </div>
        <FocPrintButton />
      </div>

      <div className="foc-cards">
        <div className="foc-stat"><small>Active FOC bookings</small><b>{active.length}</b></div>
        <div className="foc-stat"><small>Passengers travelling free</small><b>{totalPax}</b></div>
        <div className="foc-stat"><small>Normal value given free</small><b>{money(totalValue)}</b></div>
      </div>

      <div className="foc-card">
        {rows.length ? (
          <div className="foc-tw">
            <table className="foc-t">
              <thead>
                <tr>
                  <th>Created (PKT)</th>
                  <th>Reference</th>
                  <th>Package / Flight</th>
                  <th>Passengers</th>
                  <th>Reason</th>
                  <th>Created by</th>
                  <th className="r">Normal value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <td style={{ whiteSpace: 'nowrap' }}>{when(r.createdAt)}</td>
                    <td>
                      <Link className="foc-ref" href={`/office/b/${r.kind}/${r.id}`}>{r.reference}</Link>
                      <div className="foc-sm">{r.kind === 'package' ? 'Package' : 'Flight'}</div>
                    </td>
                    <td>{r.what}</td>
                    <td>
                      {r.lead}
                      <div className="foc-sm">{r.customer}</div>
                    </td>
                    <td>
                      {r.reason}
                      {r.remarks ? <div className="foc-sm">{r.remarks}</div> : null}
                    </td>
                    <td>{r.by}</td>
                    <td className="r">{money(r.value)}</td>
                    <td>
                      <span className={'foc-pill ' + (r.status === 'Cancelled' ? 'off' : 'on')}>
                        {r.status === 'Cancelled' ? 'Cancelled' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="foc-empty">No FOC bookings have been made yet.</div>
        )}
        <p className="foc-note">
          Normal value is worked out from the package or flight prices as they are today. It shows what the booking
          would normally cost, and is not money received.
        </p>
      </div>
    </div>
  )
}

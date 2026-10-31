import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { dmy, officeCss } from '../../../lib'
import PrintButton from '../../../PrintButton'

const sheetCss = `
.sheet{background:#fff;color:#000;max-width:1120px;margin:0 auto;padding:28px 32px 20px;border:1px solid #e3e9f1;border-radius:6px}
.sheet .mh{display:flex;justify-content:space-between;align-items:center;gap:16px;border-bottom:2px solid #000;padding-bottom:12px}
.sheet .brand{display:flex;align-items:center;gap:12px}
.sheet .brand img{height:46px;width:auto}
.sheet .brand b{display:block;font-size:17px;letter-spacing:.08em}
.sheet .brand span{display:block;font-size:11px;margin-top:2px}
.sheet .doc{font-size:20px;font-weight:800;letter-spacing:.08em;text-align:right}
.sheet .subj{margin-top:14px;font-size:15px}
.sheet .meta{display:flex;flex-wrap:wrap;gap:4px 32px;margin:6px 0 12px;font-size:13px}
table.mt{width:100%;border-collapse:collapse;table-layout:fixed;font-size:13px}
table.mt th{text-align:left;font-size:11px;letter-spacing:.05em;text-transform:uppercase;padding:8px;border-top:1px solid #000;border-bottom:1px solid #000;font-weight:700}
table.mt td{padding:7px 8px;border-bottom:1px solid #bbb;vertical-align:top;overflow-wrap:anywhere}
table.mt td.nw{white-space:nowrap;overflow-wrap:normal}
table.mt tr.sp td{border:none;padding:0;height:0}
table.mt tr.tr-tot td{border-bottom:none;border-top:1px solid #000;text-align:right;font-weight:800;font-size:14px;padding-top:10px}
table.mt td.none{text-align:center;color:#555;padding:24px}
.lk{color:inherit;text-decoration:none}
.lk:hover{text-decoration:underline}
@page{size:A4 landscape;margin:0}
@media print{
  .sheet{border:none;border-radius:0;max-width:none;margin:0;padding:8mm 12mm 0}
  table.mt{font-size:12px}
  table.mt tr.sp td{height:8mm}
  table.mt tr{break-inside:avoid}
  .sheet .meta{margin-bottom:0}
}
`

export default async function ManifestDetail({
  params,
}: {
  params: Promise<{ kind: string; id: string }>
}) {
  const { kind, id } = await params
  if (kind !== 'package' && kind !== 'ticket') notFound()
  const isPkg = kind === 'package'
  const supabase = await createClient()
  await supabase.rpc('expire_stale_bookings')

  let heading = 'GROUP MANIFEST'
  let subjectLabel = 'Package'
  let subject = ''
  const meta: { label: string; value: string }[] = []

  if (isPkg) {
    const { data: p } = await supabase.from('packages').select('*').eq('id', id).single()
    if (!p) notFound()
    subject = p.name
    meta.push({ label: 'Departure', value: dmy(p.departure_date) })
    meta.push({ label: 'Duration', value: `${p.days} days` })
  } else {
    const { data: t } = await supabase.from('tickets').select('*').eq('id', id).single()
    if (!t) notFound()
    const { data: a } = await supabase.from('airlines').select('name').eq('id', t.airline_id).maybeSingle()
    const dt = String(t.departure_datetime)
    heading = 'FLIGHT MANIFEST'
    subjectLabel = 'Route'
    subject = `${t.origin} → ${t.destination}${t.ticket_type === 'Multi City' ? ' (Multi City)' : ''}`
    meta.push({ label: 'Airline', value: a?.name || '—' })
    meta.push({ label: 'Flight', value: t.flight_number || '—' })
    const { data: pnrRow } = await supabase.from('ticket_pnr').select('pnr').eq('ticket_id', id).maybeSingle()
    if (pnrRow?.pnr) meta.push({ label: 'PNR', value: pnrRow.pnr })
    meta.push({ label: 'Departure', value: `${dmy(dt)} ${dt.slice(11, 16)}` })
  }

  const { data: bk } = await supabase
    .from(isPkg ? 'bookings' : 'ticket_bookings')
    .select('*')
    .eq(isPkg ? 'package_id' : 'ticket_id', id)
    .in('status', ['Paid', 'Partial', 'Unpaid'])
    .order('created_at')
  const bookings: any[] = bk || []
  const ids = bookings.map((b: any) => b.id)

  let pax: any[] = []
  if (ids.length) {
    const { data: x } = await supabase
      .from(isPkg ? 'booking_passengers' : 'ticket_booking_passengers')
      .select('*')
      .in(isPkg ? 'booking_id' : 'ticket_booking_id', ids)
      .order('created_at')
    pax = x || []
  }

  const key = isPkg ? 'booking_id' : 'ticket_booking_id'
  let n = 0
  const rows: any[] = []
  bookings.forEach((b: any) => {
    pax.filter((p) => p[key] === b.id).forEach((p, idx) => {
      n += 1
      rows.push({ n, b, p, first: idx === 0 })
    })
  })

  meta.push({ label: 'Passengers', value: String(rows.length) })

  return (
    <div>
      <style>{officeCss}{sheetCss}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link href={isPkg ? '/office/manifests' : '/office/manifests?tab=tickets'}
          style={{ color: '#2f7f7a', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>← Back to manifests</Link>
        <PrintButton label="Print manifest" />
      </div>

      <div className="sheet">
        <div className="mh">
          <div className="brand">
            <img src="/logo.png" alt="" />
            <div>
              <b>AIMA CONCERNS</b>
              <span>Travel &amp; Tours · Est. 1999</span>
            </div>
          </div>
          <div className="doc">{heading}</div>
        </div>

        <div className="subj"><b>{subjectLabel}:</b> {subject}</div>
        <div className="meta">
          {meta.map((m) => (
            <span key={m.label}><b>{m.label}:</b> {m.value}</span>
          ))}
        </div>

        <table className="mt">
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '27%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>
          <thead>
            <tr className="sp"><td colSpan={7}></td></tr>
            <tr>
              <th>#</th>
              <th>Reference</th>
              <th>Passenger name</th>
              <th>Passport No.</th>
              <th>Date of birth</th>
              <th>Passport expiry</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((r) => (
              <tr key={r.p.id}>
                <td>{r.n}</td>
                <td className="nw"><Link className="lk" href={`/office/b/${kind}/${r.b.id}`}>{r.b.reference}</Link></td>
                <td>{r.p.title} {r.p.given_name} {r.p.surname}</td>
                <td className="nw">{r.p.passport_number}</td>
                <td className="nw">{dmy(r.p.date_of_birth)}</td>
                <td className="nw">{dmy(r.p.passport_expiry_date)}</td>
                <td>{r.first ? (r.b.remarks || '') : ''}</td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="none">No active bookings yet.</td></tr>
            )}
            {rows.length > 0 && (
              <tr className="tr-tot"><td colSpan={7}>Total passengers: {rows.length}</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr className="sp"><td colSpan={7}></td></tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { dmy, num, officeCss, paidOf } from '../../lib'
import PrintButton from '../../PrintButton'

const sheetCss = `
.sheet{background:#fff;color:#000;max-width:860px;margin:0 auto;padding:28px 32px 20px;border:1px solid #e3e9f1;border-radius:6px}
.sheet .mh{display:flex;justify-content:space-between;align-items:center;gap:16px;border-bottom:2px solid #000;padding-bottom:12px}
.sheet .brand{display:flex;align-items:center;gap:12px}
.sheet .brand img{height:46px;width:auto}
.sheet .brand b{display:block;font-size:17px;letter-spacing:.08em}
.sheet .brand span{display:block;font-size:11px;margin-top:2px}
.sheet .brand > div{min-width:0}
.sheet .brand .ct{display:block;font-size:10.5px;margin-top:1px;color:#000}
.sheet .doc{font-size:20px;font-weight:800;letter-spacing:.08em;text-align:right}
.sheet .subj{margin-top:14px;font-size:15px}
.sheet .meta{display:flex;flex-wrap:wrap;gap:4px 32px;margin:6px 0 12px;font-size:13px}
table.lt{width:100%;border-collapse:collapse;table-layout:fixed;font-size:13px;font-variant-numeric:tabular-nums}
table.lt th{text-align:left;font-size:11px;letter-spacing:.05em;text-transform:uppercase;padding:8px;border-top:1px solid #000;border-bottom:1px solid #000;font-weight:700;vertical-align:bottom}
table.lt th small{display:block;font-weight:400;text-transform:none;letter-spacing:0;font-size:10px;margin-top:1px}
table.lt td{padding:7px 8px;border-bottom:1px solid #bbb;vertical-align:top;overflow-wrap:anywhere}
table.lt .r{text-align:right}
table.lt td.nw{white-space:nowrap;overflow-wrap:normal}
table.lt .sm{font-size:10.5px;color:#666;margin-top:2px}
table.lt tr.sp td{border:none;padding:0;height:0}
table.lt tr.tt td{font-weight:800;font-size:14px;border-bottom:none;padding:7px 8px}
table.lt tr.tt.f td{border-top:1px solid #000;padding-top:10px}
table.lt tr.tt.l td{border-bottom:1px solid #000}
table.lt td.none{text-align:center;color:#555;padding:24px}
.lk{color:inherit;text-decoration:none}
.lk:hover{text-decoration:underline}
@page{size:A4 portrait;margin:0}
@media print{
  .sheet{border:none;border-radius:0;max-width:none;margin:0;padding:8mm 12mm 0}
  table.lt{font-size:12px}
  table.lt tr.sp td{height:8mm}
  table.lt tr{break-inside:avoid}
  .sheet .meta{margin-bottom:0}
}
`

export default async function LedgerDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  await supabase.rpc('expire_stale_bookings')

  const { data: p } = await supabase.from('packages').select('*').eq('id', id).single()
  if (!p) notFound()

  const { data: bk } = await supabase
    .from('bookings')
    .select('*')
    .eq('package_id', id)
    .in('status', ['Paid', 'Partial', 'Unpaid'])
    .order('created_at')
  const bookings: any[] = bk || []
  const ids = bookings.map((b: any) => b.id)

  let pax: any[] = []
  if (ids.length) {
    const { data: x } = await supabase.from('booking_passengers').select('*').in('booking_id', ids).order('created_at')
    pax = x || []
  }

  const rows = bookings.map((b: any, i: number) => {
    const mine = pax.filter((x) => x.booking_id === b.id)
    const lead = mine[0]
    const total = Number(b.total_amount || 0)
    const paid = paidOf(b)
    return { i: i + 1, b, lead, count: mine.length, total, paid, pending: Math.max(0, total - paid) }
  })
  const sumPaid = rows.reduce((a, r) => a + r.paid, 0)
  const sumPending = rows.reduce((a, r) => a + r.pending, 0)

  return (
    <div>
      <style>{officeCss}{sheetCss}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link href="/office/ledgers"
          style={{ color: '#2f7f7a', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>← Back to ledgers</Link>
        <PrintButton label="Print ledger" />
      </div>

      <div className="sheet">
        <div className="mh">
          <div className="brand">
            <img src="/logo.png" alt="" />
            <div>
              <b>AIMA CONCERNS</b>
              <span>Travel &amp; Tours · Est. 1999</span>
              <span className="ct">Office 102 &amp; 103, Eden Heights, Jail Road, Lahore</span>
              <span className="ct">+92 322 4631622 · +92 332 7869765</span>
              <span className="ct">aimaconcerns@gmail.com · aimaconcerns.com</span>
            </div>
          </div>
          <div className="doc">GROUP LEDGER</div>
        </div>

        <div className="subj"><b>Package:</b> {p.name}</div>
        <div className="meta">
          <span><b>Departure:</b> {dmy(p.departure_date)}</span>
        </div>

        <table className="lt">
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '33%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>
          <thead>
            <tr className="sp"><td colSpan={6}></td></tr>
            <tr>
              <th>#</th>
              <th>Reference</th>
              <th>Name</th>
              <th className="r">Total<small>(PKR)</small></th>
              <th className="r">Paid<small>(PKR)</small></th>
              <th className="r">Pending<small>(PKR)</small></th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((r) => (
              <tr key={r.b.id}>
                <td>{r.i}</td>
                <td className="nw"><Link className="lk" href={`/office/b/package/${r.b.id}`}>{r.b.reference}</Link></td>
                <td>
                  {r.lead ? `${r.lead.title} ${r.lead.given_name} ${r.lead.surname}` : '—'}
                  {r.count > 1 ? ` (+${r.count - 1})` : ''}
                  {r.b.remarks ? <div className="sm">{r.b.remarks}</div> : null}
                </td>
                <td className="r">{num(r.total)}</td>
                <td className="r">{num(r.paid)}</td>
                <td className="r">{num(r.pending)}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="none">No active bookings on this package yet.</td></tr>
            )}
            {rows.length > 0 && (
              <>
                <tr className="tt f">
                  <td colSpan={5} className="r">TOTAL RECEIVED</td>
                  <td className="r">{num(sumPaid)}</td>
                </tr>
                <tr className="tt l">
                  <td colSpan={5} className="r">TOTAL REMAINING</td>
                  <td className="r">{num(sumPending)}</td>
                </tr>
              </>
            )}
          </tbody>
          <tfoot>
            <tr className="sp"><td colSpan={6}></td></tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

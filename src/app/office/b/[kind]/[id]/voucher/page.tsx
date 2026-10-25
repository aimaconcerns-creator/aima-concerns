import Link from 'next/link'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { createClient } from '@/utils/supabase/server'
import { customerMap, fmt, officeCss, paidOf, pkt } from '@/app/office/lib'
import PrintButton from '@/app/office/PrintButton'

export default async function OfficeVoucher({
  params,
}: {
  params: Promise<{ kind: string; id: string }>
}) {
  const { kind, id } = await params
  if (kind !== 'package' && kind !== 'ticket') notFound()
  const isPkg = kind === 'package'
  const supabase = await createClient()
  await supabase.rpc('expire_stale_bookings')

  const { data: b } = await supabase.from(isPkg ? 'bookings' : 'ticket_bookings').select('*').eq('id', id).single()
  if (!b) notFound()
  const { data: pax } = await supabase
    .from(isPkg ? 'booking_passengers' : 'ticket_booking_passengers')
    .select('*')
    .eq(isPkg ? 'booking_id' : 'ticket_booking_id', id)
    .order('created_at')

  let title = ''
  let lines: string[] = []
  if (isPkg) {
    const { data: p } = await supabase.from('packages').select('name, package_type, days, departure_date').eq('id', b.package_id).single()
    title = p?.name || 'Package'
    lines = [`${p?.package_type || ''} package`, `${p?.days || ''} days`, `Departure: ${String(p?.departure_date).slice(0, 10)}`]
  } else {
    const { data: t } = await supabase.from('tickets').select('*').eq('id', b.ticket_id).single()
    const { data: a } = await supabase.from('airlines').select('name').eq('id', t?.airline_id).maybeSingle()
    title = `${t?.origin} → ${t?.destination}`
    const dt = String(t?.departure_datetime)
    const at = String(t?.arrival_datetime)
    lines = [
      `${a?.name || 'Airline'} · Flight ${t?.flight_number}`,
      `Departs: ${dt.slice(0, 10)} ${dt.slice(11, 16)}`,
      `Arrives: ${at.slice(0, 10)} ${at.slice(11, 16)}`,
      `Baggage: ${t?.baggage_allowance || '—'}`,
    ]
    const segs = Array.isArray(t?.segments) ? t.segments : []
    segs.forEach((s: any) => {
      lines.push(`${s.origin} → ${s.destination} · ${s.flight_number} · ${String(s.departure_datetime).replace('T', ' ')}`)
    })
  }

  const cmap = await customerMap(supabase, [b.customer_id])
  const cust = b.customer_id ? cmap.get(b.customer_id) : null

  const total = Number(b.total_amount || 0)
  const paid = paidOf(b)
  const balance = Math.max(0, total - paid)

  let statusTitle = ''
  let statusText = ''
  let color = '#1f7a55'
  let bg = '#e6f4ee'
  if (b.status === 'Cancelled') { statusTitle = 'CANCELLED'; statusText = 'This booking has been cancelled and is not valid for travel.'; color = '#b3261e'; bg = '#fdecea' }
  else if (b.status === 'Expired') { statusTitle = 'EXPIRED'; statusText = 'The seat hold ran out. This booking is not valid.'; color = '#6b7c93'; bg = '#eef0f3' }
  else if (b.payment_type === 'FOC') { statusTitle = 'FOC — FREE OF CHARGE'; statusText = 'No payment is due on this booking.'; color = '#6a3fb5'; bg = '#efe9fb' }
  else if (b.status === 'Paid') { statusTitle = 'PAID'; statusText = `Fully paid: ${fmt(paid)}.` }
  else if (b.status === 'Partial') { statusTitle = 'PARTIAL PAYMENT'; statusText = `Paid ${fmt(paid)}. Balance ${fmt(balance)}${b.balance_due_date ? ' due by ' + b.balance_due_date : ''}.`; color = '#a8761a'; bg = '#fff4de' }
  else { statusTitle = 'PAY LATER — NOT YET PAID'; statusText = `Balance ${fmt(balance)}. Seats held until ${pkt(b.expires_at)}.`; color = '#2a5fa8'; bg = '#e8f0fb' }

  const qr = await QRCode.toDataURL(`https://aimaconcerns.com/office/find?ref=${b.reference}`, { margin: 1, width: 200 })
  const wa = `https://wa.me/?text=${encodeURIComponent(`Aima Concerns booking ${b.reference} — ${title}. ${statusTitle}. ${statusText}`)}`

  return (
    <div>
      <style>{officeCss}{`
        .v-wrap{max-width:820px;margin:0 auto;background:#fff;border:1px solid #e3e9f1;border-radius:16px;overflow:hidden;box-shadow:0 6px 22px rgba(18,51,95,.08)}
        .v-top{background:linear-gradient(135deg,#0d3b47,#2f7f7a);color:#fff;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;gap:16px}
        .v-top h2{margin:0;font-size:20px;letter-spacing:.06em}
        .v-top p{margin:4px 0 0;font-size:11px;letter-spacing:.3em;color:#f3d9a4}
        .v-body{padding:26px 28px}
        .v-ref{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
        .v-ref small{font-size:11px;font-weight:700;color:#6b7c93;letter-spacing:.08em}
        .v-ref b{display:block;font-size:34px;letter-spacing:.12em;color:#12335f}
        .v-status{margin:20px 0;padding:14px 18px;border-radius:12px;font-weight:700}
        .v-status div{font-size:12px;letter-spacing:.08em}
        .v-status p{margin:4px 0 0;font-size:14px;font-weight:600}
        .v-foot{border-top:1px solid #e3e9f1;padding:16px 28px;font-size:12px;color:#6b7c93;line-height:1.7;background:#fbfcfe}
        @media print{.v-wrap{box-shadow:none;border:1px solid #999}}
      `}</style>

      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <Link href={`/office/b/${kind}/${id}`} className="btn ghost">← Back to booking</Link>
        <PrintButton label="Print / Save as PDF" />
        <a href={wa} target="_blank" rel="noreferrer" className="btn">Send on WhatsApp</a>
      </div>

      <div className="v-wrap">
        <div className="v-top">
          <div><h2>AIMA CONCERNS</h2><p>TRAVEL &amp; TOURS · EST. 1999</p></div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{isPkg ? 'E-VOUCHER' : 'E-TICKET'}</div>
        </div>
        <div className="v-body">
          <div className="v-ref">
            <div><small>BOOKING REFERENCE</small><b>{b.reference}</b></div>
            <img src={qr} alt="QR" width={110} height={110} />
          </div>

          <div className="v-status" style={{ background: bg, color }}>
            <div>{statusTitle}</div>
            <p>{statusText}</p>
          </div>

          <h3 style={{ margin: '0 0 6px', color: '#12335f', fontSize: 20 }}>{title}</h3>
          {lines.map((l, i) => <p key={i} style={{ margin: '3px 0', fontSize: 13.5, color: '#4b5f7a' }}>{l}</p>)}
          <p style={{ margin: '12px 0 0', fontSize: 13.5, color: '#4b5f7a' }}>
            Booked for: <b style={{ color: '#12335f' }}>{cust ? cust.out_full_name : 'Walk-in customer'}</b>
            {b.remarks ? <> · {b.remarks}</> : null}
          </p>

          <div className="tw" style={{ marginTop: 20 }}>
            <table className="t">
              <thead><tr><th>#</th><th>Passenger</th><th>Date of birth</th><th>Passport</th><th>Expiry</th></tr></thead>
              <tbody>
                {(pax || []).map((p: any, i: number) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td>{p.title} {p.given_name} {p.surname}</td>
                    <td>{p.date_of_birth}</td>
                    <td>{p.passport_number}</td>
                    <td>{p.passport_expiry_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="kv" style={{ marginTop: 20 }}>
            <div><small>Total</small><b>{fmt(total)}</b></div>
            <div><small>Paid</small><b>{fmt(paid)}</b></div>
            <div><small>Balance</small><b>{fmt(balance)}</b></div>
          </div>
        </div>
        <div className="v-foot">
          Aima Concerns Travel &amp; Tours · Office 102 &amp; 103, Eden Heights, Jail Road, Lahore<br />
          +92 322 4631622 · +92 332 7869765 · aimaconcerns@gmail.com<br />
          Please carry this voucher and your passport. Passports must be valid as required for the destination.
        </div>
      </div>
    </div>
  )
}

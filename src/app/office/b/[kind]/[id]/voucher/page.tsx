import Link from 'next/link'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { createClient } from '@/utils/supabase/server'
import { customerMap, dmy, fmt, officeCss, paidOf, pkt } from '@/app/office/lib'
import PrintButton from '@/app/office/PrintButton'
import TicketVoucher from './TicketVoucher'

const dayLabel = (s: string) =>
  s && s.length >= 10
    ? new Date(s.slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
      })
    : ''

const clock = (s: string) => (s && s.length >= 16 ? s.slice(11, 16) : '')

const duration = (a: string, b: string) => {
  if (!a || !b) return ''
  const m = Math.round((Date.parse(a.slice(0, 16) + 'Z') - 0 > 0 ? (Date.parse(b.slice(0, 16) + 'Z') - Date.parse(a.slice(0, 16) + 'Z')) / 60000 : NaN))
  if (isNaN(m) || m <= 0) return ''
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

const paxType = (title: string) => {
  const t = String(title || '').toUpperCase()
  return t.startsWith('INF') ? 'Infant' : t.startsWith('CHD') ? 'Child' : 'Adult'
}

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

  const cmap = await customerMap(supabase, [b.customer_id])
  const cust = b.customer_id ? cmap.get(b.customer_id) : null

  const total = Number(b.total_amount || 0)
  const paid = paidOf(b)
  const balance = Math.max(0, total - paid)

  let statusTitle = ''
  let statusText = ''
  let statusTextHidden = ''
  let color = '#1f7a55'
  let bg = '#e6f4ee'
  if (b.status === 'Cancelled') {
    statusTitle = 'CANCELLED'
    statusText = 'This booking has been cancelled and is not valid for travel.'
    statusTextHidden = statusText
    color = '#b3261e'; bg = '#fdecea'
  } else if (b.status === 'Expired') {
    statusTitle = 'EXPIRED'
    statusText = 'The seat hold ran out. This booking is not valid.'
    statusTextHidden = statusText
    color = '#6b7c93'; bg = '#eef0f3'
  } else if (b.payment_type === 'FOC') {
    statusTitle = 'FOC — FREE OF CHARGE'
    statusText = 'No payment is due on this booking.'
    statusTextHidden = statusText
    color = '#6a3fb5'; bg = '#efe9fb'
  } else if (b.status === 'Paid') {
    statusTitle = 'PAID'
    statusText = `Fully paid: ${fmt(paid)}.`
    statusTextHidden = 'Fully paid.'
  } else if (b.status === 'Partial') {
    statusTitle = 'PARTIAL PAYMENT'
    statusText = `Paid ${fmt(paid)}. Balance ${fmt(balance)}${b.balance_due_date ? ' due by ' + b.balance_due_date : ''}.`
    statusTextHidden = `Partial payment received.${b.balance_due_date ? ' Balance due by ' + b.balance_due_date + '.' : ''}`
    color = '#a8761a'; bg = '#fff4de'
  } else {
    statusTitle = 'PAY LATER — NOT YET PAID'
    statusText = `Balance ${fmt(balance)}. Seats held until ${pkt(b.expires_at)}.`
    statusTextHidden = `Not yet paid. Seats held until ${pkt(b.expires_at)}.`
    color = '#2a5fa8'; bg = '#e8f0fb'
  }

  const qr = await QRCode.toDataURL(`https://aimaconcerns.com/office/find?ref=${b.reference}`, { margin: 1, width: 200 })

  // ---------- FLIGHT TICKET: new style with Hide fare ----------
  if (!isPkg) {
    const { data: t } = await supabase.from('tickets').select('*').eq('id', b.ticket_id).single()
    const { data: a } = await supabase
      .from('airlines')
      .select('name, logo_url')
      .eq('id', t?.airline_id)
      .maybeSingle()

    const mk = (label: string, flight: any, o: any, d: any, dep: any, arr: any) => {
      const ds = String(dep || '')
      const as = String(arr || '')
      return {
        label,
        flight: String(flight || ''),
        origin: String(o || ''),
        destination: String(d || ''),
        depDate: dayLabel(ds),
        depTime: clock(ds),
        arrDate: dayLabel(as),
        arrTime: clock(as),
        duration: duration(ds, as),
      }
    }

    const legs: ReturnType<typeof mk>[] = []
    if (t) {
      if (t.ticket_type === 'Multi City') {
        legs.push(mk('LEG 1', t.flight_number, t.origin, t.destination, t.departure_datetime, t.arrival_datetime))
        const segs: any[] = Array.isArray(t.segments) ? t.segments : []
        segs.forEach((s: any, i: number) => {
          legs.push(mk(`LEG ${i + 2}`, s.flight_number, s.origin, s.destination, s.departure_datetime, s.arrival_datetime))
        })
      } else {
        legs.push(
          mk(t.ticket_type === 'Return' ? 'OUTBOUND' : 'FLIGHT', t.flight_number, t.origin, t.destination, t.departure_datetime, t.arrival_datetime)
        )
        if (t.ticket_type === 'Return' && t.return_departure_datetime) {
          legs.push(
            mk('RETURN', t.return_flight_number, t.destination, t.origin, t.return_departure_datetime, t.return_arrival_datetime)
          )
        }
      }
    }

    const route = t ? `${t.origin} → ${t.destination}${t.flight_number ? ' · ' + t.flight_number : ''}` : 'Flight ticket'
    const passengers = (pax || []).map((p: any, i: number) => ({
      n: i + 1,
      name: `${p.title} ${p.given_name} ${p.surname}`,
      type: paxType(p.title),
      dob: dmy(p.date_of_birth),
      passport: String(p.passport_number || ''),
      fare: Number(p.price || 0),
    }))

    return (
      <div>
        <style>{officeCss}</style>
        <TicketVoucher
          id={id}
          reference={String(b.reference || '')}
          airlineName={a?.name || 'Airline'}
          airlineLogo={a?.logo_url || null}
          qr={qr}
          statusTitle={statusTitle}
          statusColor={color}
          statusBg={bg}
          statusTextFull={statusText}
          statusTextHidden={statusTextHidden}
          waFull={`Aima Concerns booking ${b.reference} — ${route}. ${statusTitle}. ${statusText}`}
          waHidden={`Aima Concerns booking ${b.reference} — ${route}. ${statusTitle}. ${statusTextHidden}`}
          isFoc={b.payment_type === 'FOC'}
          passengers={passengers}
          legs={legs}
          baggage={String(t?.baggage_allowance || '')}
          cabin="Economy"
          ticketType={String(t?.ticket_type || '')}
          bookedFor={cust ? cust.out_full_name : 'Walk-in customer'}
          remarks={String(b.remarks || '')}
          total={total}
          paid={paid}
          balance={balance}
        />
      </div>
    )
  }

  // ---------- PACKAGE VOUCHER: unchanged ----------
  const { data: p } = await supabase.from('packages').select('name, package_type, days, departure_date').eq('id', b.package_id).single()
  const title = p?.name || 'Package'
  const lines = [`${p?.package_type || ''} package`, `${p?.days || ''} days`, `Departure: ${String(p?.departure_date).slice(0, 10)}`]
  const wa = `https://wa.me/?text=${encodeURIComponent(`Aima Concerns booking ${b.reference} — ${title}. ${statusTitle}. ${statusText}`)}`

  return (
    <div className="v-page">
      <style>{officeCss}{`
        .v-wrap, .v-wrap * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
        @page{size:A4 portrait;margin:0}
        @media print{
          .v-page{padding:10mm}
          .v-wrap{box-shadow:none;border:1px solid #999}
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <Link href={`/office/b/${kind}/${id}`} className="btn ghost">← Back to booking</Link>
        <PrintButton label="Print / Save as PDF" />
        <a href={wa} target="_blank" rel="noreferrer" className="btn">Send on WhatsApp</a>
      </div>

      <div className="v-wrap">
        <div className="v-top">
          <div><h2>AIMA CONCERNS</h2><p>TRAVEL &amp; TOURS · EST. 1999</p></div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>E-VOUCHER</div>
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
                {(pax || []).map((x: any, i: number) => (
                  <tr key={x.id}>
                    <td>{i + 1}</td>
                    <td>{x.title} {x.given_name} {x.surname}</td>
                    <td>{x.date_of_birth}</td>
                    <td>{x.passport_number}</td>
                    <td>{x.passport_expiry_date}</td>
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

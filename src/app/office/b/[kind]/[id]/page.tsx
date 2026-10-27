import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Badge, customerMap, fmt, officeCss, paidOf, payLabel, pkt } from '../../../lib'
import BookingActions from './BookingActions'

function describe(l: any): string {
  const d = l.details || {}
  if (l.action === 'Created') return `${d.payment_type || ''} · total ${fmt(d.total)} · paid ${fmt(d.amount_paid)}${d.foc_reason ? ' · FOC: ' + d.foc_reason : ''}`
  if (l.action === 'Payment recorded') return `${fmt(d.amount)} by ${d.method}${d.note ? ' · ' + d.note : ''} · now ${d.status_after}`
  if (l.action === 'Cancelled') return `${d.reason || 'No reason given'} · was ${d.status_before}`
  if (l.action === 'Edited') return `Passengers saved${d.remarks_after !== d.remarks_before ? ' · remarks changed' : ''}`
  if (l.action === 'Split') {
    return d.role === 'new'
      ? `Created by splitting ${d.from_reference} · ${d.moved} passenger(s) · total ${fmt(d.total)} · paid ${fmt(d.paid)}`
      : `${d.moved} passenger(s) moved to ${d.new_reference} · total now ${fmt(d.total_after)} · paid ${fmt(d.paid_after)}`
  }
  return ''
}

export default async function BookingView({
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
  let sub = ''
  if (isPkg) {
    const { data: p } = await supabase.from('packages').select('name, package_type, days, departure_date').eq('id', b.package_id).single()
    title = p?.name || 'Package'
    sub = `${p?.package_type || ''} · ${p?.days || ''} days · Departs ${String(p?.departure_date).slice(0, 10)}`
  } else {
    const { data: t } = await supabase.from('tickets').select('origin, destination, flight_number, departure_datetime').eq('id', b.ticket_id).single()
    title = `${t?.origin} → ${t?.destination}`
    sub = `${t?.flight_number} · ${String(t?.departure_datetime).slice(0, 10)} ${String(t?.departure_datetime).slice(11, 16)}`
  }

  const cmap = await customerMap(supabase, [b.customer_id])
  const cust = b.customer_id ? cmap.get(b.customer_id) : null
  const { data: log } = await supabase.from('booking_activity_log').select('*').eq('booking_id', id).order('created_at', { ascending: false })

  const paid = paidOf(b)
  const total = Number(b.total_amount || 0)
  const balance = b.status === 'Cancelled' || b.status === 'Expired' ? 0 : Math.max(0, total - paid)
  const isOffline = b.booking_source === 'offline'

  return (
    <div>
      <style>{officeCss}</style>
      <Link href="/office" style={{ color: '#2f7f7a', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>← Home</Link>

      <div className="pg-bar" style={{ marginTop: 14, marginBottom: 6 }}>
        <div className="pg-h">
          <h1>{b.reference} <Badge label={payLabel(b)} /></h1>
          <p>{title} · {sub}</p>
        </div>
      </div>

      <BookingActions
        key={b.status + '-' + paid + '-' + total + '-' + (pax?.length || 0)}
        kind={kind}
        bookingId={id}
        status={b.status}
        paymentType={b.payment_type}
        balance={balance}
        total={total}
        paid={paid}
        isOffline={isOffline}
        passengers={pax || []}
        remarks={b.remarks || ''}
      />

      <div className="card">
        <h3>Booking details</h3>
        <div className="kv">
          <div><small>Customer</small><b>{cust ? `${cust.out_full_name} (${cust.out_customer_code})` : 'Walk-in (no account)'}</b></div>
          <div><small>Source</small><b>{isOffline ? 'Offline' : 'Online'}</b></div>
          <div><small>Total</small><b>{fmt(total)}</b></div>
          <div><small>Paid</small><b>{fmt(paid)}</b></div>
          <div><small>Balance</small><b>{fmt(balance)}</b></div>
          <div><small>Payment type</small><b>{b.payment_type || 'Wallet'}</b></div>
          {b.payment_method && <div><small>Last method</small><b>{b.payment_method}</b></div>}
          {b.balance_due_date && <div><small>Balance due date</small><b>{String(b.balance_due_date)}</b></div>}
          {b.status === 'Unpaid' && <div><small>Seats held until</small><b>{pkt(b.expires_at)}</b></div>}
          {b.foc_reason && <div><small>FOC reason</small><b>{b.foc_reason}</b></div>}
          {b.remarks && <div><small>Remarks</small><b>{b.remarks}</b></div>}
          {b.cancelled_at && <div><small>Cancelled</small><b>{pkt(b.cancelled_at)}</b></div>}
        </div>
      </div>

      <div className="card">
        <h3>Passengers</h3>
        <div className="tw">
          <table className="t">
            <thead><tr><th>#</th><th>Name</th><th>Date of birth</th><th>Nationality</th><th>Passport</th><th>Expiry</th><th className="num">Fare</th></tr></thead>
            <tbody>
              {(pax || []).map((p: any, i: number) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td>{p.title} {p.given_name} {p.surname}</td>
                  <td>{p.date_of_birth}</td>
                  <td>{p.nationality}</td>
                  <td>{p.passport_number}</td>
                  <td>{p.passport_expiry_date}</td>
                  <td className="num">{fmt(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Activity</h3>
        {log && log.length ? (
          <div className="tw">
            <table className="t">
              <thead><tr><th>When</th><th>Action</th><th>By</th><th>Details</th></tr></thead>
              <tbody>
                {log.map((l: any) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{pkt(l.created_at)}</td>
                    <td>{l.action}</td>
                    <td>{l.done_by_name || '—'}</td>
                    <td>{describe(l)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="note">No activity recorded for this booking.</p>}
      </div>
    </div>
  )
}

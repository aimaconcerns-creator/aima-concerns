'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type Booking = {
  kind: 'package' | 'ticket'
  id: string
  reference: string | null
  status: string
  total: number
  expiresAt: string
  tag: string
  title: string
  subtitle: string
}

type Extra = {
  source: string
  paymentType: string | null
  paid: number
  dueDate: string | null
}

function formatLeft(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m ${s}s left`
}

function niceDate(s: string | null) {
  if (!s) return ''
  const d = new Date(String(s).slice(0, 10) + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BookingCard({ booking }: { booking: Booking }) {
  const router = useRouter()
  const [now, setNow] = useState<number | null>(null)
  const [paying, setPaying] = useState(false)
  const [message, setMessage] = useState('')
  const [extra, setExtra] = useState<Extra | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let alive = true
    const load = async () => {
      const supabase = createClient()
      let row: any = null
      if (booking.kind === 'ticket') {
        const { data } = await supabase
          .from('ticket_bookings')
          .select('booking_source, payment_type, amount_paid')
          .eq('id', booking.id)
          .maybeSingle()
        row = data
      } else {
        const { data } = await supabase
          .from('bookings')
          .select('booking_source, payment_type, amount_paid, balance_due_date')
          .eq('id', booking.id)
          .maybeSingle()
        row = data
      }
      if (!alive) return
      setExtra({
        source: row?.booking_source || 'online',
        paymentType: row?.payment_type || null,
        paid: Number(row?.amount_paid || 0),
        dueDate: row?.balance_due_date || null,
      })
    }
    load()
    return () => {
      alive = false
    }
  }, [booking.id, booking.kind, booking.status])

  const msLeft = now === null ? null : new Date(booking.expiresAt).getTime() - now
  const timedOut = booking.status === 'Unpaid' && msLeft !== null && msLeft <= 0
  const isExpired = booking.status === 'Expired' || timedOut
  const isPaid = booking.status === 'Paid'
  const isPartial = booking.status === 'Partial'
  const isCancelled = booking.status === 'Cancelled'
  const isUnpaid = booking.status === 'Unpaid' && !timedOut
  const isOffline = extra?.source === 'offline'
  const isFoc = extra?.paymentType === 'FOC'
  const paidSoFar = extra?.paid ?? 0
  const balance = Math.max(0, booking.total - paidSoFar)

  useEffect(() => {
    if (timedOut) router.refresh()
  }, [timedOut, router])

  const handlePay = async () => {
    setMessage('')
    setPaying(true)
    const supabase = createClient()
    const { error } =
      booking.kind === 'ticket'
        ? await supabase.rpc('pay_ticket_booking', { p_ticket_booking_id: booking.id })
        : await supabase.rpc('pay_booking', { p_booking_id: booking.id })
    setPaying(false)

    if (error) {
      setMessage(error.message)
      return
    }
    router.refresh()
  }

  const voucherHref =
    booking.kind === 'ticket'
      ? `/dashboard/bookings/ticket/${booking.id}/voucher`
      : `/dashboard/bookings/${booking.id}/voucher`

  const badge = isCancelled
    ? { text: 'Cancelled', bg: '#b3261e' }
    : isPaid && isFoc
    ? { text: 'FOC', bg: '#6a3fb5' }
    : isPaid
    ? { text: 'Paid', bg: '#5FAE8C' }
    : isPartial
    ? { text: 'Part Paid', bg: '#e0a030' }
    : isExpired
    ? { text: 'Expired', bg: '#999' }
    : isOffline
    ? { text: 'Seats Held', bg: '#2a5fa8' }
    : { text: 'Awaiting Payment', bg: '#e0a030' }

  const refLabel = { margin: 0, color: '#888', fontSize: '12px' }
  const refValue = { margin: '2px 0 8px', color: '#155263', fontSize: '22px', fontWeight: 800, letterSpacing: '2px' }

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '22px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
        opacity: isExpired || isCancelled ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: '#4a9c7a', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {booking.tag}
          </p>
          <h3 style={{ margin: '4px 0 0', color: '#155263', fontSize: '19px' }}>{booking.title}</h3>
          <p style={{ margin: '6px 0 0', color: '#888', fontSize: '13px' }}>{booking.subtitle}</p>
        </div>
        <span style={{ backgroundColor: badge.bg, color: '#fff', fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
          {badge.text}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
        <div>
          <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>Total</p>
          <p style={{ margin: '2px 0 0', color: '#155263', fontSize: '22px', fontWeight: 'bold' }}>
            {isFoc ? 'Free of charge' : `PKR ${booking.total.toLocaleString()}`}
          </p>
        </div>

        {isPaid && (
          <div style={{ textAlign: 'right' }}>
            <p style={refLabel}>Booking Reference</p>
            <p style={refValue}>{booking.reference}</p>
            <Link
              href={voucherHref}
              style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#155263', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}
            >
              View Voucher
            </Link>
          </div>
        )}

        {isPartial && extra !== null && (
          <div style={{ textAlign: 'right' }}>
            <p style={refLabel}>Booking Reference</p>
            <p style={refValue}>{booking.reference}</p>
            <p style={{ margin: 0, color: '#155263', fontSize: '14px' }}>
              Paid PKR {extra.paid.toLocaleString()} · Balance{' '}
              <b style={{ color: '#c0392b' }}>PKR {balance.toLocaleString()}</b>
            </p>
            {extra.dueDate && (
              <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>
                Balance due by {niceDate(extra.dueDate)}
              </p>
            )}
            <p style={{ margin: '6px 0 0', color: '#666', fontSize: '13px', maxWidth: '300px' }}>
              Please pay the balance at our office, or call +92 322 4631622.
            </p>
          </div>
        )}

        {isUnpaid && extra === null && (
          <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>Checking booking...</p>
        )}

        {isUnpaid && extra !== null && isOffline && (
          <div style={{ textAlign: 'right' }}>
            <p style={refLabel}>Booking Reference</p>
            <p style={refValue}>{booking.reference}</p>
            <p style={{ margin: '0 0 4px', color: '#c0392b', fontWeight: 700, fontSize: '15px' }}>
              {msLeft === null ? ' ' : formatLeft(msLeft)}
            </p>
            <p style={{ margin: 0, color: '#666', fontSize: '13px', maxWidth: '300px' }}>
              Your seats are held. Please pay at our office, or call +92 322 4631622.
            </p>
          </div>
        )}

        {isUnpaid && extra !== null && !isOffline && (
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 8px', color: '#c0392b', fontWeight: 700, fontSize: '15px' }}>
              {msLeft === null ? ' ' : formatLeft(msLeft)}
            </p>
            <button
              onClick={handlePay}
              disabled={paying}
              style={{ padding: '11px 26px', backgroundColor: '#5FAE8C', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: paying ? 'default' : 'pointer', fontSize: '15px', opacity: paying ? 0.7 : 1 }}
            >
              {paying ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        )}

        {isExpired && (
          <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>This booking expired and the seats were released.</p>
        )}

        {isCancelled && (
          <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>
            This booking was cancelled. Please contact the office if you have any questions.
          </p>
        )}
      </div>

      {message && <p style={{ margin: '14px 0 0', color: '#c0392b', fontSize: '14px', textAlign: 'right' }}>{message}</p>}
    </div>
  )
}

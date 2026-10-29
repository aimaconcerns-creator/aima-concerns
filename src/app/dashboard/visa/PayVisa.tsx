'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const money = (n: number) => 'PKR ' + Number(n || 0).toLocaleString('en-US')

function left(ms: number) {
  const mins = Math.max(0, Math.floor(ms / 60000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `${d}d ${h}h ${m}m left`
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

export default function PayVisa({
  id,
  fee,
  payByIso,
  balance,
}: {
  id: string
  fee: number
  payByIso: string
  balance: number
}) {
  const router = useRouter()
  const [now, setNow] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const msLeft = now === null ? null : new Date(payByIso).getTime() - now
  const closed = msLeft !== null && msLeft <= 0
  const enough = balance >= fee

  useEffect(() => {
    if (closed) router.refresh()
  }, [closed, router])

  const pay = async () => {
    if (!window.confirm(`Pay ${money(fee)} from your wallet for this visa application?\n\nThe payment cannot be undone by you.`)) return
    setErr('')
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('pay_visa_application', { p_application_id: id })
    setBusy(false)
    if (error) {
      setErr(error.message)
      return
    }
    router.refresh()
  }

  return (
    <div className="vy-pay">
      <div className="vy-pay-top">
        <div>
          <small>Visa fee to pay</small>
          <b>{money(fee)}</b>
        </div>
        <div className="vy-clock">
          {msLeft === null ? ' ' : closed ? 'Payment window closed' : left(msLeft)}
        </div>
      </div>

      <div className="vy-bal">
        Your wallet balance: <b>{money(balance)}</b>
      </div>

      {!enough && !closed && (
        <p className="vy-warn">
          Your wallet balance is not enough. You need {money(fee - balance)} more.{' '}
          <Link href="/wallet/add-money">Add money to your wallet</Link>, then come back to pay.
        </p>
      )}

      {err && <p className="vy-err">{err}</p>}

      <button className="vy-btn" disabled={busy || closed || !enough} onClick={pay}>
        {busy ? 'Processing...' : 'Pay now'}
      </button>
    </div>
  )
}

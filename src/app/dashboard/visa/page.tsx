import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/server'
import PayVisa from './PayVisa'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export const dynamic = 'force-dynamic'

const money = (n: any) => 'PKR ' + Number(n || 0).toLocaleString('en-US')

const day = (s: any) =>
  s
    ? new Date(String(s).slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', {
        timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—'

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' })

const LABEL: Record<string, [string, string, string]> = {
  Submitted: ['Under review', '#e8f0fb', '#2a5fa8'],
  Accepted: ['Under review', '#e8f0fb', '#2a5fa8'],
  'Awaiting Payment': ['Payment due', '#fff4de', '#a8761a'],
  Processing: ['Processing', '#efe9fb', '#6a3fb5'],
  Approved: ['Approved', '#e6f4ee', '#1f7a55'],
  Rejected: ['Not accepted', '#fdecea', '#b3261e'],
  Expired: ['Expired', '#eef0f3', '#6b7c93'],
}

const css = `
* { box-sizing: border-box; }
body { margin: 0; }
.vy-page { min-height: 100vh; background: #f4f7fb; color: #12335f; }
.vy-hero { background: linear-gradient(135deg, #0d3b47 0%, #2f7f7a 55%, #5FAE8C 100%); color: #fff; padding: 34px 5% 38px; border-bottom: 3px solid #d9a441; }
.vy-hero-in { max-width: 900px; margin: 0 auto; }
.vy-back { color: #f3d9a4; text-decoration: none; font-size: 14px; font-weight: 600; }
.vy-hero h1 { margin: 12px 0 0; font-size: clamp(24px, 4vw, 34px); font-weight: 800; }
.vy-hero p { margin: 8px 0 0; opacity: .92; font-size: 14.5px; }
.vy-wrap { max-width: 900px; margin: 28px auto 60px; padding: 0 20px; }
.vy-card { background: #fff; border-radius: 14px; padding: 24px; margin-bottom: 20px; border-top: 4px solid #d9a441; box-shadow: 0 6px 24px rgba(18,51,95,.07); }
.vy-top { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
.vy-name { margin: 0; font-size: 19px; font-weight: 800; color: #12335f; }
.vy-sub { margin: 5px 0 0; color: #6b7c93; font-size: 13.5px; line-height: 1.5; }
.vy-badge { display: inline-block; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 800; white-space: nowrap; }
.vy-code { margin-top: 16px; padding: 12px 16px; background: #f4f7fb; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
.vy-code small { font-size: 11px; font-weight: 700; color: #6b7c93; letter-spacing: .08em; text-transform: uppercase; display: block; }
.vy-code b { font-size: 24px; letter-spacing: .12em; }
.vy-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-top: 16px; }
.vy-grid small { display: block; font-size: 11px; font-weight: 700; color: #6b7c93; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 3px; }
.vy-grid b { font-size: 14.5px; }
.vy-msg { margin-top: 16px; padding: 13px 16px; border-radius: 10px; font-size: 14px; line-height: 1.6; }
.vy-msg.info { background: #e8f0fb; color: #2a5fa8; }
.vy-msg.good { background: #e6f4ee; color: #1f7a55; }
.vy-msg.bad { background: #fdecea; color: #b3261e; }
.vy-msg.mute { background: #eef0f3; color: #4b5f7a; }
.vy-link { display: inline-block; margin-top: 12px; padding: 11px 22px; border-radius: 9px; background: #12335f; color: #fff; text-decoration: none; font-weight: 700; font-size: 14px; }
.vy-pay { margin-top: 16px; border: 2px solid #f0dcae; background: #fffaf0; border-radius: 12px; padding: 18px; }
.vy-pay-top { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
.vy-pay small { display: block; font-size: 11px; font-weight: 700; color: #8a6414; letter-spacing: .08em; text-transform: uppercase; }
.vy-pay b { font-size: 26px; color: #12335f; }
.vy-clock { font-size: 16px; font-weight: 800; color: #c0392b; }
.vy-bal { margin-top: 10px; font-size: 14px; color: #4b5f7a; }
.vy-bal b { font-size: 14px; }
.vy-warn { margin: 12px 0 0; font-size: 13.5px; color: #8a6414; line-height: 1.6; }
.vy-warn a { color: #12335f; font-weight: 700; }
.vy-err { margin: 12px 0 0; font-size: 13.5px; color: #c0392b; font-weight: 600; }
.vy-btn { width: 100%; height: 50px; margin-top: 14px; border: none; border-radius: 9px; background: #4a9c7a; color: #fff; font-size: 16px; font-weight: 800; cursor: pointer; font-family: inherit; }
.vy-btn:hover { background: #3f8b6c; }
.vy-btn:disabled { opacity: .5; cursor: default; }
.vy-empty { background: #fff; border: 1px dashed #cdd7e4; border-radius: 14px; padding: 44px 20px; text-align: center; color: #6b7c93; }
`

export default async function MyVisaApplications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=' + encodeURIComponent('/dashboard/visa'))

  await supabase.rpc('expire_stale_visa_applications')

  const { data: appsRaw, error } = await supabase
    .from('visa_applications')
    .select('id, tracking_code, status, applicant_type, fee, total_amount, fee_set_at, paid_at, created_at, departure_date, return_date, staff_remarks, refunded_at, refund_amount, product_id, visa_product_id, visa_type')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
  const apps: any[] = appsRaw || []

  const { data: w } = await supabase.from('wallets').select('balance').eq('id', user.id).maybeSingle()
  const balance = Number(w?.balance || 0)

  const ids = apps.map((a) => a.id)
  const names = new Map<string, string[]>()
  if (ids.length) {
    const { data: px } = await supabase
      .from('visa_applicants')
      .select('application_id, given_name, surname, created_at')
      .in('application_id', ids)
      .order('created_at')
    ;(px || []).forEach((p: any) => {
      const list = names.get(p.application_id) || []
      list.push(`${p.given_name} ${p.surname}`)
      names.set(p.application_id, list)
    })
  }

  const prodIds = Array.from(new Set(apps.map((a) => a.product_id || a.visa_product_id).filter(Boolean)))
  const prodName = new Map<string, string>()
  if (prodIds.length) {
    const { data: pr } = await supabase.from('visa_products').select('id, name').in('id', prodIds)
    ;(pr || []).forEach((p: any) => prodName.set(p.id, p.name))
  }

  return (
    <div className={`vy-page ${montserrat.className}`}>
      <style>{css}</style>

      <div className="vy-hero">
        <div className="vy-hero-in">
          <Link href="/dashboard" className="vy-back">← Back to Dashboard</Link>
          <h1>My Visa Applications</h1>
          <p>Follow each application, and pay the fee once it has been accepted.</p>
        </div>
      </div>

      <div className="vy-wrap">
        {error && (
          <div className="vy-msg bad">Your applications could not be loaded. Please try again, or contact the office.</div>
        )}

        {!error && apps.length === 0 && (
          <div className="vy-empty">
            You have no visa applications yet.
            <div><Link href="/visa-services" className="vy-link">Browse visa services</Link></div>
          </div>
        )}

        {apps.map((a) => {
          const pid = a.product_id || a.visa_product_id
          const title = (pid && prodName.get(pid)) || a.visa_type || 'Visa application'
          const lab = LABEL[a.status] || [a.status, '#eef0f3', '#4b5f7a']
          const people = names.get(a.id) || []
          const fee = Number(a.fee ?? a.total_amount ?? 0)
          const payBy = a.fee_set_at ? new Date(new Date(a.fee_set_at).getTime() + 3 * 86400000).toISOString() : null

          return (
            <div className="vy-card" key={a.id}>
              <div className="vy-top">
                <div>
                  <h2 className="vy-name">{title}</h2>
                  <p className="vy-sub">
                    {a.applicant_type === 'family' ? 'Family application' : 'Individual application'}
                    {people.length ? ` · ${people.join(', ')}` : ''}
                  </p>
                </div>
                <span className="vy-badge" style={{ background: lab[1], color: lab[2] }}>{lab[0]}</span>
              </div>

              {a.tracking_code && (
                <div className="vy-code">
                  <div><small>Tracking code</small><b>{a.tracking_code}</b></div>
                  <span className="vy-sub" style={{ margin: 0 }}>Quote this code when you contact us.</span>
                </div>
              )}

              <div className="vy-grid">
                <div><small>Travel dates</small><b>{day(a.departure_date)} → {day(a.return_date)}</b></div>
                <div><small>{a.status === 'Submitted' ? 'Fee if accepted' : 'Visa fee'}</small><b>{money(fee)}</b></div>
                <div><small>Submitted</small><b>{when(a.created_at)}</b></div>
              </div>

              {(a.status === 'Submitted' || a.status === 'Accepted') && (
                <div className="vy-msg info">
                  Our team is reviewing your documents. We will email you as soon as it is accepted, and you can
                  then pay the fee here.
                </div>
              )}

              {a.status === 'Awaiting Payment' && payBy && (
                <>
                  <div className="vy-msg info">
                    Your application has been accepted. Please pay by <b>{when(payBy)}</b> (Pakistan time), or it will expire.
                  </div>
                  <PayVisa id={a.id} fee={fee} payByIso={payBy} balance={balance} />
                </>
              )}

              {a.status === 'Processing' && (
                <div className="vy-msg good">
                  Payment received{a.paid_at ? ` on ${when(a.paid_at)}` : ''}. Our team is now processing your visa.
                  We will email you when it is approved.
                </div>
              )}

              {a.status === 'Approved' && (
                <div className="vy-msg good">
                  Your visa application is approved. Our team will contact you about the next steps.
                </div>
              )}

              {a.status === 'Rejected' && (
                <div className="vy-msg bad">
                  <b>Your application could not be accepted.</b>
                  {a.staff_remarks ? <><br />Reason: {a.staff_remarks}</> : null}
                  <br />
                  {a.refunded_at
                    ? `The fee of ${money(a.refund_amount)} has been refunded to your wallet.`
                    : a.paid_at
                    ? 'Our team will contact you about the fee you paid.'
                    : 'You have not been charged.'}
                </div>
              )}

              {a.status === 'Expired' && (
                <div className="vy-msg mute">
                  The 3-day payment window closed before the fee was paid, so this application has expired. You have
                  not been charged. You are welcome to apply again.
                  <div><Link href="/visa-services" className="vy-link">Apply again</Link></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

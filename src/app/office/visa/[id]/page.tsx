import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { customerMap, dmy, fmt, officeCss, pkt } from '@/app/office/lib'
import { VisaBadge } from '@/app/office/visa/visaLib'
import VisaActions from './VisaActions'
import IssuedVisaBox from './IssuedVisaBox'

export const dynamic = 'force-dynamic'

function describe(l: any): string {
  const d = l.details || {}
  if (l.action === 'Accepted') return `Fee set to ${fmt(d.fee)}. Customer asked to pay within 3 days.`
  if (l.action === 'Rejected') return `${d.reason || ''}${d.paid ? ' (the fee had been paid)' : ''}`
  if (l.action === 'Approved') return `Tracking code ${d.tracking_code || ''}`
  if (l.action === 'Stage changed') return `${d.from} → ${d.to}${d.emailed ? ' · customer emailed' : ''}`
  if (l.action === 'Visa file uploaded' || l.action === 'Visa file replaced') return `${d.person || ''}${d.file_name ? ' · ' + d.file_name : ''}`
  if (l.action === 'Visa file removed') return `${d.person || ''}`
  if (l.action === 'Refunded') return `${fmt(d.amount)} back to the wallet${d.note ? ' · ' + d.note : ''}`
  if (l.action === 'Paid by customer') return `${fmt(d.amount)} from the wallet`
  return ''
}

function Doc({ url, label }: { url?: string; label: string }) {
  if (!url) return <span className="vd-miss">{label}: none</span>
  return (
    <a className="btn ghost" style={{ padding: '8px 14px', fontSize: 12.5 }} href={url} target="_blank" rel="noreferrer">
      {label}
    </a>
  )
}

export default async function VisaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  await supabase.rpc('expire_stale_visa_applications')

  const { data: a } = await supabase.from('visa_applications').select('*').eq('id', id).maybeSingle()
  if (!a) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = await supabase.from('staff').select('role').eq('id', user!.id).single()
  const isSuper = me?.role === 'Super Admin'

  const { data: apRaw } = await supabase
    .from('visa_applicants')
    .select('*')
    .eq('application_id', id)
    .order('created_at')
  const applicants: any[] = apRaw || []

  const productId = a.product_id || a.visa_product_id
  let productName: string = a.visa_type || 'Visa'
  if (productId) {
    const { data: p } = await supabase.from('visa_products').select('name').eq('id', productId).maybeSingle()
    if (p?.name) productName = p.name
  }

  const cmap = await customerMap(supabase, [a.customer_id])
  const cust = cmap.get(a.customer_id)

  const { data: logRaw } = await supabase
    .from('visa_application_log')
    .select('*')
    .eq('application_id', id)
    .order('created_at', { ascending: false })
  const log: any[] = logRaw || []

  // Documents the customer uploaded
  const allPaths: string[] = []
  if (a.frc_url) allPaths.push(a.frc_url)
  applicants.forEach((p) => {
    if (p.passport_scan_url) allPaths.push(p.passport_scan_url)
    if (p.cnic_url) allPaths.push(p.cnic_url)
    if (p.photo_url) allPaths.push(p.photo_url)
  })
  const paths = Array.from(new Set(allPaths))
  const urls = new Map<string, string>()
  if (paths.length) {
    const { data: signed } = await supabase.storage.from('visa-documents').createSignedUrls(paths, 900)
    ;(signed || []).forEach((s: any) => {
      if (s.signedUrl && s.path) urls.set(s.path, s.signedUrl)
    })
  }
  const url = (p?: string | null) => (p ? urls.get(p) : undefined)

  // Issued visa files staff uploaded
  const { data: issuedRaw } = await supabase
    .from('issued_visa_files')
    .select('applicant_id, file_path, file_name')
    .eq('application_id', id)
  const issued: any[] = issuedRaw || []
  const issuedUrls = new Map<string, string>()
  if (issued.length) {
    const { data: signed } = await supabase.storage
      .from('issued-visas')
      .createSignedUrls(issued.map((f) => f.file_path), 900)
    ;(signed || []).forEach((s: any) => {
      if (s.signedUrl && s.path) issuedUrls.set(s.path, s.signedUrl)
    })
  }
  const issuedBy = new Map<string, { name: string | null; url: string | null }>()
  issued.forEach((f) =>
    issuedBy.set(f.applicant_id, { name: f.file_name || 'visa file', url: issuedUrls.get(f.file_path) || null })
  )
  const missingVisas = applicants.filter((p) => !issuedBy.has(p.id)).length
  const canEditVisas = !!a.paid_at && ['Processing', 'Approved', 'Issued'].includes(a.status)

  const amount = Number(a.fee ?? a.total_amount ?? 0)
  const payBy =
    a.status === 'Awaiting Payment' && a.fee_set_at
      ? pkt(new Date(new Date(a.fee_set_at).getTime() + 3 * 86400000).toISOString())
      : null

  return (
    <div>
      <style>{officeCss}{`
        .vd-card { display: flex; gap: 18px; flex-wrap: wrap; border: 1px solid #e3e9f1; border-radius: 12px; padding: 16px; margin-bottom: 14px; background: #fbfcfe; }
        .vd-photo { width: 96px; height: 120px; border-radius: 10px; overflow: hidden; background: #eef2f7; display: flex; align-items: center; justify-content: center; color: #8a96a8; font-size: 12px; flex-shrink: 0; text-align: center; }
        .vd-photo img { width: 100%; height: 100%; object-fit: cover; }
        .vd-info { flex: 1; min-width: 260px; }
        .vd-info h4 { margin: 0 0 10px; font-size: 16px; color: #12335f; }
        .vd-docs { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; align-items: center; }
        .vd-miss { font-size: 12px; color: #b3261e; font-weight: 700; }
        .vd-issued { margin-top: 14px; padding-top: 12px; border-top: 1px dashed #d5dde8; }
        .vd-issued h5 { margin: 0 0 8px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #6b7c93; }
      `}</style>

      <Link href="/office/visa" style={{ color: '#2f7f7a', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>← All applications</Link>

      <div className="pg-bar" style={{ marginTop: 14, marginBottom: 6 }}>
        <div className="pg-h">
          <h1>{a.tracking_code || 'Application'} <VisaBadge status={a.status} refunded={!!a.refunded_at} /></h1>
          <p>{productName} · {a.applicant_type === 'family' ? 'Family' : 'Individual'} · {applicants.length} person{applicants.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      <VisaActions
        key={a.status + '-' + missingVisas}
        id={id}
        status={a.status}
        hasPaid={!!a.paid_at}
        refunded={!!a.refunded_at}
        isSuper={isSuper}
        fee={amount}
        missingVisas={missingVisas}
      />

      <div className="card">
        <h3>Application details</h3>
        <div className="kv">
          <div><small>Customer</small><b>{cust ? `${cust.out_full_name} (${cust.out_customer_code})` : '—'}</b></div>
          {cust?.out_phone && <div><small>Phone</small><b>{cust.out_phone}</b></div>}
          <div><small>Travel</small><b>{dmy(a.departure_date)} → {dmy(a.return_date)}</b></div>
          <div><small>{a.fee != null ? 'Visa fee' : 'Fee when accepted'}</small><b>{fmt(amount)}</b></div>
          <div><small>Submitted</small><b>{pkt(a.created_at)}</b></div>
          {payBy && <div><small>Customer must pay by</small><b>{payBy}</b></div>}
          {a.paid_at && <div><small>Paid</small><b>{pkt(a.paid_at)}</b></div>}
          {a.accepted_at && <div><small>Accepted</small><b>{pkt(a.accepted_at)}{a.accepted_by_name ? ' by ' + a.accepted_by_name : ''}</b></div>}
          {a.rejected_at && <div><small>Rejected</small><b>{pkt(a.rejected_at)}{a.rejected_by_name ? ' by ' + a.rejected_by_name : ''}</b></div>}
          {a.status === 'Approved' && a.approved_at && <div><small>Approved</small><b>{pkt(a.approved_at)}{a.approved_by_name ? ' by ' + a.approved_by_name : ''}</b></div>}
          {a.status === 'Issued' && a.issued_at && <div><small>Issued</small><b>{pkt(a.issued_at)}{a.issued_by_name ? ' by ' + a.issued_by_name : ''}</b></div>}
          {a.refunded_at && <div><small>Refunded</small><b>{fmt(a.refund_amount)} on {pkt(a.refunded_at)}{a.refunded_by_name ? ' by ' + a.refunded_by_name : ''}</b></div>}
          {a.staff_remarks && <div><small>{a.status === 'Rejected' ? 'Reason for rejection' : 'Staff remarks'}</small><b>{a.staff_remarks}</b></div>}
          {a.notes && <div><small>Customer notes</small><b>{a.notes}</b></div>}
        </div>
        {a.frc_url && (
          <div className="vd-docs">
            <Doc url={url(a.frc_url)} label="Open FRC (family certificate)" />
          </div>
        )}
        <p className="note">Document links work for 15 minutes. Reload the page to get fresh links.</p>
      </div>

      <div className="card">
        <h3>Applicants</h3>
        {applicants.length === 0 && <p className="note">No applicants are recorded for this application.</p>}
        {applicants.map((p, i) => {
          const f = issuedBy.get(p.id)
          return (
            <div className="vd-card" key={p.id}>
              <div className="vd-photo">
                {url(p.photo_url) ? <img src={url(p.photo_url)} alt="" /> : <span>No photo</span>}
              </div>
              <div className="vd-info">
                <h4>{i + 1}. {p.given_name} {p.surname}</h4>
                <div className="kv">
                  <div><small>Gender</small><b>{p.gender || '—'}</b></div>
                  <div><small>Date of birth</small><b>{dmy(p.date_of_birth)}</b></div>
                  <div><small>Passport number</small><b>{p.passport_number || '—'}</b></div>
                  <div><small>Passport expiry</small><b>{dmy(p.passport_expiry_date)}</b></div>
                </div>
                <div className="vd-docs">
                  <Doc url={url(p.passport_scan_url)} label="Passport scan" />
                  <Doc url={url(p.cnic_url)} label="CNIC copy" />
                  <Doc url={url(p.photo_url)} label="Photo" />
                </div>
                <div className="vd-issued no-print">
                  <h5>Issued visa</h5>
                  <IssuedVisaBox
                    applicationId={id}
                    applicantId={p.id}
                    fileName={f ? f.name : null}
                    fileUrl={f ? f.url : null}
                    canEdit={canEditVisas}
                    status={a.status}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <h3>Activity</h3>
        {log.length ? (
          <div className="tw">
            <table className="t">
              <thead><tr><th>When</th><th>Action</th><th>By</th><th>Details</th></tr></thead>
              <tbody>
                {log.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{pkt(l.created_at)}</td>
                    <td>{l.action}</td>
                    <td>{l.done_by_name || (l.action === 'Paid by customer' ? 'Customer' : '—')}</td>
                    <td>{describe(l)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="note">Nothing has been done on this application yet.</p>
        )}
      </div>
    </div>
  )
}

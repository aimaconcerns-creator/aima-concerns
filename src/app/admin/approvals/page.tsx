import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

async function approveCustomer(formData: FormData) {
  'use server'

  const customerId = formData.get('customerId') as string
  const supabase = await createClient()

  await supabase
    .from('csp')
    .update({ approval_status: 'Approved' })
    .eq('id', customerId)

  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
}

async function rejectCustomer(formData: FormData) {
  'use server'

  const customerId = formData.get('customerId') as string
  const supabase = await createClient()

  await supabase
    .from('csp')
    .update({ approval_status: 'Rejected' })
    .eq('id', customerId)

  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
}

export default async function AdminApprovalsPage() {
  const supabase = await createClient()

  const { data: pendingCustomers } = await supabase
    .from('csp')
    .select('*')
    .eq('approval_status', 'Pending')
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: '34px' }}>
      <style>{`
        .approval-card {
          border-radius: 14px; padding: 22px; margin-bottom: 16px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        .ac-top { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px; }
        .ac-name { margin: 0; font-weight: 800; color: #cfe0ea; font-size: 16px; }
        .ac-meta { margin: 4px 0 0; color: #7d93a3; font-size: 13px; }
        .ac-actions { display: flex; gap: 8px; }
        .btn-approve {
          padding: 9px 18px; background: rgba(95, 224, 160, 0.15); color: #5FE0A0;
          border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 700;
        }
        .btn-reject {
          padding: 9px 18px; background: rgba(217, 83, 79, 0.15); color: #ff8f8a;
          border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 700;
        }
        .ac-details {
          margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.08);
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;
          font-size: 13px; color: #a9bccb;
        }
        .ac-details p { margin: 0; }
        .ac-details strong { color: #7d93a3; font-weight: 700; }
      `}</style>

      <h1 style={{ color: '#fff', margin: '0 0 24px', fontSize: '22px', fontWeight: 800 }}>
        Pending Approvals
      </h1>

      {(!pendingCustomers || pendingCustomers.length === 0) && (
        <p style={{ color: '#5a7184' }}>No pending applications right now.</p>
      )}

      {pendingCustomers?.map((c: any) => (
        <div key={c.id} className="approval-card">
          <div className="ac-top">
            <div>
              <p className="ac-name">{c['Full Name:']}</p>
              <p className="ac-meta">{c['Email']} · {c['Phone']}</p>
            </div>
            <div className="ac-actions">
              <form action={approveCustomer}>
                <input type="hidden" name="customerId" value={c.id} />
                <button type="submit" className="btn-approve">Approve</button>
              </form>
              <form action={rejectCustomer}>
                <input type="hidden" name="customerId" value={c.id} />
                <button type="submit" className="btn-reject">Reject</button>
              </form>
            </div>
          </div>

          <div className="ac-details">
            <p><strong>CNIC:</strong> {c['CNIC']}</p>
            <p><strong>DOB:</strong> {c['Date of Birth']}</p>
            <p><strong>Nationality:</strong> {c['Nationality']}</p>
            <p><strong>Gender:</strong> {c['Gender']}</p>
            <p><strong>Address:</strong> {c['Address']}</p>
            <p><strong>Passport No:</strong> {c['Passport No.']}</p>
            <p><strong>Passport Expiry:</strong> {c['Passport Expiry Date']}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
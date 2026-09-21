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
    <div style={{ padding: '30px' }}>
      <h1 style={{ color: '#155263', marginBottom: '20px' }}>Pending Approvals</h1>

      {(!pendingCustomers || pendingCustomers.length === 0) && (
        <p style={{ color: '#888' }}>No pending applications right now.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {pendingCustomers?.map((c: any) => (
          <div
            key={c.id}
            style={{
              backgroundColor: '#fff',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#155263', fontSize: '16px' }}>
                  {c['Full Name:']}
                </p>
                <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
                  {c['Email']} · {c['Phone']}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <form action={approveCustomer}>
                  <input type="hidden" name="customerId" value={c.id} />
                  <button
                    type="submit"
                    style={{
                      padding: '8px 18px',
                      backgroundColor: '#5FAE8C',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  >
                    Approve
                  </button>
                </form>
                <form action={rejectCustomer}>
                  <input type="hidden" name="customerId" value={c.id} />
                  <button
                    type="submit"
                    style={{
                      padding: '8px 18px',
                      backgroundColor: '#d9534f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>

            <div
              style={{
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px solid #eee',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                fontSize: '13px',
                color: '#555',
              }}
            >
              <p style={{ margin: 0 }}><strong>CNIC:</strong> {c['CNIC']}</p>
              <p style={{ margin: 0 }}><strong>DOB:</strong> {c['Date of Birth']}</p>
              <p style={{ margin: 0 }}><strong>Nationality:</strong> {c['Nationality']}</p>
              <p style={{ margin: 0 }}><strong>Gender:</strong> {c['Gender']}</p>
              <p style={{ margin: 0 }}><strong>Address:</strong> {c['Address']}</p>
              <p style={{ margin: 0 }}><strong>Passport No:</strong> {c['Passport No.']}</p>
              <p style={{ margin: 0 }}><strong>Passport Expiry:</strong> {c['Passport Expiry Date']}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
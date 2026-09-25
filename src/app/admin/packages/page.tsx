import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import DeletePackageButton from './DeletePackageButton'

async function toggleHidden(formData: FormData) {
  'use server'

  const id = formData.get('id') as string
  const hide = formData.get('hide') === 'true'

  const supabase = await createClient()
  await supabase
    .from('packages')
    .update({ is_hidden: hide, updated_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/admin/packages')
}

async function deletePackage(formData: FormData) {
  'use server'

  const id = formData.get('id') as string
  const supabase = await createClient()

  // Safety check: never delete a package that has any bookings, even if the
  // button shouldn't have been clickable in that case.
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('package_id', id)

  if (count && count > 0) {
    return
  }

  await supabase.from('packages').delete().eq('id', id)

  revalidatePath('/admin/packages')
}

export default async function AdminPackagesPage() {
  const supabase = await createClient()

  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .order('departure_date', { ascending: true })

  const { data: allBookings } = await supabase
    .from('bookings')
    .select('package_id')

  const bookingCounts = new Map<string, number>()
  for (const b of allBookings ?? []) {
    bookingCounts.set(b.package_id, (bookingCounts.get(b.package_id) ?? 0) + 1)
  }

  const statusColor = (status: string) => {
    if (status === 'Booking Open') return '#5FAE8C'
    if (status === 'Sold Out') return '#d9534f'
    if (status === 'Booking Closed') return '#e0a030'
    return '#888'
  }

  const th = { padding: '12px 15px', color: '#155263' }
  const td = { padding: '12px 15px' }

  return (
    <div style={{ padding: '30px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h1 style={{ color: '#155263', margin: 0 }}>Packages</h1>
        <Link
          href="/admin/packages/new"
          style={{
            padding: '11px 22px',
            backgroundColor: '#5FAE8C',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          + New Package
        </Link>
      </div>

      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          overflow: 'auto',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f3f4', textAlign: 'left' }}>
              <th style={th}>Package</th>
              <th style={th}>Type</th>
              <th style={th}>Departure</th>
              <th style={th}>Price</th>
              <th style={th}>Seats</th>
              <th style={th}>Status</th>
              <th style={th}>Visibility</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!packages || packages.length === 0) && (
              <tr>
                <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                  No packages yet. Click &quot;+ New Package&quot; to create one.
                </td>
              </tr>
            )}

            {packages?.map((p: any) => {
              const bookingCount = bookingCounts.get(p.id) ?? 0
              const canDelete = bookingCount === 0

              return (
                <tr key={p.id} style={{ borderTop: '1px solid #eee', opacity: p.is_hidden ? 0.55 : 1 }}>
                  <td style={{ ...td, fontWeight: 'bold', color: '#155263' }}>
                    {p.name}
                    <div style={{ fontSize: '12px', color: '#888', fontWeight: 'normal' }}>{p.days} days</div>
                  </td>
                  <td style={td}>{p.package_type}</td>
                  <td style={td}>
                    {new Date(p.departure_date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={td}>PKR {Number(p.price).toLocaleString()}</td>
                  <td style={td}>{p.available_seats}</td>
                  <td style={td}>
                    <span style={{ color: statusColor(p.status), fontWeight: 'bold' }}>{p.status}</span>
                  </td>
                  <td style={td}>{p.is_hidden ? 'Hidden' : 'Visible'}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <Link
                        href={`/admin/packages/${p.id}/edit`}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: '#155263',
                          color: '#fff',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '13px',
                        }}
                      >
                        Edit
                      </Link>
                      <form action={toggleHidden}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="hide" value={p.is_hidden ? 'false' : 'true'} />
                        <button
                          type="submit"
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#e8edef',
                            color: '#155263',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          {p.is_hidden ? 'Show' : 'Hide'}
                        </button>
                      </form>
                      {canDelete ? (
                        <DeletePackageButton action={deletePackage} id={p.id} packageName={p.name} />
                      ) : (
                        <span
                          title={`Cannot delete — ${bookingCount} booking(s) exist for this package`}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#f0f0f0',
                            color: '#aaa',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'not-allowed',
                          }}
                        >
                          Delete
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
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
    if (status === 'Booking Open') return '#5FE0A0'
    if (status === 'Sold Out') return '#ff8f8a'
    if (status === 'Booking Closed') return '#e0c060'
    return '#7d93a3'
  }

  return (
    <div style={{ padding: '34px' }}>
      <style>{`
        .pkg-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
        }
        .btn-new {
          padding: 12px 22px; background: #4a9c7a; color: #fff; border-radius: 8px;
          text-decoration: none; font-weight: 700; font-size: 14px;
        }
        .btn-new:hover { background: #3f8b6c; }

        .pkg-table-wrap {
          border-radius: 14px; overflow: auto; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02); box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        table.pkg-table { width: 100%; border-collapse: collapse; min-width: 900px; }
        .pkg-table thead tr { background: rgba(255,255,255,0.03); text-align: left; }
        .pkg-table th {
          padding: 14px 16px; color: #7d93a3; font-size: 12px; text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 700;
        }
        .pkg-table td { padding: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
        .pkg-row-hidden { opacity: 0.5; }
        .pkg-name { font-weight: 800; color: #cfe0ea; font-size: 14px; }
        .pkg-days { font-size: 12px; color: #7d93a3; margin-top: 2px; }
        .cell { color: #a9bccb; font-size: 13.5px; }
        .price-cell { color: #fff; font-weight: 700; font-size: 14px; }

        .actions-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .btn-edit {
          padding: 6px 14px; background: rgba(47, 127, 122, 0.2); color: #6fd0c8;
          border-radius: 6px; text-decoration: none; font-size: 12.5px; font-weight: 700;
        }
        .btn-toggle {
          padding: 6px 14px; border: none; border-radius: 6px; cursor: pointer;
          font-size: 12.5px; font-weight: 700;
        }
        .delete-disabled {
          padding: 6px 14px; background: rgba(255,255,255,0.03); color: #4a5a68;
          border-radius: 6px; font-size: 12.5px; cursor: not-allowed; display: inline-block;
        }
      `}</style>

      <div className="pkg-header">
        <h1 style={{ color: '#fff', margin: 0, fontSize: '22px', fontWeight: 800 }}>
          Packages
        </h1>
        <Link href="/admin/packages/new" className="btn-new">
          + New Package
        </Link>
      </div>

      <div className="pkg-table-wrap">
        <table className="pkg-table">
          <thead>
            <tr>
              <th>Package</th>
              <th>Type</th>
              <th>Departure</th>
              <th>Price</th>
              <th>Seats</th>
              <th>Status</th>
              <th>Visibility</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!packages || packages.length === 0) && (
              <tr>
                <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#5a7184' }}>
                  No packages yet. Click &quot;+ New Package&quot; to create one.
                </td>
              </tr>
            )}

            {packages?.map((p: any) => {
              const bookingCount = bookingCounts.get(p.id) ?? 0
              const canDelete = bookingCount === 0

              return (
                <tr key={p.id} className={p.is_hidden ? 'pkg-row-hidden' : ''}>
                  <td>
                    <div className="pkg-name">{p.name}</div>
                    <div className="pkg-days">{p.days} days</div>
                  </td>
                  <td className="cell">{p.package_type}</td>
                  <td className="cell">
                    {new Date(p.departure_date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="price-cell">PKR {Number(p.price).toLocaleString()}</td>
                  <td className="cell">{p.available_seats}</td>
                  <td>
                    <span style={{ color: statusColor(p.status), fontWeight: 700, fontSize: '13.5px' }}>
                      {p.status}
                    </span>
                  </td>
                  <td className="cell">{p.is_hidden ? 'Hidden' : 'Visible'}</td>
                  <td>
                    <div className="actions-row">
                      <Link href={`/admin/packages/${p.id}/edit`} className="btn-edit">
                        Edit
                      </Link>
                      <form action={toggleHidden}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="hide" value={p.is_hidden ? 'false' : 'true'} />
                        <button
                          type="submit"
                          className="btn-toggle"
                          style={{
                            background: p.is_hidden ? 'rgba(95, 224, 160, 0.18)' : 'rgba(255,255,255,0.06)',
                            color: p.is_hidden ? '#5FE0A0' : '#cfe0ea',
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
                          className="delete-disabled"
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
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

async function addProduct(formData: FormData) {
  'use server'

  const visaType = formData.get('visa_type') as string
  const name = formData.get('name') as string
  const currency = (formData.get('currency') as string) || 'PKR'
  const visaFee = Number(formData.get('visa_fee'))
  const serviceFee = Number(formData.get('service_fee'))
  const roeRaw = Number(formData.get('roe'))

  // ROE is required for USD/SAR, ignored for PKR
  if (currency !== 'PKR' && !(roeRaw > 0)) return
  const roe = currency === 'PKR' ? null : roeRaw

  const supabase = await createClient()
  await supabase.from('visa_products').insert({
    visa_type: visaType,
    name,
    currency,
    roe,
    visa_fee: visaFee,
    service_fee: serviceFee,
  })

  revalidatePath('/admin/visa/products')
}

async function toggleHidden(formData: FormData) {
  'use server'

  const id = formData.get('id') as string
  const hide = formData.get('hide') === 'true'

  const supabase = await createClient()
  await supabase
    .from('visa_products')
    .update({ is_hidden: hide, updated_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/admin/visa/products')
}

export default async function VisaProductsPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('visa_products')
    .select('*')
    .order('created_at', { ascending: false })

  const fmt = (n: number) => Math.round(n).toLocaleString()

  return (
    <div style={{ padding: '34px' }}>
      <style>{`
        .back-link { color: #7d93a3; font-size: 13px; text-decoration: none; }
        .back-link:hover { color: #cfe0ea; }
        .form-card {
          border-radius: 14px; padding: 24px; margin: 20px 0 28px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        .form-card h3 { color: #fff; margin: 0 0 18px; font-size: 16px; font-weight: 800; }
        .field-wrap { flex: 1 1 160px; margin-bottom: 12px; }
        .field-label { color: #7d93a3; font-weight: 700; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; }
        .field-hint { color: #5a7184; font-size: 11px; margin-top: 4px; }
        .field-input {
          width: 100%; padding: 10px; margin-top: 5px; border-radius: 7px; font-size: 13px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); color: #fff;
          box-sizing: border-box;
        }
        .btn-submit {
          padding: 11px 26px; background: #4a9c7a; color: #fff; border: none; border-radius: 7px;
          cursor: pointer; font-weight: 700; margin-top: 6px;
        }
        .prod-table-wrap {
          border-radius: 14px; overflow: auto; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02); box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        table.prod-table { width: 100%; border-collapse: collapse; min-width: 980px; }
        .prod-table thead tr { background: rgba(255,255,255,0.03); text-align: left; }
        .prod-table th {
          padding: 14px 16px; color: #7d93a3; font-size: 12px; text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 700;
        }
        .prod-table td { padding: 16px; border-top: 1px solid rgba(255,255,255,0.06); color: #cfe0ea; font-size: 13.5px; }
        .prod-name { font-weight: 800; color: #cfe0ea; }
        .total-cell { font-weight: 700; color: #fff; }
        .btn-visibility { padding: 6px 14px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; }
      `}</style>

      <Link href="/admin/visa" className="back-link">← Back to Visa Applications</Link>

      <h1 style={{ color: '#fff', margin: '14px 0 0', fontSize: '22px', fontWeight: 800 }}>
        Visa Products
      </h1>

      <div className="form-card">
        <h3>Add New Visa Product</h3>
        <form action={addProduct}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <div className="field-wrap">
              <label className="field-label">Visa Type</label>
              <select name="visa_type" required className="field-input">
                <option value="Iraq/Ziyarat">Iraq / Ziyarat</option>
                <option value="Umrah">Umrah</option>
              </select>
            </div>
            <div className="field-wrap">
              <label className="field-label">Product Name</label>
              <input type="text" name="name" placeholder="e.g. Iraq Ziyarat Visa" required className="field-input" />
            </div>
            <div className="field-wrap">
              <label className="field-label">Currency</label>
              <select name="currency" defaultValue="PKR" className="field-input">
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
                <option value="SAR">SAR</option>
              </select>
            </div>
            <div className="field-wrap">
              <label className="field-label">ROE</label>
              <input type="number" step="0.0001" min="0" name="roe" placeholder="PKR per 1 unit" className="field-input" />
              <div className="field-hint">Required for USD / SAR. Leave blank for PKR.</div>
            </div>
            <div className="field-wrap">
              <label className="field-label">Visa Fee</label>
              <input type="number" step="0.01" min="0" name="visa_fee" required className="field-input" />
            </div>
            <div className="field-wrap">
              <label className="field-label">Service Fee</label>
              <input type="number" step="0.01" min="0" name="service_fee" required className="field-input" />
            </div>
          </div>
          <button type="submit" className="btn-submit">Add Product</button>
        </form>
      </div>

      <div className="prod-table-wrap">
        <table className="prod-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Currency</th>
              <th>ROE</th>
              <th>Visa Fee</th>
              <th>Service Fee</th>
              <th>Total (PKR)</th>
              <th>Visibility</th>
            </tr>
          </thead>
          <tbody>
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#5a7184' }}>
                  No visa products yet. Add one above.
                </td>
              </tr>
            )}
            {products?.map((p: any) => {
              const cur = p.currency || 'PKR'
              const roe = cur === 'PKR' ? 1 : Number(p.roe || 0)
              const totalNative = Number(p.visa_fee) + Number(p.service_fee)
              const totalPkr = totalNative * roe
              return (
                <tr key={p.id}>
                  <td className="prod-name">{p.name}</td>
                  <td>{p.visa_type}</td>
                  <td>{cur}</td>
                  <td>{cur === 'PKR' ? '—' : Number(p.roe)}</td>
                  <td>{cur} {fmt(Number(p.visa_fee))}</td>
                  <td>{cur} {fmt(Number(p.service_fee))}</td>
                  <td className="total-cell">
                    PKR {fmt(totalPkr)}
                    {cur !== 'PKR' && (
                      <div style={{ color: '#7d93a3', fontSize: '11px', fontWeight: 500 }}>
                        ({cur} {fmt(totalNative)})
                      </div>
                    )}
                  </td>
                  <td>
                    <form action={toggleHidden}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="hide" value={p.is_hidden ? 'false' : 'true'} />
                      <button
                        type="submit"
                        className="btn-visibility"
                        style={{
                          background: p.is_hidden ? 'rgba(217, 83, 79, 0.18)' : 'rgba(95, 224, 160, 0.18)',
                          color: p.is_hidden ? '#ff8f8a' : '#5FE0A0',
                        }}
                      >
                        {p.is_hidden ? 'Hidden' : 'Visible'}
                      </button>
                    </form>
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

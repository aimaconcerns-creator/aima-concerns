import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

const INCLUDES = [
  'Air Ticket',
  'Visa',
  'Hotel Accommodation',
  'Meals',
  'Transport',
  'Ziyarat',
]

const STATUSES = ['Booking Open', 'Sold Out', 'Booking Closed', 'Departed']

async function updatePackage(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const id = formData.get('id') as string
  const existingBrochure = (formData.get('existing_brochure') as string) || null

  const name = (formData.get('name') as string).trim()
  const packageType = formData.get('package_type') as string
  const days = Number(formData.get('days'))
  const departureDate = formData.get('departure_date') as string
  const price = Number(formData.get('price'))
  const infantPrice = Number(formData.get('infant_price'))
  const seats = Number(formData.get('available_seats'))
  const details = (formData.get('details') as string) || ''
  const airlineId = formData.get('airline_id') as string
  const includes = formData.getAll('includes').map(String)
  const isHidden = formData.get('is_hidden') === 'on'
  let status = formData.get('status') as string
  const brochure = formData.get('brochure') as File

  // Automatic statuses
  const today = new Date().toISOString().slice(0, 10)
  if (departureDate < today) status = 'Departed'
  else if (seats <= 0) status = 'Sold Out'

  let brochureUrl = existingBrochure

  if (brochure && brochure.size > 0) {
    const ext = brochure.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('package-brochures')
      .upload(fileName, brochure)

    if (uploadError) {
      redirect(`/admin/packages/${id}/edit?error=` + encodeURIComponent('Brochure upload failed: ' + uploadError.message))
    }

    const { data: urlData } = supabase.storage.from('package-brochures').getPublicUrl(fileName)
    brochureUrl = urlData.publicUrl
  }

  const { error } = await supabase
    .from('packages')
    .update({
      package_type: packageType,
      name,
      days,
      departure_date: departureDate,
      price,
      infant_price: infantPrice,
      available_seats: seats,
      details,
      brochure_url: brochureUrl,
      includes,
      status,
      is_hidden: isHidden,
      airline_id: airlineId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    redirect(`/admin/packages/${id}/edit?error=` + encodeURIComponent(error.message))
  }

  revalidatePath('/admin/packages')
  redirect('/admin/packages')
}

export default async function EditPackagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  const { data: pkg } = await supabase.from('packages').select('*').eq('id', id).single()

  if (!pkg) notFound()

  const { data: airlines } = await supabase
    .from('airlines')
    .select('id, name')
    .order('name', { ascending: true })

  const label = { display: 'block', color: '#155263', fontWeight: 'bold' as const, fontSize: '14px', marginBottom: '6px' }
  const input = {
    width: '100%',
    padding: '11px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    boxSizing: 'border-box' as const,
    fontSize: '15px',
    backgroundColor: '#fff',
    color: '#000',
    fontFamily: 'inherit',
  }
  const section = { color: '#155263', fontSize: '16px', margin: '28px 0 14px', paddingBottom: '8px', borderBottom: '1px solid #eee' }

  return (
    <div style={{ padding: '30px', maxWidth: '900px' }}>
      <Link href="/admin/packages" style={{ color: '#155263', fontSize: '14px' }}>
        ← Back to Packages
      </Link>
      <h1 style={{ color: '#155263', margin: '10px 0 20px' }}>Edit Package</h1>

      <form
        action={updatePackage}
        style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          padding: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
        }}
      >
        <input type="hidden" name="id" value={pkg.id} />
        <input type="hidden" name="existing_brochure" value={pkg.brochure_url ?? ''} />

        <h3 style={{ ...section, marginTop: 0 }}>Package Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
          <div>
            <label style={label}>Package Type</label>
            <select name="package_type" required defaultValue={pkg.package_type} style={input}>
              <option value="Umrah">Umrah</option>
              <option value="Ziyarat">Ziyarat</option>
            </select>
          </div>
          <div>
            <label style={label}>Package Name</label>
            <input name="name" type="text" required defaultValue={pkg.name} style={input} />
          </div>
          <div>
            <label style={label}>Number of Days</label>
            <input name="days" type="number" min="1" required defaultValue={pkg.days} style={input} />
          </div>
          <div>
            <label style={label}>Departure Date</label>
            <input name="departure_date" type="date" required defaultValue={pkg.departure_date} style={input} />
          </div>
          <div>
            <label style={label}>Price per person (PKR)</label>
            <input name="price" type="number" min="0" step="0.01" required defaultValue={pkg.price} style={input} />
          </div>
          <div>
            <label style={label}>Infant Price (PKR)</label>
            <input name="infant_price" type="number" min="0" step="0.01" required defaultValue={pkg.infant_price} style={input} />
          </div>
          <div>
            <label style={label}>Available Seats</label>
            <input name="available_seats" type="number" min="0" required defaultValue={pkg.available_seats} style={input} />
          </div>
          <div>
            <label style={label}>Status</label>
            <select name="status" defaultValue={pkg.status} style={input}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '18px' }}>
          <label style={label}>Group Brochure (PDF or image)</label>
          {pkg.brochure_url && (
            <p style={{ margin: '0 0 8px', fontSize: '13px' }}>
              Current brochure:{' '}
              <a href={pkg.brochure_url} target="_blank" rel="noopener noreferrer" style={{ color: '#155263' }}>
                View file
              </a>{' '}
              <span style={{ color: '#888' }}>(choose a new file below only if you want to replace it)</span>
            </p>
          )}
          <input name="brochure" type="file" accept=".pdf,image/*" style={{ display: 'block' }} />
        </div>

        <div style={{ marginTop: '18px' }}>
          <label style={label}>Package Details</label>
          <textarea
            name="details"
            rows={10}
            defaultValue={pkg.details ?? ''}
            style={{ ...input, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        <h3 style={section}>Airline</h3>
        <select name="airline_id" required defaultValue={pkg.airline_id ?? ''} style={input}>
          <option value="" disabled>Select an airline</option>
          {airlines?.map((a: any) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <h3 style={section}>Package Includes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          {INCLUDES.map((item) => (
            <label
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#155263',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <input
                type="checkbox"
                name="includes"
                value={item}
                defaultChecked={(pkg.includes ?? []).includes(item)}
                style={{ width: '18px', height: '18px' }}
              />
              {item}
            </label>
          ))}
        </div>

        <h3 style={section}>Visibility</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#155263', fontSize: '14px', cursor: 'pointer' }}>
          <input type="checkbox" name="is_hidden" defaultChecked={pkg.is_hidden} style={{ width: '18px', height: '18px' }} />
          Hide this package from customers
        </label>

        <p style={{ color: '#888', fontSize: '13px', marginTop: '18px', lineHeight: 1.6 }}>
          Status updates automatically when you save: a past departure date sets Departed, and 0 seats sets Sold Out.
          If you add seats back to a Sold Out package, choose Booking Open in the Status box.
        </p>

        {error && (
          <p style={{ marginTop: '16px', color: '#c0392b', fontSize: '14px' }}>Error: {error}</p>
        )}

        <button
          type="submit"
          style={{
            marginTop: '24px',
            padding: '14px 32px',
            backgroundColor: '#5FAE8C',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '15px',
          }}
        >
          Save Changes
        </button>
      </form>
    </div>
  )
}
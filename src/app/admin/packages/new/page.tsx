import Link from 'next/link'
import { redirect } from 'next/navigation'
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

async function createPackage(formData: FormData) {
  'use server'

  const supabase = await createClient()

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
  let status = formData.get('status') as string
  const brochure = formData.get('brochure') as File

  if (seats <= 0) status = 'Sold Out'

  let brochureUrl: string | null = null

  if (brochure && brochure.size > 0) {
    const ext = brochure.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('package-brochures')
      .upload(fileName, brochure)

    if (uploadError) {
      redirect('/admin/packages/new?error=' + encodeURIComponent('Brochure upload failed: ' + uploadError.message))
    }

    const { data: urlData } = supabase.storage.from('package-brochures').getPublicUrl(fileName)
    brochureUrl = urlData.publicUrl
  }

  const { error } = await supabase.from('packages').insert({
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
    airline_id: airlineId,
  })

  if (error) {
    redirect('/admin/packages/new?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/admin/packages')
  redirect('/admin/packages')
}

export default async function NewPackagePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

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
      <h1 style={{ color: '#155263', margin: '10px 0 20px' }}>Create Package</h1>

      <form
        action={createPackage}
        style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          padding: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
        }}
      >
        <h3 style={{ ...section, marginTop: 0 }}>Package Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
          <div>
            <label style={label}>Package Type</label>
            <select name="package_type" required style={input}>
              <option value="Umrah">Umrah</option>
              <option value="Ziyarat">Ziyarat</option>
            </select>
          </div>
          <div>
            <label style={label}>Package Name</label>
            <input name="name" type="text" required style={input} />
          </div>
          <div>
            <label style={label}>Number of Days</label>
            <input name="days" type="number" min="1" required style={input} />
          </div>
          <div>
            <label style={label}>Departure Date</label>
            <input name="departure_date" type="date" required style={input} />
          </div>
          <div>
            <label style={label}>Price per person (PKR)</label>
            <input name="price" type="number" min="0" step="0.01" required style={input} />
          </div>
          <div>
            <label style={label}>Infant Price (PKR)</label>
            <input name="infant_price" type="number" min="0" step="0.01" required style={input} />
          </div>
          <div>
            <label style={label}>Available Seats</label>
            <input name="available_seats" type="number" min="0" required style={input} />
          </div>
          <div>
            <label style={label}>Status</label>
            <select name="status" defaultValue="Booking Open" style={input}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '18px' }}>
          <label style={label}>Group Brochure (PDF or image)</label>
          <input name="brochure" type="file" accept=".pdf,image/*" style={{ display: 'block' }} />
        </div>

        <div style={{ marginTop: '18px' }}>
          <label style={label}>Package Details</label>
          <textarea
            name="details"
            rows={10}
            placeholder="Write the complete details and description of the package..."
            style={{ ...input, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        <h3 style={section}>Airline</h3>
        <select name="airline_id" required defaultValue="" style={input}>
          <option value="" disabled>Select an airline</option>
          {airlines?.map((a: any) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <p style={{ color: '#888', fontSize: '13px', margin: '8px 0 0' }}>
          The airline name and logo come from your Manage Airlines page.
        </p>

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
              <input type="checkbox" name="includes" value={item} style={{ width: '18px', height: '18px' }} />
              {item}
            </label>
          ))}
        </div>

        {error && (
          <p style={{ marginTop: '20px', color: '#c0392b', fontSize: '14px' }}>Error: {error}</p>
        )}

        <button
          type="submit"
          style={{
            marginTop: '28px',
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
          Create Package
        </button>
      </form>
    </div>
  )
}
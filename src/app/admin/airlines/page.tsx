import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

async function addAirline(formData: FormData) {
  'use server'

  const name = formData.get('name') as string
  const logoFile = formData.get('logo') as File

  const supabase = await createClient()

  let logoUrl = null

  if (logoFile && logoFile.size > 0) {
    const fileExt = logoFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('airline-logos')
      .upload(fileName, logoFile)

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from('airline-logos')
        .getPublicUrl(fileName)
      logoUrl = publicUrlData.publicUrl
    }
  }

  await supabase.from('airlines').insert({
    name,
    logo_url: logoUrl,
  })

  revalidatePath('/admin/airlines')
}

export default async function AdminAirlinesPage() {
  const supabase = await createClient()

  const { data: airlines } = await supabase
    .from('airlines')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ color: '#155263', marginBottom: '20px' }}>Manage Airlines</h1>

      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          maxWidth: '500px',
        }}
      >
        <h3 style={{ color: '#155263', marginTop: 0 }}>Add New Airline</h3>
        <form action={addAirline}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#155263', fontWeight: 'bold', fontSize: '14px' }}>Airline Name</label>
            <input
              type="text"
              name="name"
              required
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#155263', fontWeight: 'bold', fontSize: '14px' }}>Logo Image</label>
            <input
              type="file"
              name="logo"
              accept="image/*"
              style={{ display: 'block', marginTop: '5px' }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#5FAE8C',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Add Airline
          </button>
        </form>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '15px',
        }}
      >
        {airlines?.map((airline) => (
          <div
            key={airline.id}
            style={{
              backgroundColor: '#fff',
              borderRadius: '10px',
              padding: '15px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            }}
          >
            {airline.logo_url ? (
              <img
                src={airline.logo_url}
                alt={airline.name}
                style={{ width: '60px', height: '60px', objectFit: 'contain', margin: '0 auto 10px' }}
              />
            ) : (
              <div style={{ width: '60px', height: '60px', margin: '0 auto 10px', backgroundColor: '#eee', borderRadius: '6px' }} />
            )}
            <p style={{ margin: 0, fontSize: '13px', color: '#155263', fontWeight: 'bold' }}>{airline.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
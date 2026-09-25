'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/client'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export default function ProfilePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [cnic, setCnic] = useState('')
  const [passportNo, setPassportNo] = useState('')
  const [passportExpiry, setPassportExpiry] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      const { data } = await supabase
        .from('csp')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setFullName(data['Full Name:'] || '')
        setDob(data['Date of Birth'] || '')
        setPhone(data['Phone'] || '')
        setCnic(data['CNIC'] || '')
        setPassportNo(data['Passport No.'] || '')
        setPassportExpiry(data['Passport Expiry Date'] || '')
        setPhotoUrl(data['photo_url'] || '')
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

  const formatCnic = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 13)
    let formatted = digits
    if (digits.length > 5 && digits.length <= 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`
    } else if (digits.length > 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
    }
    return formatted
  }

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnic(formatCnic(e.target.value))
  }

  const isValidCnic = (value: string) => /^\d{5}-\d{7}-\d{1}$/.test(value)

  const isAdult = (dobValue: string) => {
    const birthDate = new Date(dobValue)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 18
  }

  const isValidPassportExpiry = (expiryValue: string) => {
    const expiryDate = new Date(expiryValue)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxFutureDate = new Date()
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 15)
    return expiryDate > today && expiryDate <= maxFutureDate
  }

  const handlePhotoPick = () => {
    setPhotoError('')
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be under 5 MB.')
      return
    }

    setPhotoError('')
    setUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/photo-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('customer-photos')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setUploading(false)
      setPhotoError('Upload failed: ' + uploadError.message)
      return
    }

    const { data: urlData } = supabase.storage.from('customer-photos').getPublicUrl(path)
    const newUrl = urlData.publicUrl

    const { error: saveError } = await supabase
      .from('csp')
      .update({ photo_url: newUrl })
      .eq('id', userId)

    setUploading(false)

    if (saveError) {
      setPhotoError('Could not save photo: ' + saveError.message)
      return
    }

    setPhotoUrl(newUrl)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (cnic && !isValidCnic(cnic)) {
      setMessage('Error: CNIC must be in the format 12345-1234567-1')
      return
    }

    if (dob && !isAdult(dob)) {
      setMessage('Error: You must be 18 years or older to register.')
      return
    }

    if (passportExpiry && !isValidPassportExpiry(passportExpiry)) {
      setMessage('Error: Passport expiry date must be a realistic future date (within the next 15 years).')
      return
    }

    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('csp')
      .update({
        'Full Name:': fullName,
        'Date of Birth': dob || null,
        'Phone': phone,
        'CNIC': cnic,
        'Passport No.': passportNo,
        'Passport Expiry Date': passportExpiry || null,
      })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Profile updated successfully!')
    }
  }

  const initial = (fullName || 'U').trim().charAt(0).toUpperCase()

  if (loading) {
    return (
      <div className={montserrat.className} style={{ minHeight: '100vh', backgroundColor: '#f5f7f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#7a8699' }}>Loading your profile...</p>
      </div>
    )
  }

  return (
    <div className={montserrat.className} style={{ minHeight: '100vh', backgroundColor: '#f5f7f8' }}>
      <style>{`
        * { box-sizing: border-box; }
        .pf-in {
          width: 100%; height: 50px; padding: 0 14px; border: 1px solid #d5dde8; border-radius: 8px;
          font-size: 15px; color: #12335f; background: #fff; font-family: inherit; outline: none;
        }
        .pf-in:focus { border-color: #4a9c7a; }
        .pf-label { display: block; color: #12335f; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
      `}</style>

      <div style={{ backgroundColor: '#155263', padding: '20px 30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Link href="/dashboard" style={{ color: '#fff', fontSize: '22px', textDecoration: 'none' }} aria-label="Back to dashboard">
          ←
        </Link>
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>My Profile</span>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '36px 20px 60px' }}>
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '14px',
            padding: '40px',
            boxShadow: '0 8px 30px rgba(18,51,95,0.08)',
          }}
        >
          {/* Photo upload, centered on top */}
          <div style={{ textAlign: 'center', marginBottom: '34px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={handlePhotoPick}
              disabled={uploading}
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '12px',
                border: photoUrl ? '3px solid #4a9c7a' : '2px dashed #b9c6d3',
                backgroundColor: '#f5f8fa',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'default' : 'pointer',
                overflow: 'hidden',
                padding: 0,
                position: 'relative',
              }}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Your passport-size photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <span style={{ fontSize: '34px', color: '#4a9c7a', width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#e3f1ea', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    {initial}
                  </span>
                  <span style={{ fontSize: '13px', color: '#7a8699', fontWeight: 600, padding: '0 10px', textAlign: 'center' }}>
                    Add Photo
                  </span>
                </>
              )}
              {uploading && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#12335f', fontWeight: 600 }}>
                  Uploading...
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={handlePhotoPick}
              disabled={uploading}
              style={{
                display: 'block',
                margin: '14px auto 0',
                background: 'none',
                border: 'none',
                color: '#4a9c7a',
                fontWeight: 700,
                fontSize: '14px',
                cursor: uploading ? 'default' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {photoUrl ? 'Change Passport Size Picture' : 'Upload Passport Size Picture'}
            </button>
            <p style={{ color: '#a0acb8', fontSize: '12px', margin: '6px 0 0' }}>JPG or PNG, up to 5 MB</p>
            {photoError && <p style={{ color: '#c0392b', fontSize: '13px', margin: '8px 0 0' }}>{photoError}</p>}
          </div>

          <h1 style={{ color: '#12335f', fontSize: '24px', fontWeight: 800, margin: '0 0 4px', textAlign: 'center' }}>
            {fullName || 'My Profile'}
          </h1>
          <p style={{ color: '#7a8699', fontSize: '14px', textAlign: 'center', margin: '0 0 32px' }}>
            Keep your personal and passport details up to date.
          </p>

          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
              <div>
                <label className="pf-label">Full Name</label>
                <input className="pf-in" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="pf-label">Date of Birth</label>
                <input className="pf-in" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div>
                <label className="pf-label">Phone</label>
                <input className="pf-in" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="pf-label">CNIC</label>
                <input className="pf-in" type="text" value={cnic} onChange={handleCnicChange} placeholder="12345-1234567-1" maxLength={15} />
              </div>
              <div>
                <label className="pf-label">Passport No.</label>
                <input className="pf-in" type="text" value={passportNo} onChange={(e) => setPassportNo(e.target.value)} />
              </div>
              <div>
                <label className="pf-label">Passport Expiry Date</label>
                <input className="pf-in" type="date" value={passportExpiry} onChange={(e) => setPassportExpiry(e.target.value)} />
              </div>
            </div>

            {message && (
              <p style={{ marginTop: '20px', color: message.startsWith('Error') ? '#c0392b' : '#4a9c7a', fontSize: '14px', fontWeight: 600 }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: '28px',
                width: '100%',
                padding: '15px',
                backgroundColor: '#4a9c7a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: saving ? 'default' : 'pointer',
                fontSize: '16px',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
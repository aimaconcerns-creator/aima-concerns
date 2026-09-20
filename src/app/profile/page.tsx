'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [cnic, setCnic] = useState('')
  const [passportNo, setPassportNo] = useState('')
  const [passportExpiry, setPassportExpiry] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
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

  const isValidCnic = (value: string) => {
    return /^\d{5}-\d{7}-\d{1}$/.test(value)
  }

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

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginTop: '5px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #ccc',
    borderRadius: '6px',
  }

  const labelStyle = { color: '#155263', fontWeight: 'bold' as const }

  if (loading) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
        <p>Loading your profile...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '500px' }}>
      <h1 style={{ color: '#155263' }}>My Profile</h1>
      <form onSubmit={handleSave}>
        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>Date of Birth</label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>CNIC</label>
          <input
            type="text"
            value={cnic}
            onChange={handleCnicChange}
            placeholder="12345-1234567-1"
            maxLength={15}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>Passport No.</label>
          <input
            type="text"
            value={passportNo}
            onChange={(e) => setPassportNo(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Passport Expiry Date</label>
          <input
            type="date"
            value={passportExpiry}
            onChange={(e) => setPassportExpiry(e.target.value)}
            style={inputStyle}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 30px',
            backgroundColor: '#5FAE8C',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
      {message && (
        <p style={{ marginTop: '15px', color: '#155263' }}>{message}</p>
      )}
    </div>
  )
}
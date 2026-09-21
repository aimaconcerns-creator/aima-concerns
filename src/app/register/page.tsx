'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const COUNTRY_CODES = [
  { code: '+92', label: 'Pakistan (+92)' },
  { code: '+964', label: 'Iraq (+964)' },
  { code: '+98', label: 'Iran (+98)' },
  { code: '+966', label: 'Saudi Arabia (+966)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+44', label: 'United Kingdom (+44)' },
  { code: '+1', label: 'USA/Canada (+1)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+90', label: 'Turkey (+90)' },
]

const NATIONALITIES = [
  'Pakistani',
  'Iraqi',
  'Iranian',
  'Saudi Arabian',
  'Emirati',
  'British',
  'American',
  'Canadian',
  'Australian',
  'Turkish',
  'Other',
]

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [countryCode, setCountryCode] = useState('+92')
  const [phone, setPhone] = useState('')
  const [cnic, setCnic] = useState('')
  const [nationality, setNationality] = useState('Pakistani')
  const [gender, setGender] = useState('')
  const [address, setAddress] = useState('')
  const [passportNo, setPassportNo] = useState('')
  const [passportExpiry, setPassportExpiry] = useState('')

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const formatCnic = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 13)
    let formatted = digits
    if (digits.length > 5 && digits.length <= 12) {
      formatted = digits.slice(0, 5) + '-' + digits.slice(5)
    } else if (digits.length > 12) {
      formatted = digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12)
    }
    return formatted
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!isValidCnic(cnic)) {
      setMessage('Error: CNIC must be in the format 12345-1234567-1')
      return
    }
    if (!isAdult(dob)) {
      setMessage('Error: You must be 18 years or older to register.')
      return
    }
    if (!isValidPassportExpiry(passportExpiry)) {
      setMessage('Error: Passport expiry date must be a realistic future date.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          dob: dob,
          phone: countryCode + ' ' + phone,
          cnic: cnic,
          passport_no: passportNo,
          passport_expiry: passportExpiry,
          nationality: nationality,
          gender: gender,
          address: address,
        },
      },
    })

    setLoading(false)

    if (error) {
      setMessage('Error: ' + error.message)
      return
    }

    setSubmitted(true)
  }

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginTop: '5px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #ccc',
    borderRadius: '6px',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = { color: '#155263', fontWeight: 'bold' as const, fontSize: '14px' }

  const fieldWrapStyle = { flex: '1 1 260px', marginBottom: '14px' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7f8', fontFamily: 'sans-serif' }}>
      <div
        style={{
          backgroundImage: 'linear-gradient(rgba(10,20,30,0.75), rgba(10,20,30,0.75)), url(/karbala-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: '#fff', fontSize: '34px', margin: 0, fontWeight: 'bold', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
          Aima Concerns
        </h1>
        <p style={{ color: '#fff', fontSize: '18px', margin: '4px 0 0', fontWeight: 'bold' }}>
          Customer Portal
        </p>
        <p style={{ color: '#5FAE8C', fontSize: '14px', marginTop: '6px', fontStyle: 'italic' }}>
          Your Journey, Our Concern
        </p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px' }}>
        {submitted ? (
          <div
            style={{
              backgroundColor: '#fff',
              padding: '40px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            }}
          >
            <h2 style={{ color: '#155263' }}>Application Submitted</h2>
            <p style={{ color: '#666' }}>
              Thank you for registering with Aima Concerns. Your application is pending approval.
              You will receive an email once your account has been approved and you can log in.
            </p>
            <a href="/" style={{ color: '#155263', fontWeight: 'bold' }}>
              Back to Home
            </a>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#fff',
              padding: '35px',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            }}
          >
            <h2 style={{ color: '#155263', marginBottom: '5px' }}>Create an Account</h2>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '25px' }}>
              Please fill in your details. Full Name and Date of Birth must match your passport exactly.
            </p>

            <form onSubmit={handleRegister}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Full Name (as per passport)</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={inputStyle} />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Date of Birth (as per passport)</label>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required style={inputStyle} />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Phone</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      style={{ ...inputStyle, marginTop: 0, width: '130px', flexShrink: 0 }}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      style={{ ...inputStyle, marginTop: 0 }}
                    />
                  </div>
                </div>

                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>CNIC</label>
                  <input
                    type="text"
                    value={cnic}
                    onChange={(e) => setCnic(formatCnic(e.target.value))}
                    placeholder="12345-1234567-1"
                    maxLength={15}
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Nationality</label>
                  <select value={nationality} onChange={(e) => setNationality(e.target.value)} required style={inputStyle}>
                    {NATIONALITIES.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} required style={inputStyle}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ flex: '1 1 100%', marginBottom: '14px' }}>
                  <label style={labelStyle}>Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required style={inputStyle} />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Passport Number</label>
                  <input type="text" value={passportNo} onChange={(e) => setPassportNo(e.target.value)} required style={inputStyle} />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Passport Expiry Date</label>
                  <input type="date" value={passportExpiry} onChange={(e) => setPassportExpiry(e.target.value)} required style={inputStyle} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#5FAE8C',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
            {message && <p style={{ marginTop: '15px', color: 'red' }}>{message}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
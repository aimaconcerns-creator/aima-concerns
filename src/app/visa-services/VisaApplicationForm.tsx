'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function VisaApplicationForm({
  userId,
  fullName,
  cnic,
  passportNo,
  passportExpiry,
}: {
  userId: string
  fullName: string
  cnic: string
  passportNo: string
  passportExpiry: string
}) {
  const [visaType, setVisaType] = useState('')
  const [notes, setNotes] = useState('')
  const [passportScan, setPassportScan] = useState<File | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [cnicCopy, setCnicCopy] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!visaType) {
      setMessage('Error: Please select a visa type.')
      return
    }
    if (!passportScan || !photo || !cnicCopy) {
      setMessage('Error: Please upload all three required documents.')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    try {
      const timestamp = Date.now()

      const uploadOne = async (file: File, label: string) => {
        const ext = file.name.split('.').pop()
        const path = `${userId}/${label}-${timestamp}.${ext}`
        const { error } = await supabase.storage.from('visa-documents').upload(path, file)
        if (error) throw error
        return path
      }

      const passportScanPath = await uploadOne(passportScan, 'passport-scan')
      const photoPath = await uploadOne(photo, 'photo')
      const cnicCopyPath = await uploadOne(cnicCopy, 'cnic-copy')

      const { error: insertError } = await supabase.from('visa_applications').insert({
        customer_id: userId,
        visa_type: visaType,
        passport_scan_url: passportScanPath,
        photo_url: photoPath,
        cnic_copy_url: cnicCopyPath,
        notes: notes || null,
      })

      if (insertError) throw insertError

      setSubmitted(true)
    } catch (err: any) {
      setMessage('Error: ' + (err?.message || 'Something went wrong. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={checkStyle}>✓</div>
          <h2 style={{ color: '#12335f', margin: '0 0 8px', fontSize: '24px', fontWeight: 800 }}>
            Application Submitted
          </h2>
          <p style={{ color: '#7a8699', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}>
            Our team will review your application and documents. You&apos;ll be notified once it&apos;s
            accepted and a visa fee has been set, which you can then pay from your wallet.
          </p>
          <Link href="/dashboard" style={btnStyle}>Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: '#12335f', margin: '0 0 6px', fontSize: '26px', fontWeight: 800 }}>
          Visa Application
        </h1>
        <p style={{ color: '#7a8699', fontSize: '14px', margin: '0 0 28px' }}>
          Submit your visa application and documents below. Our team will review it and let you know
          the next steps.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Visa Type</label>
          <select value={visaType} onChange={(e) => setVisaType(e.target.value)} required style={inputStyle}>
            <option value="">Select visa type</option>
            <option value="Umrah">Umrah Visa</option>
            <option value="Iraq/Ziyarat">Iraq / Ziyarat Visa</option>
          </select>

          <div style={profileBoxStyle}>
            <p style={{ margin: '0 0 8px', color: '#12335f', fontWeight: 700, fontSize: '14px' }}>
              Your details on file
            </p>
            <p style={profileRowStyle}><span>Full Name</span><b>{fullName || '—'}</b></p>
            <p style={profileRowStyle}><span>CNIC</span><b>{cnic || '—'}</b></p>
            <p style={profileRowStyle}><span>Passport No.</span><b>{passportNo || '—'}</b></p>
            <p style={profileRowStyle}><span>Passport Expiry</span><b>{passportExpiry || '—'}</b></p>
            <p style={{ margin: '10px 0 0', color: '#8a96a8', fontSize: '12.5px' }}>
              Need to update any of this? Visit <Link href="/profile" style={{ color: '#4a9c7a' }}>My Profile</Link> first.
            </p>
          </div>

          <label style={labelStyle}>Passport Scan</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setPassportScan(e.target.files?.[0] || null)}
            required
            style={fileInputStyle}
          />

          <label style={labelStyle}>Passport-Size Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            required
            style={fileInputStyle}
          />

          <label style={labelStyle}>CNIC Copy</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setCnicCopy(e.target.files?.[0] || null)}
            required
            style={fileInputStyle}
          />

          <label style={labelStyle}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any special requests or information for our team"
            style={{ ...inputStyle, resize: 'vertical' as const }}
          />

          <button type="submit" disabled={submitting} style={{ ...btnStyle, border: 'none', cursor: 'pointer', width: '100%', marginTop: '10px' }}>
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>

        {message && (
          <p style={{ marginTop: '16px', color: message.startsWith('Error') ? '#c0392b' : '#12335f', fontSize: '14px' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

const wrapStyle = { padding: '50px 5%', display: 'flex', justifyContent: 'center' }
const cardStyle = {
  width: '100%', maxWidth: '560px', background: '#fff', borderRadius: '14px',
  padding: '40px', boxShadow: '0 10px 40px rgba(18, 51, 95, 0.1)', textAlign: 'center' as const,
}
const checkStyle = {
  width: '60px', height: '60px', borderRadius: '50%', background: '#eafaf3', color: '#4a9c7a',
  fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
}
const labelStyle = {
  display: 'block', textAlign: 'left' as const, color: '#12335f', fontWeight: 700,
  fontSize: '13px', margin: '18px 0 6px',
}
const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #d5dde8',
  fontSize: '14px', color: '#12335f', fontFamily: 'inherit', boxSizing: 'border-box' as const,
}
const fileInputStyle = { ...inputStyle, padding: '10px 14px' }
const profileBoxStyle = {
  textAlign: 'left' as const, background: '#f5f7f8', borderRadius: '10px', padding: '16px', margin: '18px 0',
}
const profileRowStyle = {
  display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: '13.5px', color: '#5c6b7a',
}
const btnStyle = {
  display: 'inline-block', padding: '14px 24px', background: '#4a9c7a', color: '#fff',
  borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '15px',
}
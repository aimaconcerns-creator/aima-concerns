'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

type Applicant = {
  given_name: string
  surname: string
  gender: string
  date_of_birth: string
  passport_number: string
  passport_expiry_date: string
  passport_file: File | null
  cnic_file: File | null
  photo_file: File | null
}

type Product = {
  id: string
  name: string
  visa_type: string
  visaFee: number
  serviceFee: number
  perPerson: number
}

const MAX_FAMILY = 7
const MAX_FILE_MB = 10
const MIN_FILE_KB = 80
const MIN_IMAGE_SIDE = 1000
const MIN_PHOTO_SIDE = 600

const emptyApplicant = (): Applicant => ({
  given_name: '',
  surname: '',
  gender: '',
  date_of_birth: '',
  passport_number: '',
  passport_expiry_date: '',
  passport_file: null,
  cnic_file: null,
  photo_file: null,
})

const ageOf = (dob: string) => {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const t = new Date()
  let a = t.getFullYear() - d.getFullYear()
  const m = t.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--
  return a
}

// Returns an error message, or '' if the file looks acceptable.
const checkScan = (file: File, label: string): Promise<string> =>
  new Promise((resolve) => {
    const okType = file.type === 'application/pdf' || file.type.startsWith('image/')
    if (!okType) return resolve(`${label}: please upload a PDF or an image (JPG/PNG).`)
    if (file.size > MAX_FILE_MB * 1024 * 1024) return resolve(`${label}: file must be smaller than ${MAX_FILE_MB} MB.`)
    if (file.size < MIN_FILE_KB * 1024) {
      return resolve(`${label}: file is too small and likely low quality. Please upload a clear, full-resolution scan.`)
    }
    if (file.type === 'application/pdf') return resolve('')

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      if (Math.max(img.width, img.height) < MIN_IMAGE_SIDE) {
        resolve(`${label}: image resolution is too low. Please upload a higher quality scan.`)
      } else resolve('')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(`${label}: this image could not be read. Please try another file.`)
    }
    img.src = url
  })

// The passport-size photo must be a JPG or PNG image, not a PDF.
const checkPhoto = (file: File): Promise<string> =>
  new Promise((resolve) => {
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      return resolve('Photo: please upload a JPG or PNG image (not a PDF).')
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) return resolve(`Photo: file must be smaller than ${MAX_FILE_MB} MB.`)

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      if (Math.max(img.width, img.height) < MIN_PHOTO_SIDE) {
        resolve('Photo: image resolution is too low. Please upload a clearer, larger photo.')
      } else resolve('')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve('Photo: this image could not be read. Please try another file.')
    }
    img.src = url
  })

export default function ApplyForm({ userId, product }: { userId: string; product: Product }) {
  const [type, setType] = useState<'' | 'individual' | 'family'>('')
  const [applicants, setApplicants] = useState<Applicant[]>([emptyApplicant()])
  const [departure, setDeparture] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [frc, setFrc] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [clearConfirm, setClearConfirm] = useState(false)
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<number | null>(null)
  const [trackingCode, setTrackingCode] = useState('')
  const [copied, setCopied] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const count = applicants.length
  const total = product.perPerson * count

  const chooseType = (t: 'individual' | 'family') => {
    setType(t)
    setMessage('')
    if (t === 'individual') setApplicants((prev) => [prev[0] || emptyApplicant()])
    else setApplicants((prev) => (prev.length >= 2 ? prev : [...prev, emptyApplicant()]))
  }

  const update = (i: number, field: keyof Applicant, value: string) =>
    setApplicants((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)))

  const pickFile = async (i: number, field: 'passport_file' | 'cnic_file' | 'photo_file', file: File | null) => {
    const key = `${i}-${field}`
    if (!file) {
      setApplicants((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: null } : p)))
      setFileErrors((e) => ({ ...e, [key]: '' }))
      return
    }
    const err =
      field === 'photo_file'
        ? await checkPhoto(file)
        : await checkScan(file, field === 'passport_file' ? 'Passport scan' : 'CNIC copy')
    setFileErrors((e) => ({ ...e, [key]: err }))
    setApplicants((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: err ? null : file } : p)))
  }

  const addMember = () => {
    if (applicants.length >= MAX_FAMILY) return
    setApplicants((prev) => [...prev, emptyApplicant()])
  }

  const removeMember = (i: number) => {
    setApplicants((prev) => prev.filter((_, idx) => idx !== i))
    setFileErrors({})
  }

  let ruleProblem = ''
  if (type === 'individual') {
    const a = applicants[0]
    const age = ageOf(a.date_of_birth)
    if (a.gender && age !== null) {
      if (a.gender === 'Female' && age < 40) {
        ruleProblem = 'Female applicants applying individually must be 40 years or older.'
      } else if (a.gender === 'Male' && age < 50) {
        ruleProblem = 'Male applicants applying individually must be 50 years or older.'
      }
    }
  } else if (type === 'family') {
    if (count < 2) ruleProblem = 'A family application needs at least 2 members.'
    else if (count > MAX_FAMILY) ruleProblem = `A family can have a maximum of ${MAX_FAMILY} members.`
  }
  if (!ruleProblem && departure && returnDate && returnDate <= departure) {
    ruleProblem = 'Return date must be after the departure date.'
  }

  const uploadOne = async (supabase: ReturnType<typeof createClient>, file: File, label: string) => {
    const ext = (file.name.split('.').pop() || 'pdf').toLowerCase()
    const path = `${userId}/${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage.from('visa-documents').upload(path, file)
    if (error) throw error
    return path
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!type) return setMessage('Please choose Individual or Family.')
    if (ruleProblem) return setMessage(ruleProblem)
    if (!departure || !returnDate) return setMessage('Please enter your departure date and return date.')
    if (departure < today) return setMessage('Departure date cannot be in the past.')

    for (let i = 0; i < applicants.length; i++) {
      const who = type === 'family' ? `Member ${i + 1}` : 'Applicant'
      if (!applicants[i].passport_file) return setMessage(`${who}: passport scan is required.`)
      if (!applicants[i].cnic_file) return setMessage(`${who}: CNIC copy is required.`)
      if (!applicants[i].photo_file) return setMessage(`${who}: passport-size photo is required.`)
    }
    if (Object.values(fileErrors).some(Boolean)) return setMessage('Please fix the file problems shown above.')

    if (type === 'family') {
      if (!frc) return setMessage('FRC upload is required for family applications.')
      const err = await checkScan(frc, 'FRC')
      if (err) return setMessage(err)
    }
    if (!clearConfirm) {
      return setMessage('Please confirm that your passport scans are clear and show every detail.')
    }

    setLoading(true)
    const supabase = createClient()

    try {
      let frcPath: string | null = null
      if (type === 'family' && frc) frcPath = await uploadOne(supabase, frc, 'frc')

      const payload = []
      for (const a of applicants) {
        const passport_scan_path = await uploadOne(supabase, a.passport_file as File, 'passport')
        const cnic_path = await uploadOne(supabase, a.cnic_file as File, 'cnic')
        const photo_path = await uploadOne(supabase, a.photo_file as File, 'photo')
        payload.push({
          given_name: a.given_name,
          surname: a.surname,
          gender: a.gender,
          date_of_birth: a.date_of_birth,
          passport_number: a.passport_number,
          passport_expiry_date: a.passport_expiry_date,
          passport_scan_path,
          cnic_path,
          photo_path,
        })
      }

      const { data: code, error } = await supabase.rpc('create_visa_application', {
        p_product_id: product.id,
        p_applicant_type: type,
        p_frc_path: frcPath,
        p_applicants: payload,
        p_departure_date: departure,
        p_return_date: returnDate,
        p_notes: notes.trim() || null,
      })
      if (error) throw error

      setTrackingCode(typeof code === 'string' ? code : '')
      setDone(total)
    } catch (err: any) {
      setMessage(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <style>{`
        .va-hero {
          background: linear-gradient(135deg, #0d3b47 0%, #2f7f7a 40%, #5FAE8C 70%, #f0a860 100%);
          border-bottom: 3px solid #d9a441; color: #fff; padding: 36px 5% 40px;
        }
        .va-hero-in { max-width: 1100px; margin: 0 auto; }
        .va-back { color: #f3d9a4; text-decoration: none; font-size: 14px; font-weight: 600; }
        .va-hero h1 { margin: 14px 0 0; font-size: clamp(26px, 4vw, 38px); font-weight: 800; }
        .va-hero p { margin: 8px 0 0; opacity: .95; }

        .va-wrap { max-width: 1100px; margin: 32px auto 0; padding: 0 20px; display: grid; grid-template-columns: 1fr 320px; gap: 26px; align-items: start; }
        .va-box { background: #fff; border-radius: 12px; padding: 26px; box-shadow: 0 8px 30px rgba(18,51,95,0.08); margin-bottom: 22px; }
        .va-box h2 { margin: 0 0 6px; color: #12335f; font-size: 19px; font-weight: 800; }
        .va-sub { color: #7a8699; font-size: 13.5px; margin: 0 0 16px; }
        .va-ph { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .va-ph h2 { margin: 0; }
        .va-rm { background: none; border: none; color: #d9534f; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }

        .va-types { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .va-type {
          text-align: left; padding: 18px; border-radius: 12px; border: 2px solid #d5dde8; background: #fff;
          cursor: pointer; font-family: inherit; transition: border-color .15s, background .15s;
        }
        .va-type:hover { border-color: #4a9c7a; }
        .va-type.on { border-color: #4a9c7a; background: #f3faf6; }
        .va-type b { display: block; color: #12335f; font-size: 16px; margin-bottom: 4px; }
        .va-type span { color: #7a8699; font-size: 12.5px; line-height: 1.5; }

        .va-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; }
        .va-box label { display: block; color: #12335f; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
        .va-in {
          width: 100%; height: 48px; padding: 0 12px; border: 1px solid #d5dde8; border-radius: 8px;
          font-size: 15px; color: #12335f; background: #fff; font-family: inherit; outline: none;
        }
        textarea.va-in { height: auto; padding: 12px; resize: vertical; }
        .va-in:focus { border-color: #4a9c7a; }
        .va-file { padding: 10px 12px; height: auto; }
        .va-ferr { color: #c0392b; font-size: 12.5px; margin: 6px 0 0; line-height: 1.4; }
        .va-fok { color: #3f8b6c; font-size: 12.5px; margin: 6px 0 0; }

        .va-docs { margin-top: 18px; padding-top: 18px; border-top: 1px solid #eef2f5; }
        .va-tips { background: #fffaf0; border: 1px solid #f0dcae; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; color: #6b5420; font-size: 13px; line-height: 1.6; }
        .va-tips b { color: #12335f; }
        .va-tips ul { margin: 6px 0 0; padding-left: 18px; }

        .va-add {
          width: 100%; padding: 14px; border: 2px dashed #4a9c7a; background: #f3faf6; color: #3f8b6c;
          border-radius: 10px; font-weight: 700; font-size: 15px; cursor: pointer; font-family: inherit; margin-bottom: 22px;
        }
        .va-add:disabled { opacity: .5; cursor: default; }
        .va-check { display: flex; gap: 10px; align-items: flex-start; cursor: pointer; font-size: 14px; color: #12335f; line-height: 1.5; }
        .va-check input { width: 18px; height: 18px; margin-top: 2px; accent-color: #4a9c7a; flex-shrink: 0; }

        .va-side { position: sticky; top: 90px; }
        .va-line { display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid #eef2f5; color: #3c4a5c; font-size: 14px; }
        .va-line b { color: #12335f; }
        .va-total { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 2px solid #12335f; margin-top: 6px; }
        .va-total span { color: #12335f; font-weight: 700; }
        .va-total b { color: #12335f; font-size: 26px; font-weight: 800; }
        .va-btn {
          width: 100%; height: 54px; margin-top: 18px; border: none; border-radius: 8px; background: #4a9c7a;
          color: #fff; font-size: 16px; font-weight: 800; cursor: pointer; font-family: inherit;
        }
        .va-btn:hover { background: #3f8b6c; }
        .va-btn:disabled { opacity: .6; cursor: default; }
        .va-warn { background: #fff4f2; color: #c0392b; border: 1px solid #f3c9c3; border-radius: 8px; padding: 12px 14px; font-size: 14px; line-height: 1.5; margin-top: 14px; }
        .va-note { color: #7a8699; font-size: 12px; text-align: center; margin: 12px 0 0; line-height: 1.5; }

        .va-done { max-width: 560px; margin: 50px auto 0; padding: 0 20px; }
        .va-done .va-box { text-align: center; padding: 40px 30px; }
        .va-tick { width: 70px; height: 70px; border-radius: 50%; background: #e3f1ea; color: #4a9c7a; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; font-size: 32px; }
        .va-link { display: inline-block; margin-top: 10px; padding: 13px 26px; border-radius: 8px; background: #12335f; color: #fff; text-decoration: none; font-weight: 700; }

        @media (max-width: 860px) {
          .va-wrap { grid-template-columns: 1fr; }
          .va-side { position: static; order: -1; }
          .va-types { grid-template-columns: 1fr; }
        }
      `}</style>

      {done !== null ? (
        <div className="va-done">
          <div className="va-box">
            <div className="va-tick">✓</div>
            <h2 style={{ color: '#12335f', margin: 0, fontSize: 24 }}>Application Submitted</h2>
            <p style={{ color: '#7a8699', lineHeight: 1.7, margin: '14px 0 6px' }}>
              Your <b style={{ color: '#12335f' }}>{product.name}</b> application has been received.
              Our team will review your documents.
            </p>
            <p style={{ color: '#12335f', fontSize: 30, fontWeight: 800, margin: '6px 0 16px' }}>
              PKR {Math.round(done).toLocaleString()}
            </p>
            {trackingCode && (
              <div style={{ background: '#f3faf6', border: '2px dashed #4a9c7a', borderRadius: 12, padding: '16px 18px', margin: '0 0 18px' }}>
                <div style={{ color: '#7a8699', fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  Your Tracking Code
                </div>
                <div style={{ color: '#12335f', fontSize: 34, fontWeight: 800, letterSpacing: '.12em', margin: '6px 0 10px' }}>
                  {trackingCode}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(trackingCode)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  style={{ background: '#12335f', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {copied ? 'Copied ✓' : 'Copy Code'}
                </button>
                <p style={{ color: '#7a8699', fontSize: 12.5, margin: '10px 0 0', lineHeight: 1.5 }}>
                  Keep this code. Quote it whenever you contact us about this application.
                </p>
              </div>
            )}
            <Link href="/dashboard" className="va-link">Go to Dashboard</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="va-hero">
            <div className="va-hero-in">
              <Link href={`/visa-services/${product.id}`} className="va-back">← Back to visa</Link>
              <h1>Apply: {product.name}</h1>
              <p>{product.visa_type} visa application</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="va-wrap">
            <div>
              <div className="va-box">
                <h2>Who is applying?</h2>
                <p className="va-sub">Choose how you want to apply.</p>
                <div className="va-types">
                  <button type="button" className={`va-type ${type === 'individual' ? 'on' : ''}`} onClick={() => chooseType('individual')}>
                    <b>Individual</b>
                    <span>One applicant. Females must be 40+, males must be 50+.</span>
                  </button>
                  <button type="button" className={`va-type ${type === 'family' ? 'on' : ''}`} onClick={() => chooseType('family')}>
                    <b>Family</b>
                    <span>2 to {MAX_FAMILY} members applying together. FRC required.</span>
                  </button>
                </div>
              </div>

              {type && (
                <>
                  <div className="va-box">
                    <h2>Travel dates</h2>
                    <p className="va-sub">When do you plan to travel?</p>
                    <div className="va-grid">
                      <div>
                        <label>Departure Date</label>
                        <input className="va-in" type="date" min={today} value={departure} onChange={(e) => setDeparture(e.target.value)} required />
                      </div>
                      <div>
                        <label>Return Date</label>
                        <input className="va-in" type="date" min={departure || today} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required />
                      </div>
                    </div>
                  </div>

                  {applicants.map((p, i) => (
                    <div key={i} className="va-box">
                      <div className="va-ph">
                        <h2>{type === 'family' ? `Member ${i + 1}` : 'Applicant details'}</h2>
                        {type === 'family' && applicants.length > 2 && (
                          <button type="button" className="va-rm" onClick={() => removeMember(i)}>Remove</button>
                        )}
                      </div>

                      <div className="va-grid">
                        <div>
                          <label>Given Name</label>
                          <input className="va-in" type="text" value={p.given_name} onChange={(e) => update(i, 'given_name', e.target.value)} required />
                        </div>
                        <div>
                          <label>Surname</label>
                          <input className="va-in" type="text" value={p.surname} onChange={(e) => update(i, 'surname', e.target.value)} required />
                        </div>
                        <div>
                          <label>Gender</label>
                          <select className="va-in" value={p.gender} onChange={(e) => update(i, 'gender', e.target.value)} required>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        <div>
                          <label>Date of Birth</label>
                          <input className="va-in" type="date" max={today} value={p.date_of_birth} onChange={(e) => update(i, 'date_of_birth', e.target.value)} required />
                        </div>
                        <div>
                          <label>Passport Number</label>
                          <input className="va-in" type="text" value={p.passport_number} onChange={(e) => update(i, 'passport_number', e.target.value)} required />
                        </div>
                        <div>
                          <label>Passport Expiry Date</label>
                          <input className="va-in" type="date" min={today} value={p.passport_expiry_date} onChange={(e) => update(i, 'passport_expiry_date', e.target.value)} required />
                        </div>
                      </div>

                      <div className="va-docs">
                        <div className="va-tips">
                          <b>Passport scan must be clear.</b> Every detail on the data page must be readable:
                          <ul>
                            <li>Scan the whole page. Nothing cut off at the edges.</li>
                            <li>Photo, name, number, dates and the two lines at the bottom must be sharp.</li>
                            <li>No blur, glare, shadows or fingers over the page.</li>
                          </ul>
                          <p style={{ margin: '10px 0 0' }}>
                            <b>Passport-size photo:</b> a recent photo with a plain background and the face clearly
                            visible. No hat or sunglasses. JPG or PNG only.
                          </p>
                        </div>

                        <div className="va-grid">
                          <div>
                            <label>Passport Scan *</label>
                            <input
                              className="va-in va-file"
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => pickFile(i, 'passport_file', e.target.files?.[0] || null)}
                            />
                            {fileErrors[`${i}-passport_file`] && <p className="va-ferr">{fileErrors[`${i}-passport_file`]}</p>}
                            {p.passport_file && !fileErrors[`${i}-passport_file`] && <p className="va-fok">✓ {p.passport_file.name}</p>}
                          </div>
                          <div>
                            <label>CNIC Copy *</label>
                            <input
                              className="va-in va-file"
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => pickFile(i, 'cnic_file', e.target.files?.[0] || null)}
                            />
                            {fileErrors[`${i}-cnic_file`] && <p className="va-ferr">{fileErrors[`${i}-cnic_file`]}</p>}
                            {p.cnic_file && !fileErrors[`${i}-cnic_file`] && <p className="va-fok">✓ {p.cnic_file.name}</p>}
                          </div>
                          <div>
                            <label>Passport-size Photo *</label>
                            <input
                              className="va-in va-file"
                              type="file"
                              accept="image/jpeg,image/png"
                              onChange={(e) => pickFile(i, 'photo_file', e.target.files?.[0] || null)}
                            />
                            {fileErrors[`${i}-photo_file`] && <p className="va-ferr">{fileErrors[`${i}-photo_file`]}</p>}
                            {p.photo_file && !fileErrors[`${i}-photo_file`] && <p className="va-fok">✓ {p.photo_file.name}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {type === 'family' && (
                    <button type="button" className="va-add" onClick={addMember} disabled={applicants.length >= MAX_FAMILY}>
                      {applicants.length >= MAX_FAMILY ? `Maximum ${MAX_FAMILY} family members` : '+ Add another member'}
                    </button>
                  )}

                  {type === 'family' && (
                    <div className="va-box">
                      <h2>FRC (Family Registration Certificate) *</h2>
                      <p className="va-sub">
                        Required for family applications. PDF or image, max {MAX_FILE_MB} MB.
                      </p>
                      <input
                        className="va-in va-file"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setFrc(e.target.files?.[0] || null)}
                      />
                      {frc && <p className="va-fok">✓ {frc.name}</p>}
                    </div>
                  )}

                  <div className="va-box">
                    <label className="va-check">
                      <input type="checkbox" checked={clearConfirm} onChange={(e) => setClearConfirm(e.target.checked)} />
                      <span>
                        I confirm every passport scan is clear and complete, with every detail visible and
                        readable. I understand unclear scans may delay or reject my application.
                      </span>
                    </label>

                    <label style={{ marginTop: 20 }}>Notes (optional)</label>
                    <textarea
                      className="va-in"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anything our team should know"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="va-side">
              <div className="va-box" style={{ marginBottom: 0 }}>
                <h2 style={{ marginBottom: 12 }}>Summary</h2>
                <div className="va-line"><span>Visa Fee</span><b>PKR {Math.round(product.visaFee).toLocaleString()}</b></div>
                <div className="va-line"><span>Service Fee</span><b>PKR {Math.round(product.serviceFee).toLocaleString()}</b></div>
                <div className="va-line"><span>Per person</span><b>PKR {Math.round(product.perPerson).toLocaleString()}</b></div>
                <div className="va-line"><span>Applicants</span><b>{type ? count : '—'}</b></div>
                {departure && returnDate && (
                  <div className="va-line"><span>Travel</span><b>{departure} → {returnDate}</b></div>
                )}

                <div className="va-total">
                  <span>Total</span>
                  <b>PKR {Math.round(type ? total : product.perPerson).toLocaleString()}</b>
                </div>

                {ruleProblem && <div className="va-warn">{ruleProblem}</div>}
                {message && !ruleProblem && <div className="va-warn">{message}</div>}

                <button type="submit" className="va-btn" disabled={loading || !type || !!ruleProblem}>
                  {loading ? 'Uploading & submitting...' : 'Submit Application'}
                </button>
                <p className="va-note">
                  Our team will review your documents and contact you with the next steps.
                </p>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  )
}

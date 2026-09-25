'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/client'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

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
  const [showPassword, setShowPassword] = useState(false)
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

  return (
    <div className={`wrap ${montserrat.className}`}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .wrap { min-height: 100vh; background: #f8fafc; }

        .banner {
          background: linear-gradient(135deg, #0d3b47 0%, #2f7f7a 40%, #5FAE8C 70%, #f0a860 100%);
          border-bottom: 3px solid #d9a441; color: #fff; text-align: center; padding: 40px 20px 100px;
        }
        .banner h1 { margin: 10px 0 0; font-size: clamp(28px, 4vw, 48px); font-weight: 800; letter-spacing: 2px; line-height: 1.1; }
        .sub { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 12px; }
        .sub .line { height: 1px; width: 50px; background: #f3d9a4; }
        .sub span { letter-spacing: 0.4em; font-size: clamp(12px, 1.6vw, 18px); font-weight: 500; }
        .tagline { margin-top: 16px; letter-spacing: 0.25em; font-size: clamp(11px, 1.3vw, 15px); }
        .badge {
          display: inline-block; margin-top: 18px; padding: 7px 20px; border: 2px solid #fff; border-radius: 4px;
          letter-spacing: 0.3em; font-size: 12px; font-weight: 700;
        }

        .container { max-width: 900px; margin: -60px auto 40px; padding: 0 20px; position: relative; z-index: 2; }
        .card { background: #fff; border-radius: 10px; padding: 40px 44px; box-shadow: 0 10px 40px rgba(18, 51, 95, 0.1); }
        .card h2 { margin: 0; color: #12335f; font-size: 30px; font-weight: 800; }
        .note { color: #7a8699; font-size: 14px; line-height: 1.6; margin: 10px 0 0; }

        .sec {
          color: #4a9c7a; font-size: 13px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
          margin: 30px 0 16px; padding-bottom: 8px; border-bottom: 1px solid #e6edf3;
        }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 18px; }
        .full { grid-column: 1 / -1; }
        label { display: block; color: #12335f; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
        .inp {
          width: 100%; height: 52px; padding: 0 14px; border: 1px solid #d5dde8; border-radius: 8px;
          font-size: 15px; color: #12335f; background: #fff; font-family: inherit; outline: none;
        }
        .inp:focus { border-color: #4a9c7a; }
        .inp::placeholder { color: #8a96a8; }
        .phone { display: flex; gap: 8px; }
        .phone select.inp { width: 165px; flex-shrink: 0; }
        .pwrap { position: relative; }
        .pwrap .inp { padding-right: 48px; }
        .eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 0; display: flex; }

        .btn {
          width: 100%; height: 56px; margin-top: 30px; border: none; border-radius: 8px; background: #4a9c7a; color: #fff;
          font-size: 17px; font-weight: 700; font-family: inherit; cursor: pointer;
        }
        .btn:hover { background: #3f8b6c; }
        .btn:disabled { opacity: 0.7; cursor: default; }
        .err { margin: 16px 0 0; color: #c0392b; font-size: 14px; line-height: 1.5; }
        .loginlink { text-align: center; margin: 22px 0 0; color: #7a8699; font-size: 14px; }
        .loginlink a { color: #4a9c7a; font-weight: 700; text-decoration: none; }
        .back { display: block; text-align: center; margin-top: 12px; color: #8a96a8; font-size: 13px; text-decoration: none; }
        .back:hover { color: #12335f; }

        .done { text-align: center; padding: 50px 40px; }
        .done .tick {
          width: 70px; height: 70px; border-radius: 50%; background: #e3f1ea; color: #4a9c7a;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
        }
        .done p { color: #7a8699; line-height: 1.7; margin: 14px auto 24px; max-width: 520px; }
        .done a { color: #4a9c7a; font-weight: 700; text-decoration: none; }

        @media (max-width: 600px) {
          .card { padding: 30px 22px; }
          .phone { flex-direction: column; }
          .phone select.inp { width: 100%; }
        }
      `}</style>

      <div className="banner">
        <Image src="/logo.png" alt="Aima Concerns" width={64} height={64} style={{ objectFit: 'contain', margin: '0 auto' }} />
        <h1>AIMA CONCERNS</h1>
        <div className="sub">
          <div className="line" />
          <span>TRAVEL &amp; TOURS</span>
          <div className="line" />
        </div>
        <div className="tagline">Your Journey, Our Concerns</div>
        <div className="badge">CUSTOMER PORTAL</div>
      </div>

      <div className="container">
        {submitted ? (
          <div className="card done">
            <div className="tick">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5 9-10" />
              </svg>
            </div>
            <h2>Application Submitted</h2>
            <p>
              Thank you for registering with Aima Concerns. Your application is pending approval.
              You will receive an email once your account has been approved and you can log in.
            </p>
            <Link href="/">← Back to Home</Link>
          </div>
        ) : (
          <div className="card">
            <h2>Create an Account</h2>
            <p className="note">
              Please fill in your details. Full Name and Date of Birth must match your passport exactly.
            </p>

            <form onSubmit={handleRegister}>
              <div className="sec">Personal Details</div>
              <div className="grid">
                <div>
                  <label>Full Name (as per passport)</label>
                  <input className="inp" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <label>Date of Birth (as per passport)</label>
                  <input className="inp" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                </div>
                <div>
                  <label>Gender</label>
                  <select className="inp" value={gender} onChange={(e) => setGender(e.target.value)} required>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label>Nationality</label>
                  <select className="inp" value={nationality} onChange={(e) => setNationality(e.target.value)} required>
                    {NATIONALITIES.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>CNIC</label>
                  <input
                    className="inp"
                    type="text"
                    value={cnic}
                    onChange={(e) => setCnic(formatCnic(e.target.value))}
                    placeholder="12345-1234567-1"
                    maxLength={15}
                    required
                  />
                </div>
              </div>

              <div className="sec">Contact</div>
              <div className="grid">
                <div>
                  <label>Phone</label>
                  <div className="phone">
                    <select className="inp" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    <input className="inp" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label>Address</label>
                  <input className="inp" type="text" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </div>
              </div>

              <div className="sec">Passport</div>
              <div className="grid">
                <div>
                  <label>Passport Number</label>
                  <input className="inp" type="text" value={passportNo} onChange={(e) => setPassportNo(e.target.value)} required />
                </div>
                <div>
                  <label>Passport Expiry Date</label>
                  <input className="inp" type="date" value={passportExpiry} onChange={(e) => setPassportExpiry(e.target.value)} required />
                </div>
              </div>

              <div className="sec">Account</div>
              <div className="grid">
                <div>
                  <label>Email</label>
                  <input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label>Password</label>
                  <div className="pwrap">
                    <input
                      className="inp"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button type="button" className="eye" onClick={() => setShowPassword(!showPassword)} aria-label="Show or hide password">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7a8699" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        {showPassword ? (
                          <>
                            <path d="M3 3l18 18" />
                            <path d="M10.6 6.1A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.9M6.6 7.6A17 17 0 0 0 2.5 12S6 18 12 18a9.7 9.7 0 0 0 4.1-.9" />
                          </>
                        ) : (
                          <>
                            <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>

            {message && <p className="err">{message}</p>}

            <p className="loginlink">
              Already have an account? <Link href="/login">Login</Link>
            </p>
            <Link href="/" className="back">← Back to home</Link>
          </div>
        )}
      </div>
    </div>
  )
}
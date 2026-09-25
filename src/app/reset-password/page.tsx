'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/client'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Supabase sends the customer here with a temporary session already
    // active from the reset link. We just wait a moment for it to be ready.
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true)
      } else {
        setMessage('Error: This reset link is invalid or has expired. Please request a new one.')
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (password.length < 6) {
      setMessage('Error: Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Error: Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setMessage('Error: ' + error.message)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <div className={`wrap ${montserrat.className}`}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .wrap {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: #f8fafc; padding: 30px;
        }
        .card {
          width: 100%; max-width: 440px; background: #fff; border-radius: 10px;
          padding: 40px 44px; box-shadow: 0 10px 40px rgba(18, 51, 95, 0.1); text-align: center;
        }
        .card h2 { margin: 10px 0 0; color: #12335f; font-size: 28px; font-weight: 800; }
        .card .desc { color: #7a8699; font-size: 15px; line-height: 1.6; margin: 12px 0 28px; }
        .field {
          display: flex; align-items: center; gap: 12px; height: 56px; padding: 0 16px; text-align: left;
          border: 1px solid #d5dde8; border-radius: 8px; background: #fff; margin-bottom: 18px;
        }
        .field:focus-within { border-color: #4a9c7a; }
        .field input { flex: 1; border: none; outline: none; font-size: 16px; color: #12335f; background: transparent; font-family: inherit; min-width: 0; }
        .field input::placeholder { color: #8a96a8; }
        .eye { background: none; border: none; cursor: pointer; padding: 0; display: flex; }
        .btn {
          width: 100%; height: 56px; margin-top: 6px; border: none; border-radius: 8px; background: #4a9c7a; color: #fff;
          font-size: 17px; font-weight: 700; font-family: inherit; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .btn:hover { background: #3f8b6c; }
        .btn:disabled { opacity: 0.7; cursor: default; }
        .msg { margin: 16px 0 0; font-size: 14px; line-height: 1.5; }
        .msg.err { color: #c0392b; }
        .msg.info { color: #12335f; }
        .back { display: inline-block; margin-top: 20px; color: #8a96a8; font-size: 13px; text-decoration: none; }
        .back:hover { color: #12335f; }
      `}</style>

      <div className="card">
        <Image src="/logo.png" alt="Aima Concerns" width={64} height={64} style={{ objectFit: 'contain', margin: '0 auto' }} />
        <h2>Reset Password</h2>

        {done ? (
          <p className="desc">Your password has been updated. Redirecting you to login...</p>
        ) : !ready ? (
          <>
            <p className="desc">{message || 'Verifying your reset link...'}</p>
            {message && <Link href="/forgot-password" className="back">← Request a new reset link</Link>}
          </>
        ) : (
          <>
            <p className="desc">Enter your new password below.</p>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7a8699" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="eye" onClick={() => setShowPassword(!showPassword)} aria-label="Show or hide password">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7a8699" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

              <div className="field">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7a8699" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            {message && <p className="msg err">{message}</p>}
          </>
        )}
      </div>
    </div>
  )
}
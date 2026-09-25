'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/client'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      setMessage('Error: ' + error.message)
      return
    }

    setSent(true)
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
        <h2>Forgot Password</h2>

        {sent ? (
          <>
            <p className="desc">
              If an account exists with that email, we&apos;ve sent a password reset link. Please check your inbox
              (and spam folder).
            </p>
            <Link href="/login" className="back">← Back to login</Link>
          </>
        ) : (
          <>
            <p className="desc">Enter the email address linked to your account and we&apos;ll send you a reset link.</p>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7a8699" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            {message && <p className={`msg ${message.startsWith('Error') ? 'err' : 'info'}`}>{message}</p>}

            <Link href="/login" className="back">← Back to login</Link>
          </>
        )}
      </div>
    </div>
  )
}
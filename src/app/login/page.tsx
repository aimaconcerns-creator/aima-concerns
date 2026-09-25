'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/client'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoading(false)
      setMessage('Error: ' + error.message)
      return
    }

    const userId = data.user?.id

    if (userId) {
      const { data: profile } = await supabase
        .from('csp')
        .select('approval_status')
        .eq('id', userId)
        .single()

      if (profile?.approval_status === 'Pending') {
        await supabase.auth.signOut()
        setLoading(false)
        setMessage('Your application is still pending approval. Please wait for an email confirmation before logging in.')
        return
      }

      if (profile?.approval_status === 'Rejected') {
        await supabase.auth.signOut()
        setLoading(false)
        setMessage('Your application was not approved. Please contact Aima Concerns for more information.')
        return
      }
    }

    setLoading(false)

    // Go back to the page the customer came from (e.g. a package), if it is a path on this site
    const next = new URLSearchParams(window.location.search).get('next')
    const safeNext =
      next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/dashboard'
    router.push(safeNext)
  }

  return (
    <div className={`wrap ${montserrat.className}`}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .wrap { min-height: 100vh; position: relative; overflow: hidden; background: #f8fafc; }

        /* Right gradient panel with diagonal edge (mirror of admin login) */
        .gold, .panel { position: absolute; top: 0; right: 0; bottom: 0; width: 53%; }
        .gold { background: #d9a441; clip-path: polygon(0 0, 100% 0, 100% 100%, 25% 100%); }
        .panel {
          clip-path: polygon(3px 0, 100% 0, 100% 100%, calc(25% + 3px) 100%);
          background: linear-gradient(180deg, #0d3b47 0%, #2f7f7a 40%, #5FAE8C 70%, #f0a860 100%);
        }
        .brand {
          position: absolute; top: 0; right: 0; width: 44%; padding-top: 17vh;
          text-align: center; color: #fff; z-index: 2;
        }
        .brand h1 { margin: 0; font-size: clamp(30px, 4vw, 58px); font-weight: 800; letter-spacing: 2px; line-height: 1.1; }
        .sub { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 14px; }
        .sub .line { height: 1px; width: 12%; background: #f3d9a4; }
        .sub span { letter-spacing: 0.4em; font-size: clamp(12px, 1.6vw, 22px); font-weight: 500; }
        .tagline { margin-top: 26px; letter-spacing: 0.25em; font-size: clamp(11px, 1.3vw, 18px); font-weight: 400; }
        .est { margin-top: 12px; letter-spacing: 0.35em; font-size: clamp(11px, 1.1vw, 15px); color: #f3d9a4; font-weight: 600; }
        .badge {
          display: inline-block; margin-top: 26px; padding: 8px 22px; border: 2px solid #fff; border-radius: 4px;
          letter-spacing: 0.3em; font-size: clamp(11px, 1.1vw, 14px); font-weight: 700;
        }

        /* Left side */
        .left {
          position: relative; z-index: 2; width: 53%; min-height: 100vh; display: flex;
          align-items: center; justify-content: center; padding: 30px;
        }
        .circle1 { position: absolute; top: -140px; left: -140px; width: 380px; height: 380px; border-radius: 50%; background: #e3f1ea; opacity: 0.9; }
        .circle2 { position: absolute; bottom: -180px; left: -100px; width: 420px; height: 420px; border-radius: 50%; background: #e3f1ea; opacity: 0.7; }
        .card {
          position: relative; z-index: 2; width: 100%; max-width: 460px; background: #fff;
          border-radius: 10px; padding: 40px 44px; box-shadow: 0 10px 40px rgba(18, 51, 95, 0.1); text-align: center;
        }
        .card h2 { margin: 10px 0 0; color: #12335f; font-size: 32px; font-weight: 800; }
        .card .desc { color: #7a8699; font-size: 15px; line-height: 1.6; margin: 12px 0 28px; }
        .field {
          display: flex; align-items: center; gap: 12px; height: 56px; padding: 0 16px; text-align: left;
          border: 1px solid #d5dde8; border-radius: 8px; background: #fff; margin-bottom: 18px;
        }
        .field:focus-within { border-color: #4a9c7a; }
        .field input { flex: 1; border: none; outline: none; font-size: 16px; color: #12335f; background: transparent; font-family: inherit; min-width: 0; }
        .field input::placeholder { color: #8a96a8; }
        .eye { background: none; border: none; cursor: pointer; padding: 0; display: flex; }
        .forgot { display: block; text-align: right; margin: -8px 0 18px; font-size: 14px; color: #4a9c7a; text-decoration: none; font-weight: 600; }
        .forgot:hover { text-decoration: underline; }
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
        .signup { margin: 24px 0 0; color: #7a8699; font-size: 14px; }
        .signup a { color: #4a9c7a; font-weight: 700; text-decoration: none; }
        .back { display: inline-block; margin-top: 14px; color: #8a96a8; font-size: 13px; text-decoration: none; }
        .back:hover { color: #12335f; }

        @media (max-width: 800px) {
          .gold, .panel { width: 100%; height: 250px; bottom: auto; left: 0; }
          .gold { clip-path: none; }
          .panel { clip-path: none; border-bottom: 3px solid #d9a441; }
          .brand { width: 100%; padding-top: 34px; }
          .badge { margin-top: 14px; }
          .tagline { margin-top: 14px; }
          .left { width: 100%; padding-top: 280px; align-items: flex-start; }
          .card { padding: 32px 24px; }
          .circle1, .circle2 { display: none; }
        }
      `}</style>

      <div className="gold" />
      <div className="panel" />
      <div className="brand">
        <h1>AIMA CONCERNS</h1>
        <div className="sub">
          <div className="line" />
          <span>TRAVEL &amp; TOURS</span>
          <div className="line" />
        </div>
        <div className="tagline">Your Journey, Our Concerns</div>
        <div className="est">EST. 1999</div>
        <div className="badge">CUSTOMER PORTAL</div>
      </div>

      <div className="left">
        <div className="circle1" />
        <div className="circle2" />
        <div className="card">
          <Image src="/logo.png" alt="Aima Concerns" width={64} height={64} style={{ objectFit: 'contain', margin: '0 auto' }} />
          <h2>Customer Login</h2>
          <p className="desc">Welcome back! Please sign in to your account.</p>

          <form onSubmit={handleLogin}>
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

            <div className="field">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7a8699" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
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

            <Link href="/forgot-password" className="forgot">Forgot password?</Link>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
              {!loading && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </form>

          {message && <p className={`msg ${message.startsWith('Error') ? 'err' : 'info'}`}>{message}</p>}

          <p className="signup">
            New customer? <Link href="/register">Sign up</Link>
          </p>
          <Link href="/" className="back">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
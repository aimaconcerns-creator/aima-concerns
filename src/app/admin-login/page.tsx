'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/client'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export default function AdminLoginPage() {
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setLoading(false)
      setMessage('Error: ' + error.message)
      return
    }

    const userId = data.user?.id

    if (userId) {
      const { data: staff } = await supabase
        .from('staff')
        .select('*')
        .eq('id', userId)
        .single()

      if (!staff) {
        await supabase.auth.signOut()
        setLoading(false)
        setMessage('This account does not have admin access.')
        return
      }
    }

    setLoading(false)
    router.push('/admin')
  }

  return (
    <div className={`wrap ${montserrat.className}`}>
      <style>{`
        * { box-sizing: border-box; }
        .wrap { min-height: 100vh; position: relative; overflow: hidden; background: #f8fafc; }

        /* Left photo panel with diagonal edge */
        .gold, .photo { position: absolute; top: 0; left: 0; bottom: 0; width: 53%; }
        .gold { background: #d9a441; clip-path: polygon(0 0, 100% 0, 75% 100%, 0 100%); }
        .photo {
          clip-path: polygon(0 0, calc(100% - 3px) 0, calc(75% - 3px) 100%, 0 100%);
          background:
    
            linear-gradient(180deg, #1b4a7a 0%, #3d76a8 35%, #f0a860 68%, #2a3f66 100%);
        }
        .brand {
          position: absolute; top: 0; left: 0; width: 44%; padding-top: 17vh;
          text-align: center; color: #fff; z-index: 2;
        }
        .brand h1 { margin: 0; font-size: clamp(30px, 4vw, 58px); font-weight: 700; letter-spacing: 2px; line-height: 1.1; }
        .sub { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 14px; }
        .sub .line { height: 1px; width: 12%; background: #d9a441; }
        .sub span { letter-spacing: 0.4em; font-size: clamp(12px, 1.6vw, 22px); font-weight: 500; }
        .tagline { margin-top: 26px; letter-spacing: 0.25em; font-size: clamp(11px, 1.3vw, 18px); font-weight: 400; }
        .est { margin-top: 12px; letter-spacing: 0.35em; font-size: clamp(11px, 1.1vw, 15px); color: #f3d9a4; font-weight: 600; }

        /* Right side */
        .right { position: relative; margin-left: 47%; width: 53%; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 30px; }
        .circle1 { position: absolute; top: -140px; right: -140px; width: 380px; height: 380px; border-radius: 50%; background: #e4eef7; opacity: 0.8; }
        .circle2 { position: absolute; bottom: -180px; right: -100px; width: 420px; height: 420px; border-radius: 50%; background: #e4eef7; opacity: 0.7; }
        .card {
          position: relative; z-index: 2; width: 100%; max-width: 460px; background: #fff;
          border-radius: 10px; padding: 48px 44px; box-shadow: 0 10px 40px rgba(18, 51, 95, 0.1);
        }
        .card h2 { margin: 0; text-align: center; color: #12335f; font-size: 34px; font-weight: 700; }
        .card .desc { text-align: center; color: #7a8699; font-size: 15px; line-height: 1.6; margin: 14px 0 32px; }
        .field {
          display: flex; align-items: center; gap: 12px; height: 56px; padding: 0 16px;
          border: 1px solid #d5dde8; border-radius: 8px; background: #fff; margin-bottom: 20px;
        }
        .field:focus-within { border-color: #12335f; }
        .field input { flex: 1; border: none; outline: none; font-size: 16px; color: #12335f; background: transparent; font-family: inherit; }
        .field input::placeholder { color: #8a96a8; }
        .eye { background: none; border: none; cursor: pointer; padding: 0; display: flex; }
        .btn {
          width: 100%; height: 56px; margin-top: 8px; border: none; border-radius: 8px; background: #12335f; color: #fff;
          font-size: 17px; font-weight: 600; font-family: inherit; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .btn:disabled { opacity: 0.7; cursor: default; }
        .error { margin: 16px 0 0; color: #c0392b; font-size: 14px; text-align: center; }

        /* Phones and small screens: stack the panels */
        @media (max-width: 800px) {
          .gold, .photo { width: 100%; height: 260px; bottom: auto; }
          .gold { clip-path: none; }
          .photo { clip-path: none; border-bottom: 3px solid #d9a441; }
          .brand { width: 100%; padding-top: 50px; }
          .right { margin-left: 0; width: 100%; padding-top: 290px; align-items: flex-start; }
          .card { padding: 36px 26px; }
          .circle1, .circle2 { display: none; }
        }
      `}</style>

      <div className="gold" />
      <div className="photo" />
      <div className="brand">
        <h1>AIMA CONCERNS</h1>
        <div className="sub">
          <div className="line" />
          <span>TRAVEL &amp; TOURS</span>
          <div className="line" />
        </div>
        <div className="tagline">Your Journey, Our Concerns</div>
        <div className="est">EST. 1999</div>
      </div>

      <div className="right">
        <div className="circle1" />
        <div className="circle2" />
        <div className="card">
          <h2>Admin Login</h2>
          <p className="desc">
            Please enter your credentials to access
            <br />
            the admin panel.
          </p>

          <form onSubmit={handleLogin}>
            <div className="field">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7a8699" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7z" />
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

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
              {!loading && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </form>

          {message && <p className="error">{message}</p>}
        </div>
      </div>
    </div>
  )
}
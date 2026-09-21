'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    router.push('/')
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

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundImage:
          'linear-gradient(rgba(10,20,30,0.75), rgba(10,20,30,0.75)), url(/karbala-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif',
        padding: '20px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <Image
          src="/logo.png"
          alt="Aima Concerns"
          width={90}
          height={90}
          style={{ margin: '0 auto 10px', objectFit: 'contain' }}
        />
        <h1
          style={{
            color: '#fff',
            fontSize: '28px',
            fontWeight: 'bold',
            margin: 0,
            textShadow: '0 2px 6px rgba(0,0,0,0.6)',
          }}
        >
          Aima Concerns
        </h1>
        <p
          style={{
            color: '#5FAE8C',
            fontSize: '16px',
            fontWeight: 'bold',
            marginTop: '4px',
            letterSpacing: '1px',
          }}
        >
          CUSTOMER PORTAL
        </p>
      </div>

      <div
        style={{
          backgroundColor: '#fff',
          padding: '35px',
          borderRadius: '10px',
          maxWidth: '380px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        }}
      >
        <h2 style={{ color: '#155263', fontSize: '20px', marginBottom: '20px' }}>
          Login to Your Account
        </h2>
        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#155263', fontWeight: 'bold' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#155263', fontWeight: 'bold' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#5FAE8C',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '15px',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {message && (
          <p style={{ marginTop: '15px', color: '#155263', fontSize: '14px' }}>{message}</p>
        )}
      </div>
    </div>
  )
}
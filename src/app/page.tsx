import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
        textAlign: 'center',
      }}
    >
      <Image
        src="/logo.png"
        alt="Aima Concerns"
        width={110}
        height={110}
        style={{ margin: '0 auto 15px', objectFit: 'contain' }}
      />
      <h1
        style={{
          color: '#fff',
          fontSize: '34px',
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
          fontSize: '18px',
          fontWeight: 'bold',
          marginTop: '6px',
          letterSpacing: '1px',
          marginBottom: '30px',
        }}
      >
        CUSTOMER PORTAL
      </p>

      {user ? (
        <div>
          <p style={{ color: '#fff', marginBottom: '15px' }}>
            Welcome back, {user.email}
          </p>
          <Link
            href="/dashboard"
            style={{
              padding: '12px 30px',
              backgroundColor: '#5FAE8C',
              color: '#fff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link
            href="/login"
            style={{
              padding: '12px 30px',
              backgroundColor: '#5FAE8C',
              color: '#fff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            Login
          </Link>
          <Link
            href="/register"
            style={{
              padding: '12px 30px',
              backgroundColor: '#fff',
              color: '#155263',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            Register
          </Link>
        </div>
      )}
    </div>
  )
}
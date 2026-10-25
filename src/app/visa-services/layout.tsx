import Image from 'next/image'
import Link from 'next/link'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/server'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Umrah Packages', href: '/packages/umrah' },
  { label: 'Ziyarat Packages', href: '/packages/ziyarat' },
  { label: 'Airline Tickets', href: '/tickets' },
  { label: 'Visa Services', href: '/visa-services' },
  { label: 'About Us', href: '/about' },
]

export default async function PackagesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let displayName: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('csp')
      .select('"Full Name:"')
      .eq('id', user.id)
      .single()
    displayName = (profile as any)?.['Full Name:'] || user.email || null
  }

  return (
    <div className={montserrat.className} style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .pk-top {
          background: #0d1b2a; padding: 14px 5%; display: flex; justify-content: space-between;
          align-items: center; flex-wrap: wrap; gap: 12px; position: sticky; top: 0; z-index: 20;
        }
        .pk-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .pk-logo { color: #fff; font-weight: 800; font-size: 20px; letter-spacing: 1.5px; text-transform: uppercase; line-height: 1.1; }
        .pk-logo small { display: block; font-size: 10px; letter-spacing: 4px; font-weight: 600; color: #d9a441; }
        .pk-menu { display: flex; gap: 24px; list-style: none; margin: 0; padding: 0; flex-wrap: wrap; }
        .pk-menu a { color: #dce6f0; text-decoration: none; font-size: 14px; font-weight: 500; }
        .pk-menu a:hover { color: #d9a441; }
        .pk-auth { display: flex; align-items: center; gap: 12px; }
        .pk-login { border: 2px solid #fff; color: #fff; padding: 8px 18px; border-radius: 6px; font-weight: 700; font-size: 13px; text-decoration: none; }
        .pk-signup { background: #d9a441; color: #12335f; padding: 10px 18px; border-radius: 6px; font-weight: 700; font-size: 13px; text-decoration: none; }
        .pk-user { display: flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; font-size: 14px; font-weight: 600; }
        .pk-avatar { width: 34px; height: 34px; border-radius: 50%; background: #5FAE8C; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .pk-foot { background: #0d1b2a; color: #a9c3da; text-align: center; padding: 24px 5%; font-size: 13px; margin-top: 60px; }
        @media (max-width: 900px) { .pk-menu { display: none; } }
      `}</style>

      <div className="pk-top">
        <Link href="/" className="pk-brand">
          <Image src="/logo.png" alt="Aima Concerns" width={42} height={42} style={{ objectFit: 'contain' }} />
          <div className="pk-logo">
            Aima Concerns
            <small>EST. 1999</small>
          </div>
        </Link>

        <ul className="pk-menu">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
        </ul>

        <div className="pk-auth">
          {user ? (
            <Link href="/dashboard" className="pk-user">
              <span className="pk-avatar">{(displayName || 'U').charAt(0).toUpperCase()}</span>
              {displayName}
            </Link>
          ) : (
            <>
              <Link href="/login" className="pk-login">Login</Link>
              <Link href="/register" className="pk-signup">Sign up</Link>
            </>
          )}
        </div>
      </div>

      {children}

      <div className="pk-foot">© {new Date().getFullYear()} Aima Concerns. All rights reserved.</div>
    </div>
  )
}
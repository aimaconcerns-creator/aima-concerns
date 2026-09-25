'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/client'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Umrah Packages', href: '/packages/umrah' },
  { label: 'Ziyarat Packages', href: '/packages/ziyarat' },
  { label: 'Airline Tickets', href: '/tickets' },
  { label: 'Visa Services', href: '/visa-services' },
  { label: 'About Us', href: '/about' },
]

export default function SiteHeader() {
  const router = useRouter()
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null)
      if (data.user) {
        const { data: profile } = await supabase
          .from('csp')
          .select('"Full Name:"')
          .eq('id', data.user.id)
          .single()
        setDisplayName(profile?.['Full Name:'] || data.user.email || null)
      }
      setChecked(true)
    })
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <style>{`
        body { margin: 0; }
        .topbar, .topbar * , .mobilemenu, .mobilemenu * { box-sizing: border-box; }

        .topbar {
          background: #0d1b2a; padding: 14px 5%; display: flex; justify-content: space-between;
          align-items: center; position: sticky; top: 0; z-index: 20; flex-wrap: wrap; gap: 12px;
        }
        .brand { display: flex; align-items: center; gap: 12px; }
        .logo { color: #fff; font-weight: 800; font-size: 20px; letter-spacing: 1.5px; text-transform: uppercase; line-height: 1.1; }
        .logo small { display: block; font-size: 10px; letter-spacing: 4px; font-weight: 600; color: #d9a441; }

        .menu { display: flex; gap: 26px; list-style: none; margin: 0; padding: 0; }
        .menu a { color: #dce6f0; text-decoration: none; font-size: 14px; font-weight: 500; }
        .menu a:hover { color: #d9a441; }

        .authbtns { display: flex; align-items: center; gap: 12px; }
        .loginbtn { border: 2px solid #fff; color: #fff; padding: 9px 20px; border-radius: 6px; font-weight: 700; font-size: 13px; text-decoration: none; }
        .signupbtn { background: #d9a441; color: #12335f; padding: 11px 20px; border-radius: 6px; font-weight: 700; font-size: 13px; text-decoration: none; }

        .usermenu { position: relative; }
        .userbtn { display: flex; align-items: center; gap: 10px; color: #fff; background: none; border: none; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .avatar { width: 34px; height: 34px; border-radius: 50%; background: #5FAE8C; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
        .caret { font-size: 10px; margin-left: 2px; }
        .dropdown {
          position: absolute; top: calc(100% + 12px); right: 0; background: #fff; border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2); min-width: 170px; overflow: hidden; z-index: 30;
        }
        .dropdown a, .dropdown button {
          display: block; width: 100%; text-align: left; padding: 12px 16px; color: #12335f;
          text-decoration: none; font-size: 14px; font-weight: 500; background: none; border: none;
          cursor: pointer; font-family: inherit;
        }
        .dropdown a:hover, .dropdown button:hover { background: #f5f7f8; }
        .dropdown .logout { color: #c0392b; border-top: 1px solid #eee; }

        .burger { display: none; background: none; border: none; color: #fff; font-size: 26px; cursor: pointer; }

        @media (max-width: 900px) {
          .menu { display: none; }
          .burger { display: block; }
        }

        .mobilemenu { background: #0d1b2a; padding: 10px 5% 20px; }
        .mobilemenu a { display: block; color: #dce6f0; text-decoration: none; padding: 10px 0; font-size: 15px; border-top: 1px solid rgba(255,255,255,0.08); }
      `}</style>

      <div className={`topbar ${montserrat.className}`}>
        <div className="brand">
          <Image src="/logo.png" alt="Aima Concerns" width={42} height={42} style={{ objectFit: 'contain' }} />
          <div className="logo">
            Aima Concerns
            <small>EST. 1999</small>
          </div>
        </div>

        <ul className="menu">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>

        {checked && (
          user ? (
            <div className="usermenu" ref={userMenuRef}>
              <button className="userbtn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <span className="avatar">{(displayName || 'U').charAt(0).toUpperCase()}</span>
                {displayName}
                <span className="caret">▾</span>
              </button>
              {userMenuOpen && (
                <div className="dropdown">
                  <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}>Dashboard</Link>
                  <button className="logout" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div className="authbtns">
              <Link href="/login" className="loginbtn">Login</Link>
              <Link href="/register" className="signupbtn">Sign up</Link>
            </div>
          )
        )}

        <button className="burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          ☰
        </button>
      </div>

      {menuOpen && (
        <div className={`mobilemenu ${montserrat.className}`}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

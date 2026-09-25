import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import AdminLogoutButton from './AdminLogoutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin-login')
  }

  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!staff) {
    redirect('/dashboard')
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/approvals', label: 'Pending Approvals' },
    { href: '/admin/customers', label: 'Customers' },
    { href: '/admin/payments', label: 'Payments' },
    { href: '/admin/visa', label: 'Visa Applications' },
    { href: '/admin/packages', label: 'Packages' },
    { href: '/admin/tickets', label: 'Manage Tickets' },
    { href: '/admin/manifests', label: 'Group Manifests' },
    { href: '/admin/airlines', label: 'Manage Airlines' },
  ]

  return (
    <div className="admin-shell">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }

        .admin-shell {
          min-height: 100vh; display: flex; font-family: 'Segoe UI', system-ui, sans-serif;
          background: #0a0e14;
        }

        .sidebar {
          width: 240px; flex-shrink: 0; display: flex; flex-direction: column;
          background: linear-gradient(180deg, #0d1b2a 0%, #0a0e14 100%);
          border-right: 1px solid rgba(217, 164, 65, 0.15);
          box-shadow: 4px 0 24px rgba(0,0,0,0.4);
        }

        .brand-block { padding: 24px 20px; border-bottom: 1px solid rgba(217, 164, 65, 0.15); }
        .brand-title {
          color: #fff; font-weight: 800; font-size: 16px; letter-spacing: 0.06em;
          display: flex; align-items: center; gap: 8px;
        }
        .pulse-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #d9a441;
          box-shadow: 0 0 8px 2px rgba(217, 164, 65, 0.7);
        }
        .brand-sub { color: #5a7184; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; margin: 6px 0 0; }

        nav.nav-list { flex: 1; padding: 14px 10px; display: flex; flex-direction: column; gap: 4px; }
        .nav-link {
          display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 8px;
          color: #8fa3b3; text-decoration: none; font-size: 13.5px; font-weight: 600;
          border: 1px solid transparent; transition: none;
        }
        .nav-link:hover { background: rgba(217, 164, 65, 0.08); color: #fff; border-color: rgba(217, 164, 65, 0.25); }
        .nav-dot { width: 5px; height: 5px; border-radius: 50%; background: #2f7f7a; flex-shrink: 0; }

        .staff-block { padding: 18px 20px; border-top: 1px solid rgba(217, 164, 65, 0.15); }
        .staff-name { color: #cfe0ea; font-size: 13px; font-weight: 700; margin: 0; }
        .staff-role { color: #5a7184; font-size: 11px; margin: 2px 0 12px; text-transform: uppercase; letter-spacing: 0.08em; }

        .main-area {
          flex: 1; background:
            radial-gradient(circle at 15% 0%, rgba(47, 127, 122, 0.08), transparent 40%),
            radial-gradient(circle at 85% 100%, rgba(217, 164, 65, 0.06), transparent 45%),
            #0f141b;
          min-height: 100vh; color: #e6edf3;
        }
      `}</style>

      <div className="sidebar">
        <div className="brand-block">
          <div className="brand-title">
            <span className="pulse-dot" />
            AIMA CONCERNS
          </div>
          <p className="brand-sub">Control Panel</p>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              <span className="nav-dot" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="staff-block">
          <p className="staff-name">{staff.full_name}</p>
          <p className="staff-role">{staff.role}</p>
          <AdminLogoutButton />
        </div>
      </div>

      <div className="main-area">
        {children}
      </div>
    </div>
  )
}
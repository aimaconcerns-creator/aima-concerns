import Link from 'next/link'
import { officeCss } from '@/app/office/lib'

export default function AccountsHome() {
  const cards = [
    {
      href: '/office/ledgers',
      title: 'Group Ledgers',
      text: 'One ledger for every package: what each booking has paid and what is still pending.',
      color: '#d9a441',
      icon: (
        <>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M3 10h18M7 15h4" />
        </>
      ),
    },
    {
      href: '/office/parties',
      title: 'Party Ledgers',
      text: 'An account for each agent or party who brings you groups: add passengers, record payments and print the statement.',
      color: '#2f7f7a',
      icon: (
        <>
          <circle cx="9" cy="8" r="3.2" />
          <circle cx="17" cy="9.5" r="2.4" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15.5 14.4c3 0 5.5 2.2 5.5 5.1" />
        </>
      ),
    },
  ]

  return (
    <div>
      <style>{officeCss}{`
        .ac-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 22px; margin-top: 26px; }
        .ac-tile {
          display: block; text-decoration: none; background: #fff; border: 1px solid #e3e9f1;
          border-radius: 16px; padding: 28px; box-shadow: 0 4px 18px rgba(18, 51, 95, 0.06);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .ac-tile:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(18, 51, 95, 0.12); }
        .ac-icon { width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .ac-tile h3 { margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #12335f; }
        .ac-tile p { margin: 0; font-size: 13.5px; line-height: 1.65; color: #6b7c93; }
        .ac-go { margin-top: 18px; font-size: 13px; font-weight: 700; color: #2f7f7a; }
      `}</style>

      <div className="pg-h">
        <h1>Accounts &amp; Finance</h1>
        <p>Choose which ledger you want to open.</p>
      </div>

      <div className="ac-grid">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="ac-tile">
            <div className="ac-icon" style={{ background: c.color + '1a' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {c.icon}
              </svg>
            </div>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
            <div className="ac-go">Open →</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

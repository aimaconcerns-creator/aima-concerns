import Link from 'next/link'

export default function AirlinesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex' }}>
      <style>{`
        .airlines-subnav {
          background: #0d141d; border-right: 1px solid rgba(255,255,255,0.08);
        }
        .airlines-subnav .subnav-label {
          color: #5a7184; font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; margin-bottom: 16px;
        }
        .airlines-subnav a {
          display: block; padding: 10px 14px; color: #a9bccb; text-decoration: none;
          font-size: 14px; border-radius: 8px; margin-bottom: 4px; font-weight: 600;
        }
        .airlines-subnav a:hover { background: rgba(217, 164, 65, 0.08); color: #fff; }

        @media print {
          .airlines-subnav { display: none !important; }
        }
      `}</style>

      <div
        className="airlines-subnav no-print"
        style={{
          width: '200px',
          padding: '20px 15px',
          minHeight: '100vh',
          flexShrink: 0,
        }}
      >
        <p className="subnav-label">Airlines</p>
        <Link href="/admin/airlines">Add Airline</Link>
        <Link href="/admin/airlines/seats">Open Seats</Link>
        <Link href="/admin/airlines/manifests">Flight Manifests</Link>
        <Link href="/admin/airlines/ledgers">Airline Ledgers</Link>
      </div>

      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  )
}
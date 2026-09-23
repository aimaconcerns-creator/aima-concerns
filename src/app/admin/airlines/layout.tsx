import Link from 'next/link'

export default function AirlinesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const linkStyle = {
    display: 'block',
    padding: '10px 16px',
    color: '#155263',
    textDecoration: 'none',
    fontSize: '14px',
    borderRadius: '6px',
    marginBottom: '4px',
  }

  return (
    <div style={{ display: 'flex' }}>
      <div
        style={{
          width: '200px',
          backgroundColor: '#fff',
          borderRight: '1px solid #eee',
          padding: '20px 15px',
          minHeight: '100vh',
          flexShrink: 0,
        }}
      >
        <p style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px', textTransform: 'uppercase' }}>
          Airlines
        </p>
        <Link href="/admin/airlines" style={linkStyle}>Add Airline</Link>
        <Link href="/admin/airlines/seats" style={linkStyle}>Open Seats</Link>
        <Link href="/admin/airlines/manifests" style={linkStyle}>Flight Manifests</Link>
        <Link href="/admin/airlines/ledgers" style={linkStyle}>Airline Ledgers</Link>
      </div>

      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  )
}
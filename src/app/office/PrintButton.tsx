'use client'

export default function PrintButton({ label = 'Print' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print"
      style={{ padding: '10px 20px', borderRadius: 9, border: 'none', background: '#12335f', color: '#fff',
        fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}
    >
      {label}
    </button>
  )
}

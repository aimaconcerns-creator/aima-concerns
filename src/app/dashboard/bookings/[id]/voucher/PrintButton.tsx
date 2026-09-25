'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: '12px 26px',
        backgroundColor: '#12335f',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 700,
        fontSize: '14px',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      Print / Save as PDF
    </button>
  )
}
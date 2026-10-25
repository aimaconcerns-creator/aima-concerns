'use client'

export default function FocPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print"
      style={{
        padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(217,164,65,0.5)',
        background: 'transparent', color: '#e0c060', fontWeight: 700, fontSize: 13,
        cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      Print report
    </button>
  )
}

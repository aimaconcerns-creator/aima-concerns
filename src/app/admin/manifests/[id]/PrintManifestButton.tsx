'use client'

export default function PrintManifestButton() {
  return (
    <button onClick={() => window.print()} className="btn-print">
      Print
    </button>
  )
}
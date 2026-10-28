import React from 'react'

export const VISA_STATUSES = ['Submitted', 'Awaiting Payment', 'Processing', 'Approved', 'Rejected', 'Expired']

const COLORS: Record<string, [string, string]> = {
  Submitted: ['#e8f0fb', '#2a5fa8'],
  Accepted: ['#e8f0fb', '#2a5fa8'],
  'Awaiting Payment': ['#fff4de', '#a8761a'],
  Processing: ['#efe9fb', '#6a3fb5'],
  Approved: ['#e6f4ee', '#1f7a55'],
  Rejected: ['#fdecea', '#b3261e'],
  Expired: ['#eef0f3', '#6b7c93'],
}

export function VisaBadge({ status, refunded }: { status: string; refunded?: boolean }) {
  const c = COLORS[status] || ['#eef0f3', '#4b5f7a']
  return (
    <>
      <span className="badge" style={{ background: c[0], color: c[1] }}>{status}</span>
      {refunded ? (
        <span className="badge" style={{ background: '#e6f4ee', color: '#1f7a55', marginLeft: 6 }}>Refunded</span>
      ) : null}
    </>
  )
}

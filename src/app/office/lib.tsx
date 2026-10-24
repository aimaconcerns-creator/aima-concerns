import React from 'react'

export const fmt = (n: any) => 'PKR ' + Number(n || 0).toLocaleString('en-PK')

export const paidOf = (b: any) =>
  b.booking_source === 'online' && b.status === 'Paid'
    ? Number(b.total_amount || 0)
    : Number(b.amount_paid || 0)

export function payLabel(b: any): string {
  if (b.status === 'Cancelled') return 'Cancelled'
  if (b.status === 'Expired') return 'Expired'
  if (b.payment_type === 'FOC') return 'FOC'
  if (b.status === 'Paid') return 'Paid'
  if (b.status === 'Partial') return 'Partial'
  if (b.booking_source === 'offline') return 'Pay Later'
  return 'Unpaid'
}

export const pkt = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' })

const BADGE: Record<string, [string, string]> = {
  Paid: ['#e6f4ee', '#1f7a55'],
  FOC: ['#efe9fb', '#6a3fb5'],
  Partial: ['#fff4de', '#a8761a'],
  'Pay Later': ['#e8f0fb', '#2a5fa8'],
  Unpaid: ['#e8f0fb', '#2a5fa8'],
  Cancelled: ['#fdecea', '#b3261e'],
  Expired: ['#eef0f3', '#6b7c93'],
}

export function Badge({ label }: { label: string }) {
  const c = BADGE[label] || ['#eef0f3', '#4b5f7a']
  return <span className="badge" style={{ background: c[0], color: c[1] }}>{label}</span>
}

export async function customerMap(supabase: any, ids: any[]) {
  const uniq = Array.from(new Set(ids.filter(Boolean)))
  const map = new Map<string, any>()
  if (!uniq.length) return map
  const { data } = await supabase.rpc('get_customer_info', { p_ids: uniq })
  ;(data || []).forEach((c: any) => map.set(c.out_id, c))
  return map
}

export const officeCss = `
.pg-h h1{margin:0;font-size:26px;font-weight:800;color:#12335f}
.pg-h p{margin:6px 0 0;color:#6b7c93;font-size:14px}
.pg-bar{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:22px}
.tabs{display:flex;gap:8px;margin:22px 0 18px}
.tab{padding:11px 22px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700;background:#fff;color:#4b5f7a;border:1px solid #e3e9f1}
.tab.on{background:#12335f;color:#fff;border-color:#12335f}
.card{background:#fff;border:1px solid #e3e9f1;border-radius:16px;padding:22px;margin-bottom:20px;box-shadow:0 3px 14px rgba(18,51,95,.05)}
.card h3{margin:0 0 14px;font-size:16px;font-weight:800;color:#12335f}
.row{display:flex;align-items:center;gap:20px;flex-wrap:wrap;background:#fff;border:1px solid #e3e9f1;border-radius:14px;padding:16px 22px;margin-bottom:12px;box-shadow:0 3px 14px rgba(18,51,95,.05)}
.row .main{flex:1;min-width:220px}
.row h3{margin:0;font-size:16px;color:#12335f}
.row p{margin:4px 0 0;font-size:13px;color:#6b7c93}
.stat{text-align:right;min-width:90px}
.stat b{display:block;font-size:15px;color:#12335f}
.stat span{font-size:12px;color:#6b7c93}
.btn{display:inline-block;padding:10px 20px;border-radius:9px;border:none;background:#2f7f7a;color:#fff;font-weight:700;font-size:13.5px;cursor:pointer;text-decoration:none;font-family:inherit}
.btn.ghost{background:#fff;color:#12335f;border:1px solid #d5dde8}
.btn.red{background:#fff;color:#b3261e;border:1px solid #f0c9c6}
.btn.navy{background:#12335f}
.btn:disabled{opacity:.6;cursor:default}
.tw{overflow-x:auto}
table.t{width:100%;border-collapse:collapse;font-size:13px}
table.t th{text-align:left;padding:10px 12px;background:#f4f7fb;color:#4b5f7a;font-size:11px;letter-spacing:.06em;text-transform:uppercase;border-bottom:1px solid #e3e9f1;white-space:nowrap}
table.t td{padding:10px 12px;border-bottom:1px solid #eef2f7;color:#12335f;vertical-align:top}
table.t tr.tot td{font-weight:800;background:#f4f7fb;border-top:2px solid #12335f}
.num{text-align:right;white-space:nowrap}
.badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;white-space:nowrap}
.empty{background:#fff;border:1px dashed #cdd7e4;border-radius:14px;padding:40px;text-align:center;color:#6b7c93}
.kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px}
.kv small{display:block;font-size:11px;font-weight:700;color:#6b7c93;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
.kv b{font-size:15px;color:#12335f}
.in{width:100%;height:42px;padding:0 12px;border:1px solid #d5dde8;border-radius:9px;font-size:14px;font-family:inherit;color:#12335f;background:#fff}
.lab{display:block;font-size:12px;font-weight:700;color:#4b5f7a;margin-bottom:6px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.note{font-size:12.5px;color:#6b7c93;margin:10px 0 0;line-height:1.5}
.msg{padding:12px 16px;border-radius:10px;font-size:13.5px;font-weight:600;margin-bottom:16px}
.msg.ok{background:#e6f4ee;border:1px solid #cfe8dd;color:#1f7a55}
.msg.bad{background:#fdecea;border:1px solid #f0c9c6;color:#b3261e}
@media(max-width:700px){.g3{grid-template-columns:1fr}}
@media print{.no-print{display:none!important}.card{box-shadow:none}table.t th{background:#eee!important;color:#000}table.t td{color:#000}}
`

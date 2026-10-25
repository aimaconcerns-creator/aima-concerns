'use client'

import { useState, useTransition } from 'react'
import { createStaff, removeStaff, renameStaff, setStaffPassword } from './actions'

type Row = {
  id: string
  full_name: string | null
  role: string
  email: string | null
  lastLogin: string
  isMe: boolean
}

type Msg = { ok: boolean; text: string } | null
type Edit = { id: string; mode: 'name' | 'password'; value: string } | null

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

function makePassword(len = 12) {
  const arr = new Uint32Array(len)
  crypto.getRandomValues(arr)
  return Array.from(arr, (n) => ALPHABET[n % ALPHABET.length]).join('')
}

const css = `
.st-wrap{padding:32px 36px;color:#cfe0ea;max-width:1100px}
.st-h1{margin:0;font-size:26px;font-weight:800;color:#fff}
.st-sub{margin:6px 0 24px;color:#7d93a3;font-size:14px;line-height:1.6}
.st-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:22px;margin-bottom:22px}
.st-card h3{margin:0 0 16px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#d9a441}
.st-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.st-lab{display:block;font-size:11px;font-weight:700;color:#7d93a3;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
.st-in{width:100%;height:42px;padding:0 12px;background:#0a0e14;border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#e6edf3;font-size:14px;font-family:inherit}
.st-in:focus{outline:none;border-color:#d9a441}
.st-row{display:flex;gap:8px}
.st-btn{padding:0 18px;height:42px;border:none;border-radius:8px;background:#d9a441;color:#0a0e14;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;white-space:nowrap}
.st-btn.ghost{background:transparent;color:#cfe0ea;border:1px solid rgba(255,255,255,0.18)}
.st-btn:disabled{opacity:.5;cursor:default}
.st-msg{padding:12px 16px;border-radius:10px;font-size:13.5px;font-weight:600;margin-bottom:18px;line-height:1.5;word-break:break-word}
.st-msg.ok{background:rgba(95,224,160,0.1);border:1px solid rgba(95,224,160,0.3);color:#5FE0A0}
.st-msg.bad{background:rgba(255,143,138,0.1);border:1px solid rgba(255,143,138,0.3);color:#ff8f8a}
.st-hand{background:rgba(217,164,65,0.08);border:1px solid rgba(217,164,65,0.35);border-radius:12px;padding:18px;margin-bottom:22px;font-size:14px;line-height:1.9}
.st-hand b{color:#fff}
.st-hand .mono{font-family:ui-monospace,Menlo,monospace;color:#e0c060;font-size:15px}
.st-tw{overflow-x:auto}
table.st-t{width:100%;border-collapse:collapse;font-size:13.5px}
table.st-t th{text-align:left;padding:10px 12px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#7d93a3;border-bottom:1px solid rgba(255,255,255,0.08);white-space:nowrap}
table.st-t td{padding:12px;border-bottom:1px solid rgba(255,255,255,0.05);vertical-align:middle}
.st-pill{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700}
.st-pill.sa{background:rgba(217,164,65,0.15);color:#e0c060}
.st-pill.of{background:rgba(95,224,160,0.12);color:#5FE0A0}
.st-muted{color:#7d93a3}
.st-acts{display:flex;gap:14px;flex-wrap:wrap}
.st-link{background:none;border:none;padding:0;color:#e0c060;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}
.st-link.red{color:#ff8f8a}
.st-link:disabled{opacity:.5}
.st-edit{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.st-edit .st-in{width:220px;height:36px}
.st-edit .st-btn{height:36px;padding:0 14px}
.st-note{font-size:12.5px;color:#7d93a3;margin:12px 0 0;line-height:1.6}
@media(max-width:800px){.st-grid{grid-template-columns:1fr}.st-wrap{padding:20px 16px}}
`

export default function StaffManager({ rows, keyReady }: { rows: Row[]; keyReady: boolean }) {
  const [pending, startTransition] = useTransition()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null)
  const [edit, setEdit] = useState<Edit>(null)

  const create = () => {
    setMsg(null)
    setCreated(null)
    const snapshot = { name: fullName.trim(), email: email.trim().toLowerCase(), password }
    startTransition(async () => {
      const r = await createStaff({ fullName, email, password })
      if (r.ok) {
        setCreated(snapshot)
        setFullName('')
        setEmail('')
        setPassword('')
        setMsg({ ok: true, text: r.message })
      } else {
        setMsg({ ok: false, text: r.message })
      }
    })
  }

  const saveEdit = () => {
    if (!edit) return
    const e = edit
    setMsg(null)
    setCreated(null)
    startTransition(async () => {
      const r = e.mode === 'name' ? await renameStaff(e.id, e.value) : await setStaffPassword(e.id, e.value)
      if (r.ok) {
        setMsg({ ok: true, text: e.mode === 'password' ? `${r.message} New password: ${e.value}` : r.message })
        setEdit(null)
      } else {
        setMsg({ ok: false, text: r.message })
      }
    })
  }

  const remove = (r: Row) => {
    if (!window.confirm(`Remove ${r.full_name || 'this person'}? They will no longer be able to log in to the work portal.`)) return
    setMsg(null)
    setCreated(null)
    startTransition(async () => {
      const res = await removeStaff(r.id)
      setMsg({ ok: res.ok, text: res.message })
    })
  }

  return (
    <div className="st-wrap">
      <style>{css}</style>

      <h1 className="st-h1">Manage Staff</h1>
      <p className="st-sub">
        Create logins for your office team. They sign in at <b>aimaconcerns.com/admin-login</b> and see only
        Offline Booking, Manifests and Group Ledgers.
      </p>

      {msg && <div className={'st-msg ' + (msg.ok ? 'ok' : 'bad')}>{msg.text}</div>}

      {created && (
        <div className="st-hand">
          <b>Give these details to {created.name}:</b>
          <br />
          Login page: <span className="mono">aimaconcerns.com/admin-login</span>
          <br />
          Email: <span className="mono">{created.email}</span>
          <br />
          Password: <span className="mono">{created.password}</span>
          <div className="st-note">This password is shown only now. Send it privately, or write it down.</div>
        </div>
      )}

      {!keyReady ? (
        <div className="st-card">
          <h3>Secret key not found</h3>
          <p className="st-note" style={{ marginTop: 0 }}>
            Creating logins needs the Supabase secret key. Add it in Vercel as <b>SUPABASE_SERVICE_ROLE_KEY</b>
            (Settings, then Environment Variables), then redeploy: Deployments, the three dots on the top
            one, then Redeploy. For localhost, add the same line to <b>.env.local</b> and restart npm run dev.
          </p>
        </div>
      ) : (
        <div className="st-card">
          <h3>Create an Office login</h3>
          <div className="st-grid">
            <div>
              <label className="st-lab">Full name</label>
              <input className="st-in" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Ahmed Khan" />
            </div>
            <div>
              <label className="st-lab">Email</label>
              <input className="st-in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" />
            </div>
            <div>
              <label className="st-lab">Password (8+ characters)</label>
              <div className="st-row">
                <input className="st-in" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="st-btn ghost" onClick={() => setShowPw(!showPw)}>{showPw ? 'Hide' : 'Show'}</button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button type="button" className="st-btn ghost" onClick={() => { setPassword(makePassword()); setShowPw(true) }}>
              Generate a strong password
            </button>
            <button type="button" className="st-btn" disabled={pending} onClick={create}>
              {pending ? 'Working...' : 'Create login'}
            </button>
          </div>
        </div>
      )}

      <div className="st-card">
        <h3>Staff logins</h3>
        <div className="st-tw">
          <table className="st-t">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Last login (PKT)</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ color: '#fff', fontWeight: 700 }}>{r.full_name || '—'}{r.isMe ? ' (you)' : ''}</td>
                  <td>{r.email || <span className="st-muted">—</span>}</td>
                  <td><span className={'st-pill ' + (r.role === 'Super Admin' ? 'sa' : 'of')}>{r.role}</span></td>
                  <td className="st-muted">{r.lastLogin}</td>
                  <td>
                    {r.role !== 'Office' ? (
                      <span className="st-muted">—</span>
                    ) : edit && edit.id === r.id ? (
                      <div className="st-edit">
                        <input
                          className="st-in"
                          value={edit.value}
                          placeholder={edit.mode === 'name' ? 'Full name' : 'New password (8+)'}
                          onChange={(e) => setEdit({ ...edit, value: e.target.value })}
                        />
                        {edit.mode === 'password' && (
                          <button type="button" className="st-btn ghost" onClick={() => setEdit({ ...edit, value: makePassword() })}>Generate</button>
                        )}
                        <button type="button" className="st-btn" disabled={pending} onClick={saveEdit}>Save</button>
                        <button type="button" className="st-btn ghost" onClick={() => setEdit(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="st-acts">
                        <button type="button" className="st-link" disabled={pending}
                          onClick={() => setEdit({ id: r.id, mode: 'name', value: r.full_name || '' })}>Rename</button>
                        <button type="button" className="st-link" disabled={pending}
                          onClick={() => setEdit({ id: r.id, mode: 'password', value: '' })}>New password</button>
                        <button type="button" className="st-link red" disabled={pending}
                          onClick={() => remove(r)}>Remove</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="st-note">
          Removing a person deletes their login straight away. Their past bookings and the activity log keep their name.
        </p>
      </div>
    </div>
  )
}

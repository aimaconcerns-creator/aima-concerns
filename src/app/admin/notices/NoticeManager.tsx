'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type Notice = {
  id: string
  title: string
  message: string
  important: boolean
  expires_on: string | null
  created_by_name: string | null
  created_at: string
}

const posted = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', year: 'numeric',
  })

const until = (d: string) =>
  new Date(String(d).slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', {
    timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric',
  })

const css = `
.nb-wrap{padding:32px 36px;color:#cfe0ea;max-width:1000px}
.nb-h1{margin:0;font-size:26px;font-weight:800;color:#fff}
.nb-sub{margin:6px 0 24px;color:#7d93a3;font-size:14px;line-height:1.6}
.nb-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:22px;margin-bottom:22px}
.nb-card h3{margin:0 0 16px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#d9a441}
.nb-lab{display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#7d93a3;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
.nb-lab span{font-weight:600;letter-spacing:0;text-transform:none}
.nb-in{width:100%;padding:0 12px;height:42px;background:#0a0e14;border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#e6edf3;font-size:14px;font-family:inherit}
textarea.nb-in{height:120px;padding:10px 12px;resize:vertical;line-height:1.55}
.nb-in:focus{outline:none;border-color:#d9a441}
.nb-field{margin-bottom:14px}
.nb-row{display:flex;gap:22px;flex-wrap:wrap;align-items:flex-end}
.nb-check{display:flex;align-items:center;gap:8px;font-size:14px;color:#e6edf3;cursor:pointer;height:42px}
.nb-check input{width:18px;height:18px;accent-color:#d9a441}
.nb-btn{padding:0 20px;height:42px;border:none;border-radius:8px;background:#d9a441;color:#0a0e14;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;white-space:nowrap}
.nb-btn.ghost{background:transparent;color:#cfe0ea;border:1px solid rgba(255,255,255,0.18)}
.nb-btn:disabled{opacity:.5;cursor:default}
.nb-msg{padding:12px 16px;border-radius:10px;font-size:13.5px;font-weight:600;margin-bottom:18px;line-height:1.5}
.nb-msg.ok{background:rgba(95,224,160,0.1);border:1px solid rgba(95,224,160,0.3);color:#5FE0A0}
.nb-msg.bad{background:rgba(255,143,138,0.1);border:1px solid rgba(255,143,138,0.3);color:#ff8f8a}
.nb-note{font-size:12.5px;color:#7d93a3;margin:10px 0 0;line-height:1.6}
.nb-item{border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px 18px;margin-bottom:12px;background:rgba(255,255,255,0.015)}
.nb-item.imp{border-color:rgba(217,164,65,0.45)}
.nb-item.off{opacity:.6}
.nb-top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start}
.nb-title{font-size:16px;font-weight:800;color:#fff}
.nb-pill{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;margin-left:8px;vertical-align:middle}
.nb-pill.imp{background:rgba(217,164,65,0.18);color:#e0c060}
.nb-pill.on{background:rgba(95,224,160,0.12);color:#5FE0A0}
.nb-pill.off{background:rgba(255,143,138,0.12);color:#ff8f8a}
.nb-body{margin-top:8px;font-size:13.5px;line-height:1.6;color:#cfe0ea;white-space:pre-wrap;overflow-wrap:anywhere}
.nb-meta{margin-top:10px;font-size:12px;color:#7d93a3}
.nb-link{background:none;border:none;padding:0;margin-left:14px;color:#e0c060;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}
.nb-link.red{color:#ff8f8a}
.nb-link:disabled{opacity:.5}
.nb-empty{padding:24px;text-align:center;color:#7d93a3}
@media(max-width:800px){.nb-wrap{padding:20px 16px}}
`

export default function NoticeManager({
  notices,
  today,
  userId,
  userName,
}: {
  notices: Notice[]
  today: string
  userId: string
  userName: string
}) {
  const router = useRouter()
  const supabase = createClient()

  const [editId, setEditId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [important, setImportant] = useState(false)
  const [expiresOn, setExpiresOn] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const isActive = (n: Notice) => !n.expires_on || n.expires_on >= today

  const sorted = [...notices].sort((a, b) => {
    const aa = isActive(a) ? 0 : 1
    const bb = isActive(b) ? 0 : 1
    if (aa !== bb) return aa - bb
    if (aa === 0 && a.important !== b.important) return a.important ? -1 : 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const reset = () => {
    setEditId(null)
    setTitle('')
    setMessage('')
    setImportant(false)
    setExpiresOn('')
  }

  const startEdit = (n: Notice) => {
    setEditId(n.id)
    setTitle(n.title)
    setMessage(n.message)
    setImportant(n.important)
    setExpiresOn(n.expires_on ? String(n.expires_on).slice(0, 10) : '')
    setMsg(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async () => {
    setMsg(null)
    const t = title.trim()
    const m = message.trim()
    if (!t) { setMsg({ ok: false, text: 'Type a title.' }); return }
    if (!m) { setMsg({ ok: false, text: 'Type the message.' }); return }
    if (t.length > 120) { setMsg({ ok: false, text: 'The title can be up to 120 characters.' }); return }
    if (m.length > 1000) { setMsg({ ok: false, text: 'The message can be up to 1,000 characters.' }); return }

    setBusy(true)
    const row = { title: t, message: m, important, expires_on: expiresOn || null }
    const { error } = editId
      ? await supabase.from('notices').update({ ...row, updated_at: new Date().toISOString() }).eq('id', editId)
      : await supabase.from('notices').insert({ ...row, created_by: userId, created_by_name: userName || null })
    setBusy(false)

    if (error) {
      setMsg({ ok: false, text: error.message })
      return
    }
    const wasEdit = !!editId
    reset()
    setMsg({ ok: true, text: wasEdit ? 'Notice updated.' : 'Notice posted. Your staff will see it on their home page.' })
    router.refresh()
  }

  const remove = async (n: Notice) => {
    if (!window.confirm(`Delete the notice "${n.title}"? This cannot be undone.`)) return
    setBusy(true)
    setMsg(null)
    const { error } = await supabase.from('notices').delete().eq('id', n.id)
    setBusy(false)
    if (error) {
      setMsg({ ok: false, text: error.message })
      return
    }
    if (editId === n.id) reset()
    setMsg({ ok: true, text: 'Notice deleted.' })
    router.refresh()
  }

  return (
    <div className="nb-wrap">
      <style>{css}</style>

      <h1 className="nb-h1">Notice Board</h1>
      <p className="nb-sub">
        Write a message for your office staff. Active notices show at the top of their home page, with
        Important ones first. Customers never see them.
      </p>

      {msg && <div className={'nb-msg ' + (msg.ok ? 'ok' : 'bad')}>{msg.text}</div>}

      <div className="nb-card">
        <h3>{editId ? 'Edit notice' : 'New notice'}</h3>

        <div className="nb-field">
          <div className="nb-lab">Title <span>{title.length}/120</span></div>
          <input className="nb-in" maxLength={120} value={title} placeholder="e.g. Office closed on Friday"
            onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="nb-field">
          <div className="nb-lab">Message <span>{message.length}/1000</span></div>
          <textarea className="nb-in" maxLength={1000} value={message}
            placeholder="Write the notice here. Line breaks are kept."
            onChange={(e) => setMessage(e.target.value)} />
        </div>

        <div className="nb-row">
          <label className="nb-check">
            <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
            Important (shown first, with a gold highlight)
          </label>
          <div>
            <div className="nb-lab">Expiry date (optional)</div>
            <input type="date" className="nb-in" style={{ width: 190 }} value={expiresOn}
              onChange={(e) => setExpiresOn(e.target.value)} />
          </div>
          <button type="button" className="nb-btn" disabled={busy} onClick={save}>
            {busy ? 'Saving...' : editId ? 'Save changes' : 'Post notice'}
          </button>
          {editId && (
            <button type="button" className="nb-btn ghost" disabled={busy} onClick={() => { reset(); setMsg(null) }}>
              Cancel
            </button>
          )}
        </div>

        {expiresOn && expiresOn < today && (
          <p className="nb-note" style={{ color: '#e0c060' }}>
            That date has already passed, so this notice will not show on the board.
          </p>
        )}
        <p className="nb-note">
          A notice with an expiry date stays up through that whole day and leaves the board at midnight, Pakistan time.
          Leave the date empty to keep it up until you delete it.
        </p>
      </div>

      <div className="nb-card">
        <h3>All notices ({notices.length})</h3>

        {sorted.length === 0 && <div className="nb-empty">No notices yet. Post the first one above.</div>}

        {sorted.map((n) => {
          const active = isActive(n)
          return (
            <div key={n.id} className={'nb-item' + (n.important ? ' imp' : '') + (active ? '' : ' off')}>
              <div className="nb-top">
                <div className="nb-title">
                  {n.title}
                  {n.important && <span className="nb-pill imp">Important</span>}
                  <span className={'nb-pill ' + (active ? 'on' : 'off')}>{active ? 'Showing' : 'Expired'}</span>
                </div>
                <div>
                  <button type="button" className="nb-link" disabled={busy} onClick={() => startEdit(n)}>Edit</button>
                  <button type="button" className="nb-link red" disabled={busy} onClick={() => remove(n)}>Delete</button>
                </div>
              </div>
              <div className="nb-body">{n.message}</div>
              <div className="nb-meta">
                Posted {posted(n.created_at)}{n.created_by_name ? ` by ${n.created_by_name}` : ''}
                {n.expires_on ? ` · Until ${until(n.expires_on)}` : ' · No expiry date'}
              </div>
            </div>
          )
        })}
        <p className="nb-note">To bring an expired notice back, click Edit and change or clear its expiry date.</p>
      </div>
    </div>
  )
}

import { createClient } from '@/utils/supabase/server'

const posted = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', year: 'numeric',
  })

const until = (d: string) =>
  new Date(String(d).slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', {
    timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric',
  })

const css = `
.nb-card{background:#fff;border:1px solid #e3e9f1;border-radius:16px;padding:22px 24px;margin-top:28px;box-shadow:0 4px 18px rgba(18,51,95,.06)}
.nb-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px;gap:10px}
.nb-head h3{margin:0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6b7c93;font-weight:800}
.nb-head span{font-size:12.5px;color:#6b7c93;font-weight:600}
.nb-item{border-left:4px solid #e3e9f1;padding:4px 0 4px 16px;margin-bottom:16px}
.nb-item:last-child{margin-bottom:0}
.nb-item.imp{border-left-color:#d9a441;background:#fffaf0;border-radius:0 10px 10px 0;padding:12px 16px}
.nb-title{font-size:16px;font-weight:800;color:#12335f;line-height:1.4}
.nb-tag{display:inline-block;background:#d9a441;color:#fff;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:99px;margin-right:10px;vertical-align:middle}
.nb-msg{margin-top:6px;font-size:14px;line-height:1.65;color:#4b5f7a;white-space:pre-wrap;overflow-wrap:anywhere}
.nb-meta{margin-top:8px;font-size:12px;color:#6b7c93}
`

export default async function NoticeBoard() {
  const supabase = await createClient()
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })

  const { data } = await supabase
    .from('notices')
    .select('id, title, message, important, expires_on, created_at')
    .or(`expires_on.is.null,expires_on.gte.${today}`)
    .order('important', { ascending: false })
    .order('created_at', { ascending: false })

  const notices: any[] = data || []
  if (!notices.length) return null

  return (
    <div className="nb-card">
      <style>{css}</style>
      <div className="nb-head">
        <h3>Notice Board</h3>
        <span>{notices.length} {notices.length === 1 ? 'notice' : 'notices'}</span>
      </div>
      {notices.map((n) => (
        <div key={n.id} className={'nb-item' + (n.important ? ' imp' : '')}>
          <div className="nb-title">
            {n.important ? <span className="nb-tag">Important</span> : null}
            {n.title}
          </div>
          <div className="nb-msg">{n.message}</div>
          <div className="nb-meta">
            Posted {posted(n.created_at)}
            {n.expires_on ? ` · Until ${until(n.expires_on)}` : ''}
          </div>
        </div>
      ))}
    </div>
  )
}
